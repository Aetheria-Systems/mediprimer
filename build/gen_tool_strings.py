#!/usr/bin/env python3
"""Translate the in-page interactive tools into every launched language.

The questionnaires and calculators are rendered by JavaScript with their text
baked in, so they stayed in English on every translated page while the prose
around them was fully localised. A partner organisation serving Vietnamese
speakers reported exactly this on 2026-09-23 ("the questionnaires are still
showing up in English") — on a site whose entire pitch is the languages.

Each tool declares `var I18N = {}` and routes user-visible text through
`t("English string")`, so the key IS the English source: a missing translation
degrades to English instead of throwing, and this script only has to fill the
table. build/check_language_coverage.py then fails the build if a launched
language is missing from any tool.

  gen_tool_strings.py help-paying.js          # one tool, all launched languages
  gen_tool_strings.py help-paying.js vi       # one tool, one language
"""
import json
import pathlib
import re
import subprocess
import sys

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
CLAUDE = "/home/deltaprism/.local/bin/claude"

RULES = (
    "You are translating the interface of a free, plain-language US Medicare and "
    "Medicaid guide for older adults and caregivers.\n\n"
    "RULES — all strict:\n"
    "- Translate every value. Return a JSON object mapping each ENGLISH string to "
    "its translation, using the English strings below as the keys, unchanged.\n"
    "- Keep programme names in English exactly as written: Medicare, Medicaid, "
    "Part A, Part B, Part D, QMB, SLMB, QI, Extra Help, PACE, SHIP, Medigap, "
    "Marketplace, HealthCare.gov. That is how speakers search for them, and the "
    "forms they will fill in are in English.\n"
    "- Keep every number, dollar amount and $ sign exactly as written.\n"
    "- Preserve any HTML entity (&amp;) and any leading digit-and-dot numbering "
    "such as '1. ' exactly.\n"
    "- Plain, warm, respectful language for older adults. Short sentences.\n"
    "- Never add, drop or soften a factual claim.\n"
    "Output ONLY the JSON object. No commentary, no code fence.\n\n"
)


def launched():
    d = json.loads((BASE / "build" / "languages.json").read_text(encoding="utf-8"))
    return [l["code"] for l in d["languages"] if l.get("launched") and l["code"] != "en"]


def lang_name(code):
    d = json.loads((BASE / "build" / "languages.json").read_text(encoding="utf-8"))
    for l in d["languages"]:
        if l["code"] == code:
            return l.get("name", code)
    return code


def keys_of(js):
    out = []
    for m in re.finditer(r"""t\(\s*(['"])(.+?)\1\s*\)""", js, re.S):
        k = m.group(2).replace("\\'", "'").replace('\\"', '"')
        if k not in out:
            out.append(k)
    return out


def ask(prompt):
    r = subprocess.run([CLAUDE, "--model", "sonnet", "-p", prompt, "--allowedTools", ""],
                       capture_output=True, text=True, timeout=900)
    out = r.stdout.strip()
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", out, re.DOTALL) or re.search(r"(\{.*\})", out, re.DOTALL)
    if not m:
        raise SystemExit(f"gen_tool_strings: model returned no JSON\n{out[:300]}")
    return json.loads(m.group(1))


def write_table(path, code, table):
    js = path.read_text(encoding="utf-8")
    m = re.search(r"var I18N = \{(.*?)\n  \};", js, re.S) or re.search(r"var I18N = \{\};", js)
    if not m:
        raise SystemExit(f"gen_tool_strings: no I18N object in {path.name}")
    body = json.dumps(table, ensure_ascii=False, indent=4)
    entry = f'    "{code}": {body}'
    if js.count(f'"{code}":') and "var I18N = {};" not in js:
        print(f"  {path.name}: {code} already present — skipping")
        return False
    if "var I18N = {};" in js:
        js = js.replace("var I18N = {};", "var I18N = {\n" + entry + "\n  };", 1)
    else:
        js = js[:m.end(1)] + ",\n" + entry + js[m.end(1):]
    path.write_text(js, encoding="utf-8")
    return True


def main():
    if len(sys.argv) < 2:
        raise SystemExit("usage: gen_tool_strings.py <tool.js> [lang ...]")
    tool = PUB / sys.argv[1]
    codes = sys.argv[2:] or launched()
    ks = keys_of(tool.read_text(encoding="utf-8"))
    if not ks:
        raise SystemExit(f"gen_tool_strings: {tool.name} has no t() calls to translate")
    print(f"{tool.name}: {len(ks)} string(s)")
    for code in codes:
        got = ask(f"Translate into {lang_name(code)} ({code}).\n\n{RULES}"
                  + json.dumps(ks, ensure_ascii=False, indent=1))
        missing = [k for k in ks if k not in got]
        if missing:
            raise SystemExit(f"gen_tool_strings: {code} missing {len(missing)} key(s), "
                             f"e.g. {missing[:2]} — refusing to write a partial table")
        if write_table(tool, code, {k: got[k] for k in ks}):
            print(f"  {code}: {len(ks)} string(s) written")
    subprocess.run(["node", "--check", str(tool)], check=True)
    print(f"gen_tool_strings: {tool.name} OK")


if __name__ == "__main__":
    main()
