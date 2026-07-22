#!/usr/bin/env python3
"""Rewrite the canonical <header>/<footer> on every MediPrimer page.
Guarantees byte-identical chrome + correct active nav across the whole site."""
import re, os, glob, json
from i18n_chrome import switcher_html
from i18n_lib import get_launched_codes

BUILD_DIR = os.path.dirname(__file__)
PUB = os.path.join(os.path.dirname(BUILD_DIR), "public")

# Load languages to determine which are launched
LANGUAGES = json.load(open(os.path.join(BUILD_DIR, "languages.json"), encoding="utf-8"))

# (href, label, active-key, menu-key or None)
# Members-first: the member journey leads; "For Professionals" is a secondary
# door near the end. "Start Here" (the Turning 65 walkthrough) is the front door.
NAV = [
    ("/", "Home", "home", None),
    ("/turning-65.html", "Start Here", "members", "members"),
    ("/basics.html", "Learn the Basics", "basics", "basics"),
    ("/directories.html", "Find Help", "directories", "dirs"),
    ("/glossary.html", "Glossary", "glossary", None),
    ("/professionals.html", "For Professionals", "professionals", "pros"),
    ("/about.html", "About", "about", None),
]

# Dropdown contents per hub. (href, label, starred)
MENUS = {
    "basics": [
        ("/coverage-basics.html", "Coverage Basics", False),
        ("/plan-types.html", "Plan Types", False),
        ("/medigap.html", "Medigap Plans", False),
        ("/medicare-advantage.html", "Medicare Advantage", False),
        ("/marketplace.html", "The Marketplace (ACA)", False),
        ("/cms-updates.html", "How Programs Are Governed", False),
        ("/policy-changes.html", "Policy & Rule Changes", False),
        ("/basics.html", "All Basics →", False),
    ],
    "members": [
        ("/turning-65.html", "★ Turning 65: Start Here", True),
        ("/planning-for-two.html", "Medicare for Couples", False),
        ("/choosing-coverage.html", "Choosing Coverage", False),
        ("/costs.html", "Understanding Your Costs", False),
        ("/enrollment.html", "Enrollment & Deadlines", False),
        ("/getting-help.html", "Getting Help Paying", False),
        ("/questions-to-ask.html", "Questions to Ask", False),
        ("/edge-cases.html", "Edge Cases & Complications", False),
        ("/members.html", "All Member guides →", False),
    ],
    "pros": [
        ("/operations.html", "Health-Plan Operations", False),
        ("/providers.html", "Providers & Billing", False),
        ("/brokers.html", "Brokers & Advisors", False),
        ("/navigators.html", "Case Managers & Navigators", False),
        ("/star-ratings.html", "Star Ratings & Quality", False),
        ("/appeals-timelines.html", "Appeals: Levels & Timelines", False),
        ("/professionals.html", "All Professional refs →", False),
    ],
    "dirs": [
        ("/state-medicaid.html", "State Medicaid", False),
        ("/ship-directory.html", "SHIP (Medicare help)", False),
        ("/insurance-departments.html", "Insurance Departments", False),
        ("/resources.html", "All Resources", False),
        ("/checklists.html", "Printable Checklists", False),
        ("/directories.html", "Directories home →", False),
    ],
}

def _esc(s):
    return s.replace("&", "&amp;")

