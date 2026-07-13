/* MediPrimer glossary — client-side filter + letter navigation.
   Progressive enhancement: the full glossary is readable with JS disabled;
   this only adds search and jump links. */
(function () {
  "use strict";

  var list = document.getElementById("glossary-list");
  var search = document.getElementById("glossary-search");
  var letterNav = document.getElementById("letter-nav");
  if (!list) return;

  // Build an index of term entries: each <dt> paired with its following <dd>.
  var entries = [];
  var groups = {}; // letter -> group-label element
  var children = list.children;
  for (var i = 0; i < children.length; i++) {
    var el = children[i];
    if (el.classList.contains("group-label")) {
      groups[el.textContent.trim().toUpperCase()] = el;
    } else if (el.tagName === "DT") {
      var dd = el.nextElementSibling;
      while (dd && dd.tagName !== "DD") dd = dd.nextElementSibling;
      entries.push({
        dt: el,
        dd: dd,
        text: (el.textContent + " " + (dd ? dd.textContent : "")).toLowerCase()
      });
    }
  }

  // Populate the A–Z jump bar from the group labels that exist.
  if (letterNav) {
    var letters = Object.keys(groups).sort();
    letterNav.innerHTML = "";
    letters.forEach(function (L) {
      var a = document.createElement("a");
      a.href = "#" + groups[L].id;
      a.textContent = L;
      letterNav.appendChild(a);
    });
  }

  // Empty-state message element.
  var empty = document.createElement("p");
  empty.className = "glossary-empty";
  empty.textContent = "No terms match your search.";
  empty.hidden = true;
  list.parentNode.insertBefore(empty, list.nextSibling);

  function apply(qRaw) {
    var q = qRaw.trim().toLowerCase();
    var anyVisible = false;
    var visibleByLetter = {};

    entries.forEach(function (e) {
      var show = q === "" || e.text.indexOf(q) !== -1;
      e.dt.hidden = !show;
      if (e.dd) e.dd.hidden = !show;
      if (show) {
        anyVisible = true;
        var L = (e.dt.textContent.trim()[0] || "").toUpperCase();
        visibleByLetter[L] = true;
      }
    });

    // Hide letter headings that have no visible terms.
    Object.keys(groups).forEach(function (L) {
      groups[L].hidden = q !== "" && !visibleByLetter[L];
    });

    empty.hidden = anyVisible;
  }

  search &&
    search.addEventListener("input", function () {
      apply(search.value);
    });

  // If the page loads with a query in the URL (?q=term), pre-filter.
  var params = new URLSearchParams(window.location.search);
  var initial = params.get("q");
  if (initial && search) {
    search.value = initial;
    apply(initial);
  }
})();
