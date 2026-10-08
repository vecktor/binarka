# Tasks: reconcile-ux-accessibility

Order of work: section 1 (tests) is written FIRST from the delta spec and seen red in section 2 before section 3 is implemented. No database exists (TC-12), so the DB smoke flow of the template is the real-browser page check of section 5. Dependencies and database schema: none (no new dependency, TC-10; nothing stored; `src/engine/` untouched). Commits that touch `src/` carry `Slice: reconcile-ux-accessibility` and `Refs: FR-59` (or `FR-60`, `FR-61`, `FR-62`, `FR-63`, `FR-65`, `NFR-9`). Every test is tagged `@trace FR-x` or `@trace NFR-x` (plain ids). A test never imports `src/ui/strings.ts`; exact texts are literals in the tests. Never `--no-verify`; commits are signed and not squashed.

Decisions D1 (`:has()` allowed in the one idle-line selector; now in the signed FR-65 row) and D2 (colour literals mapped onto the 13 tokens) were taken by the user on 2026-10-09; the FR-60 test shape was confirmed, and the four additions of about 01:20 (focus sentences and strict key handling in FR-59 and FR-60, the DOM rules of FR-61 and FR-62, status regions that stay rendered while empty in FR-63) are signed in `docs/requirements.md` (autonomy-log row 79). The merge is committed as `603b631` (signed). Tasks 1.6, 3.6a, 3.7, 3.8 and 3.9 carry the decisions out.

**The user's rule for this change:** a test may be added, changed or removed ONLY when that follows from a changed requirement, spec sentence or project rule; every other test stays untouched. Legend for the tables: **R** rewritten (the file keeps a test for the same behaviour, edited), **X** removed, **A** added, **U** untouched. Each row names the sentence the fate derives from: a sentence of the signed rows of `docs/requirements.md` (quoted as they read now, with the row 79 additions), or of the baseline spec `openspec/specs/play-page/spec.md` (quoted by requirement name), or an explicit design decision of this change. Old tests are numbered in file order (kb-01 is the first test of `play-page-keyboard.test.ts`, and so on).

## 1. Failing tests first (red)

- [x] 1.1 Read `docs/qa/reconcile-ux-main-merge-run.txt` and `git show 603b631 -- tests/` (the signed merge commit) once, so the 81 failing tests below are matched against the real files. Every file named here was read; the account of the 81 is in 1.8.
- [x] 1.2 `tests/helpers/play-page.ts` and `tests/helpers/css.ts`, helper changes (each follows from a changed requirement; no assertion is weakened):
  - remove `sizeSelect` (the temporary shim of the merge; FR-62: no `select`), `ownLabelText` (FR-62: no `label`), `tabStopCells`, `rowEls`, `expectTabStop` (FR-59: no Tab stop; FR-61: no row elements); in `css.ts` remove `hidingDeclarations` (FR-62: no `size-label`). Keep `pressKey`, `focusCell`, `expectActive`, `expectFocusOn` (still used).
  - add `pressKeyEvent(el, type, key, init)` for `keydown` or `keyup` (bubbling, cancelable, `repeat` and the modifiers through `init`, the same uncaught-error check as `pressKey`); `pressKey` stays as the keydown shortcut and its three self-tests stay untouched. The delta scenarios dispatch `keyup` and `repeat: true` (FR-60: «The page SHALL NOT handle key events on a cell»), which `pressKey` (keydown only, `tests/helpers/play-page.ts:429`) cannot do. One self-test is added (A) in `play-page-helpers.test.ts`: the `keyup` bubbles and is cancelable, carries key, modifiers and `repeat`, `defaultPrevented` follows a listener, and a throwing listener fails the helper.
  - replace `cellName(row, col, text)` («Рядок R, стовпець C: V») by `expectedCellLabel(cell)`, which builds the FR-70 label from `data-row`, `data-col`, the text, `data-given` and the class `cell-hinted` (FR-61: the name is the FR-70 label). The helper is written independently of the page (no import of `strings.ts`).
  - the reset tests use `resetBoard` (already in the file; it presses «Скинути» and confirms when entries exist), not a new helper (see 1.5).
  - NOT changed: `expectPageStructure` keeps the UX body; restoring `main`'s grid/status checks in it would turn about 49 calls in 10 files red for no signed reason. The roles are asserted by the dedicated tests below.
