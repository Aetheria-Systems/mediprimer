/* MediPrimer — "Help Paying" questionnaire.
   Asks about Medicare/Medicaid status, household size, income range, and prescriptions.
   Then shows which programs you likely qualify for, sorted by impact.
   Progressive enhancement: fallback static list below works without JS. */
(function () {
  "use strict";

  var root = document.getElementById("help-paying-questionnaire");
  if (!root) return;

  var state = {
    coverage: null,      // "medicare", "medicaid", "both", "neither"
    household: null,     // "one", "two"
    income: null,        // "under-1000", "1000-1200", "1200-1400", "1400-1600", "1600-2000", "over-2000"
    drugs: null          // "yes", "no"
  };

  // 2026 income thresholds (48 states + DC). Many states higher; note in output.
  var PROGRAMS = {
    qmb: {
      name: "Qualified Medicare Beneficiary (QMB)",
      limit_single: 1350,
      limit_couple: 1824,
      impact: 5,
      what: "Pays all your Part A and B premiums and cost-sharing (copayments, coinsurance). Providers cannot bill you extra.",
      apply: "Your <a href=\"/state-medicaid.html\">state Medicaid agency</a>"
    },
    slmb: {
      name: "Specified Low-Income Medicare Beneficiary (SLMB)",
      limit_single: 1616,
      limit_couple: 2184,
      impact: 4,
      what: "Pays your Part B premium. You pay other Medicare costs.",
      apply: "Your <a href=\"/state-medicaid.html\">state Medicaid agency</a>"
    },
    qi: {
      name: "Qualifying Individual (QI)",
      limit_single: 1816,
      limit_couple: 2455,
      impact: 3,
      what: "Pays part or all of your Part B premium.",
      apply: "Your <a href=\"/state-medicaid.html\">state Medicaid agency</a>"
    },
    extra_help: {
      name: "Extra Help (Low-Income Subsidy / LIS)",
      limit_single: 1995,
      limit_couple: 2705,
      impact: 4,
      what: "Pays Part D premiums, deductibles, and copayments for prescription drugs.",
      apply: "<a href=\"https://www.ssa.gov/extrahelp/\" rel=\"noopener\">ssa.gov/extrahelp</a> or 1-800-772-1213"
    },
    medicaid: {
      name: "Medicaid",
      limit_single: null,
      limit_couple: null,
      impact: 5,
      what: "Full health coverage: doctor visits, hospital, drugs, long-term care. Income limits vary by state.",
      apply: "Your <a href=\"/state-medicaid.html\">state Medicaid agency</a>"
    },
    pace: {
      name: "PACE (Programs of All-Inclusive Care for the Elderly)",
      limit_single: null,
      limit_couple: null,
      impact: 3,
      what: "For people 55 or older who need a nursing-home level of care but want to stay at home. Includes medical care, social services, and daily help. Only offered in some areas, and your state must certify the level of need. You can join with Medicare, Medicaid, or both.",
      apply: "<a href=\"https://www.medicare.gov/\" rel=\"noopener\">medicare.gov</a>"
    },
    marketplace: {
      name: "Marketplace Premium Tax Credits &amp; Subsidies",
      limit_single: null,
      limit_couple: null,
      impact: 4,
      what: "If you buy insurance on HealthCare.gov, tax credits lower your monthly payment. Cost-sharing reductions lower your copays and deductibles.",
      apply: "<a href=\"https://www.healthcare.gov/\" rel=\"noopener\">healthcare.gov</a>"
    },
    ship: {
      name: "SHIP (State Health Insurance Assistance Program)",
      limit_single: null,
      limit_couple: null,
      impact: 2,
      what: "Free, unbiased counseling about Medicare, Medicaid, and health coverage. They explain your options.",
      apply: "<a href=\"https://www.shiphelp.org/\" rel=\"noopener\">shiphelp.org</a>"
    }
  };

  function renderForm() {
    root.innerHTML =
      '<h2>What help might you qualify for?</h2>' +
      '<p>Answer four quick questions. We\'ll show you programs that could help you save on healthcare costs.</p>' +
      '<div class="help-q"><span class="help-label">1. Do you have Medicare, Medicaid, both, or neither?</span>' +
        '<div class="help-options">' +
          '<label><input type="radio" name="coverage" value="medicare"><span>Medicare only</span></label>' +
          '<label><input type="radio" name="coverage" value="medicaid"><span>Medicaid only</span></label>' +
          '<label><input type="radio" name="coverage" value="both"><span>Both Medicare and Medicaid</span></label>' +
          '<label><input type="radio" name="coverage" value="neither"><span>Neither or unsure</span></label>' +
        '</div></div>' +
      '<div class="help-q"><span class="help-label">2. Do you live alone, or with a spouse or partner?</span>' +
        '<div class="help-options">' +
          '<label><input type="radio" name="household" value="one"><span>Just me</span></label>' +
          '<label><input type="radio" name="household" value="two"><span>Me and my spouse or partner</span></label>' +
        '</div>' +
        '<p class="help-note-small">Other household sizes have different limits — your state agency or SHIP can check the exact numbers for you.</p></div>' +
      '<div class="help-q"><span class="help-label">3. Approximately how much does your household earn per month (gross income, before taxes)?</span>' +
        '<div class="help-options">' +
          '<label><input type="radio" name="income" value="under-1000"><span>Under about $1,000</span></label>' +
          '<label><input type="radio" name="income" value="1000-1200"><span>About $1,000 to $1,200</span></label>' +
          '<label><input type="radio" name="income" value="1200-1400"><span>About $1,200 to $1,400</span></label>' +
          '<label><input type="radio" name="income" value="1400-1600"><span>About $1,400 to $1,600</span></label>' +
          '<label><input type="radio" name="income" value="1600-2000"><span>About $1,600 to $2,000</span></label>' +
          '<label><input type="radio" name="income" value="over-2000"><span>Over $2,000</span></label>' +
        '</div></div>' +
      '<div class="help-q"><span class="help-label">4. Do you take prescription drugs regularly?</span>' +
        '<div class="help-options">' +
          '<label><input type="radio" name="drugs" value="yes"><span>Yes</span></label>' +
          '<label><input type="radio" name="drugs" value="no"><span>No</span></label>' +
        '</div></div>' +
      '<div class="help-actions">' +
        '<button type="button" class="help-btn" id="help-go">Show programs I might qualify for</button>' +
      '</div>' +
      '<p id="help-warn" class="glossary-empty help-hidden">Please answer all questions above.</p>';

    root.addEventListener("change", onChange);
    document.getElementById("help-go").addEventListener("click", onGo);
  }

  function onChange(e) {
    if (e.target.name === "coverage") state.coverage = e.target.value;
    else if (e.target.name === "household") state.household = e.target.value;
    else if (e.target.name === "income") state.income = e.target.value;
    else if (e.target.name === "drugs") state.drugs = e.target.value;
  }

  // Upper bound of the selected band. A program is only flagged as a match when
  // the WHOLE band fits under its limit — never overstate eligibility.
  function getIncomeMax(income_range) {
    var ranges = {
      "under-1000": 1000,
      "1000-1200": 1200,
      "1200-1400": 1400,
      "1400-1600": 1600,
      "1600-2000": 2000,
      "over-2000": Infinity
    };
    return ranges[income_range] || 0;
  }

  function checkQualifies(prog, incomeMax, household) {
    var limit = household === "one" ? prog.limit_single : prog.limit_couple;
    if (!limit) return null; // No hard limit (state-dependent or automatic)
    return incomeMax <= limit;
  }

  function onGo() {
    var warn = document.getElementById("help-warn");
    if (!state.coverage || !state.household || !state.income || !state.drugs) {
      warn.className = "glossary-empty";
      return;
    }
    warn.className = "glossary-empty help-hidden";

    var incomeMax = getIncomeMax(state.income);
    var household = state.household;
    var qualified = [];

    // MSPs for people with (or eligible for) Medicare. Income is only one part of
    // the test — resources and state rules matter too — so a match means "worth
    // applying", not a promise.
    if (state.coverage === "medicare" || state.coverage === "both") {
      ["qmb", "slmb", "qi"].forEach(function (key) {
        if (checkQualifies(PROGRAMS[key], incomeMax, household) !== false) {
          qualified.push({prog: key, likely: checkQualifies(PROGRAMS[key], incomeMax, household)});
        }
      });
    }

    // Extra Help: anyone with BOTH Medicare and Medicaid gets it automatically,
    // at any income. Otherwise it's income-based for Medicare holders.
    if (state.coverage === "both") {
      qualified.push({prog: "extra_help", likely: true, automatic: true});
    } else if (state.coverage === "medicare" && state.drugs === "yes") {
      if (checkQualifies(PROGRAMS.extra_help, incomeMax, household) !== false) {
        qualified.push({prog: "extra_help", likely: checkQualifies(PROGRAMS.extra_help, incomeMax, household)});
      }
    }

    // Medicaid — only for people who don't already have it.
    if (state.coverage !== "medicaid" && state.coverage !== "both" && incomeMax <= 2000) {
      qualified.push({prog: "medicaid", likely: null});
    }

    // PACE has non-income gates (55+, nursing-home-level care need, service area),
    // so it is always informational — never a "match".
    qualified.push({prog: "pace", likely: null});

    // Marketplace subsidies only make sense with no Medicare or Medicaid.
    if (state.coverage === "neither") {
      qualified.push({prog: "marketplace", likely: null});
    }

    // SHIP always available
    qualified.push({prog: "ship", likely: null});

    // Sort by impact (higher = show first) then by program name
    qualified.sort(function (a, b) {
      var progA = PROGRAMS[a.prog];
      var progB = PROGRAMS[b.prog];
      if (progB.impact !== progA.impact) return progB.impact - progA.impact;
      return progA.name.localeCompare(progB.name);
    });

    var html = '<div class="help-result">';
    html += '<div class="result-header"><h3>You might qualify for these programs</h3>';
    html += '<p>Below are programs based on your answers. Many people are surprised by what they qualify for. <strong>It costs nothing to apply.</strong></p></div>';

    // Sort qualified programs so "likely" appears first
    var likely = qualified.filter(function (q) { return q.likely === true; });
    var maybe = qualified.filter(function (q) { return q.likely === null || q.likely === false; });

    likely.forEach(function (q) {
      html += programHTML(PROGRAMS[q.prog], true, q.automatic);
    });
    maybe.forEach(function (q) {
      html += programHTML(PROGRAMS[q.prog], false, false);
    });

    html += '<div class="help-note">';
    html += '<strong>These are approximate 2026 figures and change every year.</strong> Income is only part of the test: most of these programs also have resource (savings) limits, and many states set higher limits or drop the resource test entirely. Only your state agency can decide. Apply even if you are close to the limit — it costs nothing, and you might qualify.';
    html += '</div>';

    html += '<div class="help-actions"><button type="button" class="help-btn secondary" id="help-reset">Answer again</button></div>';
    html += '</div>';

    root.insertAdjacentHTML("beforeend", html);
    document.getElementById("help-go").className = "help-btn help-hidden";
    document.getElementById("help-reset").addEventListener("click", function () {
      state = { coverage: null, household: null, income: null, drugs: null };
      renderForm();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    root.querySelector(".help-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function programHTML(prog, likely, automatic) {
    var limitNum = state.household === "one" ? prog.limit_single : prog.limit_couple;
    var who = state.household === "one" ? "for one person" : "for a couple";
    var badge = automatic ? '<span class="help-badge">Automatic with Medicare + Medicaid</span>'
      : likely ? '<span class="help-badge">Worth applying — your answers fit</span>' : '';
    var limitLine = automatic
      ? '<p class="help-limit">If you have both Medicare and full Medicaid, you get this automatically — no income test.</p>'
      : limitNum
        ? '<p class="help-limit">Approximate 2026 income limit: $' + limitNum.toLocaleString("en-US") + '/month ' + who + '. Resource limits also apply; many states go higher.</p>'
        : '<p class="help-limit">Limits and rules vary by state.</p>';
    return '<div class="help-program">' +
      '<div class="help-prog-header">' + badge + '<h4>' + prog.name + '</h4></div>' +
      '<p class="help-what"><strong>What it does:</strong> ' + prog.what + '</p>' +
      limitLine +
      '<p class="help-apply"><strong>How to apply:</strong> ' + prog.apply + '</p>' +
      '</div>';
  }

  renderForm();
})();
