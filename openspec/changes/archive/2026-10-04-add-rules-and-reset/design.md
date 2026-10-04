# Design: add-rules-and-reset

## Goals

- A rules block under the board with fixed Ukrainian text (FR-57) that is the same
  after every new puzzle, size change and win.
- A reset button (FR-58) that returns the current puzzle to its givens at any of
  the sizes 4, 6, 8, and clears messages and highlights, without a new seed.

## Non-goals

- Undo (FR-47), saved progress (FR-46), a confirmation prompt, new puzzle on reset
  (FR-42), keyboard and screen-reader support (A-20), polish beyond fitting 375 px.
- Any change to `mountPlayPage`'s signature, `src/ui/seed.ts` or `src/engine/`.

## Key decisions

1. **The rules block is static DOM created once at mount, outside the rebuilt
   container.** `showPuzzle` replaces the children of `boardHost` only. The block is
   built next to the heading, the selector and the buttons in the single
   `root.replaceChildren(...)` call and is placed after `boardHost`, so it follows
   `[data-board]` in document order and nothing ever touches it again (A-26).
   Trade-off: the block is not data driven; the three texts are constants in
   `play-page.ts`. Putting it inside the board host would be simpler to place but
   would be destroyed by every `showPuzzle`.
2. **Heading and list are plain elements.** A `section` with `data-section="rules"`,
   an `h2` «Правила» and a `ul` with three `li`. No `aria-*`, `title`, `alt` or
   `placeholder` attribute with text is added (NFR-5: no Latin letters in the
   collected page text; the text-collecting helper in `play-page-page-text.test.ts`
   covers the new nodes without change).
3. **Reset reuses the givens already held by the page.** The page keeps `givens`
   (copied at `showPuzzle`) and `board` (the working copy). Reset does, in this order:
   `board = copyGrid(givens)`; `renderCell` for every cell (so non-given cells become
   empty and given cells keep their text and `data-given`); `refreshHighlights()`
   (recomputed from the reset board, so a dirty-givens puzzle keeps highlights that
   come from its givens and every other highlight goes); `hintMessage` and
   `winMessage` text set to empty. Because the board element is not rebuilt, the
   click listener, the `data-size` attribute and the size selector are untouched.
   Trade-off: re-rendering all cells is more work than clearing only changed ones,
   but it is at most 64 cells and reuses `renderCell` unchanged.
4. **No seed, no generator.** Reset never calls `seedSource` or `makePuzzle`, so it
   cannot fail and has no error path; the seed discipline of the baseline ("exactly
   once for each generation attempt") stays true without edits.
5. **Reset on an untouched board is a no-op by construction.** Re-rendering the same
   state yields the same text, classes and messages; scenario 7 pins it. Before a
   board exists (mount failed) the handler returns early, as the hint handler does.
6. **Size independence (A-27).** Reset reads `givens.length`/`board.length`, never a
   constant, so one requirement covers 4, 6 and 8; board-touching scenarios are
   parameterised over N with a fixture puzzle of size N (the `generate` fixture
   returns a puzzle of the requested size, as in slice 3).
7. **Dirty givens.** If a puzzle's givens already violate a rule (a test fixture),
   the highlights that come from the givens alone remain after reset. This follows
   from decision 3 and from FR-36; no scenario asserts it.

None of these decisions is ADR-worthy: they follow the existing page structure and
add no dependency, storage or contract between modules.

## Data model

No new state. The page already holds `size`, `givens`, `board`, `cellEls`. The only
additions are the static rules block element and the reset button element, both
created at mount and never replaced.

## Error handling

- Reset has no input and no failing call, so there is no error message and no raw
  exception path; with no board shown it does nothing.
- The rules block has no behaviour to fail.
- The existing paths (generator failure keeping the previous board) are unchanged.

## Risks and mitigations

- **Rules block placed in the rebuilt container by mistake.** Scenario 2 checks one
  block after a new puzzle, a size change and a win, after the board.
- **Reset forgets a hint-filled cell.** Scenario 3 does clicks and one hint fill and
  checks every non-given cell is empty (A-8).
- **Reset resets the size or the selector.** Scenarios 3 and 5 check `data-size` and
  the selector for N in 4, 6, 8.
- **Reset secretly takes a seed.** Scenario 6 counts seed-source and generator calls.
- **Layout is invisible to jsdom (TC-13).** A real-browser check at 375 px is a task.

## Baseline text edits at archive

The delta merge touches requirements only. Archive with
`npx openspec archive add-rules-and-reset --yes` (a normal merge, NOT `--skip-specs`)
and, in the SAME commit, edit this non-requirement text of
`openspec/specs/play-page/spec.md` by hand:

1. **Purpose:** add the rules block (FR-57) and the reset button (FR-58) to what the
   page offers ("... a hint button, a reset button and a new-puzzle button, a rules
   block under the board, and shows ...").
2. **Ownership:** "FR-31 to FR-43" becomes "FR-31 to FR-43, FR-57 and FR-58"; add
   "rules text" and "reset label" to the page text NFR-5 covers on this page.
3. **DOM contract, elements:** add "Rules block: `[data-section="rules"]`, follows
   `[data-board]` in document order, heading «Правила» and three `li` items" and
   extend "Buttons" with "`[data-action="reset"]` (label «Скинути»)". Mounting
   "is synchronous" lists the rules block and the reset button among what is in `root`.
4. **Seed source sentence unchanged:** reset is not a generation attempt, so the
   sentence "exactly once for each generation attempt (the mount, each press of the
   new puzzle button and each accepted size change ...)" stays as it is.
5. **Exclusions:** add "Undo (FR-47) is Future; reset returns to the givens only" if
   not already covered by the FR-47 bullet.

Afterwards run `npx openspec validate --all --strict`, `npm run check:trace`, and
grep the baseline for "FR-31 to FR-43" without FR-57: no stale ownership sentence may
remain.
