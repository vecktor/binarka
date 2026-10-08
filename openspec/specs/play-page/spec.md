# play-page Specification

## Purpose

The play page is the single static page on which a player solves a Takuzu (Бінарка) puzzle. It renders a generated puzzle as a grid of focusable grid cells that the player operates with the mouse or the keyboard, rather than plain clickable cells, marks the givens, highlights rule violations as the player fills the board, offers a grid size selector (4×4, 6×6, 8×8; 6×6 at start), a hint button and a new-puzzle button, and shows a Ukrainian win message when the board is solved. The page is keyboard-operable and exposes grid roles, Ukrainian accessible names and states, and status regions for its two messages, so that it meets WCAG 2.2 AA for what FR-59 to FR-65 cover (NFR-9). The page is vanilla TypeScript DOM code (`src/main.ts`, `src/ui/`) tested in jsdom with Vitest. It only consumes the engine described in `openspec/specs/puzzle-engine/spec.md` (generator, rule checker, hint engine); what counts as a violation, as solved, or as a hint is defined there and is not restated here.

Ownership: this capability owns FR-31 to FR-43 and FR-59 to FR-65, and NFR-9. It traces NFR-5 only for the text the page itself shows (labels, buttons, size options, win message, heading, page title) and for the accessible names it gives (the board, the cells and the size label). NFR-5 is shared by design with `puzzle-engine`, which owns the hint sentences and CLI errors; the page only displays hint sentences and never restates them. NFR-5 is therefore a shared, per-text-owner requirement and not a double-owned or unowned one.

## DOM contract used by the scenarios

Scenarios are decided from the DOM only (text content, classes, data attributes, element presence, roles and ARIA attributes, `tabindex`, `document.activeElement`, and computed style in jsdom), and, for FR-64 and FR-65, from the parsed text of `src/ui/style.css`. Indices are 1-based, matching the rows and columns shown to the player. The engine interface (`openspec/specs/puzzle-engine/spec.md`, test conventions) is 0-based, so a hint target with `row` r and `col` c is the cell with `data-row` = r + 1 and `data-col` = c + 1. The «» guillemets around labels and messages in this spec are quoting marks and are not part of the text. The apostrophe in «розв'язано» is the ASCII apostrophe U+0027 (as in FR-41); an equality check on the win message compares against that codepoint exactly.

### Mount entry point and fixtures (spec-made contract)

FR-31 to FR-43 and A-4 only require that the seed is injectable. The following entry point is a contract chosen by this spec so scenarios can be written test-first; the change design may rename it only together with this spec.

- Entry point: `mountPlayPage(root: HTMLElement, options?: { seedSource?: () => number; generate?: (size: number, seed: number) => Puzzle }): void`, exported from `src/ui/`. `Puzzle` is the type the engine generator returns (engine interface in `openspec/specs/puzzle-engine/spec.md`). `src/main.ts` calls it with the `#app` element and no options.
- Mounting is synchronous: when the call returns, the board, the size selector, buttons and both message regions are in `root`, and so is the label that wraps the size selector. It replaces the previous content of `root`. Two mounts on two different roots are independent.
- Seed source: a synchronous function with no arguments that returns an integer. The page calls it exactly once for each generation attempt (the mount, each press of the new puzzle button and each accepted size change, including an attempt whose generator call throws) and at no other time, and passes the returned value to the generator unchanged. When no `seedSource` is injected the page uses its own default source (see the seed requirement).
- Generator: when `generate` is not injected the page uses the engine generator. A scenario that says "fixture puzzle" injects a hand-written puzzle through `generate` (a fixture of the requested size; the page assumes `generate(n, s)` returns an n×n puzzle); its givens, and its solution where a scenario needs one, are written in the test suite so that the board state a scenario needs can be reached by clicks. A scenario that says "the generator output for size N and seed S" uses the real engine generator with no injection of `generate`. The rule checker and the hint engine are always the real engine; an "expected hint" in a scenario is the engine hint function applied to the board as read from the DOM.
- Unless a scenario names a seed, its board is a fixture puzzle; a scenario that says real engine generator uses it without naming a seed.

