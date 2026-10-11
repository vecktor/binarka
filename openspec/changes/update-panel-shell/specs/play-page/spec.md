## MODIFIED Requirements

### Requirement: Borders, cues and focus rings have enough contrast

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65), with one narrow exception: the system colour keyword `ButtonText` in the forced-colours block of the cause mark (see the colour scan below and «A violation shows a cue besides colour»; the user adopted that rule on 2026-10-11). The tokens are the 31 that the page binds in the G2 palette: the 25 of the main column (A-57, block 2), the 2 backdrop tokens (G2 block 3, update-page-backdrop) and the 4 shell tokens (G2 shell slice, update-panel-shell) that the appendix marks "later" and that the last two changes bind, with the light value in the top-level `:root` and the dark value in `:root[data-theme="dark"]`:

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
| `--color-surface-raised` | `#fffdf8` | `#2c2620` | fill of the rules panel, the setup sheet, the settings panel and the confirmation dialog; the setup sheet's footer strip; the fill of «Закрити» in the sheet and in the settings panel |
| `--color-overlay-border` | `#e2dbcc` | `#8a7f71` | border colour of the rules panel, the setup sheet and the settings panel |
| `--color-shadow-panel` | `#00000040` | `#00000040` | drop shadow of the three panels from 48rem and of the confirmation dialog at every width (translucent) |
| `--color-shadow-sheet` | `#0000002e` | `#0000002e` | drop shadow of the three panels below 48rem (translucent) |

These are the "block 2" rows of the appendix to A-57 in `docs/requirements.md`, the two backdrop rows that the appendix marks "later" and that G2 block 3 binds, and the four shell rows that the appendix marks "later" and that this change (update-panel-shell) binds, value for value; the appendix is the source, this table is what the stylesheet declares (the role column of the two backdrop rows says which surfaces bind each, and the role column of the four shell rows says which surfaces and parts bind each, which the appendix's short roles "sheet, panel and dialog fill", "panel border", "panel drop shadow" and "phone sheet shadow" abbreviate; see «The backdrops take the design's translucent tokens» and «The panels take the shared surface paint»). The "later" rows of the appendix that remain are `--color-violation-ink` (the block of the confirmation dialog) and `--color-option-border` (the block of the setup sheet); they are NOT declared by this requirement: the block that binds one adds it by its own delta, so the stylesheet never holds an unused token. The row `--color-shadow-sunken` was withdrawn on 2026-10-11 (the appendix to A-57): the design dropped the inset it served. A value is a literal `#rrggbb`. A value may be `#rrggbbaa` only for a token that the list marks translucent, and the list marks five, `--color-success-glow`, `--color-backdrop-soft`, `--color-backdrop-strong`, `--color-shadow-panel` and `--color-shadow-sheet`; a translucent token is never the foreground or the background of a contrast pair, a backdrop is checked composited over the page instead (FR-65, see «Effective theme on the document»), and a shadow is decoration that holds no text and marks no component, so it is checked by no pair (its binding is pinned by «The panels take the shared surface paint»). The top-level `:root` also declares `color-scheme: light` and `:root[data-theme="dark"]` declares `color-scheme: dark`, and nothing else: `:root` holds only the colour tokens and `color-scheme` (the non-colour variables live on `#app`, as the layout variables do).

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
- the focus ring `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-violation-bg`, `--color-line`, `--color-primary-soft`, `--color-success-bg`, `--color-cell-border` and `--color-surface-raised` (the fill of the panels and the dialog, where the ring of «Зрозуміло», «Закрити» and the options is drawn);
- the control border `--color-control-border` against `--color-page`.

The given cell is told from an ordinary one by weight, not by a border: `.cell-given` declares `font-weight` 800 against the ordinary cell's 500, a given cell in a violation keeps 800 (the rule `.cell-given.cell-violation` declares `font-weight` 800, over the 700 of `.cell-violation`), and its border is 1px in `--color-given-border`, which equals `--color-cell-border` (deliberate, PA-Q1 A of the palette amendment: the design's given cue is the weight; the fill `--color-given-bg`, the darker digit and the missing bottom inset line are decoration). The text SHALL have at least 4.5:1:

- `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-control-bg`, `--color-primary-soft` and `--color-surface-raised`;
- `--color-given-text` against `--color-given-bg`;
- `--color-entry-text` against `--color-cell-bg`;
- `--color-text-muted` against `--color-page`, `--color-cell-bg`, `--color-control-bg` and `--color-surface-raised`;
- `--color-violation-text` against `--color-violation-bg` and against `--color-violation-stripe` (the darkest band of the violating cell);
- `--color-primary-text` against `--color-primary`;
- `--color-win-text` against `--color-success-bg`.

Traces: FR-65, FR-64, FR-120, A-57, A-58, NFR-9, FR-104

#### Scenario: Tokens exist and are literal

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` rule
- **THEN** each of the 31 token names of the list above is declared once, with the light value of the list, `#rrggbb` for 26 of them and `#rrggbbaa` for the five translucent tokens only (`--color-success-glow`, `--color-backdrop-soft`, `--color-backdrop-strong`, `--color-shadow-panel` and `--color-shadow-sheet`)
- **AND** the rule `:root[data-theme="dark"]` declares each of the same 31 names once with the dark value of the list, so each token has exactly two value sets and the dark block redefines every token of the list and adds none
- **AND** the top-level `:root` declares no property other than the 31 tokens and `color-scheme`, and a translucent token appears in no contrast pair

