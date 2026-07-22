#!/usr/bin/env python3
"""Full SEO groundwork for MediPrimer (public-resource mode). Idempotent.
Per page, injects a marked <!--seo-->…<!--/seo--> block into <head> with:
  - canonical link
  - Open Graph + Twitter meta
  - JSON-LD: Organization + WebSite(+SearchAction) on home; FAQPage on key pages.
Also (re)generates sitemap.xml and robots.txt.
Pass the build date as argv[1] (YYYY-MM-DD); scripts must not call date()."""
import re, os, glob, sys, json, hashlib
from html import unescape
PUB = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
BASE = "https://mediprimer.org"
TODAY = sys.argv[1] if len(sys.argv) > 1 else "2026-07-12"
PUBLISHED = "2026-07-12"
EDITOR = "Kurt Hamm"  # named editor for E-E-A-T; change here if the byline should differ
DATES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "page-dates.json")
LANGUAGES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "languages.json")
ANALYTICS_RE = re.compile(r'\n?<!--P:analytics-->.*?<!--/P:analytics-->', re.DOTALL)
SWITCHER_RE = re.compile(r'\n?<!--switcher-->.*?<!--/switcher-->', re.DOTALL)

def content_hash(html):
    core = SEO_RE.sub("", ANALYTICS_RE.sub("", SWITCHER_RE.sub("", html)))
    text = re.sub(r"<[^>]+>", " ", core)
    return hashlib.md5(re.sub(r"\s+", " ", text).strip().encode()).hexdigest()

def page_date(name, html, dates):
    h = content_hash(html)
    entry = dates.get(name)
    if entry and entry["hash"] == h:
        return entry["date"]
    dates[name] = {"hash": h, "date": TODAY}
    return TODAY

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

# Per-language translations of FAQ, keyed by lang_code then page name (same
# keys as FAQ). Used for FAQPage JSON-LD on translated pages so structured
# data matches each page's declared inLanguage.
FAQ_TRANSLATIONS = {}

FAQ_TRANSLATIONS["es"] = {
    "turning-65.html": [
        ("¿Cuándo puedo inscribirme en Medicare?",
         "Su Período de Inscripción Inicial es una ventana de 7 meses alrededor de su cumpleaños número 65: los 3 meses antes del mes de su cumpleaños, el mes de su cumpleaños, y los 3 meses después. Inscribirse dentro de esta ventana evita las penalizaciones por inscripción tardía."),
        ("¿Tengo que inscribirme en Medicare a los 65 años si todavía estoy trabajando?",
         "No siempre. Si tiene cobertura de un empleador actual con 20 o más empleados, es posible que pueda retrasar la Parte B sin penalización. La cobertura de jubilado, COBRA y los beneficios del VA no le permiten retrasar la Parte B de forma segura."),
        ("¿Es Medicare un plan familiar?",
         "No. Medicare es individual. Usted y su cónyuge reciben cada uno su propio Medicare según sus propios plazos."),
    ],
    "choosing-coverage.html": [
        ("¿Cuál es la diferencia entre la Cobertura Original de Medicare y Medicare Advantage?",
         "Ambas cubren los mismos beneficios principales. La Cobertura Original de Medicare le permite consultar a cualquier proveedor que acepte Medicare, con poca preaprobación. Medicare Advantage usa redes y autorización previa, pero a menudo añade beneficios adicionales y un límite anual de gastos de bolsillo."),
        ("¿Puedo cambiar de Medicare Advantage de vuelta a la Cobertura Original de Medicare más adelante?",
         "Puede cambiar durante ciertas ventanas establecidas, pero comprar un suplemento Medigap después puede requerir suscripción médica, y le pueden negar la cobertura. Esta 'puerta de un solo sentido' es lo más importante que debe considerar antes de elegir."),
    ],
    "planning-for-two.html": [
        ("¿Medicare cubre a mi cónyuge?",
         "No. Medicare no tiene cobertura familiar ni de cónyuge. Cada cónyuge recibe su propio Medicare en su propio cumpleaños número 65, paga sus propias primas y elige sus propios planes. Un cónyuge más joven necesita otra cobertura hasta que comience su propio Medicare."),
        ("¿El ingreso de mi cónyuge afecta mi prima de Medicare?",
         "Puede que sí. Si presenta impuestos de forma conjunta, el Seguro Social usa su ingreso combinado de hace dos años para fijar el cargo adicional por ingresos (IRMAA) en las primas de la Parte B y la Parte D de cada cónyuge. Si su ingreso bajó después de jubilarse, puede pedirle al Seguro Social que lo reduzca usando el formulario SSA-44."),
    ],
    "veterans-medicare.html": [
        ("Si tengo atención médica del VA, ¿todavía necesito la Parte B de Medicare?",
         "La atención médica del VA no le permite retrasar la Parte B sin una penalización de por vida, y la Parte B es lo que cubre la atención fuera del VA. Muchos veteranos se inscriben en la Parte B a los 65 años para mantener esa opción; algunos la omiten deliberadamente. Decida a propósito durante su ventana de inscripción."),
        ("¿Puedo usar la farmacia del VA en lugar de la Parte D de Medicare?",
         "Sí. La cobertura de medicamentos del VA cuenta como acreditable, por lo que generalmente puede omitir la Parte D sin penalización mientras use la farmacia del VA."),
    ],
}

