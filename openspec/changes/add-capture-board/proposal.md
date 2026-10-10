# Change: add-capture-board

## Why

NFR-14 compares the page with the pixel reference `design/v0-screenshots/review-set-14/` per shot, at 0.98. The design shots show fixture boards. The page shows a puzzle generated from a seed, so no board shot can reach 0.98 (`docs/qa/visual-diff/README.md`, gap 1).

The user signed FR-119 and A-56 on 2026-10-10 at about 14:24, «signed, use defaults» (autonomy-log row 143). They add a capture-only board: a harness sets `window.__binarkaCaptureBoard` before the page mounts, and the mount shows that board instead of generating one. An invalid value (a board whose givens do not have exactly one solution, among other cases) is ignored silently.

The user also decided (row 142, amendment Q3) to move the fixtures into `design/v0/lib/boards.json`, with a committed validity test that the design and the capture adapter share. Iteration 16 made the 6×6 fixtures valid puzzles (seed 5). The new reference is `review-set-14`.

## What Changes

- **`play-page` spec:** ADDED «Capture-only board» (FR-119, A-56).
- **`src/ui/`:** at mount, read `window.__binarkaCaptureBoard` once. If it is valid, show it with no seed and no generator call: its givens, its player entries, its violations, its optional hinted marker, its size and level in the summary and the controls, and the win state when it is solved. Otherwise generate as today.
  - The value is validated against the engine's `countSolutions`, which is already exported.
  - No new page text, no storage, no URL or control.
- **`design/v0/lib/boards.json`:** the five fixture boards as data, in the same cell notation as today. `design/v0/lib/boards.ts` reads it, and the board data the design renders stays the same, so no shot changes; the move is proven by comparing the parsed data with commit `0d5491b`.
- **`tests/capture-fixtures.test.ts`:** the committed validity test of the fixtures. It asserts each claim in `review-set-14/ENGINE-CHECK.txt`, and that each fixture, converted to a capture value, is valid for FR-119.
- **Not in this change:** the capture adapter `scripts/check-visual-parity-adapters.mjs`, which is under the integrity lock (PD-1). Its use of the capture value is a separate approved change.

## Baseline requirements touched

| Baseline requirement | Action |
|---|---|
| none | ADDED «Capture-only board» only |

## Impact

- FR-119 and A-56, new. FR-88 (the seed at mount) is unchanged when the value is absent or invalid. TC-12 (no storage) is unchanged.
- NFR-14 is not changed here. The adapter work follows in an approved change.
