#!/usr/bin/env python3
"""Tests for i18n_chrome: per-language chrome renderer and language switcher."""
import json
import pytest
import sys
import os

# Add build dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from i18n_chrome import switcher_html, render_header, render_footer


def test_switcher_zero_launched_is_empty():
    """When no languages are launched, switcher renders as empty string."""
    languages = {
        "languages": [
            {"code": "es", "name": "Spanish", "native": "Español", "launched": False}
        ]
    }
    result = switcher_html("en", "turning-65.html", languages)
    assert result == "", f"Expected empty string, got: {result!r}"


def test_switcher_links_counterparts():
    """Switcher contains links to counterpart URLs for each launched language."""
    languages = {
        "languages": [
            {"code": "es", "name": "Spanish", "native": "Español", "launched": True, "ui": {"switcher_label": "Idioma"}},
            {"code": "fr", "name": "French", "native": "Français", "launched": True, "ui": {"switcher_label": "Langue"}}
        ]
    }
    # For English page, should link to /es/turning-65.html and /fr/turning-65.html
    result = switcher_html("en", "turning-65.html", languages)
    assert "/es/turning-65.html" in result, f"Missing Spanish link in: {result}"
    assert "/fr/turning-65.html" in result, f"Missing French link in: {result}"
    assert 'aria-current="page"' in result, "Missing aria-current on current language"

    # For Spanish page, should link to /turning-65.html (English) and /fr/turning-65.html
    result_es = switcher_html("es", "turning-65.html", languages)
    assert "/turning-65.html" in result_es, f"Missing English link in: {result_es}"
    assert "/fr/turning-65.html" in result_es, f"Missing French link in: {result_es}"


def test_render_header_translates_all_labels():
    """render_header translates all English nav labels via chrome.json; no English labels survive."""
    chrome = {
        "nav": {
            "Home": "Inicio",
            "Start Here": "Comience aquí",
            "Learn the Basics": "Aprenda los conceptos básicos",
            "Find Help": "Encuentre ayuda",
            "Glossary": "Glosario",
            "For Professionals": "Para profesionales",
            "About": "Acerca de"
        },
        "menus": {
            "Coverage Basics": "Conceptos básicos de la cobertura",
            "Plan Types": "Tipos de planes",
            "Medigap Plans": "Planes Medigap",
            "Medicare Advantage": "Medicare Advantage",
            "The Marketplace (ACA)": "El Mercado de Seguros Médicos (ACA)",
            "How Programs Are Governed": "Cómo se rigen los programas",
            "Policy & Rule Changes": "Cambios de políticas y normas",
            "All Basics →": "Todos los conceptos básicos →",
            "★ Turning 65: Start Here": "★ Al cumplir 65 años: comience aquí",
            "Medicare for Couples": "Medicare para parejas",
            "Choosing Coverage": "Cómo elegir la cobertura",
            "Understanding Your Costs": "Entienda sus costos",
            "Enrollment & Deadlines": "Inscripción y plazos",
            "Getting Help Paying": "Obtenga ayuda para pagar",
            "Questions to Ask": "Preguntas que debe hacer",
            "Edge Cases & Complications": "Casos especiales y complicaciones",
            "All Member guides →": "Todas las guías para miembros →",
            "Health-Plan Operations": "Operaciones de planes de salud",
            "Providers & Billing": "Proveedores y facturación",
            "Brokers & Advisors": "Agentes y asesores",
            "Case Managers & Navigators": "Administradores de casos y navegadores",
            "Star Ratings & Quality": "Calificaciones de estrellas y calidad",
            "Appeals: Levels & Timelines": "Apelaciones: niveles y plazos",
            "All Professional refs →": "Todas las referencias profesionales →",
            "State Medicaid": "Medicaid estatal",
            "SHIP (Medicare help)": "SHIP (ayuda con Medicare)",
            "Insurance Departments": "Departamentos de seguros",
            "All Resources": "Todos los recursos",
            "Printable Checklists": "Listas de verificación para imprimir",
            "Directories home →": "Inicio de directorios →"
        },
        "menu_button": "Menú",
        "open_menu": "Abrir menú de"
    }

    result = render_header("es", "members", "turning-65.html", chrome)

    # Check that no English labels from NAV remain
    for english_label in ["Home", "Start Here", "Learn the Basics", "Find Help", "Glossary", "For Professionals", "About"]:
        assert english_label not in result, f"English label '{english_label}' found in translated header"

    # Check that Spanish labels are present
    assert "Inicio" in result
    assert "Comience aquí" in result
    assert "Aprenda los conceptos básicos" in result


