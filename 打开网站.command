#!/bin/sh
# 双击我：启动本地服务并自动打开浏览器预览个人说明书。
# 关闭弹出的终端窗口即可停止服务。
cd "$(dirname "$0")" || exit 1

NODE="$(command -v node)"
if [ -z "$NODE" ]; then
  for p in /opt/homebrew/bin/node /usr/local/bin/node "$HOME"/.nvm/versions/node/*/bin/node; do
    [ -x "$p" ] && NODE="$p" && break
  done
fi

if [ -z "$NODE" ]; then
  echo "没有找到 Node.js，改用系统自带的 Python 启动。"
  URL="http://localhost:5173/"
  ( sleep 1; open "$URL" ) &
  exec python3 -m http.server 5173
fi

exec "$NODE" serve.mjs
