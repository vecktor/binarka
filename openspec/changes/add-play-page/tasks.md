# Tasks: add-play-page

Order of work: section 4 (tests) is written FIRST from the spec and seen red
before sections 1 to 3 are implemented. The sections are numbered by area, not
by time. The test-engineer writes section 4 in parallel and leaves RED-STAGE
stub files under `src/ui/*` (they type-check but return wrong values or throw);
the implementer replaces those stubs in sections 1 to 3. No database exists, so
the DB smoke flow of the template maps to the page smoke check in 5.8. Commits
carry `Slice: add-play-page` and `Refs: FR-x`.

## 1. Foundations (seed source, mount skeleton)

- [ ] 1.1 Implement `src/ui/seed.ts`: `defaultSeedSource()` returns an integer from 0 to 2147483647 inclusive via `Math.random` (allowed here, outside `src/engine/`), remembers the previous value and redraws while the new value equals it (FR-42, FR-51).
- [ ] 1.2 Create `src/ui/index.ts` exporting `mountPlayPage` and its option types, and the skeleton of `src/ui/play-page.ts`: `mountPlayPage(root, options?)` replaces the content of `root` synchronously with heading «Бінарка», the two buttons («Підказка», «Нова головоломка») and both message regions, each with its `data-action` or `data-message` attribute; sets `document.title` to «Бінарка».
- [ ] 1.3 Add `src/ui/style.css` (plain CSS, no dependency): grid layout, distinct `cell-given` style, `cell-violation` style, button and message styling; Ukrainian-only text, nothing user-visible in CSS (`content:` is not used).
- [ ] 1.4 Change `src/main.ts` to import `./ui/style.css` and call `mountPlayPage(document.querySelector('#app'))` with no options; confirm `index.html` is unchanged and keeps its Ukrainian title.

## 2. Rendering and state

- [ ] 2.1 Keep the model in `play-page.ts`: `givens` and `board` as copies of the puzzle grids (0, 1, null), never parsed from the DOM; call the injected or engine `generate(6, seed)` with the seed from `options.seedSource ?? defaultSeedSource`, called exactly once per puzzle and passed unchanged (FR-31, FR-42).
- [ ] 2.2 Render `[data-board]` with `data-size="6"` and 36 `[data-cell]` elements carrying `data-row` and `data-col` 1 to 6 and `data-given`; a given carries the class `cell-given` and shows its digit, other cells show empty text (FR-31, FR-32).
- [ ] 2.3 Implement `renderCell` as the only writer of cell text, `data-given` and the `cell-given` class, and `refreshHighlights()` that sets `cell-violation` on exactly the cells of `findViolations(board)` (0-based engine coordinates, DOM is +1); no digit counting or run checking in `src/ui/` (FR-35 to FR-38).
- [ ] 2.4 Make the page show no seed anywhere: no text node, no attribute and no `document.title` contains the seed (A-4); no `aria-label`, `title`, `placeholder` or `alt` is added (NFR-5).
- [ ] 2.5 Error handling for `generate`: on a new-puzzle press, a thrown error is caught and the previous board and messages stay; at mount with no previous board, render the empty message regions and no board; the page never throws to the caller.

## 3. Interaction (click cycle, hint, win, new puzzle)

- [ ] 3.1 Attach one delegated click listener on `[data-board]`: resolve `closest('[data-cell]')`, ignore a given cell completely (no model, DOM or message change, FR-33), otherwise cycle null, 0, 1, null (FR-34), `renderCell`, `refreshHighlights`, then set or clear the win message (FR-38).
- [ ] 3.2 Hint button: call `hint(board)` on the model, show `sentence` unchanged in `[data-message="hint"]` replacing the previous text (FR-40); for `kind: 'fill'` write `value` at 0-based `row`, `col` and update the cell `data-row = row + 1`, `data-col = col + 1` through one mapping helper (FR-39); for 'none' and 'broken' fill nothing; after a fill run `refreshHighlights` and the win check.
- [ ] 3.3 Win message: after every click on a non-given cell and every hint fill, `isSolved(board)` sets `[data-message="win"]` to exactly «Вітаємо, головоломку розв'язано!» (ASCII apostrophe U+0027) or clears it; the board is never locked (FR-41).
- [ ] 3.4 Hint persistence: cell clicks and given clicks leave `[data-message="hint"]` unchanged; only the next hint press or the new puzzle press changes it (A-23, FR-40).
- [ ] 3.5 New-puzzle button: take one seed from the seed source, generate a 6×6 puzzle, rebuild `[data-board]` (new model, new cells, one new delegated listener), clear both messages, recompute highlights from the new givens; no requirement that the puzzle differs from the old one (FR-42).

## 4. Tests (written FIRST by the test-engineer in `tests/play-page-*.test.ts` against RED-STAGE stubs in `src/ui`, seen red, then green; each test tagged `@trace FR-x` or `@trace NFR-5`)

