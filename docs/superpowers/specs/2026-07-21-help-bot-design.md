# MediPrimer Help Bot — Design

## Problem

MediPrimer is a 61-page static site explaining Medicare/Medicaid in plain
language. Visitors arrive with a specific situation and have to self-serve
through pages organized by topic, not by their question. A conversational
bot lets them ask directly and get pointed at (or answered from) the right
information, without the site taking on the liability of recommending
specific plans.

## Goals

- Answer Medicare/Medicaid questions more broadly than what's written on
  MediPrimer's own pages today, while staying accurate on numbers and rules
  that change yearly and carry real financial consequences if wrong.
- Never recommend a specific plan, carrier, or "you should pick X" —
  consistent with the site's existing neutral-resource positioning.
- Ship without taking on a new paid vendor dependency, a consent-banner
  requirement, or a large new maintenance surface, consistent with how the
  rest of the site's automation (`seo/`, `update/`) is already run.

## Non-goals (v1)

- No personalized eligibility determination or plan comparison tool.
- No server-side conversation storage — nothing to build a privacy policy
  or consent flow around.
- No user accounts or session persistence across page loads.

## Architecture

```
Visitor's browser
  -> chat widget (public/chatbot.js, vanilla JS)
  -> POST /api/chat  (nginx location on mediprimer.org, rate-limited)
  -> backend service (systemd, same droplet, Python/FastAPI)
       -> retrieve top-K chunks from SQLite embedding store (kb/index.sqlite)
       -> call Claude API with system prompt + retrieved context + question
       -> stream answer back; every factual claim carries a source link
  -> no server-side conversation storage; history lives only in the tab
```

## Knowledge base

New `kb/` directory at the repo root, gitignored (same treatment as `seo/`
and `update/` — operational tooling, not site content).

**Sources, v1:**
- All 61 `public/*.html` pages (nav/footer/boilerplate stripped, prose kept).
- A curated list of official pages on medicare.gov, ssa.gov, cms.gov, and
  medicaid.gov, covering the same topics the site already covers (program
  costs, eligibility thresholds, enrollment windows, appeals). Kurt approves
  the URL list before it's indexed — the bot should not go fetch arbitrary
  government pages on its own.

**Build (`kb/build_index.py`):**
- Chunk each source into paragraph-sized pieces, embed each chunk, store
  `(text, source_url, embedding)` rows in `kb/index.sqlite`.
- Every chunk retains its source URL — this is what lets the bot cite,
  the same convention `update/validate.py`'s guardrail already enforces on
  the static pages themselves.

**Refresh:**
- Weekly, on the same cron cadence as the existing Wednesday SEO job.
- Re-fetches the official-doc list, re-embeds, and diffs each figure
  against the prior snapshot.
- Changed figures are **flagged in an email report, not silently applied**
  — this mirrors the stale-number problem found and fixed in
  `getting-help.html` this week (PR #15); the bot's knowledge base must not
  reintroduce the same failure mode silently.

## Backend service

- Single endpoint, `POST /api/chat` — takes a question (and, optionally,
  the last few turns from the browser-held history), returns an answer plus
  a list of sources used.
- System prompt encodes the boundaries agreed in design review:
  1. Answer from retrieved knowledge-base context first.
  2. If the question isn't covered by the knowledge base, say so explicitly,
     answer from general knowledge, and add a "verify at [official source]"
     caveat.
  3. Never recommend a specific plan, carrier, or "you should pick X."
  4. Always cite sources for factual claims (MediPrimer page and/or
     official source).
- Stateless — no database of conversations. Each request is self-contained.
- Runs as a systemd unit; Anthropic API key delivered via a systemd
  `EnvironmentFile`, following the same secret-handling pattern as
  `~/.config/google-service-accounts/`.

## Nginx / rate limiting

- New `location /api/chat` block on the existing `mediprimer.org` vhost,
  proxying to the local backend service port.
- Per-IP rate limiting at the nginx level, same pattern as
  `/etc/nginx/conf.d/guac-ratelimit.conf` already protects the RDP portal
  with. Necessary because every message costs real API money and this is a
  public, unauthenticated endpoint — without a cap, cost is unbounded.

## Frontend widget

- `public/chatbot.js` (+ a small CSS addition to `style.css`), injected on
  every page via `build/normalize.py` — the same mechanism that already
  stamps the canonical header/nav/footer on all 61 pages, so adding the
  widget site-wide is a one-line change there, not a 61-page edit.
- Floating widget, all pages.
- Persistent, visible disclaimer inside the widget ("General info, not
  personalized advice — verify at medicare.gov"), consistent with the
  site's existing `disclaimer.html`.
- Degrades gracefully with JavaScript disabled: the site must remain fully
  usable without the widget, same as today.

## Testing / rollout

- `make check` gains a new gate verifying every page still builds cleanly
  with the widget injected.
- Launch behind a quiet flag (widget only renders with a query param present)
  so Kurt can use it live before it's exposed to every visitor. Flip the
  flag once satisfied.
- No automated end-to-end test of live model output quality in v1 — spot
  review answers manually pre-launch. (A future iteration could add a small
  fixed eval set of known-answer questions run against the KB.)

## Open questions for Kurt (not blocking, but worth a decision before build)

1. **Official-doc URL list** — needs your sign-off before `kb/build_index.py`
   fetches anything (see Knowledge base, v1 sources above).
2. **Cost ceiling** — the rate limit above prevents runaway cost per IP, but
   there's no site-wide daily spend cap yet. Worth setting one (e.g., a
   circuit-breaker that disables the endpoint past a daily token budget) so
   a traffic spike can't produce a surprise bill.
