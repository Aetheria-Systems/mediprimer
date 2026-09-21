#!/usr/bin/env python3
"""Generate the UI string blocks a newly launched language needs.

Every generated component (signup box, cost card, calculator, workbook,
subscribe messages) carries its own language table. Nothing created those for
a new language, so a rollout would translate all ~130 pages, then be blocked
at the launch gate by check_language_coverage — and the supervisor would
retry the identical failure three times and email. Tagalog hit exactly that
on 2026-09-19 and -20.

This closes the loop: the rollout calls it before flipping, so a new language
arrives complete instead of half-English.

  gen_ui_strings.py <code> <LanguageName>
"""
import json
import pathlib
import re
import subprocess
import sys

BASE = pathlib.Path(__file__).parent.parent
CLAUDE = "/home/deltaprism/.local/bin/claude"

JSON_TARGETS = [("build/newsletter-strings.json", "newsletter", None),
                ("build/costcard/strings.json", "costcard", None)]
JS_TARGETS = [("public/medicare-enrollment-calculator.js", "calculator"),
              ("public/annual-review-workbook.js", "workbook"),
              ("public/newsletter.js", "newsletterjs")]

RULES = (
    "RULES:\n"
    "- Keep the structure and every key/property name exactly; translate only values.\n"
    "- Keep program names in English: Medicare, Medicaid, Medicare Advantage, Medigap,\n"
    "  CHIP, Part A/B/C/D, SHIP, IRMAA — that is how speakers search for them.\n"
    "- Keep every number, date, dollar amount and the $ sign exactly as written.\n"
    "- Keep '{year}' placeholders exactly.\n"
    "- Keep strings SHORT: they sit in buttons, table headers and fixed-width boxes.\n"
    "- Plain, warm language for older adults and caregivers. Never invent a fact.\n"
    "Output ONLY the JSON object — no commentary, no code fences.\n\n")


def ask(prompt):
    r = subprocess.run([CLAUDE, "--model", "sonnet", "-p", prompt, "--allowedTools", ""],
                       capture_output=True, text=True, timeout=900)
    out = r.stdout.strip()
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", out, re.DOTALL) or re.search(r"(\{.*\})", out, re.DOTALL)
    if not m:
        raise SystemExit(f"gen_ui_strings: model returned no JSON object\n{out[:300]}")
    return json.loads(m.group(1))


def do_json(code, name):
    src = {}
    for path, key, _ in JSON_TARGETS:
        d = json.loads((BASE / path).read_text(encoding="utf-8"))
        src[key] = d["en"]
        if key == "newsletter":
            src["newsletter_seasonal"] = d["seasonal"]["9,10,11"]["en"]
    got = ask(f"Translate these UI strings for a US Medicare/Medicaid guide into "
              f"{name} ({code}).\n\n{RULES}{json.dumps(src, ensure_ascii=False, indent=1)}")
    for path, key, _ in JSON_TARGETS:
        p = BASE / path
        d = json.loads(p.read_text(encoding="utf-8"))
        if key not in got:
            raise SystemExit(f"gen_ui_strings: model omitted '{key}'")
        d[code] = got[key]
        if key == "newsletter":
            d["seasonal"]["9,10,11"][code] = got["newsletter_seasonal"]
        p.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"  {path}: added {code}")


def do_js(code, name):
    src = {}
    for path, key in JS_TARGETS:
        s = (BASE / path).read_text(encoding="utf-8")
        m = re.search(r"\n\s*en:\s*\{(.*?)\n\s*\},\s*\n\s*es:", s, re.DOTALL) \
            or re.search(r"en:\s*\{(.*?)\},\s*\n?\s*es:", s, re.DOTALL)
        src[key] = "{" + m.group(1) + "}"
    got = ask(f"Translate these JavaScript UI string tables for a US Medicare guide into "
              f"{name} ({code}).\nReturn the SAME JSON shape: same top-level keys, each value a "
              f"JavaScript object literal with the SAME property names, values translated. Use "
              f"straight double quotes and escape internal quotes. Any 'months' property must be "
              f"the 12 month names in {name}.\n\n{RULES}{json.dumps(src, ensure_ascii=False, indent=1)}")
    for path, key in JS_TARGETS:
        p = BASE / path
        s = p.read_text(encoding="utf-8")
        body = got[key].strip()
        if not (body.startswith("{") and body.endswith("}")):
            raise SystemExit(f"gen_ui_strings: '{key}' is not an object literal")
        m = re.search(r'("zh-Hant":\s*\{.*?\n\s*\})\s*\n?(\s*)\};', s, re.DOTALL) \
            or re.search(r'(\"?[a-z-]+\"?:\s*\{[^{}]*\})\s*\n(\s*)\};', s, re.DOTALL)
        if not m:
            raise SystemExit(f"gen_ui_strings: cannot locate table end in {path}")
        s = s[:m.end(1)] + f',\n    "{code}": {body}\n' + m.group(2) + "};" + s[m.end():]
        p.write_text(s, encoding="utf-8")
        print(f"  {path}: added {code}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("usage: gen_ui_strings.py <code> <LanguageName>")
    code, name = sys.argv[1], " ".join(sys.argv[2:])
    # Re-running must not append a second table for the same language: JS takes
    # the last duplicate key, so it would work but grow the file every night.
    if json.loads((BASE / JSON_TARGETS[0][0]).read_text(encoding="utf-8")).get(code) \
       and f'"{code}"' in (BASE / JS_TARGETS[0][0]).read_text(encoding="utf-8"):
        print(f"gen_ui_strings: {code} already present — nothing to do")
        raise SystemExit(0)
    do_json(code, name)
    do_js(code, name)
    print(f"gen_ui_strings: {code} complete")