def test_render_header_prefixes_hrefs():
    """render_header prefixes internal hrefs with language code."""
    chrome = {
        "nav": {
            "Home": "Inicio",
            "Start Here": "Comience aquí",
            "Learn the Basics": "Aprenda los conceptos básicos",
            "Find Help": "Encuentre ayuda",
            "Glossary": "Glosario",
            "For Professionals": "Para profesionales",
            "About": "Acerca de"
        },
        "menus": {
            "Coverage Basics": "Conceptos básicos de la cobertura",
            "Plan Types": "Tipos de planes",
            "Medigap Plans": "Planes Medigap",
            "Medicare Advantage": "Medicare Advantage",
            "The Marketplace (ACA)": "El Mercado de Seguros Médicos (ACA)",
            "How Programs Are Governed": "Cómo se rigen los programas",
            "Policy & Rule Changes": "Cambios de políticas y normas",
            "All Basics →": "Todos los conceptos básicos →",
            "★ Turning 65: Start Here": "★ Al cumplir 65 años: comience aquí",
            "Medicare for Couples": "Medicare para parejas",
            "Choosing Coverage": "Cómo elegir la cobertura",
            "Understanding Your Costs": "Entienda sus costos",
            "Enrollment & Deadlines": "Inscripción y plazos",
            "Getting Help Paying": "Obtenga ayuda para pagar",
            "Questions to Ask": "Preguntas que debe hacer",
            "Edge Cases & Complications": "Casos especiales y complicaciones",
            "All Member guides →": "Todas las guías para miembros →",
            "Health-Plan Operations": "Operaciones de planes de salud",
            "Providers & Billing": "Proveedores y facturación",
            "Brokers & Advisors": "Agentes y asesores",
            "Case Managers & Navigators": "Administradores de casos y navegadores",
            "Star Ratings & Quality": "Calificaciones de estrellas y calidad",
            "Appeals: Levels & Timelines": "Apelaciones: niveles y plazos",
            "All Professional refs →": "Todas las referencias profesionales →",
            "State Medicaid": "Medicaid estatal",
            "SHIP (Medicare help)": "SHIP (ayuda con Medicare)",
            "Insurance Departments": "Departamentos de seguros",
            "All Resources": "Todos los recursos",
            "Printable Checklists": "Listas de verificación para imprimir",
            "Directories home →": "Inicio de directorios →"
        },
        "menu_button": "Menú",
        "open_menu": "Abrir menú de"
    }

    result = render_header("es", "basics", "coverage-basics.html", chrome)

    # Check that internal links are prefixed with /es/
    assert 'href="/es/basics.html"' in result or 'href="/es/coverage-basics.html"' in result, \
        f"Spanish internal links not properly prefixed in: {result}"

    # Check that home link is /es/ (not /es/index.html or /es/)
    assert 'href="/es/"' in result or 'href="/"' not in result, \
        f"Home link not properly handled: {result}"


def test_missing_label_raises():
    """render_header raises KeyError if a label is missing from chrome.json."""
    incomplete_chrome = {
        "nav": {
            "Home": "Inicio",
            # Missing "Start Here" and others
        },
        "menus": {},
        "menu_button": "Menú",
        "open_menu": "Abrir menú de"
    }

    with pytest.raises(KeyError):
        render_header("es", "members", "turning-65.html", incomplete_chrome)


def test_render_header_embeds_switcher():
    """render_header embeds switcher when launched languages exist (Critical 1)."""
    chrome = {
        "nav": {
            "Home": "Inicio",
            "Start Here": "Comience aquí",
            "Learn the Basics": "Aprenda los conceptos básicos",
            "Find Help": "Encuentre ayuda",
            "Glossary": "Glosario",
            "For Professionals": "Para profesionales",
            "About": "Acerca de"
        },
        "menus": {
            "Coverage Basics": "Conceptos básicos de la cobertura",
            "Plan Types": "Tipos de planes",
            "Medigap Plans": "Planes Medigap",
            "Medicare Advantage": "Medicare Advantage",
            "The Marketplace (ACA)": "El Mercado de Seguros Médicos (ACA)",
            "How Programs Are Governed": "Cómo se rigen los programas",
            "Policy & Rule Changes": "Cambios de políticas y normas",
            "All Basics →": "Todos los conceptos básicos →",
            "★ Turning 65: Start Here": "★ Al cumplir 65 años: comience aquí",
            "Medicare for Couples": "Medicare para parejas",
            "Choosing Coverage": "Cómo elegir la cobertura",
            "Understanding Your Costs": "Entienda sus costos",
            "Enrollment & Deadlines": "Inscripción y plazos",
            "Getting Help Paying": "Obtenga ayuda para pagar",
            "Questions to Ask": "Preguntas que debe hacer",
            "Edge Cases & Complications": "Casos especiales y complicaciones",
            "All Member guides →": "Todas las guías para miembros →",
            "Health-Plan Operations": "Operaciones de planes de salud",
            "Providers & Billing": "Proveedores y facturación",
            "Brokers & Advisors": "Agentes y asesores",
            "Case Managers & Navigators": "Administradores de casos y navegadores",
            "Star Ratings & Quality": "Calificaciones de estrellas y calidad",
            "Appeals: Levels & Timelines": "Apelaciones: niveles y plazos",
            "All Professional refs →": "Todas las referencias profesionales →",
            "State Medicaid": "Medicaid estatal",
            "SHIP (Medicare help)": "SHIP (ayuda con Medicare)",
            "Insurance Departments": "Departamentos de seguros",
            "All Resources": "Todos los recursos",
            "Printable Checklists": "Listas de verificación para imprimir",
            "Directories home →": "Inicio de directorios →"
        },
        "menu_button": "Menú",
        "open_menu": "Abrir menú de"
    }

    languages = {
        "languages": [
            {"code": "es", "name": "Spanish", "native": "Español", "launched": True, "ui": {"switcher_label": "Idioma", "banner": "¿Prefiere leer esta página en español?"}}
        ]
    }

    result = render_header("es", "members", "turning-65.html", chrome, languages)
    # Critical 1: Switcher must be embedded after brand anchor, as a dropdown
    # (reusing the .navitem.has-menu/.menu-caret/.dropdown nav pattern)
    assert 'lang-switch' in result, f"Switcher not embedded in: {result}"
    assert 'class="menu-caret lang-switch-trigger"' in result, "Switcher trigger button missing"
    assert 'aria-current="page"' in result, "aria-current not in switcher"


