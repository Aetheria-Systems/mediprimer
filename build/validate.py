#!/usr/bin/env python3
"""Safety gate for the MediPrimer weekly auto-update.
Validates the public/ tree before it is allowed to deploy. Exits non-zero
(with reasons on stderr) if anything is wrong, which tells the wrapper to
revert and skip deployment."""
import sys, os, re, glob, json

PUB = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
LANGUAGES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "build", "languages.json")
LAUNCHED_LOCALES = [l["code"] for l in json.load(open(LANGUAGES_FILE, encoding="utf-8"))["languages"]
                    if l.get("launched", False)]

# Pages that must always exist (structural integrity).
REQUIRED = [
    "index.html", "basics.html", "members.html", "professionals.html",
    "glossary.html", "state-medicaid.html", "about.html", "policy-changes.html",
    "enrollment.html", "costs.html", "choosing-coverage.html", "how-do-i.html",
    "rights.html", "getting-help.html", "caregivers.html", "member-journey.html",
    "coverage-basics.html", "plan-types.html", "cms-updates.html",
    "operations.html", "providers.html", "brokers.html", "navigators.html",
    "privacy.html", "terms-of-use.html", "disclaimer.html", "accessibility.html",
    "style.css", "glossary.js",
]

errors = []

# 1. Required files present and non-empty.
for r in REQUIRED:
    p = os.path.join(PUB, r)
    if not os.path.isfile(p):
        errors.append(f"MISSING required file: {r}")
    elif os.path.getsize(p) < 200:
        errors.append(f"SUSPICIOUSLY SMALL (<200 bytes): {r}")

html_files = sorted(glob.glob(os.path.join(PUB, "*.html")))

# 2. Per-page structural checks.
for p in html_files:
    name = os.path.basename(p)
    src = open(p, encoding="utf-8", errors="replace").read()
    low = src.lower()
    if "</html>" not in low or "<body" not in low:
        errors.append(f"{name}: not a complete HTML document")
    if '<header class="site-header">' not in src:
        errors.append(f"{name}: missing canonical header")
    if '<footer class="site-footer">' not in src:
        errors.append(f"{name}: missing canonical footer")
    if 'class="legal-links"' not in src:
        errors.append(f"{name}: missing legal-links footer row")
    if "Coverage Desk" in src:
        errors.append(f"{name}: contains forbidden 'Coverage Desk' branding")
    # crude tag-balance smell test on the main structural tags
    for tag in ("header", "footer", "main"):
        if low.count(f"<{tag}") != low.count(f"</{tag}>"):
            errors.append(f"{name}: unbalanced <{tag}> tags")

# 3. Internal links resolve to real files.
# Launched-language directories (public/es/, public/zh-Hant/, ...) are
# legitimate one-level-nested paths -- every page's switcher links to them,
# so treating any nested href as "unexpected" made this check fail on
# every single page unconditionally the moment the switcher launched
# site-wide. Real validation now: a locale-prefixed link is checked against
# that language's own directory listing, not just whitelisted blindly.
href_re = re.compile(r'href="(/[^"#]*)"')
existing = {os.path.basename(p) for p in glob.glob(os.path.join(PUB, "*"))}
existing_by_locale = {code: {os.path.basename(p) for p in glob.glob(os.path.join(PUB, code, "*"))}
                      for code in LAUNCHED_LOCALES}
IGNORE_PREFIXES = ("/library/",)  # hidden portal path, not a file
# The dead links live on the TRANSLATED pages, not the English ones: a Korean
# page links to /ko/costs.html, and if the rollout launched at 90% that file
# does not exist. Checking only public/*.html missed it entirely — /ko/costs.html
# was linked from 126 Korean pages and served a 404 (found 2026-09-21). The other
# checks in this file are English-specific (readability, dollar guardrail), so
# only the link check walks the locale directories.
link_files = list(html_files)
for code in LAUNCHED_LOCALES:
    link_files += sorted(glob.glob(os.path.join(PUB, code, "*.html")))
for p in link_files:
    name = os.path.relpath(p, PUB)
    src = open(p, encoding="utf-8", errors="replace").read()
    for href in set(href_re.findall(src)):
        if href == "/":
            continue
        if any(href.startswith(pre) for pre in IGNORE_PREFIXES):
            continue
        target = href.lstrip("/")
        if "/" in target:
            locale, _, rest = target.partition("/")
            if locale in LAUNCHED_LOCALES:
                if rest == "" or rest in existing_by_locale[locale]:
                    continue
                errors.append(f"{name}: dead internal link {href}")
                continue
            # Not a locale folder. It may still be a perfectly real asset
            # directory — /partner-kit/*.pdf, /embed/*.html, /img/*. Treating
            # every non-locale nested href as an error made the whole nightly
            # sync FATAL the moment the partner kit shipped (2026-09-18).
            # Validate what it actually is: does the file exist on disk?
            if os.path.isfile(os.path.join(PUB, target)):
                continue
            errors.append(f"{name}: dead internal link {href}")
            continue
        if target not in existing:
            errors.append(f"{name}: dead internal link {href}")

# 4. Guardrail: flag NEW real-looking program dollar thresholds outside costs.html
#    that aren't backed by a nearby official source.
#    (costs.html intentionally uses labeled illustrative examples.)
dollar_re = re.compile(r'\$[0-9]{1,3}(?:,[0-9]{3})+')
official_re = re.compile(
    r'(?:href="https?://(?:www\.)?(?:medicare|ssa|cms|hhs|medicaid)\.gov[^"]*"|<!--\s*src:\s*\S+\s*-->)')
SOURCE_WINDOW = 600  # chars on either side of the figure to look for a citation
for p in html_files:
    name = os.path.basename(p)
    if name == "costs.html":
        continue
    src = open(p, encoding="utf-8", errors="replace").read()
    unsourced = []
    for m in dollar_re.finditer(src):
        lo, hi = max(0, m.start() - SOURCE_WINDOW), m.end() + SOURCE_WINDOW
        if not official_re.search(src[lo:hi]):
            unsourced.append(m.group())
    if unsourced:
        errors.append(f"{name}: contains large $ figure(s) {sorted(set(unsourced))} "
                      f"not backed by a nearby official source link or <!-- src: URL --> "
                      f"— likely a stale program number; guardrail requires linking the official figure instead")

if errors:
    sys.stderr.write("VALIDATION FAILED:\n")
    for e in errors:
        sys.stderr.write("  - " + e + "\n")
    sys.exit(1)

print(f"VALIDATION PASSED: {len(html_files)} pages OK")
sys.exit(0)
