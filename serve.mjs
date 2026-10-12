/* 本地预览服务器：让浏览器可以读取同目录的 content.md
   用法：node serve.mjs   （或直接双击「打开网站.command」） */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon"
};

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file = join(ROOT, normalize(pathname));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 Not Found");
  }
});

function listen(port, tries = 5) {
  server.once("error", err => {
    if (err.code === "EADDRINUSE" && tries > 0) {
      console.log(`端口 ${port} 已被占用，改用 ${port + 1}。`);
      listen(port + 1, tries - 1);
    } else {
      throw err;
    }
  });
  server.listen(port, () => {
    const url = `http://localhost:${port}/`;
    console.log(`个人说明书已启动： ${url}`);
    console.log("改完 content.md 后刷新浏览器即可；关闭此窗口或按 Ctrl+C 停止服务。");
    exec(`open "${url}"`);
  });
}

listen(PORT);
