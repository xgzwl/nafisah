(function () {
  "use strict";

  /* Mark the document as scripted as early as possible so reveal content is
     hidden only when JavaScript can actually make it visible again. */
  document.documentElement.classList.add("js");

  /* Drop an invalid ?lang= value from the address bar; keep valid ones. */
  (function cleanLanguageParam() {
    var url = new URL(window.location.href);
    if (url.searchParams.has("lang") &&
        window.ShrineI18n.available.indexOf(url.searchParams.get("lang")) === -1) {
      url.searchParams.delete("lang");
      window.history.replaceState(null, "", url.href);
    }
  })();

  var lang = window.ShrineI18n.current();

  function refreshLanguage(next, button) {
    lang = next;
    try { window.localStorage.setItem("tr-lang", next); } catch (error) {}
    var url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url.href);

    /* Remember the trigger: re-applying i18n must not move keyboard focus. */
    var active = document.activeElement;
    window.ShrineI18n.apply(next);

    var status = document.getElementById("lang-status");
    var announcement = window.ShrineI18n.dict[next]["lang.announce"];
    if (status && typeof announcement === "string") status.textContent = announcement;

    var keep = button || active;
    if (keep && typeof keep.focus === "function" && document.contains(keep)) {
      try { keep.focus({ preventScroll: true }); } catch (error) { keep.focus(); }
    }
  }

  function markNavigation() {
    var here = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      var target = link.getAttribute("data-orig-href") || link.getAttribute("href") || "";
      var clean = target.split("?")[0].split("#")[0];
      if (clean === here || (here === "" && clean === "index.html")) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (node) { node.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (node) { observer.observe(node); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.ShrineI18n.apply(lang);
    markNavigation();

    document.querySelectorAll("[data-lang-btn]").forEach(function (button) {
      button.addEventListener("click", function () {
        refreshLanguage(button.getAttribute("data-lang-btn"), button);
      });
    });

    setupReveal();
  });
})();
