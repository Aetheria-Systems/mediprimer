#!/usr/bin/env python3
"""Build-time partials for MediPrimer. Replaces each `<!--P:name-->` marker (and
any previously-assembled block after it) with the current partials/<name>.html.
Idempotent: safe to re-run. Define a shared component once; it propagates.

Language-dir pages (public/<code>/*.html) use partials/<code>/<name>.html when
it exists (a localized override, e.g. translated visible prose), falling back
to the shared English partials/<name>.html for language-agnostic partials
(e.g. the analytics snippet) that have no per-language variant."""
import re, os, glob
PUB = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
PART = os.path.join(os.path.dirname(__file__), "partials")

partials = {}
for p in glob.glob(os.path.join(PART, "*.html")):
    partials[os.path.basename(p)[:-5]] = open(p, encoding="utf-8").read().rstrip("\n")


def partial_body(name, lang_code):
    """Localized partials/<lang_code>/<name>.html if present, else the shared default."""
    if lang_code:
        localized_path = os.path.join(PART, lang_code, name + ".html")
        if os.path.exists(localized_path):
            return open(localized_path, encoding="utf-8").read().rstrip("\n")
    return partials[name]


changed = 0
# Process top-level pages and language-dir pages
for path in glob.glob(os.path.join(PUB, "*.html")) + glob.glob(os.path.join(PUB, "*/*.html")):
    rel = os.path.relpath(path, PUB)
    lang_code = os.path.dirname(rel) or None  # e.g. "es" for public/es/foo.html, None for top-level
    src = open(path, encoding="utf-8").read()
    out = src
    for name in partials:
        marker = "<!--P:%s-->" % name
        block = re.compile(re.escape(marker) + r"(?:.*?<!--/P:%s-->)?" % re.escape(name), re.DOTALL)
        if marker in out:
            body = partial_body(name, lang_code)
            out = block.sub(marker + "\n" + body + "\n<!--/P:%s-->" % name, out)
    if out != src:
        open(path, "w", encoding="utf-8").write(out); changed += 1
print("assemble: updated", changed, "file(s); partials:", ", ".join(sorted(partials)))
