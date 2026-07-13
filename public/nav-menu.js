/* MediPrimer top-nav behavior.
   Desktop dropdowns open on hover/focus via CSS. This adds: the mobile
   hamburger toggle, click-to-open dropdowns on touch, keyboard/Escape support,
   and closing when you click away or focus leaves. */
(function () {
  "use strict";
  var header = document.querySelector(".site-header");
  if (!header) return;
  var nav = header.querySelector("nav.main");
  var toggle = header.querySelector(".nav-toggle");

  // Mobile hamburger: show/hide the whole nav.
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var items = Array.prototype.slice.call(header.querySelectorAll(".navitem.has-menu"));

  function closeAll(except) {
    items.forEach(function (it) {
      if (it !== except) {
        it.classList.remove("open");
        var c = it.querySelector(".menu-caret");
        if (c) c.setAttribute("aria-expanded", "false");
      }
    });
  }

  items.forEach(function (it) {
    var caret = it.querySelector(".menu-caret");
    if (!caret) return;
    caret.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = !it.classList.contains("open");
      closeAll(it);
      it.classList.toggle("open", open);
      caret.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // Click outside closes any open dropdown.
  document.addEventListener("click", function (e) {
    if (!header.contains(e.target)) closeAll(null);
  });
  // Escape closes dropdowns (and the mobile menu).
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAll(null);
      if (nav && nav.classList.contains("open")) {
        nav.classList.remove("open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    }
  });
})();
