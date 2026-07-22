#!/usr/bin/env python3
"""MediPrimer readability checker — plain language is a site tenet.
Prints Flesch-Kincaid grade + Flesch Reading Ease for member-facing pages.
Usage: readability.py [dir] [--all]   (default dir: ../public)
Target for member content: grade <= ~9, ease >= ~55 (plain)."""
import re, glob, os, sys

PUB = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") \
      else os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
SHOW_ALL = "--all" in sys.argv

# Pages that are member-facing (held to the plain-language target).
MEMBER = {
 "turning-65","veterans-medicare","edge-cases","choosing-coverage","costs","enrollment",
 "how-do-i","rights","getting-help","caregivers","medigap","medicare-part-a","medicare-part-b",
 "medicare-part-d","medicare-advantage","medicaid-eligibility","marketplace","dual-eligible",
 "working-past-65","retiring-losing-coverage","disability-medicare","moving-states","chip",
 "enrollment-calendar","checklists","member-journey","coverage-basics","plan-types",
 "medicaid-starting-out","using-plan-finder","common-mistakes","planning-for-two",
}

def text_of_main(html):
    m = re.search(r'<main.*?>(.*?)</main>', html, re.DOTALL)
    body = m.group(1) if m else html
    body = re.sub(r'<(script|style|table)[^>]*>.*?</\1>', ' ', body, flags=re.DOTALL)
    body = re.sub(r'<[^>]+>', ' ', body)
    body = re.sub(r'&[a-z]+;', ' ', body)
    return re.sub(r'\s+', ' ', body).strip()

def syllables(w):
    w = re.sub(r'[^a-z]', '', w.lower())
    if not w: return 0
    n = len(re.findall(r'[aeiouy]+', w))
    if w.endswith('e') and not w.endswith('le') and n > 1: n -= 1
    return max(1, n)

def score(text):
    sents = [s for s in re.split(r'[.!?]+', text) if s.strip()]
    words = re.findall(r"[A-Za-z']+", text)
    if not sents or not words: return None
    W, S = len(words), len(sents)
    syl = sum(syllables(w) for w in words)
    fk = 0.39*(W/S) + 11.8*(syl/W) - 15.59
    ease = 206.835 - 1.015*(W/S) - 84.6*(syl/W)
    return round(fk,1), round(ease), W

rows, over = [], []
for p in sorted(glob.glob(os.path.join(PUB, "*.html"))):
    name = os.path.basename(p)[:-5]
    if not SHOW_ALL and name not in MEMBER: continue
    s = score(text_of_main(open(p, encoding="utf-8").read()))
    if s: rows.append((name,)+s)
rows.sort(key=lambda r: -r[1])
print(f"{'page':<26}{'grade':>6}{'ease':>6}")
for name, fk, ease, w in rows:
    flag = "  <-- over target" if fk > 9.5 else ""
    print(f"{name:<26}{fk:>6}{ease:>6}{flag}")
    if fk > 9.5: over.append(name)
if rows:
    print(f"\n{'AVERAGE':<26}{sum(r[1] for r in rows)/len(rows):>6.1f}{sum(r[2] for r in rows)/len(rows):>6.0f}")
    print(f"Over target (grade > 9.5): {len(over)}  {' '.join(over) if over else '(none)'}")
