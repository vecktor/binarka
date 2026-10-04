# Change: add-rules-and-reset

## Why

Slices 2 and 3 (`add-play-page`, `add-size-selector`, both archived) delivered a
play page with a board, a hint, a new-puzzle button and a size selector. Two
things are still missing for a player who is new to Takuzu: the rules are not
written anywhere on the page, and there is no way to start over on the same
puzzle without taking a new one. The user asked for both on 2026-10-04 at about
21:40 (UTC+5:30); the amendment (FR-57, FR-58, A-26, A-27) was signed in chat at
about 23:35 (autonomy-log rows 27 and 32; `docs/requirements.md`;
`docs/mvp-capability-plan.md` section 4.5). Feature freeze is moved to about 00:45.

## What Changes

- Add a static rules block `[data-section="rules"]` after the board with the
  heading «Правила» and exactly three list items (FR-57). It is created once at
  mount, outside the container that is rebuilt for each puzzle, so a new puzzle,
  a size change and a win leave it unchanged. No script logic, no dependency.
- Add a «Скинути» button `[data-action="reset"]` (FR-58). It empties every
  non-given cell (hint-filled cells included, A-8), keeps the givens, the
  current size and the size selector, clears the hint message, the win message
  and all highlights, and calls neither the seed source nor the generator. It
  works after a win and changes nothing on an untouched board. It is specified
  once for the sizes 4, 6 and 8 (A-27).
- A few CSS rules in `src/ui/style.css` for the rules block and the button.
- Spec: a delta `specs/play-page/spec.md` with two ADDED requirements and seven
  scenarios; no MODIFIED requirements. The non-requirement baseline text is
  edited by hand at archive time (see `design.md`).
- Tests: new `tests/play-page-rules-and-reset.test.ts`. No dependency is added;
  the engine is unchanged.

Scope in: FR-57, FR-58, NFR-5 (rules texts and button label are page text).

Scope out: undo (FR-47), saved progress (FR-46), restarting with a new puzzle
(that is FR-42), a confirmation dialog for reset, keyboard and screen-reader
support (A-20), visual polish beyond the block fitting 375 px (A-14), real-browser
tests as part of the suite (NFR-7, TC-13).

## Impact

- Affected specs: `play-page`. Two ADDED requirements (Rules block, Reset
  button); normal merge (not `--skip-specs`), followed by the manual text edits
  in `design.md` ("Baseline text edits at archive").
- Affected code: `src/ui/play-page.ts`, `src/ui/style.css`; tests under `tests/`.
  `src/main.ts`, `src/ui/index.ts`, `src/ui/seed.ts` and `src/engine/` unchanged.
- Cut order: if the slice falls behind, FR-58 is dropped first, then FR-57
  (`docs/requirements.md` cut item 0b); the agent proposes, the user decides.
- Commits carry trailers `Slice: add-rules-and-reset` and `Refs: FR-57` or `Refs: FR-58`.
