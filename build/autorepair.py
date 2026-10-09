#!/usr/bin/env python3
"""Try to repair known, mechanically-fixable gate failures before giving up.

Why this exists: on 2026-09-30 a single untranslated `alt` attribute on one
Tagalog page failed check_translated_attrs, which failed `make check`, which
failed `make deploy`, which failed seo-optimize three nights running. Nothing
shipped for three days because of one attribute — and the fix was mechanical
(the Tagalog string already existed in build/diagram-strings.json; it just had
not been applied to the page).

Gates must stay strict — they are the only thing standing between a mistake
and a published Medicare page. But a gate that blocks forever on something the
build can fix itself is a stall, not a safeguard. So: run the gates, and for
each failure that has a known deterministic repair, apply it and re-run. What
cannot be repaired still fails loudly and still blocks the deploy.

Each repair must be deterministic and source-of-truth driven — never a guess,
never a paper-over. If a repair cannot be made from data the repo already
holds, it does not belong here.

  autorepair.py            # attempt repairs, report, exit 0 if all clear
  autorepair.py --dry-run  # say what it would do
"""
import subprocess
import sys
import pathlib

BASE = pathlib.Path(__file__).parent.parent


def run(cmd):
    return subprocess.run(cmd, cwd=BASE, capture_output=True, text=True, timeout=1800)


# gate command -> (description, repair command). The repair must be safe to run
# even when nothing is wrong.
REPAIRS = [
    (["python3", "build/check_translated_attrs.py"],
     "untranslated diagram alt text",
     # render_diagrams sets every translated page's alt from
     # diagram-strings.json, which is the source of truth for those strings.
     ["python3", "build/render_diagrams.py"]),
    (["python3", "build/validate.py"],
     "dead links into pages that have no translation yet",
     # relink points them at the English page, which is already the build's
     # documented behaviour for a language launched below 100%.
     ["python3", "build/relink_missing_translations.py"]),
    (["python3", "build/check_chrome_labels.py"],
     "stale chrome on translated pages",
     ["python3", "build/refresh_chrome.py", "es", "zh-Hant", "vi", "ko", "tl"]),
]


def main():
    dry = "--dry-run" in sys.argv
    repaired, unfixed = [], []
    for gate, what, repair in REPAIRS:
        if run(gate).returncode == 0:
            continue
        print(f"  gate failed: {' '.join(gate)}  ({what})")
        if dry:
            print(f"    would run: {' '.join(repair)}")
            continue
        r = run(repair)
        if r.returncode != 0:
            print(f"    repair FAILED: {r.stderr.strip()[:160]}")
            unfixed.append(what)
            continue
        if run(gate).returncode == 0:
            print(f"    repaired via {' '.join(repair)}")
            repaired.append(what)
        else:
            print("    repair ran but the gate still fails — escalating")
            unfixed.append(what)

    if repaired:
        print(f"autorepair: fixed {len(repaired)} — {'; '.join(repaired)}")
    if unfixed:
        print(f"autorepair: COULD NOT FIX {len(unfixed)} — {'; '.join(unfixed)}")
        sys.exit(1)
    if not repaired:
        print("autorepair: nothing to repair")


if __name__ == "__main__":
    main()
