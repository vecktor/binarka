#!/bin/zsh
# Captures the design review set from the v0 design served on 127.0.0.1:4173
# (python3 -m http.server 4173 --bind 127.0.0.1 -d design/v0/out).
# Usage: design/tools/capture-review-set.sh [output directory, default design/v0-screenshots/review-set]
# Shots are taken with reduced motion forced: headless virtual time does not finish CSS
# animations (the win glow was caught mid-way), and every motion ends at the static style.
SP=$(cd "$(dirname "$0")" && pwd)
cd "$SP/../.." || exit 1
OUT=${1:-design/v0-screenshots/review-set}
mkdir -p "$OUT"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot(){ local n=$1 u=$2 w=$3 h=$4 s=$5; local P=$(mktemp -d); local ww=$(( w<600 ? 600 : w )); perl -e 'alarm 12; exec @ARGV' "$C" --headless=new --disable-gpu --no-first-run --disable-extensions --user-data-dir="$P" --hide-scrollbars --force-device-scale-factor=2 --window-size=$ww,$h --blink-settings=preferredColorScheme=$s --force-prefers-reduced-motion --virtual-time-budget=3000 --screenshot="$OUT/$n.png" "file://$SP/frame.html?w=$w&h=$h&u=$u" >/dev/null 2>&1; sips -c $((h*2)) $((w*2)) "$OUT/$n.png" >/dev/null 2>&1; rm -rf "${P:?}"; }
rm -f "${OUT:?}"/test-*.png(N)
for page in default: rules:rules/ hint:hint/ win:win/ confirm:confirm/ four:four/ eight:eight/; do
  n=${page%%:*}; p=${page#*:}
  for wh in 320:700 375:812 768:1024 1024:768 1440:900; do
    W=${wh%%:*}; H=${wh#*:}
    shot "$W-light-$n" "http://127.0.0.1:4173/$p" $W $H 1 &
    shot "$W-dark-$n" "http://127.0.0.1:4173/$p" $W $H 0 &
    wait
  done
done
# A short desktop window: the cell-size floor (decision 22).
for page in default: rules:rules/ eight:eight/; do
  n=${page%%:*}; p=${page#*:}
  shot "1366-light-$n" "http://127.0.0.1:4173/$p" 1366 650 1 &
  shot "1366-dark-$n" "http://127.0.0.1:4173/$p" 1366 650 0 &
  wait
done
# The logo mark at 40, 56 and 64 px (decision 15).
shot "logo-light" "http://127.0.0.1:4173/logo/" 375 160 1 &
shot "logo-dark" "http://127.0.0.1:4173/logo/" 375 160 0 &
wait
ls "$OUT" | wc -l
