# play-page Specification

## Purpose

The play page is the single static page on which a player solves a Takuzu (Бінарка) puzzle. It renders a generated puzzle as a grid of clickable cells, marks the givens, highlights rule violations as the player fills the board, offers a grid size selector (4×4, 6×6, 8×8; 6×6 at start), a hint button, a reset button and a new-puzzle button, a rules block under the board, and shows a Ukrainian win message when the board is solved. The page is vanilla TypeScript DOM code (`src/main.ts`, `src/ui/`) tested in jsdom with Vitest. It only consumes the engine described in `openspec/specs/puzzle-engine/spec.md` (generator, rule checker, hint engine); what counts as a violation, as solved, or as a hint is defined there and is not restated here.

Ownership: this capability owns FR-31 to FR-43, FR-57 and FR-58. It traces NFR-5 only for the text the page itself shows (labels, buttons including the reset label, size options, rules text, win message, heading, page title). NFR-5 is shared by design with `puzzle-engine`, which owns the hint sentences and CLI errors; the page only displays hint sentences and never restates them. NFR-5 is therefore a shared, per-text-owner requirement and not a double-owned or unowned one.

## DOM contract used by the scenarios

Scenarios are decided from the DOM only (text content, classes, data attributes, element presence). Indices are 1-based, matching the rows and columns shown to the player. The engine interface (`openspec/specs/puzzle-engine/spec.md`, test conventions) is 0-based, so a hint target with `row` r and `col` c is the cell with `data-row` = r + 1 and `data-col` = c + 1. The «» guillemets around labels and messages in this spec are quoting marks and are not part of the text. The apostrophe in «розв'язано» is the ASCII apostrophe U+0027 (as in FR-41); an equality check on the win message compares against that codepoint exactly.

### Mount entry point and fixtures (spec-made contract)

FR-31 to FR-43, FR-57, FR-58 and A-4 only require that the seed is injectable. The following entry point is a contract chosen by this spec so scenarios can be written test-first; the change design may rename it only together with this spec.

- Entry point: `mountPlayPage(root: HTMLElement, options?: { seedSource?: () => number; generate?: (size: number, seed: number) => Puzzle }): void`, exported from `src/ui/`. `Puzzle` is the type the engine generator returns (engine interface in `openspec/specs/puzzle-engine/spec.md`). `src/main.ts` calls it with the `#app` element and no options.
- Mounting is synchronous: when the call returns, the board, the size selector, the rules block, the buttons (including reset) and both message regions are in `root`. It replaces the previous content of `root`. Two mounts on two different roots are independent.
- Seed source: a synchronous function with no arguments that returns an integer. The page calls it exactly once for each generation attempt (the mount, each press of the new puzzle button and each accepted size change, including an attempt whose generator call throws) and at no other time, and passes the returned value to the generator unchanged. When no `seedSource` is injected the page uses its own default source (see the seed requirement).
- Generator: when `generate` is not injected the page uses the engine generator. A scenario that says "fixture puzzle" injects a hand-written puzzle through `generate` (a fixture of the requested size; the page assumes `generate(n, s)` returns an n×n puzzle); its givens, and its solution where a scenario needs one, are written in the test suite so that the board state a scenario needs can be reached by clicks. A scenario that says "the generator output for size N and seed S" uses the real engine generator with no injection of `generate`. The rule checker and the hint engine are always the real engine; an "expected hint" in a scenario is the engine hint function applied to the board as read from the DOM.
- Unless a scenario names a seed, its board is a fixture puzzle; a scenario that says real engine generator uses it without naming a seed.

- Board element: `[data-board]`, with `data-size` holding N.
- Cell element: `[data-cell]` with `data-row`, `data-col`, and `data-given` equal to `true` for a given and `false` otherwise. A given also carries the class `cell-given`. A cell's shown text is empty, `0` or `1`.
- Highlighted cell: carries the class `cell-violation`.
- Size selector: `[data-control="size"]`, a select with options 4, 6 and 8 labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8».
- Buttons: `[data-action="hint"]` (label «Підказка»), `[data-action="reset"]` (label «Скинути») and `[data-action="new"]` (label «Нова головоломка»).
- Rules block: `[data-section="rules"]`, follows `[data-board]` in document order, heading «Правила» and three `li` items.
- Message regions: `[data-message="hint"]` and `[data-message="win"]`, always present; empty text content means no message is shown.
- Page root: the `root` passed to `mountPlayPage`. The page heading is not required by any FR; if present it is inside the root, and the document title is `document.title`.
## Requirements
### Requirement: Board rendering and default size

The page SHALL render an N×N grid of cells for a puzzle produced by the generator from a size and a seed, with N equal to 6 until a size change shows a puzzle of another size and equal to the size of the board shown afterwards (a size change whose generation fails keeps the previous size, see Grid size selector) (FR-43).

