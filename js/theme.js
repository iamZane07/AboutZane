/* 深浅色切换：默认跟随系统，手动切换后记住选择 */
(function (global) {
  "use strict";

  var ICON_SUN = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="3.1"/><path d="M8 1.2v1.8M8 13v1.8M1.2 8h1.8M13 8h1.8M3.2 3.2l1.3 1.3M11.5 11.5l1.3 1.3M12.8 3.2l-1.3 1.3M4.5 11.5l-1.3 1.3"/></svg>';
  var ICON_MOON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M13.4 9.6a5.6 5.6 0 0 1-7-7 5.6 5.6 0 1 0 7 7Z"/></svg>';

  global.Theme = {
    init: function () {
      var mq = global.matchMedia("(prefers-color-scheme: dark)");
      var saved = null;
      try { saved = localStorage.getItem("theme"); } catch (e) {}

      function apply(dark) {
        document.documentElement.dataset.theme = dark ? "dark" : "light";
        document.querySelectorAll(".theme-toggle").forEach(function (b) {
          b.innerHTML = dark ? ICON_SUN : ICON_MOON;
        });
      }

      apply(saved ? saved === "dark" : mq.matches);
      mq.addEventListener("change", function (e) { if (!saved) apply(e.matches); });

      document.querySelectorAll(".theme-toggle").forEach(function (b) {
        b.addEventListener("click", function () {
          var dark = document.documentElement.dataset.theme !== "dark";
          apply(dark);
          saved = dark ? "dark" : "light";
          try { localStorage.setItem("theme", saved); } catch (e) {}
        });
      });
    }
  };
})(window);
