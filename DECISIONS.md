# Decisions

Strategic decisions and pivots, with the reasoning. Newest first.

## 2026-09-21 — Pause new languages; the constraint is authority, not content

New-language rollout is suspended. Ten languages stay frozen (ru, ar, ht, pt,
fr, pl, hi, ja, fa, de); the six live ones (en, es, zh-Hant, vi, ko, tl) keep
being maintained.

The reasoning is a measurement, not a preference. Over 28 days the site drew
14,853 impressions and 45 clicks — a 0.30% click-through rate — and **89% of
those impressions came from position 21 or worse**, where clicks effectively do
not exist. Only three queries sat in the winnable 4-20 range with real volume.
That is not a content problem and not a titles problem: titles only help a page
already on the first page of results. It is a ranking-authority problem.

Underneath it is a crawl-budget problem. Older English, Spanish and Chinese
pages are indexed, but the 28 pages published on 2026-09-15 sat at "Discovered
– currently not indexed" and all of Vietnamese, Korean and Tagalog was "URL is
unknown to Google". The site had tripled to 774 pages and Google had stopped
keeping up, fetching about 7 URLs a day. **Each additional language adds ~130
pages to a queue that is already starved, so adding languages actively makes
the traffic problem worse.**

Ruled out by measurement, so they should not be re-investigated: thin content
(median 1,332 words, one page under 300), duplicate content (no page pair above
58% body-vocabulary overlap), hreflang and canonicals (reciprocal, x-default
present, self-referencing), robots.txt, and server performance (~23ms).

Enforced in three places, because a commented-out cron only stops the
scheduler: the crontab line, `seo/ROLLOUT_SUSPENDED` (which
`seo/language-rollout.sh` checks before doing anything, so a direct invocation
by a human or an agent is also refused), and `stall-watch.py` reading the
crontab so a paused job is not reported as a stalled one. Resuming is a
deliberate act: delete the file, uncomment the line.

## 2026-09-22 — Optimise for AI search, not only for Google

AI assistants now handle an estimated 12-18% of English informational queries,
up from under 2% a year earlier, and they select what to cite differently from
how Google ranks. Google gates heavily on domain authority — precisely what a
site three months old cannot have. AI engines weight specificity, clean
structure, self-contained factual claims and visible provenance, all of which
can be built rather than earned.

A small, rigorously structured, six-language site on one narrow topic is close
to the ideal shape for AI citation and badly disadvantaged for classic search.
So the site now deliberately carries the signals those engines use: a
short-answer lead paragraph near the top of every substantial page (121 of
130), a visible author byline and update date on all 130, inline links to
primary .gov sources on all 130, FAQ markup on 72, and data tables on 58.

This does not replace the Google work; it is a second channel with a much
shorter feedback loop, measurable as referral traffic from chatgpt.com,
perplexity.ai, copilot.com and Gemini.


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