- Board element: `[data-board]`, with `data-size` holding N, `role="grid"` and the `aria-label` «Поле N×N». Its children are N elements with `role="row"`, each holding the N cells of one board row in column order; cells are not direct children of `[data-board]`.
- Cell element: `[data-cell]` with `data-row`, `data-col`, and `data-given` equal to `true` for a given and `false` otherwise. A given also carries the class `cell-given`. A cell's shown text is empty, `0` or `1`. Every cell has `role="gridcell"`, a `tabindex` (exactly one cell of the board `0`, every other cell `-1`) and the `aria-label` «Рядок R, стовпець C: V», with V equal to «порожня», `0` or `1`; a given has `aria-readonly="true"` and no other cell has that attribute.
- Highlighted cell: carries the class `cell-violation` and `aria-invalid="true"`; the attribute is absent on every other cell.
- Size selector: `[data-control="size"]`, a select with options 4, 6 and 8 labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8», wrapped in a `label` with the class `size-label` whose text «Розмір поля» sits in a `span` with the class `size-label-text`.
- Buttons: `[data-action="hint"]` (label «Підказка») and `[data-action="new"]` (label «Нова головоломка»).
- Message regions: `[data-message="hint"]` and `[data-message="win"]`, always present, each with `role="status"`; empty text content means no message is shown.
- Page root: the `root` passed to `mountPlayPage`. The page heading is not required by any FR; if present it is inside the root, and the document title is `document.title`.
- No `id` attributes: the page puts no `id` on any descendant of the root.
- Key events: when a scenario says the test dispatches a key or the player presses one, the test fires a bubbling, cancelable `keydown` event (`new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })`, with `ctrlKey`, `altKey` or `shiftKey` set when the scenario names them) on the named element. Keys are named by their `key` value: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Enter`, and a single space for Space; Ctrl+Home is `key` `Home` with `ctrlKey` true.

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

The page SHALL ignore clicks, Enter and Space on a given cell as far as the board is concerned: its text, its `data-given` value, its classes and the highlight state of every cell stay unchanged, both message regions keep their text and no error is shown. Only the Tab stop and DOM focus may move: a click on a given cell moves them to that cell (FR-60), while Enter and Space on a given cell move nothing and are prevented so that Space does not scroll the page.

Traces: FR-33, FR-60

#### Scenario: Clicking a given cell changes nothing

- **GIVEN** a rendered board with a given cell showing `1`
- **WHEN** the player clicks that cell once, and then twice more
- **THEN** the cell still shows `1` and still has `data-given="true"` and the class `cell-given`
- **AND** no other cell changed text or class, and both message regions have unchanged text

#### Scenario: Clicking a given does not clear a message

- **GIVEN** a board where the hint message region shows a sentence
- **WHEN** the player clicks a given cell
- **THEN** the hint message region keeps the same text

#### Scenario: A click on a given moves only the Tab stop and the focus

- **GIVEN** a rendered board with a given cell at row 1 column 3 showing `0`, a hint sentence shown and some cells with `cell-violation`, and the Tab stop at another cell
- **WHEN** the player clicks that given cell
- **THEN** it is the only cell with `tabindex="0"` and is `document.activeElement`
- **AND** every cell keeps its text, `data-given` and classes, and both message regions keep their text

#### Scenario: Enter and Space on a given cell change nothing

- **GIVEN** a rendered board with a given cell showing `1`, a hint sentence shown, and some cells with `cell-violation`
- **WHEN** the test dispatches Enter and then a space `keydown` on the given cell
- **THEN** the cell still shows `1` and has `data-given="true"` and the class `cell-given`
- **AND** no other cell changed text or class, both message regions keep their text, both events have `defaultPrevented` true, and `document.activeElement` and the Tab stop are as before

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

The page SHALL recompute the highlighted cells after every board change (a cell click on a non-given cell, Enter or Space on a non-given cell, a hint fill, a new puzzle, a size change), so that a broken rule is highlighted at once and its highlight is removed as soon as the rule is no longer broken.

Traces: FR-38, FR-43, FR-60

#### Scenario: Highlight appears immediately

- **GIVEN** a board with no `cell-violation` cell and two adjacent `0` with a non-given empty neighbour
- **WHEN** the player clicks the neighbour so it shows `0`
- **THEN** in the same click handling (no further user action), the three cells have `cell-violation`

#### Scenario: Highlight appears immediately after Enter or Space

- **GIVEN** a board with no `cell-violation` cell and two adjacent `0` with a non-given empty neighbour
- **WHEN** the test dispatches Enter on the neighbour so it shows `0`, then Enter and Enter again (empty), then a space `keydown` so it shows `0`
- **THEN** in the same key handling (no further user action), the three cells have `cell-violation` after the first and the fourth press, and no cell has it after the third

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

The page SHALL show all of its own text (heading if any, labels including the visible size label «Розмір поля», buttons, size selector option labels, the win message, `document.title` and any user-visible attribute such as `aria-label`, `title`, `placeholder`, `alt` and the `label` attribute of `option` and `optgroup` elements, which a browser shows instead of the option text) in Ukrainian: each such text contains Cyrillic letters and no Latin letters. The accessible names of the board («Поле N×N») and of every cell («Рядок R, стовпець C: V») are page text and follow the same rule (FR-61). The digits and the sign × inside an option label such as «Поле 4×4» are not Latin letters. The digits shown in the cells of the board are puzzle content, not page text, and are not collected. Hint sentences are owned by the puzzle-engine capability and are only displayed here.

Traces: NFR-5, FR-43, FR-61, FR-62

#### Scenario: Static page text

- **GIVEN** the page has just been mounted
- **WHEN** the test collects every non-whitespace text node under the page root (including the buttons, the size selector options and any heading, label or footer, but not the text of `[data-cell]` elements, which is puzzle content), `document.title`, and the values of the attributes `aria-label`, `title`, `placeholder` and `alt` on every element in the root and of the attribute `label` on every `option` and `optgroup` element; `data-*` attributes, `class` and option `value` attributes are not user-visible and are not collected
- **THEN** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`
- **AND** the collected texts include «Поле 4×4», «Поле 6×6» and «Поле 8×8»
- **AND** the collected texts include «Розмір поля», the board name «Поле 6×6» as an `aria-label` value, and the 36 cell names

#### Scenario: Accessible names at every size

- **GIVEN** a mounted page on which the player selects 4×4, then 8×8
- **WHEN** the test collects the `aria-label` of `[data-board]` and of every cell after each board is shown
- **THEN** the board names are «Поле 4×4» and «Поле 8×8», each cell name matches `/^Рядок [1-8], стовпець [1-8]: (порожня|0|1)$/`, and every collected name contains Cyrillic letters and no Latin letters

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

### Requirement: The board is a single Tab stop

The page SHALL keep exactly one `[data-cell]` of the board shown at `tabindex="0"` and every other cell at `tabindex="-1"` at all times (a roving tabindex), and SHALL put no `tabindex` attribute on the board, on the rows or on either message region (FR-59). The Tab stop follows focus: a `focusin` listener on the board makes the cell that receives DOM focus, by whatever means (a click, a key, a `focus()` call), the Tab stop. The Tab stop SHALL be the cell with `data-row="1"` and `data-col="1"` whenever a board is first shown: at mount, after the new puzzle button, and after an accepted size change. Showing a board SHALL NOT move DOM focus (the page never calls `focus()` while it builds a board). A size change or a new puzzle whose generation fails keeps the previous board and its Tab stop (see Grid size selector). A hint, whether or not it fills a cell, leaves both the Tab stop and DOM focus where they were (the hint button keeps focus). Cycling a cell (FR-60) leaves the Tab stop where it was. No element of the page has a positive `tabindex`.

Traces: FR-59, FR-43

#### Scenario: Exactly one Tab stop at mount

- **GIVEN** the page is mounted on a fixture puzzle (6x6)
- **WHEN** the test reads the `tabindex` attribute of every `[data-cell]`
- **THEN** exactly one of the 36 cells has `tabindex="0"`, it is the cell with `data-row="1"` and `data-col="1"`, and the other 35 have `tabindex="-1"`
- **AND** `[data-board]`, every `[role="row"]`, `[data-message="hint"]` and `[data-message="win"]` have no `tabindex` attribute
- **AND** no element in the root has a `tabindex` greater than 0

#### Scenario: A new puzzle resets the Tab stop and does not move focus

- **GIVEN** a mounted page on which a click has moved the Tab stop to the cell at `data-row="3"` and `data-col="4"`, and the test has given DOM focus to `[data-action="new"]`
- **WHEN** the player presses `[data-action="new"]`
- **THEN** exactly one cell of the new board has `tabindex="0"`, it is the cell at `data-row="1"` and `data-col="1"`, and the other cells have `tabindex="-1"`
- **AND** `document.activeElement` is still `[data-action="new"]`

