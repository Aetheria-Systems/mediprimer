#!/usr/bin/env python3
"""i18n_lib — page splitter and protection vault for multilingual content.

Splits MediPrimer pages into translatable segments (head, header, main, footer)
and protects non-translatable content (scripts, styles, comments, URLs) with
opaque vault tokens using the ⟦Pn⟧ format. Round-trip byte-identical.
"""
import re


def get_launched_codes(languages):
    """
    Extract list of launched language codes from languages dict.

    Args:
        languages: Dict with "languages" key containing list of language configs

    Returns:
        list: Codes (e.g., ["es", "zh"]) in languages.json order, empty if none launched
    """
    launched = []
    for lang in languages.get("languages", []):
        if lang.get("launched", False):
            launched.append(lang.get("code"))
    return launched


def split_page(html):
    """Split HTML into canonical segments.

    Args:
        html (str): Full HTML document.

    Returns:
        dict: Keys 'head' (up to and including <body>), 'header' (site-header block),
              'main' (between header and footer), 'footer' (site-footer to </html>).

    Raises:
        ValueError: If any required marker (<header class="site-header">,
                    <footer class="site-footer">) is missing.
    """
    # Fail fast: require canonical markers
    if '<header class="site-header">' not in html:
        raise ValueError("Missing required <header class=\"site-header\"> marker")
    if '<footer class="site-footer">' not in html:
        raise ValueError("Missing required <footer class=\"site-footer\"> marker")

    # Find positions in the full HTML
    body_tag_pos = html.find("<body>")
    if body_tag_pos == -1:
        raise ValueError("Missing <body> tag")
    body_tag_end = body_tag_pos + len("<body>")

    # head includes everything up to and including <body>
    head = html[:body_tag_end]

    # Rest of body content (after <body>)
    body_content = html[body_tag_end:]

    # Find header and footer positions in body_content
    header_start = body_content.find('<header class="site-header">')
    if header_start == -1:
        raise ValueError("Missing required <header class=\"site-header\"> marker")
    header_end = body_content.find("</header>")
    if header_end == -1:
        raise ValueError("Missing </header> tag")
    header_end += len("</header>")

    # Use rfind() to find the LAST occurrence of footer (canonical chrome at end)
    footer_start = body_content.rfind('<footer class="site-footer">')
    if footer_start == -1:
        raise ValueError("Missing required <footer class=\"site-footer\"> marker")
    footer_end = body_content.find("</html>")
    if footer_end == -1:
        raise ValueError("Missing </html> tag")
    footer_end = len(body_content)  # Include everything to the end (trailing whitespace)

    # Extract segments
    # Header includes everything from after <body> up to and including </header>
    # This preserves whitespace/newlines before <header class="site-header">
    header = body_content[:header_end]
    main = body_content[header_end:footer_start]
    footer = body_content[footer_start:footer_end]

    return {
        "head": head,
        "header": header,
        "main": main,
        "footer": footer,
    }


_ASSET_EXT_RE = re.compile(r'\.(css|js|xml|json|ico|png|jpe?g|svg|gif|webp|txt|pdf)(\?|#|$)', re.IGNORECASE)


def localize_href(value, code):
    """Prefix an internal page href with the language code.

    Only rewrites site-relative links to HTML pages (starting with "/",
    not "//"), skipping static assets (by extension), anchors/external/
    mailto/tel links (they don't start with "/"), and values already
    prefixed for this language.
    """
    if not code or code == "en":
        return value
    if not value.startswith("/") or value.startswith("//"):
        return value
    if _ASSET_EXT_RE.search(value):
        return value
    if value == f"/{code}" or value.startswith(f"/{code}/"):
        return value
    if value == "/":
        return f"/{code}/"
    return f"/{code}{value}"


