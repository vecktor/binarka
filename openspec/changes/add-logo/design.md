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

1. **Build with `createElementNS`, in `src/ui/logo.ts`, with its own helper.** The page has no JSX and no framework (TC-2), and `innerHTML` with an SVG string would create whitespace text nodes that FR-72 forbids ("no text node"). The `el` helper of `src/ui/play-page.ts` calls `document.createElement`, which makes HTML elements, so it cannot build SVG shapes; `logo.ts` has a small private helper of its own, `svgEl(tag, attrs)`, that calls `document.createElementNS('http://www.w3.org/2000/svg', tag)` and `setAttribute` (it does not touch `el`, and sets no `id`). `createLogo()` returns the `svg` element: `viewBox="0 0 64 64"`, `aria-hidden="true"`, `focusable="false"`, class `logo`. Trade-off: more lines than a template string, but no stray text node and no parsing step.
2. **Geometry from the frozen design.** `design/v0/components/binarka-page.tsx` (iteration 7) gives the shapes: twelve rays on a 64×64 viewBox (even rays are bars `rect` 2.8×8, odd rays are rings `ellipse` rx 2.3 ry 3.2), a `circle` r 19.5, four `.logo-cell` rects 11×11 at (20.5, 20.5), (32.5, 20.5), (20.5, 32.5), (32.5, 32.5), and per cell a bar `rect.logo-digit` (1) or a ring `ellipse.logo-digit-ring` (0). The classes are the hooks that make "1 0 / 0 1" checkable. FR-72 itself names no class, tag or "same element" rule: the classes `logo-cell`, `logo-digit`, `logo-digit-ring`, the tags (`rect` for a bar and a cell, `ellipse` for a ring, `circle`) and "the same element after a board change" are spec-made proxies for FR-72 and TC-14 so that jsdom can decide pass or fail. Their source is the frozen design (the same source as the hooks of A-30, which does not list these classes) and the mount-once structure of the page; they are not new requirements, and the requirement text says so.
3. **Placement and sizing: inside the `h1`, before the title text; CSS sets the size.** As in the frozen design (`design/v0/components/binarka-page.tsx`, the `h1` of the page header: `<Logo />` then the text), `h1 > svg + text «Бінарка»`. Because the SVG is `aria-hidden` and has no text, the heading's accessible name and `textContent` stay «Бінарка» (a scenario pins the text). The logo is built once with the header by the mount code (`src/ui/play-page.ts`, `header.append(el('h1', {}, TITLE), rulesButton)`), so it is never rebuilt. Alternative: a sibling of the `h1` inside the `header`; rejected only to stay equal to the frozen design that the held pixel check compares with. Sizing: `createLogo()` takes no size and writes no `width` or `height` attribute (the frozen design writes `width` and `height` 56 and then overrides them in CSS); CSS sizes the logo (`.page-header h1 .logo` at 3.5rem, and 4rem at `min-width: 48rem`, as in `design/v0/app/binarka.css`), the `viewBox` stays `0 0 64 64`. Placement: the `h1` becomes a flex row, `display: inline-flex; align-items: center; gap: 0.5rem` (the existing `h1` margin stays), with `.logo { flex: none }` so the logo does not shrink. Trade-off: the size lives in one place (CSS) and a media query can change it, but an SVG with no size attributes is unsized until the stylesheet loads; the page cannot run without its stylesheet, so this is accepted.
4. **Colours through the existing FR-65 tokens, no new token, no literal.** The frozen design colours the logo with `var(--primary)` and `var(--primary-ink)` (`design/v0/app/binarka.css`, the `.logo`, `.logo-cell`, `.logo-digit`, `.logo-digit-ring` rules). Those variables do not exist in `src/ui/style.css`, and the baseline colour rule (FR-65, `openspec/specs/play-page/spec.md`, «Requirement: Borders, cues and focus rings have enough contrast», about line 1220; `docs/frontend-conventions.md` rule 15) allows only `var(--color-...)` of the 13 tokens declared in `:root`, plus the keyword `currentcolor`, and no colour literal. So the rules are mapped, not ported: `.logo { color: var(--color-text); }` (the circle and the rays are drawn with `currentColor`), `.logo .logo-cell { fill: var(--color-cell-bg); }` (a light cell on the dark circle), `.logo .logo-digit { fill: currentcolor; }`, `.logo .logo-digit-ring { fill: none; stroke: currentcolor; }`. The `fill="currentColor"` and `stroke="currentColor"` attributes of the rays and the circle are the keyword, not a colour word or literal. No new `--color-*` token, no `#rrggbb`, no `url(...)`, no gradient reference, no external font (TC-14, TC-11). The FR-65 stylesheet tests (`tests/play-page-stylesheet.test.ts`, the colour-scan tests) must stay green and are re-run after the CSS is added; the 13 token names stay exactly 13. Contrast of the mark is not claimed (held NFR-14, NFR-15).
5. **Coordinates cannot spell the seed.** The baseline scenario «Seed is not shown» collects every attribute value, and `/9\D?8\D?7\D?6\D?5\D?4/` is deliberately loose. SVG attribute values (`viewBox`, `transform`, `x`, `y`) could in principle match such a pattern. The geometry above does not (values are short: `0 0 64 64`, `rotate(30 32 32)`); the logo scenario «does not leak the seed» runs the scan with the logo present so a future change of the geometry cannot silently break the baseline.
6. **TC-14 as a test.** A repository scan (like the engine-purity scan, A-21) lists files under `src/` (and under `public/` if that directory exists; it does not exist today) for image extensions and checks `index.html` and `style.css`. A constraint check, not a behaviour; it is tagged `@trace FR-72` together with the DOM scenarios because FR-72 is the one row that allows the single graphic. TC-14 is a constraint: it is named in the `Traces:` line of the requirement (`node scripts/check-traceability.mjs` and `openspec validate --strict` accept a TC id there; checked), but test tags stay plain FR ids, so no test is tagged `@trace TC-14`. The scan is a guard, not a behaviour test: before the logo exists it passes (see the red-run note in `tasks.md` 1.3).

