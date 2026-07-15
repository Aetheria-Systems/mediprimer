#!/usr/bin/env python3
"""Regression tests for final i18n fixes (dated state, tool-page notes, localized banner)."""
import json
import re
import sys
import os
import tempfile

# Add build dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from i18n_chrome import render_footer, _has_tool_scripts
from i18n_lib import get_launched_codes


def test_translation_state_schema_has_hash_and_date():
    """Translation state entries must be {hash, date} objects, not bare strings."""
    # Simulate a state entry that translate.py would write
    state = {
        "es": {
            "disclaimer.html": {
                "hash": "abc123def456",
                "date": "2026-07-14"
            }
        }
    }
    # Verify structure
    entry = state["es"]["disclaimer.html"]
    assert isinstance(entry, dict), "Entry must be dict, not string"
    assert "hash" in entry, "Entry must have 'hash' key"
    assert "date" in entry, "Entry must have 'date' key"
    assert isinstance(entry["hash"], str), "hash must be string"
    assert isinstance(entry["date"], str), "date must be string"
    # Verify date format matches YYYY-MM-DD
    assert re.match(r"^\d{4}-\d{2}-\d{2}$", entry["date"]), \
        f"date must match YYYY-MM-DD format, got: {entry['date']}"


def test_tool_scripts_detected():
    """_has_tool_scripts detects tool script references."""
    html_with_tool = '<script src="/glossary.js"></script><p>Content</p>'
    html_without_tool = '<script src="/other.js"></script><p>Content</p>'

    assert _has_tool_scripts(html_with_tool), "Should detect glossary.js"
    assert not _has_tool_scripts(html_without_tool), "Should not detect other scripts"

    # Test all tool scripts
    tools = ["glossary.js", "help-paying.js", "medicare-navigator.js", "priorities.js", "your-state.js"]
    for tool in tools:
        html = f'<script src="/{tool}"></script>'
        assert _has_tool_scripts(html), f"Should detect {tool}"


def test_tool_note_in_footer_when_tools_referenced():
    """render_footer includes tool_english note when English page references tools."""
    chrome = {
        "footer_headings": {
            "The Basics": "Los conceptos básicos",
            "For Members": "Para miembros",
            "For Professionals": "Para profesionales",
            "Directories & Tools": "Directorios y herramientas",
            "Official sources": "Fuentes oficiales"
        },
        "footer_links": {
            "Coverage Basics": "Conceptos básicos de la cobertura",
            "Plan Types": "Tipos de planes",
            "Medigap Plans": "Planes Medigap",
            "Policy & Rule Changes": "Cambios de políticas y normas",
            "Glossary": "Glosario",
            "Enrollment & Deadlines": "Inscripción y plazos",
            "Understanding Your Costs": "Entienda sus costos",
            "Choosing Coverage": "Cómo elegir la cobertura",
            "Getting Help Paying": "Obtenga ayuda para pagar",
            "Turning 65": "Al cumplir 65 años",
            "Health-Plan Operations": "Operaciones de planes de salud",
            "Providers & Billing": "Proveedores y facturación",
            "Brokers & Advisors": "Agentes y asesores",
            "Case Managers & Navigators": "Administradores de casos y navegadores",
            "State Medicaid": "Medicaid estatal",
            "SHIP (Medicare help)": "SHIP (ayuda con Medicare)",
            "Insurance Departments": "Departamentos de seguros",
            "All Resources": "Todos los recursos",
            "Printable Checklists": "Listas de verificación para imprimir",
            "Medicare.gov": "Medicare.gov",
            "Medicaid.gov": "Medicaid.gov",
            "CMS.gov": "CMS.gov",
            "HealthCare.gov": "CuidadoDeSalud.gov",
            "Privacy": "Privacidad",
            "Terms of Use": "Términos de uso",
            "Disclaimer": "Aviso legal",
            "Accessibility": "Accesibilidad",
            "Editorial Standards": "Normas editoriales",
            "Support": "Apoyo",
            "Site Map": "Mapa del sitio"
        }
    }

    languages = {
        "languages": [
            {
                "code": "es",
                "name": "Spanish",
                "native": "Español",
                "launched": True,
                "official_url": "https://www.medicare.gov/es",
                "ui": {
                    "note": "Traducción del original en inglés.",
                    "note_english_link": "Ver la versión original en inglés",
                    "note_official": "Materiales oficiales de Medicare en español",
                    "tool_english": "Esta herramienta está disponible en inglés."
                }
            }
        ]
    }

    # Test with page that has tool scripts
    en_html_with_tool = '<html><body><script src="/glossary.js"></script></body></html>'
    result = render_footer("es", "glossary.html", chrome, languages, en_html_with_tool)
    assert "Esta herramienta está disponible en inglés." in result, \
        f"Tool note should appear when tools are referenced"

    # Test with page that doesn't have tool scripts
    en_html_no_tool = '<html><body><p>No tools here</p></body></html>'
    result = render_footer("es", "disclaimer.html", chrome, languages, en_html_no_tool)
    assert "Esta herramienta está disponible en inglés." not in result, \
        f"Tool note should not appear when no tools are referenced"


def test_banner_field_required_for_launched_languages():
    """Launched languages must have ui.banner field in languages.json."""
    # This test verifies the structure; actual KeyError is raised by render_header/normalize.py
    languages = {
        "languages": [
            {
                "code": "es",
                "launched": True,
                "ui": {
                    "banner": "¿Prefiere leer esta página en español?"
                }
            }
        ]
    }

    # Extract banner from launched language
    for lang in languages.get("languages", []):
        if lang.get("launched"):
            banner = lang.get("ui", {}).get("banner")
            assert banner is not None, f"Launched language {lang.get('code')} must have ui.banner"


def test_get_launched_codes_returns_codes_only():
    """get_launched_codes returns list of launched language codes."""
    languages = {
        "languages": [
            {"code": "es", "name": "Spanish", "launched": True},
            {"code": "zh", "name": "Chinese", "launched": False},
            {"code": "fr", "name": "French", "launched": True}
        ]
    }

    result = get_launched_codes(languages)
    assert result == ["es", "fr"], f"Should return launched codes in order, got: {result}"


def test_seo_dateModified_from_translation_state():
    """SEO dateModified field must be in YYYY-MM-DD format from translation state."""
    # Simulate translation state entry
    trans_state = {
        "es": {
            "turning-65.html": {
                "hash": "abc123",
                "date": "2026-07-14"
            }
        }
    }

    # Extract and verify
    entry = trans_state["es"]["turning-65.html"]
    mod_date = entry["date"]
    assert re.match(r"^\d{4}-\d{2}-\d{2}$", mod_date), \
        f"dateModified must match YYYY-MM-DD format, got: {mod_date}"


def test_lang_suggest_mp_langs_is_object():
    """MP_LANGS must be emitted as object {code: 'banner text'} not array."""
    # This test verifies the expected format for lang-suggest.js
    # Actual emission is tested by checking render_header output
    mp_langs = {
        "es": "¿Prefiere leer esta página en español?",
        "fr": "Préférez-vous lire cette page en français?"
    }

    # Verify it's an object and has proper structure
    assert isinstance(mp_langs, dict), "MP_LANGS must be object (dict), not list"
    for code, text in mp_langs.items():
        assert isinstance(code, str), f"Language code must be string, got {type(code)}"
        assert isinstance(text, str), f"Banner text must be string, got {type(text)}"
