## ADDED Requirements

### Requirement: Cause marker

After every board change of one cell X, the page SHALL give X the class `cell-cause` exactly when the rule checker (`findViolations`, `openspec/specs/puzzle-engine/spec.md`) reports, on the new board, a violation whose `cells` include X (FR-120). A board change of one cell is a click on a non-given cell (FR-34; Enter or Space act as a click, FR-60) or a hint fill (FR-39). The checker's cells are those of FR-35 to FR-37, not the cells that the page highlights: for three or more equal digits, the run; for too many of one digit, only the cells that hold the excess digit (the page highlights the whole line, the checker's cells are only the excess digit's); for identical lines, both lines. When X is in none of them, no cell carries `cell-cause`. At most one cell SHALL carry the class at any time, and that cell SHALL always carry `cell-violation` and `aria-invalid="true"` too. A given cell never carries it (a given never changes), and an empty cell never carries it (the checker's cells always hold a digit). The class is set in the same handling as the highlights (FR-38): when the click or the hint press returns, the class is already right. The marker answers "what did my last press do": an earlier violation that the last board change did not touch keeps `cell-violation` and `aria-invalid` and has no marker.

The class SHALL be removed by every later board change that does not set it again: a click on a non-given cell (including X itself), a hint fill, «Нова головоломка», a press of «Почати» (at once, or after «Так, почати») and «Скинути». An action that needs confirmation (FR-67) removes the marker when it is performed, not when it is requested. A hint fill is on this list for completeness but cannot follow a marker: a cell carries `cell-cause` only while the board breaks a rule, and the hint refuses a board that breaks a rule (FR-26), so a press of «Підказка» then changes nothing. The marker SHALL NOT be removed by an action that changes no cell: a click on a given cell (FR-33), a hint that fills no cell (FR-25, FR-26), opening or closing the rules panel (FR-57), the setup sheet (FR-96) or the settings panel (FR-102), marking a size or a level in the setup sheet (FR-100), including a press of the size or level already selected (FR-73; that press only marks), a theme or language switch (FR-103, FR-108), a failed generation that keeps the previous board (FR-88) and a cancelled confirmation (FR-67).

