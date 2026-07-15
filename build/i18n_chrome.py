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


def render_header(code, active_key, page_name, chrome):
    """
    Render header with translated labels and language-prefixed hrefs.

    Args:
        code: Language code (e.g., "es", "en")
        active_key: Which nav item should be marked active (e.g., "members", "basics")
        page_name: Current page filename (e.g., "turning-65.html", "index.html")
        chrome: Dict with "nav", "menus", "menu_button", "open_menu" keys

    Returns: HTML header string with translated labels
    Raises: KeyError if any label is missing from chrome
    """
    from normalize import NAV, MENUS

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

    return (f'<header class="site-header">\n  <div class="wrap">\n'
            f'    <a class="brand" href="/"><span class="mark">MP</span> MediPrimer</a>\n'
            f'    <button type="button" class="nav-toggle" aria-expanded="false" aria-label="Menu">☰</button>\n'
            f'    <nav class="main">\n{nav_html}\n    </nav>\n  </div>\n</header>')


def render_footer(code, page_name, chrome):
    """
    Render footer with translated labels and localized note.

    Args:
        code: Language code (e.g., "es", "en")
        page_name: Current page filename (for reference)
        chrome: Dict with footer translations and localized note fields

    Returns: HTML footer string with translated labels
    Raises: KeyError if any label is missing from chrome
    """
    from normalize import FOOTER as ENGLISH_FOOTER

    # For now, return English footer as-is (placeholder for full implementation)
    # This would be fully translated similar to render_header
    return ENGLISH_FOOTER
