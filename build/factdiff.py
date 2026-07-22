#!/usr/bin/env python3
"""Flag possible factual drift from the plain-language pass.
Compares OLD (deployed /var/www) vs NEW (source public) for each simplified page
and reports 'claim tokens' (program names, acronyms, numbers, key rule words)
that were ADDED or REMOVED. Added program names/numbers are the top risk."""
import re, os

OLD = "/var/www/mediprimer/public"
NEW = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")

PAGES = """medicaid-eligibility disability-medicare medicare-part-b medicare-advantage
marketplace medicare-part-a dual-eligible medigap caregivers edge-cases enrollment
medicare-part-d choosing-coverage working-past-65 retiring-losing-coverage chip
veterans-medicare moving-states rights getting-help planning-for-two""".split()

# High-signal claim tokens: program/acronym names + rule words. Numbers handled separately.
TERMS = ["TRICARE","CHAMPVA","CHIP","COBRA","HSA","ESRD","ALS","SSDI","SSI","PACE",
 "IRMAA","QMB","SLMB","QI","WISeR","Medigap","HMO","PPO","SNP","D-SNP","C-SNP","I-SNP",
 "Medicaid","Medicare","Marketplace","Part A","Part B","Part C","Part D","SSA-44",
 "creditable","underwriting","guaranteed issue","trial right","prior authorization",
 "premium","deductible","coinsurance","copay","formulary","primary","secondary",
 "penalty","medically necessary","out-of-pocket","network"]

def main_text(path):
    s = open(path, encoding="utf-8").read()
    m = re.search(r'<main.*?>(.*?)</main>', s, re.DOTALL)
    b = m.group(1) if m else s
    b = re.sub(r'<[^>]+>', ' ', b)
    b = re.sub(r'&[a-z]+;', ' ', b)
    return re.sub(r'\s+', ' ', b)

def tokens(text):
    tset = set()
    low = text.lower()
    for t in TERMS:
        if t.lower() in low:
            tset.add(t)
    for num in set(re.findall(r'\b\d[\d,]*\b|\b\d+%', text)):
        tset.add("#"+num)
    return tset

any_flag = False
for name in PAGES:
    op = os.path.join(OLD, name+".html"); np = os.path.join(NEW, name+".html")
    if not (os.path.exists(op) and os.path.exists(np)):
        print(f"[skip] {name} (missing)"); continue
    old, new = tokens(main_text(op)), tokens(main_text(np))
    added = sorted(new - old); removed = sorted(old - new)
    if added or removed:
        any_flag = True
        print(f"\n=== {name} ===")
        if added:   print("  ADDED  :", ", ".join(added))
        if removed: print("  REMOVED:", ", ".join(removed))
if not any_flag:
    print("No claim-token changes detected across pages.")
