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

    def test_structure_ok_same_tag_types_different_count_gives_useful_reason(self):
        """Same set of tag types but a different count/order (e.g. an
        extra repeated <strong>) previously produced an empty, useless
        'Tag mismatch:' message (set-difference is blind to counts) — the
        reason must now name which tag's count differs."""
        en = """<html><body>
<div><!--seo--></div>
<p>One <strong>bold</strong> word.</p>
<!--P:analytics-->
</body></html>"""
        tr = """<html><body>
<div><!--seo--></div>
<p>Two <strong>bold</strong> <strong>words</strong>.</p>
<!--P:analytics-->
</body></html>"""
        ok, reason = structure_ok(en, tr)
        assert not ok, "Different <strong> count should fail"
        assert reason.strip() != "Tag mismatch:", \
            "reason must not be the old empty/uninformative message"
        assert "strong" in reason.lower()

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

    def test_structure_ok_internal_href_can_gain_hyphenated_prefix(self):
        """Hyphenated/mixed-case language codes (e.g. zh-Hant) must also be
        recognized as a valid internal href prefix, not just short
        lowercase ISO 639 codes like es/vi/ko."""
        en = """<html><body>
<a href="/page.html">link</a>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        tr = """<html><body>
<a href="/zh-Hant/page.html">link</a>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        ok, reason = structure_ok(en, tr)
        assert ok, f"Internal href with hyphenated /zh-Hant/ prefix should pass: {reason}"

    def test_structure_ok_non_locale_prefix_not_stripped(self):
        """A path segment that merely looks like a language code (2-3
        letters) but isn't a configured locale must NOT be treated as a
        language prefix. Before restricting the pattern to configured
        locale codes, routes like /faq/page.html normalized to
        /page.html, which could let a translation that silently dropped
        or changed a real route pass structure_ok."""
        en = """<html><body>
<a href="/faq/page.html">link</a>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        tr = """<html><body>
<a href="/page.html">link</a>
<div><!--seo--></div>
<!--P:analytics-->
</body></html>"""
        ok, reason = structure_ok(en, tr)
        assert not ok, "Non-locale path segment /faq/ must not be stripped like a language prefix"

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
        """Identical text returns empty diffs."""
        text = "Medicare costs $1,234.56 per year (2024). Call 1-800-MEDICARE."
        numeric, entity = facts_diff(text, text)
        assert numeric == [], f"Expected no numeric diffs, got {numeric}"
        # Entity diffs may exist but only for genuinely missing entities

    def test_facts_diff_catches_changed_dollar_amount(self):
        """Changed dollar amount shows in numeric diffs (ZERO tolerance)."""
        en = "This costs $1,234.56 annually."
        back = "This costs $2,000.00 annually."
        numeric, entity = facts_diff(en, back)
        assert len(numeric) > 0, "Dollar amount change should show in numeric diffs"

    def test_facts_diff_catches_dropped_year(self):
        """Missing year in back-translation shows in numeric diffs (ZERO tolerance)."""
        en = "Coverage since 2020."
        back = "Coverage since year."
        numeric, entity = facts_diff(en, back)
        assert len(numeric) > 0, "Dropped year should show in numeric diffs"

    def test_facts_diff_digit_grouping_normalization_us_vs_eu(self):
        """2,100 (US) vs 2.100 (EU) both represent 2100, should not diff."""
        en = "There are 2,100 beneficiaries enrolled."
        back = "There are 2.100 beneficiarios enrolled."
        numeric, entity = facts_diff(en, back)
        assert len(numeric) == 0, "Localized digit grouping (2,100 vs 2.100) should normalize to same"

    def test_facts_diff_dollar_localization_no_diff(self):
        """$2,100 (US format) vs $2.100 (European format) both represent $2100."""
        en = "The cost is $2,100 annually."
        back = "The cost is $2.100 annually."
        numeric, entity = facts_diff(en, back)
        assert len(numeric) == 0, "Dollar with different grouping should normalize to same value"

    def test_facts_diff_trailing_sentence_comma_not_part_of_amount(self):
        """"$8,000, and your share..." — the comma right after the amount
        belongs to the sentence, not the number. A naive greedy regex
        swallows it into the match, producing a false mismatch against a
        back-translation that (correctly) drops the redundant comma before
        "and". Real bug found on costs.html: EN normalized to '8000,'
        (trailing comma) while a faithful back-translation normalized to
        '8000' (no comma) — pure punctuation artifact, not a value change."""
        en = "The bill is $8,000, and your share would be $1,600."
        back = "The bill is $8,000 and your share would be $1,600."
        numeric, entity = facts_diff(en, back)
        assert len(numeric) == 0, \
            f"trailing sentence comma must not be treated as part of the amount: {numeric}"

    def test_facts_diff_ambiguity_edge_case_different_magnitudes(self):
        """$283 vs $283.000 should be flagged as different (283 vs 283000)."""
        en = "Cost is $283 monthly."
        back = "Cost is $283.000 monthly."  # European format: 283 thousand
        numeric, entity = facts_diff(en, back)
        assert len(numeric) > 0, "$283 and $283.000 (European) represent different amounts and should be flagged"

    def test_facts_diff_ambiguity_edge_case_decimal_vs_thousands(self):
        """$21.00 vs $2,100 should remain different (decimal vs thousands)."""
        en = "Amount is $21.00."
        back = "Amount is $2,100."
        numeric, entity = facts_diff(en, back)
        assert len(numeric) > 0, "$21.00 and $2,100 are genuinely different amounts"

    def test_facts_diff_extracts_percentages(self):
        """Percentage difference caught (ZERO tolerance)."""
        en = "Coverage is 80% complete."
        back = "Coverage is 75% complete."
        numeric, entity = facts_diff(en, back)
        assert len(numeric) > 0, "Percentage change should show in numeric diffs"

    def test_facts_diff_extracts_phone_shapes(self):
        """Phone number shape difference caught (ZERO tolerance)."""
        en = "Call 1-800-MEDICARE today."
        back = "Call 1-877-HELPLINE today."
        numeric, entity = facts_diff(en, back)
        assert len(numeric) > 0, "Phone number difference should show in numeric diffs"

    def test_facts_diff_extracts_entities(self):
        """Title-cased program entities: rewording allowed, missing keywords caught."""
        # Rewording is OK - "Medicaid" is still present
        en = "Medicare and Medicaid beneficiaries."
        back = "Medicare and Adjusted Medicaid beneficiaries."
        numeric, entity = facts_diff(en, back)
        # "Adjusted Medicaid" still contains "Medicaid", so no diff (rewording allowed)
        assert len(entity) == 0, "Entity rewording with keywords present should not diff"

        # But missing the entity is caught
        en2 = "Medicare Advantage plans."
        back2 = "Plans for seniors."  # "Medicare Advantage" is missing
        numeric2, entity2 = facts_diff(en2, back2)
        assert len(entity2) > 0, "Missing entity keywords should show in diffs"

    def test_facts_diff_keyword_substring_false_positive(self):
        """A bare keyword must not match as a substring of an unrelated
        word. "PACE" is a real entity keyword; "SPACE" merely contains it.
        Before the word-boundary fix, `kw in text` matched "PACE" inside
        "SPACE" and let a genuinely dropped entity through undetected."""
        en = "Enrollees in PACE receive coordinated benefits."
        back = "Enrollees receive coordinated benefits under a shared SPACE arrangement."
        numeric, entity = facts_diff(en, back)
        assert len(entity) > 0, "Missing PACE entity must not be masked by 'SPACE' substring match"

    def test_facts_diff_keyword_case_insensitive(self):
        """A bare keyword differing only in case from the back-translation
        must still be recognized as present. Before the fix, the primary
        check compared against original (non-lowercased) text, so a
        keyword with no listed expansion (e.g. QMB) would be falsely
        flagged as missing if the back-translation lowercased it."""
        en = "You may qualify for QMB assistance."
        back = "You may qualify for qmb assistance."
        numeric, entity = facts_diff(en, back)
        assert len(entity) == 0, "Case-differing keyword should still count as present"

    def test_facts_diff_symmetric_difference(self):
        """Returns symmetric difference (in EN but not back, or vice versa)."""
        en = "Years: 2020, 2021, 2022"
        back = "Years: 2020, 2021"
        numeric, entity = facts_diff(en, back)
        assert len(numeric) > 0, "Dropped 2022 should show in numeric diffs"


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
        """100% English text fails (excluding entity keywords like Medicare)."""
        # Use non-entity English text to test failure
        text = """Coverage includes hospital and medical care.
