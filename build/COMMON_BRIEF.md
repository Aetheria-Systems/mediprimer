# MediPrimer — shared build brief (READ FIRST)

You are writing ONE static HTML page for **MediPrimer**, an independent, educational
reference site about U.S. government-sponsored health coverage (Medicare, Medicaid,
Medicare Advantage, the ACA Marketplace, CHIP). The site serves three audiences:
the general public ("The Basics"), members & caregivers, and industry professionals.

## Non-negotiable guardrails
1. **Educational, never advisory.** Explain how things work. NEVER tell the reader
   which plan/program to choose, and never imply MediPrimer endorses a specific
   insurer or plan. Present tradeoffs neutrally.
2. **Not affiliated.** MediPrimer is not affiliated with CMS, Medicare, Medicaid,
   any state agency, or any insurer. Say so where relevant.
3. **No stale numbers.** Program dollar figures (premiums, deductibles, penalty
   amounts, IRMAA thresholds, out-of-pocket maximums, income limits) change every
   year and vary by state. Explain HOW each works and link to the official current
   figure. DO NOT invent or hardcode specific dollar amounts or year-specific
   thresholds. It is fine to say "a percentage of…", "set annually by CMS", etc.
4. **Real links only.** Link to official .gov sources you are confident exist:
   medicare.gov, medicaid.gov, cms.gov, healthcare.gov, insurekidsnow.gov,
   ssa.gov, benefits.gov, shiphelp.org (SHIP), eldercare.acl.gov. Do NOT fabricate
   deep URLs — if unsure, link the site root. Internal links use root-relative
   paths like /enrollment.html.
5. **Accurate.** Everything must be factually correct about how these programs work.
   When a rule genuinely varies by state or plan, say so rather than overstating.

## Exact page skeleton — produce a COMPLETE valid HTML document
Copy the header and footer VERBATIM from `shell.html` in this same directory
(/tmp/claude-1000/-home-deltaprism-rdp/aab37289-84d5-4a56-aecb-51c41bc17290/scratchpad/build/shell.html).
In the header `<nav>`, add `class="active"` to the ONE top-nav link matching this
page's section (given in your page brief). Structure:

```
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PAGE TITLE — MediPrimer</title>
<meta name="description" content="…one-sentence description…">
<link rel="stylesheet" href="/style.css">
</head>
<body>
[CANONICAL HEADER from shell.html, with correct active nav link]
<section class="hero">
  <div class="wrap">
    <p class="kicker">SECTION LABEL</p>   <!-- e.g. "For Members & Caregivers" -->
    <h1>Page H1</h1>
    <p>One or two sentence plain-language summary of the page.</p>
  </div>
</section>
<main>
  <div class="wrap">
    … your content, using <h2>/<h3>, <p>, <ul>/<ol>, tables, and the classes below …
  </div>
</main>
[CANONICAL FOOTER from shell.html]
</body>
</html>
```

## CSS classes available (use them; do not invent new CSS or inline styles)
- `.hero` + `.kicker` — page header band with section label.
- `<h2>` section headings, `<h3>` subsections.
- `.note` — amber "verify at the source" callout. Variants: `.note.info` (blue,
  neutral tip), `.note.tip` (green, helpful pointer). Put a `<strong>` lead-in.
- `.table-scroll` wrapping a `<table>` (with `<thead>`/`<tbody>`) for comparisons.
- `.grid` containing `.card` blocks (each `.card` has `<h3><a href>…</a></h3>` + `<p>`).
  Optional `<span class="card-tag">LABEL</span>` above the h3.
- `.steps` — an `<ol class="steps">` with numbered circles; start each `<li>` with a
  `<strong>` short title then explanation. Use for "how do I…" procedures.
- `details.qa` — collapsible FAQ item:
  `<details class="qa"><summary>Question?</summary><div><p>Answer.</p></div></details>`
- `.compare` containing `.col` blocks — side-by-side neutral comparison columns.
- `.resource` — a card for an assistance program: `<h3>`, then
  `<p class="contact">Phone / URL</p>`, then `<p>` description.
- `.pill` / `.pill.members` / `.pill.pros` / `.pill.basics` — small audience tags.

## Tone & length
Plain, calm, plain-English (aim ~8th–10th grade reading level for member pages;
professionals pages can be a bit more technical). Short paragraphs. Prefer lists
and tables over walls of text. Target 900–1600 words of real content per page
unless the page brief says otherwise. Every page must end its `<main>` with a
`.note` reminding the reader to verify specifics with the official source / their
own plan documents.

Output ONLY by writing the file to the exact path given in your page brief using the
Write tool. Return a one-line confirmation.
