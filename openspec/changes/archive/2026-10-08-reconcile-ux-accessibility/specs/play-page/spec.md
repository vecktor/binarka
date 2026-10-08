## RENAMED Requirements

- FROM: `### Requirement: The board is a single Tab stop`
- TO: `### Requirement: Every cell is its own Tab stop`

- FROM: `### Requirement: Enter and Space cycle the focused cell and a click moves the Tab stop`
- TO: `### Requirement: Enter and Space activate a cell like a click`

- FROM: `### Requirement: The board, rows and cells have grid roles`
- TO: `### Requirement: The board is a labelled group of cell buttons`

- FROM: `### Requirement: The size selector has a visible Ukrainian label`
- TO: `### Requirement: The size radiogroup has an accessible name`

- FROM: `### Requirement: Cells, buttons and the selector show a visible, unobscured focus indicator`
- TO: `### Requirement: Cells and buttons show a visible, unobscured focus indicator`

- FROM: `### Requirement: The selector sets its own colours and the board disables double-tap zoom`
- TO: `### Requirement: The size buttons set their own colours and the board disables double-tap zoom`

## REMOVED Requirements

### Requirement: Arrow, Home and End keys move the focus

**Reason**: FR-59 was rewritten on 2026-10-09 (reconciliation, autonomy-log row 78; the source is the signed UX answer Q5, «Tab, Enter/Space, no arrow keys»): every cell is its own Tab stop and the page does not handle Arrow, Home and End keys. A requirement that is named after keys that move the focus cannot also say that the page does not handle them. The absence of a key model is stated once, next to the absence of a `tabindex`, in «Every cell is its own Tab stop», which keeps one owner for FR-59.

**Migration**: the movement rules (adjacent cell, edges without wrapping, Home/End within the row, Ctrl+Home/Ctrl+End, `preventDefault()` on handled keys, modifier handling) have no object and are dropped. The two sentences that stay true move to «Every cell is its own Tab stop»: keys that are not handled are never default-prevented (Tab, Shift+Tab, PageUp, PageDown and Escape included), and the keys change no cell. The scenarios «Arrow keys move one cell», «Arrow keys stop at the edges», «Home and End move within the row», «Ctrl+Home and Ctrl+End move to the first and last cell of the board», «The position comes from the event target» and «Modified keys are not handled» are deleted with it; «Keys on a given cell navigate and change nothing» and «Keys the board does not handle are not prevented» are rewritten in the new requirement.

## MODIFIED Requirements

### Requirement: Given cells are locked

The page SHALL ignore clicks on a given cell as far as the board is concerned, and Enter and Space with them (the native activation of a button is a click): its text, its `data-given` value, its classes and the highlight state of every cell stay unchanged, both message regions keep their text and no error is shown. A given cell is a button with `aria-disabled="true"` (FR-69), so it stays focusable: a click on it SHALL NOT move DOM focus away from it when it has the focus, and the page SHALL NOT call `preventDefault()` on a key event of a given cell (FR-60).

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

#### Scenario: A click on a given changes nothing and leaves the focus on it

- **GIVEN** a rendered board with a given cell at row 1 column 3 showing `0`, a hint sentence shown and some cells with `cell-violation`, and the test has given DOM focus to that given cell
- **WHEN** the player clicks that given cell once, and then twice more
- **THEN** it is still `document.activeElement`
- **AND** every cell keeps its text, `data-given` and classes, and both message regions keep their text

#### Scenario: Enter and Space key events on a given cell change nothing

- **GIVEN** a rendered board with a given cell showing `1`, a hint sentence shown, some cells with `cell-violation`, and DOM focus on another cell
- **WHEN** the test dispatches an Enter and then a space `keydown` and `keyup` on the given cell
- **THEN** the cell still shows `1` and has `data-given="true"` and the class `cell-given`
- **AND** no other cell changed text or class, both message regions keep their text, none of the four events has `defaultPrevented` true, and `document.activeElement` is as before

### Requirement: Highlighting follows every board change

The page SHALL recompute the highlighted cells after every board change (a click on a non-given cell, which is also what Enter or Space does there as the native activation of a button (FR-60), a hint fill, a new puzzle, a size change), so that a broken rule is highlighted at once and its highlight is removed as soon as the rule is no longer broken.

