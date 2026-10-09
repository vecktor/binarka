## ADDED Requirements

### Requirement: Level selector

The page SHALL offer a level control `[data-control="level"]` right after the size control (FR-44, FR-87): an element with `role="radiogroup"` and the accessible name «Складність» (`aria-label`, no visible label, as FR-62), holding exactly four `<button type="button" role="radio">` elements labelled «Розминка», «Задачка», «Головоломка» and «Мозколамка» (levels 1, 2, 3 and 4, in this order). The button of the level shown SHALL have `aria-checked="true"` and the other three `aria-checked="false"`; «Розминка» is selected when the page is mounted (FR-88). A level button SHALL be labelled by its own visible text and SHALL NOT carry `aria-label` or `aria-labelledby`; no text of the page shows «Складність», and the page has no `label` element for the control. A level button SHALL NOT have the `disabled` attribute or a `tabindex` attribute, so Tab reaches it; it is operated by a click (the native activation of Enter and Space), and arrow keys are not required and not handled (A-24, FR-59). The page reads a level only from the four buttons, never from a free value.

One press of an available button of another level SHALL start a new puzzle of the size shown and of the pressed level, from a new seed taken from the seed source (one seed per generation attempt); the page SHALL call the generator as `generate(size, seed, level)`, the three-argument form of the engine generator (FR-13, FR-81). The page SHALL render the new board and SHALL clear the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker. When the board has player entries the page SHALL first ask for confirmation and start the new puzzle only after «Так, почати» (FR-90, FR-67, see «A level change follows the confirmation rule»). A level change SHALL NOT change the size: the size control keeps `aria-checked` on the size of the board shown. A performed level change SHALL leave DOM focus on the button that was pressed (FR-59: showing a board never moves the focus). If the generator throws (a run-out of its attempts included, FR-84), or the returned `puzzle.givens` is not n rows of n cells, the page SHALL treat it as a generator failure and keep the previous board, messages, highlights, `cell-hinted`, size and level, with `aria-checked` and the description line unchanged, no automatic retry with another seed (A-38) and no uncaught error; the page shows no error text of its own for it. The page MUST NOT remember the level: a reload or a new mount starts at «Розминка» (TC-12, FR-88). Pressing the button of the level already shown is specified by «Pressing the shown size changes nothing» (FR-73). Whether the pressed level exists at the size shown is specified by «Only the first level exists at 4x4». Layout of the control, wrapping of its four buttons on a 320 px phone and its 44 px targets are not claimed here: they are covered by the held NFR-10, NFR-12 and NFR-14, see `docs/requirements-held.md`.

Traces: FR-44, FR-87, FR-88, FR-13, FR-81, FR-84, FR-59, FR-62, NFR-9, NFR-5

#### Scenario: Level control structure and default

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="level"]`
- **THEN** it has `role="radiogroup"` and `aria-label` equal to «Складність», no `aria-labelledby`, and it contains exactly four `button` elements, each with `type="button"` and `role="radio"`, whose texts are «Розминка», «Задачка», «Головоломка» and «Мозколамка», in this order
- **AND** the first button has `aria-checked="true"` and the other three have `aria-checked="false"`
- **AND** no level button has `aria-label`, `aria-labelledby`, `disabled` or `tabindex`

#### Scenario: The level group has a name and no visible label

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the root
- **THEN** no text node of the root has the trimmed text «Складність», the root contains no `label` element and no `for` attribute
- **AND** `[data-control="level"]` follows `[data-control="size"]` and precedes `[data-board]` in document order

#### Scenario: Level buttons are native buttons in the tab order

- **GIVEN** the page has just been mounted at 6×6
- **WHEN** the test reads the four level buttons and the document order of the buttons and cells
- **THEN** each level button is a `button` element with no `disabled` attribute and no `tabindex` attribute
- **AND** the last size button precedes the first level button, and the last level button precedes the cell with `data-row="1"` and `data-col="1"`

#### Scenario: Choose a level on a board without entries

- **GIVEN** the default 6×6 board with no player entries, a counting seed source returning 1, 2 and so on, a `generate` spy recording `(size, seed, level)`, and `showModal` stubbed as in the DOM contract
- **WHEN** the player presses the button «Задачка»
- **THEN** `showModal` was never called, one more seed was taken (the second) and the spy's last call is `(6, 2, 2)`
- **AND** `aria-checked="true"` is on «Задачка» only, `[data-control="size"]` still has `aria-checked="true"` on «Поле 6×6» only, and `[data-board]` has `data-size="6"` and 36 cells

#### Scenario: The level reaches the generator at 8x8

- **GIVEN** the page shows an 8×8 board reached by pressing «Поле 8×8» on an untouched 6×6 board, and a `generate` spy recording `(size, seed, level)`
- **WHEN** the player presses «Мозколамка»
- **THEN** the spy's last call is `(8, seed, 4)` with the seed just taken, `[data-board]` has `data-size="8"` and 64 cells, and `aria-checked="true"` is on «Мозколамка» only

#### Scenario: Board content comes from the generator at the chosen level

- **GIVEN** a mounted page with the real engine generator and a seed source returning 1 and then 5
- **WHEN** the player presses «Задачка»
- **THEN** for every cell, `data-given="true"` holds exactly where the generator returns a given for size 6, seed 5 and level 2, and each given cell shows the digit the generator returns for it

#### Scenario: A level change after play asks first, then replaces the board

- **GIVEN** a 6×6 fixture board with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted`, some cells with `cell-violation`, and an injected `generate` that returns a 6×6 fixture puzzle for level 3
- **WHEN** the player presses «Головоломка», and then presses `[data-confirm="yes"]`
- **THEN** after the first press the dialog is open and the board, the messages and `cell-hinted` are unchanged, and `aria-checked="true"` is still on «Розминка» only
- **AND** after the confirmation `aria-checked="true"` is on «Головоломка» only, the board has no player entries, `[data-message="hint"]` and `[data-message="win"]` have empty text content, no cell has `cell-hinted`, and the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: A level change after a win asks first

- **GIVEN** a 6×6 fixture board on which the win message is shown
- **WHEN** the player presses «Задачка» and then `[data-confirm="yes"]` (a solved board has entries, A-29)
- **THEN** `[data-message="win"]` has empty text content and `aria-checked="true"` is on «Задачка» only

#### Scenario: The size is untouched by a level change

- **GIVEN** a page showing 8×8 with the level «Розминка», a board without entries
- **WHEN** the player presses «Задачка», then «Мозколамка», then «Задачка» (each at once)
- **THEN** each time `[data-board]` has `data-size="8"`, `aria-checked="true"` is on «Поле 8×8» only in the size control, and the level control shows the pressed level

#### Scenario: Focus stays on the pressed level button

- **GIVEN** a mounted page on a board without entries, and the test has given DOM focus to the button «Задачка»
- **WHEN** the player presses it
- **THEN** after the press `document.activeElement` is that button

#### Scenario: A generator error keeps the previous board

- **GIVEN** a 6×6 fixture board with player entries, a hint sentence shown and a hint-filled cell, a counting seed source, a `window` `error` listener, and an injected `generate` that throws for level 3
- **WHEN** the player presses «Головоломка» and then `[data-confirm="yes"]`
- **THEN** the `error` listener recorded nothing, `[data-board]` keeps `data-size="6"` with the same cell texts and highlights, both message regions keep their text, and the hint-filled cell keeps `cell-hinted`
- **AND** `aria-checked="true"` is on «Розминка» only, the description line is unchanged, and the dialog is closed
- **AND** the seed source was called exactly once for the failed change (one seed per generation attempt) and no second generator call was made

#### Scenario: A generator result of the wrong size keeps the previous board

- **GIVEN** a 6×6 fixture board with player entries and a hint sentence shown, and an injected `generate` that returns a 4×4 fixture puzzle for level 2
- **WHEN** the player presses «Задачка» and then `[data-confirm="yes"]`
- **THEN** `[data-board]` keeps `data-size="6"` with 36 cells and the same cell texts, both message regions keep their text, and `aria-checked="true"` is on «Розминка» only

