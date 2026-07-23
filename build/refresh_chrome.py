#!/usr/bin/env python3
"""One-off: re-render header/footer chrome on already-translated pages
without re-translating body content or calling the API. Needed after
launches.json's `launched` flag flips, since the switcher's option list
is baked in at translate time."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))

from i18n_lib import split_page
from i18n_chrome import render_header, render_footer
from translate import load_chrome, ACTIVE, LANGUAGES, PUB

STATE_PATH = os.path.join(os.path.dirname(__file__), "translation-state.json")


def refresh(code):
    state = json.load(open(STATE_PATH, encoding="utf-8"))
    pages = state.get(code, {})
    lang_dir = os.path.join(PUB, code)
    changed = []
    for page_name in pages:
        path = os.path.join(lang_dir, page_name)
        if not os.path.exists(path):
            print(f"MISSING {path}")
            continue
        html = open(path, encoding="utf-8").read()
        segments = split_page(html)

        active_key = ACTIVE.get(page_name, "home")
        new_header = render_header(code, active_key, page_name, load_chrome(code), LANGUAGES)
        new_footer = render_footer(code, page_name, load_chrome(code), LANGUAGES, html)

        footer_end_pos = segments["footer"].find("</footer>")
        trailing = segments["footer"][footer_end_pos + len("</footer>"):] if footer_end_pos != -1 else ""
        new_footer = new_footer + trailing

        new_html = segments["head"] + new_header + segments["main"] + new_footer
        if new_html != html:
            open(path, "w", encoding="utf-8").write(new_html)
            changed.append(page_name)
    print(f"{code}: {len(changed)} pages updated")
    return changed


if __name__ == "__main__":
    for lang_code in sys.argv[1:]:
        refresh(lang_code)
