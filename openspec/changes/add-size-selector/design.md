# Design: add-size-selector

## Goals

- A size selector on the play page (FR-43): 4×4, 6×6 or 8×8, 6×6 at start; a change
  starts a new puzzle of that size and clears messages and highlights.
- Board, highlighting, hint, win and new-puzzle paths follow the chosen size; nothing
  in `src/ui/` keeps a hard-wired 6. The engine is untouched.

## Non-goals

- Sizes 10 to 16 (FR-18), remembering the choice (TC-12), a visible label for the
  select, keyboard and screen-reader support (A-20), polish beyond fitting 8×8.
- Any change to the `mountPlayPage` signature or to `src/ui/seed.ts`.

## Key decisions

1. **Size is a model field, but the model being checked decides.** `SIZE` is deleted;
   a closure variable `size` (starts 6) is the size of the board shown, read by the
   new-puzzle button and the selector restore. `refreshHighlights` and the count
   expansion of a whole line use `board.length` (the model they check), never the
   closure `size`, so highlights are right even in the middle of a size change.
   Trade-off: two sources of "N" (the field and `board.length`), kept equal because
   `size` is committed only after `showPuzzle` succeeded.
2. **Keep the single delegated click listener** on `[data-board]` (it reads
   `data-row`/`data-col`, so it is size-agnostic). The select gets its own `change`
   listener once at mount (it is never rebuilt).
3. **Native `<select data-control="size">` above the board**, options `value` 4, 6, 8
   with the labels «Поле 4×4», «Поле 6×6», «Поле 8×8». No visible `<label>`, no
   custom widget (no dependency; A-20). Trade-off: a select hides the other sizes;
   radio buttons would show them, but FR-43 and A-24 say "select".
4. **Validate by exact string match.** Accept `select.value` only if it equals
   `String(n)` for n in `[4, 6, 8]`. A bare `Number(value)` would accept ` 6`, `6.0`,
   `06` and `0x6`; a native select cannot emit them, but the spec pins them (and the
   empty string) as ignored, a deliberate tightening of "Number of the value, exact
   match". Ignored means: no seed call, no generate call, no change, no error.
5. **Restore the select through the option.** After an ignored value or a failed
   generation the page sets `selected = true` on the option for `String(size)`, not
   `select.value = ...`, so a test that overrides `value` cannot break the restore
   and `selectedIndex = -1` is repaired too.
6. **Seed discipline.** `newPuzzle(requestedSize)` is the one function that takes the
   seed, calls `generate(requestedSize, seed)` and builds the board; mount, the
   new-puzzle button (passes the current `size`) and the `change` handler all use it,
   so the seed is taken once per generation attempt. The button does not touch the
   select. Callers clear the messages on success only.
7. **Errors and wrong-size results.** The generator call is wrapped as in slice 2. The
   seed is taken before the call, so a failed attempt still consumed one seed (spec:
   one seed per generation attempt). `showPuzzle(puzzle, n)` first checks that
   `puzzle.givens` has n rows of n cells; if not it throws before touching any state,
   which is handled exactly like a generator error: previous board, messages,
   highlights and `size` stay and the select is restored (decision 5).