Traces: FR-38, FR-43, FR-60

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

### Requirement: Ukrainian page text

The page SHALL show all of its own text (the title in the header, labels, buttons including «Правила» and «Зрозуміло», the size control labels, the rules texts, the idle line, the win message, `document.title` and any user-visible attribute such as `aria-label`, `title`, `placeholder`, `alt` and the `label` attribute of `option` and `optgroup` elements, which a browser shows instead of the option text) in Ukrainian: each such text contains Cyrillic letters and no Latin letters. The digits and the sign × inside a size label such as «Поле 4×4» are not Latin letters. The digits shown in the cells of the board are puzzle content, not page text, and are not collected. Text inside an element with `aria-hidden="true"` (the decorative examples of the rules panel, A-26) is decoration made of digits and symbols, not page text, and is not collected; it holds no letter at all (see «Ukrainian texts of the header, rules panel and idle line»). Hint sentences are owned by the puzzle-engine capability and are only displayed here.

Traces: NFR-5, FR-43, FR-57, FR-71

#### Scenario: Static page text

- **GIVEN** the page has just been mounted
- **WHEN** the test collects every non-whitespace text node under the page root (including the buttons, the size control labels and the header, the rules panel and the idle line, but not the text of `[data-cell]` elements, which is puzzle content, and not the text of elements with `aria-hidden="true"`, which is decoration), `document.title`, and the values of the attributes `aria-label`, `title`, `placeholder` and `alt` on every element in the root and of the attribute `label` on every `option` and `optgroup` element; `data-*` attributes, `class` and option `value` attributes are not user-visible and are not collected
- **THEN** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`
- **AND** the collected texts include «Поле 4×4», «Поле 6×6» and «Поле 8×8»
- **AND** the collected texts include «Розмір поля», the board name «Поле 6×6» as an `aria-label` value, and the 36 cell names

#### Scenario: Accessible names at every size

- **GIVEN** a mounted page on which the player selects 4×4, then 8×8
- **WHEN** the test collects the `aria-label` of `[data-board]` and of every cell after each board is shown
- **THEN** the board names are «Поле 4×4» and «Поле 8×8», each cell name matches `/^Рядок [1-8], стовпець [1-8], (порожньо|0|1)(, задано|, підказка)?$/`, and every collected name contains Cyrillic letters and no Latin letters

#### Scenario: Win message text

- **GIVEN** a solved board
- **WHEN** the win message is shown
- **THEN** its text is the one required by «Win message when solved» (FR-41), and it contains Cyrillic letters and no Latin letters

### Requirement: Cells are buttons

Every board cell `[data-cell]` SHALL be a `<button type="button">`, reachable by Tab in reading order and activated by Enter and Space as a native button (FR-69, A-20). A given cell SHALL be a button with `aria-disabled="true"` and without the `disabled` attribute, so it stays focusable and readable; a click on it changes nothing (FR-33). A non-given cell SHALL have neither `disabled` nor `aria-disabled="true"`. No cell, no size button, no action button and no rules button SHALL carry a negative `tabindex`, so Tab reaches each of them (A-24). Cells are in the document in reading order (row by row, left to right). Enter and Space are the native activation of a button and are not re-implemented by the page; jsdom does not turn a keydown into a click, so these two keys are covered by the element type and attributes, and real focus and keyboard behaviour are covered by the held NFR-13, see `docs/requirements-held.md`. Arrow, Home and End keys are not required (A-24) and are not handled (FR-59).

Traces: FR-69

#### Scenario: Every cell is a native button at each size

- **GIVEN** a mounted page showing a board of size N from the table below, with a fixture puzzle that has at least one given

| N |
|---|
| 4 |
| 6 |
| 8 |

- **WHEN** the test reads every `[data-cell]`
- **THEN** there are N×N of them, each is a `button` element with `type="button"`, and none has a `tabindex` attribute with a negative value
- **AND** in document order their (`data-row`, `data-col`) pairs run row by row and left to right, from (1, 1) to (N, N)

#### Scenario: Givens are aria-disabled, not disabled

- **GIVEN** a mounted fixture board with givens and non-given cells
- **WHEN** the test reads the attributes of every cell
- **THEN** every cell with `data-given="true"` has `aria-disabled="true"` and no `disabled` attribute
- **AND** every cell with `data-given="false"` has no `disabled` attribute and no `aria-disabled="true"`

#### Scenario: The controls are in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `tabindex` and `disabled` attributes of the three size buttons, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]` and `[data-action="rules"]`
- **THEN** each is a `button` element, none has the `disabled` attribute, and none has a negative `tabindex`

