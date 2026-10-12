# Change: update-settings-panel

## Why

NFR-14 compares the page with the frozen reference `design/v0-screenshots/review-set-14/` per shot at 0.98. In run 12 (`docs/qa/g2/check-visual-run-12.txt`) 142 of 170 shots pass. Of the 26 settings shots, **the 10 phone shots fail**, all at 320 and 375 (0.9077 to 0.9626); the 16 from 768 pass (0.9802 to 0.9950), several only just (`768-dark-settings` 0.9802, `1024-dark-settings` 0.9807). The numbers are in section 7 of `docs/handoff/settings-panel-amendment-draft-2026-10-12.md` and, by element and colour pair, in `docs/qa/prep-g2-wave2/classify.txt` (every score there equals run 12 to four places).

| Shots (run 12) | Score | What the failing pixels are |
|---|---|---|
| `375-light-settings`, `375-light-settings-dark`, `375-dark-settings`, `375-dark-settings-light` | 0.9604, 0.9394, 0.9336, 0.9626 | The sheet is 4px taller than the design's (281.5 against 277.5: «Закрити» 48 against 44, the base `button` padding), so every part sits 4px higher; the chosen theme and language option's paint (`--color-given-bg` and a dark frame against `--color-primary-soft` and an orange frame; the wider language option, 183.8 against 165 px); «Закрити»'s radius and weight |
| `320-light-settings`, `320-light-settings-focus`, `320-dark-settings-light` | 0.9430, 0.9390, 0.9458 | The sheet is 12px taller (281.5 against 269.5): the 4px of «Закрити» plus the 8px of the missing `padding-top: 1rem` at 22.5rem and narrower; 14972 px fall in the panel's box outside its controls; then the chosen options' paint and «Закрити» |
| `320-light-settings-dark`, `320-dark-settings`, `320-dark-settings-focus` | 0.9195, 0.9117, 0.9077 | As the 320 light shots, with the dark tokens (the dark chosen fill `#4d4438` against `#3d2b1e` is the largest pair) |

The `-dark-settings-light` shots render the stored light theme, so their causes are those of the light shots. From 48rem the panel hangs from the top, so a taller «Закрити» moves nothing above it; the paint causes act there too, which is why the wide shots sit just over the line.

This is the settings half of wave 2 of the parallel G2 plan (`docs/handoff/parallel-g2-plan-2026-10-11.md`). The user signed the text on 2026-10-12 (autonomy-log row 193): OQ-1 A (the ring over the chosen option's frame is an accepted adjacency; no new token), SP-1 A (no shared slice; the dialog block merges first and owns the token pins), and the defaults for OQ-2 (the cue is the weight and the appearing frame), OQ-3 (three rules, a test keeps them equal), OQ-4 (the language options are equal halves), OQ-5 (no hover, press or motion) and OQ-6 A (a sticky «Закрити» with the mask, a `scroll-padding-bottom` and a short-window focus walk). The signed text is `docs/requirements.md` A-61, FR-65 (the theme and language clause and the accepted adjacency), FR-117 (the chosen-option cue), A-57 (the known-failure sentence, now an accepted adjacency) and NFR-14, and `docs/handoff/settings-panel-amendment-draft-2026-10-12.md` (sections 9 and 10 included). This folder adds no requirement id and changes no signed text.

## What Changes

- **The panel's size (A-61).** Phone: `max-height` `60vh` then `55dvh`, padding `1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`, and at 22.5rem and narrower `padding-top: 1rem`. From 48rem the dropdown is not edited.
- **The theme and language options take the size options' segmented paint:** `--color-text-muted` on `--color-control-bg`, 0.9375rem, weight 500, line height 1.2, `padding: 0 0.5rem`, a 2px transparent border; the chosen one `--color-text` on `--color-primary-soft` with a `--color-primary` frame and weight 700, with no inner ring. Theme options `flex: 1 1 auto`, language options `flex: 1 1 0` (equal halves). Three rules, one per control, in the same literal forms as `.size-control button`; a test keeps them equal.
- **«Закрити»** sticky at the bottom with the mask, 44px tall, `--radius-m`, weight 600; the open panel reserves it in `scroll-padding-bottom`.
- **The ring over a chosen option's frame (OQ-1 A):** the keyboard ring of a chosen size, theme or language option over its `--color-primary` frame (2.94 light, 1.88 dark) is recorded as an accepted adjacency; the outer band lies on the card fill at 15.88 / 13.85. No token, no pair.
- **`play-page` spec, MODIFIED (4):** «Cells and buttons show a visible, unobscured focus indicator», «Settings button and panel», «The theme options set their own colours», «The setup sheet takes the design's size, place and paint» (its guard sentence and one scenario clause). **ADDED (1):** «The settings panel takes the design's size, place and paint».
- **`src/ui/style.css`** (`.settings`, `.settings:popover-open`, `.theme-control`, `.language-control`, `.settings-close` only). No change to `src/ui/play-page.ts` (the DOM is unchanged). No colour token.
- **Tools:** `quality/design-geometry.json` gains the key `settingsPanel` (7 cases) via `scripts/freeze-design-geometry.mjs`; `scripts/visual-block.mjs` gains the block `settings`. New checks: `tests/play-page-settings-panel-stylesheet.test.ts` and `e2e/nfr-14-settings-panel.spec.ts`.

## Baseline requirements touched

| Baseline requirement (`openspec/specs/play-page/spec.md`) | Action |
|---|---|
| Cells and buttons show a visible, unobscured focus indicator | MODIFIED (the fourth accepted adjacency; the scenario «The ring's accepted adjacencies are recorded» gains the bound `--color-focus` on `--color-control-bg` at least 13.85, no new pair; the last sentence gains the settings panel's `scroll-padding-bottom`; Traces + A-61, A-57) |
| Settings button and panel | MODIFIED (the layout sentence points at A-61 and at NFR-14, not held, `review-set-14`; Traces + NFR-12, NFR-14, A-61) |
| The theme options set their own colours | MODIFIED (the cue sentence, its two scenarios and the stale "(held NFR-14)"; the 4.5:1 scenarios stay; Traces + NFR-14, A-61) |
| The setup sheet takes the design's size, place and paint | MODIFIED (the sentence "still use `--color-focus` and `--color-given-bg`" and the scenario clause become "the three checked rules agree"; the heading of that scenario, «Only the size options in the sheet take the primary paint», is renamed because "Only" becomes false: a step beyond the signed two edits, for the auditor and the user to confirm; its not-delivered item (1) "(the second wave)" becomes "(delivered by `update-settings-panel`, …)", re-audit finding F1 of 2026-10-12, also beyond the signed edits, kept on the user's word of 2026-10-12 by 13:11 (the `date` read when it was recorded); Traces + A-61) |
| The settings panel takes the design's size, place and paint | ADDED |