FAQ_TRANSLATIONS["zh-Hant"] = {
    "turning-65.html": [
        ("我什麼時候可以申請Medicare？",
         "您的初始註冊期是圍繞您65歲生日的7個月期間：生日月份前的3個月、生日當月，以及之後的3個月。在此期間內申請可避免遲交註冊罰款。"),
        ("如果我65歲時仍在工作，是否必須加入Medicare？",
         "不一定。如果您有20名或以上員工的現職雇主提供的保險，您或許可以延遲加入B部分而不受罰款。退休人員保險、COBRA和VA福利都不能讓您安全地延遲加入B部分。"),
        ("Medicare是家庭計劃嗎？",
         "不是。Medicare是個人保險。您與配偶各自按照自己的時間表獲得各自的Medicare。"),
    ],
    "choosing-coverage.html": [
        ("原始Medicare與Medicare Advantage有什麼區別？",
         "兩者涵蓋相同的核心福利。原始Medicare讓您可以在幾乎無需事先核准的情況下就診任何接受Medicare的醫療提供者。Medicare Advantage使用網絡和預先授權，但通常會增加額外福利和每年自付費用上限。"),
        ("我以後可以從Medicare Advantage轉回原始Medicare嗎？",
         "您可以在特定期間內轉換，但之後購買Medigap補充保險可能需要醫療核保，並可能被拒保。這個「單向門」是您選擇前必須考慮的最重要因素。"),
    ],
    "planning-for-two.html": [
        ("Medicare是否涵蓋我的配偶？",
         "不。Medicare沒有家庭或配偶保險。每位配偶在自己65歲生日時獲得各自的Medicare，支付各自的保費，並選擇各自的計劃。較年輕的配偶在自己的Medicare開始之前需要其他保險。"),
        ("配偶的收入是否會影響我的Medicare保費？",
         "有可能。如果您與配偶合併報稅，社會安全局會使用您們兩年前的合併收入來設定每位配偶B部分和D部分保費的收入附加費（IRMAA）。如果您退休後收入下降，可以使用SSA-44表格要求社會安全局降低費用。"),
    ],
    "veterans-medicare.html": [
        ("如果我有VA醫療保健，是否仍需要Medicare B部分？",
         "VA醫療保健無法讓您在不受終身罰款的情況下延遲加入B部分，而B部分涵蓋VA以外的醫療照護。許多退伍軍人在65歲時加入B部分以保留此選擇；有些人則刻意跳過。請在您的註冊期間內審慎決定。"),
        ("我可以使用VA藥房代替Medicare D部分嗎？",
         "可以。VA藥物保險被視為合格承保，因此在使用VA藥房期間，您通常可以跳過D部分而不受罰款。"),
    ],
}

