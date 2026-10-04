# play-page Specification

## Purpose

The play page is the single static page on which a player solves a Takuzu (Бінарка) puzzle. It renders a generated puzzle as a grid of clickable cells, marks the givens, highlights rule violations as the player fills the board, offers a hint button and a new-puzzle button, offers a grid size selector, and shows a Ukrainian win message when the board is solved. The page is vanilla TypeScript DOM code (`src/main.ts`, `src/ui/`) tested in jsdom with Vitest. It only consumes the engine described in `openspec/specs/puzzle-engine/spec.md` (generator, rule checker, hint engine); what counts as a violation, as solved, or as a hint is defined there and is not restated here.

Ownership: this capability owns FR-31 to FR-43. It traces NFR-5 only for the text the page itself shows (labels, buttons, size options, win message, heading, page title). NFR-5 is shared by design with `puzzle-engine`, which owns the hint sentences and CLI errors; the page only displays hint sentences and never restates them. NFR-5 is therefore a shared, per-text-owner requirement and not a double-owned or unowned one.

## DOM contract used by the scenarios

Scenarios are decided from the DOM only (text content, classes, data attributes, element presence). Indices are 1-based, matching the rows and columns shown to the player. The «» guillemets around labels and messages in this spec are quoting marks and are not part of the text. The apostrophe in «розв'язано» is the ASCII apostrophe U+0027 (as in FR-41); an equality check on the win message compares against that codepoint exactly.

### Mount entry point and fixtures (spec-made contract)

FR-31 to FR-43 and A-4 only require that the seed is injectable. The following entry point is a contract chosen by this spec so scenarios can be written test-first; the change design may rename it only together with this spec.

- Entry point: `mountPlayPage(root: HTMLElement, options?: { seedSource?: () => number; generate?: (size: number, seed: number) => Puzzle }): void`, exported from `src/ui/`. `Puzzle` is the type the engine generator returns. `src/main.ts` calls it with the `#app` element and no options.
- Mounting is synchronous: when the call returns, the board, buttons, selector and both message regions are in `root`. It replaces the previous content of `root`. Two mounts on two different roots are independent.
- Seed source: a synchronous function with no arguments that returns an integer. The page calls it exactly once for each puzzle it generates (the mount, each press of the new puzzle button, each accepted size change) and at no other time, and passes the returned value to the generator unchanged. When no `seedSource` is injected the page uses its own default source (see the seed requirement).
- Generator: when `generate` is not injected the page uses the engine generator. A scenario that says "fixture puzzle" injects a hand-written puzzle through `generate` (returned whatever the size and seed); its givens, and its solution where a scenario needs one, are written in the test suite so that the board state a scenario needs can be reached by clicks. A scenario that says "the generator output for size N and seed S" uses the real engine generator with no injection of `generate`. The rule checker and the hint engine are always the real engine; an "expected hint" in a scenario is the engine hint function applied to the board as read from the DOM.
- Unless a scenario names a seed, its board is a fixture puzzle.

- Board element: `[data-board]`, with `data-size` holding N.
- Cell element: `[data-cell]` with `data-row`, `data-col`, and `data-given` equal to `true` for a given and `false` otherwise. A given also carries the class `cell-given`. A cell's shown text is empty, `0` or `1`.
- Highlighted cell: carries the class `cell-violation`.
- Buttons: `[data-action="hint"]` (label «Підказка») and `[data-action="new"]` (label «Нова головоломка»).
- Size selector: `[data-control="size"]`, a select with options 4, 6 and 8 labelled «4×4», «6×6» and «8×8».
- Message regions: `[data-message="hint"]` and `[data-message="win"]`, always present; empty text content means no message is shown.
- Page root: the `root` passed to `mountPlayPage`. The page heading is not required by any FR; if present it is inside the root, and the document title is `document.title`.

### If FR-43 is cut

FR-43 is cut 0 in the signed-off cut order (`docs/requirements.md`, Cut order). If it is cut: the page stays at 6×6 with no `[data-control="size"]` element; the `data-size` attribute stays and is always `6`; the "Grid size selector" requirement and its scenarios, the invalid-size scenario, the size parts of the new puzzle scenarios ("New puzzle keeps the chosen size") and the size options in the static text scenario are removed or moved to Future; "the currently selected size" in the new puzzle requirement reads 6; the `generate` option and the seed source contract stay unchanged.

## Requirements

