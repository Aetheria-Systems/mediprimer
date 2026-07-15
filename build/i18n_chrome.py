#!/usr/bin/env python3
"""Per-language chrome renderer and language switcher for MediPrimer."""
import re
import json
import os


def _esc(s):
    """Escape ampersands for HTML."""
    return s.replace("&", "&amp;")


def _prefix_href(href, code):
    """Prefix internal href with language code if not English."""
    if code == "en":
        return href
    if href.startswith("/"):
        # Home link: / → /es/
        if href == "/":
            return f"/{code}/"
        # Other internal links: /foo.html → /es/foo.html
        return f"/{code}{href}"
    # External links: return as-is
    return href


def switcher_html(current_code, page_name, languages):
    """
    Render language switcher dropdown.

    Returns empty string if no languages are launched.
    Otherwise returns <div class="lang-switch"> with entries for English + launched languages,
    each linking to counterpart URL for page_name, current language marked aria-current.
    Deterministic ordering: en first, then languages.json order.
    """
    launched = [lang for lang in languages.get("languages", []) if lang.get("launched", False)]

    if not launched:
        return ""

    # Build list of options: English first, then launched languages
    options = []

    # English
    en_href = f"/{page_name}" if page_name != "index.html" else "/"
    en_current = ' aria-current="page"' if current_code == "en" else ""
    options.append(f'<a href="{en_href}" lang="en"{en_current}>English</a>')

    # Other launched languages
    for lang in launched:
        code = lang["code"]
        native_name = lang.get("native", lang.get("name", code))

        # Build href for this language
        if page_name == "index.html":
            href = f"/{code}/"
        else:
            href = f"/{code}/{page_name}"

        is_current = ' aria-current="page"' if current_code == code else ""
        options.append(f'<a href="{href}" lang="{code}"{is_current}>{_esc(native_name)}</a>')

    # Join into dropdown
    links = "\n    ".join(options)
    return f'''<div class="lang-switch">
    {links}
  </div>'''


def render_header(code, active_key, page_name, chrome, languages=None):
    """
    Render header with translated labels, language-prefixed hrefs, and embedded switcher.

    Args:
        code: Language code (e.g., "es", "en")
        active_key: Which nav item should be marked active (e.g., "members", "basics")
        page_name: Current page filename (e.g., "turning-65.html", "index.html")
        chrome: Dict with "nav", "menus", "menu_button", "open_menu" keys
        languages: Dict with languages list (if None, loaded internally; avoid circular import)

    Returns: HTML header string with translated labels, switcher, and language-prefixed hrefs
    Raises: KeyError if any label is missing from chrome
    """
    # Import inside function to avoid circular dependency with normalize.py
    from normalize import NAV, MENUS
    if languages is None:
        languages = json.load(open(os.path.join(os.path.dirname(__file__), "languages.json"), encoding="utf-8"))

    # Verify all labels are in chrome before rendering
    for href, label, key, menu_key in NAV:
        if label not in chrome["nav"]:
            raise KeyError(f"Missing translation for nav label: {label}")
        if menu_key:
            for menu_href, menu_label, starred in MENUS[menu_key]:
                if menu_label not in chrome["menus"]:
                    raise KeyError(f"Missing translation for menu label: {menu_label}")

    nav_items = []
    for href, label, key, menu_key in NAV:
        active_class = " active" if key == active_key else ""
        translated_label = chrome["nav"][label]
        prefixed_href = _prefix_href(href, code)

        if menu_key:
            # Render dropdown menu
            menu_button_text = chrome["open_menu"]  # "Abrir menú de"
            menu_links = []
            for menu_href, menu_label, starred in MENUS[menu_key]:
                translated_menu_label = chrome["menus"][menu_label]
                prefixed_menu_href = _prefix_href(menu_href, code)
                star_class = ' class="star"' if starred else ""
                menu_links.append(
                    f'\n        <a href="{prefixed_menu_href}"{star_class}>{_esc(translated_menu_label)}</a>'
                )
            menu_html = "".join(menu_links) + "\n        "

            nav_items.append(
                f'      <div class="navitem has-menu">\n'
                f'        <a href="{prefixed_href}" class="navtop{active_class}">{_esc(translated_label)}</a>'
                f'<button type="button" class="menu-caret" aria-expanded="false" aria-label="{_esc(menu_button_text)} {_esc(translated_label)}">▾</button>\n'
                f'        <div class="dropdown">{menu_html}</div>\n'
                f'      </div>'
            )
        else:
            nav_items.append(
                f'      <a href="{prefixed_href}" class="navtop{active_class}">{_esc(translated_label)}</a>'
            )

    nav_html = "\n".join(nav_items)

    # Embed switcher after brand anchor
    switcher = switcher_html(code, page_name, languages)
    switcher_html_str = f"\n    {switcher}" if switcher else ""

    # Prefix brand href for non-English (Critical 2)
    brand_href = _prefix_href("/", code)

    return (f'<header class="site-header">\n  <div class="wrap">\n'
            f'    <a class="brand" href="{brand_href}"><span class="mark">MP</span> MediPrimer</a>{switcher_html_str}\n'
            f'    <button type="button" class="nav-toggle" aria-expanded="false" aria-label="Menu">☰</button>\n'
            f'    <nav class="main">\n{nav_html}\n    </nav>\n  </div>\n</header>')


