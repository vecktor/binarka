# Change: update-page-backdrop

## Why

NFR-14 compares the page with the frozen reference `design/v0-screenshots/review-set-14/` per shot, at 0.98. Run 7 of `npm run check:visual` scores 82 of 170 (`docs/qa/g2/check-visual-run-7.txt`; `docs/qa/visual-diff/README.md`, the run 7 section). Block 2 (palette, archived `2026-10-10-update-page-palette`) made the main column match the design's paint. The shots that still fail with a panel or a dialog open are dominated by what is under and around the surface. The light rules shots at 1024, 1366 and 1440 are the clearest case: 0.13 to 0.22, because the whole viewport is dimmed by the wrong colour (the text colour at 0.3 where the design dims with a brown at 50%).

This is block 3 of G2, one change folder per block (autonomy-log row 148). No requirement changes: FR-65 and A-57 already sign the two translucent backdrop tokens (`--color-backdrop-soft` and `--color-backdrop-strong`, marked "later") and the rule "a backdrop is checked composited over the page". This block binds them. This folder adds no requirement id.

## What Changes

- **`play-page` spec, MODIFIED (4):**
  - «Borders, cues and focus rings have enough contrast», five edits: (a) the sentence "the 25 that the main column binds" becomes the 27 sentence (the 25 of block 2 and the two backdrop tokens that the appendix marks "later"); the table gains the two backdrop rows, value for value from the appendix to A-57 (light `#46280f38` and `#2d190a80`, dark `#08050273` and `#08050299`); (b) the paragraph after the table gains a parenthetical on the role column (it names the surfaces that bind each backdrop, which the appendix abbreviates to one); (c) the "later" list loses the backdrops and spells the shadows out as `--color-shadow-sunken`, `--color-shadow-panel` and `--color-shadow-sheet`; (d) three tokens are translucent (`--color-success-glow` and the two backdrops), and a clause is added that a backdrop is checked composited over the page instead of as a pair; (e) the scenarios that say 25 or "24 and one" say 27 and "24 and three", and «The token reader accepts a translucent value only for a translucent token» gains `--color-backdrop-strong` in its sample and says "two translucent tokens".
  - «Effective theme on the document»: the body gains one sentence (the backdrops of the surfaces are translucent tokens that dim the page in each theme) and Traces gains A-57; the scenario «In dark every backdrop dims the page» is restated as the backdrop composited over `--color-page` (alpha compositing in sRGB), with a light counterpart «In light every backdrop dims the page»; the old form took `contrastRatio(colour, '#ffffff')` of the token, which throws on `#rrggbbaa`.
  - «Main column layout geometry follows the design reference»: one scenario («Colours are the G2 palette») counts 27 tokens instead of 25. Nothing else in it changes.
  - «The main column takes the design palette»: one sentence. It said the backdrops "keep their current token bindings until their own blocks"; they are now covered by the new requirement.
