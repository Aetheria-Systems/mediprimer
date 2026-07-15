#!/usr/bin/env python3
"""Build-time partials for MediPrimer. Replaces each `<!--P:name-->` marker (and
any previously-assembled block after it) with the current partials/<name>.html.
Idempotent: safe to re-run. Define a shared component once; it propagates."""
import re, os, glob
PUB = "/home/deltaprism/mediprimer/public"
PART = os.path.join(os.path.dirname(__file__), "partials")

partials = {}
for p in glob.glob(os.path.join(PART, "*.html")):
    partials[os.path.basename(p)[:-5]] = open(p, encoding="utf-8").read().rstrip("\n")

changed = 0
# Process top-level pages and language-dir pages
for path in glob.glob(os.path.join(PUB, "*.html")) + glob.glob(os.path.join(PUB, "*/*.html")):
    src = open(path, encoding="utf-8").read()
    out = src
    for name, body in partials.items():
        marker = "<!--P:%s-->" % name
        block = re.compile(re.escape(marker) + r"(?:.*?<!--/P:%s-->)?" % re.escape(name), re.DOTALL)
        if marker in out:
            out = block.sub(marker + "\n" + body + "\n<!--/P:%s-->" % name, out)
    if out != src:
        open(path, "w", encoding="utf-8").write(out); changed += 1
print("assemble: updated", changed, "file(s); partials:", ", ".join(sorted(partials)))
