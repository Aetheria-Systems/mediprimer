#!/usr/bin/env python3
"""TDD tests for i18n_qa.py — translation QA gates."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from i18n_qa import structure_ok, facts_diff, completeness_ok, glossary_ok, run_gates


class TestStructureOk:
    """Test structure_ok: tag sequences, href multisets, markers."""

    def test_structure_ok_identical_pages(self):
        """Two identical HTML pages pass."""
        html = """<html><body>
<div><!--seo--></div>
<p>Text</p>
<!--P:analytics-->
</body></html>"""
        ok, reason = structure_ok(html, html)
        assert ok, reason

    def test_structure_ok_tag_names_must_match(self):
        """Dropped tag in translation fails."""
        en = """<html><body>
<div><!--seo--></div>
<p>Text</p>
<span>Extra</span>
<!--P:analytics-->
</body></html>"""
        tr = """<html><body>
<div><!--seo--></div>
<p>Text</p>
<!--P:analytics-->
</body></html>"""
        ok, reason = structure_ok(en, tr)
        assert not ok, "Dropped tag should fail"
        assert "span" in reason.lower()

    def test_structure_ok_href_multiset_must_match(self):
        """Changed external href fails."""
        en = """<html><body>
<a href="https://example.com">link</a>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        tr = """<html><body>
<a href="https://different.com">link</a>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        ok, reason = structure_ok(en, tr)
        assert not ok, "Changed external href should fail"
        assert "href" in reason.lower()

    def test_structure_ok_internal_href_can_gain_prefix(self):
        """Internal href can differ by leading /<code> prefix."""
        en = """<html><body>
<a href="/page.html">link</a>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        tr = """<html><body>
<a href="/es/page.html">link</a>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        ok, reason = structure_ok(en, tr)
        assert ok, f"Internal href with /<code> prefix should pass: {reason}"

    def test_structure_ok_missing_seo_marker(self):
        """Missing <!--seo--> marker fails."""
        en = """<html><body>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        tr = """<html><body>
<div></div>
<!--P:analytics-->
</body></html>"""
        ok, reason = structure_ok(en, tr)
        assert not ok, "Missing seo marker should fail"
        assert "seo" in reason.lower()

    def test_structure_ok_missing_analytics_marker(self):
        """Missing <!--P:analytics--> marker fails."""
        en = """<html><body>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        tr = """<html><body>
<div><!--seo--></div>
</body></html>"""
        ok, reason = structure_ok(en, tr)
        assert not ok, "Missing analytics marker should fail"
        assert "analytics" in reason.lower()


class TestFactsDiff:
    """Test facts_diff: extract numbers, entities, phone shapes."""

    def test_facts_diff_empty_on_identical(self):
        """Identical text returns empty list (no diffs)."""
        text = "Medicare costs $1,234.56 per year (2024). Call 1-800-MEDICARE."
        diff = facts_diff(text, text)
        assert diff == []

    def test_facts_diff_catches_changed_dollar_amount(self):
        """Changed dollar amount shows in diff."""
        en = "This costs $1,234.56 annually."
        back = "This costs $2,000.00 annually."
        diff = facts_diff(en, back)
        assert len(diff) > 0, "Dollar amount change should show in diff"

    def test_facts_diff_catches_dropped_year(self):
        """Missing year in back-translation shows in diff."""
        en = "Coverage since 2020."
        back = "Coverage since year."
        diff = facts_diff(en, back)
        assert len(diff) > 0, "Dropped year should show in diff"

    def test_facts_diff_tolerates_digit_grouping_localization(self):
        """2.100 vs 2,100 should NOT false-positive (both represent 2100)."""
        en = "2,100 beneficiaries"
        back = "2.100 beneficiarios"
        diff = facts_diff(en, back)
        # Should be empty or should handle digit grouping normalization
        # The spec says "normalize digit grouping before comparing"
        assert len(diff) == 0, "Localized digit grouping (2.100 vs 2,100) should be tolerated"

    def test_facts_diff_extracts_percentages(self):
        """Percentage difference caught."""
        en = "Coverage is 80% complete."
        back = "Coverage is 75% complete."
        diff = facts_diff(en, back)
        assert len(diff) > 0, "Percentage change should show in diff"

    def test_facts_diff_extracts_phone_shapes(self):
        """Phone number shape difference caught."""
        en = "Call 1-800-MEDICARE today."
        back = "Call 1-877-HELPLINE today."
        diff = facts_diff(en, back)
        assert len(diff) > 0, "Phone number difference should show in diff"

    def test_facts_diff_extracts_entities(self):
        """Title-cased program entities difference caught."""
        en = "Medicare and Medicaid beneficiaries."
        back = "Medicare and Adjusted Medicaid beneficiaries."
        diff = facts_diff(en, back)
        # Should catch the addition of "Adjusted" or the change in entity context
        assert len(diff) > 0, "Entity addition/change should show in diff"

    def test_facts_diff_symmetric_difference(self):
        """Returns symmetric difference (in EN but not back, or vice versa)."""
        en = "Years: 2020, 2021, 2022"
        back = "Years: 2020, 2021"
        diff = facts_diff(en, back)
        assert len(diff) > 0, "Dropped 2022 should show in symmetric diff"


class TestCompletenessOk:
    """Test completeness_ok: flag >2% English sentences."""

    def test_completeness_ok_all_target_language(self):
        """100% Spanish text passes."""
        text = """La cobertura de Medicare incluye atención hospitalaria y médica.
