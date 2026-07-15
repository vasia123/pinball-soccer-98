#!/bin/bash
# Build the retrowin32/wasm Soccer Pinball 98 web build and stage it into docs/
# (replacing the old BoxedWine deploy).  Run from anywhere.
set -e

RETRO=/home/vasis/projects_hobby/retrowin32
PROJ=/home/vasis/projects_hobby/pinball-soccer-98
DOCS=$PROJ/docs
GAME=$PROJ/game_run

echo ">> 1/5 building wasm (release)…"
(cd "$RETRO/web/glue" && profile=release ./build.sh)

echo ">> 2/5 bundling TypeScript…"
(cd "$RETRO/web" && node_modules/.bin/esbuild --bundle soccer.tsx \
  --format=esm --outfile="$DOCS/soccer.bundle.js" --minify --sourcemap)

echo ">> 3/5 copying wasm + html…"
cp "$RETRO/web/glue/pkg/glue_bg.wasm" "$DOCS/wasm.wasm"
cp "$RETRO/web/soccer.html" "$DOCS/index.html"

echo ">> 4/5 copying game files + manifest…"
rm -rf "$DOCS/game"
mkdir -p "$DOCS/game"
cp -rL "$GAME/." "$DOCS/game/"    # -L: dereference the Soccer98/pats symlink
(cd "$DOCS/game" && find . -type f ! -name manifest.json | sed 's|^\./||' | sort > /tmp/rw_manifest.txt)
python3 -c "import json; print(json.dumps([l.rstrip('\n') for l in open('/tmp/rw_manifest.txt')]))" \
  > "$DOCS/game/manifest.json"
echo "   $(wc -l < /tmp/rw_manifest.txt) files, $(du -sh "$DOCS/game" | cut -f1)"

echo ">> 5/5 removing old BoxedWine deploy…"
rm -f "$DOCS"/boxedwine.* "$DOCS"/boxedwine-shell.js "$DOCS"/pinball.zip "$DOCS"/coi-serviceworker.js

echo ">> done. docs/ now serves retrowin32."
ls -la "$DOCS"
