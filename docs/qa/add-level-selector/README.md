# add-level-selector: real-browser check (task 4.9)

- **When:** 2026-10-09, about 17:58 to 18:22 (UTC+5:30).
- **Where:** the Claude desktop app's built-in browser (Chromium), dev server `npm run dev -- --port 5181`, working tree on `3d64c9d` plus the uncommitted DL2 change (after the review-gate fix round).
- **How:** state was read from the DOM by script after each real click or key press. Screenshots illustrate it. The browser pane's screenshots lag the DOM at times, as seen twice here (`375-level4-hint.jpg` is the second shot), so the DOM reads decide.
- **Scope:** every layout observation below is **observed, not verified**. Layout, the one-screen fit, 44 px targets and the pixel match are the held NFR-10, NFR-12, NFR-13 and NFR-14 (NOT-EARNED).

## Steps at 375×812

| Step | Result | Evidence |
|---|---|---|
| (b) Summary button after the header, before the board; text and cue; nothing on the page body | PASS. Root order is header, `button[data-action=setup].setup-button`, board, buttons, messages, rules panel, sheet, dialog. The text is «6×6 · Розминка» with «▾». No size or level button is visible, and there is no description line. | `375-mount.jpg` |
| (c) Open, then «Закрити» | PASS. The sheet opens as a bottom sheet with the size group, four levels with descriptions, and «Закрити». «Закрити» closes it with nothing changed, and focus is on the summary button. | `375-sheet-open.jpg` |
| (c) "focus moves into the sheet" | Native behaviour, as specified. After a click, Chromium leaves focus on the summary button, and the next Tab enters the sheet («Поле 4×4»). The spec allows `autofocus` only on «Зрозуміло» (rules panel), so the sheet has none. | DOM read |
| (d) Escape, and a click on empty space outside the sheet | PASS. The sheet closes with nothing changed, and focus is on the summary button. | DOM read |
| (d) Click on a cell outside the sheet | PASS after the fix round. The cell is filled and keeps the focus. Before the fix, the focus jumped to the summary button (a review-gate contested finding, confirmed here). | DOM read |
| (d) Click on «Правила» with the sheet open | Observed. The rules panel replaces the sheet, and focus stays on «Зрозуміло». | DOM read |
| (e) «Задачка» on an untouched board | PASS. The sheet closes, a new board appears at once, the summary reads «6×6 · Задачка», and focus is on the summary button. | DOM read |
| (f) One entry, then «Головоломка» | PASS. The sheet closes first and the dialog opens with focus on «Скасувати». «Скасувати» changes nothing, focus returns to the summary button, and the sheet stays closed. Doing it again and pressing «Так, почати» gives a new board and «6×6 · Головоломка». | `375-confirm-after-level.jpg` |
| (g) «Поле 4×4» | PASS. The summary reads «4×4 · Розминка». In the sheet, «Розминка» is checked; the other three have `aria-disabled="true"` and a dashed border and ring (a cue besides colour); the reason line is visible. Pressing each of the three does nothing (sheet open, board unchanged). Shift+Tab reaches them. | `375-sheet-4x4.jpg` |
| (h) «Поле 6×6» | PASS. The reason line is `hidden`, no level is disabled, and the level is «Розминка». | DOM read |
| (i) «Мозколамка», then the same level again, then «Нова головоломка» and «Підказка» | PASS. Choosing the shown level closes the sheet with nothing changed. «Нова головоломка» keeps «Мозколамка». Pressing «Підказка» until the board was solved gave sentences of the kinds pair ×10, count ×8, sandwich ×2, **balance ×2, unique ×2, lookahead ×1**, and then the win message. This is the first live sight of the technique 2 to 4 sentences on the page (DL1 had only unit tests). | `375-level4-hint.jpg` |
| (j) «Правила» | PASS. The headings are «Правила» and «Складніші прийоми», the two lists have 3 + 3 items, and «Зрозуміло» has the focus. | `375-rules-techniques.jpg` |
| (k) Tab order and focus rings | PASS. The order is «Правила», the summary button, then the cells. A 3 px solid outline (`:focus-visible`) shows on the summary button, on a level option and on «Закрити». | `375-focus-summary.jpg`, `375-focus-level.jpg` |

## (l) Observations, not claims

- **Timing (dev build, A-36):**
  - «Нова головоломка» at 6×6 level 4 took 1 to 17 ms per click over 10 clicks.
  - At 8×8 level 4 it took 5 to 25 ms over 10 clicks.
  - No noticeable freeze.
- **320×700:**
  - No horizontal scroll.
  - The sheet has 586 px of content in 559 px, so it scrolls inside.
  - «Закрити» sits partly below the window until scrolled (the design keeps it sticky).
- **375×812:** the rules panel scrolls (734 px of content in 446 px).
- **Sheet and rules panel together:** opening one closes the other, as expected for `popover="auto"`.

## (m) Other widths

Steps (b) to (g) were repeated at 1280×800 and all PASS, as DOM reads with real clicks: «Закрити», Escape, outside click, «Задачка» on an untouched board, the dialog order with «Скасувати» and «Так, почати», and the 4×4 state with unavailable presses doing nothing. Evidence: `1280-sheet.jpg`, `1280-sheet-4x4.jpg`.

Layout pass over the review-set widths (the sheet opened by script; observed, not verified):

| Window | Sheet (left, top, width, height) | Inner scroll | Over the summary button | Shot |
|---|---|---|---|---|
| 320×700 | full width, 140 to 700 | yes | no | `320-sheet.jpg` |
| 375×812 | full width, 263 to 812 | no | no | `375-sheet-open.jpg` |
| 768×1024 | 160, 250, 448, 524 | no | no | `768-sheet.jpg` |
| 1024×768 | 288, 122, 448, 524 | no | **yes** | `1024-sheet.jpg` |
| 1280×800 | 416, 138, 448, 524 | no | **yes** | `1280-sheet.jpg` |
| 1366×650 | 459, 65, 448, 520 | yes | **yes** | `1366x650-sheet.jpg` |
| 1440×900 | 496, 188, 448, 524 | no | no | (DOM read only) |

- No width has horizontal scroll.
- Level buttons are at least 44 px tall at 768 and 1024.
- The design reference (`review-set-11`) anchors the panel under the summary button from 48rem and keeps «Закрити» sticky. The product's panel is centred and overlaps the summary button at 1024, 1280 and 1366. This is a G2 (NFR-14) item, not a DL2 claim.
- The product's sheet class is `setup-sheet`; the design's is `setup`. No spec pins it. Note it for G2.

(o) The server was stopped and the viewport reset at 18:22.
