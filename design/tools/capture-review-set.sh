#!/bin/zsh
cd /Users/vecktor/projects/fwdays/exam/binarka/.claude/worktrees/git-https-to-ssh-ed7693
OUT=design/v0-screenshots/review-set
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SP=$(cd "$(dirname "$0")" && pwd)
shot(){ local n=$1 u=$2 w=$3 h=$4 s=$5; local P=$(mktemp -d); local ww=$(( w<600 ? 600 : w )); perl -e 'alarm 12; exec @ARGV' "$C" --headless=new --disable-gpu --no-first-run --disable-extensions --user-data-dir="$P" --hide-scrollbars --force-device-scale-factor=2 --window-size=$ww,$h --blink-settings=preferredColorScheme=$s --virtual-time-budget=3000 --screenshot="$OUT/$n.png" "file://$SP/frame.html?w=$w&h=$h&u=$u" >/dev/null 2>&1; sips -c $((h*2)) $((w*2)) "$OUT/$n.png" >/dev/null 2>&1; rm -rf "${P:?}"; }
rm -f "${OUT:?}"/test-*.png
for page in default: rules:rules/ hint:hint/ win:win/ confirm:confirm/; do
  n=${page%%:*}; p=${page#*:}
  for wh in 320:700 375:812 768:1024 1440:900; do
    W=${wh%%:*}; H=${wh#*:}
    shot "$W-light-$n" "http://127.0.0.1:4173/$p" $W $H 1 &
    shot "$W-dark-$n" "http://127.0.0.1:4173/$p" $W $H 0 &
    wait
  done
done
ls $OUT | wc -l