#### Scenario: Every declared token is bound by a rule

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test counts, for each of the 31 tokens, the declarations outside `:root` whose value contains `var(<token>)`
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
- **AND** the pair against the stripe is in `CONTRAST_PAIRS` (group `cause-cue`) and the pair against the fill is the existing violation cue pair, so the list holds 38 pairs (the 35 of the cause-cue change and the 3 pairs on `--color-surface-raised`)
- **AND** the stripe is not a cue (its ratio against the fill stays below 3), and the mark has no token of its own: the token list is the 31 of the table

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
- **WHEN** the test computes the ratio of `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-violation-bg`, `--color-line`, `--color-primary-soft`, `--color-success-bg`, `--color-cell-border` and `--color-surface-raised`
- **THEN** each ratio is at least 3 (against the plate 11.72 in light and 10.65 in dark; against the cell border 3.87 and 3.36; against the raised surface 15.88 and 12.79)

#### Scenario: The control border has 3:1 and the text has 4.5:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-control-border` against `--color-page`, and the ratios of the 4.5:1 list above: `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-control-bg`, `--color-primary-soft` and `--color-surface-raised`; `--color-given-text` against `--color-given-bg`; `--color-entry-text` against `--color-cell-bg`; `--color-text-muted` against `--color-page`, `--color-cell-bg`, `--color-control-bg` and `--color-surface-raised`; `--color-violation-text` against `--color-violation-bg` and `--color-violation-stripe`; `--color-primary-text` against `--color-primary`; and `--color-win-text` against `--color-success-bg`
- **THEN** the first ratio is at least 3 (3.38 light, 4.55 dark) and every other ratio is at least 4.5

#### Scenario: The raised surface carries the text and the focus ring

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and `CONTRAST_PAIRS` of the test helpers
- **WHEN** the test computes the ratio of `--color-text`, of `--color-text-muted` and of `--color-focus` against `--color-surface-raised` (the fill of the rules panel, the setup sheet, the settings panel and the confirmation dialog, which no earlier pair covers: in dark `#2c2620` equals no other background)
- **THEN** the ratios are 15.88 and 12.79 for the text, 7.17 and 6.96 for the muted text and 15.88 and 12.79 for the focus ring (light, dark), each at least 4.5 for the two text pairs and at least 3 for the focus pair
- **AND** the three pairs are in `CONTRAST_PAIRS` (the first two in group `text`, the third in group `focus-ring`), the list holds 38 pairs (4 cell border, 4 violation cue, 1 cause cue, 3 hinted cue, 9 focus ring, 1 control border and 16 text), and no pair names `--color-overlay-border`, `--color-shadow-panel` or `--color-shadow-sheet`

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

