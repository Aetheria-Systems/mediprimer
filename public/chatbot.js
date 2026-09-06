(function () {
  "use strict";

  var history = [];

  var NEWS_STRINGS = {
    en: { prompt: "\uD83D\uDCEC Weekly plain-language updates", placeholder: "Your email", btn: "Sign up", ok: "You're signed up. Welcome!", err: "That didn't work \u2014 check the address and try again." },
    es: { prompt: "\uD83D\uDCEC Novedades semanales en lenguaje sencillo", placeholder: "Su correo electr\u00F3nico", btn: "Suscribirse", ok: "\u00A1Listo! Ya est\u00E1 suscrito.", err: "No funcion\u00F3 \u2014 revise la direcci\u00F3n e intente de nuevo." },
    "zh-Hant": { prompt: "\uD83D\uDCEC \u6BCF\u9031\u66F4\u65B0\u96FB\u5B50\u5831", placeholder: "\u60A8\u7684\u96FB\u5B50\u90F5\u4EF6", btn: "\u8A02\u95B1", ok: "\u8A02\u95B1\u6210\u529F\uFF0C\u6B61\u8FCE\uFF01", err: "\u672A\u80FD\u8A02\u95B1 \u2014 \u8ACB\u6AA2\u67E5\u90F5\u4EF6\u5730\u5740\u5F8C\u91CD\u8A66\u3002" }
  };

  function pageLang() {
    var path = window.location.pathname;
    if (path.indexOf("/es/") === 0) return "es";
    if (path.indexOf("/zh-Hant/") === 0) return "zh-Hant";
    return "en";
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  function buildWidget() {
    var root = el("div", "mp-chatbot");
    var toggle = el("button", "mp-chatbot-toggle");
    toggle.innerHTML = '<span class="mp-chatbot-toggle-icon" aria-hidden="true">💬</span> MediBot';
    toggle.setAttribute("aria-expanded", "false");
    var panel = el("div", "mp-chatbot-panel");
    panel.style.display = "none";

    var header = el("div", "mp-chatbot-header");
    var headerTitle = el("span", "mp-chatbot-header-title");
    headerTitle.innerHTML = '<span aria-hidden="true">💬</span> MediBot';
    var headerSubtitle = el(
      "span",
      "mp-chatbot-header-subtitle",
      "Your Medicare & Medicaid guide"
    );
    header.appendChild(headerTitle);
    header.appendChild(headerSubtitle);

    var disclaimer = el(
      "p",
      "mp-chatbot-disclaimer",
      "General info from MediPrimer and official sources, not personalized advice — always verify with an official source."
    );
    var log = el("div", "mp-chatbot-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");
    var privacyNote = el(
      "p",
      "mp-chatbot-privacy-note",
      "Don't include personal details like your name, SSN, or specific medical history."
    );
    var form = el("form", "mp-chatbot-form");
    var input = el("input", "mp-chatbot-input");
    input.type = "text";
    input.placeholder = "Ask about Medicare or Medicaid…";
    input.setAttribute("aria-label", "Ask MediBot a question");
    var submit = el("button", "mp-chatbot-submit", "Send");
    submit.type = "submit";

    form.appendChild(input);
    form.appendChild(submit);
    panel.appendChild(header);
    panel.appendChild(disclaimer);
    panel.appendChild(log);
    panel.appendChild(privacyNote);
    panel.appendChild(form);

    var lang = pageLang();
    var t = NEWS_STRINGS[lang] || NEWS_STRINGS.en;
    var newsWrap = el("div", "mp-chatbot-news");
    var newsLabel = el("span", "mp-chatbot-news-label", t.prompt);
    var newsForm = el("form", "mp-chatbot-news-form");
    var newsInput = el("input", "mp-chatbot-news-input");
    newsInput.type = "email";
    newsInput.required = true;
    newsInput.placeholder = t.placeholder;
    newsInput.setAttribute("aria-label", t.placeholder);
    var newsBtn = el("button", "mp-chatbot-news-btn", t.btn);
    newsBtn.type = "submit";
    newsForm.appendChild(newsInput);
    newsForm.appendChild(newsBtn);
    newsWrap.appendChild(newsLabel);
    newsWrap.appendChild(newsForm);
    panel.appendChild(newsWrap);
    newsForm.addEventListener("submit", function (evt) {
      evt.preventDefault();
      if (newsBtn.disabled) return;
      newsBtn.disabled = true;
      fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsInput.value.trim(), lang: lang })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok) {
            newsWrap.textContent = t.ok;
          } else {
            newsLabel.textContent = t.err;
            newsBtn.disabled = false;
          }
        })
        .catch(function () {
          newsLabel.textContent = t.err;
          newsBtn.disabled = false;
        });
    });
    root.appendChild(panel);
    root.appendChild(toggle);
    document.body.appendChild(root);

    toggle.addEventListener("click", function () {
      var isOpen = panel.style.display !== "none";
      panel.style.display = isOpen ? "none" : "flex";
      toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });

    form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      if (submit.disabled) return; // request already in flight
      var question = input.value.trim();
      if (!question) return;
      input.value = "";
      appendMessage(log, "you", question);
      submit.disabled = true;
      askBot(question, log, function () {
        submit.disabled = false;
      });
    });
  }

  function appendMessage(log, role, text) {
    var msg = el("p", "mp-chatbot-msg mp-chatbot-msg-" + role, text);
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  function askBot(question, log, onDone) {
    var pending = el("p", "mp-chatbot-msg mp-chatbot-msg-bot", "…");
    log.appendChild(pending);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, history: history }),
    })
      .then(function (resp) {
        if (!resp.ok) throw new Error("chat request failed: " + resp.status);
        return resp.json();
      })
      .then(function (data) {
        pending.textContent = data.answer;
        if (data.sources && data.sources.length) {
          var srcLine = el("p", "mp-chatbot-sources");
          data.sources.forEach(function (url, i) {
            try {
              var parsedUrl = new URL(url);
              if (parsedUrl.protocol !== "https:") {
                return; // Skip non-https URLs; don't render a link
              }
            } catch (e) {
              return; // Skip malformed URLs
            }
            if (i > 0 && srcLine.childNodes.length > 0) {
              srcLine.appendChild(document.createTextNode(" · "));
            }
            var a = el("a", null, url.replace("https://", ""));
            a.href = url;
            a.rel = "noopener";
            srcLine.appendChild(a);
          });
          if (srcLine.childNodes.length > 0) {
            pending.parentNode.insertBefore(srcLine, pending.nextSibling);
          }
        }
        history.push({ role: "user", content: question });
        history.push({ role: "assistant", content: data.answer });
      })
      .catch(function () {
        pending.textContent =
          "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.";
      })
      .then(onDone, onDone); // runs after either branch above, success or failure
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();
