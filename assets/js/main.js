(function () {
  "use strict";

  var lang = window.ShrineI18n.current();

  function refreshLanguage(next) {
    lang = next;
    try { window.localStorage.setItem("tr-lang", next); } catch (error) {}
    var url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url.href);
    window.ShrineI18n.apply(next);
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
        refreshLanguage(button.getAttribute("data-lang-btn"));
      });
    });

    setupReveal();
  });
})();
