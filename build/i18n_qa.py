#!/usr/bin/env python3
"""i18n_qa.py — translation QA gates for multilingual content.

Four deterministic QA gates to validate translations before publishing:
1. structure_ok: HTML tag sequences, href multisets, required markers
2. facts_diff: extract and compare factual content (numbers, entities)
3. completeness_ok: flag translations that are actually still in English
4. glossary_ok: verify glossary terms are translated correctly
"""
import re
from html.parser import HTMLParser


class TagExtractor(HTMLParser):
    """Extract tag names and href/src attributes from HTML."""
    def __init__(self):
        super().__init__()
        self.tags = []  # List of tag names in order
        self.hrefs = []  # All href and src attribute values

    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        for attr, value in attrs:
            if attr in ('href', 'src') and value:
                self.hrefs.append(value)


def _normalize_internal_href(href):
    """Normalize internal href for comparison.

    Allow internal hrefs to differ by a leading /<code> prefix.
    External hrefs must match exactly.
    """
    # External hrefs must match exactly
    if href.startswith('http://') or href.startswith('https://'):
        return href

    # Internal hrefs: strip leading /<lang_code> prefix if present (e.g., /es/page.html -> /page.html)
    if href.startswith('/'):
        # Match pattern /<1-3 letter code>/rest
        match = re.match(r'^/([a-z]{2,3})/(.+)$', href)
        if match:
            return '/' + match.group(2)

    return href


def structure_ok(en_html, tr_html):
    """Check HTML structure integrity in translation.

    Args:
        en_html (str): English HTML
        tr_html (str): Translated HTML

    Returns:
        tuple: (bool, str) - (passed, reason_if_failed)

    Checks:
    - Tag name sequence must be identical
    - Multiset of href/src values must match (except internal hrefs may gain /<code> prefix)
    - <!--seo--> marker must exist in both
    - <!--P:analytics--> marker must exist in both
    """
    # Extract tags and hrefs
    en_parser = TagExtractor()
    en_parser.feed(en_html)

    tr_parser = TagExtractor()
    tr_parser.feed(tr_html)

    # Check tag name sequences match
    if en_parser.tags != tr_parser.tags:
        missing_in_tr = set(en_parser.tags) - set(tr_parser.tags)
        extra_in_tr = set(tr_parser.tags) - set(en_parser.tags)
        reason = f"Tag mismatch:"
        if missing_in_tr:
            reason += f" missing {missing_in_tr}"
        if extra_in_tr:
            reason += f" extra {extra_in_tr}"
        return (False, reason)

    # Check href/src multisets match (with normalization for internal hrefs)
    en_hrefs_norm = sorted([_normalize_internal_href(h) for h in en_parser.hrefs])
    tr_hrefs_norm = sorted([_normalize_internal_href(h) for h in tr_parser.hrefs])

    if en_hrefs_norm != tr_hrefs_norm:
        return (False, f"href/src mismatch: EN={en_hrefs_norm}, TR={tr_hrefs_norm}")

    # Check seo marker
    if '<!--seo-->' not in en_html:
        return (False, "Missing <!--seo--> marker in English")
    if '<!--seo-->' not in tr_html:
        return (False, "Missing <!--seo--> marker in translation")

    # Check analytics marker
    if '<!--P:analytics-->' not in en_html:
        return (False, "Missing <!--P:analytics--> marker in English")
    if '<!--P:analytics-->' not in tr_html:
        return (False, "Missing <!--P:analytics--> marker in translation")

    return (True, "")


def _extract_facts(text):
    """Extract factual elements: dollar amounts, years, percentages, phone numbers, entities.

    Returns a set of normalized fact strings for comparison.
    """
    facts = set()

    # Dollar amounts: $1,234.56 or $1234.56
    # Normalize to a consistent form (remove commas)
    for match in re.finditer(r'\$[\d,]+(?:\.\d{2})?', text):
        normalized = match.group(0).replace(',', '')
        facts.add(('dollar', normalized))

    # Years: 19xx or 20xx (bare numbers with context)
    for match in re.finditer(r'\b(19|20)\d{2}\b', text):
        facts.add(('year', match.group(0)))

    # Percentages: 80%, 75%, etc.
    for match in re.finditer(r'\d{1,3}%', text):
        facts.add(('percent', match.group(0)))

    # Phone number shapes: 1-800-XXXX or 1-877-YYYY (alphanumeric)
    # Match 1-<digits>-<alphanumeric sequence>
    for match in re.finditer(r'\b1-\d{3}-[A-Z0-9]+\b', text):
        facts.add(('phone', match.group(0)))

    # Title-cased entities (Medicare, Medicaid, CHIP, SHIP, IRMAA, MOOP, etc.)
    # Match words that start with uppercase (and may have more uppercase letters)
    # Exclude common words like "The", "This", "And", "But", "For"
    common_words = {'The', 'This', 'That', 'These', 'Those', 'And', 'But', 'For', 'With', 'From', 'To', 'In', 'On', 'At', 'By'}
    for match in re.finditer(r'\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*(?:\s+(?:and|or)\s+[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)*\b', text):
        entity = match.group(0)
        # Filter out common starting words and very short words
        if entity not in common_words and len(entity) > 3:
            # Check if it looks like a proper entity (has Medicare, Medicaid, CHIP, SHIP, etc.)
            if any(term in entity for term in ['Medicare', 'Medicaid', 'CHIP', 'SHIP', 'IRMAA', 'MOOP', 'QMB', 'SLMB', 'PACE', 'SNF', 'SNP', 'MCO', 'DME', 'EOB', 'ABN', 'COB', 'CBP']):
                facts.add(('entity', entity))

    return facts


