#!/usr/bin/env python3
"""Fail the build when a reader-visible ATTRIBUTE is left in English.

Page prose gets translated and checked. Attributes do not: `placeholder`,
`aria-label`, `title` and `alt` carry real text that screen-reader users hear
and that sighted users see in a search box, and nothing verified them. Found
2026-09-23 while auditing after a partner organisation reported English
content on translated pages — "Happening right now" was still English in
zh-Hant, vi and ko, and "Search glossary terms" in ko.

A value identical to the English page's is treated as untranslated. Code
samples are exempt: partner-materials.html publishes an embed snippet that
readers copy into their own site, and that HTML must stay English.
"""
import json
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
ATTR = re.compile(r'(placeholder|aria-label|title|alt)="([^"]{4,})"')
CODE = re.compile(r"<(pre|code)\b.*?</\1>", re.S | re.I)
# Values that are the same word in every language, or are brand/技術 terms.
EXEMPT = {"MediPrimer", "Medicare", "Medicaid", "Medigap", "MediBot"}


def launched():
    d = json.loads((BASE / "build" / "languages.json").read_text(encoding="utf-8"))
    return [l["code"] for l in d["languages"] if l.get("launched") and l["code"] != "en"]


def attrs(path):
    s = CODE.sub(" ", path.read_text(encoding="utf-8", errors="replace"))
    return {(a, v) for a, v in ATTR.findall(s)}


def main():
    problems = []
    for code in launched():
        d = PUB / code
        if not d.is_dir():
            continue
        for tp in sorted(d.glob("*.html")):
            ep = PUB / tp.name
            if not ep.exists():
                continue
            en, tr = attrs(ep), attrs(tp)
            for a, v in sorted(tr & en):
                if v in EXEMPT or not re.search(r"[A-Za-z]{3,}\s+[A-Za-z]{2,}", v):
                    continue
                problems.append(f"{code}/{tp.name}: {a}=\"{v[:60]}\" is still English")
    if problems:
        print("check_translated_attrs: FAILED")
        for p in problems[:25]:
            print("  " + p)
        if len(problems) > 25:
            print(f"  ... and {len(problems) - 25} more")
        print("\nReader-visible attributes must be translated. Prefer aria-labelledby "
              "pointing at a translated heading over a duplicated aria-label.")
        sys.exit(1)
    print(f"check_translated_attrs: PASSED — visible attributes translated in "
          f"{', '.join(launched())}")


if __name__ == "__main__":
    main()