- [x] 1.3 `tests/play-page-keyboard.test.ts` (39 tests, all red now). Eleven replacement tests, none added (T5 is a rewrite of kb-21 and kb-23). Replacement tests, each tagged `@trace`: T1 FR-59, T2 FR-59, T3 FR-59, T4 FR-59, T5 FR-59, T6 FR-59 + FR-33, T7 FR-59, T8 FR-60, T9 FR-60 + FR-33, T10 FR-60, T11 FR-33 + FR-60. Spec scenarios in brackets.
  - T1 [Every cell is a Tab stop in reading order]: no `tabindex` anywhere in the root; the last size button < cell (1,1) < … < cell (6,6) < hint button.
  - T2 [Showing a board does not move the focus]: a new puzzle, a size change and a reset (untouched board, so performed at once) leave focus on the pressed button.
  - T3 [A hint leaves the focus on the hint button]: with a fill (PAIR_ROW) and without (ISOLATED).
  - T4 [Showing a board does not move the focus]: mounting leaves the outside button focused.
  - T5 R [Arrow, Home and End keys are not handled] (from kb-21 and kb-23): at N = 4, 6, 8: ArrowUp/Down/Left/Right, Home, End, Ctrl+Home, Ctrl+End, Shift+Arrow, Alt+Arrow on a cell, and Arrow, Enter and space on `[data-board]` itself: not prevented, focus on the same cell, no cell changed.
  - T6 [Keys on a given cell change nothing and move nothing]. T7 [Other keys are not prevented]: Tab, Shift+Tab, PageDown, PageUp, Escape, `a`.
  - T8 [A cell keeps the focus after its value changes]: focus a non-given cell, click three times, same element is `activeElement` after each; at 4x4, 6x6, 8x8.
  - T9 [A click on a given changes nothing and leaves the focus on it] (the played board of kb-34: violation shown, hint sentence shown). T10 [The page does not handle Enter or Space]: `keydown` and `keyup` (through `pressKeyEvent`) of Enter and Space, plain, Ctrl, Alt, Shift, `repeat: true`: not prevented, nothing changes. T11 [Enter and Space key events on a given cell change nothing].

  | Old test | Fate | Derives from |
  |---|---|---|
  | kb-01 Exactly one Tab stop at mount | R → T1 | FR-59: «no element of the page has a `tabindex` attribute»; the cells are reached «after the size control and before the hint button» |
  | kb-02 New puzzle resets the Tab stop, focus stays | R → T2 | FR-59: «Showing a board (at mount, after a new puzzle, a size change or a reset) never moves the focus»; the Tab-stop half has no object (no `tabindex`) |
  | kb-03 Size change resets the Tab stop, focus stays | R → T2 | same; the focused control is a size button, not a select (FR-43, FR-62) |
  | kb-04 Failed size change keeps the Tab stop | X | FR-59: «no element of the page has a `tabindex` attribute», so there is no Tab stop to keep |
  | kb-05 Failed new puzzle keeps the board and its Tab stop | X | same; «generation fails keeps the board» is FR-43 and has its own tests |
  | kb-06 Hint fill leaves Tab stop and focus | R → T3 | FR-59: «a hint leaves the focus on the hint button»; the Tab-stop half has no object |
  | kb-07 Hint fill does not reset a Tab stop elsewhere | X | FR-59: no `tabindex`, so no Tab stop |
  | kb-08 Focus makes a cell the Tab stop | X | FR-59: «no element of the page has a `tabindex` attribute», so a focused cell cannot become a Tab stop; the sentence this test pinned («The Tab stop follows focus: a `focusin` listener on the board makes the cell that receives DOM focus … the Tab stop») was in the baseline requirement «The board is a single Tab stop», now renamed and rewritten |
  | kb-09 Hint that fills nothing leaves Tab stop and cells | X | Tab-stop half: FR-59 (no `tabindex`); unchanged-cells half: FR-25/FR-26 (hint tests, U); focus half: T3 |
  | kb-10 Hint that fills nothing leaves a Tab stop elsewhere, and focus | R → T3 | FR-59: «a hint leaves the focus on the hint button» (focus half only) |
  | kb-11 Cycling a cell leaves the Tab stop (Enter) | R → T8 | FR-60: «the cell keeps the focus after its value changes» |
  | kb-12 Enter/Space on a non-Tab-stop cell leave the Tab stop | X | FR-59: no `tabindex`, so no Tab stop; the focus half is T8 |
  | kb-13 Arrow keys move one cell | X | FR-59: «no key (including Arrow, Home, End, PageUp, PageDown, Escape and letters) moves the focus, changes a cell or is default-prevented by the page»; the movement rules left with the REMOVED requirement «Arrow, Home and End keys move the focus»; the «not handled» check is T5 |
  | kb-14 Arrow keys stop at edges | X | same |
  | kb-15 Edges follow N (4x4, 8x8) | X | same |
  | kb-16 Home and End move within the row | X | same |
  | kb-17 Home and End at 4x4 and 8x8 | X | same |
  | kb-18 Ctrl+End and Ctrl+Home | X | same |
  | kb-19 Keys on a given navigate and change nothing | R → T6 | FR-59 (same sentence) + FR-33; «navigate» is gone |
  | kb-20 The position comes from the event target | X | FR-59: «The page handles no key event on the board or its cells», so no position is computed from the target |
  | kb-21 Modified keys are not handled and not prevented | R → T5 | FR-59: the same sentence, with Ctrl, Shift and Alt (the Shift and Alt cases are kept in T5) |
  | kb-22 Keys the board does not handle are not prevented | R → T7 | FR-59: «no key … is default-prevented by the page; Tab and Shift+Tab are the browser's»; the premise «an arrow IS prevented» is dropped |
  | kb-23 A keydown outside a cell is ignored | R → T5 | FR-59: «The page handles no key event on the board or its cells» (the target `[data-board]` is kept in T5) |
  | kb-24 Enter cycles a player cell | R → T10 | FR-60: «The page SHALL NOT handle key events on a cell; activation is the native button's» (jsdom cannot turn Enter into a click; design decision 3); the cycle itself is FR-34 (click-cycle tests, U) |
  | kb-25 Space cycles a player cell | R → T10 | same |
  | kb-26 A held key cycles once | R → T10 (`repeat: true`) | same sentence: a repeated key event is a key event the page does not handle; the browser's button repeats the click |
  | kb-27 Modified Enter and Space are not handled | R → T10 | same, with Ctrl, Alt and Shift |
  | kb-28 A click moves the Tab stop and focus to a cell | X | FR-60: «the clause on moving the Tab stop is DROPPED, not re-expressed»; the cycling half is FR-34 (U); the focus half is T8 |
  | kb-29 Enter and Space do not move the focus | R → T8 | FR-60: «the cell keeps the focus after its value changes» |
  | kb-30 Keyboard play reaches the win message | X | needs a key to cycle: none exists in jsdom and the page handles none (FR-60: «activation is the native button's»; design decision 3, the user's FR-60 test shape); the win by clicks is FR-41 (win tests, U); the focus-on-win half is sem-25 |
  | kb-31 Three equal digits made with Enter | X | same; the click variant is FR-35 (highlighting tests, U) |
  | kb-32 Keys and clicks give the same board | X | same; with no key handler the two paths are one |
  | kb-33 Highlight appears at once after Enter or Space (FR-38) | X | same; the baseline scenario «Highlight appears immediately after Enter or Space» is deleted by the MODIFIED «Highlighting follows every board change». FR-38's key path is covered only by the browser step 5.4a |
  | kb-34 A click on a given moves only the Tab stop and the focus | R → T9 | FR-60: «on a given cell (`aria-disabled="true"`) they change nothing»; no Tab stop moves (dropped clause); the cell keeps the focus |
  | kb-35 Clicking a given three times keeps the focus on it | R → T9 | same |
  | kb-36 Enter and Space on a given change nothing, are prevented | R → T11 | FR-60: «on a given cell … they change nothing»; «prevented» becomes «not prevented» («The page SHALL NOT handle key events on a cell») |
  | kb-37 At 4x4 and 8x8 a click moves the Tab stop, new puzzle resets it | R → T8 | FR-60: «the cell keeps the focus after its value changes»; the sizes are kept in T8 |
  | kb-38 After a rebuild one Enter still cycles once | X | its target was a double key listener after a rebuild; FR-60: the page handles no key event on a cell |
  | kb-39 Mounting the page does not move DOM focus | R → T4 | FR-59: «Showing a board (at mount, …) never moves the focus»; only `expectTabStop` is dropped |

