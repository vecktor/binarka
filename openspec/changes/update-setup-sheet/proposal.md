# Change: update-setup-sheet

## Why

NFR-14 compares the page with the frozen reference `design/v0-screenshots/review-set-14/` per shot at 0.98. In run 9 (`docs/qa/g2/check-visual-run-9.txt`) all 48 setup shots (6 viewports, light and dark, the states setup, setup-four, setup-marked and setup-marked-four) fail, 0.7527 (`320-dark-setup`) to 0.9447 (`1440-light-setup-four`). The causes are the sheet's size and place (a 28rem box in the middle from 48rem; 80dvh on phones against the design's 88dvh), the level cards' paint and ring, the missing indent of the description, the outlined «Почати», and, at 1366×650, the cut bottom of the idle line under the sheet (`docs/qa/update-page-layout-geometry/stills/1366-dark-setup.png`).

This is block B of the parallel G2 plan (`docs/handoff/parallel-g2-plan-2026-10-11.md`). The user signed the text on 2026-10-11 (autonomy-log row 172): SQ-1 A «keep the design value as decoration», SQ-2 withdraw `--color-shadow-sunken`, SQ-3 A the radial-gradient dot, SQ-4 the sizes in FR-96, SQ-5 keep the 28px level margin, SQ-6 no motion, XQ-1 A `data-size` on the root. The signed text is `docs/requirements.md` FR-65 (the ring clause), FR-96, FR-99, FR-91, FR-101, NFR-12 to NFR-14, A-57 (appendix), A-60 and the final note, and `docs/handoff/setup-sheet-amendment-draft-2026-10-11.md`. This folder adds no requirement id and changes no signed text.

**This folder is written as baseline after `update-panel-shell`.** The shell is archived and merged into `main` before the session that implements this folder starts: 31 tokens, 5 translucent, 38 pairs, the shared fill, border and shadow of the sheet, and the root's `data-size` with the size variables on `#app`. The MODIFIED blocks below start from the shell's text. Block A (`update-rules-panel`) runs in parallel and may merge first; this folder does not touch A's requirements.

## What Changes

