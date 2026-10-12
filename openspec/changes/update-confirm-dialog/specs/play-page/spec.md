## MODIFIED Requirements

### Requirement: Borders, cues and focus rings have enough contrast

The stylesheet SHALL define its colours once, as custom properties in the top-level `:root` rule, and every colour a rule uses SHALL be a `var(--color-...)` reference to one of them (FR-65), with one narrow exception: the system colour keyword `ButtonText` in the forced-colours block of the cause mark (see the colour scan below and «A violation shows a cue besides colour»; the user adopted that rule on 2026-10-11). The tokens are the 33 that the page binds in the G2 palette: the 25 of the main column (A-57, block 2), the 2 backdrop tokens (G2 block 3, update-page-backdrop), the 4 shell tokens (G2 shell slice, update-panel-shell), the 1 setup-sheet token (G2 setup-sheet block, update-setup-sheet) that the appendix assigns to the setup sheet and the 1 dialog token (G2 dialog block, update-confirm-dialog) that the appendix assigns to the confirmation dialog, which the last four changes bind, with the light value in the top-level `:root` and the dark value in `:root[data-theme="dark"]`:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-page` | `#f7f3ea` | `#1a1714` | page background; the `theme-color` copies |
| `--color-text` | `#1e2126` | `#f1ede4` | page text, header, button text, hinted digit |
| `--color-text-muted` | `#5f5549` | `#b8b0a4` | idle line, «Скинути», secondary text; in the setup sheet the level descriptions, the text of an unavailable level and the text of an unchecked size option; in the settings panel the text of an unchosen theme or language option (A-61) |
| `--color-cell-bg` | `#fffdf8` | `#24201b` | cell fill |
| `--color-control-bg` | `#fffdf8` | `#24201b` | button and summary fill |
| `--color-line` | `#e2dbcc` | `#3a332b` | board plate and border; the cell's bottom inset line |
| `--color-cell-border` | `#847b6d` | `#8a7f71` | cell border |
| `--color-control-border` | `#8c8374` | `#8a7f71` | header, summary and close-button borders; in the setup sheet the radio ring, the border of an unavailable level and the border of «Закрити» |
| `--color-given-bg` | `#ddd3be` | `#4d4438` | given fill |
| `--color-given-border` | `#847b6d` | `#8a7f71` | given border, 1px |
| `--color-given-text` | `#1e2126` | `#f7f3ea` | given digit |
| `--color-entry-text` | `#a8400c` | `#f7a46a` | player's digit |
| `--color-primary` | `#b4460d` | `#f39a5b` | «Підказка» fill, «Нова головоломка» border, hinted border, hint accent, summary cue, logo; in the setup sheet the checked level and size option border, the radio ring's dot, the reason line's accent, «Почати» fill and border; in the settings panel the frame of the chosen theme or language option (A-61); in the confirmation dialog the fill and border of «Скасувати» (A-62) |
| `--color-primary-text` | `#fffdf8` | `#1a1007` | text on a primary fill; the logo's cells; in the confirmation dialog the text of «Скасувати» (A-62) |
| `--color-primary-soft` | `#f6e3d4` | `#3d2b1e` | hinted fill, hint line fill; in the setup sheet the checked level and size option fill; in the settings panel the fill of the chosen theme or language option (A-61) |
| `--color-hover-ring` | `#d28f6b` | `#a06941` | the cell's hover ring |
| `--color-violation-bg` | `#fbe4e1` | `#3f2320` | violation fill; in the confirmation dialog the fill of «Так, почати» (A-62) |
| `--color-violation-border` | `#b3261e` | `#ff8a7d` | violation border; in the confirmation dialog the 2px frame of «Так, почати» (decoration there, A-62: not a contrast pair) |
| `--color-violation-stripe` | `#f1c9c6` | `#5e332f` | the stripes of a violating cell |
| `--color-violation-text` | `#8f1d17` | `#ff8a7d` | violating digit |
| `--color-success` | `#2f6b3a` | `#8fd19a` | win line border, solved board border and ring |
| `--color-success-bg` | `#e2efdf` | `#1f3324` | win line fill, solved board plate |
| `--color-success-glow` | `#2f6b3a73` | `#8fd19a73` | the win glow keyframes (translucent) |
| `--color-win-text` | `#1e2126` | `#f1ede4` | win line text |
| `--color-focus` | `#1e2126` | `#f1ede4` | every focus ring |
| `--color-violation-ink` | `#8f1d17` | `#ffb4ab` | text of «Так, почати» in the confirmation dialog (A-62) |
| `--color-backdrop-soft` | `#46280f38` | `#08050273` | backdrop of the settings panel, the setup sheet and the rules panel below 64rem (translucent) |
| `--color-backdrop-strong` | `#2d190a80` | `#08050299` | backdrop of the confirmation dialog and the rules panel from 64rem (translucent) |
| `--color-surface-raised` | `#fffdf8` | `#2c2620` | fill of the rules panel, the setup sheet, the settings panel and the confirmation dialog; the setup sheet's footer strip; the fill of «Закрити» in the sheet and in the settings panel |
| `--color-overlay-border` | `#e2dbcc` | `#8a7f71` | border colour of the rules panel, the setup sheet and the settings panel |
| `--color-shadow-panel` | `#00000040` | `#00000040` | drop shadow of the three panels from 48rem and of the confirmation dialog at every width (translucent) |
| `--color-shadow-sheet` | `#0000002e` | `#0000002e` | drop shadow of the three panels below 48rem (translucent) |
| `--color-option-border` | `#c4b59c` | `#5a5045` | border of an available level card in the setup sheet (decoration, A-60; in no contrast pair) |