#### Scenario: A size change resets the Tab stop and does not move focus

- **GIVEN** a mounted 6x6 page and the test has given DOM focus to `[data-control="size"]`
- **WHEN** the player selects 8×8
- **THEN** exactly one of the 64 cells has `tabindex="0"`, it is the cell at `data-row="1"` and `data-col="1"`, and `document.activeElement` is still `[data-control="size"]`

#### Scenario: A failed size change keeps the Tab stop

- **GIVEN** a mounted 6x6 fixture page on which a click has moved the Tab stop to the cell at `data-row="2"` and `data-col="2"`, and an injected `generate` that throws for size 8
- **WHEN** the player selects 8×8
- **THEN** the same cell element still has `tabindex="0"` and every other cell has `tabindex="-1"`

#### Scenario: A hint fill leaves the Tab stop and the focus

- **GIVEN** the fixture `PAIR_ROW` (givens `0` at `data-row="3"` with `data-col` 1 and 2, so the hint fills the cell at `data-row="3"` and `data-col="3"`), the Tab stop at the cell at `data-row="1"` and `data-col="1"`, and the test has given DOM focus to `[data-action="hint"]`
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell at `data-row="3"` and `data-col="3"` shows `1`, the cell at `data-row="1"` and `data-col="1"` is still the only cell with `tabindex="0"`
- **AND** `document.activeElement` is still `[data-action="hint"]`

#### Scenario: Focus makes a cell the Tab stop

- **GIVEN** a mounted 6x6 page whose Tab stop is the cell at row 1 column 1
- **WHEN** the test calls `focus()` on the cell at row 4 column 2 (no click and no key), and then on the cell at row 6 column 6
- **THEN** after each call that cell is `document.activeElement` and the only cell with `tabindex="0"`

#### Scenario: A hint that fills nothing leaves the Tab stop

- **GIVEN** a fixture board on which the hint engine returns `kind` `none` (the fixture `ISOLATED`), with the Tab stop at the cell at `data-row="1"` and `data-col="1"`
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell at `data-row="1"` and `data-col="1"` still has `tabindex="0"` and exactly one cell has `tabindex="0"`, and every cell has the text it had before

#### Scenario: Cycling a cell leaves the Tab stop

- **GIVEN** a mounted page with the Tab stop at the cell at `data-row="1"` and `data-col="1"`
- **WHEN** the player presses Enter on the cell at `data-row="1"` and `data-col="1"`
- **THEN** that cell shows `0` and still has `tabindex="0"`, and exactly one cell has `tabindex="0"`

### Requirement: Arrow, Home and End keys move the focus

The page SHALL, on a `keydown` whose target is inside a `[data-cell]`, move DOM focus and the Tab stop as follows, computed from the cell that is the event target and not from remembered state (FR-59): ArrowUp, ArrowDown, ArrowLeft and ArrowRight move to the adjacent cell in that direction and stop at the edges of the board (no wrapping: ArrowLeft in column 1, ArrowRight in the last column, ArrowUp in row 1 and ArrowDown in the last row leave focus where it is); Home moves to the first cell (`data-col="1"`) of the row of the target and End to the last cell of that row; Ctrl+Home moves to the first cell of the board (`data-row="1"`, `data-col="1"`) and Ctrl+End to the last cell (`data-row` and `data-col` equal to N). Moving means that `focus()` is called on the destination cell, so that, by the board's `focusin` rule, the destination becomes the single cell with `tabindex="0"` and the cell left gets `tabindex="-1"`. Arrow, Home and End keys do not change the content of any cell. These keys are handled only without Alt and Shift, and Ctrl only changes the meaning of Home and End: Ctrl+Arrow, Shift+Arrow, Alt+Arrow, Alt+Home and Shift+Home are not handled. Combinations with Meta are not specified: Meta+Home and Meta+End are not required (FR-59 names Ctrl only) and no scenario asserts what the page does with them. The page SHALL call `preventDefault()` on every handled key press, including a press that moves nothing because the focus is already at an edge or at the target, so the browser does not scroll the page, and SHALL NOT call it for any key it does not handle (Tab, Shift+Tab, PageUp, PageDown, Escape, letters and every modified combination listed above), so keyboard users are never trapped. PageUp and PageDown are not required and are not handled. The scenarios dispatch a bubbling, cancelable `keydown` `KeyboardEvent` on a cell, with `key` equal to `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Tab` or `PageDown`, and read `event.defaultPrevented` after the dispatch (an event that is not cancelable cannot show a `preventDefault()` call).

Traces: FR-59

#### Scenario: Arrow keys move one cell

- **GIVEN** a mounted 6x6 page and the cell at `data-row="3"` and `data-col="3"` has DOM focus
- **WHEN** the test dispatches ArrowRight, then ArrowDown, then ArrowLeft, then ArrowUp, each on the cell that currently has focus
- **THEN** after each key `document.activeElement` is, in order, the cell at row 3 column 4, row 4 column 4, row 4 column 3, row 3 column 3
- **AND** after each key that cell is the only cell with `tabindex="0"`, and every dispatched event has `defaultPrevented` true

#### Scenario: Arrow keys stop at the edges

- **GIVEN** a mounted 6x6 page
- **WHEN** the test gives DOM focus to a cell and dispatches the key on it, for each of these pairs: ArrowUp and ArrowLeft on row 1 column 1, ArrowUp on row 1 column 6, ArrowRight on row 3 column 6, ArrowDown and ArrowRight on row 6 column 6, ArrowDown on row 6 column 1
- **THEN** after each key `document.activeElement` is still that same cell (no wrapping to the opposite edge) and it is the only cell with `tabindex="0"`
- **AND** every dispatched event has `defaultPrevented` true

#### Scenario: Home and End move within the row

- **GIVEN** a mounted 6x6 page and the cell at row 3 column 4 has DOM focus
- **WHEN** the test dispatches Home on it, and then End on the cell that has focus
- **THEN** after Home the focused cell is row 3 column 1, after End it is row 3 column 6, and each is the only cell with `tabindex="0"`
- **AND** Home on the cell at row 3 column 1 and End on the cell at row 3 column 6 leave the focus and the Tab stop where they are and have `defaultPrevented` true

#### Scenario: Ctrl+Home and Ctrl+End move to the first and last cell of the board