- [x] 1.4 `tests/play-page-semantics.test.ts` (25 tests, 24 red now; sem-24 is green and stays). Fates are by the delta requirements «The board is a labelled group of cell buttons», «Cells expose a Ukrainian name and their state», «The size radiogroup has an accessible name», «The hint and win messages are status regions».

  | Old test | Fate | Derives from |
  |---|---|---|
  | sem-01 Roles and name of the default board: grid, 6 rows | R | FR-61: `role="group"`, `aria-label` «Поле N×N»; «The board's children are exactly its cells, and no cell carries a `role` attribute»; no grid, row or gridcell role (FR-61, point (c)) |
  | sem-02 The grid name follows the size (4, 8) | R | same |
  | sem-03 A failed size change keeps the grid and its name | R | same |
  | sem-04 The cell contract is unchanged; no id | R | the play-page spec's id rule (preamble «Ids», FR-61 requirement): exactly three ids (panel, its heading, confirmation text), each ending in a number, no `for`; `role="gridcell"` assertion removed |
  | sem-05 Two mounts have no duplicate id (and none at all) | R | the id rule (as sem-04): six ids, pairwise different |
  | sem-06 The digit stays the text; the name is a separate attribute | R | FR-61: name = FR-70 label («Рядок 3, стовпець 1, 0, задано») |
  | sem-07 Names of a fresh board | R | same; examples from the delta scenario |
  | sem-08 The name follows a click, Enter and Space | R | same; three clicks (no key can cycle in jsdom) |
  | sem-09 The name follows a hint fill | R | same; suffix «, підказка» |
  | sem-10 A new puzzle and a size change give fresh names | R | same |
  | sem-11 A size change gives names for the new board | R | same |
  | sem-12 Givens are read-only: `aria-readonly` | R | FR-61: `aria-disabled="true"` on givens only, no `aria-readonly` on any element |
  | sem-13 A violation is exposed: `aria-invalid` | U | FR-61 `aria-invalid` kept (red now, green through 3.2) |
  | sem-14 The invalid state is removed with the highlight | U | same |
  | sem-15 A line with too many of one digit is invalid as a whole | U | same |
  | sem-16 Violating givens are invalid at once, each also read-only | R | FR-61: `aria-readonly` → `aria-disabled` |
  | sem-17 The violation cue is also in the DOM (FR-64) | U | FR-64 kept (red now, green through 3.2) |
  | sem-18 The select is labelled (wrapping label) | R | FR-62: «accessible name «Розмір поля» (`aria-label`, no visible label …)» and «no text of the page shows «Розмір поля»»; no `label`, no `select`, no `for` |
  | sem-19 The label is visible (computed style) | X | FR-62: «no visible label» |
  | sem-20 Two mounts label their own selects | X | FR-62 (no label); the ids/`for` half moved into sem-04 and sem-05 |
  | sem-21 The label does not break the selector (options, value) | R | FR-62: «each size button is labelled by its own visible text «Поле N×N» and carries no `aria-label` or `aria-labelledby`»; the select behaviour is FR-43 (size-control tests, U) |
  | sem-22 Status regions present, empty, typed at mount | U | FR-63 kept (red now, green through 3.3) |
  | sem-23 The same two elements carry every message | R (one line, changed by the orchestrator after the implementer stopped on it) | FR-67 «… ask for confirmation only when the board has player entries …»: after the hint fill and the click the board has entries, so `pressNew` only opens the dialog; the line becomes `startNewPuzzle` (press, then «Так, почати»), as in sem-10, rst-01 and rst-02. The role assertions are unchanged. This second reason was hidden behind the missing `role="status"` in the red run. |
  | sem-24 Focus never moves to a message | U | FR-63; green now |
  | sem-25 A click that wins leaves the focus on the clicked cell | R | FR-60: a click no longer moves the focus (jsdom `click()` does not focus); the test focuses the cell first and asserts it keeps the focus |
  | new: The idle line has no role | A | FR-63: «the idle line of FR-71 has no role» |

