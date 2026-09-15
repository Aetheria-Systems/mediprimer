#!/usr/bin/env python3
"""Re-apply per-language title/description overrides after every build.

Translated pages are regenerated from English by translate.py, which would
otherwise wipe the language-specific search optimisation (seo/lang-title-
optimize.py). Those rewrites target how people actually search in each
language — Spanish carries more impressions than English but had 4 page-one
queries vs English's 48 — so they must survive the nightly sync.
"""
import json
import pathlib
import re

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
OVERRIDES = BASE / "seo" / "lang-title-overrides.json"


def main():
    if not OVERRIDES.exists():
        return
    data = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    n = 0
    for lang, pages in data.items():
        for name, o in pages.items():
            p = PUB / lang / name
            if not p.exists():
                continue
            html = p.read_text(encoding="utf-8")
            new = re.sub(r"<title>.*?</title>", f"<title>{o['title']}</title>",
                         html, count=1, flags=re.DOTALL)
            new = re.sub(r'<meta name="description" content=".*?">',
                         f'<meta name="description" content="{o["description"]}">',
                         new, count=1, flags=re.DOTALL)
            if new != html:
                p.write_text(new, encoding="utf-8")
                n += 1
    if n:
        print(f"apply_lang_titles: restored {n} language-optimised title(s)")


if __name__ == "__main__":
    main()