- **GIVEN** a mounted board of each size 4, 6 and 8 and the cell at row 2 column 3 has DOM focus
- **WHEN** the test dispatches Ctrl+End (`key` `End`, `ctrlKey` true) and then Ctrl+Home (`key` `Home`, `ctrlKey` true) on the cell that has focus
- **THEN** after Ctrl+End the focused cell is the one with `data-row` and `data-col` equal to N, and after Ctrl+Home it is the one at row 1 column 1; each is the only cell with `tabindex="0"` and each event has `defaultPrevented` true

#### Scenario: Keys on a given cell navigate and change nothing

- **GIVEN** a mounted board whose cell at row 1 column 3 is a given showing `0` and has DOM focus
- **WHEN** the test dispatches ArrowDown, then ArrowUp, then End, then Home
- **THEN** no cell changes its text, its `data-given` or its classes, and the focus moves as the arrow, End and Home rules say

#### Scenario: The position comes from the event target

- **GIVEN** a mounted 6x6 page whose Tab stop is the cell at row 1 column 1
- **WHEN** the test dispatches ArrowRight on the cell at row 5 column 2 (a cell that is not the Tab stop)
- **THEN** the cell at row 5 column 3 has focus and is the only cell with `tabindex="0"`

#### Scenario: Modified keys are not handled

- **GIVEN** a mounted 6x6 page and the cell at row 3 column 3 has DOM focus and `tabindex="0"`
- **WHEN** the test dispatches ArrowRight with `ctrlKey`, ArrowRight with `shiftKey`, ArrowRight with `altKey`, Home with `altKey` and Home with `shiftKey`, each on that cell
- **THEN** the cell at row 3 column 3 keeps focus and its `tabindex="0"`, and every dispatched event has `defaultPrevented` false

#### Scenario: Keys the board does not handle are not prevented

- **GIVEN** a mounted 6x6 page and the cell at row 3 column 3 has DOM focus
- **WHEN** the test dispatches Tab, Shift+Tab, PageDown, PageUp and Escape on it
- **THEN** every dispatched event has `defaultPrevented` false and the focus and the Tab stop stay on that cell

### Requirement: Enter and Space cycle the focused cell and a click moves the Tab stop

The page SHALL, on a `keydown` with `key` equal to `Enter` or to a single space, with none of Ctrl, Alt and Shift pressed, whose target is inside a `[data-cell]`, cycle that cell exactly as a click on it does (FR-60): the same function is called by the click handler and by the key handler, so the cell text, its accessible name, the highlights and the win message are recomputed identically, and the hint message keeps its text. When the cell is a given, Enter and Space SHALL change nothing (no text, `data-given`, class, highlight or message changes and no error). Enter and Space are handled keys on every cell, given or not: the page SHALL call `preventDefault()` on them so that Space does not scroll the page. A `keydown` with `repeat` true is handled (default prevented) but does not cycle the cell, so holding a key cycles at most once. Enter and Space with Ctrl, Alt or Shift are not handled and not prevented (combinations with Meta are not specified and no scenario asserts them). Enter and Space do not move DOM focus. A click on any cell, a given included, SHALL move the Tab stop to the clicked cell (it becomes the single cell with `tabindex="0"`) and call `focus()` on it, and then, for a non-given cell, cycle it as FR-34 says. A click on a given leaves its text, `data-given`, classes, all highlights and both messages unchanged (FR-33; see "Given cells are locked"), and only the Tab stop and the focus move.

Traces: FR-60, FR-33, FR-34

#### Scenario: Enter cycles a player cell

- **GIVEN** a rendered board with an empty non-given cell
- **WHEN** the test dispatches Enter on it once, twice and three times
- **THEN** its text content is `0` after the first press, `1` after the second and empty after the third, and each event has `defaultPrevented` true

#### Scenario: Space cycles a player cell

- **GIVEN** a rendered board with an empty non-given cell
- **WHEN** the test dispatches `keydown` with `key` equal to a single space on it once, twice and three times
- **THEN** its text content is `0`, then `1`, then empty, and each event has `defaultPrevented` true

#### Scenario: Keys and clicks give the same board

- **GIVEN** two pages mounted on the same fixture puzzle with the same seed source
- **WHEN** the same sequence of cells is cycled on page A with Enter or Space presses and on page B with clicks (including a press that completes three equal digits side by side, a press on a given, and presses that bring the board to the solution)
- **THEN** after each step both pages have equal cell texts, `data-given` values, class lists, `aria-label` values, `aria-invalid` presence, and equal texts in both message regions

#### Scenario: A held key cycles once

- **GIVEN** a rendered board with an empty non-given cell
- **WHEN** the test dispatches an Enter `keydown` with `repeat` false and then three Enter `keydown` events with `repeat` true
- **THEN** the cell shows `0` and all four events have `defaultPrevented` true

#### Scenario: Modified Enter and Space are not handled

- **GIVEN** a rendered board with an empty non-given cell
- **WHEN** the test dispatches Enter with `ctrlKey`, Enter with `altKey`, Enter with `shiftKey` and a space with `ctrlKey`
- **THEN** the cell is still empty and every event has `defaultPrevented` false

#### Scenario: Keyboard play reaches the win message

- **GIVEN** a fixture puzzle whose solution the test knows, with every cell holding the solution except one non-given cell that shows another value
- **WHEN** the test dispatches Enter on that cell until it shows the solution digit
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розв'язано!» (apostrophe U+0027), and three equal digits made with Enter presses carry `cell-violation` exactly as with clicks

#### Scenario: A click moves the Tab stop and the focus to a player cell

- **GIVEN** a mounted 6x6 page with the Tab stop at the cell at row 1 column 1
- **WHEN** the player clicks the non-given cell at row 4 column 2
- **THEN** that cell shows `0`, is the only cell with `tabindex="0"`, and is `document.activeElement`

#### Scenario: Enter and Space do not move the focus

- **GIVEN** a mounted page in which the cell at row 2 column 2 has DOM focus
- **WHEN** the test dispatches Enter and then a space `keydown` on the cell at row 5 column 5, a cell that does not have focus
- **THEN** the cell at row 5 column 5 changed (`0`, then `1`) and `document.activeElement` is still the cell at row 2 column 2

### Requirement: The board, rows and cells have grid roles