- [x] 1.5 Smaller files.

  | Old test | Fate | Derives from |
  |---|---|---|
  | `play-page-rendering` «two mounts keep separate Tab stops and have no duplicate ids» | R | FR-59 (no `tabindex` in either mount) and the FR-61 id rule (three ids per mount, six different); the other nine tests U |
  | `play-page-reset-accessibility` rst-01 names and states after a reset | R | FR-61 (the name is the FR-70 label, via `expectedCellLabel`; `aria-invalid`). Second reason, a pre-existing mismatch: the baseline requirement «Reset button» says «When the board has player entries, pressing it SHALL first ask for confirmation (FR-67) and reset only after «Так, почати»» (FR-58 as amended, FR-67), so a raw click on «Скинути» opens the dialog and resets nothing. The failure was hidden behind the label failure in the red run. The file defines a local `pressReset` at line 28 (`q(root, '[data-action="reset"]').click()`) that shadows the helper; both rewritten tests use `resetBoard(root)` from the helpers instead, and the local definition is deleted |
  | rst-02 aria-invalid from givens survives a reset; `aria-readonly` on givens | R | FR-61: `aria-disabled` on givens, no `aria-readonly`; same confirmation rule and same `resetBoard` (it also hides behind the `aria-readonly` failure) |
  | rst-03 The Tab stop stays where the player moved it | X | FR-59: «no element of the page has a `tabindex` attribute» and «the page handles no key event on the board or its cells»; it moved a Tab stop with arrow keys |
  | `play-page-wcag` wcag-01 every button, the select and every gridcell has a name | R | NFR-9 / delta: buttons (cells and radios included: `aria-label` else text), the radiogroup and the board group; 46 buttons and two groups |
  | wcag-02 no positive tabindex, before and after play | R | FR-59: «no element of the page has a `tabindex` attribute» (stronger than the old «no positive tabindex», kept as NFR-9 scenario); the premise «the cells carry tabindex» is dropped |
  | `play-page-page-text` pt-01 Static page text | R | FR-61/FR-70: the 36 cell names use the FR-70 label (`expectedCellLabel`); the rest of the test is unchanged |
  | pt-02 Accessible names at every size | R | the delta MODIFIED «Ukrainian page text»: pattern `/^Рядок [1-8], стовпець [1-8], (порожньо\|0\|1)(, задано\|, підказка)?$/` |
  | the other five tests of `play-page-page-text` | U | |

