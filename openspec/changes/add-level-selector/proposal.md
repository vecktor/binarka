# Change: add-level-selector

> **BLOCKED. Do not start section 2 of `tasks.md` (tests) or write any `src/` code until BOTH are true:**
>
> 1. **DL1 `add-difficulty-engine` is archived** (the generator takes a level, the hint engine has techniques 2 to 4, `openspec/specs/puzzle-engine/spec.md` says so). This slice calls `generate(size, seed, level)` and shows engine hint sentences it does not own.
> 2. **The frozen design reference has been moved by the user to a new set.** `design/v0-screenshots/review-set-5/` is frozen (`design/README.md`: any design change gets a new set, `review-set-6/`, and the user's decision to move the reference). BLOCKED until `design/v0-screenshots/review-set-6/` exists with the updated `design/v0/` sources (the level control, the description line, the techniques section; an agent-made design is being prepared at the user's request, option 2) AND the user has said in chat that the reference moves to it, recorded in `design/README.md` or `docs/autonomy-log.md`. This is decision Q3 of the difficulty amendment (autonomy-log row 86); the held NFR-14 conflicts with the page body until then (`docs/requirements-held.md`, note of 2026-10-09). Implementing agents never edit `design/`.
>
> The first task of `tasks.md` (1.1 and 1.2) is to check both. If either is missing: STOP and report BLOCKED. The Ukrainian strings in this folder are **provisional**: the user confirms or changes them in chat during the slice (Q6), and the pinned texts then change deliberately.

## Why

The difficulty amendment signed on 2026-10-09 (autonomy-log row 86, draft `docs/handoff/difficulty-amendment-draft-2026-10-09.md`) moved FR-44 from Future to MVP and added FR-87 to FR-94: a player picks one of four levels, «Розминка», «Задачка», «Головоломка», «Мозколамка», each one extra technique beyond the three rules. DL1 builds the engine side (techniques, level parameter, CLI). This slice, DL2 of `docs/mvp-capability-plan.md` section 4.10, builds the page side. At 4×4 only level 1 exists (A-34), so the control stays visible and levels 2 to 4 are unavailable with a one-line reason (Q1, option a).

## What Changes

- A level control `[data-control="level"]` (a radiogroup «Складність» of four buttons) after the size control, and a description line `[data-level-description]` under it that follows the level shown (FR-87, FR-88, FR-89). The page calls `generate(size, seed, level)`.
- 4×4: «Розминка» stays selected, «Задачка», «Головоломка», «Мозколамка» carry `aria-disabled="true"` (focusable, press does nothing) and the description shows the reason `Для поля 4×4 є лише рівень «Розминка».` (FR-91).
- A level change follows the confirmation rule (FR-90, FR-67); «Нова головоломка» and «Скинути» keep the level; a size change to 4 sets level 1 in the same single new puzzle under one confirmation (FR-92, FR-42, FR-58); pressing the level already shown is a no-op (FR-73).
- The rules panel gets a second section «Складніші прийоми» with three one-sentence items (FR-93, FR-57). The page hint uses all four techniques whatever the level (FR-77, Q2).
- All new text lives in `src/ui/strings.ts` (FR-94, NFR-5, NFR-4); the level buttons are styled with the existing colour tokens only, in their own `.level-control` rules (FR-65, NFR-9).

Baseline requirements of `play-page` touched (8 ADDED, 11 MODIFIED, 0 REMOVED):

| Baseline requirement | Action | Why |
|---|---|---|
| New puzzle button, Reset button | MODIFIED | FR-42, FR-58: keep the level |
| Rules panel | MODIFIED | FR-57, FR-93: six `li` in two lists, techniques section |
| Page document order | MODIFIED | FR-68: eleven elements |
| Confirmation before discarding player entries | MODIFIED | FR-67: a level change asks too |
| Pressing the shown size changes nothing | MODIFIED | FR-73: the level sentence (name kept so the archive matches) |
| Cells and buttons show a visible, unobscured focus indicator | MODIFIED | FR-65 text unchanged, but its scenario and sentence list "the three size buttons"; the four level buttons join the list (FR-87) |
| Grid size selector | MODIFIED | FR-43 text is unchanged, but the requirement says the page calls `generate(n, seed)`; after this slice it calls `generate(n, seed, level)` and a size change to 4 sets level 1 (FR-92) |
| The page meets the WCAG 2.2 AA criteria … | MODIFIED | NFR-9: 50 buttons, three groups |
| Seed is chosen outside the engine, injectable and not shown | MODIFIED | its list of "generation attempts" would otherwise forbid the seed a level change takes (FR-88); FR-51 text unchanged |
| Hint message stays until the next hint or a new puzzle | MODIFIED | a level change clears the message (FR-88); FR-40 text unchanged |
| Level selector, Level description line, Only the first level exists at 4x4, Size and level interplay, A level change follows the confirmation rule, The page hint uses all four techniques, Ukrainian texts of the level control …, The level buttons set their own colours | ADDED | FR-44, FR-87 to FR-94, FR-77 (cited, owned by DL1), NFR-4, NFR-5, NFR-9 |

Out of scope: layout, 44 px targets, one-screen fit at 375×812 and the pixel match of the new control (held NFR-10, NFR-12, NFR-13, NFR-14, `docs/requirements-held.md`, they stay NOT-EARNED); remembering the level (TC-12); an error message for a failed generation (A-38); the engine itself (DL1); hint sentences FR-78 to FR-80 (DL1 owns them, the user confirms the wording here, Q6).

## Impact

- Affected specs: `play-page` (8 ADDED, 11 MODIFIED; `openspec archive` warns about more than 10 deltas, which is non-blocking). Archive normally (not `--skip-specs`), then the baseline text edits listed in `design.md`.
- Affected code: `src/ui/play-page.ts`, `src/ui/strings.ts`, `src/ui/style.css`; tests under `tests/` (new files and the deliberate changes listed in `design.md`). No dependency; `src/engine/` untouched except if the user changes the FR-78 to FR-80 wording in chat (then DL1's sentences and tests change deliberately).
- Commits that touch `src/` carry `Slice: add-level-selector` and `Refs: FR-44, FR-87, FR-88, FR-89, FR-90, FR-91, FR-92, FR-93, FR-94` (or the subset touched).