#### Scenario: The level is not remembered

- **GIVEN** a page on which the player pressed «Головоломка», and `localStorage` and `sessionStorage` empty before the test
- **WHEN** the page is mounted again on a new root
- **THEN** the new page's level control has `aria-checked="true"` on «Розминка» only and its first generator call carried level 1
- **AND** `localStorage` and `sessionStorage` still hold no entry

#### Scenario: The level control adds no id and no role="status"

- **GIVEN** a mounted page
- **WHEN** the test reads the ids and the `role="status"` elements of the root, after a level change as well
- **THEN** exactly three descendants of the root have an `id` (the rules panel, its heading and the confirmation text), none of them in the level control or the description line, and exactly two elements have `role="status"`

### Requirement: Level description line

The page SHALL show under the level control a description line `[data-level-description]` (FR-89): one Ukrainian line for the level shown, plain text with no `role`, no `id` and no `tabindex`, and not linked to the control by `aria-describedby` (A-39). The line follows the level shown, not a pending press: while a confirmation is open and after «Скасувати» it still shows the line of the level shown. The text of the line is given by this table (wording provisional until the user confirms it in chat during the slice, Q6; a confirmed change edits this table, `src/ui/strings.ts` and the tests together). It is one sentence (NFR-4): exactly one terminal mark at the end and no other sentence break. At 4×4 the line shows the reason of «Only the first level exists at 4x4» instead. The element type of the line is not claimed.

| Level | Text of `[data-level-description]` |
|-------|------------------------------------|
| 1 | `Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр у рядку.` |
| 2 | `Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць.` |
| 3 | `Додатково треба порівнювати рядки між собою і стовпці між собою: однакових не буває.` |
| 4 | `Додатково треба пробувати хід наперед: якщо за кілька кроків правило порушиться, тут інша цифра.` |

Traces: FR-89, FR-88, FR-94, NFR-4, NFR-5

#### Scenario: The line at mount

- **GIVEN** the page has just been mounted at 6×6
- **WHEN** the test reads `[data-level-description]`
- **THEN** exactly one such element exists in the root, its text content equals the text of level 1 in the table, and it has no `role`, `id`, `tabindex` or `aria-live` attribute
- **AND** no element of the root has an `aria-describedby` attribute naming it

#### Scenario: The line follows each level

- **GIVEN** a mounted 6×6 page with a board without entries
- **WHEN** the player presses «Задачка», «Головоломка», «Мозколамка» and «Розминка» in turn
- **THEN** after each press the text content of `[data-level-description]` equals the text of the pressed level in the table

#### Scenario: The line does not follow a pending press

- **GIVEN** a 6×6 board with player entries and the level «Розминка»
- **WHEN** the player presses «Задачка», the test reads the line, and then presses `[data-confirm="no"]` and reads it again, then presses «Задачка» and `[data-confirm="yes"]` and reads it
- **THEN** the first two readings equal the text of level 1 and the third equals the text of level 2

#### Scenario: Every line is one Ukrainian sentence

- **GIVEN** the four texts of the table
- **WHEN** the test applies `/^[^.!?…]+\.$/` and the Cyrillic and Latin checks to each
- **THEN** every text matches the pattern, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/`

#### Scenario: The line is not a status region and other actions leave it alone

- **GIVEN** a mounted 6×6 page at level 3
- **WHEN** the player presses «Підказка», reaches a win, clicks a cell, presses «Нова головоломка» (confirmed) and «Скинути» (confirmed)
- **THEN** after each step the text of `[data-level-description]` is still the text of level 3, and the root holds exactly two elements with `role="status"`

### Requirement: Only the first level exists at 4x4

The page SHALL, while the board shown is 4×4, keep the level control visible with «Розминка» selected and SHALL give the buttons «Задачка», «Головоломка» and «Мозколамка» `aria-checked="false"` and `aria-disabled="true"` (FR-91, FR-44, A-34): they are focusable and readable like the given cells (FR-69), so they have no `disabled` attribute and no `tabindex`. «Розминка» has no `aria-disabled` attribute. Pressing an unavailable level button SHALL be a no-op: no dialog, no new puzzle, no seed taken, no generator call, and the board, both messages, the highlights, `aria-checked` of both groups, the description line and `cell-hinted` unchanged (FR-73). While the board shown is 4×4 the description line `[data-level-description]` SHALL show the reason `Для поля 4×4 є лише рівень «Розминка».` (the guillemets inside the code span are part of the text; wording provisional until the user confirms it in chat during the slice, Q6; one sentence, NFR-4) instead of the line of the level. As soon as a 6×6 or 8×8 board is shown, the three buttons lose `aria-disabled` and the line shows the line of the level shown. `aria-disabled` is set only on the buttons of levels the shown size does not offer: at 6×6 and 8×8 no level button carries it. After a size change whose generation fails the previous board stays and so does the state of the buttons that belonged to it.

Traces: FR-91, FR-44, FR-73, FR-89, NFR-9, NFR-5

#### Scenario: The 4x4 state of the level control

- **GIVEN** a 6×6 board without entries and an injected `generate` that returns a 4×4 fixture puzzle for size 4
- **WHEN** the player presses «Поле 4×4»
- **THEN** `[data-control="level"]` is still present and visible in the DOM (no `hidden` attribute on it or on a level button), and «Розминка» has `aria-checked="true"` and no `aria-disabled`
- **AND** «Задачка», «Головоломка» and «Мозколамка» each have `aria-checked="false"` and `aria-disabled="true"`, and none of the four has the `disabled` attribute or a `tabindex`
- **AND** the text of `[data-level-description]` equals `Для поля 4×4 є лише рівень «Розминка».`

#### Scenario: An unavailable level is focusable

- **GIVEN** the page shows a 4×4 board
- **WHEN** the test gives DOM focus to «Мозколамка»
- **THEN** `document.activeElement` is that button

#### Scenario: Pressing an unavailable level changes nothing

- **GIVEN** a page showing a 4×4 board with player entries, a hint sentence shown, a hint-filled cell and some cells with `cell-violation`, with a counting seed source, a `generate` spy and the `showModal` spy, the counts read now
- **WHEN** the player presses «Задачка», then «Головоломка», then «Мозколамка»
- **THEN** `showModal` was never called, the seed-source and generator call counts equal the counts read now, every cell keeps its text and class list, both messages keep their text, and `aria-checked="true"` is on «Поле 4×4» only in the size control and on «Розминка» only in the level control
- **AND** the description line still shows the 4×4 reason

#### Scenario: The buttons are available again at 6x6 and 8x8

- **GIVEN** the page shows a 4×4 board reached from a 6×6 board without entries
- **WHEN** the player presses «Поле 6×6», and later «Поле 8×8» (each at once)
- **THEN** after each press no level button has `aria-disabled`, «Розминка» has `aria-checked="true"`, and the description line shows the text of level 1 in the table of «Level description line»

#### Scenario: No level button is disabled at 6x6 and 8x8

- **GIVEN** a page mounted at 6×6, and the same page after «Поле 8×8»
- **WHEN** the test reads the four level buttons at each size
- **THEN** none has `aria-disabled` or `disabled`

#### Scenario: A failed change to 4x4 keeps the available levels

- **GIVEN** a 6×6 fixture board at level «Головоломка» with player entries, and an injected `generate` that throws for size 4
- **WHEN** the player presses «Поле 4×4» and then `[data-confirm="yes"]`
- **THEN** the board is still 6×6, `aria-checked="true"` is on «Головоломка» only, no level button has `aria-disabled`, and the description line shows the text of level 3

### Requirement: Size and level interplay

The page SHALL keep the level when the player presses «Нова головоломка» or «Скинути» (FR-92, FR-42, FR-58), and when the player changes the size to 6 or 8 (the new puzzle has the size pressed and the level shown). A size change to 4 SHALL set the level to 1 in the same single new puzzle: one generation attempt, one seed, one call `generate(4, seed, 1)`, and, when the board has player entries, one confirmation that covers both (FR-67). After that change «Розминка» is selected, and a later change back to 6 or 8 keeps level 1 (the page does not restore the earlier level). A level change from 2 to 4 at 6×6 does not change the size. A change that is cancelled or whose generation fails changes neither the size nor the level.

Traces: FR-92, FR-42, FR-58, FR-67, FR-43, FR-44

#### Scenario: «Нова головоломка» keeps the level

- **GIVEN** a 6×6 board at the level «Головоломка» with no player entries, a counting seed source and a `generate` spy recording `(size, seed, level)`
- **WHEN** the player presses «Нова головоломка»
- **THEN** the spy's last call is `(6, seed, 3)` with the seed just taken, and `aria-checked="true"` is on «Головоломка» only

#### Scenario: A size change to 6 or 8 keeps the level

- **GIVEN** the page shows a 6×6 board at the level «Мозколамка» with no player entries, and a `generate` spy recording `(size, seed, level)`
- **WHEN** the player presses «Поле 8×8», and then «Поле 6×6»
- **THEN** the spy's calls after the mount are `(8, seed, 4)` and `(6, seed, 4)`, and after each press `aria-checked="true"` is on «Мозколамка» only

#### Scenario: A size change to 4 sets the level to 1 in one puzzle

- **GIVEN** a 6×6 board at the level «Головоломка» with no player entries, a counting seed source and a `generate` spy recording `(size, seed, level)`, the counts read now
- **WHEN** the player presses «Поле 4×4»
- **THEN** the seed source was called once more and the spy recorded exactly one more call, `(4, seed, 1)`
- **AND** `aria-checked="true"` is on «Поле 4×4» only in the size control and on «Розминка» only in the level control, and «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`

