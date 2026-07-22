"""make check gate: every public page must include the chat widget script."""
import glob
import pathlib
import re
import sys

PUB = pathlib.Path(__file__).parent.parent / "public"

missing = []
for path in sorted(glob.glob(str(PUB / "*.html"))):
    src = pathlib.Path(path).read_text(encoding="utf-8")
    if not re.search(r'<script[^>]+src="/chatbot\.js"', src):
        missing.append(pathlib.Path(path).name)

if missing:
    print("check_chatbot_injected: FAILED — missing chatbot.js on:", file=sys.stderr)
    for name in missing:
        print(f"  - {name}", file=sys.stderr)
    sys.exit(1)

print(f"check_chatbot_injected: PASSED — {len(glob.glob(str(PUB / '*.html')))} pages OK")
