# Decisions

Strategic decisions and pivots, with the reasoning. Newest first.

## 2026-07-13 — Measure usage with Google Analytics

The site launched with a strict no-analytics stance. That left no way to know
whether the content helps anyone: which pages get read, which tools get used,
what people search for. We now use Google Analytics 4, disclosed plainly in
the privacy policy, with ads personalization off. Server logs alone were
considered but give no view of tool engagement; a first-party analytics stack
was considered but adds operational surface for a one-person site. The policy
page links Google's opt-out add-on, and every page works with analytics
blocked.

## 2026-07-13 — Dual-eligible discovery is the site's centerpiece

The most underserved, highest-stakes audience is people who qualify for both
Medicare and Medicaid and don't know it. "Getting Help Paying" was rebuilt from
a program directory into a guided questionnaire that surfaces likely matches
(QMB first — it can eliminate the Part B premium and cost-sharing) and never
tells anyone they qualify for nothing. Eligibility logic deliberately
understates rather than overstates: a match requires the whole income band to
fit under the limit, and every result says limits are approximate, states vary,
and applying is free. Dollar limits are year-specific and must be re-verified
each January.

## 2026-07-13 — Situation routing over topic navigation

Confused visitors don't know program vocabulary; they know their situation.
The homepage routes nine situations phrased in the first person ("I'm helping
my mom", "Something was denied") instead of asking people to pick a program.
The Medigap "one-way door" warning moved to the top of Turning 65 — the site's
most consequential fact must sit on the main path, not behind a click.

## 2026-07-13 — Dual license

Site content is CC BY-NC-ND 4.0 (share with credit; no commercial reuse; no
altered versions under our name — this is health information, and modified
copies are a safety problem). Build tooling and JavaScript are MIT so others
can reuse the machinery freely.

## 2026-07-12 — Real resource, not a side project with ads

MediPrimer sells nothing, runs no ads or affiliate links, accepts no insurer,
broker, or pharma money, and does not solicit donations. Growth comes from
being genuinely useful (word of mouth, organic search); no outreach campaigns.
Editor is named, every page carries a last-reviewed date, and facts defer to
official sources rather than restating figures that go stale.

## 2026-07-12 — Even-handed by design

Original Medicare vs. Medicare Advantage is presented as trade-offs and
patterns ("who tends to do well with each"), never a recommendation. The site's
value proposition is that it has nothing to sell — so it arms readers with the
questions that uncover the truth instead of steering them.

## 2026-07-12 — Plain language as an enforced gate, not an aspiration

Member pages target roughly an 8th-grade reading level, checked by an
automated readability gate (`make check`) that fails the build when a page
drifts. Professional and legal pages are exempt; member prose is not.
