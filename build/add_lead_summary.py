#!/usr/bin/env python3
"""Give every member-facing page a short-answer lead paragraph.

Why: AI search engines (ChatGPT, Perplexity, Gemini, Google AI Overviews) now
handle a large share of informational queries, and what they lift as a citation
is a specific, self-contained statement near the top of the page. 85 of 130
pages already open with a `<p class="lead">` short answer; the other 45 —
including costs, dual-eligible, enrollment, choosing-coverage and getting-help —
go straight into detail with nothing quotable. The same paragraph helps a human
who wants the answer without reading 1,300 words.

Safety, because this is YMYL content: the model is given ONLY the page's own
text and is forbidden from introducing any number, dollar amount, date or
program name that is not already in it. A generated lead containing a numeric
token absent from the source page is rejected, so a summary can never invent a
figure. Everything still passes `make check` (readability gate included) and
build/factdiff.py afterwards.

  add_lead_summary.py            # every page lacking a lead
  add_lead_summary.py costs.html # one page
  add_lead_summary.py --dry-run
"""
import pathlib
import re
import subprocess
import sys

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
CLAUDE = "/home/deltaprism/.local/bin/claude"
NUM = re.compile(r"\$[\d,]+(?:\.\d+)?|\b\d[\d,]*(?:\.\d+)?%|\b\d[\d,]*\b")

SKIP = {"about.html", "accessibility.html", "disclaimer.html", "privacy.html",
        "terms-of-use.html", "site-map.html", "editorial-standards.html",
        "support.html", "index.html", "glossary.html", "directories.html",
        "resources.html", "checklists.html", "professionals.html", "members.html"}

PROMPT = """Below is the full text of a page from MediPrimer, a plain-language guide to
Medicare and Medicaid for older adults and caregivers.

Write ONE short opening paragraph — the "short answer" a reader wants before
the detail. Rules, all strict:
- 2 to 3 sentences, under 55 words total.
- Plain language at about a 9th-grade reading level. Short words, short sentences.
- Use ONLY facts that appear in the text below. Do NOT introduce any number,
  dollar amount, percentage, year or program name that is not already there.
  Prefer no numbers at all.
- Keep program names in English exactly as written (Medicare, Medicaid, Part B,
  QMB, Medigap...).
- Do not start with "This page" or "In this article". Answer the question.
- Output ONLY the sentences. No heading, no markup, no quotes.

PAGE TITLE: {title}

PAGE TEXT:
{text}
"""


def page_text(html):
    b = html.split("</h1>", 1)[1] if "</h1>" in html else html
    b = re.sub(r"<(script|style|noscript|header|footer|nav)[^>]*>.*?</\1>", " ",
               b, flags=re.S | re.I)
    # The newsletter call-to-action is injected into every page and is not page
    # content. risk-adjustment.html was summarised as "Open enrollment ends
    # December 7. Get our fall review checklist..." because of it.
    b = re.sub(r"<!--newsletter-->.*?<!--/newsletter-->", " ", b, flags=re.S | re.I)
    b = re.sub(r"<aside[^>]*>.*?</aside>", " ", b, flags=re.S | re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", b)).strip()


def has_lead(html):
    return 'class="lead"' in html or re.search(r"short answer", html, re.I)


def generate(title, text):
    r = subprocess.run([CLAUDE, "--model", "sonnet", "-p",
                        PROMPT.format(title=title, text=text[:9000]),
                        "--allowedTools", ""],
                       capture_output=True, text=True, timeout=300)
    out = " ".join(r.stdout.split()).strip().strip('"')
    out = re.sub(r"^(Here'?s? the short answer[:.]?\s*)", "", out, flags=re.I)
    return out


def main():
    dry = "--dry-run" in sys.argv
    named = [a for a in sys.argv[1:] if a.endswith(".html")]
    targets = [PUB / n for n in named] if named else [
        p for p in sorted(PUB.glob("*.html"))
        if p.name not in SKIP and not has_lead(p.read_text(encoding="utf-8"))]
    done = failed = 0
    for p in targets:
        html = p.read_text(encoding="utf-8")
        if has_lead(html):
            print(f"  skip {p.name}: already has a lead")
            continue
        m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
        title = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else p.stem
        text = page_text(html)
        if len(text) < 400:
            print(f"  skip {p.name}: too short to summarise")
            continue
        lead = generate(title, text)
        if not lead or len(lead) < 40:
            print(f"  FAIL {p.name}: model returned nothing usable")
            failed += 1
            continue
        # A summary may never introduce a figure the page does not contain.
        src_nums = set(NUM.findall(text))
        bad = [n for n in NUM.findall(lead) if n not in src_nums]
        if bad:
            print(f"  FAIL {p.name}: lead invents {bad} — rejected")
            failed += 1
            continue
        anchor = re.search(r'(<main>\s*<div class="wrap">\s*)', html)
        if not anchor:
            print(f"  FAIL {p.name}: no <main><div class=\"wrap\"> anchor")
            failed += 1
            continue
        block = (f'{anchor.group(1)}<p class="lead"><strong>Here\'s the short answer.</strong> '
                 f'{lead}</p>\n')
        if dry:
            print(f"  [dry] {p.name}: {lead[:100]}")
            continue
        p.write_text(html[:anchor.start(1)] + block + html[anchor.end(1):],
                     encoding="utf-8")
        print(f"  ok   {p.name}: {lead[:90]}")
        done += 1
    print(f"add_lead_summary: {done} page(s) updated, {failed} failed")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
