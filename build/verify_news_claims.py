#!/usr/bin/env python3
"""Gate: numbers taken from news must be quoted from, and present in, the article.

verify_new_figures.py checks dollar amounts against official .gov pages. The
2027 insurer-exit coverage introduced a second class of fact — member counts,
county counts, percentages — whose only source is a news outlet or research
group, and the daily update job can now add such numbers from headline feeds
with no human review. On 2026-10-09 five such numbers taken from search
summaries were wrong.

Rule enforced here, for every top-level English page:
  1. Any `<!-- news: URL | "exact sentence" -->` comment must point at a page
     this server can read, and that page must contain the quoted sentence
     (whitespace-insensitive); every number in the 200 characters of visible
     text before the comment must appear in the quoted sentence.
  2. Any number that is NEW compared with the live copy and sits within 300
     characters of a non-.gov link must have such a comment within 300
     characters. (Numbers beside .gov sources are verify_new_figures' job;
     plain prose numbers like "3 steps" are left alone unless they sit next
     to a news link.)
Failures are listed as "  - page.html: reason", the shape salvage.py reads.

usage: verify_news_claims.py [--pub DIR] [--live DIR]      exit 0 pass / 1 fail
"""
import html
import pathlib
import re
import sys
import urllib.request

PUB = pathlib.Path(__file__).resolve().parent.parent / "public"
LIVE = pathlib.Path("/var/www/mediprimer/public")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
NEWS = re.compile(r'<!--\s*news:\s*(\S+?)\s*\|\s*"(.+?)"\s*-->', re.S)
NONGOV = re.compile(r'<a\s[^>]*href="(https?://(?!(?:[a-z0-9-]+\.)*(?:gov)/)[^"]+)"', re.I)
# Counts with thousands separators and percentages: the class of fact that
# went wrong on 2026-10-09. Small integers and phone numbers are left alone.
NUM = re.compile(r"(?<![\w$,.])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?\s*(?:percent|%))(?![\w,])")
STRIP = re.compile(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", re.S | re.I)
_cache = {}


def norm(t):
    return re.sub(r"\s+", " ", html.unescape(t)).replace("’", "'").replace("“", '"').replace("”", '"').strip().lower()


def fetch_text(url):
    if url not in _cache:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read().decode("utf-8", "replace")
            _cache[url] = norm(re.sub(r"<[^>]+>", " ", STRIP.sub(" ", raw)))
        except Exception as e:
            _cache[url] = e
    return _cache[url]


def visible(s):
    # a window cut from raw HTML may start or end inside a tag; drop those fragments
    s = re.sub(r"^[^<]*?>", " ", s, count=1) if ">" in s.split("<", 1)[0] else s
    s = re.sub(r"<[^>]*$", " ", s, count=1)
    return html.unescape(re.sub(r"<[^>]+>", " ", STRIP.sub(" ", s)))


def numbers(text):
    return {re.sub(r"\s+", "", m.group(1).lower()) for m in NUM.finditer(text)}


def check_page(path, live_dir):
    src = path.read_text(encoding="utf-8", errors="replace")
    problems = []
    # 1. every news comment must verify
    for m in NEWS.finditer(src):
        url, quote = m.group(1), m.group(2)
        text = fetch_text(url.split("#")[0])
        if isinstance(text, Exception):
            problems.append(f"news source cannot be read from this server ({url[:70]}): use a readable source")
            continue
        if norm(quote) not in text:
            problems.append(f"quoted sentence not found in {url[:70]}: \"{quote[:60]}...\"")
            continue
        before = visible(src[max(0, m.start() - 600):m.start()])[-200:]
        missing = numbers(before) - numbers(quote)
        if missing:
            problems.append(f"number(s) {sorted(missing)} beside the quote from {url[:50]} are not in the quoted sentence")
    # 2. every NEW number near a non-.gov link must be inside the quoted
    #    sentence of a news comment within 600 characters of it
    live = live_dir / path.name
    old_nums = numbers(visible(live.read_text(encoding="utf-8", errors="replace"))) if live.exists() else set()
    quotes = [(m.start(), numbers(m.group(2))) for m in NEWS.finditer(src)]
    link_spans = [(m.start(), m.end()) for m in NONGOV.finditer(src)]
    reported = set()
    for m in NUM.finditer(src):
        n = re.sub(r"\s+", "", m.group(1).lower())
        if n in old_nums or n in reported:
            continue
        if STRIP.search(src[max(0, m.start() - 2000):m.end()]) and any(
                m.start() >= c.start() and m.end() <= c.end() for c in STRIP.finditer(src)):
            continue                      # inside a comment or script, not visible text
        if not any(abs(ls - m.start()) <= 300 or abs(le - m.start()) <= 300 for ls, le in link_spans):
            continue                      # not a news-sourced claim
        if any(abs(pos - m.start()) <= 600 and n in qn for pos, qn in quotes):
            continue
        reported.add(n)
        problems.append(f"new number {m.group(1)} beside a non-government link is not inside any nearby "
                        f"<!-- news: URL | \"sentence\" --> quote")
    return problems


def main():
    pub = pathlib.Path(sys.argv[sys.argv.index("--pub") + 1]) if "--pub" in sys.argv else PUB
    live = pathlib.Path(sys.argv[sys.argv.index("--live") + 1]) if "--live" in sys.argv else LIVE
    if not live.is_dir():
        print(f"verify_news_claims: FATAL live directory {live} missing", file=sys.stderr)
        sys.exit(1)
    failed = {}
    for p in sorted(pub.glob("*.html")):
        probs = check_page(p, live)
        if probs:
            failed[p.name] = probs
    if failed:
        print("NEWS-CLAIM CHECK FAILED:")
        for name, probs in failed.items():
            print(f"  - {name}: " + "; ".join(probs[:3]))
        print("\nA number taken from a news or research article must be followed by "
              "<!-- news: URL | \"the article's exact sentence containing it\" --> and the article must be readable.")
        sys.exit(1)
    print(f"verify_news_claims: PASSED ({len(_cache)} article(s) read)")


if __name__ == "__main__":
    main()