#### Scenario: One confirmation covers a size change to 4 and the level reset

- **GIVEN** a 6×6 board at the level «Задачка» with player entries, and the `showModal` spy
- **WHEN** the player presses «Поле 4×4», the test reads the controls, and then presses `[data-confirm="yes"]`
- **THEN** `showModal` was called exactly once in all, and before the confirmation `aria-checked="true"` is on «Поле 6×6» and on «Задачка» only and no level button has `aria-disabled`
- **AND** after the confirmation the board is 4×4 with `aria-checked="true"` on «Поле 4×4» only in the size control and on «Розминка» only in the level control, exactly one seed was taken and exactly one generator call was made for the change

#### Scenario: Cancelling the size change keeps the level

- **GIVEN** the page of the previous scenario with the dialog open
- **WHEN** the player presses `[data-confirm="no"]`
- **THEN** `aria-checked="true"` is on «Поле 6×6» and on «Задачка» only, no level button has `aria-disabled`, and no seed was taken and no generator call was made for the change

#### Scenario: Going back from 4x4 keeps level 1

- **GIVEN** a 6×6 board at the level «Мозколамка» without entries, from which the player pressed «Поле 4×4» (at once)
- **WHEN** the player presses «Поле 6×6»
- **THEN** the board is 6×6 and `aria-checked="true"` is on «Розминка» only, and the last generator call carried level 1

#### Scenario: A level change from 2 to 4 does not change the size

- **GIVEN** a 6×6 board at the level «Задачка» without entries
- **WHEN** the player presses «Мозколамка»
- **THEN** `[data-board]` has `data-size="6"`, `aria-checked="true"` is on «Поле 6×6» only in the size control and on «Мозколамка» only in the level control

### Requirement: A level change follows the confirmation rule

A press of an available level button of another level SHALL ask for confirmation under the confirmation rule when the board has player entries, and act at once otherwise (FR-90, FR-67). Until «Так, почати», and after «Скасувати» or Escape, the level, the size, the board, every message, the highlights and `cell-hinted` stay unchanged and no seed is taken and the generator is not called. «Так, почати» closes the dialog and then performs the level change exactly as on an untouched board. The pending level is dropped when the dialog is cancelled and is never performed later. A press of a level button while a confirmation for another action is pending is not possible, because the dialog is modal.

Traces: FR-90, FR-67, FR-88, FR-66

#### Scenario: A level change on an untouched board opens no dialog

- **GIVEN** a 6×6 fixture board with no player entries, `showModal` stubbed, a counting seed source and a `generate` spy
- **WHEN** the player presses «Мозколамка»
- **THEN** `showModal` was never called and one seed was taken and one generator call made, with level 4

#### Scenario: A level change on a board with entries asks and changes nothing yet

- **GIVEN** a 6×6 fixture board where the player clicked one non-given cell, pressed «Підказка» (a hint filled another cell) and so has a hint sentence, `cell-hinted` and some `cell-violation` cells, with the seed-source and generator counts read now
- **WHEN** the player presses «Задачка»
- **THEN** `showModal` was called once and the dialog has the `open` attribute, and every cell keeps its text, `[data-board]` keeps `data-size="6"`, `aria-checked="true"` stays on «Розминка» and on «Поле 6×6», `[data-message="hint"]` and `[data-message="win"]` keep their text, the `cell-violation` set and the `cell-hinted` cell are unchanged
- **AND** the seed-source and generator call counts equal the counts read before the press

#### Scenario: «Скасувати» and Escape drop the pending level

- **GIVEN** the page of the previous scenario with the dialog open
- **WHEN** the player presses `[data-confirm="no"]`, and, in a separate run, the test dispatches a `cancel` event and then a `close` event on the dialog
- **THEN** in both runs the dialog is closed, the level control still shows «Розминка», the description line still shows the text of level 1, the board, the messages, the highlights and `cell-hinted` are unchanged, and no seed was taken and no generator call was made
- **AND** pressing «Задачка» again opens the dialog a second time and `[data-confirm="yes"]` then performs exactly one level change (one seed taken)

#### Scenario: «Так, почати» performs the level change after the dialog closed

- **GIVEN** the page of the scenario «A level change on a board with entries asks and changes nothing yet» with the dialog open
- **WHEN** the player presses `[data-confirm="yes"]`
- **THEN** the `close` spy was called once and the dialog has no `open` attribute
- **AND** the board has no player entries, `aria-checked="true"` is on «Задачка» only, exactly one seed was taken and one generator call made (level 2), and the description line shows the text of level 2

### Requirement: The page hint uses all four techniques

The page SHALL ask the hint engine for the next move with the technique ceiling 4, that is `hint(board, 4)`, whatever the level shown (FR-77, Q2 of the difficulty amendment; the engine's own default ceiling is 1, the three basic rules, by the user's decision of autonomy-log row 88, so the page passes 4 explicitly): the hint on a board at level 1 may be a fill by line balance, unique lines or look-ahead, and the hint on the same board is the same at every level shown. The page SHALL fill the cell the engine targets and show the engine's sentence unchanged, as «Hint button fills one cell» and «Hint button shows the engine's sentence» require. The page SHALL NOT rephrase, shorten or choose among techniques itself. What counts as each technique, and its sentence, are owned by the puzzle-engine capability (FR-74 to FR-80) and are only displayed here.

Traces: FR-77, FR-39, FR-40

#### Scenario: A hint beyond the level's techniques is still given

- **GIVEN** a 6×6 fixture board `LINE_BALANCE_ONLY` shown at the level «Розминка», whose givens are chosen so that none of the pair, sandwich and count rules applies and the engine's hint (called as `hint(board, 4)` on the board as read from the DOM) is a fill by the technique of line balance (the suite asserts this premise by calling the engine and reading the technique and the target)
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell the engine targets shows the engine's value and has the class `cell-hinted`, and `[data-message="hint"]` shows the engine's sentence unchanged

#### Scenario: The same board gives the same hint at every level

- **GIVEN** the fixture `LINE_BALANCE_ONLY` mounted on four pages, shown at the levels «Розминка», «Задачка», «Головоломка» and «Мозколамка» (each reached by a level press with an injected `generate` that returns the fixture)
- **WHEN** the player presses `[data-action="hint"]` on each page
- **THEN** the four pages fill the same cell with the same value and show the same sentence, equal to the engine's hint on that board

### Requirement: Ukrainian texts of the level control, the description line and the techniques section

