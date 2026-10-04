# Tasks: add-rules-and-reset

Order of work: section 1 (tests) is written FIRST from the delta spec and seen red
before section 2 is implemented. No database exists, so the DB smoke flow of the
template maps to the manual page check in 3.6. Commits carry
`Slice: add-rules-and-reset` and `Refs: FR-57` or `Refs: FR-58`.

## 1. Failing tests first (red)

- [x] 1.1 Create `tests/play-page-rules-and-reset.test.ts` tagged `@trace FR-57`, `@trace FR-58` and `@trace NFR-5`, one test per delta scenario: rules block at mount (table of three texts, document order after `[data-board]`, no Latin letters); rules block unchanged after a new puzzle, a size change to 4 and 8, and a win (parameterised); reset after clicks and a hint fill, for N in 4, 6, 8 (givens and `data-size` and selector kept); reset clears `cell-violation` and the hint message; reset after a win empties the win message and the board is editable again; reset makes no seed-source and no generator call (one and several presses); reset on an untouched board changes nothing.
- [x] 1.2 Add fixtures of size 4, 6 and 8 (givens, a win solution, a pair fixture for a hint fill, a fixture with a reachable violation) to `tests/helpers/play-page.ts` only as far as the new test needs; existing fixture names and values stay. (Not needed: the existing helpers were enough; `DIRTY_4` and `pressReset` live in the test file.)
- [x] 1.3 Run `npm run test:run`, confirm the new tests FAIL (red), and save the failing output to `docs/qa/add-rules-and-reset-red-run.txt` with the red and green counts. Done: commit `63c26c4` (tests), `0a2ec20` (red-run file, orchestrator's own run: 24 failed, 418 passed of 442).

## 2. Implementation (`src/ui/play-page.ts`, `src/ui/style.css`)

- [x] 2.1 In `mountPlayPage` build the rules block once: `section[data-section="rules"]` with an `h2` «Правила» and a `ul` of three `li` with the exact texts of FR-57; add it to the single `root.replaceChildren(...)` call after `boardHost`, outside it; `showPuzzle` does not touch it (FR-57, NFR-5).
- [x] 2.2 Add the button `[data-action="reset"]` labelled «Скинути» to the buttons row (FR-58, NFR-5); no `aria-label`, `title` or `alt` text.
- [x] 2.3 Add the reset handler: return if `board.length === 0`; `board = copyGrid(givens)`; `renderCell` for every cell; `refreshHighlights()`; clear `hintMessage` and `winMessage`. It calls neither `seedSource` nor `makePuzzle` and does not touch `size` or the select (FR-58).
- [x] 2.4 In `src/ui/style.css` add a few rules for the rules block (heading, list spacing, readable at 375 px) and the reset button (same look as the other buttons). Done with `text-align: left` on `.rules ul` (review-gate round 1: `#app` centres text) and `flex-wrap: wrap` on the shared `.buttons` row so three buttons fit at 375 px (round 1 contested note; the round-1 fix commit claimed this note but its replacement did not match, autonomy-log M13).
- [x] 2.5 Run `npm run test:run` and confirm every test is green and no stub remains in `src/ui/`.

## 3. Validation, docs, and archive prep

- [ ] 3.1 Run `npm run lint`.
- [ ] 3.2 Run `npm run test:run`.
- [ ] 3.3 Run `npm run build`.
- [ ] 3.4 Run `npx openspec validate add-rules-and-reset --strict` and `npx openspec validate --all --strict`.
- [ ] 3.5 Review-gate with `change: add-rules-and-reset` (one run, one fix round for confirmed defects, one confirming run); save the report path in `docs/current-state.md`.
- [ ] 3.6 Real-browser check at 375 px (stands in for the DB smoke flow; no database exists): (a) `npm run dev` and open the printed URL in the browser pane at the 375 px mobile preset; (b) the rules block with «Правила» and three items is visible under the board with no horizontal scrollbar; (c) click some cells, press «Підказка», press «Скинути»: non-given cells are empty, givens stay, the hint text is gone; (d) choose «Поле 4×4» and «Поле 8×8», press «Скинути» in each: the size and the select stay, the rules block is still there once; (e) press «Нова головоломка»: the rules block is unchanged; (f) save a screenshot under `docs/qa/` and record its path in `docs/current-state.md`; (g) stop the server.
- [ ] 3.7 Confirm no new dependency: `git diff package.json package-lock.json` shows no change from this slice.
- [ ] 3.8 Update `docs/current-state.md` (last update date and time in UTC+5:30, phase, slice status, evidence paths, "Scope NOT delivered") and the page usage in `README.md`.
- [ ] 3.9 Archive, only after 3.1 to 3.8 passed and the review-gate has no open confirmed defect: run `npx openspec archive add-rules-and-reset --yes` (a normal merge, NOT `--skip-specs`); then in the same commit make the baseline text edits listed in `design.md` ("Baseline text edits at archive") in `openspec/specs/play-page/spec.md`; run `npx openspec validate --all --strict`; run `npm run check:trace`.
