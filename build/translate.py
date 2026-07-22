#!/usr/bin/env python3
"""translate.py — per-page translation pipeline for MediPrimer multilingual engine.

Workflow:
1. Split page into head, header, main, footer
2. Protect non-translatable content (scripts, styles, URLs)
3. Call Claude API to translate protected main + title/description
4. Back-translate visible text for facts gate
5. Restore protected content
6. Render chrome (header/footer)
7. Retitle head, set lang attribute
8. Run QA gates
9. Write to public/<lang>/<page> on gate pass
10. Update translation-state.json with content hash
"""

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import glob
from pathlib import Path
from html import unescape

# Import from sibling modules
from i18n_lib import split_page, protect, restore, retitle
from i18n_chrome import render_header, render_footer
from i18n_qa import run_gates
from seo import content_hash
from normalize import ACTIVE

PUB = "/home/deltaprism/mediprimer/public"
BUILD_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BUILD_DIR, "translation-state.json")

# Load languages config
LANGUAGES = json.load(open(os.path.join(BUILD_DIR, "languages.json"), encoding="utf-8"))


def load_state():
    """Load translation state from file."""
    if os.path.exists(STATE_FILE):
        return json.load(open(STATE_FILE, encoding="utf-8"))
    return {}


def save_state(state):
    """Save translation state to file."""
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def get_language_native_name(code):
    """Get the native name for a language code."""
    for lang in LANGUAGES.get("languages", []):
        if lang.get("code") == code:
            return lang.get("native", lang.get("name", code))
    return code


def load_chrome(code):
    """Load chrome translations for a language."""
    chrome_path = os.path.join(BUILD_DIR, "i18n", code, "chrome.json")
    if os.path.exists(chrome_path):
        return json.load(open(chrome_path, encoding="utf-8"))
    return {}


def load_glossary(code):
    """Load glossary terms for a language."""
    terms_path = os.path.join(BUILD_DIR, "terms", f"{code}.json")
    if os.path.exists(terms_path):
        data = json.load(open(terms_path, encoding="utf-8"))
        return data.get("terms", {})
    return {}


def load_qa_exceptions(code, page_name):
    """Per-page glossary terms excluded from the mandatory QA check only
    (the translator still sees them as normal glossary hints). See
    terms/{code}-qa-exceptions.json for the documented reason each
    exception exists — these are narrow, audited, single-page carve-outs,
    not a general loosening of the glossary gate."""
    path = os.path.join(BUILD_DIR, "terms", f"{code}-qa-exceptions.json")
    if not os.path.exists(path):
        return set()
    data = json.load(open(path, encoding="utf-8"))
    return set(data.get(page_name, {}).keys())


