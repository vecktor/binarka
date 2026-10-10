# Requirements amendment draft: the design palette (G2 block 2) (2026-10-10)

Status: **DRAFT, UNSIGNED.** Written by the session `admiring-chandrasekhar-34afb0` on 2026-10-10 from about 22:58 to 23:26 (UTC+5:30). Read by a fresh independent auditor before the user sees it: 4 major, 10 minor and 7 note findings, all folded in (section 10). Nothing in `src/` changes before the user signs.

## Basis

- **NFR-14** compares the page with `review-set-14` per shot at 0.98. Run 6 passes 1 of 170 (`docs/qa/g2/check-visual-run-6.txt`). After block 1 (layout geometry), the palette dominates the remaining residual (`docs/qa/visual-diff/README.md`, run 5 paragraph). The exception is the light `confirm` and `rules` shots, where the missing backdrop dominates (same README, the backdrop note).
- **The user's choices:** one OpenSpec change folder per block (row 148), and for block 2 «Draft an amendment» (row 154): map every rule that the design's palette conflicts with, draft the new token names with light and dark values, and say for each cue rule whether it is kept or changed, with the design's reasoning.
- **Source of the palette:** `design/v0/app/binarka.css`, the top-level `:root` (light) and `:root[data-theme='dark']` (dark) blocks, lines 3 to 89. These are the colours of `review-set-14`.
- **The signed rules that pin paint today:**
  - FR-65 and A-51 fix "13 today" colour tokens.
  - The spec requirement «Borders, cues and focus rings have enough contrast» (`openspec/specs/play-page/spec.md:1408`) lists the 13 names and the `#rrggbb` format, and binds `body`, `.cell`, `.cell-given`, `.cell-violation`, `button`, `.message-win` and the focus rules to them. It also defines the contrast pairs and the given cue (in short: a 2px border in its own colour and bold digits; the fill is not the cue).
  - «A violation shows a cue besides colour» (`spec.md:1390`) fixes the border widths at 1, 2, 3 and 3 px.
  - Block 1's scenario «Colours are unchanged» (`spec.md:3720`) pins all 13 values.
- **Row 148 also says** «the token and contrast tests of FR-65 and A-51 must keep passing; token names kept, values changed, new tokens added beside them». **This draft overrides that clause for named tests** (the given-cue test, the cell-border-against-given-fill pair, the border-widths test, the count of 13): the user's signature on PA-Q1 is what allows it. Every other token and contrast test keeps passing with the new values, and the names stay.
- **Every test that pins paint** was inventoried with file and line on 2026-10-10 at about 23:00 (section 6). The contrast figures in this draft are WCAG 2 ratios computed from the literal values with the formula of `tests/helpers/css.ts`. The scripts were run in the session scratchpad and are not committed; the auditor recomputes them.

## Ids

Checked by grep in `docs/requirements.md` and `docs/requirements-held.md`. The highest ids in use are FR-119 and A-56. This draft amends **FR-65** and **A-51** and adds **A-57**. It adds no FR, NFR, TC or BC row and renumbers nothing.

## 1. Conflict map: the design's main-column paint against the signed rules

The main column is the header, the summary button, the board and its cells, the three action buttons and the message area. "Fits" means the design's paint already satisfies the signed rule with only a new token name.