- [x] 1.6 `tests/play-page-stylesheet.test.ts` (31 tests, 8 red now).

  | Old test | Fate | Derives from |
  |---|---|---|
  | ss-01, 03, 06 tokens exist; no named colour; no `--color-*` outside `:root` | U | FR-65 colour scan unchanged |
  | ss-02 No colour literal, ss-04 shorthands, ss-05 colour properties (red now) | U | FR-65 colour scan, unchanged (D2 option A: no new token, no spec change); green through 3.7 |
  | ss-07 The named rules take their colours from the named tokens | R | FR-65 (signed): the list is cells and buttons; `select:focus-visible` leaves the loop |
  | ss-08 The button and select rule takes text, fill and border from the control tokens (red now) | R | FR-65: `['button']` only |
  | ss-09…14 contrast (6 tests) | U | |
  | ss-15 Focus-visible rules exist for cell, button and select | R | FR-65: `.cell:focus-visible` and `button:focus-visible` |
  | ss-16 The cell ring is outside the border | U | |
  | ss-17 The button and select rings have a positive offset | R | FR-65: `button:focus-visible` only |
  | ss-18 Nothing removes the outline | U | |
  | ss-19 No `:has(` and no `!important` (red now) | R | the user's decision D1 (project rule 20 changed) and the delta sentence «SHALL NOT contain `:has(` except in the one selector that hides the idle line»: now «no `!important`; exactly one rule contains `:has(`, its subject is `.message-idle`, its only declaration is `display: none`» (scenario «… with one `:has(` exception»); green through 3.8 |
  | ss-20 No rule uses `display: contents` | U | kept in the FR-61 requirement (design decision 6); its describe title («rows are kept in the accessibility tree and the label is not hidden») and the comment on the test are stale and stay as they are, the test body is unchanged |
  | ss-21 The size-label rules have no hiding declaration (red now) | X | FR-62: no label, no `.size-label` rule |
  | ss-22 The label computes a display (red now) | X | same |
  | ss-23 The select declares color and background-color (red now) | R | FR-65: the size buttons declare `color` and `background-color` tokens, unchecked and checked, with 4.5:1 between them (delta «The size buttons set their own colours …») |
  | ss-24 The board sets `touch-action: manipulation` | U | |
  | ss-25…31 the cascade at 4, 6, 8 and the helper check | U | FR-64 kept (the border widths 1/2/3/3 pass now) |
  | new: Empty hint and win regions stay rendered | A | FR-63: «While empty they stay rendered (not `display: none`, so the first message is announced)» (delta scenario «Empty status regions stay rendered»): computed `display`/`visibility` of the two empty regions in the injected stylesheet, and no rule with subject `.message`, `.message-win` or `[data-message=…]` that declares `display: none` or `visibility: hidden`. Red now: `.message:empty { display: none }` |
  | new: Every page button is a `button` element, so `button:focus-visible` applies | A | FR-65: «every cell and every page button … shows a `:focus-visible` indicator» (delta scenario «Every page button is a button element») |

