#!/usr/bin/env python3
"""Gate: every dollar figure an edit ADDS must appear on the official page it cites.

update/validate.py only asks whether some .gov link or `<!-- src: -->` comment
sits within 600 characters of a figure. A fire drill on 2026-10-06 planted
"the made-up yearly amount is $98,765" beside an existing source comment and
every gate passed it. On a Medicare site an invented or mistyped amount is the
one error that cannot ship, and the edits are written by a model with no human
review — so proximity to a citation is not evidence.

For each top-level English page, compare with the LIVE copy; for every dollar
figure that is new, fetch the official pages cited near it and require the
figure to be printed there. Failures are reported one page per line in the
same "  - page.html: reason" shape validate.py uses, so the optimizer's repair
pass and salvage.py can act on them.

A worked example the site computes itself ("20% of $500 is $100") has no
source to match; mark it with `<!-- example -->` just before the figure.

usage: verify_new_figures.py [--pub DIR] [--live DIR]      exit 0 pass / 1 fail
"""
import html
import pathlib
import re
import sys
import urllib.request

PUB = pathlib.Path("/home/deltaprism/mediprimer/public")
LIVE = pathlib.Path("/var/www/mediprimer/public")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
FIG = re.compile(r"\$[0-9][0-9,]*(?:\.[0-9]{2})?")
SRC = re.compile(r'href="(https?://(?:[a-z0-9-]+\.)*(?:medicare|ssa|cms|hhs|medicaid|healthcare|irs|va|federalregister)\.gov[^"]*)"'
                 r'|<!--\s*src:\s*(\S+?)\s*-->', re.I)
WINDOW = 600            # same reach validate.py uses for "nearby"
EXAMPLE = re.compile(r"<!--\s*example\s*-->", re.I)
EXEMPT_PAGES = {"costs.html"}   # labelled illustrative examples by design (see validate.py)
_cache = {}


def figures(src):
    return {m.group().rstrip(",") for m in FIG.finditer(src) if m.group() != "$0"}


def norm(fig):
    return fig[:-3] if fig.endswith(".00") else fig


def source_text(url):
    if url not in _cache:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read().decode("utf-8", "replace")
            _cache[url] = html.unescape(re.sub(r"<[^>]+>", " ", raw))
        except Exception as e:
            _cache[url] = e
    return _cache[url]


def check_page(path, live_dir):
    src = path.read_text(encoding="utf-8", errors="replace")
    live = live_dir / path.name
    old = figures(live.read_text(encoding="utf-8", errors="replace")) if live.exists() else set()
    problems = []
    for fig in sorted(figures(src) - old):
        verdict = None
        for m in re.finditer(re.escape(fig) + r"(?![0-9])(?!,[0-9])", src):
            if EXAMPLE.search(src[max(0, m.start() - 200):m.start()]):
                verdict = "ok"
                break
            near = src[max(0, m.start() - WINDOW):m.end() + WINDOW]
            urls = [a or b for a, b in SRC.findall(near)]
            if not urls:
                verdict = verdict or f"{fig} has no official source beside it"
                continue
            unread = []
            for u in dict.fromkeys(urls):
                text = source_text(u.split("#")[0])
                if isinstance(text, Exception):
                    unread.append(u)
                elif fig in text or norm(fig) in text:
                    verdict = "ok"
                    break
            if verdict == "ok":
                break
            verdict = (f"{fig} is not printed on the official page(s) cited beside it "
                       f"({', '.join(list(dict.fromkeys(urls))[:3])})"
                       + (f"; could not read {len(unread)} of them" if unread else ""))
        if verdict and verdict != "ok":
            problems.append(verdict)
    return problems


def main():
    pub = pathlib.Path(sys.argv[sys.argv.index("--pub") + 1]) if "--pub" in sys.argv else PUB
    live = pathlib.Path(sys.argv[sys.argv.index("--live") + 1]) if "--live" in sys.argv else LIVE
    if not live.is_dir():
        print(f"verify_new_figures: FATAL live directory {live} missing — cannot tell which figures are new",
              file=sys.stderr)
        sys.exit(1)
    failed = {}
    for p in sorted(pub.glob("*.html")):
        if p.name in EXEMPT_PAGES:
            continue
        probs = check_page(p, live)
        if probs:
            failed[p.name] = probs
    if failed:
        print("NEW-FIGURE CHECK FAILED:")
        for name, probs in failed.items():
            print(f"  - {name}: new dollar figure(s) not confirmed at the source — " + "; ".join(probs[:4]))
        print("\nEvery added dollar figure must be copied from the official page cited beside it "
              "(`<!-- src: URL -->`). Fix the figure or the citation, or remove the figure and link "
              "the official page. A worked example needs `<!-- example -->` just before it.")
        sys.exit(1)
    print(f"verify_new_figures: PASSED — no unconfirmed new dollar figures ({len(_cache)} source page(s) read)")


if __name__ == "__main__":
    main()
