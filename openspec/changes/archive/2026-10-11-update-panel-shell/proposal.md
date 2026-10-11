# Change: update-panel-shell

## Why

NFR-14 compares the page with the frozen reference `design/v0-screenshots/review-set-14/` per shot, at 0.98. Run 9 of `npm run check:visual` scores 84 of 170 (`docs/qa/g2/check-visual-run-9.txt`). The four surfaces that open over the page (the rules panel, the setup sheet, the settings panel and the confirmation dialog) still have the page's control fill, a pale border and no shadow. The design gives all four a raised fill, an overlay border and a drop shadow.

The next two G2 blocks, the rules panel (A) and the setup sheet (B), run in parallel (`docs/handoff/parallel-g2-plan-2026-10-11.md`, stream P). Both need the same four colour tokens from the A-57 appendix: `--color-surface-raised`, `--color-overlay-border`, `--color-shadow-panel` and `--color-shadow-sheet`. The stylesheet may not hold an unbound token, so one block cannot declare them for the others. If A and B each declared them, they would edit the same `:root` lines, the same token table, the same 27-token pins in eight test files and the same three requirements, and conflict at every merge. This small serial slice binds the four tokens once, before A and B start.

The user signed the slice on 2026-10-11 (autonomy-log row 172): PQ-1 «Yes, run it now» and XQ-1 «data-size on the page root». The signed text is `docs/handoff/setup-sheet-amendment-draft-2026-10-11.md` section 6 («The shared panel shell») and section 9 (the split), `docs/requirements.md` A-57 and its appendix, FR-65, A-59, A-60 and the 2026-10-11 note at its end. This folder adds no requirement id and changes no signed text.

## What Changes

- **Four tokens**, light and dark, from the appendix: `--color-surface-raised` (`#fffdf8` / `#2c2620`), `--color-overlay-border` (`#e2dbcc` / `#8a7f71`), `--color-shadow-panel` (`#00000040` both) and `--color-shadow-sheet` (`#0000002e` both). Tokens 27 to 31. Translucent tokens 3 to 5 (the two shadows join the glow and the two backdrops). A translucent token is never in a pair.
- **Paint only**, no width, height, place, radius, padding or line height: the raised fill on `.rules`, `.setup-sheet`, `.settings` and `.confirm`; on the setup sheet's footer strip (its gradient end and its offset shadow); and on «Закрити» in the sheet (`.setup-close`) and in the settings panel (`.settings-close`). The overlay border colour on `.rules`, `.setup-sheet` and `.settings` (today `--color-given-bg`). The dialog keeps `--color-control-border`: the design's `.confirm` border is `--cell-border`, whose values equal it. Shadows: `0 -0.5rem 2rem var(--color-shadow-sheet)` on the three panels below 48rem; `0 1rem 2.5rem var(--color-shadow-panel)` on the three panels from 48rem and on the dialog at every width.
- **Three contrast pairs** on `--color-surface-raised`: `--color-text` (15.88 / 12.79), `--color-text-muted` (7.17 / 6.96) and `--color-focus` (15.88 / 12.79). Pairs 35 to 38.
- **The board-size hook (XQ-1 A). This goes beyond paint, said plainly.** The page root (the element passed to `mountPlayPage`, `#app`) carries `data-size`, equal to the board's (4, 6 or 8; 6 at mount, also when no board is shown). The five size-dependent layout variables (`--n`, `--cell-max`, `--board-gap`, `--board-pad`, `--board-width`) move from the `.board` rules to `#app` rules keyed on it, so the board and the panels read the same `--board-width`. No new `:has(`. The page geometry does not change. It is in the shell because both blocks need the board side outside the board and run in parallel.
- **`play-page` spec, MODIFIED (4):**
  - «Borders, cues and focus rings have enough contrast»: the token table gains the four rows (27 to 31); the paragraph after it names the remaining "later" rows (`--color-violation-ink`, `--color-option-border`) and the withdrawn `--color-shadow-sunken`, and the translucent list grows to five; the focus-ring and the two text lists gain `--color-surface-raised`; the scenarios that say 27, `#rrggbb` for 24, "three translucent" or 35 pairs follow; one scenario is added for the three pairs; the token-reader scenario gains a shadow; `Traces:` gains A-57.
  - «The main column takes the design palette»: the sentence that kept the panels' bindings "until their own blocks" says the shell binds fill, border and shadow, and «Почати» keeps its tokens "until the setup-sheet block".
  - «The backdrops take the design's translucent tokens»: "not delivered" item (2) shrinks to `--color-option-border` and `--color-violation-ink`, and says `--color-shadow-sunken` was withdrawn.
  - «Main column layout geometry follows the design reference»: only the scenario «Colours are the G2 palette» (27 to 31 tokens). Every other sentence stays, the setup-sheet line-height sentence included (block B owns it).