Los beneficiarios pueden elegir entre Original Medicare y Medicare Advantage.
El período de inscripción abierta comienza en octubre."""
        ok, reason = completeness_ok(text)
        assert ok, reason

    def test_completeness_ok_all_english(self):
        """100% English text fails."""
        text = """Medicare coverage includes hospital and medical care.
Beneficiaries can choose between Original Medicare and Medicare Advantage.
The open enrollment period starts in October."""
        ok, reason = completeness_ok(text)
        assert not ok, "All-English text should fail"
        assert "english" in reason.lower()

    def test_completeness_ok_flags_half_english(self):
        """50% English (>2% threshold) fails."""
        text = """Medicare coverage includes hospital care.
La cobertura de Medicaid es para personas de bajos ingresos.
Beneficiaries can choose plans.
Los planes tienen diferentes costos."""
        ok, reason = completeness_ok(text)
        assert not ok, "Half-English page should fail"

    def test_completeness_ok_tolerates_small_english_content(self):
        """<2% English passes (isolated English words/names OK)."""
        text = """La cobertura de Medicare es importante.
Los beneficiarios deben entender sus opciones.
El programa Social Security proporciona beneficios.
Medicaid es un programa federal."""
        ok, reason = completeness_ok(text)
        # Only a few common English words scattered, not full sentences
        assert ok, f"Mostly Spanish with scattered English terms should pass: {reason}"

    def test_completeness_ok_diacritic_presence_helps(self):
        """Presence of target-language diacritics prevents English flagging."""
        text = """Cobertura médica, afiliación, información.
Nuestros servicios facilitan la inscripción."""
        ok, reason = completeness_ok(text)
        assert ok, "Spanish diacritics (í, é, ó) should prevent English flagging"


class TestGlossaryOk:
    """Test glossary_ok: check term translations in translated HTML."""

    def test_glossary_ok_correct_terms(self):
        """Correct glossary translations pass."""
        en_html = """<html><body>
<p>Original Medicare covers hospital and medical services.</p>
</body></html>"""
        tr_html = """<html><body>
<p>Cobertura Original de Medicare cubre servicios hospitalarios y médicos.</p>
</body></html>"""
        terms = {
            "Original Medicare": "Cobertura Original de Medicare",
            "Medicare": "Medicare"
        }
        ok, missing = glossary_ok(en_html, tr_html, terms)
        assert ok, f"Correct terms should pass: {missing}"

    def test_glossary_ok_catches_wrong_term(self):
        """Wrong glossary translation fails."""
        en_html = """<html><body>
<p>Extra Help is a low-income subsidy.</p>
</body></html>"""
        tr_html = """<html><body>