### Requirement: Board rendering and default size

The page SHALL render an N×N grid of cells for a puzzle produced by the generator from a size and a seed, with N equal to 6 when the player has not chosen another size.

Traces: FR-31

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

The page SHALL add the class `cell-violation` to every cell of a row or column that the rule checker reports as holding more than N/2 of one digit.

Traces: FR-36

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

Traces: FR-38

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

### Requirement: Hint button fills one cell

The page SHALL, when the hint button is pressed and the hint engine returns a target cell, write the engine's value into exactly that cell and into no other cell. A hint-filled cell SHALL be an ordinary player cell: `data-given="false"`, no `cell-given` class, and it can be changed by clicking.

Traces: FR-39

#### Scenario: Hint fills the targeted cell

- **GIVEN** a rendered board on which the hint engine returns a target cell and value
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell at the target row and column shows that value
- **AND** every other cell has the same text as before the press

#### Scenario: Count rule fills only one cell

- **GIVEN** a board on which no pair rule and no sandwich rule applies anywhere, the board breaks no rule, and the hint engine's target is a cell of a line L through the count rule, where several cells of L are empty
- **WHEN** the player presses the hint button once
- **THEN** exactly one cell on the whole board changed text, it is the hint engine's target, and every other empty cell of L is still empty

#### Scenario: Hint-filled cell stays editable

- **GIVEN** a cell just filled by the hint button
- **WHEN** the player clicks it
- **THEN** its text follows the cycle for player cells and `data-given` stays `false`

#### Scenario: No fill when the hint engine has no target

- **GIVEN** a board on which the hint engine returns no target cell
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

The page SHALL, when the «Нова головоломка» button is pressed, replace the board with a puzzle generated for the currently selected size from a new seed, and SHALL clear the hint message and the win message and all highlights that belonged to the old board. The page MUST NOT require the new puzzle to differ from the old one.

Traces: FR-42

#### Scenario: New puzzle after play

- **GIVEN** a 6x6 board with player entries, a hint sentence shown and the win message shown, and the injected seed source returning 7 for the next call
- **WHEN** the player presses `[data-action="new"]`
- **THEN** the board has 36 cells matching what the page's generator returns for size 6 and seed 7 (with an injected `generate` that returns the fixture for the first call and the engine generator's output afterwards), with no player entries
- **AND** `[data-message="hint"]` and `[data-message="win"]` both have empty text content

#### Scenario: New puzzle keeps the chosen size

- **GIVEN** the size selector is set to 8×8 and the board is 8×8
- **WHEN** the player presses the new puzzle button
- **THEN** the board has `data-size="8"` and 64 cells and the selector still shows 8×8

#### Scenario: New puzzle mid-game removes highlights

- **GIVEN** a board with cells that have `cell-violation`
- **WHEN** the player presses the new puzzle button
- **THEN** the cells of the new board carry `cell-violation` only where the rule checker reports a violation for the new puzzle's givens

#### Scenario: Each press uses a new seed

- **GIVEN** an injected seed source returning 1, then 2, then 3
- **WHEN** the page is mounted and the new puzzle button is pressed twice
- **THEN** the boards were generated from seeds 1, 2 and 3 in this order

### Requirement: Grid size selector

The page SHALL offer a size selector with the choices 4×4, 6×6 and 8×8, with 6×6 selected initially, and SHALL start a new puzzle of the chosen size when the choice changes, clearing the hint and win messages.

Traces: FR-43

