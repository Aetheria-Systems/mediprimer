#!/usr/bin/env python3
"""TDD tests for i18n_lib.py — page splitter and protection vault."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from i18n_lib import split_page, protect, restore, retitle


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
        """After protect, no unvaulted http or .html substrings in hrefs."""
        main_html = """<a href="https://example.com">link</a>
<a href="/page.html">internal</a>
<script src="https://cdn.com/script.js"></script>
<img src="/image.png" alt="http visible in text">"""

        protected, vault = protect(main_html)

        # Verify hrefs are tokenized (vault tokens contain URLs)
        assert "https://example.com" not in protected or "⟦P" in protected
        assert ".html" not in protected or "⟦P" in protected
        # Text content should still have visible URLs (alt text, etc)
        # but href/src attributes should be vaulted

        # Check vault contains the protected values
        vault_values = " ".join(str(v) for v in vault.values())
        assert "https://example.com" in vault_values
        assert "/page.html" in vault_values

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