<p>Ayuda Incorrecta es un subsidio de bajos ingresos.</p>
</body></html>"""
        terms = {
            "Extra Help": "Ayuda Adicional"  # Correct translation
        }
        ok, missing = glossary_ok(en_html, tr_html, terms)
        assert not ok, "Wrong translation should fail"
        assert "Extra Help" in missing or "Ayuda Adicional" in missing

    def test_glossary_ok_ignores_absent_terms(self):
        """Glossary term absent from EN source doesn't trigger check."""
        en_html = """<html><body>
<p>This page is about Medicare.</p>
</body></html>"""
        tr_html = """<html><body>
<p>Esta página trata de Medicare.</p>
</body></html>"""
        terms = {
            "Medicare": "Medicare",
            "Medicaid": "Medicaid",  # NOT in EN source
            "Extra Help": "Ayuda Adicional"  # NOT in EN source
        }
        ok, missing = glossary_ok(en_html, tr_html, terms)
        # Should not fail because Medicaid and Extra Help don't appear in EN
        assert ok, f"Absent glossary terms should not trigger check: {missing}"

    def test_glossary_ok_missing_term_in_translation(self):
        """Glossary term in EN but missing from TR fails."""
        en_html = """<html><body>
<p>Medicare and Medicaid are important programs.</p>
</body></html>"""
        tr_html = """<html><body>
<p>Medicare y los programas son importantes.</p>
</body></html>"""
        terms = {
            "Medicare": "Medicare",
            "Medicaid": "Medicaid"
        }
        ok, missing = glossary_ok(en_html, tr_html, terms)
        assert not ok, "Missing Medicaid translation should fail"
        assert "Medicaid" in missing


class TestRunGates:
    """Test run_gates: orchestrator of all four gates."""

    def test_run_gates_all_pass(self):
        """All gates pass returns (True, [])."""
        en_html = """<html><body>
<div><!--seo--></div>
<p>Medicare and Medicaid.</p>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html><body>
<div><!--seo--></div>
<p>Medicare y Medicaid.</p>
<!--P:analytics-->
</body></html>"""
        back_text = "Medicare and Medicaid."
        terms = {
            "Medicare": "Medicare",
            "Medicaid": "Medicaid"
        }
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        assert ok, f"All gates pass should return True: {failures}"
        assert failures == []

    def test_run_gates_structure_fails(self):
        """Failing structure_ok includes error in failures list."""
        en_html = """<html><body>
<div><!--seo--></div>
<span>Text</span>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html><body>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        back_text = "Text"
        terms = {}
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        assert not ok, "Dropped span should fail"
        assert len(failures) > 0
        assert any("structure" in f.lower() for f in failures)

    def test_run_gates_facts_fails(self):
        """Failing facts_diff includes error in failures list."""
        en_html = """<html><body>
<div><!--seo--></div>
<p>$1,234.56 per year</p>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html><body>
<div><!--seo--></div>
<p>$2,000.00 per year</p>
<!--P:analytics-->
</body></html>"""
        back_text = "$2,000.00 per year"
        terms = {}
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        assert not ok, "Different dollar amount should fail"
        assert len(failures) > 0
        assert any("fact" in f.lower() or "amount" in f.lower() for f in failures)

    def test_run_gates_completeness_fails(self):
        """Failing completeness_ok includes error in failures list."""
        en_html = """<html><body>
<div><!--seo--></div>
<p>Medicare coverage includes hospital and medical care.</p>
<p>Beneficiaries can choose between Original Medicare.</p>
<p>The open enrollment starts in October.</p>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html><body>
<div><!--seo--></div>
<p>Medicare coverage includes hospital and medical care.</p>
<p>Beneficiaries can choose between Original Medicare.</p>
<p>The open enrollment starts in October.</p>
<!--P:analytics-->
</body></html>"""
        back_text = "Medicare coverage. Beneficiaries can choose. Open enrollment."
        terms = {}
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        assert not ok, "English translation should fail completeness check"
        assert len(failures) > 0
        assert any("complete" in f.lower() or "english" in f.lower() for f in failures)

    def test_run_gates_glossary_fails(self):
        """Failing glossary_ok includes error in failures list."""
        en_html = """<html><body>
<div><!--seo--></div>
<p>Extra Help is a program.</p>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html><body>
<div><!--seo--></div>
<p>Ayuda Incorrecta es un programa.</p>
<!--P:analytics-->
</body></html>"""
        back_text = "Extra Help is a program."
        terms = {
            "Extra Help": "Ayuda Adicional"
        }
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        assert not ok, "Wrong glossary term should fail"
        assert len(failures) > 0
        assert any("glossary" in f.lower() or "extra help" in f.lower() for f in failures)
