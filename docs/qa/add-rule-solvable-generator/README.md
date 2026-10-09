# Smoke check: add-rule-solvable-generator (task 3.7, FR-27)

- **When:** 2026-10-09 11:57 to 11:59 (UTC+5:30), by the orchestrator, at commit `f077dd4` (branch `claude/suspicious-lamarr-be0fd0`).
- **(a) CLI, 4×4 seed 1:** `npm run --silent cli -- --size 4 --seed 1` run twice; the two outputs are identical: `. 0 . 0 / . 0 . . / . . . . / . . 1 .`. This differs from the old output `. 0 . 0 / 1 0 . . / . . 0 . / . . . .` (the fixture of the FR-27 test) in the givens.
- **(b) CLI, 6×6 seed 1 and 8×8 seed 20:** each run twice, with identical outputs. `time npm run --silent cli -- --size 8 --seed 20` took 0.485 s wall time, including npm and tsx start-up, against the 3 s bound. The figure is also in `../add-rule-solvable-generator-timing.txt`.
- **(c) Page:** `npx vite --port 5217` (in place of `npm run dev`, which runs the same `vite` with the same config; a fixed port only) in the built-in browser pane at a 375 × 812 viewport. The check was driven by script with `element.click()`; the script output is the evidence:
  - For each size 4×4, 6×6 and 8×8, three boards were tried: the first board after selecting the size, then two more from «Нова головоломка», confirming the dialog when it opened.
  - On each of the 9 boards, «Підказка» was pressed with no cell touched, until no empty cell remained.
  - On each board, the number of presses equalled the empty cells at the start: 11, 12 and 11 at 4×4; 27, 28 and 27 at 6×6; 45, 48 and 48 at 8×8.
  - The no-rule sentence «Жодне з трьох правил зараз не підказує наступного ходу.» appeared 0 times.
  - Each board ended with 0 empty cells and the win message «Вітаємо, головоломку розвʼязано!».
- **(d) Violation:** on a fresh 4×4 board, every empty cell of row 1 was set to 0, giving `0 0 0 0`. Four cells were marked as violations, and «Підказка» answered «Спершу виправте порушення правил, підсвічене на полі.» (FR-26, unchanged).
- **(e) Screenshots:**
  - `375-8x8-solved-by-hints.jpg` shows the third 8×8 board after its last hint, with the win message.
  - `4x4-violation-broken-hint.jpg` shows check (d). It is a half-scale shot, and the pane may have been resized at that moment, so it illustrates the check but is not layout evidence.
- **(f)** The server was stopped after the check.
- **Not verified:** the screenshots were observed, not pixel-checked; NFR-14 is held.
