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
  if curl -sf "http://127.0.0.1:${PORT}/" -o /dev/null 2>/dev/null; then ready=1; break; fi
  sleep 0.5
done
[ "$ready" = "1" ] || { echo "FAIL: dsh web not ready" >&2; tail -20 "$BASE/dsh.log"; exit 1; }

BODY="$(curl -s "http://127.0.0.1:${PORT}/plugins/dsh-app-dock/client.js")"
echo "$BODY" | grep -q "__dshAppDock__" || { echo "FAIL: client bundle missing registry" >&2; exit 1; }

echo "install smoke OK (${MODE}, port ${PORT})"