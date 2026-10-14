#!/usr/bin/env bash
# Tăng CACHE_VERSION trong sw.js (v1 → v2 → ...). Chạy trước mỗi lần deploy
# để điện thoại đã cài app nhận bản mới (hiện snackbar "Có bản mới — Cập nhật").
set -euo pipefail
cd "$(dirname "$0")/.."

current=$(sed -nE "s/^const CACHE_VERSION = 'v([0-9]+)';.*/\1/p" sw.js)
if [ -z "$current" ]; then
  echo "Không tìm thấy dòng const CACHE_VERSION = 'vN'; trong sw.js" >&2
  exit 1
fi
next=$((current + 1))
tmp=sw.js.tmp
sed -E "s/^const CACHE_VERSION = 'v[0-9]+';/const CACHE_VERSION = 'v${next}';/" sw.js > "$tmp"
mv "$tmp" sw.js
echo "CACHE_VERSION: v${current} → v${next}"
