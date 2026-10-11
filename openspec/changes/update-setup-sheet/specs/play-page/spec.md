## MODIFIED Requirements

### Requirement: Borders, cues and focus rings have enough contrast

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65), with one narrow exception: the system colour keyword `ButtonText` in the forced-colours block of the cause mark (see the colour scan below and «A violation shows a cue besides colour»; the user adopted that rule on 2026-10-11). The tokens are the 32 that the page binds in the G2 palette: the 25 of the main column (A-57, block 2), the 2 backdrop tokens (G2 block 3, update-page-backdrop), the 4 shell tokens (G2 shell slice, update-panel-shell) and the 1 setup-sheet token (G2 setup-sheet block, update-setup-sheet) that the appendix assigns to the setup sheet and that the last three changes bind, with the light value in the top-level `:root` and the dark value in `:root[data-theme="dark"]`:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-page` | `#f7f3ea` | `#1a1714` | page background; the `theme-color` copies |
| `--color-text` | `#1e2126` | `#f1ede4` | page text, header, button text, hinted digit |
| `--color-text-muted` | `#5f5549` | `#b8b0a4` | idle line, «Скинути», secondary text; in the setup sheet the level descriptions, the text of an unavailable level and the text of an unchecked size option |
| `--color-cell-bg` | `#fffdf8` | `#24201b` | cell fill |
| `--color-control-bg` | `#fffdf8` | `#24201b` | button and summary fill |
| `--color-line` | `#e2dbcc` | `#3a332b` | board plate and border; the cell's bottom inset line |
| `--color-cell-border` | `#847b6d` | `#8a7f71` | cell border |
| `--color-control-border` | `#8c8374` | `#8a7f71` | header, summary and close-button borders; in the setup sheet the radio ring, the border of an unavailable level and the border of «Закрити» |
| `--color-given-bg` | `#ddd3be` | `#4d4438` | given fill |
| `--color-given-border` | `#847b6d` | `#8a7f71` | given border, 1px |
| `--color-given-text` | `#1e2126` | `#f7f3ea` | given digit |
| `--color-entry-text` | `#a8400c` | `#f7a46a` | player's digit |
| `--color-primary` | `#b4460d` | `#f39a5b` | «Підказка» fill, «Нова головоломка» border, hinted border, hint accent, summary cue, logo; in the setup sheet the checked level and size option border, the radio ring's dot, the reason line's accent, «Почати» fill and border |
| `--color-primary-text` | `#fffdf8` | `#1a1007` | text on a primary fill; the logo's cells |
| `--color-primary-soft` | `#f6e3d4` | `#3d2b1e` | hinted fill, hint line fill; in the setup sheet the checked level and size option fill |
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
| `--color-option-border` | `#c4b59c` | `#5a5045` | border of an available level card in the setup sheet (decoration, A-60; in no contrast pair) |

These are the "block 2" rows of the appendix to A-57 in `docs/requirements.md`, the two backdrop rows that the appendix marks "later" and that G2 block 3 binds, the four shell rows that the appendix marks "later" and that the shell change (update-panel-shell) binds, and the one setup-sheet row that the appendix assigns to the setup sheet and that this change (update-setup-sheet) binds, value for value; the appendix is the source, this table is what the stylesheet declares (the role column of the two backdrop rows says which surfaces bind each, and the role column of the four shell rows says which surfaces and parts bind each, which the appendix's short roles "sheet, panel and dialog fill", "panel border", "panel drop shadow" and "phone sheet shadow" abbreviate; see «The backdrops take the design's translucent tokens» and «The panels take the shared surface paint»; the role column of the setup-sheet rows says what they paint in the sheet, see «The setup sheet takes the design's size, place and paint»). The "later" row of the appendix that remains is `--color-violation-ink` (the block of the confirmation dialog); it is NOT declared by this requirement: the block that binds it adds it by its own delta, so the stylesheet never holds an unused token. `--color-option-border` was the setup-sheet block's row: this requirement declares it, and «The setup sheet takes the design's size, place and paint» binds it. The row `--color-shadow-sunken` was withdrawn on 2026-10-11 (the appendix to A-57): the design dropped the inset it served. A value is a literal `#rrggbb`. A value may be `#rrggbbaa` only for a token that the list marks translucent, and the list marks five, `--color-success-glow`, `--color-backdrop-soft`, `--color-backdrop-strong`, `--color-shadow-panel` and `--color-shadow-sheet`; a translucent token is never the foreground or the background of a contrast pair, a backdrop is checked composited over the page instead (FR-65, see «Effective theme on the document»), and a shadow is decoration that holds no text and marks no component, so it is checked by no pair (its binding is pinned by «The panels take the shared surface paint»). `--color-option-border` is a `#rrggbb` token that is in no pair either, by decision: the available level card's 2px border is decoration (A-60, SQ-1 A), because WCAG 1.4.11 asks 3:1 only for what is needed to identify a component or its state and a text-labelled card is identified by its text and its radio ring; its ratios are 1.98 against the card (`--color-control-bg`) and 1.98 against the sheet (`--color-surface-raised`) in light and 2.06 and 1.90 in dark, below 3:1 on purpose, and a test pins that no pair names it. The top-level `:root` also declares `color-scheme: light` and `:root[data-theme="dark"]` declares `color-scheme: dark`, and nothing else: `:root` holds only the colour tokens and `color-scheme` (the non-colour variables live on `#app`, as the layout variables do).

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
- the hinted cue and the primary colour: `--color-primary` against `--color-primary-soft`, `--color-line` and `--color-page`, and, for the setup sheet (A-60), against `--color-control-bg` (the checked ring's dot, on the ring's fill) and `--color-surface-raised` (the checked card's border, on the sheet);
- the focus ring `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-violation-bg`, `--color-line`, `--color-primary-soft`, `--color-success-bg`, `--color-cell-border` and `--color-surface-raised` (the fill of the panels and the dialog, where the ring of «Зрозуміло», «Закрити» and the options is drawn);
- the control border `--color-control-border` against `--color-page`, and, for the setup sheet (A-60), against `--color-control-bg` (the radio ring of a level option, on the card: the cue that identifies it as an option).

The given cell is told from an ordinary one by weight, not by a border: `.cell-given` declares `font-weight` 800 against the ordinary cell's 500, a given cell in a violation keeps 800 (the rule `.cell-given.cell-violation` declares `font-weight` 800, over the 700 of `.cell-violation`), and its border is 1px in `--color-given-border`, which equals `--color-cell-border` (deliberate, PA-Q1 A of the palette amendment: the design's given cue is the weight; the fill `--color-given-bg`, the darker digit and the missing bottom inset line are decoration). The text SHALL have at least 4.5:1:

- `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-control-bg`, `--color-primary-soft` and `--color-surface-raised`;
- `--color-given-text` against `--color-given-bg`;
- `--color-entry-text` against `--color-cell-bg`;
- `--color-text-muted` against `--color-page`, `--color-cell-bg`, `--color-control-bg` and `--color-surface-raised`;
- `--color-violation-text` against `--color-violation-bg` and against `--color-violation-stripe` (the darkest band of the violating cell);
- `--color-primary-text` against `--color-primary`;
- `--color-win-text` against `--color-success-bg`.

Traces: FR-65, FR-64, FR-120, A-57, A-58, A-60, NFR-9, FR-104

#### Scenario: Tokens exist and are literal

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` rule
- **THEN** each of the 32 token names of the list above is declared once, with the light value of the list, `#rrggbb` for 27 of them and `#rrggbbaa` for the five translucent tokens only (`--color-success-glow`, `--color-backdrop-soft`, `--color-backdrop-strong`, `--color-shadow-panel` and `--color-shadow-sheet`)
- **AND** the rule `:root[data-theme="dark"]` declares each of the same 32 names once with the dark value of the list, so each token has exactly two value sets and the dark block redefines every token of the list and adds none
- **AND** the top-level `:root` declares no property other than the 32 tokens and `color-scheme`, and a translucent token appears in no contrast pair

#### Scenario: Every declared token is bound by a rule

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test counts, for each of the 32 tokens, the declarations outside `:root` whose value contains `var(<token>)`
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
- **AND** the pair against the stripe is in `CONTRAST_PAIRS` (group `cause-cue`) and the pair against the fill is the existing violation cue pair, so the list holds 41 pairs (the 35 of the cause-cue change, the 3 pairs on `--color-surface-raised` and the 3 ring pairs of the setup-sheet change)
- **AND** the stripe is not a cue (its ratio against the fill stays below 3), and the mark has no token of its own: the token list is the 32 of the table

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
- **WHEN** the test computes the ratio of `--color-primary` against `--color-primary-soft`, `--color-line`, `--color-page`, `--color-control-bg` and `--color-surface-raised`
- **THEN** each ratio is at least 3 (light 4.41, 3.99, 4.96, 5.40 and 5.40; dark 6.13, 5.68, 8.15, 7.39 and 6.82)
- **AND** `.cell-hinted` declares a dashed border style and `font-style` italic besides the colours, so the hinted cell has cues that are not colour

#### Scenario: The focus ring has 3:1 against every cell background

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-focus` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-violation-bg`, `--color-line`, `--color-primary-soft`, `--color-success-bg`, `--color-cell-border` and `--color-surface-raised`
- **THEN** each ratio is at least 3 (against the plate 11.72 in light and 10.65 in dark; against the cell border 3.87 and 3.36; against the raised surface 15.88 and 12.79)

#### Scenario: The control border has 3:1 and the text has 4.5:1

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark)
- **WHEN** the test computes the ratio of `--color-control-border` against `--color-page` and against `--color-control-bg`, and the ratios of the 4.5:1 list above: `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-control-bg`, `--color-primary-soft` and `--color-surface-raised`; `--color-given-text` against `--color-given-bg`; `--color-entry-text` against `--color-cell-bg`; `--color-text-muted` against `--color-page`, `--color-cell-bg`, `--color-control-bg` and `--color-surface-raised`; `--color-violation-text` against `--color-violation-bg` and `--color-violation-stripe`; `--color-primary-text` against `--color-primary`; and `--color-win-text` against `--color-success-bg`
- **THEN** the first two ratios are at least 3 (3.38 and 3.68 light, 4.55 and 4.13 dark) and every other ratio is at least 4.5

