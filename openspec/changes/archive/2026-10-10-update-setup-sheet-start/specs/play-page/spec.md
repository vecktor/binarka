## ADDED Requirements

### Requirement: Marked choice

While the setup sheet is open the page SHALL hold a marked size and a marked level (FR-100). Each time the sheet opens they equal the size and the level of the board shown; with no board shown (the generation at the mount failed) they are 6×6 and «Розминка», the mount values. A press on an available size button or level button SHALL set the marked size or the marked level and move `aria-checked` in that group, and SHALL do nothing else (FR-73, see «Pressing the shown size changes nothing»). While the sheet is open `aria-checked="true"` is on the marked size and the marked level; while the sheet is closed it is on the size and the level of the board shown (A-47). Marking 4×4 SHALL set the marked level to «Розминка» (FR-91); marking 6×6 or 8×8 afterwards keeps «Розминка» as the marked level and does not restore an earlier marked level. Closing the sheet by the close button «Закрити», by Escape or by a click outside the sheet (the light dismiss of `popover="auto"`) SHALL discard the marked choice with no change to the board, the messages, the highlights, `cell-hinted`, the size, the level or the summary. Test contract: jsdom has no popover, so the test dispatches the sheet's closing `toggle` event itself (A-44, A-46). A press of «Почати» SHALL use the marked choice (see «Start button»). In every case `aria-checked` is back on the board shown in both groups when the sheet closes, and the next opening shows the board shown. The marked choice is game state and is never stored: a reload or a new mount starts at 6×6 and «Розминка» (FR-43, FR-88, TC-12).

Traces: FR-100, FR-73, FR-91, FR-43, FR-88

#### Scenario: Marking changes only the marked choice

- **GIVEN** a mounted 6×6 board at «Розминка» with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted` and some cells with `cell-violation`, a counting seed source, a `generate` spy and the `showModal` spy with the counts read now, and the sheet opened through the stubbed `showPopover()`
- **WHEN** the player presses «Поле 8×8» and then «Мозколамка» (two marking presses, no «Почати»)
- **THEN** `aria-checked="true"` is on «Поле 8×8» only in the size control and on «Мозколамка» only in the level control
- **AND** the board keeps `data-size="6"` and every cell text, the messages, the `cell-violation` set, the `cell-hinted` cell and the summary text `6×6 · Розминка` are unchanged
- **AND** `showModal` and `hidePopover` were never called, the sheet's stub state is open, and the seed-source and generator call counts equal the counts read now

#### Scenario: The next opening shows the board shown

- **GIVEN** the page of the previous scenario with «Поле 8×8» and «Мозколамка» marked
- **WHEN** the test dispatches a `toggle` event with `newState` `closed` on the sheet, then opens the sheet again through the stubbed `showPopover()`
- **THEN** `aria-checked="true"` is on «Поле 6×6» only and on «Розминка» only, and the summary still reads `6×6 · Розминка`

#### Scenario: Closing without «Почати» discards the marked choice by every route

- **GIVEN** the page of the first scenario, in three runs, each with «Поле 8×8» and «Мозколамка» marked
- **WHEN** in the first run the player presses the close button «Закрити», in the second run the test dispatches an Escape `keydown` on the sheet, and in the third run the test gives DOM focus to a non-given cell (as a click outside the sheet does in a browser); in each run the test then dispatches a `toggle` event with `newState` `closed` on the sheet and opens the sheet again
- **THEN** in every run `aria-checked="true"` is on «Поле 6×6» only and on «Розминка» only, the board, the messages, the highlights, `cell-hinted` and the summary are unchanged, and no seed was taken and no generator call was made
- **AND** the Escape `keydown` has `defaultPrevented` false (the page adds no key handler, FR-59)

#### Scenario: Marking 4×4 sets the marked level to «Розминка»

- **GIVEN** a mounted 6×6 board without entries, the sheet opened, and «Мозколамка» marked
- **WHEN** the player marks «Поле 4×4» and then «Поле 8×8» (two marking presses, no «Почати»)
- **THEN** after «Поле 4×4» `aria-checked="true"` is on «Розминка» only, «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`, `[data-level-reason]` shows its text, and the summary still reads `6×6 · Розминка`
- **AND** after «Поле 8×8» `aria-checked="true"` is still on «Розминка» only (the earlier marked level is not restored), no level button has `aria-disabled`, and `[data-level-reason]` is hidden

#### Scenario: With no board shown the sheet opens on the mount values

- **GIVEN** a page whose generation at the mount threw, so no board is shown
- **WHEN** the sheet is opened through the stubbed `showPopover()`
- **THEN** `aria-checked="true"` is on «Поле 6×6» only and on «Розминка» only

#### Scenario: The marked choice is not remembered

- **GIVEN** a page on which the player marked «Поле 8×8» and «Мозколамка» without «Почати», and `localStorage` and `sessionStorage` empty before the test
- **WHEN** the page is mounted again on a new root
- **THEN** the new page shows a 6×6 board, `aria-checked="true"` is on «Поле 6×6» only and on «Розминка» only, and its first generator call carried level 1
- **AND** `localStorage` and `sessionStorage` still hold no entry

### Requirement: Start button

The setup sheet SHALL hold a button `[data-action="setup-start"]` with `type="button"`, the visible text «Почати» and no `aria-label`, `aria-labelledby` or `tabindex` (FR-101, FR-94). It is a direct child of the sheet, placed after the level control and before the close button (FR-96), and it is always present and never disabled: also when the marked choice equals the board shown, and also when no board is shown (the generation at the mount failed). A press SHALL close the sheet with `hidePopover()` and then act in one of three ways. (a) On a board without player entries it starts ONE new puzzle of the marked size and the marked level at once: one seed taken from the seed source (more only after a run-out of the generator, FR-88), one call `generate(size, seed, level)`, the board rendered, the summary updated, and the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker cleared; DOM focus moves to the summary button (FR-97). (b) On a board with player entries it makes the marked size and level the pending action and asks for the confirmation (FR-67, FR-98): until «Так, почати» no seed is taken and the generator is not called. (c) With no board shown it generates at once, as in (a). If the generator fails (FR-88), the previous board, messages, highlights, `cell-hinted`, size, level and summary are kept, the sheet is closed, `aria-checked` is on the board shown, focus is on the summary button and no text is shown. «Почати» is never a no-op (SD-Q2): a press with a marked choice equal to the board shown makes a new puzzle of that size and level, like «Нова головоломка». Both buttons stay direct children of the sheet, with no wrapper element (FR-96). How they are drawn (the signed wireframe, Footer-1) and the look of «Почати» are layout, covered by the held NFR-14; the 44 px height is NFR-12 (see «The start button and the sheet buttons meet the touch-target floor»). This requirement pins none of them beyond the DOM order.

Traces: FR-101, FR-100, FR-67, FR-88, FR-94, FR-98

#### Scenario: Start button structure at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the children of `[data-section="setup"]`
- **THEN** `[data-action="setup-start"]` is a direct child of the sheet, a `button` with `type="button"`, the text «Почати», no `aria-label`, no `aria-labelledby`, no `tabindex` and no `disabled` attribute, and it follows `[data-control="level"]` and precedes `[data-action="setup-close"]`
- **AND** it keeps these attributes at 4×4 and after the generation at the mount failed

#### Scenario: «Почати» makes one puzzle with both marked values

- **GIVEN** a mounted 6×6 board at «Розминка» without player entries, a counting seed source returning 1, 2 and so on, a `generate` spy recording `(size, seed, level)`, the `showModal` spy, the sheet opened, and a hint sentence shown
- **WHEN** the player marks «Мозколамка», then «Поле 8×8» (two marking presses), and then presses «Почати»
- **THEN** exactly one more seed was taken and the spy recorded exactly one more call, `(8, 2, 4)`, and `showModal` was never called
- **AND** `hidePopover` was called once on the sheet, `document.activeElement` is the summary button, the summary reads `8×8 · Мозколамка`, `[data-board]` has `data-size="8"`, and the hint message and the win message have empty text content

#### Scenario: The order of the two marks does not matter

- **GIVEN** the page of the previous scenario, mounted twice
- **WHEN** on the first page the player marks «Поле 8×8» then «Мозколамка» and presses «Почати», and on the second page marks «Мозколамка» then «Поле 8×8» and presses «Почати»
- **THEN** on both pages the generator was called once for the change with `(8, seed, 4)` and the summary reads `8×8 · Мозколамка`

#### Scenario: «Почати» with the marked choice equal to the board shown still makes a puzzle

- **GIVEN** a mounted 6×6 board at «Розминка» without player entries, a counting seed source and a `generate` spy, and the sheet opened with nothing marked
- **WHEN** the player presses «Почати»
- **THEN** one seed was taken and the spy recorded one more call `(6, seed, 1)`, the sheet is closed, the summary reads `6×6 · Розминка`, and `showModal` was never called

#### Scenario: «Почати» on a board with entries asks first

- **GIVEN** a mounted 6×6 board at «Розминка» with player entries, a hint sentence shown and a hint-filled cell, a counting seed source, a `generate` spy and the `showModal` spy with the counts read now, the sheet opened, and «Поле 8×8» and «Головоломка» marked
- **WHEN** the player presses «Почати»
- **THEN** `hidePopover` was called once and then `showModal` was called once, the sheet's stub state is closed, the dialog has the `open` attribute, and the focused element is `[data-confirm="no"]`
- **AND** the board is still 6×6 with the same cell texts, the summary reads `6×6 · Розминка`, `aria-checked="true"` is on «Поле 6×6» and on «Розминка», the messages and `cell-hinted` are unchanged, and the seed-source and generator call counts equal the counts read now
- **AND** after the player presses `[data-confirm="yes"]` exactly one seed was taken, the spy recorded exactly one call `(8, seed, 3)`, the summary reads `8×8 · Головоломка`, and `document.activeElement` is the summary button

#### Scenario: A cancelled confirmation drops the marked pair

- **GIVEN** the page of the previous scenario with the dialog open
- **WHEN** the player presses `[data-confirm="no"]`, and then presses «Нова головоломка» and `[data-confirm="yes"]`
- **THEN** after `[data-confirm="no"]` `document.activeElement` is the summary button, the sheet's stub state is closed, `showPopover` was not called again, and no seed was taken and no generator call was made
- **AND** after the new puzzle the spy's last call is `(6, seed, 1)`, so the dropped pair `(8, 3)` was never performed later

#### Scenario: A failed generation after «Почати» keeps everything

- **GIVEN** a mounted 6×6 board without entries, a hint sentence shown, a `window` `error` listener, the sheet opened with «Поле 8×8» marked, and an injected `generate` that throws an ordinary `Error` for size 8
- **WHEN** the player presses «Почати»
- **THEN** the `error` listener recorded nothing, the sheet's stub state is closed, `document.activeElement` is the summary button, and `[data-board]` keeps `data-size="6"` with the same cell texts
- **AND** the hint message keeps its text, the summary reads `6×6 · Розминка`, `aria-checked="true"` is on «Поле 6×6» only after the sheet is opened again, and no text was added to the page

#### Scenario: With no board shown «Почати» generates at once

- **GIVEN** a page whose generation at the mount threw an ordinary error so no board is shown, a counting seed source, a generator that succeeds afterwards, the `showModal` spy, and the sheet opened with «Задачка» marked
- **WHEN** the player presses «Почати»
- **THEN** no dialog opens, one seed is taken, the generator is called once with size 6 and level 2, a 6×6 board is shown, and the summary reads `6×6 · Задачка`

#### Scenario: With no board shown a failed «Почати» leaves the mount values

- **GIVEN** a page whose generation at the mount threw an ordinary error so no board is shown, an injected `generate` that throws on every call, a `window` `error` listener, and the sheet opened with «Поле 8×8» and «Мозколамка» marked
- **WHEN** the player presses «Почати»
- **THEN** the sheet's stub state is closed, `document.activeElement` is the summary button, no `[data-cell]` exists, no text was added to the page, and the `error` listener recorded nothing
- **AND** when the sheet is opened again `aria-checked="true"` is on «Поле 6×6» only and on «Розминка» only (FR-100)

#### Scenario: «Почати» is a Tab stop inside the sheet in document order

- **GIVEN** the page has just been mounted
- **WHEN** the test lists the `button` elements of the sheet in document order
- **THEN** they are the three size buttons, the four level buttons, «Почати» and «Закрити», in this order, and none has a `tabindex` attribute

### Requirement: The start button and the sheet buttons meet the touch-target floor

The start button `[data-action="setup-start"]` «Почати», the summary button `[data-action="setup"]` and the close button `[data-action="setup-close"]` «Закрити» SHALL each be at least 44×44 CSS px (NFR-12). The stylesheet `src/ui/style.css` SHALL give each of the three a `min-height` of at least `2.75rem` as an ordinary declaration, in one rule that matches the element: no `!important`, not inside a media query. The probe `e2e/nfr-12-targets.spec.ts` already opens the setup sheet at 6×6 and at 4×4 and measures the summary button and «Закрити»; its sheet measurement SHALL also measure «Почати» with the sheet opened at 6×6 and at 4×4 (the probe measures the summary button among the page controls, «Закрити» with the sheet at 6×6 and the level options at 4×4; those stay as they are). The sampled viewports are the eight of the probe, not continuum coverage. jsdom has no layout (TC-13), so the unit test decides the declaration and the real-browser run decides the measured size. How the two buttons are drawn relative to each other (Footer-1, autonomy-log row 120) is not claimed here (held NFR-14).

Traces: NFR-12, FR-101

#### Scenario: The stylesheet declares a 44 px minimum height for the three buttons

- **GIVEN** the page is mounted in jsdom and the text of `src/ui/style.css` is applied to the document
- **WHEN** the test reads the computed `min-height` of `[data-action="setup-start"]`, `[data-action="setup"]` and `[data-action="setup-close"]`
- **THEN** each value is a length of at least 44 px
- **AND** no rule that declares that `min-height` for one of the three buttons is inside an at-rule such as `@media`, and no `min-height` declaration has the priority `important`

#### Scenario: Measured in a real browser «Почати» is at least 44 px in both directions

- **GIVEN** the built page is open in Chromium at each of the eight viewports of `e2e/nfr-12-targets.spec.ts` with the sheet opened at 6×6, and again at 4×4
- **WHEN** the probe measures «Почати» in both sheets, and, as it already does, the summary button among the page controls and «Закрити» in the 6×6 sheet
- **THEN** each measured control is at least 44 px wide and at least 44 px tall, and the spec reports no line for a measured control below 44×44

### Requirement: The accessibility sweep covers a marked choice that differs from the board

The real-browser accessibility sweep `e2e/nfr-13-a11y.spec.ts` (`npm run check:a11y`) SHALL include the state "setup sheet open with a marked choice that differs from the board shown" (NFR-13, FR-100): the sheet opened at 6×6 · «Розминка» with «Поле 8×8» and «Мозколамка» marked and not started. In that state, as in every other state of the sweep, axe-core SHALL report no violation, and every interactive control SHALL show a visible focus indicator when focused from the keyboard, «Почати» included. The sweep samples a fixed list of states in light and dark system schemes; the coverage is `sampled`, never continuum.

