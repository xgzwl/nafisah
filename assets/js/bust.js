/* Tom Riddle full-body figure — progressive enhancement, no build step, no CDN.
   User-submitted letters are written with textContent only, never innerHTML. */
(function () {
  "use strict";

  var I18n = window.ShrineI18n;
  var MODEL_URL = "assets/models/tom-riddle-full-opt.glb";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEG = Math.PI / 180;
  var YAW_LIMIT = 60 * DEG;
  var PITCH_MIN = -15 * DEG;
  var PITCH_MAX = 25 * DEG;
  var DIST_MIN = 2.2;
  var DIST_MAX = 5.0;

  var stage, viewport, fallbackEl, statusEl, statusText, progressEl, retryBtn, resetBtn, ornamentsEl;
  var dialog, dialogTitle, dialogText, dialogBy, closeBtn, opener;
  var letters = [];

  var renderer = null;
  var scene = null;
  var camera = null;
  var model = null;
  var rafId = 0;
  var lastFrame = 0;
  var visible = true;
  var manualYaw = 0;
  var manualPitch = 3 * DEG;
  var manualDist = 4.0;
  var autoYaw = 0;
  var autoDir = 1;
  var autoActive = false;
  var dragging = false;
  var pointers = {};
  var pinchStart = 0;
  var mode = "loading"; /* loading | ready | fallback | error */
  var statusKey = "bust.loading";
  var announceTimer = 0;
  var layoutQueued = false;
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function dict(lang) {
    return I18n && I18n.dict ? I18n.dict[lang] || I18n.dict.en || {} : {};
  }
  function currentLang() {
    return I18n && I18n.current ? I18n.current() : "en";
  }
  function t(key) {
    var value = dict(currentLang())[key];
    if (typeof value !== "string") value = dict("en")[key];
    return typeof value === "string" ? value : "";
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (typeof text === "string") node.textContent = text;
    return node;
  }
  /* Leaf node + data-i18n: the shared apply() pass keeps it in sync. */
  function localize(node, key) {
    if (dict("en")[key]) node.setAttribute("data-i18n", key);
    node.textContent = t(key);
    return node;
  }
  function aria(node, key) {
    if (dict("en")[key]) node.setAttribute("data-i18n-aria", key);
    node.setAttribute("aria-label", t(key));
    return node;
  }
  function iconClose() {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "butt");
    svg.setAttribute("stroke-linejoin", "miter");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "1em");
    svg.setAttribute("height", "1em");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M6 6l12 12M18 6 6 18");
    svg.appendChild(path);
    return svg;
  }

  function setStatus(key) {
    statusKey = key;
    statusText.setAttribute("data-i18n", key);
    statusText.textContent = t(key);
  }
  function announce(key) {
    clearTimeout(announceTimer);
    statusText.textContent = t(key);
    announceTimer = setTimeout(function () {
      statusText.textContent = t(statusKey);
    }, 1800);
  }
  function setViewportLabel() {
    var key = (mode === "ready" || mode === "loading") ? "bust.viewLabel" : "bust.fallback";
    viewport.setAttribute("data-i18n-aria", key);
    viewport.setAttribute("aria-label", t(key));
  }

  /* ---------- Letter ornaments ---------- */

  function byLine(item, cls) {
    var line = el("span", cls);
    var label = localize(el("span"), "letter.wall.from");
    var name = el("span", "", String(item.name || ""));
    line.appendChild(label);
    line.appendChild(document.createTextNode(" "));
    line.appendChild(name);
    return line;
  }
  function addOrnament(item, index) {
    var button = el("button", "bust-ornament");
    button.type = "button";
    button.setAttribute("data-entmesh-label", "bust_letter_open");
    aria(button, "bust.viewFull");
    var text = el("span", "bust-ornament-text");
    /* The API returns decoded original text. textContent keeps it inert. */
    text.textContent = String(item.text || "");
    button.appendChild(text);
    if (item.name) button.appendChild(byLine(item, "bust-ornament-by"));
    button.addEventListener("click", function () { openLetter(item, button); });
    ornamentsEl.appendChild(button);
    button.style.setProperty("--delay", (index * 0.63).toFixed(2) + "s");
    button.style.setProperty("--dur", (4 + (index % 5) * 0.8).toFixed(1) + "s");
  }
  function ornamentNote(key) {
    var note = localize(el("p", "bust-ornament-note small"), key);
    ornamentsEl.appendChild(note);
    return note;
  }
  function loadLetters() {
    ornamentsEl.setAttribute("aria-busy", "true");
    ornamentsEl.textContent = "";
    ornamentNote("bust.lettersLoading");
    fetch("/api/letters?page=1&limit=50", {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }).then(function (response) {
      if (!response.ok) throw new Error("http-" + response.status);
      return response.json();
    }).then(function (json) {
      if (!json || json.code !== 0 || !json.data || !Array.isArray(json.data.items)) {
        throw new Error("bad-envelope");
      }
      ornamentsEl.textContent = "";
      /* No locale filter: the display reads letters in every language. */
      letters = json.data.items.slice().sort(function (a, b) {
        return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
      }).slice(0, 6);
      if (!letters.length) {
        ornamentNote("bust.noLetters");
      } else {
        letters.forEach(addOrnament);
      }
      layoutOrnaments();
    }).catch(function () {
      ornamentsEl.textContent = "";
      ornamentNote("bust.lettersError");
      var retry = localize(el("button", "btn btn-ghost bust-letters-retry"), "bust.retry");
      retry.type = "button";
      retry.addEventListener("click", loadLetters);
      ornamentsEl.appendChild(retry);
    }).then(function () {
      ornamentsEl.setAttribute("aria-busy", "false");
    });
  }

  function ensureDialog() {
    if (dialog) return;
    dialog = el("dialog", "bust-dialog");
    aria(dialog, "bust.viewFull");
    var head = el("div", "bust-dialog-head");
    dialogTitle = localize(el("h2"), "bust.viewFull");
    head.appendChild(dialogTitle);
    closeBtn = el("button", "bust-dialog-close");
    closeBtn.type = "button";
    closeBtn.setAttribute("data-entmesh-label", "bust_letter_close");
    aria(closeBtn, "bust.close");
    closeBtn.appendChild(iconClose());
    head.appendChild(closeBtn);
    dialog.appendChild(head);
    dialogText = el("p", "bust-dialog-text");
    dialog.appendChild(dialogText);
    dialogBy = el("p", "bust-dialog-by muted small");
    dialog.appendChild(dialogBy);
    document.body.appendChild(dialog);

    closeBtn.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      if (opener && document.contains(opener)) {
        try { opener.focus({ preventScroll: true }); } catch (error) { opener.focus(); }
      }
      opener = null;
    });
  }
  function openLetter(item, trigger) {
    ensureDialog();
    opener = trigger;
    dialogText.textContent = String(item.text || "");
    dialogBy.textContent = "";
    if (item.name) dialogBy.appendChild(byLine(item, ""));
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    closeBtn.focus();
  }

  function scheduleLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    window.requestAnimationFrame(function () {
      layoutQueued = false;
      layoutOrnaments();
      applySize();
    });
  }
  function layoutOrnaments() {
    var cards = Array.prototype.filter.call(
      ornamentsEl.querySelectorAll(".bust-ornament"), function (node) { return !node.hidden; }
    );
    if (!cards.length || !stage) return;
    /* At <=760px the side bands are narrower than even the smallest card,
       so a two-column layout has no collision-free solution; use the strip.
       Six cards total at every width (single data source from /api/letters). */
    var strip = window.innerWidth <= 760;
    var count = 6;
    ornamentsEl.classList.toggle("is-strip", strip);
    cards.forEach(function (card, index) {
      card.hidden = index >= count;
      card.style.left = "";
      card.style.top = "";
      card.style.setProperty("--rot", (index % 2 === 0 ? "1.5deg" : "-1.5deg"));
    });
    if (strip) return;

    var w = stage.clientWidth;
    var h = stage.clientHeight;
    var rx = w * 0.40;
    var ry = h * 0.28;
    var kx0 = w * 0.275;
    var kx1 = w * 0.725;
    var ky0 = h * 0.20;
    var ky1 = h * 0.80;
    cards.slice(0, count).forEach(function (card, index) {
      var cw = card.offsetWidth;
      var ch = card.offsetHeight;
      var theta = -Math.PI / 2 + (2 * Math.PI * index / count);
      var cx = w / 2 + rx * Math.cos(theta);
      var cy = h / 2 + ry * Math.sin(theta);
      cx = clamp(cx, cw / 2 + 6, w - cw / 2 - 6);
      cy = clamp(cy, ch / 2 + 6, h - ch / 2 - 6);
      /* Push cards out of the centre 45% × 60% keep-out. Minimal penetration
         alone can pick a band too thin to hold the card (520–900px viewports),
         so prefer the closest direction that actually fits. */
      function intersects(x, y) {
        return x + cw / 2 > kx0 && x - cw / 2 < kx1 &&
               y + ch / 2 > ky0 && y - ch / 2 < ky1;
      }
      if (intersects(cx, cy)) {
        var gap = 4;
        var options = [
          { x: kx0 - cw / 2 - gap, y: cy },
          { x: kx1 + cw / 2 + gap, y: cy },
          { x: cx, y: ky0 - ch / 2 - gap },
          { x: cx, y: ky1 + ch / 2 + gap }
        ];
        var best = null;
        var bestDistance = Infinity;
        options.forEach(function (option) {
          if (option.x < cw / 2 + gap || option.x > w - cw / 2 - gap ||
              option.y < ch / 2 + gap || option.y > h - ch / 2 - gap) return;
          if (intersects(option.x, option.y)) return;
          var distance = Math.abs(option.x - cx) + Math.abs(option.y - cy);
          if (distance < bestDistance) { best = option; bestDistance = distance; }
        });
        if (best) {
          cx = best.x;
          cy = best.y;
        } else {
          var left = cx + cw / 2 - kx0;
          var right = kx1 - (cx - cw / 2);
          var top = cy + ch / 2 - ky0;
          var bottom = ky1 - (cy - ch / 2);
          var least = Math.min(left, right, top, bottom);
          if (least === left) cx -= left;
          else if (least === right) cx += right;
          else if (least === top) cy -= top;
          else cy += bottom;
          cx = clamp(cx, cw / 2 + gap, w - cw / 2 - gap);
          cy = clamp(cy, ch / 2 + gap, h - ch / 2 - gap);
        }
      }
      card.style.left = (cx - cw / 2) + "px";
      card.style.top = (cy - ch / 2) + "px";
    });
    /* Same-side cards must not stack on top of one another. */
    ["left", "right"].forEach(function (side) {
      var group = cards.slice(0, count).filter(function (card) {
        return (parseFloat(card.style.left) < w / 2) === (side === "left");
      }).sort(function (a, b) {
        return parseFloat(a.style.top) - parseFloat(b.style.top);
      });
      var cursor = 6;
      group.forEach(function (card) {
        var top = parseFloat(card.style.top);
        if (top < cursor) card.style.top = Math.min(cursor, h - card.offsetHeight - 6) + "px";
        cursor = parseFloat(card.style.top) + card.offsetHeight + 6;
      });
    });
  }

  /* ---------- 3D scene ---------- */

  function webglAvailable() {
    try {
      var canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch (error) {
      return false;
    }
  }
  function applySize() {
    if (!renderer || !camera || !stage) return;
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function paintMaterials(THREE, root) {
    root.traverse(function (node) {
      if (!node.isMesh) return;
      var label = ((node.name || "") + " " + ((node.material && node.material.name) || "")).toLowerCase();
      var color = null;
      if (/robe|cloak|coat|cloth|garment|sleeve|tunic|gown/.test(label)) color = 0x141412;
      else if (/hair|strand/.test(label)) color = 0x1a1714;
      else if (/skin|face|hand|neck|head/.test(label)) color = 0xd8c8b4;
      var materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(function (material) {
        if (!material) return;
        if (color !== null && material.color) {
          material.color = new THREE.Color(color);
          material.map = null;
        }
        if ("roughness" in material) material.roughness = 0.88;
        if ("metalness" in material) material.metalness = 0;
        material.needsUpdate = true;
      });
    });
  }
  function buildScene(THREE, root) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.domElement.setAttribute("aria-hidden", "true");
    viewport.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x0e1a17, 0.6));
    var key = new THREE.DirectionalLight(0xf3d9a4, 2.2);
    key.position.set(3, 4, 5);
    var fill = new THREE.DirectionalLight(0x8fb3a8, 0.35);
    fill.position.set(-4, 1, 2);
    var rim = new THREE.DirectionalLight(0xb08d57, 1.2);
    rim.position.set(0, 3, -4);
    scene.add(key);
    scene.add(fill);
    scene.add(rim);

    /* Normalise the incoming GLB to a 1.7-unit bust centred on the origin. */
    var box = new THREE.Box3().setFromObject(root);
    var size = box.getSize(new THREE.Vector3());
    var centre = box.getCenter(new THREE.Vector3());
    var scale = 1.7 / (size.y || 1.7);
    root.scale.setScalar(scale);
    root.position.set(-centre.x * scale, -centre.y * scale, -centre.z * scale);
    paintMaterials(THREE, root);
    model = root;
    scene.add(model);

    applySize();
    mode = "ready";
    viewport.setAttribute("aria-busy", "false");
    setViewportLabel();
    statusEl.hidden = true;
    fallbackEl.hidden = true;
    startLoop();
  }
  function showFallback(error) {
    stopLoop();
    mode = error ? "error" : "fallback";
    viewport.setAttribute("aria-busy", "false");
    setViewportLabel();
    fallbackEl.hidden = false;
    statusEl.hidden = false;
    progressEl.hidden = true;
    retryBtn.hidden = !error;
    setStatus(error ? "bust.error" : "bust.fallback");
  }
  function initScene() {
    if (!webglAvailable()) {
      showFallback(false);
      return;
    }
    var modules;
    try {
      modules = Promise.all([
        import("./vendor/three.module.js"),
        import("./vendor/loaders/GLTFLoader.js")
      ]);
    } catch (error) {
      showFallback(true);
      return;
    }
    modules.then(function (loaded) {
      var THREE = loaded[0];
      var GLTFLoader = loaded[1].GLTFLoader;
      /* Only a genuine load failure enters the error state. buildScene() is
         deliberately isolated: a non-fatal setup/render error must not turn a
         successfully loaded model into a false "could not be read" state. */
      new Promise(function (resolve, reject) {
        new GLTFLoader().load(MODEL_URL, resolve, undefined, reject);
      }).then(function (gltf) {
        try {
          buildScene(THREE, gltf.scene);
        } catch (error) {
          showFallback(false);
        }
      }, function () {
        showFallback(true);
      });
    }).catch(function () {
      showFallback(true);
    });
  }

  function frame(now) {
    rafId = 0;
    if (mode !== "ready" || !visible || document.hidden) return;
    var delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now;
    if (autoActive && !dragging) {
      autoYaw += autoDir * 0.15 * delta;
      if (autoYaw > YAW_LIMIT) { autoYaw = YAW_LIMIT; autoDir = -1; }
      else if (autoYaw < -YAW_LIMIT) { autoYaw = -YAW_LIMIT; autoDir = 1; }
    }
    var yaw = clamp(manualYaw + autoYaw, -YAW_LIMIT, YAW_LIMIT);
    var pitch = clamp(manualPitch, PITCH_MIN, PITCH_MAX);
    var flat = Math.cos(pitch) * manualDist;
    camera.position.set(Math.sin(yaw) * flat, Math.sin(pitch) * manualDist, Math.cos(yaw) * flat);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(frame);
  }
  function startLoop() {
    if (!rafId && mode === "ready") {
      lastFrame = 0;
      rafId = window.requestAnimationFrame(frame);
    }
  }
  function stopLoop() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }
  function stopAuto() {
    if (autoActive) {
      manualYaw = clamp(manualYaw + autoYaw, -YAW_LIMIT, YAW_LIMIT);
      autoYaw = 0;
    }
    autoActive = false;
  }
  function resetView() {
    stopAuto();
    manualYaw = 0;
    manualPitch = 3 * DEG;
    manualDist = 4.0;
    autoYaw = 0;
    autoDir = 1;
    autoActive = !reduceMotion;
  }
  function pointerDistance() {
    var ids = Object.keys(pointers);
    if (ids.length < 2) return 0;
    var a = pointers[ids[0]];
    var b = pointers[ids[1]];
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  function onPointerDown(event) {
    if (mode !== "ready") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
    try { viewport.setPointerCapture(event.pointerId); } catch (error) {}
    dragging = true;
    stopAuto();
    if (Object.keys(pointers).length === 2) pinchStart = pointerDistance();
  }
  function onPointerMove(event) {
    if (!pointers[event.pointerId]) return;
    var previous = pointers[event.pointerId];
    var dx = event.clientX - previous.x;
    var dy = event.clientY - previous.y;
    pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
    if (Object.keys(pointers).length >= 2) {
      var distance = pointerDistance();
      if (pinchStart > 0 && distance > 0) {
        manualDist = clamp(manualDist * pinchStart / distance, DIST_MIN, DIST_MAX);
      }
      pinchStart = distance;
    } else {
      manualYaw = clamp(manualYaw + dx * 0.006, -YAW_LIMIT, YAW_LIMIT);
      manualPitch = clamp(manualPitch - dy * 0.004, PITCH_MIN, PITCH_MAX);
    }
  }
  function onPointerUp(event) {
    delete pointers[event.pointerId];
    if (!Object.keys(pointers).length) {
      dragging = false;
      pinchStart = 0;
    } else if (Object.keys(pointers).length === 1) {
      pinchStart = 0;
    }
  }
  function onWheel(event) {
    if (mode !== "ready") return;
    event.preventDefault();
    stopAuto();
    manualDist = clamp(manualDist + (event.deltaY > 0 ? 0.25 : -0.25), DIST_MIN, DIST_MAX);
  }
  function onKeyDown(event) {
    if (mode !== "ready") return;
    var handled = true;
    switch (event.key) {
      case "ArrowLeft": manualYaw = clamp(manualYaw - 6 * DEG, -YAW_LIMIT, YAW_LIMIT); stopAuto(); break;
      case "ArrowRight": manualYaw = clamp(manualYaw + 6 * DEG, -YAW_LIMIT, YAW_LIMIT); stopAuto(); break;
      case "ArrowUp": manualPitch = clamp(manualPitch + 4 * DEG, PITCH_MIN, PITCH_MAX); stopAuto(); break;
      case "ArrowDown": manualPitch = clamp(manualPitch - 4 * DEG, PITCH_MIN, PITCH_MAX); stopAuto(); break;
      case "+": case "=": manualDist = clamp(manualDist - 0.3, DIST_MIN, DIST_MAX); stopAuto(); break;
      case "-": case "_": manualDist = clamp(manualDist + 0.3, DIST_MIN, DIST_MAX); stopAuto(); break;
      case "0": resetView(); announce("bust.resetAnnounce"); break;
      default: handled = false;
    }
    if (handled) event.preventDefault();
  }

  function init() {
    stage = document.getElementById("bust-stage");
    viewport = document.getElementById("bust-viewport");
    fallbackEl = document.getElementById("bust-fallback");
    statusEl = document.getElementById("bust-status");
    statusText = statusEl ? statusEl.querySelector(".bust-status-text") : null;
    progressEl = statusEl ? statusEl.querySelector(".bust-progress") : null;
    retryBtn = document.getElementById("bust-retry");
    resetBtn = document.getElementById("bust-reset");
    ornamentsEl = document.getElementById("bust-ornaments");
    if (!stage || !viewport || !fallbackEl || !statusEl || !statusText ||
        !progressEl || !retryBtn || !resetBtn || !ornamentsEl) return;

    setViewportLabel();
    setStatus("bust.loading");
    viewport.setAttribute("aria-busy", "true");

    resetBtn.addEventListener("click", function () {
      resetView();
      announce("bust.resetAnnounce");
    });
    retryBtn.addEventListener("click", function () {
      if (mode !== "error") return;
      retryBtn.hidden = true;
      fallbackEl.hidden = true;
      statusEl.hidden = false;
      progressEl.hidden = false;
      viewport.setAttribute("aria-busy", "true");
      mode = "loading";
      setViewportLabel();
      setStatus("bust.loading");
      initScene();
    });

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("keydown", onKeyDown);

    window.addEventListener("resize", scheduleLayout);
    if ("ResizeObserver" in window) {
      new ResizeObserver(scheduleLayout).observe(stage);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopLoop();
      else { scheduleLayout(); startLoop(); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) startLoop();
        else stopLoop();
      }, { threshold: 0.01 }).observe(stage);
    }

    loadLetters();
    initScene();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
