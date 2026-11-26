/* Chat: same-origin SSE conversation. No gateway URL, key or third-party script here. */
(function () {
  "use strict";

  var I18n = window.ShrineI18n;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STORAGE_KEY = "nafisah-conversation-id";
  var PATHS = {
    send: "M3 5h18v14H3zM3 6l9 7 9-7",
    stop: "M6 6h12v12H6z",
    retry: "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5",
    heart: "M12 6.2C10.9 3.1 9.1 2.1 7.1 2.1 4.4 2.1 2.4 4.3 2.4 7.2c0 2.7 1.6 4.7 3.4 6.5L12 20l6.2-6.3c1.8-1.8 3.4-3.8 3.4-6.5 0-2.9-2-5.1-4.7-5.1-2 0-3.8 1-4.9 4.1z"
  };
  var FALLBACK = {
    "chat.stopped": "Stopped here.",
    "chat.retry": "Try again",
    "chat.jumpLatest": "Back to the latest",
    "chat.error.network": "The candle flickered. Your words are still here — please try again.",
    "chat.error.rate": "A quiet pause. Please try again in a moment.",
    "chat.error.invalid": "Please check your message and try again.",
    "chat.error.server": "The page could not answer just now. Your words are still here.",
    "chat.edge.history": "Earlier turns have been folded away.",
    "chat.edge.truncated": "The reply was cut short at the page edge."
  };

  function dict(lang) {
    return I18n && I18n.dict ? I18n.dict[lang] || I18n.dict.en || {} : {};
  }
  function lang() {
    return I18n && I18n.current ? I18n.current() : "en";
  }
  function t(key) {
    var value = dict(lang())[key];
    if (typeof value !== "string") value = dict("en")[key];
    return typeof value === "string" ? value : (FALLBACK[key] || "");
  }
  function localize(node, key) {
    if (typeof dict("en")[key] === "string") node.setAttribute("data-i18n", key);
    node.textContent = t(key);
    return node;
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (typeof text === "string") node.textContent = text;
    return node;
  }
  function leaf(tag, cls, key) {
    return localize(el(tag, cls), key);
  }
  function icon(name) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", name === "heart" ? "0 0 24 22" : "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "butt");
    svg.setAttribute("stroke-linejoin", "miter");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "1em");
    svg.setAttribute("height", "1em");
    svg.setAttribute("class", "js-icon");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", PATHS[name]);
    svg.appendChild(path);
    return svg;
  }
  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  function conversationId() {
    var id = null;
    try { id = window.localStorage.getItem(STORAGE_KEY); } catch (error) {}
    var valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
    if (!valid) {
      id = uuid();
      try { window.localStorage.setItem(STORAGE_KEY, id); } catch (error) {}
    }
    return id;
  }
  function classify(code, status) {
    if (code === 42901 || status === 429) return "rate";
    if (code === 40001 || code === 40002 || code === 40003 || status === 400) return "invalid";
    return "server";
  }

  var log, input, form, sendBtn, stopBtn, status, jump;
  var originalLive = "polite";
  var history = [];
  var lastText = "";
  var stick = true;
  var historyNoted = false;
  var busy = false;
  var controller = null;
  var aborted = false;
  var doneFlag = false;
  var failed = false;
  var errorKind = "server";
  var fullText = "";
  var finished = true;

  function autoScroll() {
    if (!stick) {
      if (jump) jump.hidden = false;
      return;
    }
    log.scrollTop = log.scrollHeight;
  }
  function note(key) {
    var node = el("p", "chat-system");
    node.appendChild(leaf("span", "", key));
    log.appendChild(node);
    autoScroll();
    return node;
  }
  function bubble(role, text) {
    var wrap = el("div", "chat-msg chat-msg--" + (role === "user" ? "user" : "him"));
    if (role !== "user") wrap.appendChild(icon("heart"));
    var para = el("p", "chat-bubble", text);
    para.setAttribute("aria-live", "off");
    wrap.appendChild(para);
    log.appendChild(wrap);
    autoScroll();
    return para;
  }
  function showRetry(kind) {
    var node = note("chat.error." + kind);
    var retry = el("button", "btn btn-ghost");
    retry.type = "button";
    retry.appendChild(icon("retry"));
    retry.appendChild(leaf("span", "", "chat.retry"));
    node.appendChild(retry);
    retry.addEventListener("click", function () {
      node.remove();
      send(lastText);
    });
    try { retry.focus({ preventScroll: true }); } catch (error) { retry.focus(); }
  }
  function commit() {
    var kept = fullText.length > 500 ? fullText.slice(0, 500) : fullText;
    if (kept.length !== fullText.length) note("chat.edge.truncated");
    history.push({ role: "user", content: lastText }, { role: "assistant", content: kept });
    while (history.length > 20) {
      history.splice(0, 2);
      if (!historyNoted) {
        note("chat.edge.history");
        historyNoted = true;
      }
    }
  }
  function endRound() {
    if (finished) return;
    finished = true;
    busy = false;
    controller = null;
    sendBtn.disabled = false;
    stopBtn.hidden = true;
    form.removeAttribute("aria-busy");
    log.setAttribute("aria-live", originalLive);
    if (aborted) {
      status.textContent = t("chat.stopped");
      try { input.focus({ preventScroll: true }); } catch (error) { input.focus(); }
      return;
    }
    if (doneFlag && !failed) {
      commit();
      status.textContent = fullText;
      try { input.focus({ preventScroll: true }); } catch (error) { input.focus(); }
      return;
    }
    var kind = failed ? errorKind : "network";
    showRetry(kind);
    status.textContent = t("chat.error." + kind);
  }
  function handleEvent(payload) {
    var event;
    try { event = JSON.parse(payload); } catch (error) { return; }
    if (!event || typeof event !== "object") return;
    if (event.type === "ping") return;
    if (event.type === "ai_response") {
      fullText += typeof event.content === "string" ? event.content : "";
      output.textContent = fullText;
      autoScroll();
      return;
    }
    if (event.type === "error_message") {
      failed = true;
      errorKind = classify(event.code);
    }
  }
  function readStream(response) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var line;
    function consume(raw) {
      line = raw.replace(/\r$/, "");
      if (line.indexOf("data:") !== 0) return;
      var payload = line.slice(5).trim();
      if (payload === "[DONE]") {
        doneFlag = true;
        return;
      }
      if (payload) handleEvent(payload);
    }
    function pump() {
      return reader.read().then(function (result) {
        if (result.done) {
          if (buffer) consume(buffer);
          endRound();
          return;
        }
        buffer += decoder.decode(result.value, { stream: true });
        var index;
        while ((index = buffer.indexOf("\n")) >= 0) {
          consume(buffer.slice(0, index));
          buffer = buffer.slice(index + 1);
        }
        return pump();
      });
    }
    return pump().catch(function () {
      if (!aborted) {
        failed = true;
        errorKind = "network";
      }
      endRound();
    });
  }
  var output = null;
  function send(text) {
    if (busy || !text) return;
    lastText = text;
    busy = true;
    finished = false;
    aborted = false;
    doneFlag = false;
    failed = false;
    fullText = "";
    errorKind = "server";
    var intro = log.querySelector(".chat-intro");
    if (intro) intro.hidden = true;
    bubble("user", text);
    output = bubble("him", "");
    log.setAttribute("aria-live", "off");
    sendBtn.disabled = true;
    stopBtn.hidden = false;
    form.setAttribute("aria-busy", "true");
    input.value = "";
    controller = new AbortController();
    var messages = history.slice(-18).concat([{ role: "user", content: text }]);
    fetch("/chat", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "makers-conversation-id": conversationId()
      },
      body: JSON.stringify({ messages: messages, locale: lang() }),
      signal: controller.signal
    }).then(function (response) {
      if (!response.ok || !response.body) {
        return response.json().catch(function () { return {}; }).then(function (json) {
          failed = true;
          errorKind = classify(json && json.code, response.status);
          endRound();
          return null;
        });
      }
      return readStream(response);
    }).catch(function () {
      if (!aborted) {
        failed = true;
        errorKind = "network";
      }
      endRound();
    });
    try { input.focus({ preventScroll: true }); } catch (error) { input.focus(); }
  }
  function stop() {
    if (!busy) return;
    aborted = true;
    if (controller) controller.abort();
    var id = conversationId();
    fetch("/stop", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        /* EdgeOne agent runtime rejects /stop without this header before the
           handler runs; runtime behaviour overrides the written contract. */
        "makers-conversation-id": id
      },
      body: JSON.stringify({ conversation_id: id }),
      keepalive: true
    }).catch(function () {});
    note("chat.stopped");
    endRound();
  }
  function init() {
    form = document.getElementById("chat-compose");
    log = form && form.parentNode.querySelector(".chat-log");
    input = document.getElementById("chat-input");
    sendBtn = form && form.querySelector('button[type="submit"]');
    stopBtn = document.getElementById("chat-stop");
    status = document.getElementById("chat-status");
    if (!form || !log || !input || !sendBtn || !stopBtn || !status) return;
    originalLive = log.getAttribute("aria-live") || "polite";

    if (sendBtn && !sendBtn.querySelector("svg")) sendBtn.insertBefore(icon("send"), sendBtn.firstChild);
    if (stopBtn && !stopBtn.querySelector("svg")) stopBtn.insertBefore(icon("stop"), stopBtn.firstChild);
    jump = el("button", "btn btn-ghost chat-jump");
    jump.type = "button";
    jump.hidden = true;
    jump.appendChild(leaf("span", "", "chat.jumpLatest"));
    form.parentNode.appendChild(jump);
    jump.addEventListener("click", function () {
      stick = true;
      jump.hidden = true;
      log.scrollTop = log.scrollHeight;
      try { input.focus({ preventScroll: true }); } catch (error) { input.focus(); }
    });
    log.addEventListener("scroll", function () {
      stick = log.scrollHeight - log.scrollTop - log.clientHeight < 60;
      if (stick) jump.hidden = true;
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      send(input.value.trim());
    });
    var composing = false;
    input.addEventListener("compositionstart", function () { composing = true; });
    input.addEventListener("compositionend", function () { composing = false; });
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" || event.shiftKey || composing || event.isComposing) return;
      event.preventDefault();
      send(input.value.trim());
    });
    stopBtn.addEventListener("click", stop);
    document.querySelectorAll("[data-chat-prompt]").forEach(function (button) {
      button.addEventListener("click", function () {
        var source = button.querySelector("[data-i18n]") || button;
        input.value = source.textContent.trim();
        try { input.focus({ preventScroll: true }); } catch (error) { input.focus(); }
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (error) {}
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