| # | Design paint (`binarka.css`) | Signed rule or test | Verdict |
|---|---|---|---|
| C1 | About 25 colour custom properties without the `--color-` prefix: `--bg`, `--surface`, `--ink`, `--primary` and others | FR-65 and A-51: "13 today". Spec:1410 lists the 13 names. Tests: `TOKEN_NAMES` has length 13 (`tests/helpers/css.ts:365`, `play-page-stylesheet.test.ts:79`); "no 14th colour token" (`play-page-level-stylesheet.test.ts:206-219`); "the dark set adds none" (`play-page-theme-stylesheet.test.ts:90-100`). `isColourToken` counts only `--color-*` | **Conflict.** Port each design colour as a `--color-*` token, and replace "13" by "the list in the spec" (section 3, FR-65) |
| C2 | Translucent colours: `--violation-stripe` (rgba), `--backdrop-soft` and `--backdrop-strong` (rgba), `--sunken-shadow` and the panel shadows (rgba in the rule) | Spec:1410: token values are `#rrggbb`, and no `rgba(` may appear outside `:root`. `rgbOf` and `contrastProblems` reject anything that is not `#rrggbb` | **Conflict.** The stripe only ever lies over `--violation-bg`, so an opaque composite gives the same pixels (`#f1c9c6` light, `#5e332f` dark). The backdrops and shadows are truly translucent; they need the `#rrggbbaa` format (PA-Q4). They are not main column and are bound in later blocks |
| C3 | Hover ring `color-mix(in srgb, var(--primary) 60%, transparent)` | The colour scan forbids `color-mix(` | **Conflict.** Replace with a token holding the composite over the cell (`#d28f6b` light, `#a06941` dark). Pointer hover is never captured (NFR-14), so the pixels do not move (PA-Q5) |
| C4 | **Given cell:** a 1px `--cell-border`, the `--given-bg` fill, `--given-ink` digits at weight 800, and no bottom inset line | Spec:1410 and the scenario at :1446: «2px wide, in `--color-given-border` … bold digits (700); the fill is not the cue»; `--color-given-border` must differ from `--color-cell-border`; widths 1, 2, 3, 3 (spec:1396); FR-65 «the … given cues have at least 3:1» | **Conflict, the headline (PA-Q1).** The design's cue is the fill (1.46:1 light, 1.70:1 dark against the cell), the weight and the digit colour. None of these is a 3:1 non-text cue |
| C5 | Cell border `#8c8374` light / `#8a7f71` dark. The cells sit on the board plate `--line` (`#e2dbcc` / `#3a332b`), which shows through the 0.25rem gaps | Pairs: cell border against page, cell and given fill, each at least 3. No signed pair covers the plate (the plate is new) | **Conflict (PA-Q2).** Light: 2.71 against the plate (fails), 3.68 against the cell, 3.38 against the page, 2.52 against the given fill (fails). Dark: 3.17, 4.13 and 4.55 pass; 2.43 against the given fill fails. A-51 already moved the dark border from the design's `#8a7f71` to `#9a8f80` for the given-fill pair (`src/ui/style.css:25`, 3.01). `docs/design/review-1-design-reviewer.md:60` checked the border against the cell only, so the design's border was never reviewed against the plate or the given fill |
| C6 | **Violation:** a 2px `--violation` border, the `--violation-bg` fill with a striped gradient, the digit in `--violation` at weight 700, underlined 2px | FR-64: «a heavier border than an ordinary cell». Spec widths: violation 3px. Pair: violation text against the violation fill, at least 4.5 | **Partly fits.** 2px is still heavier than 1px, so FR-64 holds; the spec widths change to 1, 1, 2, 2. The underline is one more non-colour cue; the stripe is decoration (1.24 / 1.35 against the fill). The design writes the underline with the `text-decoration` shorthand, which the scan flags (`tests/helpers/css.ts:293-304, 347`), so the port uses the longhands `text-decoration-line`, `-thickness` and `-offset` (no test change; the same for «Скинути»). **Text conflict (PA-Q3):** the digit `#b3261e` on the darkest stripe band is 4.33:1 in light; dark `#ff8a7d` is 4.61 and passes. An 8×8 digit on a 320 px phone is about 16 px bold, which is not large text, so 4.5 applies |
| C7 | Entry digits in `--entry-ink` (orange) at weight 500. The cell has a bottom inset line in `--line` | No rule names an entry colour (the cascade test expects `--color-text` on an ordinary cell, `play-page-stylesheet.test.ts:461`) | **Conflict, small.** A new token `--color-entry-text` with a 4.5 pair: 6.07 light, 8.07 dark against the cell |
| C8 | Hinted cell: a 2px dashed `--primary` border, the `--primary-soft` fill, `--ink` digits, italic 700 | No spec or test pins the hinted paint. Today's page uses `--color-given-border` | **Fits.** Proposed new 3:1 pairs: primary against the soft fill, 4.41 light and 6.13 dark; against the plate, 3.99 and 5.68 |
| C9 | Focus ring `--focus: var(--ink)` (`#1e2126` / `#f1ede4`) | Pairs: focus against page, cell, given fill and violation fill, at least 3. `--color-focus` is `#rrggbb`, not a `var()` | **Fits.** Write the ink literal under `--color-focus`. Ratios: 10.87 and above light, 8.17 and above dark. A cell's ring is 3px at a 2px offset, so it lies 2 to 5px outside the cell. The board gaps are 4, 3 and 2px, so its inner band is on the plate (11.72 / 10.65), and its outer band overlaps a neighbour's border and fill. The signed spec already accepts that the ring covers a neighbour's border (spec:1704). Against neighbour colours: the cell border 3.87 / 3.36 (new pair), a neighbour's violation border 2.47 / 1.96, a hinted neighbour's primary border 2.94 / 1.88, and the success border at the edge of a solved 8×8 board 2.53 / 1.53. Those last three are listed as accepted adjacencies under PA-Q8. Spec:1704's sentence «the 2px gap between cells shows the page colour» and its quoted ratios become false, so it needs a MODIFIED delta (section 6). **Affects the user's open row 135:** in the design, a checked option's frame is `--primary` and the focus ring is ink, so they no longer share a colour. But the -1px offset of the theme and language options (`binarka.css:428-431`, `style.css:452-455`) puts the ink ring across a checked `--primary` frame at 2.94 / 1.88. This is a known failure for the settings block, like C17. Noted, not closed |
| C10 | Win line: `--success` border, `--success-bg` fill, `--ink` text at 700. Solved board: `--success` border and ring, `--success-bg` plate | Spec:1466: `--color-win-text` against the page at 4.5; `.message-win` takes `color` from `--color-win-text` | **Changes.** `--color-win-text` takes the ink value; the pair becomes win text against `--color-success-bg` (13.57 / 11.54). New pair: on a solved board, the cell border against the success plate (3.50 light with PA-Q2 A, 3.44 dark). The solved paint is keyed on the page's existing hook, `.board-host[data-solved='true']`, not on the design's `.board[data-solved]` |
| C11 | Action buttons: «Підказка» filled `--primary` with `--primary-ink` text; «Нова головоломка» on `--surface` with a `--primary` border; «Скинути» transparent with `--ink-muted` text | Spec: `button` takes `color` `var(--color-text)`, `background-color` `var(--color-control-bg)` and `border-color` `var(--color-control-border)` (`play-page-stylesheet.test.ts:128-134`). The control border pair is against the page | **Fits** once per-button rules are added. The base `button` rule keeps its three bindings; `[data-action]` rules lay the design's colours over it, with an explicit `background-color: transparent` and `border-color: transparent` where the design has none (`.buttons button`, «Скинути»). After a win the design swaps the buttons («Нова головоломка» filled, «Підказка» muted) with `#app:has(.board[data-solved='true'])`. That would be a second `:has(`, which FR-65 forbids, so the port uses the existing hook `.board-host[data-solved='true'] ~ .buttons` (`style.css:327-333`). New pairs: primary text on primary, 5.40 / 8.55; primary against the page, 4.96 / 8.15; muted ink on the page, 6.58 / 8.32; after a win, muted ink on the control fill, 7.17 / 7.54 |
| C12 | Header buttons and the summary button: a 2px `--cell-border` border, `--surface`, `--ink`; the summary cue in `--primary` | The level test needs `.setup-button`'s `color` and `background-color` as single tokens at 4.5 per set | **Fits.** `--color-control-border` takes the design's `--cell-border` values unchanged (3.38 / 4.55 against the page) |
| C13 | Idle line in `--ink-muted`; the hint line on `--primary-soft` with a 4px `--primary` left accent | Today's idle line uses `--color-control-border` as a text colour (`style.css:392`) | **Fits** with the new token `--color-text-muted` (pairs against the page, 6.58 / 8.32). **Side effect:** any rule still using `--color-control-border` as a text colour (the idle line, `.mini-sep` at `style.css:591`) would drop to 3.38:1 in light, and axe (NFR-13) checks text contrast. Block 2 moves every such use to `--color-text-muted` |
| C14 | `--color-page` changes from `#f9fafb` to `#f7f3ea` (light; dark stays `#1a1714`) | FR-106 and FR-116: the `theme-color` meta and the head step hold copies of the page colour (`index.html:7,34`, `src/ui/preferences.ts:8-9`). Tests compare them with the token dynamically | **Fits.** The text is unchanged; the three copies change together in block 2 |
| C15 | Block 1's scenario «Colours are unchanged» (`spec.md:3720`, test `tests/play-page-layout-geometry.test.ts:41-46`) | Pins all 13 values in both sets | **Must be MODIFIED** by block 2's change folder (section 6). It is not a requirements row |
| C16 | Shapes outside the palette: `--hover-filter: brightness()`, `--sunken-shadow` and the panel shadows | The scans flag a `box-shadow` without `var(--color-`; `filter` is not scanned | **Rule needed (PA-Q4):** a shadow takes its geometry in the rule and its colour from a `--color-*` token. `--hover-filter` goes on `#app` with the other non-colour variables (`style.css:62-63`: `:root` holds only the colour tokens), so `:root` stays colour-only |
| C17 | Level cards: `--option-border` `#c4b59c` / `#5a5045` against `--surface` (1.98 light) and against the sheet's `--surface-raised` (light 1.98, dark 1.90) | Not main column. A card's boundary has no 3:1 pair in FR-65 today; WCAG 1.4.11 asks for one | **Known failure, deferred to the sheet block (PA-Q6).** This draft signs the value as the design's and flags it; the sheet block brings its own proposal |
| C18 | The win glow: `@keyframes glow` uses `color-mix(in srgb, var(--success) 45%, transparent)` in a `box-shadow` (`binarka.css:1648-1658`), only under `prefers-reduced-motion: no-preference` (`:1468`) | The colour scan walks keyframes; the amended FR-65 forbids `color-mix()` | **Conflict, small.** A translucent shadow token `--color-success-glow` (`#2f6b3a73` / `#8fd19a73`). The capture forces reduced motion, so no shot shows it (PA-Q4) |
| C19 | The logo's cell fill is `--primary-ink` and its frame `--primary` (`binarka.css:213-218`) | Not pinned | **Fits.** `--color-primary-text` also fills the logo cells |
| C20 | **A given cell in a violation.** `.cell-violation` comes after `.cell-given` and sets `font-weight: 700`, so it overrides the given 800 (`binarka.css:721-727, 750-764`). Such a cell then has the same border, fill, stripe, colour, weight and underline as a player cell in a violation; only the inset line differs, at 1.13:1 | The spec tests the given-in-violation kind (spec:1472; `play-page-stylesheet.test.ts:455-475`) | **Conflict with the cue of PA-Q1 A.** Add `.cell-given.cell-violation { font-weight: 800 }`. There is no pixel cost: the fixture's violation cells (r3 c1-3 in `design/v0/lib/boards.json`) are all player cells |

