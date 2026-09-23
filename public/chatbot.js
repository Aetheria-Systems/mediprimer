(function () {
  "use strict";

  /* Translations. Keys are the English source strings, so a missing
     translation degrades to English rather than breaking the tool.
     Filled by build/gen_tool_strings.py; enforced by
     build/check_language_coverage.py. */
  var I18N = {
    "en": {},   // English is the fallback: the t() key IS the source string
    "es": {
    "Your Medicare & Medicaid guide": "Su guía de Medicare y Medicaid",
    "General info from MediPrimer and official sources, not personalized advice — always verify with an official source.": "Información general de MediPrimer y fuentes oficiales, no es asesoría personalizada — siempre verifique con una fuente oficial.",
    "Don't include personal details like your name, SSN, or specific medical history.": "No incluya datos personales como su nombre, número de Seguro Social o historial médico específico.",
    "Ask about Medicare or Medicaid…": "Pregunte sobre Medicare o Medicaid…",
    "Ask MediBot a question": "Hágale una pregunta a MediBot",
    "Send": "Enviar",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "Lo sentimos, algo salió mal. Intente de nuevo, o mientras tanto revise las páginas del sitio."
},
    "zh-Hant": {
    "Your Medicare & Medicaid guide": "您的 Medicare 與 Medicaid 指南",
    "General info from MediPrimer and official sources, not personalized advice — always verify with an official source.": "本資訊來自 MediPrimer 與官方資料來源,僅供一般參考,並非個人化建議——請務必向官方資料來源核實。",
    "Don't include personal details like your name, SSN, or specific medical history.": "請勿提供姓名、社會安全號碼(SSN)或詳細病史等個人資料。",
    "Ask about Medicare or Medicaid…": "詢問有關 Medicare 或 Medicaid 的問題…",
    "Ask MediBot a question": "向 MediBot 提問",
    "Send": "傳送",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "抱歉,發生了一些問題。請再試一次,或先查看網站上的其他頁面。"
},
    "vi": {
    "Your Medicare & Medicaid guide": "Hướng dẫn Medicare & Medicaid của bạn",
    "General info from MediPrimer and official sources, not personalized advice — always verify with an official source.": "Thông tin chung từ MediPrimer và các nguồn chính thức, không phải lời khuyên riêng cho từng cá nhân — luôn kiểm tra lại với một nguồn chính thức.",
    "Don't include personal details like your name, SSN, or specific medical history.": "Đừng cung cấp thông tin cá nhân như tên, số SSN, hoặc tiền sử bệnh cụ thể của bạn.",
    "Ask about Medicare or Medicaid…": "Đặt câu hỏi về Medicare hoặc Medicaid…",
    "Ask MediBot a question": "Đặt câu hỏi cho MediBot",
    "Send": "Gửi",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại, hoặc xem các trang khác của trang web trong lúc chờ."
},
    "ko": {
    "Your Medicare & Medicaid guide": "메디케어 및 메디케이드 안내",
    "General info from MediPrimer and official sources, not personalized advice — always verify with an official source.": "MediPrimer와 공식 출처에서 제공하는 일반 정보이며, 개인 맞춤 조언이 아닙니다 — 항상 공식 출처로 확인하세요.",
    "Don't include personal details like your name, SSN, or specific medical history.": "이름, 사회보장번호(SSN), 구체적인 병력 같은 개인 정보는 포함하지 마세요.",
    "Ask about Medicare or Medicaid…": "Medicare 또는 Medicaid에 대해 물어보세요…",
    "Ask MediBot a question": "MediBot에게 질문하기",
    "Send": "보내기",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "죄송합니다. 문제가 발생했습니다. 다시 시도하거나, 그동안 사이트의 다른 페이지를 확인해 보세요."
},
    "tl": {
    "Your Medicare & Medicaid guide": "Ang inyong gabay sa Medicare at Medicaid",
    "General info from MediPrimer and official sources, not personalized advice — always verify with an official source.": "Pangkalahatang impormasyon mula sa MediPrimer at mga opisyal na sanggunian, hindi personalized na payo — laging tiyakin sa isang opisyal na sanggunian.",
    "Don't include personal details like your name, SSN, or specific medical history.": "Huwag isama ang personal na detalye tulad ng inyong pangalan, SSN, o partikular na kasaysayang medikal.",
    "Ask about Medicare or Medicaid…": "Magtanong tungkol sa Medicare o Medicaid…",
    "Ask MediBot a question": "Magtanong kay MediBot",
    "Send": "Ipadala",
    "Sorry, something went wrong. Try again, or check the site's own pages in the meantime.": "Paumanhin, may nagkamali. Subukan muli, o tingnan muna ang mga pahina ng site."
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
      t("Your Medicare & Medicaid guide")
    );
    header.appendChild(headerTitle);
    header.appendChild(headerSubtitle);

    var disclaimer = el(
      "p",
      "mp-chatbot-disclaimer",
      t("General info from MediPrimer and official sources, not personalized advice — always verify with an official source.")
    );
    var log = el("div", "mp-chatbot-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");
    var privacyNote = el(
      "p",
      "mp-chatbot-privacy-note",
      t("Don't include personal details like your name, SSN, or specific medical history.")
    );
    var form = el("form", "mp-chatbot-form");
    var input = el("input", "mp-chatbot-input");
    input.type = "text";
    input.placeholder = t("Ask about Medicare or Medicaid…");
    input.setAttribute("aria-label", t("Ask MediBot a question"));
    var submit = el("button", "mp-chatbot-submit", t("Send"));
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
