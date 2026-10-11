# Change: add-violation-cause

## Why

Today every cell of a broken group looks the same. `refreshHighlights` (`src/ui/play-page.ts:249-269`) gives every cell of every violation the class `cell-violation` and `aria-invalid="true"`; for the count rule it marks the whole line (6 or 8 cells). Nothing says which press made the violation. The user asked for a mark on that cell (autonomy-log row 159, in chat on 2026-10-11 at about 00:20) and signed the amendment in chat at about 09:44 (UTC+5:30): CQ-1 «A» (the name suffix) and the defaults for CQ-2 to CQ-7 (autonomy-log rows 162 and 163). The signed text is in `docs/requirements.md`: **FR-120** (new), **A-58** (new), and FR-64, FR-65 and FR-70 amended; the reasoning, the scenario list P1 to P8 and the auditor's findings are in `docs/handoff/violation-cause-amendment-draft-2026-10-11.md`. The design touch is done and reviewed (`docs/design/cause-touch-2026-10-11/REVIEW.md`); the user adopted its forced-colours rule and kept the mark's size as signed.

This is a change folder, not a block of G2 (the NFR-14 reference does not move: no shot of the 170 shows the mark, `docs/qa/violation-cause-amendment/hint-shot-check.txt`).

## What Changes

- **`play-page` spec, ADDED (1):** «Cause marker» (FR-120): the rule for the class `cell-cause` (set exactly when the checker's cells include the pressed cell), its life (the removing table, the non-removing table, the confirmation timing, none at mount, two mounts independent, at most one cell, always also `cell-violation`, never a given, never empty), and scenarios P1 to P8, identical lines, the hinted cause, a failed generation, the language switch and an oracle sweep at N = 4, 6 and 8.
- **`play-page` spec, MODIFIED (7):**
  - «A violation shows a cue besides colour» (FR-64): "(no new class)" goes; the cause mark is described (a `::after` triangle drawn with the six border longhands, legs about a quarter of the inner width with a `0.5rem` floor, `position: relative` on `.cell-cause` only, the forced-colours block); four scenarios are added (the stylesheet text, the cell's own border, the forced-colours block, a sampled browser read of the mark's corner pixel).
  - «Cell labels» (FR-70): the cause cell appends «, спричиняє порушення» after «, підказка»; the suffix follows the marker; the scenario «A violation adds no suffix» is replaced by «Only the cause cell of a violation gets a suffix»; four scenarios are added.
  - «Cells expose a Ukrainian name and their state» (FR-70, FR-61): the name lists the third suffix, is rewritten when the marker moves; no `aria-describedby`.
  - «Borders, cues and focus rings have enough contrast» (FR-65): the cause cue's pair against the stripe (4.33 / 4.61) beside the fill (5.38 / 6.24), the accepted adjacencies (hover ring 2.45 / 2.00), and the one narrow exception to "every colour is a token": the system colour keyword `ButtonText` in the forced-colours block, pinned by a new scan.
  - Three edits **beyond the draft's §5 list**, each one token or one row, justified in `design.md` decision 9: «English page text» (the table row; `cellLabel` takes a sixth argument; a parity assertion), «Page text is per mode» and «Ukrainian page text» (the cell-name regex of one scenario each gains the suffix).
- **`src/ui/play-page.ts`, `src/ui/strings.ts`, `src/ui/style.css`:** the marker next to `refreshHighlights`, with the relabel of the cell that loses it; the suffix in both languages (`cellLabel` gains `cause`); the `.cell-cause` rules and the forced-colours block.
- **`docs/requirements.md` FR-65, outside this folder (tasks 1.1):** one clause naming the system-colour exception, added by the parent with the user's yes before the folder is audited.
- **`design/v0/app/binarka.css`:** the forced-colours block is mirrored (the design touch already holds `.cell-cause`); then `quality/design-paint.json` and `quality/design-geometry.json` are refrozen (provenance only).
- **New checks:** `tests/play-page-violation-cause.test.ts`, a stylesheet test of the mark, a capture-board case, and `e2e/nfr-14-cause-mark.spec.ts` (2 sampled cases). `playwright.config.ts` is not edited (the `layout` project's `testMatch` already has `nfr-14-*`).

## Baseline requirements touched

| Baseline requirement (`openspec/specs/play-page/spec.md`) | Line | Action |
|---|---|---|
| Cause marker | new (FR-120) | ADDED |
| A violation shows a cue besides colour | 1390 | MODIFIED |
| Cell labels | 1211 | MODIFIED |
| Cells expose a Ukrainian name and their state | 1281 | MODIFIED |
| Borders, cues and focus rings have enough contrast | 1423 | MODIFIED |
| English page text | 3572 | MODIFIED (beyond the draft's list) |
| Page text is per mode | 3547 | MODIFIED (beyond the draft's list) |
| Ukrainian page text | 529 | MODIFIED (beyond the draft's list) |

«Hinted cell marker» (941) is the model for the new requirement and is not changed. «The main column takes the design palette» (3841) is not changed: the freeze's ten cases and its cell kinds do not include a cause cell, so only the provenance of the two fixtures moves (design.md decision 7). The DOM-contract bullets at `spec.md:26-27` (a preamble, not a requirement, so no delta reaches it) gain `cell-cause` by hand at archive (tasks 10.2).

## Impact

Line numbers are those of today's tree (2026-10-11, after G2 block 3, which moved the draft's references). A test changes only when a delta of this folder demands it; the source of each is in the last column.

| File | Lines (today) | What changes | Source |
|---|---|---|---|
| `src/ui/play-page.ts` | state 188; `setHinted` 225-233; `renderCell` 235-247; `refreshHighlights` 249-269; `onBoardClick` 285-300; `showPuzzle` 302-331 (`hinted = null` at 307); hint fill 349-359; `resetBoard` 379-388; `render()` 545-; capture mount 609-619 | a `cause` state and a `setCause` beside `setHinted`; `renderCell` passes it to `cellLabel`; the click and the hint fill set it after the highlights; `showPuzzle` and `resetBoard` clear it; the language re-render needs no code (it calls `renderCell`, 589) | FR-120, FR-70 |
| `src/ui/strings.ts` | `CELL` 27, `cellLabel` 29-33, type 110, export 130, `EN_CELL` 151, English `cellLabel` 160-164 | the suffix in both languages; `cellLabel(row, col, value, given, hinted, cause)` | FR-70, FR-111 |
| `src/ui/style.css` | after `.cell-violation` 319-335 and `.cell-given.cell-violation` 338-340; `position: relative` already at 347 (`.cell:focus-visible`); hover ring 427-430 | `.cell-cause`, `.cell-cause::after`, and the `@media (forced-colors: active)` block | FR-64, A-58 |
| `design/v0/app/binarka.css` | `.cell-cause` 778-794 (already there) | the forced-colours block, mirrored | CQ-4 A; the user's adoption |
| `quality/design-paint.json`, `quality/design-geometry.json` | `designCssSha1` (lines 6 and 5) | refrozen by `scripts/freeze-design-paint.mjs` and `scripts/freeze-design-geometry.mjs`; the diff may change `designCommit`, `designCssSha1` and `designBuildSha1` only | FR-64 (CQ-4 A) |
| `tests/helpers/play-page.ts` | `expectedCellLabel` 719-728 (the doc comment says "a violation adds no suffix") | reads `cell-cause`, appends the suffix after «, підказка»; the comment follows | FR-70 «Cell labels» |
| `tests/play-page-helpers.test.ts` | self-test of `expectedCellLabel` 951-966 (the case at 965 says "a violation adds no suffix"; the case at 966 stays) | a cause-cell case, a hinted-cause case; 965 stays true (a violating cell without the class) | FR-70 |
| `tests/play-page-cells.test.ts` | 336-374 | 336-349: (2,3), the third press, gets the suffix, (2,1) and (2,2) keep the plain label; 351-360: (3,3) gets the suffix, the givens keep «, задано»; 362-374: «…, 0, підказка, спричиняє порушення»; the describe and test titles say "adds no suffix" and change | FR-70, FR-120 |
| `tests/play-page-english-text.test.ts` | 140-141 (two regexes); 208-210 and 233-235 (direct `cellLabel` calls); 399-420 (page label reads, unchanged) | the regexes gain the suffix; the calls pass the sixth argument, and a parity assertion with a cause sample is added | «Page text is per mode», «English page text» |
| `tests/play-page-page-text.test.ts`, `tests/play-page-semantics.test.ts` | 50 and 73; 55 (`CELL_NAME`) | the regexes gain the suffix only if the test's state yields a cause (the red run decides; today none does) | «Ukrainian page text», FR-70 |
| `tests/helpers/css.ts` | `CONTRAST_PAIRS` 581-595 (comment 575-580 says "34 pairs"), `PairGroup` 563; scans 270-370 | one pair (`violation-border` on `violation-stripe`, group `cause-cue`); a new system-colour scan; the existing scans are not loosened | FR-65 |
| `tests/play-page-helpers.test.ts` | 460 (`4 + 4 + 3 + 8 + 1 + 14`), 466-467 (the group list); new self-tests of the system-colour scan | 35 pairs, a `cause-cue` group | FR-65 |
| `tests/play-page-stylesheet.test.ts` | 470-506 (the widths at 1px, 1px, 2px, 2px: 499-506) | unchanged (a GUARD); the cause cell's border scenario is a new test | FR-64 |
| `tests/helpers/play-page.ts` | `snapshot()` 546-556; 83 calls in 18 files | it includes each cell's class list; a sweep (tasks 3.5) of every comparison that spans a press creating a violation; a comparison changes only where FR-120 demands it, and is listed | FR-120 |
| `tests/play-page-capture-board.test.ts` | 153 (`expectedCellLabel` over all cells) | a case: no `cell-cause` at mount on a board with a violation | FR-120, FR-119 |
| `tests/play-page-violation-cause.test.ts` | new | P1 to P8, the tables, mount, language switch, two mounts, the oracle at N = 4, 6, 8 | FR-120 |
| a stylesheet test of the mark | new (name chosen by the test-engineer) | the `.cell-cause` scenarios of «A violation shows a cue besides colour» and the system-colour scan | FR-64, FR-65 |
| `e2e/nfr-14-cause-mark.spec.ts` | new | 2 sampled cases | FR-64 |

Unchanged but must stay green: the 170 reference shots (`check:visual` run 9, tasks 8.1), `e2e/nfr-14-palette.spec.ts` and `e2e/nfr-14-layout-geometry.spec.ts` (against the refrozen files), `e2e/nfr-13-a11y.spec.ts` (a cause label is a longer name; axe sees no new element), NFR-5 (Cyrillic and Latin scans of labels), NFR-9, FR-61.

## Scope NOT delivered

- A 3px border for the cause (CQ-2 B), a rounded mark, any motion on the mark, a mark at mount, a mark on a non-cause cell, and a larger mark at 8×8 on a 320px phone (the user kept the signed size; the design reviewer found it findable "after a short scan" there).
- Real forced-colours rendering is not tested (A-28, TC-13): the rule's text and scope are pinned by the stylesheet test; the design reviewer checked it once in Chrome's emulation.
- `aria-describedby` (CQ-1 B), the ", hint" against ", hinted" mismatch of FR-70's English text (CQ-6: left for a separate fix), and 8×8 cells under 44px in landscape (an earlier decision).
- No pixel floor is claimed, and no pass of `npm run check:visual`; run 9 only shows that no shot moved.
