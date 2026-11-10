#!/bin/zsh
cd "${0:A:h}"
NODE_BIN=$(command -v node)
if [[ -z "$NODE_BIN" ]]; then
 for candidate in "$HOME"/.nvm/versions/node/*/bin/node(N); do NODE_BIN="$candidate"; done
fi
if [[ -z "$NODE_BIN" ]]; then
 echo '请先安装 Node.js 20 或更高版本，再双击运行。'
 read -k 1
 exit 1
fi
if [[ ! -f node_modules/three/build/three.module.js ]]; then
 echo '缺少依赖，请在此目录执行 npm ci 后重试。'
 read -k 1
 exit 1
fi
"$NODE_BIN" server.mjs --open
if [[ $? -ne 0 ]]; then read -k 1; fi