These are the "block 2" rows of the appendix to A-57 in `docs/requirements.md`, the two backdrop rows that the appendix marks "later" and that G2 block 3 binds, the four shell rows that the appendix marks "later" and that the shell change (update-panel-shell) binds, the one setup-sheet row that the appendix assigns to the setup sheet and that update-setup-sheet binds, and the one dialog row that the appendix marks "later" and that this change (update-confirm-dialog) binds, value for value; the appendix is the source, this table is what the stylesheet declares (the role column of the two backdrop rows says which surfaces bind each, and the role column of the four shell rows says which surfaces and parts bind each, which the appendix's short roles "sheet, panel and dialog fill", "panel border", "panel drop shadow" and "phone sheet shadow" abbreviate; see «The backdrops take the design's translucent tokens» and «The panels take the shared surface paint»; the role column of the setup-sheet rows says what they paint in the sheet, see «The setup sheet takes the design's size, place and paint»; the role column of the dialog row, and the roles of `--color-primary`, `--color-primary-text`, `--color-violation-bg` and `--color-violation-border` in the dialog, say what they paint in it, see «The confirmation dialog takes the design's size, place and paint»; the roles of `--color-text-muted`, `--color-primary` and `--color-primary-soft` in the settings panel are worded from A-61). `--color-violation-ink` was the last row of the appendix that no block had bound (the appendix still marks six bound rows "later"): this requirement declares it, with its one pair, and «The confirmation dialog takes the design's size, place and paint» binds it, so the stylesheet never holds an unused token and no appendix row remains that this table does not declare. `--color-option-border` was the setup-sheet block's row: this requirement declares it, and «The setup sheet takes the design's size, place and paint» binds it. The row `--color-shadow-sunken` was withdrawn on 2026-10-11 (the appendix to A-57): the design dropped the inset it served. A value is a literal `#rrggbb`. A value may be `#rrggbbaa` only for a token that the list marks translucent, and the list marks five, `--color-success-glow`, `--color-backdrop-soft`, `--color-backdrop-strong`, `--color-shadow-panel` and `--color-shadow-sheet`; a translucent token is never the foreground or the background of a contrast pair, a backdrop is checked composited over the page instead (FR-65, see «Effective theme on the document»), and a shadow is decoration that holds no text and marks no component, so it is checked by no pair (its binding is pinned by «The panels take the shared surface paint»). `--color-option-border` is a `#rrggbb` token that is in no pair either, by decision: the available level card's 2px border is decoration (A-60, SQ-1 A), because WCAG 1.4.11 asks 3:1 only for what is needed to identify a component or its state and a text-labelled card is identified by its text and its radio ring; its ratios are 1.98 against the card (`--color-control-bg`) and 1.98 against the sheet (`--color-surface-raised`) in light and 2.06 and 1.90 in dark, below 3:1 on purpose, and a test pins that no pair names it. The 2px `--color-violation-border` frame of «Так, почати» in the confirmation dialog is decoration in the same way and in no pair (A-62): the button is identified by its text, which is a pair (`--color-violation-ink` on `--color-violation-bg`), and the frame's ratio against the dialog fill, 6.43 in light and 6.54 in dark, is recorded and not relied on; `--color-violation-border` stays in its existing pairs and gains none. The top-level `:root` also declares `color-scheme: light` and `:root[data-theme="dark"]` declares `color-scheme: dark`, and nothing else: `:root` holds only the colour tokens and `color-scheme` (the non-colour variables live on `#app`, as the layout variables do).

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
- `--color-violation-ink` against `--color-violation-bg` (the text of «Так, почати» in the confirmation dialog, A-62);
- `--color-primary-text` against `--color-primary`;
- `--color-win-text` against `--color-success-bg`.

Traces: FR-65, FR-64, FR-120, FR-67, A-57, A-58, A-60, A-62, NFR-9, NFR-14, FR-104

#### Scenario: Tokens exist and are literal

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test reads the declarations of the top-level `:root` rule
- **THEN** each of the 33 token names of the list above is declared once, with the light value of the list, `#rrggbb` for 28 of them and `#rrggbbaa` for the five translucent tokens only (`--color-success-glow`, `--color-backdrop-soft`, `--color-backdrop-strong`, `--color-shadow-panel` and `--color-shadow-sheet`)
- **AND** the rule `:root[data-theme="dark"]` declares each of the same 33 names once with the dark value of the list, so each token has exactly two value sets and the dark block redefines every token of the list and adds none
- **AND** the top-level `:root` declares no property other than the 33 tokens and `color-scheme`, and a translucent token appears in no contrast pair

#### Scenario: Every declared token is bound by a rule

- **GIVEN** the text of `src/ui/style.css`
- **WHEN** the test counts, for each of the 33 tokens, the declarations outside `:root` whose value contains `var(<token>)`
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
- **AND** the pair against the stripe is in `CONTRAST_PAIRS` (group `cause-cue`) and the pair against the fill is the existing violation cue pair, so the list holds 42 pairs (the 35 of the cause-cue change, the 3 pairs on `--color-surface-raised`, the 3 ring pairs of the setup-sheet change and the 1 pair of the dialog change)
- **AND** the stripe is not a cue (its ratio against the fill stays below 3), and the mark has no token of its own: the token list is the 33 of the table

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
- **WHEN** the test computes the ratio of `--color-control-border` against `--color-page` and against `--color-control-bg`, and the ratios of the 4.5:1 list above: `--color-text` against `--color-page`, `--color-cell-bg`, `--color-given-bg`, `--color-control-bg`, `--color-primary-soft` and `--color-surface-raised`; `--color-given-text` against `--color-given-bg`; `--color-entry-text` against `--color-cell-bg`; `--color-text-muted` against `--color-page`, `--color-cell-bg`, `--color-control-bg` and `--color-surface-raised`; `--color-violation-text` against `--color-violation-bg` and `--color-violation-stripe`; `--color-violation-ink` against `--color-violation-bg`; `--color-primary-text` against `--color-primary`; and `--color-win-text` against `--color-success-bg`
- **THEN** the first two ratios are at least 3 (3.38 and 3.68 light, 4.55 and 4.13 dark) and every other ratio is at least 4.5

#### Scenario: The raised surface carries the text and the focus ring

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and `CONTRAST_PAIRS` of the test helpers
- **WHEN** the test computes the ratio of `--color-text`, of `--color-text-muted` and of `--color-focus` against `--color-surface-raised` (the fill of the rules panel, the setup sheet, the settings panel and the confirmation dialog, which no earlier pair covers: in dark `#2c2620` equals no other background)
- **THEN** the ratios are 15.88 and 12.79 for the text, 7.17 and 6.96 for the muted text and 15.88 and 12.79 for the focus ring (light, dark), each at least 4.5 for the two text pairs and at least 3 for the focus pair
- **AND** the three pairs are in `CONTRAST_PAIRS` (the first two in group `text`, the third in group `focus-ring`), the list holds 42 pairs (4 cell border, 4 violation cue, 1 cause cue, 5 hinted cue and primary, 9 focus ring, 2 control border and 17 text), and no pair names `--color-overlay-border`, `--color-shadow-panel`, `--color-shadow-sheet` or `--color-option-border` (the setup-sheet change adds a fourth pair on this fill, `--color-primary` on `--color-surface-raised`, group `hinted-cue`)

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

#### Scenario: The dialog's warning text has 4.5:1 and its frame is decoration