Traces: FR-31, FR-43

#### Scenario: Default board is 6x6

- **GIVEN** the page is mounted with an injected seed source returning 1 and no size chosen
- **WHEN** the page has rendered
- **THEN** `[data-board]` has `data-size="6"` and contains exactly 36 `[data-cell]` elements
- **AND** the cells carry `data-row` and `data-col` values 1 to 6, each pair appearing exactly once

#### Scenario: Board content comes from the generator

- **GIVEN** the page is mounted with an injected seed source returning 42 and the default size
- **WHEN** the page has rendered
- **THEN** for every cell, `data-given="true"` holds exactly where the generator returns a given for size 6 and seed 42
- **AND** each given cell shows the digit the generator returns for it and every other cell shows empty text

#### Scenario: Board follows the chosen size

- **GIVEN** a mounted page with the real engine generator
- **WHEN** the player selects 8×8
- **THEN** `[data-board]` has `data-size="8"` and contains exactly 64 `[data-cell]` elements
- **AND** the cells carry `data-row` and `data-col` values 1 to 8, each pair appearing exactly once

### Requirement: Given cells are marked distinctly

The page SHALL mark each given cell with the class `cell-given` and `data-given="true"`, and SHALL mark each non-given cell with `data-given="false"` and without the class `cell-given`.

Traces: FR-32

#### Scenario: Givens and player cells are distinguishable

- **GIVEN** a rendered board
- **WHEN** the test reads the attributes and classes of every cell
- **THEN** every cell with `data-given="true"` has the class `cell-given`
- **AND** every cell with `data-given="false"` lacks the class `cell-given`
- **AND** a cell showing empty text always has `data-given="false"`

### Requirement: Given cells are locked

The page SHALL ignore clicks on a given cell: its text, its `data-given` value and the highlight state of every cell stay unchanged and no error is shown.

Traces: FR-33

#### Scenario: Clicking a given cell changes nothing

- **GIVEN** a rendered board with a given cell showing `1`
- **WHEN** the player clicks that cell once, and then twice more
- **THEN** the cell still shows `1` and still has `data-given="true"` and the class `cell-given`
- **AND** no other cell changed text or class, and both message regions have unchanged text

#### Scenario: Clicking a given does not clear a message

- **GIVEN** a board where the hint message region shows a sentence
- **WHEN** the player clicks a given cell
- **THEN** the hint message region keeps the same text

### Requirement: Player cells cycle through empty, 0 and 1

The page SHALL change a non-given cell on each click in the cycle empty, «0», «1», empty, and SHALL show the digits as text (not as colours or any other mark).

Traces: FR-34

#### Scenario: Three clicks complete the cycle

- **GIVEN** a rendered board with an empty non-given cell
- **WHEN** the player clicks it once, twice, three times
- **THEN** its text content is `0` after the first click, `1` after the second, and empty after the third

#### Scenario: Cycle works on a cell filled by a hint

- **GIVEN** a non-given cell that the hint button filled with `0`
- **WHEN** the player clicks it once
- **THEN** it shows `1`, and its `data-given` is still `false`

### Requirement: Highlight three or more equal digits in a row

The page SHALL add the class `cell-violation` to every cell that the rule checker reports in a violation of three or more equal digits side by side in a row or a column (see `openspec/specs/puzzle-engine/spec.md`).

Traces: FR-35

#### Scenario: Three equal digits in a row are highlighted

- **GIVEN** a rendered board in which, in some row, two adjacent cells show `0` and the next cell is a non-given empty cell
- **WHEN** the player clicks that empty cell once so it shows `0`
- **THEN** the three cells of the run have the class `cell-violation`

#### Scenario: Three equal digits in a column are highlighted

- **GIVEN** a rendered board in which, in some column, two adjacent cells show `1` and the next cell is a non-given empty cell
- **WHEN** the player clicks that cell twice so it shows `1`
- **THEN** the three cells of the run have the class `cell-violation`

#### Scenario: Two equal digits are not highlighted

- **GIVEN** a rendered board on which no cell has the class `cell-violation`, with a non-given empty cell next to a single digit
- **WHEN** the player fills that cell so that exactly two equal digits are adjacent, no three equal digits are side by side, and no other rule is broken anywhere on the board
- **THEN** no cell on the board has the class `cell-violation`

### Requirement: Highlight a line with too many of one digit

The page SHALL add the class `cell-violation` to every cell of a row or column that the rule checker reports as holding more than N/2 of one digit, where N is the size of the board shown (4, 6 or 8).

Traces: FR-36, FR-43

#### Scenario: Too many zeros in a row