### Requirement: Every cell is its own Tab stop

The page SHALL make every `[data-cell]` of the board shown its own Tab stop: the cells are reached by Tab in reading order (row by row, left to right), after the size control and before the hint button (FR-59, FR-68, FR-69), and the page SHALL NOT put a `tabindex` attribute on any element of its root, at mount and after every board change. The page SHALL NOT handle the Arrow, Home and End keys, with or without Ctrl, Shift or Alt: it handles no key event on the board or its cells, so no key event on the board or a cell is default-prevented (Tab, Shift+Tab, PageUp, PageDown, Escape and letters included), no key moves DOM focus, and no key changes a cell (FR-59). Showing a board (the mount, a performed new puzzle, a performed size change, a reset) SHALL NOT move DOM focus, and a hint, whether or not it fills a cell, SHALL leave DOM focus on the hint button. Tab and Shift+Tab are the browser's. A new puzzle or size change whose generation fails keeps the previous board and its cells.

Traces: FR-59, FR-43, FR-68, FR-69

#### Scenario: Every cell is a Tab stop in reading order

- **GIVEN** the page is mounted on a fixture puzzle (6x6)
- **WHEN** the test reads the elements of the root in document order
- **THEN** no element of the root has a `tabindex` attribute
- **AND** the last size button precedes the cell with `data-row="1"` and `data-col="1"`, the 36 cells follow in reading order up to `data-row="6"` and `data-col="6"`, and that last cell precedes `[data-action="hint"]`

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
- **WHEN** the mount returns, and then the test gives DOM focus to `[data-action="new"]` and presses it, and gives DOM focus to the button «Поле 4×4» and presses it, and gives DOM focus to `[data-action="reset"]` and presses it (the boards have no entries, so each action is performed at once)
- **THEN** after the mount the outside button still has the focus, and after each press `document.activeElement` is the button that was pressed

#### Scenario: A hint leaves the focus on the hint button

- **GIVEN** two mounted pages, one on the fixture `PAIR_ROW` (the hint fills a cell) and one on the fixture `ISOLATED` (the hint fills nothing), with DOM focus on `[data-action="hint"]` in each
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** on both pages `document.activeElement` is still `[data-action="hint"]`

### Requirement: Enter and Space activate a cell like a click

