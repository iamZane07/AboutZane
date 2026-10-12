/* =====================================================================
   渲染层：blocks -> HTML。只负责输出，复用 index.html 里已有的 CSS 类名，
   所以 Markdown 改造后视觉与交互跟原来完全一致。
   新增组件：在 RENDERERS 里加一条同名渲染函数即可。
   ===================================================================== */
(function (global) {
  "use strict";

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /* 行内语法：[文字](链接)、~~删除线~~、**加粗** */
  var fmt = function (s) {
    return esc(s)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
        var ext = /^(https?:)?\/\//.test(url) || /^mailto:/.test(url);
        return ext
          ? '<a href="' + url + '" target="_blank" rel="noopener">' + text + "</a>"
          : '<a href="' + url + '">' + text + "</a>";
      })
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  };

  function photo(g) {
    return '<figure class="photo">' +
      '<img src="' + esc(g.src) + '" alt="' + esc(g.title || "") + '" loading="lazy">' +
      "<figcaption><strong>" + fmt(g.title || "") + "</strong><span>" + fmt(g.text || "") + "</span></figcaption>" +
      "</figure>";
  }

  var RENDERERS = {
    p: function (b) { return "<p>" + fmt(b.text) + "</p>"; },
    quote: function (b) { return '<p class="quote">' + fmt(b.text) + "</p>"; },
    sign: function (b) { return '<p class="sign">' + fmt(b.text) + "</p>"; },
    hr: function () { return "<hr>"; },
    h3: function (b) { return "<h3" + (b.id ? ' id="' + b.id + '"' : "") + ">" + fmt(b.text) + "</h3>"; },
    list: function (b) {
      var tag = b.ordered ? "ol" : "ul";
      return "<" + tag + ">" + b.items.map(function (i) { return "<li>" + fmt(i) + "</li>"; }).join("") + "</" + tag + ">";
    },
    kv: function (b) {
      return '<ul class="kv">' + b.items.map(function (it) {
        return '<li><span class="k">' + fmt(it[0]) + '</span><span class="v">' + fmt(it[1]) + "</span></li>";
      }).join("") + "</ul>";
    },
    gallery: function (b) {
      if (!b.items.length) return "";
      return '<div class="gallery">' + b.items.map(photo).join("") + "</div>";
    },
    card: function (b) {
      var head = "<h3" + (b.id ? ' id="' + b.id + '"' : "") + ">" +
        (b.emoji ? '<span class="emoji">' + esc(b.emoji) + "</span>" : "") + fmt(b.title) + "</h3>";
      return '<article class="card">' + head + renderBlocks(b.blocks) + "</article>";
    }
  };

  function renderBlocks(blocks) {
    return (blocks || []).map(function (b) {
      var fn = RENDERERS[b.t];
      if (!fn && /^h[1-6]$/.test(b.t)) fn = RENDERERS.h3;   /* 更深的标题按 h3 处理 */
      if (!fn) { console.warn("[render] 未知块类型：" + b.t); return ""; }
      return fn(b);
    }).join("");
  }

  function hero(meta) {
    return '<header class="hero reveal">' +
      (meta.avatar ? '<img class="avatar" src="' + esc(meta.avatar) + '" alt="头像">' : "") +
      (meta.overline ? '<p class="overline">' + fmt(meta.overline) + "</p>" : "") +
      "<h1>" + fmt(meta.title || "") + "</h1>" +
      (meta.subtitle ? '<p class="subtitle">' + fmt(meta.subtitle) + "</p>" : "") +
      "</header>";
  }

  function page(meta, sections) {
    return hero(meta) + sections.map(function (s) {
      var head = s.title
        ? '<div class="sec-head">' +
          (s.no ? '<span class="sec-no">' + esc(s.no) + "</span>" : "") +
          "<h2>" + fmt(s.title) + "</h2></div>"
        : "";
      return '<section id="' + s.id + '" class="reveal">' + head + renderBlocks(s.blocks) + "</section>";
    }).join("") +
      (meta.footer ? '<footer class="reveal">' + fmt(meta.footer) + "</footer>" : "");
  }

  global.Render = { esc: esc, fmt: fmt, blocks: renderBlocks, page: page, renderers: RENDERERS };
})(window);