ACTIVE = {
    "index.html": "home",
    # The Basics + program deep-dives
    "basics.html": "basics", "coverage-basics.html": "basics", "plan-types.html": "basics",
    "cms-updates.html": "basics", "policy-changes.html": "basics",
    "medicare-part-a.html": "basics", "medicare-part-b.html": "basics",
    "medicare-advantage.html": "basics", "medicare-part-d.html": "basics",
    "medigap.html": "basics", "medicaid-eligibility.html": "basics",
    "marketplace.html": "basics", "chip.html": "basics",
    # For Members + life events + tools
    "members.html": "members", "enrollment.html": "members", "costs.html": "members",
    "choosing-coverage.html": "members", "how-do-i.html": "members", "rights.html": "members",
    "getting-help.html": "members", "caregivers.html": "members", "member-journey.html": "members",
    "turning-65.html": "members", "retiring-losing-coverage.html": "members",
    "planning-for-two.html": "members",
    "disability-medicare.html": "members", "working-past-65.html": "members",
    "dual-eligible.html": "members", "moving-states.html": "members",
    "veterans-medicare.html": "members", "edge-cases.html": "members", "questions-to-ask.html": "members",
    "checklists.html": "members", "enrollment-calendar.html": "members",
    "medicaid-starting-out.html": "members", "using-plan-finder.html": "members", "common-mistakes.html": "members",
    # For Professionals + pro depth
    "professionals.html": "professionals", "operations.html": "professionals",
    "providers.html": "professionals", "brokers.html": "professionals",
    "navigators.html": "professionals", "star-ratings.html": "professionals",
    "risk-adjustment.html": "professionals", "appeals-timelines.html": "professionals",
    "claims-coding.html": "professionals",
    # Directories + reference utilities
    "directories.html": "directories", "state-medicaid.html": "directories",
    "ship-directory.html": "directories", "insurance-departments.html": "directories",
    "resources.html": "directories",
    "glossary.html": "glossary",
    "about.html": "about",
    # Legal pages: no active main-nav item
    "privacy.html": None, "terms-of-use.html": None,
    "disclaimer.html": None, "accessibility.html": None, "editorial-standards.html": None,
    "support.html": None, "site-map.html": None,
}

def header(active_key, page_name):
    items = []
    for href, label, key, menu in NAV:
        active = " active" if key == active_key else ""
        if menu:
            links = "".join(
                '\n        <a href="%s"%s>%s</a>' % (h, ' class="star"' if star else "", _esc(l))
                for h, l, star in MENUS[menu]
            )
            items.append(
                '      <div class="navitem has-menu">\n'
                '        <a href="%s" class="navtop%s">%s</a>'
                '<button type="button" class="menu-caret" aria-expanded="false" aria-label="Open %s menu">▾</button>\n'
                '        <div class="dropdown">%s\n        </div>\n'
                "      </div>" % (href, active, _esc(label), _esc(label), links)
            )
        else:
            items.append('      <a href="%s" class="navtop%s">%s</a>' % (href, active, _esc(label)))
    nav = "\n".join(items)
    switcher = switcher_html("en", page_name, LANGUAGES)
    switcher_html_str = f"\n    {switcher}" if switcher else ""
    header_html = ('<header class="site-header">\n  <div class="wrap">\n'
                   '    <a class="brand" href="/"><span class="mark">MP</span> MediPrimer</a>' + switcher_html_str + '\n'
                   '    <button type="button" class="nav-toggle" aria-expanded="false" aria-label="Menu">☰</button>\n'
                   '    <nav class="main">\n' + nav + '\n    </nav>\n  </div>\n</header>')

    # Dormant rule: emit MP_LANGS + lang-suggest.js only if at least one language is launched
    launched = get_launched_codes(LANGUAGES)
    if launched:
        # Build object mapping language codes to banner text
        # Each launched language must have ui.banner field; missing = config error
        langs_dict = {}
        for lang in LANGUAGES.get("languages", []):
            if lang.get("launched", False):
                code = lang.get("code")
                banner_text = lang.get("ui", {}).get("banner")
                if not banner_text:
                    raise SystemExit(
                        f"normalize.py: launched language {code} missing ui.banner in languages.json"
                    )
                langs_dict[code] = banner_text

        langs_json = json.dumps(langs_dict, ensure_ascii=False)
        header_html = (f'<script>window.MP_LANGS={langs_json};</script>\n'
                       f'<script src="/lang-suggest.js" defer></script>\n' + header_html)

    return header_html

