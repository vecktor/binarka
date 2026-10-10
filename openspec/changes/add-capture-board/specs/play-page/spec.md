## ADDED Requirements

### Requirement: Capture-only board

Before the page mounts, a capture harness MAY set one global value `window.__binarkaCaptureBoard = { size, level, givens, entries, hinted? }` (FR-119). `givens` and `entries` are size × size arrays whose cells are `0`, `1` or `null`; `hinted` is an optional `[row, col]`, 0-based. `mountPlayPage` SHALL read the value once, at mount, before it would take a seed. When the value is absent, the mount SHALL behave exactly as before: it takes a seed from the seed source and generates (FR-88). When the value is present and valid, the mount SHALL take no seed and call no generator, and SHALL show that board as the board shown:
- the board's givens are the value's givens, rendered as given cells;
- each non-null entry of `entries` is a player entry in that cell;
- the board size and level are the value's, in the summary, the size and level controls and the board's `aria-label`;
- the violations of the board are highlighted, as after a click (FR-35 to FR-37);
- when `hinted` is present, that cell carries the `cell-hinted` marker (FR-66), and the hint message stays empty;
- when the board is solved, the win message shows at mount, as after the last move (FR-38).

**The value is valid only if:** it is an object; `size` is 4, 6 or 8; `level` is an integer from 1 to 4, and is 1 when `size` is 4 (FR-91); `givens` and `entries` are each `size` rows of `size` cells, and every cell is `0`, `1` or `null`; the givens alone have exactly one solution (`countSolutions(givens) === 1`); no non-null entry sits on a given; and `hinted`, if present, is a pair of integers naming a cell inside the board whose entry is non-null. An invalid value SHALL be ignored silently: the mount generates exactly as if the value were absent, with no uncaught error, no message and no console output.

The page SHALL NOT write, delete or store the value (TC-12), SHALL NOT read it again after mount, and SHALL offer no control, URL parameter or other route that sets it. After a capture board, «Нова головоломка», «Почати», «Скинути» and a hint behave as on any board; «Нова головоломка» and «Почати» take a seed and generate as before. The capture-only board is for the pixel check (NFR-14) and for tests, not a feature (A-56). No page text is added (NFR-5).

Traces: FR-119, FR-88, FR-91, FR-66, FR-38, NFR-14

#### Scenario: Without the value the mount generates as before

- **GIVEN** `window.__binarkaCaptureBoard` is not set
- **WHEN** the page is mounted with a counting seed source and generator
- **THEN** exactly one seed is taken and the generator is called once with size 6 and level 1, as before

#### Scenario: A valid value is shown without a seed

- **GIVEN** `window.__binarkaCaptureBoard` is the 6×6 fixture of `design/v0/lib/boards.json` converted to a capture value, at level 1
- **WHEN** the page is mounted with a counting seed source and generator
- **THEN** no seed is taken and the generator is not called
- **AND** every given of the value is a given cell with that digit, every entry of the value is a non-given cell showing that digit, and every other cell is empty
- **AND** the summary shows «6×6 · Розминка» and the board has the label of a 6×6 board

#### Scenario: The level and size of a valid value reach the controls

- **GIVEN** a valid 6×6 capture value at level 2
- **WHEN** the page is mounted and the setup sheet is opened
- **THEN** the summary shows «6×6 · Задачка», and `aria-checked="true"` is on «Поле 6×6» and on the level «Задачка»

#### Scenario: Violations and the hinted marker of a valid value

- **GIVEN** a valid capture value whose entries hold three equal digits in a row, and another valid value with `hinted` naming an entered cell
- **WHEN** each is mounted
- **THEN** the three cells carry `cell-violation` on the first, and on the second exactly the hinted cell carries `cell-hinted` while the hint message is empty

#### Scenario: A solved value shows the win state at mount

- **GIVEN** the solved 6×6 fixture converted to a capture value
- **WHEN** the page is mounted
- **THEN** the win message shows the win text at once, with no click

#### Scenario: Each invalid value falls back to generation silently

- **GIVEN** in turn: a non-object; size 5; level 0; level 5; level 2 at size 4; a row of the wrong length; a cell value of 2; givens with two or more solutions; an entry on a given; `hinted` on an empty cell; `hinted` outside the board
- **WHEN** the page is mounted with a counting seed source and generator
- **THEN** exactly one seed is taken and the generator is called, the generated board is shown, no error is thrown and nothing is written to the console

#### Scenario: The value is read once and never written

- **GIVEN** a valid capture value was shown at mount
- **WHEN** the test changes `window.__binarkaCaptureBoard` afterwards and presses «Нова головоломка»
- **THEN** the new board is generated with a new seed (the changed value is not read), the global still holds what the test set, and `localStorage` has no key besides the two preferences of FR-113

#### Scenario: The fixture boards are valid capture values

- **GIVEN** `design/v0/lib/boards.json`
- **WHEN** the test reads each 6×6 fixture
- **THEN** the givens of the three 6×6 boards are equal and have exactly one solution
- **AND** the fixture board has exactly one violation, rule `three`, row 3 (1-based), cells 1 to 3
- **AND** on the hint board without its hinted cell the engine's first hint (`hint(board, 4)`) fills row 3, column 3 (1-based) with 1, with the sentence «Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.»
- **AND** the solved board is solved (`isSolved`), and the 4×4 and 8×8 fixtures have exactly one solution
- **AND** every fixture, converted to a capture value, is valid for this requirement
