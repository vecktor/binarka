# Change: update-rules-panel

## Why

The user showed on 2026-10-11 (autonomy-log row 171, with a screenshot) that the «Правила» panel is narrow, scrolls inside itself and opens at its end. The design has a different panel: a bottom sheet on phones, a panel the column's width plus 1rem from 48rem, one 40rem column from 64rem, with a sticky, filled «Зрозуміло». NFR-14 compares the page with `design/v0-screenshots/review-set-14/` per shot at 0.98. In run 9 (`docs/qa/g2/check-visual-run-9.txt`) all 20 rules and rules-techniques shots fail, light 0.7767 to 0.9010, dark 0.8168 to 0.9029. SD-Q9 of the phase S amendment had called the size "design only"; the user's report superseded it.

This is block A of the parallel G2 plan (`docs/handoff/parallel-g2-plan-2026-10-11.md`). The user signed the text on 2026-10-11 (autonomy-log row 172): RQ-1 A «sticky and a scroll reset on close and on open», XQ-1 A «`data-size` on the page root», RQ-2 A with the 2rem cap, RQ-3 «Зрозуміло» filled, RQ-4 no motion. The signed text is `docs/requirements.md` FR-57, FR-65, NFR-14, A-59 (and A-20, A-26), `docs/handoff/rules-panel-amendment-draft-2026-10-11.md`, and the split in section 9 of `docs/handoff/setup-sheet-amendment-draft-2026-10-11.md`. This folder adds no requirement id and changes no signed text.

**This folder is written as baseline after the shell.** `update-panel-shell` is archived and merged into `main` before the session that implements this folder starts. So «The panels take the shared surface paint» and «The page root carries the board size» exist, the four shell tokens are declared and bound, and `--board-width` is read from the root.

## What Changes

- **Spec, MODIFIED (1):** «Rules panel» (`openspec/specs/play-page/spec.md`, line 727 before the shell): the placement sentence of FR-57 replaces "layout, not claimed here (held NFR-14)"; the reset of the scroll position (`beforetoggle` when the panel closes, `toggle` when it opens); the `autofocus` stays; the scenario «The panel opens with no script» keeps its meaning and gains one clause; two new scenarios («The scroll position is reset when the panel closes and when it opens», jsdom; «The panel opens at its top», e2e in Chromium). Traces gain NFR-14, A-59, A-20.
- **Spec, ADDED (1):** «The rules panel takes the design's size, place and paint» (NFR-14, FR-57, FR-65, A-59): the three regimes with their values, `.rules:popover-open` for the flex column, the `min-height` through the root's `--board-width` and `--column`, the 40rem column with the 2rem cap, the tighter spacing, the sticky, filled «Зрозуміло» with the mask, the list separators and example cells, the design's inner metrics, 13 stylesheet and e2e scenarios, and the sampled geometry test.
- **No new token and no new pair.** The pair `--color-primary-text` on `--color-primary` and the pair `--color-focus` on `--color-surface-raised` are already in the list (no token or pair count changes; the tests compare the helper lists, not numbers).
- **Not modified, by the split:** «Borders, cues and focus rings have enough contrast», «The main column takes the design palette», «The backdrops…», «Main column layout geometry…», «Setup sheet» and every setup-sheet requirement.
- **Code:** `src/ui/style.css` (the `.rules*` rules, `.rules-close`, `.mini*`, `.rule-example`, the two list rules); `src/ui/play-page.ts` (the two scroll-reset listeners on the panel, next to the panel's creation: `src/ui/play-page.ts:121` creates the panel, 138 the close button with `autofocus`, 150 appends the children).
- **Tools:** `quality/design-geometry.json` gains the key `rulesPanel` (8 cases), refrozen by `scripts/freeze-design-geometry.mjs`; `scripts/visual-block.mjs` gains a block `rules`.

## Baseline requirements touched

| Baseline requirement (`openspec/specs/play-page/spec.md`) | Action |
|---|---|
| Rules panel | MODIFIED |
| The rules panel takes the design's size, place and paint | ADDED |

## Impact

Line numbers were written at `main` `64c2d7d` (before the shell) and re-grepped at `ebaf49b` after the shell's merge (re-audit, `docs/qa/update-rules-panel/folder-audit.md`): `src/ui/style.css` `.rules` 647, its 48rem block 671-690, `.rules-close` 747, `.rules:popover-open::backdrop` 1086, the 22.5rem block at 451 (before the panel: not usable for the panel's 22.5rem rules) and 1029, the 48rem `#app` block at 1047; `scripts/freeze-design-geometry.mjs` fixture object 112-127, `provenance` 114-123; `e2e/nfr-12-targets.spec.ts` `rulesClose` 53; `tests/play-page-layout.test.ts` `autofocus` test 203-212, «no script» 228-276. The other numbers below were unchanged. A test changes only when a changed spec demands it.

