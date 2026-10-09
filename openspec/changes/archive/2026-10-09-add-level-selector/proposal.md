# Change: add-level-selector

> **BLOCKED. Do not start section 2 of `tasks.md` (tests) or write any `src/` code until BOTH are true:**
>
> 1. **DL1 `add-difficulty-engine` is archived** (the generator takes a level and runs at most 100 attempts, the hint engine has `hint(board, ceiling = 1)` with techniques 2 to 4, `GenerationRunOutError` is exported from `src/engine/index.ts`, `openspec/specs/puzzle-engine/spec.md` says so). This slice calls `generate(size, seed, level)` and `hint(board, 4)` and shows engine hint sentences it does not own.
> 2. **The user has named the new design reference set** made from the visual design of structure A (the designer's iteration 10, `design/v0-screenshots/review-set-8/`, in progress) and has said in chat that the reference moves to it, recorded in `design/README.md` or `docs/autonomy-log.md`. `review-set-5` is frozen; the held NFR-14 conflicts with the page body until then (`docs/requirements-held.md`, note of 2026-10-09). Implementing agents never edit `design/`.
>
> The first tasks of `tasks.md` (1.1 and 1.2) check both. If either is missing: STOP and report BLOCKED. The Ukrainian strings that are still marked "to confirm" (the 4×4 reason, the techniques items, the DL1 hint sentences) are confirmed by the user in chat during the slice (Q6); the four level descriptions, the close label and the sheet name are final.

## Why

The difficulty amendment (autonomy-log row 86) moved FR-44 to MVP and added four levels, «Розминка», «Задачка», «Головоломка», «Мозколамка». The setup sheet amendment (row 92, draft `docs/handoff/settings-sheet-amendment-draft-2026-10-09.md`, wireframe `design/wireframes/setup-controls-2026-10-09/`, structure A) replaces the two always-visible pickers by **one summary button and a setup sheet**, and adds a **page retry on a run-out** of the generator (up to 3 seeds; the generator limit is 100 attempts, DL1). This slice, DL2 of `docs/mvp-capability-plan.md` section 4.10, builds the page side: FR-44, FR-87 to FR-99. At 4×4 only level 1 exists (A-34), so the level control stays inside the sheet and levels 2 to 4 are unavailable with a reason and a cue that is not colour alone.

## What Changes

- A summary button `[data-action="setup"]` in the place of the size control, text `N×N · Name` with a «▾» cue, e.g. «6×6 · Задачка», opening the sheet with no script (FR-95).
- A setup sheet `[data-section="setup"]` (popover, `role="dialog"`, `aria-label` «Поле і складність», one more id: four per mount) holding the size radiogroup, the level radiogroup with the reason line, and «Закрити» (FR-96). Choosing, no-op and failed presses close it and return focus to the summary button; Escape, light dismiss and «Закрити» close it with no change (FR-97). When a choice needs the confirmation, the sheet closes first and the dialog opens (FR-98).
- Level buttons carry their final description inside (name span and description span, no description line on the body, FR-99, FR-89). At 4×4, levels 2 to 4 are `aria-disabled` with `[data-level-reason]` and a non-colour cue; a press does nothing and the sheet stays open (FR-91).
- Level change through the confirmation rule (FR-90, FR-67); «Нова головоломка» and «Скинути» keep the level; a size change to 4 sets level 1 in one puzzle under one confirmation (FR-92, FR-42, FR-58); the level already shown is a no-op that closes the sheet (FR-73).
- **Page retry** on the engine's run-out error, at most 3 seeds, for the mount, size and level changes and «Нова головоломка»; other errors keep the old board at once (FR-88, A-38).
- The rules panel gets a second section «Складніші прийоми» (FR-93); the page hint calls `hint(board, 4)` at every level (FR-77, autonomy-log row 88; the engine's default ceiling is 1); the FR-25 sentence is DL1's new text (row 87).
- All new text in `src/ui/strings.ts` (FR-94, NFR-5); buttons styled with the existing colour tokens only (FR-65, NFR-9).

Baseline requirements of `play-page` touched (13 ADDED, 15 MODIFIED, 0 REMOVED):

| Baseline requirement | Action | Why |
|---|---|---|
| New puzzle button, Reset button | MODIFIED | FR-42, FR-58: keep the level; the summary keeps its text |
| Rules panel | MODIFIED | FR-57, FR-93: six `li` in two lists, techniques section |
| Page document order | MODIFIED | FR-68: the summary button replaces the size control; still nine elements |
| Confirmation before discarding player entries | MODIFIED | FR-67, FR-98: a level change asks; the sheet closes first |
| Pressing the shown size changes nothing | MODIFIED | FR-73: the level sentence, the sheet closes (name kept so the archive matches) |
| Grid size selector | MODIFIED | FR-43: inside the sheet, `generate(n, seed, level)`, sheet closing, retry |
| Every cell is its own Tab stop | MODIFIED | FR-59: after the summary button; focus exception for the sheet |
| The board is a labelled group of cell buttons | MODIFIED | the id rule: four ids per mount, eight for two |
| Cells and buttons show a visible, unobscured focus indicator | MODIFIED | FR-65: the button list gains the summary, level and close buttons |
| Hinted cell marker | MODIFIED | FR-66: opening or closing the sheet and a level change |
| Highlighting follows every board change | MODIFIED | its list of board changes gains a level change |
| Seed is chosen outside the engine, injectable and not shown | MODIFIED | its list of generation attempts would forbid the level seed and the retry |
| Hint message stays until the next hint or a new puzzle | MODIFIED | a level change clears it |
| The page meets the WCAG 2.2 AA criteria … | MODIFIED | NFR-9: 52 buttons, sheet and summary |
| Summary button, Setup sheet, Choosing and closing the sheet, Sheet and confirmation, Level selector, Level option content, Only the first level exists at 4x4, Size and level interplay, A level change follows the confirmation rule, Page retry on a run-out, The page hint uses all four techniques, Ukrainian texts of the summary …, The summary and level buttons set their own colours | ADDED | FR-44, FR-87 to FR-99, FR-77 (cited, owned by DL1), NFR-4, NFR-5, NFR-9 |

Out of scope: layout, wrapping at 320 px, 44 px targets, the one-screen fit, the sheet placement and the pixel match (held NFR-10, NFR-12, NFR-13, NFR-14, `docs/requirements-held.md`; they stay NOT-EARNED); remembering the level (TC-12); an error message for a failed generation (A-38); the engine itself (DL1); the hint sentences FR-78 to FR-80 and FR-25 (DL1 owns them).

## Impact

- Affected specs: `play-page` (13 ADDED, 15 MODIFIED; `openspec archive` warns about more than 10 deltas, which is non-blocking). Archive normally (not `--skip-specs`), then the baseline text edits listed in `design.md`.
- Affected code: `src/ui/play-page.ts`, `src/ui/strings.ts`, `src/ui/style.css`; tests under `tests/` (new files and the deliberate changes listed in `design.md`). No dependency; `src/engine/` untouched except if the user changes the FR-78 to FR-80 wording in chat.
- Commits that touch `src/` carry `Slice: add-level-selector` and `Refs:` with the FR ids touched (FR-44, FR-87 to FR-99).