Enter or Space on a focused non-given cell SHALL cycle it exactly as a click on it does (FR-34), by the native activation of a `<button type="button">` (FR-60, FR-69): the page SHALL NOT handle key events on a cell, so it never calls `preventDefault()` on Enter or Space (that would suppress the browser's click), and a `keydown` or `keyup` alone changes no cell. On a given cell (`aria-disabled="true"`) Enter, Space and a click change nothing (FR-33, see «Given cells are locked»). A cell SHALL keep DOM focus after its value changes: the page updates a cell element in place and never moves or drops the focus of a cell, so a player who cycles a cell with the keyboard stays on it. jsdom does not turn a key press into a click, so these two keys are covered by the element type, by the absence of any key handling and by the click; real key behaviour is covered by the held NFR-13, see `docs/requirements-held.md`.

Traces: FR-60, FR-33, FR-34, FR-69

#### Scenario: A cell keeps the focus after its value changes

- **GIVEN** a mounted fixture board and the test has given DOM focus to the empty non-given cell at row 4 column 2
- **WHEN** the player clicks it once, twice and three times (the click is what Enter and Space produce on a button)
- **THEN** the cell shows `0` after the first click, `1` after the second and empty after the third
- **AND** after each click `document.activeElement` is that same cell element

#### Scenario: The page does not handle Enter or Space

- **GIVEN** a mounted fixture board with an empty non-given cell and a given cell showing a digit, each given DOM focus in turn
- **WHEN** the test dispatches on the focused cell a `keydown` and a `keyup` of Enter and of a single space, plain, with Ctrl, with Alt, with Shift, and with `repeat` true
- **THEN** every dispatched event has `defaultPrevented` false
- **AND** the text, `data-given` and classes of every cell are as before the events (a key event alone cycles nothing; the browser's click does)

### Requirement: The board is a labelled group of cell buttons

The page SHALL give `[data-board]` `role="group"` and the Ukrainian `aria-label` «Поле N×N» for the size N of the board shown (digits and the sign × U+00D7, no Latin letters), and the children of the board SHALL be exactly its N×N `[data-cell]` buttons, in reading order (FR-61, FR-69). No element of the page SHALL have `role="grid"`, `role="row"` or `role="gridcell"`, and no `[data-cell]` SHALL carry a `role` attribute (a button keeps its own role). The attributes and classes of the DOM contract on cells (`data-cell`, `data-row`, `data-col`, `data-given`, `cell-given`, `cell-violation`) are unchanged. The page SHALL put an `id` on a descendant of its root only to wire the rules popover and the confirmation dialog: the rules panel, the heading inside it and the element that holds the confirmation text (FR-57, FR-67). Each of these three ids ends in a number that belongs to the mount, so two pages mounted on two roots of one document share no id, and no other descendant of the root has an `id`. The page SHALL NOT use a `for` attribute. The stylesheet SHALL NOT use `display: contents` on any rule, because that has a history of dropping the semantics of the element it is applied to (here the board group and the cell buttons).

Traces: FR-61, FR-43, FR-57, FR-67, FR-69

#### Scenario: Role and name of the default board

- **GIVEN** the page is mounted with the default size
- **WHEN** the test reads `[data-board]`
- **THEN** it has `role="group"` and `aria-label` equal to «Поле 6×6»
- **AND** it has exactly 36 children, and they are exactly the 36 `[data-cell]` buttons, with `data-row` and `data-col` running row by row and left to right from (1, 1) to (6, 6)
- **AND** no element of the root has `role="grid"`, `role="row"` or `role="gridcell"`, and no cell has a `role` attribute

#### Scenario: The group name follows the size

- **GIVEN** a mounted page with the real engine generator
- **WHEN** the player selects 4×4 and then 8×8
- **THEN** after 4×4 the board has `aria-label` «Поле 4×4», `role="group"` and 16 cell children; after 8×8 it has «Поле 8×8», `role="group"` and 64 cell children

#### Scenario: A failed size change keeps the board and its name

- **GIVEN** a 6x6 fixture page and an injected `generate` that throws for size 8
- **WHEN** the player selects 8×8
- **THEN** the board keeps `aria-label` «Поле 6×6», `role="group"` and its 36 cells

#### Scenario: The cell contract is unchanged and only three elements have ids

- **GIVEN** a rendered board
- **WHEN** the test reads every cell and every element of the root
- **THEN** every cell still has `data-cell`, `data-row`, `data-col` and `data-given`, `cell-given` exactly on the givens, and the text content empty, `0` or `1`
- **AND** exactly three descendants of the root have an `id`: the element `[data-section="rules"]`, the heading inside it and the element that holds the confirmation text; each id ends in digits, and no element has a `for` attribute
- **AND** after a click, a hint, a size change and a new puzzle the same three elements are the only ones with an `id`

#### Scenario: Two mounts share no id

- **GIVEN** the page is mounted on two roots in the same document
- **WHEN** the test reads the ids under each root
- **THEN** each root has three ids, the six ids are pairwise different, and `document.querySelectorAll('[id]')` finds exactly those six elements

#### Scenario: No rule drops semantics with display: contents

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches it for `display: contents` (any spacing)
- **THEN** there is no match

### Requirement: Cells expose a Ukrainian name and their state

The page SHALL give every `[data-cell]` an `aria-label` that is its label as «Cell labels» defines it, «Рядок R, стовпець C, V» with the optional suffix «, задано» or «, підказка» (FR-70), so that the accessible name of a cell is its FR-70 label (FR-61). The label SHALL match the cell's text content, which stays empty, `0` or `1` (FR-34), and SHALL be rewritten whenever the cell changes (a click, a hint fill, a reset, a new board). The page SHALL set `aria-disabled="true"` on every given cell (FR-69) and on no other cell, and SHALL NOT set `aria-readonly` on any element, because that attribute is not allowed on a button. The page SHALL set `aria-invalid="true"` on exactly the cells that carry the class `cell-violation` (the same set, including every cell of a line highlighted for too many of one digit) and SHALL remove the attribute from every other cell, with the attribute absent rather than `"false"`. A given cell in a violation carries both `aria-disabled="true"` and `aria-invalid="true"`.

Traces: FR-61, FR-70, FR-69, FR-35, FR-36, FR-37, FR-38

#### Scenario: Names of a fresh board

- **GIVEN** a 6x6 fixture board whose only givens are `0` at row 3 columns 1 and 2
- **WHEN** the test reads `aria-label` of the cells at row 2 column 3, row 3 column 1 and row 6 column 6
- **THEN** they are «Рядок 2, стовпець 3, порожньо», «Рядок 3, стовпець 1, 0, задано» and «Рядок 6, стовпець 6, порожньо»
- **AND** for every cell the name equals the FR-70 label built from its `data-row`, `data-col`, text content, `data-given` and `cell-hinted`

#### Scenario: The name follows a click and a hint

- **GIVEN** a rendered board with an empty non-given cell at row 2 column 3
- **WHEN** the player clicks it three times, one click at a time
- **THEN** its `aria-label` is «Рядок 2, стовпець 3, 0», then «Рядок 2, стовпець 3, 1», then «Рядок 2, стовпець 3, порожньо»
- **AND** after a hint press that fills a cell, that cell's `aria-label` is «Рядок R, стовпець C, V, підказка» with V the filled digit

#### Scenario: A new board has fresh names

- **GIVEN** a board with player entries
- **WHEN** the player presses the new puzzle button or selects another size, and confirms
- **THEN** for every cell of the new board the `aria-label` equals the FR-70 label for the new cell's position, text and state

#### Scenario: Givens are aria-disabled and nothing is aria-readonly

- **GIVEN** a rendered board with givens and player cells
- **WHEN** the test reads `aria-disabled` and `aria-readonly` of every cell
- **THEN** `aria-disabled` is `"true"` on every cell with `data-given="true"` and absent on every other cell, also after a click or a hint fill that fills a player cell
- **AND** no element of the root has the attribute `aria-readonly`

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
- **THEN** exactly the cells at row 1 columns 1 to 3 have `aria-invalid="true"`, and each of them also has `aria-disabled="true"`

### Requirement: The size radiogroup has an accessible name

The size radiogroup `[data-control="size"]` (FR-43) SHALL have the accessible name «Розмір поля», given by its `aria-label`, and each of its three size buttons SHALL be labelled by its own visible text «Поле N×N»: a size button SHALL NOT carry `aria-label` or `aria-labelledby` (FR-62). No text of the page SHALL show «Розмір поля», and the page SHALL contain no `label` element and no `select`: the frozen design has no visible label for the control (FR-62). The name has Cyrillic letters and no Latin letters (NFR-5).

Traces: FR-62, FR-43, NFR-5

#### Scenario: The radiogroup is named by its aria-label

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-control="size"]`
- **THEN** it has `role="radiogroup"` and `aria-label` equal to «Розмір поля», and no `aria-labelledby`
- **AND** the root contains no `label` element, no `select` element and no `for` attribute, and no text node of the root has the trimmed text «Розмір поля»

#### Scenario: Each size button is named by its own text

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the three `button[role="radio"]` of the size control
- **THEN** their texts are «Поле 4×4», «Поле 6×6» and «Поле 8×8» in this order, and none has `aria-label` or `aria-labelledby`
- **AND** each text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

### Requirement: The hint and win messages are status regions

The page SHALL give `[data-message="hint"]` and `[data-message="win"]` `role="status"`, SHALL have both elements in the root from the first render with empty text content until they have a message, and SHALL change only their text content afterwards: the same two elements stay in the page across hint presses, new puzzles, size changes and wins (a live region that is replaced is not announced) (FR-63). The page SHALL NOT move DOM focus to either region, and SHALL NOT give them a `tabindex`. There are exactly two elements with `role="status"` in the page: the idle line `[data-message="idle"]` has no `role` attribute, because it is fixed text (FR-71). While the two regions are empty they SHALL stay rendered: no rule gives a message region `display: none` or `visibility: hidden`, so that a screen reader announces the first message that arrives (FR-63). The announcement itself is a screen-reader behaviour that is not tested (A-28).

Traces: FR-63, FR-40, FR-41, FR-71

#### Scenario: Present, empty and typed at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-message="hint"]` and `[data-message="win"]`
- **THEN** both exist, have `role="status"`, have empty text content and no `tabindex` attribute
- **AND** the root holds exactly two elements with `role="status"`

#### Scenario: The same elements carry every message

- **GIVEN** a mounted page, with the two region elements remembered by the test
- **WHEN** the player presses the hint button, then clicks a cell, then presses the new puzzle button and confirms «Так, почати» (the board has entries, FR-67), then selects 4×4, then solves a fixture board so the win message shows
- **THEN** after each step `[data-message="hint"]` and `[data-message="win"]` are the same element objects as at mount, still connected to the root, still `role="status"`, and the hint region shows the engine sentence and the win region shows «Вітаємо, головоломку розв'язано!» when the earlier requirements say so

#### Scenario: Focus never moves to a message

- **GIVEN** a mounted page where the test gave DOM focus to `[data-action="hint"]`
- **WHEN** the player presses the hint button and the hint text appears
- **THEN** `document.activeElement` is still `[data-action="hint"]` and is not a status region
- **AND** on a fixture board whose single hint fill solves it, after that hint press the win message appears and `document.activeElement` is still `[data-action="hint"]`

#### Scenario: The idle line has no role

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-message="idle"]`
- **THEN** it has no `role` attribute, and still holds the idle text of «Idle line»

#### Scenario: Empty status regions stay rendered

- **GIVEN** the text of `src/ui/style.css` with every `var(--color-x)` replaced by its `:root` value, injected into a `<style>` element of the jsdom document, and the page just mounted, so that `[data-message="hint"]` and `[data-message="win"]` are empty
- **WHEN** the test reads `getComputedStyle` of each of the two regions, and the declarations of every rule in the file whose selector subject (its last compound selector) is `.message`, `.message-win`, `[data-message='hint']` or `[data-message='win']`, with or without a pseudo-class such as `:empty`
- **THEN** neither region computes `display: none`, and neither computes `visibility` `hidden` or `collapse`
- **AND** none of those rules declares `display: none` or `visibility: hidden`

#### Scenario: A click that wins leaves the focus on the cell that had it

- **GIVEN** a fixture board with every cell holding the solution except one non-given cell, and the test has given DOM focus to that cell
- **WHEN** the player clicks that cell until it shows the solution digit and the win message appears
- **THEN** `document.activeElement` is still that cell (FR-60), not a status region

### Requirement: Borders, cues and focus rings have enough contrast

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule with literal `#rrggbb` values, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65). The tokens are `--color-page`, `--color-text`, `--color-cell-bg`, `--color-cell-border`, `--color-given-bg`, `--color-given-border`, `--color-violation-bg`, `--color-violation-border`, `--color-violation-text`, `--color-focus`, `--color-control-bg`, `--color-control-border` and `--color-win-text`. The colour scan applies to every declaration outside a `:root` rule, wherever it is in the file (top level, nested rules, `@media`, `@supports`, `@layer`): its value SHALL NOT match `/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i` and SHALL NOT contain a CSS named colour (the full CSS Color 4 list); the keywords `transparent`, `currentcolor`, `inherit`, `initial`, `unset` and `revert` are allowed because they introduce no colour; the colour-bearing shorthands `background`, `border`, `border-top`, `border-right`, `border-bottom`, `border-left`, `outline`, `box-shadow`, `text-decoration` and `column-rule` are allowed only when their colour is a `var(--color-...)` token (or the value is `none` or `0`); and no `--color-*` property is declared outside a `:root` rule. Selectors such as `#app` are not declaration values and are not affected. The rules `body`, `.cell`, `.cell-given`, `.cell-violation`, `button`, `.message-win` and the `:focus-visible` rules SHALL take their `color`, `background-color`, `border-color` and `outline-color` from these tokens, declared with those longhand properties. A `:root` rule inside `@media`, `@supports` or `@layer` may redefine tokens, and then every resulting token set (the top-level set, and the top-level set with each conditional block's overrides applied) SHALL satisfy every pair below. The WCAG 2 contrast ratio, computed from relative luminance, SHALL be at least 3:1 for these pairs: the cell border `--color-cell-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`; the violation cue `--color-violation-border` against `--color-page`, `--color-cell-bg` and `--color-violation-bg`; the given cue against `--color-page`, `--color-cell-bg` and `--color-given-bg`; the focus ring `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-violation-bg`; and the control border `--color-control-border` against `--color-page`. The given cue is the border of a given cell: 2px wide, in `--color-given-border` (the colour of `.cell-given`'s `border-color`), together with the bold digits (`font-weight: 700`); the fill `--color-given-bg` is a redundant decoration and is not the cue, because a pale fill cannot reach 3:1 against the page and the cell colour and keep the digit readable. The text SHALL have at least 4.5:1: `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-control-bg`, `--color-violation-text` against `--color-violation-bg`, and `--color-win-text` against `--color-page`.

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

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила», the three size buttons, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the 2px gap between cells shows the page colour on the ring's inner side, the ring's outer edge lands on a neighbour's fill (the pairs `--color-focus` against cell, given and violation fills, 6.70, 5.41 and 4.63 with the design's values) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all.

