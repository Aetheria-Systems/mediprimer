#!/usr/bin/env python3
"""Explanatory diagrams for MediPrimer, rendered per language.

Why diagrams as code: the site had NO images at all, which closed off
Google Images and Discover entirely. Stock photography would add nothing —
people search "when do I sign up", not for pictures. These are authored as
SVG templates whose every label comes from a strings dict, so the same
diagram renders in English, Spanish, Chinese, Vietnamese... That is the
site's moat extended into an image channel where non-English explanatory
Medicare graphics essentially do not exist.

Add a diagram: write a render_<key>(s) function returning SVG and register
it in DIAGRAMS. Add a language: add its block to diagram-strings.json
(build/render_diagrams.py --translate does it with a cheap model call).
"""

# Serif first for English/Latin, then CJK fallbacks so Chinese renders
# instead of showing tofu boxes.
FONT = "Georgia,'Noto Serif','WenQuanYi Zen Hei','Droid Sans Fallback',serif"
INK = "#14213d"      # headline ink
MUTE = "#4a5568"     # secondary text
BLUE = "#1f4e79"     # brand
GOLD = "#c9a227"     # highlight
GREY = "#7a8ba3"     # de-emphasised band
PALE = "#eef5fb"     # callout fill (blue)
PALEG = "#f6f7f9"    # callout fill (grey)


def _esc(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def _txt(x, y, t, size=16, weight=400, fill=INK, anchor="start"):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" '
            f'style="font:{weight} {size}px {FONT};fill:{fill}">{_esc(t)}</text>')


def _head(w, h, title, desc):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" role="img" aria-labelledby="t d">'
            f'<title id="t">{_esc(title)}</title><desc id="d">{_esc(desc)}</desc>'
            f'<rect width="{w}" height="{h}" fill="#ffffff"/>')


def _dw(s):
    """Display width in 'Latin character' units.

    A CJK glyph occupies roughly twice the advance width of a Latin one at
    the same font size, so counting characters overflows every box in
    Chinese/Japanese. Count wide ranges as 2.
    """
    total = 0
    for ch in str(s):
        o = ord(ch)
        wide = (0x1100 <= o <= 0x115F or 0x2E80 <= o <= 0xA4CF
                or 0xAC00 <= o <= 0xD7A3 or 0xF900 <= o <= 0xFAFF
                or 0xFE30 <= o <= 0xFE6F or 0xFF00 <= o <= 0xFF60
                or 0xFFE0 <= o <= 0xFFE6)
        total += 2 if wide else 1
    return total


def _wrap(txt, width):
    """Word wrap by DISPLAY width, so Chinese lines fit the same boxes.

    CJK has no spaces, so when a 'word' is itself wider than the line we
    break it glyph by glyph — which is also how CJK text legitimately wraps.
    """
    txt = str(txt)
    lines, cur = [], ""
    for w in txt.split() or [txt]:
        if _dw(w) > width:                 # unbroken run (typical CJK)
            if cur:
                lines.append(cur)
                cur = ""
            piece = ""
            for ch in w:
                if _dw(piece + ch) > width:
                    lines.append(piece)
                    piece = ch
                else:
                    piece += ch
            cur = piece
            continue
        trial = (cur + " " + w).strip()
        if _dw(trial) > width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


def render_iep(s):
    """7-month Initial Enrollment Period timeline."""
    o = [_head(1200, 560, s["title"], s["desc"])]
    o.append(_txt(60, 58, s["title"], 30, 700))
    o.append(_txt(60, 88, s["sub"], 18, 400, MUTE))
    o.append(f'<rect x="60" y="130" width="450" height="96" rx="8" fill="{BLUE}"/>')
    o.append(_txt(285, 166, s["before"], 19, 700, "#ffffff", "middle"))
    o.append(_txt(285, 196, s["before_sub"], 16, 400, "#dbe8f5", "middle"))
    o.append(f'<rect x="522" y="130" width="156" height="96" rx="8" fill="{GOLD}"/>')
    o.append(_txt(600, 166, s["bday1"], 18, 700, "#ffffff", "middle"))
    o.append(_txt(600, 192, s["bday2"], 18, 700, "#ffffff", "middle"))
    o.append(f'<rect x="690" y="130" width="450" height="96" rx="8" fill="{GREY}"/>')
    o.append(_txt(915, 166, s["after"], 19, 700, "#ffffff", "middle"))
    o.append(_txt(915, 196, s["after_sub"], 16, 400, "#eef2f7", "middle"))
    o.append(f'<line x1="60" y1="250" x2="1140" y2="250" stroke="#cbd5e0" stroke-width="2"/>')
    for x, lab in ((135, "−3"), (285, "−2"), (435, "−1"), (600, s["age65"]),
                   (765, "+1"), (915, "+2"), (1065, "+3")):
        o.append(_txt(x, 278, lab, 17, 700, INK, "middle"))
    o.append(f'<rect x="60" y="316" width="450" height="128" rx="8" fill="{PALE}" stroke="{BLUE}" stroke-width="2"/>')
    o.append(_txt(84, 348, s["good_h"], 16, 700, BLUE))
    for i, ln in enumerate(_wrap(s["good_b"], 42)[:2]):
        o.append(_txt(84, 378 + i * 24, ln, 15, 400))
    o.append(_txt(84, 430, s["good_tag"], 16, 700, BLUE))
    o.append(f'<rect x="690" y="316" width="450" height="128" rx="8" fill="{PALEG}" stroke="{GREY}" stroke-width="2"/>')
    o.append(_txt(714, 348, s["late_h"], 16, 700, MUTE))
    for i, ln in enumerate(_wrap(s["late_b"], 42)[:3]):
        o.append(_txt(714, 378 + i * 24, ln, 15, 400))
    o.append(_txt(60, 492, s["foot1"], 15, 400, MUTE))
    o.append(_txt(60, 518, s["foot2"], 15, 400, MUTE))
    o.append(_txt(1140, 518, "mediprimer.org", 14, 400, GREY, "end"))
    return "".join(o) + "</svg>"


