# MediPrimer plain-language pass (READ FIRST)

Your job: rewrite ONLY the prose of one existing HTML page so it's easier to read
(target ~8th-grade reading level), while preserving everything else exactly.
This is an accuracy-critical health-information site. Do not change meaning.

## Hard rules — do NOT break these
1. **Preserve all facts and meaning.** Do not change any rule, number, deadline,
   penalty, eligibility statement, or nuance. Especially leave the MEANING of:
   enrollment windows, late-enrollment penalties, the Medigap "one-way door" /
   underwriting / trial right, Medicare Advantage prior-authorization & network
   statements, and "creditable coverage" rules. If simplifying a sentence risks
   changing its meaning, keep the original sentence.
2. **No new numbers.** Never add specific dollar amounts, percentages, or
   year-specific thresholds. Keep the existing "check the current figure / see
   medicare.gov" approach. Do not invent statistics.
3. **Preserve all HTML exactly except the sentence wording:**
   - Leave the `<header class="site-header">…</header>` and
     `<footer class="site-footer">…</footer>` blocks byte-for-byte unchanged.
   - Keep every `<a href="…">` link and its URL exactly (you may lightly reword
     the visible link text only if meaning is identical).
   - Keep every CSS class, every `<table>` (leave tables as-is), every
     `.note` / `.note.info` / `.note.tip`, the hero, and the final "verify"
     note. Keep any `<script>`, `<noscript>`, or `id="medicare-navigator"` block
     untouched.
   - Do not delete sections, list items, or links. Do not add new claims or
     sections.
4. **Keep the tone:** neutral, non-advisory, "not affiliated / verify at the
   source." Never recommend a specific plan.

## How to simplify (this is the whole point)
- Short sentences — aim under ~18 words, one idea each. Split run-ons.
- Plain, everyday words. When a technical term is unavoidable, add a short plain
  gloss in parentheses the FIRST time, e.g. "coinsurance (your share of a bill,
  as a percentage)", "premium (the monthly cost to have the coverage)".
- Break long paragraphs into shorter ones, or into bullet lists, for white space.
- Use "you" and active voice.
- Respectful, not condescending. Clear, not dumbed-down.

## Do it
Read the file, rewrite the prose in place following the rules, and save it with
the Write tool (same path). Return one line confirming the file and that structure
and facts were preserved.
