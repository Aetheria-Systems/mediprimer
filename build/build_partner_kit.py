#!/usr/bin/env python3
"""Build the free partner kit: print-ready PDFs organisations can hand out.

Why this exists: cold email asking organisations to LINK to us converts at
about 1.8%, and at 0% for the community organisations serving non-English
speakers (8% of those addresses bounced). Those groups have limited-English
clients and no budget to produce multilingual material — so the offer is
inverted. Instead of asking for a link, give them Medicare handouts in
Spanish, Chinese and Vietnamese that they can print and distribute freely.

It also attacks the two zeros on the property scorecard: a flyer at a senior
centre puts the brand in front of someone away from a search engine, which
is where brand searches and referral traffic begin.

Nothing here is new content — it packages the diagrams, cost card and
checklists that already exist in every language.

  build_partner_kit.py            build every launched language
  build_partner_kit.py es         just one
"""
import json
import pathlib
import subprocess
import sys
import tempfile

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
OUT = PUB / "partner-kit"
IMG = PUB / "img"
LANGS = BASE / "build" / "languages.json"
DIAG_STRINGS = BASE / "build" / "diagram-strings.json"
CHROMIUM = "/usr/bin/chromium-browser"

DIAGRAMS = ["medicare-initial-enrollment-period", "medicare-parts-explained",
            "medicare-medicaid-which-program", "medicare-enrollment-calendar"]

FOOTER = {
    "en": "Free to print and share · mediprimer.org · Independent, no ads, sells nothing",
    "es": "Libre de imprimir y compartir · mediprimer.org · Independiente, sin anuncios, no vende nada",
    "zh-Hant": "可自由列印與分享 · mediprimer.org · 獨立網站，沒有廣告，不販售任何商品",
    "vi": "Tự do in và chia sẻ · mediprimer.org · Độc lập, không quảng cáo, không bán gì",
}


def launched():
    langs = json.loads(LANGS.read_text(encoding="utf-8"))["languages"]
    return ["en"] + [l["code"] for l in langs if l.get("launched")]


def img_dir(code):
    return IMG if code == "en" else IMG / code


def html_to_pdf(html_path, pdf_path):
    try:
        subprocess.run(
            [CHROMIUM, "--headless", "--disable-gpu", "--no-sandbox",
             "--no-pdf-header-footer", f"--print-to-pdf={pdf_path}", str(html_path)],
            check=True, capture_output=True, timeout=180)
        return pdf_path.exists()
    except Exception as e:
        print(f"  PDF failed for {pdf_path.name}: {e}", file=sys.stderr)
        return False


def poster_html(svg_text, footer):
    """One diagram, landscape, filling a printed page with a source line."""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: Letter landscape; margin: 0.5in; }}
body {{ margin:0; font-family: Georgia,'Noto Serif','WenQuanYi Zen Hei','Droid Sans Fallback',serif; }}
.wrap {{ width:100%; }} svg {{ width:100%; height:auto; }}
.foot {{ margin-top:10px; font-size:10pt; color:#4a5568; text-align:center; }}
</style></head><body><div class="wrap">{svg_text}
<p class="foot">{footer}</p></div></body></html>"""


def build_lang(code):
    OUT.mkdir(parents=True, exist_ok=True)
    foot = FOOTER.get(code, FOOTER["en"])
    made = []
    # Chromium here is snap-confined and cannot read /tmp, so stage the
    # intermediate HTML inside the project (silently produced PDFs of
    # "file couldn't be accessed" otherwise).
    tmp = BASE / "build" / "partner-kit-tmp"
    tmp.mkdir(parents=True, exist_ok=True)

    # 1. Each diagram as a printable poster
    for name in DIAGRAMS:
        svg = img_dir(code) / f"{name}.svg"
        if not svg.exists():
            continue
        h = tmp / f"{name}.html"
        h.write_text(poster_html(svg.read_text(encoding="utf-8"), foot), encoding="utf-8")
        pdf = OUT / f"{name}-{code}.pdf"
        if html_to_pdf(h, pdf):
            made.append(pdf)

    # 2. The cost card and the checklists, straight from the live pages
    for page_name, label in (("medicare-costs-card.html", "medicare-costs-card"),
                             ("checklists.html", "checklists")):
        src = (PUB if code == "en" else PUB / code) / page_name
        if not src.exists():
            continue
        pdf = OUT / f"{label}-{code}.pdf"
        if html_to_pdf(src, pdf):
            made.append(pdf)

    # 3. One combined bundle
    if made:
        try:
            from pypdf import PdfWriter
            w = PdfWriter()
            for f in made:
                w.append(str(f))
            bundle = OUT / f"MediPrimer-Partner-Kit-{code}.pdf"
            with bundle.open("wb") as fh:
                w.write(fh)
            made.append(bundle)
        except Exception as e:
            print(f"  bundle failed for {code}: {e}", file=sys.stderr)
    print(f"partner kit [{code}]: {len(made)} file(s)")
    return made


def main():
    codes = [sys.argv[1]] if len(sys.argv) > 1 else launched()
    total = 0
    for c in codes:
        total += len(build_lang(c))
    print(f"partner kit: {total} PDF(s) in public/partner-kit/")


if __name__ == "__main__":
    main()
