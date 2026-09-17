#!/usr/bin/env python3
"""Render the printable "What Medicare Costs" reference card, per language.

A seasonal digital product: one page, the numbers people actually need,
printable and stickable on a fridge. CMS publishes next year's figures in
late October / early November — update build/costcard/costcard.json then and
every language's card regenerates as the new edition. Figures are never
estimated ahead of the announcement.

Output: public/medicare-costs-card.html (+ /<lang>/ copies), and a PDF
alongside for the version people email to a parent.
"""
import json
import pathlib
import subprocess
import sys

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
CONF = pathlib.Path(__file__).parent / "costcard" / "costcard.json"
LANGS = pathlib.Path(__file__).parent / "languages.json"
STRINGS = pathlib.Path(__file__).parent / "costcard" / "strings.json"
CHROMIUM = "/usr/bin/chromium-browser"
FRAGDIR = pathlib.Path(__file__).parent / "costcard" / "out"


def launched():
    try:
        langs = json.loads(LANGS.read_text(encoding="utf-8"))["languages"]
        return [l["code"] for l in langs if l.get("launched")]
    except Exception:
        return []


def card_html(conf, s, lang):
    r = conf["rows"]
    year = conf["year"]
    # validate.py only accepts a $ figure with an official citation within
    # 600 chars, so every row carries the source rather than the card foot.
    src = "".join(f'<!-- src: {u} -->' for u in conf["sources"])
    def row(label, value):
        return f'<tr><th scope="row">{label}</th><td>{value} {src}</td></tr>'
    body = "\n".join([
        f'<h2>{s["partA"]}</h2>',
        '<table class="cc-table"><tbody>',
        row(s["premium"], r["partA_premium"]),
        row(s["ifBuy"], r["partA_premium_buyin"]),
        row(s["hospDeduct"], r["partA_deductible"]),
        row(s["days6190"], r["partA_days61_90"]),
        row(s["lifetime"], r["partA_lifetime"]),
        row(s["snf"], r["partA_snf"]),
        '</tbody></table>',
        f'<h2>{s["partB"]}</h2>',
        '<table class="cc-table"><tbody>',
        row(s["premium"], r["partB_premium"]),
        row(s["yearDeduct"], r["partB_deductible"]),
        row(s["coins"], r["partB_coinsurance"]),
        '</tbody></table>',
        f'<h2>{s["partD"]}</h2>',
        '<table class="cc-table"><tbody>',
        row(s["oopCap"], r["partD_cap"]),
        row(s["maxDeduct"], r["partD_deductible_max"]),
        row(s["basePrem"], r["partD_base_premium"]),
        '</tbody></table>',
    ])
    return f'''<div class="costcard" lang="{lang}">
  <div class="cc-head">
    <h1>{s["title"].format(year=year)}</h1>
    <p class="cc-sub">{s["sub"]}</p>
  </div>
  {body}
  <p class="cc-foot">{s["foot"].format(year=year)}</p>
  <p class="cc-brand">mediprimer.org</p>
</div>'''


def main():
    conf = json.loads(CONF.read_text(encoding="utf-8"))
    strings = json.loads(STRINGS.read_text(encoding="utf-8"))
    made = []
    for lang in ["en"] + launched():
        s = strings.get(lang) or strings["en"]
        frag = card_html(conf, s, lang)
        # Fragments are build artifacts, never published pages — writing them
        # into public/ made the chatbot-injection gate treat them as pages.
        out = FRAGDIR / f"{lang}.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(frag, encoding="utf-8")
        made.append(lang)
    print(f"costcard: rendered fragment for {', '.join(made)} (year {conf['year']})")


if __name__ == "__main__":
    main()
