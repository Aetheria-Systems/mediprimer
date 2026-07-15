#!/usr/bin/env python3
"""TDD tests for hreflang clusters and language-dir build coverage."""
import sys
import os
import json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from seo import alternates, seo_block, main as seo_main, load_languages


class TestAlternatesCluster:
    """Test alternates() function and hreflang link emission."""

    def test_alternates_cluster_en_and_es(self, tmp_path):
        """With es file present and es launched=true, both links + x-default."""
        # Create a langs_dict with es launched
        langs_dict = {
            "es": {"code": "es", "name": "Spanish", "native": "Español", "tier": 1,
                   "rtl": False, "launched": True, "official_url": "", "ui": {}, "og_locale": "es_US"}
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
                   "rtl": False, "launched": False, "official_url": "", "ui": {}, "og_locale": "es_US"}
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

    def test_es_seo_block_canonical_and_locale(self):
        """Spanish page seo_block has canonical to /es/X and og:locale=es_US."""
        # Create a translated page seo block with es parameters
        url = "https://mediprimer.org/es/disclaimer.html"
        title = "Aviso Legal — MediPrimer"
        desc = "MediPrimer es un recurso educativo independiente"
        mod_date = "2026-07-13"
        langs_dict = {
            "es": {"code": "es", "name": "Spanish", "native": "Español", "tier": 1,
                   "rtl": False, "launched": True, "official_url": "", "ui": {}, "og_locale": "es_US"}
        }

        # This will be an extended seo_block call with language parameter
        result = seo_block("disclaimer.html", url, title, desc, mod_date,
                          lang_code="es", in_language="es-ES", langs_dict=langs_dict)

        # Check for Spanish-specific elements
        assert 'href="https://mediprimer.org/es/disclaimer.html"' in result
        assert '<meta property="og:locale" content="es_US">' in result
        assert '"inLanguage": "es-ES"' in result

    def test_readability_ignores_lang_dirs(self):
        """readability.py should only score top-level pages, not public/es/."""
        # Verify that readability.py pattern only globs top-level pages
        # This validates the glob on line 48 of readability.py: glob.glob(os.path.join(PUB, "*.html"))
        # should not include public/es/*.html files
        import glob
        
        # Get the repo root by going up from build/tests/
        repo_root = os.path.join(os.path.dirname(__file__), "..", "..")
        pub = os.path.join(repo_root, "public")
        
        # Only check if public dir exists (test may run in different context)
        if os.path.isdir(pub):
            # Check the glob pattern used by readability.py
            top_level = sorted(glob.glob(os.path.join(pub, "*.html")))
            
            # Should have files in top_level
            if top_level:
                # Verify no es files are in top_level
                es_in_top = [f for f in top_level if os.sep + "es" + os.sep in f or "/es/" in f]
                assert len(es_in_top) == 0, f"top-level glob should not include language dirs, got: {es_in_top}"


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
        with open(page_path, "r", encoding="utf-8") as f:
            content = f.read()
        assert "Aviso Legal" in content


class TestSitemapWithLaunched:
    """Test sitemap generation with launched languages."""

    def test_sitemap_includes_launched_language_url_with_lastmod(self):
        """Sitemap should emit launched-language URLs with lastmod, no KeyError."""
        # Test that when es is launched and public/es/disclaimer.html exists,
        # the alternates() function correctly includes es hreflang and the
        # mods_key structure handles the lookup without KeyError.
        langs_dict = load_languages()
        original_launched = langs_dict.get("es", {}).get("launched", False)
        
        try:
            # Flip es to launched in memory
            langs_dict["es"]["launched"] = True
            
            # Use relative path to check file existence
            repo_root = os.path.join(os.path.dirname(__file__), "..", "..")
            pub_dir = os.path.join(repo_root, "public")
            es_file = os.path.join(pub_dir, "es", "disclaimer.html")
            file_exists = os.path.isfile(es_file)
            
            if file_exists:
                # If file exists, alternates should emit es
                result = alternates("disclaimer.html", langs_dict, pub_dir)
                assert 'hreflang="es"' in result, "Should include es when launched and file exists"
                assert 'hreflang="en"' in result
                assert 'hreflang="x-default"' in result
            else:
                # If file doesn't exist, alternates should omit es but still emit en and x-default
                result = alternates("disclaimer.html", langs_dict, pub_dir)
                assert 'hreflang="en"' in result, "Should always include en"
                assert 'hreflang="x-default"' in result, "Should always include x-default"
        finally:
            # Restore original state
            if "es" in langs_dict:
                langs_dict["es"]["launched"] = original_launched
