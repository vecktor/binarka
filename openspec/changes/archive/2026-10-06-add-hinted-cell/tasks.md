# Tasks: add-hinted-cell

Order of work: section 1 (tests) is written FIRST from the delta spec and seen red before section 2 is implemented. No database exists, so the DB smoke flow of the template maps to the manual page check in 3.7. Commits that touch `src/` carry `Slice: add-hinted-cell` and `Refs: FR-66` (or `Refs: FR-39`). Every test is tagged `@trace FR-66` or `@trace FR-39`. This change is archived after `update-page-layout`; start from the baseline as archived by it.

## 1. Failing tests first (red)

- [x] 1.1 Create `tests/play-page-hinted-cell.test.ts` tagged `@trace FR-66`, one test per scenario of «Hinted cell marker»: no marker at mount; a second hint moves the marker (exactly one cell, X then Y); removal table (click another non-given cell, click the hinted cell itself, «Нова головоломка», size change to 4 and to 8 with an injected generator, «Скинути»); keep table (click a given cell once and twice more, hint with no target on a broken board and on a no-rule board, click `[data-action="rules"]` then the close button «Зрозуміло»); failed generation to size 8 keeps the marker; a winning hint keeps the marker on the filled cell; two mounts are independent; no given cell carries the class. Use fixtures from `tests/helpers/play-page.ts` (`PAIR_ROW`, `PAIR_4`, `PAIR_8`, `WIN_PUZZLE`, `HINT_BREAKS`, `ISOLATED`) and add only a `hintedCells(root)` helper.
- [x] 1.2 Extend `tests/play-page-hint.test.ts` tagged `@trace FR-39` with the added assertions of the five modified scenarios (target has `cell-hinted`, `data-given="false"`, no `cell-given`; no other cell has it; the click on the hinted cell removes it; no-target hint adds none). Add the scenario «The filled cell carries the marker». No existing assertion is weakened; list the changed tests by FR in the test commit message.
- [x] 1.3 Run `npm run test:run`, confirm the new and extended tests FAIL (red) for the right reason (no `cell-hinted` class exists), and save the failing output to `docs/qa/add-hinted-cell-red-run.txt` with the red and green counts.

## 2. Implementation (`src/ui/play-page.ts`, `src/ui/style.css`)

Dependencies and database schema: none. No dependency (TC-10), no storage (TC-12), `src/engine/` and `src/ui/strings.ts` untouched.

- [x] 2.1 Add the closure field `hinted: [number, number] | null` (starts `null`) and `setHinted(next)`: remove `cell-hinted` from the previous cell via `cellEls`, add it to the new cell, store the coordinates; `null` only removes.
- [x] 2.2 Hint handler: after the early returns (no board, `kind !== 'fill'`), write the value, `renderCell`, then `setHinted([h.row, h.col])`, then `refreshHighlights()` and `updateWin()` as today. A no-fill hint leaves the marker alone.
- [x] 2.3 `onBoardClick`: after the given-cell early return and the cell change, call `setHinted(null)`. A click on a given cell returns earlier and keeps the marker.
- [x] 2.4 `showPuzzle`: after the size check and before the board is replaced, set `hinted = null` (the old cell elements are gone). The reset handler calls `setHinted(null)` after it re-renders the cells.
- [x] 2.5 `src/ui/style.css`: give `.cell-hinted` a minimal cue that is not colour alone (done as the frozen design's `.cell-hinted`, `design/v0/app/binarka.css:379`: dashed border, italic and bold digit, without the colour fill and the pop animation; review round 1 `wf_8df9dfcf-f5d` noted the earlier example of an inset bar). Perception and pixel parity are NOT claimed (held NFR-11, NFR-14).
- [x] 2.6 Error paths: confirm by reading that the hint handler's early returns and the failed-generation path leave `hinted` untouched, and that no path can throw a raw exception to the user. Authentication does not exist (no redirect-to-login or forbidden case).
- [x] 2.7 Run `npm run test:run` and confirm every test is green and no stub remains in `src/ui/`.

## 3. Validation, docs, and archive prep

- [x] 3.1 Run `npm run lint`.
- [x] 3.2 Run `npm run test:run`.
- [x] 3.3 Run `npm run build`.
- [x] 3.4 Run `npx openspec validate add-hinted-cell --strict`.
- [x] 3.5 Run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs` (FR-66 and FR-39 cited and traced).
- [x] 3.6 Update `README.md` (page usage: the hinted cell) and `docs/current-state.md` (last update in UTC+5:30, phase, slice status, evidence paths, a "Scope NOT delivered" line naming held NFR-11 and NFR-14: the cue's perception is not claimed).
- [x] 3.7 Manual real-DB smoke test (no database exists; this is the real-browser page check, current Chromium): (a) run `npm run dev` and open the printed URL; (b) press «Підказка» once: the hint sentence appears, one cell shows the new digit with the extra cue; (c) press «Підказка» again: the cue moves to the new cell and leaves the first; (d) press «Підказка» on a board where no rule applies (a violation made by a click removes the cue, so the broken-board case is the jsdom `HINT_BREAKS` test only): the sentence changes, the cue stays where it was; (e) click a given cell: the cue stays; click a non-given cell: the cue goes; (f) press «Підказка», then «Правила» and «Зрозуміло»: the cue stays; (g) press «Підказка», then «Скинути», then again «Підказка» and «Нова головоломка», then «Підказка» and a size button: the cue is gone each time; (h) save a screenshot under `docs/qa/add-hinted-cell/` and record its path in `docs/current-state.md` as observed, not verified (held NFR-11); (i) stop the server. The smoke test is a gate for 3.9.
- [x] 3.8 Run the review-gate with `change: add-hinted-cell` (one run, one fix round for confirmed defects, one confirming run); record the report path in `docs/current-state.md`.
- [x] 3.9 Archive only after 3.1 to 3.8 passed and the smoke test in 3.7 passed: before archive, rebase the delta on the baseline as archived by `update-page-layout` (confirm «Hint button fills one cell» is still the baseline text this delta copies); run `npx openspec archive add-hinted-cell --yes` (a normal merge, NOT `--skip-specs`); then in the same commit make the baseline text edits listed in `design.md`; run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`.