No cell carries the class after a board is shown: at mount (including a capture board, FR-119: a violation that is already on the board was caused by no press), after a new puzzle, after «Почати» and after «Скинути». The marker is never stored (TC-12), and two mounts on two roots are independent. The page adds no element and no ARIA attribute for it: its screen-reader counterpart is the name suffix of «Cell labels» (FR-70), and its look is «A violation shows a cue besides colour» (FR-64). `aria-describedby` is not used (the draft's alternative CQ-1 B was not chosen).

Traces: FR-120, FR-34, FR-35, FR-36, FR-37, FR-38, FR-39, FR-60, FR-64, FR-67, FR-70, FR-88, FR-119, A-58

#### Scenario: P1, three equal digits side by side: the pressed cell is marked

- **GIVEN** a mounted 6x6 fixture puzzle with no givens, and no cell with `cell-cause`
- **WHEN** the player clicks the cells (2,1), (2,2) and (2,3) once each, so that each shows `0`
- **THEN** after the first and after the second click no cell has `cell-violation` and no cell has `cell-cause`
- **AND** after the third click the cells (2,1), (2,2) and (2,3) have `cell-violation` and `aria-invalid="true"`, and exactly one cell, (2,3), has `cell-cause`
- **AND** no cell has the attribute `aria-describedby`, and the number of elements under the root is the same before and after the third click

#### Scenario: P2, too many of one digit: the cell that holds the excess digit is marked

- **GIVEN** a mounted 6x6 fixture puzzle with no givens, on which the player has made row 1 read `1 1 0 1 _ _` (clicks: (1,1) twice, (1,2) twice, (1,3) once, (1,4) twice), so no cell has `cell-violation` and no cell has `cell-cause`
- **WHEN** the player clicks (1,5) twice, so that it shows `1` and the row holds four 1s
- **THEN** all six cells of row 1 have `cell-violation` and `aria-invalid="true"` (the page highlights the whole line, FR-36)
- **AND** exactly one cell, (1,5), has `cell-cause`; the other three cells with a 1 and the two cells with a 0 do not

#### Scenario: P3, a correct digit put into an already broken line is not marked

- **GIVEN** the board of P2 after the fourth 1 (row 1 reads `1 1 0 1 1 _`, (1,5) has `cell-cause`)
- **WHEN** the player clicks (1,6) once, so that it shows `0`
- **THEN** all six cells of row 1 still have `cell-violation` (four 1s remain)
- **AND** no cell has `cell-cause`: the new `0` is not among the checker's cells, which are the four cells that hold a 1
- **AND** the label of (1,5) no longer ends with the cause suffix

#### Scenario: P4, adding to the excess marks the added cell

- **GIVEN** the board of P3 (row 1 reads `1 1 0 1 1 0`, no cell has `cell-cause`)
- **WHEN** the player clicks (1,6) once more, so that it shows `1`
- **THEN** the row holds five 1s and three of them side by side at (1,4), (1,5) and (1,6)
- **AND** exactly one cell, (1,6), has `cell-cause`, and it has `cell-violation`

#### Scenario: Identical lines: the pressed cell of the second line is marked

- **GIVEN** a mounted 4x4 fixture puzzle with no givens, on which the player has made row 1 read `0 1 1 0` and row 2 read `0 1 1 _` (clicks: (1,1) once, (1,2) twice, (1,3) twice, (1,4) once, (2,1) once, (2,2) twice, (2,3) twice), so no cell has `cell-violation` and no cell has `cell-cause`
- **WHEN** the player clicks (2,4) once, so that it shows `0` and row 2 equals row 1
- **THEN** every cell of rows 1 and 2 has `cell-violation`
- **AND** exactly one cell, (2,4), has `cell-cause`

#### Scenario: P5, a violation that is on the board at mount carries no marker

- **GIVEN** the fixture `DIRTY_GIVENS` (givens `0` at row 1 columns 1 to 3), and, in another run, a valid capture value (FR-119) whose entries hold three equal digits in a row
- **WHEN** each page has just been mounted
- **THEN** the three cells have `cell-violation` and `aria-invalid="true"`, and no cell has `cell-cause`
- **AND** after a click on a given cell of the fixture board no cell has `cell-cause`, and after a click on a non-given cell that breaks no rule no cell has `cell-cause`

#### Scenario: P6, a hint fill that breaks a rule marks the hinted cell

- **GIVEN** the fixture `HINT_BREAKS` (givens `1` at (1,1) and (1,2), `0` at (2,3) and (3,3)), on which the first hint fills (1,3) with `0` and so makes three 0s in column 3
- **WHEN** the player presses «Підказка» once
- **THEN** (1,3) has `cell-hinted`, `cell-violation` and `cell-cause`, and it is the only cell with `cell-hinted` and the only cell with `cell-cause`
- **AND** the givens (2,3) and (3,3) have `cell-violation` and `aria-invalid="true"` and no `cell-cause`
- **AND** the label of (1,3) is «Рядок 1, стовпець 3, 0, підказка, спричиняє порушення»

#### Scenario: P6, the next hint refuses and the marker stays

- **GIVEN** the page of the previous scenario after the first hint
- **WHEN** the player presses «Підказка» a second time
- **THEN** the hint message is the sentence for a board that breaks a rule (FR-26), no cell changes its text, and (1,3) still has `cell-hinted`, `cell-violation` and `cell-cause`

#### Scenario: P7, the marker shows the last press only

- **GIVEN** a mounted 6x6 fixture puzzle with no givens, on which the player made three 0s in row 2 as in P1, so (2,3) has `cell-cause`
- **WHEN** the player clicks (5,5) once, so that it shows `0` and breaks no rule
- **THEN** no cell has `cell-cause`, although (2,1), (2,2) and (2,3) still have `cell-violation` and `aria-invalid="true"`
- **AND** the label of (2,3) is «Рядок 2, стовпець 3, 0» (the suffix went with the marker, the text is still `0`)

#### Scenario: P7, a later press that breaks a rule moves the marker

- **GIVEN** the page of P1 (three 0s in row 2, (2,3) has `cell-cause`)
- **WHEN** the player clicks (4,1), (4,2) and (4,3) once each
- **THEN** after the third click exactly one cell, (4,3), has `cell-cause`, and (2,3) does not
- **AND** the cells of both runs have `cell-violation`
- **AND** after the first and the second of these clicks no cell has `cell-cause` (the first click already took it from (2,3))

#### Scenario: P7, pressing the marked cell again removes the marker

- **GIVEN** the page of P1 ((2,3) has `cell-cause` and shows `0`)
- **WHEN** the player clicks (2,3), so that it shows `1`
- **THEN** no cell has `cell-cause`, and no cell has `cell-violation` (the run is broken)

#### Scenario: P8, a solved board carries no marker

- **GIVEN** a fixture puzzle with every cell holding the solution except one non-given cell X
- **WHEN** the player clicks X until it shows the solution digit and the win message appears
- **THEN** no cell has `cell-violation` and no cell has `cell-cause`
- **AND** on the fixture of «Hinted cell marker» (a hint that wins) the hint fills X, the win message shows, exactly one cell has `cell-hinted` and no cell has `cell-cause`

#### Scenario: A given in the same violation is never marked

- **GIVEN** a mounted 6x6 fixture puzzle whose only givens are `0` at row 3 columns 1 and 2
- **WHEN** the player clicks (3,3) once
- **THEN** (3,1), (3,2) and (3,3) have `cell-violation`
- **AND** only (3,3) has `cell-cause`, and the two givens keep `data-given="true"`, `aria-disabled="true"` and no `cell-cause`

#### Scenario: Later board changes remove the marker

- **GIVEN** the board of the previous scenario with (3,3) carrying `cell-cause`, which has at least one given
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| clicks a non-given cell other than (3,3), here (5,5), which breaks no rule |
| clicks (3,3) itself (the `0` becomes `1`, which breaks no rule) |
| presses «Нова головоломка» and then «Так, почати» |
| changes the size to 4 (one run) or to 8 (one run) by a choice (mark, «Почати», «Так, почати»), the injected generator returning a fixture of that size |
| changes the level to «Задачка» (one run) by a choice (mark, «Почати», «Так, почати») |
| presses «Почати» with the marked choice equal to the board shown (one run), and then «Так, почати» |
| presses «Скинути» and then «Так, почати» (the dialog of the reset) |

- **THEN** after each action no cell of the board shown has the class `cell-cause`, and no cell label contains «спричиняє»
- **AND** a hint fill is not a row of this table because it cannot follow a marker (see the next scenario)

#### Scenario: A hint cannot follow a marker

- **GIVEN** the board of «A given in the same violation is never marked», (3,3) carrying `cell-cause`
- **WHEN** the player presses «Підказка»
- **THEN** the hint engine returns no cell (the board breaks a rule, FR-26), the hint message is the sentence for that case, and (3,3) still has `cell-cause`

#### Scenario: Actions that change no cell keep the marker

- **GIVEN** the same board, (3,3) carrying `cell-cause`
- **WHEN** the player does each of the actions in this table, each from a freshly prepared page

| Action |
|--------|
| clicks a given cell, (3,1) (once, and again twice) |
| presses «Підказка» (the hint refuses, FR-26) |
| clicks `[data-action="rules"]` and then the close button «Зрозуміло» |
| opens the setup sheet through the stubbed `showPopover()`, then clicks `[data-action="setup-close"]` |
| opens the setup sheet, presses «Поле 8×8» and «Задачка» (marking presses, no «Почати»), then clicks `[data-action="setup-close"]` |
| opens the setup sheet, presses the already selected «Поле 6×6» (it only marks), then clicks `[data-action="setup-close"]` |
| opens the settings panel through the stubbed `showPopover()` and presses a theme option |
| opens the settings panel and presses the language option that is not shown |
| presses «Нова головоломка» and then «Скасувати» |
| presses «Скинути» and then «Скасувати» |

- **THEN** after each action exactly one cell, (3,3), has `cell-cause`, it still has `cell-violation` and shows the digit it showed, the set of cells with `cell-violation` is unchanged, and every cell shows the text it showed before

#### Scenario: A confirmation removes the marker when it is performed, not when it is requested

- **GIVEN** the board of «A given in the same violation is never marked», (3,3) carrying `cell-cause`
- **WHEN** the player presses «Нова головоломка», so that the dialog `[data-dialog="confirm"]` opens
- **THEN** while the dialog is open (3,3) still has `cell-cause` and its label still ends «, спричиняє порушення»
- **AND** after «Скасувати» (3,3) still has `cell-cause`; and, from a fresh page, after «Так, почати» no cell of the new board has `cell-cause`

#### Scenario: A failed generation keeps the marker

- **GIVEN** a 6x6 fixture board with (3,3) carrying `cell-cause`, and an injected `generate` that throws for size 8
- **WHEN** the player chooses «Поле 8×8» (marks it, presses «Почати», and confirms with «Так, почати» because the board has entries)
- **THEN** `[data-board]` keeps `data-size="6"` and the same cell texts, and (3,3) still has `cell-cause`

#### Scenario: The marker follows a language switch

- **GIVEN** the board of P1 in Ukrainian mode, (2,3) carrying `cell-cause`, and the settings panel open
- **WHEN** the player presses the language option "English", and then «Українська»
- **THEN** after "English" (2,3) still has `cell-cause` and its label is "Row 2, column 3, 0, causes a violation", and the labels of (2,1) and (2,2) are "Row 2, column 1, 0" and "Row 2, column 2, 0"
- **AND** after «Українська» the label of (2,3) is «Рядок 2, стовпець 3, 0, спричиняє порушення» again, and the class lists of all cells are those before the first switch

#### Scenario: Two mounts are independent

- **GIVEN** two pages mounted on two roots, a marker made on the first
- **WHEN** the test reads the second page, then makes a violation on the second
- **THEN** no cell of the second page had `cell-cause` before its own press, and after it exactly one cell of the second page has `cell-cause` and the marker of the first page is where it was

#### Scenario: The marker is the checker's answer after every press (oracle)

- **GIVEN** pages mounted at N = 4, 6 and 8 on fixture puzzles with no givens of that size, and the engine rule checker (`findViolations`) called on the board as read from the DOM after each press
- **WHEN** the test presses every cell once in row-major order, then every cell once in reverse order, then every cell once in row-major order again (three passes, each press one click, so every cell is back to empty at the end)
- **THEN** after each press the set of cells with `cell-cause` is exactly `{X}` when X, the cell just pressed, is among the `cells` of some violation that the checker reports, and is empty otherwise
- **AND** after each press at most one cell has the class, a cell that has it also has `cell-violation`, `aria-invalid="true"`, `data-given="false"` and a text of `0` or `1`, and no cell label contains the cause suffix unless the cell has the class
- **AND** the sweep reaches at least one press with a marker and one press without a marker at each size, so the oracle is not vacuous (the test asserts both counts are above zero)

## MODIFIED Requirements

### Requirement: A violation shows a cue besides colour

The stylesheet `src/ui/style.css` SHALL draw a cell in a highlighted violation with a heavier border than an ordinary cell, as well as with the violation colours (FR-64): an ordinary cell has a border width of 1px, a given cell 1px (a given cell is told apart by weight, not by width, see «Borders, cues and focus rings have enough contrast» and A-57), a cell with the class `cell-violation` 2px and a given cell in a violation 2px, so a violation is wider than both the ordinary cell and the given cell. The cascade SHALL give a given cell in a violation the 2px violation border too: the rule for `cell-violation` wins over the rule for `cell-given`, whether by source order or by specificity, and the check measures the computed style, not the order of the rules. The violating digit carries a second cue that is not colour: it is underlined, declared with the longhands `text-decoration-line: underline` and `text-decoration-thickness: 2px` (the colour scan flags the shorthand `text-decoration`, whose colour part it cannot read, so the main column's rules do not use the shorthand). The diagonal stripe in the violating cell's `background-image` (a repeating gradient of `--color-violation-stripe` and `transparent`) is decoration, not a cue: it has 1.24:1 (light) and 1.35:1 (dark) against the violation fill. The violation cue is applied through the class `cell-violation`, and `aria-invalid` (Cells expose a Ukrainian name and their state) is its non-visual counterpart.

The cell that carries the class `cell-cause` (FR-120, «Cause marker») shows one more cue that is not colour, the cause mark (FR-64, A-58): a filled right triangle in the top-right inner corner of the cell, in `--color-violation-border`, with its right angle in the corner. It is the pseudo-element `.cell-cause::after`, drawn with borders (a zero-size box whose top border is coloured and whose left border is `transparent`), not with a background image, so that it survives forced-colours mode. Its two legs are equal, about a quarter of the cell's inner width and never less than `0.5rem`: each of `border-top-width` and `border-left-width` is `max(0.5rem, calc(((100cqi - (var(--n) - 1) * var(--board-gap)) / var(--n) - 4px) / 4))`, where the cell's width is the board's content width less its gaps, divided by N, and `4px` is the cell's two 2px violation borders. The rule declares the six border longhands (`border-top-width`, `border-top-style`, `border-top-color`, `border-left-width`, `border-left-style`, `border-left-color`) and not the `border-top` and `border-left` shorthands: the stylesheet tests parse the text with jsdom, which drops a border shorthand whose width is a `max()`, garbles one whose width is a `calc()` and keeps one whose width is a `var()` without expanding it into longhands, so a test cannot read the leg's width from a shorthand. The mark adds no width and no token: the cell's own border stays 2px, in the same colour as the mark, so a violation still measures 1px, 1px, 2px and 2px (the scenario above), and a hinted cause keeps its dashed border (`.cell-violation` declares the border width and colour, not the style). `position: relative` goes on `.cell-cause` (the mark's anchor) and not on `.cell`; `.cell:focus-visible` already declares it. `.cell-cause` and its pseudo-element declare no `box-shadow` and no `outline`, so the hover ring (`inset 0 0 0 2px var(--color-hover-ring)`) and the focus ring are unchanged: the hover ring runs under the mark's two legs and meets the mark at 2.45:1 (light) and 2.00:1 (dark), an adjacency that is accepted and is not a contrast pair (A-58; see «Borders, cues and focus rings have enough contrast»). Forced colours: inside `@media (forced-colors: active)` only, the rule `.cell-cause::after` declares `forced-color-adjust: none`, `border-top-color: ButtonText` and `border-left-color: transparent`, so that the mark stays a visible triangle in the user's colours (without `forced-color-adjust: none` the browser forces both borders to one colour and the triangle becomes a square). This block is the one place where a system colour keyword is allowed (see the colour scan in «Borders, cues and focus rings have enough contrast»). It is not tested in a browser with forced colours (A-28, TC-13); the stylesheet test pins its text and its scope.

Intentionally not delivered, so that testers do not report them as bugs: a 3px border for the cause cell (the draft's alternative CQ-2 B), a rounded mark, any motion on the mark's appearance (the amendment has none), a mark on a cell that is not the cause, a mark at mount, and a larger mark at 8×8 on a 320px phone (the user kept "about a quarter of the cell, with a 0.5rem minimum" on 2026-10-11).

Traces: FR-64, FR-120, FR-65, A-58

#### Scenario: The computed border is heavier for a violation at every size

- **GIVEN** the text of `src/ui/style.css` with every `var(--color-x)` replaced by the value of that token in `:root`, injected into a `<style>` element of the jsdom document (jsdom computes the cascade of top-level style rules, specificity included; it does not apply rules inside `@media` or nested rules), and pages mounted at N = 4, 6 and 8, each showing an ordinary cell, a given cell, a violating non-given cell and a given cell in a violation
- **WHEN** the test reads `getComputedStyle(cell).borderTopWidth` of these four cells at each size
- **THEN** the widths are `1px`, `1px`, `2px` and `2px`, in that order, at each of the three sizes
- **AND** the violating widths are greater than the ordinary one and than the given one

#### Scenario: The violating digit is underlined with longhands

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the rules `.cell-violation` and `.buttons button[data-action='reset']`
- **THEN** `.cell-violation` declares `text-decoration-line` `underline` and `text-decoration-thickness` `2px`, and the «Скинути» rule declares `text-decoration-line` `underline`
- **AND** neither rule declares the shorthand `text-decoration`

#### Scenario: The stripe is a gradient of the stripe token and is decoration

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the `background-image` of `.cell-violation`
- **THEN** it is a repeating linear gradient whose colour stops are `var(--color-violation-stripe)` and `transparent`
- **AND** the ratio of `--color-violation-stripe` to `--color-violation-bg` is below 3 in each token set (the stripe is not a cue)

#### Scenario: The cue is not colour-only in the DOM either

- **GIVEN** a board where a click made three equal digits side by side
- **WHEN** the test reads the three cells
- **THEN** each of the three cells has the class `cell-violation` and `aria-invalid="true"`, and no cell without that class has `aria-invalid`

#### Scenario: The cause mark is a corner triangle drawn with borders

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of `.cell-cause` and `.cell-cause::after` (outside any at-rule)
- **THEN** `.cell-cause` declares `position` `relative`, and `.cell` declares no `position`; among the rules whose selector begins with `.cell`, other than `.cell-cause::after`, only `.cell-cause` and `.cell:focus-visible` declare `position`, both `relative`
- **AND** `.cell-cause::after` declares `content` `""` (the empty string, written `''`; the stylesheet parser serialises it as `""`), `position` `absolute`, `top` `0px`, `right` `0px`, `width` `0px` and `height` `0px` (each written `0`; the parser serialises a written `0` as `0px`), `pointer-events` `none`, `border-top-style` `solid`, `border-top-color` `var(--color-violation-border)`, `border-left-style` `solid` and `border-left-color` `transparent`
- **AND** `border-top-width` and `border-left-width` of that rule are equal and each is `max(0.5rem, calc(((100cqi - (var(--n) - 1) * var(--board-gap)) / var(--n) - 4px) / 4))`, so the leg has the floor of `0.5rem`
- **AND** neither `.cell-cause` nor `.cell-cause::after` declares `border`, `border-top`, `border-left`, `border-width`, `border-color`, `background`, `background-image`, `box-shadow`, `outline` or `opacity`, and no declaration of either holds a colour literal, a named colour or `color-mix(`

#### Scenario: The cause cell keeps the cell's own border

- **GIVEN** the injected stylesheet (as in «The computed border is heavier for a violation at every size»), with a page mounted at N = 4, 6 and 8, and a violating non-given cell that also carries `cell-cause` (made by a click, so the class comes from the page), a violating non-given cell without it, and a hinted cell that is a violating cause (HINT_BREAKS at N = 6)
- **WHEN** the test reads `getComputedStyle(cell)` `borderTopWidth` and `borderTopStyle` of these cells and of the four cells of the widths scenario
- **THEN** the four cells of the widths scenario keep `1px`, `1px`, `2px` and `2px`, the cause cell has `borderTopWidth` `2px` and `borderTopStyle` `solid`, and the hinted cause has `2px` and `dashed`
- **AND** the cause cell and the violating cell without the class have the same computed `borderTopColor`, `backgroundColor` and `color`

#### Scenario: Forced colours keep the mark

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test collects the rules whose selector contains `.cell-cause` and whose context contains `forced-colors`
- **THEN** there is exactly one, `.cell-cause::after`, with the context `@media (forced-colors: active)` and no other at-rule, and it declares exactly `forced-color-adjust: none`, `border-top-color: ButtonText` (the stylesheet parser serialises the keyword in lower case; the test compares without regard to case) and `border-left-color: transparent`
- **AND** no rule outside that block declares `forced-color-adjust`, and no rule whose selector contains `.cell-cause` sits in an at-rule other than that one

#### Scenario: The cause cell shows the mark in a browser (sampled)

- **GIVEN** the built page in Chromium (e2e, `e2e/nfr-14-cause-mark.spec.ts`, in the existing `layout` project, so `playwright.config.ts` is not changed) with reduced motion, the scheme on the browser context and no stored preference, and a valid capture value (FR-119) built on the givens of the design's fixture of the size, with entries that leave two adjacent `0` and an empty non-given cell beside them; the sampled cases are two: light at 6×6 at 1024×768, and dark at 8×8 at 320×640 (where the leg's `0.5rem` floor binds: the quarter of the inner width is about 7.8px there and the floor makes the leg 8px)
- **WHEN** the test reads, in a screenshot at device scale 1, the CSS pixel at (right − 4, top + 4) of the border box of that empty cell (`right` and `top` from its `getBoundingClientRect()`; the pixel whose top-left corner is at x = ⌊right⌋ − 4, y = ⌈top⌉ + 4, so that two testers read the same pixel when the cell's edges are fractional) before the press, clicks the cell once so that three equal digits stand side by side, and reads the same pixel again, and the pixel at the same place of the adjacent violating cell that is not the cause
- **THEN** before the press the pixel is not `--color-violation-border` of the scheme, after the press it equals `--color-violation-border` of the scheme (`#b3261e` in light, `#ff8a7d` in dark) within 1 per channel, and the pixel of the adjacent violating cell does not equal it
- **AND** the computed `border-top-width` of `::after` of the cause cell (`getComputedStyle(cell, '::after')`) equals `max(8, (the cell's width - 4) / 4)` px within 0.5px, as a secondary assertion and never the only one, if the spike shows the pseudo-element readable; the spike's result is recorded in `docs/qa/add-violation-cause/red-run.txt` section D, and if it shows the pseudo-element unreadable this AND is N/A (the record says so) and the pixel reads above are the whole check
- **AND** the file names its sampling dimensions (the scheme, the board size and the viewport width), declares coverage `sampled`, and claims neither all widths nor all sizes nor a pixel floor; it says nothing about the widths 375, 768 and 1440, landscape (844×390, where the floor binds too), 4×4, or the other theme at each sampled size; the stricter instrument that runs before a claim about legibility at other widths is the design stills at 320, 375 and 844×390 (`docs/design/cause-touch-2026-10-11/`) and the width sweep of the smoke test (a leg of at least 8px at every width)

### Requirement: Cell labels

Every cell SHALL have an `aria-label` in the page language, in Ukrainian mode of the form «Рядок R, стовпець C, V» and in English mode of the form "Row R, column C, V", followed by an optional suffix, where R and C are the 1-based row and column and V is «порожньо» ("empty" in English mode) for an empty cell, «0» for a zero and «1» for a one (FR-70). A given cell appends «, задано» (", given"); the cell that a hint filled (FR-66) appends «, підказка» (", hinted"); the cell that carries the class `cell-cause` (FR-120, «Cause marker») appends «, спричиняє порушення» (", causes a violation"), after «, підказка» (", hinted") when it has both; any other cell has no suffix, and a cell does not get a suffix for being in violation unless it is the cause cell. The label SHALL be updated after every change of the cell (a click, a hint, reset, a new puzzle, a size change), and when the cell gains or loses a marker: the cause suffix follows the marker, so when the marker moves or goes, the cell that lost it is relabelled at once although its value did not change (as for «, підказка»). A given cell is never the cause, so its label is «, задано» only. The English suffix ", causes a violation" was confirmed by the user on 2026-10-11 (autonomy-log row 164; FR-111, the table of «English page text»). A label contains no Latin letters (NFR-5).

Traces: FR-70, FR-66, FR-120, NFR-5, FR-111

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

#### Scenario: Only the cause cell of a violation gets a suffix

- **GIVEN** a mounted 6x6 fixture puzzle with no givens, on which the player clicked (2,1), (2,2) and (2,3) once each, so the three cells carry `cell-violation` and (2,3) carries `cell-cause`
- **WHEN** the test reads their labels
- **THEN** the labels of (2,1) and (2,2) are «Рядок 2, стовпець 1, 0» and «Рядок 2, стовпець 2, 0», with nothing after the digit
- **AND** the label of (2,3) is «Рядок 2, стовпець 3, 0, спричиняє порушення»
- **AND** on the board of «P2» of «Cause marker» (a row of six highlighted by the count rule) only (1,5), the cell that holds the fourth 1, has the suffix, and the other five cells of the row have none

#### Scenario: A given cell in a violation keeps exactly the given suffix

- **GIVEN** a mounted 6x6 fixture puzzle whose only givens are `0` at row 3 columns 1 and 2, and the player clicked (3,3) once, so (3,1), (3,2) and (3,3) carry `cell-violation`
- **WHEN** the test reads their labels
- **THEN** the labels of (3,1) and (3,2) are exactly «Рядок 3, стовпець 1, 0, задано» and «Рядок 3, стовпець 2, 0, задано»
- **AND** the label of (3,3) is «Рядок 3, стовпець 3, 0, спричиняє порушення»

#### Scenario: The suffix follows the marker

- **GIVEN** the board of the scenario «Only the cause cell of a violation gets a suffix» (three 0s in row 2, (2,3) carrying `cell-cause`)
- **WHEN** the player clicks (5,5) once, so that it shows `0` and breaks no rule
- **THEN** the label of (2,3) is «Рядок 2, стовпець 3, 0» again although its text is still `0`, and the label of (5,5) is «Рядок 5, стовпець 5, 0»
- **AND** when instead the player makes a second run at (4,1), (4,2), (4,3), the label of (4,3) gains the suffix and the label of (2,3) has lost it

#### Scenario: A hinted cause has both suffixes, the hint first

- **GIVEN** the fixture `HINT_BREAKS`, and the player pressed «Підказка» once (the hint fills (1,3) with `0` and breaks column 3)
- **WHEN** the test reads the labels of (1,3), (2,3) and (3,3)
- **THEN** the label of (1,3) is «Рядок 1, стовпець 3, 0, підказка, спричиняє порушення»
- **AND** the labels of the givens (2,3) and (3,3) are «Рядок 2, стовпець 3, 0, задано» and «Рядок 3, стовпець 3, 0, задано»
- **AND** after a click on (1,3) the label is «Рядок 1, стовпець 3, 1, спричиняє порушення» (the hint suffix is gone because the hinted cell was clicked; the click makes row 1 read `1 1 1` with the givens (1,1) and (1,2), so (1,3) is the cause by «Cause marker»)

#### Scenario: The cause suffix in English mode

- **GIVEN** the boards of the two scenarios above (three 0s in row 2; `HINT_BREAKS` after a hint) in turn, the page in English mode
- **WHEN** the test reads the labels
- **THEN** on the first board the labels are "Row 2, column 1, 0", "Row 2, column 2, 0" and "Row 2, column 3, 0, causes a violation"
- **AND** on the second the label of (1,3) is "Row 1, column 3, 0, hinted, causes a violation" and the labels of the givens are "Row 2, column 3, 0, given" and "Row 3, column 3, 0, given"

#### Scenario: Labels use the size of the board

- **GIVEN** a mounted page showing a board of size N from the table below, with a fixture puzzle

| N | Label of the last cell when it is an empty non-given cell |
|---|-----------------------------------------------------------|
| 4 | Рядок 4, стовпець 4, порожньо |
| 6 | Рядок 6, стовпець 6, порожньо |
| 8 | Рядок 8, стовпець 8, порожньо |

- **WHEN** the test reads the `aria-label` of the cell at `data-row` N and `data-col` N
- **THEN** it equals the label of the row of the table

### Requirement: Cells expose a Ukrainian name and their state

The page SHALL give every `[data-cell]` an `aria-label` that is its label as «Cell labels» defines it, «Рядок R, стовпець C, V» with the optional suffixes «, задано», «, підказка» and «, спричиняє порушення» (FR-70; in English mode "Row R, column C, V" with the suffixes ", given", ", hinted" and ", causes a violation"), so that the accessible name of a cell is its FR-70 label (FR-61). The label SHALL match the cell's text content, which stays empty, `0` or `1` (FR-34), and SHALL be rewritten whenever the cell changes (a click, a hint fill, a reset, a new board) or gains or loses the marker `cell-hinted` or `cell-cause`. The page SHALL set `aria-disabled="true"` on every given cell (FR-69) and on no other cell, and SHALL NOT set `aria-readonly` on any element, because that attribute is not allowed on a button. The page SHALL set `aria-invalid="true"` on exactly the cells that carry the class `cell-violation` (the same set, including every cell of a line highlighted for too many of one digit) and SHALL remove the attribute from every other cell, with the attribute absent rather than `"false"`. A given cell in a violation carries both `aria-disabled="true"` and `aria-invalid="true"`. The cause cell (FR-120) has no ARIA attribute besides these and its label: no `aria-describedby`, and the page has no element for it.

Traces: FR-61, FR-70, FR-69, FR-35, FR-36, FR-37, FR-38, FR-111, FR-120

#### Scenario: Names of a fresh board

- **GIVEN** a 6x6 fixture board whose only givens are `0` at row 3 columns 1 and 2
- **WHEN** the test reads `aria-label` of the cells at row 2 column 3, row 3 column 1 and row 6 column 6
- **THEN** they are «Рядок 2, стовпець 3, порожньо», «Рядок 3, стовпець 1, 0, задано» and «Рядок 6, стовпець 6, порожньо»
- **AND** for every cell the name equals the FR-70 label built from its `data-row`, `data-col`, text content, `data-given`, `cell-hinted` and `cell-cause`

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
- **AND** the name of the clicked cell ends «, спричиняє порушення», the names of the other two cells of the run do not contain «спричиняє» (each is its FR-70 label: «Рядок R, стовпець C, 0, задано» for a given, «Рядок R, стовпець C, 0» for a player's cell), and no cell has the attribute `aria-describedby`

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

### Requirement: Borders, cues and focus rings have enough contrast

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65), with one narrow exception: the system colour keyword `ButtonText` in the forced-colours block of the cause mark (see the colour scan below and «A violation shows a cue besides colour»; the user adopted that rule on 2026-10-11). The tokens are the 27 that the page binds in the G2 palette: the 25 of the main column (A-57, block 2) and the 2 backdrop tokens that the appendix marks "later" and that this change (G2 block 3, update-page-backdrop) binds, with the light value in the top-level `:root` and the dark value in `:root[data-theme="dark"]`:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-page` | `#f7f3ea` | `#1a1714` | page background; the `theme-color` copies |
| `--color-text` | `#1e2126` | `#f1ede4` | page text, header, button text, hinted digit |
| `--color-text-muted` | `#5f5549` | `#b8b0a4` | idle line, «Скинути», secondary text |
| `--color-cell-bg` | `#fffdf8` | `#24201b` | cell fill |
| `--color-control-bg` | `#fffdf8` | `#24201b` | button and summary fill |
| `--color-line` | `#e2dbcc` | `#3a332b` | board plate and border; the cell's bottom inset line |
| `--color-cell-border` | `#847b6d` | `#8a7f71` | cell border |
| `--color-control-border` | `#8c8374` | `#8a7f71` | header, summary and close-button borders |
| `--color-given-bg` | `#ddd3be` | `#4d4438` | given fill |
| `--color-given-border` | `#847b6d` | `#8a7f71` | given border, 1px |
| `--color-given-text` | `#1e2126` | `#f7f3ea` | given digit |
| `--color-entry-text` | `#a8400c` | `#f7a46a` | player's digit |
| `--color-primary` | `#b4460d` | `#f39a5b` | «Підказка» fill, «Нова головоломка» border, hinted border, hint accent, summary cue, logo |
| `--color-primary-text` | `#fffdf8` | `#1a1007` | text on a primary fill; the logo's cells |
| `--color-primary-soft` | `#f6e3d4` | `#3d2b1e` | hinted fill, hint line fill |
| `--color-hover-ring` | `#d28f6b` | `#a06941` | the cell's hover ring |
| `--color-violation-bg` | `#fbe4e1` | `#3f2320` | violation fill |
| `--color-violation-border` | `#b3261e` | `#ff8a7d` | violation border |
| `--color-violation-stripe` | `#f1c9c6` | `#5e332f` | the stripes of a violating cell |
| `--color-violation-text` | `#8f1d17` | `#ff8a7d` | violating digit |
| `--color-success` | `#2f6b3a` | `#8fd19a` | win line border, solved board border and ring |
| `--color-success-bg` | `#e2efdf` | `#1f3324` | win line fill, solved board plate |
| `--color-success-glow` | `#2f6b3a73` | `#8fd19a73` | the win glow keyframes (translucent) |
| `--color-win-text` | `#1e2126` | `#f1ede4` | win line text |
| `--color-focus` | `#1e2126` | `#f1ede4` | every focus ring |
| `--color-backdrop-soft` | `#46280f38` | `#08050273` | backdrop of the settings panel, the setup sheet and the rules panel below 64rem (translucent) |
| `--color-backdrop-strong` | `#2d190a80` | `#08050299` | backdrop of the confirmation dialog and the rules panel from 64rem (translucent) |

These are the "block 2" rows of the appendix to A-57 in `docs/requirements.md` and the two backdrop rows that the appendix marks "later" and that this change (G2 block 3) binds, value for value; the appendix is the source, this table is what the stylesheet declares (the role column of the two backdrop rows says which surfaces bind each, which the appendix's one-surface roles abbreviate; see «The backdrops take the design's translucent tokens»). The "later" rows of the appendix (`--color-violation-ink`, `--color-surface-raised`, `--color-overlay-border`, `--color-option-border` and the shadows `--color-shadow-sunken`, `--color-shadow-panel` and `--color-shadow-sheet`) are NOT declared by this requirement: the block that binds one adds it by its own delta, so the stylesheet never holds an unused token. A value is a literal `#rrggbb`. A value may be `#rrggbbaa` only for a token that the list marks translucent, and the list marks three, `--color-success-glow`, `--color-backdrop-soft` and `--color-backdrop-strong`; a translucent token is never the foreground or the background of a contrast pair, and a backdrop is checked composited over the page instead (FR-65, see «Effective theme on the document»). The top-level `:root` also declares `color-scheme: light` and `:root[data-theme="dark"]` declares `color-scheme: dark`, and nothing else: `:root` holds only the colour tokens and `color-scheme` (the non-colour variables live on `#app`, as the layout variables do).

The colour scan applies to every declaration outside a `:root` rule, wherever it is in the file (top level, nested rules, `@media`, `@supports`, `@layer`, `@keyframes`): its value SHALL NOT match `/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i` and SHALL NOT contain a CSS named colour (the full CSS Color 4 list), so `color-mix(` is forbidden everywhere, in gradients, shadows, rings and keyframes too; the keywords `transparent`, `currentcolor`, `inherit`, `initial`, `unset` and `revert` are allowed because they introduce no colour; the CSS Color 4 system colours (the 19 of its section on system colors: `AccentColor`, `AccentColorText`, `ActiveText`, `ButtonBorder`, `ButtonFace`, `ButtonText`, `Canvas`, `CanvasText`, `Field`, `FieldText`, `GrayText`, `Highlight`, `HighlightText`, `LinkText`, `Mark`, `MarkText`, `SelectedItem`, `SelectedItemText`, `VisitedText`; and the 23 deprecated ones of the same specification: `ActiveBorder`, `ActiveCaption`, `AppWorkspace`, `Background`, `ButtonHighlight`, `ButtonShadow`, `CaptionText`, `InactiveBorder`, `InactiveCaption`, `InactiveCaptionText`, `InfoBackground`, `InfoText`, `Menu`, `MenuText`, `Scrollbar`, `ThreeDDarkShadow`, `ThreeDFace`, `ThreeDHighlight`, `ThreeDLightShadow`, `ThreeDShadow`, `Window`, `WindowFrame`, `WindowText`; matched as whole identifiers, as the named colours are) are not in the list of named colours that the scan refuses and are not tokens; they are therefore listed on their own: exactly one declaration outside `:root` may hold one, `border-top-color: ButtonText` of `.cell-cause::after` inside `@media (forced-colors: active)` (the colour that the user's system chooses is not a palette colour, and the unscoped form would break the normal paint), and the scan of system colours is a new scan that tightens the old ones, never a relaxation of them; the colour-bearing shorthands `background`, `border`, `border-top`, `border-right`, `border-bottom`, `border-left`, `outline`, `box-shadow`, `text-decoration` and `column-rule` are allowed only when their colour is a `var(--color-...)` token (or the value is `none` or `0`); and no `--color-*` property is declared outside a `:root` rule. A `:root` rule for this scan is a rule whose selector is exactly `:root` or `:root[data-theme="dark"]`; a rule such as `:root[data-theme="dark"] #app` is an ordinary rule and obeys the scan. Selectors such as `#app` are not declaration values and are not affected. A shadow's geometry stays in the rule and its colour is a token (a `box-shadow` colour is `var(--color-...)`). The rules `body`, `.cell`, `.cell-given`, `.cell-hinted`, `.cell-violation`, `.cell-cause::after`, `button`, `.message-win` and the `:focus-visible` rules SHALL take their colours from these tokens, declared with longhand properties, as follows:

- `body`: `background-color` `--color-page`, `color` `--color-text`;
- `.cell`: `border-color` `--color-cell-border`, `background-color` `--color-cell-bg`, `color` `--color-entry-text`;
- `.cell-given`: `background-color` `--color-given-bg`, `border-color` `--color-given-border` at `border-width` 1px, `color` `--color-given-text`, `font-weight` 800;
- `.cell-hinted`: `border-color` `--color-primary`, `background-color` `--color-primary-soft`, `color` `--color-text`;
- `.cell-violation`: `border-color` `--color-violation-border`, `background-color` `--color-violation-bg`, `color` `--color-violation-text`;
- `.cell-cause::after`, the top-level rule outside any at-rule (a later rule of the same selector inside `@media (forced-colors: active)` overrides `border-top-color` with the system colour, below): `border-top-color` `--color-violation-border` (the mark of the cause cell, FR-64; no new token);
- `button`: `color` `--color-text`, `background-color` `--color-control-bg`, `border-color` `--color-control-border`;
- `.message-win`: `color` `--color-win-text`;
- the `:focus-visible` rules: `outline-color` `--color-focus`.

No rule uses `color: var(--color-control-border)`: a text colour that was the control border (the idle line, the `.mini-sep` separator of the rules panel) is `--color-text-muted`, because the control border is a 3:1 border colour and not a 4.5:1 text colour (C13 of the palette amendment). The dark palette is one more `:root` rule in the same file, `:root[data-theme="dark"]`, which redefines every one of the tokens above and adds none (A-51, A-57): each token therefore has exactly two value sets, light in the top-level `:root` and dark in that block. The page always sets `data-theme` on `<html>` (FR-104, FR-116), so the stylesheet has no `prefers-color-scheme` block (Q13). The colour scan counts `:root[data-theme="dark"]` as a `:root` rule: `--color-*` properties and hex literals are allowed in it and nowhere else. A `:root` rule inside `@media`, `@supports` or `@layer` may redefine tokens too, and then every resulting token set (the top-level set, the top-level set with the overrides of `:root[data-theme="dark"]` applied, and the top-level set with each conditional block's overrides applied) SHALL satisfy every pair below: **every contrast pair holds for each token set, light and dark** (FR-65). The shipped stylesheet has exactly the two value sets and no conditional `:root` block; the clause about conditional blocks is the generality of the test helper, not a feature of the stylesheet.

The WCAG 2 contrast ratio, computed from relative luminance on the resolved `#rrggbb` values, SHALL be at least 3:1 for these pairs:

- the cell border `--color-cell-border` against `--color-page`, `--color-cell-bg`, `--color-line` (the board plate) and `--color-success-bg` (the plate of a solved board); the former pair against `--color-given-bg` is NOT a pair, because a given cell is an inactive control (`aria-disabled`, FR-69) and WCAG 1.4.11 does not ask 3:1 of an inactive component (A-57);
- the violation cue `--color-violation-border` against `--color-page`, `--color-cell-bg`, `--color-violation-bg` and `--color-line`;
- the cause cue (the mark of FR-64, which lies on the violation fill and its stripe) `--color-violation-border` against `--color-violation-bg` (the pair above) and against `--color-violation-stripe`;
- the hinted cue and the primary colour: `--color-primary` against `--color-primary-soft`, `--color-line` and `--color-page`;
- the focus ring `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-violation-bg`, `--color-line`, `--color-primary-soft`, `--color-success-bg` and `--color-cell-border`;
- the control border `--color-control-border` against `--color-page`.

The given cell is told from an ordinary one by weight, not by a border: `.cell-given` declares `font-weight` 800 against the ordinary cell's 500, a given cell in a violation keeps 800 (the rule `.cell-given.cell-violation` declares `font-weight` 800, over the 700 of `.cell-violation`), and its border is 1px in `--color-given-border`, which equals `--color-cell-border` (deliberate, PA-Q1 A of the palette amendment: the design's given cue is the weight; the fill `--color-given-bg`, the darker digit and the missing bottom inset line are decoration). The text SHALL have at least 4.5:1:

- `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-control-bg` and `--color-primary-soft`;
- `--color-given-text` against `--color-given-bg`;
- `--color-entry-text` against `--color-cell-bg`;
- `--color-text-muted` against `--color-page`, `--color-cell-bg` and `--color-control-bg`;
- `--color-violation-text` against `--color-violation-bg` and against `--color-violation-stripe` (the darkest band of the violating cell);
- `--color-primary-text` against `--color-primary`;
- `--color-win-text` against `--color-success-bg`.

Traces: FR-65, FR-64, FR-120, A-58, NFR-9, FR-104

#### Scenario: Tokens exist and are literal

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` rule
- **THEN** each of the 27 token names of the list above is declared once, with the light value of the list, `#rrggbb` for 24 of them and `#rrggbbaa` for the three translucent tokens only (`--color-success-glow`, `--color-backdrop-soft` and `--color-backdrop-strong`)
- **AND** the rule `:root[data-theme="dark"]` declares each of the same 27 names once with the dark value of the list, so each token has exactly two value sets and the dark block redefines every token of the list and adds none
- **AND** the top-level `:root` declares no property other than the 27 tokens and `color-scheme`, and a translucent token appears in no contrast pair

#### Scenario: Every declared token is bound by a rule

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test counts, for each of the 27 tokens, the declarations outside `:root` whose value contains `var(<token>)`
- **THEN** each token is referenced at least once, so the stylesheet holds no unused token

#### Scenario: Rules use the tokens and no colour literal is left

- **GIVEN** every declaration of `src/ui/style.css` outside the `:root` rules (the top-level one and `:root[data-theme="dark"]`), found by walking the parsed stylesheet through nested rules and at-rules, `@keyframes` included
- **WHEN** the test applies the colour scan above to each value
- **THEN** none matches the literal pattern or contains a named colour (`color-mix(` among the patterns), every colour-bearing shorthand has a `var(--color-...)` colour or the value `none` or `0`, every `color`, `background-color`, `border-color` and `outline-color` value is a single `var(--color-...)` of a declared token or an allowed keyword, and no `--color-*` property is declared outside `:root`
- **AND** `body` declares `background-color` `var(--color-page)` and `color` `var(--color-text)`; `.cell` declares `border-color` `var(--color-cell-border)`, `background-color` `var(--color-cell-bg)` and `color` `var(--color-entry-text)`; `.cell-given` declares `background-color` `var(--color-given-bg)`, `border-color` `var(--color-given-border)`, `border-width` 1px, `color` `var(--color-given-text)` and `font-weight` 800; `.cell-hinted` declares `border-color` `var(--color-primary)`, `background-color` `var(--color-primary-soft)` and `color` `var(--color-text)`; `.cell-violation` declares `border-color` `var(--color-violation-border)`, `background-color` `var(--color-violation-bg)` and `color` `var(--color-violation-text)`; the top-level `.cell-cause::after` rule (outside any at-rule) declares `border-top-color` `var(--color-violation-border)`; `button` declares `color` `var(--color-text)`, `background-color` `var(--color-control-bg)` and `border-color` `var(--color-control-border)`; `.message-win` declares `color` `var(--color-win-text)`
- **AND** no declaration of `color` has the value `var(--color-control-border)`

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
- **WHEN** the test computes the WCAG contrast ratio of `--color-cell-border` against `--color-page`, `--color-cell-bg`, `--color-line` and `--color-success-bg`
- **THEN** each ratio is at least 3 (light 3.77, 4.10, 3.03 and 3.50; dark 4.55, 4.13, 3.17 and 3.44)
- **AND** `CONTRAST_PAIRS` contains no (`--color-cell-border`, `--color-given-bg`) entry (2.81 in light, 2.43 in dark): a given cell is inactive (FR-69, A-57)

#### Scenario: The given cue is weight

- **GIVEN** the injected stylesheet and the four cell kinds at N = 4, 6 and 8 of "The computed border is heavier for a violation at every size", with the token values of each token set substituted, and the declarations of `.cell-given`
- **WHEN** the test reads `getComputedStyle(cell)` `fontWeight` and `borderTopWidth` of an ordinary cell, a given cell, a violating non-given cell and a given cell in a violation
- **THEN** the weights are `500`, `800`, `700` and `800`, so a given cell is told from an ordinary one by weight, also in a violation
- **AND** the ratio of `--color-given-text` to `--color-given-bg` is at least 4.5 in each token set (10.87 light, 8.62 dark)
- **AND** `--color-given-border` equals `--color-cell-border` in each token set and the computed `borderTopWidth` of a given cell is `1px` (deliberate: A-57 and PA-Q1 A; the given border is not a 3:1 cue, so this is not a defect)

#### Scenario: The violation cue has 3:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-violation-border` against `--color-page`, `--color-cell-bg`, `--color-violation-bg` and `--color-line`
- **THEN** each ratio is at least 3

#### Scenario: The cause cue has 3:1 against the violation fill and the stripe

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-violation-border` against `--color-violation-bg` and against `--color-violation-stripe`
- **THEN** each ratio is at least 3 (against the fill 5.38 in light and 6.24 in dark; against the stripe 4.33 and 4.61)
- **AND** the pair against the stripe is in `CONTRAST_PAIRS` (group `cause-cue`) and the pair against the fill is the existing violation cue pair, so the list holds 35 pairs
- **AND** the stripe is not a cue (its ratio against the fill stays below 3), and the mark has no token of its own: the token list is still the 27 of the table

#### Scenario: The accepted adjacencies of the cause mark are not contrast pairs

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-violation-border` against `--color-hover-ring` (the hover ring runs under the two legs of the mark)
- **THEN** it is 2.45 in light and 2.00 in dark, below 3, and `CONTRAST_PAIRS` has no pair of `--color-violation-border` and `--color-hover-ring`, as the accepted adjacencies of the focus ring have none (PA-Q8); the mark's hypotenuse lies on the fill and the stripe at 4.33 or more
- **AND** the top-level `.cell:focus-visible` rule declares `outline-style` `solid` and `outline-offset` `2px`, so the cell's own focus ring is drawn outside its border box and never covers the mark; neither `.cell-cause` nor `.cell-cause::after` declares `outline`, `outline-style`, `outline-width`, `outline-color`, `outline-offset` or `box-shadow`; and `CONTRAST_PAIRS` has no pair of `--color-violation-border` with `--color-focus` or with `--color-hover-ring`, in either order (a focused neighbour's ring that overlaps the mark's cell on 8×8, where the gaps are 2 to 3px, is the same accepted adjacency as for the cell border)

#### Scenario: A system colour keyword appears in exactly one declaration

- **GIVEN** every declaration of the parsed `src/ui/style.css` outside the `:root` rules, found through nested rules and at-rules
- **WHEN** the test searches the values for the CSS Color 4 system colours, case-insensitively
- **THEN** exactly one declaration holds one, `border-top-color` of `.cell-cause::after` inside `@media (forced-colors: active)`, with the keyword `ButtonText`
- **AND** the existing scans (the literal pattern, the named colours, the colour-bearing shorthands, the `color`, `background-color`, `border-color` and `outline-color` properties) find nothing in that rule and were not loosened to allow it: the keyword is outside the list of named colours, and `border-top-color` is not one of the four properties the scan reads, so the old scans pass on it and the new scan is the one that pins it

#### Scenario: The hinted cue and the primary colour have 3:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and the declarations of `.cell-hinted`
- **WHEN** the test computes the ratio of `--color-primary` against `--color-primary-soft`, `--color-line` and `--color-page`
- **THEN** each ratio is at least 3 (light 4.41, 3.99 and 4.96; dark 6.13, 5.68 and 8.15)
- **AND** `.cell-hinted` declares a dashed border style and `font-style` italic besides the colours, so the hinted cell has cues that are not colour

#### Scenario: The focus ring has 3:1 against every cell background

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-violation-bg`, `--color-line`, `--color-primary-soft`, `--color-success-bg` and `--color-cell-border`
- **THEN** each ratio is at least 3 (against the plate 11.72 in light and 10.65 in dark; against the cell border 3.87 and 3.36)

#### Scenario: The control border has 3:1 and the text has 4.5:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-control-border` against `--color-page`, and the ratios of the 4.5:1 list above: `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-control-bg` and `--color-primary-soft`; `--color-given-text` against `--color-given-bg`; `--color-entry-text` against `--color-cell-bg`; `--color-text-muted` against `--color-page`, `--color-cell-bg` and `--color-control-bg`; `--color-violation-text` against `--color-violation-bg` and `--color-violation-stripe`; `--color-primary-text` against `--color-primary`; and `--color-win-text` against `--color-success-bg`
- **THEN** the first ratio is at least 3 (3.38 light, 4.55 dark) and every other ratio is at least 4.5

#### Scenario: The cascade gives each cell state the colours whose contrast is checked

- **GIVEN** the injected stylesheet and the four cell kinds at N = 4, 6 and 8 of "The computed border is heavier for a violation at every size", plus a cell with the class `cell-hinted`, and the token values converted to `rgb(r, g, b)` strings, once with the light values and once with the dark values (the test injects the stylesheet with the values of the set substituted)
- **WHEN** the test reads `getComputedStyle(cell)` `borderTopColor`, `backgroundColor` and `color` of each kind
- **THEN** an ordinary cell has `--color-cell-border`, `--color-cell-bg` and `--color-entry-text`; a given cell has `--color-given-border`, `--color-given-bg` and `--color-given-text`; a violating cell and a given cell in a violation both have `--color-violation-border`, `--color-violation-bg` and `--color-violation-text`; a hinted cell has `--color-primary`, `--color-primary-soft` and `--color-text`
- **AND** the page (`body`) computes `background-color` `--color-page`

#### Scenario: The contrast helper is not vacuous

- **GIVEN** the contrast function of the test helpers
- **WHEN** it is called for `#ffffff` against `#000000`, for `#ffffff` against `#ffffff` and for the pair `#d1d5db` and `#f9fafb`
- **THEN** it returns 21, 1 and a value below 3 respectively

#### Scenario: The token reader accepts a translucent value only for a translucent token

- **GIVEN** the token reader of the test helpers and a stylesheet text with `--color-success-glow: #2f6b3a73` and `--color-backdrop-strong: #2d190a80` and, in another copy, `--color-page: #f7f3ea80`
- **WHEN** the reader and the contrast function read each copy
- **THEN** the first copy is read as two translucent tokens that no contrast pair uses, and the second is rejected (the format `#rrggbbaa` is allowed only for the token the list marks translucent), as is an `rgb()` value in either

### Requirement: English page text

Every Ukrainian page string of `src/ui/strings.ts` SHALL have an English counterpart in the table below (FR-111, FR-94, A-54: the wording is the appendix of the signed amendment, taken as final by autonomy-log row 119 and refined only by the eval judge and the reviewers). `src/ui/strings.ts` keeps its existing Ukrainian export names and shapes unchanged (named constants, arrays, nested objects and the functions `sizeLabel`, `cellLabel` and `summaryText`), except that `cellLabel` takes a sixth argument `cause`, a boolean after `hinted` (FR-70, FR-120); the English texts are a second table of the same shape (for example `EN`) with the same functions, and a language-keyed accessor picks one of the two. A parity test flattens the string leaves of both tables, compares the two key sets, and calls every format function with sample arguments in both languages. No file under `src/ui/` other than `src/ui/strings.ts`, and no `src/main.ts`, holds a Cyrillic character. No English page text or English hint sentence contains U+0027 or U+02BC; if an English text ever needs an apostrophe it uses U+2019 (Q4). The U+02BC rule of FR-41 is a Ukrainian spelling rule and applies to the Ukrainian text only. **Reading rule:** wherever another requirement or scenario of this capability quotes a Ukrainian text, it describes Ukrainian mode, the default, and the English counterpart of the table applies in English mode; a scenario that says "English mode" sets the language by pressing "English" in the settings panel or by storing `binarka.language` = `en` before the mount. Digits, «×», «·» and the ordinary spaces are the same in both modes.

| Ukrainian | English |
|---|---|
| Бінарка | Binarka |
| Підказка / Скинути / Нова головоломка | Hint / Reset / New puzzle |
| Правила / Зрозуміло | Rules / Got it |
| Розмір поля / Поле N×N | Grid size / Grid N×N |
| Почати заново? Ваші ходи на цьому полі буде втрачено. | Start over? Your moves on this board will be lost. |
| Так, почати / Скасувати | Yes, start over / Cancel |
| Рядок R, стовпець C, порожньо / , задано / , підказка / , спричиняє порушення | Row R, column C, empty / , given / , hinted / , causes a violation (the cause suffix confirmed by the user on 2026-10-11, autonomy-log row 164) |
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

Traces: FR-111, FR-94, FR-55, NFR-5, FR-70, FR-120

#### Scenario: Every Ukrainian string has an English counterpart with the same key

- **GIVEN** the exports of `src/ui/strings.ts`
- **WHEN** the test flattens the string leaves of the Ukrainian and the English table, compares the two key sets, and calls `sizeLabel`, `cellLabel` and `summaryText` with sample arguments in both languages
- **THEN** the two key sets are equal, the Ukrainian outputs equal those of the existing exports, and every English value is a non-empty string that matches `/[A-Za-z]/` and not `/\p{Script=Cyrillic}/u`, except the option name «Українська»
- **AND** `cellLabel(5, 6, 0, false, true, true)` returns «Рядок 5, стовпець 6, 0, підказка, спричиняє порушення» in Ukrainian and "Row 5, column 6, 0, hinted, causes a violation" in English, `cellLabel(2, 3, 0, false, false, true)` returns «Рядок 2, стовпець 3, 0, спричиняє порушення» and "Row 2, column 3, 0, causes a violation", the five-argument outputs of the existing scenarios are those with the sixth argument `false`, and a given cell's label is «, задано» (", given") whatever the sixth argument is

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
- **THEN** each name matches `/^Grid [468]×[468]$/` and `/^Row [1-8], column [1-8], (empty|0|1)(, given|(, hinted)?(, causes a violation)?)$/` in English mode and the Ukrainian forms in Ukrainian mode, and none contains a letter of the other script

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
- **THEN** the board names are «Поле 4×4» and «Поле 8×8», each cell name matches `/^Рядок [1-8], стовпець [1-8], (порожньо|0|1)(, задано|(, підказка)?(, спричиняє порушення)?)$/`, and every collected name contains Cyrillic letters and no Latin letters

#### Scenario: Win message text

- **GIVEN** a solved board
- **WHEN** the win message is shown
- **THEN** its text is the one required by «Win message when solved» (FR-41), and it contains Cyrillic letters and no Latin letters
