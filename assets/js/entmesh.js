/**
 * EntMesh 分析接入（渐进增强，失败静默）。
 *
 * Browser Key 不写在本文件里——先向本站 /api/analytics-config 取公开配置，
 * 该端点从平台环境变量读取 pk_ publishable key，运行时返回。
 * 任何一步失败（网络/脚本加载/key 缺失）都不影响页面本身。
 */
(function () {
  "use strict";

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = url;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function boot() {
    // 1. 取公开配置（key 从服务端 env 注入，不落静态产物）
    var res = await fetch("/api/analytics-config", { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) return;
    var env = await res.json();
    var cfg = env && env.data;
    if (!cfg || !cfg.writeKey || !cfg.sdkUrl) return;

    // 2. 加载 UMD；已加载过则跳过（SPA/重复调用保护）
    if (!window.Entmesh || !window.Entmesh.init) await loadScript(cfg.sdkUrl);
    if (!window.Entmesh || !window.Entmesh.init) return;

    // 3. 初始化：默认档位（fingerprint/autocapture 均为 SDK 默认开启），
    //    显式传 endpoint 指向用户提供的 Collector；queryAllowlist 留空，
    //    SDK 会剥掉 ?lang= 等非 utm 查询参数，避免 URL 参数外泄。
    window.Entmesh.init({
      writeKey: cfg.writeKey,
      endpoint: cfg.endpoint
    });

    // 4. 手动上报一次页面浏览（autocapture 默认也会 page()，这里保证即使
    //    未来关闭自动采集仍有基础数据；重复 page 对分析无副作用）
    window.Entmesh.page();
  }

  // 页面加载完成后再跑，避免抢占首屏资源；失败一律静默。
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { boot().catch(function () {}); }, { once: true });
  } else {
    boot().catch(function () {});
  }
})();
