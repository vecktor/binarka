# add-level-selector (DL2): test-engineer red evidence

Written 2026-10-09 by the test-engineer agent. Companion of `docs/qa/add-level-selector-red-run.txt` (the raw red run: Test Files 29 failed | 26 passed (55); Tests 257 failed | 979 passed | 1236 total). Nothing under `src/`, `design/` or the spec was touched.

## 1. Existing tests changed (file, test, change, source)

- `tests/play-page-size-control.test.ts`: both tests of "pressing the shown size is a no-op at size $n". Added: `hidePopover` called once on the sheet, focus on the summary button. Source: FR-73 modified, FR-97.
- `tests/play-page-size-selector.test.ts`:
  - "Choose 4x4 on a board without entries...": added sheet closed once and focus on the summary. Source: FR-43 modified, FR-97.
  - "Hint at 4x4..." and "Hint at 8x8...": `hint(readBoard(root))` became `hint(..., 4)`. Source: FR-77 page clause, autonomy-log row 88.
- `tests/play-page-layout.test.ts`:
  - `readPanel` helper reads two lists and both headings.
  - "Rules panel structure...": headings [Правила, Складніші прийоми], 3 + 3 `li`, six in the panel. Source: FR-57, FR-93.
  - "No details element anywhere; exactly three li...": now six `li`. Source: FR-57, FR-93.
  - "after %s there is still exactly one panel...": added the `level 2` row and the techniques list. Source: FR-57, FR-93.
  - "header, size control, board...": renamed to "summary button"; the order follows the new `PAGE_ORDER`. Source: FR-68, FR-95.
  - "after %s the nine elements still exist once...": added the `level 2` row. Source: FR-68.
  - New test "The size and level controls are not in the sequence". Source: FR-68, FR-96.
- `tests/play-page-keyboard.test.ts`:
  - T1: cells sit between the summary button and the hint button. Source: FR-59, FR-68, FR-95.
  - T2: a size press in the sheet moves focus to the summary button; "Нова головоломка" and "Скинути" keep focus on the pressed button. Source: FR-59 exception, FR-97.
  - T3: the ISOLATED "fills nothing" premise is re-asserted with `hint(board, 4)`. Source: FR-77, row 88.
- `tests/play-page-semantics.test.ts`:
  - "The cell contract is unchanged and exactly three elements have an id": now four ids including the sheet, plus a level change step. Source: A-41, FR-96.
  - "Two mounts in one document share no id": four ids each, eight in all (was three and six). Source: A-41, FR-96.
- `tests/play-page-rendering.test.ts`: "two mounts on two roots ... three different ids each": now four and eight. Not in the design.md table; it matches the `\[id\]` grep. Source: A-41, FR-96.
- `tests/play-page-wcag.test.ts`: "Every button, the radiogroup and the board...": 46 buttons became 52; names 52 + 4 (two radiogroups, sheet, board); the name function drops `aria-hidden` descendants; checks for the new names added. Source: NFR-9, FR-95, FR-96. New test "The level radiogroup exposes its state" (NFR-9, FR-91).
- `tests/play-page-stylesheet.test.ts`: "Every page button is a button element...": 7 radios, plus the summary and close buttons, 52 in all. Source: FR-65, FR-87, FR-95, FR-97.
- `tests/play-page-hinted-cell.test.ts`:
  - "A hint with no rule applying keeps the marker": rebuilt on PAIR_8 through `selectSize`; premise asserted with `hint(board, 4)`; the FR-66 assertions are unchanged. Source: FR-77 page clause, row 88. (PAIR_ROW's second hint is `balance` at ceiling 4; PAIR_8's is still `none`, probed.)
  - Added: sheet row ("Opening the setup sheet ... keeps the marker"). Source: FR-66 modified.
  - Added: level-change row ("A level change to «Задачка» removes the marker"). Source: FR-66 modified.
  - Added: "...then «Скасувати», keeps the marker". From the requirement text (cancelled confirmation), not a table row.