def test_render_header_prefixes_brand_href():
    """render_header prefixes brand href for non-English (Critical 2)."""
    chrome = {
        "nav": {
            "Home": "Inicio",
            "Start Here": "Comience aquí",
            "Learn the Basics": "Aprenda los conceptos básicos",
            "Find Help": "Encuentre ayuda",
            "Glossary": "Glosario",
            "For Professionals": "Para profesionales",
            "About": "Acerca de"
        },
        "menus": {
            "Coverage Basics": "Conceptos básicos de la cobertura",
            "Plan Types": "Tipos de planes",
            "Medigap Plans": "Planes Medigap",
            "Medicare Advantage": "Medicare Advantage",
            "The Marketplace (ACA)": "El Mercado de Seguros Médicos (ACA)",
            "How Programs Are Governed": "Cómo se rigen los programas",
            "Policy & Rule Changes": "Cambios de políticas y normas",
            "All Basics →": "Todos los conceptos básicos →",
            "★ Turning 65: Start Here": "★ Al cumplir 65 años: comience aquí",
            "Medicare for Couples": "Medicare para parejas",
            "Choosing Coverage": "Cómo elegir la cobertura",
            "Understanding Your Costs": "Entienda sus costos",
            "Enrollment & Deadlines": "Inscripción y plazos",
            "Getting Help Paying": "Obtenga ayuda para pagar",
            "Questions to Ask": "Preguntas que debe hacer",
            "Edge Cases & Complications": "Casos especiales y complicaciones",
            "All Member guides →": "Todas las guías para miembros →",
            "Health-Plan Operations": "Operaciones de planes de salud",
            "Providers & Billing": "Proveedores y facturación",
            "Brokers & Advisors": "Agentes y asesores",
            "Case Managers & Navigators": "Administradores de casos y navegadores",
            "Star Ratings & Quality": "Calificaciones de estrellas y calidad",
            "Appeals: Levels & Timelines": "Apelaciones: niveles y plazos",
            "All Professional refs →": "Todas las referencias profesionales →",
            "State Medicaid": "Medicaid estatal",
            "SHIP (Medicare help)": "SHIP (ayuda con Medicare)",
            "Insurance Departments": "Departamentos de seguros",
            "All Resources": "Todos los recursos",
            "Printable Checklists": "Listas de verificación para imprimir",
            "Directories home →": "Inicio de directorios →"
        },
        "menu_button": "Menú",
        "open_menu": "Abrir menú de"
    }

    result = render_header("es", "members", "turning-65.html", chrome)
    # Critical 2: Brand href must be /es/
    assert 'href="/es/"' in result, f"Brand href not prefixed with /es/ in: {result}"


def test_render_footer_contains_note_and_links():
    """render_footer contains localized note with English link and official materials link (Critical 3)."""
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
                    "note_official": "Materiales oficiales de Medicare en español"
                }
            }
        ]
    }

    result = render_footer("es", "turning-65.html", chrome, languages)
    # Critical 3: Footer must contain note, English link, and official materials link
    assert "Traducción del original en inglés." in result, f"Note text missing in: {result}"
    assert 'href="/turning-65.html"' in result, f"English link missing in: {result}"
    assert 'href="https://www.medicare.gov/es"' in result, f"Official URL missing in: {result}"
    assert "Ver la versión original en inglés" in result, f"English link text missing in: {result}"
    assert "Materiales oficiales de Medicare en español" in result, f"Official materials link text missing in: {result}"
    # No English footer labels should survive
    assert "The Basics" not in result, f"English heading 'The Basics' found in: {result}"