- [x] 1.7 `tests/play-page-helpers.test.ts` (helper self-tests; green now) and the two source scans.

  | Old test | Fate | Derives from |
  |---|---|---|
  | «tabStopCells, rowEls, expectTabStop and focusCell …» | R | the three helpers are removed (FR-59, FR-61); the test keeps `focusCell` (taking focus, and failing on an element that cannot). Its fixture `sampleBoard()` (about line 605) builds `role="row"` and `tabindex` markup: it is rebuilt as a small set of buttons plus one `div` that cannot take focus |
  | «cellName spells the Ukrainian name» | R | becomes `expectedCellLabel` (FR-61 → FR-70 format) |
  | «ownLabelText drops the select …» | X | helper removed (FR-62) |
  | «hidingDeclarations finds every way to hide the label» | X | helper removed (FR-62) |
  | the three `pressKey` tests and all other self-tests | U | |
  | new: `pressKeyEvent` dispatches a bubbling, cancelable `keyup`/`keydown` with key, modifiers and `repeat` | A | FR-60: the delta scenarios dispatch `keyup` and `repeat: true`; see 1.2 |
  | `tests/ui-strings.test.ts` source scan, `tests/play-page-controls-text.test.ts` source scan (red now) | U | rule «Cyrillic only in `strings.ts`»; green when 3.4 deletes `src/ui/grid.ts` |

- [x] 1.8 Account of the 81 failing tests (the sum is checked against `docs/qa/reconcile-ux-main-merge-run.txt`): keyboard 39 (20 R, 19 X), semantics 24 (16 R, 2 X, 6 U), stylesheet 8 (3 R, 2 X, 3 U), wcag 2 (2 R), reset-accessibility 3 (2 R, 1 X), page-text 2 (2 R), rendering 1 (1 R), ui-strings 1 (U), controls-text 1 (U). Totals: 46 R, 24 X, 11 U (the U go green through 3.2, 3.3, 3.4, 3.7). Besides the 81: R ss-07, ss-15, ss-17 (green now); helper self-tests 2 R and 2 X (green now); A (4): the idle-line test (semantics), the empty-status-regions test and the page-button test (stylesheet), the `pressKeyEvent` self-test (helpers). The keyboard file goes from 39 to 11 tests. No other test changes; `git diff --stat -- tests/` is attached to the commit and shows no other file.
- [x] 1.9 In each rewritten file, keep the header comment true (it names scenarios of an archived change): point it at `openspec/specs/play-page/spec.md`.

## 2. Confirm red

- [x] 2.1 (done: 22 red, all assertions; the listed sem-04 to sem-12, sem-18, sem-21, sem-25 were already green, see `docs/qa/reconcile-ux-accessibility-red-run.txt`) Run `npm run test:run`. Expected red, for the right reason: sem-01…12, 16, 18, 21, 25 (no `role="group"`, no `aria-disabled` names, no `aria-invalid`, no `role="status"`), wcag-01, rendering/reset/page-text rewrites that read the FR-70 label or the new roles, the new idle-line test, the new empty-status-regions test (`.message:empty { display: none }`), the stylesheet tests of 1.6 that read the CSS, and the two source scans (`grid.ts`). Not an import error and not a failure in an untouched test.
- [x] 2.2 Record which rewritten tests are green at the start and why (T1 to T11, the focus tests, the radiogroup-name tests: the UX page already has no `tabindex`, no key handler and a named radiogroup). They are regression guards, not proof of the new behaviour; the red ones are. Save the output and the two lists to `docs/qa/reconcile-ux-accessibility-red-run.txt`.
- [x] 2.3 Check that autonomy-log row 79 records the user's answers of 2026-10-09 (D1, D2, the FR-60 test shape, the four additions of about 01:20) and that `docs/requirements.md` carries them (FR-59, FR-60, FR-61, FR-62, FR-63, FR-65 and the closing note). Nothing is added to either file by this change.

## 3. Implementation

