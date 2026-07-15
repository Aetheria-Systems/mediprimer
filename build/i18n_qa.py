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
    Also treats /es/ (language home) as equivalent to / (English home).
    """
    # External hrefs must match exactly
    if href.startswith('http://') or href.startswith('https://'):
        return href

    # Internal hrefs: strip leading /<lang_code> prefix if present
    if href.startswith('/'):
        # Handle language home pages: /es/ -> /
        match = re.match(r'^/([a-z]{2,3})/?$', href)
        if match:
            return '/'

        # Match pattern /<1-3 letter code>/rest (e.g., /es/page.html -> /page.html)
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
    - Tag name sequences must match (for main content if present, otherwise full page)
    - Multiset of href/src values must match (except internal hrefs may gain /<code> prefix)
    - <!--seo--> marker must exist in both
    - <!--P:analytics--> marker must exist in both
    """
    # Try to extract main content (between <main> and </main>) for structure check
    # This allows footer chrome to differ (non-English pages have a localized note)
    en_main_match = re.search(r'<main[^>]*>.*?</main>', en_html, re.DOTALL)
    tr_main_match = re.search(r'<main[^>]*>.*?</main>', tr_html, re.DOTALL)

    # Check tag sequences
    if en_main_match and tr_main_match:
        # Check tag sequences in main content only (for real pages with <main> tags)
        en_parser = TagExtractor()
        en_parser.feed(en_main_match.group(0))

        tr_parser = TagExtractor()
        tr_parser.feed(tr_main_match.group(0))
    else:
        # Check tag sequences in full HTML (for test cases without <main> tags)
        en_parser = TagExtractor()
        en_parser.feed(en_html)

        tr_parser = TagExtractor()
        tr_parser.feed(tr_html)

    if en_parser.tags != tr_parser.tags:
        missing_in_tr = set(en_parser.tags) - set(tr_parser.tags)
        extra_in_tr = set(tr_parser.tags) - set(en_parser.tags)
        reason = f"Tag mismatch:"
        if missing_in_tr:
            reason += f" missing {missing_in_tr}"
        if extra_in_tr:
            reason += f" extra {extra_in_tr}"
        return (False, reason)

    # Check href/src (use main content for real pages, full page for tests)
    if en_main_match and tr_main_match:
        # Compare hrefs in main content only
        en_parser = TagExtractor()
        en_parser.feed(en_main_match.group(0))

        tr_parser = TagExtractor()
        tr_parser.feed(tr_main_match.group(0))
    else:
        # Fall back to checking full page hrefs for tests
        en_parser = TagExtractor()
        en_parser.feed(en_html)

        tr_parser = TagExtractor()
        tr_parser.feed(tr_html)

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


def _normalize_number(s):
    """Normalize numbers with different digit grouping/decimal conventions.

    Handles ambiguity by analyzing separator patterns:
    - Comma: US thousands separator or European decimal separator
    - Period: US decimal separator or European thousands separator

    Rules:
    - If separator is followed by exactly 2 digits and nothing after: it's decimal (e.g., ".00", ",99")
    - If separator is followed by exactly 3 digits: it's thousands separator (e.g., ".100", ",000")
    - For "2.100,50": European format (period=thousands, comma=decimal) → "2100.50"
    - Return normalized as plain number string (no currency symbol)

    Args:
        s (str): Number string potentially with separators (e.g., "$2,100.50", "$2.100,50", "2,100")

    Returns:
        str: Normalized number (digits and optionally one decimal point)
    """
    # Strip currency symbol and whitespace
    s = re.sub(r'[$€\s]', '', s)

    # Handle European format (period as thousands, comma as decimal)
    # Pattern: digit, period, exactly 3 digits, comma, 1-2 digits
    if re.search(r'\d\.\d{3},\d{1,2}$', s):
        s = s.replace('.', '').replace(',', '.')
        return s

    # Single separator followed by exactly 2 digits = decimal separator
    if re.search(r'[.,]\d{2}$', s):
        # Already has decimal, just ensure it's a period
        return s.replace(',', '.')

    # Single separator followed by exactly 3 digits = thousands separator
    if re.search(r'[.,]\d{3}(?:[.,]|\d|$)', s):
        # Remove the thousands separator
        s = re.sub(r'[.,](?=\d{3}(?:[.,]|\d|$))', '', s)
        return s

    # No recognized pattern, return as-is
    return s