Traces: NFR-13, FR-100, FR-101

#### Scenario: The marked state passes the sweep

- **GIVEN** the built page open in Chromium, the sheet opened at 6×6 · «Розминка», and «Поле 8×8» and «Мозколамка» marked by clicks
- **WHEN** the sweep runs axe-core on the page in the light and in the dark system scheme
- **THEN** axe reports no violation in either scheme

#### Scenario: «Почати» shows a focus indicator

- **GIVEN** the same state, and focus moved to «Почати» by Tab from the last level button
- **WHEN** the sweep reads the computed outline of the focused element
- **THEN** its outline style is not `none` (the width of at least 2px is pinned by the stylesheet test of FR-65)

## MODIFIED Requirements

### Requirement: Grid size selector

The page SHALL offer a size control `[data-control="size"]` inside the setup sheet (FR-96; it is not in the page body), a segmented control: an element with `role="radiogroup"` and the accessible name «Розмір поля» (`aria-label`), holding exactly three `<button type="button" role="radio">` elements labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8» (sizes 4, 6, 8, in this order) (FR-43, A-24). While the sheet is open the button of the **marked** size SHALL have `aria-checked="true"` and the other two `aria-checked="false"`; while the sheet is closed `aria-checked="true"` is on the size of the board shown (FR-100, A-47); 6×6 is selected when the page is mounted. **One press of a size button only marks that size** (FR-43, FR-73, FR-100): it starts no puzzle, takes no seed, calls no generator, opens no dialog and does not close the sheet. A new puzzle of the marked size and the marked level is started only by «Почати» (FR-101, see «Start button»): it takes a new seed from the seed source (one seed per generation attempt; a run-out of the generator is retried, FR-88), renders a board of that size and level, updates the summary, and clears the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker; when the board has player entries the page SHALL first ask for confirmation (FR-67, FR-98) and start the new puzzle only after «Так, почати». The size marked at the press of «Почати» is the size performed. Until the confirmation, and after «Скасувати», `aria-checked` is on the size of the board shown (the sheet is already closed). The page calls `generate(n, seed, level)` and assumes that it returns an n×n puzzle: if the generator throws, or the returned `puzzle.givens` is not n rows of n cells, the page SHALL treat it as a generator failure and keep the previous board, the previous messages and highlights, `cell-hinted` and the previous size, and `aria-checked` SHALL stay on the size of the board that is shown, with no uncaught error (an ordinary failure is not retried; only a run-out is, see «Page retry on a run-out»). A performed and a failed «Почати» close the sheet and move focus to the summary button (FR-97, FR-101), and when the change needs the confirmation the sheet is closed first (FR-98). The page reads a size only from the three buttons, never from a free value: the behaviour «a changed value that is not exactly 4, 6 or 8 is ignored» of the earlier select-based control is REMOVED, because with three fixed buttons no free value can be submitted; the invariant that exactly three sizes exist is carried by «exactly three buttons». A press of the size button of the size already shown or already marked is specified by «Pressing the shown size changes nothing». Marking 6 or 8 keeps the marked level and marking 4 sets the marked level to 1, and one «Почати» makes one new puzzle with both, as «Size and level interplay» says. Rules, hint and win message work at the chosen size exactly as at 6. The page MUST NOT remember the choice: a reload or a new mount starts at 6 (TC-12, FR-100).

Traces: FR-43, FR-67, FR-66, FR-92, FR-97, FR-98, FR-73, FR-100, FR-101

#### Scenario: Size control structure and default

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="size"]`
- **THEN** it has `role="radiogroup"` and `aria-label` equal to «Розмір поля», and it contains exactly three `button` elements, each with `type="button"` and `role="radio"`, whose texts are «Поле 4×4», «Поле 6×6» and «Поле 8×8», in this order
- **AND** the second button has `aria-checked="true"` and the other two have `aria-checked="false"`

#### Scenario: Size buttons are native buttons in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the three size buttons
- **THEN** none has the `disabled` attribute and none has a negative `tabindex`, so Tab reaches each one, and a click on each (the activation that Enter and Space perform on a native button) marks its size (arrow keys are not required, A-24)

#### Scenario: A size press only marks

- **GIVEN** a 6x6 fixture board with player entries, the sheet opened through the stubbed `showPopover()`, a counting seed source, a `generate` spy and the `showModal` spy with the counts read now
- **WHEN** the player presses «Поле 8×8» (a marking press, no «Почати»)
- **THEN** `aria-checked="true"` is on «Поле 8×8» only, `[data-board]` keeps `data-size="6"` and its cell texts, the summary reads `6×6 · Розминка`, and the sheet's stub state is still open
- **AND** `showModal` and `hidePopover` were never called, and the seed-source and generator call counts equal the counts read now

#### Scenario: Choose 4x4 on a board without entries

- **GIVEN** the default 6x6 board with no player entries, a seed source returning 1 and then 2, and the real engine generator
- **WHEN** the player chooses «Поле 4×4» (marks it, then presses «Почати»)
- **THEN** `[data-board]` has `data-size="4"` and contains exactly 16 `[data-cell]` elements with `data-row` and `data-col` values 1 to 4, each pair appearing exactly once
- **AND** for every cell, `data-given="true"` holds exactly where the generator returns a given for size 4 and seed 2, and each given cell shows the digit the generator returns for it
- **AND** `aria-checked="true"` is on «Поле 4×4» only

#### Scenario: Choose 8x8 after play

- **GIVEN** a 6x6 fixture board with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted` and some cells with `cell-violation`, and an injected `generate` that returns an 8x8 fixture puzzle for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати»), and then presses `[data-confirm="yes"]`
- **THEN** after «Почати» the dialog is open and the board is still 6x6 with `aria-checked="true"` on «Поле 6×6»
- **AND** after the confirmation `[data-board]` has `data-size="8"` and contains exactly 64 `[data-cell]` elements with no player entries (a non-given cell shows empty text), and `aria-checked="true"` is on «Поле 8×8» only
- **AND** `[data-message="hint"]` has empty text content and no cell has `cell-hinted`
- **AND** the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: Choose 8x8 after a win

- **GIVEN** a 6x6 fixture board on which the win message is shown (the board is solved, so no cell has `cell-violation`), and an injected `generate` that returns an 8x8 fixture puzzle for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати») and then presses `[data-confirm="yes"]` (a solved board has entries, A-29)
- **THEN** `[data-message="win"]` has empty text content and `[data-board]` has `data-size="8"` and 64 cells

#### Scenario: Going back to 6x6

- **GIVEN** the page shows an 8×8 board reached by pressing «Поле 8×8» on an untouched 6x6 board
- **WHEN** the player chooses «Поле 6×6» (marks it, then presses «Почати»)
- **THEN** `[data-board]` has `data-size="6"` and contains exactly 36 cells, and `aria-checked="true"` is on «Поле 6×6» only

#### Scenario: aria-checked stays on the shown size until the confirmation

- **GIVEN** a 6x6 board with player entries
- **WHEN** the player chooses «Поле 4×4», the test reads the buttons, and then presses `[data-confirm="no"]` and reads them again
- **THEN** both times `aria-checked="true"` is on «Поле 6×6» only and the board is still 6x6

#### Scenario: A change takes exactly one seed and passes the chosen size

- **GIVEN** a seed source returning 1, 2, 3 and so on, counting its calls, and a `generate` spy recording `(size, seed)`
- **WHEN** the page is mounted, then the player chooses «Поле 4×4», then «Поле 8×8» (each board has no player entries)
- **THEN** the spy recorded `(6, 1)`, `(4, 2)` and `(8, 3)` in this order and the seed source was called exactly three times

#### Scenario: A generator error keeps the previous board

- **GIVEN** a 6x6 fixture board with player entries, a hint sentence shown and a hint-filled cell, a counting seed source, a `window` `error` listener, and an injected `generate` that throws for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати») and then presses `[data-confirm="yes"]`
- **THEN** the `error` listener recorded nothing, `[data-board]` keeps `data-size="6"` with the same cell texts and highlights, both message regions keep their text, and the hint-filled cell keeps `cell-hinted`
- **AND** `aria-checked="true"` is on «Поле 6×6» only and the dialog is closed
- **AND** the seed source was called exactly once for the failed change (one seed per generation attempt)

#### Scenario: A generator result of the wrong size keeps the previous board

- **GIVEN** a 6x6 fixture board with player entries and a hint sentence shown, and an injected `generate` that returns a 6x6 fixture puzzle for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати») and then presses `[data-confirm="yes"]`
- **THEN** `[data-board]` keeps `data-size="6"` with 36 cells and the same cell texts, both message regions keep their text, and `aria-checked="true"` is on «Поле 6×6» only

#### Scenario: Hint and win at the chosen size

- **GIVEN** the player has pressed the size button of the row below on an untouched 6x6 board, and the injected `generate` returned the fixture of that row

| N | Fixture | Hint action | Expected hint | Win action |
|---|---------|-------------|---------------|------------|
| 4 | only givens `0` at `data-row` 2 with `data-col` 1 and 2 | press `[data-action="hint"]` | engine returns `{ kind: 'fill', row: 1, col: 2, value: 1, rule: 'pair' }`: cell `data-row="2"` `data-col="3"` shows `1` | a second fixture of size 4 with an explicit solution whose givens are every cell except one non-given cell: click that cell until it shows the solution digit |
| 8 | only givens `0` at `data-row` 8 with `data-col` 7 and 8 | press `[data-action="hint"]` | engine returns `{ kind: 'fill', row: 7, col: 5, value: 1, rule: 'pair' }`: cell `data-row="8"` `data-col="6"` shows `1` | a second fixture of size 8 with an explicit solution (a valid solved 8x8 grid written in the test) whose givens are every cell except the one at `data-row` 8 and `data-col` 8: click it until it shows the solution digit |

- **WHEN** the player does the hint action, and on the second fixture the win action
- **THEN** after the hint action the expected cell shows `1`, has `cell-hinted`, every other cell has the same text as before, and `[data-message="hint"]` shows the engine's sentence
- **AND** after the win action `[data-message="win"]` shows the win message required by «Win message when solved»

#### Scenario: Violations in the givens of a new board show at once

- **GIVEN** a 6x6 board with no player entries and an injected `generate` that returns, for size 8, the fixture of the row below

| Fixture (8x8, only these givens) | Cells that have `cell-violation` right after the change |
|----------------------------------|----------------------------------------------------------|
| `0` at `data-row` 8 with `data-col` 1, 2 and 3 (an inconsistent fixture) | exactly (8, 1), (8, 2), (8, 3) |
| `1` at `data-col` 8 with `data-row` 1, 2, 4, 6 and 7 (five `1` in the column, no three side by side) | all eight cells with `data-col="8"` and no cell outside that column |

- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати») and presses nothing else
- **THEN** the cells with `cell-violation` are exactly those of the row

#### Scenario: The choice is not remembered

- **GIVEN** a page on which the player pressed «Поле 8×8», and `localStorage` and `sessionStorage` empty before the test
- **WHEN** the page is mounted again on a new root
- **THEN** the new page's `aria-checked="true"` is on «Поле 6×6» only and its `[data-board]` has `data-size="6"` and 36 cells
- **AND** `localStorage` and `sessionStorage` still hold no entry

### Requirement: Pressing the shown size changes nothing

A press on a size button or a level button inside the open setup sheet, whether it is the button of the board shown, the marked one or another, SHALL change only the marked choice (FR-73, FR-100): it opens no dialog, starts no new puzzle, takes no seed, calls no generator, and leaves the board, both messages, the highlights, `cell-hinted` and the summary unchanged (FR-66). It does not close the sheet and does not move DOM focus away from the pressed button. This holds on a board with player entries and on a board without. A press on the button already marked changes nothing at all. A press on a level button that is unavailable at the marked size (levels 2 to 4 at 4×4, FR-91) does nothing at all: the sheet stays open and focus stays on that button. **The press of «Почати» is not covered by this requirement and is never a no-op** (FR-101, SD-Q2): with the marked choice equal to the board shown it makes one new puzzle of that size and level, like «Нова головоломка», and asks for the confirmation when the board has player entries (see «Start button»). When no board is shown (the generation at mount failed), a press on a size or level button only marks as well, «Поле 6×6» keeps `aria-checked="true"` from the mount (see «Grid size selector»), and «Почати» generates a board of the marked size and the marked level at once, because there are no entries to confirm. The name of this requirement is kept from the earlier immediate-change model so that the archive matches; the behaviour above replaces it (A-47).

Traces: FR-73, FR-66, FR-43, FR-88, FR-91, FR-97, FR-100, FR-101

#### Scenario: The shown size only marks at every size

- **GIVEN** a mounted page showing a board of size N from the table below (reached by choosing the size when N is not 6, with the injected generator returning a fixture of size N), on which the player has made entries, pressed «Підказка» (a hint sentence is shown, one cell has `cell-hinted`) and made some cells carry `cell-violation`, with a counting seed source, a `generate` spy and the `showModal` spy, and the sheet opened through the stubbed `showPopover()`

| N | Button pressed |
|---|----------------|
| 4 | «Поле 4×4» |
| 6 | «Поле 6×6» |
| 8 | «Поле 8×8» |

- **WHEN** the player presses the button of the row (the size already shown), and again on a freshly mounted page of the same size with no player entries
- **THEN** `showModal` and `hidePopover` were never called, the seed-source and generator call counts are unchanged, every cell keeps its text and class list (including `cell-violation` and `cell-hinted`), both messages keep their text, the summary keeps its text, and `aria-checked="true"` stays on that button only
- **AND** the sheet's stub state is still open and `document.activeElement` is not the summary button

#### Scenario: A size marked and then another size marked

- **GIVEN** a mounted 6×6 board with player entries and the sheet opened
- **WHEN** the player marks «Поле 4×4», then «Поле 8×8», and then «Поле 8×8» again (three marking presses)
- **THEN** after each press `aria-checked="true"` is on the last pressed size only, the board, the messages and the summary are unchanged, and no seed was taken
- **AND** the second press of «Поле 8×8» changed nothing at all (the same `aria-checked`, no call of any spy)

#### Scenario: The shown level only marks at every level

- **GIVEN** a mounted page showing the size and the level of the row below (reached by choosing the buttons, with the injected generator returning fixtures), on which the player has made entries, pressed «Підказка» (a hint sentence is shown, one cell has `cell-hinted`) and made some cells carry `cell-violation`, with a counting seed source, a `generate` spy and the `showModal` spy, and the sheet opened

| Size | Level button pressed |
|------|----------------------|
| 6 | «Розминка» |
| 6 | «Задачка» |
| 6 | «Головоломка» |
| 8 | «Мозколамка» |
| 4 | «Розминка» |

- **WHEN** the player makes a marking press on the level button of the row (the level already shown), and again on a freshly prepared page of the same size and level with no player entries
- **THEN** `showModal` and `hidePopover` were never called, the seed-source and generator call counts are unchanged, every cell keeps its text and class list (including `cell-violation` and `cell-hinted`), both messages keep their text, the summary keeps its text, and `aria-checked="true"` stays on that level button only and on the size button of the row only
- **AND** the sheet's stub state is still open

