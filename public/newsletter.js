(function () {
  "use strict";
  var MSG = {
    en: { ok: "You're signed up. Welcome!", err: "That didn't work — check the address and try again." },
    es: { ok: "\u00a1Listo! Ya est\u00e1 suscrito.", err: "No funcion\u00f3 \u2014 revise la direcci\u00f3n e int\u00e9ntelo de nuevo." },
    "zh-Hant": { ok: "\u8a02\u95b1\u6210\u529f\uff0c\u6b61\u8fce\uff01", err: "\u672a\u80fd\u8a02\u95b1 \u2014 \u8acb\u6aa2\u67e5\u96fb\u5b50\u90f5\u4ef6\u5730\u5740\u5f8c\u91cd\u8a66\u3002" }
  };
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form.classList || !form.classList.contains("newsletter-form")) return;
    e.preventDefault();
    var lang = form.getAttribute("data-lang") || "en";
    var t = MSG[lang] || MSG.en;
    var input = form.querySelector("input[type=email]");
    var btn = form.querySelector("button");
    if (!input || !input.value.trim() || btn.disabled) return;
    btn.disabled = true;
    fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: input.value.trim(), lang: lang })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var p = document.createElement("p");
        p.textContent = d && d.ok ? t.ok : t.err;
        p.style.fontWeight = "600";
        if (d && d.ok) { form.parentNode.replaceChild(p, form); }
        else { form.parentNode.insertBefore(p, form.nextSibling); btn.disabled = false; }
      })
      .catch(function () { btn.disabled = false; });
  });
})();
