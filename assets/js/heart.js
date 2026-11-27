/* Heart tap — progressive enhancement, zero injected styles.
   The devotion heart is a <span> in HTML (kept byte-identical across all 8
   pages). Here it is promoted to a real <button> with keyboard support, a
   Blob-backed global click count (/api/hearts), and a rotating sweet line.
   A small Web Audio chime is available but OFF by default. */
(function () {
  "use strict";

  var I18n = window.ShrineI18n;
  var API = "/api/hearts";
  var SOUND_KEY = "nafisah-heart-sound";
  var FALLBACK_KEY = "nafisah-hearts";
  var LINES = ["sq1", "sq2", "sq3", "sq4"];
  var memoryIndex = -1;
  var count = 0;
  var soundOn = false;
  var audioCtx = null;
  var note, noteText, noteSource, noteCount, soundBtn, live;
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
  function fallbackCount() {
    try {
      var n = parseInt(window.localStorage.getItem(FALLBACK_KEY), 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (error) { return 0; }
  }
  function loadCount() {
    fetch(API, { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (json) {
        if (json && json.code === 0 && json.data && typeof json.data.count === "number") {
          count = json.data.count;
        } else {
          count = fallbackCount();
        }
      })
      .catch(function () { count = fallbackCount(); });
  }
  /* Every tap is counted. POSTs are chained so the server's read-modify-write
     never races with itself. The displayed count stays optimistic (no flicker
     on rapid taps); the server is the source of truth on the next page load. */
  var postChain = null;
  function bumpCount() {
    count += 1;
    renderCount();
    var job = function () {
      return fetch(API, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: "{}"
      }).then(function (res) { return res.ok ? res.json() : null; })
        .catch(function () { return null; });
    };
    postChain = postChain ? postChain.then(job, job) : job();
  }
  function renderCount() {
    if (noteCount) noteCount.textContent = t("heart.count").replace("{n}", String(count));
    if (live && note && !note.hidden) live.textContent = noteText.textContent + " " + noteCount.textContent;
  }
  function nextIndex() {
    var index = Math.floor(Math.random() * LINES.length);
    if (LINES.length > 1 && index === memoryIndex) index = (index + 1) % LINES.length;
    memoryIndex = index;
    return index;
  }

  /* Web Audio chime: two soft sine notes with an exponential decay. No file,
     no external request; created lazily on first enabled tap (user gesture). */
  function chime() {
    if (!soundOn) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var now = audioCtx.currentTime;
      [[880, 0], [1174.66, 0.09]].forEach(function (pair) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = pair[0];
        gain.gain.setValueAtTime(0.0001, now + pair[1]);
        gain.gain.exponentialRampToValueAtTime(0.12, now + pair[1] + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + pair[1] + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + pair[1]);
        osc.stop(now + pair[1] + 0.55);
      });
    } catch (error) {}
  }

  function soundLabel() {
    return soundOn ? t("heart.sound.off") : t("heart.sound.on");
  }
  function relabelSound() {
    if (!soundBtn) return;
    var span = soundBtn.querySelector("span");
    if (span) span.textContent = soundOn ? t("heart.sound.state") : t("heart.sound.on");
    soundBtn.setAttribute("aria-label", soundLabel());
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
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

    soundBtn = el("button", "heart-note-sound");
    soundBtn.type = "button";
    soundBtn.appendChild(el("span", "", t("heart.sound.state")));
    soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      try { window.localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off"); } catch (error) {}
      relabelSound();
      if (soundOn) chime();
    });
    note.appendChild(soundBtn);

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
    relabelSound();
  }

  function showLine() {
    var key = LINES[nextIndex()];
    noteText.textContent = t(key + ".text");
    noteSource.textContent = t(key + ".src");
    renderCount();
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
      bumpCount();
      chime();
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
    });
    var close = note && note.querySelector(".heart-note-close");
    if (close) close.setAttribute("aria-label", t("heart.close"));
    relabelSound();
    renderCount();
  }

  function init() {
    var spans = Array.prototype.slice.call(document.querySelectorAll(".devotion-heart"));
    if (!spans.length) return;
    try { soundOn = window.localStorage.getItem(SOUND_KEY) === "on"; } catch (error) { soundOn = false; }
    spans.forEach(function (span) {
      var button = promote(span);
      if (button) hearts.push(button);
    });
    if (!hearts.length) return;
    buildNote();
    relabel();
    loadCount();
    document.addEventListener("shrine:languagechange", relabel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
