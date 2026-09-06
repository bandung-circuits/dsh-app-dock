#!/usr/bin/env bash
# dsh-app-dock transport smoke：真 dsh web 起坞，验证 client bundle 被装载且
# 注入共享注册表。坞无 RPC；"通道"即 /plugins/dsh-app-dock/client.js。
# Hermetic：临时 DSH_HOME，不碰真实 ~/.dsh。
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${DOCK_SMOKE_PORT:-43125}"
BASE="http://127.0.0.1:${PORT}"
TMP="$(mktemp -d)"
LOG="${TMP}/dsh.log"
SERVER_PID=""

cleanup() {
  if [ -n "${SERVER_PID}" ]; then kill "${SERVER_PID}" >/dev/null 2>&1 || true; fi
  rm -rf "${TMP}"
}
trap cleanup EXIT

export DSH_HOME="${TMP}/dsh_home"

dsh --profile web --help >/dev/null 2>&1
dsh plugin --profile web add "$ROOT" >/dev/null 2>&1 \
  || { echo "FAIL: dsh plugin add $ROOT"; exit 1; }

dsh --profile web --no-open --port "${PORT}" >"${LOG}" 2>&1 &
SERVER_PID=$!
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "${BASE}/" --max-time 2; then READY=1; break; fi
  sleep 1
done
if [ ${READY} -ne 1 ]; then echo "FAIL: web host did not come up"; tail -20 "${LOG}"; exit 1; fi

BODY="$(curl -s "${BASE}/plugins/dsh-app-dock/client.js" --max-time 10)"
if [ -z "${BODY}" ] || ! grep -q "__dshAppDock__" <<<"${BODY}"; then
  echo "FAIL: client bundle 未装载或未注入注册表"
  exit 1
fi
echo "OK: /plugins/dsh-app-dock/client.js served ($(wc -c <<<"${BODY}") bytes, registry present)"

echo "PASS transport smoke: dsh-app-dock client bundle live on ${BASE}"