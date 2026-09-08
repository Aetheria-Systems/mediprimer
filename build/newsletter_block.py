#!/usr/bin/env python3
"""Newsletter signup block, appended to the end of each page's content.

Kurt 2026-09-08: the signup was inside the MediBot chat panel, which
confused two different intents — the widget is for asking a question, the
signup is for staying in touch. It now sits at the natural moment instead:
the end of the page, once the reader has actually got what they came for.

Runs in `make build` (after assemble, before seo) and rewrites only what is
between the markers, so it is idempotent. Strings are per language, keyed
by the page's directory, so translated pages get a translated block with no
extra work; a language with no strings falls back to English rather than
showing nothing.
"""
import json
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
STRINGS = pathlib.Path(__file__).parent / "newsletter-strings.json"
LANGS = pathlib.Path(__file__).parent / "languages.json"
START, END = "<!--newsletter-->", "<!--/newsletter-->"
# Pages where a signup would be inappropriate or redundant.
SKIP = {"support.html", "editorial-standards.html", "privacy.html",
        "disclaimer.html", "site-map.html", "404.html"}


def launched():
    try:
        langs = json.loads(LANGS.read_text(encoding="utf-8"))["languages"]
        return [l["code"] for l in langs if l.get("launched")]
    except Exception:
        return []


def render(s, lang):
    return (
        f'{START}\n'
        f'    <aside class="newsletter" aria-label="{s["aria"]}">\n'
        f'      <h2>{s["head"]}</h2>\n'
        f'      <p>{s["blurb"]}</p>\n'
        f'      <form class="newsletter-form" data-lang="{lang}">\n'
        f'        <label class="sr-only" for="nl-email">{s["placeholder"]}</label>\n'
        f'        <input id="nl-email" type="email" required placeholder="{s["placeholder"]}">\n'
        f'        <button type="submit">{s["button"]}</button>\n'
        f'      </form>\n'
        f'      <p class="newsletter-fine">{s["fine"]}</p>\n'
        f'    </aside>\n    {END}')


def apply_to(path, s, lang):
    html = path.read_text(encoding="utf-8")
    block = render(s, lang)
    if START in html and END in html:
        new = re.sub(re.escape(START) + r".*?" + re.escape(END),
                     lambda m: block, html, count=1, flags=re.DOTALL)
    else:
        # Insert at the end of the page's own content, just before </main>.
        i = html.rfind("</main>")
        if i < 0:
            return False
        new = html[:i] + block + "\n  " + html[i:]
    if new != html:
        path.write_text(new, encoding="utf-8")
        return True
    return False


def main():
    data = json.loads(STRINGS.read_text(encoding="utf-8"))
    en = data["en"]
    changed = 0
    for lang in ["en"] + launched():
        s = data.get(lang, en)
        d = PUB if lang == "en" else PUB / lang
        if not d.is_dir():
            continue
        for page in sorted(d.glob("*.html")):
            if page.name in SKIP:
                continue
            if apply_to(page, s, lang):
                changed += 1
    print(f"newsletter: block on {changed} page(s)")


if __name__ == "__main__":
    main()