def protect(main_html, code=None):
    """Replace non-translatable content with vault tokens.

    Protects: <script>...</script>, <style>...</style>, HTML comments,
    and href/src attribute values. Returns protected HTML and vault dict.

    Args:
        main_html (str): HTML fragment to protect.
        code (str, optional): Target language code. When given (and not
            "en"), internal page hrefs are localized (see localize_href)
            before being vaulted, so translated pages link to the
            translated counterpart pages instead of the English originals.

    Returns:
        tuple: (protected_html, vault_dict) where vault maps token -> original value.
    """
    vault = {}
    protected = main_html
    token_counter = 0

    # Replace <script> blocks (non-greedy, DOTALL)
    def replace_script(match):
        nonlocal token_counter
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1
        return token

    protected = re.sub(r'<script[^>]*>.*?</script>', replace_script, protected, flags=re.DOTALL)

    # Replace <style> blocks (non-greedy, DOTALL)
    def replace_style(match):
        nonlocal token_counter
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1
        return token

    protected = re.sub(r'<style[^>]*>.*?</style>', replace_style, protected, flags=re.DOTALL)

    # Replace HTML comments (non-greedy, DOTALL)
    def replace_comment(match):
        nonlocal token_counter
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1
        return token

    protected = re.sub(r'<!--.*?-->', replace_comment, protected, flags=re.DOTALL)

    # Replace href/src attribute values (single-pass callback)
    def replace_attr_value(match):
        nonlocal token_counter
        attr_name = match.group(1)
        quote = match.group(2)
        attr_value = match.group(3)
        if attr_name == "href":
            attr_value = localize_href(attr_value, code)
        token = f"⟦P{token_counter}⟧"
        vault[token] = attr_value
        token_counter += 1
        # Return the attribute with the token in place of the value
        if quote:
            return f'{attr_name}={quote}{token}{quote}'
        else:
            return f'{attr_name}={token}'

    protected = re.sub(r'(href|src)=(["\']?)([^\s"\'>\]]+?)\2(?=\s|>)', replace_attr_value, protected)

    # min/max on <input type="number"> etc. are always numeric bounds, never
    # prose — protect unconditionally (unlike placeholder/aria-label, which
    # often carry real translatable text, e.g. glossary.html's search box).
    protected = re.sub(r'(min|max)=(["\']?)([^\s"\'>\]]+?)\2(?=\s|>)', replace_attr_value, protected)

    # placeholder is usually prose (translate it), but a purely-numeric
    # placeholder (e.g. a year-input's placeholder="2025") is a bound, not
    # text — protect only that case so real placeholder text still gets
    # translated.
    def replace_numeric_placeholder(match):
        attr_name, quote, attr_value = match.group(1), match.group(2), match.group(3)
        if re.fullmatch(r'\d+', attr_value):
            return replace_attr_value(match)
        return match.group(0)

    protected = re.sub(
        r'(placeholder)=(["\']?)([^\s"\'>\]]+?)\2(?=\s|>)',
        replace_numeric_placeholder,
        protected,
    )

    return (protected, vault)


def restore(html, vault):
    """Restore protected content from vault tokens.

    Args:
        html (str): HTML with vault tokens.
        vault (dict): Token -> original value mapping from protect().

    Returns:
        str: HTML with all tokens replaced by original content.
    """
    restored = html
    for token, original in vault.items():
        restored = restored.replace(token, original)
    return restored


def retitle(head, title, desc):
    """Replace <title> and meta description in head section.

    Args:
        head (str): HTML head section.
        title (str): New title text (may contain \\ or other regex sequences).
        desc (str): New meta description text (may contain \\ or other regex sequences).

    Returns:
        str: Modified head section with title and description replaced literally.
    """
    # Use callback to avoid backslash/backreference injection from user input
    def replace_title(match):
        return f'<title>{title}</title>'

    result = re.sub(r'<title>[^<]*</title>', replace_title, head)

    # Replace meta description content attribute with plain concatenation
    def replace_meta_desc(match):
        return match.group(1) + desc + match.group(2)

    result = re.sub(
        r'(<meta\s+name="description"\s+content=")[^"]*(")',
        replace_meta_desc,
        result
    )

    return result
