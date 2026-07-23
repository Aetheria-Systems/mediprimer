#!/usr/bin/env python3
"""i18n_qa.py — translation QA gates for multilingual content.

Four deterministic QA gates to validate translations before publishing:
1. structure_ok: HTML tag sequences, href multisets, required markers
2. facts_diff: extract and compare factual content (numbers, entities)
3. completeness_ok: flag translations that are actually still in English
4. glossary_ok: verify glossary terms are translated correctly
"""
import re
from collections import Counter
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

    # Internal hrefs: strip leading /<lang_code> prefix if present.
    # Codes are 2-3 letter base tags, optionally with a script/region
    # subtag (e.g. "es", "zh-Hant") -- BCP-47-ish, not just bare ISO 639.
    LANG_CODE = r'[a-zA-Z]{2,3}(?:-[a-zA-Z]+)?'
    if href.startswith('/'):
        # Handle language home pages: /es/ -> /
        match = re.match(r'^/(' + LANG_CODE + r')/?$', href)
        if match:
            return '/'

        # Match pattern /<code>/rest (e.g., /es/page.html -> /page.html)
        match = re.match(r'^/(' + LANG_CODE + r')/(.+)$', href)
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
        if not missing_in_tr and not extra_in_tr:
            # Same set of tag types on both sides — the divergence is in
            # count or order (e.g. a repeated <strong> or reordered <p>s),
            # which a plain set-difference can't reveal. Report count
            # deltas per tag and the first index where the sequences part
            # ways, so a retry has something concrete to act on.
            en_counts, tr_counts = Counter(en_parser.tags), Counter(tr_parser.tags)
            count_diffs = {
                tag: (en_counts[tag], tr_counts[tag])
                for tag in set(en_counts) | set(tr_counts)
                if en_counts[tag] != tr_counts[tag]
            }
            first_diff_index = next(
                (i for i, (a, b) in enumerate(zip(en_parser.tags, tr_parser.tags)) if a != b),
                min(len(en_parser.tags), len(tr_parser.tags)),
            )
            reason += (
                f" same tag types, different count/order — per-tag (en, tr) counts "
                f"that differ: {count_diffs}; sequences first diverge at index "
                f"{first_diff_index} (en={en_parser.tags[first_diff_index:first_diff_index+3]}, "
                f"tr={tr_parser.tags[first_diff_index:first_diff_index+3]})"
            )
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
    # Match dollar sign followed by digits and common separators. A
    # trailing ',' or '.' with no digit after it inside the match (e.g.
    # "$8,000," at the end of a clause, comma belongs to the sentence) is
    # never a real separator — a genuine thousands/decimal separator is by
    # definition always followed by digits — so strip it before comparing.
    for match in re.finditer(r'\$[\d,.]+', text):
        raw = match.group(0).rstrip(',.')
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

    Categorizes diffs into NUMERIC (zero-tolerance: any mismatch fails) and ENTITY
    (smart matching: entity must contain significant words but rewording allowed).

    Entities match if they share key program names (Medicare, Medicaid, CHIP, SHIP, etc.).
    Rewording like "Medicare Part B" → "Part B of Medicare" or "Centers for Medicare & Medicaid
    Services" → "Medicare and Medicaid Services" are considered matches.

    Args:
        en_text (str): Original English text
        back_translated_text (str): Back-translated text (translated back to English)

    Returns:
        tuple: (numeric_diffs, entity_diffs)
               numeric_diffs: list of diffs for dollars/percents/years/phones (ZERO tolerance)
               entity_diffs: list of diffs for entities (fail only if key entity words missing)
    """
    en_facts = _extract_facts(en_text)
    back_facts = _extract_facts(back_translated_text)

    only_in_en = en_facts - back_facts
    only_in_back = back_facts - en_facts

    numeric_diffs = []
    entity_diffs = []

    # Program entity keywords for smart matching
    entity_keywords = {'Medicare', 'Medicaid', 'CHIP', 'SHIP', 'IRMAA', 'MOOP', 'QMB', 'SLMB', 'PACE', 'SNF', 'SNP', 'MCO', 'DME', 'EOB', 'ABN', 'COB', 'CBP'}

    # Some keywords are acronyms whose full-English-name expansion is what a
    # back-translation naturally produces (e.g. Chinese "耐用醫療設備" back-
    # translates to "durable medical equipment", not the abbreviation "DME").
    # Matching only the bare acronym string produced false failures despite
    # the concept being fully and correctly preserved. Accept either form.
    keyword_expansions = {
        'DME': 'durable medical equipment',
        'EOB': 'explanation of benefits',
        'ABN': 'advance beneficiary notice',
        'COB': 'coordination of benefits',
        'MOOP': 'maximum out-of-pocket',
        'SNF': 'skilled nursing facility',
        'SNP': 'special needs plan',
        'MCO': 'managed care organization',
        'PACE': 'program of all-inclusive care for the elderly',
    }

    def get_entity_keywords(entity_text):
        """Extract program keywords from an entity string."""
        words = entity_text.split()
        return set(w for w in words if w in entity_keywords)

    def keyword_present(kw, text):
        """True if the bare keyword or its known expansion appears in text."""
        text_lower = text.lower()
        if kw in text:
            return True
        expansion = keyword_expansions.get(kw)
        return expansion is not None and expansion in text_lower

    # Categorize diffs: NUMERIC diffs are STRICT, ENTITY diffs use smart matching
    for fact_type, value in only_in_en:
        if fact_type in ('dollar', 'percent', 'year', 'phone'):
            # NUMERIC: ZERO tolerance, any mismatch is a failure
            numeric_diffs.append(f"Missing: {fact_type} '{value}'")
        elif fact_type == 'entity':
            # ENTITY: Check if key program words appear in back translation
            # "Medicare Part B" → "Part B of Medicare" is OK (keywords present)
            # "Centers for Medicare & Medicaid Services" → "Medicare and Medicaid Services" is OK
            # But "Medicare Part B" → "Coverage" is NOT OK (no keywords)
            en_keywords = get_entity_keywords(value)
            if en_keywords:  # Has program keywords (Medicare, Medicaid, etc.)
                # Fail only if ALL keywords are missing from back_translated_text
                if all(not keyword_present(kw, back_translated_text) for kw in en_keywords):
                    entity_diffs.append(f"Missing: entity '{value}' (keywords: {','.join(en_keywords)})")
                # else: Keywords found, entity considered present despite rewording

    for fact_type, value in only_in_back:
        if fact_type in ('dollar', 'percent', 'year', 'phone'):
            # NUMERIC: ZERO tolerance
            numeric_diffs.append(f"Extra: {fact_type} '{value}'")
        # Skip extra entities (they're from back-translation rewording, not errors)

    return (numeric_diffs, entity_diffs)


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
    - AND sentence does NOT contain recognized program entity names (Medicare, Medicaid, etc.)

    Program entity names are intentionally left in English and should not fail this check.
    """
    # Split into sentences (basic heuristic: period, question mark, exclamation)
    sentences = re.split(r'[.!?]+', tr_text)
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return (True, "")

    # Program entity keywords that legitimately appear in English
    entity_keywords = {'Medicare', 'Medicaid', 'CHIP', 'SHIP', 'IRMAA', 'MOOP', 'QMB', 'SLMB', 'PACE', 'SNF', 'SNP', 'MCO', 'DME', 'EOB', 'ABN', 'COB', 'CBP'}

    english_sentences = 0
    content_sentences = 0

    for sentence in sentences:
        # Skip header/footer scaffolding like "home", "menu", etc. (< 3 words)
        words = re.findall(r'\b\w+\b', sentence)
        if len(words) < 3:
            continue

        content_sentences += 1

        # Sentences with program entity keywords are technical and exempt
        # (they legitimately contain English terms like "Medicare", "Medicaid")
        if any(entity in sentence for entity in entity_keywords):
            continue

        # Count English stopword hits (case-insensitive)
        stopword_hits = sum(1 for word in words if word.lower() in ENGLISH_STOPWORDS)

        # Check for diacritics
        has_diacritics = bool(re.search(DIACRITIC_PATTERN, sentence))

        # Flag as English if ≥4 stopword hits AND no diacritics
        if stopword_hits >= 4 and not has_diacritics:
            english_sentences += 1

    english_ratio = english_sentences / content_sentences if content_sentences > 0 else 0

    # Fail if >2% of content sentences are English
    if english_ratio > 0.02:
        return (False, f"Translation appears to be {english_ratio*100:.1f}% English (threshold: 2%, excluding technical terms)")

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

        # Verify translation appears in translated HTML. Case-insensitive:
        # the glossary's capitalization is a dictionary-headword display
        # convention, not a requirement — correct Spanish prose lowercases
        # common nouns mid-sentence (e.g. "cada reclamación precisa"),
        # which a case-sensitive check would wrongly reject.
        if tr_term.lower() not in tr_text.lower():
            missing.append(f"'{en_term}' (should be '{tr_term}')")

    if missing:
        return (False, "; ".join(missing))

    return (True, "")


