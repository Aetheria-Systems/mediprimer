#!/usr/bin/env python3
"""TDD tests for i18n_lib.py — page splitter and protection vault."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from i18n_lib import split_page, protect, restore, retitle, localize_href


class TestSplitPage:
    """Test split_page round-trip and error handling."""

    def test_split_roundtrip_index(self):
        """Split a real page, concatenate parts, verify bytes match."""
        page_path = "public/index.html"
        with open(page_path, "rb") as f:
            original = f.read()

        parts = split_page(original.decode("utf-8"))
        reconstructed = (parts["head"] + parts["header"] +
                        parts["main"] + parts["footer"])

        assert reconstructed == original.decode("utf-8"), \
            "Reconstructed HTML must match original bytes"

    def test_split_roundtrip_turning65(self):
        """Test round-trip on turning-65.html."""
        page_path = "public/turning-65.html"
        with open(page_path, "rb") as f:
            original = f.read()

        parts = split_page(original.decode("utf-8"))
        reconstructed = (parts["head"] + parts["header"] +
                        parts["main"] + parts["footer"])

        assert reconstructed == original.decode("utf-8")

    def test_split_roundtrip_glossary(self):
        """Test round-trip on glossary.html."""
        page_path = "public/glossary.html"
        with open(page_path, "rb") as f:
            original = f.read()

        parts = split_page(original.decode("utf-8"))
        reconstructed = (parts["head"] + parts["header"] +
                        parts["main"] + parts["footer"])

        assert reconstructed == original.decode("utf-8")

    def test_split_missing_header_raises(self):
        """Missing <header class="site-header"> raises ValueError."""
        html = "<html><body>no header here</body></html>"
        with pytest.raises(ValueError, match="site-header"):
            split_page(html)

    def test_split_missing_footer_raises(self):
        """Missing <footer class="site-footer"> raises ValueError."""
        html = """<html><body><header class="site-header">h</header>
        main content</body></html>"""
        with pytest.raises(ValueError, match="site-footer"):
            split_page(html)

    def test_split_structure(self):
        """Verify split_page returns dict with correct keys."""
        page_path = "public/index.html"
        with open(page_path, "rb") as f:
            html = f.read().decode("utf-8")

        parts = split_page(html)
        assert set(parts.keys()) == {"head", "header", "main", "footer"}
        assert parts["head"].startswith("<!doctype")
        assert "<header class=\"site-header\">" in parts["header"]
        assert "<footer class=\"site-footer\">" in parts["footer"]

    def test_split_footer_rfind_canonical(self):
        """Regression: use rfind() to find LAST footer occurrence (canonical at end).
        Decoy text earlier in content should not break split."""
        html = """<!doctype html>
<html>
<head></head>
<body>
<header class="site-header">nav</header>
<p>Some text mentioning <footer class="site-footer"> as a word in content</p>
<footer class="site-footer">
  <p>Real footer</p>
</footer>
</body>
</html>
"""
        parts = split_page(html)
        # Verify split found the REAL footer at the end
        assert parts["footer"].startswith('<footer class="site-footer">\n  <p>Real footer</p>')
        # Main should NOT include the "fake" footer text
        assert "Some text mentioning" in parts["main"]
        # Reconstruct to verify round-trip
        reconstructed = parts["head"] + parts["header"] + parts["main"] + parts["footer"]
        assert reconstructed == html


class TestProtect:
    """Test protect/restore vault for scripts, styles, comments, URLs."""

    def test_protect_restores_bytes(self):
        """protect → restore must equal original main HTML."""
        main_html = """<main>
<p>Some text.</p>
<script>var x = 1;</script>
<p>More text.</p>
<style>.class { color: red; }</style>
<!-- comment -->
<a href="/page.html">link</a>
</main>"""

        protected, vault = protect(main_html)
        restored = restore(protected, vault)

        assert restored == main_html, \
            "restore(protect(html)) must equal original bytes"

    def test_protect_hides_urls(self):
        """After protect, specific href/src values are not visible (vaulted)."""
        main_html = """<a href="https://example.com">link</a>
