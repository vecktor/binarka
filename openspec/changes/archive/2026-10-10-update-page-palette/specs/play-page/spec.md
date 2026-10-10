## MODIFIED Requirements

### Requirement: Borders, cues and focus rings have enough contrast

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65). The tokens are the 25 that the main column binds in the G2 palette (A-57, block 2), with the light value in the top-level `:root` and the dark value in `:root[data-theme="dark"]`:

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

These are the "block 2" rows of the appendix to A-57 in `docs/requirements.md`, value for value; the appendix is the source, this table is what the stylesheet declares. The "later" rows of the appendix (`--color-violation-ink`, `--color-surface-raised`, `--color-overlay-border`, `--color-option-border`, the backdrops and the shadows) are NOT declared by this requirement: the block that binds one adds it by its own delta, so the stylesheet never holds an unused token. A value is a literal `#rrggbb`. A value may be `#rrggbbaa` only for a token that the list marks translucent, and the list marks one, `--color-success-glow`; a translucent token is never the foreground or the background of a contrast pair. The top-level `:root` also declares `color-scheme: light` and `:root[data-theme="dark"]` declares `color-scheme: dark`, and nothing else: `:root` holds only the colour tokens and `color-scheme` (the non-colour variables live on `#app`, as the layout variables do).

The colour scan applies to every declaration outside a `:root` rule, wherever it is in the file (top level, nested rules, `@media`, `@supports`, `@layer`, `@keyframes`): its value SHALL NOT match `/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i` and SHALL NOT contain a CSS named colour (the full CSS Color 4 list), so `color-mix(` is forbidden everywhere, in gradients, shadows, rings and keyframes too; the keywords `transparent`, `currentcolor`, `inherit`, `initial`, `unset` and `revert` are allowed because they introduce no colour; the colour-bearing shorthands `background`, `border`, `border-top`, `border-right`, `border-bottom`, `border-left`, `outline`, `box-shadow`, `text-decoration` and `column-rule` are allowed only when their colour is a `var(--color-...)` token (or the value is `none` or `0`); and no `--color-*` property is declared outside a `:root` rule. A `:root` rule for this scan is a rule whose selector is exactly `:root` or `:root[data-theme="dark"]`; a rule such as `:root[data-theme="dark"] #app` is an ordinary rule and obeys the scan. Selectors such as `#app` are not declaration values and are not affected. A shadow's geometry stays in the rule and its colour is a token (a `box-shadow` colour is `var(--color-...)`). The rules `body`, `.cell`, `.cell-given`, `.cell-hinted`, `.cell-violation`, `button`, `.message-win` and the `:focus-visible` rules SHALL take their colours from these tokens, declared with longhand properties, as follows:

- `body`: `background-color` `--color-page`, `color` `--color-text`;
- `.cell`: `border-color` `--color-cell-border`, `background-color` `--color-cell-bg`, `color` `--color-entry-text`;
- `.cell-given`: `background-color` `--color-given-bg`, `border-color` `--color-given-border` at `border-width` 1px, `color` `--color-given-text`, `font-weight` 800;
- `.cell-hinted`: `border-color` `--color-primary`, `background-color` `--color-primary-soft`, `color` `--color-text`;
- `.cell-violation`: `border-color` `--color-violation-border`, `background-color` `--color-violation-bg`, `color` `--color-violation-text`;
- `button`: `color` `--color-text`, `background-color` `--color-control-bg`, `border-color` `--color-control-border`;
- `.message-win`: `color` `--color-win-text`;
- the `:focus-visible` rules: `outline-color` `--color-focus`.

