# Design: add-play-page

## Goals

- A single static 6×6 play page in vanilla TypeScript DOM code with the spec-pinned
  entry point `mountPlayPage(root, options?)` (synchronous mount, injectable
  `seedSource` and `generate`).
- The page reads violations, solved state, hints and puzzles from the engine and
  never restates a rule. Every scenario is decidable from the DOM in jsdom.

## Non-goals

- Size selector (FR-43, cut), bilingual page (FR-55), FR-44 to FR-48, real-browser
  tests (NFR-7), keyboard and screen-reader support (A-20), visual polish (A-14).
- New dependencies. Seed validation (the generator owns it, FR-51).

## Archive note

The baseline `openspec/specs/play-page/spec.md` already holds these requirements
and the delta is a faithful copy as `## ADDED Requirements`. A normal spec merge
would collide with the baseline, so the change is archived with
`npx openspec archive add-play-page --skip-specs --yes`. This slice changes no
spec text; any later spec edit goes to both files together.

## Module layout (pinned, not to be renamed)

| File | Responsibility |
|---|---|
| `src/ui/index.ts` | exports `mountPlayPage` (and its option types) only |
| `src/ui/play-page.ts` | `mountPlayPage`: model state, DOM build, click handling, messages |
| `src/ui/seed.ts` | `defaultSeedSource(): number`, the default seed source |
| `src/ui/style.css` | plain CSS: grid, given vs player cells, `cell-violation`, buttons |
| `src/main.ts` | imports `./ui/style.css`, calls `mountPlayPage(document.querySelector('#app'))` |

## Key decisions

1. **Model state, not DOM, is the source of truth.** The page keeps `board: Grid`
   (0, 1, null) and the message strings in closure state; click handling updates
   the model, then the DOM, and the engine is always called on the model. Parsing
   the DOM would tie engine calls to markup and could disagree with the model.
   Trade-off: two copies of the state; `renderCell` is the only writer of cell text
   and classes, which keeps them aligned.
2. **Seed source.** `src/ui/seed.ts` is outside `src/engine/`, so `Math.random` is
   allowed there (TC-8 covers the engine). The default returns
   `Math.floor(Math.random() * 2147483648)` (an integer 0..2147483647), remembers
   the previous value and redraws while the new value equals it, so two
   consecutive calls never match. `mountPlayPage` calls
   `options.seedSource ?? defaultSeedSource` exactly once per puzzle (mount and
   each new-puzzle press) and passes the value to `generate(6, seed)` unchanged.
   Trade-off: the previous-value memory is module state shared by all mounts;
   harmless, as the guarantee is only "differs from the last call".
3. **Events: one delegated click listener on `[data-board]`.** It resolves
   `event.target.closest('[data-cell]')` and reads `data-row` and `data-col`. The
   board element is rebuilt only on a new puzzle, so its single listener is added
   with the board and nothing leaks; 36 per-cell closures per rebuild would add
   nothing. Each button gets one listener at mount (buttons are never rebuilt).
4. **Re-render: update in place, rebuild on new puzzle.** A click or hint fill
   changes one model cell, calls `renderCell`, then `refreshHighlights()`, which
   recomputes `cell-violation` on all 36 cells from the cells in
   `findViolations(board)` (0-based engine coordinates; DOM is +1). A new puzzle
   replaces the whole `[data-board]` element and clears both messages. 36 cells
   make a full recompute cheap, so no diffing.
5. **Messages.** Hint: the engine sentence is written verbatim on each hint press,
   persists across cell clicks (A-23) and is cleared only by a new puzzle. Win:
   after every non-given click and every hint fill, `isSolved(board)` sets the
   exact text «Вітаємо, головоломку розв'язано!» (ASCII apostrophe U+0027) or
   clears it; a hint press that fills nothing leaves it untouched. A click on a
   given returns before any model, DOM or message change (FR-33).
6. **Hint mapping.** For `kind: 'fill'` the page sets `board[row][col] = value`
   (0-based) and updates the cell with `data-row = row + 1`, `data-col = col + 1`.
   One helper takes 0-based coordinates; no other code does `+ 1`.
7. **Page text.** Heading «Бінарка», buttons «Підказка» and «Нова головоломка», the
   win message and `document.title` are Cyrillic only (also set in `mountPlayPage`
   so jsdom sees it). No `aria-label`, `title`, `placeholder` or `alt` is added; the
   seed is never rendered or put in an attribute (A-4).

None of these decisions is ADR-worthy: all are local and reversible inside
`src/ui/`, and the stack is already ADR-0001.

## Data model

`Options { seedSource?, generate? }`; closure state `{ givens: Grid, board: Grid,
hintText, winText }`. `givens` is copied from `puzzle.givens` (no aliasing with an
injected fixture) and `board` starts as a copy. `Puzzle.solution` is never read.
DOM: `[data-board][data-size="6"]` with 36 `[data-cell][data-row][data-col][data-given]`,
buttons `[data-action="hint"|"new"]`, regions `[data-message="hint"|"win"]`.

## Error handling

| Situation | Result |
|---|---|
| Click on a given cell | ignored, no change, no message |
| Hint with `kind` 'none' or 'broken' | sentence shown, no cell changed |
| `generate` throws for the injected seed on a new-puzzle press | caught; the page shows nothing new, keeps the previous board and messages, does not crash |
| `generate` throws at mount (no previous board) | buttons and empty message regions render, no board; not asserted by any scenario |

No network, persistence or authentication exists, so no redirects or
authorization cases (spec exclusions). The page does no seed or size validation.

## Risks and mitigations

- **Rendering defects invisible to jsdom (TC-13).** CSS and layout are untested.
  Mitigation: small CSS, the page is served with `npx vite` and fetched with curl
  in the smoke step (5.8); real-browser checks are NFR-7, Future.
- **Hint index mapping (0-based vs 1-based).** Mitigation: one helper and the spec
  fixture (engine row 2, col 2 lands on `data-row="3"`, `data-col="3"`) as a test.
- **The page restating rules.** Mitigation: `src/ui/` imports only `findViolations`,
  `isSolved`, `hint` and `generate`; no digit counting or run checks; the
  review-gate reads for it.
- **Red-stage stubs.** Parallel test-writing uses stubs under `src/ui/*`; they are
  replaced, not extended, and none may survive into the final diff (tasks 4.x).