def render_footer(code, page_name, chrome, languages=None):
    """
    Render footer with translated labels and localized note.

    Args:
        code: Language code (e.g., "es", "en")
        page_name: Current page filename (for reference)
        chrome: Dict with footer_headings, footer_links, and localized note fields
        languages: Dict with languages list; if None, loaded internally

    Returns: HTML footer string with translated labels and localized note
    Raises: KeyError if any label is missing from chrome
    """
    # Import inside function to avoid circular dependency with normalize.py
    if languages is None:
        languages = json.load(open(os.path.join(os.path.dirname(__file__), "languages.json"), encoding="utf-8"))

    # Map of section headings to translate
    heading_labels = {
        "The Basics": "footer_headings",
        "For Members": "footer_headings",
        "For Professionals": "footer_headings",
        "Directories & Tools": "footer_headings",
        "Official sources": "footer_headings"
    }

    # Verify all footer labels are in chrome
    for label in heading_labels.keys():
        if label not in chrome.get("footer_headings", {}):
            raise KeyError(f"Missing translation for footer heading: {label}")

    # Footer link labels to check
    footer_link_labels = [
        "Coverage Basics", "Plan Types", "Medigap Plans", "Policy & Rule Changes", "Glossary",
        "Enrollment & Deadlines", "Understanding Your Costs", "Choosing Coverage", "Getting Help Paying",
        "Turning 65", "Health-Plan Operations", "Providers & Billing", "Brokers & Advisors",
        "Case Managers & Navigators", "State Medicaid", "SHIP (Medicare help)", "Insurance Departments",
        "All Resources", "Printable Checklists", "Medicare.gov", "Medicaid.gov", "CMS.gov", "HealthCare.gov",
        "Privacy", "Terms of Use", "Disclaimer", "Accessibility", "Editorial Standards", "Support", "Site Map"
    ]

    for label in footer_link_labels:
        if label not in chrome.get("footer_links", {}):
            raise KeyError(f"Missing translation for footer link: {label}")

    # Build footer sections with translated labels
    # Section 1: The Basics
    basics_heading = chrome["footer_headings"]["The Basics"]
    basics_links = [
        ("Coverage Basics", "/coverage-basics.html"),
        ("Plan Types", "/plan-types.html"),
        ("Medigap Plans", "/medigap.html"),
        ("Policy & Rule Changes", "/policy-changes.html"),
        ("Glossary", "/glossary.html"),
    ]
    basics_html = f'      <div>\n        <h4>{_esc(basics_heading)}</h4>\n        <ul>\n'
    for label, href in basics_links:
        translated = chrome["footer_links"][label]
        prefixed_href = _prefix_href(href, code)
        basics_html += f'          <li><a href="{prefixed_href}">{_esc(translated)}</a></li>\n'
    basics_html += '        </ul>\n      </div>'

    # Section 2: For Members
    members_heading = chrome["footer_headings"]["For Members"]
    members_links = [
        ("Enrollment & Deadlines", "/enrollment.html"),
        ("Understanding Your Costs", "/costs.html"),
        ("Choosing Coverage", "/choosing-coverage.html"),
        ("Getting Help Paying", "/getting-help.html"),
        ("Turning 65", "/turning-65.html"),
    ]
    members_html = f'      <div>\n        <h4>{_esc(members_heading)}</h4>\n        <ul>\n'
    for label, href in members_links:
        translated = chrome["footer_links"][label]
        prefixed_href = _prefix_href(href, code)
        members_html += f'          <li><a href="{prefixed_href}">{_esc(translated)}</a></li>\n'
    members_html += '        </ul>\n      </div>'

    # Section 3: For Professionals
    pros_heading = chrome["footer_headings"]["For Professionals"]
    pros_links = [
        ("Health-Plan Operations", "/operations.html"),
        ("Providers & Billing", "/providers.html"),
        ("Brokers & Advisors", "/brokers.html"),
        ("Case Managers & Navigators", "/navigators.html"),
    ]
    pros_html = f'      <div>\n        <h4>{_esc(pros_heading)}</h4>\n        <ul>\n'
    for label, href in pros_links:
        translated = chrome["footer_links"][label]
        prefixed_href = _prefix_href(href, code)
        pros_html += f'          <li><a href="{prefixed_href}">{_esc(translated)}</a></li>\n'
    pros_html += '        </ul>\n      </div>'

    # Section 4: Directories & Tools
    dirs_heading = chrome["footer_headings"]["Directories & Tools"]
    dirs_links = [
        ("State Medicaid", "/state-medicaid.html"),
        ("SHIP (Medicare help)", "/ship-directory.html"),
        ("Insurance Departments", "/insurance-departments.html"),
        ("All Resources", "/resources.html"),
        ("Printable Checklists", "/checklists.html"),
    ]
    dirs_html = f'      <div>\n        <h4>{_esc(dirs_heading)}</h4>\n        <ul>\n'
    for label, href in dirs_links:
        translated = chrome["footer_links"][label]
        prefixed_href = _prefix_href(href, code)
        dirs_html += f'          <li><a href="{prefixed_href}">{_esc(translated)}</a></li>\n'
    dirs_html += '        </ul>\n      </div>'

    # Section 5: Official sources
    official_heading = chrome["footer_headings"]["Official sources"]
    official_links = [
        ("Medicare.gov", "https://www.medicare.gov/"),
        ("Medicaid.gov", "https://www.medicaid.gov/"),
        ("CMS.gov", "https://www.cms.gov/"),
        ("HealthCare.gov", "https://www.healthcare.gov/"),
    ]
    official_html = f'      <div>\n        <h4>{_esc(official_heading)}</h4>\n        <ul>\n'
    for label, href in official_links:
        translated = chrome["footer_links"][label]
        official_html += f'          <li><a href="{href}" rel="noopener">{_esc(translated)}</a></li>\n'
    official_html += '        </ul>\n      </div>'

    # Disclaimer text (English only, as per normalize.py)
    disclaimer = '<p class="disclaimer">Independent educational resource. Not affiliated with CMS, Medicare, Medicaid, any state agency, or any health insurance company. Information is general and should be verified through official program and plan materials. Nothing here is medical, legal, or financial advice, and no page recommends a specific plan. Content last reviewed July 2026.</p>'

    # Legal links
    legal_links_list = [
        ("Privacy", "/privacy.html"),
        ("Terms of Use", "/terms-of-use.html"),
        ("Disclaimer", "/disclaimer.html"),
        ("Accessibility", "/accessibility.html"),
        ("Editorial Standards", "/editorial-standards.html"),
        ("Support", "/support.html"),
        ("Site Map", "/site-map.html"),
    ]
    legal_links_html = '    <nav class="legal-links">\n'
    for label, href in legal_links_list:
        translated = chrome["footer_links"][label]
        prefixed_href = _prefix_href(href, code)
        legal_links_html += f'      <a href="{prefixed_href}">{_esc(translated)}</a>\n'
    legal_links_html += '    </nav>'

    # Build localized note (appended inside footer wrap) - Critical 3
    note_html = ""
    if code != "en":
        # Find UI strings for this language
        ui_strings = {}
        for lang in languages.get("languages", []):
            if lang.get("code") == code:
                ui_strings = lang.get("ui", {})
                official_url = lang.get("official_url", "")
                break

        if ui_strings:
            note_text = ui_strings.get("note", "")
            note_english_link_text = ui_strings.get("note_english_link", "")
            note_official_text = ui_strings.get("note_official", "")

            if note_text or note_english_link_text or note_official_text:
                note_html = '    <div class="note">\n'
                if note_text:
                    note_html += f'      <p>{_esc(note_text)}</p>\n'
                note_html += '      <p>\n'
                if note_english_link_text:
                    note_html += f'        <a href="/{page_name}">{_esc(note_english_link_text)}</a>\n'
                if note_official_text and official_url:
                    note_html += f'        <a href="{official_url}" rel="noopener">{_esc(note_official_text)}</a>\n'
                note_html += '      </p>\n'
                note_html += '    </div>\n'

    return (f'<footer class="site-footer">\n  <div class="wrap">\n'
            f'    <div class="footcols">\n{basics_html}\n{members_html}\n{pros_html}\n{dirs_html}\n{official_html}\n'
            f'    </div>\n{disclaimer}\n{legal_links_html}\n{note_html}'
            f'  </div>\n</footer>')
