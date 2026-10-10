# update-setup-sheet-start: real-browser check (task 6.1)

2026-10-10 02:42 +0530, tree `f9ddf47`. `npm run build`, served by `npx vite preview --port 4318`. Chromium (Playwright 1.64.0), headless, `reducedMotion: reduce`, the seeded `Math.random` of `e2e/helpers.ts` (seed 1). Real mouse clicks, real keys (Escape, Tab, Enter, Space) and the browser's own popover light dismiss. Script: `browser-check.mjs.txt` (run from the repo root); full log: `browser-check-run.txt` (57 PASS, 0 FAIL).

Steps (a) to (k2) of task 6.1 at 375×812 and 1280×800, each a PASS line in the log:
- (b) the summary reads «6×6 · Розминка», no size or level buttons on the page body.
- (c) the summary opens the sheet with «Почати» and «Закрити».
- (d) marking 8×8 and «Мозколамка» keeps the sheet open, focus on the pressed option, board and summary unchanged.
- (e) «Закрити», Escape and a click outside each close the sheet and discard the mark; at 375 a click on an empty cell outside the sheet closes it and leaves focus on the cell.
- (f) «Почати» starts one 8×8 · Мозколамка board, focus on the summary.
- (g) with entries, «Почати» closes the sheet first and opens the dialog on «Скасувати»; «Скасувати» changes nothing, does not reopen the sheet and drops the pair; «Так, почати» makes the 8×8 · Задачка board.
- (k2) Escape in the dialog: focus on the summary, pair dropped, sheet not reopened; a click on «Правила» closes the sheet and opens the rules panel with focus inside it («Зрозуміло» autofocus, row 71); Enter and Space on «Почати» each start the marked board.
- (h) marking 4×4 marks «Розминка», levels 2 to 4 unavailable with the reason; a (forced) press on an unavailable level does nothing; marking 6×6 removes the cue and the reason, «Розминка» stays; «Почати» with an unchanged choice makes a new board of the same size and level.
- (i) Tab order in the sheet: size options, the four levels, «Почати», «Закрити»; every control reached by Tab shows a ring.

Not exercised (the layout makes them impossible, noted in the log; waived in task 6.1): a click on «Підказка» while the sheet is open (the sheet covers it at both sizes); the cell light dismiss at 1280×800 (the centred panel covers every empty cell of that board).

**Re-run after the second fix round** (2026-10-10 about 06:20, tree `773cb6e`, the same script): 57 PASS, 0 FAIL; `browser-check-run.txt` and every screenshot below are from this run. Focus not obscured (the confirming-run defect, `focus-obscured-repro.txt` "After"), Tab to the last level option with 4×4 marked:

```
320x700 focused Мозколамка: ring bottom 621, strip top 624, scrollTop 70
1366x650 focused Мозколамка: ring bottom 497, strip top 500, scrollTop 28
```

Stills: `320x700-focus-last-level.png`, `1366x650-focus-last-level.png` (the ring fully above the footer strip).

Observed, not verified (layout is held NFR-14; sampled, not continuum):
- Footer-1 is one row at every sampled size: 375×812 «Почати» 222 px and «Закрити» 111 px wide; 1280×800 260 px and 130 px.
- Inner scroll with 4×4 marked: 320×700 scrolls (621 over 559) and 1366×650 scrolls (538 over 518); the footer stays in view and the strip fades the scrolled text out above it (second fix round) (`320x700-sheet-4x4.png`, `1366x650-sheet-4x4.png`). 375×812 and 1280×800 do not scroll.

Screenshots: `375-mount.png`, `375-sheet-marked.png`, `375-sheet-4x4.png`, `375-confirm.png`, `1280-mount.png`, `1280-sheet-marked.png`, `1280-sheet-4x4.png`, `1280-confirm.png`, `320x700-sheet-4x4.png`, `1366x650-sheet-4x4.png`. Looked at by eye: `375-sheet-marked.png` and `320x700-sheet-4x4.png` (the orchestrator; not a vision-judge).

Limit: two sizes for the steps and four for the observations; the gates are `npm run test:e2e` and `npm run check:a11y` (`../update-setup-sheet-start-green-run.txt`), also sampled.


Open layout notes for G2 (the confirming run wf_571919ed-94e, visual lens; not FR defects): at 1366×650 the centred sheet covers half of the header («Бінарка», «Правила»); the centred desktop sheet moves about 14 px when 4×4 is marked (the reason line appears), so the size control shifts under the pointer; «Почати» is outlined, not the design's filled primary (a decision for the user).
