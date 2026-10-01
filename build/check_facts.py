#!/usr/bin/env python3
"""Fail the build when a page states a superseded official figure.

Every other gate in this build checks CONSISTENCY — that translations match
English, that numbers do not drift between languages, that a generated summary
invents nothing. None of them check whether a number is CORRECT. A wrong Part B
premium passes all of them and ships to six languages, and the person who finds
it is someone who budgeted around it.

This checks the figures that matter against build/official-figures.json, which
records the CMS-published value and the previous years' values. A page carrying
a prior-year amount for a current-year claim is the realistic failure: the
numbers change every November and the site has pages written across several
years.

Deliberately narrow. It does NOT try to validate all 101 dollar amounts on the
site — most are illustrative examples ("if the visit costs $150") that are not
claims about program figures, and flagging those would train everyone to ignore
this. It flags a superseded official amount, which is unambiguous.

  check_facts.py            # English pages
  check_facts.py --all      # every language
"""
import json
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
FIGURES = json.loads((BASE / "build" / "official-figures.json").read_text(encoding="utf-8"))
# Illustrative examples and code samples are not claims about program figures.
STRIP = re.compile(r"<(script|style|pre|code)\b.*?</\1>", re.S | re.I)


def page_text(p):
    return re.sub(r"<[^>]+>", " ", STRIP.sub(" ", p.read_text(encoding="utf-8", errors="replace")))


def main():
    pages = sorted(PUB.glob("*.html"))
    if "--all" in sys.argv:
        pages += sorted(PUB.glob("*/*.html"))
    problems = []
    for p in pages:
        text = page_text(p)
        for fig in FIGURES["figures"]:
            for stale in fig["wrong_if_seen"]:
                # Must not match $185 inside $1,850 — but must still match
                # "$185.00," and "$185." at the end of a clause. The first
                # version excluded a following comma or period outright, so it
                # matched nothing at all and the gate passed a planted error.
                for m in re.finditer(re.escape(stale) + r"(?!\d)(?!,\d)(?!\.\d)", text):
                    # The number alone proves nothing — the site is full of
                    # worked examples ("your share would be $1,600"). It is only
                    # a claim about this figure if the words that NAME the
                    # figure sit beside it.
                    window = text[max(0, m.start() - 220):m.end() + 220].lower()
                    if fig["near"] and not any(w in window for w in fig["near"]):
                        continue
                    rel = p.relative_to(PUB)
                    problems.append(
                        f"{rel}: shows {stale} for {fig['what']} — "
                        f"the {fig['year']} figure is {fig['value']}")
                    break
    if problems:
        print("check_facts: FAILED")
        for pr in sorted(set(problems))[:30]:
            print("  " + pr)
        extra = len(set(problems)) - 30
        if extra > 0:
            print(f"  ... and {extra} more")
        print("\nA superseded official figure is the one error this site cannot "
              "afford. Update the page, or if the page is deliberately discussing "
              "a past year, say so in words next to the number.")
        sys.exit(1)
    # CMS publishes the next year's amounts in mid-November. If this file is
    # not re-verified after that, the gate quietly starts guarding last year's
    # numbers while the site is supposed to be stating next year's — passing
    # while being wrong, which is the failure mode this whole gate exists to
    # prevent. Say so loudly rather than printing a clean PASS.
    from datetime import date
    verified = date.fromisoformat(FIGURES["verified"])
    age = (date.today() - verified).days
    n = len(FIGURES["figures"])
    print(f"check_facts: PASSED — {n} official figures, no superseded values "
          f"on {len(pages)} page(s) (verified {FIGURES['verified']})")
    if age > 365 or (date.today().month >= 12 and verified.year < date.today().year):
        print(f"check_facts: WARNING — these figures were verified {age} days ago "
              f"and CMS publishes the new year each November. Re-verify against "
              f"{FIGURES['_sources']['cms-2026-ab']} and update "
              f"build/official-figures.json.", file=sys.stderr)


if __name__ == "__main__":
    main()