# Translated "Home" breadcrumb label per language, for BreadcrumbList JSON-LD.
BREADCRUMB_HOME = {"es": "Inicio", "zh-Hant": "首頁"}

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

def load_languages():
    """Load languages.json; return dict of code -> lang config.
    Missing or corrupt file aborts loudly (file is repo-tracked and required)."""
    try:
        with open(LANGUAGES_FILE, encoding="utf-8") as f:
            data = json.load(f)
            return {lang["code"]: lang for lang in data.get("languages", [])}
    except FileNotFoundError:
        raise SystemExit(f"seo.py: {LANGUAGES_FILE} not found — this file is required and should be repo-tracked.")
    except json.JSONDecodeError as e:
        raise SystemExit(f"seo.py: {LANGUAGES_FILE} is malformed ({e}) — restore it (git checkout -- build/languages.json).")

def alternates(name, langs_dict, pub_dir):
    """Emit hreflang link cluster for a page name.
    For English page: include en + all launched languages where public/<code>/name exists + x-default.
    Only emit if there are actually launched languages with translations.
    Returns HTML link string."""
    links = []

    # Check if any languages are launched
    has_launched = any(lang_config.get("launched") for lang_config in langs_dict.values())
    if not has_launched:
        return ""

    # Always include English with x-default pointing to it
    en_url = BASE + "/" + ("" if name == "index.html" else name)
    links.append('<link rel="alternate" hreflang="en" href="%s">' % en_url)

    # Check launched languages for translated files
    for code, lang_config in sorted(langs_dict.items()):
        if lang_config.get("launched"):
            # Check if the translated file exists
            lang_file = os.path.join(pub_dir, code, name)
            if os.path.exists(lang_file):
                lang_url = BASE + "/" + code + "/" + ("" if name == "index.html" else name)
                links.append('<link rel="alternate" hreflang="%s" href="%s">' % (code, lang_url))

    # x-default points to English
    links.append('<link rel="alternate" hreflang="x-default" href="%s">' % en_url)

    return "\n".join(links)