- **GIVEN** a rendered 6x6 board and a row whose cells the test fills so that, once the fourth `0` is placed, it holds four `0` with no three equal digits side by side, and no other rule is broken anywhere on the board
- **WHEN** the fourth `0` is placed
- **THEN** all six cells of that row have the class `cell-violation`
- **AND** no cell outside that row has the class `cell-violation`

#### Scenario: Too many ones in a column

- **GIVEN** a rendered 6x6 board and a column whose cells the test fills so that, once the fourth `1` is placed, it holds four `1` with no three equal digits side by side, and no other rule is broken anywhere on the board
- **WHEN** the fourth `1` is placed
- **THEN** all six cells of that column have the class `cell-violation`
- **AND** no cell outside that column has the class `cell-violation`

#### Scenario: Exactly N/2 is not highlighted

- **GIVEN** a rendered 6x6 board on which a row holds three `0` with no three equal digits side by side, and no other rule is broken anywhere on the board
- **WHEN** the board is read
- **THEN** no cell on the board has the class `cell-violation`

#### Scenario: Too many zeros in a row of an 8x8 board

- **GIVEN** the player has selected 8×8 and the injected `generate` returned an 8x8 fixture puzzle with no givens, and the test fills row 1 with `0 0 1 0 1 0 0 1` from left to right so that, once the last `0` (column 7) is placed, the row holds five `0` with no three equal digits side by side, and no other rule is broken anywhere on the board
- **WHEN** the fifth `0` is placed
- **THEN** all eight cells of row 1 have the class `cell-violation`
- **AND** no cell outside row 1 has the class `cell-violation`

### Requirement: Highlight identical complete lines

The page SHALL add the class `cell-violation` to every cell of two rows, or of two columns, that the rule checker reports as complete and identical.

Traces: FR-37

#### Scenario: Two identical complete rows

- **GIVEN** a rendered board where the test completes two rows so that they hold identical digits, and no other rule is broken anywhere on the board
- **WHEN** the last cell of the second row is filled
- **THEN** every cell of both rows has the class `cell-violation`
- **AND** no cell outside those two rows has the class `cell-violation`

#### Scenario: Two identical complete columns

- **GIVEN** a rendered board where the test completes two columns so that they hold identical digits, and no other rule is broken anywhere on the board
- **WHEN** the last cell of the second column is filled
- **THEN** every cell of both columns has the class `cell-violation`
- **AND** no cell outside those two columns has the class `cell-violation`

#### Scenario: A row with an empty cell is not compared

- **GIVEN** a rendered board with two rows that match in every filled cell while one of them has an empty cell, and no other rule is broken anywhere on the board
- **WHEN** the board is read
- **THEN** no cell on the board has the class `cell-violation`

### Requirement: Highlighting follows every board change

The page SHALL recompute the highlighted cells after every board change (a cell click on a non-given cell, a hint fill, a new puzzle, a size change), so that a broken rule is highlighted at once and its highlight is removed as soon as the rule is no longer broken.

Traces: FR-38, FR-43

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
- **WHEN** the player selects 4×4
- **THEN** the 16 cells of the new board have no `cell-violation`, and no cell of the old board remains in the page

### Requirement: Hint button fills one cell

The page SHALL, when the hint button is pressed and the hint engine returns a target cell, write the engine's value into exactly that cell and into no other cell. A hint-filled cell SHALL be an ordinary player cell: `data-given="false"`, no `cell-given` class, and it can be changed by clicking.

Traces: FR-39

#### Scenario: Hint fills the targeted cell

