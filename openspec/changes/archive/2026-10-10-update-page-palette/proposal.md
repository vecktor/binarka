# Change: update-page-palette

## Why

NFR-14 compares the page with the frozen reference `design/v0-screenshots/review-set-14/` per shot, at 0.98. Run 6 of `npm run check:visual` scores 1 of 170 (`docs/qa/g2/check-visual-run-6.txt`). Block 1 (layout geometry, archived `2026-10-10-update-page-layout-geometry`) made the boxes of the main column match the design; what remains is paint, and the palette dominates it (`docs/qa/visual-diff/README.md`, the run 5 paragraph). The light `confirm` and `rules` shots are the exception: their missing backdrop dominates, a later block.

This is block 2 of G2, one change folder per block (autonomy-log row 148). The rules that pinned the old paint were amended first: FR-65 and A-51 were amended and A-57 (with the token appendix) was added, from `docs/handoff/palette-amendment-draft-2026-10-10.md`, signed on 2026-10-10 about 23:27 (PA-Q1 A, defaults for PA-Q2 to PA-Q8; row 157). This folder adds no requirement id.

## What Changes

- **`play-page` spec, MODIFIED (5):**
  - «Borders, cues and focus rings have enough contrast»: the token list becomes the 25 block-2 tokens of the A-57 appendix, with light and dark values; `#rrggbbaa` only for the translucent `--color-success-glow`; `color-mix(` stays forbidden everywhere, keyframes included; the bindings (`.cell` entry text, `.cell-given` given text, 1px, weight 800, `.cell-hinted`, `.message-win`, `button`, the focus rules); the pairs of section 5 of the draft (the given-fill pair for the cell border goes; the board plate, the solved plate, the hinted cue, violation text on the stripe, focus on the cell border, win text on the success plate come in); «The given cue has 3:1 and is not the fill» becomes «The given cue is weight».
  - «A violation shows a cue besides colour»: widths 1px, 1px, 2px, 2px; the underline as the longhands `text-decoration-line` and `text-decoration-thickness`; the stripe is decoration.
  - «Cells and buttons show a visible, unobscured focus indicator»: the ring's inner side shows the board plate; the quoted ratios are the A-57 values; the accepted adjacencies (PA-Q8) are recorded.
  - «The summary and level buttons set their own colours»: the clause "no `--color-*` token is added unless …" and the "13 tokens" scan go.
  - «Main column layout geometry follows the design reference»: the scenario «Colours are unchanged» becomes «Colours are the G2 palette».
- **`play-page` spec, ADDED (1):** «The main column takes the design palette» (NFR-14, FR-65, FR-64, A-57): the paint of each main-column element equals the design build's at 10 sampled cases, except the three deviations A-57 names, plus the stylesheet scenarios for the solved paint, the transparent action row, the hover ring, the win glow, the non-colour variables and the three copies of the light page colour.
- **`src/ui/style.css`:** the two token blocks, the main-column paint (page, header with logo and buttons, summary button, board plate and cells in every state, focus rings, action buttons with the win swap, message area), the hover ring and the win glow. Every `color: var(--color-control-border)` moves to `--color-text-muted`. The setup sheet, the panels, the dialog and the backdrops keep their current bindings; «Почати» keeps its current tokens.
- **`index.html`, `src/ui/preferences.ts`:** the light page colour copies become `#f7f3ea` (FR-106, FR-116, unchanged in text).
- **New check mechanism:** `scripts/freeze-design-paint.mjs` freezes the design build's computed paint into `quality/design-paint.json`; `e2e/nfr-14-palette.spec.ts` compares the built page with it. No change to `playwright.config.ts` (the `layout` project's `testMatch` already has `nfr-14-*`).

## Baseline requirements touched

| Baseline requirement | Action |
|---|---|
| Borders, cues and focus rings have enough contrast | MODIFIED |
| A violation shows a cue besides colour | MODIFIED |
| Cells and buttons show a visible, unobscured focus indicator | MODIFIED |
| The summary and level buttons set their own colours | MODIFIED |
| Main column layout geometry follows the design reference | MODIFIED (one scenario) |
| The main column takes the design palette | ADDED |

## Impact

NFR-14: the paint channel of the main column becomes exact at the sampled cases. Per-shot scores should rise a great deal, but this change claims no pixel floor.

Tests that change on purpose, each with the delta that demands it (the memory rule: a test changes only when a signed rule demands it; the signature of PA-Q1 A overrides the row-148 clause for the given-cue test, the cell-border-against-given-fill pair, the border-widths test and the count of 13). Delta 1 is «Borders…», 2 «A violation…», 3 «…focus indicator», 4 «The summary and level buttons…», 5 «Main column layout geometry…», 6 the ADDED requirement.