- [ ] 3.1 `src/ui/play-page.ts`, `showPuzzle`: give the board `role="group"` and `aria-label` from `sizeLabel(n)` (no new string; `strings.ts` unchanged). Cells stay direct children.
- [ ] 3.2 `refreshHighlights`: for every cell, `setAttribute('aria-invalid', 'true')` when marked, else `removeAttribute('aria-invalid')` (never `"false"`). A given in a violation keeps `aria-disabled` and gains `aria-invalid`. It runs after every board change, a reset included.
- [ ] 3.3 Give the hint and win `<p>` elements `role="status"` at creation; the idle line gets no role; the elements are never replaced, only their text changes.
- [ ] 3.4 Delete `src/ui/grid.ts` (no importer: verified by `grep`); run the two source scans.
- [ ] 3.5 `src/ui/style.css`, board layout, verify only: in `603b631` `.board` is already the UX grid (`display: grid; grid-template-columns: repeat(var(--n), minmax(0, var(--cell-max))); gap: 2px; justify-content: center; touch-action: manipulation`) and there is no `.board-row` rule. Do not edit; the screenshots of 5.1 are the evidence.
- [ ] 3.6 `src/ui/style.css`, dead and listed rules: remove `select:focus-visible` from the `button:focus-visible, select:focus-visible` rule (FR-65 lists cells and buttons); keep `.cell:focus-visible` and `button:focus-visible` as they are (every page button is a `<button>`); keep the `.cell-violation` 3px border after `.cell-given` and `.cell-hinted` so it wins (FR-64); no `display: contents`.
- [ ] 3.6a `src/ui/style.css`, empty status regions (FR-63, signed): replace `.message:empty { display: none; }` by a rule that gives an empty message zero height and margin (`min-height: 0; margin: 0;`), so that the hint and win elements stay rendered while empty and the first message is announced. The idle line is never empty and is unaffected; a message that holds text keeps the layout of `.message` unchanged; the idle-line `:has(...:not(:empty)...)` rule still matches. Evidence for the layout: 5.1 and 5.5 screenshots, and the accessibility tree in 5.3.
- [ ] 3.7 `src/ui/style.css`, colours (D2 option A, decided): map every literal onto the 13 tokens, no new token. Mapping: `#fff` and the unchecked size button's `background: transparent` → `--color-control-bg`; `#1f2937` and the size buttons' `#4b5563` → `--color-text`; `#9ca3af`, `#6b7280` → `--color-control-border`; `#2563eb` (checked border, `.mini-answer` dashes) → `--color-focus`; `.cell-hinted` `#4b5563` → `--color-given-border`; `#d1d5db`, `#e5e7eb`, `#dbeafe` → `--color-given-bg`; `#f9fafb` → `--color-page`; `::backdrop` `rgba()` → `background-color: var(--color-text)` with `opacity: .45` (dialog) and `.3` (rules). Borders as longhands (`border-width`, `border-style`, `border-color`; `border-color: transparent` is allowed). The size buttons set `color` and `background-color` tokens in `.size-control button` and in `.size-control button[aria-checked='true']`, at least 4.5:1 between them (`--color-text` on `--color-control-bg`, and on `--color-given-bg` when checked). Run the stylesheet tests; ss-02, ss-04, ss-05 stay unchanged. The drift from the frozen look is accepted until G2 ports the palette; it is photographed in 5.2.
- [ ] 3.8 `src/ui/style.css`, `:has(` (D1 option 1, decided): keep exactly one rule with `:has(`, the idle-line rule (`.messages:has([data-message='hint']:not(:empty), [data-message='win']:not(:empty)) .message-idle { display: none; }`), with no other declaration; no `!important` anywhere. The delta sentence and scenario already say so; ss-19 is rewritten in 1.6.
- [ ] 3.9 `docs/frontend-conventions.md`: rule 1, rule 10, §2 (rules 5 to 9), rule 15, rule 20 (a row for the one `:has(` exception on the idle line, per D1), gap table rows G1, G2, G9, the status line, as listed in `design.md` «Other edits at archive».
- [ ] 3.10 Run `npm run test:run`: every test green; the removed tests are only those of 1.3 to 1.7; no stub or `TODO` in `src/ui/`. Unauthorized, forbidden and inline validation errors do not apply: the page has no authentication and no input (play-page Exclusions).

## 4. Review gate

- [ ] 4.1 Run the review-gate with `change: reconcile-ux-accessibility` (one run, one fix round for confirmed defects, one confirming run). Ask the reviewer in particular: does any removed test in 1.3 to 1.7 guard behaviour that no remaining test guards; does any rewritten test assert less than the sentence it derives from; is `git diff --stat -- tests/` limited to the files and tests of this list.
- [ ] 4.2 Record the report path in `docs/current-state.md` (evidence path, not a verdict).

## 5. Real-browser check (do not tick a task until its evidence exists)

No database exists; this section is the smoke test. Current Chromium, `npm run dev`, viewports 375 px and 1280 px. Screenshots go to `docs/qa/reconcile-ux-accessibility/` and are named `<viewport>-<what>-<short commit>.jpg`. The check is observed evidence, not a pass of the held NFR-10 to NFR-14.