The page SHALL give `[data-board]` `role="grid"` and the Ukrainian `aria-label` «Поле N×N» for the size N of the board shown (digits and the sign × U+00D7, no Latin letters), SHALL build N elements with `role="row"` inside it, each holding exactly the N cells of one board row in column order, and SHALL give every `[data-cell]` `role="gridcell"` (FR-61). Every cell is a descendant of a row element and a row element is a child of the board; the cells are not direct children of the board. The attributes and classes of the DOM contract on cells (`data-cell`, `data-row`, `data-col`, `data-given`, `cell-given`, `cell-violation`) are unchanged. The page SHALL NOT put an `id` attribute on any descendant of its root (the root element itself may have one, as `#app` does in `index.html`), so that two independent mounts in one document never produce duplicate ids. The stylesheet SHALL NOT use `display: contents` on any rule, because that has a history of dropping row semantics from the accessibility tree.

Traces: FR-61, FR-43

#### Scenario: Roles and name of the default board

- **GIVEN** the page is mounted with the default size
- **WHEN** the test reads `[data-board]`
- **THEN** it has `role="grid"` and `aria-label` equal to «Поле 6×6»
- **AND** it has exactly 6 children, each with `role="row"`, each holding exactly 6 `[data-cell]` elements with `role="gridcell"`
- **AND** the cells of the child number r all have `data-row` equal to r and have `data-col` 1 to 6 in document order

#### Scenario: The grid name follows the size

- **GIVEN** a mounted page with the real engine generator
- **WHEN** the player selects 4×4 and then 8×8
- **THEN** after 4×4 the board has `aria-label` «Поле 4×4», 4 rows of 4 cells; after 8×8 it has «Поле 8×8», 8 rows of 8 cells

#### Scenario: A failed size change keeps the grid and its name

- **GIVEN** a 6x6 fixture page and an injected `generate` that throws for size 8
- **WHEN** the player selects 8×8
- **THEN** the board keeps `aria-label` «Поле 6×6» and its 6 rows of 6 cells

#### Scenario: The cell contract is unchanged and there are no ids

- **GIVEN** a rendered board
- **WHEN** the test reads every cell and every element of the root
- **THEN** every cell still has `data-cell`, `data-row`, `data-col` and `data-given`, `cell-given` exactly on the givens, and the text content empty, `0` or `1`
- **AND** no descendant of the root has an `id` attribute, and two pages mounted on two roots in one document have no duplicate id

#### Scenario: Rows are not removed from the accessibility tree

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches it for `display: contents` (any spacing)
- **THEN** there is no match

### Requirement: Cells expose a Ukrainian name and their state

The page SHALL give every `[data-cell]` an `aria-label` of the form «Рядок R, стовпець C: V», with R the 1-based row and C the 1-based column (the values of `data-row` and `data-col`) and V equal to «порожня» for an empty cell, `0` for a cell showing 0 and `1` for a cell showing 1, for example «Рядок 2, стовпець 3: порожня» (FR-61). The name SHALL be rewritten whenever the cell's value changes (a click, Enter or Space, a hint fill, a new board) so it always matches the cell's text content, which stays empty, `0` or `1` (FR-34). The page SHALL set `aria-readonly="true"` on every given cell and SHALL NOT set the attribute on any other cell. The page SHALL set `aria-invalid="true"` on exactly the cells that carry the class `cell-violation` (the same set, including every cell of a line highlighted for too many of one digit) and SHALL remove the attribute from every other cell, with the attribute absent rather than `"false"`. A given cell in a violation carries both attributes.

Traces: FR-61, FR-35, FR-36, FR-37, FR-38

#### Scenario: Names of a fresh board

- **GIVEN** a 6x6 fixture board whose only givens are `0` at row 3 columns 1 and 2
- **WHEN** the test reads `aria-label` of the cells at row 2 column 3, row 3 column 1 and row 6 column 6
- **THEN** they are «Рядок 2, стовпець 3: порожня», «Рядок 3, стовпець 1: 0» and «Рядок 6, стовпець 6: порожня»
- **AND** for every cell the name equals «Рядок R, стовпець C: V» built from its `data-row`, `data-col` and text content

#### Scenario: The name follows a click, a key and a hint

- **GIVEN** a rendered board with an empty non-given cell at row 2 column 3
- **WHEN** the player clicks it, then presses Enter on it, then presses Space on it
- **THEN** its `aria-label` is «Рядок 2, стовпець 3: 0», then «Рядок 2, стовпець 3: 1», then «Рядок 2, стовпець 3: порожня»
- **AND** after a hint press that fills a cell, that cell's `aria-label` ends with `0` or `1` matching the filled digit

#### Scenario: A new board has fresh names

- **GIVEN** a board with player entries
- **WHEN** the player presses the new puzzle button or selects another size
- **THEN** for every cell of the new board the `aria-label` equals «Рядок R, стовпець C: V» for the new cell's position and text

#### Scenario: Givens are read-only and other cells are not

- **GIVEN** a rendered board with givens and player cells
- **WHEN** the test reads `aria-readonly` of every cell
- **THEN** it is `"true"` on every cell with `data-given="true"` and the attribute is absent on every other cell, also after a click or a hint fill that fills a player cell

#### Scenario: A violation is exposed to assistive technology

- **GIVEN** a rendered board in which two adjacent cells show `0` and the next cell is an empty non-given cell, and no cell has `cell-violation`
- **WHEN** the player clicks that cell once so it shows `0`
- **THEN** the three cells of the run have the class `cell-violation` and `aria-invalid="true"`
- **AND** no other cell has the attribute `aria-invalid`

#### Scenario: The invalid state is removed with the highlight

- **GIVEN** a board where exactly three cells carry `cell-violation` and `aria-invalid="true"`
- **WHEN** the player clicks the third cell until it shows empty
- **THEN** no cell has `cell-violation` and no cell has the attribute `aria-invalid`

#### Scenario: A line with too many of one digit is invalid as a whole

- **GIVEN** a rendered 6x6 board on which the player places a fourth `0` in one row, with no three equal digits side by side and no other rule broken
- **WHEN** the fourth `0` is placed
- **THEN** all six cells of that row have `cell-violation` and `aria-invalid="true"`, and no cell outside the row has `aria-invalid`

#### Scenario: Violating givens are invalid at once

- **GIVEN** the fixture `DIRTY_GIVENS` (givens `0` at row 1 columns 1 to 3)
- **WHEN** the page has just been mounted
- **THEN** exactly the cells at row 1 columns 1 to 3 have `aria-invalid="true"`, and each of them also has `aria-readonly="true"`

### Requirement: The size selector has a visible Ukrainian label