#### Scenario: An unavailable level press does nothing at all

- **GIVEN** a mounted page whose marked size is 4×4 (the sheet opened and «Поле 4×4» marked on a 6×6 board, or a 4×4 board shown), with a counting seed source and a `generate` spy
- **WHEN** the player presses «Задачка»
- **THEN** `aria-checked="true"` is still on «Розминка» only, the sheet's stub state is open, `document.activeElement` is the pressed button when the test had focused it, and no spy was called

#### Scenario: With no board shown a press only marks and «Почати» generates

- **GIVEN** a page whose generation at mount threw, so no board is shown, a counting seed source, a `generate` spy and a generator that succeeds afterwards, and the sheet opened
- **WHEN** the player marks «Поле 6×6» and «Задачка» (two marking presses), and then presses «Почати»
- **THEN** after the first two presses no seed was taken and the generator was not called, and `aria-checked="true"` is on «Поле 6×6» and on «Задачка»
- **AND** after «Почати» no dialog opened, one seed was taken, the generator was called once with size 6 and level 2, and a 6×6 board is shown with the summary `6×6 · Задачка`

### Requirement: Seed is chosen outside the engine, injectable and not shown

The page SHALL obtain the seed for each puzzle from a seed source outside `src/engine/`, calling it exactly once for each generation attempt (the mount, each performed press of the new puzzle button and each performed press of «Почати», including an attempt whose generator call throws), and at no other time. One performed action makes one attempt, or up to three when each earlier attempt of it ended in a run-out of the generator (FR-88, A-38, see «Page retry on a run-out»), so «one seed per action» holds only when the first seed succeeds. A seed is never taken for a press that only marks a size or a level (FR-73, FR-100), for a press of a level that is unavailable at 4×4 (FR-91), for a requested action that the player cancelled (FR-67) and never for reset; «Почати» is never a no-op (FR-101), so even a press of «Почати» with the marked choice equal to the board shown takes a seed. It SHALL accept an injected seed source (contract in the DOM contract section) so tests are deterministic, and MUST NOT display the seed anywhere on the page, including in locale-formatted or separator-split form. When no seed source is injected, the default source SHALL give a different seed on each call (no two consecutive calls return the same seed) and every seed it returns SHALL be an integer from 0 to 2^31 - 1 inclusive. That range is the seed domain pinned by FR-51 and A-25.

Traces: FR-31, FR-42, FR-43, FR-51, FR-67, FR-73, FR-88, FR-100, FR-101

#### Scenario: Injected seed gives a reproducible page

- **GIVEN** two pages mounted with seed sources that both return 42, using the real engine generator
- **WHEN** both have rendered
- **THEN** their cells have identical `data-given` values and identical text

#### Scenario: Default seed source gives new seeds in its domain

- **GIVEN** the page is mounted without an injected seed source and with an injected `generate` spy that records each seed and returns a fixture puzzle
- **WHEN** the new puzzle button is pressed 9 times (the boards have no entries), so the spy has recorded 10 seeds in all
- **THEN** every recorded seed is an integer from 0 to 2147483647 inclusive
- **AND** no two consecutive recorded seeds are equal (so a constant default source such as always 1 fails)
- **AND** no error is thrown

#### Scenario: Default seed source with the real generator

- **GIVEN** the page is mounted without an injected seed source and without an injected `generate`
- **WHEN** the page has rendered
- **THEN** a 6×6 board is rendered and no error is thrown

#### Scenario: Seed is not shown

- **GIVEN** the page is mounted with a seed source returning 987654
- **WHEN** the test inspects every text node under the page root, `document.title`, and every attribute value of every element in the root, each as a separate string
- **THEN** none of those strings contains `987654`, none contains `Intl.NumberFormat('uk-UA').format(987654)`, and none matches `/9\D?8\D?7\D?6\D?5\D?4/` (this covers `987 654` with a space, NBSP or narrow NBSP, `987,654` and `987.654`)

#### Scenario: Seed calls follow the puzzles generated

- **GIVEN** a counting seed source returning 1, 2, 3 and so on, and a `generate` spy
- **WHEN** the page is mounted, the new puzzle button is pressed once, the player chooses «Поле 4×4», opens the sheet and presses «Поле 4×4» again (a marking press of the size already marked, then «Закрити»), and chooses «Поле 8×8» (every board has no entries)
- **THEN** the seed source was called exactly four times and the spy recorded the seeds 1, 2, 3 and 4 in this order, paired with the sizes 6, 6, 4 and 8

#### Scenario: A cancelled or no-op action takes no seed

- **GIVEN** a counting seed source and a `generate` spy, and a mounted board with player entries, with the counts read now
- **WHEN** the player presses «Нова головоломка» and then `[data-confirm="no"]`, chooses «Поле 8×8» (the confirmation is asked) and presses `[data-confirm="no"]`, chooses «Задачка» and presses `[data-confirm="no"]`, presses «Скинути» and then `[data-confirm="yes"]`, and, with the sheet open, presses the size button of the size shown, the level button of the level shown, «Поле 8×8» and «Задачка» as marking presses (no «Почати») and then «Закрити»
- **THEN** the seed-source call count and the generator call count equal the counts read now

#### Scenario: A level change takes exactly one seed and passes the chosen level

- **GIVEN** a seed source returning 1, 2, 3 and so on, counting its calls, and a `generate` spy recording `(size, seed, level)`
- **WHEN** the page is mounted, then the player chooses «Задачка», then «Мозколамка», then «Поле 8×8» (each board has no player entries and every generation succeeds on its first seed)
- **THEN** the spy recorded `(6, 1, 1)`, `(6, 2, 2)`, `(6, 3, 4)` and `(8, 4, 4)` in this order and the seed source was called exactly four times

### Requirement: Hint message stays until the next hint or a new puzzle

The page SHALL keep the text of `[data-message="hint"]` unchanged when the player clicks a cell, until the next press of the hint button, the next press of the new puzzle button, or a press of «Почати» whose new puzzle was shown (a «Почати» whose generation fails keeps the message, and so does marking a size or a level, see Grid size selector, Level selector and Start button) (A-23, FR-43, FR-88, FR-100, FR-101).

Traces: FR-40, FR-43, FR-88, FR-100, FR-101

#### Scenario: Clicking a player cell keeps the hint message

- **GIVEN** `[data-message="hint"]` shows a sentence after a hint press
- **WHEN** the player clicks a non-given cell once, and then twice more
- **THEN** `[data-message="hint"]` keeps exactly the same text after each click

#### Scenario: The next hint replaces it and a new puzzle clears it

- **GIVEN** `[data-message="hint"]` shows a sentence and the player has clicked a cell since
- **WHEN** the player presses the hint button again, and then presses the new puzzle button
- **THEN** after the hint press the region shows the sentence for that press, and after the new puzzle press it has empty text content

#### Scenario: A size change that shows a new puzzle clears it

- **GIVEN** `[data-message="hint"]` shows a sentence and the player has clicked a cell since
- **WHEN** the player chooses «Поле 4×4» (marks it, then presses «Почати»)
- **THEN** `[data-message="hint"]` has empty text content

#### Scenario: A level change that shows a new puzzle clears it

- **GIVEN** `[data-message="hint"]` shows a sentence and the player has clicked a cell since
- **WHEN** the player chooses «Задачка» and then presses `[data-confirm="yes"]`
- **THEN** `[data-message="hint"]` has empty text content

#### Scenario: Marking a size or a level keeps it

- **GIVEN** `[data-message="hint"]` shows a sentence and the sheet is opened
- **WHEN** the player marks «Поле 4×4» and «Задачка» (two marking presses, no «Почати») and then closes the sheet with «Закрити»
- **THEN** `[data-message="hint"]` keeps exactly the same text

### Requirement: Highlighting follows every board change

The page SHALL recompute the highlighted cells after every board change (a click on a non-given cell, which is also what Enter or Space does there as the native activation of a button (FR-60), a hint fill, a new puzzle, a press of «Почати» that shows a board), so that a broken rule is highlighted at once and its highlight is removed as soon as the rule is no longer broken.

Traces: FR-38, FR-43, FR-60, FR-88, FR-101

#### Scenario: Highlight appears immediately

- **GIVEN** a board with no `cell-violation` cell and two adjacent `0` with a non-given empty neighbour
- **WHEN** the player clicks the neighbour so it shows `0`
- **THEN** in the same click handling (no further user action), the three cells have `cell-violation`

#### Scenario: Highlight disappears once the rule is fixed

- **GIVEN** a board where exactly three cells carry `cell-violation`, all in one row, they are three equal digits side by side, and no other rule is broken anywhere on the board
- **WHEN** the player clicks the third cell until it shows empty (an empty cell never causes a violation)
- **THEN** no cell on the board has `cell-violation`

#### Scenario: Hint fill triggers recomputation

- **GIVEN** a board where the hint engine targets a cell and the filled value breaks no rule
- **WHEN** the player presses the hint button
- **THEN** the set of `cell-violation` cells equals the cells the rule checker reports for the new board

#### Scenario: Clicking a given does not recompute to a different result

- **GIVEN** a board with some `cell-violation` cells
- **WHEN** the player clicks a given cell
- **THEN** the same set of cells has `cell-violation`

#### Scenario: A size change recomputes the highlights

- **GIVEN** a 6x6 board with some `cell-violation` cells and an injected `generate` that returns a 4x4 fixture puzzle with no givens for size 4
- **WHEN** the player chooses «Поле 4×4» (marks it, then presses «Почати»)
- **THEN** the 16 cells of the new board have no `cell-violation`, and no cell of the old board remains in the page

### Requirement: Hinted cell marker

The cell that the hint button filled SHALL carry the class `cell-hinted` until the next board change, and at most one cell SHALL carry it at any time (FR-66). The marker SHALL be removed by any later board change: a click on a non-given cell (including the hinted cell itself), a hint that fills another cell (the marker then moves to that new cell), «Нова головоломка», a press of «Почати» (at once, or after «Так, почати») and «Скинути». The marker SHALL NOT be removed by an action that changes no cell: a click on a given cell (FR-33), a hint that fills no cell (FR-25, FR-26), opening or closing the rules panel (FR-57), opening or closing the setup sheet (FR-96), marking a size or a level in the setup sheet (FR-100), a failed generation that keeps the previous board (FR-43), a cancelled confirmation (FR-67) and a press of the already selected size (FR-73; that press now only marks). An action that needs confirmation (FR-67) removes the marker when it is performed, not when it is requested. A given cell SHALL never carry the marker, and no cell carries it at mount. Which cue the marker draws (a cue that is not colour alone) is rendering and is covered by the held NFR-11 and NFR-14, see `docs/requirements-held.md`; this requirement pins the class only.

Traces: FR-66, FR-39, FR-88, FR-96, FR-100, FR-101

#### Scenario: No cell carries the marker at mount

- **GIVEN** the page has just been mounted with a fixture puzzle that has givens
- **WHEN** the test reads every `[data-cell]`
- **THEN** no cell has the class `cell-hinted`
- **AND** after a hint press on that page no cell with `data-given="true"` has the class `cell-hinted`

#### Scenario: A second hint moves the marker

- **GIVEN** a fixture puzzle on which a first press of the hint button fills cell X, and a second press fills another cell Y (the first fill breaks no rule)
- **WHEN** the player presses `[data-action="hint"]` twice
- **THEN** after the first press exactly one cell, X, has the class `cell-hinted`
- **AND** after the second press exactly one cell, Y, has it and X no longer has it

#### Scenario: Later board changes remove the marker

- **GIVEN** a fixture puzzle on which the hint button has filled cell X, so X carries `cell-hinted`
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| clicks a non-given cell other than X |
| clicks X itself |
| presses «Нова головоломка» |
| changes the size to 4 (one run) or to 8 (one run) by a choice (mark and «Почати»), the injected generator returning a fixture of that size |
| changes the level to «Задачка» (one run) by a choice |
| presses «Почати» with the marked choice equal to the board shown (one run) |
| presses «Скинути» |

- **THEN** after each action no cell of the board shown has the class `cell-hinted`

#### Scenario: Actions that change no cell keep the marker

- **GIVEN** a fixture puzzle with at least one given cell, on which the hint button has filled cell X, so X carries `cell-hinted`
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| clicks a given cell (once, and again twice) |
| presses «Підказка» on a board where the hint engine returns no cell (the board breaks a rule, reachable only when the hint's own fill broke one, since a click on a non-given cell removes the marker; or no rule applies) |
| clicks `[data-action="rules"]` and then the close button «Зрозуміло» |
| opens the setup sheet through the stubbed `showPopover()`, then clicks `[data-action="setup-close"]` |
| opens the setup sheet, presses «Поле 8×8» and «Задачка» (marking presses, no «Почати»), then clicks `[data-action="setup-close"]` |

- **THEN** after each action exactly one cell has the class `cell-hinted`, it is X, and X still shows the digit the hint wrote

#### Scenario: A failed generation keeps the marker

- **GIVEN** a 6x6 fixture board on which a hint filled cell X, and an injected `generate` that throws for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, then presses «Почати»)
- **THEN** `[data-board]` keeps `data-size="6"` and the same texts, and X still has the class `cell-hinted`

#### Scenario: A hint that wins keeps the marker on the filled cell

- **GIVEN** a fixture puzzle with exactly one cell empty, every other cell holding the solution digit, and the hint engine targeting that cell
- **WHEN** the player presses the hint button
- **THEN** `[data-message="win"]` shows the win message (see «Win message when solved»)
- **AND** exactly one cell has the class `cell-hinted`, the filled one

#### Scenario: Two mounts are independent

- **GIVEN** two pages mounted on two roots, a hint pressed on the first
- **WHEN** the test reads the second page
- **THEN** no cell of the second page has the class `cell-hinted`

### Requirement: Confirmation before discarding player entries

