#!/usr/bin/env python3
"""Render the homepage 'Happening right now' section from hot-topics.json.

Runs as part of `make build` (before seo.py so the content hash reflects
the current month). Idempotent: rewrites everything between the
<!--hot-topics--> ... <!--/hot-topics--> markers in public/index.html only.
Month flips happen automatically at the first build of a new month (the
nightly translate-sync rebuild guarantees that's no later than the 1st at
03:00), and the changed English homepage hash makes the sync retranslate
the es/zh/etc homepages the same night.

Rules:
- 3 cards. If 'breaking' items exist, the last slot goes to the first
  breaking item whose target exists.
- An item whose href target doesn't exist in public/ falls back to its
  'fallback' href if given (and existing), else is skipped — never a dead
  link on the homepage.
"""
import datetime
import json
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
CONF = pathlib.Path(__file__).parent / "hot-topics.json"
START, END = "<!--hot-topics-->", "<!--/hot-topics-->"


def exists(href):
    return (PUB / href.lstrip("/")).is_file()


def resolve(item):
    if exists(item["href"]):
        return dict(item)
    fb = item.get("fallback")
    if fb and exists(fb):
        out = dict(item)
        out["href"] = fb
        return out
    return None


def render(items):
    cards = []
    for it in items:
        cards.append(
            '      <a class="card hot-topic" href="{href}">\n'
            '        <h3>{q}</h3>\n'
            '        <p>{sub}</p>\n'
            '      </a>'.format(**it))
    return (
        f"{START}\n"
        '    <section class="hot-topics" aria-label="Happening right now">\n'
        '      <h2>Happening right now</h2>\n'
        '      <div class="grid">\n' + "\n".join(cards) + "\n"
        '      </div>\n'
        '    </section>\n'
        f"    {END}")


def main():
    conf = json.loads(CONF.read_text(encoding="utf-8"))
    month = str(datetime.date.today().month)
    items = [i for i in (resolve(x) for x in conf["months"][month]) if i]
    breaking = [i for i in (resolve(x) for x in conf.get("breaking", [])) if i]
    if breaking and len(items) >= 3:
        items = items[:2] + [breaking[0]]
    elif breaking:
        items.append(breaking[0])
    items = items[:3]
    if not items:
        print("hot_topics: nothing renderable this month — leaving section unchanged", file=sys.stderr)
        return

    idx = PUB / "index.html"
    html = idx.read_text(encoding="utf-8")
    if START not in html or END not in html:
        print("hot_topics: FATAL — markers missing from index.html", file=sys.stderr)
        sys.exit(1)
    new_html = re.sub(
        re.escape(START) + r".*?" + re.escape(END),
        lambda m: render(items), html, count=1, flags=re.DOTALL)
    if new_html != html:
        idx.write_text(new_html, encoding="utf-8")
        print(f"hot_topics: rendered month {month} ({len(items)} cards)")
    else:
        print(f"hot_topics: month {month} already current")


if __name__ == "__main__":
    main()