- `tests/play-page-helpers.test.ts`: "ISOLATED: no rule applies", "HINT_BREAKS: rule-clean before...", "HINT_BREAKS at %i...": added `hint(..., 4)` assertions. Source: FR-77 page clause, row 88. Plus 6 new helper self-checks (popover stubs, `dispatchToggle`, `levels` array).
- `tests/ui-strings.test.ts`: added the describe "the new texts live in the strings module" (2 tests). Source: FR-94.
- `tests/helpers/play-page.ts` (helper, not a test): `PAGE_ORDER` (FR-68, FR-95); popover stubs (A-44); generator spies take the third argument and record `levels` (FR-88); `pressSizeButton`/`selectSize` open the sheet first; `expectedHint` is `hint(board, 4)` (FR-77, row 88); `mountPlayedBoard` takes an optional `level` and `later(size, level)`; new sheet and level helpers.

### Reviewed, no edit needed

- `play-page-controls-text`, `play-page-page-text`: their collectors are unchanged and still hold; the new texts are covered in `play-page-techniques.test.ts`.
- `play-page-confirm`: size and level rows run through the helpers; the FR-98 assertions are in `play-page-setup-sheet.test.ts`.
- `play-page-hint` (about lines 204 and 258): ISOLATED premises go through `expectedHint`, now ceiling 4. ISOLATED is `none` at ceiling 4, so no fixture was replaced.
- `play-page-highlighting:87`: ISOLATED used for a violation check, no hint premise.
- `play-page-cells`, `rules-and-reset`, `logo`, `win`, `click-cycle`, `new-puzzle-and-seed`: no change (helper updates only).
- TWO_PAIRS: first two hints identical at ceilings 1 and 4, so the literal sentences still hold.

## 2. Guards that pass before the change

New tests:

- `play-page-level-stylesheet.test.ts` "The existing stylesheet scans still pass": re-runs the token, `!important`, `:has(` and outline scans that the current stylesheet already obeys. It is the only new feature-file test that passes before the change.
- `ui-strings.test.ts` "no file of src/ui/ other than strings.ts ... holds a Cyrillic character": true of the current code; must stay true.
- 6 new helper self-checks in `play-page-helpers.test.ts`: they test the helpers on literal samples, not the page.

Existing tests that stay green: the `role="status"` count in semantics, the existing no-Cyrillic-outside-strings scan, keyboard T4 to T11, non-structure tests of click-cycle, win, rendering, logo.

Not a guard: "Seed is not shown" is RED in the red run, only via `expectPageStructure` → `PAGE_ORDER` → missing `[data-action="setup"]` (the test body is unchanged). It was green against the throwaway implementation.

A guard is not evidence that the feature works.

## 3. Throwaway-implementation run and mutation list

The throwaway implementation lived in the scratchpad (`.../scratchpad/proto/`, a copy of the worktree with `node_modules` symlinked), outside the worktree. It was not handed over. [Added by the orchestrator 2026-10-09 about 18:20, after the confirming review-gate: its `play-page.ts` (the version the mutants were made from) is kept as `docs/qa/add-level-selector/mutation/prototype-play-page.ts.txt` for the record; it is not product code.] Against it all 1236 tests passed (after two test fixes: the `play-page-rendering.test.ts` id count and the "nine" vs eight buttons in "The close button").

Mutation script: `docs/qa/add-level-selector/mutation/mutate.py` (copied from the scratchpad unchanged), raw output `docs/qa/add-level-selector/mutation/mut.json`, run against `play-page-` and `ui-strings` test files. A first attempt used unexpanded globs, ran zero tests and reported everything as "survived"; that output was discarded. The recorded run below is the second one, 18 mutants, all killed. The script printed the failing count and only the first four killing tests per mutant, so only those are recorded; test names are truncated as printed. The full list of killers per mutant is not recorded.