«Нова головоломка», «Почати» and «Скинути» SHALL ask for confirmation only when the board has player entries (FR-67). A change of size or level is no longer an action of its own: it happens only through «Почати» (FR-101), and marking a size or a level asks for nothing (FR-100). A player entry is a non-given cell that is not empty; a cell filled by a hint counts as one (A-8); a board that was just solved has entries, so the confirmation is also asked after a win (A-29). The confirmation SHALL be a native `<dialog>` `[data-dialog="confirm"]`, created once at mount inside the page root, outside the board element and outside the sequence of «Page document order» (it follows the rules panel), closed at mount, and opened with `showModal()`. It SHALL hold the text «Почати заново? Ваші ходи на цьому полі буде втрачено.» and exactly two `<button type="button">`: `[data-confirm="yes"]` with the text «Так, почати» and `[data-confirm="no"]` with the text «Скасувати». «Так, почати» SHALL close the dialog (calling `close()`) and then perform the pending action exactly as it would on an untouched board. «Скасувати», and Escape (the dialog's `cancel` and `close` events with no button pressed), SHALL close the dialog and leave unchanged the board, the size and the level (`aria-checked`), the summary, the hint message, the win message, the highlights and `cell-hinted`; no seed is taken and the generator is not called. A cancelled action is dropped: it is never performed later. On a board with no player entries the action happens at once and `showModal()` is never called. When the pending action is the press of «Почати», the sheet is closed first and then the dialog opens, and «Скасувати» (which drops the pending action), Escape and «Так, почати» end with focus on the summary button (FR-98, see «Sheet and confirmation»). The pending action is the marked size and level taken at the press of «Почати». Reading rule: wherever another requirement of this capability says that pressing «Нова головоломка», changing the size, changing the level or pressing «Скинути» has an effect (for example «Highlighting follows every board change», «Hint message stays until the next hint or a new puzzle» and the size steps of «Board rendering and default size»), the effect happens when the action is performed: at once on a board without player entries, after «Так, почати» on a board with entries; a requested but unperformed action has no effect. The dialog SHALL have `aria-labelledby` naming the `id` of the element that holds its text (unique per mount), so assistive technology announces the question (A-20). When the page opens the dialog it SHALL move focus to «Скасувати» (after `showModal()`), so that the safe choice is the default and two key presses cannot discard the player's moves (A-20; the user's decision of 2026-10-06, review round 1). Where the dialog is drawn and its focus ring are layout and are covered by the held NFR-13 and NFR-14, see `docs/requirements-held.md`.

Traces: FR-67, FR-42, FR-43, FR-58, FR-66, FR-90, FR-98, FR-100, FR-101

#### Scenario: The dialog at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-dialog="confirm"]`
- **THEN** exactly one such `dialog` element exists in the root, it has no `open` attribute, it is not inside `[data-board]` or the header or the message area, and it follows the rules panel in document order
- **AND** its text includes «Почати заново? Ваші ходи на цьому полі буде втрачено.»
- **AND** it contains exactly two `button` elements of `type="button"`: `[data-confirm="yes"]` with the text «Так, почати» and `[data-confirm="no"]` with the text «Скасувати»
- **AND** the `showModal` spy has not been called

#### Scenario: The dialog is named by its question and opens on «Скасувати»

- **GIVEN** a mounted page with a fixture puzzle on which the player has clicked one non-given cell
- **WHEN** the test reads the dialog, and then the player presses «Нова головоломка»
- **THEN** the dialog's `aria-labelledby` names an element inside the dialog whose text is «Почати заново? Ваші ходи на цьому полі буде втрачено.», and two mounts give two different ids
- **AND** after the press the dialog is open and the focused element of the document is `[data-confirm="no"]`

#### Scenario: No player entries means no dialog

- **GIVEN** a mounted 6x6 fixture board with no player entries (only givens), the `showModal` and `close` methods of `HTMLDialogElement.prototype` installed as spies that set and remove the `open` attribute (jsdom has neither), and a counting seed source and a `generate` spy
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action | Expected effect at once |
|--------|-------------------------|
| presses «Нова головоломка» | a new puzzle of size 6 from the next seed |
| chooses «Поле 4×4» | a 4x4 board from the next seed, `aria-checked="true"` on «Поле 4×4» |
| chooses «Задачка» | a 6x6 board of level 2 from the next seed, `aria-checked="true"` on «Задачка» |
| presses «Скинути» | no cell, class or message changes |

- **THEN** the `showModal` spy was never called, the dialog has no `open` attribute, and the expected effect of the row happened

#### Scenario: A board with entries asks first and changes nothing yet

- **GIVEN** a mounted 6x6 fixture board on which the player has clicked one non-given cell to `1`, has pressed «Підказка» so that a hint filled another cell (`cell-hinted`) and a hint sentence is shown, with cells carrying `cell-violation`, and a counting seed source and a `generate` spy whose counts are read now
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| presses «Нова головоломка» |
| chooses «Поле 8×8» (the injected generator returns an 8x8 fixture) |
| chooses «Задачка» (the injected generator returns a 6x6 fixture) |
| presses «Скинути» |

- **THEN** `showModal` was called exactly once and the dialog has the `open` attribute
- **AND** every cell keeps its text, `[data-board]` keeps `data-size="6"`, `aria-checked="true"` stays on «Поле 6×6» and on «Розминка», `[data-message="hint"]` and `[data-message="win"]` keep their text, the set of `cell-violation` cells and the `cell-hinted` cell are unchanged
- **AND** the seed-source call count and the generator call count equal the counts read before the press

#### Scenario: «Так, почати» closes the dialog and then performs the action

- **GIVEN** the page of the previous scenario with the dialog open for each action of the table
- **WHEN** the player presses `[data-confirm="yes"]`

| Action pending | Expected effect |
|----------------|-----------------|
| «Нова головоломка» | a 6x6 board generated from the next seed (one seed taken, one generator call), no player entries |
| «Поле 8×8» | an 8x8 board (`data-size="8"`, 64 cells), `aria-checked="true"` on «Поле 8×8» only, one seed taken |
| «Задачка» | a 6x6 board generated from the next seed with level 2 (one seed taken, one generator call with level 2), `aria-checked="true"` on «Задачка» only, the summary reads `6×6 · Задачка` |
| «Скинути» | every non-given cell empty, every given kept, `data-size="6"`, no seed taken, no generator call |

- **THEN** the `close` spy was called once and the dialog has no `open` attribute
- **AND** the expected effect of the row happened, `[data-message="hint"]` and `[data-message="win"]` have empty text content, no cell has `cell-hinted`, and the `cell-violation` cells are exactly those the rule checker reports for the board shown

#### Scenario: «Скасувати» leaves everything unchanged

- **GIVEN** the page of the scenario «A board with entries asks first and changes nothing yet» with the dialog open for each action of that table
- **WHEN** the player presses `[data-confirm="no"]`
- **THEN** the `close` spy was called once and the dialog has no `open` attribute
- **AND** every cell keeps its text, `[data-board]` keeps `data-size="6"`, `aria-checked="true"` stays on «Поле 6×6» and on «Розминка», both messages keep their text, the set of `cell-violation` cells and the `cell-hinted` cell are unchanged
- **AND** the seed-source call count and the generator call count equal the counts read before the press, and `showModal` was called exactly once in all

#### Scenario: Escape leaves everything unchanged and drops the action

- **GIVEN** the page of the previous scenario with the dialog open after pressing «Нова головоломка»
- **WHEN** the test dispatches a `cancel` event and then a `close` event on the dialog (what a browser does for Escape), pressing no button
- **THEN** the board, the size, the messages, the highlights and `cell-hinted` are unchanged, and neither the seed source nor the generator was called again
- **AND** pressing «Нова головоломка» again opens the dialog a second time (`showModal` called twice in all) and pressing `[data-confirm="yes"]` then performs exactly one new puzzle (one seed taken)

#### Scenario: A hint-filled cell counts as a player entry

- **GIVEN** a mounted fixture board on which the player has only pressed «Підказка» once, so the one non-empty non-given cell was filled by the hint
- **WHEN** the player presses «Нова головоломка»
- **THEN** `showModal` was called once and the board is unchanged until `[data-confirm="yes"]` is pressed

#### Scenario: A solved board still asks (A-29)

- **GIVEN** a fixture puzzle whose solution the test knows, solved by clicks so that the win message is shown
- **WHEN** the player presses «Скинути», and in separate runs «Нова головоломка», the button of another size and the button of another level
- **THEN** each time `showModal` was called once, and the board and the win message are unchanged until `[data-confirm="yes"]` is pressed

#### Scenario: Entries that were cleared again do not count

- **GIVEN** a mounted fixture board on which the player clicked a non-given cell three times (it shows empty again) and clicked a given cell
- **WHEN** the player presses «Нова головоломка»
- **THEN** `showModal` was never called and a new puzzle was generated at once

#### Scenario: «Почати» asks, marking does not

- **GIVEN** a mounted 6x6 fixture board with player entries, the `showModal` spy, a counting seed source and a `generate` spy with the counts read now, and the sheet opened
- **WHEN** the player marks «Поле 8×8» and «Задачка» (two marking presses), and then presses «Почати»
- **THEN** after the two marking presses `showModal` was never called and the counts equal the counts read now
- **AND** after «Почати» `showModal` was called once, the dialog has the `open` attribute and the board is still 6x6 with its cell texts
- **AND** after `[data-confirm="yes"]` exactly one seed was taken and the generator was called once, with size 8 and level 2

### Requirement: Every cell is its own Tab stop

The page SHALL make every `[data-cell]` of the board shown its own Tab stop: the cells are reached by Tab in reading order (row by row, left to right), after the summary button and before the hint button (FR-59, FR-68, FR-69, FR-95), and the page SHALL NOT put a `tabindex` attribute on any element of its root, at mount and after every board change. The page SHALL NOT handle the Arrow, Home and End keys, with or without Ctrl, Shift or Alt: it handles no key event on the board or its cells, so no key event on the board or a cell is default-prevented (Tab, Shift+Tab, PageUp, PageDown, Escape and letters included), no key moves DOM focus, and no key changes a cell (FR-59). Showing a board (the mount, a performed new puzzle, a performed «Почати», a reset) SHALL NOT move DOM focus, with one exception: «Почати» and the close button «Закрити» of the setup sheet return DOM focus to the summary button (FR-97, FR-101, see «Choosing and closing the sheet»); when «Почати» needs the confirmation, DOM focus goes to «Скасувати» while the dialog is open and then to the summary button (FR-98). A press on a size button or a level button inside the sheet moves no focus: it stays on the pressed button. A hint, whether or not it fills a cell, SHALL leave DOM focus on the hint button. Tab and Shift+Tab are the browser's. A new puzzle or «Почати» whose generation fails keeps the previous board and its cells.

Traces: FR-59, FR-43, FR-68, FR-69, FR-95, FR-97, FR-100, FR-101

#### Scenario: Every cell is a Tab stop in reading order

- **GIVEN** the page is mounted on a fixture puzzle (6x6)
- **WHEN** the test reads the elements of the root in document order
- **THEN** no element of the root has a `tabindex` attribute
- **AND** the summary button `[data-action="setup"]` precedes the cell with `data-row="1"` and `data-col="1"`, the 36 cells follow in reading order up to `data-row="6"` and `data-col="6"`, and that last cell precedes `[data-action="hint"]`

#### Scenario: Arrow, Home and End keys are not handled

- **GIVEN** a mounted board of each size N in 4, 6 and 8, and the test has given DOM focus to the non-given cell at `data-row="2"` and `data-col="2"`
- **WHEN** the test dispatches ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, End, Ctrl+Home, Ctrl+End, Shift+ArrowRight and Alt+ArrowRight on that cell, one after the other, and then Arrow, Enter and space keys on `[data-board]` itself
- **THEN** every dispatched event has `defaultPrevented` false and `document.activeElement` is still that cell after each
- **AND** no cell changed its text, its `data-given` value or its classes

#### Scenario: Keys on a given cell change nothing and move nothing

- **GIVEN** a mounted board whose cell at row 1 column 3 is a given showing `0` and has DOM focus
- **WHEN** the test dispatches ArrowDown, ArrowUp, End and Home on it
- **THEN** no cell changes its text, its `data-given` or its classes, none of the events has `defaultPrevented` true, and `document.activeElement` is still that cell

#### Scenario: Other keys are not prevented

- **GIVEN** a mounted 6x6 page and the cell at row 3 column 3 has DOM focus
- **WHEN** the test dispatches Tab, Shift+Tab, PageDown, PageUp, Escape and `a` on it
- **THEN** every dispatched event has `defaultPrevented` false and the focus stays on that cell

#### Scenario: Showing a board does not move the focus

- **GIVEN** a button outside the page root has DOM focus, and the page is then mounted on a new root with an injected `generate` that returns a fixture for sizes 6 and 4
- **WHEN** the mount returns, and then the test gives DOM focus to `[data-action="new"]` and presses it, and gives DOM focus to `[data-action="reset"]` and presses it (the boards have no entries, so each action is performed at once)
- **THEN** after the mount the outside button still has the focus, and after each press `document.activeElement` is the button that was pressed

#### Scenario: «Почати» returns the focus to the summary button

- **GIVEN** the page of the previous scenario, the sheet opened through the stubbed `showPopover()`, DOM focus on the button «Поле 4×4», and «Поле 4×4» marked by a press
- **WHEN** the player presses «Почати» (the board has no entries, so at once)
- **THEN** a 4×4 board is shown and `document.activeElement` is the summary button, not the option or «Почати»

#### Scenario: Marking leaves the focus on the pressed button

- **GIVEN** the page of the previous scenario, the sheet opened through the stubbed `showPopover()`, and DOM focus on the button «Поле 4×4»
- **WHEN** the player presses «Поле 4×4» (a marking press)
- **THEN** `document.activeElement` is still the button «Поле 4×4», and no board was shown

#### Scenario: A hint leaves the focus on the hint button

- **GIVEN** two mounted pages, one on the fixture `PAIR_ROW` (the hint fills a cell) and one on a fixture on which `hint(board, 4)`, the call the page makes, fills nothing (the suite asserts this premise by calling the engine on the fixture; the earlier fixture `ISOLATED` fills nothing only at the engine's default ceiling and is not used unless the assertion holds), with DOM focus on `[data-action="hint"]` in each
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** on both pages `document.activeElement` is still `[data-action="hint"]`

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила», the summary button, the three size buttons, the four level buttons, the start button «Почати» and the close button «Закрити» of the setup sheet, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the 2px gap between cells shows the page colour on the ring's inner side, the ring's outer edge lands on a neighbour's fill (the pairs `--color-focus` against cell, given and violation fills, 6.70, 5.41 and 4.63 with the design's values) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all. The open setup sheet SHALL keep a keyboard-focused control clear of its sticky footer row (FR-65 "unobscured", WCAG 2.4.11): the open sheet declares a `scroll-padding-bottom` of at least the footer height, so the browser's own focus scrolling brings a focused option above the footer (second review-gate fix round, 2026-10-10, autonomy-log row 126).

Traces: FR-65, FR-87, FR-95, FR-97, FR-101

#### Scenario: Focus-visible rules exist for the cell and the button

- **GIVEN** the parsed `src/ui/style.css` (jsdom never matches `:focus-visible`, so these rules are checked as declarations)
- **WHEN** the test looks for the rules whose selector list contains `.cell:focus-visible` or `button:focus-visible`
- **THEN** each of the two exists, declares `outline-style: solid`, an `outline-width` of at least 2px and `outline-color: var(--color-focus)`

#### Scenario: The cell ring is outside the border and above the neighbours

- **GIVEN** the `.cell:focus-visible` rule
- **WHEN** the test reads its declarations
- **THEN** `outline-offset` is `2px`, `position` is `relative` and `z-index` is an integer of at least 1
- **AND** the `button:focus-visible` rule declares an `outline-offset` greater than 0

#### Scenario: Every page button is a button element

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="rules"]`, the summary button `[data-action="setup"]`, the three size `button[role="radio"]` and the four level `button[role="radio"]` (FR-87), the start button `[data-action="setup-start"]`, the close button `[data-action="setup-close"]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, the close button of `[data-section="rules"]`, `[data-confirm="yes"]`, `[data-confirm="no"]` and every `[data-cell]`
- **THEN** each of them is a `button` element, so `button:focus-visible` (and `.cell:focus-visible` for the cells) applies to it

#### Scenario: Nothing removes the outline

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches for `outline: none`, `outline: 0`, `outline-style: none` and `outline-width: 0` (any spacing)
- **THEN** there is no match

#### Scenario: The stylesheet stays inside the build target, with one `:has(` exception

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test searches the text for `!important` and collects the rules whose selector contains `:has(`
- **THEN** there is no `!important`, anywhere
- **AND** exactly one rule contains `:has(`, the subject of its selector (its last compound selector) is `.message-idle`, and its only declaration is `display: none`
- **AND** the raw text of the file contains `:has(` exactly once, so no rule the parser drops and no at-rule prelude holds another

#### Scenario: The open sheet reserves the footer in its scroll padding

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule for the open setup sheet (`.setup-sheet:popover-open`)
- **THEN** it declares `scroll-padding-bottom` with a length of at least `calc(2.75rem + 48px)` (the strip of `2.75rem + 16px`, the sheet's bottom padding of up to 24px and the 5px ring, the need measured in `docs/qa/update-setup-sheet-start/focus-obscured-repro.txt`); the e2e walk decides the fit

#### Scenario: A focused option in a scrolling sheet is not covered by the footer

- **GIVEN** a real browser at 320×700, 1366×650, 320×568 and 375×667 (e2e, `e2e/nfr-13-a11y.spec.ts`; sampled), the setup sheet open with «Поле 4×4» marked, so the sheet scrolls inside itself
- **WHEN** the keyboard moves the focus with Tab from «Поле 4×4» through the size options and the four level options, with no scrolling by script
- **THEN** for each focused option the bottom of its focus ring (its rect bottom plus the outline offset and width) is at or above the top of the footer strip behind «Почати» and «Закрити»

### Requirement: The summary and level buttons set their own colours

The summary button SHALL carry the class `setup-button` (its text span carries `setup-summary` and its cue span `setup-cue`, as in the design reference `review-set-11`), the level control the class `level-control`, and the stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule `.setup-button`, in the rule `.level-control button`, in the rule `.level-control button[aria-checked='true']` and in the rule `.level-control button[aria-disabled='true']` (FR-65, NFR-9). For each of the four states, the declarations of the plain rule, with those of the state rule laid over them, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens), and the unavailable state SHALL NOT be drawn with `opacity`. The rule `.level-control button[aria-disabled='true']` SHALL also declare a cue that is not colour alone (FR-91): a `border-style` that differs from the plain rule's, or a `text-decoration` other than `none`; which cue is used follows the user's updated design (the design reference `review-set-11` uses a dashed border and a dashed radio ring and no strike-through, autonomy-log row 93). No colour literal is added, and no `--color-*` token is added unless the signed design adds one for «Почати» (the 13 tokens of «Borders, cues and focus rings have enough contrast» stay declared). The summary button, the level buttons and the close button are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator of FR-65, and the rules of the sheet obey the existing stylesheet scans (no `!important`, no `:has(` besides the idle-line rule, no `display: contents`, no removed outline). The start button `[data-action="setup-start"]` SHALL set its own explicit `color` and `background-color`, each a single `var(--color-...)` token, in one rule that matches it (found by matching the mounted element against the selectors of the stylesheet), with at least 4.5:1 contrast between the two on the resolved tokens, in the plain state and in the hover and focus-visible states if the rule has them, and without `opacity` (FR-65, FR-101). Whether the tokens of the baseline suffice for «Почати» or the signed design adds one token for it (for example a primary fill) is the design's call; a token that the design adds is declared once in `:root` with a `#rrggbb` value and satisfies the pairs of «Borders, cues and focus rings have enough contrast». The `.size-control` rules are not changed by this requirement. The look of the buttons (the ring, the sunken look of the unavailable state, the colours beyond the pairs above) is covered by the held NFR-14, see `docs/requirements-held.md`, and is not claimed here.

Traces: FR-65, NFR-9, FR-87, FR-91, FR-95, FR-97, FR-101

#### Scenario: The summary and level buttons declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.setup-button`, `.level-control button`, `.level-control button[aria-checked='true']` and `.level-control button[aria-disabled='true']`
- **THEN** each of the four rules exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`
- **AND** none of the four declares `opacity`

#### Scenario: Each state has 4.5:1 text

- **GIVEN** the resolved colours of the tokens and the four rules above
- **WHEN** the test lays the checked rule and the aria-disabled rule over the plain level rule, and computes the ratio of the text colour to the background colour for the summary, plain, checked and unavailable states
- **THEN** each of the four ratios is at least 4.5

#### Scenario: The unavailable level has a cue besides colour

- **GIVEN** the rules `.level-control button` and `.level-control button[aria-disabled='true']`
- **WHEN** the test compares their `border-style` and `text-decoration` declarations
- **THEN** the aria-disabled rule declares a `border-style` different from the plain rule's, or a `text-decoration` value other than `none`

#### Scenario: The checked level has a cue besides colour

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test reads the name span of each level button and the rules `.level-control button .level-name::before` and `.level-control button[aria-checked='true'] .level-name::before`
- **THEN** each name span has the class `level-name`, the first rule declares `content` and a `border-radius` (the radio ring), and the second declares a `box-shadow` whose value contains `inset` (the dot inside the ring), so the checked level differs from the others in shape and not by colour alone (WCAG 1.4.1; review-gate fix round, 2026-10-09)

#### Scenario: The classes are on the elements and the buttons are buttons

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="setup"]`, `[data-control="level"]`, its four radio buttons and `[data-action="setup-close"]`
- **THEN** the summary has the class `setup-button`, the control has the class `level-control`, and each of the six buttons is a `button` element, so `button:focus-visible` applies to it

#### Scenario: The start button declares its colours

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test finds the rule that matches `[data-action="setup-start"]` and reads its declarations
- **THEN** the rule exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`, and no `opacity`
- **AND** the ratio of the text colour to the background colour is at least 4.5

#### Scenario: The existing stylesheet scans still pass

- **GIVEN** the stylesheet with the sheet, summary and level rules
- **WHEN** the existing scans of «Rules use the tokens and no colour literal is left», «Nothing removes the outline» and «The stylesheet stays inside the build target, with one `:has(` exception» run
- **THEN** each passes unchanged, and each of the 13 token names of the baseline is still declared in `:root`

### Requirement: The page meets the WCAG 2.2 AA criteria of the accessibility requirements

The page SHALL meet WCAG 2.2 AA for what FR-43, FR-59 to FR-65, FR-67, FR-69, FR-70 and FR-87 to FR-101 cover (NFR-9): keyboard operation 2.1.1 (every cell and every control reached by Tab in reading order and operated by Enter and Space as a native button, FR-59 and FR-60), name, role and value 4.1.2 (the role and name of the board group, of the two radiogroups, of the summary button, of the start button «Почати» and of the setup sheet, the cell names, `aria-checked` (the marked state in the two radiogroups while the sheet is open, FR-100), `aria-disabled`, `aria-invalid`), labels 3.3.2 (the accessible names «Розмір поля» and «Складність» and the visible text of each size button, each level button and the summary button), status messages 4.1.3 (the two `role="status"` regions), use of colour 1.4.1 (the heavier violation border and `aria-invalid`) and non-text contrast 1.4.11 (the 3:1 pairs) and visible focus 2.4.7 (the `:focus-visible` rules). Every button of the page (the cell buttons, the size radio buttons, the level radio buttons, the summary button, the start button and the close button of the sheet included; the name of a button without `aria-label` is its text content without `aria-hidden` descendants) SHALL have a non-empty accessible name in Ukrainian: its `aria-label` when it has one (every cell), otherwise its text; the board group, both radiogroups and the setup sheet SHALL have a non-empty Ukrainian `aria-label`. No element of the page SHALL have a `tabindex` attribute, before or after play. Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).

Traces: NFR-9, NFR-5, FR-43, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, FR-65, FR-67, FR-69, FR-70, FR-87, FR-88, FR-91, FR-95, FR-96, FR-97, FR-98, FR-99, FR-100, FR-101

#### Scenario: Every button, the radiogroups, the sheet and the board have a Ukrainian name

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test computes the accessible name of each `button` (its `aria-label` when present, else its text content without `aria-hidden` descendants) and of each `[role="radiogroup"]`, of `[data-section="setup"]` and of `[data-board]` (their `aria-label`)
- **THEN** there are 53 buttons (36 cells and 17 others: «Правила», the summary button, three size buttons, four level buttons, «Почати», «Закрити», «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати»), two radiogroups, the sheet and the board, every name is non-empty, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/`
- **AND** the names include «Підказка», «Скинути», «Нова головоломка», «Розмір поля», «Поле 6×6», «Складність», «Поле і складність», «Почати», «Закрити», `Поле і складність: 6×6 · Розминка`, the four level buttons as name, space and description, and the 36 cell names

#### Scenario: No element of the page has a tabindex, before and after play

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test reads every element of the root at mount, and again after a click on a cell and a hint press
- **THEN** no element of the root has a `tabindex` attribute at either moment

#### Scenario: The level radiogroup exposes its state

- **GIVEN** a mounted page, and the same page after «Поле 4×4»
- **WHEN** the test reads the `aria-checked` and `aria-disabled` attributes of the four level buttons
- **THEN** at 6x6 exactly one button has `aria-checked="true"`, none has `aria-disabled`, and at 4x4 exactly one has `aria-checked="true"` and three have `aria-disabled="true"`, so the state of the group is exposed by attributes and not by colour alone

#### Scenario: The radiogroups expose the marked state while the sheet is open

- **GIVEN** a mounted 6×6 page at «Розминка», the sheet opened, and «Поле 4×4» marked
- **WHEN** the test reads `aria-checked` and `aria-disabled` of the three size buttons and the four level buttons
- **THEN** `aria-checked="true"` is on «Поле 4×4» only and on «Розминка» only, and «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`
- **AND** after the sheet is closed by a `toggle` event with `newState` `closed`, `aria-checked="true"` is on «Поле 6×6» only and no level button has `aria-disabled`

### Requirement: Summary button

The page SHALL show, in the place of the size control in the page order (FR-68), one button `[data-action="setup"]` with `type="button"` and a `popovertarget` attribute equal to the `id` of the setup sheet, so that it opens the sheet with no script (FR-95, A-40). The button SHALL hold three children in this order: a visually hidden prefix span with the text `Поле і складність: ` (ending in one ordinary space), a text span with the visible text `N×N · Name` for the size and the level of the board shown (the separator is « · », an ordinary space, U+00B7 and an ordinary space), for example `6×6 · Задачка`, and a decorative span `aria-hidden="true"` with the cue `▾`. At mount the visible text is `6×6 · Розминка`. The visible text SHALL be rewritten after every board that is shown (the mount, a performed «Почати», «Нова головоломка»; a reset shows the same size and level and leaves the text as it is, as «Reset button» says) and after nothing else: marking a size or a level (FR-100), a cancelled confirmation, a failed generation, the press of an unavailable level and the opening or closing of the sheet leave it as it was. The summary shows the board shown, never the marked choice (FR-95). The accessible name of the button is its text content without `aria-hidden` descendants, that is the prefix followed by the visible text, for example `Поле і складність: 6×6 · Задачка`; the button SHALL NOT carry `aria-label`, `aria-labelledby`, `aria-haspopup`, `aria-expanded` or `tabindex` (A-41, A-43: browsers expose the open state of a `popovertarget` button natively). The height of the button (44 CSS px) and the look of the cue are layout and are covered by the held NFR-12 and NFR-14, see `docs/requirements-held.md`. The names of the size and the level in the text come from `src/ui/strings.ts`.

Traces: FR-95, NFR-5, NFR-9, FR-100, FR-101

#### Scenario: Summary button structure at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="setup"]`
- **THEN** exactly one such element exists in the root, it is a `button` with `type="button"`, and its `popovertarget` equals the `id` of the one element `[data-section="setup"]`
- **AND** it has exactly three child elements: a span with the text `Поле і складність: `, a span with the text `6×6 · Розминка`, and a span with `aria-hidden="true"` and the text `▾`
- **AND** it has no `aria-label`, `aria-labelledby`, `aria-haspopup`, `aria-expanded` or `tabindex` attribute

#### Scenario: The accessible name says what the button opens

- **GIVEN** the page has just been mounted
- **WHEN** the test computes the text content of the button without its `aria-hidden` descendants
- **THEN** it equals `Поле і складність: 6×6 · Розминка`, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/`

#### Scenario: The summary follows every shown board

- **GIVEN** a mounted page with the real engine generator and no player entries
- **WHEN** the player chooses, in turn, «Задачка», «Поле 8×8», «Мозколамка», «Поле 4×4», «Поле 6×6» (each from the open sheet)
- **THEN** after each choice the visible text of the summary is `6×6 · Задачка`, `8×8 · Задачка`, `8×8 · Мозколамка`, `4×4 · Розминка` and `6×6 · Розминка` in this order

#### Scenario: The summary follows «Нова головоломка» and keeps its text after a reset

- **GIVEN** a 6×6 board at the level «Головоломка» whose summary reads `6×6 · Головоломка`, with player entries
- **WHEN** the player presses «Скинути» and `[data-confirm="yes"]`, then «Нова головоломка» and `[data-confirm="yes"]`
- **THEN** after each step the visible text of the summary is still `6×6 · Головоломка`

#### Scenario: The summary stays when nothing was shown

- **GIVEN** a 6×6 board at the level «Розминка» with player entries and the summary `6×6 · Розминка`
- **WHEN** the player chooses «Задачка» and presses `[data-confirm="no"]`, then chooses «Поле 8×8» with an injected `generate` that throws an ordinary error and presses `[data-confirm="yes"]`, then opens the sheet at 4×4 on another page and presses an unavailable level
- **THEN** in the first two cases the visible text of the summary is still `6×6 · Розминка`, and in the third it is still `4×4 · Розминка`

#### Scenario: Marking leaves the summary alone

- **GIVEN** a mounted 6×6 board at «Розминка» whose summary reads `6×6 · Розминка`, and the sheet opened
- **WHEN** the player marks «Поле 8×8» and «Мозколамка» (two marking presses), and then presses «Почати»
- **THEN** after the two marking presses the visible text of the summary is still `6×6 · Розминка`, and after «Почати» it is `8×8 · Мозколамка`

#### Scenario: The summary button is in the page order and the tab order

- **GIVEN** the page has just been mounted at 6×6
- **WHEN** the test reads the document order of the elements
- **THEN** the summary button follows the `header` and precedes `[data-board]`, and it precedes the cell with `data-row="1"` and `data-col="1"`

### Requirement: Setup sheet

The page SHALL contain, created once at mount, a setup sheet `[data-section="setup"]` (FR-96, A-40): an element with the `popover` attribute and `role="dialog"`, with the Ukrainian `aria-label` «Поле і складність», with an `id` that is unique in the document (it ends in a number that belongs to the mount, like the other ids), and with no `aria-labelledby` and no heading element (A-41). It SHALL sit inside the page root and outside the element that holds the board, follow the rules panel in document order and precede the confirmation dialog, need no new dependency and hold, in this order: the size control `[data-control="size"]` (see «Grid size selector»), the level control `[data-control="level"]` (see «Level selector»; it contains the reason line `[data-level-reason]` first, see «Only the first level exists at 4x4»), the start button `[data-action="setup-start"]` «Почати» (see «Start button») and the close button `[data-action="setup-close"]` with the text «Закрити», `type="button"`, `popovertarget` equal to the sheet's `id` and `popovertargetaction="hide"`. The sheet SHALL be the same element, with the same children, after a hint, a win, a reset, «Нова головоломка» and a press of «Почати» (only the attributes and texts that those requirements define change). Where the sheet is drawn (a bottom sheet on phones, a centred panel from 48rem), the footer drawing and the 44 px targets and its look are layout and are covered by the held NFR-10, NFR-12 and NFR-14, see `docs/requirements-held.md`; nothing here claims them.

Reading rule and test contract (A-44). jsdom has no `popover` support: tests install stubs for `showPopover`, `hidePopover` and `togglePopover` on `HTMLElement.prototype` that record each call and keep an open or closed state per element, and remove them after each test; the stub of `hidePopover` closes the state and dispatches no event, and a `toggle` event is dispatched by the test itself (an `Event` of type `toggle` with a `newState` property set to `closed` or `open`). The opening of the sheet by the summary button is native and not tested in jsdom: a test opens the sheet by calling the stubbed `showPopover()` on it. **Reading rule for choices (A-44, A-47).** The verb **«chooses»** (in a requirement this change does not modify also «presses», «selects», «changes the size to N» or «changes the level to X» followed by an effect on the board, the seed source, the generator, the dialog, the messages or the summary; the list is in `design.md`) means a **choice**: the test first opens the sheet this way, presses the option (which only marks, FR-100), presses «Почати», and, where the scenario confirms, `[data-confirm="yes"]`. «A size change» and «a level change» mean a board shown by such a choice. A choice of the size and level already shown is therefore not a no-op: it makes one new puzzle like «Нова головоломка». The verbs «marks» and «makes a marking press», and every use of «presses» that carries the note «(a marking press)» or «(marking presses)», mean one press on the option and no «Почати»; so do the scenarios that say a press «does nothing». `aria-checked` read after a choice is read with the sheet closed, that is on the board shown (A-47). A generator that "throws" in a scenario throws an ordinary `Error`, not the run-out error of the engine, unless the scenario says run-out.

Traces: FR-96, FR-95, FR-97, FR-94, NFR-5, NFR-9, FR-100, FR-101

#### Scenario: Sheet structure at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-section="setup"]`
- **THEN** exactly one such element exists in the root, it has the `popover` attribute and `role="dialog"`, `aria-label` equal to «Поле і складність», no `aria-labelledby`, and a non-empty `id`
- **AND** it contains no heading element (`h1` to `h6`), and it is not inside `[data-board]`, the board host, the header or the message area
- **AND** its element children, in order, are `[data-control="size"]`, `[data-control="level"]`, `[data-action="setup-start"]` and `[data-action="setup-close"]`

#### Scenario: Sheet position in the document

- **GIVEN** the page has just been mounted
- **WHEN** the test compares document positions with `compareDocumentPosition`
- **THEN** the sheet follows the message area and the rules panel `[data-section="rules"]`, and it precedes `[data-dialog="confirm"]`

#### Scenario: The close button

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="setup-close"]`
- **THEN** it is a `button` with `type="button"`, the text «Закрити», `popovertarget` equal to the sheet's `id` and `popovertargetaction="hide"`, and no `tabindex`
- **AND** the sheet holds exactly nine buttons in all: the three size buttons, the four level buttons, «Почати» and the close button

#### Scenario: The sheet opens and closes with no script

- **GIVEN** the page has just been mounted, and `showPopover`, `hidePopover` and `togglePopover` are installed as spies
- **WHEN** the test clicks `[data-action="setup"]` and then `[data-action="setup-close"]`
- **THEN** no spy was called
- **AND** the board, the messages, the summary text, `aria-checked` of both groups and every cell are unchanged

#### Scenario: Two mounts stay independent

- **GIVEN** the page is mounted on two roots in the same document
- **WHEN** the test reads the `popovertarget` of each root's summary button and of each root's close button
- **THEN** the two sheets have different `id` values, and each button names the sheet of its own root

#### Scenario: Other actions leave the sheet alone

- **GIVEN** a mounted page with a fixture puzzle, the sheet element and its children read at mount
- **WHEN** the player presses «Підказка», reaches a win, presses «Скинути» and «Нова головоломка», marks a size and a level, and chooses a size and a level (each from a freshly mounted page, confirmed where asked)
- **THEN** after each action there is exactly one `[data-section="setup"]`, it is the same element as at mount, with the same four children, and `hidePopover` was called only by the press of «Почати» of a choice (once each), never by a marking press

### Requirement: Choosing and closing the sheet

A press on an available size button or level button inside the sheet SHALL only mark the choice (FR-97(a), FR-100): the sheet stays open, DOM focus stays on the pressed button, and the board, the messages, the highlights, `cell-hinted`, the seed source, the generator and the summary are untouched. A press on a level button that is unavailable at the marked size (FR-91) does nothing at all. «Почати» SHALL close the sheet with `hidePopover()` and then act as «Start button» says (FR-97(c), FR-101): focus goes to the summary button, except where the press needs the confirmation, where the sheet closes, the dialog opens with focus on «Скасувати» (FR-67), and focus goes to the summary button only when the dialog ends (FR-98, see «Sheet and confirmation»). The same holds when the press of «Почати» starts a new puzzle, when its generation fails (FR-88) and when the marked choice equals the board shown. The close button, Escape and a click outside the sheet (the light dismiss of `popover="auto"`) close the sheet natively with no change to the board, the size, the level, the messages, the highlights, `cell-hinted` or the summary, and discard the marked choice (FR-97(d), FR-100); the page SHALL listen to the `toggle` event of the sheet and, when `newState` is `closed`, drop the marked choice and, when the confirmation dialog is not open, move focus to the summary button, subject to the focus rule below (when the rules panel opens, its autofocus «Зрозуміло» holds the focus outside the sheet, so the rule leaves it there). The page adds no key handler (FR-59): Escape is the browser's. A late `toggle` event that arrives while the confirmation dialog or the rules panel is open SHALL NOT move focus (the dialog's focus on «Скасувати» wins, FR-67, and so does the autofocus of «Зрозуміло» in the rules panel). Nor SHALL a closing `toggle` event move focus when DOM focus is already on an element outside the sheet other than the document body: a light dismiss by a click on another control (a cell, «Підказка», «Правила») leaves the focus on that control (FR-97(d), review-gate fix round, 2026-10-09, seen in Chromium). Focus moves to the summary button only when it is inside the sheet or on no element. A browser dispatches `toggle` asynchronously; the rule above is what makes the order irrelevant.

Traces: FR-97, FR-91, NFR-9, FR-100, FR-101, FR-59

#### Scenario: Marking a size keeps the sheet open and the focus on the button

- **GIVEN** a mounted 6×6 board without player entries, the sheet opened through the stubbed `showPopover()`, and the test has given DOM focus to the button «Поле 8×8»
- **WHEN** the player presses «Поле 8×8» (a marking press)
- **THEN** `hidePopover` was never called, the sheet's stub state is open, `document.activeElement` is the button «Поле 8×8», the summary reads `6×6 · Розминка` and the board is still 6×6

#### Scenario: Marking a level keeps the sheet open and the focus on the button

- **GIVEN** a mounted 6×6 board without player entries and the sheet opened as above, with DOM focus on «Задачка»
- **WHEN** the player presses «Задачка» (a marking press)
- **THEN** `hidePopover` was never called, the sheet's stub state is open, `document.activeElement` is the button «Задачка», and the summary reads `6×6 · Розминка`

#### Scenario: «Почати» closes the sheet and returns the focus

- **GIVEN** a mounted 6×6 board without player entries, the sheet opened, «Поле 8×8» marked, and the test focus on «Почати»
- **WHEN** the player presses «Почати»
- **THEN** `hidePopover` was called once on the sheet, the sheet's stub state is closed, `document.activeElement` is the summary button, and the summary reads `8×8 · Розминка`

#### Scenario: The shown size and the shown level only mark

- **GIVEN** a mounted board with player entries, a hint sentence and a hinted cell, the sheet opened, and a counting seed source and a `generate` spy
- **WHEN** the player makes a marking press on the size button of the size shown, and on the level button of the level shown
- **THEN** after each press `hidePopover` was never called, the sheet's stub state is open, the focus is on the pressed button when the test had focused it, and the board, the messages, the highlights, `cell-hinted`, `aria-checked` of both groups and the summary are unchanged
- **AND** `showModal` was never called and the seed-source and generator call counts are unchanged

#### Scenario: A «Почати» whose generation fails closes the sheet

- **GIVEN** a 6×6 board without entries, the sheet opened with «Поле 8×8» marked, and an injected `generate` that throws an ordinary error for size 8
- **WHEN** the player presses «Почати»
- **THEN** `hidePopover` was called once, `document.activeElement` is the summary button, the board is still 6×6, and the summary reads `6×6 · Розминка`

#### Scenario: An unavailable level leaves the sheet open

- **GIVEN** the sheet is opened with a marked size of 4×4 (or the page shows a 4×4 board), with the test focus on «Задачка»
- **WHEN** the player presses «Задачка» (a marking press on an unavailable level)
- **THEN** `hidePopover` was never called, the sheet's stub state is open, `document.activeElement` is still that button, and `aria-checked="true"` is on «Розминка» only

#### Scenario: Escape, the close button and a closing toggle event change nothing

- **GIVEN** a mounted board with player entries, a hint sentence and a hinted cell, and the sheet opened with «Поле 8×8» marked
- **WHEN** the test dispatches an Escape `keydown` on the sheet, clicks the close button, and then dispatches a `toggle` event with `newState` `closed` on the sheet
- **THEN** the `keydown` has `defaultPrevented` false, no cell changed, the messages, the highlights, `cell-hinted`, the size, the level and the summary are unchanged, and no seed was taken and no generator call was made
- **AND** after the `toggle` event `document.activeElement` is the summary button, and `aria-checked="true"` is on the size and the level of the board shown in both groups (the marked choice is discarded)
- **AND** the light dismiss (a click outside the sheet) is native to `popover="auto"`: jsdom cannot perform it, so it is not claimed here and is checked in the real browser

#### Scenario: A late toggle event does not steal the focus from the rules panel

- **GIVEN** the sheet closed, the rules panel opened through the stubbed `showPopover()`, and the test focus on «Зрозуміло»
- **WHEN** the test dispatches a `toggle` event with `newState` `closed` on the sheet
- **THEN** `document.activeElement` is still «Зрозуміло»

#### Scenario: A late toggle event does not steal the focus from the dialog

- **GIVEN** a board with player entries, the sheet opened, and the player has marked «Задачка» and pressed «Почати» so that the dialog is open and the test focus is on `[data-confirm="no"]`
- **WHEN** the test dispatches a `toggle` event with `newState` `closed` on the sheet
- **THEN** `document.activeElement` is still `[data-confirm="no"]`

#### Scenario: A light dismiss by a click on a cell leaves the focus on that cell

- **GIVEN** a mounted 6×6 board without player entries, the sheet opened through the stubbed `showPopover()`, and the test focus on a non-given cell (as a click on it outside the sheet does in a browser)
- **WHEN** the test dispatches a `toggle` event with `newState` `closed` on the sheet
- **THEN** `document.activeElement` is still that cell

#### Scenario: A closing toggle with the focus on no element moves it to the summary button

- **GIVEN** a mounted 6×6 board, the sheet opened through the stubbed `showPopover()`, and no element focused (`document.activeElement` is the body)
- **WHEN** the test dispatches a `toggle` event with `newState` `closed` on the sheet
- **THEN** `document.activeElement` is the summary button

### Requirement: Sheet and confirmation

When a press of «Почати» needs the confirmation (FR-67: the board has player entries), the press SHALL make the marked size and the marked level the pending action, and the page SHALL close the sheet first with `hidePopover()` and only then open the confirmation dialog with `showModal()`; the sheet and the dialog are never open together (FR-98). «Скасувати» and Escape SHALL close the dialog, leave everything unchanged (FR-67, FR-90), drop the pending action (it is never performed later) and move focus to the summary button; the sheet SHALL NOT reopen. «Так, почати» SHALL close the dialog, perform the pending action (the size and the level marked at the press of «Почати»), update the summary and move focus to the summary button. The dialog's own rule that opening it focuses «Скасувати» is unchanged.

Traces: FR-98, FR-90, FR-97, FR-101, FR-100

#### Scenario: The sheet closes before the dialog opens

- **GIVEN** a 6×6 board with player entries, `showModal` and `hidePopover` installed as call-recording stubs, and the sheet opened
- **WHEN** the player marks «Поле 8×8» and presses «Почати», and, in a separate run from a fresh page, marks «Задачка» and presses «Почати»
- **THEN** in both runs `hidePopover` was called once and `showModal` was called once, and `hidePopover` was called before `showModal`
- **AND** after the press the sheet's stub state is closed, the dialog has the `open` attribute, and the focused element of the document is `[data-confirm="no"]`

#### Scenario: «Скасувати» returns the focus to the summary button and drops the pending action

- **GIVEN** the page of the previous scenario with the dialog open
- **WHEN** the player presses `[data-confirm="no"]`
- **THEN** the dialog is closed, `document.activeElement` is the summary button, the sheet's stub state is closed and `showPopover` was not called again
- **AND** the board, the size, the level, the messages, the highlights, `cell-hinted` and the summary are unchanged, and no seed was taken and no generator call was made
- **AND** when the sheet is opened again `aria-checked="true"` is on the size and the level of the board shown, and pressing «Нова головоломка» later performs a puzzle of the board shown, not of the dropped pair

#### Scenario: Escape returns the focus to the summary button

- **GIVEN** the page of the previous scenarios with the dialog open
- **WHEN** the test dispatches a `cancel` event and then a `close` event on the dialog, pressing no button
- **THEN** `document.activeElement` is the summary button and everything is unchanged as above

#### Scenario: A failed generation after «Так, почати» focuses the summary button

- **GIVEN** a 6×6 board with player entries, an injected `generate` that throws an ordinary error for size 8, and the dialog open after marking «Поле 8×8» and pressing «Почати»
- **WHEN** the player presses `[data-confirm="yes"]`
- **THEN** the dialog is closed, the board is still 6×6, the summary is unchanged, and `document.activeElement` is the summary button

#### Scenario: «Так, почати» performs the marked pair and focuses the summary

- **GIVEN** the page of the previous scenarios with the dialog open after marking «Поле 8×8» and pressing «Почати»
- **WHEN** the player presses `[data-confirm="yes"]`
- **THEN** the dialog is closed, the board is 8×8 with no player entries, the summary reads `8×8 · Розминка`, and `document.activeElement` is the summary button

### Requirement: Level selector

The setup sheet SHALL contain a level control `[data-control="level"]` after the size control (FR-44, FR-87): an element with `role="radiogroup"` and the accessible name «Складність» (`aria-label`, no visible label, as FR-62), holding exactly four `<button type="button" role="radio">` elements for the levels 1, 2, 3 and 4, in this order, with the names «Розминка», «Задачка», «Головоломка» and «Мозколамка». While the sheet is open the button of the **marked** level SHALL have `aria-checked="true"` and the other three `aria-checked="false"`; while the sheet is closed `aria-checked="true"` is on the level of the board shown (FR-87, FR-100, A-47); «Розминка» is selected when the page is mounted (FR-88). A level button SHALL NOT carry `aria-label`, `aria-labelledby` or `aria-describedby`, SHALL NOT have the `disabled` attribute or a `tabindex` attribute, and is operated by a click (the native activation of Enter and Space); arrow keys are not required and not handled (A-24, FR-59). No text of the page shows «Складність», and the page has no `label` element for the control. The page reads a level only from the four buttons, never from a free value. The content of a level button is specified by «Level option content».

**One press of an available level button only marks that level** (FR-73, FR-100): it starts no puzzle, takes no seed, calls no generator, opens no dialog and does not close the sheet. A new puzzle of the marked size and the marked level is started only by «Почати» (FR-101): the page SHALL take a new seed from the seed source, call the generator as `generate(size, seed, level)`, the three-argument form of the engine generator (FR-13, FR-81), render the new board, update the summary, and clear the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker. When the board has player entries the page SHALL first close the sheet and ask for confirmation and start the new puzzle only after «Так, почати» (FR-90, FR-98). A level choice SHALL NOT change the size. A run-out of the generator is retried with the next seed (FR-88, see «Page retry on a run-out»). If the generator fails in any other way, or the returned `puzzle.givens` is not n rows of n cells, or every retry ran out, the page SHALL keep the previous board, messages, highlights, `cell-hinted`, size and level, with `aria-checked` and the summary unchanged and no uncaught error; the page shows no error text for it, and the sheet is closed (FR-97). The page MUST NOT remember the level: a reload or a new mount starts at «Розминка» (TC-12, FR-88). Pressing the button of the level already shown or already marked is specified by «Pressing the shown size changes nothing» (FR-73); whether the pressed level exists at the size shown by «Only the first level exists at 4x4». Layout of the control, wrapping, 44 px targets and the one-screen fit are not claimed here: held NFR-10, NFR-12 and NFR-14, see `docs/requirements-held.md`.

Traces: FR-44, FR-87, FR-88, FR-97, NFR-9, NFR-5, FR-73, FR-100, FR-101

#### Scenario: Level control structure and default

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="level"]`
- **THEN** it is inside `[data-section="setup"]`, follows `[data-control="size"]`, has `role="radiogroup"` and `aria-label` equal to «Складність», no `aria-labelledby`, and its element children are the reason line `[data-level-reason]` (a `p` without a `role`, first, see «Only the first level exists at 4x4») followed by exactly four `button` elements, each with `type="button"` and `role="radio"`, whose names (the text of their first span) are «Розминка», «Задачка», «Головоломка» and «Мозколамка», in this order
- **AND** the first button has `aria-checked="true"` and the other three have `aria-checked="false"`
- **AND** no level button has `aria-label`, `aria-labelledby`, `aria-describedby`, `disabled` or `tabindex`

#### Scenario: The level group has a name and no visible label

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the root
- **THEN** no text node of the root has the trimmed text «Складність», the root contains no `label` element and no `for` attribute

#### Scenario: A level press only marks

- **GIVEN** a 6×6 fixture board with player entries, the sheet opened, a counting seed source, a `generate` spy and the `showModal` spy with the counts read now
- **WHEN** the player presses the button «Головоломка» (a marking press)
- **THEN** `aria-checked="true"` is on «Головоломка» only in the level control, `[data-board]` keeps `data-size="6"` with its cell texts, the summary reads `6×6 · Розминка`, and the sheet's stub state is open
- **AND** `showModal` was never called and the seed-source and generator call counts equal the counts read now

#### Scenario: Choose a level on a board without entries

- **GIVEN** the default 6×6 board with no player entries, a counting seed source returning 1, 2 and so on, a `generate` spy recording `(size, seed, level)`, and the sheet opened
- **WHEN** the player chooses «Задачка» (marks it, then presses «Почати»)
- **THEN** `showModal` was never called, one more seed was taken (the second) and the spy's last call is `(6, 2, 2)`
- **AND** `aria-checked="true"` is on «Задачка» only, `aria-checked="true"` in the size control is still on «Поле 6×6» only, and `[data-board]` has `data-size="6"` and 36 cells

#### Scenario: The level reaches the generator at 8x8

- **GIVEN** the page shows an 8×8 board reached by choosing «Поле 8×8» on an untouched 6×6 board, and a `generate` spy recording `(size, seed, level)`
- **WHEN** the player chooses «Мозколамка»
- **THEN** the spy's last call is `(8, seed, 4)` with the seed just taken, `[data-board]` has `data-size="8"` and 64 cells, and `aria-checked="true"` is on «Мозколамка» only

#### Scenario: Board content comes from the generator at the chosen level

- **GIVEN** a mounted page with the real engine generator and a seed source returning 1 and then 5
- **WHEN** the player chooses «Задачка»
- **THEN** for every cell, `data-given="true"` holds exactly where the generator returns a given for size 6, seed 5 and level 2, and each given cell shows the digit the generator returns for it

#### Scenario: A level change after play asks first, then replaces the board

- **GIVEN** a 6×6 fixture board with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted`, some cells with `cell-violation`, and an injected `generate` that returns a 6×6 fixture puzzle for level 3
- **WHEN** the player chooses «Головоломка», and then presses `[data-confirm="yes"]`
- **THEN** after the choice (the press of «Почати») the dialog is open and the board, the messages and `cell-hinted` are unchanged, and `aria-checked="true"` is still on «Розминка» only
- **AND** after the confirmation `aria-checked="true"` is on «Головоломка» only, the summary reads `6×6 · Головоломка`, the board has no player entries, `[data-message="hint"]` and `[data-message="win"]` have empty text content, no cell has `cell-hinted`, and the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: A level change after a win asks first

- **GIVEN** a 6×6 fixture board on which the win message is shown
- **WHEN** the player chooses «Задачка» and then presses `[data-confirm="yes"]` (a solved board has entries, A-29)
- **THEN** `[data-message="win"]` has empty text content and `aria-checked="true"` is on «Задачка» only

#### Scenario: The size is untouched by a level change

- **GIVEN** a page showing 8×8 at the level «Розминка», a board without entries
- **WHEN** the player chooses «Задачка», then «Мозколамка», then «Задачка» (each at once)
- **THEN** each time `[data-board]` has `data-size="8"`, `aria-checked="true"` is on «Поле 8×8» only in the size control, and the level control shows the pressed level

#### Scenario: A generator error keeps the previous board

- **GIVEN** a 6×6 fixture board with player entries, a hint sentence shown and a hint-filled cell, a counting seed source, a `window` `error` listener, and an injected `generate` that throws an ordinary error for level 3
- **WHEN** the player chooses «Головоломка» and then presses `[data-confirm="yes"]`
- **THEN** the `error` listener recorded nothing, `[data-board]` keeps `data-size="6"` with the same cell texts and highlights, both message regions keep their text, and the hint-filled cell keeps `cell-hinted`
- **AND** `aria-checked="true"` is on «Розминка» only, the summary reads `6×6 · Розминка`, and the dialog and the sheet are closed
- **AND** the seed source was called exactly once for the failed change (an ordinary error is not retried) and no second generator call was made

#### Scenario: A generator result of the wrong size keeps the previous board

- **GIVEN** a 6×6 fixture board with player entries and a hint sentence shown, and an injected `generate` that returns a 4×4 fixture puzzle for level 2
- **WHEN** the player chooses «Задачка» and then presses `[data-confirm="yes"]`
- **THEN** `[data-board]` keeps `data-size="6"` with 36 cells and the same cell texts, both message regions keep their text, and `aria-checked="true"` is on «Розминка» only

#### Scenario: The level is not remembered

- **GIVEN** a page on which the player chose «Головоломка», and `localStorage` and `sessionStorage` empty before the test
- **WHEN** the page is mounted again on a new root
- **THEN** the new page's level control has `aria-checked="true"` on «Розминка» only and its first generator call carried level 1
- **AND** `localStorage` and `sessionStorage` still hold no entry

### Requirement: Only the first level exists at 4x4

The page SHALL, while the **marked size** is 4×4 (while the sheet is closed, the size of the board shown), keep the level control visible inside the sheet with «Розминка» marked and SHALL give the buttons «Задачка», «Головоломка» and «Мозколамка» `aria-checked="false"` and `aria-disabled="true"` (FR-91, FR-44, A-34, FR-100): they are focusable and readable like the given cells (FR-69), so they have no `disabled` attribute and no `tabindex`. «Розминка» has no `aria-disabled` attribute. Pressing an unavailable level button SHALL do nothing at all (FR-73, FR-97): no dialog, no new puzzle, no seed taken, no generator call, the sheet stays open, focus stays on the button, and the board, both messages, the highlights, `aria-checked` of both groups, the summary and `cell-hinted` are unchanged. The level control SHALL hold a reason line `[data-level-reason]` as its first child, before the four buttons (FR-91 "in the level group"; the designer's iteration 10 puts it there): a `p` of plain text with no `role` and no `id`, present at every size, which while the marked size is 4×4 has no `hidden` attribute and the text `Для поля 4×4 є лише рівень «Розминка».` (the guillemets inside the code span are part of the text; signed wording, autonomy-log row 101; one sentence, NFR-4), and which at 6×6 and 8×8 has the `hidden` attribute and empty text content (the `hidden` mechanism is spec-made). The reason is not on the page body. The radiogroup thus holds one non-radio child; the four radio buttons are still exactly four, and the arrangement is confirmed against the signed review set in task 1.4 of this change. Marking 4×4 sets the marked level to «Розминка». As soon as the marked size is 6×6 or 8×8 (a 6×6 or 8×8 board is shown, or the sheet marks one of them), the three buttons lose `aria-disabled` and the reason is hidden, and «Розминка» stays the marked level: the page does not restore an earlier marked level. `aria-disabled` is set only on the buttons of levels the shown size does not offer. After a «Почати» whose generation fails the previous board stays, the sheet is closed, and the state of the buttons is that of the board shown. An unavailable level is marked by a cue that is not colour alone (FR-91; the stylesheet requirement «The summary and level buttons set their own colours» pins a non-colour declaration).

Traces: FR-91, FR-44, FR-97, FR-99, NFR-9, NFR-5, FR-100

#### Scenario: The 4x4 state of the level control follows the marked size

- **GIVEN** a 6×6 board without entries shown at «Розминка», and the sheet opened
- **WHEN** the player presses «Поле 4×4» (a marking press, no «Почати»)
- **THEN** `[data-control="level"]` is still in the sheet with no `hidden` attribute on it or on a level button, and «Розминка» has `aria-checked="true"` and no `aria-disabled`
- **AND** «Задачка», «Головоломка» and «Мозколамка» each have `aria-checked="false"` and `aria-disabled="true"`, and none of the four has the `disabled` attribute or a `tabindex`
- **AND** `[data-level-reason]` has no `hidden` attribute and the text `Для поля 4×4 є лише рівень «Розминка».`, the summary still reads `6×6 · Розминка`, and no seed was taken

#### Scenario: The 4x4 state after «Почати»

- **GIVEN** a 6×6 board without entries and an injected `generate` that returns a 4×4 fixture puzzle for size 4
- **WHEN** the player chooses «Поле 4×4» (marks it and presses «Почати») and opens the sheet again
- **THEN** «Розминка» has `aria-checked="true"`, «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`, `[data-level-reason]` shows its text, and the summary reads `4×4 · Розминка`

#### Scenario: The reason is hidden at 6x6 and 8x8

- **GIVEN** a page mounted at 6×6, and the same page after «Поле 8×8»
- **WHEN** the test reads `[data-level-reason]`
- **THEN** at both sizes it exists, has the `hidden` attribute and empty text content, and no text outside the sheet contains the reason

#### Scenario: An unavailable level is focusable

- **GIVEN** the page shows a 4×4 board
- **WHEN** the test gives DOM focus to «Мозколамка»
- **THEN** `document.activeElement` is that button

#### Scenario: Pressing an unavailable level changes nothing

- **GIVEN** a page showing a 4×4 board with player entries, a hint sentence shown, a hint-filled cell and some cells with `cell-violation`, the sheet opened, with a counting seed source, a `generate` spy and the `showModal` spy, the counts read now
- **WHEN** the player presses «Задачка», then «Головоломка», then «Мозколамка» (three marking presses on unavailable levels)
- **THEN** `showModal` and `hidePopover` were never called, the seed-source and generator call counts equal the counts read now, every cell keeps its text and class list, both messages keep their text, and `aria-checked="true"` is on «Поле 4×4» only in the size control and on «Розминка» only in the level control
- **AND** the sheet's stub state is still open and the summary still reads `4×4 · Розминка`

#### Scenario: The buttons are available again at 6x6 and 8x8

- **GIVEN** the sheet opened with a marked size of 4×4 (reached by a press on «Поле 4×4» on a 6×6 board without entries)
- **WHEN** the player presses «Поле 6×6», and later «Поле 8×8» (marking presses)
- **THEN** after each press no level button has `aria-disabled`, «Розминка» has `aria-checked="true"` (the earlier marked level is not restored), and `[data-level-reason]` has the `hidden` attribute

#### Scenario: A failed change to 4x4 keeps the available levels

- **GIVEN** a 6×6 fixture board at level «Головоломка» with player entries, and an injected `generate` that throws an ordinary error for size 4
- **WHEN** the player chooses «Поле 4×4» (marks it and presses «Почати») and then presses `[data-confirm="yes"]`
- **THEN** the board is still 6×6, the sheet is closed, and when it is opened again `aria-checked="true"` is on «Головоломка» only, no level button has `aria-disabled`, `[data-level-reason]` is hidden, and the summary reads `6×6 · Головоломка`

### Requirement: Size and level interplay

The page SHALL keep the level when the player presses «Нова головоломка» or «Скинути» (FR-92, FR-42, FR-58): both keep the size and the level of the board shown and never read the marked choice. In the sheet the size and the level can be marked in either order and in any number of presses: marking 6×6 or 8×8 keeps the marked level, and marking 4×4 sets the marked level to 1 (FR-91, FR-100); the page does not restore the earlier level. **One press of «Почати» makes one new puzzle with both** (FR-101): one generation attempt (a retry only after a run-out, FR-88), one call `generate(size, seed, level)` with the marked pair, and, when the board has player entries, one confirmation that covers both (FR-67). After a performed size choice of 4 «Розминка» is shown and the summary reads `4×4 · Розминка`, and a later choice of 6 or 8 keeps level 1. A level choice from 2 to 4 at 6×6 does not change the size. A choice that is cancelled or whose generation fails changes neither the size nor the level.

Traces: FR-92, FR-44, FR-100, FR-101

#### Scenario: «Нова головоломка» keeps the level

- **GIVEN** a 6×6 board at the level «Головоломка» with no player entries, a counting seed source and a `generate` spy recording `(size, seed, level)`
- **WHEN** the player presses «Нова головоломка»
- **THEN** the spy's last call is `(6, seed, 3)` with the seed just taken, and `aria-checked="true"` is on «Головоломка» only

#### Scenario: A size change to 6 or 8 keeps the level

- **GIVEN** the page shows a 6×6 board at the level «Мозколамка» with no player entries, and a `generate` spy recording `(size, seed, level)`
- **WHEN** the player chooses «Поле 8×8», and then «Поле 6×6»
- **THEN** the spy's calls after the mount are `(8, seed, 4)` and `(6, seed, 4)`, after each choice `aria-checked="true"` is on «Мозколамка» only, and the summary reads `8×8 · Мозколамка` and then `6×6 · Мозколамка`

#### Scenario: A size change to 4 sets the level to 1 in one puzzle

- **GIVEN** a 6×6 board at the level «Головоломка» with no player entries, a counting seed source and a `generate` spy recording `(size, seed, level)`, the counts read now
- **WHEN** the player chooses «Поле 4×4»
- **THEN** the seed source was called once more and the spy recorded exactly one more call, `(4, seed, 1)`
- **AND** `aria-checked="true"` is on «Поле 4×4» only in the size control and on «Розминка» only in the level control, «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`, and the summary reads `4×4 · Розминка`

#### Scenario: One confirmation covers a size change to 4 and the level reset

- **GIVEN** a 6×6 board at the level «Задачка» with player entries, and the `showModal` spy
- **WHEN** the player chooses «Поле 4×4», the test reads the controls, and then presses `[data-confirm="yes"]`
- **THEN** `showModal` was called exactly once in all, and before the confirmation `aria-checked="true"` is on «Поле 6×6» and on «Задачка» only and no level button has `aria-disabled`
- **AND** after the confirmation the board is 4×4 with `aria-checked="true"` on «Поле 4×4» only in the size control and on «Розминка» only in the level control, exactly one seed was taken and exactly one generator call was made for the change

#### Scenario: Cancelling the size change keeps the level

- **GIVEN** the page of the previous scenario with the dialog open
- **WHEN** the player presses `[data-confirm="no"]`
- **THEN** `aria-checked="true"` is on «Поле 6×6» and on «Задачка» only, no level button has `aria-disabled`, the summary reads `6×6 · Задачка`, and no seed was taken and no generator call was made for the change

#### Scenario: Going back from 4x4 keeps level 1

- **GIVEN** a 6×6 board at the level «Мозколамка» without entries, from which the player chose «Поле 4×4» (at once)
- **WHEN** the player chooses «Поле 6×6»
- **THEN** the board is 6×6 and `aria-checked="true"` is on «Розминка» only, and the last generator call carried level 1

#### Scenario: A level change from 2 to 4 does not change the size

- **GIVEN** a 6×6 board at the level «Задачка» without entries
- **WHEN** the player chooses «Мозколамка»
- **THEN** `[data-board]` has `data-size="6"`, `aria-checked="true"` is on «Поле 6×6» only in the size control and on «Мозколамка» only in the level control

#### Scenario: A size and a level marked together make one puzzle

- **GIVEN** a 6×6 board at «Розминка» without player entries, a counting seed source and a `generate` spy recording `(size, seed, level)`, the counts read now, and the sheet opened
- **WHEN** the player marks «Мозколамка», then «Поле 8×8», then «Поле 6×6», then «Поле 8×8» again (four marking presses), and then presses «Почати»
- **THEN** the seed source was called once more and the spy recorded exactly one more call, `(8, seed, 4)`, and the summary reads `8×8 · Мозколамка`

#### Scenario: One confirmation covers a size and a level marked together

- **GIVEN** a 6×6 board at «Розминка» with player entries, the `showModal` spy, and the sheet opened with «Поле 8×8» and «Головоломка» marked
- **WHEN** the player presses «Почати», the test reads the controls, and then presses `[data-confirm="yes"]`
- **THEN** `showModal` was called exactly once in all, and before the confirmation `aria-checked="true"` is on «Поле 6×6» and on «Розминка» only
- **AND** after the confirmation the board is 8×8, `aria-checked="true"` is on «Поле 8×8» and on «Головоломка» only after the sheet is opened again, and exactly one seed was taken and one generator call `(8, seed, 3)` was made for the change

#### Scenario: Marking 4×4 and then 6×6 keeps «Розминка» and marks no board

- **GIVEN** a 6×6 board at «Мозколамка» without entries, a counting seed source and the sheet opened
- **WHEN** the player marks «Поле 4×4» and then «Поле 6×6» (two marking presses)
- **THEN** `aria-checked="true"` is on «Поле 6×6» only and on «Розминка» only, and no seed was taken

### Requirement: A level change follows the confirmation rule

A press of «Почати» SHALL ask for confirmation under the confirmation rule when the board has player entries, and act at once otherwise, whatever the marked choice (FR-90, FR-67, FR-101); marking a level asks for nothing. When it asks, the sheet is closed first (FR-98). Until «Так, почати», and after «Скасувати» or Escape, the level, the size, the board, every message, the highlights, `cell-hinted` and the summary stay unchanged and no seed is taken and the generator is not called. «Так, почати» closes the dialog and then performs the pending action (the size and the level marked at the press of «Почати») exactly as on an untouched board. The pending action is dropped when the dialog is cancelled and is never performed later. The name of this requirement is kept from the earlier model, in which a level press asked; the rule above replaces it.

Traces: FR-90, FR-88, FR-98, FR-101, FR-100

#### Scenario: A level change on an untouched board opens no dialog

- **GIVEN** a 6×6 fixture board with no player entries, `showModal` stubbed, a counting seed source and a `generate` spy
- **WHEN** the player chooses «Мозколамка»
- **THEN** `showModal` was never called and one seed was taken and one generator call made, with level 4

#### Scenario: A level press alone asks nothing

- **GIVEN** a 6×6 fixture board with player entries and the `showModal` spy, and the sheet opened
- **WHEN** the player presses «Задачка» (a marking press)
- **THEN** `showModal` was never called, and `aria-checked="true"` is on «Задачка» only until the sheet closes

#### Scenario: A level change on a board with entries asks and changes nothing yet

- **GIVEN** a 6×6 fixture board where the player clicked one non-given cell, pressed «Підказка» (a hint filled another cell) and so has a hint sentence, `cell-hinted` and some `cell-violation` cells, with the seed-source and generator counts read now
- **WHEN** the player chooses «Задачка»
- **THEN** `showModal` was called once and the dialog has the `open` attribute, the sheet is closed, and every cell keeps its text, `[data-board]` keeps `data-size="6"`, `aria-checked="true"` stays on «Розминка» and on «Поле 6×6», `[data-message="hint"]` and `[data-message="win"]` keep their text, the `cell-violation` set, the `cell-hinted` cell and the summary are unchanged
- **AND** the seed-source and generator call counts equal the counts read before the press

#### Scenario: «Скасувати» and Escape drop the pending level

- **GIVEN** the page of the previous scenario with the dialog open
- **WHEN** the player presses `[data-confirm="no"]`, and, in a separate run, the test dispatches a `cancel` event and then a `close` event on the dialog
- **THEN** in both runs the dialog is closed, the level control still shows «Розминка» (the pending action is dropped), the board, the messages, the highlights and `cell-hinted` are unchanged, and no seed was taken and no generator call was made
- **AND** choosing «Задачка» again opens the dialog a second time and `[data-confirm="yes"]` then performs exactly one level change (one seed taken)

#### Scenario: «Так, почати» performs the level change after the dialog closed

- **GIVEN** the page of the scenario «A level change on a board with entries asks and changes nothing yet» with the dialog open
- **WHEN** the player presses `[data-confirm="yes"]`
- **THEN** the `close` spy was called once and the dialog has no `open` attribute
- **AND** the board has no player entries, `aria-checked="true"` is on «Задачка» only, exactly one seed was taken and one generator call made (level 2), and the summary reads `6×6 · Задачка`

### Requirement: Page retry on a run-out

When the generator reports a run-out (the engine's distinct `GenerationRunOutError`, FR-84), the page SHALL retry with the next seed from the same seed source, with the same size and level, at most 3 seeds in total for one «Почати», «Нова головоломка» or mount, and SHALL show the first success (FR-88, A-38). The retry applies to the mount, «Почати» and «Нова головоломка». Only the run-out error is retried: any other error (an ordinary `Error`, an invalid-argument error) and a result that is not n×n keep the previous board at once with no retry (A-38). If all 3 attempts run out, the previous board, messages, highlights, `cell-hinted`, size, level and summary stay (at the mount no board is shown), no error text appears, no error is thrown to the page and the sheet is closed where the action came from it (the press of «Почати» closed it, FR-101). A confirmation is asked once per action, not once per attempt. Each attempt takes one seed from the seed source (one seed per generation attempt, «Seed is chosen outside the engine…»); so the rule that a change takes one seed holds only when the first seed succeeds. A marking press, a cancelled confirmation and an unavailable-level press take no seed; «Почати» is never a no-op (FR-101). The CLI keeps its run-out error (FR-86) and is not part of this requirement.

Traces: FR-88, FR-101

#### Scenario: Success on the first seed takes one seed

- **GIVEN** a counting seed source returning 1, 2, 3 and so on, and an injected `generate` that succeeds
- **WHEN** the page is mounted and the player chooses «Задачка» on the untouched board
- **THEN** the seed source was called twice in all and the generator was called twice, with the seeds 1 and 2

#### Scenario: Success on the second seed

- **GIVEN** a counting seed source returning 1, 2, 3 and so on, and an injected `generate` that throws the run-out error for seed 2 and succeeds for every other seed
- **WHEN** the page is mounted and the player chooses «Задачка» on the untouched board
- **THEN** the generator was called with `(6, 2, 2)` and then `(6, 3, 2)`, the seed source was called three times in all, and the board shown comes from the call with seed 3
- **AND** `aria-checked="true"` is on «Задачка» only and the summary reads `6×6 · Задачка`

#### Scenario: Success on the third seed

- **GIVEN** a counting seed source returning 1, 2, 3 and so on, and an injected `generate` that throws the run-out error for the first two seeds taken after the mount and succeeds afterwards
- **WHEN** the player chooses «Мозколамка» on the untouched board
- **THEN** the generator was called three times for the change, with the seeds 2, 3 and 4 and the same size and level 4, and the board shown comes from seed 4

#### Scenario: Three run-outs keep everything

- **GIVEN** a 6×6 board with player entries, a hint sentence shown and a hinted cell, a counting seed source, a `window` `error` listener, and an injected `generate` that throws the run-out error for every call after the mount
- **WHEN** the player chooses «Головоломка» and presses `[data-confirm="yes"]`
- **THEN** exactly three seeds were taken and exactly three generator calls were made for the change, and no fourth
- **AND** the board, the messages, `cell-hinted`, `aria-checked` of both groups and the summary are unchanged, the sheet and the dialog are closed, no text was added to the page, and the `error` listener recorded nothing

#### Scenario: A confirmation is asked once for a retried change

- **GIVEN** a 6×6 board with player entries, an injected `generate` that throws the run-out error once and then succeeds, and the `showModal` spy
- **WHEN** the player chooses «Задачка» and presses `[data-confirm="yes"]`
- **THEN** `showModal` was called once in all, two seeds were taken for the change, and the board shown is the new one

#### Scenario: An ordinary error is not retried

- **GIVEN** a 6×6 board and an injected `generate` that throws an ordinary `Error` for level 2, with a counting seed source
- **WHEN** the player chooses «Задачка»
- **THEN** exactly one seed was taken and one generator call made for the change, and the board is unchanged

#### Scenario: A result of the wrong size is not retried

- **GIVEN** a 6×6 board and an injected `generate` that returns a 4×4 puzzle for level 2, with a counting seed source
- **WHEN** the player chooses «Задачка»
- **THEN** exactly one seed was taken and one generator call made for the change, and the board is unchanged

#### Scenario: The retry covers the size change, «Нова головоломка» and the mount

- **GIVEN** an injected `generate` that throws the run-out error for its first call in each of the three runs below, and a counting seed source
- **WHEN** in separate runs the page is mounted, the player chooses «Поле 8×8» on an untouched board, and the player presses «Нова головоломка» on an untouched board
- **THEN** in each run a board is shown (a 6×6 board at the mount, an 8×8 board after the size change, a new 6×6 board after the button) and two seeds were taken for that action

#### Scenario: Three run-outs at the mount show no board

- **GIVEN** an injected `generate` that throws the run-out error on every call, and a counting seed source
- **WHEN** the page is mounted
- **THEN** exactly three seeds were taken, no `[data-cell]` exists, no error is thrown, and the summary reads `6×6 · Розминка`

### Requirement: Ukrainian texts of the summary, the setup sheet, the level control and the techniques section

Every text that the summary button, the setup sheet, the level control and the techniques section of the rules panel show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5, FR-94). This covers the summary's visible text and its accessible name, the visually hidden prefix, the sheet's `aria-label` «Поле і складність», the start button «Почати», the close button «Закрити», the group name «Складність», the four level names and four descriptions of «Level option content», the 4×4 reason of «Only the first level exists at 4x4», the techniques heading «Складніші прийоми», the three techniques items of «Rules panel» and any `aria-label`, `title`, `alt` or `label` attribute among them. «×», «·», «▾» and digits are not Latin letters. The 4×4 reason and the techniques items are each exactly one sentence (NFR-4, by analogy; the signed NFR-4 covers hint sentences only). By the user's code-organisation decision of 2026-10-05 these texts (the summary format parts, the visually hidden prefix, the sheet's label, the start label, the close label, the group name, the four names, the four descriptions, the 4×4 reason, the techniques heading and its three items) are kept in `src/ui/strings.ts`, and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it.

Traces: NFR-5, NFR-4, FR-94, FR-95, FR-96, FR-87, FR-89, FR-91, FR-93, FR-101

#### Scenario: The new texts are Ukrainian

- **GIVEN** the page has just been mounted at 6×6, and the same page after «Поле 4×4»
- **WHEN** the test collects the text nodes of the summary button (without `aria-hidden` descendants), of the sheet and of the techniques section, the `aria-label` of the sheet and of the level control, and every `title`, `alt` and `label` attribute inside them
- **THEN** the collection contains `Поле і складність: `, `6×6 · Розминка`, «Поле і складність», «Почати», «Закрити», «Складність», the four level names, the four descriptions, `Для поля 4×4 є лише рівень «Розминка».`, «Складніші прийоми» and the three techniques items of «Rules panel»
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The techniques items and the reason are one sentence each

- **GIVEN** the three techniques items of «Rules panel» and the 4×4 reason
- **WHEN** the test applies `/^[^.!?…]+\.$/` to each
- **THEN** every text matches it

#### Scenario: The strings live in the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads `src/ui/strings.ts` and every other `.ts` or `.css` file under `src/ui/` and `src/main.ts`
- **THEN** `src/ui/strings.ts` contains the visually hidden prefix, the sheet's label, the start label «Почати», the close label, the group name «Складність», the four level names, the four descriptions, the 4×4 reason, the techniques heading and the three techniques items
- **AND** no other file contains a character matching `/\p{Script=Cyrillic}/u`