None of these decisions is ADR-worthy: no dependency, no storage, no module contract.

## Data model

No state. One new pure function `createLogo(): SVGSVGElement` in `src/ui/logo.ts` (no parameter, no `width` or `height` attribute; the header CSS sets the displayed size, decision 3). The function and its private `svgEl` helper set no `id` attribute on any element: `tests/play-page-semantics.test.ts` (about lines 68 and 170) counts exactly three ids per mount and exactly six in a document with two mounts. One CSS block for `.logo` (decisions 3 and 4). Nothing is stored (TC-12).

## Error handling strategy

The logo takes no input and calls nothing that can fail (`createElementNS` with fixed names). There is no error path, no message and no raw-exception case. If SVG creation were unsupported the page would not run at all (the same is true of the DOM calls already used).

## jsdom limits (TC-13)

jsdom creates SVG elements with `createElementNS` and supports `classList`, `getAttribute` and `TreeWalker`, so structure, classes, absence of text and absence of `href` are checkable. jsdom has no layout, so sizes, positions as drawn, colours and legibility at 40 px are not tested and not claimed (held NFR-15, NFR-14). Because jsdom lacks `showModal`, `close` and `showPopover` (verified), this slice's tests do not touch the dialog or the popover.

## Tests that change deliberately (by FR)

- None of the existing tests changes (confirmed by an audit of `tests/`: no test counts the children of the header or the `svg` elements; the heading text stays exactly «Бінарка» because the `svg` has no text node; the NFR-5 text scans in `tests/ui-strings.test.ts` and `tests/helpers/play-page.ts` skip text under `aria-hidden="true"` and read only `aria-label`, `title`, `placeholder` and `alt` attributes, which the logo does not set; the id counts of `tests/play-page-semantics.test.ts` hold because the logo has no `id`; the FR-65 tests in `tests/play-page-stylesheet.test.ts` hold because the new CSS uses only tokens and `currentcolor`). `tests/play-page-new-puzzle-and-seed.test.ts` («Seed is not shown», FR-31/FR-42/FR-43/FR-51) is re-run unchanged with the logo present and must stay green; if the geometry ever matched the loose seed regex, the test, not the regex, would reveal it and the geometry would change.
- New: `tests/play-page-logo.test.ts` (FR-72) and `tests/no-image-assets.test.ts` (FR-72 repository scan).

## Risks and mitigations

- **Text sneaks in** (`<title>`, a whitespace node from `innerHTML`): scenario «The logo holds no text» walks all nodes with a `TreeWalker`.
- **Wrong digit order** (the mini board reads «1 0 / 1 0»): the reading-order scenario.
- **An image file or a `url()` is added later**: the repository scan.
- **Logo illegible at 40 px**: not claimed; held NFR-15; the fallback is a later signed step.
- **Logo rebuilt on a new puzzle**: scenario «The logo survives every board change» (same element).
- **Baseline text drift**: hand edits at archive (below); rebase on the baseline as archived by the earlier changes.
- **A colour literal or a new token slips in with the CSS port**: the FR-65 stylesheet tests catch it; the mapping in decision 4 uses existing tokens only.
- **The logo gets an `id`** (for example a copied `<defs>` or gradient): the id-count tests of `tests/play-page-semantics.test.ts` fail; `createLogo` sets no `id`.

## Baseline text edits at archive

Archive normally (not `--skip-specs`) and in the SAME commit edit the non-requirement text of `openspec/specs/play-page/spec.md`, rebased on the baseline as archived by the earlier changes (A, B, C, the accessibility merge, `reconcile-ux-accessibility` at `2026-10-08-reconcile-ux-accessibility`, and `update-win-apostrophe` at `2026-10-08-update-win-apostrophe`). Anchors are given by text and by the line numbers of the baseline at commit 092562e; find them again by text, the numbers may have moved:

1. **Ownership (line 7, the `Ownership:` paragraph):** the list now reads "FR-66 to FR-71 and FR-73"; make it "FR-66 to FR-73" (FR-72, the logo, joins it; TC-14 is the constraint FR-72 relaxes and needs no ownership entry).
2. **DOM contract (the list under «DOM contract used by the scenarios»):** add one bullet after the «Page root» bullet (line 32): "Logo: one decorative inline `svg` with `aria-hidden="true"` inside the `h1` of the `header`, built once at mount, with no text, no `id` and no `href`/`src`; its shapes carry the classes `logo-cell`, `logo-digit`, `logo-digit-ring` (see «Logo»)". The mount bullet (line 18, «Mounting is synchronous: ... the header (heading «Бінарка» and the «Правила» button) ...») needs no change: the logo is part of the header. The «Ids» bullet (line 33) needs no change: the logo has no id.
3. **Exclusions (the `## Exclusions` section, line 1496):** add "- Image files and bitmap or other graphics assets are intentionally unsupported (TC-14); the only graphic is the inline SVG logo of FR-72. Legibility of the logo at 40 px and its look are not specified (held NFR-15, NFR-14)."

Before archive confirm by `grep -n "Logo" openspec/specs/play-page/spec.md` that no requirement named «Logo» exists in the baseline (none today); if one appeared, rename this requirement before archive. Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`.