| Test | Lines (today) | What changes | Source |
|---|---|---|---|
| `tests/helpers/css.ts` | `TOKEN_NAMES` (365), `CONTRAST_PAIRS`, the hex reader | the 25 names; the pairs of the new list; a `#rrggbbaa` reader for translucent tokens, excluded from pairs; optionally `background-image` in the colour scan | 1 |
| `tests/play-page-stylesheet.test.ts` | 79-86 | the count of 13 becomes the list | 1 «Tokens exist and are literal» |
| | 111-125 | bindings: `.cell` text `--color-entry-text`; `.cell-given` text `--color-given-text` and border 1px | 1 «Rules use the tokens» |
| | 143 | the cell-border title and pairs (plate and solved plate in, given fill out) | 1 «Cell borders have 3:1» |
| | 151-166 | the given-cue test is replaced by «The given cue is weight» | 1 |
| | 444-450 | border widths 1, 1, 2, 2 | 2 |
| | 455-475 | the cascade: entry text, given text (`#f7f3ea` in dark), given in violation at weight 800 | 1 «The cascade gives each cell state …» |
| `tests/play-page-level-stylesheet.test.ts` | 206-219 | "13 names" and "no 14th token" become the list | 4 |
| `tests/play-page-theme-stylesheet.test.ts` | 90-100 | "the dark block redefines the 13 tokens and adds none" becomes every token of the list | 1 «Tokens exist and are literal» |
| `tests/play-page-layout-geometry.test.ts` | 10-46 | the 13 values become the 25 tokens and values | 5 |
| `tests/play-page-helpers.test.ts` | 378-418 | the `DESIGN_TOKENS` fixture follows `TOKEN_NAMES` | 1 |
| | 422 | the `CONTRAST_PAIRS` length | 1 |
| | 425-428 | the ratio regex that depends on the fixture's page | 1 |
| | 1068 | the `tokenDeclarations` length 13 | 1 |
| | 431 | keeps rejecting `rgb()`; a new case accepts `#rrggbbaa` only for a translucent token | 1 |

New tests: `e2e/nfr-14-palette.spec.ts` and a unit test for the stylesheet scenarios of delta 6 (solved hook, transparent action row, hover ring, glow keyframes, `:root` content, the three copies of the page colour).

Unchanged but read the new values dynamically: `tests/index-html.test.ts`, `tests/play-page-theme.test.ts`, `e2e/nfr-13-a11y.spec.ts`, `e2e/nfr-18-flash.spec.ts`. The helper default `addThemeColorMeta(content = '#f9fafb')` in `tests/helpers/play-page.ts:340` is not in the draft's inventory: it is a default, and if any test depends on it equalling the light page, that test follows delta 6 (the three copies of the light page colour) and is changed with that source named. They must stay green; a failure there is a finding, not a licence to edit the test. `tests/play-page-theme-stylesheet.test.ts:63-87` (the backdrop block) is NOT changed by block 2: no backdrop token is declared yet, so `contrastRatio(colour, '#ffffff')` does not meet an `#rrggbbaa` value; the backdrop block restates it.

Other requirements: NFR-9, NFR-13, NFR-10, NFR-12 and NFR-18 must keep passing; FR-64, FR-69, FR-104, FR-106, FR-116, FR-117 and NFR-14 are unchanged in text.

## Scope NOT delivered

- The setup sheet, the rules and settings panels, the confirmation dialog and their backdrops keep their current bindings, so they still change colour through the shared tokens (for example the light page) but are not ported. Later blocks declare the "later" tokens of the A-57 appendix (`--color-violation-ink`, `--color-surface-raised`, `--color-overlay-border`, `--color-option-border`, the backdrops and the shadows).
- «Почати» keeps its current tokens until the setup-sheet block.
- Known failures left to later blocks: the level card border (1.98 / 1.90) and the ink ring across a checked `--primary` frame in the theme and language options (2.94 / 1.88, row 135).
- Per-block pixel floors are NOT claimed, nor a pass of `npm run check:visual`. Run 7 is telemetry for this block (`docs/qa/g2/check-visual-run-7.txt`). The pixel cost of the three deviations from the design is measured by the per-block tool after the port and reported, not assumed.
- Hover and active feedback is not captured by NFR-14; `--hover-filter` and the pressed state are not ported here.
- The coverage of the new paint check is sampled (10 cases, one viewport), never continuum.