The page SHALL wrap the size select `[data-control="size"]` in a `label` element with the class `size-label` whose own text, that is the text of the label without the text of the select element and its options, is exactly «Розмір поля» after trimming and collapsing whitespace (the text sits in a `span` with the class `size-label-text`), so that `select.labels` holds that label (FR-62). The label SHALL be visible: neither the label nor any ancestor inside the root has the `hidden` attribute or `aria-hidden`; the computed `display` of the label and of its `span` is not `none` and their computed `visibility` is not `hidden` or `collapse`; no declaration in a rule whose selector contains `size-label` hides it (`display: none`, `visibility: hidden` or `collapse`, `opacity: 0`, `clip`, `clip-path`, `font-size: 0`); and the rule `.size-label` declares a `gap` of at least 4px, so the text does not touch the select. The label is associated without `id` and `for` attributes, so two mounts in one document each label their own select. The select SHALL NOT carry an `aria-label` or `aria-labelledby` attribute. The select keeps `[data-control="size"]`, its options and its behaviour (Grid size selector).

Traces: FR-62, FR-43, NFR-5

#### Scenario: The select is labelled

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `select.labels` of `[data-control="size"]`
- **THEN** it holds exactly one `label` element, which contains the select
- **AND** the text of that label without the select's subtree is «Розмір поля», it has Cyrillic letters and no Latin letters, and neither the label nor an ancestor in the root has `hidden` or `aria-hidden`

#### Scenario: The label is visible and apart from the select

- **GIVEN** the text of `src/ui/style.css` with every `var(--color-x)` replaced by its `:root` value, injected into a `<style>` element of the jsdom document, and a mounted page
- **WHEN** the test reads `getComputedStyle` of the `label.size-label` and of its `span.size-label-text`, and every declaration, anywhere in the file, of the rules whose selector contains `size-label`
- **THEN** the computed `display` of both is not `none` and their computed `visibility` is neither `hidden` nor `collapse`
- **AND** no such declaration hides the label (`display: none`, `visibility: hidden` or `collapse`, `opacity: 0`, `clip`, `clip-path`, `font-size: 0`) and the `.size-label` rule declares a `gap` of at least 4px

#### Scenario: Two mounts label their own selects

- **GIVEN** two pages mounted on two roots in one document
- **WHEN** the test reads `select.labels[0]` for the select of each page
- **THEN** each label is inside its own page's root, and no descendant of either root has an `id` or a `for` attribute

#### Scenario: The label does not break the selector

- **GIVEN** a mounted page
- **WHEN** the test reads the selector as in "Selector options and default" and then the player selects 4×4
- **THEN** it still is a `select` with the options `4`, `6`, `8` labelled «Поле 4×4», «Поле 6×6», «Поле 8×8», the value `6` at mount and `4` after the change, and the select has neither `aria-label` nor `aria-labelledby`

### Requirement: The hint and win messages are status regions

The page SHALL give `[data-message="hint"]` and `[data-message="win"]` `role="status"`, SHALL have both elements in the root from the first render with empty text content until they have a message, and SHALL change only their text content afterwards: the same two elements stay in the page across hint presses, new puzzles, size changes and wins (a live region that is replaced is not announced) (FR-63). The page SHALL NOT move DOM focus to either region, and SHALL NOT give them a `tabindex`. There are exactly two elements with `role="status"` in the page. The announcement itself is a screen-reader behaviour that is not tested (A-28).

Traces: FR-63, FR-40, FR-41

#### Scenario: Present, empty and typed at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-message="hint"]` and `[data-message="win"]`
- **THEN** both exist, have `role="status"`, have empty text content and no `tabindex` attribute
- **AND** the root holds exactly two elements with `role="status"`

#### Scenario: The same elements carry every message

- **GIVEN** a mounted page, with the two region elements remembered by the test
- **WHEN** the player presses the hint button, then clicks a cell, then presses the new puzzle button, then selects 4×4, then solves a fixture board so the win message shows
- **THEN** after each step `[data-message="hint"]` and `[data-message="win"]` are the same element objects as at mount, still connected to the root, still `role="status"`, and the hint region shows the engine sentence and the win region shows «Вітаємо, головоломку розв'язано!» when the earlier requirements say so

#### Scenario: Focus never moves to a message

- **GIVEN** a mounted page where the test gave DOM focus to `[data-action="hint"]`
- **WHEN** the player presses the hint button and the hint text appears
- **THEN** `document.activeElement` is still `[data-action="hint"]` and is not a status region
- **AND** on a fixture board whose single hint fill solves it, after that hint press the win message appears and `document.activeElement` is still `[data-action="hint"]`

#### Scenario: A click that wins leaves the focus on the clicked cell

- **GIVEN** a fixture board with every cell holding the solution except one non-given cell, and no status region has focus
- **WHEN** the player clicks that cell until it shows the solution digit and the win message appears
- **THEN** `document.activeElement` is the clicked cell (FR-60 moves focus to a clicked cell), not a status region

### Requirement: A violation shows a cue besides colour

The stylesheet `src/ui/style.css` SHALL draw a cell in a highlighted violation with a heavier border than an ordinary cell, as well as with the violation colours (FR-64): an ordinary cell has a border width of 1px, a given cell 2px and a cell with the class `cell-violation` 3px, so a violation is wider than both. The cascade SHALL give a given cell in a violation the 3px violation border too: the rule for `cell-violation` wins over the rule for `cell-given`, whether by source order or by specificity, and the check measures the computed style, not the order of the rules. The cue is applied through the existing class `cell-violation` (no new class), and `aria-invalid` (Cells expose a Ukrainian name and their state) is its non-visual counterpart.

Traces: FR-64

#### Scenario: The computed border is heavier for a violation at every size

- **GIVEN** the text of `src/ui/style.css` with every `var(--color-x)` replaced by the value of that token in `:root`, injected into a `<style>` element of the jsdom document (jsdom computes the cascade of top-level style rules, specificity included; it does not apply rules inside `@media` or nested rules), and pages mounted at N = 4, 6 and 8, each showing an ordinary cell, a given cell, a violating non-given cell and a given cell in a violation
- **WHEN** the test reads `getComputedStyle(cell).borderTopWidth` of these four cells at each size
- **THEN** the widths are `1px`, `2px`, `3px` and `3px`, in that order, at each of the three sizes

#### Scenario: The cue is not colour-only in the DOM either

- **GIVEN** a board where a click made three equal digits side by side
- **WHEN** the test reads the three cells
- **THEN** each of the three cells has the class `cell-violation` and `aria-invalid="true"`, and no cell without that class has `aria-invalid`

