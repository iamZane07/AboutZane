/* =====================================================================
   入口：读取 Markdown -> 解析 -> 渲染正文 -> 生成目录 -> 初始化交互
   以后更新网站：只改 content.md，刷新页面即可（正文和目录都会自动同步）。
   ===================================================================== */
(function (global) {
  "use strict";

  var CONTENT_FILE = "content.md";   /* 想换文件名或放到子目录，改这里 */

  Theme.init();

  /* 入场动画：进入视口时淡入上浮，只触发一次 */
  function initReveal() {
    if (!("IntersectionObserver" in global)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }

  function fail(message) {
    document.getElementById("app").innerHTML =
      '<header class="hero"><h1>内容加载失败</h1></header>' +
      '<section><div class="card"><h3>无法读取 ' + Render.esc(CONTENT_FILE) + "</h3>" +
      "<p>" + Render.esc(message) + "</p>" +
      "<p>浏览器出于安全限制，双击打开的本地 HTML 无法读取同目录的 Markdown 文件。" +
      "请改用同目录下的 <strong>打开网站.command</strong>（双击即可），它会启动一个本地服务并自动打开浏览器。</p>" +
      "<p>部署到自己的服务器或托管平台后则不需要这一步，直接访问即可。</p></div></section>";
  }

  function start(text) {
    var doc = Markdown.parse(text);
    var sections = Markdown.structure(doc.blocks);
    var meta = doc.meta;

    document.getElementById("app").innerHTML = Render.page(meta, sections);
    if (meta.title) {
      document.title = meta.overline ? meta.title + " · " + meta.overline : meta.title;
    }
    TOC.init(sections, meta);
    initReveal();
  }

  fetch(CONTENT_FILE, { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(start)
    .catch(function (err) { fail(err && err.message ? err.message : String(err)); });
})(window);