FOOTER = '''<footer class="site-footer">
  <div class="wrap">
    <div class="footcols">
      <div>
        <h4>The Basics</h4>
        <ul>
          <li><a href="/coverage-basics.html">Coverage Basics</a></li>
          <li><a href="/plan-types.html">Plan Types</a></li>
          <li><a href="/medigap.html">Medigap Plans</a></li>
          <li><a href="/policy-changes.html">Policy &amp; Rule Changes</a></li>
          <li><a href="/glossary.html">Glossary</a></li>
        </ul>
      </div>
      <div>
        <h4>For Members</h4>
        <ul>
          <li><a href="/enrollment.html">Enrollment &amp; Deadlines</a></li>
          <li><a href="/costs.html">Understanding Your Costs</a></li>
          <li><a href="/choosing-coverage.html">Choosing Coverage</a></li>
          <li><a href="/getting-help.html">Getting Help Paying</a></li>
          <li><a href="/turning-65.html">Turning 65</a></li>
        </ul>
      </div>
      <div>
        <h4>For Professionals</h4>
        <ul>
          <li><a href="/operations.html">Health-Plan Operations</a></li>
          <li><a href="/providers.html">Providers &amp; Billing</a></li>
          <li><a href="/brokers.html">Brokers &amp; Advisors</a></li>
          <li><a href="/navigators.html">Case Managers &amp; Navigators</a></li>
        </ul>
      </div>
      <div>
        <h4>Directories &amp; Tools</h4>
        <ul>
          <li><a href="/state-medicaid.html">State Medicaid</a></li>
          <li><a href="/ship-directory.html">SHIP (Medicare help)</a></li>
          <li><a href="/insurance-departments.html">Insurance Departments</a></li>
          <li><a href="/resources.html">All Resources</a></li>
          <li><a href="/checklists.html">Printable Checklists</a></li>
        </ul>
      </div>
      <div>
        <h4>Official sources</h4>
        <ul>
          <li><a href="https://www.medicare.gov/" rel="noopener">Medicare.gov</a></li>
          <li><a href="https://www.medicaid.gov/" rel="noopener">Medicaid.gov</a></li>
          <li><a href="https://www.cms.gov/" rel="noopener">CMS.gov</a></li>
          <li><a href="https://www.healthcare.gov/" rel="noopener">HealthCare.gov</a></li>
        </ul>
      </div>
    </div>
    <p class="disclaimer">Independent educational resource. Not affiliated with CMS, Medicare, Medicaid, any state agency, or any health insurance company. Information is general and should be verified through official program and plan materials. Nothing here is medical, legal, or financial advice, and no page recommends a specific plan. Content last reviewed July 2026.</p>
    <nav class="legal-links">
      <a href="/privacy.html">Privacy</a>
      <a href="/terms-of-use.html">Terms of Use</a>
      <a href="/disclaimer.html">Disclaimer</a>
      <a href="/accessibility.html">Accessibility</a>
      <a href="/editorial-standards.html">Editorial Standards</a>
      <a href="/support.html">Support</a>
      <a href="/site-map.html">Site Map</a>
    </nav>
  </div>
</footer>'''

HEADER_RE = re.compile(r'<header class="site-header">.*?</header>', re.DOTALL)
FOOTER_RE = re.compile(r'<footer class="site-footer">.*?</footer>', re.DOTALL)

changed, skipped = [], []
for path in sorted(glob.glob(os.path.join(PUB, "*.html"))):
    name = os.path.basename(path)
    if name not in ACTIVE:
        skipped.append(name + " (NOT IN MAP)"); continue
    src = open(path, encoding="utf-8").read()
    if not HEADER_RE.search(src) or not FOOTER_RE.search(src):
        skipped.append(name + " (missing header/footer)"); continue
    out = HEADER_RE.sub(lambda m: header(ACTIVE[name], name), src, count=1)
    out = FOOTER_RE.sub(lambda m: FOOTER, out, count=1)
    # Inject the site-wide glossary-tooltip script (single source of definitions),
    # everywhere except the glossary page itself.
    if name != "glossary.html" and "glossary-tooltips.js" not in out:
        out = out.replace("</body>", '<script src="/glossary-tooltips.js"></script>\n</body>', 1)
    # Nav dropdown/mobile behavior — on every page (nav is everywhere).
    if "nav-menu.js" not in out:
        out = out.replace("</body>", '<script src="/nav-menu.js"></script>\n</body>', 1)
    # Help bot chat widget (gated behind ?mp_bot=1 query param for pre-launch testing).
    if "chatbot.js" not in out:
        out = out.replace("</body>", '<script src="/chatbot.js" defer></script>\n</body>', 1)
    if out != src:
        open(path, "w", encoding="utf-8").write(out); changed.append(name)

print("CHANGED:", len(changed))
if skipped:
    print("SKIPPED/PROBLEM:")
    for s in skipped: print("  ", s)