- **`play-page` spec, ADDED (2):** «The panels take the shared surface paint» (NFR-14, FR-65, A-57) and «The page root carries the board size» (FR-43, FR-57, FR-96, A-59, A-60).
- **`src/ui/style.css`:** the four tokens in both sets; the paint bindings; the hook's variable rules moved from `.board` to `#app`; the comment above `#app`. **`src/ui/play-page.ts`:** the root's `data-size`, set at mount and wherever a board is created.
- **New checks:** `tests/play-page-panel-shell-stylesheet.test.ts`, `tests/play-page-root-size.test.ts` and `e2e/nfr-14-panel-shell.spec.ts` (the design build served live from `design/v0/out`). `playwright.config.ts` is not edited (the `layout` project's `testMatch` already has `nfr-14-*`).

## Baseline requirements touched

| Baseline requirement (`openspec/specs/play-page/spec.md`) | Action |
|---|---|
| Borders, cues and focus rings have enough contrast | MODIFIED |
| The main column takes the design palette | MODIFIED (one sentence) |
| The backdrops take the design's translucent tokens | MODIFIED (one item of one sentence) |
| Main column layout geometry follows the design reference | MODIFIED (one scenario) |
| The panels take the shared surface paint | ADDED |
| The page root carries the board size | ADDED |

No other baseline requirement is edited. `design.md` (section "What was checked") says what was read and why no delta is needed.

## Impact

Tests that change on purpose, each with the delta that demands it (a test changes only when a changed spec demands it). Delta 1 is «Borders…», 2 «The main column takes the design palette» (no test pins its sentence), 3 «The backdrops…» (no test pins its item), 4 «Main column layout geometry…», 5 «The panels take the shared surface paint», 6 «The page root carries the board size». Line numbers are those of today's files, checked by grep on 2026-10-11 at `main` `2e19235`.

| Test | Lines (today) | What changes | Source |
|---|---|---|---|
| `tests/helpers/css.ts` | 402-407 (comment), 408-436 (`TOKEN_NAMES`) | 31 names: the four shell names last, in the order of the spec table | 1 |
| | 439-444 (comment), 445-473 (`PALETTE_LIGHT`), 475-503 (`PALETTE_DARK`) | the four rows of the appendix, light and dark | 1 |
| | 506-510 (`TRANSLUCENT_TOKENS` and comment) | five names: the glow, the two backdrops, `--color-shadow-panel`, `--color-shadow-sheet` | 1 |
| | 616-624 (comment), 625-639 (`CONTRAST_PAIRS`) | three pairs: `text` and `text-muted` on `surface-raised` (group `text`), `focus` on `surface-raised` (group `focus-ring`); 35 to 38; no new `PairGroup` | 1 |
| `tests/play-page-helpers.test.ts` | 397-425 (`DESIGN_TOKENS`) | the fixture gains the four light rows (it must follow `TOKEN_NAMES`: line 464 compares it with `PALETTE_LIGHT`) | 1 |
| | 462 | `toHaveLength(27)` becomes 31 | 1 |
| | 468-469 | `4 + 4 + 1 + 3 + 8 + 1 + 14` and `toHaveLength(35)` become `4 + 4 + 1 + 3 + 9 + 1 + 16` and 38 | 1 |
| | 499-509 | the focus-ring background list gains `--color-surface-raised` (9 entries); a new assertion lists the three pairs on `--color-surface-raised` | 1 |
| | 514-518 (515) | the translucent set holds five names; the "no pair names one" loop stays | 1 |
| | 645-654 | the test title at 645 names the two backdrops and follows (it now covers the shadows too); the reader sample at 646 gains `--color-shadow-sheet: #0000002e`, the `toEqual` at 647 and the message at 648 follow (four tokens in the sample, of which the shell adds one), and the loop at 649-652 covers the two shadow names as well as the two backdrops: each is in `TRANSLUCENT_TOKENS` and in no pair | 1 |
| | 1391-1419 (`DARK_SAMPLE`) | the sample gains the four dark rows; without them 1471 (`toEqual(DARK_SAMPLE)`) and 1479 (`PALETTE_DARK` equals the sample) fail and `injectPageStyles(DARK_SAMPLE)` leaves `var(--color-surface-raised)` uninlined | 1 |
| | 1431-1432 | the comment and `toHaveLength(27)` become 31 | 1 |
| `tests/play-page-cause-stylesheet.test.ts` | 205-206 (comment at line 10) | `toHaveLength(35)` becomes 38, `toHaveLength(27)` becomes 31 | 1 |
| `tests/play-page-theme-stylesheet.test.ts` | 162, 165, 174 (comment 158-161) | the test title, `toHaveLength(27)` and the message become 31; the dark block redefines 31 | 1 |
| `tests/play-page-level-stylesheet.test.ts` | 216 (comment 213-215), 226 | `toHaveLength(27)` becomes 31; the message "no 28th colour token" at 226 is stale text and follows ("no 32nd") | 1 |
| `tests/play-page-layout-geometry.test.ts` | 18-45 (`LIGHT`), 47-75 (`DARK`), 78, 82 (comment 15-17) | both literal copies gain the four rows; the title and `toHaveLength(27)` become 31 | 4 |
| `tests/play-page-stylesheet.test.ts` | 92-110 (comment 84-91) | the title, `toHaveLength(27)` and the message become 31; the `#rrggbbaa` list at 107-110 becomes the five translucent names (sorted) | 1 |
| `tests/play-page-palette-stylesheet.test.ts` | 70 (comment 67-69) | only the title "27" becomes "31"; the body reads `TOKEN_NAMES`, so it now requires the four shell tokens to be bound by a rule outside `:root` | 1 |

Unchanged, checked and why: `tests/play-page-backdrop-stylesheet.test.ts` pins no "later" list and no token count (its pins are the five `::backdrop` rules and the backdrop pairs, lines 84, 106 and 147), so the shrunken item (2) of «The backdrops…» needs no edit there. `tests/play-page-palette-stylesheet.test.ts:228-233` (the one `:has(` guard) and `:296-304` (non-colour variables on `#app`) stay green and guard the hook. `tests/play-page-stylesheet.test.ts:316-322` (`scroll-padding-bottom`) is not touched. No test reads the `.board` rules for `--n`, `--cell-max`, `--board-gap`, `--board-pad` or `--board-width` (grep of `tests/`, `e2e/`, `scripts/`: only `tests/play-page-cause-stylesheet.test.ts:51` reads `var(--n)` and `var(--board-gap)` inside `.cell-cause::after`, which still inherits them). No test or helper pins the root's attributes: `tests/helpers/play-page.ts` `snapshot` records cells only, `collectEverything` (`tests/helpers/play-page.ts:1597`) reads the root's attribute values too, and the new value `6` is already the board's, so the seed scan (`tests/play-page-new-puzzle-and-seed.test.ts:281-306`) is unaffected.

Unchanged but must stay green: `e2e/nfr-14-layout-geometry.spec.ts` and `quality/design-geometry.json` (the hook must not move a box), `e2e/nfr-14-palette.spec.ts`, `e2e/nfr-14-backdrop.spec.ts`, `e2e/nfr-14-cause-mark.spec.ts`, `e2e/nfr-10-*.spec.ts`, `e2e/nfr-12-targets.spec.ts`, `e2e/nfr-13-a11y.spec.ts` (axe reads the text on the raised fill in the open panels, light and dark), `e2e/nfr-18-flash.spec.ts`.

New tests:

- `tests/play-page-panel-shell-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-65`): the stylesheet scenarios of «The panels take the shared surface paint».
- `tests/play-page-root-size.test.ts` (`@trace FR-43`, `@trace FR-57`, `@trace FR-96`): the jsdom scenarios of «The page root carries the board size», and the stylesheet scenario of the variables on `#app`.
- `e2e/nfr-14-panel-shell.spec.ts` (`@trace NFR-14`): 16 sampled computed-style cases against the design build, and 6 sampled cases of the hook (a panel outside the board reads the board's variables).

Other requirements: FR-43, FR-57, FR-65, FR-88, FR-96, FR-100, FR-101, FR-119, NFR-9, NFR-10, NFR-12, NFR-13 and NFR-18 must keep passing; FR-65, A-57, A-59 and A-60 are unchanged in text.

## Scope NOT delivered

- The rules panel's size, place, sticky «Зрозуміло» and example cells (block A), the setup sheet's size, place, level cards, size option, «Почати» and ring (block B), the other paint of the settings panel and of the confirmation dialog, and `--color-violation-ink` (the second wave). `--color-option-border` belongs to block B.
- The design's mask shadow on «Закрити» (`binarka.css` lines 543-545).
- A pixel floor for any shot, or a pass of `npm run check:visual`. Run 10 is telemetry for this slice; the expected movement and the stop rule are in `design.md`.
- The coverage of the new e2e checks is sampled (16 and 6 cases), never continuum. Safari and Firefox are not tested (NFR-7).
