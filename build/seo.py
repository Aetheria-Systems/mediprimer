#!/usr/bin/env python3
"""Full SEO groundwork for MediPrimer (public-resource mode). Idempotent.
Per page, injects a marked <!--seo-->…<!--/seo--> block into <head> with:
  - canonical link
  - Open Graph + Twitter meta
  - JSON-LD: Organization + WebSite(+SearchAction) on home; FAQPage on key pages.
Also (re)generates sitemap.xml and robots.txt.
Pass the build date as argv[1] (YYYY-MM-DD); scripts must not call date()."""
import re, os, glob, sys, json
from html import unescape
PUB = "/home/deltaprism/mediprimer/public"
BASE = "https://mediprimer.org"
TODAY = sys.argv[1] if len(sys.argv) > 1 else "2026-07-12"
PUBLISHED = "2026-07-12"
EDITOR = "Kurt Hamm"  # named editor for E-E-A-T; change here if the byline should differ

# Accurate FAQ pairs that reflect on-page content (Google requires the match).
FAQ = {
    "turning-65.html": [
        ("When can I sign up for Medicare?",
         "Your Initial Enrollment Period is a 7-month window around your 65th birthday: the 3 months before your birthday month, your birthday month, and the 3 months after. Signing up in this window avoids late penalties."),
        ("Do I have to take Medicare at 65 if I'm still working?",
         "Not always. If you have coverage from a current employer with 20 or more employees, you may be able to delay Part B without a penalty. Retiree coverage, COBRA, and VA benefits do not let you delay Part B safely."),
        ("Is Medicare a family plan?",
         "No. Medicare is individual. You and a spouse each get your own Medicare on your own timelines."),
    ],
    "choosing-coverage.html": [
        ("What is the difference between Original Medicare and Medicare Advantage?",
         "Both cover the same core benefits. Original Medicare lets you see any provider that takes Medicare with little pre-approval. Medicare Advantage uses networks and prior authorization, but often adds extra benefits and a yearly out-of-pocket cap."),
        ("Can I switch from Medicare Advantage back to Original Medicare later?",
         "You can switch during set windows, but buying a Medigap supplement afterward can require medical underwriting, and you can be turned down. This 'one-way door' is the most important thing to weigh before you choose."),
    ],
    "planning-for-two.html": [
        ("Does Medicare cover my spouse?",
         "No. Medicare has no family or spouse coverage. Each spouse gets their own Medicare at their own 65th birthday, pays their own premiums, and picks their own plans. A younger spouse needs other coverage until their own Medicare begins."),
        ("Does my spouse's income affect my Medicare premium?",
         "It can. If you file taxes jointly, Social Security uses your combined income from two years ago to set the income surcharge (IRMAA) on each spouse's Part B and Part D premiums. If your income dropped after retiring, you can ask Social Security to lower it using form SSA-44."),
    ],
    "veterans-medicare.html": [
        ("If I have VA health care, do I still need Medicare Part B?",
         "VA health care does not let you delay Part B without a lifelong penalty, and Part B is what covers care outside the VA. Many veterans enroll in Part B at 65 to keep that option; some skip it deliberately. Decide on purpose during your enrollment window."),
        ("Can I use the VA pharmacy instead of Medicare Part D?",
         "Yes. VA drug coverage counts as creditable, so you can usually skip Part D without a penalty while you use the VA pharmacy."),
    ],
}

def field(html, pat):
    m = re.search(pat, html, re.DOTALL)
    return re.sub(r'\s+', ' ', m.group(1)).strip() if m else ""

def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>'

SEO_RE = re.compile(r'\n?<!--seo-->.*?<!--/seo-->', re.DOTALL)
# Hand-written OG/Twitter/canonical tags outside the seo block duplicate (and can
# contradict) the generated ones; remove them so the seo block is the single source.
MANUAL_META_RE = re.compile(
    r'\n?<(?:meta (?:property="og:[^"]*"|name="twitter:[^"]*")|link rel="canonical") [^>]*>')

def q(s):
    return s.replace('"', '&quot;')

