/* =====================================================================
   目录导航：完全由 Markdown 解析出的 sections 模型生成，无需手工维护。
   - 两级目录（## 章节 + ### / 卡片标题）
   - sticky 侧边栏，目录过长时在内部独立滚动
   - 滚动高亮当前章节；只有高亮项越界时才平滑滚回（带节流，避免抖动）
   - 手机端抽屉 + 子目录折叠
   ===================================================================== */
(function (global) {
  "use strict";

  var ICON_CHEVRON = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
  var esc = global.Render.esc;

  function shortTitle(title) { return title.split(/[｜|]/)[0].trim(); }

  function build(sections, meta) {
    var nav = document.getElementById("sideNav");
    document.querySelector(".side-brand").textContent = meta.title || "";
    var listed = sections.filter(function (s) { return s.title; });
    /* 任意锚点 -> 所属章节，高亮时用它反查父级目录项 */
    var sectionOf = Object.create(null);
    listed.forEach(function (s) {
      sectionOf[s.id] = s.id;
      (s.toc || []).forEach(function (t) { sectionOf[t.id] = s.id; });
    });
    nav.innerHTML = listed.map(function (s) {
      var subs = (s.toc || []).map(function (t) {
        return '<a href="#' + t.id + '">' + esc(t.label) + "</a>";
      }).join("");
      return '<div class="nav-group">' +
        '<div class="l1row">' +
        '<a href="#' + s.id + '"><span class="n">' + esc(s.no) + "</span>" + esc(shortTitle(s.title)) + "</a>" +
        (subs ? '<button class="sub-toggle" aria-label="展开子目录" aria-expanded="false">' + ICON_CHEVRON + "</button>" : "") +
        "</div>" +
        (subs ? '<div class="subs">' + subs + "</div>" : "") +
        "</div>";
    }).join("");
    return { nav: nav, sectionOf: sectionOf };
  }

  /* 手机端抽屉 */
  function initDrawer(nav) {
    var menuBtn = document.getElementById("menuBtn");
    var setNav = function (open) {
      document.body.classList.toggle("nav-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    };
    menuBtn.addEventListener("click", function () {
      setNav(!document.body.classList.contains("nav-open"));
    });
    document.getElementById("backdrop").addEventListener("click", function () { setNav(false); });
    nav.addEventListener("click", function (e) {
      var toggle = e.target.closest(".sub-toggle");
      if (toggle) {
        var group = toggle.closest(".nav-group");
        toggle.setAttribute("aria-expanded", String(group.classList.toggle("open")));
        return;
      }
      if (e.target.closest("a")) setNav(false);
    });
  }

  /* 滚动高亮 + 越界时平滑跟随 */
  function initSpy(nav, sectionOf) {
    var links = [].slice.call(nav.querySelectorAll("a"));
    var targets = links
      .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
      .filter(Boolean);
    if (!targets.length) return;

    var lastAutoScroll = 0;

    function keepVisible(el) {
      if (!el || global.innerWidth <= 880) return;
      var now = Date.now();
      if (now - lastAutoScroll < 250) return;
      var box = nav.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      var delta = 0;
      if (r.top < box.top + 8) delta = r.top - box.top - 8;
      else if (r.bottom > box.bottom - 8) delta = r.bottom - box.bottom + 8;
      if (!delta) return;
      lastAutoScroll = now;
      nav.scrollTo({ top: nav.scrollTop + delta, behavior: "smooth" });
    }

    function spy() {
      var line = global.scrollY + global.innerHeight * 0.3;
      var current = targets[0];
      targets.forEach(function (el) {
        if (el.getBoundingClientRect().top + global.scrollY <= line) current = el;
      });
      if (global.innerHeight + global.scrollY >= document.documentElement.scrollHeight - 4) {
        current = targets[targets.length - 1];
      }
      var secHref = "#" + (sectionOf[current.id] || current.id);
      links.forEach(function (a) {
        var href = a.getAttribute("href");
        a.classList.toggle("active", href === "#" + current.id || href === secHref);
      });
      keepVisible(nav.querySelector(".subs a.active") || nav.querySelector(".l1row a.active"));
    }

    /* 用 rAF 合并滚动/缩放事件，避免高频读取布局造成卡顿 */
    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; spy(); });
    }

    global.addEventListener("scroll", onScroll, { passive: true });
    global.addEventListener("resize", onScroll, { passive: true });
    spy();
  }

  global.TOC = {
    init: function (sections, meta) {
      var built = build(sections, meta);
      initDrawer(built.nav);
      initSpy(built.nav, built.sectionOf);
    }
  };
})(window);
