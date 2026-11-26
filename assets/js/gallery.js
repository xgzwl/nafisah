/* Gallery lightbox — progressive enhancement, zero injected styles.
   Binds only to existing .gallery-item nodes; all visuals come from style.css
   tokens and all copy comes from the shared i18n dictionary. */
(function () {
  "use strict";

  var I18n = window.ShrineI18n;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var PATHS = {
    close: "M6 6l12 12M18 6 6 18",
    prev: "M15 5l-7 7 7 7",
    next: "M9 5l7 7-7 7"
  };

  function dict() {
    return I18n && I18n.dict ? I18n.dict[I18n.current()] || I18n.dict.en : {};
  }
  function t(key, vars) {
    var value = dict()[key];
    if (typeof value !== "string") value = (I18n && I18n.dict.en[key]) || "";
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        value = value.split("{{" + name + "}}").join(String(vars[name]));
      });
    }
    return value;
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (typeof text === "string") node.textContent = text;
    return node;
  }
  function icon(name) {
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
    svg.setAttribute("class", "js-icon");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", PATHS[name]);
    svg.appendChild(path);
    return svg;
  }

  var items = [];
  var allItems = [];
  var current = 0;
  var opener = null;
  var filterGroup = "all";
  var dialog, image, caption, count, closeBtn, prevBtn, nextBtn, filterBar;

  function render() {
    var item = items[current];
    var img = item.querySelector("img");
    var cap = item.querySelector(".gallery-caption");
    if (!img) return;
    image.src = img.getAttribute("src");
    image.alt = img.getAttribute("alt") || "";
    /* Read the title and note separately — figcaption.textContent would glue
       them into one unreadable run ("titleNote"). */
    if (cap) {
      var title = cap.querySelector("h2");
      var note = cap.querySelector("p");
      var parts = [];
      if (title && title.textContent.trim()) parts.push(title.textContent.trim());
      if (note && note.textContent.trim()) parts.push(note.textContent.trim());
      caption.textContent = parts.join(" — ");
    } else {
      caption.textContent = "";
    }
    count.textContent = t("lightbox.counter", { current: current + 1, total: items.length });
    prevBtn.disabled = items.length < 2;
    nextBtn.disabled = items.length < 2;
  }

  function open(index, trigger) {
    if (!items.length) return;
    current = index;
    opener = trigger || null;
    render();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    closeBtn.focus();
  }

  function close() {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  function step(delta) {
    if (items.length < 2) return;
    current = (current + delta + items.length) % items.length;
    render();
  }

  function relabel() {
    if (!closeBtn) return;
    closeBtn.setAttribute("aria-label", t("lightbox.close"));
    closeBtn.title = t("lightbox.close");
    prevBtn.setAttribute("aria-label", t("lightbox.prev"));
    prevBtn.title = t("lightbox.prev");
    nextBtn.setAttribute("aria-label", t("lightbox.next"));
    nextBtn.title = t("lightbox.next");
    if (dialog && dialog.open) count.textContent = t("lightbox.counter", { current: current + 1, total: items.length });
  }

  function build() {
    dialog = el("dialog", "lightbox");
    dialog.setAttribute("aria-label", t("lightbox.open"));

    var figure = el("figure", "lightbox-figure");
    image = el("img", "lightbox-image");
    image.alt = "";
    figure.appendChild(image);

    caption = el("figcaption", "lightbox-caption");
    figure.appendChild(caption);

    count = el("p", "lightbox-count");
    count.setAttribute("aria-live", "polite");
    figure.appendChild(count);
    dialog.appendChild(figure);

    closeBtn = el("button", "lightbox-btn lightbox-close");
    closeBtn.type = "button";
    closeBtn.appendChild(icon("close"));
    dialog.appendChild(closeBtn);

    prevBtn = el("button", "lightbox-btn lightbox-prev");
    prevBtn.type = "button";
    prevBtn.appendChild(icon("prev"));
    dialog.appendChild(prevBtn);

    nextBtn = el("button", "lightbox-btn lightbox-next");
    nextBtn.type = "button";
    nextBtn.appendChild(icon("next"));
    dialog.appendChild(nextBtn);

    relabel();
    document.body.appendChild(dialog);

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { step(-1); });
    nextBtn.addEventListener("click", function () { step(1); });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) close();
    });
    dialog.addEventListener("close", function () {
      if (opener && typeof opener.focus === "function") {
        try { opener.focus({ preventScroll: true }); } catch (error) { opener.focus(); }
      }
    });
    document.addEventListener("keydown", function (event) {
      if (!dialog.open) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
    });
  }

  function applyFilter() {
    items = allItems.filter(function (item) {
      var group = item.getAttribute("data-group") || "all";
      var visible = filterGroup === "all" || group === filterGroup;
      item.hidden = !visible;
      return visible;
    });
    if (filterBar) {
      filterBar.querySelectorAll("[data-group]").forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-group") === filterGroup ? "true" : "false");
      });
    }
  }

  function buildFilter(grid) {
    filterBar = el("div", "gallery-filter");
    filterBar.id = "gallery-filter";
    filterBar.setAttribute("role", "group");
    filterBar.setAttribute("aria-label", t("gallery.filter.label"));
    filterBar.setAttribute("data-i18n-aria", "gallery.filter.label");
    [["all", "gallery.group.all"], ["study", "gallery.group.study"],
     ["botanical", "gallery.group.botanical"], ["objects", "gallery.group.objects"],
     ["paper", "gallery.group.paper"]].forEach(function (pair) {
      var btn = el("button", "gallery-filter-btn");
      btn.type = "button";
      btn.setAttribute("data-group", pair[0]);
      btn.setAttribute("data-entmesh-label", "gallery_filter_" + pair[0]);
      btn.setAttribute("aria-pressed", pair[0] === filterGroup ? "true" : "false");
      btn.appendChild(leafNode(pair[1]));
      filterBar.appendChild(btn);
    });
    grid.parentNode.insertBefore(filterBar, grid);
    filterBar.querySelectorAll("[data-group]").forEach(function (button) {
      button.addEventListener("click", function () {
        var next = button.getAttribute("data-group");
        if (next === filterGroup) return;
        filterGroup = next;
        applyFilter();
      });
    });
  }

  function leafNode(key) {
    var node = el("span");
    if (I18n && I18n.dict.en[key]) node.setAttribute("data-i18n", key);
    node.textContent = t(key);
    return node;
  }

  function init() {
    var grid = document.querySelector(".gallery-grid");
    var all = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    items = all.filter(function (node) { return node.querySelector("img"); });
    if (!items.length) return;
    allItems = items.slice();

    items.forEach(function (item) {
      var img = item.querySelector("img");
      var trigger = el("button", "lightbox-trigger");
      trigger.type = "button";
      trigger.setAttribute("aria-label", t("lightbox.open"));
      trigger.setAttribute("data-entmesh-label", "lightbox_open");
      /* Wrap the image itself so the button has real hit area; moving it in
         also keeps figcaption as a direct child of figure for semantics. */
      item.insertBefore(trigger, img);
      trigger.appendChild(img);
      trigger.addEventListener("click", function () {
        var index = items.indexOf(item);
        if (index >= 0) open(index, trigger);
      });
    });

    if (grid) buildFilter(grid);
    build();
    document.addEventListener("shrine:languagechange", relabel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
