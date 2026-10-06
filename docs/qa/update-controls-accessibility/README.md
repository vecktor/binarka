# Real-browser check of update-controls-accessibility (tasks 3.7)

2026-10-06 about 10:10 (UTC+5:30), built-in browser (Chromium), `npx vite --port 5302 --strictPort` from worktree `heuristic-lovelace-5e57b4` at the green commit `b43c855`, 375×812 and 1280×800. Focus, placement and touch targets are **observed, not verified** (held NFR-11, NFR-12, NFR-13). State claims rest on script checks: the browser pane's screenshots lagged the DOM twice in this run (a second screenshot showed the real state; see `docs/qa/add-hinted-cell/README.md`, capture note).

| Step | Observation | Evidence |
|---|---|---|
| Mount at 375 | Segmented control «Поле 4×4», «Поле 6×6» (selected), «Поле 8×8»; cells are `BUTTON`; no horizontal scroll | `375-mount-b43c855.jpg` |
| (b) No moves: «Нова головоломка», «Поле 4×4», «Поле 6×6», «Скинути» | Each acted at once (36, 16, 36 cells; reset of an untouched board changes nothing); no dialog | script check |
| (c) Two cells clicked, «Нова головоломка» | Dialog «Почати заново? Ваші ходи на цьому полі буде втрачено.» with «Так, почати» and «Скасувати»; board behind unchanged; mouse click on «Скасувати»: dialog closed, moves still there | `375-confirm-dialog-b43c855.jpg`, script check |
| (d) Mouse click «Поле 8×8», Escape | Dialog closed; board, 36 cells and `aria-checked` on «Поле 6×6» unchanged | script check |
| (e) «Поле 8×8», Enter on the focused «Так, почати» | 64 cells, «Поле 8×8» checked; focus ring on the size button | `375-8x8-after-confirm-b43c855.jpg` |
| (f) Press the shown «Поле 8×8» | No dialog, board unchanged | script check |
| (g) «Підказка», «Скинути» | Dialog asked; «Так, почати» emptied the hinted cell («Рядок 2, стовпець 6, 1, підказка» before) and removed the marker | script check |
| (g) Solve a 4×4 board (filled from the engine's `isSolved`), «Скинути» | Win message shown; reset asked after the win (A-28); «Скасувати» kept the win | script check |
| (h) Tab from the page with real Tab presses | «Правила», «Поле 4×4», «Поле 6×6», «Поле 8×8», cells 1,1 to 4,4 in reading order (givens included), «Підказка», «Скинути», «Нова головоломка», then wraps | `focusin` log |
| (h) Space, then Enter on an empty cell; right arrow | Space wrote 0, Enter wrote 1; the arrow key changed nothing and kept focus | script check |
| (h) Space on «Поле 6×6» with entries | Dialog opened | script check |
| (i) Cell labels (accessible name, read from `aria-label`) | «Рядок 1, стовпець 1, порожньо», a given «Рядок 1, стовпець 2, 0, задано», a hinted «Рядок 2, стовпець 6, 1, підказка» | script check |
| Dialog at 1280 opened by keyboard | Centred over the page; focus ring on «Так, почати» | `1280-confirm-dialog-keyboard-b43c855.jpg` |
| Console | No errors | `read_console_messages` |

## Run 2: review fix round 1 (uncommitted fix on top of `b43c855`, committed right after)

2026-10-06 about 12:50, same setup, 375×812: one cell clicked, mouse click on «Нова головоломка»: the dialog is open, the focused element is «Скасувати» (`[data-confirm="no"]`) with `:focus-visible` false (no ring after a mouse click, so the NFR-13 confirm shots are expected unchanged); `aria-labelledby` resolves to the question; Enter closed the dialog and the move stayed. Script check.

Superseded observation from run 1 (the user then chose the safe focus, 2026-10-06): `showModal()` focuses the first button, «Так, почати», the destructive choice. The frozen design (`design/v0/components/binarka-page.tsx:240`) has the same order and no `autofocus`, and the spec leaves the dialog's focus to the held NFR-12. Putting the initial focus on «Скасувати» would be a design change.

No screen reader was run; (i) reads the accessible name the browser exposes from `aria-label`.