#### Scenario: The raised surface carries the text and the focus ring

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and `CONTRAST_PAIRS` of the test helpers
- **WHEN** the test computes the ratio of `--color-text`, of `--color-text-muted` and of `--color-focus` against `--color-surface-raised` (the fill of the rules panel, the setup sheet, the settings panel and the confirmation dialog, which no earlier pair covers: in dark `#2c2620` equals no other background)
- **THEN** the ratios are 15.88 and 12.79 for the text, 7.17 and 6.96 for the muted text and 15.88 and 12.79 for the focus ring (light, dark), each at least 4.5 for the two text pairs and at least 3 for the focus pair
- **AND** the three pairs are in `CONTRAST_PAIRS` (the first two in group `text`, the third in group `focus-ring`), the list holds 41 pairs (4 cell border, 4 violation cue, 1 cause cue, 5 hinted cue and primary, 9 focus ring, 2 control border and 16 text), and no pair names `--color-overlay-border`, `--color-shadow-panel`, `--color-shadow-sheet` or `--color-option-border` (the setup-sheet change adds a fourth pair on this fill, `--color-primary` on `--color-surface-raised`, group `hinted-cue`)

#### Scenario: The level ring and the checked state have 3:1 on the card and the sheet

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and `CONTRAST_PAIRS` of the test helpers
- **WHEN** the test computes the ratio of `--color-control-border` against `--color-control-bg` (the radio ring on the card), of `--color-primary` against `--color-control-bg` (the checked ring's dot on the ring's fill) and of `--color-primary` against `--color-surface-raised` (the checked card's border on the sheet)
- **THEN** the ratios are 3.68 and 4.13, 5.40 and 7.39, and 5.40 and 6.82 (light, dark), each at least 3
- **AND** the first pair is in `CONTRAST_PAIRS` in the group `control-border` and the other two in the group `hinted-cue`, with no new `PairGroup`, and the checked card's border against its own fill `--color-primary-soft` is the existing hinted-cue pair (4.41 and 6.13)

#### Scenario: The available card's border is decoration and in no pair

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and `CONTRAST_PAIRS`
- **WHEN** the test computes the ratio of `--color-option-border` against `--color-control-bg` and against `--color-surface-raised`, and looks for the token in the list
- **THEN** the ratios are 1.98 and 1.98 in light and 2.06 and 1.90 in dark (recorded, below 3 on purpose), `--color-option-border` is a `#rrggbb` value (`#c4b59c` light, `#5a5045` dark) and not in the translucent set, and no pair of `CONTRAST_PAIRS` names it
- **AND** the stylesheet binds it: at least one declaration outside `:root` has the value `var(--color-option-border)` (the available level card's `border-color`)

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

While the board is solved (the win line shows, FR-38), the board host `.board-host` SHALL carry `data-solved="true"`, and at no other time; the stylesheet reads it for the button row (after a win the new-puzzle button takes the bold weight from the hint button), because a has-selector is allowed only in the idle-line rule (FR-65). The setup sheet's own size, place and line height are pinned by «The setup sheet takes the design's size, place and paint»; here the scenario «The setup sheet keeps its levels in view at 1366×650» remains. This requirement covers geometry only. The page's colours, shadows and backdrops, the panels' and the dialog's own geometry, and the pixel score of each shot are outside it. The settings panel stays under the header, its right edge on the column's right edge from 48rem, as the column changes.

Traces: NFR-14, NFR-10, NFR-12, FR-68, FR-119, A-60

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
- **THEN** both sets equal the 32 tokens and values of the table of «Borders, cues and focus rings have enough contrast» (the 25 block-2 tokens, the 2 backdrop tokens, the 4 shell tokens and the 1 setup-sheet token of the appendix to A-57, that the last three changes bind), and no other `--color-*` token is declared

### Requirement: The panels take the shared surface paint

The fill, the border colour and the drop shadow of the rules panel, the setup sheet, the settings panel and the confirmation dialog SHALL come from the four shell tokens of the table of «Borders, cues and focus rings have enough contrast» (NFR-14, FR-65, A-57; G2 shell slice `update-panel-shell`; `design/v0/app/binarka.css` lines 809-829, 949-962, 1103-1117 and 1337-1349). The shell change (`update-panel-shell`) was paint only, apart from the board-size hook of «The page root carries the board size»: it made no change to the width, height, place, radius, padding or line height of any of the four surfaces. Their size and place belong to their own blocks (the rules panel, A-59; the setup sheet, A-60; the settings panel and the dialog later), which change those declarations by their own deltas; this sentence does not bind them. The bindings are these, each written with the longhand the colour scan reads (`background-color`, `border-color`) or with a `var(--color-...)` colour inside the shorthand the scan allows (`background`, `box-shadow`):

| Rule (selector) | Where | Declaration |
|---|---|---|
| `.rules`, `.setup-sheet`, `.settings` (the design's `.setup` is the page's `.setup-sheet`) | a top-level rule outside any at-rule | `background-color: var(--color-surface-raised)`, `border-color: var(--color-overlay-border)`, `box-shadow: 0 -0.5rem 2rem var(--color-shadow-sheet)` |
| the same three selectors | inside `@media (min-width: 48rem)` | `box-shadow: 0 1rem 2.5rem var(--color-shadow-panel)`; the `.rules` rule of this block, which states its border again, declares `border-color: var(--color-overlay-border)` |
| `.confirm` | a top-level rule outside any at-rule, at every width | `background-color: var(--color-surface-raised)`, `border-color: var(--color-control-border)` (unchanged), `box-shadow: 0 1rem 2.5rem var(--color-shadow-panel)` |
| `.setup-sheet:popover-open::before` (the footer strip) | a top-level rule outside any at-rule | `background: linear-gradient(to bottom, transparent, var(--color-surface-raised) 16px)` and `box-shadow: 0 16px 0 16px var(--color-surface-raised)` |
| `.setup-close` and `.settings-close` («Закрити» in the sheet and in the settings panel) | the existing rule of each (`.setup-close` and `.settings-close` both exist), outside any at-rule | `background-color: var(--color-surface-raised)` (added to the existing rule by the shell: today neither rule declares a fill, and both inherit the base `button` rule's `--color-control-bg`) |

Three decisions are part of the requirement. (1) **The dialog's border stays `--color-control-border`.** The design's `.confirm` border is `--cell-border` (`binarka.css` line 1343), whose values (light `#8c8374`, dark `#8a7f71`) are the values of the page's `--color-control-border` in both sets, so `--color-overlay-border` is bound by the three panels only. (2) **The shadow's geometry stays in the rule and its colour is the token** (FR-65): the sheet shadow below 48rem, the panel shadow from 48rem, and the panel shadow on the dialog at every width. (3) **The strip and «Закрити» take the same fill as their surface**: in dark the strip and the two buttons would otherwise show `#24201b` bands on the `#2c2620` panel. After the port no rule that is exactly `.rules`, `.setup-sheet`, `.settings` or `.confirm` uses `--color-control-bg` for its `background-color`, no such rule among the three panels uses `--color-given-bg` for its `border-color` (at any width), and the strip uses `--color-control-bg` nowhere. The other rules that paint with `--color-control-bg` inside a surface are controls, not the surface's own fill, and are not touched: the base `button` rule, `.size-control` and its options, `.level-control` options, `.setup-start`, `.theme-control` and `.language-control` with their options (in dark they sit at `#24201b` on the panel's `#2c2620`, as the design's own `--surface` controls do on `--surface-raised`, `binarka.css` line 386).

A pair covers the text and the focus ring on the raised fill: `--color-text`, `--color-text-muted` and `--color-focus` on `--color-surface-raised`, and, for the checked level card's border on the setup sheet (A-60), `--color-primary` on `--color-surface-raised` (see «Borders, cues and focus rings have enough contrast»). The three shell tokens that paint no text (`--color-overlay-border`, `--color-shadow-panel`, `--color-shadow-sheet`) are in no pair. The overlay border is signed as decoration: the rules-panel amendment records "the border is not a pair (1.24 light against the page; decoration, the backdrop already separates the panel)" (`docs/handoff/rules-panel-amendment-draft-2026-10-11.md`, section 4, ratified at autonomy-log row 172); the reasoning that A-60 gives for the available level card's border supports it (a text-labelled surface is identified by its text and fill, not by its edge). The two shadows are translucent, and a translucent token is in no pair.

Intentionally not delivered by the shell change (`update-panel-shell`), so that testers do not report them as bugs; later blocks deliver some of them by their own requirements, for the setup sheet «The setup sheet takes the design's size, place and paint»: (1) the design's mask shadow on «Закрити» (`0 0 0 1rem` and `0 1rem 0 1rem` in the raised fill, `binarka.css` lines 543-545): the page's sheet masks scrolled text with the footer strip, and its settings panel's «Закрити» is not sticky; (2) the filled «Зрозуміло» and the sticky rules footer (the rules-panel block), the filled «Почати», the level cards, the size option's paint and the ring (the setup-sheet block), the list separators and the example cells of the rules panel (the rules-panel block), the other paint of the settings panel and of the confirmation dialog (the second wave), and the dialog's `--color-violation-ink` (the dialog block); (3) the shell change made no size, place, radius, padding or line-height change of any surface and no motion; (4) the colour of a shadow in a browser other than Chromium (only Chromium is tested, NFR-7).

The mechanism is a stylesheet test, test first, and a browser test. `tests/play-page-panel-shell-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-65`) reads the parsed `src/ui/style.css`. `e2e/nfr-14-panel-shell.spec.ts` (`@trace NFR-14`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares the computed fill, border colour and shadow of the four surfaces with the design build, read live: the test serves `design/v0/out` itself with a static file server on a free port chosen by the operating system (never 4173, 4174, 4176 or 4177, which the page preview and the capture tools bind), with the path guard of `scripts/freeze-design-geometry.mjs` (nothing outside the build folder is served), and opens the design's routes `/rules/`, `/setup/`, `/settings/` and `/confirm/`, which show each surface open at load. The other `nfr-14-*` e2e tests read frozen files (`quality/design-geometry.json`, `quality/design-paint.json`) and do not serve the design build; this one does, because the shell adds no freeze case. If `design/v0/out/index.html` is missing, the test FAILS with the build instruction of `design/README.md` (`pnpm build` in `design/v0`); it is never skipped. The page side is the built page of `playwright.config.ts`, with the design's fixture board (FR-119) and the surface opened by the press the capture uses (`e2e/nfr-14-backdrop.spec.ts`). Both sides use the browser setup of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, the scheme on the browser context, no stored preference). The sampling is declared: the surfaces (rules, setup sheet, settings, confirmation), the schemes (light, dark) and the viewports 375×812 and 1024×768, 16 cases; coverage is `sampled`, never continuum. Nothing between the two viewports, no hover, no focus state, no other board is looked at. The stricter instruments that run before a block-done claim are the per-block pixel crop of `scripts/visual-block.mjs` and the per-shot gate `npm run check:visual` over the rules, rules-techniques, confirm, setup and settings shots, and then the full computed-style diff of every element of the surfaces (the escalation path of `docs/qa/visual-diff/README.md`). This requirement claims no pixel floor for any shot.

Traces: NFR-14, FR-65, A-57, A-60

#### Scenario: The three panels take the raised fill, the overlay border and the sheet shadow below 48rem

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test reads the rule of each of `.rules`, `.setup-sheet` and `.settings` that is outside any at-rule
- **THEN** each declares `background-color` `var(--color-surface-raised)`, `border-color` `var(--color-overlay-border)` and `box-shadow` `0 -0.5rem 2rem var(--color-shadow-sheet)` (whitespace aside), and each of the three declarations appears once in that rule
- **AND** (a change-time check of the shell change `update-panel-shell`, its task 3.6, recorded in its evidence; not a lasting test, because the panels' own blocks change these declarations later) `git diff -U0` of `src/ui/style.css` against `main` before the shell change showed no added, removed or changed line that declares `border-width`, `border-radius`, `max-height`, `padding`, `width`, `inset` or `margin` in these three rules (the filter of that task 3.6; the rules then were `.rules` at lines 631-648, `.setup-sheet` at 780-801 and `.settings` at 1071-1088 of the file at `main` `64c2d7d`)

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
- **THEN** there are exactly four: `--color-text` and `--color-text-muted` at 4.5:1 (group `text`), `--color-focus` at 3:1 (group `focus-ring`) and `--color-primary` at 3:1 (group `hinted-cue`, the checked level card's border on the sheet, added by update-setup-sheet), and each ratio holds in the light and in the dark token set
- **AND** no pair names `--color-overlay-border`, `--color-shadow-panel`, `--color-shadow-sheet` or `--color-option-border`, and the list holds 41 pairs

#### Scenario: The shell moves no box

- **GIVEN** the built page, and `e2e/nfr-14-layout-geometry.spec.ts` (its 32 cases and its settings-panel and setup-sheet scenarios), `e2e/nfr-12-targets.spec.ts` and `e2e/nfr-10-fit.spec.ts` as they stood before the shell change (`update-panel-shell`)
- **WHEN** they ran after the shell change's port
- **THEN** they passed, and `git diff` of the shell change (`update-panel-shell`) showed no edit to those files or to `quality/design-geometry.json` (a change-time check of that change, not a lasting test; later blocks edit these files by their own deltas)

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

### Requirement: Setup sheet

The page SHALL contain, created once at mount, a setup sheet `[data-section="setup"]` (FR-96, A-40): an element with the `popover` attribute and `role="dialog"`, with the `aria-label` «Поле і складність» ("Grid and difficulty" in English mode, FR-111), with an `id` that is unique in the document (it ends in a number that belongs to the mount, like the other ids), and with no `aria-labelledby` and no heading element (A-41). It SHALL sit inside the page root and outside the element that holds the board, follow the rules panel in document order and precede the confirmation dialog, need no new dependency and hold, in this order: the size control `[data-control="size"]` (see «Grid size selector»), the level control `[data-control="level"]` (see «Level selector»; it contains the reason line `[data-level-reason]` first, see «Only the first level exists at 4x4»), the start button `[data-action="setup-start"]` «Почати» (see «Start button») and the close button `[data-action="setup-close"]` with the text «Закрити», `type="button"`, `popovertarget` equal to the sheet's `id` and `popovertargetaction="hide"`. The sheet SHALL be the same element, with the same children, after a hint, a win, a reset, «Нова головоломка» and a press of «Почати» (only the attributes and texts that those requirements define change). **Presentation (A-60):** a bottom sheet on phones (up to 88% of the window height; up to the window less 9rem at 22.5rem and narrower); from 48rem, a panel centred on the page column: on a window at least 44rem tall, as wide as the column and hung 0.5rem under the summary button; on a shorter window, the column width plus 1rem, 6rem from the top. In both it ends at least 0.5rem below the button row (or at the window's limit, if that is higher), grows with its contents up to the window, and scrolls inside only when the window is too short; taller contents cover the messages while the sheet is open. The look matches NFR-14. The values, the paint and the checks are in «The setup sheet takes the design's size, place and paint»; the 44 px targets are NFR-12 («The start button and the sheet buttons meet the touch-target floor»).

Reading rule and test contract (A-44). jsdom has no `popover` support: tests install stubs for `showPopover`, `hidePopover` and `togglePopover` on `HTMLElement.prototype` that record each call and keep an open or closed state per element, and remove them after each test; the stub of `hidePopover` closes the state and dispatches no event, and a `toggle` event is dispatched by the test itself (an `Event` of type `toggle` with a `newState` property set to `closed` or `open`). The opening of the sheet by the summary button is native and not tested in jsdom: a test opens the sheet by calling the stubbed `showPopover()` on it. **Reading rule for choices (A-44, A-47).** The verb **«chooses»** (in a requirement this change does not modify also «presses», «selects», «changes the size to N» or «changes the level to X» followed by an effect on the board, the seed source, the generator, the dialog, the messages or the summary; the list is in `design.md`) means a **choice**: the test first opens the sheet this way, presses the option (which only marks, FR-100), presses «Почати», and, where the scenario confirms, `[data-confirm="yes"]`. «A size change» and «a level change» mean a board shown by such a choice. A choice of the size and level already shown is therefore not a no-op: it makes one new puzzle like «Нова головоломка». The verbs «marks» and «makes a marking press», and every use of «presses» that carries the note «(a marking press)» or «(marking presses)», mean one press on the option and no «Почати»; so do the scenarios that say a press «does nothing». `aria-checked` read after a choice is read with the sheet closed, that is on the board shown (A-47). A generator that "throws" in a scenario throws an ordinary `Error`, not the run-out error of the engine, unless the scenario says run-out.

Traces: FR-96, FR-95, FR-97, FR-94, NFR-5, NFR-9, NFR-12, NFR-14, A-60, FR-100, FR-101, FR-111

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

### Requirement: Level selector

The setup sheet SHALL contain a level control `[data-control="level"]` after the size control (FR-44, FR-87): an element with `role="radiogroup"` and the accessible name «Складність» (`aria-label`, no visible label, as FR-62), holding exactly four `<button type="button" role="radio">` elements for the levels 1, 2, 3 and 4, in this order, with the names «Розминка», «Задачка», «Головоломка» and «Мозколамка» ("Warm-up", "Teaser", "Puzzler", "Brain-twister" in English mode, FR-111); the group name «Складність» is "Difficulty" in English mode. While the sheet is open the button of the **marked** level SHALL have `aria-checked="true"` and the other three `aria-checked="false"`; while the sheet is closed `aria-checked="true"` is on the level of the board shown (FR-87, FR-100, A-47); «Розминка» is selected when the page is mounted (FR-88). A level button SHALL NOT carry `aria-label`, `aria-labelledby` or `aria-describedby`, SHALL NOT have the `disabled` attribute or a `tabindex` attribute, and is operated by a click (the native activation of Enter and Space); arrow keys are not required and not handled (A-24, FR-59). No text of the page shows «Складність», and the page has no `label` element for the control. The page reads a level only from the four buttons, never from a free value. The content of a level button is specified by «Level option content».

**One press of an available level button only marks that level** (FR-73, FR-100): it starts no puzzle, takes no seed, calls no generator, opens no dialog and does not close the sheet. A new puzzle of the marked size and the marked level is started only by «Почати» (FR-101): the page SHALL take a new seed from the seed source, call the generator as `generate(size, seed, level)`, the three-argument form of the engine generator (FR-13, FR-81), render the new board, update the summary, and clear the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker. When the board has player entries the page SHALL first close the sheet and ask for confirmation and start the new puzzle only after «Так, почати» (FR-90, FR-98). A level choice SHALL NOT change the size. A run-out of the generator is retried with the next seed (FR-88, see «Page retry on a run-out»). If the generator fails in any other way, or the returned `puzzle.givens` is not n rows of n cells, or every retry ran out, the page SHALL keep the previous board, messages, highlights, `cell-hinted`, size and level, with `aria-checked` and the summary unchanged and no uncaught error; the page shows no error text for it, and the sheet is closed (FR-97). The page MUST NOT remember the level: a reload or a new mount starts at «Розминка» (TC-12, FR-88). Pressing the button of the level already shown or already marked is specified by «Pressing the shown size changes nothing» (FR-73); whether the pressed level exists at the size shown by «Only the first level exists at 4x4». The look of the cards (the ring, the indent of the description, the paint of each state) is pinned by «The setup sheet takes the design's size, place and paint» (NFR-14, A-60) and the 44 px targets by NFR-12; the wrapping and the one-screen fit (NFR-10) are not claimed here.

Traces: FR-44, FR-87, FR-88, FR-97, NFR-9, NFR-5, NFR-12, NFR-14, A-60, FR-73, FR-100, FR-101, FR-111

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

### Requirement: The summary and level buttons set their own colours

The summary button SHALL carry the class `setup-button` (its text span carries `setup-summary` and its cue span `setup-cue`, as in the design reference `review-set-11`), the level control the class `level-control`, and the stylesheet `src/ui/style.css` SHALL set an explicit `color` and an explicit `background-color`, each a single `var(--color-...)` token, in the rule `.setup-button`, in the rule `.level-control button`, in the rule `.level-control button[aria-checked='true']` and in the rule `.level-control button[aria-disabled='true']` (FR-65, NFR-9). For each of the four states, the declarations of the plain rule, with those of the state rule laid over them, SHALL give a text colour with at least 4.5:1 contrast against the background colour (the WCAG 2 formula on the resolved tokens) in each token set, light and dark (A-51, FR-65), and the unavailable state SHALL NOT be drawn with `opacity`. The rule `.level-control button[aria-disabled='true']` SHALL also declare a cue that is not colour alone (FR-91): a `border-style` that differs from the plain rule's, or a `text-decoration` other than `none`; which cue is used follows the user's updated design (the design reference `review-set-11` uses a dashed border and a dashed radio ring and no strike-through, autonomy-log row 93). No colour literal is added. «Почати» is bound to the design's primary fill by the setup-sheet block (update-setup-sheet, A-57), see below. The summary button, the level buttons and the close button are `button` elements, so the existing `button:focus-visible` rule gives them the focus indicator of FR-65, and the rules of the sheet obey the existing stylesheet scans (no `!important`, no `:has(` besides the idle-line rule, no `display: contents`, no removed outline). The start button `[data-action="setup-start"]` SHALL set its own explicit `color` and `background-color`, each a single `var(--color-...)` token, in one rule that matches it (found by matching the mounted element against the selectors of the stylesheet), with at least 4.5:1 contrast between the two on the resolved tokens of each token set, in the plain state and in the hover and focus-visible states if the rule has them, and without `opacity` (FR-65, FR-101). «Почати» takes the design's primary fill (FR-65, A-57): `color` `var(--color-primary-text)`, `background-color` `var(--color-primary)` and a `--color-primary` border; the pair `--color-primary-text` on `--color-primary` is in «Borders, cues and focus rings have enough contrast» (5.40 in light, 8.55 in dark). The `.size-control` rules are not changed by this requirement (the checked size option's paint is bound by «The setup sheet takes the design's size, place and paint»). The look of the buttons beyond the pairs above (the ring, the dot, the indent, the colours of the dashed cues) is pinned by that requirement, not here; the unavailable state has no inset shadow (SQ-2).

Traces: FR-65, NFR-9, NFR-14, FR-87, FR-91, FR-95, FR-97, FR-101, A-57, A-60

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
- **THEN** each name span has the class `level-name`, the first rule declares `content` and a `border-radius` (the radio ring), and the second declares a `background-image` whose value contains `radial-gradient(` and `var(--color-primary)` (the dot inside the ring, the design's: it replaces the `inset` box shadow of the review-gate fix round of 2026-10-09, a deliberate change, SQ-3 A) and no `box-shadow` whose value contains `inset`, so the checked level differs from the others in shape and not by colour alone (WCAG 1.4.1)

#### Scenario: The classes are on the elements and the buttons are buttons

- **GIVEN** the page has just been mounted
- **WHEN** the test reads `[data-action="setup"]`, `[data-control="level"]`, its four radio buttons and `[data-action="setup-close"]`
- **THEN** the summary has the class `setup-button`, the control has the class `level-control`, and each of the six buttons is a `button` element, so `button:focus-visible` applies to it

#### Scenario: The start button declares its colours

- **GIVEN** the text of `src/ui/style.css` and a mounted page
- **WHEN** the test finds the rule that matches `[data-action="setup-start"]` and reads its declarations
- **THEN** the rule exists and declares `color` and `background-color`, each a single `var(--color-...)` of a token declared in `:root`, and no `opacity`
- **AND** the ratio of the text colour to the background colour is at least 4.5 in each token set
- **AND** the text colour is `var(--color-primary-text)` and the background colour is `var(--color-primary)` (the design's primary fill, A-57)

#### Scenario: The existing stylesheet scans still pass

- **GIVEN** the stylesheet with the sheet, summary and level rules
- **WHEN** the existing scans of «Rules use the tokens and no colour literal is left», «Nothing removes the outline» and «The stylesheet stays inside the build target, with one `:has(` exception» run
- **THEN** each passes unchanged, and every token of the list of «Borders, cues and focus rings have enough contrast» is still declared in `:root` and in `:root[data-theme="dark"]`

### Requirement: Start button

The setup sheet SHALL hold a button `[data-action="setup-start"]` with `type="button"`, the visible text «Почати» and no `aria-label`, `aria-labelledby` or `tabindex` (FR-101, FR-94). It is a direct child of the sheet, placed after the level control and before the close button (FR-96), and it is always present and never disabled: also when the marked choice equals the board shown, and also when no board is shown (the generation at the mount failed). A press SHALL close the sheet with `hidePopover()` and then act in one of three ways. (a) On a board without player entries it starts ONE new puzzle of the marked size and the marked level at once: one seed taken from the seed source (more only after a run-out of the generator, FR-88), one call `generate(size, seed, level)`, the board rendered, the summary updated, and the hint message, the win message, all highlights that belonged to the old board and the `cell-hinted` marker cleared; DOM focus moves to the summary button (FR-97). (b) On a board with player entries it makes the marked size and level the pending action and asks for the confirmation (FR-67, FR-98): until «Так, почати» no seed is taken and the generator is not called. (c) With no board shown it generates at once, as in (a). If the generator fails (FR-88), the previous board, messages, highlights, `cell-hinted`, size, level and summary are kept, the sheet is closed, `aria-checked` is on the board shown, focus is on the summary button and no text is shown. «Почати» is never a no-op (SD-Q2): a press with a marked choice equal to the board shown makes a new puzzle of that size and level, like «Нова головоломка». Both buttons stay direct children of the sheet, with no wrapper element (FR-96). How they are drawn (the signed wireframe, Footer-1) and the look of «Почати» (the design's primary fill) are NFR-14 and A-60, pinned by «The setup sheet takes the design's size, place and paint» and «The summary and level buttons set their own colours»; the 44 px height is NFR-12 (see «The start button and the sheet buttons meet the touch-target floor»). This requirement pins none of them beyond the DOM order.

Traces: FR-101, FR-100, FR-67, FR-88, FR-94, FR-98, NFR-14, A-60

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

The start button `[data-action="setup-start"]` «Почати», the summary button `[data-action="setup"]` and the close button `[data-action="setup-close"]` «Закрити» SHALL each be at least 44×44 CSS px (NFR-12). The stylesheet `src/ui/style.css` SHALL give each of the three a `min-height` of at least `2.75rem` as an ordinary declaration, in one rule that matches the element: no `!important`, not inside a media query. The probe `e2e/nfr-12-targets.spec.ts` already opens the setup sheet at 6×6 and at 4×4 and measures the summary button and «Закрити»; its sheet measurement SHALL also measure «Почати» with the sheet opened at 6×6 and at 4×4 (the probe measures the summary button among the page controls, «Закрити» with the sheet at 6×6 and the level options at 4×4; those stay as they are). The sampled viewports are the eight of the probe, not continuum coverage. jsdom has no layout (TC-13), so the unit test decides the declaration and the real-browser run decides the measured size. How the two buttons are drawn relative to each other (Footer-1, autonomy-log row 120) is not claimed here; it is NFR-14, pinned by «The setup sheet takes the design's size, place and paint».

Traces: NFR-12, NFR-14, FR-101

#### Scenario: The stylesheet declares a 44 px minimum height for the three buttons

- **GIVEN** the page is mounted in jsdom and the text of `src/ui/style.css` is applied to the document
- **WHEN** the test reads the computed `min-height` of `[data-action="setup-start"]`, `[data-action="setup"]` and `[data-action="setup-close"]`
- **THEN** each value is a length of at least 44 px
- **AND** no rule that declares that `min-height` for one of the three buttons is inside an at-rule such as `@media`, and no `min-height` declaration has the priority `important`

#### Scenario: Measured in a real browser «Почати» is at least 44 px in both directions

- **GIVEN** the built page is open in Chromium at each of the eight viewports of `e2e/nfr-12-targets.spec.ts` with the sheet opened at 6×6, and again at 4×4
- **WHEN** the probe measures «Почати» in both sheets, and, as it already does, the summary button among the page controls and «Закрити» in the 6×6 sheet
- **THEN** each measured control is at least 44 px wide and at least 44 px tall, and the spec reports no line for a measured control below 44×44

### Requirement: Cells and buttons show a visible, unobscured focus indicator

The stylesheet SHALL contain a `:focus-visible` rule for `.cell` and for `button` (FR-65), found anywhere in the file (top level, nested with `&` resolved against its parent, or inside an at-rule), each declaring `outline-style: solid`, `outline-width` of at least 2px and `outline-color: var(--color-focus)`. Together they cover every cell and every page button: the header «Правила» and the settings button, the summary button, the three size buttons, the four level buttons, the three theme options, the two language options, the close button «Закрити» of the settings panel, the start button «Почати» and the close button «Закрити» of the setup sheet, «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати», all of them `<button>` elements. The `.cell:focus-visible` rule SHALL declare `outline-offset: 2px`, `position: relative` and `z-index` of at least 1, so the 3px ring is drawn outside the cell (the cell's own border, the violation cue included, stays visible), the inner side of the ring, over the gap between cells, shows the board plate `--color-line` and not the page (the board's gaps are 4, 3 and 2px with the size and the width; the pair `--color-focus` against the plate is 11.72 in light and 10.65 in dark, A-57), the ring's outer edge lands on a neighbour's border and fill (the pairs `--color-focus` against the cell, given, violation, hinted-soft and success fills are 10.87 or more in light and 8.17 or more in dark, and against the cell border 3.87 and 3.36) and the ring is not covered by neighbouring cells; the trade-off is that the ring covers the border of a neighbour on that side while the cell is focused. Three adjacencies are accepted below 3:1 (A-57, PA-Q8 of the palette amendment): the ring against a neighbour's violation border (2.47 light, 1.96 dark), against a hinted neighbour's primary border (2.94, 1.88) and against the success border at the edge of a solved 8×8 board (2.53, 1.53); in each case the inner band of the ring stays on the plate at 10.65:1 or more. The `button:focus-visible` rule SHALL declare a positive `outline-offset`. No rule SHALL remove the outline: no declaration `outline: none`, `outline: 0`, `outline-style: none` or `outline-width: 0` exists in the file. The stylesheet SHALL NOT contain `!important`, and SHALL NOT contain `:has(` except in the one selector that hides the idle line: exactly one rule contains `:has(`, the subject of its selector is `.message-idle`, and it declares nothing but `display: none` (FR-71: the idle line is hidden by CSS only, and only `:has` can reach a previous sibling; FR-68 fixes the order idle, hint, win). Where a browser does not know `:has` (Firefox 114 to 120, the Vite 8 build target of `docs/frontend-conventions.md` rule 20) the idle line stays visible next to a message and nothing else depends on the rule. This is the one exception that FR-65 allows. CSS nesting, media queries and `@layer` are allowed by that rule; the test reads them all. The open setup sheet SHALL keep a keyboard-focused control clear of its sticky footer row (FR-65 "unobscured", WCAG 2.4.11): the open sheet declares a `scroll-padding-bottom` of at least the footer height, so the browser's own focus scrolling brings a focused option above the footer (second review-gate fix round, 2026-10-10, autonomy-log row 126).

Traces: FR-65, FR-87, FR-95, FR-97, FR-101, FR-102, FR-117, FR-107, NFR-13

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

- **GIVEN** a real browser at 320×700, 1366×650, 320×568 and 375×600 (e2e, `e2e/nfr-13-a11y.spec.ts`; sampled; the 375-wide case is 375×600 since `update-setup-sheet`: with the design's sheet metrics the sheet with «Поле 4×4» marked fits at 375×667 and does not scroll), the setup sheet open with «Поле 4×4» marked, so the sheet scrolls inside itself, which the walk asserts at each viewport
- **WHEN** the keyboard moves the focus with Tab from «Поле 4×4» through the size options and the four level options, with no scrolling by script
- **THEN** for each focused option the bottom of its focus ring (its rect bottom plus the outline offset and width) is at or above the top of the footer strip behind «Почати» and «Закрити»

## ADDED Requirements

### Requirement: The setup sheet takes the design's size, place and paint

The setup sheet `[data-section="setup"]` (class `setup-sheet`) SHALL take the size, the place and the paint of the design's sheet (`.setup`, `design/v0/app/binarka.css` lines 386-414, 435-650, 949-1007 and 1049-1072; reference `design/v0-screenshots/review-set-14/*setup*.png`), from the page's tokens (FR-96 presentation, FR-65, FR-99, NFR-14, A-60; G2 setup-sheet block, `update-setup-sheet`). It runs after `update-panel-shell`, whose fill, border colour and shadow of the sheet it keeps (see «The panels take the shared surface paint»), and it needs the shell's hook, the root's `data-size` (see «The page root carries the board size»). Wherever the design uses `--cell-border` inside the sheet (the ring, the unavailable card's border, the «Закрити» border), the page uses `--color-control-border`, which has the same values in both sets (`#8c8374` light and `#8a7f71` dark; `--color-cell-border` is darker in light for the board's cells only, A-57).

**Size and place.** The sheet is a popover in the top layer. Its rules are these (every length is the design's; `B` is the board side `min(var(--board-width), var(--column))`, read from the root through the shell's hook, never through `:has(`):

| Regime | Where | Declarations of the rule that is exactly `.setup-sheet` |
|---|---|---|
| Phone | a top-level rule outside any at-rule | `position: fixed`, `inset: auto 0 0 0`, `width: 100%`, `max-width: none`, `margin: 0`, `max-height` declared twice, in this order, `90vh` and then `88dvh` (the fallback first), `box-sizing: border-box`, `overflow-y: auto`, `border-width: 1px 1px 0 1px`, `border-radius: var(--radius-l) var(--radius-l) 0 0`, `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))` |
| Small phone | `@media (max-width: 22.5rem)` | `max-height: calc(100dvh - 9rem)`, `padding-top: 1rem` (the design's `.setup { padding-top: var(--space-4) }` at 22.5rem and narrower) |
| From 48rem, any height (full cover) | `@media (min-width: 48rem)`, one rule | `inset: 0`, `width: calc(var(--column) + 1rem)`, `max-width: calc(100% - 2rem)` (kept from the page; from 48rem it is never the smaller of the two, so it changes no box), `height: fit-content`, `max-height: calc(100dvh - 7rem)`, `min-height: min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 8.5rem))`, `margin: 6rem auto auto`, `padding-bottom: 1rem`, `border-width: 1px`, `border-radius: var(--radius-l)` |
| From 48rem, window at least 44rem tall (anchored) | `@media (min-width: 48rem) and (min-height: 44rem)`, one rule | `inset: 0 0 auto 0`, `width: var(--column)`, `max-height: calc(100dvh - 10.75rem)`, `min-height: min(calc(100dvh - 10.75rem), calc(min(var(--board-width), var(--column)) + 4.75rem))`, `margin: 9.75rem auto 0` |

So on a phone the sheet is a bottom sheet up to 88% of the window height (up to the window less 9rem at 22.5rem and narrower). From 48rem on a window shorter than 44rem (for example 1366×650) it covers the page from 6rem, one rem wider than the column. From 48rem on a window at least 44rem tall (768×1024, 1024×768, 1440×900) it hangs under the summary button, as wide as the column, 0.5rem below the summary (the header and the 1rem gap and the 2.75rem summary end at 9.25rem). In both desktop regimes the `min-height` makes the sheet end at least 0.5rem below the button row (the row ends at `B + 14rem`; the sheet starts at 6rem or 9.75rem), or at the window's limit when that is higher (the `max-height` ends it 1rem above the window's bottom); the sheet grows with its contents up to the window, scrolls inside only when the window is too short, and taller contents cover the messages while the sheet is open. The rules `.setup-sheet:popover-open` (the grid of Footer-1, the strip, the sticky row) keep their layout and their `display`; no rule that is exactly `.setup-sheet` declares `display`, so the closed sheet stays hidden by the user agent. The sheet declares no `line-height`: the placeholder `line-height: normal` of the layout-geometry block is gone, and the sheet keeps the body's line height (A-60).

**Inner metrics, the design's** (the e2e geometry below cannot pass without them; they go beyond the amendment's list, see `design.md`, open point 1). The base `button` rule of the page (`padding: 10px 16px`, a 6px radius, a 1px border) is not the design's, so each control of the sheet states its own padding where the design does: the size options `padding: 0 0.5rem`, 2px border, font size `0.9375rem`, line height 1.2, `font-weight: 500`, radius `calc(var(--radius-m) - 0.1875rem)`; the size control `width: 100%` with no `max-width`, `margin: 0`, radius `var(--radius-m)`, 1px border, padding and gap `0.1875rem`; the level group `gap: 0.5rem`, `margin-top: 0.75rem`; the level cards `padding: 0.5rem 0.75rem`, `gap: 0.125rem`, `min-height: 2.75rem`, 2px border, `border-radius: var(--radius-m)`; the card name `font-size: 1rem`, `font-weight: 700`, `line-height: 1.25`, `gap: 0.5rem`; the card description `font-size: 0.875rem`, `font-weight: 400`, `line-height: 1.35`; the reason line `[data-level-reason]` `margin: 0`, `padding: 0.25rem 0 0.25rem 0.75rem`, `font-size: 0.875rem`, `line-height: 1.35`; «Почати» `padding: 0 0.75rem`, 2px border, `border-radius: var(--radius-m)`, `font-weight: 700`, `line-height: 1.2`, `min-height: 2.75rem`; «Закрити» `padding: 0 0.5rem`, 2px border, `border-radius: var(--radius-m)`, `font-weight: 600`, `min-height: 2.75rem`. At 22.5rem and narrower the level group has `gap: 0.375rem` and the level cards `padding: 0.375rem 0.625rem`, in `@media (max-width: 22.5rem)`; the `min-height` of the buttons stays outside any at-rule (see «The start button and the sheet buttons meet the touch-target floor»).

**The description indent.** Each level card's description starts under the name, not under the radio ring: the description has `padding-left: calc(0.875rem + 0.5rem)`, the ring's width plus the name's gap.

**Paint** (every colour a token; wherever a state rule does not repeat a declaration, the plain rule's applies):

| Element | Declarations |
|---|---|
| Available level card (`.level-control button`) | `border-color: var(--color-option-border)` (decoration, A-60: in no contrast pair), `background-color: var(--color-control-bg)`, `color: var(--color-text)` |
| Radio ring (`.level-control button .level-name::before`) | `0.875rem` square, `border: 2px solid var(--color-control-border)`, `border-radius: 50%`, `background-color: var(--color-control-bg)`; no `box-shadow` |
| Description | `color: var(--color-text-muted)`; in the checked card `color: var(--color-text)` |
| Checked card (`[aria-checked='true']`) | `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)`, `color: var(--color-text)` |
| Checked ring (`[aria-checked='true'] .level-name::before`) | `border-color: var(--color-primary)` and `background-image: radial-gradient(circle, var(--color-primary) 0 40%, var(--color-control-bg) 45%)` (the dot); no `box-shadow` (the `inset` shadow of the review-gate fix round is replaced, SQ-3 A) |
| Unavailable card (`[aria-disabled='true']`) | `border-style: dashed`, `border-color: var(--color-control-border)`, `background-color: var(--color-page)`, `color: var(--color-text-muted)`, no `opacity`, no `box-shadow` |
| Unavailable ring | `border-style: dashed`, `background-color: transparent`, no `background-image`, no `box-shadow` |
| Reason line | `border-left: 3px solid var(--color-primary)`, `color: var(--color-text)` |
| Unchecked size option (`.size-control button`) | `color: var(--color-text-muted)` (the design's `--ink-muted`; muted text on the control fill is already a pair, 7.17 / 7.54), `background-color: var(--color-control-bg)` (the design's `transparent` shows the size control's own `--color-control-bg` fill, and «The size buttons set their own colours…» asks for a token, not `transparent`) |
| Checked size option (`.size-control button[aria-checked='true']`) | `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)`, `color: var(--color-text)`, `font-weight: 700` |
| «Почати» (`.setup-start`) | `background-color: var(--color-primary)`, `border-color: var(--color-primary)`, `color: var(--color-primary-text)` |
| «Закрити» (`.setup-close`) | `border-color: var(--color-control-border)` (2px, solid); its fill is the shell's `--color-surface-raised` |

«Закрити»'s 2px `--color-control-border` border lies on the sheet's `--color-surface-raised` at 3.68 / 3.81; like the overlay border and the available card's border it is decoration and in no pair, because the text «Закрити» identifies the control. The theme options and the language options keep their rules (`.theme-control button[aria-checked='true']`, `.language-control button[aria-checked='true']` still use `--color-focus` and `--color-given-bg`): the design's shared rule for the three segmented controls is the second wave's. The summary button `.setup-button` is not changed.

**The level group's bottom margin stays 28px at every width, a departure from the design, said plainly (A-60, SQ-5).** The design has 24px at every width above 22.5rem (A-60, corrected at autonomy-log row 173) and 1rem at 22.5rem and narrower; with a smaller margin the keyboard focus ring of the last option sits under the footer strip (FR-65, WCAG 2.4.11; «Cells and buttons show a visible, unobscured focus indicator»). Because the sheet is `fit-content` between its floor and its cap, the departure makes the sheet 4px taller than the design's (12px at 320) wherever its content decides the height, never past its `max-height` (at 320×700 in the 6×6 state the expected sheet meets the cap, 2.31px taller); the box test therefore compares the page with the design plus this one recorded deviation (see below), not with the unmodified design. The rule `.setup-sheet > [data-control='level']` keeps `margin-bottom: 28px` outside any at-rule, and `.setup-sheet:popover-open` keeps `scroll-padding-bottom` of at least `calc(2.75rem + 48px)` (the design's bottom padding is 16px, so the value that covered the page's 24px still covers it). **No motion** is ported (SQ-6): no `.setup-sheet` rule is inside `@media (prefers-reduced-motion: no-preference)` or `@starting-style`, and none declares `transition` or `animation`. The contrast of the new bindings is pinned by «Borders, cues and focus rings have enough contrast» (the ring pairs and the primary pairs), not here.

Intentionally not delivered in this change, so that testers do not report them as bugs: (1) the theme and language options' paint and the settings panel's (the second wave); (2) the design's mask shadow on «Закрити» and its `pointer-events: none` on the strip; (3) motion of any kind; (4) the design's 24px and 1rem margins of the level group (the 28px departure above); (5) a computed-paint comparison of the sheet's cards with the design build in a browser (the stylesheet scenarios and the per-shot gate cover the paint); (6) a pixel floor for any setup shot (they are expected to rise, see `design.md`); (7) the sheet in Safari and Firefox (NFR-7); (8) the `cursor` of the unavailable card (the design's `not-allowed`, the page's `default`); (9) between the sampled viewports the design's own sheet, and so the page's, cuts the idle line's text: at a window 700 px tall from 768 to 1440 px wide (the full cover ends inside the line) and in the 4×4 state at 1024 px tall from 672 to 752 px wide (the bottom sheet's top lies in the line), found by the sweep and left to a later design question (the user's decision of 2026-10-11, `docs/qa/update-setup-sheet/sweep.txt`).

The mechanism is a stylesheet test and a browser test, both test first. `tests/play-page-setup-sheet-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-65`, `@trace FR-96`) reads the parsed `src/ui/style.css`. `e2e/nfr-14-setup-sheet.spec.ts` (`@trace NFR-14`, `@trace FR-96`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares the open sheet's box and its first level description's left edge with the cases of the new key `setupSheet` of `quality/design-geometry.json`, frozen by `scripts/freeze-design-geometry.mjs` from the design build served from `design/v0/out` with the browser setup of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, light scheme). Each case records two boxes of the sheet: the design's own (`boxes`) and the expected product box (`expected`), which the script captures by loading the same design page a second time with one rule injected into the design page in the browser, `.setup .level-control { margin-bottom: 28px }` appended after the design's stylesheet (the one deviation, the 28px margin of A-60 and SQ-5); where the floor or the cap decides the sheet's height the two boxes are equal. The key records the deviation with the rule, the design's value (24px, and 1rem at 22.5rem and narrower), the product value (28px), the reason (A-60, SQ-5: the focus ring of the last option under the footer strip) and the cases whose height the content decides, as «The main column takes the design palette» records the A-57 deviations. The script guards the injection as `e2e/nfr-14-palette.spec.ts` guards its deviations: it reads the design's computed `margin-bottom` of the level group before injecting and fails unless it is 24px (16px at 22.5rem and narrower), so the override never hides a different design value. The description's left edge is not affected by it. The sampling dimensions are declared: the viewports 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900 and the states default (the design's 6×6 fixture, shot `<w>-light-setup`) and `four` (the 4×4 fixture, shot `<w>-light-setup-four`, which checks the board side B), 12 cases; coverage is `sampled`, never continuum. Geometry does not depend on the colour scheme, so the cases are light. The stricter instruments that run before a block-done claim are the per-shot gate `npm run check:visual` and the per-block pixel crop of `scripts/visual-block.mjs` over the 48 setup shots, and a fine-step sweep of the floor and the no-cut checks (the same spec with the environment variable `SETUP_SHEET_SWEEP=1`, off by default: widths 320 to 1440 in steps of 16 px at the heights 568, 650, 700, 768, 900 and 1024, both states); the sweep is a finer sample, not a continuum claim.

Traces: FR-96, FR-65, FR-99, NFR-14, NFR-12, A-60, A-57

#### Scenario: The phone regime

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test reads the rule that is exactly `.setup-sheet` outside any at-rule
- **THEN** it declares `position: fixed`, `inset: auto 0 0 0`, `width: 100%`, `max-width: none`, `margin: 0`, `overflow-y: auto`, `border-radius: var(--radius-l) var(--radius-l) 0 0` and `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`
- **AND** it declares `max-height` exactly twice, `90vh` first and `88dvh` second, so the browser that does not know `dvh` keeps `90vh`
- **AND** the rule that is exactly `.setup-sheet` inside `@media (max-width: 22.5rem)` declares `max-height: calc(100dvh - 9rem)` and `padding-top: 1rem`, and the base rule's `padding-top` is `1.5rem` (through the `padding` shorthand)

#### Scenario: The small phone tightens the cards

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules `.level-control` and `.level-control button` inside `@media (max-width: 22.5rem)`
- **THEN** the first declares `gap: 0.375rem` and the second `padding: 0.375rem 0.625rem`, and the same rules outside any at-rule declare `gap: 0.5rem` and `padding: 0.5rem 0.75rem`
- **AND** no `min-height` of `.setup-start`, `.setup-close` or `.level-control button` is declared inside an at-rule

#### Scenario: From 48rem the sheet covers the page from 6rem

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule that is exactly `.setup-sheet` inside `@media (min-width: 48rem)` (there is exactly one)
- **THEN** it declares `inset: 0`, `width: calc(var(--column) + 1rem)`, `height: fit-content`, `max-height: calc(100dvh - 7rem)`, `min-height: min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 8.5rem))`, `margin: 6rem auto auto`, `padding-bottom: 1rem`, `border-width: 1px` and `border-radius: var(--radius-l)`
- **AND** it declares no `box-shadow` other than `0 1rem 2.5rem var(--color-shadow-panel)`, no `border-color` other than `var(--color-overlay-border)` and no `background-color` other than `var(--color-surface-raised)` (the shell's bindings, which the rule keeps), each at most once

#### Scenario: On a tall window the sheet hangs under the summary button

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule that is exactly `.setup-sheet` inside `@media (min-width: 48rem) and (min-height: 44rem)` (there is exactly one)
- **THEN** it declares `inset: 0 0 auto 0`, `width: var(--column)`, `max-height: calc(100dvh - 10.75rem)`, `min-height: min(calc(100dvh - 10.75rem), calc(min(var(--board-width), var(--column)) + 4.75rem))` and `margin: 9.75rem auto 0`
- **AND** the block comes after the `@media (min-width: 48rem)` block that holds the `.setup-sheet` rule (the stylesheet has several 48rem blocks), so it wins by source order, and it declares no `box-shadow`, `border-color` or `background-color`

#### Scenario: The sheet reads the board side through the root

- **GIVEN** the parsed `src/ui/style.css` and its raw text
- **WHEN** the test reads the two `min-height` values above and counts `:has(`
- **THEN** each reads `var(--board-width)` and `var(--column)`, the raw text contains `:has(` exactly once (the idle-line rule), and no rule whose selector begins with `.board` declares `--board-width`
- **AND** no rule that is exactly `.setup-sheet` declares `display`, and no rule that is exactly `.setup-sheet` declares `line-height` (the placeholder `line-height: normal` is gone), at any width

#### Scenario: The description starts under the name

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule for `.level-text`, the ring rule `.level-control button .level-name::before` and the rule `.level-control .level-name`
- **THEN** the description declares `padding-left: calc(0.875rem + 0.5rem)`, the ring declares `width: 0.875rem` and `height: 0.875rem`, and the name declares `gap: 0.5rem`, so the indent equals the ring's width plus the gap

#### Scenario: The cards are painted as the design paints them

- **GIVEN** the parsed `src/ui/style.css` and the mounted page
- **WHEN** the test reads the rules `.level-control button`, `.level-control button[aria-checked='true']`, `.level-control button[aria-disabled='true']`, `.level-control button .level-name::before`, `.level-control button[aria-checked='true'] .level-name::before` and `.level-control button[aria-disabled='true'] .level-name::before`
- **THEN** the plain card declares `border-color: var(--color-option-border)`, `background-color: var(--color-control-bg)` and `color: var(--color-text)`, and a 2px solid border; the checked card `border-color: var(--color-primary)` and `background-color: var(--color-primary-soft)`; the unavailable card `border-style: dashed`, `border-color: var(--color-control-border)`, `background-color: var(--color-page)` and `color: var(--color-text-muted)`
- **AND** the plain ring declares `border-color: var(--color-control-border)` at 2px and `background-color: var(--color-control-bg)`; the checked ring declares `border-color: var(--color-primary)` and a `background-image` equal to `radial-gradient(circle, var(--color-primary) 0 40%, var(--color-control-bg) 45%)` (whitespace aside); the unavailable ring declares `border-style: dashed` and `background-color: transparent`
- **AND** none of the six rules declares `box-shadow`, so the unavailable card has no inset shadow (SQ-2) and the checked ring no inset dot (SQ-3 A), and the rule `.level-text` declares `color: var(--color-text-muted)` while the rule `.level-control button[aria-checked='true'] .level-text` declares `color: var(--color-text)`

#### Scenario: The reason line has its accent

- **GIVEN** the parsed `src/ui/style.css` and the mounted page (the rule that matches `[data-level-reason]` is found by matching the element against the selectors)
- **WHEN** the test reads its declarations
- **THEN** `border-left` is `3px solid var(--color-primary)`, `color` is `var(--color-text)`, `font-size` is `0.875rem` and `line-height` is `1.35`

#### Scenario: Only the size options in the sheet take the primary paint

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads `.size-control button[aria-checked='true']`, `.theme-control button[aria-checked='true']` and `.language-control button[aria-checked='true']`
- **THEN** the first declares `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)`, `color: var(--color-text)` and `font-weight: 700`, and the rule `.size-control button` declares `color: var(--color-text-muted)`, `background-color: var(--color-control-bg)` and `font-weight: 500`
- **AND** the other two still declare `border-color: var(--color-focus)` and `background-color: var(--color-given-bg)`, so the theme and language options are not changed by this change

#### Scenario: «Почати» is filled and «Закрити» has a border

- **GIVEN** the parsed `src/ui/style.css` and the mounted page
- **WHEN** the test reads the rule that matches `[data-action="setup-start"]` and not `[data-action="setup-close"]`, and the rules `.setup-close`
- **THEN** «Почати» declares `background-color: var(--color-primary)`, `border-color: var(--color-primary)`, `color: var(--color-primary-text)`, `padding: 0 0.75rem` and `font-weight: 700`
- **AND** «Закрити» declares `border-color: var(--color-control-border)`, a 2px border width and `padding: 0 0.5rem`, and its `background-color` is still `var(--color-surface-raised)`

#### Scenario: The level margin and the scroll padding keep the focus ring clear

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads `.setup-sheet > [data-control='level']` and `.setup-sheet:popover-open`
- **THEN** the first declares `margin-bottom: 28px` outside any at-rule (no media rule changes it), and the second declares a `scroll-padding-bottom` of at least `calc(2.75rem + 48px)`
- **AND** the e2e walk of «Cells and buttons show a visible, unobscured focus indicator» (320×700, 1366×650, 320×568, 375×600) stays green, and the walk asserts its premise (the sheet scrolls with «Поле 4×4» marked) at each of the four viewports (the 375-wide case moved from 375×667, where the sheet now fits and does not scroll; the user's decision of 2026-10-11, `docs/qa/update-setup-sheet/green-run.txt`, open finding 2)

#### Scenario: The sheet has no motion and no new colour literal

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test collects the rules whose selector begins with `.setup-sheet` or `.level-control`, and applies the colour scan of «Borders, cues and focus rings have enough contrast» to them
- **THEN** none is inside `@media (prefers-reduced-motion: no-preference)` or an `@starting-style` rule, none declares `transition` or `animation`, and the scan finds no colour literal, no named colour and no `color-mix(`
- **AND** the gradient of the checked ring has its colours as `var(--color-...)` tokens

#### Scenario: The sheet matches the design's box in a real browser

- **GIVEN** the built page in Chromium with the browser setup of `playwright.config.ts`, the design's capture board of the case (FR-119: the 6×6 fixture, or the 4×4 fixture for the `four` states), and the 12 cases of the key `setupSheet` of `quality/design-geometry.json` (320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900, each in the default and the `four` state; e2e, sampled)
- **WHEN** the test opens the sheet with the summary button, asserts that it is `:popover-open`, and reads `getBoundingClientRect()` of `[data-section="setup"]` and of the description of the first level button (`[data-section="setup"] [data-control="level"] button:first-of-type .level-text`, found by this selector on both sides)
- **THEN** each of the four edges of the sheet's box is within 0.5 px of the case's `expected` box, and the left edge of the description is within 0.5 px of the case's `boxes` value (the design's own)
- **AND** a miss is reported with the case, the element, the page's box, the `expected` box and the design's own `boxes` beside them, and the test asserts that the key records the 28px deviation with its reason (A-60, SQ-5), so the departure is visible in the fixture and cannot widen silently
- **AND** the computed `line-height` of the sheet equals the computed `line-height` of `body`, and a mismatch is reported with the case and both computed line heights, never as a pass
- **AND** the computed `margin-bottom` of `[data-control="level"]` is `28px` at every one of the six viewports (the departure is real in the page, not only recorded)

#### Scenario: The sheet ends below the button row and cuts no line of text

- **GIVEN** the same six viewports and the two states, the sheet open
- **WHEN** the test reads the sheet's box S, the bottom of the action button row R (the bottom of `[data-action="hint"]`), the window height H and the ink band I of the idle line `[data-message="idle"]` (visible in these states): from the ink top of its first line to the ink bottom of its last line, measured in the browser from the line boxes of its text (`Range.getClientRects()`) and the font's metrics of the idle text (`CanvasRenderingContext2D.measureText` with the computed font: ink top = first line's top + `fontBoundingBoxAscent` − `actualBoundingBoxAscent`; ink bottom = last line's top + `fontBoundingBoxAscent` + `actualBoundingBoxDescent`)
- **THEN** at 768×1024, 1024×768, 1366×650 and 1440×900, S.bottom is at least `min(R + 8, H - 16)` less 0.5 px (the sheet ends at least 0.5rem below the button row, or at the window's limit when that is higher)
- **AND** at all six viewports neither S.top nor S.bottom lies strictly inside I (more than 0.5 px from I.top and from I.bottom), so no edge of the sheet cuts the idle line's text, which is wholly covered or wholly clear (an edge that lies at the window's limit, within 0.5 px of 0 or of H, is the window's edge, not a cut by the sheet, and is not counted; the user's decision of 2026-10-11, `docs/qa/update-setup-sheet/sweep.txt`); the edge may lie in the line's box above or below the ink (the design's own sheet ends 0.8 px inside the idle line's box at 1024×768, and the page, with the 28px departure, 4.8 px; the user's decision of 2026-10-11 to check the ink, not the box, `docs/qa/update-setup-sheet/green-run.txt`, open finding 1); a viewport that fails is a finding, not a licence to loosen the check
- **AND** at 1366×650 the idle line is wholly covered or wholly clear in both states (the case of `docs/qa/update-page-layout-geometry/stills/1366-dark-setup.png`, the cut line under the sheet)

#### Scenario: The fixture adds one key and changes nothing else

- **GIVEN** `quality/design-geometry.json` after the refreeze
- **WHEN** the test reads its keys
- **THEN** `cases` still holds exactly the 32 shots that `e2e/nfr-14-layout-geometry.spec.ts` pins, `selectors` and `tolerancePx` are unchanged, the top-level `provenance` has the same `designCommit` and `designCssSha1` as before (its `designBuildSha1` and `browser` are the recorded ones, kept by the script), a key `rulesPanel` (if the rules-panel block froze it first) is unchanged, and the new key `setupSheet` holds `selectors` (`[data-section="setup"]` and the first description), `coverage: "sampled"`, `setupSheet.provenance` recording the `designCommit`, `designCssSha1`, `designBuildSha1` and `browser` of the run that froze it, the recorded deviation (rule, design value, product value, reason, and the cases whose `decidedBy` is `content`) and exactly the 12 cases, each with its `boxes` (the design's), its `expected` boxes (the design with the 28px margin) and its `layout`: the design sheet's `scrollHeight`, `clientHeight`, resolved `min-height` and `max-height` in px and `decidedBy`, which is `min-height`, `max-height` or `content` according to which of the three equals the box's height, and `expectedDecidedBy`, the same for the `expected` box (the margin's growth stops at the cap), so the report says which bound each case checks
- **AND** the spec names the viewports and the states as its sampling dimensions, declares `coverage` `sampled`, names `npm run check:visual`, `scripts/visual-block.mjs` and the sweep as the stricter instruments, and claims neither all widths nor a pixel floor
