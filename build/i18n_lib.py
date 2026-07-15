#!/usr/bin/env python3
"""i18n_lib — page splitter and protection vault for multilingual content.

Splits MediPrimer pages into translatable segments (head, header, main, footer)
and protects non-translatable content (scripts, styles, comments, URLs) with
opaque vault tokens using the ⟦Pn⟧ format. Round-trip byte-identical.
"""
import re


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

    footer_start = body_content.find('<footer class="site-footer">')
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


def protect(main_html):
    """Replace non-translatable content with vault tokens.

    Protects: <script>...</script>, <style>...</style>, HTML comments,
    and href/src attribute values. Returns protected HTML and vault dict.

    Args:
        main_html (str): HTML fragment to protect.

    Returns:
        tuple: (protected_html, vault_dict) where vault maps token -> original value.
    """
    vault = {}
    protected = main_html
    token_counter = 0

    # Protect <script>...</script> blocks (non-greedy, DOTALL)
    for match in re.finditer(r'<script[^>]*>.*?</script>', protected, re.DOTALL):
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1

    # Protect <style>...</style> blocks (non-greedy, DOTALL)
    for match in re.finditer(r'<style[^>]*>.*?</style>', protected, re.DOTALL):
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1

    # Protect HTML comments (non-greedy, DOTALL)
    for match in re.finditer(r'<!--.*?-->', protected, re.DOTALL):
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1

    # Protect href and src attribute values (but not the attribute names)
    # Match: href="..." or href='...' or href=value (unquoted)
    # Similarly for src
    for match in re.finditer(r'(href|src)=(["\']?)([^\s"\'>\]]+?)\2(?=\s|>)', protected):
        attr_name = match.group(1)
        quote = match.group(2)
        attr_value = match.group(3)
        token = f"⟦P{token_counter}⟧"
        vault[token] = attr_value
        token_counter += 1

    # Now do the actual replacements in order
    # We need to re-scan to avoid double-processing
    protected = main_html
    token_counter = 0

    # Replace <script> blocks
    def replace_script(match):
        nonlocal token_counter
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1
        return token

    protected = re.sub(r'<script[^>]*>.*?</script>', replace_script, protected, flags=re.DOTALL)

    # Replace <style> blocks
    def replace_style(match):
        nonlocal token_counter
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1
        return token

    protected = re.sub(r'<style[^>]*>.*?</style>', replace_style, protected, flags=re.DOTALL)

    # Replace HTML comments
    def replace_comment(match):
        nonlocal token_counter
        token = f"⟦P{token_counter}⟧"
        vault[token] = match.group(0)
        token_counter += 1
        return token

    protected = re.sub(r'<!--.*?-->', replace_comment, protected, flags=re.DOTALL)

    # Replace href/src attribute values
    def replace_attr_value(match):
        nonlocal token_counter
        attr_name = match.group(1)
        quote = match.group(2)
        attr_value = match.group(3)
        token = f"⟦P{token_counter}⟧"
        vault[token] = attr_value
        token_counter += 1
        # Return the attribute with the token in place of the value
        if quote:
            return f'{attr_name}={quote}{token}{quote}'
        else:
            return f'{attr_name}={token}'

    protected = re.sub(r'(href|src)=(["\']?)([^\s"\'>\]]+?)\2(?=\s|>)', replace_attr_value, protected)

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
        title (str): New title text.
        desc (str): New meta description text.

    Returns:
        str: Modified head section.
    """
    # Replace <title>
    result = re.sub(
        r'<title>[^<]*</title>',
        f'<title>{title}</title>',
        head
    )

    # Replace meta description content attribute
    result = re.sub(
        r'(<meta\s+name="description"\s+content=")[^"]*(")',
        rf'\1{desc}\2',
        result
    )

    return result