Traces: FR-65

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
- **WHEN** the test reads `[data-action="rules"]`, the three `button[role="radio"]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, the close button of `[data-section="rules"]`, `[data-confirm="yes"]`, `[data-confirm="no"]` and every `[data-cell]`
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

### Requirement: The size buttons set their own colours and the board disables double-tap zoom

The stylesheet SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule that styles the size buttons (`.size-control button`) and in the rule of the checked button (`.size-control button[aria-checked='true']`), so that the colours of the size buttons do not depend on the browser or the operating system (FR-65). For each state, the declarations of the rule for the unchecked button, with those of the rule for the checked button laid over them for the checked state, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens). The stylesheet SHALL set `touch-action: manipulation` in the rule of the class `board`. The element `[data-board]` SHALL carry the class `board`.

Traces: FR-65, NFR-9

#### Scenario: The size buttons declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.size-control button` and of `.size-control button[aria-checked='true']`
- **THEN** `.size-control button` declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`
- **AND** the checked state, with its own declarations laid over the unchecked ones, has a `color` and a `background-color` that are such tokens
- **AND** the ratio of the text colour to the background colour is at least 4.5 in each of the two states

#### Scenario: The board sets touch-action

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test reads the declarations of the `.board` rule and the classes of `[data-board]`
- **THEN** `touch-action` is `manipulation` and `[data-board]` has the class `board`

### Requirement: The page meets the WCAG 2.2 AA criteria of the accessibility requirements

The page SHALL meet WCAG 2.2 AA for what FR-43, FR-59 to FR-65, FR-67, FR-69 and FR-70 cover (NFR-9): keyboard operation 2.1.1 (every cell and every control reached by Tab in reading order and operated by Enter and Space as a native button, FR-59 and FR-60), name, role and value 4.1.2 (the role and name of the board group and of the radiogroup, the cell names, `aria-disabled`, `aria-invalid`), labels 3.3.2 (the accessible name «Розмір поля» and the visible text of each size button), status messages 4.1.3 (the two `role="status"` regions), use of colour 1.4.1 (the heavier violation border and `aria-invalid`) and non-text contrast 1.4.11 (the 3:1 pairs) and visible focus 2.4.7 (the `:focus-visible` rules). Every button of the page (the cell buttons and the size radio buttons included) SHALL have a non-empty accessible name in Ukrainian: its `aria-label` when it has one (every cell), otherwise its text; the board group and the radiogroup SHALL have a non-empty Ukrainian `aria-label`. No element of the page SHALL have a `tabindex` attribute, before or after play. Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).

Traces: NFR-9, NFR-5, FR-43, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, FR-65, FR-67, FR-69, FR-70

#### Scenario: Every button, the radiogroup and the board have a Ukrainian name

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test computes the accessible name of each `button` (its `aria-label` when present, else its text) and of `[role="radiogroup"]` and `[data-board]` (their `aria-label`)
- **THEN** there are 46 buttons (36 cells and 10 others) and two groups, every name is non-empty, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/`
- **AND** the names include «Підказка», «Скинути», «Нова головоломка», «Розмір поля» and «Поле 6×6», and the 36 cell names

#### Scenario: No element of the page has a tabindex, before and after play

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test reads every element of the root at mount, and again after a click on a cell and a hint press
- **THEN** no element of the root has a `tabindex` attribute at either moment
