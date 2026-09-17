#!/usr/bin/env bash
#
# MediPrimer nightly translation sync.
# for each launched language: --all-stale translate -> rebuild -> validate -> deploy -> IndexNow.
# On failure: email FAILED and exit 1 (do NOT revert translations; English untouched means
# partial page writes are safe — per-page gates in translate.py guarantee atomicity).
# On success or no-stale: email (success) only if pages changed; exit 0.
#
set -uo pipefail

BASE="/home/deltaprism/mediprimer"
PUB="$BASE/public"
DOCROOT="/var/www/mediprimer/public"
SEO="$BASE/seo"

D="$(date +%Y%m%d)"
LOG="$SEO/log/translate-$D.log"
export LOG
mkdir -p "$SEO/log"
exec > >(tee -a "$LOG") 2>&1
TEE_PID=$!
# Before a failure email reads the log tail, wait for tee to flush what has
# been written so far, then log synchronously to the file for the remainder.
flush_log() {
  exec >>"$LOG" 2>&1
  wait "$TEE_PID" 2>/dev/null
}
log() { echo "[$(date +%H:%M:%S)] $*"; }

log "=== MediPrimer translation sync start ($D) ==="
cd "$BASE" || { log "FATAL: cannot cd to $BASE"; exit 1; }

# --- 1. Parse launched languages from build/languages.json ----------------------
LAUNCHED_LANGS=$(python3 -c "
import json
langs = json.load(open('build/languages.json'))['languages']
launched = [l['code'] for l in langs if l.get('launched')]
print(' '.join(launched) if launched else '')
")

if [ -z "$LAUNCHED_LANGS" ]; then
  log "No launched languages configured; exiting."
  exit 0
fi

log "Launched languages: $LAUNCHED_LANGS"

# --- 2. Run translation for each language; track page changes -------------------
PAGES_CHANGED=0
CHANGED_LANGS=""
PARTIAL_FAILURES=""

for LANG in $LAUNCHED_LANGS; do
  log "Translating $LANG..."

  # Capture translate output; count ✓ lines (each indicates one page translated/updated)
  TRANS_OUT=$(python3 build/translate.py --lang "$LANG" --all-stale 2>&1)
  TRANS_RC=$?

  if [ $TRANS_RC -eq 3 ]; then
    log "SKIP: another translation run (likely the 21:00 language rollout) holds the lock; this sync defers to it."
    continue
  fi

  if [ $TRANS_RC -eq 2 ]; then
    # Partial: some pages failed per-page QA; the rest translated fine.
    # Keep going — publish what passed, report what didn't.
    log "PARTIAL: some $LANG pages failed QA gates (continuing with the rest)"
    echo "$TRANS_OUT" | grep '^✗' | head -20
    # translate.py explains API failures on stderr; without these lines the
    # log only says "Translation API failed" (2026-09-17).
    echo "$TRANS_OUT" | grep -E 'Claude API error|translation timeout|No JSON|Failed to parse' | head -10
    PARTIAL_FAILURES="$PARTIAL_FAILURES$(echo "$TRANS_OUT" | grep -c '^✗') in $LANG; "
    TRANS_RC=0
  fi

  if [ $TRANS_RC -ne 0 ]; then
    log "FATAL: translate.py failed for $LANG (exit $TRANS_RC)"
    # The captured output is the ONLY diagnostic; two nights failed blind
    # (2026-09-07/08) because it was discarded here. Always log its tail.
    log "--- translate.py output (last 40 lines) ---"
    echo "$TRANS_OUT" | tail -40
    log "--- end translate.py output ---"
    # Email failure and bail out
    flush_log; python3 - <<'PYMAIL'
import smtplib, pathlib, datetime, os
LOG = os.environ["LOG"]
from email.message import EmailMessage
pw_file = pathlib.Path.home() / ".sgw_gmail_password"
msg = EmailMessage()
msg["From"] = "Kurt Hamm <editor@mediprimer.org>"
msg["To"] = "kurt@hamm.me"
msg["Subject"] = f"MediPrimer translation sync {datetime.date.today()}: FAILED"
msg.set_content("Translation failed. Check logs at /home/deltaprism/mediprimer/seo/log/translate-*.log\n" + "\nLast 40 log lines (" + LOG + "):\n\n" + "".join(open(LOG, encoding="utf-8", errors="replace").readlines()[-40:]))
with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
  s.login("kurt@hamm.me", pw_file.read_text(encoding="utf-8").strip())
  s.send_message(msg)
PYMAIL
    exit 1
  fi

  # Count ✓ marks in output (each page update prints one)
  MARK_COUNT=$(echo "$TRANS_OUT" | grep -o "✓" | wc -l)
  log "  $LANG: $MARK_COUNT page(s) changed"

  PAGES_CHANGED=$((PAGES_CHANGED + MARK_COUNT))
  if [ $MARK_COUNT -gt 0 ]; then
    CHANGED_LANGS="$CHANGED_LANGS $LANG"
  fi
done

log "Total pages changed: $PAGES_CHANGED across$CHANGED_LANGS"
[ -n "$PARTIAL_FAILURES" ] && log "QA-rejected pages this run: $PARTIAL_FAILURES(they stay on the previous good translation; retried next run)"

# --- 3. If no changes, exit quietly (no email) -----------------------------------
if [ $PAGES_CHANGED -eq 0 ]; then
  log "No stale pages to translate; exiting."
  exit 0
fi

# --- 4. Rebuild (re-normalize, SEO gates) ----------------------------------------
log "Running make build (re-normalize)..."
make -C "$BASE" build >/dev/null || { log "FATAL: make build failed"; flush_log; python3 - <<'PYMAIL'
import smtplib, pathlib, datetime, os
LOG = os.environ["LOG"]
from email.message import EmailMessage
pw_file = pathlib.Path.home() / ".sgw_gmail_password"
msg = EmailMessage()
msg["From"] = "Kurt Hamm <editor@mediprimer.org>"
msg["To"] = "kurt@hamm.me"
msg["Subject"] = f"MediPrimer translation sync {datetime.date.today()}: FAILED"
msg.set_content("Build step failed. Check logs.\n" + "\nLast 40 log lines (" + LOG + "):\n\n" + "".join(open(LOG, encoding="utf-8", errors="replace").readlines()[-40:]))
with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
  s.login("kurt@hamm.me", pw_file.read_text(encoding="utf-8").strip())
  s.send_message(msg)
PYMAIL
exit 1; }

# --- 5. Validation gates --------------------------------------------------------
log "Running validation..."
python3 "$BASE/update/validate.py" || { log "FATAL: validate.py failed"; flush_log; python3 - <<'PYMAIL'
import smtplib, pathlib, datetime, os
LOG = os.environ["LOG"]
from email.message import EmailMessage
pw_file = pathlib.Path.home() / ".sgw_gmail_password"
msg = EmailMessage()
msg["From"] = "Kurt Hamm <editor@mediprimer.org>"
msg["To"] = "kurt@hamm.me"
msg["Subject"] = f"MediPrimer translation sync {datetime.date.today()}: FAILED"
msg.set_content("Validation failed. Check logs.\n" + "\nLast 40 log lines (" + LOG + "):\n\n" + "".join(open(LOG, encoding="utf-8", errors="replace").readlines()[-40:]))
with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
  s.login("kurt@hamm.me", pw_file.read_text(encoding="utf-8").strip())
  s.send_message(msg)
PYMAIL
exit 1; }

log "All validation gates passed."

# --- 6. Deploy (rsync + chown + nginx reload) ----------------------------------
# Pattern mirrors seo-optimize.sh exactly to ensure consistency.
log "Deploying translations..."
if sudo -n rsync -a --delete "$PUB/" "$DOCROOT/" && \
   sudo -n chown -R www-data:www-data "$DOCROOT/" && \
   sudo -n systemctl reload nginx; then
  log "Deployed."

  # --- 6b. Repo parity: commit + standing PR (never fails the run) ------------------
  bash "$SEO/git-autopr.sh" "auto(i18n): nightly translation sync $(date +%F)" || true

  # --- 7. IndexNow ping (best effort) ------------------------------------------
  python3 "$BASE/build/indexnow.py" || log "WARN: indexnow ping failed"

  # --- 8. Email success ---------------------------------------------------
  python3 - "$PAGES_CHANGED" "$CHANGED_LANGS" <<'PYMAIL'
import smtplib, pathlib, datetime, sys
from email.message import EmailMessage
pages = sys.argv[1]
langs = sys.argv[2].strip()
pw_file = pathlib.Path.home() / ".sgw_gmail_password"
msg = EmailMessage()
msg["From"] = "Kurt Hamm <editor@mediprimer.org>"
msg["To"] = "kurt@hamm.me"
msg["Subject"] = f"MediPrimer translation sync {datetime.date.today()}: {pages} pages, {langs}"
msg.set_content(f"Translation sync completed successfully.\nPages updated: {pages}\nLanguages: {langs}\n")
with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
  s.login("kurt@hamm.me", pw_file.read_text(encoding="utf-8").strip())
  s.send_message(msg)
PYMAIL
  log "Success email sent."

else
  log "FATAL: deploy failed; source holds translations, live unchanged."
  flush_log; python3 - <<'PYMAIL'
import smtplib, pathlib, datetime, os
LOG = os.environ["LOG"]
from email.message import EmailMessage
pw_file = pathlib.Path.home() / ".sgw_gmail_password"
msg = EmailMessage()
msg["From"] = "Kurt Hamm <editor@mediprimer.org>"
msg["To"] = "kurt@hamm.me"
msg["Subject"] = f"MediPrimer translation sync {datetime.date.today()}: FAILED"
msg.set_content("Deploy failed (rsync/chown/reload). Source tree holds translations but live site unchanged. Check logs.\n" + "\nLast 40 log lines (" + LOG + "):\n\n" + "".join(open(LOG, encoding="utf-8", errors="replace").readlines()[-40:]))
with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
  s.login("kurt@hamm.me", pw_file.read_text(encoding="utf-8").strip())
  s.send_message(msg)
PYMAIL
  exit 1
fi

log "=== done (deployed) ==="
