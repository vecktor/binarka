# Change: add-play-page

## Why

Slice 1 (`add-puzzle-engine`, archived) delivered a pure engine: generator,
rule checker, hint engine. Nothing yet lets a person play. Бінарка needs a
single static page on which the player solves a 6×6 puzzle: click cells,
see rule violations highlighted at once, ask for a hint, see a win message,
start a new puzzle. The page only consumes the engine and never restates a
rule (`docs/mvp-capability-plan.md` section 4.2). Feature freeze is 00:00
user time; slice 2 is archived before it.

## What Changes

- Add `src/ui/` (`index`, `play-page`, `seed`, `style.css`): the exported
  entry point `mountPlayPage(root, options?)`, the page, the default seed
  source and a small plain stylesheet.
- Change `src/main.ts` to call `mountPlayPage(document.querySelector('#app'))`
  and import `src/ui/style.css` (no dependency; Vite handles CSS).
- Add jsdom tests `tests/play-page-*.test.ts`, tagged `@trace FR-x`, written
  first against red-stage stubs in `src/ui` and seen red.
- No new dependencies. The engine is unchanged; the page imports from
  `src/engine/index.ts` only.

Scope in: FR-31 to FR-42, NFR-5 (text the page itself shows: heading,
buttons, win message, `document.title`, user-visible attributes).

Scope out: FR-43 (size selector, cut 0, NOT-EARNED, the page is always 6×6),
FR-55 (bilingual page), FR-44 to FR-48 (difficulty, timer, saved progress,
undo, daily puzzle), NFR-7 (real-browser tests), keyboard and screen-reader
support (A-20), mobile layout and visual polish (A-14).

## Impact

- Affected specs: `play-page`. The delta in `specs/play-page/spec.md` is a
  faithful `## ADDED Requirements` copy of the baseline already in
  `openspec/specs/play-page/spec.md`, so this change is archived with
  `--skip-specs`. No spec text changes in this slice; the `mountPlayPage`
  contract and the DOM contract are unchanged.
- Affected code: new `src/ui/*`, changed `src/main.ts`, new
  `tests/play-page-*.test.ts`. `index.html` keeps its Ukrainian title.
- Downstream: none; this is the last MVP slice. The eval (NFR-6) and the
  gate report follow in section 4.3 of the capability plan.
- Risks: jsdom cannot see rendering defects (TC-13), the hint index mapping
  (engine 0-based, DOM 1-based), the page restating rules. See `design.md`.
- Commits carry trailers `Slice: add-play-page` and `Refs: FR-x`.
