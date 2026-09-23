#!/usr/bin/env python3
"""Generate the favicon set and the Open Graph share card.

The site had neither (audited 2026-09-22). Both cost clicks:

  favicon  — Google renders a favicon beside every mobile search result. With
             none, the site got a generic globe, which reads as untrustworthy
             on YMYL health pages. Googlebot itself requested /favicon.ico and
             took a 404 on 2026-09-22.
  og:image — every link shared by a partner organisation, and every link in the
             outreach mail, rendered as a bare text preview instead of a card.

Both reuse the header's brand mark: white "MP" on the accent blue, rounded.
Re-run after any brand change; output is deterministic.

  make_brand_assets.py
"""
import pathlib

from PIL import Image, ImageDraw, ImageFont

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"
BRAND = (20, 80, 122)       # --brand      #14507a
ACCENT = (28, 126, 214)     # --accent     #1c7ed6
WHITE = (255, 255, 255)
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
# DejaVu has no CJK or Hangul glyphs, so 中文 and 한국어 came out as empty
# tofu boxes on the first render — the worst possible flaw on a card whose
# whole point is the languages. Droid Sans Fallback fixed 中文 but has no
# Hangul, so 한국어 stayed boxed; WenQuanYi Zen Hei was confirmed by reading
# its cmap (not by rendering, which cannot tell a glyph from .notdef).
FONT_CJK = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"  # verified via cmap: covers BOTH CJK and Hangul (Droid Sans Fallback has no Hangul)


def _draw_mixed(d, xy, text, size, fill):
    """Draw text switching to the CJK font per character run, so a Latin +
    CJK + Hangul string renders with no missing glyphs."""
    latin = ImageFont.truetype(FONT_R, size)
    cjk = ImageFont.truetype(FONT_CJK, size)
    x, y = xy
    for ch in text:
        # Route by codepoint. Asking the font whether it "has" the glyph does
        # NOT work: a missing character renders .notdef (a box), which has a
        # bounding box like any other, so every such test passes and the tofu
        # survives — that is exactly how the first two renders shipped boxes.
        cp = ord(ch)
        needs_cjk = (0x4E00 <= cp <= 0x9FFF        # CJK unified ideographs
                     or 0x3400 <= cp <= 0x4DBF     # CJK extension A
                     or 0xAC00 <= cp <= 0xD7AF     # Hangul syllables
                     or 0x1100 <= cp <= 0x11FF     # Hangul jamo
                     or 0x3000 <= cp <= 0x303F)    # CJK punctuation
        f = cjk if needs_cjk else latin
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f)
    return x


def mark(size):
    """The rounded-square MP mark, as used in the site header."""
    scale = 4  # supersample, then downsample — keeps the corners clean at 16px
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.1875), fill=ACCENT)
    f = ImageFont.truetype(FONT_B, int(s * 0.52))
    box = d.textbbox((0, 0), "MP", font=f)
    d.text(((s - (box[2] - box[0])) / 2 - box[0],
            (s - (box[3] - box[1])) / 2 - box[1]), "MP", font=f, fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


def og_card():
    """1200x630 share card: brand ground, name, what it is, the languages."""
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BRAND)
    d = ImageDraw.Draw(img)
    d.rectangle([0, h - 12, w, h], fill=ACCENT)          # accent rule

    m = mark(120)
    img.paste(m, (80, 96), m)

    d.text((228, 112), "MediPrimer", font=ImageFont.truetype(FONT_B, 76), fill=WHITE)
    d.text((228, 200), "Medicare & Medicaid, in plain language",
           font=ImageFont.truetype(FONT_R, 34), fill=(190, 214, 233))

    d.text((80, 320), "Free. Independent. Nothing to sell.",
           font=ImageFont.truetype(FONT_B, 44), fill=WHITE)

    # The languages ARE the differentiator — show them, in their own scripts.
    langs = "English  ·  Español  ·  中文  ·  Tiếng Việt  ·  한국어  ·  Tagalog"
    _draw_mixed(d, (80, 470), langs, 33, (190, 214, 233))
    d.text((80, 536), "mediprimer.org", font=ImageFont.truetype(FONT_B, 32), fill=ACCENT)
    return img


if __name__ == "__main__":
    # .ico carries several sizes; browsers and Google pick what they need.
    mark(48).save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    mark(180).save(PUB / "apple-touch-icon.png")
    mark(192).save(PUB / "icon-192.png")
    mark(512).save(PUB / "icon-512.png")
    og_card().save(PUB / "og-image.png", optimize=True)
    print("brand assets: favicon.ico, apple-touch-icon.png, icon-192/512.png, og-image.png")
