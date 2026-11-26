/* Letters: compose form + public letter wall. Same-origin only, no external script. */
(function () {
  "use strict";

  var I18n = window.ShrineI18n;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var PATHS = {
    alert: "M12 3 2 21h20L12 3zM12 9v5M12 17v1",
    retry: "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5",
    send: "M3 5h18v14H3zM3 6l9 7 9-7",
    heart: "M12 6.2C10.9 3.1 9.1 2.1 7.1 2.1 4.4 2.1 2.4 4.3 2.4 7.2c0 2.7 1.6 4.7 3.4 6.5L12 20l6.2-6.3c1.8-1.8 3.4-3.8 3.4-6.5 0-2.9-2-5.1-4.7-5.1-2 0-3.8 1-4.9 4.1z"
  };
  var FALLBACK = {
    "letter.form.title": "Write to him",
    "letter.form.lead": "Leave a few lines here. The page keeps them in the order they arrive.",
    "letter.form.name": "Signature (optional)",
    "letter.form.body": "Your letter",
    "letter.form.bodyHint": "Between 20 and 1000 characters.",
    "letter.form.privacy": "Your letter will be shown publicly. Please leave out real names, contact details and addresses. Sending it means you agree to that.",
    "letter.form.consent": "I understand this letter will be published on the wall.",
    "letter.form.consentRequired": "Please confirm that your letter may be published.",
    "letter.form.submit": "Leave the letter",
    "letter.form.sending": "Leaving the letter…",
    "letter.form.success": "Your letter is here now. Thank you for leaving it.",
    "letter.form.another": "Write another",
    "letter.form.error.invalid": "Please check the length of your letter and try again.",
    "letter.form.error.tooShort": "A letter needs at least 20 characters.",
    "letter.form.error.tooLong": "A letter can hold at most 1000 characters.",
    "letter.form.error.name": "A signature can hold at most 40 characters.",
    "letter.form.error.network": "The page could not reach the shrine. Your letter is still here — please try again.",
    "letter.form.error.rate": "The candle is resting for a moment. Please try again shortly.",
    "letter.form.error.server": "The shelf did not take the letter. Nothing was lost — please try again.",
    "letter.form.retry": "Try again",
    "letter.wall.title": "Letters left here",
    "letter.wall.lead": "What other readers have set down, newest first.",
    "letter.wall.note": "Letters appear as written, in their original language.",
    "letter.wall.from": "from",
    "letter.wall.empty": "No letters yet. The first page is yours.",
    "letter.wall.loading": "Taking the letters down from the shelf…",
    "letter.wall.error": "The shelf could not be read just now.",
    "letter.wall.more": "Show earlier letters"
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
  function fieldError(id, key) {
    var box = document.getElementById("letter-" + id + "-error");
    if (!box) return;
    var span = box.querySelector("span");
    if (span) localize(span, key);
    box.hidden = false;
    var control = document.getElementById("letter-" + id);
    if (control) control.setAttribute("aria-invalid", "true");
  }
  function clearErrors() {
    ["name", "body", "consent"].forEach(function (id) {
      var box = document.getElementById("letter-" + id + "-error");
      var control = document.getElementById("letter-" + id);
      if (box) box.hidden = true;
      if (control) control.removeAttribute("aria-invalid");
    });
    var banner = document.getElementById("letter-banner");
    if (banner) banner.hidden = true;
  }
  function errorBox(id) {
    var box = el("p", "form-error");
    box.id = "letter-" + id + "-error";
    box.hidden = true;
    box.appendChild(icon("alert"));
    box.appendChild(el("span"));
    return box;
  }
  function buildCompose() {
    var frag = document.createDocumentFragment();
    frag.appendChild(leaf("h2", "", "letter.form.title"));
    frag.appendChild(leaf("p", "lead", "letter.form.lead"));
    var banner = el("div", "form-banner");
    banner.id = "letter-banner";
    banner.setAttribute("role", "alert");
    banner.hidden = true;
    banner.appendChild(localize(el("p"), "letter.form.error.network"));
    var retry = el("button", "btn btn-ghost");
    retry.type = "button";
    retry.id = "letter-banner-retry";
    retry.appendChild(icon("retry"));
    retry.appendChild(leaf("span", "", "letter.form.retry"));
    banner.appendChild(retry);
    frag.appendChild(banner);

    var form = el("form");
    form.id = "letter-form";
    form.noValidate = true;
    var nameLabel = leaf("label", "form-label", "letter.form.name");
    nameLabel.htmlFor = "letter-name";
    var name = el("input", "form-control");
    name.type = "text";
    name.id = "letter-name";
    name.name = "name";
    name.maxLength = 40;
    name.autocomplete = "name";
    name.setAttribute("aria-describedby", "letter-name-error");
    form.appendChild(nameLabel);
    form.appendChild(name);
    form.appendChild(errorBox("name"));

    var bodyLabel = leaf("label", "form-label", "letter.form.body");
    bodyLabel.htmlFor = "letter-body";
    var body = el("textarea", "form-control");
    body.id = "letter-body";
    body.name = "text";
    body.rows = 8;
    body.minLength = 20;
    body.maxLength = 1000;
    body.required = true;
    body.setAttribute("aria-describedby", "letter-body-hint letter-count letter-privacy letter-body-error");
    form.appendChild(bodyLabel);
    form.appendChild(body);
    form.appendChild(leaf("p", "form-hint small", "letter.form.bodyHint")).id = "letter-body-hint";
    var privacy = leaf("p", "form-hint small", "letter.form.privacy");
    privacy.id = "letter-privacy";
    privacy.hidden = true;
    form.appendChild(privacy);
    var count = el("p", "form-count small", "0 / 1000");
    count.id = "letter-count";
    form.appendChild(count);
    form.appendChild(errorBox("body"));

    var row = el("div", "consent-row");
    var consent = el("input");
    consent.type = "checkbox";
    consent.id = "letter-consent";
    consent.name = "consent";
    consent.setAttribute("aria-describedby", "letter-consent-error");
    var consentLabel = leaf("label", "small", "letter.form.consent");
    consentLabel.htmlFor = "letter-consent";
    row.appendChild(consent);
    row.appendChild(consentLabel);
    form.appendChild(row);
    form.appendChild(errorBox("consent"));

    var honeypot = el("input", "sr-only");
    honeypot.type = "text";
    honeypot.name = "website";
    honeypot.tabIndex = -1;
    honeypot.autocomplete = "off";
    honeypot.setAttribute("aria-hidden", "true");
    form.appendChild(honeypot);

    var submit = el("button", "btn");
    submit.type = "submit";
    submit.id = "letter-submit";
    submit.setAttribute("data-entmesh-label", "letter_submit");
    submit.appendChild(icon("send"));
    submit.appendChild(leaf("span", "", "letter.form.submit"));
    form.appendChild(submit);
    frag.appendChild(form);

    var success = el("div", "letter-success");
    success.id = "letter-success";
    success.tabIndex = -1;
    success.hidden = true;
    success.appendChild(icon("heart"));
    success.appendChild(leaf("p", "", "letter.form.success"));
    var another = el("button", "btn btn-ghost");
    another.type = "button";
    another.id = "letter-another";
    another.appendChild(leaf("span", "", "letter.form.another"));
    success.appendChild(another);
    frag.appendChild(success);
    var status = localize(el("p", "sr-only"), "letter.form.success");
    status.id = "letter-status";
    status.setAttribute("aria-live", "polite");
    status.textContent = "";
    frag.appendChild(status);
    return frag;
  }
  function buildWall() {
    var frag = document.createDocumentFragment();
    frag.appendChild(leaf("h2", "", "letter.wall.title"));
    frag.appendChild(leaf("p", "lead", "letter.wall.lead"));
    frag.appendChild(leaf("p", "muted small", "letter.wall.note"));
    var filter = el("div", "wall-filter");
    filter.id = "wall-filter";
    filter.setAttribute("role", "group");
    filter.setAttribute("aria-label", t("letter.wall.filter.label"));
    filter.setAttribute("data-i18n-aria", "letter.wall.filter.label");
    [["all", "letter.wall.filter.all"], ["zh", "letter.wall.filter.zh"],
     ["en", "letter.wall.filter.en"], ["fr", "letter.wall.filter.fr"]].forEach(function (pair) {
      var btn = el("button", "wall-filter-btn");
      btn.type = "button";
      btn.setAttribute("data-locale", pair[0]);
      btn.setAttribute("data-entmesh-label", "letter_filter_" + pair[0]);
      btn.setAttribute("aria-pressed", pair[0] === filterLocale ? "true" : "false");
      btn.appendChild(leaf("span", "", pair[1]));
      filter.appendChild(btn);
    });
    filterBar = filter;
    frag.appendChild(filter);
    var list = el("div", "letter-stack");
    list.id = "wall-list";
    list.setAttribute("aria-busy", "false");
    frag.appendChild(list);
    var more = el("button", "btn btn-ghost");
    more.type = "button";
    more.id = "wall-more";
    more.hidden = true;
    more.appendChild(leaf("span", "", "letter.wall.more"));
    frag.appendChild(more);
    return frag;
  }
  function ensureUI() {
    var main = document.getElementById("main");
    if (!main) return false;
    var compose = document.getElementById("letter-compose");
    if (!compose) {
      main.appendChild(el("div", "divider"));
      compose = el("section", "letter-compose parchment");
      compose.id = "letter-compose";
      compose.setAttribute("aria-labelledby", "compose-title");
      main.appendChild(compose);
      compose.appendChild(buildCompose());
    }
    if (!document.getElementById("letter-form")) {
      compose.appendChild(buildCompose());
    }
    if (!document.getElementById("compose-title")) {
      compose.querySelector("h2").id = "compose-title";
    }
    var wall = document.getElementById("letter-wall");
    if (!wall) {
      main.appendChild(el("div", "divider"));
      wall = el("section", "letter-wall");
      wall.id = "letter-wall";
      wall.setAttribute("aria-labelledby", "wall-title");
      main.appendChild(wall);
      wall.appendChild(buildWall());
    }
    if (!document.getElementById("wall-list")) wall.appendChild(buildWall());
    if (!document.getElementById("wall-title")) {
      wall.querySelector("h2").id = "wall-title";
    }
    return true;
  }

  function classify(status, code) {
    if (status === 429 || code === 42901) return "rate";
    if (status === 400 || code === 40001 || code === 40002 || code === 40003) return "invalid";
    return "server";
  }
  function letterDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]
      .map(function (n) { return String(n).padStart(2, "0"); }).join(".");
  }
  function letterCard(item) {
    var article = el("article", "letter parchment");
    var date = el("p", "letter-date");
    var time = el("time", "", letterDate(item.createdAt));
    time.setAttribute("datetime", String(item.createdAt || ""));
    date.appendChild(time);
    if (item.name) {
      date.appendChild(leaf("span", "", "letter.wall.from"));
      date.appendChild(el("span", "letter-signature", String(item.name)));
    }
    article.appendChild(date);
    article.appendChild(el("p", "letter-body", String(item.text || "")));
    return article;
  }
  function statusCard(key, retryId) {
    var card = el("article", "letter parchment");
    card.appendChild(leaf("p", "small muted", key));
    if (retryId) {
      var btn = el("button", "btn btn-ghost");
      btn.type = "button";
      btn.id = retryId;
      btn.appendChild(leaf("span", "", "letter.form.retry"));
      card.appendChild(btn);
    }
    return card;
  }

  var page = 1;
  var hasMore = false;
  var loading = false;
  var busy = false;
  var filterLocale = "all";
  var list, more, filterBar;

  function showBanner(kind) {
    var banner = document.getElementById("letter-banner");
    var text = banner.querySelector("p");
    localize(text, "letter.form.error." + kind);
    banner.hidden = false;
    document.getElementById("letter-banner-retry").focus();
  }
  function insertLetter(item) {
    if (!list) return;
    var empty = list.querySelector("[data-wall-status]");
    if (empty) empty.remove();
    list.insertBefore(letterCard(item), list.firstChild);
  }
  function loadWall(nextPage) {
    if (loading || !list) return;
    loading = true;
    list.setAttribute("aria-busy", "true");
    if (nextPage === 1) {
      list.textContent = "";
      var skeleton = statusCard("letter.wall.loading");
      skeleton.setAttribute("data-wall-status", "loading");
      list.appendChild(skeleton);
    }
    var url = "/api/letters?page=" + nextPage + "&limit=50";
    /* "all" omits locale so the API returns every language; the backend treats
       an absent locale as no filter. */
    if (filterLocale !== "all") url += "&locale=" + encodeURIComponent(filterLocale);
    fetch(url, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }).then(function (res) {
      if (!res.ok) throw new Error("http-" + res.status);
      return res.json();
    }).then(function (json) {
      if (!json || json.code !== 0 || !json.data || !Array.isArray(json.data.items)) {
        throw new Error("bad-envelope");
      }
      if (nextPage === 1) list.textContent = "";
      var items = json.data.items.slice().sort(function (a, b) {
        return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
      });
      items.forEach(insertLetter);
      if (!items.length && nextPage === 1) {
        var empty = statusCard("letter.wall.empty");
        empty.setAttribute("data-wall-status", "empty");
        list.appendChild(empty);
      }
      page = nextPage;
      hasMore = typeof json.data.hasMore === "boolean"
        ? json.data.hasMore
        : (json.data.total || 0) > nextPage * 50;
      more.hidden = !hasMore;
    }).catch(function () {
      var card = statusCard("letter.wall.error", "wall-retry");
      card.setAttribute("data-wall-status", "error");
      if (nextPage === 1) list.textContent = "";
      list.appendChild(card);
      var btn = document.getElementById("wall-retry");
      if (btn) btn.addEventListener("click", function () { loadWall(nextPage); });
      more.hidden = true;
    }).then(function () {
      loading = false;
      list.setAttribute("aria-busy", "false");
    });
  }

  function init() {
    if (!ensureUI()) return;
    list = document.getElementById("wall-list");
    more = document.getElementById("wall-more");
    var form = document.getElementById("letter-form");
    var body = document.getElementById("letter-body");
    var name = document.getElementById("letter-name");
    var consent = document.getElementById("letter-consent");
    var submit = document.getElementById("letter-submit");
    var count = document.getElementById("letter-count");
    var privacy = document.getElementById("letter-privacy");
    var success = document.getElementById("letter-success");
    var status = document.getElementById("letter-status");
    if (!form || !body || !name || !consent || !submit || !count || !privacy ||
        !success || !status || !list || !more) return;
    var label = submit.querySelector("span");

    body.addEventListener("input", function () {
      count.textContent = body.value.length + " / 1000";
      count.classList.toggle("is-limit", body.value.length >= 1000);
    });
    body.addEventListener("focus", function () { privacy.hidden = false; }, { once: true });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (busy) return;
      clearErrors();
      var text = body.value.trim();
      var signature = name.value.trim();
      if (text.length < 20) return fieldError("body", "letter.form.error.tooShort");
      if (text.length > 1000) return fieldError("body", "letter.form.error.tooLong");
      if (signature.length > 40) return fieldError("name", "letter.form.error.name");
      if (!consent.checked) return fieldError("consent", "letter.form.consentRequired");
      busy = true;
      submit.disabled = true;
      form.setAttribute("aria-busy", "true");
      if (label) {
        label.setAttribute("data-i18n", "letter.form.sending");
        label.textContent = t("letter.form.sending");
      }
      var payload = {
        text: text,
        name: signature || null,
        locale: lang(),
        consent: true,
        website: form.elements.website ? form.elements.website.value : ""
      };
      fetch("/api/letters", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.text().then(function (raw) {
          var json = {};
          try { json = JSON.parse(raw); } catch (error) {}
          return { res: res, json: json };
        });
      }).then(function (result) {
        if (!result.res.ok || result.json.code !== 0) {
          var kind = classify(result.res.status, result.json.code);
          if (kind === "invalid") {
            fieldError("body", "letter.form.error.invalid");
          } else {
            showBanner(kind);
          }
          return null;
        }
        return result.json.data;
      }).then(function (data) {
        if (!data) return;
        form.hidden = true;
        success.hidden = false;
        status.textContent = t("letter.form.success");
        success.focus();
        insertLetter({ id: data.id, createdAt: data.createdAt, name: payload.name, text: payload.text });
        body.value = "";
        name.value = "";
        consent.checked = false;
        count.textContent = "0 / 1000";
        count.classList.remove("is-limit");
      }).catch(function () {
        showBanner("network");
      }).then(function () {
        busy = false;
        submit.disabled = false;
        form.removeAttribute("aria-busy");
        if (label) {
          label.setAttribute("data-i18n", "letter.form.submit");
          label.textContent = t("letter.form.submit");
        }
      });
    });

    document.getElementById("letter-banner-retry").addEventListener("click", function () {
      document.getElementById("letter-banner").hidden = true;
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
    });
    document.getElementById("letter-another").addEventListener("click", function () {
      success.hidden = true;
      form.hidden = false;
      clearErrors();
      body.focus();
    });
    more.addEventListener("click", function () { loadWall(page + 1); });

    if (filterBar) {
      filterBar.querySelectorAll("[data-locale]").forEach(function (button) {
        button.addEventListener("click", function () {
          var next = button.getAttribute("data-locale");
          if (next === filterLocale || loading) return;
          filterLocale = next;
          filterBar.querySelectorAll("[data-locale]").forEach(function (b) {
            b.setAttribute("aria-pressed", b === button ? "true" : "false");
          });
          loadWall(1);
        });
      });
    }
    loadWall(1);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
