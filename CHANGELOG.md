# Changelog

## 2026-09-21 / 22 — Indexing, Core Web Vitals, cannibalisation, AI-search readiness

**Indexing and crawl.** Google was fetching roughly 7 URLs a day against 774
pages, and 52 of 130 English pages had gone 28 days with zero impressions —
none of them linked from the homepage. Added an "Answers to specific questions"
section linking 25 of them, grouped by what readers ask. Within a day Google's
verified crawl rate went to 115 requests, every one of those 25 pages was
crawled, and Special Needs Plans, Medicare Savings Programs and Medigap
Plan G vs N moved from "Discovered – currently not indexed" to indexed. The
Spanish Special Needs Plans page indexed the same day.

**Core Web Vitals restored to 100.** The 2026-09-17 analytics deferral fixed
FCP but broke LCP: its 3-second fallback fired inside the LCP measurement
window, gtag.js produced 74ms and 50ms long tasks at ~2.7s, and LCP landed at
3.5-3.9s. It was intermittent (costs.html measured 919ms and 3872ms on
consecutive runs), which is why a single check missed it for five days.
Analytics now loads only after LCP is final — first interaction, page hidden,
or a 15s fallback. Eight runs across four pages: LCP 901-964ms, scores 98-100.

**Keyword cannibalisation.** 39% of impressions were on queries where two or
three MediPrimer pages competed with each other. Fixed the two real clusters:
star ratings (54 queries — consumer page was misclassified as "professionals"
and had 7 inbound links against the technical page's 130) and the Spanish
eligibility cluster (2,166 impressions). English is now down to 46 impressions
of brand-typo noise.

**Favicon and share card.** The site had neither. `/favicon.ico` 404'd —
Googlebot requested it and got the 404 — so search results showed a generic
globe on a health site, and every shared link rendered as a bare text preview.
Added a favicon set, a 1200x630 Open Graph card, and a web manifest, all six
languages on the card.

**AI-search (GEO) readiness.** AI assistants now handle an estimated 12-18% of
English informational queries and cite specific, self-contained statements near
the top of a page. 45 pages had no such summary; 37 now do, generated under a
hard constraint that rejects any summary containing a number absent from the
source page.

**Dead links.** `/ko/costs.html` was linked from 126 Korean pages and served a
404; 789 dead-link instances existed in total, because a language launches at
90% completeness while links are written for 100%. Nav and body links now fall
back to English when a translation does not exist, and `update/validate.py`
walks translated pages and runs inside `make check`.

**Vietnamese pages were serving Spanish.** Eight pages carried Spanish
headings and paragraphs, introduced by concurrent translation runs on
2026-09-18 before the single-instance lock existed. All eight re-translated
clean.

**Translation sync no longer skips silently.** The 21:00 language rollout holds
the translation lock for up to nine hours, straight through the 03:00 sync,
which logged a SKIP, passed over every launched language and exited 0. The live
languages quietly stopped being updated on any night a rollout ran. The sync now
waits for the lock and fails loudly if it never gets it.

## 2026-09-03 — Content corrections + pipeline git parity

- **Glossary fix**: "redetermination" wrongly described an appeal; now defined
  as the routine eligibility re-check (renewal/recertification).
- **Automatic enrollment**: enrollment.html now explains who gets Part A/B
  without signing up (Social Security/RRB before 65, 24 months of disability
  benefits) and the Puerto Rico Part B exception.
- **OBBBA 6-month Medicaid renewals**: policy-changes.html covers Section 71107
  of PL 119-21 (expansion adults renew every 6 months from Jan 2027, per CMS
  SMD #26-001); medicaid-eligibility.html renewal bullet updated to match.
- **Pipeline git parity**: the SEO optimizer and nightly translation sync now
  auto-commit each deploy to the `autopilot` branch and self-merge a PR, so
  the repo can no longer drift from the live site.

## 2026-07-14 — Honest page dates

- **Per-page `dateModified`**: a page's modified date (and sitemap `lastmod`)
  now advances only when its content actually changes, instead of re-stamping
  every page on every build.

## 2026-07-13 — Site analytics

- **Google Analytics 4 added** on every page via a shared build partial, with
  events for glossary searches, Medicare-navigator completions, and printing.
  Ads personalization (Google Signals) is off.
- **Privacy policy updated** to disclose analytics plainly and link Google's
  opt-out browser add-on.

## 2026-07-13 — Couples planning, pre-65 path, accessibility pass

- **New page — Planning for Two: Medicare for Couples** (`planning-for-two.html`):
  the individual-premium rule (no family Medicare), household cost math with
  2026 figures, the two "gap years" scenarios (older spouse retires first;
  younger spouse loses employer coverage at the older's Medicare move), IRMAA
  for joint filers with the SSA-44 appeal path, domestic-partner caveat, and a
  couples checklist. Linked from the homepage, Start Here menu, Turning 65,
  Retiring/Losing Coverage, and Costs. FAQ structured data included. All facts
  verified against ssa.gov/medicare.gov/cms.gov.
- **Pre-65 entry path**: new "Not 65 yet? What to do in your early 60s"
  section on Turning 65 (income timing, HSA endgame, bridge-coverage pricing
  before picking a retirement date) plus a homepage route card, so people
  planning at 61–63 have a first click.
- **Content gaps closed**: IRMAA two-year lookback, joint-filing rule, and the
  SSA-44 lower-my-IRMAA appeal added to Understanding Your Costs; "When Your
  Coverage Actually Starts" section (post-2023 effective-date rules, GEP
  month-after start) added to Enrollment & Deadlines.
- **Accessibility**: glossary tooltips now respond to Enter/Space and carry
  `role="tooltip"`; touch targets raised to 44px minimum (nav buttons, help
  buttons, print button, hamburger, glossary A–Z); main-nav and glossary
  letter-nav font sizes raised; kicker labels enlarged.
- **GitHub**: repository homepage and topics set.
- **Contact channel**: `editor@mediprimer.org` (Google Workspace) published on
  About, Editorial Standards, and Support for corrections and professional
  inquiries — a plain mailto, no form, so the no-data-collection promise holds.
  Members are still routed to SHIP/1-800-MEDICARE for personal help.
- **IndexNow wired into deploy**: `build/indexnow.py` submits every sitemap URL
  to api.indexnow.org after each rsync (key was already provisioned but unused),
  so content updates get crawled in minutes instead of weeks.

## 2026-07-13 — Member-first overhaul

- **Dual-eligible discovery path**: "Getting Help Paying" rebuilt around a
  4-question qualifier (`help-paying.js`) that shows which programs someone
  likely qualifies for (QMB/SLMB/QI, Extra Help, Medicaid, PACE, Marketplace),
  with verified 2026 income limits, impact-sorted results, automatic Extra Help
  for duals, and a no-JS fallback table. Surfaced inside Turning 65 and every
  navigator result.
- **Situation routing**: homepage now routes 9 member situations; the Medigap
  "one-way door" warning moved to the top of Turning 65; caregiver fork added
  to Turning 65 and as the navigator's first question; edge-case prompts (HSA,
  IRMAA, living abroad) appended to navigator results.
- **New pages**: Medicaid: Starting Out; How to Use Medicare.gov Plan Finder;
  Common Medicare Mistakes.
- **Tools**: enrollment-window calendar-reminder helper (month/year → Google
  Calendar link); improved no-JS navigator index; priorities sorter now gives
  actionable next steps on a neutral result.
- **Fixes**: duplicate/conflicting social meta tags removed site-wide (seo.py
  now strips hand-written tags before injecting); all member pages brought
  under the grade-9.5 plain-language target; appeals page gained a plain-English
  "Who's Who in an Appeal" box; dark-mode link contrast raised to 12:1.
- **Accuracy pass** (CodeRabbit review, 19 findings addressed): IEP date math
  in the calendar helper; eligibility-questionnaire gating; 5-star (not 4-star)
  special enrollment period; retroactive Part A / HSA warning; SSDI/ALS/ESRD
  start dates; Part B current-employment rule vs Part D creditable coverage;
  PACE criteria; Medicaid appeal paths.
- **Infrastructure**: Makefile (`make build` / `check` / `deploy`) as the
  canonical workflow; nginx security headers; editor bio added to editorial
  standards; LICENSE added (CC BY-NC-ND 4.0 content, MIT tooling).

## 2026-07-12 — Initial public release

- 57-page independent, plain-language reference for Medicare, Medicaid,
  Medicare Advantage, the ACA Marketplace, and CHIP.
- Guided "Turning 65" walkthrough with situational navigator; even-handed
  decision help with priorities sorter; state directories (Medicaid, SHIP,
  insurance departments) with "Your State" picker; searchable glossary with
  site-wide tooltips; professional reference section.
- Build system: canonical header/footer normalization, shared partials, SEO
  (canonical/OG/JSON-LD, sitemap, robots), readability checker, factual-drift
  checker. IndexNow + Google Search Console submission.