Every text that the level control, the description line and the techniques section of the rules panel show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5, FR-94). This covers the group name «Складність», the four level names, the four description lines of «Level description line», the 4×4 reason of «Only the first level exists at 4x4», the techniques heading «Складніші прийоми», the three techniques items of «Rules panel» and any `aria-label`, `title`, `alt` or `label` attribute among them. The description lines, the 4×4 reason and the techniques items are each exactly one sentence (NFR-4). By the user's code-organisation decision of 2026-10-05 these texts (the group name, the four names, the four description lines, the 4×4 reason, the techniques heading and its three items) are kept in `src/ui/strings.ts`, and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it.

Traces: NFR-5, NFR-4, FR-94, FR-87, FR-89, FR-91, FR-93

#### Scenario: The level texts are Ukrainian

- **GIVEN** the page has just been mounted at 6×6, and the same page after «Поле 4×4»
- **WHEN** the test collects the text nodes of the level control, the description line and the techniques section (without `aria-hidden` descendants), the `aria-label` of the level control, and every `title`, `alt` and `label` attribute inside them
- **THEN** the collection contains «Складність», «Розминка», «Задачка», «Головоломка», «Мозколамка», the text of level 1 of the description table, `Для поля 4×4 є лише рівень «Розминка».`, «Складніші прийоми» and the three techniques items of «Rules panel»
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The four description lines are collected too

- **GIVEN** the page at 6×6 on which the player presses «Задачка», «Головоломка» and «Мозколамка» in turn (each at once)
- **WHEN** the test reads the description line after each press
- **THEN** the three texts equal the texts of levels 2, 3 and 4 of the table, and each matches the Cyrillic check and not the Latin check

#### Scenario: The techniques items are one sentence each

- **GIVEN** the three techniques items of «Rules panel» and the 4×4 reason
- **WHEN** the test applies `/^[^.!?…]+\.$/` to each
- **THEN** every text matches it

#### Scenario: The strings live in the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads `src/ui/strings.ts` and every other `.ts` or `.css` file under `src/ui/` and `src/main.ts`
- **THEN** `src/ui/strings.ts` contains the group name «Складність», the four level names, the four description lines, the 4×4 reason, the techniques heading and the three techniques items
- **AND** no other file contains a character matching `/\p{Script=Cyrillic}/u`

### Requirement: The level buttons set their own colours

The level control SHALL carry the class `level-control` and the stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule `.level-control button`, in the rule `.level-control button[aria-checked='true']` and in the rule `.level-control button[aria-disabled='true']` (FR-65, NFR-9). For each of the three states, the declarations of the rule for the plain button, with those of the rule for the state laid over them, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens), and the unavailable state SHALL NOT be drawn with `opacity`. No new `--color-*` token and no colour literal is added (the 13 tokens of «Borders, cues and focus rings have enough contrast» stay exactly 13). The level buttons are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator of FR-65, and the rules of the level control obey the existing stylesheet scans (no `!important`, no `:has(` besides the idle-line rule, no `display: contents`, no removed outline). The `.size-control` rules are not changed by this requirement.

Traces: FR-65, NFR-9, FR-87, FR-91

#### Scenario: The level buttons declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.level-control button`, `.level-control button[aria-checked='true']` and `.level-control button[aria-disabled='true']`
- **THEN** each of the three rules exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`
- **AND** none of the three declares `opacity`

#### Scenario: Each state of a level button has 4.5:1 text

- **GIVEN** the resolved colours of the tokens and the three rules above
- **WHEN** the test lays the checked rule over the plain rule, and the aria-disabled rule over the plain rule, and computes the ratio of the text colour to the background colour for the plain, checked and unavailable states
- **THEN** each of the three ratios is at least 4.5

#### Scenario: The level control has the class and the buttons are buttons

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="level"]` and its four radio buttons
- **THEN** the control has the class `level-control`, and each of the four is a `button` element, so `button:focus-visible` applies to it

#### Scenario: The existing stylesheet scans still pass

- **GIVEN** the stylesheet with the level rules
- **WHEN** the existing scans of «Rules use the tokens and no colour literal is left», «Nothing removes the outline» and «The stylesheet stays inside the build target, with one `:has(` exception» run
- **THEN** each passes unchanged, and the 13 token names are still exactly the 13 of the baseline

## MODIFIED Requirements

### Requirement: New puzzle button

The page SHALL, when the «Нова головоломка» button is pressed on a board without player entries, replace the board at once with a puzzle generated for the currently shown size and the currently shown level from a new seed; when the board has player entries it SHALL first ask for confirmation (FR-67) and replace the board only after «Так, почати». Replacing the board SHALL clear the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker (FR-42, FR-66). The size control keeps its state: `aria-checked` stays on the size of the board shown. The level control keeps its state too: `aria-checked` stays on the level shown (FR-42, FR-92). The page MUST NOT require the new puzzle to differ from the old one.

Traces: FR-42, FR-43, FR-67, FR-66, FR-92

#### Scenario: New puzzle after play

- **GIVEN** a 6x6 board with player entries, a hint sentence shown and the win message shown, and the injected seed source returning 7 for the next call
- **WHEN** the player presses `[data-action="new"]`, and then `[data-confirm="yes"]`
- **THEN** the board has 36 cells matching what the page's generator returns for size 6 and seed 7 (with an injected `generate` that returns the fixture for the first call and the engine generator's output afterwards), with no player entries
- **AND** `[data-message="hint"]` and `[data-message="win"]` both have empty text content

#### Scenario: New puzzle on a board without entries acts at once

- **GIVEN** a 6x6 fixture board with no player entries, and a counting seed source
- **WHEN** the player presses `[data-action="new"]`
- **THEN** no dialog was opened (`showModal` never called) and one seed was taken for a new board

#### Scenario: New puzzle keeps the chosen size

- **GIVEN** the player has pressed «Поле 8×8», the board is 8×8, and a `generate` spy records `(size, seed)`
- **WHEN** the player presses the new puzzle button (the board has no entries, so at once)
- **THEN** the board has `data-size="8"` and 64 cells, `aria-checked="true"` is still on «Поле 8×8» only, and the spy's last call has size 8

#### Scenario: New puzzle keeps the chosen level

- **GIVEN** the player has pressed «Головоломка» on a 6×6 board without entries, and a `generate` spy records `(size, seed, level)`
- **WHEN** the player presses the new puzzle button (the board has no entries, so at once)
- **THEN** the spy's last call has size 6 and level 3, `aria-checked="true"` is still on «Головоломка» only, and `aria-checked="true"` is still on «Поле 6×6» only

#### Scenario: New puzzle mid-game removes highlights and the marker

- **GIVEN** a board with cells that have `cell-violation` because of the player's entries, and a hint-filled cell with `cell-hinted`
- **WHEN** the player presses the new puzzle button and then `[data-confirm="yes"]`
- **THEN** the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens, and no cell has `cell-hinted`

#### Scenario: Each press uses a new seed

- **GIVEN** an injected seed source returning 1, then 2, then 3
- **WHEN** the page is mounted and the new puzzle button is pressed twice (the boards have no entries)
- **THEN** the boards were generated from seeds 1, 2 and 3 in this order

### Requirement: Reset button

The page SHALL offer a button `[data-action="reset"]` labelled «Скинути» (NFR-5). When the board has player entries, pressing it SHALL first ask for confirmation (FR-67) and reset only after «Так, почати»; on an untouched board it SHALL act at once, with no dialog, and change no cell text, no class and no message (FR-58). Resetting SHALL set every non-given cell to empty, including cells filled by a hint, keep every given cell's text and `data-given` value, keep the current size (any of 4, 6 and 8) in `[data-board]`'s `data-size` and in the size control (`aria-checked` unchanged), keep the current level in the level control (`aria-checked` unchanged) and the description line unchanged (FR-58, FR-92), remove every `cell-violation` class that does not come from the givens themselves (the highlights are recomputed for the reset board), empty `[data-message="hint"]` and `[data-message="win"]`, remove `cell-hinted` (FR-66), and keep the board editable. Reset SHALL NOT call the seed source or the generator. It works after a win (the solved board has entries, so the confirmation is asked, A-29). Reset is size-independent: the scenarios that touch the board are run for each N in the table below, each with a fixture puzzle of size N. Undo and restoring a saved state are not part of reset (FR-47 and FR-46 are Future).

