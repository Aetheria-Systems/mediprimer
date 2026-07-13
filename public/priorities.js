/* MediPrimer "What matters most to you?" — a priorities sorter for the
   Original Medicare vs. Medicare Advantage decision. It clarifies what the
   PERSON values and shows how each value maps to the tradeoffs. It is NOT a
   recommender: it never tells you which to buy, and both paths are legitimate. */
(function () {
  "use strict";
  var root = document.getElementById("priorities");
  if (!root) return;

  // Each dimension: two things people trade off. "om" leans Original Medicare
  // (+ Medigap); "ma" leans Medicare Advantage. Neither is "right".
  var DIMS = [
    { a: "Seeing any doctor or hospital that takes Medicare, and keeping my own doctors",
      b: "A lower monthly premium",
      why: "Original Medicare has no network; Medicare Advantage uses local networks in exchange for lower premiums." },
    { a: "Predictable, steady costs I can budget for",
      b: "Paying less month to month, with copays as I go",
      why: "Original Medicare + a Medigap supplement makes costs very predictable (for a premium); Advantage is lower up front but varies with use, up to a yearly cap." },
    { a: "Freedom to travel or live part of the year in another state",
      b: "Extra benefits like dental, vision, or hearing",
      why: "Original Medicare works nationwide; Advantage is local but often bundles extras Original Medicare doesn't cover." },
    { a: "Rarely needing a plan's approval before I get care",
      b: "Having everything — including drug coverage — in one plan",
      why: "Advantage often requires prior authorization and bundles Part D; Original Medicare rarely requires approval but you add drug and supplement coverage separately." },
    { a: "Being able to change my coverage later, even if my health declines",
      b: "The lowest cost now, while I'm healthy",
      why: "This is the one-way door: start on Advantage and a later switch to Original Medicare + Medigap can require medical underwriting. Weigh future flexibility against saving now." }
  ];

  function render() {
    var rows = DIMS.map(function (d, i) {
      return '<div class="nav-q"><span class="nav-label">' + (i + 1) + '. Which matters more to you?</span>' +
        '<div class="nav-options">' +
          '<label><input type="radio" name="p' + i + '" value="om"><span>' + d.a + '</span></label>' +
          '<label><input type="radio" name="p' + i + '" value="ma"><span>' + d.b + '</span></label>' +
          '<label><input type="radio" name="p' + i + '" value="0"><span>No strong preference</span></label>' +
        '</div></div>';
    }).join("");
    root.innerHTML =
      '<h2>What matters most to you?</h2>' +
      '<p>The right path depends on what you value. Pick what matters more in each pair. This does not recommend a plan — it shows how your priorities line up with the tradeoffs.</p>' +
      rows +
      '<div class="nav-actions"><button type="button" class="nav-btn" id="p-go">See how my priorities line up</button></div>' +
      '<div id="p-result"></div>';
    document.getElementById("p-go").addEventListener("click", tally);
  }

  function tally() {
    var om = 0, ma = 0, answered = 0, details = [];
    DIMS.forEach(function (d, i) {
      var sel = root.querySelector('input[name="p' + i + '"]:checked');
      if (!sel) return;
      answered++;
      if (sel.value === "om") { om++; details.push("<li><strong>" + d.a + "</strong> — " + d.why + "</li>"); }
      else if (sel.value === "ma") { ma++; details.push("<li><strong>" + d.b + "</strong> — " + d.why + "</li>"); }
    });
    var lean;
    if (answered === 0) lean = "Answer a few above to see how your priorities line up.";
    else if (om > ma) lean = "Your priorities lean toward <strong>Original Medicare</strong> (often paired with a Medigap supplement and a Part D drug plan).";
    else if (ma > om) lean = "Your priorities lean toward <strong>Medicare Advantage</strong>.";
    else lean = "Your priorities are <strong>mixed</strong> — both paths have real appeal for you, which is common. That's okay: spend time with <a href=\"/questions-to-ask.html\">the right questions to ask</a>, compare plans side by side at <a href=\"https://www.medicare.gov/\" rel=\"noopener\">Medicare's Plan Finder</a>, and talk through the tradeoffs with a free <a href=\"/ship-directory.html\">SHIP counselor</a> or talk about your financial situation with <a href=\"/getting-help.html\">getting-help resources</a>.";

    var html = '<div class="nav-result">' +
      '<div class="verdict">' + lean + '</div>';
    if (details.length) html += "<div class=\"track\"><span class=\"tag\">Why</span><h3>What's driving that</h3><ul>" + details.join("") + "</ul></div>";
    html += '<div class="note">This is not a recommendation, and it can\'t see your doctors, drugs, or budget. Use it to focus your thinking, then confirm with <a href="https://www.medicare.gov/" rel="noopener">Medicare\'s Plan Finder</a> and a free <a href="/ship-directory.html">SHIP counselor</a>. Also weigh the <a href="/edge-cases.html">Medigap one-way door</a> before you decide. See the <a href="/questions-to-ask.html">questions to ask</a> any plan.</div>' +
      '<div class="nav-actions"><button type="button" class="nav-btn secondary" id="p-reset">Start over</button></div></div>';

    var res = document.getElementById("p-result");
    res.innerHTML = html;
    document.getElementById("p-go").className = "nav-btn nav-hidden";
    document.getElementById("p-reset").addEventListener("click", render);
    res.querySelector(".nav-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  render();
})();
