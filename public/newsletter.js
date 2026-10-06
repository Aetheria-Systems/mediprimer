(function () {
  "use strict";
  var MSG = {
    en: { ok: "One more step: we just emailed you a link. Open it to confirm, and check your spam folder if you don't see it.", err: "That didn't work — check the address and try again." },
    es: { ok: "Falta un paso: le acabamos de enviar un enlace por correo. \u00c1bralo para confirmar; si no lo ve, revise la carpeta de correo no deseado.", err: "No funcion\u00f3 \u2014 revise la direcci\u00f3n e int\u00e9ntelo de nuevo." },
    "zh-Hant": { ok: "\u9084\u5dee\u4e00\u6b65\uff1a\u6211\u5011\u525b\u5bc4\u4e86\u4e00\u500b\u9023\u7d50\u5230\u60a8\u7684\u4fe1\u7bb1\uff0c\u8acb\u958b\u555f\u9023\u7d50\u4ee5\u5b8c\u6210\u78ba\u8a8d\u3002\u5982\u679c\u6c92\u6709\u770b\u5230\uff0c\u8acb\u67e5\u770b\u5783\u573e\u90f5\u4ef6\u5323\u3002", err: "\u672a\u80fd\u8a02\u95b1 \u2014 \u8acb\u6aa2\u67e5\u96fb\u5b50\u90f5\u4ef6\u5730\u5740\u5f8c\u91cd\u8a66\u3002" },
    "vi": { ok: "C\u00f2n m\u1ed9t b\u01b0\u1edbc n\u1eefa: ch\u00fang t\u00f4i v\u1eeba g\u1eedi cho b\u1ea1n m\u1ed9t li\u00ean k\u1ebft qua email. H\u00e3y m\u1edf li\u00ean k\u1ebft \u0111\u1ec3 x\u00e1c nh\u1eadn, v\u00e0 ki\u1ec3m tra th\u01b0 m\u1ee5c th\u01b0 r\u00e1c n\u1ebfu b\u1ea1n kh\u00f4ng th\u1ea5y.", err: "Không thành công — vui lòng kiểm tra địa chỉ email và thử lại." },
    "ko": { ok: "\ud55c \ub2e8\uacc4\uac00 \ub0a8\uc558\uc2b5\ub2c8\ub2e4. \ubc29\uae08 \uc774\uba54\uc77c\ub85c \ub9c1\ud06c\ub97c \ubcf4\ub0b4 \ub4dc\ub838\uc2b5\ub2c8\ub2e4. \ub9c1\ud06c\ub97c \uc5f4\uc5b4 \ud655\uc778\ud574 \uc8fc\uc2dc\uace0, \ubcf4\uc774\uc9c0 \uc54a\uc73c\uba74 \uc2a4\ud338\ud568\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694.", err: "신청되지 않았습니다 — 이메일 주소를 확인한 뒤 다시 시도해 주세요." },
    "tl": { ok: "Isa pang hakbang: kaka-email lang namin sa iyo ng link. Buksan ito para kumpirmahin, at tingnan ang spam folder kung hindi mo ito makita.", err: "Hindi ito gumana — suriin ang address at subukan ulit." }
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