def seo_block(name, url, title, desc, mod_date, lang_code=None, in_language=None, langs_dict=None):
    parts = ['<!--seo-->',
             '<link rel="canonical" href="%s">' % url,
             '<meta property="og:type" content="website">',
             '<meta property="og:site_name" content="MediPrimer">',
             '<meta property="og:title" content="%s">' % q(title),
             '<meta property="og:description" content="%s">' % q(desc),
             '<meta property="og:url" content="%s">' % url]

    # Add og:locale for translated pages (from language config)
    if lang_code and lang_code != "en" and langs_dict is not None:
        if lang_code in langs_dict:
            og_locale = langs_dict[lang_code].get("og_locale")
            if og_locale:
                parts.append('<meta property="og:locale" content="%s">' % og_locale)
            else:
                raise SystemExit(f"seo.py: launched language {lang_code} missing og_locale in languages.json")

    parts.extend([
             '<meta name="twitter:card" content="summary">',
             '<meta name="twitter:title" content="%s">' % q(title),
             '<meta name="twitter:description" content="%s">' % q(desc)])
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
        if lang_code and lang_code != "en":
            if lang_code not in FAQ_TRANSLATIONS or name not in FAQ_TRANSLATIONS[lang_code]:
                raise SystemExit(f"seo.py: missing FAQ translation for {name} (lang={lang_code})")
            faq_pairs = FAQ_TRANSLATIONS[lang_code][name]
        else:
            faq_pairs = FAQ[name]
        parts.append(ld({"@context": "https://schema.org", "@type": "FAQPage",
                         "mainEntity": [{"@type": "Question", "name": qq,
                                         "acceptedAnswer": {"@type": "Answer", "text": a}} for qq, a in faq_pairs]}))
    # JSON-LD is raw text inside <script>, not HTML — entities must be decoded
    clean = unescape(re.sub(r'\s*—\s*MediPrimer$', '', title))

    # Use provided in_language or default to "en-US" for English, constructed for translations
    if in_language is None:
        in_language = "en-US" if not lang_code or lang_code == "en" else lang_code + "-US"

    # Add alternates cluster for English and translated pages
    if not lang_code or lang_code == "en":
        if langs_dict is not None:
            alt_str = alternates(name, langs_dict, PUB)
            if alt_str:
                parts.append(alt_str)

    parts.append(ld({"@context": "https://schema.org", "@type": "WebPage",
                     "name": clean, "description": unescape(desc), "url": url, "inLanguage": in_language,
                     "datePublished": PUBLISHED, "dateModified": mod_date,
                     "author": {"@type": "Person", "name": EDITOR, "url": BASE + "/about.html"},
                     "isPartOf": {"@type": "WebSite", "name": "MediPrimer", "url": BASE + "/"},
                     "publisher": {"@type": "Organization", "name": "MediPrimer",
                                   "founder": {"@type": "Person", "name": EDITOR}}}))

    # Add alternates cluster for translated pages too
    if lang_code and lang_code != "en" and langs_dict is not None:
        alt_str = alternates(name, langs_dict, PUB)
        if alt_str:
            parts.append(alt_str)

    if name != "index.html":
        if lang_code and lang_code != "en":
            if lang_code not in BREADCRUMB_HOME:
                raise SystemExit(f"seo.py: missing BREADCRUMB_HOME translation for lang={lang_code}")
            home_name = BREADCRUMB_HOME[lang_code]
            home_url = BASE + "/" + lang_code + "/"
        else:
            home_name = "Home"
            home_url = BASE + "/"
        parts.append(ld({"@context": "https://schema.org", "@type": "BreadcrumbList",
                         "itemListElement": [
                             {"@type": "ListItem", "position": 1, "name": home_name, "item": home_url},
                             {"@type": "ListItem", "position": 2, "name": clean, "item": url}]}))
    parts.append('<!--/seo-->')
    return "\n".join(parts)

def load_page_dates():
    """Missing file = legitimate first run. A corrupt or malformed file must
    abort loudly: silently starting fresh would re-stamp every page's
    dateModified to today, which is the exact failure this file prevents.
    Recover with: git checkout -- build/page-dates.json"""
    try:
        with open(DATES_FILE, encoding="utf-8") as f:
            dates = json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as e:
        raise SystemExit(f"seo.py: {DATES_FILE} is corrupt ({e}) — restore it "
                         "(git checkout -- build/page-dates.json) instead of rebuilding, "
                         "or every page re-stamps to today.")
    if not isinstance(dates, dict) or not all(
            isinstance(v, dict) and isinstance(v.get("hash"), str)
            and isinstance(v.get("date"), str) for v in dates.values()):
        raise SystemExit(f"seo.py: {DATES_FILE} is malformed — restore it "
                         "(git checkout -- build/page-dates.json) instead of rebuilding, "
                         "or every page re-stamps to today.")
    return dates