def render_parts(s):
    """The four parts of Medicare, what each one pays for."""
    o = [_head(1200, 620, s["title"], s["desc"])]
    o.append(_txt(60, 58, s["title"], 30, 700))
    o.append(_txt(60, 88, s["sub"], 18, 400, MUTE))
    cols = [("a", BLUE), ("b", BLUE), ("d", BLUE)]
    x = 60
    for key, col in cols:
        o.append(f'<rect x="{x}" y="130" width="330" height="230" rx="10" fill="#ffffff" stroke="{col}" stroke-width="3"/>')
        o.append(f'<rect x="{x}" y="130" width="330" height="52" rx="10" fill="{col}"/>')
        o.append(f'<rect x="{x}" y="166" width="330" height="16" fill="{col}"/>')
        o.append(_txt(x + 165, 164, s[f"{key}_h"], 20, 700, "#ffffff", "middle"))
        for i, ln in enumerate(_wrap(s[f"{key}_b"], 34)[:6]):
            o.append(_txt(x + 20, 212 + i * 24, ln, 15, 400))
        x += 360
    o.append(f'<rect x="60" y="392" width="1080" height="120" rx="10" fill="{PALE}" stroke="{GOLD}" stroke-width="3"/>')
    o.append(_txt(84, 428, s["c_h"], 20, 700, INK))
    for i, ln in enumerate(_wrap(s["c_b"], 96)[:3]):
        o.append(_txt(84, 458 + i * 24, ln, 15, 400))
    o.append(_txt(60, 556, s["foot"], 15, 400, MUTE))
    o.append(_txt(1140, 556, "mediprimer.org", 14, 400, GREY, "end"))
    return "".join(o) + "</svg>"


def render_which(s):
    """Medicare / Medicaid / both — which program am I in."""
    o = [_head(1200, 620, s["title"], s["desc"])]
    o.append(_txt(60, 58, s["title"], 30, 700))
    o.append(_txt(60, 88, s["sub"], 18, 400, MUTE))
    boxes = [(60, BLUE, "mcare"), (450, "#2e7d5b", "mcaid"), (840, GOLD, "dual")]
    for x, col, key in boxes:
        o.append(f'<rect x="{x}" y="130" width="300" height="300" rx="10" fill="#ffffff" stroke="{col}" stroke-width="3"/>')
        o.append(f'<rect x="{x}" y="130" width="300" height="56" rx="10" fill="{col}"/>')
        o.append(f'<rect x="{x}" y="170" width="300" height="16" fill="{col}"/>')
        o.append(_txt(x + 150, 166, s[f"{key}_h"], 20, 700, "#ffffff", "middle"))
        o.append(_txt(x + 20, 216, s[f"{key}_q"], 16, 700, col))
        for i, ln in enumerate(_wrap(s[f"{key}_b"], 32)[:7]):
            o.append(_txt(x + 20, 248 + i * 24, ln, 15, 400))
    o.append(f'<rect x="60" y="462" width="1080" height="76" rx="10" fill="{PALE}" stroke="{BLUE}" stroke-width="2"/>')
    for i, ln in enumerate(_wrap(s["foot_b"], 96)[:2]):
        o.append(_txt(84, 496 + i * 24, ln, 16, 400 if i else 700, INK))
    o.append(_txt(1140, 576, "mediprimer.org", 14, 400, GREY, "end"))
    return "".join(o) + "</svg>"


def render_calendar(s):
    """The Medicare year: which window is open when."""
    o = [_head(1200, 560, s["title"], s["desc"])]
    o.append(_txt(60, 58, s["title"], 30, 700))
    o.append(_txt(60, 88, s["sub"], 18, 400, MUTE))
    months = s["months"].split(",")
    x0, w = 60, 90
    for i, m in enumerate(months[:12]):
        o.append(f'<rect x="{x0 + i * w}" y="126" width="{w - 4}" height="36" fill="#f2f5f8"/>')
        o.append(_txt(x0 + i * w + (w - 4) / 2, 150, m.strip(), 15, 700, MUTE, "middle"))
    bars = [("aep", 9, 2.25, GOLD, 182), ("oep", 0, 3, BLUE, 246), ("gep", 0, 3, GREY, 310)]
    for key, start, span, col, y in bars:
        bx, bw = x0 + start * w, span * w - 4
        o.append(f'<rect x="{bx}" y="{y}" width="{bw}" height="46" rx="6" fill="{col}"/>')
        o.append(_txt(bx + 14, y + 29, s[f"{key}_h"], 16, 700, "#ffffff"))
        o.append(_txt(x0, y + 29, "", 15))
        o.append(_txt(1140, y + 29, s[f"{key}_n"], 15, 400, MUTE, "end"))
    o.append(f'<rect x="60" y="392" width="1080" height="96" rx="10" fill="{PALE}" stroke="{BLUE}" stroke-width="2"/>')
    for i, ln in enumerate(_wrap(s["foot_b"], 96)[:3]):
        o.append(_txt(84, 424 + i * 24, ln, 15, 400))
    o.append(_txt(1140, 526, "mediprimer.org", 14, 400, GREY, "end"))
    return "".join(o) + "</svg>"


DIAGRAMS = {
    "medicare-initial-enrollment-period": render_iep,
    "medicare-parts-explained": render_parts,
    "medicare-medicaid-which-program": render_which,
    "medicare-enrollment-calendar": render_calendar,
}
