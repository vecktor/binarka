# Change: update-confirm-dialog

## Why

NFR-14 compares the page with the frozen reference `design/v0-screenshots/review-set-14/` per shot at 0.98. In run 12 (`docs/qa/g2/check-visual-run-12.txt`) 4 of the 10 confirm shots fail, all of them phones: `320-dark-confirm` 0.9180, `320-light-confirm` 0.9194, `375-dark-confirm` 0.9590 and `375-light-confirm` 0.9582; the six from 768 pass (0.9836 to 0.9904). The gate's own failing pixels, bucketed by element box and colour pair (`docs/qa/prep-g2-wave2/classify.txt`, every score equal to run 12 to four places), name the causes:

- **«Скасувати» is unpainted**: the design fills it with the primary orange (`#b4460d` light, `#f39a5b` dark), the page shows the base button fill. 42,755 failing pixels at 320 light, 22,652 at 375 light, the largest single cause in every confirm shot.
- **The dialog is smaller than the design's**: 288px wide at 320 against 296 (the page's fixed 32px against twice `--page-pad`, 0.75rem at 22.5rem and narrower), 8px shorter at 320 (210 against 218) and 10px shorter at 375 (156 against 166), with 12px corners against 16px and 20px of padding against 24px. 22,858 pixels at 320 light, 18,779 at 375 light.
- **«Так, почати» is unpainted**: its red frame and soft red fill are missing (6561 pixels at 320 light, 5316 at 375 light).
- **The text sits 4px further left and is 8px wider at 375** (301 against 293), so its lines start at another pixel (4156 pixels at 375 light).

