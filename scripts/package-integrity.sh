#!/usr/bin/env bash
# Package integrity：tarball 必带宿主装载所需的全部路径。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="/tmp/dock-pack-check-$$"
mkdir -p "$BASE"
trap 'rm -rf "$BASE"' EXIT

(cd "$ROOT" && npm pack --pack-destination "$BASE" >/dev/null)
PKG_FILE="$(ls "$BASE"/*.tgz | head -1)"
[ -n "$PKG_FILE" ] || { echo "FAIL: no tarball" >&2; exit 1; }

FAIL=0
for need in \
  package/lib/index.js \
  package/lib/client.js \
  package/cordis.patch.yml \
  package/README.md \
  package/LICENSE; do
  if ! tar tzf "$PKG_FILE" | grep -qFx "$need"; then echo "FAIL: tarball missing $need" >&2; FAIL=1; fi
done

if [ "$FAIL" = "0" ]; then
  echo "package integrity OK ($(basename "$PKG_FILE"), $(tar tzf "$PKG_FILE" | wc -l | tr -d ' ') entries)"
  exit 0
fi
tar tzf "$PKG_FILE" | awk -F/ '{print NF-1, $0}' | sort -n | head -40
exit 1