def main():
    dates = load_page_dates()
    langs_dict = load_languages()

    changed, urls = 0, []
    page_mods = {}  # Track mod_date for each page for sitemap (key -> date)
    for path in sorted(glob.glob(os.path.join(PUB, "*.html"))):
        name = os.path.basename(path)
        with open(path, encoding="utf-8") as f:
            html = f.read()
        title = field(html, r'<title>(.*?)</title>')
        desc = field(html, r'<meta name="description" content="(.*?)">')
        url = BASE + "/" + ("" if name == "index.html" else name)
        urls.append((url, name))  # mods_key is just name for English
        html2 = SEO_RE.sub("", html)
        html2 = MANUAL_META_RE.sub("", html2)
        mod = page_date(name, html2, dates)
        page_mods[name] = mod
        if "</head>" in html2:
            html2 = html2.replace("</head>", seo_block(name, url, title, desc, mod, langs_dict=langs_dict) + "\n</head>", 1)
        if html2 != html:
            with open(path, "w", encoding="utf-8") as f:
                f.write(html2)
            changed += 1

    # Process language directories for launched languages
    trans_state = {}
    try:
        trans_file = os.path.join(os.path.dirname(__file__), "translation-state.json")
        with open(trans_file, encoding="utf-8") as f:
            trans_state = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        trans_state = {}

    for code, lang_config in sorted(langs_dict.items()):
        if lang_config.get("launched"):
            lang_dir = os.path.join(PUB, code)
            if os.path.isdir(lang_dir):
                for path in sorted(glob.glob(os.path.join(lang_dir, "*.html"))):
                    name = os.path.basename(path)
                    with open(path, encoding="utf-8") as f:
                        html = f.read()
                    title = field(html, r'<title>(.*?)</title>')
                    desc = field(html, r'<meta name="description" content="(.*?)">')
                    url = BASE + "/" + code + "/" + ("" if name == "index.html" else name)

                    # Use translation state date or fail if legacy/malformed entry found
                    if code in trans_state and name in trans_state[code]:
                        entry = trans_state[code][name]
                        if isinstance(entry, dict) and "date" in entry:
                            mod = entry["date"]
                        elif isinstance(entry, str):
                            # Legacy format found — fail fast
                            raise SystemExit(
                                f"seo.py: translation-state.json has legacy format for {code}/{name}\n"
                                f"Expected: {{'hash': '...', 'date': 'YYYY-MM-DD'}}\n"
                                f"Found: bare hash string\n"
                                f"Fix by running: python3 build/translate.py --lang {code} --page {name} --force"
                            )
                        else:
                            raise SystemExit(
                                f"seo.py: translation-state.json has malformed entry for {code}/{name}\n"
                                f"Expected: {{'hash': '...', 'date': 'YYYY-MM-DD'}}\n"
                                f"Fix by running: python3 build/translate.py --lang {code} --page {name} --force"
                            )
                    else:
                        mod = TODAY

                    mods_key = code + "/" + name  # Store key for later sitemap lookup
                    urls.append((url, mods_key))
                    page_mods[mods_key] = mod

                    html2 = SEO_RE.sub("", html)
                    html2 = MANUAL_META_RE.sub("", html2)
                    if "</head>" in html2:
                        html2 = html2.replace("</head>", seo_block(name, url, title, desc, mod,
                                                                   lang_code=code, in_language=code + "-US",
                                                                   langs_dict=langs_dict) + "\n</head>", 1)
                    if html2 != html:
                        with open(path, "w", encoding="utf-8") as f:
                            f.write(html2)
                        changed += 1

    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, mods_key in urls:
        # Extract basename for priority lookup (e.g., "disclaimer.html" from "es/disclaimer.html")
        name = mods_key.split("/")[-1]
        LEGAL = ("privacy.html", "terms-of-use.html", "disclaimer.html", "accessibility.html", "site-map.html")
        KEY = ("turning-65.html", "choosing-coverage.html", "members.html", "getting-help.html",
               "medicaid-starting-out.html", "dual-eligible.html")
        HUB = ("basics.html", "coverage-basics.html", "how-do-i.html", "enrollment.html",
               "costs.html", "glossary.html", "professionals.html", "caregivers.html")
        pr = ("1.0" if name == "index.html" else
              "0.9" if name in KEY else
              "0.8" if name in HUB else
              "0.3" if name in LEGAL else "0.7")
        sm.append("  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>" % (url, page_mods[mods_key], pr))
    sm.append("</urlset>")
    with open(os.path.join(PUB, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(sm) + "\n")
    with open(os.path.join(PUB, "robots.txt"), "w", encoding="utf-8") as f:
        f.write("User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % BASE)

    # Save updated dates for next run
    with open(DATES_FILE, "w", encoding="utf-8") as f:
        f.write(json.dumps(dates, indent=1, sort_keys=True))
    print("seo: head block on %d page(s); sitemap %d urls; robots.txt written" % (changed, len(urls)))

if __name__ == "__main__":
    main()