- **GIVEN** the token reader of the test helpers and a stylesheet text with the translucent tokens `--color-success-glow: #2f6b3a73`, `--color-backdrop-strong: #2d190a80` and `--color-shadow-sheet: #0000002e` (it may hold more of the five) and, in another copy, `--color-page: #f7f3ea80`
- **WHEN** the reader and the contrast function read each copy
- **THEN** the first copy is read as translucent tokens that no contrast pair uses (each is in the helper's set of the five translucent names), and the second is rejected (the format `#rrggbbaa` is allowed only for the token the list marks translucent), as is an `rgb()` value in either

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
- **THEN** both sets equal the 31 tokens and values of the table of «Borders, cues and focus rings have enough contrast» (the 25 block-2 tokens, the 2 backdrop tokens and the 4 shell tokens, marked "later" in the appendix to A-57, that the last two changes bind), and no other `--color-*` token is declared

### Requirement: The main column takes the design palette

The paint of the page's main column SHALL equal that of the design reference (NFR-14, FR-65, A-57) in the sampled cases of `quality/design-paint.json`, except the three deviations that A-57 names. The reference is the design build (`design/v0`, served from `design/v0/out`), which stands in for the frozen reference `design/v0-screenshots/review-set-14/` as in «Main column layout geometry follows the design reference». The main column is the page, the header with the logo and its buttons (the settings button `[data-action="settings"]` and «Правила» `[data-action="rules"]`), the summary button `[data-action="setup"]` with its cue, the board plate `[data-board]` and its cells in every state (ordinary and entry, given, hinted, violation, given in a violation, solved), the focus rings, the three action buttons (`[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, with the swap after a win) and the message area (the idle, hint and win lines). The setup sheet, the rules and settings panels and the confirmation dialog are outside this requirement. The shell binds their fill, border and shadow (see «The panels take the shared surface paint»), their backdrops are covered by «The backdrops take the design's translucent tokens», and the rest of their paint keeps its current token bindings until their own blocks; «Почати» keeps its current tokens until the setup-sheet block.

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

### Requirement: The backdrops take the design's translucent tokens

The backdrop behind each of the page's surfaces SHALL be the design's translucent colour, held in a colour token and painted as a background colour, never as an `opacity` (NFR-14, FR-65, A-57; G2 block 3, `design/v0/app/binarka.css` lines 791-795, 1083 and 1311). The two tokens are `--color-backdrop-soft` and `--color-backdrop-strong` of the table of «Borders, cues and focus rings have enough contrast» (light `#46280f38` and `#2d190a80`, dark `#08050273` and `#08050299`). Each surface takes its backdrop as follows:

| Surface | Rule | Token |
|---|---|---|
| the rules panel (`.rules`, a popover) below 64rem | `.rules::backdrop` | `--color-backdrop-soft` |
| the rules panel from 64rem (`@media (min-width: 64rem)`) | `.rules:popover-open::backdrop` | `--color-backdrop-strong` |
| the setup sheet (`.setup-sheet`, a popover; `.setup` in the design) | `.setup-sheet::backdrop` | `--color-backdrop-soft` |
| the settings panel (`.settings`, a popover) at every width | `.settings::backdrop` | `--color-backdrop-soft` |
| the confirmation dialog (`.confirm`, a `<dialog>`) at every width | `.confirm::backdrop` | `--color-backdrop-strong` |

From 64rem the rules panel ends over the page (the board or the button row), so the design gives it the dialog's stronger backdrop; the settings panel, a small dropdown, keeps the soft one at every width, on purpose (the design's comment at line 1080). The rules are written with the longhand `background-color`, one `var(--color-backdrop-…)` each (the design writes the `background` shorthand; the longhand has the same cascade and lets the colour scan's longhand clause apply). No rule whose selector contains `::backdrop` declares `opacity`, a colour literal or `color-mix(`, and no `::backdrop` rule takes a colour from any token other than the two backdrop tokens. The overrides that painted a dark backdrop with `--color-page` at 0.6 and 0.7 (`:root[data-theme='dark'] .rules::backdrop`, `.setup-sheet::backdrop`, `.settings::backdrop` and `.confirm::backdrop`) do not exist: the dark values are the dark token set's. Where the strong rule and the soft rule both match (the rules panel from 64rem), the strong one wins by specificity (`:popover-open`), not by source order.

A backdrop is checked composited over the page (FR-65; see «Effective theme on the document»). In each token set the strong composite is darker than the soft composite (relative luminance 0.2457 against 0.5734 in light, 0.0038 against 0.0050 in dark), so "strong" dims more.

Intentionally not delivered in this block, so that testers do not report them as bugs: (1) the design's fade of the backdrops (`transition` of `background-color`, `overlay` and `display`, and the `@starting-style` rules, `binarka.css` lines 1585-1610) is NOT ported: it is wrapped in `@media (prefers-reduced-motion: no-preference)` in the design, the page animates neither the sheet, the panels nor the dialog yet, and the gate's capture forces reduced motion, so no shot shows it; no `::backdrop` rule of the stylesheet declares `transition` or sits in an `@starting-style` rule; (2) the "later" tokens `--color-option-border` (the setup-sheet block) and `--color-violation-ink` (the dialog block) are not declared by this requirement or by the shell, and the paint they serve keeps its current bindings until those blocks; `--color-shadow-sunken` was withdrawn on 2026-10-11 (the appendix to A-57); the fill, border and shadow of the panels, the sheet and the dialog are bound by «The panels take the shared surface paint», not by this requirement; (3) the page does not paint a backdrop for the closed surfaces: a `::backdrop` exists only while its surface is open.

The mechanism is a stylesheet test, test first, and a browser test: `e2e/nfr-14-backdrop.spec.ts` (`@trace NFR-14`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) opens each surface in the built page and reads one pixel of a screenshot. The sampling is declared: the surfaces (rules, setup sheet, settings, confirmation), the schemes (light, dark) and the viewport widths 375×812 (below 64rem) and 1024×768 (from 64rem) for the rules panel and 1024×768 for the other three, 10 cases; coverage is `sampled`, never continuum. The browser setup is that of `playwright.config.ts`, as in `e2e/nfr-14-palette.spec.ts` (Playwright "Desktop Chrome", reduced motion, the scheme on the browser context, no stored preference); the gate's own capture (Chromium with `--force-device-scale-factor`, viewport off) is a different instrument and is not used here. The pixel read is one that no surface and no page content covers; the test reads the same pixel with the surface closed first and expects the page colour there, so a pixel under a surface or a card fails the case instead of passing by luck. The stricter instrument that runs before a block-done claim is the per-block pixel crop of `scripts/visual-block.mjs` and the per-shot gate `npm run check:visual`, over the rules, rules-techniques, confirm, setup and settings shots; this requirement claims no pixel floor for any shot.

Traces: NFR-14, FR-65, A-57

#### Scenario: Each surface takes its backdrop token

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the `background-color` declared by `.rules::backdrop`, by `.rules:popover-open::backdrop` inside `@media (min-width: 64rem)`, by `.setup-sheet::backdrop`, by `.settings::backdrop` and by `.confirm::backdrop`
- **THEN** the values are `var(--color-backdrop-soft)`, `var(--color-backdrop-strong)`, `var(--color-backdrop-soft)`, `var(--color-backdrop-soft)` and `var(--color-backdrop-strong)`, in that order
- **AND** each of the four plain rules is declared once outside any at-rule, the strong rules for the rules panel exist only inside an `@media (min-width: 64rem)` block, and no `.settings` rule takes the strong token

#### Scenario: No backdrop rule sets opacity

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test collects the declarations of every rule whose selector contains `::backdrop`
- **THEN** none of them is `opacity`, none has a value with a colour literal or `color-mix(`, and every `background-color` among them is a single `var(--color-backdrop-soft)` or `var(--color-backdrop-strong)`
- **AND** the only selectors that contain `::backdrop` are the five of the table above, so no other surface paints a backdrop of its own

#### Scenario: The strong backdrop dims more than the soft one

- **GIVEN** the two backdrop tokens and `--color-page` of each token set (light, then dark)
- **WHEN** the test composites each token over the page (per channel in sRGB, `round(alpha × token + (1 − alpha) × page)`) and computes the relative luminance of the results
- **THEN** in light the strong composite `rgb(146, 134, 122)` (0.2457) is darker than the soft one `rgb(208, 198, 186)` (0.5734), and in dark `rgb(15, 12, 9)` (0.0038) is darker than `rgb(18, 15, 12)` (0.0050)
- **AND** neither backdrop token is the foreground or the background of any pair of «Borders, cues and focus rings have enough contrast»

#### Scenario: The backdrop fade is not ported

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test collects the rules whose selector contains `::backdrop`, and the `@starting-style` rules
- **THEN** no `::backdrop` rule declares `transition`, `transition-property` or `animation`, no `::backdrop` rule is inside `@media (prefers-reduced-motion: no-preference)`, and no `@starting-style` rule names a `::backdrop`
- **AND** a later block that ports the fade changes this scenario by its own delta

#### Scenario: An open surface dims the page to the composite

- **GIVEN** the built page in Chromium at 375×812 and 1024×768 in the light and in the dark scheme with reduced motion (e2e, sampled: the rules panel at both widths, the setup sheet, the settings panel and the confirmation at 1024×768; 10 cases), with the design's fixture board (FR-119) and a pixel that no surface and no page content covers
- **WHEN** the test reads that pixel of a screenshot with the surface closed, opens the surface (a press on «Правила», on the summary button or on the settings button, or a press on «Нова головоломка» on the fixture board, which asks first, FR-67; all as the capture does), and reads the pixel again
- **THEN** the closed pixel is the page colour of the scheme, and the open pixel equals the composite of the surface's token over it within 1 per channel: soft over light `rgb(208, 198, 186)`, strong over light `rgb(146, 134, 122)`, soft over dark `rgb(18, 15, 12)`, strong over dark `rgb(15, 12, 9)`
- **AND** the rules panel at 375×812 shows the soft composite and at 1024×768 the strong composite, the setup sheet and the settings panel show the soft composite, and the confirmation shows the strong composite, in both schemes

#### Scenario: The sampled coverage is declared

- **GIVEN** `e2e/nfr-14-backdrop.spec.ts`
- **WHEN** a reader looks for the sampling dimensions
- **THEN** the test names the surfaces, the schemes and the widths as its sampling dimensions, declares coverage `sampled`, and claims neither all widths, all surfaces nor a pixel floor



## ADDED Requirements

### Requirement: The panels take the shared surface paint

The fill, the border colour and the drop shadow of the rules panel, the setup sheet, the settings panel and the confirmation dialog SHALL come from the four shell tokens of the table of «Borders, cues and focus rings have enough contrast» (NFR-14, FR-65, A-57; G2 shell slice `update-panel-shell`; `design/v0/app/binarka.css` lines 809-829, 949-962, 1103-1117 and 1337-1349). This change (`update-panel-shell`) is paint only, apart from the board-size hook of «The page root carries the board size»: it changes no width, height, place, radius, padding or line height of any of the four surfaces. Their size and place belong to their own blocks (the rules panel, A-59; the setup sheet, A-60; the settings panel and the dialog later), which change those declarations by their own deltas; this sentence does not bind them. The bindings are these, each written with the longhand the colour scan reads (`background-color`, `border-color`) or with a `var(--color-...)` colour inside the shorthand the scan allows (`background`, `box-shadow`):

| Rule (selector) | Where | Declaration |
|---|---|---|
| `.rules`, `.setup-sheet`, `.settings` (the design's `.setup` is the page's `.setup-sheet`) | a top-level rule outside any at-rule | `background-color: var(--color-surface-raised)`, `border-color: var(--color-overlay-border)`, `box-shadow: 0 -0.5rem 2rem var(--color-shadow-sheet)` |
| the same three selectors | inside `@media (min-width: 48rem)` | `box-shadow: 0 1rem 2.5rem var(--color-shadow-panel)`; the `.rules` rule of this block, which states its border again, declares `border-color: var(--color-overlay-border)` |
| `.confirm` | a top-level rule outside any at-rule, at every width | `background-color: var(--color-surface-raised)`, `border-color: var(--color-control-border)` (unchanged), `box-shadow: 0 1rem 2.5rem var(--color-shadow-panel)` |
| `.setup-sheet:popover-open::before` (the footer strip) | a top-level rule outside any at-rule | `background: linear-gradient(to bottom, transparent, var(--color-surface-raised) 16px)` and `box-shadow: 0 16px 0 16px var(--color-surface-raised)` |
| `.setup-close` and `.settings-close` («Закрити» in the sheet and in the settings panel) | the existing rule of each (`.setup-close` and `.settings-close` both exist), outside any at-rule | `background-color: var(--color-surface-raised)` (added to the existing rule by the shell: today neither rule declares a fill, and both inherit the base `button` rule's `--color-control-bg`) |

Three decisions are part of the requirement. (1) **The dialog's border stays `--color-control-border`.** The design's `.confirm` border is `--cell-border` (`binarka.css` line 1343), whose values (light `#8c8374`, dark `#8a7f71`) are the values of the page's `--color-control-border` in both sets, so `--color-overlay-border` is bound by the three panels only. (2) **The shadow's geometry stays in the rule and its colour is the token** (FR-65): the sheet shadow below 48rem, the panel shadow from 48rem, and the panel shadow on the dialog at every width. (3) **The strip and «Закрити» take the same fill as their surface**: in dark the strip and the two buttons would otherwise show `#24201b` bands on the `#2c2620` panel. After the port no rule that is exactly `.rules`, `.setup-sheet`, `.settings` or `.confirm` uses `--color-control-bg` for its `background-color`, no such rule among the three panels uses `--color-given-bg` for its `border-color` (at any width), and the strip uses `--color-control-bg` nowhere. The other rules that paint with `--color-control-bg` inside a surface are controls, not the surface's own fill, and are not touched: the base `button` rule, `.size-control` and its options, `.level-control` options, `.setup-start`, `.theme-control` and `.language-control` with their options (in dark they sit at `#24201b` on the panel's `#2c2620`, as the design's own `--surface` controls do on `--surface-raised`, `binarka.css` line 386).

A pair covers the text and the focus ring on the raised fill: `--color-text`, `--color-text-muted` and `--color-focus` on `--color-surface-raised` (see «Borders, cues and focus rings have enough contrast»). The three shell tokens that paint no text (`--color-overlay-border`, `--color-shadow-panel`, `--color-shadow-sheet`) are in no pair. The overlay border is signed as decoration: the rules-panel amendment records "the border is not a pair (1.24 light against the page; decoration, the backdrop already separates the panel)" (`docs/handoff/rules-panel-amendment-draft-2026-10-11.md`, section 4, ratified at autonomy-log row 172); the reasoning that A-60 gives for the available level card's border supports it (a text-labelled surface is identified by its text and fill, not by its edge). The two shadows are translucent, and a translucent token is in no pair.

Intentionally not delivered in this change, so that testers do not report them as bugs: (1) the design's mask shadow on «Закрити» (`0 0 0 1rem` and `0 1rem 0 1rem` in the raised fill, `binarka.css` lines 543-545): the page's sheet masks scrolled text with the footer strip, and its settings panel's «Закрити» is not sticky; (2) the filled «Зрозуміло» and the sticky rules footer (the rules-panel block), the filled «Почати», the level cards, the size option's paint and the ring (the setup-sheet block), the list separators and the example cells of the rules panel (the rules-panel block), the other paint of the settings panel and of the confirmation dialog (the second wave), and the dialog's `--color-violation-ink` (the dialog block); (3) no size, place, radius, padding or line-height change of any surface, no motion; (4) the colour of a shadow in a browser other than Chromium (only Chromium is tested, NFR-7).

The mechanism is a stylesheet test, test first, and a browser test. `tests/play-page-panel-shell-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-65`) reads the parsed `src/ui/style.css`. `e2e/nfr-14-panel-shell.spec.ts` (`@trace NFR-14`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares the computed fill, border colour and shadow of the four surfaces with the design build, read live: the test serves `design/v0/out` itself with a static file server on a free port chosen by the operating system (never 4173, 4174, 4176 or 4177, which the page preview and the capture tools bind), with the path guard of `scripts/freeze-design-geometry.mjs` (nothing outside the build folder is served), and opens the design's routes `/rules/`, `/setup/`, `/settings/` and `/confirm/`, which show each surface open at load. The other `nfr-14-*` e2e tests read frozen files (`quality/design-geometry.json`, `quality/design-paint.json`) and do not serve the design build; this one does, because the shell adds no freeze case. If `design/v0/out/index.html` is missing, the test FAILS with the build instruction of `design/README.md` (`pnpm build` in `design/v0`); it is never skipped. The page side is the built page of `playwright.config.ts`, with the design's fixture board (FR-119) and the surface opened by the press the capture uses (`e2e/nfr-14-backdrop.spec.ts`). Both sides use the browser setup of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, the scheme on the browser context, no stored preference). The sampling is declared: the surfaces (rules, setup sheet, settings, confirmation), the schemes (light, dark) and the viewports 375×812 and 1024×768, 16 cases; coverage is `sampled`, never continuum. Nothing between the two viewports, no hover, no focus state, no other board is looked at. The stricter instruments that run before a block-done claim are the per-block pixel crop of `scripts/visual-block.mjs` and the per-shot gate `npm run check:visual` over the rules, rules-techniques, confirm, setup and settings shots, and then the full computed-style diff of every element of the surfaces (the escalation path of `docs/qa/visual-diff/README.md`). This requirement claims no pixel floor for any shot.

Traces: NFR-14, FR-65, A-57

#### Scenario: The three panels take the raised fill, the overlay border and the sheet shadow below 48rem

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test reads the rule of each of `.rules`, `.setup-sheet` and `.settings` that is outside any at-rule
- **THEN** each declares `background-color` `var(--color-surface-raised)`, `border-color` `var(--color-overlay-border)` and `box-shadow` `0 -0.5rem 2rem var(--color-shadow-sheet)` (whitespace aside), and each of the three declarations appears once in that rule
- **AND** (a change-time check of this change, task 3.6, recorded in its evidence; not a lasting test, because the panels' own blocks change these declarations later) `git diff -U0` of `src/ui/style.css` against `main` before this change shows no added, removed or changed line that declares `border-width`, `border-radius`, `max-height`, `padding`, `width`, `inset` or `margin` in these three rules (the filter of task 3.6; today's rules are `.rules` at lines 631-648, `.setup-sheet` at 780-801 and `.settings` at 1071-1088 of the file at `main` `64c2d7d`)

#### Scenario: From 48rem the three panels take the panel shadow and keep the overlay border

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule of each of `.rules`, `.setup-sheet` and `.settings` inside `@media (min-width: 48rem)`
- **THEN** each declares `box-shadow` `0 1rem 2.5rem var(--color-shadow-panel)` once
- **AND** no rule that is exactly `.rules`, `.setup-sheet` or `.settings`, at any width, declares a `border-color` other than `var(--color-overlay-border)`, in particular the `.rules` rule of the 48rem block no longer declares `var(--color-given-bg)`
- **AND** no rule that is exactly `.rules`, `.setup-sheet` or `.settings` declares a `background-color` other than `var(--color-surface-raised)`

#### Scenario: The dialog takes the raised fill and the panel shadow and keeps its control border

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules that are exactly `.confirm`
- **THEN** the rule outside any at-rule declares `background-color` `var(--color-surface-raised)`, `border-color` `var(--color-control-border)` and `box-shadow` `0 1rem 2.5rem var(--color-shadow-panel)`
- **AND** no rule that is exactly `.confirm` sits inside an at-rule and declares a `box-shadow`, `border-color` or `background-color`, so the dialog has one fill, one border and one shadow at every width
- **AND** no rule declares `var(--color-overlay-border)` for `.confirm`

#### Scenario: The footer strip and the two close buttons take the raised fill

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule `.setup-sheet:popover-open::before` and the rules that are exactly `.setup-close` and `.settings-close`
- **THEN** the strip's `background` is `linear-gradient(to bottom, transparent, var(--color-surface-raised) 16px)` and its `box-shadow` is `0 16px 0 16px var(--color-surface-raised)`, and neither value contains `--color-control-bg`
- **AND** the rule `.setup-close` and the rule `.settings-close` each declare `background-color` `var(--color-surface-raised)`, so the buttons no longer fall back to the base `button` rule's fill

#### Scenario: No shell binding adds a colour literal

- **GIVEN** the parsed `src/ui/style.css` and the colour scan of «Borders, cues and focus rings have enough contrast»
- **WHEN** the test applies the scan to every declaration outside `:root`
- **THEN** it finds no colour literal, no named colour and no `color-mix(`, every `box-shadow` of the rules of this requirement has its colour as a `var(--color-...)` token (a shadow's geometry stays in the rule), and each of the four shell tokens is referenced by at least one declaration outside `:root`
- **AND** the stylesheet has no `!important`, and the raw text contains `:has(` exactly once (the idle-line rule)

#### Scenario: The raised fill is covered by pairs

- **GIVEN** `CONTRAST_PAIRS` of the test helpers and the four surfaces that bind `--color-surface-raised`
- **WHEN** the test lists the pairs whose background is `--color-surface-raised`
- **THEN** there are exactly three: `--color-text` and `--color-text-muted` at 4.5:1 (group `text`) and `--color-focus` at 3:1 (group `focus-ring`), and each ratio holds in the light and in the dark token set
- **AND** no pair names `--color-overlay-border`, `--color-shadow-panel` or `--color-shadow-sheet`, and the list holds 38 pairs

#### Scenario: The shell moves no box

- **GIVEN** the built page, and `e2e/nfr-14-layout-geometry.spec.ts` (its 32 cases and its settings-panel and setup-sheet scenarios), `e2e/nfr-12-targets.spec.ts` and `e2e/nfr-10-fit.spec.ts` as they stand before this change
- **WHEN** they run after the port
- **THEN** they pass, and `git diff` of this change shows no edit to those files or to `quality/design-geometry.json`

#### Scenario: A surface has the design's fill, border and shadow in a real browser

- **GIVEN** the built page in Chromium and the design build served from `design/v0/out` by the test, each with the browser setup of `playwright.config.ts`, in the light and in the dark scheme, at 375×812 and at 1024×768 (e2e, sampled: the rules panel, the setup sheet, the settings panel and the confirmation dialog; 16 cases), the page with the design's fixture board (FR-119)
- **WHEN** the test opens the surface on both sides and finds it by the data contract that both builds share (`[data-section="rules"]`, `[data-section="setup"]`, `[data-section="settings"]` and `dialog[data-dialog="confirm"]`; the design's class for the setup sheet is `.setup`, the page's is `.setup-sheet`, so the class is not used) and reads, for the surface element, `getComputedStyle` `background-color`, `border-top-color` and `box-shadow`
- **THEN** the fill equals the design's (light `rgb(255, 253, 248)`, dark `rgb(44, 38, 32)`) with every channel within 1, the border colour equals the design's (for the rules panel, the setup sheet and the settings panel light `rgb(226, 219, 204)` and dark `rgb(138, 127, 113)`; for the dialog light `rgb(140, 131, 116)` and dark `rgb(138, 127, 113)`) with every channel within 1, and the shadow equals the design's layer by layer: the same colour with its alpha within 0.005 (`rgba(0, 0, 0, 0.18)` below 48rem on the three panels and `rgba(0, 0, 0, 0.25)` from 48rem and on the dialog at both widths), and the same offsets, blur and spread in px
- **AND** at the same cases the fill of `.setup-close` and `.settings-close` (read inside the setup sheet and the settings panel) equals the design's, and the setup sheet's footer strip (`::before`; `.setup:popover-open::before` in the design) has a `box-shadow` colour equal to the design's with the same geometry
- **AND** a pair of values that differ is reported with the surface, the scheme, the viewport and both strings, and the test never passes on a surface it did not open (it asserts the surface is open and not the page behind it)

#### Scenario: The design build is required and the coverage is declared

- **GIVEN** `e2e/nfr-14-panel-shell.spec.ts`
- **WHEN** `design/v0/out/index.html` is absent, and when a reader looks for the sampling dimensions
- **THEN** the test fails with a message that names `pnpm build` in `design/v0` (no skip, no pass), the design server listens on a port chosen by the operating system and is closed after the run, and the file names the surfaces, the schemes and the viewports as its sampling dimensions, declares coverage `sampled`, names `scripts/visual-block.mjs` and `npm run check:visual` as the stricter instruments, and claims neither all widths, all surfaces nor a pixel floor

### Requirement: The page root carries the board size

The page root, the element passed to `mountPlayPage` (`#app` in `index.html`), SHALL carry the attribute `data-size` whose value is the digit of the size of the board shown, `4`, `6` or `8`, equal to the `data-size` of `[data-board]` (FR-43, FR-57, FR-96, A-59, A-60; XQ-1 A of the rules-panel and setup-sheet amendment). The page sets it at mount, before it builds the board, to the mount size 6 (the size that is marked at start, FR-43 and FR-100), and sets it again in the same step that creates a board element: a new puzzle, a size change by «Почати» (FR-101, after the confirmation of FR-67 when the board has entries) and a capture board (FR-119). A press that changes only the marked choice (FR-73, FR-100), a hint, a click, a language or theme switch and a cancelled confirmation do not change it. A failed generation (FR-88, FR-101) keeps the previous board and so keeps the attribute equal to that board's. When the generation at mount fails and no board is shown (FR-88, FR-101), the attribute is `6`, the mount size, and `[data-board]` does not exist. A mount starts the attribute at 6 whatever the root held before, and then it follows the board shown (a capture board of size 4 gives 4). Two mounts on two roots are independent: each root carries its own value and a change on one root never touches the other.

The attribute exists so that the layout variables that depend on the size can be read outside the board without a has-selector (FR-65 allows `:has(` in the idle-line rule only). The stylesheet SHALL declare the five size-dependent layout variables `--n`, `--cell-max`, `--board-gap`, `--board-pad` and `--board-width` in rules whose selector begins with `#app` (the plain `#app` rule for 6×6, `#app[data-size='4']`, `#app[data-size='8']`, the small-phone 6×6 rule `#app[data-size='6']` inside `@media (max-width: 22.5rem)`, and the rules of the `@media (max-width: 30rem)` and `@media (min-width: 48rem)` blocks: in the 30rem block `#app` declares `--cell-max` (the `clamp(2.75rem, calc((100svh - 28rem) / var(--n)), 4rem)` of the 6×6 and 4×4 boards) and `#app[data-size='8']` declares `--cell-max` `4rem`, `--board-gap` `0.125rem` and `--board-pad` `0.1875rem`; in the 48rem block `#app` and `#app[data-size='8']` declare `--cell-max`), with the values the `.board` rules had, and in no rule whose selector begins with `.board`. The board and every panel are inside `#app`, so they inherit the same `--board-width`; the rules `.board[data-size='8']` and `.board` keep only the board's own geometry (`width`, `margin-inline`, `--bleed`, the grid, the padding). The attribute is on whatever root is mounted; the layout rules key on `#app`, the one root the page is built for (`src/main.ts`), as every other layout variable already does (the baseline requirement «Borders, cues and focus rings have enough contrast» keeps the non-colour variables on `#app`). The shell uses no new `:has(`. **This goes beyond paint, said plainly:** it is in the shell slice because the rules-panel block and the setup-sheet block both need the board side `min(--board-width, --column)` outside the board and run in parallel. The geometry of the page does not change by it.

Traces: FR-43, FR-57, FR-65, FR-96, A-59, A-60

#### Scenario: The root carries the size of the board at mount

- **GIVEN** a page mounted on a root with the default generator, and another with an injected generator that returns a 6×6 fixture
- **WHEN** the test reads the root's `data-size` and `[data-board]`'s `data-size`
- **THEN** both are `6` and equal

#### Scenario: The root follows every size change

- **GIVEN** a mounted page on an untouched board (no player entries) with an injected generator that returns a fixture of the size asked
- **WHEN** the player marks «Поле 4×4» and presses «Почати», then marks «Поле 8×8» and presses «Почати», then marks «Поле 6×6» and presses «Почати»
- **THEN** after each press the root's `data-size` equals `[data-board]`'s `data-size`: `4`, then `8`, then `6`
- **AND** after marking a size without «Почати» the root's `data-size` is still the size of the board shown

#### Scenario: A size change that asks first changes the root only after the confirmation

- **GIVEN** a mounted 6×6 page with one player entry and a generator that returns a fixture of the size asked
- **WHEN** the player marks «Поле 8×8», presses «Почати» (the confirmation opens), and then presses «Скасувати», and again marks, presses «Почати» and presses «Так, почати»
- **THEN** while the dialog is open and after «Скасувати» the root's `data-size` is `6`, and after «Так, почати» it is `8`, equal to `[data-board]`'s

#### Scenario: A failed generation keeps the root equal to the board shown

- **GIVEN** a mounted 6×6 page and an injected `generate` that throws for size 8
- **WHEN** the player marks «Поле 8×8» and presses «Почати» (and confirms when asked)
- **THEN** `[data-board]` keeps `data-size="6"` and the root's `data-size` is `6`

#### Scenario: With no board shown at mount the root is 6

- **GIVEN** an injected `generate` that throws for every call, so the generation at mount fails
- **WHEN** the page is mounted
- **THEN** the page has no `[data-board]` and the root's `data-size` is `6`

#### Scenario: A capture board sets the root

- **GIVEN** a valid capture board of size 4 and another of size 8 (FR-119), each set before the mount
- **WHEN** each page is mounted
- **THEN** the root's `data-size` is `4` and `8` respectively, equal to `[data-board]`'s

#### Scenario: Two mounts are independent

- **GIVEN** two pages mounted on two roots, both at the mount size 6, with an injected generator that returns a fixture of the size asked (the mount always asks for 6, so a root reaches another size only through the setup sheet or a capture board)
- **WHEN** on the second root the player opens the sheet (through the stubbed `showPopover()`, A-44), marks «Поле 4×4» and presses «Почати» (an untouched board asks for no confirmation), then on the first root the player does the same for «Поле 8×8», then the test reads both roots, and then mounts a third page on the first root again
- **THEN** the second root's `data-size` stayed `4` while the first changed to `8`, each equal to its own `[data-board]`'s, and the third mount sets the first root's `data-size` to `6` afresh without touching the second
- **AND** a size-4 capture board (FR-119) set before the mount of one root only, and removed before the mount of the other, gives that root `4` and the other `6`

#### Scenario: The size-dependent variables are declared on the root

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test collects the rules that declare `--n`, `--cell-max`, `--board-gap`, `--board-pad` or `--board-width`
- **THEN** every such rule's selector begins with `#app`, none begins with `.board`, a top-level `#app` rule outside any at-rule declares all five (`--n` `6`, `--cell-max` `4rem`, `--board-gap`, `--board-pad` and `--board-width`), `#app[data-size='4']` declares `--n` `4`, `#app[data-size='8']` declares `--n` `8`, and the rules for 8×8 and for the small-phone 6×6 board keep the gap and padding values the `.board` rules had (`0.1875rem` and `0.25rem` for 8×8 from the top level, `0.125rem` and `0.1875rem` for 8×8 up to 30rem, `0.1875rem` and `0.25rem` for 6×6 up to 22.5rem)
- **AND** the raw text contains `:has(` exactly once (the idle-line rule), and no selector reads the board's size through `:has(`

#### Scenario: A panel outside the board reads the board's variables

- **GIVEN** the built page in Chromium at 375×812 and 1024×768, with the design's 4×4, 6×6 and 8×8 fixture boards (FR-119) (e2e, sampled: 3 sizes and 2 viewports, 6 cases)
- **WHEN** the test reads `getComputedStyle(...).getPropertyValue(name)` of `--n`, `--cell-max`, `--board-gap`, `--board-pad` and `--board-width` on `[data-board]` and on the settings panel (an element outside the board, inside the root)
- **THEN** each of the five values is non-empty and equal on both elements, and `--n` equals the board's size

#### Scenario: The board keeps its geometry

- **GIVEN** the built page and the existing e2e geometry cases of «Main column layout geometry follows the design reference» (the 32 cases of `quality/design-geometry.json`, with the default, 4×4 and 8×8 boards at the six viewports) and the paint cases of «The main column takes the design palette»
- **WHEN** they run after the port
- **THEN** they pass without an edit to `e2e/nfr-14-layout-geometry.spec.ts`, `e2e/nfr-14-palette.spec.ts`, `quality/design-geometry.json` or `quality/design-paint.json`