- **GIVEN** the resolved colours of the tokens of each token set (light, then dark) and `CONTRAST_PAIRS` of the test helpers
- **WHEN** the test computes the ratio of `--color-violation-ink` against `--color-violation-bg` (the text of «Так, почати» on its fill) and of `--color-violation-border` against `--color-surface-raised` (the button's frame on the dialog fill), and looks for the token and the frame pair in the list
- **THEN** the text ratio is 7.34 in light and 8.40 in dark, each at least 4.5, and the frame ratio is 6.43 in light and 6.54 in dark (recorded)
- **AND** `--color-violation-ink` is a `#rrggbb` value (`#8f1d17` light, `#ffb4ab` dark) and not in the translucent set, the pair (`--color-violation-ink`, `--color-violation-bg`) is in `CONTRAST_PAIRS` in the group `text`, and no pair of `CONTRAST_PAIRS` names `--color-violation-border` with `--color-surface-raised`
- **AND** the stylesheet binds the token: at least one declaration outside `:root` has the value `var(--color-violation-ink)` (the `color` of «Так, почати»)

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

Traces: NFR-14, NFR-10, NFR-12, FR-68, FR-119, A-60, A-62

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
- **THEN** both sets equal the 33 tokens and values of the table of «Borders, cues and focus rings have enough contrast» (the 25 block-2 tokens, the 2 backdrop tokens, the 4 shell tokens, the 1 setup-sheet token and the 1 dialog token `--color-violation-ink` of the appendix to A-57, that the last four changes bind), and no other `--color-*` token is declared

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

Traces: NFR-14, FR-65, A-57, A-60, A-62

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
- **AND** no pair names `--color-overlay-border`, `--color-shadow-panel`, `--color-shadow-sheet` or `--color-option-border`, and the list holds 42 pairs

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

### Requirement: The rules panel takes the design's size, place and paint

The rules panel `[data-section="rules"]` SHALL take the design's size, place and paint (NFR-14, FR-57, FR-65, A-59; G2 rules-panel block `update-rules-panel`; `design/v0/app/binarka.css` lines 805-962, 1018-1047 and 1122-1152, shown by `design/v0-screenshots/review-set-14/`). The panel's fill, border colour and drop shadow are those of «The panels take the shared surface paint» and are not restated here; the root's `data-size` is that of «The page root carries the board size». This requirement declares no colour token and adds no contrast pair. "The panel's rules" in this requirement means the rules whose selector is `.rules`, starts with `.rules `, `.rules:`, `.rules>`, `.rules >` or `.rules[`, or is `.rules-close`, `.rule-example`, `.mini`, `.mini-answer` or `.mini-sep`; it never means `.rules-button`, the header's «Правила» button, which is outside this block. The shell's bindings of the rules panel (`background-color`, `border-color` and `box-shadow`, each once in its rule) stay exactly as «The panels take the shared surface paint» lists them.

The panel has three regimes. The stylesheet SHALL declare them as follows (a value is the design's; "the page keeps" names what the page already declares and this change does not touch):

| Regime | Rule (selector) and place | Declarations |
|---|---|---|
| Below 48rem: a bottom sheet | `.rules`, the top-level rule | `position: fixed`; `inset: auto 0 0 0`; `width: 100%`; `max-width: none`; `max-height` declared twice, `60vh` first and `55dvh` after it (the fallback); `margin: 0`; `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`; `overflow-y: auto`; `border-radius: 1rem 1rem 0 0`; the page keeps `box-sizing: border-box` and its border widths (1px, none at the bottom) |
| the same, at 22.5rem and below | `.rules` and `.mini` inside `@media (max-width: 22.5rem)`, in a block later in the file than the top-level `.rules` and `.mini` rules (an earlier block would lose to their `padding` and `width` at the same specificity) | `.rules`: `padding-top: 1rem`; `.mini`: `width: 1.5rem`, `height: 1.5rem`, `font-size: 0.875rem` |
| From 48rem to 64rem: a panel the column's width plus 1rem | `.rules` inside `@media (min-width: 48rem)` | `inset: 0`; `width: calc(var(--column) + 1rem)`; `max-width: calc(100% - 2rem)` (today's cap, kept, RQ-2); `height: fit-content`; `max-height: calc(100dvh - 7rem)`; `margin: 6rem auto auto`; `padding-bottom: 1rem`, so the padding is 1.5rem 1rem 1rem and the old `padding: 24px` is gone; 1px border on all four sides; `border-radius: 1rem`; `min-height: min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 13.875rem))` |
| the same | `.rules:popover-open` inside `@media (min-width: 48rem)` | `display: flex`; `flex-direction: column` |
| the same | `.rules > *` and `.rules-close` and the techniques section, inside `@media (min-width: 48rem)`, in a block later in the file than the top-level `.rules-close` and `.rules [data-section='techniques']` rules (an earlier block would lose to the top-level `margin` at the same specificity); `.rules:popover-open` may sit in the same later block | `.rules > *`: `flex-shrink: 0`; `.rules [data-section='techniques']`: `margin-top: 0`; `.rules-close`: `margin-top: auto` (spare height sits above «Зрозуміло», never below it) |
| From 64rem: one column 40rem wide | `.rules` inside `@media (min-width: 64rem)`, after the 48rem block in the file | `width: 40rem`; `height: fit-content`; `min-height: 0`; `padding-top: 1rem`; the cap `max-width: calc(100% - 2rem)` still applies |
| the same | `.rules h2`, `.rules ul`, `.rules li` inside `@media (min-width: 64rem)` | `h2`: `margin-bottom: 0.25rem`; `ul`: `margin-bottom: 0.5rem`; `li`: `padding: 0.3125rem 0` |

Five points of the table are part of the requirement. (1) **The flex column is `.rules:popover-open`, never the bare `.rules`**: a `display` on the bare rule would override the user agent's `display: none` of a closed popover and show the panel at load. No rule whose selector is exactly `.rules` declares `display`. (2) **The `min-height` reads the board side through the root.** B = min(`--board-width`, `--column`): `--board-width` is declared on `#app` by the shell (the root's `data-size`) and `--column` on `#app` from 48rem, and the panel is inside `#app`, so a 4×4 board gives a shorter panel than a 6×6 one and a short window caps it at the window less 7rem. The constant 13.875rem is the design's (the 1rem gap, the board, the 1rem gap, the 2.75rem button row, the 0.5rem gap and the three reserved message lines, down from the summary button's bottom at 9.25rem). It is a floor for the panel's height, not a guarantee: taller contents grow the panel up to its `max-height`, and the panel is not claimed to end in empty page space for every content. (3) **From 64rem the `min-height: 0` wins by source order**: the 64rem block comes after the 48rem block's `.rules` rule, and both selectors are `.rules`. (4) **The 2rem cap is today's rule, not the design's** (the design has no cap): at every width from 48rem the cap is above the column plus 1rem and above 40rem (the window is at least 48rem), so it changes no box; it is kept because the signed FR-57 says "never wider than the window less 2rem" (RQ-2). (5) **The backdrop is not restated**: the `.rules::backdrop` and `.rules:popover-open::backdrop` rules of «The backdrops take the design's translucent tokens» stay as they are.

**«Зрозуміло» is sticky at the panel's bottom and filled with the primary colour, at every width.** The rule `.rules-close` SHALL declare `position: sticky`; `bottom: 0`; `box-shadow: 0 0 0 1rem var(--color-surface-raised), 0 1rem 0 1rem var(--color-surface-raised)` (the design's mask: text scrolling under the button is hidden, and the second shadow also covers the panel's bottom padding); `width: 100%`; `min-height: 2.75rem`; `padding: 1px 6px`; `border-width: 2px`, `border-style: solid` and `border-color: var(--color-primary)`; `border-radius: 0.625rem`; `background-color: var(--color-primary)`; `color: var(--color-primary-text)`; `font-weight: 700` (FR-65). The `padding` is the design's effective value, not a design declaration: the design has no base `button` rule, so its `.rules-close` gets the user agent's button padding (`1px 6px` in Chromium) and its `min-height: 2.75rem` decides the 44 px height, whereas the page's base `button` rule (`padding: 10px 16px`) would make the box 48 px tall; the session reads the design's computed `padding` on the frozen build to confirm the value, and the geometry test decides. It keeps the base `button:focus-visible` indicator (3px, 2px offset, `--color-focus`): no focus rule is added, and the ring on the panel fill is the existing pair `--color-focus` on `--color-surface-raised` (15.88 light, 12.79 dark). The text pair `--color-primary-text` on `--color-primary` (5.40 light, 8.55 dark) is already in the list of «Borders, cues and focus rings have enough contrast». The sticky button is in view when the browser focuses it as the popover's `autofocus` target, so the first opening does not scroll the panel to «Зрозуміло» (`docs/qa/prep-g2/rules-open-probe.txt`); the second and later openings are covered by the reset of «Rules panel» (`docs/qa/prep-g2/rules-reopen-probe.txt`).