- **One token, three pairs.** `--color-option-border` (`#c4b59c` / `#5a5045`, not translucent, in no pair: decoration, A-60) makes 32 tokens, 27 of them `#rrggbb`. Three pairs of FR-65: `--color-control-border` on `--color-control-bg` (the ring, 3.68 / 4.13; group `control-border`), `--color-primary` on `--color-control-bg` (the dot, 5.40 / 7.39) and `--color-primary` on `--color-surface-raised` (the checked border on the sheet, 5.40 / 6.82; both group `hinted-cue`). None existed (checked in `CONTRAST_PAIRS`): 38 pairs become 41. `--color-shadow-sunken` is already withdrawn by the shell's text.
- **The sheet's size and place (FR-96, A-60),** from the design: phone `88dvh` (`90vh` fallback), `100dvh - 9rem` at 22.5rem and narrower; from 48rem on a window under 44rem tall a full cover from 6rem, the column plus 1rem wide; on a window at least 44rem tall anchored 9.75rem from the top, the column wide; the `min-height` floors through the root's `--board-width`. The body's line height (the placeholder `line-height: normal` goes).
- **The cards' paint and the indent:** ring 0.875rem, available card border `--color-option-border`, checked card and checked size option `--color-primary` on `--color-primary-soft`, the radial-gradient dot, the dashed unavailable card in `--color-text-muted`, the reason line's 3px accent, «Почати» filled, «Закрити» with a 2px `--color-control-border` border; the design's inner paddings (the page's base `button` padding is not the design's). The level group's bottom margin stays 28px (the stated departure, SQ-5).
- **`play-page` spec, MODIFIED (9; the ninth, «Cells and buttons show a visible, unobscured focus indicator», added on the user's decision of 2026-10-11):** «Borders, cues and focus rings have enough contrast», «Main column layout geometry follows the design reference», «The panels take the shared surface paint» (one scenario: the raised fill now has a fourth pair), «Setup sheet», «Level selector» (stale "held"), «The summary and level buttons set their own colours», «Start button» (stale "held") and «The start button and the sheet buttons meet the touch-target floor». **ADDED (1):** «The setup sheet takes the design's size, place and paint».
- **`src/ui/style.css`** (the sheet's rules, the level and size rules in the sheet, the start and close rules, the reason line, the one `:root` token in both sets). No change to `src/ui/play-page.ts` (the DOM is unchanged).
- **Tools:** `quality/design-geometry.json` gains the key `setupSheet` (12 cases) via `scripts/freeze-design-geometry.mjs`; `scripts/visual-block.mjs` gains the block `setup`. New checks: `tests/play-page-setup-sheet-stylesheet.test.ts` and `e2e/nfr-14-setup-sheet.spec.ts`.

## Baseline requirements touched

| Baseline requirement (`openspec/specs/play-page/spec.md`) | Action |
|---|---|
| Borders, cues and focus rings have enough contrast | MODIFIED (post-shell text; 31 to 32 tokens, 38 to 41 pairs; the role column of four rows; the option-border decoration sentence; the two ring-pair bullets; two scenarios added (the ring pairs, the option border in no pair); Traces + A-60) |
| Main column layout geometry follows the design reference | MODIFIED (post-shell text; the line-height sentence goes; the token-count scenario follows 31 to 32; Traces + A-60) |
| The panels take the shared surface paint | MODIFIED (post-shell text; the fourth pair on the raised fill: one sentence, one scenario; the shell's own sentences and its two change-time scenarios rewritten in the past tense and attributed to update-panel-shell; Traces + A-60) |
| Setup sheet | MODIFIED (the "held" sentence becomes FR-96's presentation; Traces + NFR-12, NFR-14, A-60) |
| Level selector | MODIFIED (the stale "held NFR-10, NFR-12 and NFR-14" sentence; Traces + NFR-12, NFR-14, A-60) |
| The summary and level buttons set their own colours | MODIFIED («Почати» bound; the dot scenario; the `.size-control` parenthetical; the held NFR-14 look sentence rewritten; Traces + NFR-14, A-57, A-60) |
| Start button | MODIFIED (the stale "held NFR-14" sentence; Traces + NFR-14, A-60) |
| The start button and the sheet buttons meet the touch-target floor | MODIFIED (the stale "held NFR-14"; Traces + NFR-14) |
| Cells and buttons show a visible, unobscured focus indicator | MODIFIED (the walk's 375-wide viewport 375×667 → 375×600, where the sheet still scrolls; Traces + NFR-13; added 2026-10-11 on the user's decision, `docs/qa/update-setup-sheet/green-run.txt`, open finding 2) |
| The setup sheet takes the design's size, place and paint | ADDED |

Checked and not modified (the design says what was read): «Level option content» (it holds no "held"; the stale word was in `docs/requirements.md` FR-99, already amended), «The size buttons set their own colours and the board disables double-tap zoom» (it pins `color` and `background-color` tokens and 4.5:1 only; the checked size option's `--color-text` on `--color-primary-soft` is 12.96 / 11.50), «Cells and buttons show a visible, unobscured focus indicator» (its `scroll-padding-bottom` value and the "up to 24px" bound stay true with the design's 16px bottom padding), «Summary button» (outside the sheet; its "held" sentence is left for the user, see `design.md`).

## Impact

Line numbers re-grepped at `ebaf49b` after the shell's merge (`docs/qa/update-setup-sheet/folder-audit.md`, section «Re-read after the shell's merge»). "The lines the shell changed" are 31 to 32 and 38 to 41. A test changes only when a changed spec demands it.

| File | Lines (grep, this worktree) | What | Source |
|---|---|---|---|
| `tests/helpers/css.ts` | `TOKEN_NAMES` (~410), `PALETTE_LIGHT` (453), `PALETTE_DARK` (487), `CONTRAST_PAIRS` (653-667) | 32nd name `--color-option-border` last, its two values; `pairs('control-border', 'control-border', ['page', 'control-bg'], 3)`; the `hinted-cue` primary pair gains `control-bg` and `surface-raised`; 38 to 41; no new `PairGroup` (627); `TRANSLUCENT_TOKENS` (528) unchanged; comments follow | Borders |
| `tests/play-page-helpers.test.ts` | `DESIGN_TOKENS` (400-432, comment 397), 474, 480-481 (comment 470-471), 506-510, 526-530, 1472 (the `DARK_SAMPLE` 1444-1476) and its comment (1441-1442), 1490 (comment 1489) | the fixture gains the light row; `toHaveLength(31)` to 32; `4 + 4 + 1 + 3 + 9 + 1 + 16` and `toHaveLength(38)` to `4 + 4 + 1 + 5 + 9 + 2 + 16` and 41; the `hinted-cue` list has five pairs; the pairs on `--color-surface-raised` are four (the shell pinned exactly three); the dark sample gains the row | Borders, Panels |
| `tests/play-page-cause-stylesheet.test.ts` | 212-213 (comments 12, 209) | 38 to 41, 31 to 32 | Borders |
| `tests/play-page-theme-stylesheet.test.ts` | 168, 177 (message), comment 164 and title 165 | 31 to 32 | Borders |
| `tests/play-page-level-stylesheet.test.ts` | 220, 230 ("no 32nd" becomes "no 33rd"; comment 217-218) | 31 to 32 | Borders |
| `tests/play-page-layout-geometry.test.ts` | 22-23 (comment), `LIGHT` (24) and `DARK` (57) copies, 92, 96 | both copies gain the row; the title and `toHaveLength(31)` become 32 | Main column |
| `tests/play-page-stylesheet.test.ts` | 98, 109 (message; the `#rrggbbaa` list stays five names), comment 94 and title 96 | 31 to 32 | Borders |
| `tests/play-page-palette-stylesheet.test.ts` | 73 (title; comment 71-72) | 31 to 32; the body reads `TOKEN_NAMES`, so it requires `--color-option-border` to be bound | Borders |
| `tests/play-page-panel-shell-stylesheet.test.ts` (the shell's new test) | comment 175-177, `it` 178-195 ("exactly three" 180-183, 38 at 185, ratio loop 186-194) | "exactly three" and "38 pairs" become exactly four and 41; the ratio loop gains `--color-primary` | Panels |
| `tests/play-page-level-stylesheet.test.ts` | 188 (and the stale "held" comment at 15) | the dot is a `background-image` with `radial-gradient(` instead of an `inset` `box-shadow` | Summary and level buttons |
| `tests/play-page-level-stylesheet.test.ts` | 122-175 («The start button declares its colours», `it` 126-174) | unchanged in text; it must stay green with the primary fill; a new assertion pins the two tokens | Summary and level buttons |
| `tests/play-page-stylesheet.test.ts` | 322-336 (`scroll-padding-bottom`) and 419-422 (size button colours) | unchanged | checked |
| `e2e/nfr-13-a11y.spec.ts` | 177-233 (focus not obscured, four viewports 180-185; the premise asserted at 194 and 231) | the 375-wide viewport `[375, 667]` becomes `[375, 600]` (the user's decision of 2026-10-11: with the design's metrics the sheet fits at 375×667 and the premise failed, `green-run.txt`, open finding 2); its premise (the sheet scrolls with 4×4 marked) is asserted at each viewport and a failure is a finding for the user | Focus indicator |
| `e2e/nfr-14-layout-geometry.spec.ts` | 124-126 (comment), 127-146 (the 1366×650 guard) | the comment says "the sheet keeps the normal line height until its own block" and goes; the test is unchanged and must pass; line 49 pins `cases` to 32 and is a guard | Main column |
| `e2e/nfr-12-targets.spec.ts`, `e2e/nfr-10-fit.spec.ts`, `e2e/nfr-14-panel-shell.spec.ts`, `e2e/nfr-14-backdrop.spec.ts`, `e2e/nfr-14-palette.spec.ts` | n/a | unchanged and must stay green | NFR-12, NFR-14 |
| `quality/design-geometry.json` | new top-level key `setupSheet` | cases added only, each with the design's `boxes` and the expected `expected` box (the design with the 28px margin of A-60, a recorded deviation); `cases`, `selectors`, `tolerancePx`, `designCommit` and `designCssSha1` stay as they are; the key carries its own provenance (the fresh build SHA-1 and browser; `designBuildSha1` differs between worktrees) | NFR-14 |

No test or e2e pins `line-height: normal` on `.setup-sheet` (grep of `tests/` and `e2e/` for `line-height` and `lineHeight`: no match); the sentence lives in the spec and in the comments named above. Locked files: `scripts/check-visual-parity-adapters.mjs` (in `factory-lock.json`) is not edited; `scripts/freeze-design-geometry.mjs` and `scripts/visual-block.mjs` are not locked (grep prints 0) and are ordinary edits.

New tests (red first, by the test-engineer of the implementing session): `tests/play-page-setup-sheet-stylesheet.test.ts` (`@trace FR-96`, `@trace FR-65`, `@trace NFR-14`); `e2e/nfr-14-setup-sheet.spec.ts` (`@trace NFR-14`, `@trace FR-96`, project `layout`; `playwright.config.ts` is not edited).

Other requirements that must keep passing: FR-65, FR-87, FR-91, FR-96, FR-97, FR-99, FR-100, FR-101, NFR-9, NFR-10, NFR-12, NFR-13, FR-111.

## Scope NOT delivered

- Motion of the sheet (SQ-6); the theme and language options' paint and the settings panel (second wave); the design's mask shadow on «Закрити»; the design's 24px and 1rem level margins (the 28px departure); the `cursor` of the unavailable card.
- A pixel floor for any setup shot. They are expected to rise; if one does not, the block stops and explains it before the review gate.
- A computed-paint comparison of the cards with the design build (the stylesheet scenarios and the gate cover it).
- The coverage of the new e2e checks is sampled (12 cases), never continuum; the fine-step sweep is a finer sample. Safari and Firefox are not tested (NFR-7).
- The idle-line cuts the sweep found between the samples, which the design's own sheet has too: a window 700 px tall, 768 to 1440 px wide (the full cover's bottom in the line), and the 4×4 state at 1024 px tall, 672 to 752 px wide (the bottom sheet's top in the line). Left to a later design question on the user's decision of 2026-10-11 (`docs/qa/update-setup-sheet/sweep.txt`).
