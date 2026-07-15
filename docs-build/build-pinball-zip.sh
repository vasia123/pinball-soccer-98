#!/usr/bin/env bash
# Пересобирает docs/pinball.zip из установленной игры в Wine-префиксе.
# Убирает интро-видео (DirectShow/quartz.dll отсутствует в minimal-Wine и вешает игру)
# и файл деинсталлятора.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_ROOT="$ROOT/.wine-local/prefix/drive_c/Program Files (x86)/Soccer98"
OUT="$ROOT/docs/pinball.zip"

if [ ! -d "$INSTALL_ROOT" ]; then
  echo "Не найдена установленная игра: $INSTALL_ROOT" >&2
  echo "Сначала установи игру под Wine (см. docs-build/HOWITWASMADE.md)." >&2
  exit 1
fi

rm -f "$OUT"
( cd "$INSTALL_ROOT" && zip -rq "$OUT" . -x "uninstall.exe" -x "pats/soccer98.avi" )
echo "Готово: $OUT ($(du -h "$OUT" | cut -f1))"
