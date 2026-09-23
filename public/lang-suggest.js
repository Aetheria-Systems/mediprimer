/* MediPrimer language suggestion banner.
   Offers to switch to user's browser language if a translation is available. */
(function () {
  "use strict";

  /* Translations. Keys are the English source strings, so a missing
     translation degrades to English rather than breaking the tool.
     Filled by build/gen_tool_strings.py; enforced by
     build/check_language_coverage.py. */
  var I18N = {
    "es": {
    "-": "-",
    "/": "/",
    "div": "div",
    "button": "botón",
    "Dismiss": "Cerrar",
    "a": "a"
},
    "zh-Hant": {
    "-": "-",
    "/": "/",
    "div": "div",
    "button": "按鈕",
    "Dismiss": "關閉",
    "a": "a"
},
    "vi": {
    "-": "-",
    "/": "/",
    "div": "div",
    "button": "nút",
    "Dismiss": "Đóng",
    "a": "a"
},
    "ko": {
    "-": "-",
    "/": "/",
    "div": "div",
    "button": "button",
    "Dismiss": "닫기",
    "a": "a"
},
    "tl": {
    "-": "-",
    "/": "/",
    "div": "div",
    "button": "button",
    "Dismiss": "Isara",
    "a": "a"
}
  };
  var MP_LANG = (document.documentElement.getAttribute("lang") || "en").trim() || "en";
  function t(en) {
    var tbl = I18N[MP_LANG];
    return (tbl && tbl[en]) || en;
  }

  // MP_LANGS is injected as a global object {code: "banner text", ...} by the header renderer.
  if (typeof window.MP_LANGS === "undefined" || typeof window.MP_LANGS !== "object" || Array.isArray(window.MP_LANGS)) {
    return;
  }

  var langs = window.MP_LANGS;
  var currentLang = (document.documentElement.lang || "en");
  var navLang = navigator.language || "";
  var dismissKey = "mp-lang-dismissed";

  // Extract language code prefix from navigator.language (e.g., "es" from "es-ES" or "es").
  var navLangCode = navLang.split("-")[0].toLowerCase();

  // Check: navigator.language prefix is available AND different from current.
  if (!(navLangCode in langs) || navLangCode === currentLang) {
    return;
  }

  // Check: not already dismissed (feature detection: private browsing or storage quota may fail).
  var isDismissed = false;
  try {
    isDismissed = Boolean(localStorage.getItem(dismissKey));
  } catch (e) {
    // SecurityError (private browsing) or other storage errors: proceed to show banner.
  }
  if (isDismissed) {
    return;
  }

  // Build the counterpart URL: same page, different language prefix.
  var currentPath = location.pathname;
  var counterpartUrl;

  if (currentLang === "en") {
    // Current is English; link to /navLangCode/page
    if (currentPath === "/" || currentPath === "") {
      counterpartUrl = "/" + navLangCode + "/";
    } else {
      counterpartUrl = "/" + navLangCode + currentPath;
    }
  } else if (navLangCode === "en") {
    // Current is a translated page; English lives at the root, with no
    // language prefix, so strip the current language segment rather than
    // replacing it (that would produce a nonexistent /en/... URL).
    var enParts = currentPath.split("/");
    if (enParts.length > 1 && enParts[0] === "" && enParts[1] === currentLang) {
      enParts.splice(1, 1);
      counterpartUrl = enParts.join("/") || "/";
    } else {
      counterpartUrl = "/";
    }
  } else {
    // Current is not English; replace the language prefix.
    // Path format: /es/page.html → /zh/page.html, /es/ → /zh/
    var parts = currentPath.split("/");
    if (parts.length > 1 && parts[0] === "" && parts[1] !== "") {
      // Replace language code at index 1.
      parts[1] = navLangCode;
      counterpartUrl = parts.join("/");
    } else {
      // Fallback: assume /navLangCode/page
      counterpartUrl = "/" + navLangCode + currentPath;
    }
  }

  // Render the banner.
  var banner = document.createElement("div");
  banner.className = "lang-banner";
  banner.setAttribute("role", "banner");

  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lang-banner-close";
  closeBtn.setAttribute("aria-label", t("Dismiss"));
  closeBtn.textContent = "\xd7"; // × character

  // Use localized banner text from MP_LANGS object
  var bannerText = langs[navLangCode];

  var msg = document.createElement("div");
  msg.className = "lang-banner-msg";
  msg.appendChild(document.createTextNode(bannerText + " "));

  var linkText = document.createElement("a");
  linkText.href = counterpartUrl;
  linkText.lang = navLangCode;

  // Get native language name from switcher if available.
  var langName = navLangCode;
  var switcher = document.querySelector(".lang-switch");
  if (switcher) {
    var links = switcher.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      if (links[i].lang === navLangCode) {
        langName = links[i].textContent;
        break;
      }
    }
  }
  linkText.textContent = langName;

  msg.appendChild(linkText);

  banner.appendChild(msg);
  banner.appendChild(closeBtn);

  // Insert at top of body.
  if (document.body) {
    document.body.insertBefore(banner, document.body.firstChild);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.body) {
        document.body.insertBefore(banner, document.body.firstChild);
      }
    });
  }

  // Close button: dismiss and set localStorage key (feature detection: storage may be unavailable).
  closeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    try {
      localStorage.setItem(dismissKey, "1");
    } catch (e) {
      // SecurityError (private browsing) or QuotaExceededError: silently skip persistence.
    }
    banner.remove();
    if (typeof gtag === "function") {
      gtag("event", "language_switch", {
        "action": "dismiss_banner",
        "language": navLangCode
      });
    }
  });

  // Banner link: fire gtag event on click.
  linkText.addEventListener("click", function (e) {
    if (typeof gtag === "function") {
      gtag("event", "language_switch", {
        "action": "banner_link",
        "language": navLangCode
      });
    }
  });

  // Language switcher links: fire gtag event on click (event delegation).
  var switcherLinks = document.querySelectorAll(".lang-switch a");
  for (var j = 0; j < switcherLinks.length; j++) {
    (function (link) {
      link.addEventListener("click", function (e) {
        var targetLang = link.getAttribute("lang") || "en";
        if (typeof gtag === "function") {
          gtag("event", "language_switch", {
            "action": "switcher_click",
            "language": targetLang
          });
        }
      });
    })(switcherLinks[j]);
  }
})();