**The paint of the list and the examples** is this, each with the longhand the colour scan reads: the separator of each item of the rules panel (`.rules li`) has `border-top-color: var(--color-line)` (it was `--color-given-bg`); the decorative example cell `.mini` (`aria-hidden`, A-26) has `border-color: var(--color-control-border)`, `background-color: var(--color-page)` and `color: var(--color-entry-text)`; the answer cell `.mini-answer` has a 2px dashed border in `--color-primary` (it was `--color-focus`), `background-color: var(--color-primary-soft)` and `color: var(--color-text)`, italic, weight 700; the separator sign `.mini-sep` keeps `--color-text-muted`. The example cell's border is `--color-control-border`, not `--color-cell-border`: the design's `--cell-border` has the values of the page's `--color-control-border` (light `#8c8374`, dark `#8a7f71`), and `--color-cell-border` is the light `#847b6d` that A-57 darkened for the board's cells only. The examples are decoration and in no contrast pair; for the record `--color-entry-text` on `--color-page` is 5.57 (light) and 8.90 (dark), and `--color-text` on `--color-primary-soft` is 12.96 and 11.50. After the port none of the panel's rules declares `--color-given-bg`, and none declares a colour other than a `var(--color-...)` token.

**The inner metrics are the design's, because from 64rem the panel is as tall as its contents** and so the box test below compares them: `.rules h2` 1.125rem, weight 700, margin `0 0 0.5rem`; `.rules ul` margin `0 0 1rem`, `padding: 0`, `list-style: none`; `.rules li` `display: flex`, `flex-direction: column`, `gap: 0.5rem`, padding `0.5rem 0`, `font-size: 0.9375rem`, `line-height: 1.45`; `.rules [data-section='techniques']` margin `0.5rem 0 0`; `.rules h3` 1rem, weight 700, margin `0 0 0.5rem`; `.rule-example` `display: flex`, `align-items: center`, `gap: 0.1875rem`; `.mini` `width: 1.75rem`, `height: 1.75rem`, `font-size: 0.9375rem`, `font-weight: 500`, `font-variant-numeric: tabular-nums`, `border-radius: 0.375rem`; `.mini-sep` padding `0 0.5rem`. (The page's heading is 1.1rem, its items have a 6px gap and line height 1.4, and it has no rule for the techniques section or for `h3`, so these are changes; the task that ports them checks each against the geometry cases.)

Intentionally not delivered in this change, so that testers do not report them as bugs: (1) the panel's motion, the slide and fade of `binarka.css` lines 1508-1560 (RQ-4): the gate captures with reduced motion, and the page animates no panel; no rule of the panel sits in `@media (prefers-reduced-motion: no-preference)` or in `@starting-style`; (2) the setup sheet, the settings panel and the confirmation dialog, whose size, place and paint are other blocks'; (3) the design's mask shadow on «Закрити» (the shell does not deliver it either); (4) a new colour token or a new contrast pair; (5) Safari and Firefox, which are not tested (NFR-7), so whether they scroll a stuck sticky button into view is unverified; (6) a pixel floor for any shot: the rules shots are expected to rise, not to reach 0.98 (see the mechanism below); (7) the geometry of the panel in the dark scheme (geometry does not depend on the scheme; the dark paint is checked by the pixel instruments).

The mechanism is stylesheet and jsdom tests, test first, and a browser test. `tests/play-page-rules-panel-stylesheet.test.ts` (`@trace FR-57`, `@trace FR-65`, `@trace NFR-14`) reads the parsed `src/ui/style.css` and, with the injected stylesheet, jsdom's computed style. `e2e/nfr-14-rules-panel.spec.ts` (`@trace NFR-14`, `@trace FR-57`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares the open panel's box and «Зрозуміло»'s box with the design's, frozen in the top-level key `rulesPanel` of `quality/design-geometry.json` (the existing key `cases`, the 16 `selectors` and the 32 cases of `e2e/nfr-14-layout-geometry.spec.ts` are not touched). The freeze script `scripts/freeze-design-geometry.mjs` gains an explicit list of the rules cases, each with its own capture board; the script keeps the recorded top-level `provenance` when `designCommit` and `designCssSha1` are unchanged (today it rewrites the block on every run, and `designBuildSha1` differs between worktrees), and records the build SHA-1 and the browser of this run in `rulesPanel.provenance`; this is an edit of the script, not of the design. On the design side the panel is reached by the design's own route where there is one: the design's `/rules/` route opens the panel at load (a press there would close it), so the six review-set cases and the 800×600 case load `/rules/` and wait for `:popover-open`; the 4×4 case has no route with the panel open, so it loads `/four/` and presses «Правила». On the page side every case loads the page with the case's capture board and presses «Правила» (the recorded `afterLoad` is `open-rules`). The sampled cases are 8: the light shots of `review-set-14` at 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900 with the design's 6×6 fixture board; one viewport where the board is narrower than the column (the 4×4 fixture board at 768×1024); and one short window from 48rem to 64rem (800×600, 6×6), where the window less 7rem caps the panel: that case checks the cap (`max-height`, which equals the cap term of the `min-height` there), not the board-side term. The board-side term is checked by the cases whose recorded `decidedBy` is `min-height`; the freeze records it, and if the 4×4 case turns out to be decided by the content height, it checks that box and not the formula. The browser setup is that of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, light scheme). Coverage is `sampled`, never continuum: the sampling dimensions are the viewport (8 points) and the board size (6×6 and 4×4); nothing between the viewports, no dark scheme, no other board, no hover or focus state is looked at. The stricter instrument that runs before a block-done claim is the per-block pixel crop of `scripts/visual-block.mjs` with a block `rules` (the panel and its close button; it opens the panel on both sides for the geometry channel), over the 20 rules and rules-techniques shots, and then the per-shot gate `npm run check:visual`, and then the full computed-style diff of every element of the panel (the escalation path of `docs/qa/visual-diff/README.md`). This requirement claims no pixel floor for any shot.

In the stylesheet scenarios below, a declared value is compared with whitespace removed and with a bare zero equal to `0px` (jsdom serialises a zero length as `0px`, so `inset: 0` reads `0px` and `padding: 0.3125rem 0` reads `0.3125rem 0px`).

Traces: NFR-14, FR-57, FR-65, A-59, A-26, A-20, A-62