8. **CSS from `data-size`, no dependency, on `.board` itself.** `--n` (default 6;
   `.board[data-size="4"] { --n: 4 }`, 8 likewise) and the cap `--cell-max: 48px` are
   declared on `.board`, because `var()` substitutes where the property is declared
   (declared on `:root` or `#app` they would resolve to the default). Columns:
   `repeat(var(--n), minmax(0, var(--cell-max)))`; `.cell` has `aspect-ratio: 1` and
   `min-width: 0` instead of a fixed width and height, so tracks shrink with the
   container and no `100vw` is used (it counts the scrollbar). The font size is set
   per `data-size` (22px, 22px, 18px). At 375 px (#app padding 16px, gap 2px) an 8×8
   cell is about 41px, so the board fits a phone.

None is ADR-worthy: all are local and reversible inside `src/ui/` (stack: ADR-0001).

## Data model

One new closure field, `size: 4 | 6 | 8` (starts 6); the rest is as in slice 2
(`givens`, `board`, `cellEls`, messages). DOM: `[data-control="size"]` with three
`option` elements; `[data-board][data-size="N"]` with N×N `[data-cell]`.

## Error handling

| Situation | Result |
|---|---|
| `change` with a value not exactly 4, 6 or 8 (including empty) | ignored; select restored; no seed, no generate |
| `generate` throws, or returns givens that are not n×n, on a size change | previous board, messages, highlights, `size` kept; select restored; one seed was taken |
| Same size selected again | unspecified (browsers fire no `change`); no test asserts it |

No network, persistence or authentication exists (no redirects, no authorization
cases). The choice is not stored anywhere (TC-12).

## Risks and mitigations

- **jsdom is blind to layout (TC-13).** 4×4 and 8×8 CSS is not testable. Mitigation:
  manual check in the browser pane's mobile preset (375 px wide), with a screenshot
  under `docs/qa/` recorded in `docs/current-state.md` (task 5.7); NFR-7 stays Future.
- **Slice-2 tests that encode "always 6×6".** One test contradicts the amended spec
  and is replaced deliberately, never weakened: `tests/play-page-new-puzzle-and-seed.test.ts`
  "New puzzle is always 6x6" becomes "New puzzle keeps the chosen size". Extended, still
  true at the default size: `tests/play-page-rendering.test.ts`, `tests/play-page-page-text.test.ts`
  (option labels asserted exactly; the `label` attribute of `option` and `optgroup`
  collected). `tests/play-page-helpers.test.ts` asserts `allSolutions().length === 4140`
  and that every `FIXTURES` entry is 6×6; it is updated deliberately (fixtures are
  checked against their own `puzzle.size`). The default-seed test's "every call has
  size 6" stays valid. No test asserts the absence of `[data-control="size"]`.
- **6×6-only test helpers.** In `tests/helpers/play-page.ts`: `SIZE`,
  `expectPageStructure`, `makePuzzle`, `allSolutions`, `givensOf`, `readBoard`,
  `readGivenFlags`, `snapshot`, `violationCells` (each asserts `SIZE*SIZE` cells),
  `fillFrom`, `fixedGenerate`/`mountFixture`/`generateSpy` fixtures, plus `rowCells`
  and `colCells` in `tests/play-page-highlighting.test.ts` and the
  `generateSpy(() => BLANK)` calls in `tests/play-page-new-puzzle-and-seed.test.ts`.
  Once `expectPageStructure` requires the selector, every slice-2 page test is red in
  the red stage by design. Task 4.6 lists the fixes.
- **Fixture cost at N = 8.** There are 72 solved 4×4 grids, 4,140 6×6 and 4,111,116
  8×8. `allSolutions` is cached per N and used only for 4 and 6; 8×8 fixtures use a
  hand-written solution or a first-match depth-first search, never full enumeration.
- **A size constant surviving.** Tests at N = 4 and 8 cover the whole-line count
  highlight, hint placement, win and the dirty-givens case; the review-gate greps
  `src/ui/` for literal 6 and 36.
- **Hint at N = 4 and 8.** Count words for N/2 = 2 and 4 are the engine's tests; page
  tests check placement and sentence pass-through.

## Baseline text edits at archive

The delta merge touches requirements only. Archive with
`npx openspec archive add-size-selector --yes` (a normal merge, NOT `--skip-specs`)
and, in the SAME commit, edit this non-requirement text of
`openspec/specs/play-page/spec.md` by hand:

1. **Purpose:** delete "The page is always 6×6 (the size selector, FR-43, is cut)." and
   add "a grid size selector (4×4, 6×6, 8×8; 6×6 at start)" to what the page offers.
2. **Ownership:** "FR-31 to FR-42; FR-43 is also assigned to it but is cut (Future,
   reported NOT-EARNED), see "FR-43 is cut"" becomes "FR-31 to FR-43"; add "size
   options" to the page text list (labels, buttons, size options, win message, ...).
3. **Mount contract:** "FR-31 to FR-42 and A-4" becomes "FR-31 to FR-43 and A-4"; in
   "Seed source" the sentence "exactly once for each puzzle it generates (the mount and
   each press of the new puzzle button)" becomes "exactly once for each generation
   attempt (the mount, each press of the new puzzle button and each accepted size
   change, including an attempt whose generator call throws)"; "Mounting is
   synchronous" lists the selector among what is in `root` on return.
4. **DOM contract, elements:** "`data-size` holding N (always 6, see "FR-43 is cut")"
   becomes "`data-size` holding N"; add "Size selector: `[data-control="size"]`, a
   select with options 4, 6 and 8 labelled «Поле 4×4», «Поле 6×6» and «Поле 8×8»".
5. **Delete the section "### FR-43 is cut"** (heading and paragraph).
6. **Exclusions:** replace the bullet "FR-43 (size selector) is cut ..." by "Re-selecting
   the already selected size: browsers fire no `change`, so no scenario asserts it" and
   "Grid sizes of 10 and above (FR-18) are not offered; the size choice is not
   remembered (TC-12)". In the generator-error bullet say: on a size change any
   generator error keeps the previous board (asserted); errors at mount and on the
   new-puzzle button stay unasserted. The FR-55, FR-56 and rule-checking bullets stay.
7. **Generator contract lines:** "(returned whatever the size and seed)" becomes "(a
   fixture of the requested size; the page assumes `generate(n, s)` returns an n×n
   puzzle)", and "Unless a scenario names a seed, its board is a fixture puzzle" gets
   "; a scenario that says real engine generator uses it without naming a seed".

Afterwards run `npx openspec validate --all --strict`, `npm run check:trace`, and
`grep -nE "FR-43 is cut|always 6|whatever the size|names a seed|FR-31 to FR-42|is cut"`
on the baseline: no stale sentence may remain (check each hit by hand; "names a seed"
must only appear in the amended sentence).
