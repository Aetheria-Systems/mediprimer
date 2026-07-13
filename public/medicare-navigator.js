/* MediPrimer — "Turning 65" navigator.
   Asks marital status + each person's current/expected coverage, then composes
   directive, educational guidance. It explains the ENROLLMENT rules for the
   person's situation; it never recommends a specific insurance plan or product.
   Progressive enhancement: the full written walkthrough below works without JS. */
(function () {
  "use strict";

  // Coverage options offered for "you" and "your spouse/partner".
  var COVERAGE = [
    { id: "working_large", label: "Still working — employer has 20+ employees" },
    { id: "working_small", label: "Still working — employer has fewer than 20 employees" },
    { id: "spouse_plan",   label: "Covered by a spouse/partner's employer plan (they're still working)" },
    { id: "retiree",       label: "Retiree coverage from a former employer" },
    { id: "cobra",         label: "COBRA" },
    { id: "va",            label: "VA health care" },
    { id: "tricare",       label: "TRICARE For Life (military retiree)" },
    { id: "marketplace",   label: "A Marketplace / ACA plan" },
    { id: "medicaid",      label: "Medicaid" },
    { id: "none",          label: "Nothing / uninsured" },
    { id: "unsure",        label: "I'm not sure" }
  ];

  // Guidance block per coverage type. partB is the pivotal, directive line.
  var G = {
    working_large: {
      verdict: "You can probably delay Part B safely — but confirm two things first.",
      partB: "Because you have active coverage from an employer with 20+ employees, you can usually delay Part B without a penalty and add it later through a Special Enrollment Period when the job or that coverage ends. Confirm two facts in writing: the employer truly has 20+ employees, and the plan is “creditable.”",
      partA: "Enroll in premium-free Part A during your window — unless you contribute to an HSA, in which case Part A stops new HSA contributions.",
      partD: "Employer drug coverage is usually creditable, so you can likely delay Part D too. Get that confirmed by the plan.",
      links: [["/working-past-65.html","Working Past 65"],["/medicare-part-b.html","About Part B"],["/enrollment.html","Enrollment windows"]]
    },
    working_small: {
      verdict: "Enroll in BOTH Part A and Part B during your 7-month window — don't delay.",
      partB: "With a small employer (fewer than 20 employees), Medicare is usually PRIMARY and the employer plan pays second. If you skip Part B, you can be left with large gaps and a lifelong penalty. Sign up for Part B on time.",
      partA: "Enroll in premium-free Part A as well.",
      partD: "Confirm whether the employer drug coverage is creditable; if not, take Part D on time.",
      links: [["/working-past-65.html","Working Past 65"],["/medicare-part-b.html","About Part B"],["/enrollment.html","Enrollment windows"]]
    },
    spouse_plan: {
      verdict: "You can likely delay Part B based on your spouse's active employment — verify it.",
      partB: "Coverage through a spouse/partner who is actively working at an employer with 20+ employees generally lets you delay Part B without penalty, with a Special Enrollment Period when their employment or that coverage ends. Confirm the employer size and creditable status.",
      partA: "Take premium-free Part A now (watch the HSA rule if either of you contributes to one).",
      partD: "Their employer drug coverage is usually creditable — confirm before delaying Part D.",
      links: [["/working-past-65.html","Working Past 65"],["/retiring-losing-coverage.html","When that coverage ends"]]
    },
    retiree: {
      verdict: "Enroll in Part A and Part B on time — retiree coverage expects it.",
      partB: "Retiree coverage from a former employer does NOT let you delay Part B without penalty. These plans almost always assume you take Medicare at 65 and pay second. Enroll in Part B during your window.",
      partA: "Enroll in premium-free Part A too.",
      partD: "Some retiree plans include creditable drug coverage that stands in for Part D — confirm with the plan before skipping Part D.",
      links: [["/retiring-losing-coverage.html","Retiring or Losing Coverage"],["/medicare-part-b.html","About Part B"]]
    },
    cobra: {
      verdict: "Enroll in Medicare on time — COBRA is a trap for delaying Part B.",
      partB: "COBRA does NOT count as active coverage for delaying Part B. If you rely on COBRA and skip Part B, you'll likely get a lifelong penalty and a coverage gap. Enroll in Part A and Part B during your Initial Enrollment Period even if you still have COBRA.",
      partA: "Enroll in premium-free Part A.",
      partD: "COBRA drug coverage may not be creditable — check, and take Part D on time if it isn't.",
      links: [["/retiring-losing-coverage.html","Retiring or Losing Coverage"],["/medicare-part-b.html","About Part B"]]
    },
    va: {
      verdict: "Take Part A; make a deliberate Part B decision; you can likely skip Part D.",
      partB: "VA health care is a separate system and does NOT let you delay Part B without penalty. Many veterans still enroll in Part B at 65 to keep access to civilian care; some skip it on purpose. Decide deliberately during your window — don't let it lapse by accident.",
      partA: "Take premium-free Part A — it adds civilian hospital coverage on top of the VA.",
      partD: "VA drug coverage IS creditable, so you can usually skip Part D without penalty while using the VA pharmacy.",
      links: [["/veterans-medicare.html","Veterans & Medicare (read this)"],["/medicare-part-b.html","About Part B"]]
    },
    tricare: {
      verdict: "You MUST enroll in Part B to keep TRICARE For Life.",
      partB: "TRICARE For Life requires Medicare Part B once you're eligible. If you don't enroll, you can lose TRICARE. Enroll in Part A and Part B during your window.",
      partA: "Enroll in premium-free Part A.",
      partD: "TRICARE's drug coverage is creditable — you generally don't need Part D.",
      links: [["/veterans-medicare.html","Veterans & Medicare"],["/medicare-part-b.html","About Part B"]]
    },
    marketplace: {
      verdict: "Move to Medicare at 65 and end the Marketplace plan (no gap).",
      partB: "Once you're eligible for Medicare, Marketplace premium subsidies generally stop, and keeping a subsidized Marketplace plan can mean paying subsidies back. Enroll in Part A and Part B during your Initial Enrollment Period and end the Marketplace plan, timing it so there's no gap.",
      partA: "Enroll in premium-free Part A.",
      partD: "Set up Part D (or get drug coverage through a Medicare Advantage plan).",
      links: [["/marketplace.html","About the Marketplace"],["/enrollment.html","Enrollment windows"]]
    },
    medicaid: {
      verdict: "Enroll in Medicare — you'll likely be “dual eligible,” and Medicaid may help pay.",
      partB: "Enroll in Part A and Part B during your window. With Medicaid you may become dual eligible: Medicare becomes primary, and Medicaid may help pay your premiums and cost-sharing.",
      partA: "Enroll in premium-free Part A.",
      partD: "You likely qualify automatically for Extra Help with drug costs — see Getting Help Paying.",
      links: [["/dual-eligible.html","Both Medicare & Medicaid"],["/getting-help.html","Getting Help Paying"]]
    },
    none: {
      verdict: "Enroll in Part A, Part B, and drug coverage during your 7-month window.",
      partB: "With no other coverage, there's nothing to delay for. Enroll in Part A and Part B during your Initial Enrollment Period to avoid penalties and gaps.",
      partA: "Enroll in premium-free Part A.",
      partD: "Set up drug coverage (Part D) on time, and use your one-time Medigap window if you choose Original Medicare.",
      links: [["/enrollment.html","Enrollment windows"],["/medigap.html","Medigap window"],["/getting-help.html","Help paying"]]
    },
    unsure: {
      verdict: "First, find out if your coverage is “creditable” and “active employer.”",
      partB: "Two facts decide everything: is your coverage from a currently-active employer (and how big is it), and is it “creditable”? Call your HR/benefits office or plan, and a free SHIP counselor, before your window closes.",
      partA: "Take premium-free Part A now while you sort out the rest (watch the HSA rule).",
      partD: "Ask the same source whether your drug coverage is creditable.",
      links: [["/ship-directory.html","Find free SHIP help"],["/enrollment.html","Enrollment windows"]]
    }
  };

  var NEXT_STEPS = [
    "Put your 7-month Initial Enrollment Period on the calendar (it starts 3 months before your birthday month) and set an early reminder.",
    "Create your accounts at ssa.gov (Social Security handles sign-up) and medicare.gov.",
    "Confirm in writing whether your current coverage is “creditable” and whether it's active-employer — this one fact drives your timing.",
    "Gather your info: work history, current coverage details, your doctors, your medications and pharmacy, and your spouse's coverage and age.",
    "Call a free SHIP counselor (or 1-800-MEDICARE, 1-800-633-4227) to review your specifics before you enroll.",
    "Enroll during your window — or make a deliberate, confirmed decision to delay. Don't let the window pass by accident."
  ];

  var root = document.getElementById("medicare-navigator");
  if (!root) return;

  var state = { deciding: null, married: null, you: null, spouseAge: null, spouse: null };

  function optionsHTML(name) {
    return COVERAGE.map(function (c) {
      return '<label><input type="radio" name="' + name + '" value="' + c.id + '"><span>' + c.label + '</span></label>';
    }).join("");
  }

  function esc(s){ return s; }

  function renderForm() {
    root.innerHTML =
      '<h2>Answer a few questions for a plan built around you</h2>' +
      '<p>This gives you directive, plain-language next steps for your situation. It explains the Medicare rules for you — it does not sell or recommend any specific plan.</p>' +
      '<div class="nav-q"><span class="nav-label">1. Are you deciding for yourself, or helping someone else?</span>' +
        '<div class="nav-options">' +
          '<label><input type="radio" name="deciding" value="self"><span>Deciding for myself</span></label>' +
          '<label><input type="radio" name="deciding" value="other"><span>Helping someone else</span></label>' +
        '</div></div>' +
      '<div id="helper-note" class="nav-hidden note tip" style="margin: 1rem 0; font-size: 0.95rem;">' +
        '<strong>You\'re a helper.</strong> Answer the remaining questions <em>on behalf of the person</em> you\'re helping. See <a href="/caregivers.html">Caregivers and Authorized Representatives</a> for what authority you need.' +
      '</div>' +
      '<div class="nav-q"><span class="nav-label">2. Are you single or married/partnered?</span>' +
        '<div class="nav-options">' +
          '<label><input type="radio" name="married" value="no"><span>Single</span></label>' +
          '<label><input type="radio" name="married" value="yes"><span>Married or partnered</span></label>' +
        '</div></div>' +
      '<div class="nav-q"><span class="nav-label">3. What health coverage do you have or expect around age 65?</span>' +
        '<div class="nav-options">' + optionsHTML("you") + '</div></div>' +
      '<div id="spouse-block" class="nav-hidden">' +
        '<div class="nav-q"><span class="nav-label">4. Is your spouse/partner 65 or older, or under 65?</span>' +
          '<div class="nav-options">' +
            '<label><input type="radio" name="spouseAge" value="65plus"><span>65 or older (deciding about Medicare now)</span></label>' +
            '<label><input type="radio" name="spouseAge" value="under65"><span>Under 65 (not yet Medicare-eligible)</span></label>' +
          '</div></div>' +
        '<div class="nav-q nav-hidden" id="spouse-cov-q"><span class="nav-label">5. What health coverage does your spouse/partner have or expect?</span>' +
          '<div class="nav-options">' + optionsHTML("spouse") + '</div></div>' +
      '</div>' +
      '<div class="nav-actions">' +
        '<button type="button" class="nav-btn" id="nav-go">Show my next steps</button>' +
      '</div>' +
      '<p id="nav-warn" class="glossary-empty nav-hidden">Please answer the questions above to see your plan.</p>';

    root.addEventListener("change", onChange);
    document.getElementById("nav-go").addEventListener("click", onGo);
  }

  function onChange(e) {
    if (e.target.name === "deciding") {
      state.deciding = e.target.value;
      document.getElementById("helper-note").className = e.target.value === "other" ? "note tip" : "nav-hidden";
    } else if (e.target.name === "married") {
      state.married = e.target.value === "yes";
      document.getElementById("spouse-block").className = state.married ? "" : "nav-hidden";
    } else if (e.target.name === "you") state.you = e.target.value;
    else if (e.target.name === "spouse") state.spouse = e.target.value;
    else if (e.target.name === "spouseAge") {
      state.spouseAge = e.target.value;
      // The spouse's coverage type only matters if they're deciding about Medicare now.
      document.getElementById("spouse-cov-q").className =
        e.target.value === "65plus" ? "nav-q" : "nav-q nav-hidden";
    }
  }

  function trackHTML(title, tag, cov) {
    var g = G[cov];
    var links = g.links.map(function (l) { return '<a href="' + l[0] + '">' + l[1] + '</a>'; }).join("");
    return '<div class="track"><span class="tag">' + tag + '</span><h3>' + title + '</h3>' +
      '<p class="verdict-line"><strong>' + g.verdict + '</strong></p>' +
      '<p><strong>Part A:</strong> ' + g.partA + '</p>' +
      '<p><strong>Part B:</strong> ' + g.partB + '</p>' +
      '<p><strong>Prescriptions (Part D):</strong> ' + g.partD + '</p>' +
      '<p class="reflinks">' + links + '</p></div>';
  }

  function onGo() {
    var warn = document.getElementById("nav-warn");
    if (!state.deciding || state.married === null || !state.you ||
        (state.married && !state.spouseAge) ||
        (state.married && state.spouseAge === "65plus" && !state.spouse)) {
      warn.className = "glossary-empty"; return;
    }
    warn.className = "glossary-empty nav-hidden";

    var html = '<div class="nav-result">';
    html += '<div class="verdict">Here’s your directive plan. Everything below assumes you act during your 7-month Initial Enrollment Period.</div>';
    html += trackHTML("Your path", "You", state.you);

    if (state.married) {
      if (state.spouseAge === "under65") {
        html += '<div class="track"><span class="tag">Your spouse/partner</span><h3>Not yet — but on the radar</h3>' +
          '<p>Your spouse/partner is under 65, so they keep their current coverage for now. Medicare is individual: they run through these same steps when they approach 65 or lose that coverage. If <em>your</em> Medicare choice affects a plan you share, factor that in now.</p>' +
          '<p class="reflinks"><a href="/enrollment.html">Enrollment windows</a><a href="/retiring-losing-coverage.html">If coverage ends</a></p></div>';
      } else {
        html += trackHTML("Your spouse/partner's path", "Spouse/partner", state.spouse);
        html += '<div class="track"><span class="tag">Remember</span><h3>Two separate decisions</h3>' +
          '<p>Medicare is individual — there is no family Medicare. Each of you enrolls (or delays) based on your own coverage above, on your own timeline.</p></div>';
      }
    }

    html += '<div class="track"><span class="tag">Before you choose a path</span><h3>Original Medicare vs. Medicare Advantage — the hard-to-reverse part</h3>' +
      '<p>Separate from the timing above, you’ll choose between Original Medicare (optionally with a Medigap supplement) and Medicare Advantage. Both cover the same benefits, but Advantage uses networks and prior authorization. The key catch: the Medigap “one-way door” means switching from Advantage back to Original + Medigap later can require medical underwriting and be denied. Weigh this before you pick — it’s the decision that’s hardest to reverse.</p>' +
      '<p class="reflinks"><a href="/choosing-coverage.html">How to choose</a><a href="/edge-cases.html">Edge cases &amp; the one-way door</a></p></div>';

    html += '<div class="track"><span class="tag">Do these next</span><h3>Your next steps</h3><ol class="steps">' +
      NEXT_STEPS.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol></div>";

    html += '<div class="track"><span class="tag">Limited income?</span><h3>Getting help paying</h3>' +
      '<p>If money is tight, Medicaid, Medicare Savings Programs, and Extra Help can pay your premiums and reduce drug costs. Having both Medicare and Medicaid (called "dual eligible") unlocks extra benefits. <strong>Many people qualify and don\'t realize it.</strong></p>' +
      '<p class="reflinks"><a href="/getting-help.html">See programs you might qualify for</a><a href="/dual-eligible.html">How being dual eligible works</a></p></div>';

    html += '<div class="track"><span class="tag">Anything special apply?</span><h3>Edge cases to watch</h3>' +
      '<p>Do any of these apply to you? They can change your timing or choices:</p>' +
      '<ul style="margin: 0.6rem 0; padding-left: 1.4rem;">' +
      '<li><strong>HSA contributor:</strong> Enrolling in Part A freezes new HSA contributions. <a href="/edge-cases.html">See what that means.</a></li>' +
      '<li><strong>Higher income:</strong> Income over certain limits triggers IRMAA (extra premiums). <a href="/costs.html">Understanding costs and premiums.</a></li>' +
      '<li><strong>Living part-time abroad:</strong> Original Medicare may limit coverage. <a href="/edge-cases.html">Traveling and living abroad.</a></li>' +
      '</ul></div>';

    html += '<div class="note">Verify before you act: this is general educational information, not advice about your specific case. Confirm creditable-coverage and timing with your plan, Social Security, and a free <a href="/ship-directory.html">SHIP counselor</a> before you decide.</div>';
    html += '<div class="nav-actions"><button type="button" class="nav-btn secondary" id="nav-reset">Start over</button></div>';
    html += '</div>';

    root.insertAdjacentHTML("beforeend", html);
    document.getElementById("nav-go").className = "nav-btn nav-hidden";
    document.getElementById("nav-reset").addEventListener("click", function () {
      state = { deciding: null, married: null, you: null, spouseAge: null, spouse: null };
      renderForm();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    root.querySelector(".nav-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderForm();
})();