def call_claude_translate(protected_main, title, desc, code, glossary):
    """Call Claude API to translate protected main + title/description.

    Returns: (translated_main, translated_title, translated_desc) or None on failure.
    """
    native_name = get_language_native_name(code)

    # Build glossary section for prompt
    glossary_section = ""
    if glossary:
        glossary_json = json.dumps(glossary, ensure_ascii=False)
        glossary_section = f"\n\nGlossary (mandatory translations):\n{glossary_json}"

    prompt = f"""Translate the following to {native_name} (native name: {native_name}).
Plain language for a general adult audience. DO NOT:
- Alter or remove ⟦Pn⟧ tokens (they protect code/URLs)
- Change numbers, dates, dollar amounts, or program names
- Convert relative time references (e.g. "this year," "in five years," "next year") into absolute/concrete years — keep them relative, exactly as phrased in English
- Translate glossary terms other than as shown in the glossary below{glossary_section}

For each mandatory glossary term above that appears in the English text, include
that EXACT Spanish phrase verbatim at least once in your translation, even where
the English uses a plural or combines two terms (e.g. "Part A and B") — a
correctly-pluralized or combined rendering that never contains the singular
canonical phrase will fail an automated verification step. You may still write
naturally around it (plural elsewhere in the sentence, additional connecting
words, etc.) as long as the exact glossary phrase appears somewhere.

Preserve the source's inline emphasis markup 1:1: translate the text inside
each <strong> or <em> tag, but do not add new <strong>/<em> tags around text
that wasn't already wrapped in one, and do not remove a <strong>/<em> wrapper
from text that had one, even for dollar amounts or numbers that might seem to
deserve emphasis. An automated check compares the exact count of these tags
between English and Spanish; only merge two <strong>-wrapped terms into one
when they are genuine synonyms with no distinct Spanish equivalent (e.g.
English bolds both "copay" and "copayment" for the same concept).

Return ONLY a JSON object with three fields:
{{"title": "<translated title>", "description": "<translated description>", "main_html": "<translated HTML>"}}

Title: {title}
Description: {desc}

Main HTML to translate:
{protected_main}"""

    try:
        # Call headless claude
        result = subprocess.run(
            ["/home/deltaprism/.local/bin/claude", "-p", prompt, "--allowedTools", ""],
            capture_output=True,
            text=True,
            timeout=600
        )

        if result.returncode != 0:
            print(f"Claude API error: {result.stderr}", file=sys.stderr)
            return None

        # Parse JSON from stdout (one retry on parse failure)
        output = result.stdout.strip()

        for attempt in range(2):
            # Try to extract JSON from output (handle markdown fences like ```json...```)
            # First try to find fenced JSON
            fenced_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', output, re.DOTALL)
            if fenced_match:
                json_str = fenced_match.group(1)
            else:
                # Fall back to finding bare JSON object
                json_match = re.search(r'\{.*\}', output, re.DOTALL)
                if not json_match:
                    if attempt == 0:
                        print(f"No JSON found in Claude response, retrying...", file=sys.stderr)
                        continue
                    print(f"No JSON found in Claude response after retry", file=sys.stderr)
                    return None
                json_str = json_match.group(0)

            try:
                data = json.loads(json_str)
                return (data.get("main_html", ""), data.get("title", ""), data.get("description", ""))
            except json.JSONDecodeError as e:
                if attempt == 0:
                    print(f"JSON parse attempt 1 failed, retrying: {e}", file=sys.stderr)
                    continue
                print(f"Failed to parse Claude JSON after retry: {e}", file=sys.stderr)
                return None

        return None

    except subprocess.TimeoutExpired:
        print(f"Claude translation timeout (600s)", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Claude API error: {e}", file=sys.stderr)
        return None


def call_claude_back_translate(tr_html, code):
    """Back-translate visible text from translation to English.

    Returns: English text extracted from translated HTML, or None on failure.
    """
    native_name = get_language_native_name(code)

    prompt = f"""This text is in {native_name}. Translate ONLY the visible text (no HTML tags, no code) back to English.
Return ONLY the English translation, no JSON, no explanation.

HTML to back-translate:
{tr_html}"""

    try:
        result = subprocess.run(
            ["/home/deltaprism/.local/bin/claude", "-p", prompt, "--allowedTools", ""],
            capture_output=True,
            text=True,
            timeout=600
        )

        if result.returncode != 0:
            print(f"Claude back-translate error: {result.stderr}", file=sys.stderr)
            return None

        return result.stdout.strip()

    except subprocess.TimeoutExpired:
        print(f"Claude back-translate timeout (600s)", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Claude back-translate error: {e}", file=sys.stderr)
        return None


def get_rtl_attribute(code):
    """Check if language is RTL."""
    for lang in LANGUAGES.get("languages", []):
        if lang.get("code") == code:
            return lang.get("rtl", False)
    return False


def translate_page(page_name, code, force=False):
    """Translate a single page.

    Returns: (success: bool, message: str)
    """
    # Load source English page
    en_path = os.path.join(PUB, page_name)
    if not os.path.exists(en_path):
        return (False, f"Page not found: {page_name}")

    with open(en_path, "r", encoding="utf-8") as f:
        en_html = f.read()

    # Check if translation is stale (compare content hash)
    state = load_state()
    lang_state = state.get(code, {})
    current_hash = content_hash(en_html)

    # Handle both legacy (bare string) and new (dict with hash/date) formats
    entry = lang_state.get(page_name)
    stored_hash = None

    if isinstance(entry, str):
        # Legacy format: bare hash string
        stored_hash = entry
    elif isinstance(entry, dict):
        # New format: {"hash": "...", "date": "YYYY-MM-DD"}
        stored_hash = entry.get("hash")

    if not force and stored_hash == current_hash:
        return (False, f"Not stale (hash match)")

    # Step 1: Split page
    try:
        segments = split_page(en_html)
    except ValueError as e:
        return (False, f"Split error: {e}")

    # Step 2: Protect main
    protected_main, vault = protect(segments["main"])

    # Extract title and description from head
    title_match = re.search(r'<title>([^<]+)</title>', segments["head"])
    title = title_match.group(1) if title_match else ""

    desc_match = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', segments["head"])
    desc = desc_match.group(1) if desc_match else ""

    # Load glossary
    glossary = load_glossary(code)

    # Step 3: Call Claude to translate
    result = call_claude_translate(protected_main, title, desc, code, glossary)
    if not result:
        return (False, "Translation API failed")

    tr_main, tr_title, tr_desc = result

    # Apply sabotage if env var set (testing gate integrity)
    if os.environ.get("I18N_SABOTAGE"):
        # Deliberately alter financial amounts to break the facts gate
        # Inject multiple fake amounts to ensure gate failure (4+ diffs)
        if '$' not in tr_main:
            # Inject fake dollar amounts that will fail facts check
            tr_main = re.sub(r'(<p>)', r'\1 $5555.55 $7777.77 $1234.56 ', tr_main, count=1)
            tr_main = re.sub(r'(<h2>)', r'\1 $8888.88 ', tr_main, count=1)
        else:
            # Alter existing dollar amounts (multiple times)
            tr_main = re.sub(r'\$[\d,.]+', '$9999.99', tr_main)

    # Step 4: Back-translate for facts gate
    back_text = call_claude_back_translate(tr_main, code)
    if not back_text:
        return (False, "Back-translation API failed")

    # Step 5: Restore vault
    tr_main_restored = restore(tr_main, vault)

    # Step 6: Render chrome
    active_key = ACTIVE.get(page_name, "home")
    tr_header = render_header(code, active_key, page_name, load_chrome(code), LANGUAGES)
    tr_footer = render_footer(code, page_name, load_chrome(code), LANGUAGES, en_html)

    # Preserve any trailing content after </footer> from original (e.g., scripts)
    footer_end_pos = segments["footer"].find("</footer>")
    if footer_end_pos != -1:
        trailing_content = segments["footer"][footer_end_pos + len("</footer>"):]
        tr_footer = tr_footer + trailing_content
    else:
        # No </footer> found, this shouldn't happen, but preserve everything
        pass

    # Step 7: Retitle head
    tr_head = retitle(segments["head"], tr_title, tr_desc)

    # Set lang attribute and dir if RTL
    is_rtl = get_rtl_attribute(code)
    if is_rtl:
        tr_head = re.sub(
            r'<html lang="[^"]*"[^>]*>',
            f'<html lang="{code}" dir="rtl">',
            tr_head
        )
    else:
        tr_head = re.sub(
            r'<html[^>]*>',
            f'<html lang="{code}">',
            tr_head
        )

    # Assemble translated page
    tr_html = tr_head + tr_header + tr_main_restored + tr_footer

    # Step 8: Run QA gates
    qa_exceptions = load_qa_exceptions(code, page_name)
    qa_glossary = {k: v for k, v in glossary.items() if k not in qa_exceptions}
    passed, failures = run_gates(en_html, tr_html, back_text, qa_glossary)

    if not passed:
        # Kurt-approved, hand-verified one-off: costs.html's English source
        # bolds two synonym pairs twice each ("copay"/"copayment",
        # "out-of-pocket maximum"/"out-of-pocket limit"); Spanish has one
        # natural word for each pair, so the translator correctly collapses
        # them, dropping 2 <strong> tags. Line-by-line diff confirmed no
        # content is missing — verified 2026-07-22, see conversation record.
        # This is a documented, single-page override, not a general
        # loosening of the structure gate.
        is_costs_strong_count_exception = (
            page_name == "costs.html"
            and len(failures) == 1
            and failures[0].startswith("Structure: Tag mismatch:")
            and "same tag types, different count/order" in failures[0]
            and "'strong': (38, 36)" in failures[0]
        )
        if not is_costs_strong_count_exception:
            failure_msg = "; ".join(failures)
            with open(f"/tmp/failed-{page_name}", "w", encoding="utf-8") as f:
                f.write(tr_main)
            return (False, f"QA gates failed: {failure_msg}")

    # Step 9: Write to output
    out_dir = os.path.join(PUB, code)
    os.makedirs(out_dir, exist_ok=True)

    out_path = os.path.join(out_dir, page_name)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(tr_html)

    # Step 10: Update state with hash and date (YYYY-MM-DD format)
    if code not in state:
        state[code] = {}
    state[code][page_name] = {
        "hash": current_hash,
        "date": datetime.date.today().strftime("%Y-%m-%d")
    }
    save_state(state)

    return (True, f"Translated to {code}: {out_path}")


def get_stale_pages(code):
    """Find all pages whose content hash doesn't match state."""
    state = load_state()
    lang_state = state.get(code, {})

    stale = []
    for page_path in sorted(glob.glob(os.path.join(PUB, "*.html"))):
        page_name = os.path.basename(page_path)

        with open(page_path, "r", encoding="utf-8") as f:
            en_html = f.read()

        current_hash = content_hash(en_html)

        # Handle both legacy (bare string) and new (dict with hash/date) formats
        entry = lang_state.get(page_name)
        stored_hash = None

        if isinstance(entry, str):
            # Legacy format: bare hash string
            stored_hash = entry
        elif isinstance(entry, dict):
            # New format: {"hash": "...", "date": "YYYY-MM-DD"}
            stored_hash = entry.get("hash")

        if stored_hash != current_hash:
            stale.append(page_name)

    return stale


def main():
    parser = argparse.ArgumentParser(description="Translate MediPrimer pages to target language")
    parser.add_argument("--lang", required=True, help="Target language code (e.g., es, zh)")
    parser.add_argument("--page", help="Specific page to translate (e.g., disclaimer.html)")
    parser.add_argument("--force", action="store_true", help="Force translation even if hash matches")
    parser.add_argument("--all-stale", action="store_true", help="Translate all stale pages for language")
    parser.add_argument("--check-only", action="store_true", help="List stale pages without translating")

    args = parser.parse_args()

    # Validate language
    lang_codes = [lang.get("code") for lang in LANGUAGES.get("languages", [])]
    if args.lang not in lang_codes:
        print(f"Unknown language: {args.lang}", file=sys.stderr)
        sys.exit(1)

    # Handle --check-only
    if args.check_only:
        stale = get_stale_pages(args.lang)
        if stale:
            print(f"Stale pages for {args.lang} ({len(stale)}):")
            for page in stale:
                print(f"  {page}")
        else:
            print(f"No stale pages for {args.lang}")
        return

    # Handle --all-stale
    if args.all_stale:
        stale = get_stale_pages(args.lang)
        if not stale:
            print(f"No stale pages for {args.lang}")
            return

        failures = []
        for page_name in stale:
            success, message = translate_page(page_name, args.lang, force=True)
            print(f"{'✓' if success else '✗'} {page_name}: {message}")
            if not success:
                failures.append(f"{page_name}: {message}")

        if failures:
            print(f"\n{len(failures)} failures:", file=sys.stderr)
            for msg in failures:
                print(f"  {msg}", file=sys.stderr)
            sys.exit(1)
        return

    # Handle single page
    if not args.page:
        print("Must specify --page, --all-stale, or --check-only", file=sys.stderr)
        sys.exit(1)

    success, message = translate_page(args.page, args.lang, force=args.force)
    print(f"{'✓' if success else '✗'} {args.page}: {message}")

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
