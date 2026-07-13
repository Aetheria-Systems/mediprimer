# Changelog

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