| N |
|---|
| 4 |
| 6 |
| 8 |

Traces: FR-58, FR-67, FR-66, FR-92, NFR-5

#### Scenario: Reset empties player cells and keeps givens and size

- **GIVEN** a mounted page with a fixture puzzle of size N, and the player has clicked several non-given cells and pressed the hint button once so that a hint filled a cell
- **WHEN** the player presses `[data-action="reset"]` and then `[data-confirm="yes"]`
- **THEN** every cell with `data-given="false"` shows empty text, and every cell with `data-given="true"` shows the same text and the same `data-given` value as before
- **AND** `[data-board]` has `data-size` equal to N, `aria-checked="true"` is still on the button of size N only, and no cell has `cell-hinted`

#### Scenario: Reset keeps the level

- **GIVEN** a mounted page with a fixture puzzle at the size and level of the row below, the level reached by a level press, and the player has made entries and pressed the hint button once so that a hint filled a cell

| Size | Level pressed before play |
|------|---------------------------|
| 4 | «Розминка» (the only level) |
| 6 | «Головоломка» |
| 8 | «Мозколамка» |

- **WHEN** the player presses `[data-action="reset"]` and then `[data-confirm="yes"]`
- **THEN** `aria-checked="true"` is still on the same level button only and on the same size button only, the description line has the same text as before the reset, and every non-given cell shows empty text
- **AND** no seed was taken and no generator call was made for the reset

#### Scenario: Reset clears highlights and the hint message

- **GIVEN** a mounted page with a fixture puzzle of size N where at least one cell has the class `cell-violation` because of the player's entries (the givens alone report no violation), and `[data-message="hint"]` shows a sentence
- **WHEN** the player presses `[data-action="reset"]` and then `[data-confirm="yes"]`
- **THEN** no cell has the class `cell-violation` and `[data-message="hint"]` has empty text content

#### Scenario: Reset after a win

- **GIVEN** a mounted page with a fixture puzzle of size N whose board the player has solved, so that `[data-message="win"]` shows the win text
- **WHEN** the player presses `[data-action="reset"]`, then `[data-confirm="yes"]`, and then clicks a non-given cell once
- **THEN** after the confirmation `[data-message="win"]` has empty text content
- **AND** after the click that cell shows «0»

#### Scenario: Reset takes no seed and calls no generator

- **GIVEN** a mounted page with a fixture puzzle of size N, an injected seed source and an injected generator that count their calls, with the counts read after mount
- **WHEN** the player presses `[data-action="reset"]` on the untouched board, then makes an entry and presses `[data-action="reset"]` and `[data-confirm="yes"]`, and then repeats the entry, the press and the confirmation once more
- **THEN** after each step the seed-source call count and the generator call count equal the counts read after mount

#### Scenario: Reset on an untouched board changes nothing and asks nothing

- **GIVEN** a mounted page with a fixture puzzle of size N and no player action, with the text and class list of every cell and the text of both message regions recorded
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** every cell has the same text and the same class list as recorded, and both message regions have the same text as recorded
- **AND** `showModal` was never called

### Requirement: Rules panel

The page header SHALL hold a button `[data-action="rules"]` labelled «Правила» whose `popovertarget` attribute names the `id` of the rules panel. The rules panel `[data-section="rules"]` SHALL be an element with the `popover` attribute, opened by that button with no script, and SHALL contain, in this order: the heading «Правила»; the rules list, a `ul` that is a direct child of the panel, with exactly three `li` items in this order: «Не більше двох однакових цифр поспіль у рядку чи стовпці.», «У кожному рядку та стовпці порівну нулів і одиниць.», «Усі рядки різні, і всі стовпці різні.»; the techniques section `[data-section="techniques"]` (FR-93); and one close button «Зрозуміло» with `popovertarget` naming the same `id` and `popovertargetaction="hide"` (FR-57). The techniques section SHALL hold a heading `h3` with the text «Складніші прийоми» and its own `ul` with exactly three `li` items, one sentence each, one for each of the techniques 2, 3 and 4 (FR-74 to FR-76), in this order (wording provisional until the user confirms it in chat during the slice, Q6; a confirmed change edits this table, `src/ui/strings.ts` and the tests together): the table below. The clause «exactly three list items» of FR-57 means the three items of the rules list; the techniques list is a separate list. The techniques items carry no decorative example and no `aria-hidden` descendant, and the techniques section has no `id`. A list item of the rules list MAY carry a decorative example drawn from digits and symbols inside an element with `aria-hidden="true"` (A-26, not pinned); the text of an item is its text content without the descendants that have `aria-hidden="true"`. The panel SHALL be created once at mount, sit inside the page root and outside the element that holds the board, need no new dependency, and stay the same element with the same texts after a new puzzle, a size change, a level change and a win. There SHALL be no rules block below the board and no `<details>` element anywhere on the page. Each mount SHALL give its panel an `id` that is unique in the document, so two mounts on two roots stay independent. The panel SHALL have `role="dialog"` and `aria-labelledby` naming the `id` of its heading «Правила» (also unique per mount), so assistive technology announces it as a named dialog, and the close button «Зрозуміло» SHALL carry the `autofocus` attribute, so that opening the popover moves focus into the panel (A-20). Where the panel is drawn (bottom sheet on phones, centred panel from 48rem) is layout and is not claimed here: it is covered by the held NFR-14 (or NFR-10 / NFR-15), see `docs/requirements-held.md`.

Traces: FR-57, FR-93, NFR-5

#### Scenario: Rules button in the header

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `header` element of the root
- **THEN** it contains exactly one `[data-action="rules"]`, a `button` whose text is «Правила»
- **AND** its `popovertarget` attribute is non-empty and equals the `id` of the one element `[data-section="rules"]` in the root

#### Scenario: Rules panel structure at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** exactly one such element exists inside the root, it has the `popover` attribute, and it is not inside `[data-board]` or inside the board host
- **AND** its headings, in document order, are an `h2` with the text «Правила» and an `h3` with the text «Складніші прийоми»
- **AND** its rules list (the `ul` that is a direct child of the panel) has exactly three `li` items whose texts, in order, are those of the first table
- **AND** its techniques section `[data-section="techniques"]` is inside the panel, follows the rules list, holds the `h3` and exactly one `ul` with exactly three `li` items whose texts, in order, are those of the second table, and no `aria-hidden` element and no `id`
- **AND** it contains exactly one `button`, with the text «Зрозуміло», `popovertarget` equal to the panel's `id` and `popovertargetaction="hide"`, and this button follows the techniques section

| Item | Text of the rules list |
|------|------------------------|
| 1 | Не більше двох однакових цифр поспіль у рядку чи стовпці. |
| 2 | У кожному рядку та стовпці порівну нулів і одиниць. |
| 3 | Усі рядки різні, і всі стовпці різні. |

| Item | Text of the techniques list (provisional, Q6) |
|------|-----------------------------------------------|
| 1 | `Баланс рядка: якщо в рядку є місце лише для одного нуля або однієї одиниці, а в клітинці вона дала б три однакові цифри поспіль, там стоїть інша цифра.` |
| 2 | `Однакові рядки: якщо рядок збігається з повним рядком усюди, крім двох клітинок, ці дві клітинки протилежні до нього.` |
| 3 | `Хід наперед: уявно поставте цифру; якщо за кілька кроків порушиться правило, у клітинці стоїть інша.` |

#### Scenario: The panel is a named dialog and takes focus when opened

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** it has `role="dialog"`, and its `aria-labelledby` names an `h2` inside the panel whose text is «Правила»
- **AND** the close button «Зрозуміло» has the `autofocus` attribute, and no other element of the root has it

#### Scenario: No rules block under the board and no details element

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the whole root
- **THEN** the root contains no `details` element
- **AND** every `li` element of the root is inside `[data-section="rules"]`, and the root contains exactly six `li` elements: three in the rules list and three in the techniques section

