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
# Iteration 8: another level selected («Мозколамка» at 8×8, FR-87, FR-89), at the five sizes.
for wh in 320:700 375:812 768:1024 1024:768 1440:900; do
  W=${wh%%:*}; H=${wh#*:}
  shot "$W-light-level" "http://127.0.0.1:4173/level/" $W $H 1 &
  shot "$W-dark-level" "http://127.0.0.1:4173/level/" $W $H 0 &
  wait
done
# Iteration 8: the rules panel scrolled to «Складніші прийоми» (FR-93), where the panel scrolls.
for wh in 320:700 375:812 1366:650; do
  W=${wh%%:*}; H=${wh#*:}
  shot "$W-light-rules-techniques" "http://127.0.0.1:4173/rules-techniques/" $W $H 1 &
  shot "$W-dark-rules-techniques" "http://127.0.0.1:4173/rules-techniques/" $W $H 0 &
  wait
done
# Iteration 10: the setup sheet open at 6×6 («Задачка» checked) and at 4×4 (FR-95 to FR-99, FR-91).
for page in setup:setup/ setup-four:setup-four/; do
  n=${page%%:*}; p=${page#*:}
  for wh in 320:700 375:812 768:1024 1024:768 1440:900; do
    W=${wh%%:*}; H=${wh#*:}
    shot "$W-light-$n" "http://127.0.0.1:4173/$p" $W $H 1 &
    shot "$W-dark-$n" "http://127.0.0.1:4173/$p" $W $H 0 &
    wait
  done
done
# Iteration 12: the setup sheet on the short desktop window (1366×650: the full-cover fallback).
for page in setup:setup/ setup-four:setup-four/; do
  n=${page%%:*}; p=${page#*:}
  shot "1366-light-$n" "http://127.0.0.1:4173/$p" 1366 650 1 &
  shot "1366-dark-$n" "http://127.0.0.1:4173/$p" 1366 650 0 &
  wait
done
# Iteration 14: the setup sheet with a marked choice that differs from the board shown (6×6 · Розминка
# shown; 8×8 · Головоломка marked, focus on «Почати»), and with 4×4 marked (FR-100, FR-101, FR-91).
for page in setup-marked:setup-marked/ setup-marked-four:setup-marked-four/; do
  n=${page%%:*}; p=${page#*:}
  for wh in 320:700 375:812 768:1024 1024:768 1366:650 1440:900; do
    W=${wh%%:*}; H=${wh#*:}
    shot "$W-light-$n" "http://127.0.0.1:4173/$p" $W $H 1 &
    shot "$W-dark-$n" "http://127.0.0.1:4173/$p" $W $H 0 &
    wait
  done
done
# Iteration 14: the settings panel open (theme «Як у системі», language «Українська»; FR-102, FR-107).
for wh in 320:700 375:812 768:1024 1024:768 1366:650 1440:900; do
  W=${wh%%:*}; H=${wh#*:}
  shot "$W-light-settings" "http://127.0.0.1:4173/settings/" $W $H 1 &
  shot "$W-dark-settings" "http://127.0.0.1:4173/settings/" $W $H 0 &
  wait
done
# Iteration 14: a manual theme against the system (FR-103, FR-104). The name keeps the system scheme
# second: "dark-settings-light" is «Світла» checked on a dark system, "light-settings-dark" the reverse.
for wh in 320:700 375:812 768:1024 1024:768 1440:900; do
  W=${wh%%:*}; H=${wh#*:}
  shot "$W-dark-settings-light" "http://127.0.0.1:4173/settings-light/" $W $H 0 &
  shot "$W-light-settings-dark" "http://127.0.0.1:4173/settings-dark/" $W $H 1 &
  wait
done
# Iteration 14: the desktop rules panel (R3) at 1440×900 with the techniques; 1366×650 and the plain
# rules shots at 1440×900 come from the lines above.
shot "1440-light-rules-techniques" "http://127.0.0.1:4173/rules-techniques/" 1440 900 1 &
shot "1440-dark-rules-techniques" "http://127.0.0.1:4173/rules-techniques/" 1440 900 0 &
wait
# Iteration 15: the focus ring on a theme option («Темна») in the settings panel (FR-65, FR-117).
for wh in 320:700 1366:650; do
  W=${wh%%:*}; H=${wh#*:}
  shot "$W-light-settings-focus" "http://127.0.0.1:4173/settings-focus/" $W $H 1 &
  shot "$W-dark-settings-focus" "http://127.0.0.1:4173/settings-focus/" $W $H 0 &
  wait
done
ls "$OUT" | wc -l