### Requirement: Borders, cues and focus rings have enough contrast

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule with literal `#rrggbb` values, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65). The tokens are `--color-page`, `--color-text`, `--color-cell-bg`, `--color-cell-border`, `--color-given-bg`, `--color-given-border`, `--color-violation-bg`, `--color-violation-border`, `--color-violation-text`, `--color-focus`, `--color-control-bg`, `--color-control-border` and `--color-win-text`. The colour scan applies to every declaration outside a `:root` rule, wherever it is in the file (top level, nested rules, `@media`, `@supports`, `@layer`): its value SHALL NOT match `/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i` and SHALL NOT contain a CSS named colour (the full CSS Color 4 list); the keywords `transparent`, `currentcolor`, `inherit`, `initial`, `unset` and `revert` are allowed because they introduce no colour; the colour-bearing shorthands `background`, `border`, `border-top`, `border-right`, `border-bottom`, `border-left`, `outline`, `box-shadow`, `text-decoration` and `column-rule` are allowed only when their colour is a `var(--color-...)` token (or the value is `none` or `0`); and no `--color-*` property is declared outside a `:root` rule. Selectors such as `#app` are not declaration values and are not affected. The rules `body`, `.cell`, `.cell-given`, `.cell-violation`, `button, select`, `.message-win` and the `:focus-visible` rules SHALL take their `color`, `background-color`, `border-color` and `outline-color` from these tokens, declared with those longhand properties. A `:root` rule inside `@media`, `@supports` or `@layer` may redefine tokens, and then every resulting token set (the top-level set, and the top-level set with each conditional block's overrides applied) SHALL satisfy every pair below. The WCAG 2 contrast ratio, computed from relative luminance, SHALL be at least 3:1 for these pairs: the cell border `--color-cell-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`; the violation cue `--color-violation-border` against `--color-page`, `--color-cell-bg` and `--color-violation-bg`; the given cue against `--color-page`, `--color-cell-bg` and `--color-given-bg`; the focus ring `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-violation-bg`; and the control border `--color-control-border` against `--color-page`. The given cue is the border of a given cell: 2px wide, in `--color-given-border` (the colour of `.cell-given`'s `border-color`), together with the bold digits (`font-weight: 700`); the fill `--color-given-bg` is a redundant decoration and is not the cue, because a pale fill cannot reach 3:1 against the page and the cell colour and keep the digit readable. The text SHALL have at least 4.5:1: `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-control-bg`, `--color-violation-text` against `--color-violation-bg`, and `--color-win-text` against `--color-page`.

Traces: FR-65, FR-64, NFR-9

#### Scenario: Tokens exist and are literal

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` rule
- **THEN** each of the 13 token names listed above is declared once with a `#rrggbb` value

#### Scenario: Rules use the tokens and no colour literal is left

- **GIVEN** every declaration of `src/ui/style.css` outside `:root` rules, found by walking the parsed stylesheet through nested rules and at-rules
- **WHEN** the test applies the colour scan above to each value
- **THEN** none matches the literal pattern or contains a named colour, every colour-bearing shorthand has a `var(--color-...)` colour or the value `none` or `0`, every `color`, `background-color`, `border-color` and `outline-color` value is a single `var(--color-...)` of a declared token or an allowed keyword, and no `--color-*` property is declared outside `:root`
- **AND** `body` declares `background-color` `var(--color-page)` and `color` `var(--color-text)`; `.cell` declares `border-color` `var(--color-cell-border)` and `background-color` `var(--color-cell-bg)`; `.cell-given` declares `border-color` `var(--color-given-border)` and `background-color` `var(--color-given-bg)`; `.cell-violation` declares `border-color` `var(--color-violation-border)`, `background-color` `var(--color-violation-bg)` and `color` `var(--color-violation-text)`

#### Scenario: A token redefined in a conditional block is checked too

- **GIVEN** the top-level token set and every `:root` rule found inside `@media`, `@supports` or `@layer` in `src/ui/style.css`
- **WHEN** the test builds each resulting token set and computes every pair of this requirement for it
- **THEN** every pair of every set meets its threshold (when the file has no such block, only the top-level set exists and the scenario still runs on it)

#### Scenario: Cell borders have 3:1

- **GIVEN** the resolved colours of the tokens
- **WHEN** the test computes the WCAG contrast ratio of `--color-cell-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`
- **THEN** each ratio is at least 3

#### Scenario: The given cue has 3:1 and is not the fill

- **GIVEN** the resolved colours of the tokens and the declarations of `.cell-given`
- **WHEN** the test computes the ratio of `--color-given-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`
- **THEN** each ratio is at least 3
- **AND** `.cell-given` declares `border-width` 2px, `border-color` `var(--color-given-border)` and `font-weight` 700
- **AND** the cue distinguishes a given cell from an ordinary one without the fill: `--color-given-border` differs from `--color-cell-border` and the given `border-width` (2px) is greater than the ordinary one (1px)

#### Scenario: The violation cue has 3:1

- **GIVEN** the resolved colours of the tokens
- **WHEN** the test computes the ratio of `--color-violation-border` against `--color-page`, `--color-cell-bg` and `--color-violation-bg`
- **THEN** each ratio is at least 3

#### Scenario: The focus ring has 3:1 against every cell background

- **GIVEN** the resolved colours of the tokens
- **WHEN** the test computes the ratio of `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-violation-bg`
- **THEN** each ratio is at least 3

#### Scenario: The control border has 3:1 and the text has 4.5:1

- **GIVEN** the resolved colours of the tokens
- **WHEN** the test computes the ratio of `--color-control-border` against `--color-page`, of `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-control-bg`, of `--color-violation-text` against `--color-violation-bg`, and of `--color-win-text` against `--color-page`
- **THEN** the first ratio is at least 3 and the others are at least 4.5

#### Scenario: The cascade gives each cell state the colours whose contrast is checked

- **GIVEN** the injected stylesheet and the four cell kinds at N = 4, 6 and 8 of "The computed border is heavier for a violation at every size", and the token values converted to `rgb(r, g, b)` strings
- **WHEN** the test reads `getComputedStyle(cell)` `borderTopColor`, `backgroundColor` and `color` of each kind
- **THEN** an ordinary cell has `--color-cell-border`, `--color-cell-bg` and `--color-text`; a given cell has `--color-given-border`, `--color-given-bg` and `--color-text`; a violating cell and a given cell in a violation both have `--color-violation-border`, `--color-violation-bg` and `--color-violation-text`
- **AND** the page (`body`) computes `background-color` `--color-page`