- **`play-page` spec, ADDED (1):** «The backdrops take the design's translucent tokens»: the surface-to-token map (rules: soft, strong from 64rem; setup sheet: soft; settings: soft; confirm: strong), `background-color` and no `opacity` on any `::backdrop`, no dark-only override, strong darker than soft, the fade explicitly not ported, and a sampled browser check of the composited pixel.
- **`src/ui/style.css` only:** the two tokens in both blocks; the four `::backdrop` rules move from `background-color: var(--color-text)` plus `opacity` to the token; one `@media (min-width: 64rem)` rule for the rules panel; the dark overrides (~1055-1065, with their comment) are deleted. `design/v0` is not touched.
- **New check mechanism:** `e2e/nfr-14-backdrop.spec.ts` (10 sampled cases) and a stylesheet unit test. No change to `playwright.config.ts` (the `layout` project's `testMatch` already has `nfr-14-*`).

## Baseline requirements touched

| Baseline requirement | Action |
|---|---|
| Borders, cues and focus rings have enough contrast | MODIFIED |
| Effective theme on the document | MODIFIED (one sentence in the body, Traces gains A-57, one scenario restated, one added) |
| Main column layout geometry follows the design reference | MODIFIED (one scenario) |
| The main column takes the design palette | MODIFIED (one sentence) |
| The backdrops take the design's translucent tokens | ADDED |

## Impact

NFR-14: the dim of every surface becomes the design's. Per-shot scores are expected to rise, most on the light rules shots from 64rem; this change claims no pixel floor (see design.md, "What should move").

Tests that change on purpose, each with the delta that demands it (the memory rule: a test changes only when a changed spec demands it). Delta 1 is «Borders…», 2 «Effective theme…», 3 «Main column layout geometry…», 4 «The main column takes the design palette», 5 the ADDED requirement. Line numbers are those of today's files.

| Test | Lines (today) | What changes | Source |
|---|---|---|---|
| `tests/helpers/css.ts` | `TOKEN_NAMES` 366-370 (comment and array), `PALETTE_LIGHT` 399-403, `PALETTE_DARK` 431, `TRANSLUCENT_TOKENS` 463 (comment 459-462) | 27 names and values; the two backdrops are translucent; new exports for the composite and the relative luminance (`contrastRatio` and `rgbOf` must keep refusing `#rrggbbaa`) | 1, 2 |
| `tests/play-page-helpers.test.ts` | 378-418 (`DESIGN_TOKENS` fixture and its comment) | the fixture follows `TOKEN_NAMES`: 27 names | 1 |
| | 437-442 | the comment and `toHaveLength(25)` and the key list | 1 |
| | 1149-1181 (`DARK_SAMPLE`), assertions 1232 and 1268-1270 | the dark sample gains the two dark backdrop rows (`--color-backdrop-soft` `#08050273`, `--color-backdrop-strong` `#08050299`); these assertions are forward guards, not reds against the old helper: they pass as soon as the sample gains its rows, and they would fail if it lacked them once the fixture and the stylesheet carry 27 tokens: `expect(dark?.tokens).toEqual(DARK_SAMPLE)` (27 against 25 keys), and `injectPageStyles(DARK_SAMPLE)` leaving `var(--color-backdrop-*)` uninlined (`tests/helpers/css.ts:511-513`), so `not.toMatch(/var\(\s*--color-/)` fails (shown on a scratch copy with the port and a 25-row sample: 3 failed; `docs/qa/update-page-backdrop/red-run.txt`) | 1 |
| | 480 | `[...TRANSLUCENT_TOKENS]` equals the three names | 1 |
| | 596-625 | the translucent reader accepts the backdrops; the `#rrggbbaa` on `--color-page` is still rejected | 1 |
| | 1193 | `tokenDeclarations` has 27 | 1 |
| | new | self-tests of the composite and luminance helpers (the four composites of the spec) | 2, 5 |
| | 627-629 | keeps refusing `#rrggbbaa` (unchanged, a guard) | 1 |
| `tests/play-page-stylesheet.test.ts` | 85-102 | the 27 names, `#rrggbbaa` for the three translucent only | 1 «Tokens exist and are literal» |
| `tests/play-page-theme-stylesheet.test.ts` | 63-87 | «In dark every backdrop dims the page» restated as the composite over the dark page; «In light…» added; no dark-only `::backdrop` rule | 2 |
| | 94-107 | the dark block declares the 27 names and adds none (comment 94-95 says "25") | 1 |
| `tests/play-page-level-stylesheet.test.ts` | 212-223 | "the 25 tokens" and "no 26th colour token" become 27 and "no 28th" | 1 |
| `tests/play-page-layout-geometry.test.ts` | 9-67 (`LIGHT`, `DARK`), 69-74 | the two literal copies gain the backdrop rows; `toHaveLength(27)` | 3 |
| `tests/play-page-palette-stylesheet.test.ts` | 67 (title) | reads `TOKEN_NAMES` dynamically, so the two backdrops must be bound; only the title text "25" changes | 1 «Every declared token is bound» |

Tests that pin today's backdrop paint beyond the above: none. `grep` of `tests/` and `e2e/` for `::backdrop`, `backdrop` and `opacity` finds only the theme test above; the `opacity` hits (`tests/play-page-theme-stylesheet.test.ts:129,189`, `tests/play-page-level-stylesheet.test.ts:72,150,166`, `tests/play-page-helpers.test.ts:676`) are about other selectors or a literal sample and do not change. Unchanged but must stay green: `e2e/nfr-13-a11y.spec.ts` (axe does not read `::backdrop`), `e2e/nfr-14-palette.spec.ts` and `e2e/nfr-14-layout-geometry.spec.ts` (they open no surface).

New tests: `tests/play-page-backdrop-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-65`: the map, no `opacity`, the strong-over-soft order, the fade not ported, no dark override) and `e2e/nfr-14-backdrop.spec.ts` (`@trace NFR-14`: the composited pixel, 10 cases).

Other requirements: FR-104, FR-106, FR-116, NFR-9, NFR-10, NFR-12, NFR-13 and NFR-18 must keep passing; FR-65, A-57 and NFR-14 are unchanged in text.

## Scope NOT delivered

- The panels', the sheet's and the dialog's own paint (fill, border, shadow) and the "later" tokens `--color-surface-raised`, `--color-overlay-border`, `--color-option-border`, `--color-violation-ink` and the three shadows: later blocks. The setup sheet in particular stays far from 0.98 (run 7: 0.75 to 0.94).
- The backdrop fade (`transition`, `@starting-style`): not ported (design.md, decision 3).
- Per-shot pixel floors are NOT claimed, nor a pass of `npm run check:visual`. Run 8 is telemetry for this block.
- The coverage of the new pixel check is sampled (10 cases), never continuum.