- [ ] 5.1 Start `npm run dev`, open the printed URL at 375 px and at 1280 px, take `375-mount` and `1280-mount`. Evidence: files exist; the board shows 6 columns of cells in a square-cell grid (this verifies 3.5).
- [ ] 5.2 Take `375-8x8` (press «Поле 8×8»), `1280-8x8`, a board with a violation (three equal digits in a row) and a hint-filled cell at 375 px; confirm the violation border is visibly heavier than the ordinary and given cells, that the checked size button is distinguishable, and record the drift from the frozen look (D2: the checked size button, the dialog and rules panel colours, the hinted border) against the reference screenshots under `design/v0-screenshots/`; save `375-drift-notes` as a short list with the screenshot paths.
- [ ] 5.3 Accessibility tree (Chromium DevTools, Accessibility pane, at 1280 px): the board is a `group` named «Поле 6×6»; a given cell is a `button` named «Рядок R, стовпець C, V, задано» and shows as disabled-for-interaction; a violating cell reports invalid; the size control is a `radiogroup` named «Розмір поля» with three radios; the hint and win messages are `status`, and they are present in the tree while empty (not ignored, FR-63: not `display: none`). Save a screenshot of the pane, taken before any message exists.
- [ ] 5.4 Keyboard walk, no mouse, at 1280 px: from the address bar press Tab: «Правила», «Поле 4×4», «Поле 6×6», «Поле 8×8», cell (1,1), …, cell (6,6) in reading order, «Підказка», «Скинути», «Нова головоломка». Press Enter on a cell: it cycles to 0; Space: to 1; again: empty; the focus ring stays on the same cell (FR-60). Press ArrowRight, Home, End on a cell: nothing moves, the page does not scroll differently (FR-59). Enter on a given: nothing changes. Take `1280-focus-cell` and `1280-focus-button` showing the ring.
- [ ] 5.4a Real Enter and Space (the jsdom tests cannot press them): on an empty non-given cell press Enter three times and Space three times, with no mouse; record the digit after each press (0, 1, empty, 0, 1, empty) and that the focus ring stays on the same cell each time; on a given cell press Enter and Space and record that nothing changes and the ring stays; press Enter on a size button and check it selects the size (a dialog if entries exist). Evidence: `1280-enter-space-cell.jpg` (cell after the third press with the ring) and a list of the observed digits in `docs/qa/reconcile-ux-accessibility/README.md`.
- [ ] 5.5 Idle line: it shows at mount and hides after «Підказка» (the one `:has(` rule of D1); at 375 px take `375-hint-shown`, and compare the layout of the message area with `375-mount` (empty regions take no space; with text the layout is as before 3.6a). Open «Правила» (popover), press «Зрозуміло»; press «Скинути» after two moves: the dialog opens with focus on «Скасувати».
- [ ] 5.6 Record the evidence paths and what was observed (and what was not) in `docs/current-state.md`; stop the server. Tick 5.1 to 5.5 (5.4a included) only with their files in place.

## 6. Validation, docs and archive

- [ ] 6.1 Run `npm run lint`.
- [ ] 6.2 Run `npm run test:run`.
- [ ] 6.3 Run `npm run build`.
- [ ] 6.4 Run `npx openspec validate reconcile-ux-accessibility --strict`.
- [ ] 6.5 Run `npx openspec validate --all --strict`.
- [ ] 6.6 Update `README.md` (keyboard use: Tab, Enter and Space; no arrow keys), `docs/current-state.md` (last update in UTC+5:30, phase, evidence paths from section 5, a «Scope NOT delivered» line: held NFR-10 to NFR-14, real screen readers, the D2 palette drift until G2), `docs/mvp-capability-plan.md` (one line for this change), and cite autonomy-log row 79 (already recorded by the orchestrator; no new row is needed for the answers).
- [ ] 6.7 Smoke gate: section 5 is the manual smoke test of this change; re-run 5.3 to 5.5 (5.4a included) after the last code change. Archive (6.8) happens only when 6.1 to 6.6 passed and 5.1 to 5.6 (5.4a included) are ticked with evidence.
- [ ] 6.8 Run `npx openspec archive reconcile-ux-accessibility --yes` (a normal merge, NOT `--skip-specs`); in the same commit apply the nine preamble replacements of `design.md` «Preamble replacement text» to `openspec/specs/play-page/spec.md` by hand; then run `grep -n 'tabindex\|Tab stop\|aria-readonly\|gridcell\|role="row"\|role="grid"\|: порожня' openspec/specs/play-page/spec.md` and read every hit.
- [ ] 6.9 Run `npx openspec validate --all --strict` and `npm run check:trace` (FR-59 to FR-65, NFR-9 and NFR-5 cited and traced; no active change left except the three UX-line changes that are not this one).
