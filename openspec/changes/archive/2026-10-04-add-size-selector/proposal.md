# Change: add-size-selector

## Why

Slice 2 (`add-play-page`, archived) delivered a play page that is always 6×6.
FR-43 (size selector) was cut at cut line 0 and then restored by the user on
2026-10-04 at about 21:00 (UTC+5:30), because both earlier slices were archived
about 2.5 hours ahead of the plan (autonomy-log row 22; amendment signed in
`docs/requirements.md` FR-43, Cut order item 0, A-24, and in
`docs/mvp-capability-plan.md` section 2 row 3 and section 4.4). The engine
already generates 4×4, 6×6 and 8×8 puzzles (FR-13 to FR-17), so the missing
piece is only on the page: a way to choose the size and a board that is not
hard-wired to 6. Feature freeze is 00:00 user time; slice 3 is archived before it.

## What Changes

- Add a native size selector `[data-control="size"]` to the play page with the
  options 4, 6 and 8 labelled «Поле 4×4», «Поле 6×6», «Поле 8×8»; 6 is selected
  at start. A change to an offered size starts a new puzzle of that size from a
  new seed, clears the hint and win messages and the highlights; any other value
  (including empty) is ignored. The choice is not remembered (TC-12).
- Replace the constant `SIZE = 6` in `src/ui/play-page.ts` by a model field read
  by rendering, highlighting (including the whole-line expansion of a count
  violation), the hint and win paths and the new-puzzle button, which keeps the
  chosen size.
- Add a few CSS rules in `src/ui/style.css` so 4×4 and 8×8 boards lay out
  (grid columns and cell size from `data-size`, 8×8 shrinks on narrow screens).
- Spec: a real delta `specs/play-page/spec.md` with one ADDED requirement
  (Grid size selector) and seven MODIFIED requirements; the non-requirement
  baseline text is edited by hand at archive time (see `design.md`).
- Tests: new `tests/play-page-size-selector.test.ts`; one slice-2 test that
  asserts "always 6×6" is replaced deliberately; a few more are extended.
- No new dependencies. The engine is unchanged.

Scope in: FR-43, and the size-dependent parts of FR-31, FR-36, FR-38, FR-42,
FR-51 and NFR-5 (option labels are page text).

Scope out: sizes 10 to 16 (FR-18), remembering the choice (TC-12), a visible
label for the select, keyboard and screen-reader support (A-20), mobile layout
and visual polish beyond the 8×8 fit (A-14), real-browser tests (NFR-7, TC-13).

## Impact

- Affected specs: `play-page`. MODIFIED: Board rendering and default size,
  Highlight a line with too many of one digit, Highlighting follows every board
  change, Hint message stays until the next hint or a new puzzle, New puzzle button, Seed is chosen outside the engine, injectable and
  not shown, Ukrainian page text. ADDED: Grid size selector. This is a normal
  merge (not `--skip-specs`), followed by the manual text edits in `design.md`
  ("Baseline text edits at archive").
- Affected code: `src/ui/play-page.ts`, `src/ui/style.css`; tests under `tests/`.
  `src/main.ts`, `src/ui/index.ts`, `src/ui/seed.ts` and `src/engine/` unchanged.
- Risks: jsdom cannot see layout (TC-13), slice-2 tests that encode "always 6×6",
  a size constant surviving somewhere in `src/ui/`. See `design.md`.
- Commits carry trailers `Slice: add-size-selector` and `Refs: FR-43`.