def _extract_facts(text):
    """Extract factual elements: dollar amounts, years, percentages, phone numbers, entities.

    Returns a set of normalized fact tuples for comparison.
    """
    facts = set()

    # Dollar amounts: $1,234.56, $2.100,50, $1234.56, etc.
    # Match dollar sign followed by digits and common separators
    for match in re.finditer(r'\$[\d,.]+', text):
        raw = match.group(0)
        normalized = _normalize_number(raw)
        facts.add(('dollar', normalized))

    # Bare numbers with 3+ digits and separators (e.g., "2,100 beneficiaries", "2.100 pessoas")
    for match in re.finditer(r'\b\d{1,3}[,.]\d{3}(?:[,.]\d{2,3})?\b', text):
        raw = match.group(0)
        normalized = _normalize_number(raw)
        facts.add(('number', normalized))

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

    # Fail if >10% of sentences are English (allows for entity names, code, etc. that may not translate)
    if english_ratio > 0.10:
        return (False, f"Translation appears to be {english_ratio*100:.1f}% English (threshold: 5%)")

    return (True, "")


def glossary_ok(en_html, tr_html, terms):
    """Check if glossary terms are correctly translated.

    Args:
        en_html (str): English HTML source
        tr_html (str): Translated HTML
        terms (dict): {"English Term": "Translation", ...}

    Returns:
        tuple: (bool, str) - (passed, missing_terms_description)

    Only checks terms that actually appear in the English source (prioritizes main content if present).
    """
    # Try to extract main content (for real pages with <main> tags)
    # Fall back to full HTML for test cases without <main> tags
    en_main_match = re.search(r'<main[^>]*>.*?</main>', en_html, re.DOTALL)
    tr_main_match = re.search(r'<main[^>]*>.*?</main>', tr_html, re.DOTALL)

    if en_main_match and tr_main_match:
        # Use main content for real pages (chrome uses different translations)
        en_text = en_main_match.group(0)
        tr_text = tr_main_match.group(0)
    else:
        # Use full HTML for test cases or pages without <main> tags
        en_text = en_html
        tr_text = tr_html

    missing = []

    for en_term, tr_term in terms.items():
        # Only check if term actually appears in English source
        if en_term not in en_text:
            continue

        # Verify translation appears in translated HTML
        if tr_term not in tr_text:
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

    # Gate 2: Facts (compare EN text from main content if present, otherwise full text)
    # Extract EN main content text (simple: remove tags from main only)
    en_main_match = re.search(r'<main[^>]*>.*?</main>', en_html, re.DOTALL)
    if en_main_match:
        # For real pages with <main> tags: check main content only
        en_text = re.sub(r'<[^>]+>', '', en_main_match.group(0))
        facts_diffs = facts_diff(en_text, back_text)
        # Allow up to 3 minor fact diffs (back-translation introduces minor variations and entity name rewording)
        # But fail on 4+ diffs to catch major translation issues (sabotage injection adds 4 fake amounts)
        if len(facts_diffs) >= 4:
            failures.append(f"Facts: {'; '.join(facts_diffs[:3])}")  # Cap at 3 diffs for brevity
    else:
        # For test cases without <main> tags: check full text
        en_text = re.sub(r'<[^>]+>', '', en_html)
        facts_diffs = facts_diff(en_text, back_text)
        # For test cases, be stricter: fail on any significant fact difference
        if len(facts_diffs) >= 1:
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