1. hint ceiling 1 (`hint(board, 4)` to `hint(board)`): 2 failing. `play-page-level-hint.test.ts`: "A hint beyond the level's techniques is still given"; "The same board gives the same hint at every level".
2. no retry (run-out returns false instead of continue): 6 failing. First four, `play-page-retry.test.ts`: "Success on the second seed"; "Success on the third seed"; "Three run-outs keep everything"; "A confirmation is asked once for a retried change".
3. retry any error (continue on every error): 6 failing. First four: `play-page-level-4x4.test.ts` "With no board shown, a level button generates"; `play-page-level-control.test.ts` "A generator error keeps the previous board"; `play-page-retry.test.ts` "An ordinary error is not retried"; `play-page-size-control.test.ts` "after a failed generation at mount, «Поле 6×6» generates a 6x6 board a...".
4. retry wrong size too (continue on a wrong-size result): 5 failing. First four: `play-page-retry.test.ts` "A result of the wrong size is not retried"; `play-page-size-selector.test.ts` three tests "A generator result of the wrong size keeps the previous board (...)" (one 6x6 fixture, two 8-row variants).
5. unavailable level press closes the sheet: 2 failing. `play-page-level-4x4.test.ts` "Pressing an unavailable level changes nothing"; `play-page-setup-sheet.test.ts` "An unavailable level leaves the sheet open".
6. no focus on the summary after «Скасувати»: 2 failing. `play-page-setup-sheet.test.ts` "«Скасувати» returns the focus to the summary button («Поле 8×8»)" and "(«Задачка»)".
7. sheet not closed before the dialog (`hidePopover` removed before `showModal`): 7 failing. First four: `play-page-retry.test.ts` "Three run-outs keep everything"; `play-page-setup-sheet.test.ts` "The sheet closes before the dialog opens («Поле 8×8»)", "(«Задачка»)", "«Скасувати» returns the focus to the summary button («Поле 8×8»)".
8. level kept at 4×4 (`newPuzzle(n, level)` for every size): 4 failing. `play-page-level-interplay.test.ts` "A size change to 4 sets the level to 1 in one puzzle", "One confirmation covers a size change to 4 and the level reset", "Going back from 4x4 keeps level 1"; `play-page-setup-sheet.test.ts` "The summary follows every shown board".
9. level reset on size 8 (`n === 6 ? level : 1`): 3 failing. `play-page-level-interplay.test.ts` "A size change to 6 or 8 keeps the level"; `play-page-level-seed.test.ts` "A level change takes exactly one seed and passes the chosen level"; `play-page-setup-sheet.test.ts` "The summary follows every shown board".
10. toggle always focuses the summary (rules-panel guard removed): 1 failing. `play-page-setup-sheet.test.ts` "A late toggle event does not steal the focus from the rules panel".
11. toggle ignores the open dialog (dialog guard removed): 1 failing. `play-page-setup-sheet.test.ts` "A late toggle event does not steal the focus from the dialog".
12. summary always shows level 1's name: 10 failing. First four: `play-page-level-4x4.test.ts` "A failed change to 4x4 keeps the available levels"; `play-page-level-control.test.ts` "A level change after play asks first, then replaces the board"; `play-page-level-interplay.test.ts` "A size change to 6 or 8 keeps the level", "Cancelling the size change keeps the level".
13. reason line always shown (`hidden` always false): 3 failing. `play-page-level-4x4.test.ts` "The reason is hidden at 6x6 and 8x8", "The buttons are available again at 6x6 and 8x8", "A failed change to 4x4 keeps the available levels".
14. `disabled` attribute instead of `aria-disabled` at 4×4: 5 failing. First four: `play-page-level-4x4.test.ts` "The 4x4 state of the level control", "An unavailable level is focusable"; `play-page-level-interplay.test.ts` "A size change to 4 sets the level to 1 in one puzzle"; `play-page-setup-sheet.test.ts` "An unavailable level leaves the sheet open".
15. shown level press does not close the sheet: 6 failing. First four: `play-page-level-4x4.test.ts` "The shown level is a no-op at every level (size 6, level 1 / 2 / 3, and size 8, level 4)" (titles truncated as printed).
16. a second seed taken per generation attempt: 51 failing. First four, `play-page-confirm.test.ts`: "table: «Нова головоломка», «Поле 4×4» and «Скинути» act at once on a b...", "«Нова головоломка»: close() runs once and BEFORE the action; then the ...", "«Поле 8×8»: close() runs once and BEFORE the action; then the effect o...", "the late `close` event that a browser fires after close() neither undo...". Killing tests in other files are not recorded.
17. techniques list gets `aria-hidden`: 3 failing. `play-page-techniques.test.ts` "Rules panel structure at mount", "The new texts are Ukrainian"; `ui-strings.test.ts` "no element with aria-hidden="true" has a letter of any alphabet in its...".
18. «Нова головоломка» resets the level (`newPuzzle(size, 1)`): 3 failing. `play-page-level-interplay.test.ts` "«Нова головоломка» keeps the level", "New puzzle keeps the chosen level"; `play-page-setup-sheet.test.ts` "The summary follows «Нова головоломка» and keeps its text after a reset".

Recording status: mutation, failing count and the first up to four killing tests are recorded for all 18 mutants. For mutants 2, 3, 7, 12, 14, 15 and 16 the failing count exceeds the four printed, so the remaining killers are not recorded.