def facts_diff(en_text, back_translated_text):
    """Extract and compare factual content between EN and back-translated text.

    Args:
        en_text (str): Original English text
        back_translated_text (str): Back-translated text (translated back to English)

    Returns:
        list[str]: Symmetric difference of facts (empty if all facts match).
                   Returns human-readable descriptions of mismatches.
    """
    en_facts = _extract_facts(en_text)
    back_facts = _extract_facts(back_translated_text)

    # Symmetric difference
    only_in_en = en_facts - back_facts
    only_in_back = back_facts - en_facts

    differences = []

    for fact_type, value in only_in_en:
        differences.append(f"Missing in translation: {fact_type} '{value}'")

    for fact_type, value in only_in_back:
        differences.append(f"Extra in translation: {fact_type} '{value}'")

    return differences


# English stopwords (comprehensive set for language detection)
ENGLISH_STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
    'for', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might',
    'include', 'includes', 'choose', 'care', 'hospital', 'coverage', 'benefit', 'plan',
    'from', 'with', 'by', 'as', 'about', 'not', 'this', 'that', 'which', 'who'
}

# Target-language diacritics (Spanish and other Romance languages)
DIACRITIC_PATTERN = r'[àáâãäåèéêëìíîïòóôõöùúûüýÿçñ]'


def completeness_ok(tr_text):
    """Check if translation is genuinely in target language.

    Args:
        tr_text (str): Translated text to check

    Returns:
        tuple: (bool, str) - (passed, reason_if_failed)

    Flags if >2% of sentences look English (heuristic):
    - Sentence has ≥4 hits from English stopword list
    - AND sentence has no target-language diacritics
    """
    # Split into sentences (basic heuristic: period, question mark, exclamation)
    sentences = re.split(r'[.!?]+', tr_text)
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return (True, "")

    english_sentences = 0

    for sentence in sentences:
        # Count English stopword hits (case-insensitive)
        words = re.findall(r'\b\w+\b', sentence.lower())
        stopword_hits = sum(1 for word in words if word in ENGLISH_STOPWORDS)

        # Check for diacritics
        has_diacritics = bool(re.search(DIACRITIC_PATTERN, sentence))

        # Flag as English if ≥4 stopword hits AND no diacritics
        if stopword_hits >= 4 and not has_diacritics:
            english_sentences += 1

    english_ratio = english_sentences / len(sentences)

    # Fail if >2% of sentences are English
    if english_ratio > 0.02:
        return (False, f"Translation appears to be {english_ratio*100:.1f}% English (threshold: 2%)")

    return (True, "")


def glossary_ok(en_html, tr_html, terms):
    """Check if glossary terms are correctly translated.

    Args:
        en_html (str): English HTML source
        tr_html (str): Translated HTML
        terms (dict): {"English Term": "Translation", ...}

    Returns:
        tuple: (bool, str) - (passed, missing_terms_description)

    Only checks terms that actually appear in the English source.
    """
    missing = []

    for en_term, tr_term in terms.items():
        # Only check if term actually appears in English source
        if en_term not in en_html:
            continue

        # Verify translation appears in translated HTML
        if tr_term not in tr_html:
            missing.append(f"'{en_term}' (should be '{tr_term}')")

    if missing:
        return (False, "; ".join(missing))

    return (True, "")


def run_gates(en_html, tr_html, back_text, terms):
    """Orchestrator: run all four QA gates.

    Args:
        en_html (str): English HTML source
        tr_html (str): Translated HTML
        back_text (str): Back-translated text (from second headless call)
        terms (dict): Glossary terms {"English": "Translation"}

    Returns:
        tuple: (bool, list[str]) - (all_passed, failures_list)
                If all gates pass, returns (True, []).
                If any gate fails, returns (False, ["Gate: reason", ...])
    """
    failures = []

    # Gate 1: Structure
    ok, reason = structure_ok(en_html, tr_html)
    if not ok:
        failures.append(f"Structure: {reason}")

    # Gate 2: Facts (compare EN text from HTML with back-translated text)
    # Extract EN text from HTML (simple: remove tags)
    en_text = re.sub(r'<[^>]+>', '', en_html)
    facts_diffs = facts_diff(en_text, back_text)
    if facts_diffs:
        failures.append(f"Facts: {'; '.join(facts_diffs[:3])}")  # Cap at 3 diffs for brevity

    # Gate 3: Completeness (check translated HTML text)
    tr_text = re.sub(r'<[^>]+>', '', tr_html)
    ok, reason = completeness_ok(tr_text)
    if not ok:
        failures.append(f"Completeness: {reason}")

    # Gate 4: Glossary
    ok, reason = glossary_ok(en_html, tr_html, terms)
    if not ok:
        failures.append(f"Glossary: {reason}")

    return (len(failures) == 0, failures)
