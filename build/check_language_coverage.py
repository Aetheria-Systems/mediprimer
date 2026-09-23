#!/usr/bin/env python3
"""Fail the build if a launched language is missing UI strings anywhere.

Every generated component carries its own language table. When Vietnamese and
Korean launched, none of them were extended — so the signup box, the cost
card, the calculator, the workbook and the subscribe messages all silently
fell back to ENGLISH on those pages. Kurt found it by looking at the Korean
homepage (2026-09-19). A launched language that renders English is worse than
no language at all: it looks broken and untrustworthy on a health site.

Launching a language must therefore fail the build until every component has
its strings.
"""
import json
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).parent.parent
live = ["en"] + [l["code"] for l in
                 json.loads((BASE / "build" / "languages.json").read_text(encoding="utf-8"))["languages"]
                 if l.get("launched")]

problems = []

def check_json_top(path, label):
    p = BASE / path
    if not p.exists():
        problems.append(f"{label}: {path} missing"); return
    d = json.loads(p.read_text(encoding="utf-8"))
    have = {k for k in d if not k.startswith("_") and k != "seasonal"}
    for c in live:
        if c not in have:
            problems.append(f"{label}: no strings for '{c}' in {path}")
    for months, langs in (d.get("seasonal") or {}).items():
        for c in live:
            if c not in langs:
                problems.append(f"{label}: no seasonal strings for '{c}' (months {months})")

def check_json_nested(path, label):
    p = BASE / path
    if not p.exists():
        problems.append(f"{label}: {path} missing"); return
    d = json.loads(p.read_text(encoding="utf-8"))
    for key, block in d.items():
        if key.startswith("_") or not isinstance(block, dict):
            continue
        for c in live:
            if c not in block:
                problems.append(f"{label}: '{key}' has no '{c}' strings")

def check_js(path, label):
    p = BASE / path
    if not p.exists():
        problems.append(f"{label}: {path} missing"); return
    s = p.read_text(encoding="utf-8")
    have = set(re.findall(r'^\s*"?([a-z]{2}(?:-[A-Za-z]+)?)"?\s*:\s*\{', s, re.M))
    for c in live:
        if c not in have:
            problems.append(f"{label}: no '{c}' block in {path}")

check_json_top("build/newsletter-strings.json", "newsletter signup")
check_json_top("build/costcard/strings.json", "cost card")
check_json_nested("build/diagram-strings.json", "diagrams")
check_js("public/medicare-enrollment-calculator.js", "enrollment calculator")
check_js("public/annual-review-workbook.js", "annual review workbook")
check_js("public/newsletter.js", "newsletter submit")
# The interactive tools render their own text from JavaScript. They were NOT
# checked here until 2026-09-23, so the questionnaires stayed in English on
# every translated page while the prose around them was localised — a partner
# organisation serving Vietnamese speakers reported it before we noticed, on a
# site whose whole pitch is the languages. Never remove these four.
check_js("public/help-paying.js", "help-paying questionnaire")
check_js("public/medicare-navigator.js", "coverage navigator")
check_js("public/priorities.js", "priorities tool")
check_js("public/your-state.js", "state lookup")

if problems:
    print("check_language_coverage: FAILED", file=sys.stderr)
    for p_ in problems:
        print("  " + p_, file=sys.stderr)
    print(f"\nLaunched languages: {', '.join(live)}. A launched language that "
          f"renders English looks broken — add the strings before shipping.",
          file=sys.stderr)
    sys.exit(1)
print(f"check_language_coverage: PASSED — all components cover {', '.join(live)}")
