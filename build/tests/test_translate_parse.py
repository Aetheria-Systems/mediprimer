"""parse_translation_response: the model's reply is delimited sections, not
JSON. Embedding ~14 KB of translated HTML inside a JSON string failed on any
unescaped quote ("Expecting ',' delimiter ... char 11015") and the old
"retry" re-parsed the same string, so those pages logged "Translation API
failed" every night (medicaid-eligibility es, 2026-09-16/17)."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from translate import parse_translation_response


def test_parses_three_sections_with_quotes_and_braces_in_html():
    out = '''Here is the translation.
<<<TITLE>>>
Elegibilidad para Medicaid: "Guía" 2026
<<<DESCRIPTION>>>
Qué cuenta como ingreso {y} recursos.
<<<MAIN_HTML>>>
<main><p>Ella dijo: "no". <strong>$1,736</strong> {"json": true}</p>
<p>Segunda línea</p></main>
<<<END>>>
'''
    main_html, title, desc = parse_translation_response(out)
    assert title == 'Elegibilidad para Medicaid: "Guía" 2026'
    assert desc == 'Qué cuenta como ingreso {y} recursos.'
    assert main_html.startswith('<main><p>Ella dijo: "no".')
    assert main_html.endswith('</main>')


def test_missing_section_returns_none():
    assert parse_translation_response('<<<TITLE>>>\nx\n<<<MAIN_HTML>>>\n<p>y</p>\n<<<END>>>') is None


def test_missing_end_marker_returns_none():
    assert parse_translation_response('<<<TITLE>>>\nx\n<<<DESCRIPTION>>>\nd\n<<<MAIN_HTML>>>\n<p>y</p>') is None


def test_empty_main_returns_none():
    assert parse_translation_response('<<<TITLE>>>\nx\n<<<DESCRIPTION>>>\nd\n<<<MAIN_HTML>>>\n   \n<<<END>>>') is None