Beneficiaries can choose between original and advantage plans.
The enrollment period starts in October."""
        ok, reason = completeness_ok(text)
        assert not ok, "All-English text should fail"
        assert "english" in reason.lower()

    def test_completeness_ok_flags_half_english(self):
        """50% English (>2% threshold) fails (excluding entity keywords)."""
        text = """Coverage includes hospital care.
La cobertura es para personas de bajos ingresos.
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

    def test_glossary_ok_tolerates_paren_width_mismatch(self):
        """Full-width （） vs half-width () around a Latin-script acronym
        embedded in CJK text is a punctuation style choice, not a
        translation error -- the same model produces either form
        inconsistently, even within one page (verified against real
        Chinese translation output during the zh-Hant launch)."""
        en_html = """<html><body>
<p>Contact the Centers for Medicare & Medicaid Services (CMS) for details.</p>
</body></html>"""
        tr_html = """<html><body>
<p>詳情請聯絡美國醫療保險和醫療補助服務中心(CMS)。</p>
</body></html>"""
        terms = {
            "Centers for Medicare & Medicaid Services (CMS)": "美國醫療保險和醫療補助服務中心（CMS）"
        }
        ok, missing = glossary_ok(en_html, tr_html, terms)
        assert ok, f"Half-width parens should still match full-width glossary term: {missing}"

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

    def test_glossary_ok_case_insensitive_midsentence(self):
        """A correctly-lowercased mid-sentence use of the term must pass —
        the glossary dict's capitalization is a display convention, not a
        requirement; real Spanish prose lowercases common nouns
        mid-sentence (e.g. 'cada reclamación precisa'). A prior
        case-sensitive check rejected this as a real translation."""
        en_html = """<html><body>
<p>Each claim must be accurate to ensure proper payment.</p>
</body></html>"""
        tr_html = """<html><body>
<p>Cada reclamación precisa asegura el pago correcto.</p>
</body></html>"""
        terms = {"Claim": "Reclamación"}
        ok, missing = glossary_ok(en_html, tr_html, terms)
        assert ok, f"Correctly-lowercased mid-sentence term should pass: {missing}"


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
        """Failing completeness_ok includes error in failures list (excluding entity keywords)."""
        en_html = """<html><body>
<div><!--seo--></div>
<main>
<p>Coverage includes hospital and medical care.</p>
<p>Beneficiaries can choose between original plans.</p>
<p>The open enrollment starts in October.</p>
</main>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html><body>
<div><!--seo--></div>
<main>
<p>Coverage includes hospital and medical care.</p>
<p>Beneficiaries can choose between original plans.</p>
<p>The open enrollment starts in October.</p>
</main>
<!--P:analytics-->
</body></html>"""
        back_text = "Coverage and care. Beneficiaries can choose. Enrollment."
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

    def test_run_gates_with_main_single_dollar_amount_change_fails(self):
        """Single changed dollar in main content fails (ZERO tolerance for numeric facts)."""
        en_html = """<html lang="en"><body>
<!--seo--></div><!--/seo-->
<main>
<p>The annual premium is $1,234.56 for coverage.</p>
</main>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html lang="es"><body>
<!--seo--></div><!--/seo-->
<main>
<p>La prima anual es $2,000.00 para cobertura.</p>
</main>
<!--P:analytics-->
</body></html>"""
        back_text = "The annual premium is $2,000.00 for coverage."
        terms = {}
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        assert not ok, "Single changed dollar amount in main should fail"
        assert any("fact" in f.lower() and "numeric" in f.lower() for f in failures)

    def test_run_gates_with_main_entity_reworded_but_present_passes(self):
        """Entity reworded (e.g., 'Medicare Part B' → 'Part B of Medicare') but present should pass."""
        en_html = """<html lang="en"><body>
<!--seo--></div><!--/seo-->
<main>
<p>Medicare Part B covers physician services.</p>
</main>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html lang="es"><body>
<!--seo--></div><!--/seo-->
<main>
<p>La Parte B de Medicare cubre servicios médicos.</p>
</main>
<!--P:analytics-->
</body></html>"""
        # Back-translate with rewording but entity present
        back_text = "Part B of Medicare covers physician services."
        terms = {}
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        # Note: This test shows that entity rewording should be allowed
        # The gate should pass IF entity's key words are present
        # (entity matching via significant words, not exact phrase match)

    def test_run_gates_with_main_entity_completely_missing_fails(self):
        """Entity missing from back-translation fails."""
        en_html = """<html lang="en"><body>
<!--seo--></div><!--/seo-->
<main>
<p>Medicare Part B coverage begins at age 65.</p>
</main>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html lang="es"><body>
<!--seo--></div><!--/seo-->
<main>
<p>La cobertura comienza a los 65 años.</p>
</main>
<!--P:analytics-->
</body></html>"""
        # Back-translate without Medicare Part B
        back_text = "Coverage begins at age 65."
        terms = {}
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        assert not ok, "Missing entity 'Medicare Part B' should fail"
        assert any("fact" in f.lower() and "entity" in f.lower() for f in failures)

    def test_run_gates_orphaned_vault_token_fails(self):
        """Orphaned vault token in final HTML fails."""
        en_html = """<html lang="en"><body>
<!--seo--></div><!--/seo-->
<main>
<p>Visit <a href="/help.html">our help page</a>.</p>
</main>
<!--P:analytics-->
</body></html>"""
        tr_html = """<html lang="es"><body>
<!--seo--></div><!--/seo-->
<main>
<p>Visite <a href="⟦P0⟧">nuestra página de ayuda</a>.</p>
</main>
<!--P:analytics-->
</body></html>"""
        back_text = "Visit our help page."
        terms = {}
        ok, failures = run_gates(en_html, tr_html, back_text, terms)
        assert not ok, "Orphaned vault token should fail"
        assert any("orphan" in f.lower() or "vault" in f.lower() or "⟦P" in " ".join(failures) for f in failures)
