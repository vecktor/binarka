# Keyboard check — add-page-accessibility (task 6.10, TC-13 smoke)

2026-10-06, 17:58–18:05 (UTC+5:30). Run by the orchestrator in the built-in browser, against the uncommitted green tree with 548 of 548 tests passing. Server: `npx vite --port 5233`, started for the check and stopped afterwards. Keys were real key presses sent by the browser tool. Page state was read with `document.activeElement` and the DOM after each step. **No screen reader was used** (A-26).

| Step | Result | Evidence |
|---|---|---|
| (b) Tab order and label | **pass**. Tab goes select → one board cell (1,1) → «Підказка» → «Нова головоломка»; Shift+Tab goes back the same way, so the board is one stop. The ring on (1,1) is outside the border. «Розмір поля» is visible next to the select with a gap. | `6x6-tab-into-board.jpg` |
| (c) Arrows, Home/End, Ctrl+Home/End | **pass**. Left and Up at (1,1) stay at (1,1). Right ×7 stops at (1,6); Down ×7 stops at (6,6). Home → (6,1), End → (6,6), Ctrl+Home → (1,1), Ctrl+End → (6,6). Exactly one cell has tabindex 0, and it follows focus. In a 300 px tall viewport the page scrolled only to bring the focused cell into view (browser behaviour of `focus()`); extra presses at the edge and Home/End left `scrollY` unchanged. | DOM readings |
| (d) Space and Enter | **pass**. An empty cell cycles empty → 0 → 1 → empty, and its accessible name follows («Рядок 6, стовпець 6: 0», …). `scrollY` stayed constant, so Space did not scroll. On a given «1» (`aria-readonly="true"`), Space and Enter change nothing. | DOM readings |
| (e) Violation cue and focus ring | **pass**. Three 1s in row 6 give (6,3)–(6,5) `cell-violation`, `aria-invalid="true"` and a computed 3px `rgb(185, 28, 28)` border. The focused violation cell keeps its border inside the blue ring. Focus on the neighbour (6,6) shows the ring clearly against the pale red fill. | `6x6-focused-violation-cell.jpg`, `6x6-focus-next-to-violation.jpg` |
| (f) Hint | **pass**. Enter on «Підказка» shows the sentence in the `role="status"` region and fills (2,3). Focus stays on the button, and the board's Tab stop stays at (6,5): Shift+Tab lands there, because the hint does not move it. | DOM readings |
| (g) Size change | **pass, except the native popup.** On macOS the native `<select>` popup did not react to the tool's key events, so the value could not be chosen by keyboard from the tool. This is a limit of the harness, not of the page, which uses a native select. «Поле 8×8» was chosen with the form tool instead. The board then has 8 rows and 64 cells named «Поле 8×8», the hint is cleared, focus stays on the select, the Tab stop resets to (1,1), and Tab lands on (1,1). | `8x8-desktop-tab-into-board.jpg` |
| (g) 375 px | **pass**. At 4×4, 6×6 and 8×8, `scrollWidth` 375 equals the viewport width, so there is no horizontal scroll. Cells are 48 / 48 / 41.1 px square, and the columns line up across rows. | `4x4-mobile-375.jpg`, `6x6-mobile-375.jpg`, `8x8-mobile-375.jpg` |
| (h) New puzzle with Enter | **pass**. The board changes, the size stays 8, focus stays on the button, and the Tab stop resets to (1,1). | DOM readings |
| (i) Reload | **pass**. The page is 6×6 again. | DOM readings |
| Console | no errors | `read_console_messages` |

One screenshot was discarded: the first capture of (e) was taken before the browser repainted (the DOM already showed the violation), so it was retaken after a 1 s wait. The browser's accessibility tree lists the board as `grid "Поле 6×6"`, every cell with its Ukrainian name, and the select as a combobox showing its selected value. The select's label association exists in the DOM (`select.labels`). What a screen reader announces was not checked.

## Re-check after review round 1 (2026-10-06, 18:40 UTC+5:30)

The reviewers found that «Розмір поля» sat about 6 px below the select's centre (F2): the select's old `margin-bottom: 12px` was inside the flex label. After the margin moved to `.size-label`, the label-text centre and the select centre measure **0.0 px apart** both on desktop and at 375 px. The gap to the board is still 12 px, and `scrollWidth` at 375 px is still 375. Screenshots: `label-aligned-desktop.jpg`, `label-aligned-mobile-375.jpg`.