No rule uses `color: var(--color-control-border)`: a text colour that was the control border (the idle line, the `.mini-sep` separator of the rules panel) is `--color-text-muted`, because the control border is a 3:1 border colour and not a 4.5:1 text colour (C13 of the palette amendment). The dark palette is one more `:root` rule in the same file, `:root[data-theme="dark"]`, which redefines every one of the tokens above and adds none (A-51, A-57): each token therefore has exactly two value sets, light in the top-level `:root` and dark in that block. The page always sets `data-theme` on `<html>` (FR-104, FR-116), so the stylesheet has no `prefers-color-scheme` block (Q13). The colour scan counts `:root[data-theme="dark"]` as a `:root` rule: `--color-*` properties and hex literals are allowed in it and nowhere else. A `:root` rule inside `@media`, `@supports` or `@layer` may redefine tokens too, and then every resulting token set (the top-level set, the top-level set with the overrides of `:root[data-theme="dark"]` applied, and the top-level set with each conditional block's overrides applied) SHALL satisfy every pair below: **every contrast pair holds for each token set, light and dark** (FR-65). The shipped stylesheet has exactly the two value sets and no conditional `:root` block; the clause about conditional blocks is the generality of the test helper, not a feature of the stylesheet.

The WCAG 2 contrast ratio, computed from relative luminance on the resolved `#rrggbb` values, SHALL be at least 3:1 for these pairs:

- the cell border `--color-cell-border` against `--color-page`, `--color-cell-bg`, `--color-line` (the board plate) and `--color-success-bg` (the plate of a solved board); the former pair against `--color-given-bg` is NOT a pair, because a given cell is an inactive control (`aria-disabled`, FR-69) and WCAG 1.4.11 does not ask 3:1 of an inactive component (A-57);
- the violation cue `--color-violation-border` against `--color-page`, `--color-cell-bg`, `--color-violation-bg` and `--color-line`;
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

Traces: FR-65, FR-64, NFR-9, FR-104

#### Scenario: Tokens exist and are literal

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` rule
- **THEN** each of the 25 token names of the list above is declared once, with the light value of the list, `#rrggbb` for 24 of them and `#rrggbbaa` for `--color-success-glow` only
- **AND** the rule `:root[data-theme="dark"]` declares each of the same 25 names once with the dark value of the list, so each token has exactly two value sets and the dark block redefines every token of the list and adds none
- **AND** the top-level `:root` declares no property other than the 25 tokens and `color-scheme`, and a translucent token appears in no contrast pair

#### Scenario: Every declared token is bound by a rule

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test counts, for each of the 25 tokens, the declarations outside `:root` whose value contains `var(<token>)`
- **THEN** each token is referenced at least once, so the stylesheet holds no unused token

#### Scenario: Rules use the tokens and no colour literal is left

- **GIVEN** every declaration of `src/ui/style.css` outside the `:root` rules (the top-level one and `:root[data-theme="dark"]`), found by walking the parsed stylesheet through nested rules and at-rules, `@keyframes` included
- **WHEN** the test applies the colour scan above to each value
- **THEN** none matches the literal pattern or contains a named colour (`color-mix(` among the patterns), every colour-bearing shorthand has a `var(--color-...)` colour or the value `none` or `0`, every `color`, `background-color`, `border-color` and `outline-color` value is a single `var(--color-...)` of a declared token or an allowed keyword, and no `--color-*` property is declared outside `:root`
- **AND** `body` declares `background-color` `var(--color-page)` and `color` `var(--color-text)`; `.cell` declares `border-color` `var(--color-cell-border)`, `background-color` `var(--color-cell-bg)` and `color` `var(--color-entry-text)`; `.cell-given` declares `background-color` `var(--color-given-bg)`, `border-color` `var(--color-given-border)`, `border-width` 1px, `color` `var(--color-given-text)` and `font-weight` 800; `.cell-hinted` declares `border-color` `var(--color-primary)`, `background-color` `var(--color-primary-soft)` and `color` `var(--color-text)`; `.cell-violation` declares `border-color` `var(--color-violation-border)`, `background-color` `var(--color-violation-bg)` and `color` `var(--color-violation-text)`; `button` declares `color` `var(--color-text)`, `background-color` `var(--color-control-bg)` and `border-color` `var(--color-control-border)`; `.message-win` declares `color` `var(--color-win-text)`
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

- **GIVEN** the token reader of the test helpers and a stylesheet text with `--color-success-glow: #2f6b3a73` and, in another copy, `--color-page: #f7f3ea80`
- **WHEN** the reader and the contrast function read each copy
- **THEN** the first copy is read as a translucent token that no contrast pair uses, and the second is rejected (the format `#rrggbbaa` is allowed only for the token the list marks translucent), as is an `rgb()` value in either

### Requirement: A violation shows a cue besides colour

The stylesheet `src/ui/style.css` SHALL draw a cell in a highlighted violation with a heavier border than an ordinary cell, as well as with the violation colours (FR-64): an ordinary cell has a border width of 1px, a given cell 1px (a given cell is told apart by weight, not by width, see «Borders, cues and focus rings have enough contrast» and A-57), a cell with the class `cell-violation` 2px and a given cell in a violation 2px, so a violation is wider than both the ordinary cell and the given cell. The cascade SHALL give a given cell in a violation the 2px violation border too: the rule for `cell-violation` wins over the rule for `cell-given`, whether by source order or by specificity, and the check measures the computed style, not the order of the rules. The violating digit carries a second cue that is not colour: it is underlined, declared with the longhands `text-decoration-line: underline` and `text-decoration-thickness: 2px` (the colour scan flags the shorthand `text-decoration`, whose colour part it cannot read, so the main column's rules do not use the shorthand). The diagonal stripe in the violating cell's `background-image` (a repeating gradient of `--color-violation-stripe` and `transparent`) is decoration, not a cue: it has 1.24:1 (light) and 1.35:1 (dark) against the violation fill. The cue is applied through the existing class `cell-violation` (no new class), and `aria-invalid` (Cells expose a Ukrainian name and their state) is its non-visual counterpart.

Traces: FR-64

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

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила» and the settings button, the summary button, the three size buttons, the four level buttons, the three theme options, the two language options, the close button «Закрити» of the settings panel, the start button «Почати» and the close button «Закрити» of the setup sheet, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the inner side of the ring, over the gap between cells, shows the board plate `--color-line` and not the page (the board's gaps are 4, 3 and 2px with the size and the width; the pair `--color-focus` against the plate is 11.72 in light and 10.65 in dark, A-57), the ring's outer edge lands on a neighbour's border and fill (the pairs `--color-focus` against the cell, given, violation, hinted-soft and success fills are 10.87 or more in light and 8.17 or more in dark, and against the cell border 3.87 and 3.36) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. Three adjacencies are accepted below 3:1 (A-57, PA-Q8 of the palette amendment): the ring against a neighbour's violation border (2.47 light, 1.96 dark), against a hinted neighbour's primary border (2.94, 1.88) and against the success border at the edge of a solved 8×8 board (2.53, 1.53); in each case the inner band of the ring stays on the plate at 10.65:1 or more. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all. The open setup sheet SHALL keep a keyboard-focused control clear of its sticky footer row (FR-65 "unobscured", WCAG 2.4.11): the open sheet declares a `scroll-padding-bottom` of at least the footer height, so the browser's own focus scrolling brings a focused option above the footer (second review-gate fix round, 2026-10-10, autonomy-log row 126).

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

#### Scenario: The ring's accepted adjacencies are recorded

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-focus` against `--color-line`, `--color-violation-border`, `--color-primary` and `--color-success`, rounded to two decimals
- **THEN** the first is at least 10.65 and the other three equal 2.47, 2.94 and 2.53 in light and 1.96, 1.88 and 1.53 in dark, so a change of a value that moves an accepted adjacency is deliberate and not silent
- **AND** none of those three ratios is listed as a contrast pair of «Borders, cues and focus rings have enough contrast»

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

### Requirement: The summary and level buttons set their own colours

The summary button SHALL carry the class `setup-button` (its text span carries `setup-summary` and its cue span `setup-cue`, as in the design reference `review-set-11`), the level control the class `level-control`, and the stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule `.setup-button`, in the rule `.level-control button`, in the rule `.level-control button[aria-checked='true']` and in the rule `.level-control button[aria-disabled='true']` (FR-65, NFR-9). For each of the four states, the declarations of the plain rule, with those of the state rule laid over them, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens) in each token set, light and dark (A-51, FR-65), and the unavailable state SHALL NOT be drawn with `opacity`. The rule `.level-control button[aria-disabled='true']` SHALL also declare a cue that is not colour alone (FR-91): a `border-style` that differs from the plain rule's, or a `text-decoration` other than `none`; which cue is used follows the user's updated design (the design reference `review-set-11` uses a dashed border and a dashed radio ring and no strike-through, autonomy-log row 93). No colour literal is added. «Почати» keeps its current token bindings in the palette block (update-page-palette); the setup-sheet block binds it to the design's primary fill. The summary button, the level buttons and the close button are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator of FR-65, and the rules of the sheet obey the existing stylesheet scans (no `!important`, no `:has(` besides the idle-line rule, no `display: contents`, no removed outline). The start button `[data-action="setup-start"]` SHALL set its own explicit `color` and `background-color`, each a single `var(--color-...)` token, in one rule that matches it (found by matching the mounted element against the selectors of the stylesheet), with at least 4.5:1 contrast between the two on the resolved tokens of each token set, in the plain state and in the hover and focus-visible states if the rule has them, and without `opacity` (FR-65, FR-101). «Почати» takes the design's primary fill (`--color-primary` and `--color-primary-text`) from the setup-sheet block (FR-65, A-57); until then it keeps its current tokens, which satisfy the pairs of «Borders, cues and focus rings have enough contrast». The `.size-control` rules are not changed by this requirement. The look of the buttons (the ring, the sunken look of the unavailable state, the colours beyond the pairs above) is covered by the held NFR-14, see `docs/requirements-held.md`, and is not claimed here.

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
- **THEN** each passes unchanged, and every token of the list of «Borders, cues and focus rings have enough contrast» is still declared in `:root` and in `:root[data-theme="dark"]`

### Requirement: Main column layout geometry follows the design reference

The boxes of the page's main column SHALL equal those of the design reference (NFR-14) within 0.5 CSS px at the sampled cases of `quality/design-geometry.json`. The reference geometry is the design build (`design/v0`), which stands in for the frozen reference `design/v0-screenshots/review-set-14/` because, captured at a real device scale, it reproduces every reference shot exactly (`docs/qa/g2/harness-calibration.txt`). The elements are: the header `.page-header`, its title `h1` and logo, the settings button `[data-action="settings"]`, the «Правила» button `[data-action="rules"]`, the summary button `[data-action="setup"]`, the board `[data-board]`, its first and last cells, the action buttons `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]`, the message area `.messages`, the idle line `[data-message="idle"]`, the hint line `[data-message="hint"]` and the win line `[data-message="win"]` (16 elements). A box is its `getBoundingClientRect()`; it matches when each of its four edges is within 0.5 px of the reference's. A box of zero width and zero height matches another such box wherever it is, because it paints nothing: the design hides an empty hint line and an empty win line with `display: none`, while the page keeps both rendered as live regions (FR-63), out of the flow and 0×0.

The sampled cases are the light shots of `review-set-14` whose state is reached at mount: the default state at 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900; the 8×8 board at the same six viewports; the 4×4 board, the 8×8 board at level 4 and the solved board at the same viewports except 1366×650; and the shown hint at the same viewports except 1366×650 (32 cases). Each case shows the design's fixture board of its state through the capture-only board (FR-119); the hint case shows the hint board without its hinted cell and then presses «Підказка» once, as the capture does, in Chromium with the browser setup of `playwright.config.ts`. Coverage is sampled, never continuum. The geometry does not depend on the colour scheme.

While the board is solved (the win line shows, FR-38), the board host `.board-host` SHALL carry `data-solved="true"`, and at no other time; the stylesheet reads it for the button row (after a win the new-puzzle button takes the bold weight from the hint button), because a has-selector is allowed only in the idle-line rule (FR-65). While the column is ported, the setup sheet SHALL keep its text height (the browser's normal line height) until its own block, so that at 1366×650 its four level options stay above the footer strip without scrolling, as before this change. This requirement covers geometry only. The page's colours, shadows and backdrops, the panels' and the dialog's own geometry, and the pixel score of each shot are outside it. The settings panel stays under the header, its right edge on the column's right edge from 48rem, as the column changes.

Traces: NFR-14, NFR-10, NFR-12, FR-68, FR-119

#### Scenario: The default page matches the design's column at every sampled viewport

- **GIVEN** the default state with the design's 6×6 fixture board (FR-119) at 1024×768
- **WHEN** the page has loaded
- **THEN** the header, the summary button, the board, its first and last cells, the three action buttons and the message area each match the box in `quality/design-geometry.json` for `1024-light-default` within 0.5 px
- **AND** the same holds for the default state at 320×700, 375×812, 768×1024, 1366×650 and 1440×900

#### Scenario: The 4×4 and 8×8 boards keep the column

- **GIVEN** the design's 4×4 fixture, its 8×8 fixture, and its 8×8 fixture at level 4, each at the sampled viewports
- **WHEN** the page has loaded
- **THEN** every listed box matches its case in `quality/design-geometry.json` within 0.5 px, including the 8×8 board that bleeds into the page padding on phones

#### Scenario: The solved board keeps its geometry

- **GIVEN** the design's solved 6×6 fixture, which shows the win state at mount (FR-119)
- **WHEN** the page has loaded at a sampled viewport
- **THEN** every listed box, including the win line, matches its `win` case within 0.5 px

#### Scenario: The board host marks the solved state

- **GIVEN** the page with an unsolved board
- **WHEN** the last move solves it (a hint or a click), or a solved board is shown at mount (FR-119)
- **THEN** `.board-host` carries `data-solved="true"` together with the win line
- **AND** after «Нова головоломка», «Скинути» or a new size and level the attribute is gone together with the win line

#### Scenario: The settings panel follows the column from 48rem

- **GIVEN** the default page at 768×1024, 1024×768, 1366×650 or 1440×900
- **WHEN** the settings panel is opened with the settings button
- **THEN** the panel's right edge is within 0.5 px of the header's right edge (the column's right edge)
- **AND** the panel's top is 0.5rem (8 px) below the header's bottom, within 0.5 px, and its left edge is inside the column

#### Scenario: A shown hint keeps the design's geometry

- **GIVEN** the design's hint board without its hinted cell (FR-119), at a sampled viewport
- **WHEN** «Підказка» is pressed once
- **THEN** every listed box, including the hint line with its accent and the message area, matches its `hint` case in `quality/design-geometry.json` within 0.5 px

#### Scenario: The setup sheet keeps its levels in view at 1366×650

- **GIVEN** the default page at 1366×650
- **WHEN** the setup sheet is opened with the summary button, before any scrolling
- **THEN** each of the four level options ends above the footer strip (the top of «Почати» less 16 px)

#### Scenario: Colours are the G2 palette

- **GIVEN** the stylesheet after this change
- **WHEN** its `:root` and dark token sets are read
- **THEN** both sets equal the 25 block-2 tokens and values of the appendix to A-57 (the table of «Borders, cues and focus rings have enough contrast»), and no other `--color-*` token is declared

## ADDED Requirements

### Requirement: The main column takes the design palette

The paint of the page's main column SHALL equal that of the design reference (NFR-14, FR-65, A-57) in the sampled cases of `quality/design-paint.json`, except the three deviations that A-57 names. The reference is the design build (`design/v0`, served from `design/v0/out`), which stands in for the frozen reference `design/v0-screenshots/review-set-14/` as in «Main column layout geometry follows the design reference». The main column is the page, the header with the logo and its buttons (the settings button `[data-action="settings"]` and «Правила» `[data-action="rules"]`), the summary button `[data-action="setup"]` with its cue, the board plate `[data-board]` and its cells in every state (ordinary and entry, given, hinted, violation, given in a violation, solved), the focus rings, the three action buttons (`[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, with the swap after a win) and the message area (the idle, hint and win lines). The setup sheet, the rules and settings panels, the confirmation dialog and their backdrops are outside this requirement and keep their current token bindings until their own blocks; «Почати» keeps its current tokens.

The mechanism is declared here and built by the test-engineer, test first. The script `scripts/freeze-design-paint.mjs` freezes the computed paint of the main-column elements and cell kinds of the design build, for the light and the dark scheme, in the states default, hint, win, four and eight, into `quality/design-paint.json`; it serves `design/v0/out` the way `scripts/freeze-design-geometry.mjs` does (including its path guard) and uses the same browser setup as the e2e test (Playwright's "Desktop Chrome" device, reduced motion, the scheme set on the browser context, the viewport 1024×768, no stored preference, so the theme is the system one as in the design's head script). The frozen properties of an element are `color`, `background-color`, the presence of a `background-image` (a gradient or none; never its colour stops, because the design's stripe is a translucent colour and the page's is the opaque composite of it, so the two computed strings can never be equal and the stripe value is pinned by the stylesheet scenarios instead), the colour, width and style of the four borders, `box-shadow`, `font-weight`, `font-style`, `text-decoration-line`, and for the logo's shapes `fill` and `stroke`; and, for the first non-given cell and for «Підказка» after a keyboard key press and a script focus (so that `:focus-visible` applies, as in the capture adapter), the `outline` colour, width, style and offset. The cell kinds are found by their classes (`cell-given`, `cell-hinted`, `cell-violation`) and by the digit: an ordinary empty cell, an entry cell (a non-given cell with a digit and no class), a given cell, a hinted cell, a violating cell. The e2e test `e2e/nfr-14-palette.spec.ts` (`@trace NFR-14`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) loads the built page for each case with the same capture board (FR-119) as the geometry test and compares every frozen value of every element that exists in the design's case. Hover, active and pressed states are not captured (NFR-14 never captures them; their rules are checked in the stylesheet below).

Coverage is sampled, never continuum: the sampling dimensions are the scheme (2), the state (5) and the viewport (one, 1024×768; paint does not depend on the width), 10 cases; the cell kinds and elements that the design's fixture boards do not show (a given cell in a violation) are not sampled. The stricter instrument that runs before a block-done claim is the per-block pixel crop of `scripts/visual-block.mjs` over all 170 shots, and then the full computed-style diff of every element (README escalation path of `docs/qa/visual-diff/README.md`). This requirement does not claim a pixel floor per shot or per block; those are claimed after the later blocks.

The three deviations from the design are recorded in the fixture as expected product values, each with its A-57 reason, and the test compares the page with the expected value there (the design's value is kept next to it): (1) the light cell border and the light given border are `#847b6d`, the design's `#8c8374` (A-57: 2.71:1 against the board plate, below 3:1); (2) the light violating digit is `#8f1d17`, the design's `#b3261e` (A-57: 4.33:1 on the darkest band of the stripe, below 4.5:1); (3) a given cell in a violation has weight 800 and the design's rule gives 700 (A-57: the given cue is weight). The design build shows no given cell in a violation (its fixture's violating cells are all player cells), so the third deviation records the value of the design's rule and is checked in the stylesheet by «Borders, cues and focus rings have enough contrast».

The stylesheet SHALL key the solved paint on the existing hook and nowhere else: `.board-host[data-solved='true']` (set by the page while the board is solved, see «Main column layout geometry follows the design reference»), not on the design's `.board[data-solved]` and not with a second has-selector (FR-65 allows `:has(` in the idle-line rule only). A solved board has the plate `--color-success-bg`, the border `--color-success` and a 1px ring of `--color-success` as a box shadow; its cells have no box shadow and a default cursor; after a win «Нова головоломка» is filled (`--color-primary` fill and border, `--color-primary-text` text, weight 700) and «Підказка» is muted (`--color-control-border` border, `--color-control-bg` fill, `--color-text-muted` text, weight 500). Where the design gives a control no fill or border, the page states it: the rule `.buttons button` declares `border-color: transparent` and `background-color: transparent`, and «Скинути» takes both, because the base `button` rule would otherwise show the control border and the control fill. The hover ring of an unsolved board's non-given cell is `inset 0 0 0 2px var(--color-hover-ring)` (no `color-mix`). The win glow is the keyframes `glow` that animate the solved board's `box-shadow` from a ring of `--color-success` and a ring of `--color-success-glow` to a transparent ring, applied only under `prefers-reduced-motion: no-preference`. A non-colour variable such as `--hover-filter` is never declared in `:root`; if the stylesheet declares one, it is declared on `#app`, with the dark value in `:root[data-theme="dark"] #app`. The light page colour `#f7f3ea` appears as `THEME_COLOR_LIGHT` in `src/ui/preferences.ts` and as the `theme-color` content and the head step's light value in `index.html` (FR-106, FR-116 are unchanged in text; their tests compare the copies with `--color-page`).

Traces: NFR-14, FR-65, FR-64, A-57

#### Scenario: The frozen fixture covers exactly the sampled paint cases

- **GIVEN** `quality/design-paint.json`, frozen by `scripts/freeze-design-paint.mjs` from the design build
- **WHEN** the e2e test reads it
- **THEN** its cases are exactly the 10 of the schemes light and dark and the states default, hint, win, four and eight at 1024×768, its `coverage` is `sampled`, and its provenance names the design commit, the build SHA-1 and the browser
- **AND** it records the three deviation groups, each with its elements, properties, scheme and cases, the design value, the expected product value and the A-57 reason

#### Scenario: The default page has the design's paint in light and dark

- **GIVEN** the default state with the design's 6×6 fixture board (FR-119) at 1024×768, in the light scheme and then in the dark scheme
- **WHEN** the page has loaded
- **THEN** the body, the title, the logo, the settings button, «Правила», the summary button and its cue, the board plate, an ordinary cell, an entry cell, a given cell, a violating cell, the three action buttons and the idle line each have the frozen `color`, `background-color`, border colours, widths and styles, `box-shadow`, `font-weight`, `font-style`, `text-decoration-line` and background-image presence of the case, except the recorded deviations
- **AND** the violating cell has an underline (`text-decoration-line` `underline`) and a gradient `background-image`, and the other cell kinds have no `background-image`

#### Scenario: The hinted cell and the hint line have the design's paint

- **GIVEN** the hint board without its hinted cell (FR-119), «Підказка» pressed once, in the light and in the dark scheme
- **WHEN** the hint line shows
- **THEN** the hinted cell (dashed 2px `--color-primary` border, `--color-primary-soft` fill, `--color-text` digit, italic, weight 700) and the hint line (`--color-primary-soft` fill, 4px `--color-primary` left border) match the frozen values of the case

#### Scenario: The solved board and the win line have the design's paint

- **GIVEN** the design's solved 6×6 fixture, which shows the win state at mount (FR-119), in the light and in the dark scheme
- **WHEN** the page has loaded
- **THEN** the board plate, its border and its ring, a cell, the win line (`--color-success` border, `--color-success-bg` fill, `--color-win-text` text, weight 700), «Нова головоломка» (filled) and «Підказка» (muted) match the frozen values of the `win` case

#### Scenario: The 4×4 and 8×8 boards have the design's paint

- **GIVEN** the design's 4×4 fixture and its 8×8 fixture, in the light and in the dark scheme
- **WHEN** the page has loaded
- **THEN** the board plate and the cell kinds present match the frozen values of the `four` and `eight` cases, except the recorded deviations

#### Scenario: The focus rings have the design's paint

- **GIVEN** the default state with a keyboard key pressed and a script focus on the first non-given cell, and then on «Підказка», in the light and in the dark scheme
- **WHEN** the test reads the computed outline
- **THEN** each outline is solid, 3px wide, 2px offset, in the colour of `--color-focus` of the scheme, equal to the frozen value of the design's ring

#### Scenario: The deviations are the page's expected values

- **GIVEN** the default state in the light scheme
- **WHEN** the test reads the border colour of an ordinary cell and of a given cell, and the colour of the violating digit
- **THEN** the borders are `rgb(132, 123, 109)` (`#847b6d`) and the digit is `rgb(143, 29, 23)` (`#8f1d17`), not the design's `rgb(140, 131, 116)` and `rgb(179, 38, 30)`
- **AND** in the dark scheme the borders are `rgb(138, 127, 113)` and the digit is `rgb(255, 138, 125)`, equal to the design's

#### Scenario: The solved paint and the win swap are keyed on the host hook

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the rules whose selector contains `.board-host[data-solved='true']` and the rules whose selector contains `:has(`
- **THEN** the solved board rule declares `border-color` `var(--color-success)`, `background-color` `var(--color-success-bg)` and a `box-shadow` of a 1px ring of `var(--color-success)`; the solved cell rule declares `box-shadow: none` and `cursor: default`; the rules for `[data-action='new']` and `[data-action='hint']` after a win declare the colours above
- **AND** the raw text of the file contains `:has(` exactly once (the idle-line rule), and no selector contains `.board[data-solved`

#### Scenario: The action row states its transparent fills and borders

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test reads the rules `.buttons button` and `.buttons button[data-action='reset']`
- **THEN** `.buttons button` declares `border-color` `transparent` and `background-color` `transparent`, and the «Скинути» rule declares `color` `var(--color-text-muted)`, `border-color` `transparent`, `background-color` `transparent` and `text-decoration-line` `underline`
- **AND** the e2e computed `background-color` of «Скинути» is `rgba(0, 0, 0, 0)` and its border colours are `rgba(0, 0, 0, 0)` in both schemes

#### Scenario: The hover ring comes from the hover token

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test finds the rule whose selector ends with `.cell:not(.cell-given):hover` and applies only to an unsolved board (the host without `data-solved='true'`)
- **THEN** it declares a `box-shadow` of `inset 0 0 0 2px var(--color-hover-ring)`, no declaration of the file contains `color-mix(`, and the fixture `quality/design-paint.json` has no hover case (hover is not captured)

#### Scenario: The win glow comes from the glow token

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the `@keyframes glow` rule and the rule that applies it
- **THEN** the first keyframe's `box-shadow` contains `var(--color-success)` and `var(--color-success-glow)`, the last keyframe's contains `transparent`, no colour literal and no `color-mix(` appears in either, and the rule that sets `animation: glow` selects `.board-host[data-solved='true'] .board` inside `@media (prefers-reduced-motion: no-preference)`

#### Scenario: Non-colour variables are not declared in the root

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` and `:root[data-theme="dark"]` rules, and of any rule that declares `--hover-filter`
- **THEN** `:root` declares only `--color-*` tokens and `color-scheme`, and a `--hover-filter` declaration, if the file has one, is in a rule on `#app` (the dark value in `:root[data-theme="dark"] #app`)

#### Scenario: The light page colour has three copies that agree

- **GIVEN** the text of `index.html` and of `src/ui/preferences.ts`, and the light `--color-page` of `src/ui/style.css`
- **WHEN** the test reads the `theme-color` meta content, the head step's light value and `THEME_COLOR_LIGHT`
- **THEN** all three equal `#f7f3ea`, which is the light `--color-page`, and the dark copies stay `#1a1714`

#### Scenario: The sampled coverage is declared

- **GIVEN** `e2e/nfr-14-palette.spec.ts` and `quality/design-paint.json`
- **WHEN** a reader looks for the sampling dimensions
- **THEN** the fixture names the schemes, the states and the viewport as its sampling dimensions, declares `coverage` `sampled`, and neither the test nor the fixture claims all widths, all states or a pixel floor
