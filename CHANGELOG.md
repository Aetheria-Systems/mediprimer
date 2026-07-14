# Changelog

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
