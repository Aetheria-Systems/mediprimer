# MediPrimer

An independent, plain-language educational resource on **Medicare, Medicaid, Medicare Advantage, the ACA Marketplace, and CHIP**. Free, no ads, nothing sold, and not affiliated with any government agency or insurance company.

Live site: <https://mediprimer.org>

## What this is

A static website that explains U.S. health-coverage programs in plain English (aimed at about an 8th-grade reading level), organized around people's real situations rather than an agency's org chart. Highlights:

- A guided **"Turning 65"** walkthrough and situational navigator.
- Even-handed decision help (Original Medicare vs. Medicare Advantage vs. Medigap) — with a priorities sorter and scenario comparisons, and **no plan recommendations**.
- State-by-state directories (Medicaid, SHIP, insurance departments) with a "Your State" picker.
- A searchable plain-English glossary with hover/tap tooltips.
- Reference material for professionals (health-plan operations, providers, brokers, navigators).

## Structure

- `public/` — the website (HTML, CSS, JS, and `data/states.json`).
- `build/` — build scripts:
  - `normalize.py` — writes the canonical header/nav (members-first dropdowns) and footer on every page and injects shared scripts.
  - `assemble.py` — injects shared partials (`build/partials/`).
  - `seo.py DATE` — injects canonical + Open Graph + JSON-LD structured data and regenerates `sitemap.xml` / `robots.txt`.
  - `readability.py` — checks member pages against a plain-language target.
  - `factdiff.py` — flags factual drift after bulk edits.

## Build, check, deploy

```
make build    # normalize + assemble + seo (stamps today's date)
make check    # build, then every quality gate (see below)
make deploy   # check, then commit -> pull request -> merge -> GitHub Actions publishes
```

`make check` is the canonical verification — run it before committing content.
It runs the plain-language gate (grade <= 9.5 on every member page), the
JS syntax check, language-coverage and translated-attribute checks, the
official-figures check (`build/official-figures.json`), chrome and chatbot
injection checks, and `build/validate.py` (dead links, unsourced dollar
figures).

**Nothing is deployed from a working tree.** `.github/workflows/deploy.yml`
builds and re-runs every gate on a clean checkout of `main`, then publishes
from the self-hosted runner on the web server and verifies that the live site
serves that exact commit (`/deploy-stamp.txt`). Two further gates run there
against the live site: `build/verify_new_figures.py` (every newly added
dollar figure must be printed on the official page cited beside it) and
`build/verify_news_claims.py` (every count or percentage taken from a news or
research article must be quoted verbatim from the article, which is fetched
and matched). To ship: commit, open a PR to `main`, merge. Rollback is
`git revert` + merge.

The automated content pipelines commit to the `autopilot` branch, open and
merge their PR, wait for the Deploy run, and fail loudly if the live stamp
does not match. Their code lives in a separate private repository
(operational tooling, not part of the public site).

## License

Site content (`public/`) is [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/);
build tooling and JavaScript are MIT. See `LICENSE`.

## Independence

MediPrimer sells nothing, carries no advertising or affiliate links, and collects no personal data. No supporter, donor, or grantor has any say over what we write. Editor: Kurt Hamm. See `public/editorial-standards.html`.

## Disclaimer

Educational information only — not medical, legal, or financial advice, and not a substitute for official program materials. Always verify specifics with the official source (Medicare.gov, Medicaid.gov, your state agency) and a qualified professional.
