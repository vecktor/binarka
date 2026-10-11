# Folder audit: `openspec/changes/update-panel-shell/` (task 1.1)

- **Auditor:** a fresh spec-compliance-auditor subagent, read-only, 2026-10-11 from about 16:28 to 16:46 (UTC+5:30), prep session `vibrant-tu-434033`. It did not write the folder (a spec-writer did) and edited nothing.
- **Result:** 2 major, 9 minor, 6 notes. Nothing contradicts a signed requirement; no requirement id added. `npx openspec validate update-panel-shell --strict`: valid.
- **Coverage:** 4 MODIFIED and 2 ADDED requirements; 38 scenarios checked, 36 sound, 2 to reword (1, 7), 0 missing, 0 contradicting.

## What it verified

- The four MODIFIED blocks, word-diffed against the baseline, change only what the proposal names: «Borders, cues and focus rings have enough contrast» (4 rows; 27 → 31 tokens, 24 → 26 `#rrggbb`, 3 → 5 translucent, 35 → 38 pairs; the remaining "later" rows; `--color-surface-raised` in the focus, text and muted-text lists; one scenario; a shadow in the token-reader scenario; `Traces:` + A-57), «The main column takes the design palette» (one sentence), «The backdrops take the design's translucent tokens» (item (2) only), «Main column layout geometry follows the design reference» (the scenario «Colours are the G2 palette» only; the line-height sentence kept for block B).
- The four tokens equal the A-57 appendix value for value; ratios 15.88 / 12.79, 7.17 / 6.96, 15.88 / 12.79 on the raised fill; the overlay border 1.24 / 1.36 light, 4.55 / 3.81 dark; 38 pairs = 4+4+1+3+9+1+16.
- Shadow geometry and alphas match `design/v0/app/binarka.css:828, 960, 1115, 1348`; the dialog border is the design's `--cell-border` (l. 1343) = the page's `--color-control-border`.
- The design build shares the data contract the new e2e uses; the hook moves the size variables with no reader outside the board today, so no geometry should change; red first; review gate only with the user's yes; merge only on the user's word.

## Findings and disposition

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | major | «Two mounts are independent» mounts the second page "at 4" with an injected 4×4 generator, but the mount always asks for 6 (`src/ui/play-page.ts:181`) and `showPuzzle` throws on a 4×4 puzzle (`:323-325`): the test cannot be written | Sent to the spec-writer: reach 4 the way the page allows (mark «Поле 4×4», press «Почати», or a size-4 capture board for the second mount only) |
| 2 | major | Tasks 2.3 to 2.5 have no `Evidence:`; sections 4, 5, 6, 8 name no owner | Sent: evidence paths and owners |
| 3 | minor | Task 3.3 says `.setup-close` is "a new rule"; `src/ui/style.css:886` has one | Sent: add to the existing rule |
| 4 | minor | The capture lock is released (6.2) before the per-block capture (6.3) | Sent: hold it to the end of 6.3 |
| 5 | minor | "its top-level rule" is ambiguous (two top-level `#app` rules); the 30rem 8×8 block's declarations unnamed | Sent: "a top-level `#app` rule outside any at-rule"; name them |
| 6 | minor | A rewritten comment quoting `:has(` would break the raw-text count (`tests/play-page-palette-stylesheet.test.ts:228-233`) | Sent: the comment says "has-selector" |
| 7 | minor | "present as before" is uncheckable by a stylesheet test | Sent: list today's values or point at the diff filter of task 3.6 |
| 8 | minor | Impact lines: `tests/play-page-helpers.test.ts:499` (not 500); `tests/play-page-level-stylesheet.test.ts:226` and the title at `tests/play-page-helpers.test.ts:645` go stale | Sent: listed |
| 9 | minor | design.md re-opens the overlay border as a question; it is signed decoration (rules-panel draft § 4, row 172) | Sent: cite the signed source; drop the question |
| 10 | minor | design.md says "reproduced from section 9" but adds text | Sent: mark the two clarifications |
| 11 | minor | The shell writes the `--color-shadow-sunken` withdrawal that section 9 listed under B | Sent: one sentence in design.md so B does not restate it |
| 12 | note | A page mounted on a root other than `#app` gets no board sizing (jsdom roots); nothing reads computed size variables in jsdom | No change; already said in the spec |
| 13 | note | The e2e hook check proves equality, not correctness; the 32 geometry cases guard correctness | No change |
| 14 | note | Playwright runs of 2.6, 3.7, 4.4 take no capture lock | Sent as optional |
| 15 | note | `style.css:1` comment says "25 names" | Covered by task 3.1 |
| 16 | note | The spec preamble's DOM-contract list does not gain the root's `data-size` (a delta cannot change the preamble) | No change; design.md covers it |
| 17 | note | «The page root carries the board size» could trace FR-65 | Sent as optional |

The spec-writer's fold and the strict validation after it are recorded below.

## Fold

The same spec-writer folded all 11 findings and the two optional notes on 2026-10-11 at about 16:55 (UTC+5:30), editing only the folder:
1. «Two mounts are independent»: both roots mount at 6; the second reaches 4 by opening the sheet through the stubbed `showPopover()` (A-44), marking «Поле 4×4» and pressing «Почати»; the first goes to 8 the same way; a third mount on the first root resets it to 6; an AND clause adds a size-4 capture board for one mount only.
2. Tasks 2.3 to 2.5 carry `Evidence:` (the new test file and `red-run.txt` sections C, D, E); owners: the parent session for sections 4, 5, 6 and 8, the parent with a fresh reviewer for 7.
3. Task 3.3 adds the declaration to the existing `.setup-close` (~886) and `.settings-close` (~1202) rules.
4. The capture lock is released only at the end of 6.3.
5. "a top-level rule outside any at-rule"; the 30rem and 48rem blocks' declarations named.
6. Task 3.4: the comment says "has-selector", never the literal `:has(`.
7. "present as before" replaced by a `git diff -U0` check against `main` (rule ranges at `64c2d7d`).
8. Impact: `tests/play-page-helpers.test.ts:499`, `tests/play-page-level-stylesheet.test.ts:226`, the title at `tests/play-page-helpers.test.ts:645`.
9. The overlay border is signed decoration (rules-panel draft § 4, row 172), the A-60 analogy secondary; open question 1 dropped.
10. "Reproduced, with two shell-side clarifications marked".
11. The `--color-shadow-sunken` withdrawal is written by the shell (clarification 1), citing the folded A-57 appendix.
Optional: FR-65 added to the Traces of «The page root carries the board size»; tasks 2.6, 3.7 and 4.4 take the capture lock.

Validation after the fold (run by the spec-writer and re-run by the parent below):
```
Change 'update-panel-shell' is valid
- Validating...
✓ spec/play-page
✓ spec/puzzle-engine
✓ change/update-panel-shell
✓ change/update-rules-panel
Totals: 4 passed, 0 failed (4 items)
```