def run_gates(en_html, tr_html, back_text, terms):
    """Orchestrator: run all QA gates.

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

    # Gate 2: Facts - ZERO tolerance for numeric facts, smart entity matching
    # Extract English text from main content (if present) for comparison
    en_main_match = re.search(r'<main[^>]*>.*?</main>', en_html, re.DOTALL)
    en_text = re.sub(r'<[^>]+>', '', en_main_match.group(0)) if en_main_match else re.sub(r'<[^>]+>', '', en_html)

    numeric_diffs, entity_diffs = facts_diff(en_text, back_text)

    # ZERO tolerance for numeric facts (dollars, percents, years, phone numbers)
    if numeric_diffs:
        failures.append(f"Facts (numeric): {'; '.join(numeric_diffs[:3])}")

    # Entity diffs allowed if entity is just reworded; fail only if entity missing from back_text
    # (entity_diffs already filters to only truly missing/extra entities by _extract_facts logic)
    if entity_diffs:
        # Check if these are truly missing (entity present in EN but absent from back)
        missing_entities = [d for d in entity_diffs if d.startswith("Missing")]
        if missing_entities:
            failures.append(f"Facts (entity): {'; '.join(missing_entities[:3])}")

    # Gate 3: Completeness (check translated main content only, not chrome)
    # Extract main content for completeness check (chrome is not translated, just labeled)
    tr_main_match = re.search(r'<main[^>]*>.*?</main>', tr_html, re.DOTALL)
    if tr_main_match:
        tr_text = re.sub(r'<[^>]+>', '', tr_main_match.group(0))
    else:
        # Fallback to full HTML for tests without <main> tags
        tr_text = re.sub(r'<[^>]+>', '', tr_html)

    ok, reason = completeness_ok(tr_text)
    if not ok:
        failures.append(f"Completeness: {reason}")

    # Gate 4: Glossary
    ok, reason = glossary_ok(en_html, tr_html, terms)
    if not ok:
        failures.append(f"Glossary: {reason}")

    # Gate 5: Orphaned vault tokens - any ⟦P remaining in final HTML fails
    if '⟦P' in tr_html:
        orphaned = re.findall(r'⟦P\d+⟧', tr_html)
        failures.append(f"Orphaned vault tokens: {', '.join(set(orphaned))}")

    return (len(failures) == 0, failures)