Not modified (the design says what was read): «Borders, cues and focus rings have enough contrast» and the token and pair counts of three other requirements (the dialog block owns them, SP-1 A), «Segmented options keep the focus ring inside the card», «The panels take the shared surface paint» (its not-delivered item that «Закрити» of the settings panel is not sticky is a historical sentence about the shell change), «Main column layout geometry follows the design reference» (its scenario «The settings panel follows the column from 48rem» must stay green), «The main column takes the design palette».

## Impact

Line numbers re-grepped in this worktree at `019808f`; they move when the dialog block merges first. A test changes only when a changed spec demands it.

| File | Lines | What | Source |
|---|---|---|---|
| `tests/play-page-theme-stylesheet.test.ts` | 225-227 (the reading comment), 228-244 («The chosen option has a cue besides colour»), 249-288 (the language twin) | the cue assertion accepts the weight and the appearing frame (a `font-weight` of at least 700 and another `border-color`; the plain rule at most 500 and transparent); the 4.5:1 assertions stay | FR-117, A-61 |
| `tests/play-page-palette-stylesheet.test.ts` | 97 («The ring keeps its accepted adjacencies») | gains `--color-focus` on `--color-control-bg` at least 13.85, the pair absent from `CONTRAST_PAIRS`, `--color-control-bg` equal to `--color-cell-bg` | FR-65, A-61 |
| `tests/play-page-setup-sheet-stylesheet.test.ts` | 599-607 (the GUARD "the theme and language options still declare border-color var(--color-focus) and background-color var(--color-given-bg)") | replaced: the three checked rules declare the same `border-color`, `background-color`, `color` and `font-weight` (a deliberate change) | A-61 |
| `e2e/nfr-12-targets.spec.ts`, `e2e/nfr-13-a11y.spec.ts`, `e2e/nfr-14-layout-geometry.spec.ts`, `e2e/nfr-14-panel-shell.spec.ts` | n/a | unchanged and must stay green (the settings panel's options and «Закрити»; the theme and language controls focused; the dropdown from 48rem; the fill of «Закрити») | NFR-12, NFR-13, NFR-14 |
| `tests/play-page-panel-shell-stylesheet.test.ts` | 25, 139 | unchanged and must stay green: it reads one top-level `.settings` rule and one top-level `.settings-close` rule | NFR-14 |
| `quality/design-geometry.json` | new top-level key `settingsPanel` | cases added only (7), each with the design's boxes and computed paint; every existing key and provenance field stays | NFR-14 |

New tests (red first, by the test-engineer of the implementing session): `tests/play-page-settings-panel-stylesheet.test.ts` (`@trace NFR-14`, `@trace FR-68`, `@trace FR-65`, `@trace FR-117`); `e2e/nfr-14-settings-panel.spec.ts` (`@trace NFR-14`, `@trace FR-68`, `@trace FR-65`, project `layout`; `playwright.config.ts` is not edited), including the short-window focus walk.

Other requirements that must keep passing: FR-65, FR-68, FR-102, FR-107, FR-117, NFR-9, NFR-10, NFR-12, NFR-13.

## Scope NOT delivered

- Hover, press and the panel's slide (OQ-5); the design's `pointer-events: none` on the mask; Safari and Firefox (NFR-7).
- A 0.98 promise for any settings shot: the 10 phone shots are expected to rise; if one does not, the block stops and explains it before the review gate.
- A new colour token or contrast pair (OQ-1 A); the confirmation dialog (its own folder, `update-confirm-dialog`); any edit of «Borders, cues and focus rings have enough contrast» or of a token or pair count.
- The shell's sentence that «Закрити» of the settings panel is not sticky is a historical sentence about what that change delivered; it is read as history and left. (The setup-sheet requirement's own not-delivered item (1), "the second wave", is reworded in the delta: see the Impact of «The setup sheet takes the design's size, place and paint» above and `design.md` open point 2; a step beyond the signed edits; the user chose «keep the reword» on 2026-10-12 at by 13:11 (the `date` read when it was recorded).)
- Coverage of the geometry and focus checks is sampled (7 cases; three short windows), never continuum.
