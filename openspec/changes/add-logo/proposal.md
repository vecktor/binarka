# Change: add-logo

## Why

The page header has a title and the «Правила» button (change A) but no mark. UX decision 10 of the amendment signed on 2026-10-05 about 23:31 (autonomy-log row 57) asks for a small logo made only of shapes: a 2×2 mini board «1 0 / 0 1» inside a circle with 0/1 rays, drawn as an inline SVG in the page source. The constraint TC-14 was amended with it: image files and bitmap or other graphics assets stay out of scope, and the one graphic allowed is this inline SVG. This is slice E of `docs/mvp-capability-plan.md` section 4.7; it is archived after A, B and C and only adds to the header created by A.

## What Changes

- The header shows an inline `<svg>` logo (FR-65): a 2×2 mini board with the digits «1 0 / 0 1» drawn as shapes (a bar for 1, a ring for 0), in a circle with 0/1 rays (alternating bars and rings). No `<text>` element, no text node, no word. `aria-hidden="true"`: the title in the header stays the page's text heading.
- It is built in code with `createElementNS`, in a new module `src/ui/logo.ts`; the SVG lives in the page source, no image file, no `<img>`, no external reference (TC-14).
- A test scans `src/` for image files (TC-14); the existing scenario «Seed is not shown» is run with the logo present.
- No page text: E adds nothing to `src/ui/strings.ts` (the logo has no text; the title «Бінарка» is already there from change A).
- Spec: one ADDED requirement «Logo» with its scenarios. No baseline requirement is MODIFIED or REMOVED by this change.

Baseline requirements touched by this change (the table of all four changes is in `openspec/changes/update-page-layout/proposal.md`):

| Baseline requirement | Action |
|---|---|
| none | ADDED «Logo» only |

Out of scope: legibility at 40 px and the look of the mark (held NFR-14, NFR-13, `docs/requirements-held.md`; fallback if the mini board fails at 40 px: the digits "01" as shapes, UX decision 10, a later signed step); a favicon (an image file, TC-14); the logo-size capture route of the frozen design.

## Impact

- Affected specs: `play-page` (1 ADDED). Normal merge at archive.
- Affected code: new `src/ui/logo.ts`, a small change in `src/ui/play-page.ts` (the header builder), `src/ui/style.css`; tests under `tests/`. No dependency; `src/engine/` untouched.
- Commits carry `Slice: add-logo` and `Refs: FR-65`.
