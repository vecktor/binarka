# play-page Specification

## Purpose

The play page is the single static page on which a player solves a Takuzu (Бінарка) puzzle. It renders a generated puzzle as a grid of clickable cells, marks the givens, highlights rule violations as the player fills the board, offers a summary button that names the size and the level of the board and opens a setup sheet with a segmented size control (4×4, 6×6, 8×8; 6×6 at start), a four-level control (Розминка at start) and a «Почати» button (a press on a size or a level only marks the choice, and «Почати» starts the puzzle), a hint button, a reset button and a new-puzzle button, a «Правила» button in the header that opens a rules popover with a section of the harder techniques, an idle line that tells a new player what to do, asks in a confirmation dialog before a new puzzle, «Почати» (a size or level change) or a reset discards the player's moves, makes every cell a button with a Ukrainian label for keyboard and screen-reader play, shows a Ukrainian win message when the board is solved, and has a settings button in the header whose panel holds a theme control (light, dark, or as the system) and a language control (Ukrainian, the default, or English), each applied at once and remembered as a preference; in English mode every page text, accessible name and hint sentence is English. The page is vanilla TypeScript DOM code (`src/main.ts`, `src/ui/`) tested in jsdom with Vitest. It only consumes the engine described in `openspec/specs/puzzle-engine/spec.md` (generator, rule checker, hint engine); what counts as a violation, as solved, or as a hint is defined there and is not restated here.

Ownership: this capability owns FR-31 to FR-44 (FR-39, FR-42 and FR-43 amended), FR-57 and FR-58 (both amended), FR-66 to FR-73 (FR-66, FR-67, FR-68 and FR-73 amended), FR-59 to FR-65 (FR-59, FR-62 and FR-65 amended) and NFR-9 (the accessibility requirements of `main`, reconciled with the UX page model on 2026-10-09 by the change `reconcile-ux-accessibility`; NFR-9 extended to the summary button, the sheet, the level control, «Почати» and the marked state), and FR-87 to FR-101 (the summary button, the setup sheet, the level control, the page retry and the page hint, added by the change `add-level-selector`; FR-100 and FR-101, the marked choice and the start button, added by the change `update-setup-sheet-start`), and FR-102 to FR-106 and FR-113 to FR-118 (the settings button and panel, the theme control and the stored preference, theme parts), NFR-18 (its theme half; the `en` and `lang` half joins with `add-english-version`) and TC-12 as amended, added by the change `add-theme-switch`, which also amends FR-65 and FR-68; and FR-55 and FR-56 (now MVP), FR-107 to FR-112 (the language control, the in-place re-render, `lang` and the title, the hint re-rendered as the same hint, the English page text, the English hint sentences shown) and the language parts of FR-113 to FR-116, NFR-5 per mode and NFR-18's `en` and `lang` half, added by the change `add-english-version`. The change `update-setup-sheet-start` amends FR-43, FR-59, FR-65 to FR-67, FR-73, FR-87, FR-88, FR-90 to FR-92 and FR-94 to FR-99. NFR-4 is extended: the reason line and the level descriptions are one sentence each. It traces NFR-5 only for the text the page itself shows (labels, buttons including the reset label, the size control, the header, the rules panel, the idle line, the confirmation dialog, cell labels, win message, heading, page title). NFR-5 is shared by design with `puzzle-engine`, which owns the hint sentences and CLI errors; the page only displays hint sentences and never restates them. NFR-5 is therefore a shared, per-text-owner requirement and not a double-owned or unowned one.

## DOM contract used by the scenarios

Scenarios are decided from the DOM only (text content, classes, data attributes, element presence, roles and ARIA attributes, `tabindex`, `document.activeElement`, and computed style in jsdom), and, for FR-64 and FR-65, from the parsed text of `src/ui/style.css`. Indices are 1-based, matching the rows and columns shown to the player. The engine interface (`openspec/specs/puzzle-engine/spec.md`, test conventions) is 0-based, so a hint target with `row` r and `col` c is the cell with `data-row` = r + 1 and `data-col` = c + 1. The «» guillemets around labels and messages in this spec are quoting marks and are not part of the text. The apostrophe in «розвʼязано» is the modifier letter ʼ (U+02BC) (as in FR-41); an equality check on the win message compares against that code point exactly.

### Mount entry point and fixtures (spec-made contract)

FR-31 to FR-43, FR-57, FR-58 and A-4 only require that the seed is injectable. The following entry point is a contract chosen by this spec so scenarios can be written test-first; the change design may rename it only together with this spec.

- Entry point: `mountPlayPage(root: HTMLElement, options?: { seedSource?: () => number; generate?: (size: number, seed: number, level: number) => Puzzle }): void`, exported from `src/ui/`. `Puzzle` is the type the engine generator returns (engine interface in `openspec/specs/puzzle-engine/spec.md`). `src/main.ts` calls it with the `#app` element and no options.
- Mounting is synchronous: when the call returns, the header (heading «Бінарка» and the «Правила» button), the summary button, the board, the buttons (including reset), the three messages (idle, hint, win), the rules panel, the setup sheet (with the size control, the level control and the start button) and the confirmation dialog are in `root`. It replaces the previous content of `root`. Two mounts on two different roots are independent.
- Seed source: a synchronous function with no arguments that returns an integer. The page calls it exactly once for each generation attempt (the mount, each performed press of the new puzzle button and each performed press of «Почати», that is at once on a board without player entries or after «Так, почати» in the confirmation dialog, including an attempt whose generator call throws, and each retry seed after a run-out: up to 3 seeds for one action, see «Page retry on a run-out») and at no other time, and passes the returned value to the generator unchanged. When no `seedSource` is injected the page uses its own default source (see the seed requirement).
- Generator: when `generate` is not injected the page uses the engine generator. A scenario that says "fixture puzzle" injects a hand-written puzzle through `generate` (a fixture of the requested size; the page assumes `generate(n, s, l)` returns an n×n puzzle); a spy on `generate` reads `(size, seed)` pairs unless a scenario names the level; a generator that "throws" throws an ordinary `Error`, not the run-out error of the engine, unless a scenario says run-out; its givens, and its solution where a scenario needs one, are written in the test suite so that the board state a scenario needs can be reached by clicks. A scenario that says "the generator output for size N and seed S" uses the real engine generator with no injection of `generate`. The rule checker and the hint engine are always the real engine; an "expected hint" in a scenario is the engine hint called with ceiling 4 and the page language, `hint(board, 4, language)` (default `'uk'`, so `hint(board, 4)` in Ukrainian mode), as the page calls it (see «The page hint uses all four techniques»), applied to the board as read from the DOM.
- Theme stubs (A-50): jsdom has no `matchMedia`; tests install a stub on `window` that records the `change` listeners and lets the test fire them, and remove it after each test. Before and after each test the lifecycle clears `localStorage`, `sessionStorage` and cookies, removes `data-theme` and the inline `color-scheme` from `<html>` and any injected `meta[name="theme-color"]`, and calls `forgetSessionPreferences()` of `src/ui/preferences.ts`, which drops the session-only values as a page reload does (FR-115).
- Dialog stubs: jsdom has no `showModal` or `close`; tests install stubs on `HTMLDialogElement.prototype` (`showModal` sets `open`, `close` removes it) and remove them after each test; Escape is simulated by the dialog's `cancel` and `close` events. Popover stubs (A-44): jsdom has no `popover` support either, so tests install `showPopover`, `hidePopover` and `togglePopover` on `HTMLElement.prototype`, which record each call and keep an open or closed state per element, and remove them after each test (see «Setup sheet»).
- Unless a scenario names a seed, its board is a fixture puzzle; a scenario that says real engine generator uses it without naming a seed.

- Board element: `[data-board]`, with `role="group"`, the `aria-label` «Поле N×N» in Ukrainian mode or "Grid N×N" in English mode (FR-61) and `data-size` holding N. Its children are exactly the N×N cells (no row elements).
- Cell element: a `button type="button"` `[data-cell]` with an `aria-label` (FR-70), a given has `aria-disabled="true"`, and with `data-row`, `data-col`, and `data-given` equal to `true` for a given and `false` otherwise. A given also carries the class `cell-given`. A cell that a hint filled carries the class `cell-hinted` (FR-66). A cell's shown text is empty, `0` or `1`.
- Highlighted cell: carries the class `cell-violation` and `aria-invalid="true"` (FR-61); no other cell has `aria-invalid`.
- Size control: `[data-control="size"]` with `role="radiogroup"`, three `button[role="radio"]` in the order 4, 6, 8 labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8»; `aria-checked="true"` on the marked size, which is the size shown whenever the sheet is closed (see «Marked choice»). It sits inside the setup sheet.
- Summary button: `button[data-action="setup"]` with the class `setup-button`, in the place of the size control in the page order; its `popovertarget` names the setup sheet. Its children are a visually hidden prefix span, a text span `.setup-summary` with `N×N · Name` and a decorative span `.setup-cue` with `aria-hidden="true"` (see «Summary button»).
- Setup sheet: `[data-section="setup"]`, a `popover` element (`popover="auto"`) with `role="dialog"` and the `aria-label` «Поле і складність»; it holds the size control, the level control, the start button `[data-action="setup-start"]` «Почати» and the close button `[data-action="setup-close"]` «Закрити». Its opening in tests follows the popover stubs and the opening rule of A-44: a test opens it by calling the stubbed `showPopover()`, marks the option by a click, then presses «Почати» (see «Setup sheet» and «Start button»).
- Level control: `[data-control="level"]` with the class `level-control`, `role="radiogroup"` and the `aria-label` «Складність», inside the sheet after the size control. After the reason line it holds four `button[role="radio"]` in the order 1 to 4 (Розминка, Задачка, Головоломка, Мозколамка); each has a name span `.level-name` and a description span `.level-text`, with one ordinary space between the two spans. `aria-checked="true"` is on the marked level, which is the level shown whenever the sheet is closed; at 4×4 levels 2 to 4 carry `aria-disabled="true"` (see «Level selector» and «Level option content»).
- Start button: `button[data-action="setup-start"]` with `type="button"` and the visible text «Почати», a direct child of the setup sheet after the level control and before the close button; it is always present and never disabled (see «Start button»).
- Level reason: `p[data-level-reason]`, the first child of the level control, always present; it has the `hidden` attribute and empty text at 6×6 and 8×8 (see «Only the first level exists at 4x4»).
- Confirmation dialog: `[data-dialog="confirm"]`, a native `dialog` after the rules panel, with `[data-confirm="yes"]` «Так, почати» and `[data-confirm="no"]` «Скасувати».
- Buttons: `[data-action="hint"]` (label «Підказка»), `[data-action="reset"]` (label «Скинути») and `[data-action="new"]` (label «Нова головоломка»).
- Rules panel: `[data-section="rules"]`, a `popover` element opened by `[data-action="rules"]` in the header, with the heading «Правила», two lists (the rules list and the list of the techniques section `div[data-section="techniques"]`, whose heading `h3` is «Складніші прийоми»), six `li` items in all (three and three) and the close button «Зрозуміло»; it is the last child of the root, after the message area, outside the FR-68 sequence (see «Rules panel» and «Page document order»).
- Message regions: `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]` in this order, always present; for hint and win, empty text content means no message is shown; the idle line always holds its text (see «Idle line»); `[data-message="hint"]` and `[data-message="win"]` carry `role="status"` and the idle line has no role; the two status regions stay rendered while empty (FR-63, FR-71).
- Page root: the `root` passed to `mountPlayPage`. The header with the heading «Бінарка» is required (FR-68) and is inside the root; the document title is `document.title` («Бінарка» in Ukrainian mode, "Binarka" in English mode). `<html>` carries `data-theme` with the effective theme (FR-104) and `lang` with the page language (FR-109). The mount reads the stored language and builds every text in it (FR-113, FR-116).
- Logo: one decorative inline `svg` with `aria-hidden="true"` inside the `h1` of the `header`, built once at mount, with no text, no `id` and no `href`/`src`; its shapes carry the classes `logo-cell`, `logo-digit`, `logo-digit-ring` (see «Logo»). The gear of the settings button is the second `svg` of the header; it is not the logo.
- Ids: an `id` exists under the root only to wire the rules popover, the setup sheet and the confirmation dialog (`popovertarget`, `aria-labelledby`): the rules panel, its heading «Правила», the setup sheet, the settings panel and the element that holds the confirmation text. Each of the five ends in a number that belongs to the mount, so two pages mounted on two roots of one document share no id. No other element has an `id`, and no `for` attribute is used (FR-61).
- Settings button: `button[data-action="settings"]` with `type="button"`, the `aria-label` «Налаштування» and one decorative `svg` gear, in the header between the heading and «Правила»; its `popovertarget` names the settings panel (see «Settings button and panel»).
- Settings panel: `[data-section="settings"]`, a `popover` element (`popover="auto"`) with `role="dialog"` and the `aria-label` «Налаштування», after the message area and before the confirmation dialog; it holds the label «Тема», the theme control, the label «Мова», the language control and the close button `[data-action="settings-close"]` «Закрити».
- Language control: `[data-control="language"]` with the class `language-control`, `role="radiogroup"` and the `aria-label` «Мова» ("Language" in English mode), holding two `button[role="radio"]` with `data-language-option` `uk` and `en`, «Українська» with `lang="uk"` and "English" with `lang="en"` in both modes; `aria-checked="true"` is on the page language (see «Language control»).
- Theme control: `[data-control="theme"]` with the class `theme-control`, `role="radiogroup"` and the `aria-label` «Тема», holding three `button[role="radio"]` with `data-theme-option` `light`, `dark`, `auto` («Світла», «Темна», «Як у системі»); `aria-checked="true"` is on the current choice (see «Theme control»).
- Key events: when a scenario says the test dispatches a key, the test fires a bubbling, cancelable `keydown` or `keyup` event (`new KeyboardEvent(type, { key, bubbles: true, cancelable: true })`, with `ctrlKey`, `altKey`, `shiftKey` or `repeat` set when the scenario names them) on the named element, and reads `event.defaultPrevented` after the dispatch. Keys are named by their `key` value (`Enter`, a single space for Space, `ArrowRight`, `Home`, and so on). The page handles no key on the board (FR-59, FR-60): jsdom does not turn Enter or Space into a click on a button, so where a scenario needs the activation of a cell, the test clicks it.
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

### Requirement: Hint button fills one cell

The page SHALL, when the hint button is pressed and the hint engine returns a target cell, write the engine's value into exactly that cell and into no other cell, and SHALL give that cell the class `cell-hinted` (FR-39, FR-66). A hint-filled cell SHALL be an ordinary player cell: `data-given="false"`, no `cell-given` class, and it can be changed by clicking (the click removes `cell-hinted`, see «Hinted cell marker»).

Traces: FR-39, FR-66

#### Scenario: Hint fills the targeted cell

