(function () {
  "use strict";

  /* Translations. Keys are the English source strings, so a missing
     translation degrades to English rather than breaking the tool.
     Filled by build/gen_tool_strings.py; enforced by
     build/check_language_coverage.py. */
  var I18N = {
    "en": {},   // English is the fallback: the t() key IS the source string
    "es": {
    "Ask about Medicare or Medicaid…": "Pregunte sobre Medicare o Medicaid…",
    "Ask MediBot a question": "Hágale una pregunta a MediBot",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "Lo sentimos, ocurrió un error. Inténtelo de nuevo o, mientras tanto, consulte las páginas del sitio."
},
    "zh-Hant": {
    "Ask about Medicare or Medicaid…": "詢問 Medicare 或 Medicaid 的相關問題……",
    "Ask MediBot a question": "向 MediBot 提問",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "抱歉,發生了一些問題。請再試一次,或先查看網站上的相關頁面。"
},
    "vi": {
    "Ask about Medicare or Medicaid…": "Hỏi về Medicare hoặc Medicaid…",
    "Ask MediBot a question": "Đặt câu hỏi cho MediBot",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại, hoặc xem các trang khác của trang web trong lúc chờ."
},
    "ko": {
    "Ask about Medicare or Medicaid…": "Medicare 또는 Medicaid에 대해 물어보세요…",
    "Ask MediBot a question": "MediBot에게 질문하기",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "죄송합니다. 문제가 발생했습니다. 다시 시도해 주시거나, 그 동안 사이트의 다른 페이지를 확인해 보세요."
},
    "tl": {
    "Ask about Medicare or Medicaid…": "Magtanong tungkol sa Medicare o Medicaid…",
    "Ask MediBot a question": "Magtanong sa MediBot",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "Paumanhin, may nangyaring mali. Subukan muli, o samantalang naghihintay, tingnan ang mga pahina ng site."
}
  };
  var MP_LANG = (document.documentElement.getAttribute("lang") || "en").trim() || "en";
  function t(en) {
    var tbl = I18N[MP_LANG];
    return (tbl && tbl[en]) || en;
  }

  var history = [];

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
    input.placeholder = t("Ask about Medicare or Medicaid…");
    input.setAttribute("aria-label", t("Ask MediBot a question"));
    var submit = el("button", "mp-chatbot-submit", "Send");
    submit.type = "submit";

    form.appendChild(input);
    form.appendChild(submit);
    panel.appendChild(header);
    panel.appendChild(disclaimer);
    panel.appendChild(log);
    panel.appendChild(privacyNote);
    panel.appendChild(form);
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
          t("Sorry, something went wrong. Try again, or check the site's own pages in the meantime.");
      })
      .then(onDone, onDone); // runs after either branch above, success or failure
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();