#### Scenario: The panel opens with no script

- **GIVEN** the page has just been mounted, and the methods `showPopover`, `hidePopover` and `togglePopover` are installed on `HTMLElement.prototype` as spies (jsdom has none of them)
- **WHEN** the test clicks `[data-action="rules"]` and then the close button «Зрозуміло»
- **THEN** no spy was called
- **AND** the panel keeps the same attributes and the same texts, and the board, the messages and every cell are unchanged

#### Scenario: Two mounts stay independent

- **GIVEN** the page is mounted on two different roots in the same document
- **WHEN** the test reads the `popovertarget` of each root's rules button
- **THEN** the two panels have different `id` values, and each button names the panel of its own root

#### Scenario: The panel survives every board change

- **GIVEN** a mounted page with a fixture puzzle, the panel element and its texts read at mount
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 (one run) and to 8 (one run) |
| changes the level to «Задачка» (one run) |
| reaches a win |

- **THEN** after each action there is exactly one `[data-section="rules"]`, it is the same element as at mount, it has the same two headings and the same six `li` texts (three in each list), and the rules button still names its `id`

### Requirement: Page document order

In document order the page root SHALL hold: a `header` (the title, a heading with the text «Бінарка», then the `[data-action="rules"]` button), the size control `[data-control="size"]`, the level control `[data-control="level"]`, the level description `[data-level-description]`, the board `[data-board]`, the buttons `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]` in this order, then the message area holding `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]` in this order (FR-68). The rules panel (FR-57) SHALL be outside this sequence and outside the board element. The message area SHALL always be present in the DOM, with all three message elements, also while a message is shown and after every board change. The reserved height of the message area is layout and is not claimed here: it is covered by the held NFR-14 (or NFR-10 / NFR-15), see `docs/requirements-held.md`. This requirement names the size control and the level control by their hooks `[data-control="size"]` and `[data-control="level"]` and the description by `[data-level-description]`, and does not depend on the element type of any of them.

Traces: FR-68, FR-87, FR-89

#### Scenario: Order at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test compares document positions of these elements with `compareDocumentPosition`: the `header`, `[data-control="size"]`, `[data-control="level"]`, `[data-level-description]`, `[data-board]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, `[data-message="idle"]`, `[data-message="hint"]`, `[data-message="win"]`
- **THEN** each element follows the previous one in this order
- **AND** the `header` contains a heading with the text «Бінарка» followed by the `[data-action="rules"]` button, and the heading precedes the button

#### Scenario: The message area holds the three messages

- **GIVEN** the page has just been mounted
- **WHEN** the test takes the parent element of `[data-message="idle"]`
- **THEN** that element contains exactly the three elements `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]`, in this order, and no other `[data-message]` element
- **AND** that element follows the three action buttons in document order

#### Scenario: The panel is outside the sequence

- **GIVEN** the page has just been mounted
- **WHEN** the test reads where `[data-section="rules"]` sits
- **THEN** it is not inside the `header`, not inside the message area, not inside `[data-board]`, and it follows the message area in document order

#### Scenario: The order and the message area survive every board change

- **GIVEN** a mounted page with a fixture puzzle
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page, with a hint pressed first so that the hint message has text

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 or to 8 (one run for each) |
| changes the level to «Задачка» (one run) |
| presses «Скинути» |
| reaches a win |

- **THEN** after each action the eleven elements of the first scenario still exist exactly once, in the same document order, and the three message elements are still in the same message area

### Requirement: Confirmation before discarding player entries

