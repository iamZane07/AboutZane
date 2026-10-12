/* =====================================================================
   Markdown 解析器：把 content.md 解析成结构化的 blocks
   职责单一：只做「文本 -> 数据」，不产生任何 HTML。
   新增组件类型：在下面的 COMPONENTS 里注册一个解析函数即可，
   再到 render.js 的 RENDERERS 里注册它的 HTML 输出。
   ===================================================================== */
(function (global) {
  "use strict";

  var HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
  var UL_RE = /^\s*[-*+]\s+(.*)$/;
  var OL_RE = /^\s*(\d+)[.)]\s+(.*)$/;
  var QUOTE_RE = /^>\s?(.*)$/;
  var FENCE_RE = /^:::\s*([A-Za-z][\w-]*)\s*(.*)$/;
  var FENCE_END_RE = /^:::\s*$/;
  var IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*(.*)$/;
  var HR_RE = /^(-{3,}|\*{3,}|_{3,})$/;
  var NUMBER_RE = /^(\d{1,3})\s*[.、．)：:]\s*(.+)$/;
  var EMOJI_RE = /^(\p{Extended_Pictographic}\S*)\s*([\s\S]*)$/u;
  var PICTO_RE = /\p{Extended_Pictographic}/gu;

  /* ---------- 工具 ---------- */

  function isBlockStart(raw) {
    var line = raw.trim();
    return !line ||
      /^:::/.test(line) ||
      /^<!--/.test(line) ||
      HEADING_RE.test(raw) ||
      QUOTE_RE.test(line) ||
      UL_RE.test(raw) ||
      OL_RE.test(raw) ||
      IMAGE_RE.test(line) ||
      HR_RE.test(line);
  }

  /* 中文之间换行直接相连，遇到西文字符补一个空格 */
  var CJK_PUNCT = /[。，、；：？！「」『』（）《》〈〉…—·“”‘’]/;
  function needSpace(a, b) {
    var x = a.slice(-1), y = b.charAt(0);
    if (CJK_PUNCT.test(x) || CJK_PUNCT.test(y)) return false;
    return /[\w)\]"']/.test(x) || /[\w(\["']/.test(y);
  }

  function joinLines(lines) {
    var out = "";
    lines.forEach(function (raw) {
      var s = raw.trim();
      if (!s) return;
      if (!out) { out = s; return; }
      out += (needSpace(out, s) ? " " : "") + s;
    });
    return out;
  }

  function rows(lines) {
    return lines.map(function (l) { return l.trim(); })
      .filter(function (l) { return l && !/^<!--/.test(l); });
  }

  function splitRow(line) {
    var parts = line.split("|");
    return parts.map(function (p) { return p.trim(); });
  }

  function skipComment(lines, i) {
    if (/-->/.test(lines[i])) return i + 1;
    var j = i + 1;
    while (j < lines.length && !/-->/.test(lines[j])) j++;
    return j + 1;
  }

  /* 读取 ::: 组件体，支持同类组件嵌套（用深度计数配对） */
  function readFence(lines, start) {
    var depth = 1, i = start + 1, inner = [];
    while (i < lines.length) {
      var t = lines[i].trim();
      if (/^:::/.test(t)) {
        if (FENCE_END_RE.test(t)) {
          depth--;
          if (depth === 0) { i++; break; }
        } else if (FENCE_RE.test(t)) {
          depth++;
        }
      }
      inner.push(lines[i]);
      i++;
    }
    return { inner: inner, next: i };
  }

  /* ---------- 自定义组件注册表 ---------- */

  var COMPONENTS = {
    /* ::: kv  →  键值对列表，每行「键 | 值」 */
    kv: function (args, inner) {
      return {
        t: "kv",
        items: rows(inner).map(function (l) {
          var p = splitRow(l);
          return [p[0] || "", p.slice(1).join(" | ")];
        })
      };
    },

    /* ::: gallery  →  图片画廊，每行「图片 | 标题 | 说明」 */
    gallery: function (args, inner) {
      return {
        t: "gallery",
        items: rows(inner).map(function (l) {
          var p = splitRow(l);
          return { src: p[0] || "", title: p[1] || "", text: p[2] || "" };
        })
      };
    },

    /* ::: card 🐈 标题  →  卡片，内部可以继续写 Markdown（含嵌套组件） */
    card: function (args, inner) {
      var text = args.trim();
      var m = EMOJI_RE.exec(text);
      var hasEmoji = m && m[2].trim();
      return {
        t: "card",
        emoji: hasEmoji ? m[1] : "",
        title: hasEmoji ? m[2].trim() : text,
        blocks: parseBlocks(inner)
      };
    },

    /* ::: quote  →  左侧粉色竖线引用 */
    quote: function (args, inner) { return { t: "quote", text: joinLines(inner) }; },

    /* ::: sign  →  右对齐署名 */
    sign: function (args, inner) { return { t: "sign", text: joinLines(inner) }; }
  };

  function makeComponent(name, args, inner) {
    var fn = COMPONENTS[name];
    if (!fn) {
      console.warn("[markdown] 未注册的组件 ::: " + name + "，已按普通内容渲染");
      return parseBlocks(inner);
    }
    return fn(args || "", inner);
  }

  /* ---------- 块级解析 ---------- */

  function parseBlocks(lines) {
    var out = [], i = 0;
    while (i < lines.length) {
      var raw = lines[i], line = raw.trim();

      if (!line) { i++; continue; }
      if (/^<!--/.test(line)) { i = skipComment(lines, i); continue; }

      var fence = FENCE_RE.exec(line);
      if (fence) {
        var f = readFence(lines, i);
        var made = makeComponent(fence[1], fence[2], f.inner);
        if (Array.isArray(made)) out = out.concat(made);
        else if (made) out.push(made);
        i = f.next;
        continue;
      }

      var h = HEADING_RE.exec(raw);
      if (h) {
        out.push({ t: "h" + h[1].length, text: h[2].trim() });
        i++;
        continue;
      }

      if (QUOTE_RE.test(line)) {
        var q = [];
        while (i < lines.length && QUOTE_RE.test(lines[i].trim())) {
          q.push(QUOTE_RE.exec(lines[i].trim())[1]);
          i++;
        }
        out.push({ t: "quote", text: joinLines(q) });
        continue;
      }

      if (UL_RE.test(raw)) {
        var items = [];
        while (i < lines.length && UL_RE.test(lines[i])) {
          items.push(UL_RE.exec(lines[i])[1].trim());
          i++;
        }
        out.push({ t: "list", items: items });
        continue;
      }

      if (OL_RE.test(raw)) {
        var oitems = [];
        while (i < lines.length && OL_RE.test(lines[i])) {
          oitems.push(OL_RE.exec(lines[i])[2].trim());
          i++;
        }
        out.push({ t: "list", ordered: true, items: oitems });
        continue;
      }

      var img = IMAGE_RE.exec(line);
      if (img) {
        out.push({ t: "gallery", items: [{ src: img[2], title: img[1], text: img[3] || "" }] });
        i++;
        continue;
      }

      if (HR_RE.test(line)) { out.push({ t: "hr" }); i++; continue; }

      var para = [];
      while (i < lines.length && !isBlockStart(lines[i])) { para.push(lines[i]); i++; }
      if (para.length) out.push({ t: "p", text: joinLines(para) });
      else i++;
    }
    return out;
  }

  /* ---------- 前置信息 ---------- */

  function splitFrontMatter(src) {
    var text = src.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    /* 允许在 --- 之前写说明注释 */
    var lead = /^(?:[ \t]*<!--[\s\S]*?-->[ \t]*)*/.exec(text)[0];
    var rest = text.slice(lead.length).replace(/^\s+/, "");
    var m = /^---\n([\s\S]*?)\n---\n?/.exec(rest);
    if (!m) return { meta: {}, body: text };
    var meta = {};
    m[1].split("\n").forEach(function (line) {
      if (!line.trim() || /^#/.test(line.trim())) return;
      var k = line.indexOf(":");
      if (k > 0) meta[line.slice(0, k).trim()] = line.slice(k + 1).trim();
    });
    return { meta: meta, body: rest.slice(m[0].length) };
  }

  /* ---------- 章节结构化 + 锚点 ID ---------- */

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function label(text) { return String(text || "").replace(PICTO_RE, "").trim(); }

  /* 把扁平 blocks 按 ## 切成章节，并给每个标题分配唯一锚点 */
  function structure(blocks) {
    var sections = [], used = Object.create(null);
    var current = null, count = 0;

    function unique(id) {
      var base = id, n = 2;
      while (used[base]) base = id + "-" + n++;
      used[base] = true;
      return base;
    }

    function ensure() {
      if (!current) {
        current = { no: "", title: "", id: unique("s-lead"), blocks: [], toc: [] };
        sections.push(current);
      }
      return current;
    }

    /* 递归收集会进目录的标题（### 与卡片标题），并分配唯一锚点 */
    function walk(b, sec) {
      if (b.t === "card" || b.t === "h3") {
        b.id = unique(sec.id + "-" + (sec.toc.length + 1));
        sec.toc.push({ id: b.id, label: label(b.t === "card" ? b.title : b.text) });
      }
      if (b.blocks) b.blocks.forEach(function (x) { walk(x, sec); });
    }

    blocks.forEach(function (b) {
      if (b.t === "h2") {
        count++;
        var m = NUMBER_RE.exec(b.text);
        var no = m ? m[1] : pad(count);
        current = {
          no: no,
          title: m ? m[2].trim() : b.text,
          id: unique("s-" + no),
          blocks: [],
          toc: []
        };
        sections.push(current);
        return;
      }
      if (b.t === "h1") b = { t: "h3", text: b.text };   /* 一级标题当小节用 */
      var sec = ensure();
      sec.blocks.push(b);
      walk(b, sec);
    });

    return sections;
  }

  function parse(src) {
    var fm = splitFrontMatter(src);
    return { meta: fm.meta, blocks: parseBlocks(fm.body.split("\n")) };
  }

  global.Markdown = {
    parse: parse,
    structure: structure,
    parseBlocks: parseBlocks,
    components: COMPONENTS   /* 扩展新组件时直接往这里加 */
  };
})(window);
