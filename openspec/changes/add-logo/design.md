# Design: add-logo

## Goals

- An inline SVG logo in the header (FR-72): a 2×2 mini board «1 0 / 0 1» as shapes, in a circle with 0/1 rays, no text, `aria-hidden="true"`.
- TC-14 stays true: no image file, no bitmap, no other graphics asset; the only graphic is this inline SVG drawn in the page source.

## Non-goals

- Legibility at 40 px, the look, the colour and the dark-theme rendering of the mark: held NFR-15 and NFR-14 (`docs/requirements-held.md`). This slice cannot check pixels in jsdom, so it pins the shapes and the absence of text and files only. Fallback if the mini board fails at 40 px (the digits "01" as shapes, UX decision 10) is a later signed step, not this change.
- A favicon or any file asset (TC-14), the logo-size capture route of the frozen design, an animation.
- New page text: none (`src/ui/strings.ts` gets nothing from E). The title «Бінарка» is already in it from change A.
- Authentication: none exists, so no redirect-to-login or forbidden case applies.

## Key decisions

1. **Build with `createElementNS`, in `src/ui/logo.ts`.** The page has no JSX and no framework (TC-2), and `innerHTML` with an SVG string would create whitespace text nodes that FR-72 forbids ("no text node"). `createLogo(size)` returns the `svg` element: `viewBox="0 0 64 64"`, `aria-hidden="true"`, `focusable="false"`, class `logo`. Trade-off: more lines than a template string, but no stray text node and no parsing step.
2. **Geometry from the frozen design.** `design/v0/components/binarka-page.tsx` (iteration 7) gives the shapes: twelve rays on a 64×64 viewBox (even rays are bars `rect` 2.8×8, odd rays are rings `ellipse` rx 2.3 ry 3.2), a `circle` r 19.5, four `.logo-cell` rects 11×11 at (20.5, 20.5), (32.5, 20.5), (20.5, 32.5), (32.5, 32.5), and per cell a bar `rect.logo-digit` (1) or a ring `ellipse.logo-digit-ring` (0). The classes are the hooks that make "1 0 / 0 1" checkable; they come from the frozen design (A-30 style) and are a judgement call of this spec, stated in the requirement.
3. **Placement: inside the `h1`, before the title text.** As in the frozen design, `h1 > svg + text «Бінарка»`. Because the SVG is `aria-hidden` and has no text, the heading's accessible name and `textContent` stay «Бінарка» (a scenario pins the text). The logo is built once with the header by change A's mount code, so it is never rebuilt. Alternative: a sibling of the `h1` inside the `header`; rejected only to stay equal to the frozen design that the held pixel check compares with.
4. **Colours through CSS, not attributes with colour words.** Shapes use `fill="currentColor"` and classes; the inner cell and digit colours come from `.logo .logo-cell`, `.logo .logo-digit`, `.logo .logo-digit-ring` rules ported from `design/v0/app/binarka.css`. No `url(...)`, no gradient reference, no external font (TC-14, TC-11).
5. **Coordinates cannot spell the seed.** The baseline scenario «Seed is not shown» collects every attribute value, and `/9\D?8\D?7\D?6\D?5\D?4/` is deliberately loose. SVG attribute values (`viewBox`, `transform`, `x`, `y`) could in principle match such a pattern. The geometry above does not (values are short: `0 0 64 64`, `rotate(30 32 32)`); the logo scenario «does not leak the seed» runs the scan with the logo present so a future change of the geometry cannot silently break the baseline.
6. **TC-14 as a test.** A repository scan (like the engine-purity scan, A-21) lists files under `src/` for image extensions and checks `index.html` and `style.css`. A constraint check, not a behaviour; it is tagged `@trace FR-72` together with the DOM scenarios because FR-72 is the one row that allows the single graphic. TC-14 itself is a constraint and is not traced.

None of these decisions is ADR-worthy: no dependency, no storage, no module contract.

## Data model

No state. One new pure function `createLogo(size?: number): SVGSVGElement` in `src/ui/logo.ts` (default size per the frozen design; the header CSS sets the displayed size). One CSS block for `.logo`. Nothing is stored (TC-12).

## Error handling strategy

The logo takes no input and calls nothing that can fail (`createElementNS` with fixed names). There is no error path, no message and no raw-exception case. If SVG creation were unsupported the page would not run at all (the same is true of the DOM calls already used).

## jsdom limits (TC-13)

jsdom creates SVG elements with `createElementNS` and supports `classList`, `getAttribute` and `TreeWalker`, so structure, classes, absence of text and absence of `href` are checkable. jsdom has no layout, so sizes, positions as drawn, colours and legibility at 40 px are not tested and not claimed (held NFR-15, NFR-14). Because jsdom lacks `showModal`, `close` and `showPopover` (verified), this slice's tests do not touch the dialog or the popover.

## Tests that change deliberately (by FR)

- None of the existing tests changes. `tests/play-page-new-puzzle-and-seed.test.ts` («Seed is not shown», FR-31/FR-42/FR-43/FR-51) is re-run unchanged with the logo present and must stay green; if the geometry ever matched the loose seed regex, the test, not the regex, would reveal it and the geometry would change.
- New: `tests/play-page-logo.test.ts` (FR-72) and `tests/no-image-assets.test.ts` (FR-72 repository scan).

## Risks and mitigations

- **Text sneaks in** (`<title>`, a whitespace node from `innerHTML`): scenario «The logo holds no text» walks all nodes with a `TreeWalker`.
- **Wrong digit order** (the mini board reads «1 0 / 1 0»): the reading-order scenario.
- **An image file or a `url()` is added later**: the repository scan.
- **Logo illegible at 40 px**: not claimed; held NFR-15; the fallback is a later signed step.
- **Logo rebuilt on a new puzzle**: scenario «The logo survives every board change» (same element).
- **Baseline text drift**: hand edits at archive (below); rebase on the baseline as archived by the earlier changes.

## Baseline text edits at archive

Archive normally (not `--skip-specs`) and in the SAME commit edit the non-requirement text of `openspec/specs/play-page/spec.md`, rebased on the baseline as archived by A, B and C:

1. **Ownership:** add FR-72 (the logo, with TC-14) to the owned list.
2. **DOM contract:** add "Logo: one decorative inline `svg` in the `header`, with the classes `logo-cell`, `logo-digit`, `logo-digit-ring`".
3. **Exclusions:** add "Image files and bitmap or other graphics assets are intentionally unsupported (TC-14); the only graphic is the inline SVG logo of FR-72."

Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`.
