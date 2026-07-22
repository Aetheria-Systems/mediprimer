(function () {
  "use strict";

  var QUIET_FLAG = "mp_bot";
  var params = new URLSearchParams(window.location.search);
  if (params.get(QUIET_FLAG) !== "1") {
    return; // Task 9 flips this off once launch is confirmed good
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
      "General info, not personalized advice — verify at medicare.gov."
    );
    var log = el("div", "mp-chatbot-log");
    var privacyNote = el(
      "p",
      "mp-chatbot-privacy-note",
      "Don't include personal details like your name, SSN, or specific medical history."
    );
    var form = el("form", "mp-chatbot-form");
    var input = el("input", "mp-chatbot-input");
    input.type = "text";
    input.placeholder = "Ask about Medicare or Medicaid…";
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
      var question = input.value.trim();
      if (!question) return;
      input.value = "";
      appendMessage(log, "you", question);
      askBot(question, log);
    });
  }

  function appendMessage(log, role, text) {
    var msg = el("p", "mp-chatbot-msg mp-chatbot-msg-" + role, text);
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  function askBot(question, log) {
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
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();