#### Scenario: Selector options

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="size"]`
- **THEN** it has exactly three options with values 4, 6 and 8 and labels «4×4», «6×6» and «8×8», and the value 6 is selected

#### Scenario: Choose 4x4

- **GIVEN** the default 6×6 board
- **WHEN** the player selects 4×4
- **THEN** `[data-board]` has `data-size="4"` and contains 16 cells matching the generator output for size 4 and the next seed from the seed source

#### Scenario: Choose 8x8 mid-game

- **GIVEN** a 6×6 board with player entries, a hint sentence shown and highlighted cells
- **WHEN** the player selects 8×8
- **THEN** the board has `data-size="8"` and 64 cells with no player entries
- **AND** the hint and win message regions have empty text content

#### Scenario: Value outside the offered sizes is ignored

- **GIVEN** the default 6×6 board with player entries and a hint sentence shown, a seed source and a generator that count their calls, and a size selector made to report a value outside 4, 6 and 8 (for example by overriding `value` to return `5`, `10`, `abc`, or by selecting no option so that it reports the empty string), each tried in turn
- **WHEN** a `change` event is dispatched on `[data-control="size"]` for each such value
- **THEN** no error is thrown or logged as uncaught, `[data-board]` keeps `data-size="6"`, every cell keeps its text and class, and both message regions keep their text
- **AND** the seed source and the generator were not called again, and the selector reports the value 6 again (the page restores it) once the value override is removed

### Requirement: Seed is chosen outside the engine, injectable and not shown

The page SHALL obtain the seed for each puzzle from a seed source outside `src/engine/`, SHALL accept an injected seed source (contract in the DOM contract section) so tests are deterministic, and MUST NOT display the seed anywhere on the page, including in locale-formatted or separator-split form. When no seed source is injected, the default source SHALL give a different seed on each call (no two consecutive calls return the same seed) and every seed it returns SHALL be an integer from 0 to 2^31 - 1 inclusive. That range is a page-side decision made by this spec because `puzzle-engine/spec.md` does not pin a seed domain (see the GAP in Exclusions).

Traces: FR-31, FR-42

#### Scenario: Injected seed gives a reproducible page

- **GIVEN** two pages mounted with seed sources that both return 42, default size, using the real engine generator
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

### Requirement: Ukrainian page text

The page SHALL show all of its own text (heading if any, labels, buttons, size selector option labels, the win message, `document.title` and any user-visible attribute such as `aria-label`, `title`, `placeholder` and `alt`) in Ukrainian: each such text contains Cyrillic letters and no Latin letters, or consists only of digits, whitespace and the sign ×. Hint sentences are owned by the puzzle-engine capability and are only displayed here.

Traces: NFR-5

#### Scenario: Static page text

- **GIVEN** the page has just been mounted
- **WHEN** the test collects every non-whitespace text node under the page root (including the buttons, the size options and any heading, label or footer), `document.title`, and the values of the attributes `aria-label`, `title`, `placeholder` and `alt` on every element in the root; `data-*` attributes, `class` and option `value` attributes are not user-visible and are not collected
- **THEN** every collected text matches `/\p{Script=Cyrillic}/u` or consists only of digits, whitespace and the sign ×, and none matches `/[A-Za-z]/`

#### Scenario: Win message text

- **GIVEN** a solved board
- **WHEN** the win message is shown
- **THEN** its text is exactly «Вітаємо, головоломку розв'язано!» (apostrophe U+0027), which contains Cyrillic letters and no Latin letters

## Exclusions

The following are intentionally unsupported in MVP; testers must not report them as defects.

- No server, no authentication, no accounts, no authorization: every visitor can use the page, so there are no unauthorized or forbidden cases and no redirects.
- No persistence (TC-12): reloading the page starts a fresh puzzle; nothing is stored. No network calls: puzzles are generated in the browser.
- Difficulty grading (FR-44), a timer (FR-45), saved progress (FR-46), undo (FR-47) and a daily puzzle (FR-48) are Future.
- Real-browser tests (NFR-7) are Future; the page is tested in jsdom only (TC-13). Rendering defects that jsdom cannot see are not caught.
- Keyboard play and screen-reader support have no requirements (A-20). Mobile layout and visual polish are not specified (A-14).
- The seed is not shown on the page (A-4).
- Re-selecting the already selected size: browsers do not fire `change` when the same option is chosen again and FR-43 does not ask for it, so no scenario asserts it.
- Grid sizes of 10 and above (FR-18) are not offered.
- The page does not restate or re-implement rule checking, solving, generation or hint selection; it only displays engine results (see `openspec/specs/puzzle-engine/spec.md`).
- Not specified, and so not asserted by any scenario: whether the hint message is cleared when the player edits a cell after a hint. This is a GAP for the user to decide (BC-7). The win message after an edit is not a GAP: FR-41 empties it while the board is not solved (see "Board stays editable after a win").
- GAP (seed domain, escalated to the user per BC-7): neither FR-13 to FR-17 nor `puzzle-engine/spec.md` pins the accepted seed domain (integer or not, negative values, upper bound, NaN). The page does not validate an injected seed: what happens when an injected seed source returns an oversized, negative, fractional or `NaN` value is the generator's behaviour and is not asserted by any scenario. This spec only pins the domain of the page's own default seeds (0 to 2^31 - 1, integers).