#### Scenario: Below 48rem the panel is a bottom sheet with the design's size

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules, and the raw text of the file (jsdom's CSSOM keeps only the last of two `max-height` declarations and drops a `padding` shorthand that holds `env()`, so those two checks read the raw text of the top-level rule, as the shell's tests do with their raw declaration counts)
- **WHEN** the test reads the top-level rule that is exactly `.rules`
- **THEN** its raw text contains, in this order, `max-height: 60vh` and later `max-height: 55dvh`, and `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))` (whitespace aside); its parsed declarations have `border-radius` equal to `1rem 1rem 0 0`, `position: fixed`, `inset: auto 0 0 0` and `width: 100%`
- **AND** the rule `.rules` inside `@media (max-width: 22.5rem)` declares `padding-top: 1rem`, and the rule `.mini` inside the same block declares `width` and `height` of `1.5rem` and `font-size` `0.875rem`
- **AND** that 22.5rem `.rules` rule and that `.mini` rule come later in the file than the top-level `.rules` and `.mini` rules, and the first rule of the raw text whose selector is exactly `.rules` is still the top-level one (the shell's raw counts read it)

#### Scenario: From 48rem the open panel is a flex column and «Зрозуміло» takes the spare height

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules that are exactly `.rules`, `.rules:popover-open`, `.rules-close` and the techniques section inside `@media (min-width: 48rem)`
- **THEN** `.rules:popover-open` declares `display: flex` and `flex-direction: column`, and `.rules > *` declares `flex-shrink: 0`
- **AND** no rule whose selector is exactly `.rules` declares `display`, at any width and in any at-rule, so a closed panel keeps the user agent's `display: none`
- **AND** the `.rules-close` rule of this block declares `margin-top: auto`, and `.rules [data-section='techniques']` declares `margin-top: 0`
- **AND** those two 48rem rules come later in the file than the top-level `.rules-close` and `.rules [data-section='techniques']` rules, so they win at the same specificity

#### Scenario: From 48rem the panel takes the column's width plus 1rem, 6rem from the top

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rule `.rules` inside `@media (min-width: 48rem)` (the single rule the shell's tests read for its `box-shadow`; the declarations of this scenario are merged into it, not put into a second `.rules` rule of the block)
- **THEN** it declares `inset: 0`, `width: calc(var(--column) + 1rem)`, `max-width: calc(100% - 2rem)`, `height: fit-content`, `max-height: calc(100dvh - 7rem)`, `margin: 6rem auto auto`, `padding-bottom: 1rem`, `border-radius: 1rem` and the `min-height` of the table, and it declares no `padding` shorthand (the old `padding: 24px` is gone)
- **AND** the same rule still declares `box-shadow: 0 1rem 2.5rem var(--color-shadow-panel)` once and `border-color: var(--color-overlay-border)`, as «The panels take the shared surface paint» says

#### Scenario: The min-height reads the board side through the root

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test reads the `min-height` declarations of the rules that are exactly `.rules` and the rules that declare `--board-width` or `--column`
- **THEN** the `min-height` of the 48rem rule is `min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 13.875rem))` (whitespace aside), no rule whose selector starts with `.rules` declares `--board-width`, `--column`, `--n`, `--cell-max`, `--board-gap` or `--board-pad`, and the rules that declare `--board-width` and `--column` have selectors that begin with `#app` (the shell's hook), so the panel inside the root reads the same values as the board
- **AND** the browser check that the variable reaches the panel is the box scenario below, at the cases whose recorded `decidedBy` is `min-height` (at 768×1024 the 4×4 panel is shorter than the 6×6 panel if the 4×4 case is one of them; if it is decided by the content height, the report says so and the 6×6 cases carry the check)

#### Scenario: From 64rem the panel is one 40rem column with tighter spacing

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules inside `@media (min-width: 64rem)` whose selector is exactly `.rules`, `.rules h2`, `.rules ul` and `.rules li`
- **THEN** `.rules` declares `width: 40rem`, `height: fit-content`, `min-height: 0` and `padding-top: 1rem`; `.rules h2` declares `margin-bottom: 0.25rem`; `.rules ul` declares `margin-bottom: 0.5rem`; `.rules li` declares `padding: 0.3125rem 0`
- **AND** the `.rules` rule of the 64rem block is later in the file than the `.rules` rule of the 48rem block that declares `min-height`, and the `max-width: calc(100% - 2rem)` cap is declared in the 48rem block (so it applies from 64rem as well) and in no rule below 48rem
- **AND** `.rules:popover-open::backdrop` is still declared exactly once inside `@media (min-width: 64rem)`, with `--color-backdrop-strong`

#### Scenario: «Зрозуміло» is sticky and filled, with the design's mask

- **GIVEN** the parsed `src/ui/style.css` and the injected stylesheet with the light token values substituted, and then the dark values
- **WHEN** the test reads the top-level rule `.rules-close` and `getComputedStyle` of the panel's close button
- **THEN** the rule declares `position: sticky`, `bottom: 0`, `width: 100%`, `min-height: 2.75rem`, `padding: 1px 6px`, `border-width: 2px`, `border-style: solid`, `border-color: var(--color-primary)`, `border-radius: 0.625rem`, `background-color: var(--color-primary)`, `color: var(--color-primary-text)`, `font-weight: 700` and `box-shadow: 0 0 0 1rem var(--color-surface-raised), 0 1rem 0 1rem var(--color-surface-raised)` (whitespace aside)
- **AND** the computed `position` is `sticky`, `color` is the `--color-primary-text` value and `background-color` and `border-top-color` are the `--color-primary` value, in each token set
- **AND** the stylesheet has no new `:focus-visible` rule for `.rules-close`, the text pair `--color-primary-text` on `--color-primary` is in `CONTRAST_PAIRS` and holds in each token set, and the list is equal to the one the baseline requirement «Borders, cues and focus rings have enough contrast» lists (the test holds a literal copy of that baseline list and compares with it, not with a number; the copy was taken before `update-rules-panel`, which added no pair, and follows the baseline since `update-setup-sheet` added the three ring pairs of FR-65)

#### Scenario: The separators and the example cells take the design's tokens

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules `.rules li`, `.mini`, `.mini-answer` and `.mini-sep`
- **THEN** `.rules li` declares `border-top-color: var(--color-line)`; `.mini` declares `border-color: var(--color-control-border)`, `background-color: var(--color-page)` and `color: var(--color-entry-text)`; `.mini-answer` declares `border-style: dashed`, `border-width: 2px`, `border-color: var(--color-primary)`, `background-color: var(--color-primary-soft)` and `color: var(--color-text)`; `.mini-sep` declares `color: var(--color-text-muted)`
- **AND** none of the panel's rules contains `--color-given-bg`, `--color-cell-border` or `--color-focus` in any declaration

#### Scenario: The inner metrics are the design's

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the top-level rules `.rules h2`, `.rules ul`, `.rules li`, `.rules [data-section='techniques']`, `.rules h3`, `.rule-example` and `.mini`
- **THEN** they declare the values of the paragraph «The inner metrics are the design's» above (heading 1.125rem/700 with `margin: 0 0 0.5rem`; list `margin: 0 0 1rem`; item `gap: 0.5rem`, `padding: 0.5rem 0`, `font-size: 0.9375rem`, `line-height: 1.45`; techniques `margin: 0.5rem 0 0`; `h3` 1rem/700 with `margin: 0 0 0.5rem`; example `display: flex`, `align-items: center`, `gap: 0.1875rem`; cell `width` and `height` `1.75rem`, `font-size: 0.9375rem`, `font-weight: 500`, `font-variant-numeric: tabular-nums`, `border-radius: 0.375rem`; list `padding: 0`, `list-style: none`; item `display: flex`, `flex-direction: column`)

#### Scenario: The panel adds no token, no pair and no colour literal

- **GIVEN** the parsed `src/ui/style.css` and the colour scan of «Borders, cues and focus rings have enough contrast»
- **WHEN** the test applies the scan to every declaration of the panel's rules
- **THEN** it finds no colour literal, no named colour and no `color-mix(`; every `box-shadow` colour is a `var(--color-...)` token; `TOKEN_NAMES` and `CONTRAST_PAIRS` of `tests/helpers/css.ts` were unchanged by `update-rules-panel` and equal the lists of «Borders, cues and focus rings have enough contrast» (33 tokens and 42 pairs since `update-confirm-dialog`; the test holds literal copies of the two baseline lists and compares the exported lists with them, not with numbers, so the rules panel adds no token and no pair of its own)
- **AND** the stylesheet has no `!important`, the raw text contains `:has(` exactly once (the idle-line rule), and no rule of the panel is inside `@media (prefers-reduced-motion: no-preference)` or `@starting-style`

#### Scenario: The rules panel in a real browser has the design's box at the sampled viewports

- **GIVEN** `quality/design-geometry.json` with the key `rulesPanel` frozen from the design build, and the built page in Chromium with the browser setup of `playwright.config.ts`, with the design's fixture board of each case (FR-119)
- **WHEN** the test opens the panel with a press on «Правила» at each of the 8 cases (320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900, the 4×4 board at 768×1024, and 800×600) and reads the `getBoundingClientRect()` of `[data-section="rules"]` and of its close button
- **THEN** the panel is open (`:popover-open`), and each of the four edges of both boxes is within 0.5 px of the frozen box of the case
- **AND** «Зрозуміло» lies inside the panel's box at every case, and the panel's bottom edge less «Зрозуміло»'s bottom edge is at most 17 px (the 1px border and the 1rem padding) at every case
- **AND** a case that differs is reported with the case, the element, the frozen box and the page's box

#### Scenario: The frozen fixture holds exactly the rules cases and the layout cases are untouched

- **GIVEN** `quality/design-geometry.json` after the refreeze
- **WHEN** the e2e test reads it
- **THEN** `rulesPanel.cases` has exactly the 8 shots `320-light-rules`, `375-light-rules`, `768-light-rules`, `1024-light-rules`, `1366-light-rules`, `1440-light-rules`, `768-light-rules-four` and `800-light-rules-short`, its `coverage` is `sampled`, and its `selectors` are `[data-section="rules"]` and `[data-section="rules"] .rules-close`
- **AND** the existing `cases` (the 32 of «Main column layout geometry follows the design reference») and `selectors` (the 16) are byte-for-byte as before, the top-level `provenance` has the same `designCommit` and `designCssSha1` as before (its `designBuildSha1` and `browser` are the recorded ones, kept by the script), `rulesPanel.provenance` records the `designCommit`, `designCssSha1`, `designBuildSha1` and `browser` of the run that froze it, and `e2e/nfr-14-layout-geometry.spec.ts` passes without an edit
- **AND** every case of `rulesPanel` records the design panel's `scrollHeight`, `clientHeight`, resolved `min-height` and `max-height` in px, and `decidedBy`, which is `min-height`, `max-height` or `content` according to which of the three equals the box's height (within 0.5 px; on a tie, `max-height` first, then `min-height`, then `content`), so the report says which bound each case checks

#### Scenario: The filled button keeps its floor, its contrast and the other surfaces

- **GIVEN** the built page, and `e2e/nfr-12-targets.spec.ts` (which measures the rules close button), `e2e/nfr-13-a11y.spec.ts` (its `rules` state, light and dark, at 375×812 and 1280×800), `e2e/nfr-14-backdrop.spec.ts`, `e2e/nfr-14-panel-shell.spec.ts` and `e2e/nfr-14-palette.spec.ts` as they stand before this change
- **WHEN** they run after the port
- **THEN** they pass, and `git diff` of this change shows no edit to those files

#### Scenario: The sampled coverage is declared

- **GIVEN** `e2e/nfr-14-rules-panel.spec.ts`
- **WHEN** a reader looks for the sampling dimensions
- **THEN** the file names the viewports (the 8 cases) and the board sizes as its sampling dimensions, declares coverage `sampled`, names `scripts/visual-block.mjs` (block `rules`) and `npm run check:visual` as the stricter instruments, and claims neither all widths, all board sizes nor a pixel floor

## ADDED Requirements

### Requirement: The confirmation dialog takes the design's size, place and paint

The confirmation dialog `dialog[data-dialog="confirm"]` (class `confirm`) SHALL take the size, the place and the paint of the design's dialog (`.confirm` and `.confirm-buttons`, `design/v0/app/binarka.css` lines 1338-1395; reference `design/v0-screenshots/review-set-14/*confirm*.png`), from the page's tokens (FR-67 presentation, FR-65, NFR-14, A-62; G2 dialog block, `update-confirm-dialog`). It runs after `update-panel-shell`, whose fill, border colour and shadow of the dialog it keeps (see «The panels take the shared surface paint») and after the backdrop tokens (see «The backdrops take the design's translucent tokens»). The DOM is unchanged: the dialog holds the text `p` and `.confirm-buttons` with `[data-confirm="yes"]` «Так, почати» first and `[data-confirm="no"]` «Скасувати» second (FR-67); `src/ui/play-page.ts` is not edited. The dialog opens on «Скасувати» (the focus stays where it is, row 74 of the autonomy log) and Escape cancels, as before.

**Size and place.** The dialog is a centred modal at every width. Its rules are these (every length is the design's; the rule that is exactly `.confirm` is the existing top-level rule, edited in place):

| Rule (selector) | Where | Declarations |
|---|---|---|
| `.confirm` | the existing top-level rule outside any at-rule | `width: min(22rem, calc(100vw - 2 * var(--page-pad)))`, `padding: 1.5rem` (the test also accepts `var(--space-5)`), `border-radius: var(--radius-l)`; the page keeps `max-width: none`, `margin: auto`, `box-sizing: border-box`, the 1px solid `--color-control-border` border, `background-color: var(--color-surface-raised)`, `box-shadow: 0 1rem 2.5rem var(--color-shadow-panel)`, `color: var(--color-text)` and `text-align: left` |
| `.confirm p` | a top-level rule | `margin: 0 0 1.5rem`; the page keeps `line-height: 1.5` and the inherited 1rem text |
| `.confirm-buttons` | a top-level rule, unchanged | `display: flex`, `flex-wrap: wrap-reverse`, `justify-content: flex-end`, `gap: 8px` |
| `.confirm-buttons button` | a top-level rule | `flex: 1 1 auto`, `min-height: 2.75rem`, `padding: 0 1rem`, `border-width: 2px`, `border-radius: var(--radius-m)`, `font-weight: 700`, `line-height: 1.2` |

So the dialog is `min(22rem, the window less twice the page padding)` wide. `--page-pad` is declared on `#app` only (1rem; 0.75rem at 22.5rem and narrower), and the dialog is a child of the page root, so the property is inherited through the top layer and the formula holds without a declaration on `.confirm`: the dialog is 296px wide at 320, 343px at 375 and 352px (22rem) from 768. The padding is 1.5rem (the page's old 20px is gone), the corners 1rem (the old 12px is gone) and the text's bottom margin 1.5rem (the old 20px is gone). Each button is 44px tall: the 2px borders and the 19.2px line sit inside `min-height: 2.75rem`, and the base `button` padding of `10px 16px`, which made the buttons 46px, is replaced by `padding: 0 1rem`. The buttons stay side by side while they fit; when they do not (at 320, where each is 246px wide), `wrap-reverse` puts the last child, «Скасувати», on the upper line, above «Так, почати», and the DOM order stays «Так, почати» first.

**Paint** (every colour a token; wherever a state rule does not repeat a declaration, the plain rule's applies). The two buttons take their colours from two new top-level rules, one whose selector contains `[data-confirm='yes']` and one whose selector contains `[data-confirm='no']`, each written with the longhands that the colour scan reads:

| Element | Declarations |
|---|---|
| «Скасувати» (`[data-confirm='no']`) | `color: var(--color-primary-text)`, `background-color: var(--color-primary)`, `border-color: var(--color-primary)`: the filled primary, like «Почати» and «Зрозуміло»; 5.40 light and 8.55 dark, a pair of the list |
| «Так, почати» (`[data-confirm='yes']`) | `color: var(--color-violation-ink)`, `background-color: var(--color-violation-bg)`, `border-color: var(--color-violation-border)`: the violation colours, because it discards the moves; 7.34 light and 8.40 dark, the new pair of the list |

The computed values are the design's, in light and dark. «Скасувати»: light `color` `rgb(255, 253, 248)`, `background-color` and `border-color` `rgb(180, 70, 13)`; dark `color` `rgb(26, 16, 7)`, `background-color` and `border-color` `rgb(243, 154, 91)`. «Так, почати»: light `color` `rgb(143, 29, 23)`, `background-color` `rgb(251, 228, 225)`, `border-color` `rgb(179, 38, 30)`; dark `color` `rgb(255, 180, 171)`, `background-color` `rgb(63, 35, 32)`, `border-color` `rgb(255, 138, 125)`; the border width of both is `2px`. The red frame of «Так, почати» lies on the dialog fill at 6.43 light and 6.54 dark; it is decoration and in no pair (see «Borders, cues and focus rings have enough contrast»). The focus ring of either button is the page's `button:focus-visible` rule (3px `--color-focus` at a 2px offset) and lies on the dialog fill only, 15.88 light and 12.79 dark, a pair of the list; the two rules above declare no `outline`. The dialog's fill, 1px `--color-control-border` border and shadow stay the shell's, and `--color-overlay-border` is not used for the dialog.

Intentionally not delivered in this change, so that testers do not report them as bugs: (1) hover and press paint of the two buttons and the dialog's fade and scale (`binarka.css` lines 1234-1270 and 1629-1672; DQ-3): the page ports no motion and no hover state for the dialog, and no rule of the dialog sits in `@media (prefers-reduced-motion: no-preference)` or `@starting-style`; (2) a change of the focus ring, of the dialog's text, of the backdrop or of any DOM; (3) a pixel floor for any confirm shot: the shots are expected to rise, see `design.md`; (4) a refreeze of `quality/design-paint.json`: the paint of the buttons is compared live with the design build, as in `e2e/nfr-14-panel-shell.spec.ts`; (5) the dialog in Safari and Firefox (NFR-7); (6) a window narrower than 320 px and the viewports between the five sampled ones.

The mechanism is a stylesheet test and a browser test, both test first. `tests/play-page-confirm-dialog-stylesheet.test.ts` (`@trace FR-67`, `@trace FR-65`, `@trace NFR-14`) reads the parsed `src/ui/style.css`. `e2e/nfr-14-confirm-dialog.spec.ts` (`@trace NFR-14`, `@trace FR-67`, in the existing `layout` project, whose `testMatch` already includes `nfr-14-*`, so `playwright.config.ts` is not changed) compares (1) the boxes of the dialog, of its text `p` and of the two buttons with the cases of the new key `confirmDialog` of `quality/design-geometry.json`, frozen by `scripts/freeze-design-geometry.mjs` from the design build served from `design/v0/out` with the browser setup of `playwright.config.ts` (Playwright "Desktop Chrome", reduced motion, light scheme; the design's route `/confirm/` shows the dialog open at load, so the freeze waits for `dialog[open]` and does not press anything; the page side shows the design's fixture board, FR-119, and presses `[data-action="new"]`, which asks first because the board has entries, as the capture's `confirm` state does), and (2) the computed paint of the two buttons with the design build, read live: the test serves `design/v0/out` itself with a static file server on a port chosen by the operating system, with the path guard of `scripts/freeze-design-geometry.mjs`. If `design/v0/out/index.html` is missing, or the key `confirmDialog` is absent, the test FAILS with the build or freeze instruction; it is never skipped. The sampling dimensions are declared in the file: for the boxes the five viewports of the confirm shots of `review-set-14` (320×700, 375×812, 768×1024, 1024×768, 1440×900; the set has no 1366 confirm shot) in the light scheme; for the paint the two schemes at 375×812 and 1024×768; coverage is `sampled`, never continuum. The stricter instruments, run before a block-done claim, are the per-block pixel crop and geometry channel of `scripts/visual-block.mjs --block confirm` and then the per-shot gate `npm run check:visual`, and after those the full computed-style diff of every element of the dialog (the escalation path of `docs/qa/visual-diff/README.md`). This requirement claims no pixel floor for any shot.

Traces: FR-67, FR-65, NFR-14, NFR-12, A-62, A-57

#### Scenario: The dialog has the design's width, padding and corners

- **GIVEN** the parsed `src/ui/style.css`, every rule found through nested rules and at-rules
- **WHEN** the test reads the rule that is exactly `.confirm` outside any at-rule
- **THEN** it declares `width` `min(22rem, calc(100vw - 2 * var(--page-pad)))` (whitespace aside), `padding` `1.5rem` or `var(--space-5)`, and `border-radius` `var(--radius-l)`, each once
- **AND** it declares neither `12px` nor `20px` nor `32px` for these properties, and no rule that is exactly `.confirm` is found inside an at-rule that declares `width`, `padding` or `border-radius`
- **AND** the page declares `--page-pad` on `#app` (`1rem`, and `0.75rem` inside `@media (max-width: 22.5rem)`) and not on `.confirm`, so the dialog inherits it

#### Scenario: The text and the buttons have the design's metrics

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the rules that are exactly `.confirm p`, `.confirm-buttons` and `.confirm-buttons button`
- **THEN** `.confirm p` declares `margin` `0 0 1.5rem` and `line-height` `1.5`; `.confirm-buttons` declares `display` `flex`, `flex-wrap` `wrap-reverse`, `justify-content` `flex-end` and `gap` `8px` or `0.5rem`
- **AND** `.confirm-buttons button` declares `flex` `1 1 auto`, `min-height` `2.75rem`, `padding` `0 1rem`, `border-width` `2px`, `border-radius` `var(--radius-m)`, `font-weight` `700` and `line-height` `1.2`

#### Scenario: The two buttons take their colours from tokens

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the top-level rule whose selector contains `[data-confirm='yes']` and the one whose selector contains `[data-confirm='no']`
- **THEN** the first declares `color` `var(--color-violation-ink)`, `background-color` `var(--color-violation-bg)` and `border-color` `var(--color-violation-border)`, the second `color` `var(--color-primary-text)`, `background-color` `var(--color-primary)` and `border-color` `var(--color-primary)`, each declaration once and each a single `var()`
- **AND** neither rule declares `outline`, `outline-color`, `box-shadow` or `opacity`, and the text pairs `--color-violation-ink` on `--color-violation-bg` and `--color-primary-text` on `--color-primary` are in `CONTRAST_PAIRS` and hold in each token set (7.34 and 5.40 in light, 8.40 and 8.55 in dark)

#### Scenario: The dialog's rules add no colour literal, no motion and no hover paint

- **GIVEN** the parsed `src/ui/style.css` and the colour scan of «Borders, cues and focus rings have enough contrast»
- **WHEN** the test applies the scan to every declaration of the rules whose selector mentions `.confirm` or `[data-confirm`
- **THEN** it finds no colour literal, no named colour and no `color-mix(`, and every colour is a `var(--color-...)` token
- **AND** no such rule declares `transition`, `animation`, `transform` or `opacity`, none is inside `@media (prefers-reduced-motion: no-preference)` or `@starting-style`, and none has a `:hover` or `:active` state (hover, press, fade and scale are not ported)
- **AND** the stylesheet has no `!important`, and the raw text contains `:has(` exactly once (the idle-line rule)

#### Scenario: The shell's bindings of the dialog stay true

- **GIVEN** the parsed `src/ui/style.css` and the scenario «The dialog takes the raised fill and the panel shadow and keeps its control border» of «The panels take the shared surface paint»
- **WHEN** the test reads the rules that are exactly `.confirm`
- **THEN** there is exactly one such rule outside any at-rule, it still declares `background-color` `var(--color-surface-raised)`, `border-color` `var(--color-control-border)` and `box-shadow` `0 1rem 2.5rem var(--color-shadow-panel)` once each, and no rule that is exactly `.confirm` inside an at-rule declares a fill, a border colour or a shadow
- **AND** `.confirm::backdrop` still declares `background-color` `var(--color-backdrop-strong)`, and no rule declares `var(--color-overlay-border)` for `.confirm`

#### Scenario: The dialog's boxes equal the design's at the five confirm widths

- **GIVEN** the built page in Chromium with the browser setup of `playwright.config.ts`, the light scheme, the design's fixture board (FR-119), and the five cases `320-light-confirm` (320×700), `375-light-confirm` (375×812), `768-light-confirm` (768×1024), `1024-light-confirm` (1024×768) and `1440-light-confirm` (1440×900) of the key `confirmDialog` of `quality/design-geometry.json` (e2e, sampled; never continuum)
- **WHEN** the test presses `[data-action="new"]`, asserts `dialog[data-dialog="confirm"][open]`, and reads the boxes of the dialog, of its `p`, of `[data-confirm="yes"]` and of `[data-confirm="no"]` in CSS px
- **THEN** every edge of each of the four boxes equals the case's recorded design box within 0.5 px, and a difference is reported with the case, the element and both boxes
- **AND** the recorded design boxes of the dialog are 296×218 at 320, 343×166 at 375 and 352×166 at 768, 1024 and 1440; at 320 the box of «Скасувати» lies above the box of «Так, почати» and both are 246×44, and at the other four widths the two buttons lie side by side on one row with «Так, почати» on the left
- **AND** the key `confirmDialog` carries its own provenance and the sampling declaration, and `cases`, `rulesPanel`, `setupSheet`, `selectors`, `designCommit`, `designCssSha1` and `tolerancePx` of the file are unchanged by its refreeze

#### Scenario: The buttons' computed paint equals the design's in light and dark

- **GIVEN** the built page and the design build served from `design/v0/out` by the test, each in Chromium with the browser setup of `playwright.config.ts`, in the light and in the dark scheme, at 375×812 and at 1024×768 (e2e, sampled), the page with the design's fixture board and the design at `/confirm/`
- **WHEN** the test opens the dialog on the page, asserts it is open on both sides, and reads, for `[data-confirm="yes"]` and `[data-confirm="no"]`, `getComputedStyle` `color`, `background-color`, `border-top-color` and `border-top-width`
- **THEN** each colour equals the design's with every channel within 1 (the values listed in the paint paragraph above), and `border-top-width` is `2px` on both sides
- **AND** a pair of values that differ is reported with the button, the scheme, the viewport and both strings, and the test never passes on a dialog it did not open

#### Scenario: Both buttons are at least 44 px tall and wide

- **GIVEN** the built page at the five viewports of the confirm shots, the dialog open
- **WHEN** the test reads the boxes of `[data-confirm="yes"]` and `[data-confirm="no"]`
- **THEN** each box is at least 44 px wide and exactly 44 px tall (within 0.5 px), so the floor of NFR-12 holds and the old 46px height is gone
- **AND** `e2e/nfr-12-targets.spec.ts` (the dialog buttons), `e2e/nfr-13-a11y.spec.ts` (the confirmation state, light and dark), `e2e/nfr-14-panel-shell.spec.ts` and `e2e/nfr-14-backdrop.spec.ts` (the dialog) pass without an edit

#### Scenario: The sampled coverage and the design build are declared and required

- **GIVEN** `e2e/nfr-14-confirm-dialog.spec.ts`
- **WHEN** `design/v0/out/index.html` is absent or the key `confirmDialog` is absent, and when a reader looks for the sampling dimensions
- **THEN** the test fails with a message that names `pnpm build` in `design/v0` or `node scripts/freeze-design-geometry.mjs` (no skip, no pass), the design server listens on a port chosen by the operating system and is closed after the run
- **AND** the file names the viewports (the five confirm widths for the boxes; the two schemes at 375×812 and 1024×768 for the paint) as its sampling dimensions, declares coverage `sampled`, names `scripts/visual-block.mjs` (block `confirm`) and `npm run check:visual` as the stricter instruments, and claims neither all widths nor a pixel floor

#### Scenario: Every confirm shot rises in the per-shot gate

- **GIVEN** (a change-time check of this change, `update-confirm-dialog`, its tasks 7.2 and 7.3, recorded in its evidence; not a lasting test, because later runs move the baseline) the built page, `node scripts/visual-block.mjs --block confirm --states confirm` (the pixel crop and the geometry channel of the dialog, its text and its two buttons, with `diff.png` and `onion.png` for every shot) and `npm run check:visual`, each on its own `BINARKA_PORT_BASE`, and run 12 of the gate (`docs/qa/g2/check-visual-run-12.txt`) as the last run before this change
- **WHEN** the per-block tool and the gate run after the port
- **THEN** the geometry channel reports 0 pairs off and 0 unpaired at each of the five light confirm shots, and each of the ten confirm shots of the gate (five widths, light and dark) scores higher than in run 12 (`320-dark-confirm` 0.9180, `320-light-confirm` 0.9194, `375-dark-confirm` 0.9590, `375-light-confirm` 0.9582, `768-dark-confirm` 0.9849, `768-light-confirm` 0.9837, `1024-dark-confirm` 0.9850, `1024-light-confirm` 0.9836, `1440-dark-confirm` 0.9904, `1440-light-confirm` 0.9901)
- **AND** no shot of any other state scores lower than in run 12 without an explanation recorded in `docs/qa/visual-diff/README.md`; the four phone confirm shots are expected to pass 0.98 if the box and the paint match, which is not a claim of this requirement; if a confirm shot does not rise, the block stops and explains it before the review gate
