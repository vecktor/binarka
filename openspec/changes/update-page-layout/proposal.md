# Change: update-page-layout

## Ownership of baseline requirements across the four changes

Archive order is A, B, C, E. A baseline requirement is MODIFIED or REMOVED by at most one change.

| Baseline requirement (play-page) | Action | Owning change |
|---|---|---|
| Rules block | REMOVED (replaced by the ADDED «Rules panel») | `update-page-layout` (A) |
| Ukrainian page text | MODIFIED (decorative `aria-hidden` text is not collected; win text scenario no longer quotes the apostrophe) | `update-page-layout` (A) |
| Hint button fills one cell | MODIFIED (`cell-hinted`, FR-39) | `add-hinted-cell` (B) |
| New puzzle button | MODIFIED (confirmation, marker) | `update-controls-accessibility` (C) |
| Grid size selector | MODIFIED (radiogroup; «value outside the three sizes is ignored» REMOVED inside it) | `update-controls-accessibility` (C) |
| Reset button | MODIFIED (confirmation, marker) | `update-controls-accessibility` (C) |
| Seed is chosen outside the engine, injectable and not shown | MODIFIED (the ignored-value step is gone; no seed on cancel or shown size) | `update-controls-accessibility` (C) |
| Board rendering and default size; Given cells are marked distinctly; Given cells are locked; Player cells cycle through empty, 0 and 1; the three highlight requirements; Highlighting follows every board change; Hint button shows the engine's sentence; Hint message stays until the next hint or a new puzzle; Win message when solved | untouched | none (C's confirmation clause governs how their size and new-puzzle steps are read; slice D owns the win apostrophe) |

New ADDED requirements by change: A adds «Rules panel», «Page document order», «Idle line», «Ukrainian texts of the header, rules panel and idle line»; B adds «Hinted cell marker»; C adds «Confirmation before discarding player entries», «Pressing the shown size changes nothing», «Cells are buttons», «Cell labels», «Ukrainian texts of the confirmation dialog, size control and cell labels»; E adds «Logo».

Note for slice D: A rewrites the scenario «Win message text» of «Ukrainian page text» so that it points to FR-41 instead of quoting the apostrophe. D therefore changes the apostrophe only in «Win message when solved», in `src/ui/strings.ts` and in its test constant, with no overlap with A.

## Why

The UX amendment signed on 2026-10-05 about 23:31 (autonomy-log row 57, UX decisions 1, 2, 9, 12; frozen design `design/v0/` iteration 7) changes the shape of the page: the rules move from a block under the board into a popover opened from a «Правила» button in a new header, the page gets a fixed document order with the buttons directly under the board, and an always-present idle line tells a new player what to do. The user added a code-organisation decision on 2026-10-05 about 23:40 (autonomy-log row 58): every Ukrainian page text lives in one module, `src/ui/strings.ts`, instead of being scattered through the code. This is slice A of `docs/mvp-capability-plan.md` section 4.7; slices B, C and E build on it and add their texts to the same module.

## What Changes

- Header (FR-61): a `header` with the title «Бінарка» and a button `[data-action="rules"]` labelled «Правила» with `popovertarget` pointing at the rules panel.
- Rules panel (FR-57): `[data-section="rules"]` becomes an element with the `popover` attribute, opened by the button with no script, holding the heading «Правила», exactly three list items and a close button «Зрозуміло» (`popovertargetaction="hide"`). Created once at mount outside the board element. The block under the board and any `<details>` disappear.
- Document order (FR-61): header, size control, board, buttons (hint, reset, new), message area; the panel is outside this sequence.
- Idle line (FR-64): `[data-message="idle"]` with the exact sentence, U+00A0 inside «0 і 1», always in the DOM, shown only while the hint and win messages are empty, by CSS only.
- `src/ui/strings.ts` (user decision, not a requirement): every Ukrainian page text moves there (title, button labels, size labels, win message, rules texts) and the new texts are added there. A source-scan test (NFR-5) keeps Cyrillic literals out of the rest of `src/ui/` and `src/main.ts`. No language switch (FR-55, FR-56 stay Future); hint sentences stay in the engine.
- NFR-5 for the new texts: «Правила», «Зрозуміло», the rules texts and the idle line.

Out of scope: placement and visibility of the panel and the idle line, reserved message height, one-screen fit (held NFR-9, NFR-13, `docs/requirements-held.md`); the confirmation dialog, the radiogroup and cell buttons (change C); the logo (change E); the win apostrophe (slice D); FR-27 (slice F).

## Impact

- Affected specs: `play-page` (1 REMOVED, 1 MODIFIED, 4 ADDED requirements). Normal merge at archive (not `--skip-specs`), followed by the hand edits of non-requirement text listed in `design.md`.
- Affected code: `src/ui/play-page.ts`, new `src/ui/strings.ts`, `src/ui/style.css`; tests under `tests/` and `tests/helpers/play-page.ts`. `src/engine/`, `src/main.ts` (no page text there today), `src/ui/seed.ts` unchanged. No dependency added.
- Commits carry trailers `Slice: update-page-layout` and `Refs: FR-57` (or FR-61, FR-64, NFR-5).
