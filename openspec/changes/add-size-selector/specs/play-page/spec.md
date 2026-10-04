## ADDED Requirements

### Requirement: Grid size selector

The page SHALL offer a size selector `[data-control="size"]`, a select with the options 4, 6 and 8 labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8», with 6 selected when the page is mounted. When the choice changes to exactly 4, 6 or 8 the page SHALL start a new puzzle of the chosen size from a new seed taken from the seed source (one seed per generation attempt), SHALL render a board of that size, and SHALL clear the hint message, the win message and all highlights that belonged to the old board. The page assumes that `generate(n, seed)` returns an n×n puzzle: if the generator throws, or the returned `puzzle.givens` is not n rows of n cells, the page SHALL treat it as a generator failure and keep the previous board, the previous messages and highlights and the previous size, and the selector SHALL show the size of the board that is shown. The page SHALL ignore a changed value that is not exactly 4, 6 or 8 (including the empty value): no error, no seed taken, no generator call, no change to the board, the messages or the highlights, and the selector shows the size of the board that is shown. Rules, hint and win message work at the chosen size exactly as at 6. The page MUST NOT remember the choice: a reload or a new mount starts at 6 (TC-12). Re-selecting the current size is not specified: browsers fire no `change` event for it, so the page may start a new puzzle or ignore it and no scenario asserts which.

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
- **AND** a size selector made to report a value outside the offered sizes by overriding `value` on the element (the override has a getter and a setter) with each of `5`, `10`, `abc`, `6.0`, ` 6`, `06`, `0x6` and the empty string, each tried in turn
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

## MODIFIED Requirements

### Requirement: Board rendering and default size

The page SHALL render an N×N grid of cells for a puzzle produced by the generator from a size and a seed, with N equal to 6 until the player chooses another size with the size selector and equal to the chosen size afterwards (FR-43).

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

### Requirement: Hint message stays until the next hint or a new puzzle

The page SHALL keep the text of `[data-message="hint"]` unchanged when the player clicks a cell, until the next press of the hint button, the next press of the new puzzle button or an accepted size change (A-23, FR-43).

Traces: FR-40, FR-43

#### Scenario: Clicking a player cell keeps the hint message

- **GIVEN** `[data-message="hint"]` shows a sentence after a hint press
- **WHEN** the player clicks a non-given cell once, and then twice more
- **THEN** `[data-message="hint"]` keeps exactly the same text after each click

#### Scenario: The next hint replaces it and a new puzzle clears it

- **GIVEN** `[data-message="hint"]` shows a sentence and the player has clicked a cell since
- **WHEN** the player presses the hint button again, and then presses the new puzzle button
- **THEN** after the hint press the region shows the sentence for that press, and after the new puzzle press it has empty text content

#### Scenario: An accepted size change clears it

- **GIVEN** `[data-message="hint"]` shows a sentence and the player has clicked a cell since
- **WHEN** the player selects 4×4
- **THEN** `[data-message="hint"]` has empty text content

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
- **WHEN** the page is mounted, the new puzzle button is pressed once, the player selects 4×4, a `change` event with the ignored value `5` is dispatched, and the player selects 8×8
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
