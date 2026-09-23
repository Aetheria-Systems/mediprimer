#!/usr/bin/env python3
"""Add the i18n scaffold to an interactive tool and wrap its visible text in t().

Companion to build/gen_tool_strings.py, which fills the table this creates. The
tools render their own markup by string concatenation, so a user-visible phrase
is usually spliced INSIDE a longer literal:

    '<label><input type="radio" value="x"><span>Medicare only</span></label>'

Matching whole quoted literals therefore misses almost everything — the first
attempt on help-paying.js wrapped 4 of 30 strings that way. This splices the
text out of the surrounding literal instead:

    '<label><input type="radio" value="x"><span>' + t('Medicare only') + '</span></label>'

Run this once per tool, check `node --check`, then run gen_tool_strings.py.
Idempotent: text already routed through t() is left alone.

  i18n_wrap_tool.py medicare-navigator.js
  i18n_wrap_tool.py medicare-navigator.js --dry-run
"""
import pathlib
import re
import sys

PUB = pathlib.Path(__file__).parent.parent / "public"

SCAFFOLD = '''  "use strict";

  /* Translations. Keys are the English source strings, so a missing
     translation degrades to English rather than breaking the tool.
     Filled by build/gen_tool_strings.py; enforced by
     build/check_language_coverage.py. */
  var I18N = {};
  var MP_LANG = (document.documentElement.getAttribute("lang") || "en").trim() || "en";
  function t(en) {
    var tbl = I18N[MP_LANG];
    return (tbl && tbl[en]) || en;
  }
'''

# Inline elements whose text content is shown to the reader.
# `a` and the block tags matter as much as `span`: the first pass omitted them
# and left 19 strings of link text untranslated in medicare-navigator.js alone.
TAGS = ["span", "h2", "h3", "h4", "h5", "button", "legend", "summary", "strong",
        "em", "label", "option", "p", "a", "li", "td", "th", "div", "small"]


def wrap(src):
    n = 0

    def repl(m):
        nonlocal n
        open_tag, text, close_tag = m.group(1), m.group(2), m.group(3)
        # Only wrap plain prose. Text containing a quote or a + is a
        # concatenation boundary, i.e. `"<h3>" + esc(o.name) + "</h3>"`, where
        # the "text" is a VARIABLE. Wrapping that produced
        # `"<h3>' + t('" + esc(o.name) + "') + '</h3>"` — valid syntax that
        # renders raw JavaScript to the reader. It slipped through twice.
        if ("t(" in text or '"' in text or "+" in text
                or not re.search(r"[A-Za-z]{3}", text)):
            return m.group(0)
        n += 1
        return f"{open_tag}' + t('{text.replace(chr(39), chr(92) + chr(39))}') + '{close_tag}"

    pat = re.compile(r"(<(?:" + "|".join(TAGS) + r")(?:\s[^<>]*)?>)([^<>']+)(</(?:" + "|".join(TAGS) + r")>)")
    return pat.sub(repl, src), n


def main():
    if len(sys.argv) < 2:
        raise SystemExit("usage: i18n_wrap_tool.py <tool.js> [--dry-run]")
    p = PUB / sys.argv[1]
    s = p.read_text(encoding="utf-8")
    if "var I18N" not in s:
        if '  "use strict";\n' not in s:
            raise SystemExit(f"{p.name}: no `\"use strict\";` line to anchor the scaffold")
        s = s.replace('  "use strict";\n', SCAFFOLD, 1)
        print(f"  {p.name}: scaffold inserted")
    s, n = wrap(s)
    print(f"  {p.name}: {n} string(s) wrapped")
    if "--dry-run" in sys.argv:
        return
    p.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    main()