This is block C of the second wave of the parallel G2 plan (`docs/handoff/parallel-g2-plan-2026-10-11.md`), written from the draft `docs/handoff/dialog-amendment-draft-2026-10-12.md`. The user signed the text in chat on 2026-10-12 at about 12:02 (UTC+5:30), autonomy-log row 193: SP-1 «No slice, dialog first», OQ-1 «Accept adjacency» and «Signed, use defaults» for DQ-1 (own token `--color-violation-ink`), DQ-2 (the design's width formula), DQ-3 (no hover, press, fade or scale) and DQ-4 (the presentation sentence lives in FR-67 and the ADDED requirement only). The signed text is `docs/requirements.md` FR-67 (the presentation sentence), FR-65 (the dialog clause), NFR-14 (the placement phrase), A-62 and the A-57 appendix row `--color-violation-ink`. This folder adds no requirement id and changes no signed text.

**This folder is written as baseline after the wave-1 blocks.** `main` holds `update-panel-shell`, `update-rules-panel` and `update-setup-sheet`: 32 tokens, 5 translucent, 41 pairs. The MODIFIED blocks below start from that text. The settings-panel block (`update-settings-panel`) runs in parallel and has its own folder; the split is in `design.md`.

## What Changes

- **One token, one pair.** `--color-violation-ink` (`#8f1d17` / `#ffb4ab`, not translucent) makes 33 tokens, 28 of them `#rrggbb`, in the spec table right after `--color-focus` (the appendix order), so `TOKEN_NAMES.at(-1)` stays `--color-option-border`. One pair of FR-65: `--color-violation-ink` on `--color-violation-bg` (7.34 light, 8.40 dark, group `text`): 41 pairs become 42, 16 text pairs become 17. The red frame of «Так, почати» (6.43 / 6.54 on the dialog fill) is recorded as decoration, in no pair (A-60 reasoning).
- **The dialog's size, place and paint (FR-67, A-62),** from the design: `width: min(22rem, calc(100vw - 2 * var(--page-pad)))`, `padding: 1.5rem`, `border-radius: var(--radius-l)`, the text's bottom margin 1.5rem; the buttons `padding: 0 1rem`, a 2px border, `var(--radius-m)`, line height 1.2, 44px tall; «Скасувати» the filled primary, «Так, почати» the violation colours (fill, 2px frame, `--color-violation-ink` text). The fill, border and shadow stay the shell's. No DOM change.
- **`play-page` spec, MODIFIED (5):** «Confirmation before discarding player entries» (one sentence: the stale "held NFR-13 and NFR-14" now points at A-62, the user's «Fix the sentence», 2026-10-12); «Borders, cues and focus rings have enough contrast» (the token row, the role column, the "later" sentence becomes the binding, the token sources, the counts 32 to 33, 27 to 28 `#rrggbb`, 41 to 42 pairs, 16 to 17 text, the new pair in the text list and in the 4.5:1 scenario, one new scenario), and three count-only requirements: «Main column layout geometry follows the design reference» (the token-count scenario), «The panels take the shared surface paint» (the pair-count scenario) and «The rules panel takes the design's size, place and paint» (the count clause). **ADDED (1):** «The confirmation dialog takes the design's size, place and paint».
- **`src/ui/style.css`** (the `.confirm`, `.confirm p` and `.confirm-buttons button` rules, two new `[data-confirm]` rules, the one `:root` token in both sets). No change to `src/ui/play-page.ts`.
- **Tools:** `quality/design-geometry.json` gains the key `confirmDialog` (5 cases) via `scripts/freeze-design-geometry.mjs`, first of the two wave-2 blocks; `scripts/visual-block.mjs` gains the block `confirm`. New checks: `tests/play-page-confirm-dialog-stylesheet.test.ts` and `e2e/nfr-14-confirm-dialog.spec.ts`.

## Baseline requirements touched

| Baseline requirement (`openspec/specs/play-page/spec.md`) | Action |
|---|---|
| Borders, cues and focus rings have enough contrast | MODIFIED (33 tokens, 28 `#rrggbb`, 42 pairs, 17 text; the row `--color-violation-ink`; the role column of seven rows; the "later" sentence; the frame-is-decoration sentence after the table (design.md decision 4); one scenario added; Traces + FR-67, A-62, NFR-14) |
| Main column layout geometry follows the design reference | MODIFIED, count only (the scenario «Colours are the G2 palette»: 32 to 33 tokens, the dialog token named; Traces + A-62) |
| The panels take the shared surface paint | MODIFIED, count only (the scenario «The raised fill is covered by pairs»: 41 to 42 pairs; Traces + A-62) |
| The rules panel takes the design's size, place and paint | MODIFIED, count only (the clause "32 tokens and 41 pairs since `update-setup-sheet`" becomes "33 tokens and 42 pairs since `update-confirm-dialog`"; Traces + A-62) |
| Confirmation before discarding player entries | MODIFIED, one sentence ("covered by the held NFR-13 and NFR-14" → A-62, NFR-13 and NFR-14 not held; the user's word on the folder audit, 2026-10-12) |
| The confirmation dialog takes the design's size, place and paint | ADDED |

Checked and not modified (their text stays true): «The backdrops take the design's translucent tokens» (its item (2) says `--color-violation-ink` is "not declared by this requirement or by the shell", still true of that requirement), «The main column takes the design palette», «The panels take the shared surface paint» apart from its count (its "not delivered by the shell" list names the dialog's token as a later block's, a statement about the shell change).

## Impact

Line numbers are those of this branch at `019808f` (`main` plus the signed wave-2 amendments); the implementing session re-greps them (task 1.1). A test changes only when a changed spec demands it: 32 to 33 tokens, 41 to 42 pairs, translucent unchanged (5). The new name goes in appendix order after `--color-focus` and before `--color-backdrop-soft`, so `TOKEN_NAMES.at(-1)` stays `--color-option-border` and the setup-sheet test's line 812 is unchanged.

| File | Lines | What | Source |
|---|---|---|---|
| `tests/helpers/css.ts` | comments 402, 409, 448; `TOKEN_NAMES` 412-444; `PALETTE_LIGHT` 458-491; `PALETTE_DARK` 493-526; comment 647; `CONTRAST_PAIRS` 664-678 | 33rd name after `--color-focus`, its two values; `pairs('text', 'violation-ink', ['violation-bg'], 4.5)`; 41 to 42; no new `PairGroup`; `TRANSLUCENT_TOKENS` unchanged; comments follow | Borders |
| `tests/play-page-helpers.test.ts` | `DESIGN_TOKENS` 404-437, 483, 491-492 (`… + 16` to `… + 17`, 41 to 42), `DARK_SAMPLE` 1503-1536, 1551 | the fixture gains the row; `toHaveLength(32)` to 33; the dark sample gains the row | Borders |
| `tests/play-page-theme-stylesheet.test.ts` | 168, 171, 180 | 32 to 33 | Borders |
| `tests/play-page-cause-stylesheet.test.ts` | 216, 217 | 41 to 42, 32 to 33 | Borders |
| `tests/play-page-level-stylesheet.test.ts` | 236 (and the message at 246, "no 33rd" to "no 34th") | 32 to 33 | Borders |
| `tests/play-page-palette-stylesheet.test.ts` | 75 (title) | 32 to 33; the body reads `TOKEN_NAMES`, so it requires `--color-violation-ink` to be bound | Borders |
| `tests/play-page-layout-geometry.test.ts` | `LIGHT` 27-60, `DARK` 61-94, 97, 101 | both copies gain the row; the title and `toHaveLength(32)` become 33 | Main column |
| `tests/play-page-stylesheet.test.ts` | 99, 101, 112 | 32 to 33 (the `#rrggbbaa` list stays five names) | Borders |
| `tests/play-page-panel-shell-stylesheet.test.ts` | 182, 189 | 41 pairs to 42 (still exactly four on the raised fill) | Panels |
| `tests/play-page-setup-sheet-stylesheet.test.ts` | 807 (`'41 pairs'`), 812 (`TOKEN_NAMES.at(-1)`) | 807: 41 to 42; 812 unchanged, a GUARD | Borders |
| `tests/play-page-rules-panel-stylesheet.test.ts` | comment 476-481; 482-532 (`BASELINE_TOKEN_NAMES`, `BASELINE_PAIRS`, the literal lists), 560-561 | the two literal baseline lists gain the name and the pair (a deliberate change, the source named); the guard still compares the helper's lists with them | Rules panel |
| `e2e/nfr-12-targets.spec.ts` (79-81), `e2e/nfr-13-a11y.spec.ts` (the confirmation state), `e2e/nfr-14-panel-shell.spec.ts`, `e2e/nfr-14-backdrop.spec.ts` | n/a | unchanged in text; they must stay green | NFR-12, NFR-13, NFR-14 |
| `quality/design-geometry.json` | new top-level key `confirmDialog` | cases added only; `cases`, `rulesPanel`, `setupSheet`, `selectors`, `tolerancePx`, `designCommit` and `designCssSha1` stay; the key carries its own provenance | NFR-14 |

New tests (red first, by the test-engineer of the implementing session): `tests/play-page-confirm-dialog-stylesheet.test.ts` (`@trace FR-67`, `@trace FR-65`, `@trace NFR-14`) and `e2e/nfr-14-confirm-dialog.spec.ts` (`@trace NFR-14`, `@trace FR-67`, project `layout`; `playwright.config.ts` is not edited). No test names the token other than through the pins above. Locked files: `scripts/check-visual-parity-adapters.mjs` is not edited; `scripts/freeze-design-geometry.mjs` and `scripts/visual-block.mjs` are ordinary edits.

Other requirements that must keep passing: FR-65, FR-67, FR-98, FR-101, NFR-9, NFR-12, NFR-13, FR-111 (the English texts of the dialog).

## Scope NOT delivered

- Hover and press paint of the two buttons, the dialog's fade and scale (DQ-3); the dialog in Safari and Firefox (NFR-7).
- A pixel floor for any confirm shot. All ten are expected to rise and the four phone shots to pass if the box and the paint match; if one does not rise, the block stops and explains it before the review gate.
- A refreeze of `quality/design-paint.json`: the buttons' paint is compared live with the design build.
- The settings panel (`update-settings-panel`, the other wave-2 block); any change of the focus ring, the dialog's text, the backdrop or the DOM.
- Coverage is sampled: five confirm widths for the boxes, two schemes at two viewports for the paint; never continuum.
- A latent gap of the per-block tool, accepted by the user at review gate round 2: `scripts/visual-block.mjs` counts a box with width but zero height (or the reverse) as measured; no current state produces one (every closed sheet or dialog is 0×0, which fails as nothing measured).