def seo_block(name, url, title, desc):
    parts = ['<!--seo-->',
             '<link rel="canonical" href="%s">' % url,
             '<meta property="og:type" content="website">',
             '<meta property="og:site_name" content="MediPrimer">',
             '<meta property="og:title" content="%s">' % q(title),
             '<meta property="og:description" content="%s">' % q(desc),
             '<meta property="og:url" content="%s">' % url,
             '<meta name="twitter:card" content="summary">',
             '<meta name="twitter:title" content="%s">' % q(title),
             '<meta name="twitter:description" content="%s">' % q(desc)]
    if name == "index.html":
        parts.append(ld({"@context": "https://schema.org", "@type": "Organization",
                         "name": "MediPrimer", "url": BASE + "/",
                         "description": "Independent, plain-language educational resource on Medicare, Medicaid, and managed care. Not affiliated with any agency or insurer."}))
        parts.append(ld({"@context": "https://schema.org", "@type": "WebSite",
                         "name": "MediPrimer", "url": BASE + "/",
                         "potentialAction": {"@type": "SearchAction",
                             "target": {"@type": "EntryPoint", "urlTemplate": BASE + "/glossary.html?q={search_term_string}"},
                             "query-input": "required name=search_term_string"}}))
    if name in FAQ:
        parts.append(ld({"@context": "https://schema.org", "@type": "FAQPage",
                         "mainEntity": [{"@type": "Question", "name": qq,
                                         "acceptedAnswer": {"@type": "Answer", "text": a}} for qq, a in FAQ[name]]}))
    # JSON-LD is raw text inside <script>, not HTML — entities must be decoded
    clean = unescape(re.sub(r'\s*—\s*MediPrimer$', '', title))
    parts.append(ld({"@context": "https://schema.org", "@type": "WebPage",
                     "name": clean, "description": unescape(desc), "url": url, "inLanguage": "en-US",
                     "datePublished": PUBLISHED, "dateModified": TODAY,
                     "author": {"@type": "Person", "name": EDITOR, "url": BASE + "/about.html"},
                     "isPartOf": {"@type": "WebSite", "name": "MediPrimer", "url": BASE + "/"},
                     "publisher": {"@type": "Organization", "name": "MediPrimer",
                                   "founder": {"@type": "Person", "name": EDITOR}}}))
    if name != "index.html":
        parts.append(ld({"@context": "https://schema.org", "@type": "BreadcrumbList",
                         "itemListElement": [
                             {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"},
                             {"@type": "ListItem", "position": 2, "name": clean, "item": url}]}))
    parts.append('<!--/seo-->')
    return "\n".join(parts)

changed, urls = 0, []
for path in sorted(glob.glob(os.path.join(PUB, "*.html"))):
    name = os.path.basename(path)
    html = open(path, encoding="utf-8").read()
    title = field(html, r'<title>(.*?)</title>')
    desc = field(html, r'<meta name="description" content="(.*?)">')
    url = BASE + "/" + ("" if name == "index.html" else name)
    urls.append((url, name))
    html2 = SEO_RE.sub("", html)
    html2 = MANUAL_META_RE.sub("", html2)
    if "</head>" in html2:
        html2 = html2.replace("</head>", seo_block(name, url, title, desc) + "\n</head>", 1)
    if html2 != html:
        open(path, "w", encoding="utf-8").write(html2); changed += 1

sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for url, name in urls:
    LEGAL = ("privacy.html", "terms-of-use.html", "disclaimer.html", "accessibility.html", "site-map.html")
    KEY = ("turning-65.html", "choosing-coverage.html", "members.html", "getting-help.html",
           "medicaid-starting-out.html", "dual-eligible.html")
    HUB = ("basics.html", "coverage-basics.html", "how-do-i.html", "enrollment.html",
           "costs.html", "glossary.html", "professionals.html", "caregivers.html")
    pr = ("1.0" if name == "index.html" else
          "0.9" if name in KEY else
          "0.8" if name in HUB else
          "0.3" if name in LEGAL else "0.7")
    sm.append("  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>" % (url, TODAY, pr))
sm.append("</urlset>")
open(os.path.join(PUB, "sitemap.xml"), "w").write("\n".join(sm) + "\n")
open(os.path.join(PUB, "robots.txt"), "w").write("User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % BASE)
print("seo: head block on %d page(s); sitemap %d urls; robots.txt written" % (changed, len(urls)))