#### Scenario: The contrast helper is not vacuous

- **GIVEN** the contrast function of the test helpers
- **WHEN** it is called for `#ffffff` against `#000000`, for `#ffffff` against `#ffffff` and for the pair `#d1d5db` and `#f9fafb`
- **THEN** it returns 21, 1 and a value below 3 respectively

### Requirement: Cells, buttons and the selector show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell`, for `button` and for `select` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`; the `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the 2px gap between cells shows the page colour on the ring's inner side, the ring's outer edge lands on a neighbour's fill (the pairs `--color-focus` against cell, given and violation fills, 6.70, 5.41 and 4.63 with the design's values) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. The `button:focus-visible` and `select:focus-visible` rules SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `:has(` or `!important` (target browsers: Vite 8 build target, `docs/frontend-conventions.md` rule 20). CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all.

Traces: FR-65

#### Scenario: Focus-visible rules exist for all three targets

- **GIVEN** the parsed `src/ui/style.css` (jsdom never matches `:focus-visible`, so these rules are checked as declarations)
- **WHEN** the test looks for the rules whose selector list contains `.cell:focus-visible`, `button:focus-visible` or `select:focus-visible`
- **THEN** each of the three exists, declares `outline-style: solid`, an `outline-width` of at least 2px and `outline-color: var(--color-focus)`

#### Scenario: The cell ring is outside the border and above the neighbours

- **GIVEN** the `.cell:focus-visible` rule
- **WHEN** the test reads its declarations
- **THEN** `outline-offset` is `2px`, `position` is `relative` and `z-index` is an integer of at least 1
- **AND** the `button:focus-visible` and `select:focus-visible` rules declare an `outline-offset` greater than 0

#### Scenario: Nothing removes the outline

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches for `outline: none`, `outline: 0`, `outline-style: none` and `outline-width: 0` (any spacing)
- **THEN** there is no match

#### Scenario: The stylesheet stays inside the build target

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches for `:has(` and `!important`
- **THEN** there is no match

### Requirement: The selector sets its own colours and the board disables double-tap zoom

The stylesheet SHALL set an explicit `color` (`var(--color-text)`) and an explicit `background-color` (`var(--color-control-bg)`) in the rule that styles the size select, so the text colour of the selector does not depend on the browser or the operating system, and SHALL set `touch-action: manipulation` in the rule of the class `board` (FR-65). The element `[data-board]` SHALL carry the class `board`.

Traces: FR-65

#### Scenario: The select declares its colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test merges the declarations of every rule whose selector list contains the plain selector `select` (the rule `button, select` among them)
- **THEN** `color` is `var(--color-text)` and `background-color` is `var(--color-control-bg)`

#### Scenario: The board sets touch-action

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test reads the declarations of the `.board` rule and the classes of `[data-board]`
- **THEN** `touch-action` is `manipulation` and `[data-board]` has the class `board`

### Requirement: The page meets the WCAG 2.2 AA criteria of the accessibility requirements

The page SHALL meet WCAG 2.2 AA for what FR-59 to FR-65 cover (NFR-9): keyboard operation 2.1.1 (Arrow, Home, End, Enter and Space keys and a single Tab stop), name, role and value 4.1.2 (grid, row and gridcell roles, cell names, `aria-readonly`, `aria-invalid`), labels 3.3.2 (the visible «Розмір поля» label), status messages 4.1.3 (the two `role="status"` regions), use of colour 1.4.1 (the heavier violation border and `aria-invalid`), non-text contrast 1.4.11 (the 3:1 pairs) and visible focus 2.4.7 (the `:focus-visible` rules); the focus is also not hidden by neighbouring cells (2.4.11). Every interactive element of the page, that is every button, the select and every gridcell, SHALL have a non-empty accessible name in Ukrainian: the text of the button, the text of the label of the select, the `aria-label` of the gridcell. Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).

Traces: NFR-9, NFR-5, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, FR-65

#### Scenario: Every interactive element has a Ukrainian name

- **GIVEN** a mounted page
- **WHEN** the test computes the accessible name of each `button`, of the select (the label text without the select's subtree), and of each `[role="gridcell"]` (its `aria-label`)
- **THEN** every name is non-empty, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/`
- **AND** the names include «Підказка», «Нова головоломка» and «Розмір поля»

## Exclusions

The following are intentionally unsupported in MVP; testers must not report them as defects.

- No server, no authentication, no accounts, no authorization: every visitor can use the page, so there are no unauthorized or forbidden cases and no redirects.
- No persistence (TC-12): reloading the page starts a fresh puzzle; nothing is stored. No network calls: puzzles are generated in the browser.
- Difficulty grading (FR-44), a timer (FR-45), saved progress (FR-46), undo (FR-47) and a daily puzzle (FR-48) are Future.
- Real-browser tests (NFR-7) are Future; the page is tested in jsdom only (TC-13). Rendering defects that jsdom cannot see are not caught.
- Keyboard play and the roles, names and states screen readers use are MVP requirements (NFR-9, FR-59 to FR-65; A-20 is superseded). Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).
- Three accessibility items the user declined (autonomy-log row 34) are not provided: 44 px phone touch targets (8×8 cells are 41 px wide at 375 px), a confirm or Undo step before progress is discarded, and the puzzle state in the URL.
- PageUp and PageDown are not handled. A repeated identical hint sentence is not announced again.
- Mobile layout and visual polish are not specified (A-14).
- The seed is not shown on the page (A-4).
- Re-selecting the already selected size: browsers fire no `change`, so no scenario asserts it.
- Grid sizes of 10 and above (FR-18) are not offered; the size choice is not remembered (TC-12).
- FR-55 (a bilingual page with a language switch) is Future: the page text is Ukrainian only.
- FR-56 (English hint sentences) is Future: hint sentences are Ukrainian only.
- The page does not restate or re-implement rule checking, solving, generation or hint selection; it only displays engine results (see `openspec/specs/puzzle-engine/spec.md`).
- The page does not validate an injected seed: the generator rejects one outside 0 to 2147483647 (FR-51), and what the page does with that error at mount or on the new puzzle button is not asserted by any scenario (on a size change any generator error keeps the previous board, and that is asserted). This spec pins the domain of the page's own default seeds only (integers from 0 to 2^31 - 1).
