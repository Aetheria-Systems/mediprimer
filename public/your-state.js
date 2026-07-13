/* MediPrimer "Your State" tool — one picker, all three state directories.
   Data source: /data/states.json (generated from the Medicaid, SHIP, and
   insurance-department tables, so there's a single set of contacts to maintain). */
(function () {
  "use strict";
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
        '<p class="reflinks"><a href="/state-medicaid.html">All Medicaid agencies</a> · <a href="/ship-directory.html">All SHIPs</a> · <a href="/insurance-departments.html">All insurance departments</a></p>';
    });
  }).catch(function () {
    out.innerHTML = '<p class="glossary-empty">Couldn’t load the state list. Use the full directories: ' +
      '<a href="/state-medicaid.html">Medicaid</a>, <a href="/ship-directory.html">SHIP</a>, ' +
      '<a href="/insurance-departments.html">Insurance Departments</a>.</p>';
  });
})();
