/* PWA registration — progressive enhancement, silent on failure.
   Only registers on secure contexts (https or localhost). */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  var secure = window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (!secure) return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(function () {});
  });
})();
