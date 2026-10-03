#!/usr/bin/env bash
# L5 install smoke: README 安装路径（`dsh plugin add dsh-app-dock`），封闭可重复。
# 默认打当前仓库 tarball；DOCK_INSTALL_SPEC=dsh-app-dock 时从 npm 装。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${DOCK_INSTALL_PORT:-43997}"
BASE="/tmp/dock-install-smoke-$$"

command -v dsh >/dev/null 2>&1 || { echo "skip: 'dsh' CLI not found" >&2; exit 2; }
command -v pnpm >/dev/null 2>&1 || { echo "skip: 'pnpm' not found" >&2; exit 2; }

mkdir -p "$BASE"
trap 'rm -rf "$BASE"' EXIT

export DSH_HOME="$BASE/dsh_home"

SPEC="${DOCK_INSTALL_SPEC:-}"
if [ -n "$SPEC" ]; then
  PKG="$SPEC"; MODE="registry:${SPEC}"
else
  DEST="$BASE/pkg"; mkdir -p "$DEST"
  (cd "$ROOT" && npm pack --pack-destination "$DEST" >/dev/null)
  PKG_FILE="$(ls "$DEST"/*.tgz | head -1)"
  [ -n "$PKG_FILE" ] || { echo "FAIL: no tarball" >&2; exit 1; }
  FAIL=0
  for need in package/lib/index.js package/lib/client.js package/cordis.patch.yml package/README.md; do
    if ! tar tzf "$PKG_FILE" | grep -qFx "$need"; then echo "FAIL: tarball missing $need" >&2; FAIL=1; fi
  done
  [ "$FAIL" = "0" ] || exit 1
  PKG="$PKG_FILE"; MODE="local-tarball:$(basename "$PKG_FILE")"
fi

dsh --profile web --help >/dev/null 2>&1
dsh plugin --profile web add "$PKG" >/dev/null 2>&1 || { echo "FAIL: dsh plugin add $PKG" >&2; exit 1; }

PLUGIN_ROOT="$DSH_HOME/profiles/web/node_modules/dsh-app-dock"
for f in lib/index.js lib/client.js cordis.patch.yml package.json; do
  [ -f "$PLUGIN_ROOT/$f" ] || { echo "FAIL: installed package missing $f" >&2; exit 1; }
done
grep -q 'dsh-app-dock' "$DSH_HOME/profiles/web/package.json" || { echo "FAIL: profile manifest does not list dsh-app-dock" >&2; exit 1; }

dsh --profile web --no-open --port "$PORT" >"$BASE/dsh.log" 2>&1 &
DPID=$!
trap 'kill "$DPID" 2>/dev/null || true; rm -rf "$BASE"' EXIT

ready=0
for _ in $(seq 1 90); do
  # 0.2.x 起 web host 强制 token 鉴权，未认证请求回 401；端口应答即视为就绪。
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/" 2>/dev/null || true)
  case "$code" in 2*|3*|4*) ready=1; break ;; esac
  sleep 0.5
done
[ "$ready" = "1" ] || { echo "FAIL: dsh web not ready" >&2; tail -20 "$BASE/dsh.log"; exit 1; }

# 0.2.x 起要带 token：从 dsh 日志抓入口 URL，先换 cookie 认证，再验证宿主
# 真正把坞挂进 web 页（页面可达且应用坞注入成功）。client bundle 本身在
# 0.2.x 走懒加载 + rev 校验的 combo 路由，直连 URL 404 是协议行为，这里不再
# 直取 bundle；bundle 内容契约由 `npm run verify` 的装配检查覆盖。
TOKEN_URL="$(grep -o "http://127.0.0.1:${PORT}/?token=[A-Za-z0-9_-]*" "$BASE/dsh.log" | head -1)"
[ -n "$TOKEN_URL" ] || { echo "FAIL: no token URL in dsh log" >&2; tail -20 "$BASE/dsh.log"; exit 1; }
code="$(curl -s -c "$BASE/cookies" -L -o "$BASE/page.html" -w "%{http_code}" "$TOKEN_URL")"
case "$code" in 2*|3*) ;; *) echo "FAIL: boot page unreachable (HTTP $code)" >&2; exit 1 ;; esac
grep -q "DSH_BOOT\|client-modules" "$BASE/page.html" || { echo "FAIL: boot page does not carry the module bootstrap" >&2; exit 1; }
grep -q "dsh-app-dock" "$DSH_HOME/profiles/web/package.json" || { echo "FAIL: profile manifest lost dsh-app-dock" >&2; exit 1; }

echo "install smoke OK (${MODE}, port ${PORT})"