- [ ] 4.1 `tests/play-page-render.test.ts` for FR-31, FR-32: 6×6 board with seed 1, 36 cells with unique `data-row` and `data-col` 1 to 6, `data-given` and `cell-given` agree, empty cell is never given, content equals the engine generator for seed 42.
- [ ] 4.2 `tests/play-page-cells.test.ts` for FR-33, FR-34: given cell ignored after one and three clicks, hint message kept after a given click, three-click cycle, cycle on a hint-filled cell.
- [ ] 4.3 `tests/play-page-highlight.test.ts` for FR-35 to FR-38: three equal in row and column, two equal not highlighted, four of one digit in a row and a column, exactly three not highlighted, identical complete rows and columns, incomplete row not compared, highlight appears at once and disappears when fixed, hint fill and given click recomputation; boards are fixture puzzles injected through `generate`.
- [ ] 4.4 `tests/play-page-hint.test.ts` for FR-39, FR-40: fill target, the 0-based to 1-based fixture (hint at engine row 2, col 2 lands on `data-row="3"`, `data-col="3"`), count rule fills exactly one cell, hint-filled cell editable, no fill for 'none' and 'broken', sentence equals the engine's, second press replaces, initial state empty, hint persists across clicks and clears on new puzzle.
- [ ] 4.5 `tests/play-page-win.test.ts` for FR-41: final click wins, final hint wins, full board with a violation is not a win, edit after a win clears the message and the board stays editable, exact message text with apostrophe U+0027.
- [ ] 4.6 `tests/play-page-new.test.ts` for FR-42, FR-51: new puzzle after play clears messages and entries and matches the engine for seed 7, always 6×6, no stale highlights, seeds taken in order 1, 2, 3, injected seed 42 gives identical pages, default source with a spy `generate` gives 10 integers in 0..2147483647 with no equal neighbours, default source with the real generator renders a 6×6 board, seed 987654 never shown (text nodes, title, attributes, locale-formatted and separator forms).
- [ ] 4.7 `tests/play-page-text.test.ts` for NFR-5: every non-whitespace text node under the root (not `[data-cell]`), `document.title` and the attributes `aria-label`, `title`, `placeholder`, `alt` contain Cyrillic and no Latin letter; the win message text is exact.
- [ ] 4.8 Run `npm run test:run` against the red-stage stubs and save the failing output to `docs/qa/add-play-page-red-run.txt` as evidence that tests were red first; after sections 1 to 3 landed, confirm all tests green and that no stub remains in `src/ui/`.
- [ ] 4.9 Run `npm run check:trace` and confirm FR-31 to FR-42 and NFR-5 each have at least one tagged test in `tests/play-page-*.test.ts`; FR-43 stays NOT-EARNED by design.

## 5. Validation, docs and archive prep

- [ ] 5.1 Run `npm run lint`.
- [ ] 5.2 Run `npm run test:run` (all green, including the slice 1 timing tests).
- [ ] 5.3 Run `npm run build` (`tsc --noEmit` covers `src/` and `tests/`, then `vite build` bundles the CSS).
- [ ] 5.4 Run `npx openspec validate add-play-page --strict`.
- [ ] 5.5 Run `npx openspec validate --all --strict`.
- [ ] 5.6 Review-gate with `change: add-play-page` (correctness and spec-compliance on Opus medium, security on Sonnet medium, verifiers on Sonnet medium, focus "return only defects"): one run, one fix round for confirmed defects, one confirming run; skip the confirming run if the 5-hour meter is above 70% and record the skip in `docs/autonomy-log.md`. Save the report path in `docs/current-state.md`.
- [ ] 5.7 Update `docs/current-state.md` (last update date and time in UTC+5:30, phase, slice status, evidence paths: red run from 4.8, review-gate report, test and validation output) with "Scope NOT delivered": FR-43 (NOT-EARNED), FR-55, FR-44 to FR-48, NFR-6 eval (NOT-EARNED until graded), NFR-7. Update `README.md` with the page (`npm run dev`).
- [ ] 5.8 Page smoke check (stands in for the DB smoke flow; no database exists): (a) start `npx vite` in the background and note the printed local URL; (b) `curl -s http://localhost:<port>/` and check the HTML contains `<div id="app">` and the module script `/src/main.ts`; (c) `curl -s http://localhost:<port>/src/main.ts` returns 200 and imports the play page; (d) `curl -s http://localhost:<port>/src/ui/style.css` returns 200; (e) stop the server; (f) record the outcome and the date in `docs/current-state.md`. Rendering itself is not checked (TC-13, NFR-7 Future).
- [ ] 5.9 Confirm no new dependency: `git diff package.json package-lock.json` shows no change from this slice.
- [ ] 5.10 Archive, only after 5.1 to 5.9 all passed and the review-gate in 5.6 has no open confirmed defect: run `npx openspec archive add-play-page --skip-specs --yes` (the baseline spec already holds the requirements), tick this task in the archived copy `openspec/changes/archive/*-add-play-page/tasks.md`, then run `npx openspec validate --all --strict` again.