«Нова головоломка», a press of a size button of another size, a press of an available level button of another level and «Скинути» SHALL ask for confirmation only when the board has player entries (FR-67). A player entry is a non-given cell that is not empty; a cell filled by a hint counts as one (A-8); a board that was just solved has entries, so the confirmation is also asked after a win (A-29). The confirmation SHALL be a native `<dialog>` `[data-dialog="confirm"]`, created once at mount inside the page root, outside the board element and outside the sequence of «Page document order» (it follows the rules panel), closed at mount, and opened with `showModal()`. It SHALL hold the text «Почати заново? Ваші ходи на цьому полі буде втрачено.» and exactly two `<button type="button">`: `[data-confirm="yes"]` with the text «Так, почати» and `[data-confirm="no"]` with the text «Скасувати». «Так, почати» SHALL close the dialog (calling `close()`) and then perform the pending action exactly as it would on an untouched board. «Скасувати», and Escape (the dialog's `cancel` and `close` events with no button pressed), SHALL close the dialog and leave unchanged the board, the size and the level (`aria-checked`), the hint message, the win message, the highlights and `cell-hinted`; no seed is taken and the generator is not called. A cancelled action is dropped: it is never performed later. On a board with no player entries the action happens at once and `showModal()` is never called. Reading rule: wherever another requirement of this capability says that pressing «Нова головоломка», changing the size, changing the level or pressing «Скинути» has an effect (for example «Highlighting follows every board change», «Hint message stays until the next hint or a new puzzle» and the size steps of «Board rendering and default size»), the effect happens when the action is performed: at once on a board without player entries, after «Так, почати» on a board with entries; a requested but unperformed action has no effect. The dialog SHALL have `aria-labelledby` naming the `id` of the element that holds its text (unique per mount), so assistive technology announces the question (A-20). When the page opens the dialog it SHALL move focus to «Скасувати» (after `showModal()`), so that the safe choice is the default and two key presses cannot discard the player's moves (A-20; the user's decision of 2026-10-06, review round 1). Where the dialog is drawn and its focus ring are layout and are covered by the held NFR-13 and NFR-14, see `docs/requirements-held.md`.

Traces: FR-67, FR-42, FR-43, FR-58, FR-66, FR-90

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
| presses the button «Поле 4×4» | a 4x4 board from the next seed, `aria-checked="true"` on «Поле 4×4» |
| presses the button «Задачка» | a 6x6 board of level 2 from the next seed, `aria-checked="true"` on «Задачка» |
| presses «Скинути» | no cell, class or message changes |

- **THEN** the `showModal` spy was never called, the dialog has no `open` attribute, and the expected effect of the row happened

#### Scenario: A board with entries asks first and changes nothing yet

- **GIVEN** a mounted 6x6 fixture board on which the player has clicked one non-given cell to `1`, has pressed «Підказка» so that a hint filled another cell (`cell-hinted`) and a hint sentence is shown, with cells carrying `cell-violation`, and a counting seed source and a `generate` spy whose counts are read now
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| presses «Нова головоломка» |
| presses the button «Поле 8×8» (the injected generator returns an 8x8 fixture) |
| presses the button «Задачка» (the injected generator returns a 6x6 fixture) |
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
| «Задачка» | a 6x6 board generated from the next seed with level 2 (one seed taken, one generator call with level 2), `aria-checked="true"` on «Задачка» only, the description line shows the line of level 2 |
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

### Requirement: Pressing the shown size changes nothing

Pressing the size button of the size already shown SHALL be a no-op (FR-73): no dialog, no new puzzle, no seed taken, no generator call, and the board, both messages, the highlights, `aria-checked` and `cell-hinted` unchanged (FR-66). This holds on a board with player entries and on a board without. Pressing the level button already shown SHALL be a no-op with the same list of non-effects (FR-73): no dialog, no new puzzle, no seed taken, no generator call, and the board, both messages, the highlights, `aria-checked` of both groups, the description line and `cell-hinted` unchanged. Pressing a level button that is unavailable at the size shown (levels 2 to 4 at 4×4, FR-91) is a no-op with the same list. When no board is shown (the generation at mount failed), the no-op rule does not apply: «Поле 6×6» keeps `aria-checked="true"` from mount (see «Grid size selector»), and a press of any size button, «Поле 6×6» included, generates a board of that size and of the level shown at once (there are no entries to confirm); likewise a press of any available level button, «Розминка» included, generates a board of the size shown and of the pressed level at once.

Traces: FR-73, FR-66, FR-43, FR-88, FR-91

#### Scenario: The shown size is a no-op at every size

- **GIVEN** a mounted page showing a board of size N from the table below (reached by pressing the size button when N is not 6, with the injected generator returning a fixture of size N), on which the player has made entries, pressed «Підказка» (a hint sentence is shown, one cell has `cell-hinted`) and made some cells carry `cell-violation`, with a counting seed source and a `generate` spy and the `showModal` spy

| N | Button pressed |
|---|----------------|
| 4 | «Поле 4×4» |
| 6 | «Поле 6×6» |
| 8 | «Поле 8×8» |

- **WHEN** the player presses the button of the row (the size already shown), and again on a freshly mounted page of the same size with no player entries
- **THEN** `showModal` was never called, the seed-source and generator call counts are unchanged, every cell keeps its text and class list (including `cell-violation` and `cell-hinted`), both messages keep their text, and `aria-checked="true"` stays on that button only

#### Scenario: With no board shown, a size button generates

- **GIVEN** a page whose generation at mount threw, so no board is shown, and a generator that succeeds afterwards
- **WHEN** the player presses «Поле 6×6»
- **THEN** no dialog opens, one seed is taken and the generator is called once with size 6, and a 6×6 board is shown with `aria-checked="true"` on «Поле 6×6»

#### Scenario: The shown level is a no-op at every level

- **GIVEN** a mounted page showing the size and the level of the row below (reached by pressing the buttons, with the injected generator returning fixtures), on which the player has made entries, pressed «Підказка» (a hint sentence is shown, one cell has `cell-hinted`) and made some cells carry `cell-violation`, with a counting seed source, a `generate` spy and the `showModal` spy

| Size | Level button pressed |
|------|----------------------|
| 6 | «Розминка» |
| 6 | «Задачка» |
| 6 | «Головоломка» |
| 8 | «Мозколамка» |
| 4 | «Розминка» |

- **WHEN** the player presses the level button of the row (the level already shown), and again on a freshly prepared page of the same size and level with no player entries
- **THEN** `showModal` was never called, the seed-source and generator call counts are unchanged, every cell keeps its text and class list (including `cell-violation` and `cell-hinted`), both messages keep their text, the description line keeps its text, and `aria-checked="true"` stays on that level button only and on the size button of the row only

#### Scenario: With no board shown, a level button generates

- **GIVEN** a page whose generation at mount threw, so no board is shown, and a generator that succeeds afterwards
- **WHEN** the player presses «Задачка»
- **THEN** no dialog opens, one seed is taken and the generator is called once with size 6 and level 2, and a 6×6 board is shown with `aria-checked="true"` on «Задачка»

### Requirement: Grid size selector

The page SHALL offer a size control `[data-control="size"]`, a segmented control: an element with `role="radiogroup"` and the accessible name «Розмір поля» (`aria-label`), holding exactly three `<button type="button" role="radio">` elements labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8» (sizes 4, 6, 8, in this order) (FR-43, A-24). The button of the size of the board shown SHALL have `aria-checked="true"` and the other two `aria-checked="false"`; 6×6 is selected when the page is mounted. One press of a button of another size SHALL start a new puzzle of that size and of the level shown (level 1 when the size pressed is 4, FR-92) from a new seed taken from the seed source (one seed per generation attempt), render a board of that size, and clear the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker; when the board has player entries the page SHALL first ask for confirmation (FR-67) and start the new puzzle only after «Так, почати». Until the confirmation, and after «Скасувати», `aria-checked` stays on the size of the board shown. The page calls `generate(n, seed, level)` and assumes that it returns an n×n puzzle: if the generator throws, or the returned `puzzle.givens` is not n rows of n cells, the page SHALL treat it as a generator failure and keep the previous board, the previous messages and highlights, `cell-hinted` and the previous size, and `aria-checked` SHALL stay on the size of the board that is shown, with no uncaught error. The page reads a size only from the three buttons, never from a free value: the behaviour «a changed value that is not exactly 4, 6 or 8 is ignored» of the earlier select-based control is REMOVED, because with three fixed buttons no free value can be submitted; the invariant that exactly three sizes exist is carried by «exactly three buttons». Pressing the button of the size already shown is specified by «Pressing the shown size changes nothing». A size change to 6 or 8 keeps the level and a size change to 4 sets it to 1 in the same single new puzzle, as «Size and level interplay» says. Rules, hint and win message work at the chosen size exactly as at 6. The page MUST NOT remember the choice: a reload or a new mount starts at 6 (TC-12).

Traces: FR-43, FR-67, FR-66, FR-92

#### Scenario: Size control structure and default

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="size"]`
- **THEN** it has `role="radiogroup"` and `aria-label` equal to «Розмір поля», and it contains exactly three `button` elements, each with `type="button"` and `role="radio"`, whose texts are «Поле 4×4», «Поле 6×6» and «Поле 8×8», in this order
- **AND** the second button has `aria-checked="true"` and the other two have `aria-checked="false"`

#### Scenario: Size buttons are native buttons in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the three size buttons
- **THEN** none has the `disabled` attribute and none has a negative `tabindex`, so Tab reaches each one, and a click on each (the activation that Enter and Space perform on a native button) selects its size (arrow keys are not required, A-24)

#### Scenario: Choose 4x4 on a board without entries

- **GIVEN** the default 6x6 board with no player entries, a seed source returning 1 and then 2, and the real engine generator
- **WHEN** the player presses the button «Поле 4×4»
- **THEN** `[data-board]` has `data-size="4"` and contains exactly 16 `[data-cell]` elements with `data-row` and `data-col` values 1 to 4, each pair appearing exactly once
- **AND** for every cell, `data-given="true"` holds exactly where the generator returns a given for size 4 and seed 2, and each given cell shows the digit the generator returns for it
- **AND** `aria-checked="true"` is on «Поле 4×4» only

#### Scenario: Choose 8x8 after play

- **GIVEN** a 6x6 fixture board with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted` and some cells with `cell-violation`, and an injected `generate` that returns an 8x8 fixture puzzle for size 8
- **WHEN** the player presses «Поле 8×8», and then presses `[data-confirm="yes"]`
- **THEN** after the first press the dialog is open and the board is still 6x6 with `aria-checked="true"` on «Поле 6×6»
- **AND** after the confirmation `[data-board]` has `data-size="8"` and contains exactly 64 `[data-cell]` elements with no player entries (a non-given cell shows empty text), and `aria-checked="true"` is on «Поле 8×8» only
- **AND** `[data-message="hint"]` has empty text content and no cell has `cell-hinted`
- **AND** the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: Choose 8x8 after a win

- **GIVEN** a 6x6 fixture board on which the win message is shown (the board is solved, so no cell has `cell-violation`), and an injected `generate` that returns an 8x8 fixture puzzle for size 8
- **WHEN** the player presses «Поле 8×8» and then `[data-confirm="yes"]` (a solved board has entries, A-29)
- **THEN** `[data-message="win"]` has empty text content and `[data-board]` has `data-size="8"` and 64 cells

#### Scenario: Going back to 6x6

- **GIVEN** the page shows an 8×8 board reached by pressing «Поле 8×8» on an untouched 6x6 board
- **WHEN** the player presses «Поле 6×6»
- **THEN** `[data-board]` has `data-size="6"` and contains exactly 36 cells, and `aria-checked="true"` is on «Поле 6×6» only

#### Scenario: aria-checked stays on the shown size until the confirmation

- **GIVEN** a 6x6 board with player entries
- **WHEN** the player presses «Поле 4×4», the test reads the buttons, and then presses `[data-confirm="no"]` and reads them again
- **THEN** both times `aria-checked="true"` is on «Поле 6×6» only and the board is still 6x6

#### Scenario: A change takes exactly one seed and passes the chosen size

- **GIVEN** a seed source returning 1, 2, 3 and so on, counting its calls, and a `generate` spy recording `(size, seed)`
- **WHEN** the page is mounted, then the player presses «Поле 4×4», then «Поле 8×8» (each board has no player entries)
- **THEN** the spy recorded `(6, 1)`, `(4, 2)` and `(8, 3)` in this order and the seed source was called exactly three times

#### Scenario: A generator error keeps the previous board

- **GIVEN** a 6x6 fixture board with player entries, a hint sentence shown and a hint-filled cell, a counting seed source, a `window` `error` listener, and an injected `generate` that throws for size 8
- **WHEN** the player presses «Поле 8×8» and then `[data-confirm="yes"]`
- **THEN** the `error` listener recorded nothing, `[data-board]` keeps `data-size="6"` with the same cell texts and highlights, both message regions keep their text, and the hint-filled cell keeps `cell-hinted`
- **AND** `aria-checked="true"` is on «Поле 6×6» only and the dialog is closed
- **AND** the seed source was called exactly once for the failed change (one seed per generation attempt)

#### Scenario: A generator result of the wrong size keeps the previous board

- **GIVEN** a 6x6 fixture board with player entries and a hint sentence shown, and an injected `generate` that returns a 6x6 fixture puzzle for size 8
- **WHEN** the player presses «Поле 8×8» and then `[data-confirm="yes"]`
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

- **WHEN** the player presses «Поле 8×8» and does nothing else
- **THEN** the cells with `cell-violation` are exactly those of the row

#### Scenario: The choice is not remembered

- **GIVEN** a page on which the player pressed «Поле 8×8», and `localStorage` and `sessionStorage` empty before the test
- **WHEN** the page is mounted again on a new root
- **THEN** the new page's `aria-checked="true"` is on «Поле 6×6» only and its `[data-board]` has `data-size="6"` and 36 cells
- **AND** `localStorage` and `sessionStorage` still hold no entry

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила», the three size buttons, the four level buttons, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the 2px gap between cells shows the page colour on the ring's inner side, the ring's outer edge lands on a neighbour's fill (the pairs `--color-focus` against cell, given and violation fills, 6.70, 5.41 and 4.63 with the design's values) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all.

