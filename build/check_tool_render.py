#!/usr/bin/env python3
"""Render each interactive tool in a fake DOM and fail if the output is wrong.

`node --check` only proves a file parses. It happily accepts a string literal
containing the text `' + t('Original Medicare') + '`, which is what happened on
2026-09-23: an i18n wrapper spliced concatenation into DOUBLE-quoted literals,
so the JavaScript rendered as visible text to the reader. The file parsed, the
build passed, and it shipped.

This executes each tool against a minimal DOM stub and asserts on the HTML it
actually produces:
  1. no raw concatenation syntax (`' + t(`, `" + t(`) survives into output
  2. in a non-English language, the output is not still English
Run for every launched language.
"""
import json
import pathlib
import subprocess
import sys

BASE = pathlib.Path(__file__).parent.parent
PUB = BASE / "public"

TOOLS = {
    "help-paying.js": "help-paying-questionnaire",
    "medicare-navigator.js": "medicare-navigator",
    "priorities.js": "priorities-tool",
    "your-state.js": "your-state",
    "chatbot.js": "medibot-root",
    "glossary.js": "glossary-list",
    "lang-suggest.js": "lang-banner",
}

HARNESS = r"""
const fs = require('fs');
// argv[0]=node, argv[1]=this harness, so the real arguments start at 2.
// Using [1] made the harness eval ITSELF — a stack overflow that looked
// like every tool failing.
const file = process.argv[2], rootId = process.argv[3], lang = process.argv[4];
let out = '';
function mkEl(tag) {
  // Attribute-delivered text counts: chatbot.js sets its placeholder and
  // aria-label rather than writing markup, so a harness that only captured
  // innerHTML saw an empty string and reported every language as "identical
  // to English". Capture the visible attributes too.
  const el = {
    tagName: tag, children: [], style: {}, classList: {add(){}, remove(){}, toggle(){}, contains(){return false}},
    set innerHTML(v) { out += v; }, get innerHTML() { return ''; },
    set textContent(v) { out += v; }, get textContent() { return ''; },
    set placeholder(v) { out += v; }, get placeholder() { return ''; },
    set title(v) { out += v; }, get title() { return ''; },
    set value(v) { out += v; }, get value() { return ''; },
    setAttribute(k, v){ if (/aria-label|placeholder|title|alt/.test(k)) out += v; },
    getAttribute(){ return null; }, removeAttribute(){},
    appendChild(c){ return c; }, insertBefore(c){ return c; }, removeChild(c){ return c; },
    addEventListener(){}, removeEventListener(){},
    insertAdjacentHTML(_p, h){ out += h; },
    querySelector(){ return mkEl('div'); }, querySelectorAll(){ return []; },
    scrollIntoView(){}, focus(){}, remove(){}, closest(){ return null; }, contains(){ return false; },
    cloneNode(){ return mkEl(tag); }, getBoundingClientRect(){ return {top:0,left:0,width:0,height:0}; },
  };
  el.parentNode = { insertBefore(c){ return c; }, removeChild(c){ return c; }, appendChild(c){ return c; } };
  el.firstChild = null; el.nextElementSibling = null; el.dataset = {};
  return el;
}
global.document = {
  documentElement: { lang, getAttribute: (a) => (a === 'lang' ? lang : null) },
  getElementById: (id) => (id === rootId ? mkEl('div') : mkEl('div')),
  createElement: mkEl, addEventListener(){}, querySelector(){ return mkEl('div') },
  querySelectorAll(){ return [] }, body: mkEl('body'), head: mkEl('head'),
};
global.window = { addEventListener(){}, matchMedia: () => ({matches:false, addEventListener(){}, addListener(){}}), location:{pathname:'/'} };
global.fetch = () => Promise.resolve({ json: () => Promise.resolve({}), ok: true });
try { eval(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('THREW: ' + e.message); process.exit(2); }
console.log(out);
"""


def launched():
    d = json.loads((BASE / "build" / "languages.json").read_text(encoding="utf-8"))
    codes = [l["code"] for l in d["languages"] if l.get("launched")]
    # English is the baseline every other language is compared against, and it
    # carries no `launched` flag in languages.json. Without it the comparison
    # silently never runs and the check passes on completely untranslated tools.
    return ["en"] + [c for c in codes if c != "en"]


def main():
    h = BASE / "build" / ".tool-render-harness.js"
    h.write_text(HARNESS, encoding="utf-8")
    bad = 0
    english = {}
    for tool, root in TOOLS.items():
        path = PUB / tool
        if not path.exists():
            continue
        for lang in launched():
            r = subprocess.run(["node", str(h), str(path), root, lang],
                               capture_output=True, text=True, timeout=60)
            if r.returncode == 2:
                print(f"  FAIL {tool} [{lang}]: {r.stderr.strip()[:120]}")
                bad += 1
                continue
            html = r.stdout
            if lang == "en":
                english[tool] = html
            hit = False
            for marker in ["' + t(", '" + t(', "+ t("]:
                if marker in html:
                    print(f"  FAIL {tool} [{lang}]: raw concatenation rendered as text "
                          f"— found {marker!r} in the output")
                    bad += 1
                    hit = True
                    break
            if hit or lang == "en":
                continue
            # A non-English render that is byte-identical to English means the
            # translation table never loaded — the original bug, which a syntax
            # check cannot see.
            if html.strip() and html == english.get(tool, ""):
                print(f"  FAIL {tool} [{lang}]: renders identically to English "
                      f"— translation table missing or not applied")
                bad += 1
    h.unlink(missing_ok=True)
    if bad:
        print(f"check_tool_render: FAILED — {bad} problem(s)")
        raise SystemExit(1)
    print(f"check_tool_render: PASSED — {len(TOOLS)} tool(s) render clean in {', '.join(launched())}")


if __name__ == "__main__":
    main()
