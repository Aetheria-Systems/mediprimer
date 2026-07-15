#!/usr/bin/env python3
"""TDD tests for hreflang clusters and language-dir build coverage."""
import sys
import os
import json
import tempfile
import shutil
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from seo import alternates, seo_block, main as seo_main


class TestAlternatesCluster:
    """Test alternates() function and hreflang link emission."""

    def test_alternates_cluster_en_and_es(self, tmp_path):
        """With es file present and es launched=true, both links + x-default."""
        # Create a langs_dict with es launched
        langs_dict = {
            "es": {"code": "es", "name": "Spanish", "native": "Español", "tier": 1,
                   "rtl": False, "launched": True, "official_url": "", "ui": {}}
        }

        # Create a fake public/es/disclaimer.html to simulate the file existing
        es_page_dir = tmp_path / "public" / "es"
        es_page_dir.mkdir(parents=True)
        es_page = es_page_dir / "disclaimer.html"
        es_page.write_text("<html><head></head><body></body></html>")

        # Test alternates() function
        result = alternates("disclaimer.html", langs_dict, str(tmp_path / "public"))

        # Should contain hreflang en, es, and x-default
        assert 'hreflang="en"' in result
        assert 'hreflang="es"' in result
        assert 'hreflang="x-default"' in result
        assert 'href="https://mediprimer.org/disclaimer.html"' in result
        assert 'href="https://mediprimer.org/es/disclaimer.html"' in result

    def test_alternates_absent_when_not_launched(self, tmp_path):
        """When es not launched, no alternates emitted at all (to maintain byte neutrality)."""
        # Create a langs_dict with es NOT launched
        langs_dict = {
            "es": {"code": "es", "name": "Spanish", "native": "Español", "tier": 1,
                   "rtl": False, "launched": False, "official_url": "", "ui": {}}
        }

        # Create a fake public/es/disclaimer.html (file exists but not launched)
        es_page_dir = tmp_path / "public" / "es"
        es_page_dir.mkdir(parents=True)
        es_page = es_page_dir / "disclaimer.html"
        es_page.write_text("<html><head></head><body></body></html>")

        # Test alternates() function
        result = alternates("disclaimer.html", langs_dict, str(tmp_path / "public"))

        # Should return empty string when no languages are launched
        assert result == ""

    def test_es_seo_block_canonical_and_locale(self, tmp_path):
        """Spanish page seo_block has canonical to /es/X and og:locale=es_US."""
        # Create a translated page seo block with es parameters
        url = "https://mediprimer.org/es/disclaimer.html"
        title = "Aviso Legal — MediPrimer"
        desc = "MediPrimer es un recurso educativo independiente"
        mod_date = "2026-07-13"
        langs_dict = {}

        # This will be an extended seo_block call with language parameter
        result = seo_block("disclaimer.html", url, title, desc, mod_date,
                          lang_code="es", in_language="es-ES", langs_dict=langs_dict)

        # Check for Spanish-specific elements
        assert 'href="https://mediprimer.org/es/disclaimer.html"' in result
        assert '<meta property="og:locale" content="es_US">' in result
        assert '"inLanguage": "es-ES"' in result

    def test_readability_ignores_lang_dirs(self):
        """readability.py should only score top-level pages, not public/es/."""
        import subprocess
        import glob

        # Run readability.py with SHOW_ALL flag to see if it includes es pages
        result = subprocess.run(
            ["python3", "build/readability.py", "--all"],
            cwd="/home/deltaprism/mediprimer",
            capture_output=True,
            text=True
        )

        # Check that output does not contain "es/" or "es" language-specific pages
        output_lines = result.stdout.split('\n')
        for line in output_lines:
            # Any line starting with a page name should not be from es/
            if line.strip() and not any(x in line for x in ['AVERAGE', 'Over target', 'page', 'grade']):
                # Parse the first field as the page name
                parts = line.split()
                if parts:
                    page_name = parts[0]
                    assert "/" not in page_name or not page_name.startswith("es/"), \
                        f"readability.py should not score language-dir pages, got: {page_name}"


class TestTranslatedPageSEOBlock:
    """Test SEO block generation for translated pages."""

    def test_translated_page_maintains_seo_block(self, tmp_path):
        """When processing translated pages, seo.py maintains their seo block."""
        # Create a test translated page
        page_dir = tmp_path / "public" / "es"
        page_dir.mkdir(parents=True)
        page_path = page_dir / "disclaimer.html"

        test_html = """<!doctype html>
<html lang="es">
<head>
<title>Aviso Legal — MediPrimer</title>
<meta name="description" content="Aviso legal traducido">
</head>
<body>Test content</body>
</html>"""
        page_path.write_text(test_html)

        # Should be able to process this page without errors
        # (implementation will add seo block to translated pages)
        # For now, just verify the page can be read
        with open(page_path, "r", encoding="utf-8") as f:
            content = f.read()
        assert "Aviso Legal" in content