<a href="/page.html">internal</a>
<script src="https://cdn.com/script.js"></script>
<img src="/image.png" alt="http visible in text">"""

        protected, vault = protect(main_html)

        # Specific URLs should NOT appear in protected output (they're vaulted)
        # Note: "http" in alt text stays visible, but href values are tokenized
        assert "https://example.com" not in protected, \
            "URL value in href must be vaulted"
        assert "/page.html" not in protected, \
            "Internal href value must be vaulted"
        assert "https://cdn.com/script.js" not in protected, \
            "Script src URL must be vaulted"
        assert "/image.png" not in protected, \
            "Image src URL must be vaulted"

        # Check vault contains the protected values
        vault_values = " ".join(str(v) for v in vault.values())
        assert "https://example.com" in vault_values
        assert "/page.html" in vault_values

    def test_protect_localizes_internal_hrefs_for_target_language(self):
        """Internal page links get the language prefix so translated pages
        link to translated counterparts, not the English originals."""
        main_html = '<a href="/costs.html">costs</a>'
        protected, vault = protect(main_html, "es")
        vault_values = " ".join(str(v) for v in vault.values())
        assert "/es/costs.html" in vault_values
        assert vault_values.count("/costs.html") == 1, \
            "must be prefixed, not duplicated as both /costs.html and /es/costs.html"

    def test_protect_does_not_localize_hrefs_without_code(self):
        """Backward compatible: no code arg means no href rewriting."""
        main_html = '<a href="/costs.html">costs</a>'
        protected, vault = protect(main_html)
        vault_values = " ".join(str(v) for v in vault.values())
        assert "/costs.html" in vault_values
        assert "/es/costs.html" not in vault_values

    def test_protect_does_not_localize_asset_hrefs(self):
        """Stylesheet/script/etc hrefs must not gain a language prefix."""
        main_html = '<a href="/sitemap.xml">sitemap</a><a href="/style.css">style</a>'
        protected, vault = protect(main_html, "es")
        vault_values = " ".join(str(v) for v in vault.values())
        assert "/sitemap.xml" in vault_values
        assert "/style.css" in vault_values
        assert "/es/sitemap.xml" not in vault_values
        assert "/es/style.css" not in vault_values

    def test_protect_does_not_localize_external_or_anchor_hrefs(self):
        main_html = ('<a href="https://www.medicare.gov/">gov</a>'
                     '<a href="#section">anchor</a>'
                     '<a href="mailto:a@b.com">mail</a>')
        protected, vault = protect(main_html, "es")
        vault_values = " ".join(str(v) for v in vault.values())
        assert "https://www.medicare.gov/" in vault_values
        assert "#section" in vault_values
        assert "mailto:a@b.com" in vault_values
        assert "/es/" not in vault_values


class TestLocalizeHref:
    """Test the localize_href helper directly."""

    def test_prefixes_internal_page_link(self):
        assert localize_href("/costs.html", "es") == "/es/costs.html"

    def test_prefixes_home_link(self):
        assert localize_href("/", "es") == "/es/"

    def test_leaves_already_prefixed_link_unchanged(self):
        assert localize_href("/es/costs.html", "es") == "/es/costs.html"

    def test_leaves_asset_extensions_unchanged(self):
        for value in ("/style.css", "/nav-menu.js", "/sitemap.xml", "/favicon.ico"):
            assert localize_href(value, "es") == value

    def test_leaves_external_and_anchor_links_unchanged(self):
        for value in ("https://www.medicare.gov/", "//cdn.example.com/x.js", "#section", "mailto:a@b.com"):
            assert localize_href(value, "es") == value

    def test_no_code_or_english_is_noop(self):
        assert localize_href("/costs.html", None) == "/costs.html"
        assert localize_href("/costs.html", "en") == "/costs.html"

    def test_protect_token_format(self):
        """Protected output uses ⟦Pn⟧ format."""
        main_html = '<script>var x = 1;</script><p>text</p>'
        protected, vault = protect(main_html)

        # Should contain at least one vault token
        assert "⟦P" in protected
        assert "⟧" in protected
        # Verify token format matches ⟦Pn⟧ where n is a number
        import re
        tokens = re.findall(r'⟦P\d+⟧', protected)
        assert len(tokens) > 0

    def test_protect_hides_input_min_max(self):
        """min/max on <input type="number"> are numeric bounds, never
        prose — protect() must vault them so a back-translation pass never
        sees literal years leak through (root cause of a real turning-65.html
        QA-gate failure: min="2024" max="2050" was un-vaulted)."""
        main_html = '<input type="number" min="2024" max="2050" placeholder="2025">'

        protected, vault = protect(main_html)

        assert "2024" not in protected
        assert "2050" not in protected
        assert "2025" not in protected
        assert restore(protected, vault) == main_html

    def test_protect_translates_prose_placeholder(self):
        """A placeholder with real text (not a bare number) must NOT be
        vaulted — it needs to reach the translator, e.g. glossary.html's
        search box placeholder."""
        main_html = '<input type="search" placeholder="Search terms…">'

        protected, vault = protect(main_html)

        assert "Search terms" in protected, \
            "prose placeholder text must remain translatable, not vaulted"


class TestRetitle:
    """Test title and meta description replacement."""

    def test_retitle_updates_title(self):
        """retitle swaps <title> content."""
        head = """<head>
<title>Old Title</title>
<meta name="description" content="Old desc">
</head>"""

        result = retitle(head, "New Title", "New description")

        assert "<title>New Title</title>" in result
        assert "Old Title" not in result

    def test_retitle_updates_meta_description(self):
        """retitle swaps meta description."""
        head = """<head>
<title>Title</title>
<meta name="description" content="Old desc">
</head>"""

        result = retitle(head, "Title", "New desc")

        assert 'content="New desc"' in result
        assert "Old desc" not in result

    def test_retitle_preserves_rest(self):
        """retitle leaves other content unchanged."""
        head = """<head>
<meta charset="utf-8">
<title>Old</title>
<meta name="description" content="Old">
<link rel="stylesheet" href="/style.css">
</head>"""

        result = retitle(head, "New", "New desc")

        assert 'charset="utf-8"' in result
        assert 'href="/style.css"' in result
        assert "<title>New</title>" in result
        assert 'content="New desc"' in result

    def test_retitle_with_backslash_in_desc(self):
        """Regression: desc containing \\1 or other regex sequences must be literal.
        Callback approach avoids backslash injection."""
        head = """<head>
<title>Old</title>
<meta name="description" content="Old desc">
</head>"""

        # Description with regex backreference-like sequence
        result = retitle(head, "Title", "Benefits & coverage: \\1 & \\2 rules")

        # Should contain the literal backslashes and ampersands, not interpreted as regex
        assert r'\1' in result
        assert r'\2' in result
        assert '&' in result
        assert 'content="Benefits & coverage: \\1 & \\2 rules"' in result

    def test_retitle_with_ampersand_in_desc(self):
        """Regression: desc containing & must be preserved literally."""
        head = """<head>
<title>Old</title>
<meta name="description" content="Old">
</head>"""

        result = retitle(head, "New & Improved", "Medicare & Medicaid coverage")

        # Ampersands must appear literally in both title and description
        assert "<title>New & Improved</title>" in result
        assert 'content="Medicare & Medicaid coverage"' in result
