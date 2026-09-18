#!/usr/bin/env python3
"""Fail the build if any nav/menu label lacks a translation.

Renaming one nav label ("For Professionals" -> "For Partners & Pros",
2026-09-18) left every launched language's chrome.json without that key.
i18n_chrome raises on a missing label, so EVERY translated page then failed
to build — which showed up hours later as unexplained translation failures
rather than as the one-line cause. Catch it at build time instead.
"""
import json
import pathlib
import sys

BASE = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(BASE / "build"))
import normalize  # noqa: E402

langs = json.loads((BASE / "build" / "languages.json").read_text(encoding="utf-8"))["languages"]
live = [l["code"] for l in langs if l.get("launched")]

wanted_nav = {label for _, label, _, _ in normalize.NAV}
wanted_menu = set()
for items in normalize.MENUS.values():
    for entry in items:
        wanted_menu.add(entry[1])

missing = []
for code in live:
    p = BASE / "build" / "i18n" / code / "chrome.json"
    if not p.exists():
        missing.append(f"{code}: chrome.json missing entirely")
        continue
    d = json.loads(p.read_text(encoding="utf-8"))
    nav = d.get("nav", {})
    menus = d.get("menus", {})
    for label in sorted(wanted_nav - set(nav)):
        missing.append(f"{code}: nav label not translated -> {label!r}")
    for label in sorted(wanted_menu - set(menus)):
        missing.append(f"{code}: menu label not translated -> {label!r}")

if missing:
    print("check_chrome_labels: FAILED", file=sys.stderr)
    for m in missing:
        print("  " + m, file=sys.stderr)
    print("\nAdd these to build/i18n/<code>/chrome.json. Until then every "
          "translated page fails to build.", file=sys.stderr)
    sys.exit(1)
# Labels being translated is not enough: the translated PAGES bake their
# chrome in at translate time, so a rename only reaches pages that happen to
# be retranslated. On 2026-09-18 exactly 8 pages got the new label and ~120
# kept the old one. Detect that drift here.
import re as _re
drift = []
for code in live:
    d = BASE / "public" / code
    if not d.is_dir():
        continue
    tr = json.loads((BASE / "build" / "i18n" / code / "chrome.json").read_text(encoding="utf-8"))
    from html import unescape as _un0
    want = {_un0(tr["nav"][label]) for _, label, _, _ in normalize.NAV
            if label in tr.get("nav", {})}
    stale = []
    for page in list(d.glob("*.html"))[:400]:
        html = page.read_text(encoding="utf-8", errors="replace")
        m = _re.search(r'<nav class="main">(.*?)</nav>', html, _re.S)
        if not m:
            continue
        # compare unescaped: a label containing "&" renders as "&amp;"
        from html import unescape as _un
        have = {_un(_re.sub(r"<[^>]+>", "", x)).strip()
                for x in _re.findall(r'class="navtop[^"]*">([^<]*)<', m.group(1))}
        if want - have:
            stale.append(page.name)
    if stale:
        drift.append(f"{code}: {len(stale)} page(s) still carry an old nav label "
                     f"(e.g. {stale[0]}) — run: python3 build/refresh_chrome.py {code}")
if drift:
    print("check_chrome_labels: FAILED — translated pages have stale chrome", file=sys.stderr)
    for d_ in drift:
        print("  " + d_, file=sys.stderr)
    sys.exit(1)

print(f"check_chrome_labels: PASSED — all nav/menu labels translated and applied in {', '.join(live)}")
