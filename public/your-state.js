/* MediPrimer "Your State" tool — one picker, all three state directories.
   Data source: /data/states.json (generated from the Medicaid, SHIP, and
   insurance-department tables, so there's a single set of contacts to maintain). */
(function () {
  "use strict";

  /* Translations. Keys are the English source strings, so a missing
     translation degrades to English rather than breaking the tool.
     Filled by build/gen_tool_strings.py; enforced by
     build/check_language_coverage.py. */
  var I18N = {
    "en": {},   // English is the fallback: the t() key IS the source string
    "es": {
    "option": "opción",
    "All Medicaid agencies": "Todas las agencias de Medicaid",
    "All SHIPs": "Todos los SHIP",
    "All insurance departments": "Todos los departamentos de seguros",
    "Medicaid": "Medicaid",
    "SHIP": "SHIP",
    "Insurance Departments": "Departamentos de Seguros"
},
    "zh-Hant": {
    "option": "選項",
    "All Medicaid agencies": "所有 Medicaid 機構",
    "All SHIPs": "所有 SHIP",
    "All insurance departments": "所有保險部門",
    "Medicaid": "Medicaid",
    "SHIP": "SHIP",
    "Insurance Departments": "保險部門"
},
    "vi": {
    "option": "tùy chọn",
    "All Medicaid agencies": "Tất cả cơ quan Medicaid",
    "All SHIPs": "Tất cả SHIP",
    "All insurance departments": "Tất cả sở bảo hiểm",
    "Medicaid": "Medicaid",
    "SHIP": "SHIP",
    "Insurance Departments": "Sở Bảo Hiểm"
},
    "ko": {
    "option": "옵션",
    "All Medicaid agencies": "모든 메디케이드 기관",
    "All SHIPs": "모든 SHIP",
    "All insurance departments": "모든 보험국",
    "Medicaid": "메디케이드",
    "SHIP": "SHIP",
    "Insurance Departments": "보험국"
},
    "tl": {
    "option": "pagpipilian",
    "All Medicaid agencies": "Lahat ng ahensya ng Medicaid",
    "All SHIPs": "Lahat ng SHIP",
    "All insurance departments": "Lahat ng departamento ng insurance",
    "Medicaid": "Medicaid",
    "SHIP": "SHIP",
    "Insurance Departments": "Mga Departamento ng Insurance"
}
  };
  var MP_LANG = (document.documentElement.getAttribute("lang") || "en").trim() || "en";
  function t(en) {
    var tbl = I18N[MP_LANG];
    return (tbl && tbl[en]) || en;
  }
  var sel = document.getElementById("state-picker");
  var out = document.getElementById("state-result");
  if (!sel || !out) return;

  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function card(tag, o, blurb) {
    if (!o) return "";
    var link = o.url ? '<p class="contact"><a href="' + esc(o.url) + '" rel="noopener">' + esc(o.url.replace(/^https?:\/\//, "").replace(/\/$/, "")) + "</a></p>" : "";
    var phone = o.phone ? '<p class="contact">' + esc(o.phone) + "</p>" : "";
    return '<div class="resource"><span class="tag">' + tag + "</span>" +
           "<h3>" + esc(o.name) + "</h3>" + link + phone +
           "<p>" + blurb + "</p></div>";
  }

  fetch("/data/states.json").then(function (r) { return r.json(); }).then(function (data) {
    var names = Object.keys(data).sort();
    names.forEach(function (n) {
      var opt = document.createElement("option");
      opt.value = n; opt.textContent = n;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () {
      var s = data[sel.value];
      if (!s) { out.innerHTML = ""; return; }
      out.innerHTML =
        '<h3 class="group-label">' + esc(sel.value) + "</h3>" +
        card("Medicaid", s.medicaid, "Apply for Medicaid/CHIP, check eligibility, and complete renewals.") +
        card("Medicare help (SHIP)", s.ship, "Free, unbiased one-on-one Medicare counseling. SHIP does not sell insurance.") +
        card("Insurance department", s.insurance, "Regulates Medigap and handles complaints about insurers and agents.") +
        '<p class="reflinks"><a href="/state-medicaid.html">' + t('All Medicaid agencies') + '</a> · <a href="/ship-directory.html">' + t('All SHIPs') + '</a> · <a href="/insurance-departments.html">' + t('All insurance departments') + '</a></p>';
    });
  }).catch(function () {
    out.innerHTML = '<p class="glossary-empty">Couldn’t load the state list. Use the full directories: ' +
      '<a href="/state-medicaid.html">' + t('Medicaid') + '</a>, <a href="/ship-directory.html">' + t('SHIP') + '</a>, ' +
      '<a href="/insurance-departments.html">' + t('Insurance Departments') + '</a>.</p>';
  });
})();
