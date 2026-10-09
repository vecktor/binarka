# update-setup-sheet-start: tests that change on purpose (tasks 1.1 and 1.2)

Written 2026-10-10 (task 1.2 of `openspec/changes/update-setup-sheet-start/tasks.md`). Evidence document only: no test or source file was edited, no box was ticked, nothing was committed. Read first: `proposal.md`, `design.md`, `tasks.md` and the whole of `specs/play-page/spec.md` of the change folder.

Rule applied (user memory "test changes trace to spec"): a test changes only when a changed requirement, scenario or rule demands it; the source of each change is the delta scenario plus the signed row. The signed rows behind the whole slice are: autonomy-log row 114 (the user's finding and choice, "Select, then «Почати»"), row 118 (amendment signed 2026-10-10, all defaults, SD-Q1 to SD-Q10), rows 119 to 121 (build rules, Footer-1 wireframe, audit dispositions), and in `docs/requirements.md` FR-100, FR-101, the amended FR rows named per line below, and A-45 (cancelled confirmation drops the pair), A-46 (marked choice lives in page state, reset on the closing `toggle`), A-47 (`aria-checked` is the marked choice while the sheet is open). Where a row says only "FR-100" read "FR-100, A-47".

## 1. Task 1.1 evidence (basis check)

| Check | Result |
|---|---|
| `grep -n "^| 11[6-9] " docs/autonomy-log.md` | rows 116, 117, 118, 119 present (lines 130 to 133); rows 120 and 121 also present (lines 134, 135) |
| `docs/requirements.md` carries FR-100 and FR-101 | yes (lines 140 and 141); A-45, A-46, A-47 at lines 295 to 297 |
| `node scripts/check-traceability.mjs` | exit 0, "113 MVP FRs checked, 0 failure(s), 137 warning(s)". FR-100 and FR-101 show Spec = yes, Plan = yes in the generated matrix (cited by this delta); the warnings "FR-100 has no test annotated" and "FR-101 has no test annotated" are expected before section 2. The run rewrote `docs/qa/traceability-report.md` and `trace/trace.json` byte-identically (git shows no change to them). |

Status: not BLOCKED. Note for the caller: `git status` also shows modified files that are not part of this task and were not touched here (`design/tools/capture-review-set.sh`, `design/v0/app/binarka.css`, `design/v0/components/*`, `design/v0-screenshots/review-set-13/`, `design/v0/app/settings-focus/`, plus `docs/autonomy-log.md`, `trace/ledger.jsonl`): another session is working in `design/`.

## 2. Task 1.2: the greps as run, and what they miss

`grep -rlE "chooseSize|chooseLevel|selectSize|selectLevel|setup|data-control|radio|aria-checked|hidePopover|showPopover" tests e2e` returns 29 files: 3 e2e, `tests/helpers/play-page.ts`, 25 test files (the list in section 5). `grep -nE "Choose|aria-checked|hidePopover|selectSize" openspec/specs/play-page/spec.md` returns 93 baseline lines; they fall in the requirements the delta modifies, plus the reading-rule scenarios of unmodified requirements («New puzzle button» l. 429 and 435, «Reset button» l. 648 and 661), all handled in section 7.

Gap of the 1.2 pattern: it does not match tests that reach the sheet only through helper names (`pressSizeButton`, `pressLevelButton`, `mountThenSelect`, `openSheet`, `sizeButton`) or only through the strings and stylesheet scans. The wider helper grep adds these files, all included below: `tests/play-page-keyboard.test.ts`, `tests/play-page-highlighting.test.ts`, `tests/ui-strings.test.ts`, `tests/play-page-action-buttons-stylesheet.test.ts` (new tests only). `evals/`, `scripts/` and `e2e/nfr-10-fit.spec.ts` contain no match and stay as they are.

Method for the scenario-level comparison (not a guess): every `#### Scenario:` of the delta was compared by name and by text with the baseline `openspec/specs/play-page/spec.md`. Result: 173 delta scenarios = 47 new names + 88 that keep name and text + 38 that keep the name with changed text; 12 baseline names of the modified requirements disappear (section 6). Each existing test was then classified by what its body does, not by the file.

## 3. Kind legend (one discriminator, applied per test)

Counts are `it` / `it.each` / `describe.each`-inner `it` entries (an `it.each` row set is one entry).

| Code | Kind | Meaning |
|---|---|---|
| A | helper update only | The test reaches the effect through `selectSize`, `chooseLevel`, `mountThenSelect`, `mountPlayedBoard(n, later, level)` or a local wrapper of them, and asserts nothing between the press and the effect. The test file is not edited; only `tests/helpers/play-page.ts` changes (section 4). Each was checked: no `dialogIsOpen`, `hidePopover` count, `aria-checked` or focus assertion sits between the helper call and the outcome. |
| B | scenario changes, call-site edit | The test calls `pressSizeButton` / `pressLevelButton` or a raw `.click()` on an option, then asserts a dialog, a board, a seed, a `hidePopover` count or focus. Under the delta that press only marks, so the call is rewritten (mark, then «Почати»). The assertions stay as they are. |
| C | scenario changes, assertions change | The delta changed what is asserted (a marking press does nothing else, counts and lists grow, a new assertion is added). |
| D | scenario changes, renamed | The baseline scenario name is gone from the delta; the test is retitled to the new name and its body follows the new text (section 6). |
| E | new test | A delta scenario with no existing test (section 8). |

## 4. `tests/helpers/play-page.ts` (the helper file; T-H lines)

| Line (today) | What it does now | Change | Source |
|---|---|---|---|
| 694 to 697 `pressSizeButton` | `openSheet(root)` then click, on every call | becomes the mark-only press: call `showPopover()` only while `popoverIsOpen(sheet)` is false, then click. Task 2.1 names `markSize` / `markLevel` for this; `pressSizeButton` / `pressLevelButton` are then either removed or kept as aliases (ambiguity 1, section 11) | FR-43, FR-73, FR-100; tasks 2.1; design S10 |
| 896 to 899 `pressLevelButton` | same, for levels | same | FR-87, FR-73, FR-100 |
| 766 to 778 `selectSize` | press, assert `asks = hasPlayerEntries && checkedSize !== size`, confirm if asked | open if closed, mark, `pressStart`, assert `asks = hasPlayerEntries` (the term `checkedSize !== size` goes: «Почати» asks and makes a puzzle also for the size already shown), confirm if asked. Name kept, meaning "choose" | FR-101 (SD-Q2), FR-67, FR-43 |
| 906 to 917 `chooseLevel` | press, assert `asks = hasPlayerEntries && checkedLevel !== level` | same change | FR-101, FR-90, FR-67 |
| new | none | `markSize(root, n)`, `markLevel(root, level)` (mark only, open only when the stub is closed), `pressStart(root)` (click `[data-action="setup-start"]` of the sheet), a constant `START_LABEL = 'Почати'` beside `CLOSE_LABEL` (l. 793), optionally `sheetStartButton(root)` beside `sheetCloseButton` (l. 828) | FR-100, FR-101, FR-94 |
| 41 to 51 `PAGE_ORDER` | nine elements, sheet outside | unchanged | FR-68, tasks 2.1 |
| 937 to 950 `PageState` / `pageState`, 920 to 927 `FullState` / `fullState` | read `checkedSize` / `checkedLevel` | no code change. Reading note (A-47): with the sheet open and a choice marked these fields are the marked choice, not the board shown. A marking test must compare `snapshot`, `summaryText` and `boardSize` for "the board is unchanged" and read `checkedX` only for the marked state; tests that snapshot `fullState` before a marking press and compare after it fail on the `checked` fields by design | A-47 |
| 674 to 683 `checkedSize`, 876 to 885 `checkedLevel` | assert exactly one `aria-checked="true"` | no code change | A-47 |
| 952 `mountThenSelect`, 1197 `mountPlayedBoard` | call `selectSize` / `chooseLevel` | no edit; helper-only through the two choose helpers; the `reaching` count (calls that belong to reaching the played board) is unaffected because a choice still makes exactly one generator call per board | FR-101 |
| 174 `dispatchToggle` + stubs 141 to 164 | the closing `toggle` does not clear the stub's open state | optional (ambiguity 4): a mark helper that opens "only while closed" reads a stale open state after a test dispatched a closing toggle. Tests that dispatch it and then open again (scenarios «The next opening shows the board shown», «Closing without «Почати» discards…») call `openSheet` explicitly, which is safe either way | A-44, A-46 |
| `tests/play-page-helpers.test.ts` | popover-stub tests only | no existing test changes; new tests for `markSize`, `markLevel`, `pressStart` and the new `asks` rule are added (section 8, row H) | A-44, FR-101 |

## 5. Existing tests that change, per file

Format: `file:line, test name` | what pins the old behaviour | delta requirement / scenario | source | kind. All source rows include row 118 and A-47 where `aria-checked` is read. Line numbers are those of the tree at the time of writing.

### 5.1 `tests/play-page-setup-sheet.test.ts` (28 tests: 2 A, 5 B, 4 C, 7 D, 10 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.200 `Sheet structure at mount` | children of the sheet are `size, level, setup-close` (l. 216 to 220) | «Setup sheet»: four children, «Почати» before «Закрити» | FR-96, FR-101 | C |
| l.230 `The close button` | eight buttons in the sheet (l. 241 to 251) | «Setup sheet / The close button»: nine buttons, «Почати» before the close button | FR-96, FR-101 | C |
| l.285 to 316 `Other actions leave the sheet alone` (it.each 6 actions) | three children (l. 293, 313); `hidePopover` once "only by the size and level choice" (l. 314 to 315) | four children; `hidePopover` only by the «Почати» of a choice, never by a marking press. Body stays (the size and level actions go through the choose helpers); the count 3 becomes 4 and the messages are reworded | FR-96, FR-97, FR-101 | C |
| l.325 `Choosing a size closes the sheet and returns the focus` | `eight.click()` starts the puzzle, sheet closed, focus on summary | «Marking a size keeps the sheet open and the focus on the button» | FR-97(a), FR-59, FR-100 | D |
| l.340 `Choosing a level closes the sheet and returns the focus` | same for a level | «Marking a level keeps the sheet open and the focus on the button» | FR-97(a), FR-59, FR-100 | D |
| l.355 `The shown size and the shown level close the sheet and change nothing else` | `hidePopover` once per press, focus on summary | «The shown size and the shown level only mark»: `hidePopover` never, sheet open, focus on the pressed button, `showModal` never; compare `snapshot` + `summaryText` instead of `fullState().checked` (A-47) | FR-73, FR-97, FR-100 | D |
| l.382 `A press whose generation fails closes the sheet` | `sizeButton(root, 8).click()` | «A «Почати» whose generation fails closes the sheet»: mark 8, then «Почати» | FR-97(c), FR-101, FR-88 | D |
| l.421 `Escape, the close button and a closing toggle event change nothing` | `before = fullState` taken with the sheet open and nothing marked | scenario text: sheet opened "with «Поле 8×8» marked"; after the closing `toggle` `aria-checked` is back on the board shown in both groups (the marked choice is discarded). Add the mark and the assertion; take `before` before marking | FR-97(d), FR-100, A-46 | C |
| l.458 `A late toggle event does not steal the focus from the dialog` | `pressLevelButton(root, 2)` opens the dialog | "has marked «Задачка» and pressed «Почати»" | FR-98, FR-101 | B |
| l.158 `The summary stays when nothing was shown` (scenario text unchanged) | `pressLevelButton(first.root, 2)` + `dialogIsOpen` (l. 162), `pressSizeButton(second.root, 8)` (l. 173), `pressLevelButton(third, 2)` on an unavailable level (l. 182) | «Summary button / The summary stays when nothing was shown» reads "chooses" (reading rule): l.162 and l.173 become mark + «Почати»; l.182 stays a press on an unavailable level (a marking press) | FR-95, FR-101, FR-91 | B |
| l.502 to 503 `RUNS` table feeding l.506 `The sheet closes before the dialog opens ($name)`, l.543 `Escape returns the focus to the summary button ($name)` | `pressSizeButton(root, 8)` / `pressLevelButton(root, 2)` raise the dialog | «Sheet and confirmation»: "marks «Поле 8×8» and presses «Почати»" (one edit of the table serves three it.each tests) | FR-98, FR-101 | B (l.506, l.543) |
| l.521 `«Скасувати» returns the focus to the summary button ($name)` | same table | «…and drops the pending action»: adds "when the sheet is opened again `aria-checked` is on the board shown and a later «Нова головоломка» performs a puzzle of the board shown, not of the dropped pair" | FR-98, FR-90, A-45 | D |
| l.562 `A failed generation after «Так, почати» focuses the summary button` | `pressSizeButton(root, 8)` + dialog premise | "dialog open after marking «Поле 8×8» and pressing «Почати»" | FR-98, FR-88, FR-101 | B |
| l.579 `«Так, почати» performs the change and focuses the summary` | `pressSizeButton(root, 8)` | «…performs the marked pair and focuses the summary» | FR-98, FR-101 | D |
| l.601 `Choosing in the sheet returns the focus to the summary button` (FR-59 / NFR-9 describe) | `four.click()` starts a 4x4 puzzle at once and focus goes to the summary | «Почати» returns the focus to the summary button (mark 4, then «Почати», `document.activeElement` is the summary); its pair «Marking leaves the focus on the pressed button» is new (E) | FR-59, FR-97, FR-101 | D |
| l.124 `The summary follows every shown board`, l.144 `The summary follows «Нова головоломка» and keeps its text after a reset` | choose helpers | same text | FR-95, FR-101 | A |

### 5.2 `tests/play-page-size-selector.test.ts` (20 tests: 6 A, 11 B, 1 C, 2 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.115 `Size buttons are native buttons in the tab order, and a click on each ... selects its size` | `sizeButton(root, n).click()` then `boardSize(root) === n` (l. 124 to 126) | «Grid size selector / Size buttons are native buttons in the tab order»: a click marks its size. The `boardSize === n` assertion contradicts the delta (the board does not change); replace by "board still 6", keep `checkedSize === n` | FR-43, FR-73, FR-100 | C |
| l.132 `Choose 4x4 on a board without entries` | `pressSizeButton(root, 4)` (l. 141), `hidePopover` once (l. 160) | «Choose 4x4 on a board without entries» ("marks it, then presses «Почати»") | FR-43, FR-101 | B |
| l.164 `Choose 8x8 after play` | `pressSizeButton(root, 8)` (l. 171), dialog open, state unchanged | same | FR-43, FR-67, FR-101 | B |
| l.200 `Choose 8x8 after a win` | `pressSizeButton(root, 8)` (l. 209) | same | FR-43, FR-67 | B |
| l.221 `Going back to 6x6` | `pressSizeButton` x2 (l. 227, 232) | same | FR-43, FR-101 | B |
| l.242 `aria-checked stays on the shown size until the confirmation, and after «Скасувати»` | `pressSizeButton(root, 4)` (l. 245) | same | FR-43, FR-98 | B |
| l.255 `A change takes exactly one seed and passes the chosen size` | `pressSizeButton` x2 (l. 261, 263) | same | FR-43, FR-88, FR-101 | B |
| l.270 `The choice is not remembered` | `pressSizeButton(first, 8)` (l. 276) | text keeps "the player pressed «Поле 8×8»"; either a choice or a marking press satisfies it (ambiguity 6); the mark-only variant is covered by the new «Marked choice / The marked choice is not remembered» | FR-43, FR-100, TC-12 | B |
| l.319 `A generator error keeps the previous board` | `pressSizeButton(root, 8)` (l. 331) + confirm | same | FR-43, FR-88 | B |
| l.363 `A generator result of the wrong size keeps the previous board` | `pressSizeButton(root, 8)` (l. 368) | same | FR-43, FR-88 | B |
| l.473, l.484 `Violations in the givens of a new 8x8 board show at once` (2 tests) | `pressSizeButton(root, 8)` (l. 477, 488) | same | FR-43 | B |
| l.293, l.384, l.402, l.421, l.440, l.455 | `selectSize` only | `Hint and win at the chosen size`, `A failed change` | FR-43 | A |

### 5.3 `tests/play-page-size-control.test.ts` (8 tests: 1 B, 1 C, 3 D, 3 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.80 `a press on a board with entries leaves aria-checked on 6 while the dialog is open ...` | `pressSizeButton(root, 4)` + dialog | «aria-checked stays on the shown size until the confirmation» | FR-43, FR-98 | B |
| l.98 `with entries, a hint sentence, cell-hinted and cell-violation: «Поле N×N» changes nothing` (describe.each 4, 6, 8) | the shown-size press closes the sheet, `hidePopover` once, focus on summary (l. 108 to 123) | «The shown size only marks at every size»: `showModal` and `hidePopover` never called, sheet stub open, focus not on summary, `aria-checked` stays; mark-only helper | FR-73, FR-97, FR-100, FR-66 | D |
| l.127 `on an untouched board: «Поле N×N» takes no seed ...` | the same press on an untouched board closes the sheet (l. 148 to 150) | same scenario ("and again on a freshly mounted page of the same size with no player entries") | FR-73, FR-97, FR-100 | D |
| l.155 `after pressing the shown size, a press of another size on a board with entries still asks, then performs once` | two raw presses, the second raises the dialog | no delta scenario asserts a dialog from a bare second press. Nearest home: «A size marked and then another size marked» (marks only) and «Start button / … on a board with entries asks first». Replace or drop: orchestrator decision (ambiguity 3) | FR-73, FR-101 | C |
| l.171 `after a failed generation at mount, «Поле 6×6» generates a 6x6 board at once` | `pressSizeButton(root, 6)` generates | «With no board shown a press only marks and «Почати» generates»: mark 6 + «Задачка»..., then «Почати» | FR-73, FR-101 | D |

### 5.4 `tests/play-page-level-control.test.ts` (15 tests: 6 A, 5 B, 4 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.118 `Choose a level on a board without entries` | `pressLevelButton(root, 2)` (l. 124) | same name, "chooses «Задачка» (marks it, then presses «Почати»)", `(6, 2, 2)` | FR-87, FR-101 | B |
| l.170 `A level change after play asks first, then replaces the board` | `pressLevelButton(root, 3)` (l. 178) | same | FR-90, FR-101 | B |
| l.225 `A generator error keeps the previous board` | `pressLevelButton(root, 3)` (l. 237) | same | FR-88 | B |
| l.256 `A generator result of the wrong size keeps the previous board` | `pressLevelButton(root, 2)` (l. 261) | same | FR-88 | B |
| l.348 `The description does not move with a pending press` | `pressLevelButton(root, 2)` (l. 352) + dialog | reading-rule scenario of «Level option content» (unmodified requirement): needs a choice. Design lists the 15 reading-rule scenarios as helper-only; this one is B | FR-99, FR-101 | B |
| l.136, l.154, l.198, l.211, l.271, l.312 | choose helpers only | `The level reaches the generator at 8x8`, `Board content...`, `A level change after a win asks first`, `The size is untouched`, `The level is not remembered`, `No description line on the page body` | FR-87 | A |

### 5.5 `tests/play-page-level-4x4.test.ts` (8 tests: 2 A, 1 B, 1 C, 3 D, 1 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.73 `The 4x4 state of the level control` | `selectSize(root, 4)` then read | «The 4x4 state after «Почати»» (chooses «Поле 4×4» "and opens the sheet again"); the pair «…follows the marked size» is new (E) | FR-91, FR-100 | D |
| l.161 `The buttons are available again at 6x6 and 8x8` | `pageAt4x4()` then `selectSize(6)`, `selectSize(8)` | delta GIVEN: the sheet opened with a marked size 4×4 on a 6×6 board; "presses «Поле 6×6», and later «Поле 8×8» (marking presses)"; asserts after each press no `aria-disabled`, «Розминка» checked, reason hidden. Rewrite with mark-only presses | FR-91, FR-100 | C |
| l.175 `A failed change to 4x4 keeps the available levels` | `pressSizeButton(root, 4)` (l. 182) + confirm | same text with "chooses" | FR-91, FR-88 | B |
| l.207 `The shown level is a no-op at every level (size $n, level $level) ...` (it.each 5 rows) | `pressLevelButton` closes the sheet, `hidePopover` once, focus on summary (l. 223, 246 and assertions l. 233 to 235, 252 to 255) | «The shown level only marks at every level» | FR-73, FR-97, FR-100 | D |
| l.258 `With no board shown, a level button generates` | `pressLevelButton(root, 2)` generates (l. 267) | «With no board shown a press only marks and «Почати» generates» | FR-73, FR-101 | D |
| l.99 `The reason is hidden at 6x6 and 8x8`, l.120 `An unavailable level is focusable` | `selectSize` / `pageAt4x4` | same text | FR-91 | A |

### 5.6 `tests/play-page-level-interplay.test.ts` (18 tests: 7 A, 11 B)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.127 `One confirmation covers a size change to 4 and the level reset` | `pressSizeButton(root, 4)` (l. 134) | same text ("chooses") | FR-92, FR-67, FR-101 | B |
| l.151 `Cancelling the size change keeps the level` | `pressSizeButton(root, 4)` (l. 155) | same | FR-92, FR-98 | B |
| l.198 `A level change on an untouched board opens no dialog` | `pressLevelButton(root, 4)` (l. 203) | same | FR-90, FR-101 | B |
| l.211 `A level change on a board with entries asks and changes nothing yet` | `pressLevelButton(root, 2)` (l. 219) | same | FR-90, FR-67 | B |
| l.232 `$name drops the pending level` (it.each) | `pressLevelButton(root, 2)` x2 (l. 241, 254) | `«Скасувати» and Escape drop the pending level` ("choosing «Задачка» again opens the dialog a second time") | FR-90, FR-98, A-45 | B |
| l.261 `«Так, почати» performs the level change after the dialog closed` | `pressLevelButton(root, 2)` (l. 266) | same | FR-90 | B |
| l.338, l.354, l.375, l.397, l.421 (level rows of the confirmation tables) | `pressLevelButton(root, 2)` (l. 343, 362, 379, 405, 429) | rows "chooses «Задачка»" in «Confirmation before discarding player entries» | FR-67, FR-90 | B (5) |
| l.80, l.93, l.109, l.168, l.181, l.287, l.312 | choose helpers / `mountPlayedBoard(n, undefined, level)` | `«Нова головоломка» keeps the level`, `A size change to 6 or 8 keeps the level`, `A size change to 4 sets the level to 1 in one puzzle`, `Going back from 4x4...`, `A level change from 2 to 4...`, `New puzzle keeps the chosen level`, `Reset keeps the level` | FR-92 | A |

### 5.7 `tests/play-page-confirm.test.ts` (14 tests: 6 B, 1 C, 7 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.65 `ACTIONS` table (feeds l.169, l.197, l.287, l.404) | «Поле 8×8» press raises the dialog | rows "chooses «Поле 8×8»" in «A board with entries asks first», «Так, почати», «Скасувати», «A solved board still asks». One edit of the table | FR-67, FR-101 | B (4 it.each) |
| l.118 `table: «Нова головоломка», «Поле 4×4» and «Скинути» act at once ...` | `pressSizeButton(root, 4)` (l. 140) | «No player entries means no dialog» (row "chooses «Поле 4×4»") | FR-67, FR-101 | B |
| l.310 `a cancelled action is dropped ...` | `pressSizeButton(root, 8)` (l. 313) | «Confirmation ...» + «A cancelled confirmation drops the marked pair» | FR-67, FR-98, A-45 | B |
| l.327 `A cancelled or no-op action takes no seed: ...` | `pressSizeButton(root, 6)` "the size shown" raises the dialog or is a no-op (l. 338); `showModalCalls() === 3` | «A cancelled or no-op action takes no seed» changed: "with the sheet open, presses the size button of the size shown, the level button of the level shown, «Поле 8×8» and «Задачка» as marking presses (no «Почати») and then «Закрити»"; the marking presses and «Закрити» replace the shown-size press; `showModal` stays 3 | FR-67, FR-73, FR-100 | C |

### 5.8 `tests/play-page-retry.test.ts` (9 tests: 6 A, 2 B, 1 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.97 `Three run-outs keep everything` | `pressLevelButton(root, 3)` (l. 106) + confirm | same text ("chooses «Головоломка» and presses `[data-confirm="yes"]`") | FR-88, FR-101 | B |
| l.123 `A confirmation is asked once for a retried change` | `pressLevelButton(root, 2)` (l. 135) | same | FR-88, FR-67 | B |
| l.53, l.64, l.82, l.143, l.161, l.176 | choose helpers | `Success on the first/second/third seed`, `An ordinary error is not retried`, `A result of the wrong size...`, `The retry covers the size change...` | FR-88 | A |

### 5.9 `tests/play-page-level-seed.test.ts` (3 tests: 2 A, 1 C)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.58 `A cancelled or no-op action takes no seed (with the level)` | `pressSizeButton(root, 6)` and `pressLevelButton(root, 1)` as "shown" presses (l. 71 to 72); l.65 and l.67 raise dialogs | the changed «A cancelled or no-op action takes no seed» (double home with 5.7): l.65 and l.67 become choices, l.71 and l.72 become marking presses followed by «Закрити» | FR-67, FR-73, FR-100 | C |
| l.40 `A level change takes exactly one seed ...`, l.80 `A level change that shows a new puzzle clears it` | choose helpers | same text | FR-88 | A |

### 5.10 `tests/play-page-new-puzzle-and-seed.test.ts` (13 tests: 3 A, 1 C, 9 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.182 `Seed calls follow the puzzles generated: seeds 1..4 ...` | `pressSizeButton(root, 4)` twice (l. 190, 193) and the second "takes no seed"; then `pressSizeButton(root, 8)` (l. 196) | changed text: chooses «Поле 4×4», opens the sheet and presses «Поле 4×4» again (a marking press of the size already marked, then «Закрити»), chooses «Поле 8×8»; seeds 1, 2, 3, 4 with sizes 6, 6, 4, 8 | FR-43, FR-51, FR-73, FR-100 | C |
| l.91, l.114, l.211 | `selectSize` | `New puzzle keeps the chosen size`, `Hint message cleared by a size change` | FR-43, FR-66 | A |

### 5.11 `tests/play-page-hinted-cell.test.ts` (18 tests: 2 A, 3 B, 13 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.189 `A size change to ${size} removes the marker` | `pressSizeButton(root, size)` (l. 192) + dialog | «Later board changes remove the marker» table row "by a choice (mark and «Почати»)" | FR-66, FR-101 | B |
| l.208 `A level change to «Задачка» removes the marker ...` | `pressLevelButton(root, 2)` (l. 211) | same table | FR-66, FR-101 | B |
| l.314 `A level change that needs the confirmation, then «Скасувати», keeps the marker` (via `chooseLevelAndCancel`, l. 75 to 79: `pressLevelButton` at l. 76) | raw press | «Actions that change no cell keep the marker» / cancelled confirmation | FR-66, FR-67 | B |
| l.259, l.342 | `selectSize` | `A hint with no rule applying...`, `A failed generation keeps the marker` | FR-66 | A |
| l.300 `Opening the setup sheet ... and clicking [data-action="setup-close"] keeps the marker` | open + close | unchanged; the new table row (marking presses then close) is a new test (E) | FR-66, FR-100 | unchanged |

### 5.12 `tests/play-page-keyboard.test.ts` (11 tests: 2 A, 1 C, 8 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.83 to 112 `T2 Showing a board does not move the focus ...` (the sheet part, l. 95 to 103) | raw `four.click()` asserts a performed change (3 generator calls, board 4×4) and focus on summary | design.md says "helper updates only"; it is not. Under the delta the click only marks: split into «Marking leaves the focus on the pressed button» (E) and «Почати» returns the focus (D target of «Choosing in the sheet...»); the new-puzzle and reset focus lines of the same test are unchanged | FR-59, FR-97, FR-101 | C |
| l.149 `T5`, l.216 `T8` | `mountThenSelect` | `Arrow, Home and End keys are not handled`, cell focus | FR-59 | A |

### 5.13 `tests/play-page-highlighting.test.ts` (19 tests: 3 A, 1 B, 15 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.317 `A size change recomputes the highlights ...` | `pressSizeButton(root, 4)` (l. 325) + `dialogIsOpen` then confirm; design.md lists the file as helper-only, it is not | same name, "chooses «Поле 4×4»" | FR-38, FR-43, FR-101 | B |
| l.137, l.158, l.172 | `mountThenSelect` | `Too many zeros in a row of an 8x8 board` etc. | FR-36 | A |

### 5.14 `tests/play-page-wcag.test.ts` (3 tests: 1 A, 1 C, 1 unchanged)

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.60 to 98 `Every button, the radiogroups, the setup sheet and the board have a ... Ukrainian accessible name` | 52 buttons (l. 74), `names` 52 + 4 (l. 76); list of names without «Почати» | «Every button ...»: 53 buttons (36 cells + 17 others), names include «Почати»; add `START_LABEL` to the contains-list | NFR-9, FR-101, NFR-5 | C |
| l.112 `The level radiogroup exposes its state` | `selectSize(root, 4)` | same text | NFR-9, FR-91 | A |

### 5.15 `tests/play-page-stylesheet.test.ts`, `tests/play-page-level-stylesheet.test.ts`, `tests/ui-strings.test.ts`, `tests/play-page-techniques.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| `play-page-stylesheet` l.228 `Every page button is a button element ...` | list of buttons and `toHaveLength(1 + 1 + 7 + 1 + 3 + 1 + 2 + 36)` (l. 250), no «Почати» | «Every page button is a button element»: the list adds `[data-action="setup-start"]`; count +1 | FR-65, FR-101 | C |
| `play-page-level-stylesheet` l.135 `The existing stylesheet scans still pass` | asserts "no 14th colour token" with exactly 13 `--color-*` (l. 148) | the delta drops "stay exactly 13": the 13 names stay declared, a token the signed design adds for «Почати» is allowed. The `toHaveLength(13)` on `Object.keys(parsed.tokens)` contradicts that; loosen it. Final form pending task 1.3 (the review set decides whether a token exists) | FR-65, design S7 | C (final form pending 1.3) |
| `ui-strings` l.161 to 178 `The strings live in the strings module ...` | `wanted` list without «Почати» | «The strings live in the strings module»: adds the start label | FR-94, NFR-5 | C |
| `play-page-techniques` l.166 `The new texts are Ukrainian` | required list without «Почати» | «The new texts are Ukrainian»: adds «Почати» | FR-94, NFR-5 | C |
| `play-page-techniques` l.117, l.192 | `chooseLevel`, `selectSize` | `The panel survives a level change`, `The techniques items and the reason...` | FR-93 | A |

### 5.16 Remaining helper-only files (A only)

| File | Tests (line) | Reading-rule or ordinary scenario |
|---|---|---|
| `tests/play-page-cells.test.ts` | l.91, l.109, l.377 (via `mountAtSize`), l.305 | `Every cell is a native button` rows, labels per size, `A new board has fresh names` |
| `tests/play-page-rules-and-reset.test.ts` | l.120, l.156, l.174, l.191, l.214, l.257 (via `mountAtSize`) | `Reset` scenarios |
| `tests/play-page-semantics.test.ts` | l.115, l.128, l.138, l.237, l.382 | `The group name follows the size`, `A failed size change keeps the board and its name`, four ids, `The same elements carry every message` |
| `tests/play-page-layout.test.ts` | l.321, l.429 | `The panel survives every board change`, `The order and the message area survive every board change` |
| `tests/play-page-logo.test.ts` | l.164 | `The logo survives every board change` |
| `tests/play-page-page-text.test.ts` | l.63 | `Accessible names at every size` |
| `tests/play-page-rendering.test.ts` | l.61 | `Board follows the chosen size` |
| `tests/play-page-level-hint.test.ts` | l.64 | `The same board gives the same hint at every level` |

## 6. Renamed scenarios (the 12 baseline names missing from the delta)

| Baseline name (requirement) | Existing test home | New name in the delta | Kind of the existing test |
|---|---|---|---|
| Choosing a size closes the sheet and returns the focus (Choosing and closing the sheet) | `setup-sheet` l.325 | Marking a size keeps the sheet open and the focus on the button | D |
| Choosing a level closes the sheet and returns the focus | `setup-sheet` l.340 | Marking a level keeps the sheet open and the focus on the button | D |
| The shown size and the shown level close the sheet and change nothing else | `setup-sheet` l.355 | The shown size and the shown level only mark | D |
| A press whose generation fails closes the sheet | `setup-sheet` l.382 | A «Почати» whose generation fails closes the sheet | D |
| Choosing in the sheet returns the focus to the summary button (Every cell is its own Tab stop) | `setup-sheet` l.601, `keyboard` l.83 | «Почати» returns the focus to the summary button (+ new «Marking leaves the focus on the pressed button») | D, C |
| The 4x4 state of the level control (Only the first level exists at 4x4) | `level-4x4` l.73 | The 4x4 state after «Почати» (+ new «…follows the marked size») | D |
| The shown size is a no-op at every size (Pressing the shown size changes nothing) | `size-control` l.98, l.127 | The shown size only marks at every size | D |
| The shown level is a no-op at every level | `level-4x4` l.207 | The shown level only marks at every level | D |
| With no board shown, a size button generates | `size-control` l.171 | With no board shown a press only marks and «Почати» generates | D |
| With no board shown, a level button generates | `level-4x4` l.258 | same new name (two baseline names, one delta name) | D |
| «Скасувати» returns the focus to the summary button (Sheet and confirmation) | `setup-sheet` l.521 | «Скасувати» returns the focus to the summary button and drops the pending action | D |
| «Так, почати» performs the change and focuses the summary | `setup-sheet` l.579 | «Так, почати» performs the marked pair and focuses the summary | D |

## 7. The 15 reading-rule scenarios of `design.md` (checked one by one)

| Scenario (requirement) | Home | Result |
|---|---|---|
| Board follows the chosen size («Board rendering and default size») | `rendering` l.61 | A |
| Too many zeros in a row of an 8x8 board («Highlight a line with too many of one digit») | `highlighting` l.137 | A |
| New puzzle keeps the chosen size («New puzzle button») | `new-puzzle-and-seed` l.91, l.114 | A |
| New puzzle keeps the chosen level | `level-interplay` l.287 | A |
| Accessible names at every size («Ukrainian page text») | `page-text` l.63 | A |
| Reset keeps the level («Reset button») | `level-interplay` l.312, `rules-and-reset` | A |
| The panel survives every board change («Rules panel») | `layout` l.321, `techniques` l.117 | A |
| The order and the message area survive every board change («Page document order») | `layout` l.429 | A |
| A new board has fresh names («Cells expose a Ukrainian name and their state») | `cells` l.305, `semantics` l.237 | A |
| The same elements carry every message («The hint and win messages are status regions») | `semantics` l.382 | A |
| The group name follows the size («The board is a labelled group of cell buttons») | `semantics` l.115 | A |
| A failed size change keeps the board and its name | `semantics` l.128 | A |
| The description does not move with a pending press («Level option content») | `level-control` l.348 | B, not helper-only: it raises the dialog with a raw press. Contradicts design.md "they should need helper updates only" |
| The same board gives the same hint at every level («The page hint uses all four techniques») | `level-hint` l.64 | A |
| The logo survives every board change («Logo») | `logo` l.164 | A |

Result: 14 of 15 are helper-only; 1 needs a call-site edit.

## 8. New tests (the 47 delta names with no baseline name, and the new rows)

Homes follow tasks.md 2.2 and 2.4 ("extend" = new tests in an existing file). 11 of the 47 names are targets of renames (section 6, kind D, marked "target" below); the other 36 are pure-new scenarios.

| Requirement, delta scenario | File | Source | Pure new / target |
|---|---|---|---|
| Marked choice (6): Marking changes only the marked choice; The next opening shows the board shown; Closing without «Почати» discards the marked choice by every route; Marking 4×4 sets the marked level to «Розминка»; With no board shown the sheet opens on the mount values; The marked choice is not remembered | `tests/play-page-marked-choice.test.ts` (new file) | FR-100, FR-73, FR-91, FR-43, FR-88, A-46 | 6 new |
| Pressing the shown size changes nothing: A size marked and then another size marked; An unavailable level press does nothing at all | `play-page-marked-choice.test.ts` | FR-73, FR-100 | 2 new |
| same requirement: The shown size only marks at every size; The shown level only marks at every level; With no board shown a press only marks and «Почати» generates | `play-page-marked-choice.test.ts` (rewritten from `size-control` l.98, l.127, l.171 and `level-4x4` l.207, l.258) | FR-73, FR-100, FR-101 | 3 targets |
| Start button (10): structure at mount; makes one puzzle with both marked values; the order of the two marks does not matter; with the marked choice equal to the board shown still makes a puzzle; on a board with entries asks first; a cancelled confirmation drops the marked pair; a failed generation keeps everything; with no board shown generates at once; with no board shown a failed «Почати» leaves the mount values; is a Tab stop inside the sheet in document order | `tests/play-page-start-button.test.ts` (new file) | FR-101, FR-67, FR-98, FR-88, FR-94, FR-100 | 10 new |
| Grid size selector: A size press only marks | `play-page-size-selector.test.ts` | FR-43, FR-100 | 1 new |
| Level selector: A level press only marks | `play-page-level-control.test.ts` | FR-87, FR-100 | 1 new |
| Only the first level exists at 4x4: The 4x4 state of the level control follows the marked size | `play-page-level-4x4.test.ts` | FR-91, FR-100 | 1 new |
| same: The 4x4 state after «Почати» | `play-page-level-4x4.test.ts` (from l.73) | FR-91 | 1 target |
| Size and level interplay: A size and a level marked together make one puzzle; One confirmation covers a size and a level marked together; Marking 4×4 and then 6×6 keeps «Розминка» and marks no board | `play-page-level-interplay.test.ts` | FR-92, FR-100, FR-101 | 3 new |
| A level change follows the confirmation rule: A level press alone asks nothing | `play-page-level-interplay.test.ts` | FR-90, FR-100 | 1 new |
| Confirmation before discarding player entries: «Почати» asks, marking does not | `play-page-confirm.test.ts` | FR-67, FR-101 | 1 new |
| Choosing and closing the sheet: «Почати» closes the sheet and returns the focus | `play-page-setup-sheet.test.ts` | FR-97(c), FR-101 | 1 new |
| same: Marking a size keeps the sheet open and the focus on the button; Marking a level keeps ...; The shown size and the shown level only mark; A «Почати» whose generation fails closes the sheet | `play-page-setup-sheet.test.ts` (from l.325, l.340, l.355, l.382) | FR-97, FR-100, FR-101 | 4 targets |
| Sheet and confirmation: «Скасувати» returns the focus ... and drops the pending action; «Так, почати» performs the marked pair ... | `play-page-setup-sheet.test.ts` (from l.521, l.579) | FR-98, FR-101, A-45 | 2 targets |
| Summary button: Marking leaves the summary alone | `play-page-setup-sheet.test.ts` | FR-95, FR-100 | 1 new |
| Every cell is its own Tab stop: Marking leaves the focus on the pressed button | `play-page-keyboard.test.ts` or `setup-sheet` (FR-59) | FR-59, FR-97 | 1 new |
| same: «Почати» returns the focus to the summary button | `play-page-keyboard.test.ts` / `setup-sheet` l.601 | FR-59, FR-101 | 1 target |
| Hint message stays ...: Marking a size or a level keeps it | `play-page-level-seed.test.ts` (holds the other hint-message scenarios) | FR-40, FR-100 | 1 new |
| WCAG: The radiogroups expose the marked state while the sheet is open | `play-page-wcag.test.ts` | NFR-9, FR-100 | 1 new |
| Colours: The start button declares its colours | `play-page-level-stylesheet.test.ts` (waits for task 1.3; the single exception of tasks.md 1.3) | FR-65, FR-101 | 1 new |
| Touch-target floor: The stylesheet declares a 44 px minimum height for the three buttons | `play-page-action-buttons-stylesheet.test.ts` (new tests; the existing 7 stay) or a new stylesheet file | NFR-12, FR-101 | 1 new |
| same: Measured in a real browser «Почати» is at least 44 px in both directions | `e2e/nfr-12-targets.spec.ts` (section 9) | NFR-12 | 1 new |
| Accessibility sweep: The marked state passes the sweep; «Почати» shows a focus indicator | `e2e/nfr-13-a11y.spec.ts` (section 9) | NFR-13, FR-100, FR-101 | 2 new |
| New rows inside scenarios whose names exist (kind: new test in the same file): «Hinted cell marker / Later board changes remove the marker» row "presses «Почати» with the marked choice equal to the board shown (one run)"; «Actions that change no cell keep the marker» row "marks «Поле 8×8» and «Задачка», then clicks setup-close" | `play-page-hinted-cell.test.ts` | FR-66, FR-101, FR-100 | 2 new tests |
| Helper self-tests: `markSize`, `markLevel` (open only when the stub is closed; `aria-checked` moves; no `hidePopover`), `pressStart`, the `asks` rule of the choose helpers | `play-page-helpers.test.ts` (about 4 tests) | A-44, FR-101 | 4 new |

Check, summing the rows of the table in order: 6 + 2 + 3 + 10 + 1 + 1 + 1 + 1 + 3 + 1 + 1 + 1 + 4 + 2 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 2 = 47 delta names (36 new + 11 targets), plus 2 new rows and about 4 helper self-tests outside the 47.

## 9. e2e

| File, line | Today | Change | Source | Kind |
|---|---|---|---|---|
| `e2e/helpers.ts` l.21 to 43 `sel` | no hook for «Почати» | add `start: '[data-action="setup-start"]'` | FR-101 | C |
| `e2e/helpers.ts` l.80 to 86 `chooseSize` | open sheet, click `[data-size-option="n"]`, click `confirmYes` if a dialog opened, expect the board | open the sheet (only if not open: a click on the summary of an open `popover="auto"` closes it), click the option (mark), click `sel.start`, confirm if a dialog opens, expect the board. Name and signature stay so the '4x4' state keeps its meaning | NFR-12, NFR-13, FR-101 | C |
| `e2e/helpers.ts` (new) | none | a mark-only helper (`markSize` / `markLevel`) that opens the sheet only if not open and clicks without «Почати». tasks.md 2.4 also names `chooseLevel`, which does not exist in `e2e/helpers.ts` (the specs use `sel.levelOption` locators); no `chooseLevel` is needed unless a spec calls it | FR-100 | E |
| `e2e/nfr-12-targets.spec.ts` l.48 to 53 | sheet at 6×6: size options, level options, close | add `...(await measure(page.locator(sel.start), 'sheet start'))` to `sheetControls` | NFR-12, FR-101 | C |
| `e2e/nfr-12-targets.spec.ts` l.66 to 67 | sheet at 4×4: level options | add the `sel.start` measurement at 4×4. Summary button (l. 35) and «Закрити» (l. 51) stay | NFR-12 | C |
| `e2e/nfr-12-targets.spec.ts` l.61, l.64 `chooseSize(page, 8)`, `(page, 4)` | via helper | helper update only | NFR-12 | A |
| `e2e/nfr-13-a11y.spec.ts` l.18 to 26 `STATES` | no marked state | add `'setup sheet with a marked choice that differs from the board'`: open the sheet, mark «Поле 8×8» and «Мозколамка» through the mark-only helper (clicks), no «Почати» (light and dark, both viewports) | NFR-13, FR-100 | C |
| `e2e/nfr-13-a11y.spec.ts` l.25 `setup sheet at 4x4` | `chooseSize(page, 4); openSheet` | helper update only | NFR-13 | A |
| `e2e/nfr-13-a11y.spec.ts` l.69 `expected` | `... 'setup-close', ...` | add `'setup-start'`; no `look()` change (`kind` falls to `data-action`) | NFR-13, FR-101 | C |
| `e2e/nfr-10-fit.spec.ts` | no sheet use | no change | | unchanged |

## 10. Tests that match the grep but must NOT change (and why)

| File | Tests | Why they do not change |
|---|---|---|
| `tests/play-page-setup-sheet.test.ts` | l.95, l.116, l.186, l.223, l.254, l.271, l.445, l.472, l.484 and l.405 | Summary structure and name, page order, sheet position, "opens and closes with no script" (attribute checks and an empty popover log), two mounts, the rules-panel late toggle, the light-dismiss-by-cell and no-focus scenarios have the same text in the delta. l.405 `An unavailable level leaves the sheet open`: delta wording became "marked size 4×4 (or the page shows a 4×4 board)"; the test uses the 4×4 board and a raw click on an unavailable level, which still marks nothing and still passes. It also stays a guard. |
| `tests/play-page-level-4x4.test.ts` | l.129 `Pressing an unavailable level changes nothing` | Delta text changed to "marking presses" but the test already presses unavailable levels on a shown 4×4 board with the sheet open and asserts nothing changes, `hidePopover` never, sheet open. Passes before and after: a guard, not evidence that marking works. |
| `tests/play-page-size-selector.test.ts` | l.91, l.108 | Structure and default (scenario text unchanged). |
| `tests/play-page-size-control.test.ts` | l.41, l.58, l.69 | Structure, tab-order attributes, no free value. |
| `tests/play-page-level-control.test.ts` | four structure and content tests (l.75 and the three content tests) | Texts unchanged. |
| `tests/play-page-controls-text.test.ts` | all 5 | No delta scenario of its own. tasks.md 2.2 and the design table name this file for «Почати», but the FR-94 scenario «The strings live in the strings module» already lives at `tests/ui-strings.test.ts` l.161; the matches here are `[data-control="size"]` reads. Recommend: change `ui-strings`, not this file (ambiguity 5). |
| `tests/play-page-semantics.test.ts` | l.138, l.169 id tests | Ids stay four per mount (A-41 moves only in `add-theme-switch`); they pass through `selectSize` / `chooseLevel` (A) but assert nothing about the sheet's children. |
| `tests/play-page-rendering.test.ts` | the ids test (l. 128 to 139) | Four ids per mount, eight in two mounts, unchanged. |
| `tests/play-page-page-text.test.ts` | l.33, l.81, l.121 | The collector picks up «Почати» automatically (Cyrillic, no Latin); the button-label test names only the two page buttons. |
| `tests/play-page-stylesheet.test.ts` | l.74 `Tokens exist: 13 names`, other 25 tests | `TOKEN_NAMES` is a fixed list of 13 in `tests/helpers/css.ts`; the test passes with a 14th token. Pending task 1.3: do not change now. |
| `tests/play-page-level-stylesheet.test.ts` | 5 tests (summary and level colours, 4.5:1, unavailable cue, checked cue, classes) | Text unchanged. |
| `tests/play-page-action-buttons-stylesheet.test.ts` | all 7 | The three action buttons only; new tests for «Почати», the summary button and «Закрити» are added (section 8 row 38). |
| `tests/play-page-helpers.test.ts` | all 66 existing | design.md S9 says the file tests "the choose helpers press once and expect a new puzzle"; it does not. It tests the popover stubs (l. 778 to 842), fixtures and css helpers. They stay; only new tests are added (row H). |
| `tests/play-page-hinted-cell.test.ts` | the other 13 | marker scenarios unrelated to the sheet. |
| `tests/play-page-layout.test.ts` | the other 17 | The design table says "sheet content order, tab order inside the sheet": the file holds neither (those live in `setup-sheet` l.200 and `wcag`). |
| `tests/play-page-confirm.test.ts` | the other 7 | Dialog at mount, naming, Escape, cleared entries, A-29 on `pressNew` etc. |

## 11. Counts, ambiguities and conflicts

Counts of existing test entries that the slice touches (it / it.each entries; an it.each counts once):

| Kind | Tests | Note |
|---|---|---|
| A, helper update only | 65 | no edit in the test file |
| B, scenario changes, call-site edit only (assertions unchanged) | 46 | plus e2e none |
| C, scenario changes, assertions change | 16 | (setup-sheet 4, size-selector 1, size-control 1, level-4x4 1, level-seed 1, new-puzzle 1, keyboard 1, wcag 1, confirm 1, techniques 1, stylesheet 1, level-stylesheet 1, ui-strings 1) |
| D, renamed and rewritten | 13 | 12 baseline names; setup-sheet 7, size-control 3, level-4x4 3 |
| Total existing tests that change or are affected | 140 | 75 of them need an edit (B + C + D) |
| E, new tests | 36 pure-new scenario names (+ 11 rename targets already counted as D) + 2 new rows in hinted-cell + about 4 helper self-tests + 3 e2e (nfr-12 one probe change, nfr-13 state and sweep) | the spec has 47 delta-only scenario names |
| e2e | `helpers.ts` 3 edits (`sel`, `chooseSize`, mark-only helper), `nfr-12` 2 edits, `nfr-13` 2 edits + 1 helper-only | |

Ambiguities and conflicts the orchestrator should decide or know:

1. Fate of `pressSizeButton` / `pressLevelButton`. Task 2.1 keeps the names of the choose helpers (`selectSize`, `chooseLevel`) and adds `markSize`, `markLevel`, `pressStart`. It does not say whether the raw presses stay. If they become mark-only, the 46 B call sites need an appended `pressStart(root)` (or `markX` + `pressStart`); if they are removed, replace each by `markX` + `pressStart`. Either way the assertions of B do not change. Recommended: remove them and use `markX` / `pressStart` explicitly, so no name hides a changed meaning.
2. design.md's "helper updates only, no scenario change expected" row is wrong for: `play-page-keyboard` T2 (raw click, FR-59), `play-page-highlighting` l.317, `play-page-hinted-cell` l.189, l.208, l.314, `play-page-level-control` l.348 (a reading-rule scenario), and `play-page-techniques` l.166 (adds «Почати» to a required list). Its "button count 52 to 53, ids stay four" for `semantics` is in `wcag` instead; `layout` has no sheet-order test.
3. `play-page-size-control` l.155 asserts that two raw presses raise a dialog. No delta scenario asserts that. Replace or drop; I did not decide. Its premise ("a press of the shown size does not disturb a later change") is now covered by «A size marked and then another size marked».
4. `dispatchToggle(sheet, 'closed')` does not clear the stub's open state, so a mark helper that opens "only while closed" will see a stale open state in the scenarios that dispatch a closing toggle and "open the sheet again". Optional helper fix: let `dispatchToggle` set or clear the stub state. If not done, those tests call `openSheet` explicitly (safe).
5. `play-page-controls-text.test.ts` is named in tasks.md 2.2 and the design table for «Почати»; no delta scenario homes there. Recommend `ui-strings.test.ts` for FR-94 and NFR-5, `controls-text` untouched.
6. Scenario texts in MODIFIED blocks that still say "pressed" (for example «Grid size selector / The choice is not remembered»: "the player pressed «Поле 8×8»") are satisfied by either a choice or a marking press; I kept the existing choice call (B) and rely on the new «Marked choice / The marked choice is not remembered» for the mark-only variant.
7. tasks.md 2.2 says «Start button» has nine scenarios; the delta has ten (the audit S1 scenario «With no board shown a failed «Почати» leaves the mount values» was added). tasks.md should say ten.
8. Double-homed scenario: «A cancelled or no-op action takes no seed» exists in both `play-page-confirm.test.ts` l.327 and `play-page-level-seed.test.ts` l.58; both change.
9. `e2e/helpers.ts` has no `chooseLevel`; tasks.md 2.4 says `chooseSize` and `chooseLevel` stay mark plus «Почати». Only `chooseSize` exists.
10. Pending task 1.3 (do not change now): `play-page-level-stylesheet` l.148 "no 14th colour token" and the new colour test «The start button declares its colours». `tests/helpers/css.ts` `TOKEN_NAMES` stays 13 (the baseline names stay declared either way).
11. Scenarios with no test home: none. Every delta scenario has a file in tasks.md 2.2 or 2.4 (see section 8). The nearest to homeless: «Hint message stays ... / Marking a size or a level keeps it» (no hint-message file for the sheet; placed in `play-page-level-seed.test.ts`, which holds the other hint-message scenarios) and the 44 px declaration test (no file named; `action-buttons-stylesheet` or a new stylesheet file).
12. Mutation-style check of the new stylesheet tests (tasks.md 2.5 optional) and the red run are out of this task.

Self-check of this list: the 29 grep files are all accounted for in sections 5 to 10; the 38 changed-text scenarios and the 12 renamed names map to tests above; the 140 existing tests = 65 A + 46 B + 16 C + 13 D.