- **GIVEN** a rendered board on which the hint engine returns a target cell and value
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell with `data-row` = row + 1 and `data-col` = col + 1 (the engine's 0-based `row` and `col`) shows that value
- **AND** every other cell has the same text as before the press

#### Scenario: Zero-based target maps to the one-based cell

- **GIVEN** a fixture puzzle whose only given cells are 0 at `data-row` 3 with `data-col` 1 and 2, so that the hint engine returns `{ kind: 'fill', row: 2, col: 2, value: 1, rule: 'pair' }` (row 3 column 3 in the page's numbering)
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell with `data-row="3"` and `data-col="3"` shows `1`
- **AND** the cell with `data-row="2"` and `data-col="2"` is unchanged

#### Scenario: Count rule fills only one cell

- **GIVEN** a board on which no pair rule and no sandwich rule applies anywhere, the board breaks no rule, and the hint engine's target is a cell of a line L through the count rule, where several cells of L are empty
- **WHEN** the player presses the hint button once
- **THEN** exactly one cell on the whole board changed text, it is the hint engine's target, and every other empty cell of L is still empty

#### Scenario: Hint-filled cell stays editable

- **GIVEN** a cell just filled by the hint button
- **WHEN** the player clicks it
- **THEN** its text follows the cycle for player cells and `data-given` stays `false`

#### Scenario: No fill when the hint engine has no target

- **GIVEN** a board on which the hint engine returns `kind` 'none' or 'broken' (no target cell)
- **WHEN** the player presses the hint button
- **THEN** every cell has the same text as before the press

### Requirement: Hint button shows the engine's sentence

The page SHALL, when the hint button is pressed, show the sentence the hint engine returns in `[data-message="hint"]`, including the sentence for "no rule applies" and the sentence for "the board breaks a rule", in which cases no cell is filled. The page SHALL NOT alter or rephrase the sentence.

Traces: FR-40

#### Scenario: Sentence shown with a fill

- **GIVEN** a board on which the hint engine returns a target cell and a sentence
- **WHEN** the player presses the hint button
- **THEN** the text content of `[data-message="hint"]` equals that sentence

#### Scenario: Board breaks a rule

- **GIVEN** a board where at least one cell has `cell-violation`
- **WHEN** the player presses the hint button
- **THEN** `[data-message="hint"]` shows the sentence the hint engine returns for a board that breaks a rule
- **AND** no cell changed text

#### Scenario: No rule applies

- **GIVEN** a rule-clean board on which the hint engine returns the "no rule applies" sentence
- **WHEN** the player presses the hint button
- **THEN** `[data-message="hint"]` shows that sentence and no cell changed text

#### Scenario: Second press replaces the sentence

- **GIVEN** `[data-message="hint"]` shows the sentence from a first press
- **WHEN** the player presses the hint button again
- **THEN** `[data-message="hint"]` shows only the sentence for the second press, not both

#### Scenario: Initial state has no hint message

- **GIVEN** the page has just been mounted
- **WHEN** no button has been pressed
- **THEN** `[data-message="hint"]` has empty text content

### Requirement: Hint message stays until the next hint or a new puzzle

The page SHALL keep the text of `[data-message="hint"]` unchanged when the player clicks a cell, until the next press of the hint button, the next press of the new puzzle button or a size change whose new puzzle was shown (a size change whose generation fails keeps the message, see Grid size selector) (A-23, FR-43).

Traces: FR-40, FR-43

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

### Requirement: Win message when solved

The page SHALL show the Ukrainian win message «Вітаємо, головоломку розв'язано!» in `[data-message="win"]` when the rule checker recognises the board as solved after a board change, whether the change is a click or a hint fill. While the board is not solved the win region SHALL have empty text content.

Traces: FR-41

#### Scenario: Final click solves the board

- **GIVEN** a fixture puzzle whose solution the test knows, with every cell filled with the solution except one non-given cell that shows another value (or is empty)
- **WHEN** the player clicks that cell until it shows the solution digit
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розв'язано!» (apostrophe U+0027)

#### Scenario: Final hint solves the board

- **GIVEN** a fixture puzzle whose solution the test knows, with exactly one cell empty, every other cell holding the solution digit, and the hint engine targeting that cell with the solution digit
- **WHEN** the player presses the hint button
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розв'язано!» (apostrophe U+0027)

#### Scenario: Full board with a violation is not a win

- **GIVEN** a board with every cell filled and at least one `cell-violation` cell
- **WHEN** the board is read
- **THEN** `[data-message="win"]` has empty text content

#### Scenario: Board stays editable after a win

- **GIVEN** `[data-message="win"]` shows the win message
- **WHEN** the player clicks a non-given cell
- **THEN** the cell changes to the next value in the cycle (the board is not locked)
- **AND** `[data-message="win"]` has empty text content, because the board is no longer solved (the puzzle has exactly one solution, so any changed cell leaves the board unsolved)

### Requirement: New puzzle button

The page SHALL, when the «Нова головоломка» button is pressed, replace the board with a puzzle generated for the currently selected size from a new seed, and SHALL clear the hint message and the win message and all highlights that belonged to the old board. The size selector keeps its value. The page MUST NOT require the new puzzle to differ from the old one.

Traces: FR-42, FR-43

#### Scenario: New puzzle after play

- **GIVEN** a 6x6 board with player entries, a hint sentence shown and the win message shown, and the injected seed source returning 7 for the next call
- **WHEN** the player presses `[data-action="new"]`
- **THEN** the board has 36 cells matching what the page's generator returns for size 6 and seed 7 (with an injected `generate` that returns the fixture for the first call and the engine generator's output afterwards), with no player entries
- **AND** `[data-message="hint"]` and `[data-message="win"]` both have empty text content

#### Scenario: New puzzle keeps the chosen size

- **GIVEN** the player has selected 8×8, the board is 8×8, and a `generate` spy records `(size, seed)`
- **WHEN** the player presses the new puzzle button
- **THEN** the board has `data-size="8"` and 64 cells, the selector still shows 8, and the spy's last call has size 8

#### Scenario: New puzzle mid-game removes highlights

- **GIVEN** a board with cells that have `cell-violation`
- **WHEN** the player presses the new puzzle button
- **THEN** the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: Each press uses a new seed

- **GIVEN** an injected seed source returning 1, then 2, then 3
- **WHEN** the page is mounted and the new puzzle button is pressed twice
- **THEN** the boards were generated from seeds 1, 2 and 3 in this order

### Requirement: Seed is chosen outside the engine, injectable and not shown

The page SHALL obtain the seed for each puzzle from a seed source outside `src/engine/`, calling it exactly once for each generation attempt (the mount, each press of the new puzzle button and each accepted size change, including an attempt whose generator call throws, and never for an ignored size value), SHALL accept an injected seed source (contract in the DOM contract section) so tests are deterministic, and MUST NOT display the seed anywhere on the page, including in locale-formatted or separator-split form. When no seed source is injected, the default source SHALL give a different seed on each call (no two consecutive calls return the same seed) and every seed it returns SHALL be an integer from 0 to 2^31 - 1 inclusive. That range is the seed domain pinned by FR-51 and A-25.

Traces: FR-31, FR-42, FR-43, FR-51

#### Scenario: Injected seed gives a reproducible page

- **GIVEN** two pages mounted with seed sources that both return 42, using the real engine generator
- **WHEN** both have rendered
- **THEN** their cells have identical `data-given` values and identical text

#### Scenario: Default seed source gives new seeds in its domain

- **GIVEN** the page is mounted without an injected seed source and with an injected `generate` spy that records each seed and returns a fixture puzzle
- **WHEN** the new puzzle button is pressed 9 times, so the spy has recorded 10 seeds in all
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
- **WHEN** the page is mounted, the new puzzle button is pressed once, the player selects 4×4, a `change` event is dispatched while the select reports the ignored value `5` (through the `value` override of the scenario "Value outside the offered sizes is ignored"), and the player selects 8×8
- **THEN** the seed source was called exactly four times and the spy recorded the seeds 1, 2, 3 and 4 in this order, paired with the sizes 6, 6, 4 and 8

### Requirement: Ukrainian page text

The page SHALL show all of its own text (heading if any, labels, buttons, size selector option labels, the win message, `document.title` and any user-visible attribute such as `aria-label`, `title`, `placeholder`, `alt` and the `label` attribute of `option` and `optgroup` elements, which a browser shows instead of the option text) in Ukrainian: each such text contains Cyrillic letters and no Latin letters. The digits and the sign × inside an option label such as «Поле 4×4» are not Latin letters. The digits shown in the cells of the board are puzzle content, not page text, and are not collected. Hint sentences are owned by the puzzle-engine capability and are only displayed here.

Traces: NFR-5, FR-43

#### Scenario: Static page text

- **GIVEN** the page has just been mounted
- **WHEN** the test collects every non-whitespace text node under the page root (including the buttons, the size selector options and any heading, label or footer, but not the text of `[data-cell]` elements, which is puzzle content), `document.title`, and the values of the attributes `aria-label`, `title`, `placeholder` and `alt` on every element in the root and of the attribute `label` on every `option` and `optgroup` element; `data-*` attributes, `class` and option `value` attributes are not user-visible and are not collected
- **THEN** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`
- **AND** the collected texts include «Поле 4×4», «Поле 6×6» and «Поле 8×8»

#### Scenario: Win message text

- **GIVEN** a solved board
- **WHEN** the win message is shown
- **THEN** its text is exactly «Вітаємо, головоломку розв'язано!» (apostrophe U+0027), which contains Cyrillic letters and no Latin letters

### Requirement: Grid size selector

The page SHALL offer a size selector `[data-control="size"]`, a select with the options 4, 6 and 8 labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8», with 6 selected when the page is mounted. When the choice changes to exactly 4, 6 or 8 the page SHALL start a new puzzle of the chosen size from a new seed taken from the seed source (one seed per generation attempt), SHALL render a board of that size, and SHALL clear the hint message, the win message and all highlights that belonged to the old board. The page assumes that `generate(n, seed)` returns an n×n puzzle: if the generator throws, or the returned `puzzle.givens` is not n rows of n cells, the page SHALL treat it as a generator failure and keep the previous board, the previous messages and highlights and the previous size, and the selector SHALL show the size of the board that is shown. The page SHALL ignore a changed value that is not exactly 4, 6 or 8 (including the empty value; the page reads the selected size from the select's `value` property): no error, no seed taken, no generator call, no change to the board, the messages or the highlights, and the selector shows the size of the board that is shown. Rules, hint and win message work at the chosen size exactly as at 6. The page MUST NOT remember the choice: a reload or a new mount starts at 6 (TC-12). Re-selecting the current size is not specified: browsers fire no `change` event for it, so the page may start a new puzzle or ignore it and no scenario asserts which.

Traces: FR-43

#### Scenario: Selector options and default

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="size"]`
- **THEN** it is a `select` with exactly three options with values `4`, `6` and `8`, in this order, whose text is «Поле 4×4», «Поле 6×6» and «Поле 8×8»
- **AND** the selected option is the one with value `6` and the select's `value` is `6`

#### Scenario: Choose 4x4

- **GIVEN** the default 6x6 board, a seed source returning 1 and then 2, and the real engine generator
- **WHEN** the player selects 4×4 (the test sets the select's value to `4` and dispatches a bubbling `change` event)
- **THEN** `[data-board]` has `data-size="4"` and contains exactly 16 `[data-cell]` elements with `data-row` and `data-col` values 1 to 4, each pair appearing exactly once
- **AND** for every cell, `data-given="true"` holds exactly where the generator returns a given for size 4 and seed 2, and each given cell shows the digit the generator returns for it
- **AND** the selector still shows 4

#### Scenario: Choose 8x8 after play

- **GIVEN** a 6x6 fixture board with player entries, a hint sentence shown and some cells with `cell-violation`, and an injected `generate` that returns an 8x8 fixture puzzle for size 8
- **WHEN** the player selects 8×8
- **THEN** `[data-board]` has `data-size="8"` and contains exactly 64 `[data-cell]` elements with no player entries (a non-given cell shows empty text)
- **AND** `[data-message="hint"]` has empty text content
- **AND** the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: Choose 8x8 after a win

- **GIVEN** a 6x6 fixture board on which the win message is shown (the board is solved, so no cell has `cell-violation`), and an injected `generate` that returns an 8x8 fixture puzzle for size 8
- **WHEN** the player selects 8×8
- **THEN** `[data-message="win"]` has empty text content and `[data-board]` has `data-size="8"` and 64 cells

#### Scenario: Going back to 6x6

- **GIVEN** the page shows an 8×8 board
- **WHEN** the player selects 6×6
- **THEN** `[data-board]` has `data-size="6"` and contains exactly 36 cells, and the selector shows 6

#### Scenario: A change takes exactly one seed and passes the chosen size

- **GIVEN** a seed source returning 1, 2, 3 and so on, counting its calls, and a `generate` spy recording `(size, seed)`
- **WHEN** the page is mounted, then the player selects 4×4, then 8×8
- **THEN** the spy recorded `(6, 1)`, `(4, 2)` and `(8, 3)` in this order and the seed source was called exactly three times

#### Scenario: Value outside the offered sizes is ignored

- **GIVEN** the default 6x6 board with player entries, a hint sentence shown and some cells with `cell-violation`, a seed source and a `generate` spy that count their calls, and a `window` `error` event listener that records uncaught errors (a `dispatchEvent` call never throws when a listener throws, so the listener is the only way to detect an uncaught error)
- **AND** a size selector made to report a value outside the offered sizes by overriding `value` on the element (the override has a getter and a setter) with each of `5`, `10`, `abc`, `6.0`, ` 6`, `06`, `0x6` and the empty string, each tried in turn; before each override is installed the test sets `selectedIndex` to 0 (the option with value `4`), so a page that does not restore the selector leaves index 0
- **WHEN** a `change` event is dispatched on `[data-control="size"]` for each such value
- **THEN** the `error` listener recorded nothing, `[data-board]` keeps `data-size="6"`, every cell keeps its text and its `cell-violation` state, and both message regions keep their text
- **AND** the seed source and the generator were not called again
- **AND** right after each `change`, `selectedIndex` is the index of the option with value `6` (1), and once the override is removed the selector reports the value `6`

#### Scenario: Value outside the offered sizes with no option selected

- **GIVEN** the same board, spies and `error` listener as in the previous scenario, and the test sets `selectedIndex` to `-1` so the select reports the empty string
- **WHEN** a `change` event is dispatched on `[data-control="size"]`
- **THEN** right after the `change`, `selectedIndex` is 1, `options[1].selected` is true and the select's `value` is `6`
- **AND** the `error` listener recorded nothing, the board, the messages and the highlights are unchanged, and neither the seed source nor the generator was called again

#### Scenario: A generator error keeps the previous board

- **GIVEN** a 6x6 fixture board with player entries and a hint sentence shown, a counting seed source, a `window` `error` listener, and an injected `generate` that throws for size 8
- **WHEN** the player selects 8×8
- **THEN** the `error` listener recorded nothing, `[data-board]` keeps `data-size="6"` with the same cell texts and highlights, and both message regions keep their text
- **AND** the selector reports the value `6` again (the page restores the selected option of the board that is shown)
- **AND** the seed source was called exactly once for the failed change (one seed per generation attempt)

#### Scenario: A generator result of the wrong size keeps the previous board

- **GIVEN** a 6x6 fixture board with player entries and a hint sentence shown, and an injected `generate` that returns a 6x6 fixture puzzle for size 8
- **WHEN** the player selects 8×8
- **THEN** `[data-board]` keeps `data-size="6"` with 36 cells and the same cell texts, both message regions keep their text, and the selector reports the value `6`

#### Scenario: Hint at 4x4

- **GIVEN** the player has selected 4×4 and the injected `generate` returned a 4x4 fixture puzzle whose only givens are `0` at `data-row` 2 with `data-col` 1 and 2, so that the hint engine returns `{ kind: 'fill', row: 1, col: 2, value: 1, rule: 'pair' }`
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell with `data-row="2"` and `data-col="3"` shows `1`, every other cell has the same text as before the press, and `[data-message="hint"]` shows the engine's sentence

#### Scenario: Hint at 8x8

- **GIVEN** the player has selected 8×8 and the injected `generate` returned an 8x8 fixture puzzle whose only givens are `0` at `data-row` 8 with `data-col` 7 and 8, so that the hint engine returns `{ kind: 'fill', row: 7, col: 5, value: 1, rule: 'pair' }`
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell with `data-row="8"` and `data-col="6"` shows `1`, every other cell has the same text as before the press, and `[data-message="hint"]` shows the engine's sentence

#### Scenario: Win at 4x4

- **GIVEN** the player has selected 4×4 and the injected `generate` returned a 4x4 fixture puzzle with an explicit solution known to the test, whose givens are every cell except one non-given cell
- **WHEN** the player clicks that cell until it shows the solution digit
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розв'язано!» (apostrophe U+0027)

#### Scenario: Win at 8x8

- **GIVEN** the player has selected 8×8 and the injected `generate` returned an 8x8 fixture puzzle with an explicit solution (a valid solved 8×8 grid written in the test) whose givens are every cell except the one at `data-row` 8 and `data-col` 8
- **WHEN** the player clicks that cell until it shows the solution digit
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розв'язано!» (apostrophe U+0027)

#### Scenario: Violations in the givens of a new 8x8 board show at once

- **GIVEN** a 6x6 board and an injected `generate` that returns, for size 8, an 8x8 fixture puzzle whose only givens are `0` at `data-row` 8 with `data-col` 1, 2 and 3 (an inconsistent fixture)
- **WHEN** the player selects 8×8 and does nothing else
- **THEN** exactly the three cells at `data-row` 8, `data-col` 1, 2 and 3 have the class `cell-violation`

#### Scenario: A count violation in the last column of a new 8x8 board shows at once

- **GIVEN** a 6x6 board and an injected `generate` that returns, for size 8, an 8x8 fixture puzzle whose only givens are `1` at `data-col` 8 with `data-row` 1, 2, 4, 6 and 7 (five `1` in the column, no three side by side)
- **WHEN** the player selects 8×8 and does nothing else
- **THEN** all eight cells with `data-col="8"` have the class `cell-violation` and no cell outside that column has it

#### Scenario: The choice is not remembered

- **GIVEN** a page on which the player selected 8×8, and `localStorage` and `sessionStorage` empty before the test
- **WHEN** the page is mounted again on a new root
- **THEN** the new page's selector shows 6 and its `[data-board]` has `data-size="6"` and 36 cells
- **AND** `localStorage` and `sessionStorage` still hold no entry

### Requirement: Rules block

The page SHALL show a rules block `[data-section="rules"]` inside the root, after `[data-board]` in document order, with the heading text «Правила» and exactly three `li` items, in this order: «Не більше двох однакових цифр поспіль у рядку чи стовпці.», «У кожному рядку та стовпці порівну нулів і одиниць.» and «Усі рядки різні, і всі стовпці різні.» (FR-57). The block is created once at mount outside the element that holds the board, so a new puzzle, a size change and a win leave exactly one block with the same heading and the same three texts. The texts are Ukrainian and contain no Latin letters (NFR-5). The block needs no script behaviour.

Traces: FR-57, NFR-5

#### Scenario: Rules block at mount

- **GIVEN** the page has just been mounted with a fixture puzzle
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** exactly one such element exists inside the root and it follows `[data-board]` in document order
- **AND** its heading text is «Правила» and it contains exactly three `li` items whose texts, in order, are those of this table, none of which contains a Latin letter

| Item | Text |
|------|------|
| 1 | Не більше двох однакових цифр поспіль у рядку чи стовпці. |
| 2 | У кожному рядку та стовпці порівну нулів і одиниць. |
| 3 | Усі рядки різні, і всі стовпці різні. |

#### Scenario: Rules block survives every board change

- **GIVEN** a mounted page with a fixture puzzle and the rules block read at mount
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 or to 8 (one run for each) |
| reaches a win |

- **THEN** after each action there is still exactly one `[data-section="rules"]`, it follows `[data-board]` in document order, and it has the same heading and the same three `li` texts as at mount

### Requirement: Reset button

The page SHALL offer a button `[data-action="reset"]` labelled «Скинути» (NFR-5). Pressing it SHALL set every non-given cell to empty, including cells filled by a hint, keep every given cell's text and `data-given` value, keep the current size (any of 4, 6 and 8) in `[data-board]`'s `data-size` and in the size selector, remove every `cell-violation` class that does not come from the givens themselves (the highlights are recomputed for the reset board), empty `[data-message="hint"]` and `[data-message="win"]`, and keep the board editable (FR-58). Reset SHALL NOT call the seed source or the generator. It works after a win and, on an untouched board, changes no cell text, no class and no message. Reset is size-independent: the scenarios that touch the board are run for each N in the table below, each with a fixture puzzle of size N. Undo and restoring a saved state are not part of reset (FR-47 and FR-46 are Future).

| N |
|---|
| 4 |
| 6 |
| 8 |

Traces: FR-58, NFR-5

#### Scenario: Reset empties player cells and keeps givens and size

- **GIVEN** a mounted page with a fixture puzzle of size N, and the player has clicked several non-given cells and pressed the hint button once so that a hint filled a cell
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** every cell with `data-given="false"` shows empty text, and every cell with `data-given="true"` shows the same text and the same `data-given` value as before
- **AND** `[data-board]` has `data-size` equal to N and the size selector still shows N

#### Scenario: Reset clears highlights and the hint message

- **GIVEN** a mounted page with a fixture puzzle of size N where at least one cell has the class `cell-violation` because of the player's entries (the givens alone report no violation), and `[data-message="hint"]` shows a sentence
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** no cell has the class `cell-violation` and `[data-message="hint"]` has empty text content

#### Scenario: Reset after a win

- **GIVEN** a mounted page with a fixture puzzle of size N whose board the player has solved, so that `[data-message="win"]` shows the win text
- **WHEN** the player presses `[data-action="reset"]`, and then clicks a non-given cell once
- **THEN** after the press `[data-message="win"]` has empty text content
- **AND** after the click that cell shows «0»

#### Scenario: Reset takes no seed and calls no generator

- **GIVEN** a mounted page with a fixture puzzle of size N, an injected seed source and an injected generator that count their calls, with the counts read after mount
- **WHEN** the player presses `[data-action="reset"]` once, and then two more times
- **THEN** after each press the seed-source call count and the generator call count equal the counts read after mount

#### Scenario: Reset on an untouched board changes nothing

- **GIVEN** a mounted page with a fixture puzzle of size N and no player action, with the text and class list of every cell and the text of both message regions recorded
- **WHEN** the player presses `[data-action="reset"]`
- **THEN** every cell has the same text and the same class list as recorded, and both message regions have the same text as recorded

## Exclusions

The following are intentionally unsupported in MVP; testers must not report them as defects.

- No server, no authentication, no accounts, no authorization: every visitor can use the page, so there are no unauthorized or forbidden cases and no redirects.
- No persistence (TC-12): reloading the page starts a fresh puzzle; nothing is stored. No network calls: puzzles are generated in the browser.
- Difficulty grading (FR-44), a timer (FR-45), saved progress (FR-46), undo (FR-47) and a daily puzzle (FR-48) are Future; reset (FR-58) returns to the givens only and is not undo.
- Real-browser tests (NFR-7) are Future; the page is tested in jsdom only (TC-13). Rendering defects that jsdom cannot see are not caught.
- Keyboard play and screen-reader support have no requirements (A-20). Mobile layout and visual polish are not specified (A-14).
- The seed is not shown on the page (A-4).
- Re-selecting the already selected size: browsers fire no `change`, so no scenario asserts it.
- Grid sizes of 10 and above (FR-18) are not offered; the size choice is not remembered (TC-12).
- FR-55 (a bilingual page with a language switch) is Future: the page text is Ukrainian only.
- FR-56 (English hint sentences) is Future: hint sentences are Ukrainian only.
- The page does not restate or re-implement rule checking, solving, generation or hint selection; it only displays engine results (see `openspec/specs/puzzle-engine/spec.md`).
- The page does not validate an injected seed: the generator rejects one outside 0 to 2147483647 (FR-51), and what the page does with that error at mount or on the new puzzle button is not asserted by any scenario (on a size change any generator error keeps the previous board, and that is asserted). This spec pins the domain of the page's own default seeds only (integers from 0 to 2^31 - 1).
