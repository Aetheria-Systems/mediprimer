#!/usr/bin/env python3
"""Point body links at English when the translated page does not exist.

A language launches at 90% completeness, and the QA gates permanently reject
any translation that drops or invents a fact — so a few pages legitimately have
no translation at all. Their links were still written with the locale prefix,
so e.g. /ko/costs.html was linked from 126 Korean pages and served a 404
(found 2026-09-21).

i18n_chrome._prefix_href now falls back for nav and footer links. This pass
does the same for links inside translated page bodies (the site map, "see also"
prose), which chrome rendering never touches.

A working English page is a far better outcome than a dead end, and it
self-heals: once the translation finally passes QA, the file exists and the
link silently becomes the localised one again on the next build.
update/validate.py fails the build if any dead link survives this pass.
"""
import glob
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(BASE, "public")
sys.path.insert(0, os.path.join(BASE, "build"))
from i18n_lib import get_launched_codes  # noqa: E402

LANGUAGES = json.load(open(os.path.join(BASE, "build", "languages.json"),
                           encoding="utf-8"))

HREF = re.compile(r'href="/([^"/]+)/([^"/#?]+\.html)"')


def relink(code):
    lang_dir = os.path.join(PUB, code)
    if not os.path.isdir(lang_dir):
        return 0
    present = set(os.listdir(lang_dir))
    changed = 0

    def sub(m):
        locale, page = m.group(1), m.group(2)
        # Only rewrite links into THIS language that have no translated file.
        if locale == code and page not in present:
            return f'href="/{page}"'
        return m.group(0)

    for path in sorted(glob.glob(os.path.join(lang_dir, "*.html"))):
        html = open(path, encoding="utf-8").read()
        new = HREF.sub(sub, html)
        if new != html:
            open(path, "w", encoding="utf-8").write(new)
            changed += 1
    print(f"relink {code}: {changed} page(s) repointed to English")
    return changed


if __name__ == "__main__":
    codes = sys.argv[1:] or get_launched_codes(LANGUAGES)
    total = sum(relink(c) for c in codes)
    print(f"relink_missing_translations: {total} page(s) updated")