Traces: FR-65, FR-87

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
- **WHEN** the test reads `[data-action="rules"]`, the three size `button[role="radio"]` and the four level `button[role="radio"]` (FR-87), `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, the close button of `[data-section="rules"]`, `[data-confirm="yes"]`, `[data-confirm="no"]` and every `[data-cell]`
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

### Requirement: Seed is chosen outside the engine, injectable and not shown

The page SHALL obtain the seed for each puzzle from a seed source outside `src/engine/`, calling it exactly once for each generation attempt (the mount, each performed press of the new puzzle button, each performed change to another size and each performed change to another level, including an attempt whose generator call throws), and at no other time: never for a press of the size or the level already shown (FR-73), never for a press of a level that is unavailable at 4×4 (FR-91), never for a requested action that the player cancelled (FR-67) and never for reset. It SHALL accept an injected seed source (contract in the DOM contract section) so tests are deterministic, and MUST NOT display the seed anywhere on the page, including in locale-formatted or separator-split form. When no seed source is injected, the default source SHALL give a different seed on each call (no two consecutive calls return the same seed) and every seed it returns SHALL be an integer from 0 to 2^31 - 1 inclusive. That range is the seed domain pinned by FR-51 and A-25.

Traces: FR-31, FR-42, FR-43, FR-51, FR-67, FR-73, FR-88

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
- **WHEN** the page is mounted, the new puzzle button is pressed once, the player presses «Поле 4×4», presses «Поле 4×4» again (the size already shown), and presses «Поле 8×8» (every board has no entries)
- **THEN** the seed source was called exactly four times and the spy recorded the seeds 1, 2, 3 and 4 in this order, paired with the sizes 6, 6, 4 and 8

#### Scenario: A cancelled or no-op action takes no seed

- **GIVEN** a counting seed source and a `generate` spy, and a mounted board with player entries, with the counts read now
- **WHEN** the player presses «Нова головоломка» and then `[data-confirm="no"]`, presses «Поле 8×8» and then `[data-confirm="no"]`, presses «Задачка» and then `[data-confirm="no"]`, presses «Скинути» and then `[data-confirm="yes"]`, and presses the size button of the size shown and the level button of the level shown
- **THEN** the seed-source call count and the generator call count equal the counts read now

#### Scenario: A level change takes exactly one seed and passes the chosen level

- **GIVEN** a seed source returning 1, 2, 3 and so on, counting its calls, and a `generate` spy recording `(size, seed, level)`
- **WHEN** the page is mounted, then the player presses «Задачка», then «Мозколамка», then «Поле 8×8» (each board has no player entries)
- **THEN** the spy recorded `(6, 1, 1)`, `(6, 2, 2)`, `(6, 3, 4)` and `(8, 4, 4)` in this order and the seed source was called exactly four times

### Requirement: Hint message stays until the next hint or a new puzzle

The page SHALL keep the text of `[data-message="hint"]` unchanged when the player clicks a cell, until the next press of the hint button, the next press of the new puzzle button, a size change whose new puzzle was shown or a level change whose new puzzle was shown (a size change or a level change whose generation fails keeps the message, see Grid size selector and Level selector) (A-23, FR-43, FR-88).

Traces: FR-40, FR-43, FR-88

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
- **WHEN** the player selects 4×4
- **THEN** `[data-message="hint"]` has empty text content

#### Scenario: A level change that shows a new puzzle clears it

- **GIVEN** `[data-message="hint"]` shows a sentence and the player has clicked a cell since
- **WHEN** the player presses «Задачка» and then `[data-confirm="yes"]`
- **THEN** `[data-message="hint"]` has empty text content

### Requirement: The page meets the WCAG 2.2 AA criteria of the accessibility requirements

The page SHALL meet WCAG 2.2 AA for what FR-43, FR-59 to FR-65, FR-67, FR-69, FR-70, FR-87, FR-88 and FR-91 cover (NFR-9): keyboard operation 2.1.1 (every cell and every control reached by Tab in reading order and operated by Enter and Space as a native button, FR-59 and FR-60), name, role and value 4.1.2 (the role and name of the board group and of the two radiogroups, the cell names, `aria-checked`, `aria-disabled`, `aria-invalid`), labels 3.3.2 (the accessible names «Розмір поля» and «Складність» and the visible text of each size button and each level button), status messages 4.1.3 (the two `role="status"` regions), use of colour 1.4.1 (the heavier violation border and `aria-invalid`) and non-text contrast 1.4.11 (the 3:1 pairs) and visible focus 2.4.7 (the `:focus-visible` rules). Every button of the page (the cell buttons, the size radio buttons and the level radio buttons included) SHALL have a non-empty accessible name in Ukrainian: its `aria-label` when it has one (every cell), otherwise its text; the board group and both radiogroups SHALL have a non-empty Ukrainian `aria-label`. No element of the page SHALL have a `tabindex` attribute, before or after play. Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).

Traces: NFR-9, NFR-5, FR-43, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, FR-65, FR-67, FR-69, FR-70, FR-87, FR-88, FR-91

#### Scenario: Every button, the radiogroups and the board have a Ukrainian name

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test computes the accessible name of each `button` (its `aria-label` when present, else its text) and of each `[role="radiogroup"]` and of `[data-board]` (their `aria-label`)
- **THEN** there are 50 buttons (36 cells and 14 others: «Правила», three size buttons, four level buttons, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати») and three groups, every name is non-empty, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/`
- **AND** the names include «Підказка», «Скинути», «Нова головоломка», «Розмір поля», «Поле 6×6», «Складність», «Розминка», «Задачка», «Головоломка», «Мозколамка», and the 36 cell names

#### Scenario: No element of the page has a tabindex, before and after play

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test reads every element of the root at mount, and again after a click on a cell and a hint press
- **THEN** no element of the root has a `tabindex` attribute at either moment

#### Scenario: The level radiogroup exposes its state

- **GIVEN** a mounted page, and the same page after «Поле 4×4»
- **WHEN** the test reads the `aria-checked` and `aria-disabled` attributes of the four level buttons
- **THEN** at 6x6 exactly one button has `aria-checked="true"`, none has `aria-disabled`, and at 4x4 exactly one has `aria-checked="true"` and three have `aria-disabled="true"`, so the state of the group is exposed by attributes and not by colour alone