## 2. Proposed token list (the spec's table after the signature)

- **Names.** The 13 baseline names are kept with their roles (row 148). The design's other roles get new `--color-*` names. Where two names share a value, both are kept; they are not collapsed.
- **Values.** Literal values: `#rrggbb`, or `#rrggbbaa` for the translucent tokens of PA-Q4.
- **Bold** marks a value that differs from the design. Each such value is needed by a signed pair.

| Token | Light | Dark | Design source | Role (where bound) | Block |
|---|---|---|---|---|---|
| `--color-page` | `#f7f3ea` | `#1a1714` | `--bg` | page background; the `theme-color` copies | 2 |
| `--color-text` | `#1e2126` | `#f1ede4` | `--ink` | page text, header, button text, hinted digit | 2 |
| `--color-text-muted` | `#5f5549` | `#b8b0a4` | `--ink-muted` | idle line, «Скинути», secondary text | 2 (new) |
| `--color-cell-bg` | `#fffdf8` | `#24201b` | `--surface` | cell fill | 2 |
| `--color-control-bg` | `#fffdf8` | `#24201b` | `--surface` | button and summary fill | 2 |
| `--color-line` | `#e2dbcc` | `#3a332b` | `--line` | board plate and border; the cell's bottom inset line | 2 (new) |
| `--color-cell-border` | **`#847b6d`** | `#8a7f71` | `--cell-border` (light `#8c8374`) | cell border (PA-Q2) | 2 |
| `--color-control-border` | `#8c8374` | `#8a7f71` | `--cell-border` | header, summary and close-button borders | 2 |
| `--color-given-bg` | `#ddd3be` | `#4d4438` | `--given-bg` | given fill | 2 |
| `--color-given-border` | **`#847b6d`** | `#8a7f71` | none (the design's given cell keeps `--cell-border`) | given border, 1px, the same as an ordinary cell (PA-Q1 A). Under PA-Q1 B: a 2px border in a value distinct from the cell border, at 3:1 against the page, the cell and the given fill. The design has no such value, so a design round supplies it | 2 |
| `--color-given-text` | `#1e2126` | `#f7f3ea` | `--given-ink` | given digit | 2 (new) |
| `--color-entry-text` | `#a8400c` | `#f7a46a` | `--entry-ink` | player's digit | 2 (new) |
| `--color-primary` | `#b4460d` | `#f39a5b` | `--primary` | «Підказка» fill, «Нова головоломка» border, hinted border, hint accent, summary cue, logo | 2 (new) |
| `--color-primary-text` | `#fffdf8` | `#1a1007` | `--primary-ink` | text on a primary fill; the logo's cells | 2 (new) |
| `--color-primary-soft` | `#f6e3d4` | `#3d2b1e` | `--primary-soft` | hinted fill, hint line fill, checked option fill | 2 (new) |
| `--color-hover-ring` | `#d28f6b` | `#a06941` | `color-mix(--primary 60%, transparent)` over `--surface` | the cell's hover ring (PA-Q5) | 2 (new) |
| `--color-violation-bg` | `#fbe4e1` | `#3f2320` | `--violation-bg` | violation fill | 2 |
| `--color-violation-border` | `#b3261e` | `#ff8a7d` | `--violation` | violation border | 2 |
| `--color-violation-stripe` | `#f1c9c6` | `#5e332f` | `--violation-stripe` composited over `--violation-bg` (the same pixels) | the stripes of a violating cell | 2 (new) |
| `--color-violation-text` | **`#8f1d17`** | `#ff8a7d` | light: `--violation-ink`; dark: `--violation`, as the design draws the digit | violating digit (PA-Q3) | 2 |
| `--color-violation-ink` | `#8f1d17` | `#ffb4ab` | `--violation-ink` | text of «Так, почати» | later |
| `--color-success` | `#2f6b3a` | `#8fd19a` | `--success` | win line border, solved board border and ring | 2 (new) |
| `--color-success-bg` | `#e2efdf` | `#1f3324` | `--success-bg` | win line fill, solved board plate | 2 (new) |
| `--color-success-glow` | `#2f6b3a73` | `#8fd19a73` | `color-mix(--success 45%, transparent)` | the win glow keyframes, translucent (C18) | 2 (new) |
| `--color-win-text` | `#1e2126` | `#f1ede4` | `--ink` (the design's win text) | win line text | 2 |
| `--color-focus` | `#1e2126` | `#f1ede4` | `--focus: var(--ink)` | every focus ring | 2 |
| `--color-surface-raised` | `#fffdf8` | `#2c2620` | `--surface-raised` | sheet, panel and dialog fill | later |
| `--color-overlay-border` | `#e2dbcc` | `#8a7f71` | `--overlay-border` (`var(--line)` / `var(--cell-border)`) | panel border | later |
| `--color-option-border` | `#c4b59c` | `#5a5045` | `--option-border` | available level card border (C17, PA-Q6) | later |
| `--color-backdrop-soft` | `#46280f38` | `#08050273` | `--backdrop-soft` (rgba 0.22 / 0.45) | settings backdrop | later |
| `--color-backdrop-strong` | `#2d190a80` | `#08050299` | `--backdrop-strong` (rgba 0.5 / 0.6) | rules and dialog backdrop | later |
| `--color-shadow-sunken` | `#3c230a1f` | `#00000073` | `--sunken-shadow` colour (0.12 / 0.45) | the unavailable level's inset | later |
| `--color-shadow-panel` | `#00000040` | `#00000040` | `rgba(0, 0, 0, 0.25)` in `.setup`, `.settings`, `.confirm`, and `.rules` from 48rem | panel drop shadow | later |
| `--color-shadow-sheet` | `#0000002e` | `#0000002e` | `rgba(0, 0, 0, 0.18)` in the phone `.rules`, `.setup` and `.settings` | phone sheet shadow | later |

- **Count.** There are 34 tokens: 25 for block 2 (12 of them new), 9 for later blocks.
- **Signed now, declared later.** The whole table is signed now. Each block declares only the tokens it binds, so the stylesheet never holds an unused token. A later block that binds a "later" token needs a spec delta, not a new signature.
- **Not in the table:** `--hover-filter` (`brightness(0.96)` / `brightness(1.12)`). It is a filter, not a colour, and goes on `#app` with the other non-colour variables (C16); the dark value follows `data-theme` through a `:root[data-theme='dark'] #app` rule.
- **The light cell border `#847b6d`** is the first value at 3:1 against the plate when the design's `#8c8374` is darkened uniformly, keeping its hue (6%, 3.03:1). A colour nearer in sRGB distance exists (`#887a73`), but it shifts the hue.
- **The `#rrggbbaa` values** are the design's rgba values converted at 8 bits per channel (alpha × 255, rounded). The auditor rechecks them.

## 3. Amended rows (existing id, new text)

### FR-65 (amended)

**This is the PA-Q1 A text.** Under PA-Q1 B, the first sentence keeps the signed wording («Cell borders, the violation and given cues and the focus indicators have at least 3:1 contrast with adjacent colours»), plus the plate and the solved plate. The exemption clause for given cells goes. The rest of the text below is the same under A and B.

The clauses **in bold** are new or changed. Everything else is the signed text, unchanged, including the history notes, which stay and gain one more note.

> **Cell borders (against the cell, the page, the board plate and the solved board's plate), the violation cue, the hinted-cell cue and the focus indicators have at least 3:1 contrast with adjacent colours. A given cell is an inactive control (`aria-disabled`, FR-69), so its look is exempt from the 3:1 non-text rule (WCAG 1.4.11). It is told from a player's cell by weight, not by colour alone: bolder digits (800 against 500), in a violation too; its digit keeps at least 4.5:1 (A-57).** Every cell and every page button (the header «Правила», the summary button, the three size buttons, the four level buttons, the setup sheet's start button «Почати» and close button «Закрити», «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати», «Скасувати», the three theme options and the two language options) shows a `:focus-visible` indicator. The size buttons, the four level buttons and the summary button set their own text and background colours (existing tokens). «Почати» sets its own `color` and `background-color` from the colour tokens, like the summary and level buttons **(from the setup-sheet block: the design's primary fill, `--color-primary` and `--color-primary-text`, A-57)**. The board sets `touch-action: manipulation`. **Palette: the stylesheet's colour tokens are the list in the spec (the G2 palette, A-57: the 13 baseline names with the design's values, plus the design's further roles). Each token has exactly two value sets: light in the top-level `:root`, dark in one `:root[data-theme="dark"]` block. A value is a literal `#rrggbb`. A token for a translucent layer (a backdrop or a shadow, marked as such in the spec's list) may be `#rrggbbaa`; it is never the foreground or the background of a contrast pair, and a backdrop is checked composited over the page.** With the TD-Q13 default there is no `prefers-color-scheme` block: the page always sets `data-theme` (FR-104, FR-116). No `--color-*` is declared anywhere else, and no colour literal appears outside these blocks. **Every colour a rule uses is a `var(--color-...)` token, in gradients, shadows, rings and keyframes too (no `color-mix()`). A shadow's geometry stays in the rule.** Every contrast pair of this row and of the spec's token rule (3:1 non-text, focus, 4.5:1 text) holds for each token set. The stylesheet has no `!important` and uses `:has(` in exactly one rule, the one that hides the idle line (FR-71). In browsers without `:has()` the idle line stays visible next to a message (D1, row 79). … **(amended 2026-10-10: the G2 palette. The token list moves from "13 today; 14 if the design adds a primary token" to the spec's list; translucent tokens added; the given cue changed from a 2px border to weight; the board plate, the solved plate and the hinted cue added to the 3:1 pairs; palette amendment, autonomy-log row <n>; was «Cell borders, the violation and given cues and the focus indicators have at least 3:1 contrast with adjacent colours; …», «… whether the existing tokens suffice or the design round adds one (for example a primary fill) is the design's call, decided by the review set built from the signed wireframe (row 120) …» (decided by `review-set-14`: a primary fill), and «Dark palette: the stylesheet's token list (13 today; 14 if the design adds a primary token for «Почати») has, for each token, exactly two value sets: light in the top-level `:root`, dark in one `:root[data-theme="dark"]` block (A-51).»)**

### A-51 (amended)

Append:

> **Superseded in part on 2026-10-10 by A-57:** the "13 today" and "it does not port the full design palette; that stays G2". The G2 palette has been ported, so the dark values follow A-57. The per-token-set rule ("every contrast scenario … runs once per token set") is unchanged.

## 4. New assumption

- **A-57 (2026-10-10), the G2 palette.** The page takes the colours of `design/v0/app/binarka.css` (`:root` and `:root[data-theme='dark']`) of `review-set-14`. Each design colour is one `--color-*` token, as listed in the spec (this draft's section 2).
  - **Where values differ from the design.** A value differs only where a signed contrast pair needs it:
    - the light cell border is `#847b6d` (the design's `#8c8374` gives 2.71:1 against the board plate);
    - the light violating digit takes the design's `--violation-ink` `#8f1d17` (the design's `--violation` gives 4.33:1 on the stripe in light); the dark digit keeps the design's `#ff8a7d` (4.61:1).
    - The given border equals the cell border, at 1px. A given cell in a violation keeps weight 800 (the design lets the violation rule set 700).
  - **Exact equivalents.** Two tokens hold the composite of a design colour that is not opaque. The stripe is composited over the violation fill, which gives the same pixels. The hover ring is composited over the cell, which gives the same pixels on a plain cell.
  - **Given cells.** A given cell is inactive (FR-69). So, as WCAG 1.4.11 allows for an inactive component, its cue is weight, not a 3:1 border. The fill, the darker ink and the missing inset line are decoration (the inset line is 1.36 / 1.30 against the cell).
  - **Where the list lives.** The full token table (light, dark, role, block) is an appendix to A-57 in `docs/requirements.md`. The spec lists the tokens the stylesheet declares; a later block adds its rows from that appendix.
  - **ASSUMPTION; ratified by the signature.**

## 5. Cue rules: kept or changed, with the design's reasoning

| Cue | Signed today | After this draft | Why (design, WCAG) |
|---|---|---|---|
| **Given cell** (PA-Q1) | 2px border in its own colour at 3:1, weight 700; the fill is decoration | 1px border in the cell-border colour. The cue is weight 800 against 500, kept in a violation (C20). The `--color-given-bg` fill, the darker given ink and the missing inset line are decoration (the line is 1.36 / 1.30 against the cell). Digit at 4.5:1 or more (10.87 / 8.62) | The design reads givens as "printed": a flat, bolder, darker digit. Entries read as "handwritten": orange, with a bottom line. Under 1.4.11, an inactive component needs no 3:1. Under 1.4.1, the weight is the non-colour cue; it is a weaker cue than today's 2px border, which is why PA-Q1 has no default. `aria-disabled` stays the non-visual counterpart |
| **Violation** (FR-64) | 1, 2, 3, 3 px widths; violation colours; text 4.5 against the fill | Under PA-Q1 A only: 1, 1, 2, 2 px widths (ordinary, given, violation, given in violation); the violation is still heavier than both. Under PA-Q1 B the widths stay 1, 2, 3, 3. Added: a 2px underline on the digit (non-colour) and the stripe (decoration, 1.24 / 1.35). Border 3:1 against the page, the cell, the fill and the plate (4.74 / 5.44 against the plate). Text 4.5 against the fill **and against the stripe** (PA-Q3) | FR-64's text, «a heavier border than an ordinary cell», is unchanged. The 3px width was the page's own choice, not the design's. The underline gives one more non-colour cue |
| **Hinted cell** | Not pinned (the page uses a dashed given border, italic 700) | 2px dashed `--color-primary`, the `--color-primary-soft` fill, `--color-text` digit, italic 700. New 3:1 pairs: primary against the soft fill and the plate | It is the design's cue. The pairs make sure the dashed border is seen |
| **Focus ring** | 3px `--color-focus` at 3:1 against four fills | Unchanged in shape. The value is ink. The pairs add the plate, the soft fill, the success plate (10.65 and above) and a neighbour's cell border (3.87 / 3.36). The overlaps with a neighbour's violation, hinted or success border are accepted adjacencies (PA-Q8) | The design's finding 15: a warm ink ring at about 15:1, not blue |
| **Win** | `--color-win-text` against the page at 4.5 | Win text (ink) against `--color-success-bg` at 4.5; success border and fill | The design's win line is a filled card |
| **Cell border** (PA-Q2) | 3:1 against the page, the cell and the given fill | 3:1 against the page, the cell, the board plate and the success plate. Against the given fill: dropped under PA-Q1 A (inactive) | The plate is a new adjacent colour. The cell's outer edge borders it |

**New contrast pairs, with ratios under the defaults (light / dark).** The existing pairs carry over with the new values.
- **3:1 pairs:**
  - cell border against page 3.77 / 4.55, cell 4.10 / 4.13, plate 3.03 / 3.17, success plate 3.50 / 3.44;
  - violation border against page 5.90 / 7.81, cell 6.43 / 7.08, violation fill 5.38 / 6.24, plate 4.74 / 5.44;
  - hinted border (primary) against the soft fill 4.41 / 6.13 and the plate 3.99 / 5.68;
  - primary against the page 4.96 / 8.15;
  - focus against page, cell, given fill, violation fill, plate, soft fill and success plate: 10.87 or more / 8.17 or more; focus against the cell border 3.87 / 3.36;
  - control border against the page 3.38 / 4.55.
- **4.5:1 pairs:**
  - text against page, cell, given fill, control fill and soft fill: 10.87 or more / 8.17 or more;
  - given text against the given fill 10.87 / 8.62;
  - entry text against the cell 6.07 / 8.07;
  - muted text against the page 6.58 / 8.32 and against the cell 7.17 / 7.54;
  - violation text against the fill 7.34 / 6.24 and against the stripe 5.90 / 4.61;
  - primary text on primary 5.40 / 8.55;
  - win text against the success plate 13.57 / 11.54.

## 6. Impact: spec, tests and files (block 2's change folder, after the signature)

Every test change below traces to a spec delta in the change folder, which traces to this amendment. Rows are listed per test, with their source (memory rule: a test changes only when a signed rule demands it).

- **Spec deltas (MODIFIED):**
  - «Borders, cues and focus rings have enough contrast»:
    - the token table, the format, the pairs and the bindings;
    - the scenario «Cell borders have 3:1» (the given-fill pair goes under PA-Q1 A; the plate and the solved plate are added);
    - a new scenario «The given cue is weight» in place of «The given cue has 3:1 and is not the fill» (under PA-Q1 A).
  - «A violation shows a cue besides colour»: the widths (1, 1, 2, 2 under PA-Q1 A) and the underline.
  - «Cells and buttons show a visible, unobscured focus indicator» (spec:1704): the inner side of a cell's ring shows the plate, not the page; the quoted ratios; the accepted adjacencies of PA-Q8.
  - «The summary and level buttons set their own colours»: "no `--color-*` token is added unless…" and the "13 tokens" scan.
  - «Main column layout geometry follows the design reference»: the scenario «Colours are unchanged» becomes «Colours are the G2 palette» (both sets equal the spec's list).
  - The dark-set scenario that says "redefines the 13 tokens and adds none" becomes "redefines every token of the list".
- **Tests changed on purpose, each from the delta above:**
  - `tests/helpers/css.ts`:
    - `TOKEN_NAMES` and `CONTRAST_PAIRS`;
    - an `#rrggbbaa` reader for translucent tokens, which are excluded from the pairs;
    - optionally, `background-image` added to the token scan (it is not scanned today, so the stripe is guarded only by the literal check).
  - `tests/play-page-stylesheet.test.ts`:
    - `:79-86`, the count;
    - `:111-125`, the bindings (`.cell` text `--color-entry-text`; `.cell-given` text `--color-given-text` and border 1px);
    - `:143`, the cell-border title and pairs;
    - `:151-166`, the given cue test, replaced;
    - `:444-450`, the widths;
    - `:455-475`, the cascade (the entry text and the given text, which in dark is `#f7f3ea`, not `#f1ede4`; a given cell in a violation at weight 800).
  - `tests/play-page-level-stylesheet.test.ts:206-219`: the 13 and "no 14th token".
  - `tests/play-page-theme-stylesheet.test.ts:90-100`: "adds none".
  - `tests/play-page-theme-stylesheet.test.ts:63-87`, in the backdrop block, not block 2: `contrastRatio(colour, '#ffffff')` throws on `#rrggbbaa`, so «In dark every backdrop dims the page» is restated as composited over the page.
  - `tests/play-page-layout-geometry.test.ts:10-46`: the 13 values become the list.
  - `tests/play-page-helpers.test.ts`:
    - `:378-418`, the `DESIGN_TOKENS` fixture follows `TOKEN_NAMES`;
    - `:422`, the `CONTRAST_PAIRS` length;
    - `:425-428`, the ratio regex that depends on the fixture's page;
    - `:1068`, the `tokenDeclarations` length 13;
    - `:431` keeps rejecting `rgb()`, and a new case accepts `#rrggbbaa` only for a translucent token.
- **Unchanged, but read the new values dynamically:** `tests/index-html.test.ts`, `tests/play-page-theme.test.ts`, `e2e/nfr-13-a11y.spec.ts`, `e2e/nfr-18-flash.spec.ts`.
- **What axe covers.** NFR-13's axe sweep checks text contrast in a real browser for the entries (in the win state), the muted text, the primary text and the page text. It does not cover the violating digits or the given digits:
  - no axe state shows a violation;
  - axe returns "incomplete" for text over a `background-image` (the stripe);
  - axe skips `aria-disabled` elements (the given cells).
  
  For those digits, the stylesheet pair tests are the binding check.
- **Files and port notes:**
  - `src/ui/style.css`: the token blocks and the main-column rules.
  - `index.html:7,34` and `src/ui/preferences.ts:8-9`: the light page colour `#f7f3ea`.
  - Every `color: var(--color-control-border)` moves to `--color-text-muted` (C13).
  - Underlines as longhands (C6).
  - The solved state and the button swap on the `.board-host[data-solved='true']` hook, with no second `:has(` (C10, C11).
  - Explicit `transparent` fills and borders where the design has none (C11).
  - `.cell-given.cell-violation { font-weight: 800 }` (C20).
  - The glow as `--color-success-glow` (C18).
  - `--hover-filter` on `#app` (C16).
- **Not changed by block 2:** the setup sheet, the panels, the dialog and the backdrops keep their current bindings. Their colours still move, because the shared tokens change value (for example the light page). Their own blocks bind the "later" tokens. «Почати» keeps its current tokens until the sheet block (FR-65's new clause says "from the setup-sheet block").
- **Requirements unchanged in text:** FR-64, FR-69, FR-104, FR-106, FR-116, FR-117, NFR-9, NFR-13, NFR-14.

## 7. Pixel cost of the deviations (not yet measured)

The defaults move these things away from `review-set-14`:
- **The light cell border,** `#8c8374` to `#847b6d`, on every cell edge. It shows in **every shot that shows a board**: the board states, and also the default, confirm, rules, settings and setup shots, where the board shows behind the panel.
- **The light violating digits,** `#b3261e` to `#8f1d17`, on the 3 violating cells of the default fixture. The fixture shows in the same shots as above. The dark digits keep the design's value.
- **The hover ring,** which is never captured.

The first two are small areas, but they repeat across many shots. Whether they stay under the checker's per-pixel tolerance is **not measured**. Block 2 measures it with `scripts/visual-block.mjs` after the port, before any per-block done claim.

If they cost a shot its 0.98, alternative C of PA-Q2 and PA-Q3 applies: a design round adopts the two values, and the user moves the reference.

## 8. Questions for the user (defaults for "signed, use defaults", except PA-Q1)

- **PA-Q1, the given cue. No default: an explicit answer is required.** Either answer changes a signed 3:1 accessibility rule or the pixel reference. Row 148 asked that the token and contrast tests keep passing, and A overrides that for the given cue.
  - **A:** the design's cue: weight 800 against 500 (kept in a violation, C20) and a 1px border in the cell-border colour; the fill, the ink and the missing inset line are decoration.
    - It is justified by WCAG 1.4.11's exemption for inactive components (given cells are `aria-disabled`, FR-69).
    - Costs: the 2px given border and its 3:1 pair go; the violation widths become 1, 1, 2, 2; the given-cue test is replaced, not weakened silently.
  - **B:** keep the signed 2px border in its own colour at 3:1, weight 700. Its costs:
    - The pair "cell border against the given fill" stays. The light cell border must then be about `#7f7667` (3.01 against `#ddd3be`; `#847b6d` gives only 2.81), and the dark one stays `#9a8f80`.
    - The violation stays 3px, wider than the 2px given border (the design draws 2px).
    - The board shots cannot reach 0.98 until a design round adds that border and the user moves the reference.
- **PA-Q2, the light cell border.**
  - **Default A:** `#847b6d`, the first value at 3:1 against the plate along a uniform, hue-keeping darkening. The dark set keeps the design's `#8a7f71`. Under PA-Q1 B, `#7f7667` instead.
  - **B:** keep the design's `#8c8374`, with a written waiver of the plate pair (2.71:1).
  - **C:** as A, and a design round adopts the value, and the user moves the reference (zero pixel cost).
- **PA-Q3, the violating digit.**
  - **Default A:** light `#8f1d17` (the design's `--violation-ink`, 5.90 on the stripe). Dark keeps the design's `#ff8a7d` (4.61).
  - **B:** keep the design's `--violation` in light and lighten the stripe until 4.5 holds (a design round).
  - **C:** as A, and a design round adopts it.
- **PA-Q4, translucent tokens.**
  - **Default:** allow `#rrggbbaa` for the tokens the spec marks translucent (backdrops, shadows, the win glow). The format is signed now; block 2 binds the glow, and later blocks bind the rest.
  - **Alternative:** drop the glow and sign the format later, with the backdrop block.
- **PA-Q5, the hover ring.**
  - **Default:** the opaque composite token `--color-hover-ring`.
  - **Alternative:** drop the hover ring (it is not captured).
- **PA-Q6, the level card border** (`--color-option-border`, 1.98 light against the surface, 1.90 dark against the raised surface). **Default:** sign the design's value now as "later" and flag it. The sheet block brings a proposal (a darker border, or a pair waiver) before it binds the token.
- **PA-Q7, signing the "later" tokens now.**
  - **Default:** yes, the full table goes into `docs/requirements.md` as an appendix to A-57, and each block declares the tokens it binds.
  - **Alternative:** sign only block 2's 25 tokens; later blocks amend again.
- **PA-Q8, the focus ring's neighbours.**
  - **Default:** accept, as the signed spec already does for a neighbour's border (spec:1704), that a focused cell's ring overlaps a neighbour's violation border (2.47 / 1.96), a hinted neighbour's primary border (2.94 / 1.88), and the success border at the edge of a solved 8×8 board (2.53 / 1.53). In each case its inner band stays on the plate at 10.65:1 or more. The ring against a neighbour's ordinary border (3.87 / 3.36) becomes a pair.
  - **Alternative:** a different ring for cells (for example a 2-colour ring), which is a design round.
  - **Linked to row 135:** the same ink ring across a checked `--primary` frame in the theme and language options (2.94 / 1.88) is a known failure for the settings block.

## 9. Work that follows the signature (proposed order)

1. Fold the signed text into `docs/requirements.md` (FR-65, A-51, A-57 with the token appendix) with an autonomy-log row.
2. Write the change folder `update-page-palette`. It holds the spec deltas of section 6, with a strict validation pass.
3. Write the red tests (test-engineer), confirmed red in a scratch copy and saved as `docs/qa/update-page-palette/red-run.txt`.
4. Port the main-column paint (`src/ui/style.css`, `index.html`, `src/ui/preferences.ts`).
5. Run the battery.
6. Run the per-block tool, with crop scores and overlays for the main column.
7. Run `check:visual` run 7.
8. Run the review gate (the user's yes), then archive.

After the palette come the dialog and panel backdrop, then the setup sheet.

## 10. Auditor findings: disposition

**The audit.** A fresh general-purpose subagent, read-only, audited the draft on 2026-10-10 from about 23:07 to 23:23. It recomputed every ratio, composite and alpha conversion: **none was wrong**. It returned 4 major, 10 minor and 7 note findings. All are folded in:

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | major | A given cell in a violation loses the weight cue (the design's violation rule sets 700) | C20, the cue table, A-57, FR-65 «in a violation too», §6 port note (no pixel cost) |
| 2 | major | The `text-decoration` shorthand fails the colour scan | C6, §6: port as longhands, no test change |
| 3 | major | The defaults override row 148's «token and contrast tests must keep passing» without saying so | Basis states the override; PA-Q1 has no default |
| 4 | major | The dark violating digit changed although no pair needs it, contradicting A-57 | Dark keeps `#ff8a7d` (4.61); a new later token `--color-violation-ink` for «Так, почати» |
| 5 | minor | The focus ring's adjacency claim was wrong; spec:1704 needs a delta | C9 corrected; pair against the cell border; PA-Q8; §6 MODIFIED delta |
| 6 | minor | The axe sweep was overclaimed as the browser check of the 4.5 pairs | §6 "What axe covers" |
| 7 | minor | The test inventory was incomplete | §6 adds helpers `:422`, `:425-428`, `:1068`; stylesheet `:143`; the given text in the cascade; theme `:63-87` |
| 8 | minor | Missing paint: the glow `color-mix`, the second `:has(` of the win swap, the solved hook, the transparent buttons, the logo cells | C18, C19, C10, C11, the table, §6 |
| 9 | minor | PA-Q1 B and the widths were under-specified | PA-Q1 B costs (`#7f7667`, `#9a8f80`, 3px); widths tied to PA-Q1 A |
| 10 | minor | The FR-65 rewrite dropped signed clauses silently; «Почати» timing; the success plate | A "was «…»" note; «from the setup-sheet block»; the success plate added |
| 11 | minor | The inset line and the stripe are barely visible as cues | They are now decoration; 1.4.1 rests on weight, border width and the underline |
| 12 | minor | The ink ring does cross a `--primary` frame in the theme and language options | C9 and PA-Q8, linked to row 135 |
| 13 | minor | The "later" tokens had no lasting home | Appendix to A-57 in `docs/requirements.md` (A-57, PA-Q7, §9) |
| 14 | minor | §7 understated where the pixel cost lands | §7 reworded |
| 15 | note | `--hover-filter` belongs on `#app` | C16 and the table note; the `:root` clause dropped from FR-65 |
| 16 | note | "Nearest value" needs qualifying | Table note and PA-Q2 |
| 17 | note | Shadow sources | Table rows corrected |
| 18 | note | The dark level-card figure | C17 and PA-Q6: 1.90 |
| 19 | note | "Largest residual in every shot" had no evidence | Basis cites the README and the backdrop exception |
| 20 | note | `background-image` is not scanned | §6, optional helper addition |
| 21 | note | A paraphrase in guillemets | Basis reworded |
