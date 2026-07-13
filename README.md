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

## Build

```sh
cd public
python3 ../build/normalize.py
python3 ../build/assemble.py
python3 ../build/seo.py "$(date +%F)"
```

Then serve `public/` with any static web server.

## Independence

MediPrimer sells nothing, carries no advertising or affiliate links, and collects no personal data. It does not accept funding from insurers, brokers, or anyone with a stake in coverage decisions. Editor: Kurt Hamm. See `public/editorial-standards.html`.

## Disclaimer

Educational information only — not medical, legal, or financial advice, and not a substitute for official program materials. Always verify specifics with the official source (Medicare.gov, Medicaid.gov, your state agency) and a qualified professional.