- **GIVEN** a rendered board on which the hint engine returns a target cell and value
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell with `data-row` = row + 1 and `data-col` = col + 1 (the engine's 0-based `row` and `col`) shows that value
- **AND** every other cell has the same text as before the press

#### Scenario: The filled cell carries the marker

- **GIVEN** a rendered board on which the hint engine returns a target cell and value
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the target cell has the class `cell-hinted`, `data-given="false"` and no `cell-given` class
- **AND** no other cell has the class `cell-hinted`

#### Scenario: Zero-based target maps to the one-based cell

- **GIVEN** a fixture puzzle whose only given cells are 0 at `data-row` 3 with `data-col` 1 and 2, so that the hint engine returns `{ kind: 'fill', row: 2, col: 2, value: 1, rule: 'pair' }` (row 3 column 3 in the page's numbering)
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell with `data-row="3"` and `data-col="3"` shows `1` and has the class `cell-hinted`
- **AND** the cell with `data-row="2"` and `data-col="2"` is unchanged

#### Scenario: Count rule fills only one cell

- **GIVEN** a board on which no pair rule and no sandwich rule applies anywhere, the board breaks no rule, and the hint engine's target is a cell of a line L through the count rule, where several cells of L are empty
- **WHEN** the player presses the hint button once
- **THEN** exactly one cell on the whole board changed text, it is the hint engine's target, and every other empty cell of L is still empty
- **AND** only that cell has the class `cell-hinted`

#### Scenario: Hint-filled cell stays editable

- **GIVEN** a cell just filled by the hint button
- **WHEN** the player clicks it
- **THEN** its text follows the cycle for player cells and `data-given` stays `false`
- **AND** it no longer has the class `cell-hinted`

#### Scenario: No fill when the hint engine has no target

- **GIVEN** a board on which the hint engine returns `kind` 'none' or 'broken' (no target cell)
- **WHEN** the player presses the hint button
- **THEN** every cell has the same text as before the press, and no cell gains the class `cell-hinted`

### Requirement: Hint button shows the engine's sentence

The page SHALL, when the hint button is pressed, show the sentence the hint engine returns in the page language (`hint(board, 4, language)`, FR-112) in `[data-message="hint"]`, including the sentence for "no rule applies" and the sentence for "the board breaks a rule", in which cases no cell is filled. The page SHALL NOT alter or rephrase the sentence.

Traces: FR-40, FR-56, FR-110

#### Scenario: Sentence shown with a fill

- **GIVEN** a board on which the hint engine returns a target cell and a sentence
- **WHEN** the player presses the hint button
- **THEN** the text content of `[data-message="hint"]` equals that sentence

#### Scenario: Sentence in English mode

- **GIVEN** a board on which the hint engine returns a target cell, and the page in English mode
- **WHEN** the player presses the hint button
- **THEN** the text content of `[data-message="hint"]` equals the English sentence of `hint(board, 4, 'en')` for that board, unchanged, and contains no Cyrillic letter

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

### Requirement: Win message when solved

In Ukrainian mode the page SHALL show the win message «Вітаємо, головоломку розвʼязано!» in `[data-message="win"]` when the rule checker recognises the board as solved after a board change, whether the change is a click or a hint fill. The apostrophe in «розвʼязано» SHALL be the modifier letter ʼ (U+02BC), not the ASCII apostrophe U+0027 and not the right single quotation mark U+2019; an equality check on the win message compares against the code point U+02BC exactly (FR-41). In English mode the win message SHALL be exactly "Congratulations, puzzle solved!" (FR-41, Q4): the U+02BC rule is a Ukrainian spelling rule and applies to the Ukrainian text only, and no English page text or hint sentence contains U+0027 or U+02BC. While the board is not solved the win region SHALL have empty text content.

Traces: FR-41, FR-111

#### Scenario: Final click solves the board

- **GIVEN** a fixture puzzle whose solution the test knows, with every cell filled with the solution except one non-given cell that shows another value (or is empty)
- **WHEN** the player clicks that cell until it shows the solution digit
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розвʼязано!» (apostrophe U+02BC)

#### Scenario: Final hint solves the board

- **GIVEN** a fixture puzzle whose solution the test knows, with exactly one cell empty, every other cell holding the solution digit, and the hint engine targeting that cell with the solution digit
- **WHEN** the player presses the hint button
- **THEN** `[data-message="win"]` has the exact text «Вітаємо, головоломку розвʼязано!» (apostrophe U+02BC)

#### Scenario: The apostrophe is U+02BC and no other character

- **GIVEN** a solved board with the win message shown, reached by either route: the final click of the scenario «Final click solves the board», or the final hint of the scenario «Final hint solves the board» (the checks below hold for both)
- **WHEN** the test reads the text of `[data-message="win"]` code point by code point
- **THEN** the text equals `Вітаємо, головоломку розв` + U+02BC + `язано!`
- **AND** the code point right after «розв» is U+02BC (its length in UTF-16 code units is 1)
- **AND** the text contains no U+0027 and no U+2019 anywhere
- **AND** the text contains Cyrillic letters and no Latin letter (`/[A-Za-z]/` and `/\p{Script=Latin}/u` do not match it), so NFR-5 still holds

#### Scenario: Full board with a violation is not a win

- **GIVEN** a board with every cell filled and at least one `cell-violation` cell
- **WHEN** the board is read
- **THEN** `[data-message="win"]` has empty text content

#### Scenario: Board stays editable after a win

- **GIVEN** `[data-message="win"]` shows the win message
- **WHEN** the player clicks a non-given cell
- **THEN** the cell changes to the next value in the cycle (the board is not locked)
- **AND** `[data-message="win"]` has empty text content, because the board is no longer solved (the puzzle has exactly one solution, so any changed cell leaves the board unsolved)

#### Scenario: The English win message

- **GIVEN** a fixture puzzle whose solution the test knows, with every cell filled with the solution except one non-given cell, and the page in English mode
- **WHEN** the player clicks that cell until it shows the solution digit
- **THEN** `[data-message="win"]` has the exact text "Congratulations, puzzle solved!", it contains Latin letters and no Cyrillic letter, and no U+0027, U+02BC or U+2019

### Requirement: New puzzle button

The page SHALL, when the «Нова головоломка» button is pressed on a board without player entries, replace the board at once with a puzzle generated for the currently shown size and the currently shown level from a new seed; when the board has player entries it SHALL first ask for confirmation (FR-67) and replace the board only after «Так, почати». Replacing the board SHALL clear the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker (FR-42, FR-66). The size control keeps its state: `aria-checked` stays on the size of the board shown. The level control keeps its state too: `aria-checked` stays on the level shown, and the summary button keeps its text (FR-42, FR-92, FR-95). The page MUST NOT require the new puzzle to differ from the old one.

Traces: FR-42, FR-43, FR-67, FR-66, FR-92, FR-95

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

- **GIVEN** the player has chosen «Головоломка» on a 6×6 board without entries, and a `generate` spy records `(size, seed, level)`
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

### Requirement: Seed is chosen outside the engine, injectable and not shown

The page SHALL obtain the seed for each puzzle from a seed source outside `src/engine/`, calling it exactly once for each generation attempt (the mount, each performed press of the new puzzle button and each performed press of «Почати», including an attempt whose generator call throws), and at no other time. One performed action makes one attempt, or up to three when each earlier attempt of it ended in a run-out of the generator (FR-88, A-38, see «Page retry on a run-out»), so «one seed per action» holds only when the first seed succeeds. A seed is never taken for a press that only marks a size or a level (FR-73, FR-100), for a press of a level that is unavailable at 4×4 (FR-91), for a requested action that the player cancelled (FR-67) and never for reset; «Почати» is never a no-op (FR-101), so even a press of «Почати» with the marked choice equal to the board shown takes a seed. It SHALL accept an injected seed source (contract in the DOM contract section) so tests are deterministic, and MUST NOT display the seed anywhere on the page, including in locale-formatted or separator-split form (in either language). When no seed source is injected, the default source SHALL give a different seed on each call (no two consecutive calls return the same seed) and every seed it returns SHALL be an integer from 0 to 2^31 - 1 inclusive. That range is the seed domain pinned by FR-51 and A-25.

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
- **THEN** none of those strings contains `987654`, none contains `Intl.NumberFormat('uk-UA').format(987654)` or `Intl.NumberFormat('en').format(987654)`, and none matches `/9\D?8\D?7\D?6\D?5\D?4/` (this covers `987 654` with a space, NBSP or narrow NBSP, `987,654` and `987.654`)

#### Scenario: Seed is not shown in English mode

- **GIVEN** the page in English mode mounted with a seed source returning 987654
- **WHEN** the test inspects every text node, `document.title` and every attribute value of every element in the root, each as a separate string
- **THEN** none of those strings contains `987654`, `987,654` or `987 654`, and none matches `/9\D?8\D?7\D?6\D?5\D?4/`

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

### Requirement: Ukrainian page text

In Ukrainian mode (the default) the page SHALL show all of its own text (the title in the header, labels, buttons including «Правила» and «Зрозуміло», the size control labels, the rules texts, the idle line, the win message, `document.title` and any user-visible attribute such as `aria-label`, `title`, `placeholder`, `alt` and the `label` attribute of `option` and `optgroup` elements, which a browser shows instead of the option text) in Ukrainian: each such text contains Cyrillic letters and no Latin letters. The digits and the sign × inside a size label such as «Поле 4×4» are not Latin letters. The digits shown in the cells of the board are puzzle content, not page text, and are not collected. Text inside an element with `aria-hidden="true"` (the decorative examples of the rules panel, A-26) is decoration made of digits and symbols, not page text, and is not collected; it holds no letter at all (see «Ukrainian texts of the header, rules panel and idle line»). Text inside an element whose own `lang` differs from `<html lang>` (the option "English", A-52) is skipped by this scan. Hint sentences are owned by the puzzle-engine capability and are only displayed here. English mode is specified by «Page text is per mode» and «English page text».

Traces: NFR-5, FR-43, FR-57, FR-71, FR-111

#### Scenario: Static page text

- **GIVEN** the page has just been mounted
- **WHEN** the test collects every non-whitespace text node under the page root (including the buttons, the size control labels and the header, the rules panel and the idle line, but not the text of `[data-cell]` elements, which is puzzle content, and not the text of elements with `aria-hidden="true"`, which is decoration), `document.title`, and the values of the attributes `aria-label`, `title`, `placeholder` and `alt` on every element in the root and of the attribute `label` on every `option` and `optgroup` element; `data-*` attributes, `class` and option `value` attributes are not user-visible and are not collected; the elements whose own `lang` differs from `<html lang>` (the option "English", A-52) are skipped
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

### Requirement: Grid size selector

The page SHALL offer a size control `[data-control="size"]` inside the setup sheet (FR-96; it is not in the page body), a segmented control: an element with `role="radiogroup"` and the accessible name «Розмір поля» (`aria-label`), holding exactly three `<button type="button" role="radio">` elements labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8» (sizes 4, 6, 8, in this order) (FR-43, A-24). The group name «Розмір поля» and the labels «Поле N×N» follow the page language ("Grid size" and "Grid N×N" in English mode, FR-111). While the sheet is open the button of the **marked** size SHALL have `aria-checked="true"` and the other two `aria-checked="false"`; while the sheet is closed `aria-checked="true"` is on the size of the board shown (FR-100, A-47); 6×6 is selected when the page is mounted. **One press of a size button only marks that size** (FR-43, FR-73, FR-100): it starts no puzzle, takes no seed, calls no generator, opens no dialog and does not close the sheet. A new puzzle of the marked size and the marked level is started only by «Почати» (FR-101, see «Start button»): it takes a new seed from the seed source (one seed per generation attempt; a run-out of the generator is retried, FR-88), renders a board of that size and level, updates the summary, and clears the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker; when the board has player entries the page SHALL first ask for confirmation (FR-67, FR-98) and start the new puzzle only after «Так, почати». The size marked at the press of «Почати» is the size performed. Until the confirmation, and after «Скасувати», `aria-checked` is on the size of the board shown (the sheet is already closed). The page calls `generate(n, seed, level)` and assumes that it returns an n×n puzzle: if the generator throws, or the returned `puzzle.givens` is not n rows of n cells, the page SHALL treat it as a generator failure and keep the previous board, the previous messages and highlights, `cell-hinted` and the previous size, and `aria-checked` SHALL stay on the size of the board that is shown, with no uncaught error (an ordinary failure is not retried; only a run-out is, see «Page retry on a run-out»). A performed and a failed «Почати» close the sheet and move focus to the summary button (FR-97, FR-101), and when the change needs the confirmation the sheet is closed first (FR-98). The page reads a size only from the three buttons, never from a free value: the behaviour «a changed value that is not exactly 4, 6 or 8 is ignored» of the earlier select-based control is REMOVED, because with three fixed buttons no free value can be submitted; the invariant that exactly three sizes exist is carried by «exactly three buttons». A press of the size button of the size already shown or already marked is specified by «Pressing the shown size changes nothing». Marking 6 or 8 keeps the marked level and marking 4 sets the marked level to 1, and one «Почати» makes one new puzzle with both, as «Size and level interplay» says. Rules, hint and win message work at the chosen size exactly as at 6. The page MUST NOT remember the choice: a reload or a new mount starts at 6 (TC-12, FR-100).

Traces: FR-43, FR-67, FR-66, FR-92, FR-97, FR-98, FR-73, FR-100, FR-101, FR-111

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

### Requirement: Reset button

The page SHALL offer a button `[data-action="reset"]` labelled «Скинути» (NFR-5). When the board has player entries, pressing it SHALL first ask for confirmation (FR-67) and reset only after «Так, почати»; on an untouched board it SHALL act at once, with no dialog, and change no cell text, no class and no message (FR-58). Resetting SHALL set every non-given cell to empty, including cells filled by a hint, keep every given cell's text and `data-given` value, keep the current size (any of 4, 6 and 8) in `[data-board]`'s `data-size` and in the size control (`aria-checked` unchanged), keep the current level in the level control (`aria-checked` unchanged) and the summary button unchanged (FR-58, FR-92, FR-95), remove every `cell-violation` class that does not come from the givens themselves (the highlights are recomputed for the reset board), empty `[data-message="hint"]` and `[data-message="win"]`, remove `cell-hinted` (FR-66), and keep the board editable. Reset SHALL NOT call the seed source or the generator. It works after a win (the solved board has entries, so the confirmation is asked, A-29). Reset is size-independent: the scenarios that touch the board are run for each N in the table below, each with a fixture puzzle of size N. Undo and restoring a saved state are not part of reset (FR-47 and FR-46 are Future).

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
- **THEN** `aria-checked="true"` is still on the same level button only and on the same size button only, the summary has the same text as before the reset, and every non-given cell shows empty text
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

The page header SHALL hold a button `[data-action="rules"]` labelled «Правила» whose `popovertarget` attribute names the `id` of the rules panel. The rules panel `[data-section="rules"]` SHALL be an element with the `popover` attribute, opened by that button with no script, and SHALL contain, in this order: the heading «Правила»; the rules list, a `ul` that is a direct child of the panel, with exactly three `li` items in this order: «Не більше двох однакових цифр поспіль у рядку чи стовпці.», «У кожному рядку та стовпці порівну нулів і одиниць.», «Усі рядки різні, і всі стовпці різні.»; the techniques section `[data-section="techniques"]` (FR-93); and one close button «Зрозуміло» with `popovertarget` naming the same `id` and `popovertargetaction="hide"` (FR-57). The techniques section SHALL hold a heading `h3` with the text «Складніші прийоми» and its own `ul` with exactly three `li` items, one sentence each, one for each of the techniques 2, 3 and 4 (FR-74 to FR-76), in this order (wording provisional until the user confirms it in chat during the slice, Q6; a confirmed change edits this table, `src/ui/strings.ts` and the tests together): the table below. The clause «exactly three list items» of FR-57 means the three items of the rules list; the techniques list is a separate list. The techniques items carry no decorative example and no `aria-hidden` descendant, and the techniques section has no `id`. A list item of the rules list MAY carry a decorative example drawn from digits and symbols inside an element with `aria-hidden="true"` (A-26, not pinned); the text of an item is its text content without the descendants that have `aria-hidden="true"`. The panel SHALL be created once at mount, sit inside the page root and outside the element that holds the board, need no new dependency, and stay the same element with the same texts after a new puzzle, a size change, a level change and a win. There SHALL be no rules block below the board and no `<details>` element anywhere on the page. Each mount SHALL give its panel an `id` that is unique in the document, so two mounts on two roots stay independent. The panel SHALL have `role="dialog"` and `aria-labelledby` naming the `id` of its heading «Правила» (also unique per mount), so assistive technology announces it as a named dialog, and the close button «Зрозуміло» SHALL carry the `autofocus` attribute, so that opening the popover moves focus into the panel (A-20). The texts of the panel follow the page language: the Ukrainian texts of the tables below are those of Ukrainian mode, the English texts are in «English page text» (FR-57, FR-93, FR-111); the structure and the counts are the same in both modes. Where the panel is drawn (bottom sheet on phones, centred panel from 48rem) is layout and is not claimed here: it is covered by the held NFR-14 (or NFR-10 / NFR-15), see `docs/requirements-held.md`.

Traces: FR-57, FR-93, NFR-5, FR-111

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

#### Scenario: The rules panel in English mode

- **GIVEN** the page in English mode
- **WHEN** the test reads `[data-section="rules"]`
- **THEN** its headings are an `h2` "Rules" and an `h3` "Harder techniques", the three rules texts and the three techniques texts are the English ones of «English page text», its close button reads "Got it", and the panel has the same structure and six `li` elements

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

In document order the page root SHALL hold: a `header` (the title, a heading with the text «Бінарка», then the settings button `[data-action="settings"]`, then the `[data-action="rules"]` button), the summary button `[data-action="setup"]` (FR-95), the board `[data-board]`, the buttons `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]` in this order, then the message area holding `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]` in this order (FR-68). The size control, the level control and the level options are not in this sequence: they sit inside the setup sheet (FR-96). The setup sheet, the rules panel (FR-57), the settings panel (FR-117) and the confirmation dialog SHALL be outside this sequence and outside the board element. The message area SHALL always be present in the DOM, with all three message elements, also while a message is shown and after every board change. The reserved height of the message area is layout and is not claimed here: it is covered by the held NFR-14 (or NFR-10 / NFR-15), see `docs/requirements-held.md`. This requirement names the summary button by its hook `[data-action="setup"]` and does not depend on the element type of the control.

Traces: FR-68, FR-95, FR-96, FR-117, FR-102

#### Scenario: Order at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test compares document positions of these elements with `compareDocumentPosition`: the `header`, `[data-action="setup"]`, `[data-board]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, `[data-message="idle"]`, `[data-message="hint"]`, `[data-message="win"]`
- **THEN** each element follows the previous one in this order
- **AND** the `header` contains a heading with the text «Бінарка», then the `[data-action="settings"]` button, then the `[data-action="rules"]` button, in this order

#### Scenario: The message area holds the three messages

- **GIVEN** the page has just been mounted
- **WHEN** the test takes the parent element of `[data-message="idle"]`
- **THEN** that element contains exactly the three elements `[data-message="idle"]`, `[data-message="hint"]` and `[data-message="win"]`, in this order, and no other `[data-message]` element
- **AND** that element follows the three action buttons in document order

#### Scenario: The panel is outside the sequence

- **GIVEN** the page has just been mounted
- **WHEN** the test reads where `[data-section="rules"]` sits
- **THEN** it is not inside the `header`, not inside the message area, not inside `[data-board]`, and it follows the message area in document order

#### Scenario: The settings panel is outside the sequence

- **GIVEN** the page has just been mounted
- **WHEN** the test reads where `[data-section="settings"]` sits
- **THEN** it is not inside the `header`, not inside the message area, not inside `[data-board]`, and it follows the message area in document order

#### Scenario: The size and level controls are not in the sequence

- **GIVEN** the page has just been mounted
- **WHEN** the test reads where `[data-control="size"]`, `[data-control="level"]` and `[data-section="setup"]` sit
- **THEN** the two controls are inside `[data-section="setup"]`, which is not inside the `header`, not inside the message area and not inside `[data-board]`, and which follows the message area in document order

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

- **THEN** after each action the nine elements of the first scenario still exist exactly once, in the same document order, and the three message elements are still in the same message area

### Requirement: Idle line

The message area SHALL hold an idle line `[data-message="idle"]` with the text «Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.» in Ukrainian mode and `Press the cells to place 0 and 1. For the rules, use the “Rules” button at the top.` in English mode (FR-71, FR-111). The two spaces inside «0 і 1» SHALL be non-breaking spaces U+00A0, one between «0» and «і» and one between «і» and «1»; every other space of the sentence is an ordinary space U+0020; the «і» is the Cyrillic letter U+0456. In English mode the two spaces inside "0 and 1" are U+00A0 as well, one between "0" and "and" and one between "and" and "1", and the quotes around Rules are U+201C and U+201D. The line SHALL always be in the DOM. It is visible only while `[data-message="hint"]` and `[data-message="win"]` both have empty text content, and this SHALL be done by CSS only: the page code never removes the line, never sets `hidden` or an inline `style` on it and never changes its text except on a language switch (FR-108). The visibility itself is layout and is not claimed here: it is covered by the held NFR-14 (or NFR-10 / NFR-15), see `docs/requirements-held.md`.

Traces: FR-71, FR-111, FR-108

#### Scenario: Idle line text, code point by code point

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the text content of `[data-message="idle"]`
- **THEN** it equals the JavaScript string `'Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.'`
- **AND** it contains exactly two U+00A0 characters, and the character after the first one is U+0456

#### Scenario: The English idle line, code point by code point

- **GIVEN** the page in English mode
- **WHEN** the test reads the text content of `[data-message="idle"]`
- **THEN** it equals the JavaScript string `'Press the cells to place 0\u00A0and\u00A01. For the rules, use the \u201CRules\u201D button at the top.'`
- **AND** it contains exactly two U+00A0 characters

#### Scenario: The idle line stays in the DOM and untouched

- **GIVEN** a mounted page, with the text, the `hidden` attribute and the `style` attribute of `[data-message="idle"]` read at mount (no `hidden`, no `style`)
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Підказка» so that the hint message has text |
| reaches a win so that the win message has text |
| presses «Нова головоломка» |
| presses «Скинути» |

- **THEN** after each action `[data-message="idle"]` is still in the DOM exactly once, with the same text, without a `hidden` attribute and without a `style` attribute (so only CSS can hide it)

#### Scenario: A language switch keeps the idle line in the DOM and untouched in kind

- **GIVEN** a mounted page, with the element `[data-message="idle"]` read at mount
- **WHEN** the player presses "English"
- **THEN** it is the same element, without a `hidden` or `style` attribute, and its text is the English idle line

#### Scenario: The hint and win messages are empty at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-message="hint"]` and `[data-message="win"]`
- **THEN** both have empty text content and no child node (so the CSS rule that shows the idle line while both are empty can match)

### Requirement: Ukrainian texts of the header, rules panel and idle line

In Ukrainian mode every text that the header, the rules panel and the idle line show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5); in English mode each is the English counterpart of «English page text» and contains Latin letters and no Cyrillic letters (NFR-5 per mode). This covers the title «Бінарка», the button «Правила», the panel heading «Правила», the three rules texts of «Rules panel», the close button «Зрозуміло», the idle line and any `aria-label`, `title`, `alt` or `label` attribute in them. Decorative examples inside the panel (A-26) are inside elements with `aria-hidden="true"` and hold digits and symbols but no letter of any alphabet. By the user's code-organisation decision of 2026-10-05 (not a requirement) these texts are kept, in both languages, in the single module `src/ui/strings.ts` and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the last scenario below guards it as a source scan.

Traces: NFR-5, FR-111, FR-55

#### Scenario: The new texts are Ukrainian

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the texts of the header, of the rules panel (without `aria-hidden` descendants) and of the idle line, and the values of `aria-label`, `title`, `alt` and `label` attributes inside them
- **THEN** the collection contains «Бінарка», «Правила», «Зрозуміло», the three rules texts of the table in «Rules panel» and the idle line, each at least once
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The English texts of the header, rules panel and idle line

- **GIVEN** the page in English mode
- **WHEN** the test collects the texts of the header, of the rules panel (without `aria-hidden` descendants) and of the idle line, and the values of `aria-label`, `title`, `alt` and `label` attributes inside them
- **THEN** the collection contains "Binarka", "Rules", "Got it", the three English rules texts of «English page text» and the English idle line, each at least once
- **AND** every collected text matches `/[A-Za-z]/` and none matches `/\p{Script=Cyrillic}/u`

#### Scenario: Decorative examples hold no letters

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the text content of every element of the root that has `aria-hidden="true"`
- **THEN** none of these texts matches `/\p{L}/u`

#### Scenario: No Cyrillic text outside the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads every file under `src/ui/` with the extension `.ts` or `.css`, except `src/ui/strings.ts`, and `src/main.ts`
- **THEN** none of them contains a character matching `/\p{Script=Cyrillic}/u` (comments in these files are written in English)
- **AND** `src/ui/strings.ts` exists and contains the title, the idle line and the three rules texts

### Requirement: Hinted cell marker

The cell that the hint button filled SHALL carry the class `cell-hinted` until the next board change, and at most one cell SHALL carry it at any time (FR-66). The marker SHALL be removed by any later board change: a click on a non-given cell (including the hinted cell itself), a hint that fills another cell (the marker then moves to that new cell), «Нова головоломка», a press of «Почати» (at once, or after «Так, почати») and «Скинути». The marker SHALL NOT be removed by an action that changes no cell: a click on a given cell (FR-33), a hint that fills no cell (FR-25, FR-26), opening or closing the rules panel (FR-57), opening or closing the setup sheet (FR-96), marking a size or a level in the setup sheet (FR-100), a theme or language switch (FR-103, FR-108), a failed generation that keeps the previous board (FR-43), a cancelled confirmation (FR-67) and a press of the already selected size (FR-73; that press now only marks). An action that needs confirmation (FR-67) removes the marker when it is performed, not when it is requested. A given cell SHALL never carry the marker, and no cell carries it at mount. Which cue the marker draws (a cue that is not colour alone) is rendering and is covered by the held NFR-11 and NFR-14, see `docs/requirements-held.md`; this requirement pins the class only.

Traces: FR-66, FR-39, FR-88, FR-96, FR-100, FR-101, FR-103, FR-108

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
| opens the settings panel through the stubbed `showPopover()` and presses a theme option |
| opens the settings panel and presses the language option that is not shown |

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

«Нова головоломка», «Почати» and «Скинути» SHALL ask for confirmation only when the board has player entries (FR-67). A change of size or level is no longer an action of its own: it happens only through «Почати» (FR-101), and marking a size or a level asks for nothing (FR-100). A player entry is a non-given cell that is not empty; a cell filled by a hint counts as one (A-8); a board that was just solved has entries, so the confirmation is also asked after a win (A-29). The confirmation SHALL be a native `<dialog>` `[data-dialog="confirm"]`, created once at mount inside the page root, outside the board element and outside the sequence of «Page document order» (it follows the rules panel), closed at mount, and opened with `showModal()`. It SHALL hold the text «Почати заново? Ваші ходи на цьому полі буде втрачено.» ("Start over? Your moves on this board will be lost." in English mode, with the buttons "Yes, start over" and "Cancel", FR-111) and exactly two `<button type="button">`: `[data-confirm="yes"]` with the text «Так, почати» and `[data-confirm="no"]` with the text «Скасувати». «Так, почати» SHALL close the dialog (calling `close()`) and then perform the pending action exactly as it would on an untouched board. «Скасувати», and Escape (the dialog's `cancel` and `close` events with no button pressed), SHALL close the dialog and leave unchanged the board, the size and the level (`aria-checked`), the summary, the hint message, the win message, the highlights and `cell-hinted`; no seed is taken and the generator is not called. A cancelled action is dropped: it is never performed later. On a board with no player entries the action happens at once and `showModal()` is never called. When the pending action is the press of «Почати», the sheet is closed first and then the dialog opens, and «Скасувати» (which drops the pending action), Escape and «Так, почати» end with focus on the summary button (FR-98, see «Sheet and confirmation»). The pending action is the marked size and level taken at the press of «Почати». Reading rule: wherever another requirement of this capability says that pressing «Нова головоломка», changing the size, changing the level or pressing «Скинути» has an effect (for example «Highlighting follows every board change», «Hint message stays until the next hint or a new puzzle» and the size steps of «Board rendering and default size»), the effect happens when the action is performed: at once on a board without player entries, after «Так, почати» on a board with entries; a requested but unperformed action has no effect. The dialog SHALL have `aria-labelledby` naming the `id` of the element that holds its text (unique per mount), so assistive technology announces the question (A-20). When the page opens the dialog it SHALL move focus to «Скасувати» (after `showModal()`), so that the safe choice is the default and two key presses cannot discard the player's moves (A-20; the user's decision of 2026-10-06, review round 1). Where the dialog is drawn and its focus ring are layout and are covered by the held NFR-13 and NFR-14, see `docs/requirements-held.md`.

Traces: FR-67, FR-42, FR-43, FR-58, FR-66, FR-90, FR-98, FR-100, FR-101, FR-111

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

### Requirement: Cell labels

Every cell SHALL have an `aria-label` in the page language, in Ukrainian mode of the form «Рядок R, стовпець C, V» and in English mode of the form "Row R, column C, V", followed by an optional suffix, where R and C are the 1-based row and column and V is «порожньо» ("empty" in English mode) for an empty cell, «0» for a zero and «1» for a one (FR-70). A given cell appends «, задано» (", given"); the cell that a hint filled (FR-66) appends «, підказка» (", hinted"); any other cell has no suffix, and a cell does not get a suffix for being in violation. The label SHALL be updated after every change of the cell (a click, a hint, reset, a new puzzle, a size change). A label contains no Latin letters (NFR-5).

Traces: FR-70, FR-66, NFR-5, FR-111

#### Scenario: The four label forms

- **GIVEN** a mounted 6x6 fixture board whose givens are `1` at (1, 4), `0` at (5, 3), `1` at (5, 4) and `1` at (5, 5), so that the hint engine returns row 5, column 6, value 0 (the pair rule)
- **WHEN** the player presses «Підказка», and the test reads the labels of the cells (3, 2), (1, 4) and (5, 6), after clicking (3, 2) once for the digit form
- **THEN** the label of (3, 2) before the click is «Рядок 3, стовпець 2, порожньо» and after one click is «Рядок 3, стовпець 2, 0»
- **AND** the label of (1, 4) is «Рядок 1, стовпець 4, 1, задано»
- **AND** the label of (5, 6) is «Рядок 5, стовпець 6, 0, підказка»

#### Scenario: The four label forms in English

- **GIVEN** a mounted 6x6 fixture board whose givens are `1` at (1, 4), `0` at (5, 3), `1` at (5, 4) and `1` at (5, 5), the page in English mode
- **WHEN** the player presses "Hint", and the test reads the labels of the cells (3, 2), (1, 4) and (5, 6), after clicking (3, 2) once for the digit form
- **THEN** the label of (3, 2) before the click is "Row 3, column 2, empty" and after one click is "Row 3, column 2, 0"
- **AND** the label of (1, 4) is "Row 1, column 4, 1, given" and the label of (5, 6) is "Row 5, column 6, 0, hinted"

#### Scenario: Labels follow every change of the cell

- **GIVEN** a mounted fixture board and a non-given cell (R, C) that is empty
- **WHEN** the player clicks it three times, one click at a time
- **THEN** its label reads «…, 0», «…, 1» and «…, порожньо» in turn, with the same R and C each time
- **AND** after a hint has filled a cell its label gains «, підказка», and after a click on that cell the suffix is gone and the digit has moved on in the cycle
- **AND** after «Скинути» (confirmed when entries exist) every non-given cell reads «…, порожньо» and every given keeps its «, задано» label

#### Scenario: A violation adds no suffix

- **GIVEN** a mounted fixture board on which the player made three equal digits side by side in a row of non-given cells, so the three cells carry `cell-violation`
- **WHEN** the test reads their labels
- **THEN** each label is «Рядок R, стовпець C, V» with V the digit and nothing after it
- **AND** a given cell that is part of a violation keeps exactly the suffix «, задано»

#### Scenario: Labels use the size of the board

- **GIVEN** a mounted page showing a board of size N from the table below, with a fixture puzzle

| N | Label of the last cell when it is an empty non-given cell |
|---|-----------------------------------------------------------|
| 4 | Рядок 4, стовпець 4, порожньо |
| 6 | Рядок 6, стовпець 6, порожньо |
| 8 | Рядок 8, стовпець 8, порожньо |

- **WHEN** the test reads the `aria-label` of the cell at `data-row` N and `data-col` N
- **THEN** it equals the label of the row of the table

### Requirement: Ukrainian texts of the confirmation dialog, size control and cell labels

In Ukrainian mode every text that the confirmation dialog, the size control and the cells expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5); in English mode each is the English counterpart of «English page text» ("Grid size", "Grid 4×4", "Start over? Your moves on this board will be lost.", "Yes, start over", "Cancel", "Row R, column C, empty") and contains Latin letters and no Cyrillic letters. This covers the group name «Розмір поля», the labels «Поле 4×4», «Поле 6×6» and «Поле 8×8», the confirmation text «Почати заново? Ваші ходи на цьому полі буде втрачено.», «Так, почати», «Скасувати», every cell label of «Cell labels», and any `aria-label`, `title`, `alt` or `label` attribute among them. Digits, «×» and the cell digits are not Latin letters. By the user's code-organisation decision of 2026-10-05 (not a requirement) these texts are kept in `src/ui/strings.ts`, the single module created by `update-page-layout`; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it.

Traces: NFR-5, FR-43, FR-67, FR-70, FR-111

#### Scenario: The new texts are Ukrainian

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the text nodes of the size control, of the confirmation dialog, the `aria-label` of the size control and of every `[data-cell]`, and every `title`, `alt` and `label` attribute inside them
- **THEN** the collection contains «Розмір поля», «Поле 4×4», «Поле 6×6», «Поле 8×8», «Почати заново? Ваші ходи на цьому полі буде втрачено.», «Так, почати» and «Скасувати»
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`
- **AND** the source scan of `update-page-layout` (no Cyrillic outside `src/ui/strings.ts`) still finds nothing

#### Scenario: The English texts of the dialog, the size control and the cells

- **GIVEN** the page in English mode
- **WHEN** the test collects the text nodes of the size control, of the confirmation dialog, the `aria-label` of the size control and of every `[data-cell]`
- **THEN** the collection contains "Grid size", "Grid 4×4", "Grid 6×6", "Grid 8×8", "Start over? Your moves on this board will be lost.", "Yes, start over" and "Cancel"
- **AND** every collected text matches `/[A-Za-z]/` and none matches `/\p{Script=Cyrillic}/u`

### Requirement: Cells expose a Ukrainian name and their state

The page SHALL give every `[data-cell]` an `aria-label` that is its label as «Cell labels» defines it, «Рядок R, стовпець C, V» with the optional suffix «, задано» or «, підказка» (FR-70; in English mode "Row R, column C, V" with the suffix ", given" or ", hinted"), so that the accessible name of a cell is its FR-70 label (FR-61). The label SHALL match the cell's text content, which stays empty, `0` or `1` (FR-34), and SHALL be rewritten whenever the cell changes (a click, a hint fill, a reset, a new board). The page SHALL set `aria-disabled="true"` on every given cell (FR-69) and on no other cell, and SHALL NOT set `aria-readonly` on any element, because that attribute is not allowed on a button. The page SHALL set `aria-invalid="true"` on exactly the cells that carry the class `cell-violation` (the same set, including every cell of a line highlighted for too many of one digit) and SHALL remove the attribute from every other cell, with the attribute absent rather than `"false"`. A given cell in a violation carries both `aria-disabled="true"` and `aria-invalid="true"`.

Traces: FR-61, FR-70, FR-69, FR-35, FR-36, FR-37, FR-38, FR-111

#### Scenario: Names of a fresh board

- **GIVEN** a 6x6 fixture board whose only givens are `0` at row 3 columns 1 and 2
- **WHEN** the test reads `aria-label` of the cells at row 2 column 3, row 3 column 1 and row 6 column 6
- **THEN** they are «Рядок 2, стовпець 3, порожньо», «Рядок 3, стовпець 1, 0, задано» and «Рядок 6, стовпець 6, порожньо»
- **AND** for every cell the name equals the FR-70 label built from its `data-row`, `data-col`, text content, `data-given` and `cell-hinted`

#### Scenario: Names in English mode

- **GIVEN** a 6x6 fixture board whose only givens are `0` at row 3 columns 1 and 2, and the page in English mode
- **WHEN** the test reads `aria-label` of the cells at row 2 column 3, row 3 column 1 and row 6 column 6
- **THEN** they are "Row 2, column 3, empty", "Row 3, column 1, 0, given" and "Row 6, column 6, empty"

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
- **THEN** after each step `[data-message="hint"]` and `[data-message="win"]` are the same element objects as at mount, still connected to the root, still `role="status"`, and the hint region shows the engine sentence and the win region shows «Вітаємо, головоломку розвʼязано!» (apostrophe U+02BC) when the earlier requirements say so

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

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule with literal `#rrggbb` values, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65). The tokens are `--color-page`, `--color-text`, `--color-cell-bg`, `--color-cell-border`, `--color-given-bg`, `--color-given-border`, `--color-violation-bg`, `--color-violation-border`, `--color-violation-text`, `--color-focus`, `--color-control-bg`, `--color-control-border` and `--color-win-text`. The colour scan applies to every declaration outside a `:root` rule, wherever it is in the file (top level, nested rules, `@media`, `@supports`, `@layer`): its value SHALL NOT match `/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i` and SHALL NOT contain a CSS named colour (the full CSS Color 4 list); the keywords `transparent`, `currentcolor`, `inherit`, `initial`, `unset` and `revert` are allowed because they introduce no colour; the colour-bearing shorthands `background`, `border`, `border-top`, `border-right`, `border-bottom`, `border-left`, `outline`, `box-shadow`, `text-decoration` and `column-rule` are allowed only when their colour is a `var(--color-...)` token (or the value is `none` or `0`); and no `--color-*` property is declared outside a `:root` rule. Selectors such as `#app` are not declaration values and are not affected. The rules `body`, `.cell`, `.cell-given`, `.cell-violation`, `button`, `.message-win` and the `:focus-visible` rules SHALL take their `color`, `background-color`, `border-color` and `outline-color` from these tokens, declared with those longhand properties. The dark palette is one more `:root` rule in the same file, `:root[data-theme="dark"]`, which redefines every one of the tokens with a `#rrggbb` value (A-51): each token therefore has exactly two value sets, light in the top-level `:root` and dark in that block. The page always sets `data-theme` on `<html>` (FR-104, FR-116), so the stylesheet has no `prefers-color-scheme` block (Q13). The colour scan counts `:root[data-theme="dark"]` as a `:root` rule: `--color-*` properties and `#rrggbb` literals are allowed in it and nowhere else. The 13 tokens above are those of the baseline; a token that the signed design adds for «Почати» (S, FR-101) joins the list and is declared in both value sets. A `:root` rule inside `@media`, `@supports` or `@layer` may redefine tokens too, and then every resulting token set (the top-level set, the top-level set with the overrides of `:root[data-theme="dark"]` applied, and the top-level set with each conditional block's overrides applied) SHALL satisfy every pair below: **every contrast pair holds for each token set, light and dark** (FR-65). The shipped stylesheet has exactly the two value sets and no conditional `:root` block; the clause about conditional blocks is the generality of the test helper, not a feature of the stylesheet. The WCAG 2 contrast ratio, computed from relative luminance, SHALL be at least 3:1 for these pairs: the cell border `--color-cell-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`; the violation cue `--color-violation-border` against `--color-page`, `--color-cell-bg` and `--color-violation-bg`; the given cue against `--color-page`, `--color-cell-bg` and `--color-given-bg`; the focus ring `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-violation-bg`; and the control border `--color-control-border` against `--color-page`. The given cue is the border of a given cell: 2px wide, in `--color-given-border` (the colour of `.cell-given`'s `border-color`), together with the bold digits (`font-weight: 700`); the fill `--color-given-bg` is a redundant decoration and is not the cue, because a pale fill cannot reach 3:1 against the page and the cell colour and keep the digit readable. The text SHALL have at least 4.5:1: `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-control-bg`, `--color-violation-text` against `--color-violation-bg`, and `--color-win-text` against `--color-page`.

Traces: FR-65, FR-64, NFR-9, FR-104

#### Scenario: Tokens exist and are literal

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` rule
- **THEN** each of the 13 token names listed above is declared once with a `#rrggbb` value
- **AND** the rule `:root[data-theme="dark"]` declares each of the same names once with a `#rrggbb` value, so each token has exactly two value sets

#### Scenario: Rules use the tokens and no colour literal is left

- **GIVEN** every declaration of `src/ui/style.css` outside the `:root` rules (the top-level one and `:root[data-theme="dark"]`), found by walking the parsed stylesheet through nested rules and at-rules
- **WHEN** the test applies the colour scan above to each value
- **THEN** none matches the literal pattern or contains a named colour, every colour-bearing shorthand has a `var(--color-...)` colour or the value `none` or `0`, every `color`, `background-color`, `border-color` and `outline-color` value is a single `var(--color-...)` of a declared token or an allowed keyword, and no `--color-*` property is declared outside `:root`
- **AND** `body` declares `background-color` `var(--color-page)` and `color` `var(--color-text)`; `.cell` declares `border-color` `var(--color-cell-border)` and `background-color` `var(--color-cell-bg)`; `.cell-given` declares `border-color` `var(--color-given-border)` and `background-color` `var(--color-given-bg)`; `.cell-violation` declares `border-color` `var(--color-violation-border)`, `background-color` `var(--color-violation-bg)` and `color` `var(--color-violation-text)`

#### Scenario: A token redefined in a conditional block is checked too

- **GIVEN** the top-level token set, the dark set (the top-level set with the overrides of `:root[data-theme="dark"]` applied) and every `:root` rule found inside `@media`, `@supports` or `@layer` in `src/ui/style.css`
- **WHEN** the test builds each resulting token set and computes every pair of this requirement for it
- **THEN** every pair of every set meets its threshold (the light and the dark set always exist; a conditional block adds sets only if the file has one)

#### Scenario: The page has no prefers-color-scheme block

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches it for `prefers-color-scheme`
- **THEN** there is no match

#### Scenario: Cell borders have 3:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the WCAG contrast ratio of `--color-cell-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`
- **THEN** each ratio is at least 3

#### Scenario: The given cue has 3:1 and is not the fill

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and the declarations of `.cell-given`
- **WHEN** the test computes the ratio of `--color-given-border` against `--color-page`, `--color-cell-bg` and `--color-given-bg`
- **THEN** each ratio is at least 3
- **AND** `.cell-given` declares `border-width` 2px, `border-color` `var(--color-given-border)` and `font-weight` 700
- **AND** the cue distinguishes a given cell from an ordinary one without the fill: `--color-given-border` differs from `--color-cell-border` and the given `border-width` (2px) is greater than the ordinary one (1px)

#### Scenario: The violation cue has 3:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-violation-border` against `--color-page`, `--color-cell-bg` and `--color-violation-bg`
- **THEN** each ratio is at least 3

#### Scenario: The focus ring has 3:1 against every cell background

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-violation-bg`
- **THEN** each ratio is at least 3

#### Scenario: The control border has 3:1 and the text has 4.5:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-control-border` against `--color-page`, of `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg` and `--color-control-bg`, of `--color-violation-text` against `--color-violation-bg`, and of `--color-win-text` against `--color-page`
- **THEN** the first ratio is at least 3 and the others are at least 4.5

#### Scenario: The cascade gives each cell state the colours whose contrast is checked

- **GIVEN** the injected stylesheet and the four cell kinds at N = 4, 6 and 8 of "The computed border is heavier for a violation at every size", and the token values converted to `rgb(r, g, b)` strings, once with the light values and once with the dark values (the test injects the stylesheet with the values of the set substituted)
- **WHEN** the test reads `getComputedStyle(cell)` `borderTopColor`, `backgroundColor` and `color` of each kind
- **THEN** an ordinary cell has `--color-cell-border`, `--color-cell-bg` and `--color-text`; a given cell has `--color-given-border`, `--color-given-bg` and `--color-text`; a violating cell and a given cell in a violation both have `--color-violation-border`, `--color-violation-bg` and `--color-violation-text`
- **AND** the page (`body`) computes `background-color` `--color-page`

#### Scenario: The contrast helper is not vacuous

- **GIVEN** the contrast function of the test helpers
- **WHEN** it is called for `#ffffff` against `#000000`, for `#ffffff` against `#ffffff` and for the pair `#d1d5db` and `#f9fafb`
- **THEN** it returns 21, 1 and a value below 3 respectively

### Requirement: The page meets the WCAG 2.2 AA criteria of the accessibility requirements

The page SHALL meet WCAG 2.2 AA for what FR-43, FR-59 to FR-65, FR-67, FR-69, FR-70 and FR-87 to FR-101, FR-102, FR-107 to FR-109 and FR-117 cover (NFR-9): language of page 3.1.1 (`<html lang>` is "uk" or "en" and matches the page language, FR-109) and language of parts 3.1.2 (the two language options carry their own `lang`, A-52), keyboard operation 2.1.1 (every cell and every control reached by Tab in reading order and operated by Enter and Space as a native button, FR-59 and FR-60), name, role and value 4.1.2 (the role and name of the board group, of the four radiogroups, of the summary button, of the settings button, of the start button «Почати», of the setup sheet and of the settings panel, the cell names, `aria-checked` (the marked state in the two radiogroups while the sheet is open, FR-100), `aria-disabled`, `aria-invalid`), labels 3.3.2 (the accessible names «Розмір поля», «Складність», «Тема», «Мова» and «Налаштування» and the visible text of each size button, each level button, each theme option, each language option and the summary button), status messages 4.1.3 (the two `role="status"` regions), use of colour 1.4.1 (the heavier violation border and `aria-invalid`) and non-text contrast 1.4.11 (the 3:1 pairs) and visible focus 2.4.7 (the `:focus-visible` rules). Every button of the page (the cell buttons, the size radio buttons, the level radio buttons, the summary button, the start button, the settings button and the close buttons of the sheet and of the settings panel included; the name of a button without `aria-label` is its text content without `aria-hidden` descendants) SHALL have a non-empty accessible name in the page language: its `aria-label` when it has one (every cell), otherwise its text; the board group, the four radiogroups, the setup sheet and the settings panel SHALL have a non-empty `aria-label` in the page language (the option of the other language keeps its own language, A-52). No element of the page SHALL have a `tabindex` attribute, before or after play. Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).

Traces: NFR-9, NFR-5, FR-43, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, FR-65, FR-67, FR-69, FR-70, FR-87, FR-88, FR-91, FR-95, FR-96, FR-97, FR-98, FR-99, FR-100, FR-101, FR-102, FR-117, FR-107, FR-108, FR-109

#### Scenario: Every button, the radiogroups, the sheet and the board have a Ukrainian name

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test computes the accessible name of each `button` (its `aria-label` when present, else its text content without `aria-hidden` descendants) and of each `[role="radiogroup"]`, of `[data-section="setup"]` and of `[data-board]` (their `aria-label`)
- **THEN** there are 60 buttons (36 cells and 24 others: the two language options, «Правила», the settings button, the summary button, three size buttons, four level buttons, three theme options, «Почати», «Закрити», the settings panel's «Закрити», «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати»), four radiogroups, the setup sheet, the settings panel and the board, every name is non-empty, matches `/\p{Script=Cyrillic}/u` and does not match `/[A-Za-z]/` (except the name of the option "English", whose own `lang` differs from `<html lang>`, A-52)
- **AND** the names include «Підказка», «Скинути», «Нова головоломка», «Розмір поля», «Поле 6×6», «Складність», «Поле і складність», «Налаштування», «Тема», «Світла», «Темна», «Як у системі», «Мова», «Українська», "English", «Почати», «Закрити», `Поле і складність: 6×6 · Розминка`, the four level buttons as name, space and description, and the 36 cell names

#### Scenario: No element of the page has a tabindex, before and after play

- **GIVEN** a mounted page on a 6x6 fixture
- **WHEN** the test reads every element of the root at mount, and again after a click on a cell and a hint press
- **THEN** no element of the root has a `tabindex` attribute at either moment

#### Scenario: The level radiogroup exposes its state

- **GIVEN** a mounted page, and the same page after «Поле 4×4»
- **WHEN** the test reads the `aria-checked` and `aria-disabled` attributes of the four level buttons
- **THEN** at 6x6 exactly one button has `aria-checked="true"`, none has `aria-disabled`, and at 4x4 exactly one has `aria-checked="true"` and three have `aria-disabled="true"`, so the state of the group is exposed by attributes and not by colour alone

#### Scenario: The theme radiogroup exposes its state

- **GIVEN** a mounted page with `localStorage` empty, and the same page after «Темна» is pressed
- **WHEN** the test reads `aria-checked` of the three theme options
- **THEN** exactly one option has `aria-checked="true"` («Як у системі» at first, «Темна» after the press), the others `"false"`, and none has `aria-disabled`

#### Scenario: The language radiogroup exposes its state

- **GIVEN** a mounted page with `localStorage` empty, and the same page after "English" is pressed
- **WHEN** the test reads `aria-checked` of the two language options
- **THEN** exactly one has `aria-checked="true"` («Українська» at first, "English" after the press), and `<html lang>` and the `lang` of each option are as in «Document language and title»

#### Scenario: The radiogroups expose the marked state while the sheet is open

- **GIVEN** a mounted 6×6 page at «Розминка», the sheet opened, and «Поле 4×4» marked
- **WHEN** the test reads `aria-checked` and `aria-disabled` of the three size buttons and the four level buttons
- **THEN** `aria-checked="true"` is on «Поле 4×4» only and on «Розминка» only, and «Задачка», «Головоломка» and «Мозколамка» have `aria-disabled="true"`
- **AND** after the sheet is closed by a `toggle` event with `newState` `closed`, `aria-checked="true"` is on «Поле 6×6» only and no level button has `aria-disabled`

#### Scenario: English mode names every control

- **GIVEN** a mounted page on a 6x6 fixture in English mode
- **WHEN** the test computes the accessible name of each `button` and of each `[role="radiogroup"]`, of `[data-section="setup"]`, of `[data-section="settings"]` and of `[data-board]`
- **THEN** there are the same 60 buttons, four radiogroups, the sheet, the settings panel and the board, every name is non-empty, matches `/[A-Za-z]/` and does not match `/\p{Script=Cyrillic}/u` except the name of the option «Українська» (its own `lang` differs)
- **AND** `<html lang>` is `en`

### Requirement: Every cell is its own Tab stop

The page SHALL make every `[data-cell]` of the board shown its own Tab stop: the cells are reached by Tab in reading order (row by row, left to right), after the summary button and before the hint button (FR-59, FR-68, FR-69, FR-95), and the page SHALL NOT put a `tabindex` attribute on any element of its root, at mount and after every board change. The page SHALL NOT handle the Arrow, Home and End keys, with or without Ctrl, Shift or Alt: it handles no key event on the board or its cells, so no key event on the board or a cell is default-prevented (Tab, Shift+Tab, PageUp, PageDown, Escape and letters included), no key moves DOM focus, and no key changes a cell (FR-59). Showing a board (the mount, a performed new puzzle, a performed «Почати», a reset) SHALL NOT move DOM focus, with one exception: «Почати» and the close button «Закрити» of the setup sheet return DOM focus to the summary button (FR-97, FR-101, see «Choosing and closing the sheet»); when «Почати» needs the confirmation, DOM focus goes to «Скасувати» while the dialog is open and then to the summary button (FR-98). A press on a size button or a level button inside the sheet moves no focus: it stays on the pressed button. A press on a theme option or a language option leaves DOM focus on the pressed option (it shows no board, FR-103, FR-108, FR-117); after a language switch the focused element is the same element as before the switch. A hint, whether or not it fills a cell, SHALL leave DOM focus on the hint button. Tab and Shift+Tab are the browser's. A new puzzle or «Почати» whose generation fails keeps the previous board and its cells.

Traces: FR-59, FR-43, FR-68, FR-69, FR-95, FR-97, FR-100, FR-101, FR-103, FR-117, FR-108

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

#### Scenario: A theme press leaves the focus on the option

- **GIVEN** the settings panel opened through the stubbed `showPopover()` and the test focus on the option «Темна»
- **WHEN** the player presses «Темна»
- **THEN** `document.activeElement` is still the option «Темна», and the page has added no `tabindex` to any element

#### Scenario: A language press leaves the focus on the option

- **GIVEN** the settings panel opened through the stubbed `showPopover()` and the test focus on the option "English"
- **WHEN** the player presses "English"
- **THEN** `document.activeElement` is still that option element (the same element object), and the page has added no `tabindex` and no key handler

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

The page SHALL give `[data-board]` `role="group"` and the `aria-label` «Поле N×N» in Ukrainian mode or "Grid N×N" in English mode for the size N of the board shown (digits and the sign × U+00D7, no letter of the other script), and the children of the board SHALL be exactly its N×N `[data-cell]` buttons, in reading order (FR-61, FR-69). No element of the page SHALL have `role="grid"`, `role="row"` or `role="gridcell"`, and no `[data-cell]` SHALL carry a `role` attribute (a button keeps its own role). The attributes and classes of the DOM contract on cells (`data-cell`, `data-row`, `data-col`, `data-given`, `cell-given`, `cell-violation`) are unchanged. The page SHALL put an `id` on a descendant of its root only to wire the rules popover, the setup sheet, the settings panel and the confirmation dialog: the rules panel, the heading inside it, the setup sheet, the settings panel and the element that holds the confirmation text (FR-57, FR-96, FR-117, FR-67). Each of these five ids ends in a number that belongs to the mount, so two pages mounted on two roots of one document share no id, and no other descendant of the root has an `id`. The page SHALL NOT use a `for` attribute. The stylesheet SHALL NOT use `display: contents` on any rule, because that has a history of dropping the semantics of the element it is applied to (here the board group and the cell buttons).

Traces: FR-61, FR-43, FR-57, FR-67, FR-69, FR-96, FR-117, FR-111

#### Scenario: Role and name of the default board

- **GIVEN** the page is mounted with the default size
- **WHEN** the test reads `[data-board]`
- **THEN** it has `role="group"` and `aria-label` equal to «Поле 6×6»
- **AND** it has exactly 36 children, and they are exactly the 36 `[data-cell]` buttons, with `data-row` and `data-col` running row by row and left to right from (1, 1) to (6, 6)
- **AND** no element of the root has `role="grid"`, `role="row"` or `role="gridcell"`, and no cell has a `role` attribute

#### Scenario: The group name in English mode

- **GIVEN** the page in English mode with the default size
- **WHEN** the test reads `[data-board]`
- **THEN** it has `role="group"` and `aria-label` equal to "Grid 6×6", and after the board 4×4 and the board 8×8 are shown the names are "Grid 4×4" and "Grid 8×8"

#### Scenario: The group name follows the size

- **GIVEN** a mounted page with the real engine generator
- **WHEN** the player selects 4×4 and then 8×8
- **THEN** after 4×4 the board has `aria-label` «Поле 4×4», `role="group"` and 16 cell children; after 8×8 it has «Поле 8×8», `role="group"` and 64 cell children

#### Scenario: A failed size change keeps the board and its name

- **GIVEN** a 6x6 fixture page and an injected `generate` that throws for size 8
- **WHEN** the player selects 8×8
- **THEN** the board keeps `aria-label` «Поле 6×6», `role="group"` and its 36 cells

#### Scenario: The cell contract is unchanged and only five elements have ids

- **GIVEN** a rendered board
- **WHEN** the test reads every cell and every element of the root
- **THEN** every cell still has `data-cell`, `data-row`, `data-col` and `data-given`, `cell-given` exactly on the givens, and the text content empty, `0` or `1`
- **AND** exactly five descendants of the root have an `id`: the element `[data-section="rules"]`, the heading inside it, the element `[data-section="setup"]`, the element `[data-section="settings"]` and the element that holds the confirmation text; each id ends in digits, and no element has a `for` attribute
- **AND** after a click, a hint, a size change, a level change, a theme press and a new puzzle the same five elements are the only ones with an `id`

#### Scenario: Two mounts share no id

- **GIVEN** the page is mounted on two roots in the same document
- **WHEN** the test reads the ids under each root
- **THEN** each root has five ids, the ten ids are pairwise different, and `document.querySelectorAll('[id]')` finds exactly those ten elements

#### Scenario: No rule drops semantics with display: contents

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test searches it for `display: contents` (any spacing)
- **THEN** there is no match

### Requirement: The size radiogroup has an accessible name

The size radiogroup `[data-control="size"]` (FR-43) SHALL have the accessible name «Розмір поля», given by its `aria-label`, and each of its three size buttons SHALL be labelled by its own visible text «Поле N×N»: a size button SHALL NOT carry `aria-label` or `aria-labelledby` (FR-62). No text of the page SHALL show «Розмір поля», and the page SHALL contain no `label` element and no `select`: the frozen design has no visible label for the control (FR-62). The name has Cyrillic letters and no Latin letters in Ukrainian mode (NFR-5); in English mode the group name is "Grid size" and the buttons are labelled "Grid 4×4", "Grid 6×6" and "Grid 8×8" (FR-43, FR-111), with Latin letters and no Cyrillic letters.

Traces: FR-62, FR-43, NFR-5, FR-111

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

#### Scenario: The size group is named in English

- **GIVEN** the page in English mode
- **WHEN** the test reads `[data-control="size"]` and its three buttons
- **THEN** the `aria-label` is "Grid size", the button texts are "Grid 4×4", "Grid 6×6" and "Grid 8×8" in this order, none of the buttons has `aria-label` or `aria-labelledby`, and no text matches `/\p{Script=Cyrillic}/u`

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила» and the settings button, the summary button, the three size buttons, the four level buttons, the three theme options, the two language options, the close button «Закрити» of the settings panel, the start button «Почати» and the close button «Закрити» of the setup sheet, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the 2px gap between cells shows the page colour on the ring's inner side, the ring's outer edge lands on a neighbour's fill (the pairs `--color-focus` against cell, given and violation fills, 6.70, 5.41 and 4.63 with the design's values) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all. The open setup sheet SHALL keep a keyboard-focused control clear of its sticky footer row (FR-65 "unobscured", WCAG 2.4.11): the open sheet declares a `scroll-padding-bottom` of at least the footer height, so the browser's own focus scrolling brings a focused option above the footer (second review-gate fix round, 2026-10-10, autonomy-log row 126).

Traces: FR-65, FR-87, FR-95, FR-97, FR-101, FR-102, FR-117, FR-107

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
- **WHEN** the test reads `[data-action="rules"]`, the summary button `[data-action="setup"]`, the three size `button[role="radio"]` and the four level `button[role="radio"]` (FR-87), the three theme `button[role="radio"]` (FR-102), the two language `button[role="radio"]` (FR-107), the settings button `[data-action="settings"]`, the close button `[data-action="settings-close"]`, the start button `[data-action="setup-start"]`, the close button `[data-action="setup-close"]`, `[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, the close button of `[data-section="rules"]`, `[data-confirm="yes"]`, `[data-confirm="no"]` and every `[data-cell]`
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

### Requirement: The size buttons set their own colours and the board disables double-tap zoom

The stylesheet SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule that styles the size buttons (`.size-control button`) and in the rule of the checked button (`.size-control button[aria-checked='true']`), so that the colours of the size buttons do not depend on the browser or the operating system (FR-65). For each state, the declarations of the rule for the unchecked button, with those of the rule for the checked button laid over them for the checked state, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens), for each token set, light and dark (A-51, FR-65). The stylesheet SHALL set `touch-action: manipulation` in the rule of the class `board`. The element `[data-board]` SHALL carry the class `board`.

Traces: FR-65, NFR-9

#### Scenario: The size buttons declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.size-control button` and of `.size-control button[aria-checked='true']`
- **THEN** `.size-control button` declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`
- **AND** the checked state, with its own declarations laid over the unchecked ones, has a `color` and a `background-color` that are such tokens
- **AND** the ratio of the text colour to the background colour is at least 4.5 in each of the two states in the light token set and in the dark token set

#### Scenario: The board sets touch-action

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test reads the declarations of the `.board` rule and the classes of `[data-board]`
- **THEN** `touch-action` is `manipulation` and `[data-board]` has the class `board`

### Requirement: Logo

The page header SHALL show exactly one inline `<svg>` logo inside its heading, drawn as shapes in the page source: a 2×2 mini board with the digits «1 0 / 0 1» in a circle with 0/1 rays, and no text (FR-72). The mini board SHALL be four cell shapes `.logo-cell` (`rect`) in a 2×2 arrangement, each holding one digit shape: a bar for 1 (a `rect` with the class `logo-digit`) and a ring for 0 (an `ellipse` with the class `logo-digit-ring`), so that in reading order (top-left, top-right, bottom-left, bottom-right) the four digits are 1, 0, 0, 1. The circle SHALL be a `circle` element and the rays SHALL be shapes around it: bars (`rect`) for 1 and rings (`ellipse`) for 0, at least one of each. The SVG SHALL hold no `<text>` element, no `<title>`, no `<desc>`, no `<foreignObject>`, no text node of any kind (not even whitespace) and no word; its text content is empty. It SHALL be decorative: `aria-hidden="true"`; the title in the header remains the page's text heading, with the text «Бінарка». It SHALL NOT use an image file: no `<img>`, no `<image>`, no `<use>` and no `href` or `xlink:href` on any element of the SVG, no `src` attribute anywhere on the page (TC-14). The logo SHALL be created once at mount with the header, so a new puzzle, a size change and a win leave exactly one logo, the same element. The logo adds no page text, so NFR-5 is unaffected. The header holds one more inline `svg`, the drawn gear inside the settings button `[data-action="settings"]` (see «Settings button and panel»): it has `aria-hidden="true"`, no `<text>`, `<title>`, `<desc>`, `<foreignObject>`, `<use>`, `href` or `xlink:href` and no text node, and it is not the logo; these two are the only `svg` elements of the root (TC-14 and FR-72, amended 2026-10-10, autonomy-log rows 120 and 121: the logo and the gear are the two inline graphics allowed, and FR-72 describes the logo only). In the rest of this requirement «the svg» means the logo. Legibility of the four digits at 40 px and the look of the mark are covered by the held NFR-15 (and NFR-14), see `docs/requirements-held.md`; the classes, the tag choices and "the same element after a board change" above are spec-made proxies for FR-72 and TC-14, taken from the frozen design (`design/v0/components/binarka-page.tsx`, the source of A-30) and the mount-once structure of the page so that the shapes are checkable in jsdom; they are not requirements of FR-72 itself.

Traces: FR-72, TC-14, FR-117

#### Scenario: One decorative inline logo in the header

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `header` element of the root
- **THEN** the heading in the header contains exactly one `svg` element (the logo), and the root contains exactly one other `svg`, the gear inside `[data-action="settings"]`, and no third
- **AND** both have `aria-hidden="true"`
- **AND** the heading in the header has the exact text content «Бінарка» (the logo adds no text to it)

#### Scenario: The logo holds no text

- **GIVEN** the page has just been mounted
- **WHEN** the test walks every node under the `svg`
- **THEN** there is no `text`, `title`, `desc` or `foreignObject` element and no text node (a `TreeWalker` over `SHOW_TEXT` finds none)
- **AND** the `svg`'s `textContent` is the empty string

#### Scenario: The gear holds no text and no reference

- **GIVEN** the page has just been mounted
- **WHEN** the test walks every node under the gear `svg`
- **THEN** there is no `text`, `title`, `desc`, `foreignObject` or `use` element, no text node, and no element has an `href` or `xlink:href` attribute

#### Scenario: The mini board shows 1 0 / 0 1

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the shapes of the `svg` with the classes `logo-cell`, `logo-digit` and `logo-digit-ring`
- **THEN** there are exactly four `rect` elements with the class `logo-cell`, with two distinct `x` values and two distinct `y` values, each of the four (x, y) combinations occurring once
- **AND** there are exactly four digit shapes, one in each cell, and in reading order of the cells they are: a `rect.logo-digit` (1), an `ellipse.logo-digit-ring` (0), an `ellipse.logo-digit-ring` (0), a `rect.logo-digit` (1)
- **AND** reading order means the cells ordered by (`y`, then `x`) ascending, the values read with `getAttribute` and compared as numbers
- **AND** each digit shape lies inside its cell: for a `rect.logo-digit` its `x` and `y` (and for an `ellipse.logo-digit-ring` its `cx` and `cy`) are within the cell's `x` to `x` + `width` and `y` to `y` + `height`, and exactly one digit shape lies in each cell

#### Scenario: Circle and 0/1 rays

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `svg`
- **THEN** it contains exactly one `circle` element
- **AND** it contains at least one `rect` and at least one `ellipse` that carry none of the classes `logo-cell`, `logo-digit` and `logo-digit-ring` (the rays: bars for 1, rings for 0)

#### Scenario: No image file is used

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the whole root
- **THEN** the root contains no `img`, `image`, `use`, `picture`, `object`, `embed` or `canvas` element
- **AND** no element of the root has a `src` attribute, and no element of the `svg` has an `href` or `xlink:href` attribute

#### Scenario: The repository holds no image asset

- **GIVEN** the source tree
- **WHEN** the test lists every file under `src/` (and under `public/` if that directory exists; it does not exist today), and reads `index.html` and `src/ui/style.css`
- **THEN** no file under `src/` (or `public/`) has the extension `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico` or `.svg`
- **AND** `index.html` has no `<link>` element whose `rel` contains `icon` and no `<img>` element, and `src/ui/style.css` contains no `url(`

#### Scenario: The logo survives every board change

- **GIVEN** a mounted page with a fixture puzzle and the logo element read at mount
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 (one run) and to 8 (one run) |
| reaches a win |

- **THEN** after each action the heading in the header still holds exactly one `svg`, it is the same element as at mount, and it still holds no text node, and the root still holds exactly two `svg` elements (the logo and the gear)

#### Scenario: The logo does not leak the seed

- **GIVEN** the page is mounted with a seed source returning 987654 and the logo present
- **WHEN** the test inspects every text node under the page root, `document.title` and every attribute value of every element in the root, including those of the `svg` and its shapes, each as a separate string
- **THEN** none of those strings contains `987654` and none matches `/9\D?8\D?7\D?6\D?5\D?4/` (so no shape coordinate or `viewBox` accidentally spells the seed)

### Requirement: Summary button

The page SHALL show, in the place of the size control in the page order (FR-68), one button `[data-action="setup"]` with `type="button"` and a `popovertarget` attribute equal to the `id` of the setup sheet, so that it opens the sheet with no script (FR-95, A-40). The button SHALL hold three children in this order: a visually hidden prefix span with the text `Поле і складність: ` (ending in one ordinary space), a text span with the visible text `N×N · Name` for the size and the level of the board shown (the separator is « · », an ordinary space, U+00B7 and an ordinary space), for example `6×6 · Задачка`, and a decorative span `aria-hidden="true"` with the cue `▾`. At mount the visible text is `6×6 · Розминка`. The visible text SHALL be rewritten after every board that is shown (the mount, a performed «Почати», «Нова головоломка»; a reset shows the same size and level and leaves the text as it is, as «Reset button» says) and after nothing else except a language switch (FR-108), which changes its text, never its size or level: marking a size or a level (FR-100), a cancelled confirmation, a failed generation, the press of an unavailable level and the opening or closing of the sheet leave it as it was. The summary shows the board shown, never the marked choice (FR-95). The accessible name of the button is its text content without `aria-hidden` descendants, that is the prefix followed by the visible text, for example `Поле і складність: 6×6 · Задачка`; the button SHALL NOT carry `aria-label`, `aria-labelledby`, `aria-haspopup`, `aria-expanded` or `tabindex` (A-41, A-43: browsers expose the open state of a `popovertarget` button natively). The height of the button (44 CSS px) and the look of the cue are layout and are covered by the held NFR-12 and NFR-14, see `docs/requirements-held.md`. The names of the size and the level in the text come from `src/ui/strings.ts`. In English mode the hidden prefix is `Grid and difficulty: ` and the visible text uses the English level names, for example `6×6 · Teaser` (FR-111); the text and the accessible name follow the page language.

Traces: FR-95, NFR-5, NFR-9, FR-100, FR-101, FR-108, FR-111

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

#### Scenario: The summary in English mode and across a switch

- **GIVEN** a mounted 6×6 board at «Задачка» in Ukrainian mode whose summary reads `6×6 · Задачка`
- **WHEN** the player presses "English"
- **THEN** the hidden prefix is `Grid and difficulty: `, the visible text is `6×6 · Teaser`, the accessible name is `Grid and difficulty: 6×6 · Teaser`, and the board, the size and the level are unchanged

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

The page SHALL contain, created once at mount, a setup sheet `[data-section="setup"]` (FR-96, A-40): an element with the `popover` attribute and `role="dialog"`, with the `aria-label` «Поле і складність» ("Grid and difficulty" in English mode, FR-111), with an `id` that is unique in the document (it ends in a number that belongs to the mount, like the other ids), and with no `aria-labelledby` and no heading element (A-41). It SHALL sit inside the page root and outside the element that holds the board, follow the rules panel in document order and precede the confirmation dialog, need no new dependency and hold, in this order: the size control `[data-control="size"]` (see «Grid size selector»), the level control `[data-control="level"]` (see «Level selector»; it contains the reason line `[data-level-reason]` first, see «Only the first level exists at 4x4»), the start button `[data-action="setup-start"]` «Почати» (see «Start button») and the close button `[data-action="setup-close"]` with the text «Закрити», `type="button"`, `popovertarget` equal to the sheet's `id` and `popovertargetaction="hide"`. The sheet SHALL be the same element, with the same children, after a hint, a win, a reset, «Нова головоломка» and a press of «Почати» (only the attributes and texts that those requirements define change). Where the sheet is drawn (a bottom sheet on phones, a centred panel from 48rem), the footer drawing and the 44 px targets and its look are layout and are covered by the held NFR-10, NFR-12 and NFR-14, see `docs/requirements-held.md`; nothing here claims them.

Reading rule and test contract (A-44). jsdom has no `popover` support: tests install stubs for `showPopover`, `hidePopover` and `togglePopover` on `HTMLElement.prototype` that record each call and keep an open or closed state per element, and remove them after each test; the stub of `hidePopover` closes the state and dispatches no event, and a `toggle` event is dispatched by the test itself (an `Event` of type `toggle` with a `newState` property set to `closed` or `open`). The opening of the sheet by the summary button is native and not tested in jsdom: a test opens the sheet by calling the stubbed `showPopover()` on it. **Reading rule for choices (A-44, A-47).** The verb **«chooses»** (in a requirement this change does not modify also «presses», «selects», «changes the size to N» or «changes the level to X» followed by an effect on the board, the seed source, the generator, the dialog, the messages or the summary; the list is in `design.md`) means a **choice**: the test first opens the sheet this way, presses the option (which only marks, FR-100), presses «Почати», and, where the scenario confirms, `[data-confirm="yes"]`. «A size change» and «a level change» mean a board shown by such a choice. A choice of the size and level already shown is therefore not a no-op: it makes one new puzzle like «Нова головоломка». The verbs «marks» and «makes a marking press», and every use of «presses» that carries the note «(a marking press)» or «(marking presses)», mean one press on the option and no «Почати»; so do the scenarios that say a press «does nothing». `aria-checked` read after a choice is read with the sheet closed, that is on the board shown (A-47). A generator that "throws" in a scenario throws an ordinary `Error`, not the run-out error of the engine, unless the scenario says run-out.

Traces: FR-96, FR-95, FR-97, FR-94, NFR-5, NFR-9, FR-100, FR-101, FR-111

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

#### Scenario: The sheet is named in the page language

- **GIVEN** the page in English mode
- **WHEN** the test reads `[data-section="setup"]` and `[data-action="setup-start"]` and `[data-action="setup-close"]`
- **THEN** the sheet's `aria-label` is "Grid and difficulty", the texts are "Start" and "Close", and the sheet has no `aria-labelledby`

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

The setup sheet SHALL contain a level control `[data-control="level"]` after the size control (FR-44, FR-87): an element with `role="radiogroup"` and the accessible name «Складність» (`aria-label`, no visible label, as FR-62), holding exactly four `<button type="button" role="radio">` elements for the levels 1, 2, 3 and 4, in this order, with the names «Розминка», «Задачка», «Головоломка» and «Мозколамка» ("Warm-up", "Teaser", "Puzzler", "Brain-twister" in English mode, FR-111); the group name «Складність» is "Difficulty" in English mode. While the sheet is open the button of the **marked** level SHALL have `aria-checked="true"` and the other three `aria-checked="false"`; while the sheet is closed `aria-checked="true"` is on the level of the board shown (FR-87, FR-100, A-47); «Розминка» is selected when the page is mounted (FR-88). A level button SHALL NOT carry `aria-label`, `aria-labelledby` or `aria-describedby`, SHALL NOT have the `disabled` attribute or a `tabindex` attribute, and is operated by a click (the native activation of Enter and Space); arrow keys are not required and not handled (A-24, FR-59). No text of the page shows «Складність», and the page has no `label` element for the control. The page reads a level only from the four buttons, never from a free value. The content of a level button is specified by «Level option content».

**One press of an available level button only marks that level** (FR-73, FR-100): it starts no puzzle, takes no seed, calls no generator, opens no dialog and does not close the sheet. A new puzzle of the marked size and the marked level is started only by «Почати» (FR-101): the page SHALL take a new seed from the seed source, call the generator as `generate(size, seed, level)`, the three-argument form of the engine generator (FR-13, FR-81), render the new board, update the summary, and clear the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker. When the board has player entries the page SHALL first close the sheet and ask for confirmation and start the new puzzle only after «Так, почати» (FR-90, FR-98). A level choice SHALL NOT change the size. A run-out of the generator is retried with the next seed (FR-88, see «Page retry on a run-out»). If the generator fails in any other way, or the returned `puzzle.givens` is not n rows of n cells, or every retry ran out, the page SHALL keep the previous board, messages, highlights, `cell-hinted`, size and level, with `aria-checked` and the summary unchanged and no uncaught error; the page shows no error text for it, and the sheet is closed (FR-97). The page MUST NOT remember the level: a reload or a new mount starts at «Розминка» (TC-12, FR-88). Pressing the button of the level already shown or already marked is specified by «Pressing the shown size changes nothing» (FR-73); whether the pressed level exists at the size shown by «Only the first level exists at 4x4». Layout of the control, wrapping, 44 px targets and the one-screen fit are not claimed here: held NFR-10, NFR-12 and NFR-14, see `docs/requirements-held.md`.

Traces: FR-44, FR-87, FR-88, FR-97, NFR-9, NFR-5, FR-73, FR-100, FR-101, FR-111

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

### Requirement: Level option content

Each level button inside the sheet SHALL be one `button[role="radio"]` whose content is two spans separated by one ordinary space (a text node): a name span with the level name and a description span with the level description (FR-99, FR-89). There is no persistent description line on the page body, no `[data-level-description]` and no toast: the descriptions live only in the buttons. Each span is plain text with no `id`, and the button has no other child element: the radio ring that marks the checked state is drawn by the stylesheet (a pseudo-element), not by an extra element. The accessible name of a level button is therefore its name followed by one space and its description (A-42). Each description SHALL be one sentence (exactly one terminal mark at the end, no other sentence break) of at most 80 characters, and is the final wording of the user (autonomy-log rows 89 and 90); the English descriptions of «English page text» are subject to the same limits (one sentence, at most 80 characters, measured by a test; FR-89, FR-111). The Ukrainian descriptions are:

| Level | Name | Description |
|-------|------|-------------|
| 1 | `Розминка` | `Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр.` |
| 2 | `Задачка` | `Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць.` |
| 3 | `Головоломка` | `Додатково треба порівнювати рядки і стовпці: двох однакових не буває.` |
| 4 | `Мозколамка` | `Додатково треба пробувати хід наперед: якщо правило порушиться, тут інша цифра.` |

Traces: FR-99, FR-89, FR-87, FR-94, NFR-4, NFR-5, FR-111

#### Scenario: Name and description in each button

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the four level buttons
- **THEN** each has exactly two child elements, both `span`, with an ordinary space text node between them, and the texts of the first and second span are the name and the description of the row of the table, in order
- **AND** the text content of each button equals its name, one space and its description, and neither span has an `id`

#### Scenario: No description line on the page body

- **GIVEN** the page has just been mounted, and again after each level is chosen in turn
- **WHEN** the test reads the root
- **THEN** no element has the attribute `data-level-description`, and no text node outside `[data-section="setup"]` and `[data-section="rules"]` contains any of the four descriptions

#### Scenario: Every description is one sentence of at most 80 characters

- **GIVEN** the four descriptions of the table
- **WHEN** the test measures each (`string.length`) and applies `/^[^.!?…]+\.$/`, the Cyrillic check and the Latin check
- **THEN** every description has at most 80 characters, matches the pattern and the Cyrillic check, and does not match `/[A-Za-z]/`

#### Scenario: Every English description is one sentence of at most 80 characters

- **GIVEN** the four English level names and descriptions of «English page text» (Warm-up, Teaser, Puzzler, Brain-twister)
- **WHEN** the test measures each description (`string.length`) and applies `/^[^.!?…]+\.$/` and the Latin and Cyrillic checks
- **THEN** every description has at most 80 characters, matches the pattern and `/[A-Za-z]/`, and does not match `/\p{Script=Cyrillic}/u`
- **AND** in English mode each level button holds a name span and a description span with one ordinary space between them, with these texts

#### Scenario: The description does not move with a pending press

- **GIVEN** a 6×6 board with player entries and the level «Розминка»
- **WHEN** the player chooses «Задачка» (the dialog opens) and the test reads `aria-checked` of the four level buttons, then presses `[data-confirm="no"]` and reads them again
- **THEN** both times `aria-checked="true"` is on «Розминка» only, and the four buttons hold the same texts as at mount

### Requirement: Only the first level exists at 4x4

The page SHALL, while the **marked size** is 4×4 (while the sheet is closed, the size of the board shown), keep the level control visible inside the sheet with «Розминка» marked and SHALL give the buttons «Задачка», «Головоломка» and «Мозколамка» `aria-checked="false"` and `aria-disabled="true"` (FR-91, FR-44, A-34, FR-100): they are focusable and readable like the given cells (FR-69), so they have no `disabled` attribute and no `tabindex`. «Розминка» has no `aria-disabled` attribute. Pressing an unavailable level button SHALL do nothing at all (FR-73, FR-97): no dialog, no new puzzle, no seed taken, no generator call, the sheet stays open, focus stays on the button, and the board, both messages, the highlights, `aria-checked` of both groups, the summary and `cell-hinted` are unchanged. The level control SHALL hold a reason line `[data-level-reason]` as its first child, before the four buttons (FR-91 "in the level group"; the designer's iteration 10 puts it there): a `p` of plain text with no `role` and no `id`, present at every size, which while the marked size is 4×4 has no `hidden` attribute and the text `Для поля 4×4 є лише рівень «Розминка».` (in English mode the text is `The 4×4 grid has only the “Warm-up” level.`; the guillemets inside the code span are part of the text; signed wording, autonomy-log row 101; one sentence, NFR-4), and which at 6×6 and 8×8 has the `hidden` attribute and empty text content (the `hidden` mechanism is spec-made). The reason is not on the page body. The radiogroup thus holds one non-radio child; the four radio buttons are still exactly four, and the arrangement is confirmed against the signed review set in task 1.4 of this change. Marking 4×4 sets the marked level to «Розминка». As soon as the marked size is 6×6 or 8×8 (a 6×6 or 8×8 board is shown, or the sheet marks one of them), the three buttons lose `aria-disabled` and the reason is hidden, and «Розминка» stays the marked level: the page does not restore an earlier marked level. `aria-disabled` is set only on the buttons of levels the shown size does not offer. After a «Почати» whose generation fails the previous board stays, the sheet is closed, and the state of the buttons is that of the board shown. An unavailable level is marked by a cue that is not colour alone (FR-91; the stylesheet requirement «The summary and level buttons set their own colours» pins a non-colour declaration).

Traces: FR-91, FR-44, FR-97, FR-99, NFR-9, NFR-5, FR-100, FR-111

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

### Requirement: The page hint uses all four techniques

The page SHALL ask the hint engine for the next move with the technique ceiling 4, that is `hint(board, 4)`, whatever the level shown (FR-77, Q2 of the difficulty amendment; the engine's own default ceiling is 1, the three basic rules, by the user's decision of autonomy-log row 88, so the page passes 4 explicitly): the hint on a board at level 1 may be a fill by line balance, unique lines or look-ahead, and the hint on the same board is the same at every level shown. The page SHALL fill the cell the engine targets and show the engine's sentence unchanged, as «Hint button fills one cell» and «Hint button shows the engine's sentence» require. The page SHALL NOT rephrase, shorten or choose among techniques itself. Reading rule: wherever another requirement of this capability speaks of what the hint engine returns for a board (the "expected hint"), it is `hint(board, 4)`, the call the page makes; a fixture described as one on which "the hint fills nothing" or "no rule applies" must be re-asserted with `hint(board, 4)` before a scenario relies on it. What counts as each technique, and its sentence (including the "no technique applies" sentence of FR-25), are owned by the puzzle-engine capability (FR-25, FR-74 to FR-80) and are only displayed here.

Traces: FR-77, FR-39, FR-40

#### Scenario: A hint beyond the level's techniques is still given

- **GIVEN** a 6×6 fixture board `LINE_BALANCE_ONLY` shown at the level «Розминка», whose givens are chosen so that none of the pair, sandwich and count rules applies and the engine's hint (called as `hint(board, 4)` on the board as read from the DOM) is a fill by the technique of line balance (the suite asserts this premise by calling the engine and reading the technique and the target)
- **WHEN** the player presses `[data-action="hint"]`
- **THEN** the cell the engine targets shows the engine's value and has the class `cell-hinted`, and `[data-message="hint"]` shows the engine's sentence unchanged

#### Scenario: The same board gives the same hint at every level

- **GIVEN** the fixture `LINE_BALANCE_ONLY` mounted on four pages, shown at the levels «Розминка», «Задачка», «Головоломка» and «Мозколамка» (each reached by a level choice with an injected `generate` that returns the fixture)
- **WHEN** the player presses `[data-action="hint"]` on each page
- **THEN** the four pages fill the same cell with the same value and show the same sentence, equal to the engine's hint on that board

### Requirement: Ukrainian texts of the summary, the setup sheet, the level control and the techniques section

In Ukrainian mode every text that the summary button, the setup sheet, the level control and the techniques section of the rules panel show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5, FR-94); in English mode each is the English counterpart of «English page text» and contains Latin letters and no Cyrillic letters. This covers the summary's visible text and its accessible name, the visually hidden prefix, the sheet's `aria-label` «Поле і складність», the start button «Почати», the close button «Закрити», the group name «Складність», the four level names and four descriptions of «Level option content», the 4×4 reason of «Only the first level exists at 4x4», the techniques heading «Складніші прийоми», the three techniques items of «Rules panel» and any `aria-label`, `title`, `alt` or `label` attribute among them. «×», «·», «▾» and digits are not Latin letters. The 4×4 reason and the techniques items are each exactly one sentence (NFR-4, by analogy; the signed NFR-4 covers hint sentences only). By the user's code-organisation decision of 2026-10-05 these texts (the summary format parts, the visually hidden prefix, the sheet's label, the start label, the close label, the group name, the four names, the four descriptions, the 4×4 reason, the techniques heading and its three items) are kept in `src/ui/strings.ts`, and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it.

Traces: NFR-5, NFR-4, FR-94, FR-95, FR-96, FR-87, FR-89, FR-91, FR-93, FR-101, FR-111

#### Scenario: The new texts are Ukrainian

- **GIVEN** the page has just been mounted at 6×6, and the same page after «Поле 4×4»
- **WHEN** the test collects the text nodes of the summary button (without `aria-hidden` descendants), of the sheet and of the techniques section, the `aria-label` of the sheet and of the level control, and every `title`, `alt` and `label` attribute inside them
- **THEN** the collection contains `Поле і складність: `, `6×6 · Розминка`, «Поле і складність», «Почати», «Закрити», «Складність», the four level names, the four descriptions, `Для поля 4×4 є лише рівень «Розминка».`, «Складніші прийоми» and the three techniques items of «Rules panel»
- **AND** every collected text matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The English texts of the summary, the sheet, the levels and the techniques

- **GIVEN** the page in English mode at 6×6, and the same page after the board 4×4 is shown
- **WHEN** the test collects the text nodes of the summary button (without `aria-hidden` descendants), of the sheet and of the techniques section, and the `aria-label` of the sheet and of the level control
- **THEN** the collection contains `Grid and difficulty: `, `6×6 · Warm-up`, "Grid and difficulty", "Start", "Close", "Difficulty", the four level names and descriptions, `The 4×4 grid has only the “Warm-up” level.`, "Harder techniques" and the three English techniques items
- **AND** every collected text matches `/[A-Za-z]/` and none matches `/\p{Script=Cyrillic}/u`

#### Scenario: The techniques items and the reason are one sentence each

- **GIVEN** the three techniques items of «Rules panel» and the 4×4 reason
- **WHEN** the test applies `/^[^.!?…]+\.$/` to each
- **THEN** every text matches it

#### Scenario: The strings live in the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads `src/ui/strings.ts` and every other `.ts` or `.css` file under `src/ui/` and `src/main.ts`
- **THEN** `src/ui/strings.ts` contains the visually hidden prefix, the sheet's label, the start label «Почати», the close label, the group name «Складність», the four level names, the four descriptions, the 4×4 reason, the techniques heading and the three techniques items
- **AND** no other file contains a character matching `/\p{Script=Cyrillic}/u`

### Requirement: The summary and level buttons set their own colours

The summary button SHALL carry the class `setup-button` (its text span carries `setup-summary` and its cue span `setup-cue`, as in the design reference `review-set-11`), the level control the class `level-control`, and the stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule `.setup-button`, in the rule `.level-control button`, in the rule `.level-control button[aria-checked='true']` and in the rule `.level-control button[aria-disabled='true']` (FR-65, NFR-9). For each of the four states, the declarations of the plain rule, with those of the state rule laid over them, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens) in each token set, light and dark (A-51, FR-65), and the unavailable state SHALL NOT be drawn with `opacity`. The rule `.level-control button[aria-disabled='true']` SHALL also declare a cue that is not colour alone (FR-91): a `border-style` that differs from the plain rule's, or a `text-decoration` other than `none`; which cue is used follows the user's updated design (the design reference `review-set-11` uses a dashed border and a dashed radio ring and no strike-through, autonomy-log row 93). No colour literal is added, and no `--color-*` token is added unless the signed design adds one for «Почати» (the 13 tokens of «Borders, cues and focus rings have enough contrast» stay declared). The summary button, the level buttons and the close button are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator of FR-65, and the rules of the sheet obey the existing stylesheet scans (no `!important`, no `:has(` besides the idle-line rule, no `display: contents`, no removed outline). The start button `[data-action="setup-start"]` SHALL set its own explicit `color` and `background-color`, each a single `var(--color-...)` token, in one rule that matches it (found by matching the mounted element against the selectors of the stylesheet), with at least 4.5:1 contrast between the two on the resolved tokens of each token set, in the plain state and in the hover and focus-visible states if the rule has them, and without `opacity` (FR-65, FR-101). Whether the tokens of the baseline suffice for «Почати» or the signed design adds one token for it (for example a primary fill) is the design's call; a token that the design adds is declared once in `:root` with a `#rrggbb` value and satisfies the pairs of «Borders, cues and focus rings have enough contrast». The `.size-control` rules are not changed by this requirement. The look of the buttons (the ring, the sunken look of the unavailable state, the colours beyond the pairs above) is covered by the held NFR-14, see `docs/requirements-held.md`, and is not claimed here.

Traces: FR-65, NFR-9, FR-87, FR-91, FR-95, FR-97, FR-101

#### Scenario: The summary and level buttons declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.setup-button`, `.level-control button`, `.level-control button[aria-checked='true']` and `.level-control button[aria-disabled='true']`
- **THEN** each of the four rules exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`
- **AND** none of the four declares `opacity`

#### Scenario: Each state has 4.5:1 text

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and the four rules above
- **WHEN** the test lays the checked rule and the aria-disabled rule over the plain level rule, and computes the ratio of the text colour to the background colour for the summary, plain, checked and unavailable states
- **THEN** each of the four ratios is at least 4.5 in each token set

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
- **AND** the ratio of the text colour to the background colour is at least 4.5 in each token set

#### Scenario: The existing stylesheet scans still pass

- **GIVEN** the stylesheet with the sheet, summary and level rules
- **WHEN** the existing scans of «Rules use the tokens and no colour literal is left», «Nothing removes the outline» and «The stylesheet stays inside the build target, with one `:has(` exception» run
- **THEN** each passes unchanged, and each of the 13 token names of the baseline is still declared in `:root`

### Requirement: Action buttons meet the touch-target floor

The three action buttons «Підказка» (`[data-action="hint"]`), «Скинути» (`[data-action="reset"]`) and «Нова головоломка» (`[data-action="new"]`) SHALL each be at least 44×44 CSS px at every viewport (NFR-12). The stylesheet `src/ui/style.css` SHALL give each of them a `min-height` of at least `2.75rem` (44 px at the 16 px root, the value the other controls already use) as an ordinary declaration: no `!important`, not inside a media query, and without changing the `min-height`, padding, size or markup of any other control. The widths of the three buttons are already 97 px or more and SHALL NOT be reduced below 44 px. The buttons keep their markup, order, `type="button"` and behaviour (see «Hint button fills one cell», «Reset button» and «New puzzle button»). jsdom has no layout (TC-13), so the unit test decides the declaration, and the real-browser check `e2e/nfr-12-targets.spec.ts` (`npm run test:e2e`, project `layout`, eight sampled viewports) decides the measured size; the sampled viewports are not continuum coverage. Making the buttons taller SHALL NOT break NFR-10 (the 375×812 fit at 6×6): `e2e/nfr-10-fit.spec.ts` stays green. The wording of NFR-12 for the other controls and for the cells is unchanged and is not restated here. Cells and controls other than the three action buttons already meet their floors; this requirement adds nothing to them (that no other rule is edited is a review-gate item, not a test).

Traces: NFR-12

#### Scenario: The stylesheet declares a 44 px minimum height for each action button

- **GIVEN** the page is mounted in jsdom and the text of `src/ui/style.css` is applied to the document
- **WHEN** the test reads the computed `min-height` of `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]`
- **THEN** each value is a length of at least 44 px (`2.75rem` or more at the 16 px root, `44px` or more)
- **AND** every rule that declares that `min-height` for an action button is at the top level of the stylesheet, not inside an at-rule such as `@media`
- **AND** no `min-height` declaration in the stylesheet has the priority `important`

#### Scenario: A declared minimum height below the floor fails the stylesheet test

- **GIVEN** the `min-height` declaration of the action buttons is deleted from `src/ui/style.css`, or set to `2.5rem` (40 px)
- **WHEN** the stylesheet test runs
- **THEN** it fails for each of the three buttons, because the computed `min-height` is empty, `0` or below 44 px

#### Scenario: Measured in a real browser the buttons are at least 44 px tall at every sampled viewport

- **GIVEN** the built page is open in Chromium at each of the eight viewports of `e2e/nfr-12-targets.spec.ts` (320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900, 1280×420, 844×390)
- **WHEN** the check measures «Підказка», «Скинути» and «Нова головоломка»
- **THEN** each is at least 44 px wide and at least 44 px tall, and the spec reports no line `page: button «…» is …x40, floor 44x44`

#### Scenario: The taller buttons keep the phone page fitting on one screen

- **GIVEN** the built page is open in Chromium at 375×812 at 6×6 in the default, hint and win states
- **WHEN** `e2e/nfr-10-fit.spec.ts` measures the page
- **THEN** it still passes: the board, the buttons and the messages fit without vertical scroll, and the buttons hold still when a message appears

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

### Requirement: Settings button and panel

The page header SHALL hold, between the title and the button «Правила» (document order: the heading, then `[data-action="settings"]`, then `[data-action="rules"]`), a settings button `[data-action="settings"]` with `type="button"`, whose only child is one decorative inline `svg` (a drawn gear, `aria-hidden="true"`, no text), with the accessible name «Налаштування» ("Settings" in English mode) given by its `aria-label` and a `popovertarget` equal to the `id` of the settings panel, so that it opens the panel with no script (FR-68, FR-117, signed wireframe Topic 3 B, autonomy-log row 120). The button carries no `aria-haspopup`, `aria-expanded` or `tabindex`. The settings panel `[data-section="settings"]` SHALL be created once at mount, inside the page root and outside the header, the board and the message area; it is an element with the `popover` attribute (`popover="auto"`) and `role="dialog"`, with the `aria-label` «Налаштування» ("Settings" in English mode), no `aria-labelledby`, and an `id` that ends in a number belonging to the mount (the fifth id of the mount, A-41 amended). It holds, in this order: the visible plain-text label «Тема» and the theme control `[data-control="theme"]` (see «Theme control»), the visible plain-text label «Мова» and the language control `[data-control="language"]` (see «Language control»), and a close button `[data-action="settings-close"]` with the text «Закрити», `type="button"`, `popovertarget` equal to the panel's `id` and `popovertargetaction="hide"`. The panel follows the message area in document order and precedes `[data-dialog="confirm"]`; it is outside the sequence of «Page document order». Escape, a click outside the panel (the light dismiss) and the close button close it natively; the page adds no key handler and no focus handling for it (FR-59). The panel is the same element, with the same children, after a hint, a win, a reset, «Нова головоломка», a press of «Почати», a theme press and a language press. Where the button is drawn, the bottom sheet on the phone and the panel under the header at the right on tablet and desktop, the gear's drawing and the 44 px sizes are layout, covered by NFR-12 (see «The theme options meet the touch-target floor») and the held NFR-14 (`review-set-13`). The hooks `[data-action="settings"]`, `[data-section="settings"]` and `[data-action="settings-close"]` are spec-made proxies, to confirm against the signed review set (task 1.4).

Traces: FR-68, FR-102, FR-117, NFR-9, FR-107, FR-111

#### Scenario: Settings button and panel at mount

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="settings"]` and `[data-section="settings"]`
- **THEN** exactly one of each exists in the root; the button is a `button` with `type="button"`, `aria-label` equal to «Налаштування», `popovertarget` equal to the panel's `id`, no `aria-haspopup`, `aria-expanded` or `tabindex`, and exactly one child element, an `svg` with `aria-hidden="true"` and no text node
- **AND** the panel has the `popover` attribute, `role="dialog"`, `aria-label` equal to «Налаштування», no `aria-labelledby`, a non-empty `id`, is not inside the `header`, `[data-board]` or the message area, follows the message area and precedes `[data-dialog="confirm"]`
- **AND** its element children, in order, are a plain-text element with the text «Тема», `[data-control="theme"]`, a plain-text element with the text «Мова», `[data-control="language"]` and `[data-action="settings-close"]`

#### Scenario: The header fits its column on phones

- **GIVEN** the built page open in Chromium at each sampled width 320, 322, 334, 361, 369, 375, 385, 768 and 1280 px, 812 px high (the check lives in `e2e/nfr-10-header-fit.spec.ts`, project `layout`; added in the second review-gate fix round, autonomy-log row 130, after the gear made the header overflow at 320 to 334 and 361 to 385 px)
- **WHEN** the check reads the boxes of the header and of its three children (the heading, the settings button, «Правила») and the page's scroll width
- **THEN** every child lies inside the header (within 0.5 px) and the scroll width is at most the viewport width (no sideways scroll, `docs/frontend-conventions.md` rule 18, A-14)
- **AND** coverage is sampled; the stricter instrument is the 1 px sweep of 320 to 800 px (`docs/qa/add-theme-switch/header-sweep-run.txt`). Up to 30rem the title is 1.75rem and the logo 2.75rem (the design's phone rule); up to 22.5rem the title is 1.5rem, the «Правила» padding `0 0.625rem` (both the design's small-phone rule) and the gaps 0.375rem, a deliberate step under the design's 0.5rem: with 0.5rem gaps «Правила» still overflowed by up to 2.8 px at 320 to 322 px

#### Scenario: A remount on the same root replaces the previous mount

- **GIVEN** a `matchMedia` stub that does not match and a page mounted on a root (added in the first review-gate fix round of `add-english-version`: the page attaches its content to the root last, so the previous mount's controls are still connected while a remount runs)
- **WHEN** the page is mounted again on the same root and the player presses "English"
- **THEN** the stub holds one `change` listener (the replaced mount's listener was removed at the remount), and the replaced mount's language control is not rendered again (its "English" option keeps `aria-checked="false"`)

#### Scenario: The close button

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="settings-close"]`
- **THEN** it is a `button` with `type="button"`, the text «Закрити», `popovertarget` equal to the panel's `id`, `popovertargetaction="hide"` and no `tabindex`

#### Scenario: The settings button and panel are named in English

- **GIVEN** the page in English mode
- **WHEN** the test reads `[data-action="settings"]`, `[data-section="settings"]` and the labels in the panel
- **THEN** the button's and the panel's `aria-label` are "Settings", the labels read "Theme" and "Language", and the close button reads "Close"

#### Scenario: The panel opens and closes with no script

- **GIVEN** the page has just been mounted, and `showPopover`, `hidePopover` and `togglePopover` are installed as spies
- **WHEN** the test clicks `[data-action="settings"]` and then `[data-action="settings-close"]`
- **THEN** no spy was called, and the board, the messages, the summary, `aria-checked` of every group and every cell are unchanged

#### Scenario: The header order is the title, the settings button, «Правила»

- **GIVEN** the page has just been mounted
- **WHEN** the test compares the document positions of the heading «Бінарка», `[data-action="settings"]` and `[data-action="rules"]`
- **THEN** each follows the previous one, and all three are inside the `header`

#### Scenario: Two mounts stay independent

- **GIVEN** the page is mounted on two roots in the same document
- **WHEN** the test reads the `popovertarget` of each root's settings button and settings close button
- **THEN** the two panels have different `id` values, and each button names the panel of its own root

#### Scenario: The panel survives every action

- **GIVEN** a mounted page with a fixture puzzle, the panel element and its children read at mount
- **WHEN** the player presses «Підказка», reaches a win, presses «Скинути», «Нова головоломка», chooses a size and a level, presses a theme option and presses the language option that is not shown (each from a freshly mounted page, confirmed where asked)
- **THEN** after each action there is exactly one `[data-section="settings"]`, it is the same element as at mount, with the same five children

### Requirement: Theme control

The page SHALL offer a theme control `[data-control="theme"]` (FR-102): an element with `role="radiogroup"` and the accessible name «Тема» ("Theme" in English mode, `aria-label`), holding exactly three `<button type="button" role="radio">` elements in this order, labelled «Світла», «Темна» and «Як у системі» ("Light", "Dark", "System" in English mode, Q6, FR-111), with the attribute `data-theme-option` equal to `light`, `dark` and `auto`. The option that is chosen SHALL have `aria-checked="true"` and the other two `aria-checked="false"`. With nothing valid stored the option «Як у системі» is chosen (Q14, see «Invalid or missing stored values fall back»). Each option is labelled by its own visible text and carries no `aria-label` and no `aria-labelledby` (as FR-62); the group has no `aria-labelledby` and shows no visible label. The control and its options carry no `id`. **The control sits in the settings panel** (Topic 3, option B of the signed wireframe, autonomy-log row 120), directly below a visible plain-text label «Тема» (an element that is not a `label`, with no `for`; the group's name stays its `aria-label`); the panel and the button that opens it are specified by «Settings button and panel». A test finds the control with `root.querySelector('[data-control="theme"]')` and opens the panel first through the stubbed `showPopover()` (A-44). How the panel is drawn is the design's (`review-set-13`, held NFR-14). Its texts are specified by «Texts of the settings button, the settings panel and the theme control».

Traces: FR-102, FR-68, NFR-9, FR-111

#### Scenario: Theme control structure and default

- **GIVEN** the page has just been mounted with `localStorage` empty and no `matchMedia`
- **WHEN** the test reads `[data-control="theme"]`
- **THEN** exactly one such element exists in the root, inside `[data-section="settings"]`, it has `role="radiogroup"` and `aria-label` equal to «Тема», no `aria-labelledby`, no `id`, and it contains exactly three `button` elements, each with `type="button"` and `role="radio"`, whose texts are «Світла», «Темна» and «Як у системі» in this order, with `data-theme-option` `light`, `dark` and `auto`
- **AND** the third button has `aria-checked="true"` and the other two have `aria-checked="false"`, and no option has `aria-label`, `aria-labelledby`, `tabindex` or `disabled`

#### Scenario: The control follows its visible label in the settings panel

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the children of `[data-section="settings"]`
- **THEN** a plain-text element with the text «Тема» that is not a `label` element immediately precedes `[data-control="theme"]`, and the control is not inside `[data-board]`, the message area or the header

#### Scenario: The stored choice is checked at mount

- **GIVEN** `localStorage` holds `binarka.theme` = `dark` before the page is mounted
- **WHEN** the page is mounted
- **THEN** `aria-checked="true"` is on «Темна» only, and `localStorage` still holds exactly the same value

#### Scenario: The theme control in English mode

- **GIVEN** the page mounted with `binarka.language` = `en`
- **WHEN** the test reads `[data-control="theme"]` and its options
- **THEN** the group's `aria-label` is "Theme", the option texts are "Light", "Dark" and "System" in this order, `data-theme-option` is still `light`, `dark` and `auto`, and the visible label above the group reads "Theme"

#### Scenario: The group is named by its aria-label and no label element exists

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the root
- **THEN** the root contains no `label` element and no `for` attribute, and the group's name is its `aria-label` «Тема»

### Requirement: A theme press acts at once and changes nothing else

A press on a theme option SHALL set the chosen theme, move `aria-checked` to the pressed option, apply the effective theme to the document (see «Effective theme on the document») and store the choice (see «Stored preferences») (FR-103). It takes no seed, calls no generator, asks for no confirmation and leaves the board, the entries, the highlights, `cell-hinted`, the size, the level, the summary, both messages, the marked choice of the setup sheet (FR-100) and DOM focus unchanged. A confirmation dialog is modal (`showModal()`, A-55), so no theme press can happen while a pending action exists. The press itself opens and closes nothing: the settings panel stays open (A-55), and a `popover="auto"` light dismiss caused by a click outside an open sheet or panel is the browser's (FR-97(d), A-55), which discards the marked choice as for any close. A press on the option already chosen changes nothing at all and stores nothing.

Traces: FR-103, FR-118, FR-100

#### Scenario: A theme press changes only the theme

- **GIVEN** a mounted 6×6 board with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted` and some cells with `cell-violation`, the sheet marked with «Поле 8×8» and «Мозколамка» (not closed by the test), a counting seed source, a `generate` spy and the `showModal` spy with the counts read now, the settings panel opened, and DOM focus on the option «Темна»
- **WHEN** the player presses «Темна»
- **THEN** `aria-checked="true"` is on «Темна» only, `document.documentElement` has `data-theme="dark"`, and `document.activeElement` is still «Темна»
- **AND** every cell keeps its text and class list, both messages keep their text, the summary reads `6×6 · Розминка`, and `aria-checked="true"` is still on «Поле 8×8» and on «Мозколамка» (the marked choice is unchanged)
- **AND** `showModal` was never called and the seed-source and generator call counts equal the counts read now

#### Scenario: A theme press opens and closes nothing

- **GIVEN** the page with the settings panel opened through the stubbed `showPopover()`
- **WHEN** the player presses «Світла»
- **THEN** the press called neither `showPopover` nor `hidePopover` nor `togglePopover`, and the stub state of the settings panel is still open

#### Scenario: Pressing the chosen option changes nothing

- **GIVEN** a mounted page with `binarka.theme` = `dark` stored, and a `setItem` spy on `localStorage`
- **WHEN** the player presses «Темна»
- **THEN** `setItem` was not called, `aria-checked="true"` is still on «Темна» only and `data-theme` is still `dark`

#### Scenario: Two mounts show one choice

- **GIVEN** the page mounted on two roots in the same document, with `localStorage` empty and a `matchMedia` stub that does not match (added in the second review-gate fix round, autonomy-log row 130: the document has one `data-theme`, so it has one choice)
- **WHEN** the player presses «Темна» on the first root, then «Світла» on the second root
- **THEN** after the first press `aria-checked="true"` is on «Темна» only on both roots
- **AND** after the second press `data-theme` is `light` and `aria-checked="true"` is on «Світла» only on both roots

### Requirement: Effective theme on the document

The document element `<html>` SHALL always carry the attribute `data-theme` with the effective theme, `light` or `dark`: the manual choice when it is `light` or `dark`, and the system theme while the choice is `auto` (FR-104, see «Auto follows the system»). The CSS property `color-scheme` of the root SHALL equal the effective theme (`light` or `dark`), so that native parts of the page (the dialog backdrop, scrollbars, form controls) match it; the stylesheet owns it (`:root { color-scheme: light }` and `:root[data-theme="dark"] { color-scheme: dark }`) and no script writes `color-scheme`. The palette of each theme is the stylesheet's (see «Borders, cues and focus rings have enough contrast», A-51). A press on a theme option, a change of the system theme while the choice is `auto`, the head step before the first paint (see «Preferences are applied before the first paint»), and a mount, which applies the choice it reads (see «Stored preferences» and «Failing storage does not stop the page») to the document and to every live mount, are the only things that change `data-theme`.

Traces: FR-104, FR-65, A-51

#### Scenario: The attribute follows the choice

- **GIVEN** a page mounted with `localStorage` empty and a `matchMedia` stub whose query `(prefers-color-scheme: dark)` does not match
- **WHEN** the player presses «Темна», then «Світла», then «Як у системі»
- **THEN** `document.documentElement.getAttribute('data-theme')` is `dark`, then `light`, then `light` (the system theme)

#### Scenario: The stylesheet sets color-scheme for each theme

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the `color-scheme` declarations of `:root` and of `:root[data-theme="dark"]`
- **THEN** the top-level `:root` declares `color-scheme: light` and `:root[data-theme="dark"]` declares `color-scheme: dark`

#### Scenario: The rendered colours follow the effective theme

- **GIVEN** the built page open in Chromium on a light system scheme, with `binarka.theme` = `dark` stored (the check lives in `e2e/nfr-13-a11y.spec.ts`, project `a11y`; this scenario is the binding check of `color-scheme`)
- **WHEN** the check reads the computed `background-color` of `body` and the computed `color-scheme` of `<html>`
- **THEN** the background equals the dark `--color-page` and `color-scheme` is `dark`

#### Scenario: In dark every backdrop dims the page

- **GIVEN** the text of `src/ui/style.css` and its dark token set (added in the review-gate fix round, autonomy-log row 129: the backdrops of the rules panel, the setup sheet, the settings panel and the confirmation were the text colour, which is light in dark)
- **WHEN** the test resolves the background colour of `.rules::backdrop`, `.setup-sheet::backdrop`, `.settings::backdrop` and `.confirm::backdrop` under `:root[data-theme="dark"]` (a dark override when one exists, else the plain rule)
- **THEN** each colour is a token of the dark set and is no lighter than the dark `--color-page`, so an open panel never lightens the page

### Requirement: Auto follows the system theme live

While the chosen theme is `auto`, the effective theme SHALL be `dark` when `window.matchMedia('(prefers-color-scheme: dark)').matches` is true and `light` otherwise, and the page SHALL follow a `change` event of that query at once, with no reload: `data-theme` and the browser colour (see «Browser colour follows the theme») update, and `color-scheme` follows from the stylesheet (FR-105). While the chosen theme is `light` or `dark`, a change of the system theme changes nothing. If `window.matchMedia` is missing, `auto` resolves to `light` (A-50). jsdom has no `matchMedia`: tests install a stub on `window` that returns `{ matches, media, addEventListener, removeEventListener }`, records the `change` listeners and lets the test fire them, and remove it after each test, like the popover stubs (A-44).

Traces: FR-105, FR-104, A-50

#### Scenario: Auto resolves to the system theme at mount

- **GIVEN** a `matchMedia` stub whose query matches (a dark system), and `localStorage` empty
- **WHEN** the page is mounted
- **THEN** `data-theme` is `dark`, and with a stub whose query does not match it is `light`

#### Scenario: Auto follows a live change

- **GIVEN** a page mounted with the choice `auto` on a light system stub that recorded its `change` listener
- **WHEN** the test sets the stub to match and fires the recorded `change` listener
- **THEN** `data-theme` is `dark` and the theme-color meta equals the dark `--color-page`; firing it again with the stub not matching gives `light`

#### Scenario: A manual choice ignores the system

- **GIVEN** a page with the choice `light` pressed, on a light system stub
- **WHEN** the test sets the stub to match and fires the recorded `change` listener
- **THEN** `data-theme` is still `light`; the same holds for `dark` pressed and a stub that stops matching

#### Scenario: Auto follows a live change in a real browser

- **GIVEN** the built page open in Chromium with nothing stored (auto) and the system scheme emulated light (`page.emulateMedia({ colorScheme: 'light' })`), in `e2e/nfr-13-a11y.spec.ts`
- **WHEN** the check calls `page.emulateMedia({ colorScheme: 'dark' })` without a reload
- **THEN** `<html data-theme>` is `dark`, the computed `background-color` of `body` equals the dark `--color-page`, and the `content` of `meta[name="theme-color"]` equals it too

#### Scenario: A system change writes nothing

- **GIVEN** a page mounted with the choice `auto` and a `setItem` spy on `localStorage`
- **WHEN** the test fires a `change` listener
- **THEN** `setItem` was not called

#### Scenario: A broken matchMedia does not stop the page

- **GIVEN** `window.matchMedia` that throws when called, and another run with a stub that returns an object without `addEventListener`
- **WHEN** the page is mounted
- **THEN** the mount raises no error, `data-theme` is `light` (the first run) or follows `matches` (the second run), and the board is shown

#### Scenario: Without matchMedia auto is light

- **GIVEN** no `window.matchMedia` and `localStorage` empty
- **WHEN** the page is mounted
- **THEN** `data-theme` is `light` and the mount raises no error

#### Scenario: A removed mount is dropped at the next mount

- **GIVEN** a `matchMedia` stub that does not match, a mounted page whose root is then removed from the document (added in the third review-gate fix round, autonomy-log row 130)
- **WHEN** the page is mounted on a new root, the system theme changes to dark, and the player presses «Світла» on the new root
- **THEN** the stub holds one `change` listener (the removed mount's listener was removed at the new mount, not before: the drop is lazy), the system change set `data-theme` to `dark`, and after the press the removed root's options still show «Як у системі» (they are no longer updated)

### Requirement: Browser colour follows the theme

`index.html` SHALL hold exactly one `meta[name="theme-color"]`, whose `content` equals the resolved `--color-page` value of the effective theme and which the page updates with every change of the effective theme (a theme press, a system change while the choice is `auto`) (FR-106). `index.html` holds no `meta[name="description"]` and this change adds none (Q12). The two colour values the page and the head step use for the meta are duplicates of `--color-page` of the light and the dark token set; a test asserts that they equal those tokens (see «Preferences are applied before the first paint»).

Traces: FR-106, FR-116

#### Scenario: The meta exists once and has the page colour

- **GIVEN** the text of `index.html` and of `src/ui/style.css`
- **WHEN** the test counts `meta[name="theme-color"]` and `meta[name="description"]` in the head of `index.html`
- **THEN** there is exactly one theme-color meta and no description meta

#### Scenario: A document without the meta does not stop the page

- **GIVEN** a jsdom document that has no `meta[name="theme-color"]`
- **WHEN** the page is mounted and the player presses «Темна»
- **THEN** the page raises no error and `data-theme` is `dark`

#### Scenario: The meta follows every change of the effective theme

- **GIVEN** a jsdom document with the head of `index.html` and a mounted page on a light system stub, with the choice `auto`
- **WHEN** the player presses «Темна», then «Світла», and then «Як у системі» and the test fires a `change` that makes the system dark
- **THEN** the `content` of the meta equals the `--color-page` of the dark set, of the light set, and of the dark set again

### Requirement: Stored preferences

The page SHALL store the two preferences, and no other data, in `localStorage` (FR-113, TC-12): `binarka.theme` with the value `light`, `dark` or `auto`, and `binarka.language` with the value `uk` or `en`. The page SHALL write a key only when the player presses an option of that control that is not already chosen, and it writes the value of the pressed option, also when that value is the default (`auto`, `uk`; A-48). It SHALL NOT write at the mount, at a reload, on a game action (a cell click, a hint, «Нова головоломка», «Скинути», «Почати», a mark) or on a change of the system theme. It SHALL store nothing else, ever: no game state (the board, the entries, the givens, the size, the level, the seed, the messages, the hinted cell), no marked choice of the setup sheet (FR-100), no cookie, no `sessionStorage` and no IndexedDB (TC-12). Game state is never stored; saved progress is Future (FR-46). A preference is not game state (A-48).

Traces: FR-113, FR-100, TC-12, FR-108

#### Scenario: A press writes the pressed value once

- **GIVEN** `localStorage` empty and a `setItem` spy
- **WHEN** the player presses «Темна», and then «Як у системі»
- **THEN** `setItem` was called twice, with `binarka.theme` and `dark`, then with `binarka.theme` and `auto` (the default value is written too, A-48), and `localStorage` holds no other key

#### Scenario: A language press writes the pressed value once

- **GIVEN** `localStorage` empty and a `setItem` spy
- **WHEN** the player presses "English", and then «Українська»
- **THEN** `setItem` was called twice, with `binarka.language` and `en`, then with `binarka.language` and `uk` (the default value is written too, A-48), and `localStorage` holds no other key than `binarka.language`
- **AND** a press on the option already chosen, in a separate run, calls `setItem` zero times

#### Scenario: Pressing the default option on a fresh page writes nothing

- **GIVEN** `localStorage` empty and a `setItem` spy (the option «Як у системі» is checked by default)
- **WHEN** the player presses «Як у системі»
- **THEN** `setItem` was not called: the option is already chosen, and the default is written only when the player presses it while another option is chosen (A-48), as in the scenario above

#### Scenario: Nothing else writes

- **GIVEN** a page mounted with `localStorage` empty, a `setItem` spy and a system `change` listener
- **WHEN** the player clicks cells, presses «Підказка», «Нова головоломка» (confirmed), «Скинути», marks a size and a level, presses «Почати», and the test fires the system `change`
- **THEN** `setItem` was never called, `localStorage` and `sessionStorage` hold no entry, and `document.cookie` is empty

#### Scenario: The page source names no other store

- **GIVEN** the source files under `src/` and the text of `index.html` (the head step included)
- **WHEN** the test searches them for `sessionStorage`, `document.cookie` and `indexedDB`
- **THEN** none of them matches in any file

#### Scenario: The stored choice survives a remount

- **GIVEN** a page on which the player pressed «Темна», whose root is then removed, and a new root
- **WHEN** the page is mounted again on the new root; then `binarka.theme` = `light` is stored directly and the page is mounted on a third root
- **THEN** after the first remount `aria-checked="true"` is on «Темна» only and `data-theme` is `dark`
- **AND** after the third mount `data-theme` is `light` and `aria-checked="true"` is on «Світла» only on the second and the third root (a mount reads the stored value; amended in the third review-gate fix round, autonomy-log row 130, because with the first mount alive the shared choice answered instead of storage)

#### Scenario: The stored language survives a remount

- **GIVEN** a page on which the player pressed "English", and a new root
- **WHEN** the page is mounted again on the new root
- **THEN** `aria-checked="true"` is on "English" only, `<html lang>` is `en` and the texts are English

### Requirement: Invalid or missing stored values fall back

At load the page SHALL ignore a missing key, an empty value and a value outside the list of «Stored preferences» (for example `Dark`, `system`, `ru`, `{}`) and use the default: the theme `auto` (Q14) and the language Ukrainian (FR-114). The page SHALL NOT rewrite or remove a bad value until the player presses an option.

Traces: FR-114, FR-113, FR-107

#### Scenario: Each bad theme value gives auto

- **GIVEN** `localStorage` holds `binarka.theme` = each of the values of the table below, in separate runs
- **WHEN** the page is mounted

| Stored value |
|--------------|
| (key missing) |
| (empty string) |
| `Dark` |
| `system` |
| `ru` |
| `{}` |

- **THEN** in every run `aria-checked="true"` is on «Як у системі» only, and the effective theme is the system theme
- **AND** the stored value is exactly as before the mount (no `setItem` and no `removeItem` call)

#### Scenario: Each bad language value gives Ukrainian

- **GIVEN** `localStorage` holds `binarka.language` = each of the values of the table below, in separate runs
- **WHEN** the page is mounted

| Stored value |
|--------------|
| (key missing) |
| (empty string) |
| `EN` |
| `english` |
| `de` |
| `{}` |

- **THEN** in every run `aria-checked="true"` is on «Українська» only, `<html lang>` is `uk`, and the texts are Ukrainian
- **AND** the stored value is exactly as before the mount (no `setItem` and no `removeItem` call)

### Requirement: Failing storage does not stop the page

When reading or writing `localStorage` throws (the access to `window.localStorage` throws, as in some private modes or with storage blocked, or `getItem` or `setItem` throws, for example on a quota error), the page SHALL still mount and play with no uncaught error and no message (FR-115): at load it uses the defaults of «Invalid or missing stored values fall back»; a press still applies the chosen theme or language for the rest of the session, on every later mount too, until the page is reloaded; nothing is retried.

Traces: FR-115, FR-113, FR-107

#### Scenario: The access to localStorage throws

- **GIVEN** `window.localStorage` is replaced by a getter that throws, and a `window` `error` listener
- **WHEN** the page is mounted and the player presses «Темна»
- **THEN** the `error` listener recorded nothing, the page shows its board, `aria-checked="true"` is on «Темна» only and `data-theme` is `dark`, and no text was added to the page

#### Scenario: getItem throws

- **GIVEN** `Storage.prototype.getItem` throws and a `window` `error` listener
- **WHEN** the page is mounted
- **THEN** the `error` listener recorded nothing, the theme is `auto` and the board is shown

#### Scenario: setItem throws and is not retried

- **GIVEN** `Storage.prototype.setItem` throws, counted by a spy
- **WHEN** the player presses «Темна»
- **THEN** `setItem` was called once, no error reached the page, `data-theme` is `dark`, and a second press on the same option does not call `setItem` again

#### Scenario: A later mount keeps a session-only choice

- **GIVEN** `Storage.prototype.setItem` throws, counted by a spy, a mounted page on which the player pressed «Темна», and `localStorage` holding no `binarka.theme` (added in the second review-gate fix round, autonomy-log row 130)
- **WHEN** the page is mounted on a second root in the same document while the first is still mounted
- **THEN** no error reached the page, `aria-checked="true"` is on «Темна» only on the second root, `data-theme` is still `dark`, and `setItem` was still called once

#### Scenario: A remount on the same root keeps a session-only choice

- **GIVEN** `Storage.prototype.setItem` throws, counted by a spy, and a mounted page on which the player pressed «Темна» (added in the third review-gate fix round, autonomy-log row 130)
- **WHEN** the page is mounted again on the same root, then that root is removed and the page is mounted on a new root
- **THEN** after each mount `aria-checked="true"` is on «Темна» only and `data-theme` is `dark`, and `setItem` was still called once

#### Scenario: A language press still applies when storage throws

- **GIVEN** `Storage.prototype.setItem` throws and a `window` `error` listener
- **WHEN** the player presses "English"
- **THEN** the `error` listener recorded nothing, the texts are English, `<html lang>` is `en`, and `setItem` was called once

### Requirement: Preferences are applied before the first paint

The stored theme and the stored language (or the defaults) SHALL be applied to `<html>` (`data-theme` and `lang`; `color-scheme` follows from the stylesheet), to the theme-color meta and to `document.title` by a classic inline script in the document head of `index.html` that runs before the body is parsed, not by the page module (FR-116). The static `<title>` of `index.html` stays «Бінарка»; with `en` stored the step replaces it with "Binarka". The page then mounts directly in the stored language, with `aria-checked` already on the stored options. The step follows «Invalid or missing stored values fall back» and «Failing storage does not stop the page». It is the one deliberate duplicate outside `src/ui/strings.ts` and the storage module: it holds the two key names, the two titles and the two theme-color values; a test asserts that the names and the titles equal the module's values and that the two theme-color values equal `--color-page` of the light and of the dark token set. The inline script lives in `index.html`, so lint and `tsc` do not see it; its tests are its only check. The built file SHALL keep the inline classic script ahead of the module script and the stylesheet link that Vite injects into `<head>`; the test makes the build itself (`vite build` into a temporary output directory) so a stale `dist/` can never give a green result.

Traces: FR-116, FR-114, FR-115, FR-104, FR-106, FR-109, FR-107, FR-55

#### Scenario: The head step is a classic inline script in the head

- **GIVEN** the text of `index.html`
- **WHEN** the test parses it
- **THEN** the `head` holds an inline `script` without `src`, without `type="module"`, without `defer` and without `async`, and the `body` holds no such script that sets the theme

#### Scenario: The head step sets the attributes

- **GIVEN** a jsdom document built from `index.html` and a storage stub with `binarka.theme` = `dark`, then `light`, then `auto` with a dark system stub, in separate runs
- **WHEN** the test runs the inline script
- **THEN** `data-theme` is `dark`, then `light`, then `dark`, and the theme-color `content` equals the `--color-page` of the matching token set

#### Scenario: The head step sets the language and the title

- **GIVEN** a jsdom document built from `index.html` and a storage stub with `binarka.language` = `en`, then `uk`, then a bad value, in separate runs
- **WHEN** the test runs the inline script
- **THEN** `<html lang>` is `en`, `uk` and `uk`, and `document.title` is "Binarka", «Бінарка» and «Бінарка»

#### Scenario: The head step survives bad and throwing storage

- **GIVEN** the same document with a bad stored value, and with storage whose access throws
- **WHEN** the test runs the inline script
- **THEN** it raises no error, `data-theme` is the system theme (light without `matchMedia`), `<html lang>` is `uk` and `document.title` is «Бінарка»

#### Scenario: The duplicated names and colours equal the module and the tokens

- **GIVEN** the inline script text, the storage module, and the tokens of `src/ui/style.css`
- **WHEN** the test compares them
- **THEN** both key names (`binarka.theme` and `binarka.language`) and both titles equal the module's, and the two theme-color values equal `--color-page` of the top-level `:root` and of `:root[data-theme="dark"]`

#### Scenario: The built file keeps the order

- **GIVEN** the `index.html` of a build that the test makes itself (`vite build --outDir <a temporary directory>`; the test fails with a clear message if the build fails or the file is absent, and never skips)
- **WHEN** the test reads the order of its head children
- **THEN** the inline classic script precedes the `script type="module"` and the stylesheet `link` that Vite injected

#### Scenario: An English mount shows no Cyrillic text

- **GIVEN** `binarka.language` = `en` stored, the head step run, and a `MutationObserver` on the mount root with `childList`, `subtree`, `characterData` and `characterDataOldValue`
- **WHEN** the page is mounted
- **THEN** the observer sees no Cyrillic text in an added node, a removed node or an old character value, outside an element whose `lang` differs from `<html lang>` (A-52)

### Requirement: No flash of the wrong theme on reload

With `dark` stored on a light system, with `light` stored on a dark system and with `en` stored, the head step alone SHALL put the page in the stored theme and language before the page bundle runs (NFR-18, held until its e2e spec is seen failing against the page). **Variant 1:** the test aborts the page bundle (`page.route('**/assets/*.js', r => r.abort())`; the stylesheet stays a `<link>` and loads) and asserts that `<html>` has the stored `data-theme` and `lang` and that the computed `background-color` of `body` equals the `--color-page` of the stored theme. **Variant 2** (bundle loaded): an `addInitScript` `MutationObserver` with `attributes`, `attributeFilter: ['data-theme', 'lang']` and `attributeOldValue: true` records the changes of `<html>` and the first child added to `<body>`; only records whose `oldValue` differs from the new value count, so a mount that rewrites an equal value is not a change. There is at least one counted record, the last value is the stored one, every counted record of `data-theme` and `lang` comes before that first child, and none follows during the mount; a run with no counted record fails (it must not pass vacuously). The paint itself is not measured. Sampled: 375×812 and 1280×800; the coverage is `sampled`, never continuum. Storage is set by `addInitScript` per test in a fresh browser context (no `storageState`). The spec file is `e2e/nfr-18-*.spec.ts` and `playwright.config.ts` gains one `testMatch` pattern for it (approved, autonomy-log row 117). NFR-18 is held (autonomy-log row 118) and moves into `docs/requirements.md` on the pattern of row 68 (1) once the spec is seen failing against the page without the head step (the red run is a task, not a scenario).

Traces: NFR-18, FR-116, FR-109

#### Scenario: Variant 1, the head step alone sets the theme

- **GIVEN** the built page open in Chromium with `binarka.theme` = `dark` set by `addInitScript` on a light system scheme, and the page bundle aborted, at 375×812 and at 1280×800
- **WHEN** the check reads `<html>` and the computed `background-color` of `body`
- **THEN** `<html>` has `data-theme="dark"` and the background equals the dark `--color-page`; with `light` stored on a dark system scheme the page is light in the same way

#### Scenario: Variant 2, the attribute is set before the body gets a child

- **GIVEN** the built page with the bundle loaded and an `addInitScript` observer that records `<html>` attribute changes and the first child added to `<body>`
- **WHEN** the page loads with `dark` stored on a light system scheme
- **THEN** there is at least one counted `data-theme` record, the last value is `dark`, every counted record precedes the first child of `<body>`, and no counted record follows; without a head step this scenario fails too (no record before the first child)

#### Scenario: Variant 1 and 2 for the language

- **GIVEN** the built page in Chromium with `binarka.language` = `en` set by `addInitScript`, once with the bundle aborted and once with the bundle loaded and the observer of Variant 2
- **WHEN** the check reads `<html>`
- **THEN** `lang` is `en` with the bundle aborted, and with the bundle loaded the `lang` change precedes the first child of `<body>` and none follows

### Requirement: The theme options set their own colours

The stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule that styles the theme options (`.theme-control button`) and in the rule of the chosen option (`.theme-control button[aria-checked='true']`), so that the colours do not depend on the browser, the operating system or the effective theme (FR-65, FR-117). For each state and for each token set (light and dark) the text colour against the background colour SHALL have at least 4.5:1 contrast (the WCAG 2 formula on the resolved tokens). The three options are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator. The element `[data-control="theme"]` carries the class `theme-control`, and `[data-control="language"]` carries the class `language-control` with the same pair of rules (`.language-control button` and `.language-control button[aria-checked='true']`). A chosen option differs from an unchosen one by more than colour (a ring or a mark drawn by the stylesheet, WCAG 1.4.1), as for the level buttons. How the control is laid out is the signed design's (held NFR-14).

Traces: FR-65, FR-117, NFR-9, FR-107

#### Scenario: The theme options declare their colours

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.theme-control button` and `.theme-control button[aria-checked='true']`
- **THEN** each rule exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`, and neither declares `opacity`

#### Scenario: Each state has 4.5:1 text in both themes

- **GIVEN** the light token set and the dark token set resolved from `src/ui/style.css`
- **WHEN** the test lays the checked rule over the plain rule and computes the text to background ratio for the plain and the checked state in each set
- **THEN** all four ratios are at least 4.5

#### Scenario: The chosen option has a cue besides colour

- **GIVEN** the rules `.theme-control button` and `.theme-control button[aria-checked='true']`
- **WHEN** the test compares their declarations
- **THEN** the checked rule declares a `border-style`, `border-width`, `box-shadow` or `text-decoration` that the plain rule does not

#### Scenario: The language options declare their colours and a cue

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of `.language-control button` and `.language-control button[aria-checked='true']`
- **THEN** each rule exists and declares `color` and `background-color`, each a single `var(--color-...)` of a declared token, neither declares `opacity`, the ratio of text to background is at least 4.5 in each state in the light and in the dark token set, and the checked rule declares a cue the plain rule does not

### Requirement: Texts of the settings button, the settings panel and the theme control

In Ukrainian mode every text that the settings button, the settings panel, the theme control and the language control show or expose SHALL be Ukrainian: it contains Cyrillic letters and no Latin letters (NFR-5, FR-94), with the one exception that the option "English" is named in its own language and carries `lang="en"` (A-52); in English mode each is the English counterpart of «English page text» ("Settings", "Theme", "Light", "Dark", "System", "Language", "Close") and contains Latin letters and no Cyrillic letters, with the one exception of the option «Українська». In Ukrainian mode the texts are: the accessible name «Налаштування» of the button and of the panel, the visible label and group name «Тема», the three option texts «Світла», «Темна» and «Як у системі», the visible label and group name «Мова», the two option names «Українська» and "English", the close text «Закрити», and any `aria-label`, `title`, `alt` or `label` attribute among them. The gear is a drawn `svg` (not a text glyph) and has no text. By the user's code-organisation decision of 2026-10-05 these texts are kept in `src/ui/strings.ts`, and no other file of `src/ui/` and no `src/main.ts` holds a Cyrillic character; the source scan of «Ukrainian texts of the header, rules panel and idle line» guards it.

Traces: NFR-5, FR-94, FR-102, FR-68, FR-111, FR-107

#### Scenario: The theme texts are Ukrainian

- **GIVEN** the page has just been mounted
- **WHEN** the test collects the text nodes and the `aria-label`, `title`, `alt` and `label` attributes of `[data-action="settings"]` and of `[data-section="settings"]` with everything inside it
- **THEN** the collection contains «Налаштування», «Тема», «Світла», «Темна», «Як у системі», «Мова», «Українська», "English" and «Закрити»
- **AND** every collected text, except the text and the attributes of the element with `lang="en"`, matches `/\p{Script=Cyrillic}/u` and none matches `/[A-Za-z]/`

#### Scenario: The settings and language texts in English mode

- **GIVEN** the page in English mode
- **WHEN** the test collects the same texts
- **THEN** the collection contains "Settings", "Theme", "Light", "Dark", "System", "Language", «Українська», "English" and "Close"
- **AND** every collected text, except the text and the attributes of the element with `lang="uk"`, matches `/[A-Za-z]/` and none matches `/\p{Script=Cyrillic}/u`

#### Scenario: The settings and theme texts live in the strings module

- **GIVEN** the source files of the page
- **WHEN** the test reads `src/ui/strings.ts` and every other `.ts` or `.css` file under `src/ui/` and `src/main.ts`
- **THEN** `src/ui/strings.ts` contains the Ukrainian texts of the table and the English ones of «English page text», and no other file contains a character matching `/\p{Script=Cyrillic}/u`

### Requirement: Common rules for the theme and language options

Every option of the theme control and of the language control SHALL be a `<button type="button" role="radio">` labelled by its own visible text, with no `aria-label` (as FR-62); the group names are `aria-label`s in the page language (FR-117); the two language options also carry their own `lang` (FR-107, A-52). Every option is a Tab stop in reading order, activated by Enter and Space as a native button; the page adds no key handler and no `tabindex` (FR-59, FR-60). Every option shows the `:focus-visible` indicator (FR-65, NFR-13) and is at least 44×44 CSS px (NFR-12, see «The theme options meet the touch-target floor»). The options set their own text and background colours from the tokens with at least 4.5:1 in both themes (see «The theme options set their own colours»). The control adds no `id` (the settings panel that holds it has the fifth id of the mount, see «Settings button and panel»). The language control follows the same rules.

Traces: FR-117, FR-59, FR-60, FR-62, FR-65, FR-107

#### Scenario: The options are native buttons in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the three theme options
- **THEN** each is a `button` with `type="button"` and `role="radio"`, none has `tabindex`, `aria-label` or `disabled`, and no key event dispatched on the options has `defaultPrevented` true

#### Scenario: The language options are native buttons in the tab order

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the two language options
- **THEN** each is a `button` with `type="button"` and `role="radio"`, none has `tabindex`, `aria-label` or `disabled`, each has its own `lang`, and no key event dispatched on them has `defaultPrevented` true

#### Scenario: No id is added

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the ids under the root
- **THEN** neither the theme group nor an option has an `id`, and the only new id of the mount is the settings panel's (five ids per mount in all, see «The board is a labelled group of cell buttons»)

### Requirement: The option controls are not part of the marked choice

The theme control and the language control sit in the settings panel, not in the setup sheet, so their options SHALL never be marked, need no «Почати», and a press on them SHALL leave the marked size and the marked level unchanged (FR-118, FR-100, FR-103). Opening the settings panel while the setup sheet is open closes the sheet natively (opening another `popover="auto"` closes an open one; the signed wireframe notes it for Topic 3), and the closing of the sheet then discards the marked choice as for any close (FR-97(d), FR-100). A language press behaves like a theme press (FR-108).

Traces: FR-118, FR-100, FR-103, FR-108

#### Scenario: A press leaves the marked choice alone

- **GIVEN** the sheet marked with «Поле 8×8» and «Мозколамка» and not yet closed, and the settings panel opened through the stubbed `showPopover()` with the closing `toggle` event of the sheet not yet dispatched
- **WHEN** the player presses «Темна»
- **THEN** `aria-checked="true"` is still on «Поле 8×8» and on «Мозколамка», and `hidePopover` was not called by the press

#### Scenario: A language press leaves the marked choice alone

- **GIVEN** the sheet marked with «Поле 8×8» and «Мозколамка» and not yet closed, and the settings panel opened through the stubbed `showPopover()`
- **WHEN** the player presses "English"
- **THEN** `aria-checked="true"` is still on "Grid 8×8" and on "Brain-twister" (the page is now in English), `hidePopover` was not called by the press, and a later "Start" uses `(8, 4)`

#### Scenario: Opening the panel closes the sheet and discards the marked choice

- **GIVEN** the setup sheet opened with «Поле 8×8» and «Мозколамка» marked
- **WHEN** the test opens the settings panel through the stubbed `showPopover()` on it and dispatches a `toggle` event with `newState` `closed` on the sheet (what the browser does)
- **THEN** `aria-checked="true"` is on the size and the level of the board shown in both groups, the board, the messages and the summary are unchanged, and `document.activeElement` is not moved to the summary button (focus is outside the sheet)
- **AND** `aria-checked="true"` is still on the chosen theme option

### Requirement: The theme options meet the touch-target floor

The three theme options, the settings button `[data-action="settings"]` and the settings panel's close button `[data-action="settings-close"]` SHALL each be at least 44×44 CSS px (NFR-12, FR-117). The stylesheet `src/ui/style.css` SHALL give each of them a `min-height` of at least `2.75rem` as an ordinary declaration: no `!important`, not inside a media query. The probe `e2e/nfr-12-targets.spec.ts` SHALL measure the settings button and, with the settings panel open, the options and its close button at its eight sampled viewports; the sampled viewports are not continuum coverage. jsdom has no layout (TC-13), so the unit test decides the declaration and the real-browser run decides the measured size.

Traces: NFR-12, FR-117

#### Scenario: The stylesheet declares a 44 px minimum height for the settings controls

- **GIVEN** the page is mounted in jsdom and the text of `src/ui/style.css` is applied to the document
- **WHEN** the test reads the computed `min-height` of the three theme options, `[data-action="settings"]` and `[data-action="settings-close"]`
- **THEN** each value is at least 44 px, no declaring rule is inside an at-rule such as `@media`, and no `min-height` declaration has the priority `important`

#### Scenario: Measured in a real browser the settings controls are at least 44 px in both directions

- **GIVEN** the built page in Chromium at each of the eight viewports of `e2e/nfr-12-targets.spec.ts`, with the settings panel opened by the settings button
- **WHEN** the probe measures the settings button, the three options and the panel's close button
- **THEN** each is at least 44 px wide and at least 44 px tall, and the spec reports no line for a measured control below 44×44

### Requirement: The accessibility sweep covers the manual themes

The real-browser accessibility sweep `e2e/nfr-13-a11y.spec.ts` (`npm run check:a11y`) SHALL include the states "manual dark on a light system" and "manual light on a dark system" (the sweep until now only emulates the system scheme, so a manual override would never be checked), and the state "the theme control focused from the keyboard" (NFR-13, FR-102, FR-105). In every state axe-core SHALL report no violation (text contrast 1.4.3 included); axe does not test non-text contrast (1.4.11), which rests on the stylesheet tests of «Borders, cues and focus rings have enough contrast». The coverage is `sampled`, never continuum.

Traces: NFR-13, FR-102, FR-105

#### Scenario: Manual themes pass the sweep

- **GIVEN** the built page in Chromium with `binarka.theme` = `dark` set by `addInitScript` on a light system scheme, and again with `light` on a dark system scheme
- **WHEN** the sweep runs axe-core, with the settings panel closed and with it open
- **THEN** axe reports no violation in either state

#### Scenario: A manual theme resolves the same tokens as auto on that system

- **GIVEN** (in `e2e/nfr-13-a11y.spec.ts`, project `a11y`) the page with `dark` stored on a light system scheme, and the page with `auto` on a dark system scheme
- **WHEN** the check reads the computed colours of `body`, a cell and a button in both
- **THEN** the two pages compute the same colours

#### Scenario: The focused theme option shows an indicator

- **GIVEN** (in the keyboard focus sweep of `e2e/nfr-13-a11y.spec.ts`) the page with focus moved to a theme option by Tab
- **WHEN** the sweep reads the computed outline of the focused option
- **THEN** its outline style is not `none` and its outline width is at least 2px

### Requirement: Language control

The settings panel SHALL hold, below the theme control and above its close button, a visible plain-text label «Мова» (an element that is not a `label`, with no `for`) and a language control `[data-control="language"]` (FR-107, FR-55): an element with `role="radiogroup"` and the accessible name «Мова» ("Language" in English mode, `aria-label`), holding exactly two `<button type="button" role="radio">` elements in this order: «Українська» with `lang="uk"` and "English" with `lang="en"`, each named in its own language in both modes (Q5), with the attribute `data-language-option` equal to `uk` and `en`. The option of the page language SHALL have `aria-checked="true"` and the other `aria-checked="false"`. With nothing valid stored the page language is Ukrainian and «Українська» is checked (FR-114). The page never reads `navigator.language`, `navigator.languages` or `Accept-Language`: it is Ukrainian unless `en` is stored (A-49). The control and its options carry no `id`. The rules of «Common rules for the theme and language options» apply to its options.

Traces: FR-107, FR-55, FR-117, NFR-9

#### Scenario: Language control structure and default

- **GIVEN** the page has just been mounted with `localStorage` empty and `navigator.language` stubbed to `en-US`
- **WHEN** the test reads `[data-control="language"]`
- **THEN** exactly one such element exists, inside `[data-section="settings"]` after `[data-control="theme"]`, it has `role="radiogroup"` and `aria-label` equal to «Мова», no `aria-labelledby` and no `id`, and it contains exactly two `button` elements, each with `type="button"` and `role="radio"`, whose texts are «Українська» and "English", with `lang` `uk` and `en` and `data-language-option` `uk` and `en`
- **AND** the first button has `aria-checked="true"` and the second `aria-checked="false"`, and a plain-text element «Мова» that is not a `label` element immediately precedes the control

#### Scenario: Each language is named in its own language in both modes

- **GIVEN** the page in Ukrainian mode, and again after the player presses "English"
- **WHEN** the test reads the texts of the two options
- **THEN** they are «Українська» and "English" in both modes, and the group name is «Мова» in Ukrainian mode and "Language" in English mode

#### Scenario: The stored language is checked at mount

- **GIVEN** `localStorage` holds `binarka.language` = `en` before the page is mounted
- **WHEN** the page is mounted
- **THEN** `aria-checked="true"` is on "English" only, and `<html>` has `lang="en"`

### Requirement: A language press re-renders in place and changes nothing else

A press on the language option that is not shown SHALL set the page language, store it (see «Stored preferences») and re-render every page text and accessible name in the new language, in place (FR-108): the header title, every button label, the summary text and its hidden prefix, the sheet's label, the group names and the visible labels, the size labels, the level names and descriptions, the 4×4 reason, the rules and the techniques, the idle line, the confirmation texts, the board's `aria-label`, every cell's `aria-label`, the theme and language texts, the settings texts, a hint message on screen (see «A hint message on screen re-renders as the same hint») and a win message on screen. The board, the givens, the entries, the highlights, `cell-hinted`, the size, the level, the marked choice of the setup sheet (FR-100) and DOM focus (FR-59) stay; after the switch the focused element is the same element as before. It takes no seed, calls no generator and asks for no confirmation. A confirmation dialog is modal, so no language press can happen while a pending action exists (A-55). The press itself opens and closes nothing; a `popover="auto"` light dismiss caused by a click outside an open sheet or panel is the browser's (A-55). A press on the language already shown changes nothing and stores nothing. A re-render may change the text of a non-empty `role="status"` region, so a screen reader may announce it again in the new language; this is accepted and not tested (A-53, A-28).

Traces: FR-108, FR-118, FR-100, FR-59, FR-55

#### Scenario: A language press re-renders every text

- **GIVEN** a mounted 6×6 board in Ukrainian mode with player entries, the sheet and the settings panel not open, and the test focus on the option "English" after the settings panel is opened through the stubbed `showPopover()`
- **WHEN** the player presses "English"
- **THEN** the texts of the table of «English page text» appear in place of the Ukrainian ones, the board's `aria-label` is "Grid 6×6" and the first cell's is "Row 1, column 1, empty" (or the digit form), `document.title` is "Binarka", and `aria-checked="true"` is on "English" only
- **AND** `document.activeElement` is still the option "English"

#### Scenario: A language press changes nothing else

- **GIVEN** a mounted 6×6 board at «Задачка» with player entries, a hint sentence shown, a hint-filled cell with `cell-hinted`, some cells with `cell-violation`, the sheet marked with «Поле 8×8» and «Мозколамка», a counting seed source, a `generate` spy and the `showModal` spy with the counts read now
- **WHEN** the player presses "English"
- **THEN** every cell keeps its text, its `data-given` and its class list (`cell-violation` and `cell-hinted` included), the size and the level are unchanged (the summary reads `6×6 · Teaser`), and `aria-checked="true"` is still on «Поле 8×8» and «Мозколамка» as "Grid 8×8" and "Brain-twister"
- **AND** `showModal` was never called and the seed-source and generator call counts equal the counts read now

#### Scenario: A switch never brings back a cleared message

- **GIVEN** a hint shown on a board, then «Нова головоломка» confirmed (the hint region is empty), and in another run a win shown, then a click on a non-given cell (the win region is empty)
- **WHEN** the player presses "English"
- **THEN** both regions are still empty after the switch

#### Scenario: The 4×4 state survives a switch

- **GIVEN** the sheet opened with «Поле 4×4» marked, so the three levels 2 to 4 have `aria-disabled="true"` and the reason is shown
- **WHEN** the player presses "English" in the settings panel
- **THEN** the reason reads `The 4×4 grid has only the “Warm-up” level.`, the three levels still have `aria-disabled="true"`, and `aria-checked="true"` is still on "Grid 4×4" and "Warm-up"; at a marked size of 6×6 or 8×8 the reason is still hidden with empty text

#### Scenario: Pressing the language already shown changes nothing

- **GIVEN** a mounted page with `binarka.language` = `en` stored, and a `setItem` spy
- **WHEN** the player presses "English"
- **THEN** `setItem` was not called and the texts are unchanged

#### Scenario: Switching back restores the Ukrainian texts byte for byte

- **GIVEN** the Ukrainian texts of the page read at mount
- **WHEN** the player presses "English" and then «Українська»
- **THEN** every text and accessible name equals the one read at mount

### Requirement: Document language and title

`<html lang>` SHALL be `"uk"` in Ukrainian mode and `"en"` in English mode, set at load (see «Preferences are applied before the first paint») and on every language switch (FR-109, NFR-9: WCAG 3.1.1 Language of Page). `document.title` SHALL be «Бінарка» in Ukrainian mode and "Binarka" in English mode (Q3), and the heading in the header follows the same choice. The two language options carry their own `lang` (WCAG 3.1.2 Language of Parts, A-52); no other element carries a `lang` different from `<html lang>`.

Traces: FR-109, NFR-9, NFR-5

#### Scenario: The attribute and the title follow the language

- **GIVEN** a page mounted with `localStorage` empty
- **WHEN** the test reads `<html lang>`, `document.title` and the heading in the header, then the player presses "English" and the test reads them again
- **THEN** they are `uk`, «Бінарка», «Бінарка», and then `en`, "Binarka", "Binarka"

#### Scenario: The value is one of the two codes

- **GIVEN** a page mounted with each of `localStorage` empty, `binarka.language` = `en`, `uk` and a bad value
- **WHEN** the test reads `<html lang>`
- **THEN** it is `uk`, `en`, `uk` and `uk`, and in every run it matches the page language

#### Scenario: Only the two language options carry a different lang

- **GIVEN** the page in each mode
- **WHEN** the test lists the elements of the root with a `lang` attribute different from `<html lang>`
- **THEN** they are exactly the language option of the other language

### Requirement: A hint message on screen re-renders as the same hint

After a language switch, a hint message on screen SHALL show the sentence of the **same** hint (the same technique, line, digit and cell, or the same no-rule or broken-rule sentence) in the new language (FR-110, FR-56). The page SHALL NOT compute a new hint against the current board: the hint already filled its cell, and the message stays across cell clicks (see «Hint message stays until the next hint or a new puzzle»). The page therefore keeps the data of the hint on screen (or both sentences) until the message is cleared. How the page gets the other sentence is left to the design (`design.md`); the engine stays DOM-free (TC-7) and never reads storage. A win message on screen re-renders in the new language too (see «Win message when solved»). An empty message region stays empty.

Traces: FR-110, FR-56, FR-40, FR-41

#### Scenario: A hint sentence switches language and stays the same hint

- **GIVEN** a fixture board on which `hint(board, 4, 'uk')` fills a cell with a pair sentence, the player pressed «Підказка», and `[data-message="hint"]` shows that Ukrainian sentence
- **WHEN** the player presses "English"
- **THEN** `[data-message="hint"]` shows exactly the English sentence the engine returns for that same hint on the board as it was before the fill (`hint(boardBefore, 4, 'en')`), the filled cell keeps its text and `cell-hinted`, and no other cell changed

#### Scenario: It survives a cell click and a second switch

- **GIVEN** the page of the previous scenario in English mode
- **WHEN** the player clicks a non-given cell, and then presses «Українська»
- **THEN** after the click `[data-message="hint"]` kept its English sentence, and after the switch it shows the original Ukrainian sentence byte for byte

#### Scenario: The no-rule and broken-rule sentences switch too

- **GIVEN** a board on which the hint is the no-rule sentence, and another on which it is the broken-rule sentence, each shown after a hint press
- **WHEN** the player presses "English"
- **THEN** the region shows "None of the rules points to a next move right now." and "First fix the rule break highlighted on the board." respectively, and no cell changed

#### Scenario: The win message and empty regions

- **GIVEN** a fixture board solved so that `[data-message="win"]` shows the win text, and `[data-message="hint"]` empty
- **WHEN** the player presses "English"
- **THEN** the win region shows exactly "Congratulations, puzzle solved!" and the hint region is still empty

### Requirement: Page text is per mode

In Ukrainian mode every text the page shows or exposes SHALL contain Cyrillic letters and no Latin letters, and in English mode every such text SHALL contain Latin letters and no Cyrillic letters (NFR-5 per mode, FR-111): the title in the header, every label and button (the start button, the settings button and every text of the theme and language controls included), the size, level, summary and sheet texts, the rules and the idle line, the confirmation texts, the win message, `document.title` ("Binarka" in English mode) and every `aria-label`, `title`, `placeholder`, `alt` and `label` attribute. Hint sentences follow the same rule for their language. **One exception:** each language option is named in its own language and carries its own `lang` attribute; the scan skips the text and the attributes of an element whose own `lang` differs from `<html lang>`, and nothing else is exempt (A-52). Digits, «×», «·» and «▾» are letters of neither script. Text inside an element with `aria-hidden="true"` stays out of the scan and holds no letter at all. The digits shown in the cells are puzzle content and are not collected.

Traces: NFR-5, FR-111, FR-107, FR-109

#### Scenario: English mode has Latin texts and no Cyrillic

- **GIVEN** the page mounted with `binarka.language` = `en`
- **WHEN** the test collects every non-whitespace text node under the root (not the text of `[data-cell]` elements and not the text of `aria-hidden` elements), `document.title`, and the values of `aria-label`, `title`, `placeholder` and `alt` on every element and of `label` on every `option` and `optgroup`, and skips the elements whose own `lang` differs from `<html lang>`
- **THEN** every collected text matches `/[A-Za-z]/` or consists of digits and the signs «×» and «·» only, and none matches `/\p{Script=Cyrillic}/u`
- **AND** the only skipped element is the option «Українська» (in Ukrainian mode the only skipped element is the option "English", see the next scenario)

#### Scenario: Ukrainian mode keeps Cyrillic texts and no Latin

- **GIVEN** the page mounted with `localStorage` empty
- **WHEN** the test collects the same texts with the same exception
- **THEN** every collected text matches `/\p{Script=Cyrillic}/u` or consists of digits and the signs «×», «·» and «▾» only, and none matches `/[A-Za-z]/`

#### Scenario: Both modes at every size and after a switch

- **GIVEN** a page that shows 4×4, 6×6 and 8×8 boards in turn in each mode, and a page switched from one mode to the other with the settings panel
- **WHEN** the test collects the board names and the 4×4, 6×6 and 8×8 cell names
- **THEN** each name matches `/^Grid [468]×[468]$/` and `/^Row [1-8], column [1-8], (empty|0|1)(, given|, hinted)?$/` in English mode and the Ukrainian forms in Ukrainian mode, and none contains a letter of the other script

### Requirement: English page text

Every Ukrainian page string of `src/ui/strings.ts` SHALL have an English counterpart in the table below (FR-111, FR-94, A-54: the wording is the appendix of the signed amendment, taken as final by autonomy-log row 119 and refined only by the eval judge and the reviewers). `src/ui/strings.ts` keeps its existing Ukrainian export names and shapes unchanged (named constants, arrays, nested objects and the functions `sizeLabel`, `cellLabel` and `summaryText`); the English texts are a second table of the same shape (for example `EN`) with the same functions, and a language-keyed accessor picks one of the two. A parity test flattens the string leaves of both tables, compares the two key sets, and calls every format function with sample arguments in both languages. No file under `src/ui/` other than `src/ui/strings.ts`, and no `src/main.ts`, holds a Cyrillic character. No English page text or English hint sentence contains U+0027 or U+02BC; if an English text ever needs an apostrophe it uses U+2019 (Q4). The U+02BC rule of FR-41 is a Ukrainian spelling rule and applies to the Ukrainian text only. **Reading rule:** wherever another requirement or scenario of this capability quotes a Ukrainian text, it describes Ukrainian mode, the default, and the English counterpart of the table applies in English mode; a scenario that says "English mode" sets the language by pressing "English" in the settings panel or by storing `binarka.language` = `en` before the mount. Digits, «×», «·» and the ordinary spaces are the same in both modes.

| Ukrainian | English |
|---|---|
| Бінарка | Binarka |
| Підказка / Скинути / Нова головоломка | Hint / Reset / New puzzle |
| Правила / Зрозуміло | Rules / Got it |
| Розмір поля / Поле N×N | Grid size / Grid N×N |
| Почати заново? Ваші ходи на цьому полі буде втрачено. | Start over? Your moves on this board will be lost. |
| Так, почати / Скасувати | Yes, start over / Cancel |
| Рядок R, стовпець C, порожньо / , задано / , підказка | Row R, column C, empty / , given / , hinted |
| Не більше двох однакових цифр поспіль у рядку чи стовпці. | No more than two equal digits side by side in a row or column. |
| У кожному рядку та стовпці порівну нулів і одиниць. | Every row and every column has as many zeros as ones. |
| Усі рядки різні, і всі стовпці різні. | All rows are different, and all columns are different. |
| Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі. | Press the cells to place 0 and 1. For the rules, use the “Rules” button at the top. |
| Вітаємо, головоломку розвʼязано! | Congratulations, puzzle solved! |
| Поле і складність: / Поле і складність / Закрити / Почати | Grid and difficulty: / Grid and difficulty / Close / Start |
| Складність | Difficulty |
| Розминка / Задачка / Головоломка / Мозколамка | Warm-up / Teaser / Puzzler / Brain-twister |
| Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр. | Three simple rules are enough: pairs, gaps between equal digits and counting. |
| Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць. | Also count where the remaining zeros or ones can still fit in a line. |
| Додатково треба порівнювати рядки і стовпці: двох однакових не буває. | Also compare rows and columns: no two of them can be the same. |
| Додатково треба пробувати хід наперед: якщо правило порушиться, тут інша цифра. | Also try a move ahead: if a rule breaks, the other digit goes here. |
| Для поля 4×4 є лише рівень «Розминка». | The 4×4 grid has only the “Warm-up” level. |
| Складніші прийоми | Harder techniques |
| Баланс рядка: якщо в рядку є місце лише для одного нуля або однієї одиниці, а в клітинці вона дала б три однакові цифри поспіль, там стоїть інша цифра. | Line balance: if a line has room for only one more 0 or only one more 1, and putting it in a cell would make three equal digits side by side, that cell holds the other digit. |
| Однакові рядки: якщо рядок збігається з повним рядком усюди, крім двох клітинок, ці дві клітинки протилежні до нього. | Matching lines: if a line matches a complete line everywhere except two cells, those two cells are the opposite of it. |
| Хід наперед: уявно поставте цифру; якщо за кілька кроків порушиться правило, у клітинці стоїть інша. | Look ahead: imagine a digit in a cell; if a rule breaks within a few steps, the cell holds the other digit. |
| Налаштування / Тема / Світла / Темна / Як у системі | Settings / Theme / Light / Dark / System |
| Мова / Українська / English | Language / Українська / English (each option in its own language) |

Traces: FR-111, FR-94, FR-55, NFR-5

#### Scenario: Every Ukrainian string has an English counterpart with the same key

- **GIVEN** the exports of `src/ui/strings.ts`
- **WHEN** the test flattens the string leaves of the Ukrainian and the English table, compares the two key sets, and calls `sizeLabel`, `cellLabel` and `summaryText` with sample arguments in both languages
- **THEN** the two key sets are equal, the Ukrainian outputs equal those of the existing exports, and every English value is a non-empty string that matches `/[A-Za-z]/` and not `/\p{Script=Cyrillic}/u`, except the option name «Українська»

#### Scenario: The English page at mount

- **GIVEN** the page mounted with `binarka.language` = `en`
- **WHEN** the test reads the header, the buttons, the idle line, the rules panel, the sheet and the settings panel
- **THEN** their texts are those of the English column of the table: the title "Binarka", the buttons "Rules", "Hint", "Reset", "New puzzle", "Start", the sheet label "Grid and difficulty", the summary `Grid and difficulty: 6×6 · Warm-up` (the hidden prefix, then the visible text), the group names "Grid size", "Difficulty", "Theme", "Language", the options "Grid 4×4", "Grid 6×6", "Grid 8×8", the four level names and descriptions, the rules and techniques texts, and the close texts "Close" and "Got it"

#### Scenario: The English idle line keeps its non-breaking spaces

- **GIVEN** the page in English mode
- **WHEN** the test reads the text content of `[data-message="idle"]`
- **THEN** it equals the JavaScript string `'Press the cells to place 0\u00A0and\u00A01. For the rules, use the “Rules” button at the top.'`, and it contains exactly two U+00A0 characters

#### Scenario: The English win message and the confirmation

- **GIVEN** the page in English mode, a solved board, and a board with player entries
- **WHEN** the test reads the win message and presses "New puzzle"
- **THEN** the win text is exactly "Congratulations, puzzle solved!", the dialog text is "Start over? Your moves on this board will be lost.", and its buttons read "Yes, start over" and "Cancel"

#### Scenario: No English text contains an apostrophe

- **GIVEN** every English value of `src/ui/strings.ts`
- **WHEN** the test searches them for U+0027 and U+02BC
- **THEN** there is no match

### Requirement: English mode keeps the phone page on one screen

The built page in English mode SHALL fit the board, the buttons and the message area on one screen at 375×812 and 6×6 in the default, hint and win states without vertical scroll (NFR-10, FR-108), where the hint state shows the longest English hint sentence, a line-balance fill of about 140 characters, on a board that the test reaches by a seed and level that a search step finds (the page seeds `Math.random`, `e2e/helpers.ts`, so the seed is fixed there) and that the test asserts to be a balance fill. The real-browser check `e2e/nfr-10-fit.spec.ts` (`npm run test:e2e`) gains these English samples; the coverage is `sampled` (one viewport, three states), never continuum, and the Ukrainian samples stay as they are.

Traces: NFR-10, FR-108

#### Scenario: Default, hint and win states fit in English

- **GIVEN** the built page open in Chromium at 375×812 with `binarka.language` = `en` set by `addInitScript`, at 6×6, in the default state, after a hint press on the board of the searched seed and level whose first hint at ceiling 4 is a line-balance fill (the test asserts that the shown sentence contains "has room for only one more"), and after a win
- **WHEN** `e2e/nfr-10-fit.spec.ts` measures the page
- **THEN** in all three states the board, the buttons and the message area fit without vertical scroll, and the buttons hold still when a message appears

### Requirement: English labels meet the touch-target floor

In English mode the touch-target floor of NFR-12 SHALL hold for every control the probe `e2e/nfr-12-targets.spec.ts` measures: at all eight sampled viewports, with the longer English labels (they may wrap at 320 px), every control is at least 44×44 CSS px, and so are the language options with the settings panel open (NFR-12, FR-107, FR-117). The stylesheet gives the language options the `min-height` of at least `2.75rem` that the theme options have (see «The theme options meet the touch-target floor»). The sampled viewports are not continuum coverage.

Traces: NFR-12, FR-107, FR-117

#### Scenario: The language options declare a 44 px minimum height

- **GIVEN** the page is mounted in jsdom and the text of `src/ui/style.css` is applied to the document
- **WHEN** the test reads the computed `min-height` of the two language options
- **THEN** each value is at least 44 px

#### Scenario: Measured in a real browser in English

- **GIVEN** the built page in Chromium at each of the eight viewports of `e2e/nfr-12-targets.spec.ts` with `binarka.language` = `en` set by `addInitScript`, and the settings panel open
- **WHEN** the probe measures the controls of the page, the sheet and the panel
- **THEN** each is at least 44 px wide and at least 44 px tall, and the spec reports no line for a measured control below 44×44

### Requirement: The accessibility sweep covers English mode

The real-browser accessibility sweep `e2e/nfr-13-a11y.spec.ts` (`npm run check:a11y`) SHALL include English mode (the default state and the hint state) and the language control focused from the keyboard (NFR-13, FR-107, FR-109). In every state axe-core SHALL report no violation, and the rules `html-has-lang`, `html-lang-valid` and `valid-lang` SHALL be among the rules that run and pass. The coverage is `sampled`, never continuum; the escalation path for English labels at 320 px is a 1 px-step width sweep from 320 to 400 px in English with the settings panel open, run before G2.

Traces: NFR-13, FR-107, FR-109

#### Scenario: English states pass the sweep

- **GIVEN** the built page in Chromium with `binarka.language` = `en` set by `addInitScript`, in the default state, after a hint press, and with the settings panel open
- **WHEN** the sweep runs axe-core
- **THEN** axe reports no violation in each state; `html-has-lang` and `html-lang-valid` are in the list of passed rules in each state, and `valid-lang` is in it with the settings panel open (amended in the first review-gate fix round: while the panel is closed the two language options, the only elements with their own `lang`, are hidden in the popover, so axe reports `valid-lang` as inapplicable, measured on the built page: `docs/qa/add-english-version/valid-lang-measure.txt`)

#### Scenario: The focused language option shows an indicator

- **GIVEN** the page with focus moved to a language option by Tab with the settings panel open
- **WHEN** the sweep reads the computed outline of the focused option
- **THEN** its outline style is not `none` and its outline width is at least 2px

### Requirement: Segmented options keep the focus ring inside the card

The options of the three segmented controls, the size control (`.size-control button`, FR-43), the theme control (`.theme-control button`, FR-102) and the language control (`.language-control button`, FR-107), SHALL pull their keyboard focus ring in, so that the ring of a focused option stays clear of the neighbouring option and of the frame of the card (FR-65 "unobscured"). The stylesheet `src/ui/style.css` SHALL contain, for each of the three, a rule whose selector is `<control> button:focus-visible` and which declares `outline-offset: -1px`, as an ordinary declaration (no `!important`), and no other outline property (no `outline`, `outline-style`, `outline-width` or `outline-color`). The ring therefore keeps the style, width and colour of `button:focus-visible` (solid, 3px, `var(--color-focus)`; see «Cells and buttons show a visible, unobscured focus indicator»). With that width the ring runs from 1px inside the option's border edge to 2px outside it. The card's gap and padding are 3px, so the ring covers part of the gap and stays 1px clear of the neighbour and of the frame; it is not drawn wholly inside the option. `button:focus-visible` keeps its positive `outline-offset` for every other button. jsdom never matches `:focus-visible` (A-28), so the unit test decides the declarations; that the ring is visible in a real browser is NFR-13 (`npm run check:a11y`). A ring drawn wholly inside the option (`outline-offset` of minus the ring width) would change the focused theme option in the pixel reference (NFR-14, `settings-focus` shots) and is not required.

Traces: FR-65, FR-43, FR-102, FR-107

#### Scenario: Each segmented control declares an inset focus ring

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of the rules for `.size-control button:focus-visible`, `.theme-control button:focus-visible` and `.language-control button:focus-visible`
- **THEN** a rule exists for each of the three and its `outline-offset` is `-1px`
- **AND** none of these declarations has the priority `important`

#### Scenario: The segmented rules change only the offset

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of the rules for the three segmented `button:focus-visible` selectors
- **THEN** none of them declares `outline`, `outline-style`, `outline-width` or `outline-color`, so the ring's style, width and colour come from `button:focus-visible`

#### Scenario: Other buttons keep the outset ring

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of the rule for `button:focus-visible`
- **THEN** its `outline-offset` is still greater than 0

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

## Exclusions

The following are intentionally unsupported in MVP; testers must not report them as defects.

- No server, no authentication, no accounts, no authorization: every visitor can use the page, so there are no unauthorized or forbidden cases and no redirects.
- No persistence of game state (TC-12): reloading the page starts a fresh puzzle; no game state is stored; the only stored data are the preferences of FR-113. No network calls: puzzles are generated in the browser.
- A timer (FR-45), saved progress (FR-46), undo (FR-47) and a daily puzzle (FR-48) are Future; reset (FR-58) returns to the givens only and is not undo.
- Real-browser tests (NFR-7) are Future; the page is tested in jsdom only (TC-13). Rendering defects that jsdom cannot see are not caught.
- Image files and bitmap or other graphics assets are intentionally unsupported (TC-14); the only graphics are the inline SVG logo of FR-72 and the inline SVG gear of the settings button (TC-14 as amended 2026-10-10). Legibility of the logo at 40 px and its look are not specified (held NFR-15, NFR-14).
- Keyboard play and the roles, names and states screen readers use are MVP requirements (NFR-9, FR-59 to FR-65; A-20 reconciled 2026-10-09). Real screen-reader output and real-browser rendering are not tested (A-28, TC-13).
- The puzzle state in the URL, declined by the user (autonomy-log rows 43 and 66), is not provided. The 44 px touch targets declined in those rows are required since the 2026-10-05 amendment by NFR-12 (see «Action buttons meet the touch-target floor»; change fix-action-button-targets, 2026-10-09).
- Arrow, Home, End, PageUp and PageDown are not handled. A repeated identical hint sentence is not announced again.
- Mobile layout and visual polish are not specified (A-14). Arrow-key navigation of the size control is not required (A-24).
- The seed is not shown on the page (A-4).
- Grid sizes of 10 and above (FR-18) are not offered; the size choice, the level choice and the marked choice are not remembered (TC-12); «Почати» is never a no-op, a press always starts a puzzle or asks for the confirmation (FR-101).
- Levels 2 to 4 at 4×4 are intentionally unavailable (A-34); a failed or run-out generation shows no message (A-38); the layout of the summary button and the sheet is held NFR-10, NFR-12, NFR-13, NFR-14.
- The page does not restate or re-implement rule checking, solving, generation or hint selection; it only displays engine results (see `openspec/specs/puzzle-engine/spec.md`).
- The page does not validate an injected seed: the generator rejects one outside 0 to 2147483647 (FR-51), and what the page does with that error at mount or on the new puzzle button is not asserted by any scenario (on a press of «Почати» any generator error keeps the previous board, and that is asserted). This spec pins the domain of the page's own default seeds only (integers from 0 to 2^31 - 1).
