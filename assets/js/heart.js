/* Heart tap — progressive enhancement, zero injected styles.
   The devotion heart is a <span> in HTML (kept byte-identical across all 8
   pages). Here it is promoted to a real <button> with keyboard support, a
   localStorage-backed click count, and a rotating original "sweet" line. */
(function () {
  "use strict";

  var I18n = window.ShrineI18n;
  var COUNT_KEY = "nafisah-hearts";
  var LINES = ["sq1", "sq2", "sq3", "sq4"];
  var memoryCount = 0;
  var memoryIndex = -1;
  var note, noteText, noteSource, noteCount, live;
  var hearts = [];

  function dict() {
    return I18n && I18n.dict ? I18n.dict[I18n.current()] || I18n.dict.en : {};
  }
  function t(key) {
    var value = dict()[key];
    if (typeof value !== "string") value = (I18n && I18n.dict.en && I18n.dict.en[key]) || "";
    return value;
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (typeof text === "string") node.textContent = text;
    return node;
  }
  function readCount() {
    try {
      var raw = window.localStorage.getItem(COUNT_KEY);
      var n = parseInt(raw, 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (error) {
      return memoryCount;
    }
  }
  function writeCount(n) {
    memoryCount = n;
    try { window.localStorage.setItem(COUNT_KEY, String(n)); } catch (error) {}
  }
  function nextIndex() {
    var index = Math.floor(Math.random() * LINES.length);
    if (LINES.length > 1 && index === memoryIndex) index = (index + 1) % LINES.length;
    memoryIndex = index;
    return index;
  }

  function buildNote() {
    note = el("div", "heart-note");
    note.setAttribute("role", "status");
    note.setAttribute("aria-live", "polite");
    note.hidden = true;
    noteText = el("p", "heart-note-line");
    noteSource = el("p", "heart-note-source");
    noteCount = el("p", "heart-note-count");
    note.appendChild(noteText);
    note.appendChild(noteSource);
    note.appendChild(noteCount);
    var close = el("button", "heart-note-close");
    close.type = "button";
    close.textContent = "\u00d7";
    close.setAttribute("aria-label", t("heart.close"));
    close.addEventListener("click", function () { note.hidden = true; });
    note.appendChild(close);
    document.body.appendChild(note);

    live = el("p", "sr-only");
    live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);
  }

  function showLine() {
    var key = LINES[nextIndex()];
    noteText.textContent = t(key + ".text");
    noteSource.textContent = t(key + ".src");
    var n = readCount();
    noteCount.textContent = t("heart.count").replace("{n}", String(n));
    note.hidden = false;
    note.classList.remove("is-pulse");
    /* Force a reflow so the pulse restarts on every tap. */
    void note.offsetWidth;
    note.classList.add("is-pulse");
    live.textContent = noteText.textContent + " " + noteCount.textContent;
  }

  function promote(span) {
    if (span.getAttribute("data-heart-ready")) return null;
    var svg = span.querySelector("svg");
    if (!svg) return null;
    var button = el("button", span.className);
    button.type = "button";
    button.setAttribute("data-heart-ready", "true");
    button.addEventListener("click", function () {
      writeCount(readCount() + 1);
      hearts.forEach(function (h) { h.classList.remove("is-tapped"); });
      void button.offsetWidth;
      button.classList.add("is-tapped");
      showLine();
    });
    button.appendChild(svg);
    span.parentNode.replaceChild(button, span);
    return button;
  }

  function relabel() {
    hearts.forEach(function (button) {
      button.setAttribute("aria-label", t("heart.aria"));
      var close = note && note.querySelector(".heart-note-close");
      if (close) close.setAttribute("aria-label", t("heart.close"));
    });
    if (note && !note.hidden) {
      var n = readCount();
      noteCount.textContent = t("heart.count").replace("{n}", String(n));
    }
  }

  function init() {
    var spans = Array.prototype.slice.call(document.querySelectorAll(".devotion-heart"));
    if (!spans.length) return;
    spans.forEach(function (span) {
      var button = promote(span);
      if (button) hearts.push(button);
    });
    if (!hearts.length) return;
    buildNote();
    relabel();
    document.addEventListener("shrine:languagechange", relabel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
