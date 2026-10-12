# AboutZane · 个人说明书模板

一份 **纯静态、零依赖** 的个人说明书（Personal Manual）单页网站模板。
所有内容都写在一份 `content.md` 里，页面正文、左侧目录、锚点、滚动高亮全部自动生成 —— 改内容不需要碰 HTML 和 JavaScript。

视觉风格参考 Apple 官网：纯白背景、低饱和淡粉主色、系统无衬线字体、大量留白、深浅色自适应。

仓库：<https://github.com/iamZane07/AboutZane>

---

## 特性

- **Markdown 是唯一内容源**：正文、章节、卡片、图片都在 `content.md`
- **目录自动生成**：解析 `##` / `###` 与卡片标题，动态生成两级侧边栏；增删改标题、调整顺序都会自动同步
- **锚点与滚动高亮**：每个标题自动生成稳定唯一的 ID，滚动时高亮当前章节，目录过长时内部独立滚动并平滑跟随
- **自定义组件**：`kv` / `card` / `gallery` / `quote` / `sign`，可在任意章节插入任意数量，支持嵌套
- **深浅色**：默认跟随系统，手动切换后用 `localStorage` 记住选择
- **响应式**：桌面 / 平板 / 手机自适应，手机端目录收进抽屉，子目录可折叠
- **零构建**：没有 npm 依赖、没有打包步骤，任意静态托管直接可用

## 快速开始

### 方式一：双击运行（macOS）

双击 `打开网站.command`，会自动启动本地服务并打开浏览器。关闭弹出的终端窗口即停止服务。

> 为什么需要本地服务？浏览器出于安全限制，禁止双击打开的本地 HTML 用 `fetch` 读取同目录文件。直接双击 `index.html` 会看到一张提示卡片，不会白屏。

### 方式二：命令行

```bash
# 需要 Node.js（无第三方依赖）
node serve.mjs            # 默认 http://localhost:5173

# 或者用 Python
python3 -m http.server 5173
```

### 方式三：部署上线

整个文件夹就是网站根目录，直接上传即可：

- **GitHub Pages**：把仓库推上去，在 Settings → Pages 选择分支和 `/ (root)` 目录。所有资源都用相对路径，项目页子目录也能正常访问。
- **Vercel / Netlify / Cloudflare Pages**：导入仓库，构建命令留空，输出目录填 `.`（或 `/`）。
- **自己的服务器 / OSS / 对象存储**：把文件原样传上去即可。

部署后不需要本地服务，访问网址就能看到最新内容。

## 目录结构

```
.
├── content.md          ← 唯一内容源，日常只改这个
├── index.html          ← 页面骨架 + 全部 CSS
├── js/
│   ├── markdown.js     ← Markdown 解析（含自定义组件注册表 COMPONENTS）
│   ├── render.js       ← 数据 → HTML（渲染注册表 RENDERERS）
│   ├── toc.js          ← 目录生成 + 滚动高亮 + 手机抽屉
│   ├── theme.js        ← 深浅色切换
│   └── app.js          ← 入口：读取 → 解析 → 渲染 → 初始化
├── assets/             ← 示例图片（换成你自己的）
├── serve.mjs           ← 本地预览服务（无依赖，端口占用会自动顺延）
└── 打开网站.command     ← macOS 双击启动
```

## 怎么写内容

打开 `content.md`，文件顶部有一段完整的语法说明注释。下面是速查。

### 页面信息

写在文件最前面的 `---` 之间，一行一个 `键: 值`：

```yaml
---
avatar: assets/avatar.svg
overline: Personal Manual
title: 个人说明书
subtitle: 大标题下方的一句说明。
footer: © 2026 Your Name · [GitHub](https://github.com/iamZane07/AboutZane)
---
```

### 章节与小节

```markdown
## 01. 关于我              <!-- 开头的数字就是章节编号，不写会自动补 -->
## 02. 性格 ｜ 我是一个怎样的人？   <!-- 目录里只显示「｜」前面的「性格」 -->

### 我的性格               <!-- 三级标题自动进目录，并生成锚点 -->
```

### 普通语法

```markdown
段落直接写，空一行分段。

- 无序列表
- 第二项

1. 有序列表
2. 第二项

> 引用（左侧粉色竖线）

**加粗**、~~删除线~~、[链接](https://example.com)、[站内跳转](#s-01)

---
```

### 自定义组件

用 `:::` 包裹，可以放在任意章节、任意位置，数量与顺序都由 Markdown 决定，内部还能嵌套别的组件。

**键值对**

```markdown
::: kv
称呼 | 你的名字
身份 | 大学生
:::
```

**卡片**（第一个参数是 emoji，后面是标题；标题会自动进目录）

```markdown
::: card 📷 摄影
卡片正文，空一行分段。

- 卡片里也能写列表
:::
```

**图片画廊**（每行 `图片 | 标题 | 说明`）

```markdown
::: gallery
assets/placeholder-1.svg | 图片标题 | 图片说明
assets/placeholder-2.svg | 图片标题 | 图片说明
:::
```

**卡片里套画廊**

```markdown
::: card 🐈 猫咪
家里养了两只猫。

::: gallery
assets/placeholder-1.svg | 咪咪 | 说明文字
:::
:::
```

**引用块 / 署名**

```markdown
::: quote
一段较长的引用。
:::

::: sign
—— 你的名字
:::
```

**单张图片**也可以直接用标准写法：

```markdown
![图片标题](assets/placeholder-1.svg) 图片说明写在括号后面。
```

### 换图片

把图片放进 `assets/`（或根目录），在 `content.md` 里写上文件名即可；用外链图片则直接写完整网址。

## 扩展新组件

两处注册，不用改其他逻辑：

1. `js/markdown.js` 的 `COMPONENTS` 里加一个解析函数，接收 `(args, innerLines)`，返回一个 block 对象；
2. `js/render.js` 的 `RENDERERS` 里加一个同名渲染函数，返回 HTML 字符串；
3. 需要新样式就把 CSS 写进 `index.html`。

未注册的 `::: xxx` 不会报错，会按普通内容渲染并在控制台给出提示。

## 常见问题

**改完 content.md 页面没变化？**
强制刷新一次：macOS `Cmd + Shift + R`，Windows `Ctrl + F5`。

**双击 index.html 显示「内容加载失败」？**
这是浏览器的 `file://` 限制，改用 `打开网站.command`（或 `node serve.mjs`）即可。

**目录高亮不准？**
高亮以「视口上方 30% 处」为准，滚动到底部时自动选中最后一项。
