/* MediPrimer glossary tooltips — define once, show everywhere.
   Wraps the FIRST occurrence of each key term on a page in a tooltip that
   shows a short plain definition (and links to the full glossary). This lets
   pages stop re-defining terms inline. Progressive enhancement: with JS off,
   the prose still reads fine.
   Single source of truth for the short definitions is the TERMS map below. */
(function () {
  "use strict";

  // Short, plain, tooltip-sized definitions. Longer entries live in /glossary.html.
  // Order longest-first so multi-word terms match before their sub-words.
  var TERMS = [
    ["out-of-pocket maximum", "The most you'll pay for covered care in a year. After that, the plan pays 100%."],
    ["prior authorization", "Approval you must get from a plan before it will cover a service."],
    ["creditable coverage", "Coverage good enough to let you delay Medicare without a penalty."],
    ["Initial Enrollment Period", "Your 7-month window to sign up for Medicare around your 65th birthday."],
    ["Special Enrollment Period", "A chance to sign up outside the normal window after a life event."],
    ["guaranteed issue", "A time when an insurer must sell you a plan without checking your health."],
    ["medical underwriting", "When an insurer reviews your health history and can deny you or charge more."],
    ["skilled nursing facility", "A place for short-term medical care after a hospital stay."],
    ["coordination of benefits", "The rules for which plan pays first when you have more than one."],
    ["explanation of benefits", "A summary from your plan of what it paid — not a bill."],
    ["coinsurance", "Your share of a bill, as a percentage (for example, 20%)."],
    ["deductible", "The amount you pay yourself before coverage starts paying."],
    ["premium", "The monthly cost to have the coverage."],
    ["copayment", "A flat amount you pay for a service, like $20 for a visit."],
    ["copay", "A flat amount you pay for a service, like $20 for a visit."],
    ["formulary", "The list of drugs a plan covers."],
    ["IRMAA", "An extra charge on Part B and Part D premiums for higher incomes."],
    ["Medigap", "Private insurance that helps pay Original Medicare's out-of-pocket costs."],
    ["Medicare Advantage", "A private plan alternative to Original Medicare (Part C)."],
    ["Original Medicare", "The government-run Medicare (Parts A and B)."],
    ["dual eligible", "Someone who qualifies for both Medicare and Medicaid."],
    ["formonly", ""] // sentinel; ignored
  ];

  function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  var main = document.querySelector("main");
  if (!main) return;

  var seen = {};                 // term -> already wrapped once on this page
  var SKIP = { A:1, H1:1, H2:1, H3:1, H4:1, BUTTON:1, DT:1, SUMMARY:1, SCRIPT:1, STYLE:1, CODE:1 };

  function eligible(node) {
    for (var p = node.parentNode; p && p !== main; p = p.parentNode) {
      if (p.nodeType === 1) {
        if (SKIP[p.tagName]) return false;
        if (p.classList && p.classList.contains("gloss")) return false;
      }
    }
    return true;
  }

  // Collect text nodes first (avoid mutating while walking).
  var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null);
  var textNodes = [];
  var n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue.trim() && eligible(n)) textNodes.push(n);
  }

  TERMS.forEach(function (pair) {
    var term = pair[0], def = pair[1];
    if (!def || seen[term.toLowerCase()]) return;
    var re = new RegExp("\\b" + esc(term) + "\\b", "i");
    for (var i = 0; i < textNodes.length; i++) {
      var tn = textNodes[i];
      if (!tn.parentNode) continue;
      var m = re.exec(tn.nodeValue);
      if (!m) continue;
      // Split the text node and wrap the match.
      var before = tn.nodeValue.slice(0, m.index);
      var match = tn.nodeValue.slice(m.index, m.index + m[0].length);
      var after = tn.nodeValue.slice(m.index + m[0].length);
      var span = document.createElement("span");
      span.className = "gloss";
      span.setAttribute("tabindex", "0");
      span.setAttribute("role", "button");
      span.setAttribute("aria-label", match + ": " + def);
      span.setAttribute("data-def", def);
      span.textContent = match;
      var frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(span);
      var tail = after ? document.createTextNode(after) : null;
      if (tail) frag.appendChild(tail);
      tn.parentNode.replaceChild(frag, tn);
      if (tail) textNodes[i] = tail;        // keep scanning the remainder
      seen[term.toLowerCase()] = true;
      break;
    }
  });

  // One shared tooltip bubble.
  var tip = document.createElement("div");
  tip.className = "gloss-tip";
  tip.hidden = true;
  document.body.appendChild(tip);

  function show(el) {
    tip.textContent = el.getAttribute("data-def");
    tip.hidden = false;
    var r = el.getBoundingClientRect();
    var top = window.scrollY + r.bottom + 6;
    var left = window.scrollX + r.left;
    tip.style.top = top + "px";
    tip.style.left = Math.min(left, window.scrollX + document.documentElement.clientWidth - tip.offsetWidth - 12) + "px";
  }
  function hide() { tip.hidden = true; }

  main.addEventListener("mouseover", function (e) {
    if (e.target.classList && e.target.classList.contains("gloss")) show(e.target);
  });
  main.addEventListener("mouseout", function (e) {
    if (e.target.classList && e.target.classList.contains("gloss")) hide();
  });
  main.addEventListener("focusin", function (e) {
    if (e.target.classList && e.target.classList.contains("gloss")) show(e.target);
  });
  main.addEventListener("focusout", hide);
  main.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("gloss")) {
      if (tip.hidden || tip.textContent !== e.target.getAttribute("data-def")) show(e.target);
      else hide();
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
})();
