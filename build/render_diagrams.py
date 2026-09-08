#!/usr/bin/env python3
"""Render every diagram in every launched language to public/img/.

  render_diagrams.py                 render all diagrams x all launched langs
  render_diagrams.py --translate vi  create the vi string block (model call)

English lands in public/img/<name>.svg|png; other languages in
public/img/<code>/. PNG is what Google Images and Discover actually index,
so both are written. Idempotent: unchanged output is left alone so the
build's content hashes stay stable.
"""
import json
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import diagrams  # noqa: E402

BASE = pathlib.Path(__file__).parent.parent
IMG = BASE / "public" / "img"
STRINGS = pathlib.Path(__file__).parent / "diagram-strings.json"
LANGS = pathlib.Path(__file__).parent / "languages.json"
CLAUDE = "/home/deltaprism/.local/bin/claude"
CHROMIUM = "/usr/bin/chromium-browser"


def launched():
    langs = json.loads(LANGS.read_text(encoding="utf-8"))["languages"]
    return ["en"] + [l["code"] for l in langs if l.get("launched")]


def out_dir(code):
    return IMG if code == "en" else IMG / code


def render_png(svg_path, png_path, w, h):
    """Chromium renders the SVG exactly as a browser would, including the
    CJK font fallbacks; ImageMagick's SVG support does not."""
    try:
        subprocess.run(
            [CHROMIUM, "--headless", "--disable-gpu", "--no-sandbox",
             f"--screenshot={png_path}", f"--window-size={w},{h}",
             "--default-background-color=ffffff", "--hide-scrollbars",
             str(svg_path)],
            check=True, capture_output=True, timeout=180)
        return png_path.exists()
    except Exception as e:
        print(f"  PNG render failed for {png_path.name}: {e}", file=sys.stderr)
        return False


def size_of(svg):
    import re
    m = re.search(r'width="(\d+)" height="(\d+)"', svg)
    return (int(m.group(1)), int(m.group(2))) if m else (1200, 600)


def translate_block(code):
    """Ask a cheap model for one language's label block, English as source."""
    data = json.loads(STRINGS.read_text(encoding="utf-8"))
    src = {k: v["en"] for k, v in data.items() if not k.startswith("_")}
    name = code
    try:
        for l in json.loads(LANGS.read_text(encoding="utf-8"))["languages"]:
            if l["code"] == code:
                name = l["name"]
    except Exception:
        pass
    prompt = (
        f"Translate these UI labels for explanatory Medicare diagrams into {name} "
        f"({code}). Plain, warm, everyday language for older adults and caregivers.\n"
        "RULES: keep JSON structure and every key exactly; translate only values; "
        "keep 'Medicare', 'Medicaid', 'Medicare Advantage', 'ESRD', 'ALS' and part "
        "letters (A, B, C, D) as-is; keep labels SHORT — they sit in fixed-width "
        "boxes, so do not exceed the English length by much; never invent facts or "
        "change numbers/dates.\n"
        "Output ONLY the JSON object, no commentary.\n\n"
        + json.dumps(src, ensure_ascii=False, indent=1))
    r = subprocess.run([CLAUDE, "--model", "sonnet", "-p", prompt, "--allowedTools", ""],
                       capture_output=True, text=True, timeout=900)
    txt = r.stdout.strip()
    if txt.startswith("```"):
        txt = txt.split("```")[1].lstrip("json").strip()
    try:
        block = json.loads(txt)
    except Exception as e:
        print(f"translate: model did not return valid JSON for {code}: {e}", file=sys.stderr)
        return False
    missing = []
    for dkey, en in src.items():
        got = block.get(dkey, {})
        for k in en:
            if k not in got or not str(got[k]).strip():
                missing.append(f"{dkey}.{k}")
    if missing:
        print(f"translate: incomplete block for {code}: {missing[:6]}", file=sys.stderr)
        return False
    for dkey in src:
        data[dkey][code] = block[dkey]
    STRINGS.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"translate: added {code} strings for {len(src)} diagram(s)")
    return True


def localize_img_srcs():
    """Point each translated page at its own language's diagrams.

    translate.py preserves HTML structure verbatim, so a Spanish page keeps
    the English <img src="/img/foo.png">. Rewrite those to /img/es/foo.png
    when that file exists (and leave them alone when it doesn't, so a
    half-rendered language never produces broken images).
    """
    import re
    changed = 0
    for code in launched():
        if code == "en":
            continue
        d = BASE / "public" / code
        if not d.is_dir():
            continue
        for page in d.glob("*.html"):
            html = page.read_text(encoding="utf-8")

            def fix(m):
                name, ext = m.group(1), m.group(2)
                if (IMG / code / f"{name}.{ext}").exists():
                    return f'"/img/{code}/{name}.{ext}"'
                return m.group(0)

            new_html = re.sub(r'"/img/([a-z0-9-]+)\.(svg|png)"', fix, html)
            if new_html != html:
                page.write_text(new_html, encoding="utf-8")
                changed += 1
    if changed:
        print(f"diagrams: localized image srcs on {changed} translated page(s)")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--localize":
        localize_img_srcs()
        return
    if len(sys.argv) > 2 and sys.argv[1] == "--translate":
        sys.exit(0 if translate_block(sys.argv[2]) else 1)

    data = json.loads(STRINGS.read_text(encoding="utf-8"))
    made = skipped = 0
    for code in launched():
        d = out_dir(code)
        d.mkdir(parents=True, exist_ok=True)
        for name, fn in diagrams.DIAGRAMS.items():
            block = data.get(name, {}).get(code)
            if not block:
                skipped += 1
                continue
            svg = fn(block)
            svg_path, png_path = d / f"{name}.svg", d / f"{name}.png"
            if svg_path.exists() and svg_path.read_text(encoding="utf-8") == svg and png_path.exists():
                continue
            svg_path.write_text(svg, encoding="utf-8")
            w, h = size_of(svg)
            render_png(svg_path, png_path, w, h)
            made += 1
    print(f"diagrams: rendered {made}, skipped {skipped} (no strings for that language)")
    localize_img_srcs()


if __name__ == "__main__":
    main()