| File | Lines | What | Source |
|---|---|---|---|
| `tests/play-page-layout.test.ts` | 200-212 (the `autofocus` test) | Unchanged: `autofocus` stays on «Зрозуміло» and on no other element (RQ-1 A) | FR-57 |
| | 228-275 (`the panel opens with no script`) | Unchanged: the spied popover methods are still never called. The new clause of the scenario (the reset events call no spy) is tested in a new file, so this test is not edited | FR-57 |
| `tests/helpers/play-page.ts` | after 175 (`dispatchToggle`) | One new export, `dispatchBeforeToggle(el, newState)`, a plain `Event` named `beforetoggle` with `newState` and `oldState`; no existing helper changes | FR-57 |
| `e2e/nfr-12-targets.spec.ts` | 52-53 | Unchanged: «Зрозуміло» (`sel.rulesClose`) stays at least 44 px (its `min-height` is 2.75rem) | NFR-12 |
| `e2e/nfr-13-a11y.spec.ts` | 37 (the `rules` state), 60-70 and 106 (the keyboard sweep reaches `rules-close`) | Unchanged: axe and the focus sweep must stay green with the filled button, the new size and the sticky position | NFR-13 |
| `tests/play-page-backdrop-stylesheet.test.ts` | 33-85 (the `.rules::backdrop` and `.rules:popover-open::backdrop` rules and their takers) | Unchanged and must stay green: the port adds `.rules:popover-open` (a different selector) and leaves the two backdrop rules alone | NFR-14 |
| `tests/play-page-theme-stylesheet.test.ts` | 83-84 (the backdrop composites) | Unchanged and must stay green, for the same reason | NFR-14 |
| `tests/play-page-palette-stylesheet.test.ts` | 84-92 (no `color: var(--color-control-border)`; `.mini-sep` is muted), 70 (every token is bound) | Unchanged and must stay green: the example cells use `--color-control-border` only as a border colour | FR-65 |
| `tests/play-page-action-buttons-stylesheet.test.ts` | the `min-height` rules for buttons (174-290) | Unchanged and must stay green: `.rules-close` keeps `min-height: 2.75rem` | NFR-12 |
| `e2e/nfr-14-layout-geometry.spec.ts` | 48-49 | Unchanged and a guard: it pins `fixture.cases` to the 32 shots, so the rules cases go under a separate key | NFR-14 |
| `e2e/nfr-14-backdrop.spec.ts`, `-panel-shell.spec.ts`, `-palette.spec.ts` | n/a | Unchanged and must stay green (the backdrop test picks a corner outside the open surface's box) | NFR-14 |
| `scripts/check-visual-parity-adapters.mjs` | 140-143 (`rules`), 144-148 (`rules-techniques`) | **Locked** (`factory-lock.json`) and unchanged. The `rules` driver now captures the panel at its top, as the design; `rules-techniques` sets the end right after `:popover-open`, so a late `toggle` reset could undo it: the new e2e opens, waits a frame, scrolls to the end, waits a frame and asserts the end holds | NFR-14 |
| `scripts/freeze-design-geometry.mjs` | 107-126 (the provenance), the case loop | **Not locked** (grep of `factory-lock.json`): an ordinary edit. It gains an explicit list of 8 rules cases (design side: `/rules/` where it is open at load, `/four/` plus a press for the 4×4 case), per-case `scrollHeight`, `clientHeight` and the deciding bound, and keeps the recorded top-level `provenance` when `designCommit` and `designCssSha1` are unchanged (it rewrites the block on every run today, and `designBuildSha1` differs between worktrees); the fresh build hash and browser go to `rulesPanel.provenance` | NFR-14 |
| `scripts/visual-block.mjs` | `BLOCKS` (l. 40), `GEOMETRY_STATES` (l. 61), `designBoxes` and `pageBoxes` (l. 140, 151) | **Not locked**: an ordinary edit, no program-design approval needed. It gains the block `rules` (`[data-section="rules"]` and its close button) and opens the panel on both sides for the geometry channel | NFR-14 |
| `quality/design-geometry.json` | new top-level key `rulesPanel` | Cases added only; `cases`, `selectors` and `tolerancePx` stay byte-for-byte; the top-level `provenance` keeps its recorded `designCommit`, `designCssSha1`, `designBuildSha1` and `browser` (the new block `rulesPanel.provenance` holds the run's own) | NFR-14 |
| `README.md` | the test and tool lists | The new tests, the `rules` block, the key `rulesPanel` | docs |

New tests (red first, written by the test-engineer of the implementing session):

- `tests/play-page-rules-panel-stylesheet.test.ts` (`@trace FR-57`, `@trace FR-65`, `@trace NFR-14`): the stylesheet scenarios of the ADDED requirement.
- `tests/play-page-rules-scroll-reset.test.ts` (`@trace FR-57`): the jsdom scenario of the reset and the new clause of «The panel opens with no script».
- `e2e/nfr-14-rules-panel.spec.ts` (`@trace NFR-14`, `@trace FR-57`, project `layout`): the scenario «The panel opens at its top» (4 viewports, mouse and keyboard, first and second opening) and the geometry of the panel and its close button against the 8 frozen cases, 6×6 and 4×4. `playwright.config.ts` is not edited.

Other requirements that must keep passing: FR-57, FR-65, FR-93, NFR-5, NFR-9, NFR-10, NFR-12, NFR-13, FR-111, A-26.

## Scope NOT delivered

- The panel's motion, the slide and fade (RQ-4). The setup sheet, the settings panel and the confirmation dialog (other blocks).
- A pixel floor for any rules shot. They are expected to rise; the per-block tool names the residual. If one does not rise, the block stops and explains it before the review gate.
- Safari and Firefox (NFR-7). Whether they scroll a stuck sticky button into view is unverified; the reset on open is the net.
- The coverage of the new e2e checks is sampled (4 and 8 viewports), never continuum.
