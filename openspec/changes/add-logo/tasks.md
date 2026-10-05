# Tasks: add-logo

Order of work: section 1 (tests) is written FIRST from the delta spec and seen red before section 2 is implemented. No database exists, so the DB smoke flow of the template maps to the manual page check in 3.7. Commits that touch `src/` carry `Slice: add-logo` and `Refs: FR-65`. Every test is tagged `@trace FR-65`. This change is archived last of A, B, C, E; start from the baseline as archived by the earlier changes.

## 1. Failing tests first (red)

- [ ] 1.1 Create `tests/play-page-logo.test.ts` tagged `@trace FR-65`, one test per scenario of «Logo»: exactly one `svg` in the header with `aria-hidden="true"` and the heading text exactly «Бінарка»; no `text`, `title`, `desc`, `foreignObject` and no text node (a `TreeWalker` with `NodeFilter.SHOW_TEXT`), empty `textContent`; four `rect.logo-cell` with two distinct `x` and two distinct `y` values, four digit shapes in reading order bar, ring, ring, bar; one `circle` and at least one bar ray and one ring ray without the logo classes; no `img`, `image`, `use`, `picture`, `object`, `embed`, `canvas` and no `src` or `href` / `xlink:href`; the logo is the same element after «Нова головоломка», a size change to 4 and to 8, and a win (parameterised); the seed scan with the logo present.
- [ ] 1.2 Create `tests/no-image-assets.test.ts` tagged `@trace FR-65`: no file under `src/` has an image extension (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico`, `.svg`), `index.html` has no `<link>` with `rel` containing `icon` and no `<img>`, and `src/ui/style.css` has no `url(`. Read files with `node:fs`; do not add a dependency.
- [ ] 1.3 Run `npm run test:run`, confirm the new tests FAIL (red) for the right reason (no logo in the header), and save the failing output to `docs/qa/add-logo-red-run.txt` with the red and green counts. The existing tests, including «Seed is not shown», must still pass (no existing test is changed by this slice).

## 2. Implementation

Dependencies and database schema: none. No dependency (TC-10), no storage (TC-12), no network (TC-11); `src/engine/` and `src/ui/strings.ts` untouched.

- [ ] 2.1 Create `src/ui/logo.ts` exporting `createLogo(size?: number): SVGSVGElement`, built with `document.createElementNS('http://www.w3.org/2000/svg', ...)` and `setAttribute`, with no `innerHTML` and no whitespace text node: `viewBox="0 0 64 64"`, `aria-hidden="true"`, `focusable="false"`, class `logo`; twelve rays (even index: `rect` bar; odd index: `ellipse` ring, fill none, stroked with `currentColor`), one `circle`, four `rect.logo-cell`, and per cell a `rect.logo-digit` (1) or `ellipse.logo-digit-ring` (0) in the order 1, 0, 0, 1; geometry from `design/v0/components/binarka-page.tsx`. No `<text>`, `<title>`, `<desc>`, `href`.
- [ ] 2.2 In the header builder of `src/ui/play-page.ts` (created by `update-page-layout`) prepend `createLogo()` to the `h1`, before the title text node, once at mount. The title text comes from `src/ui/strings.ts`; no Cyrillic literal is added anywhere (the `ui-strings` source-scan test from change A must stay green).
- [ ] 2.3 In `src/ui/style.css` add the `.logo` rules (displayed size in the header, `.logo-cell`, `.logo-digit`, `.logo-digit-ring` colours) ported from `design/v0/app/binarka.css`, with no `url(`. Look and 40 px legibility are NOT claimed (held NFR-14, NFR-13).
- [ ] 2.4 Error paths: confirm by reading that `createLogo` takes no input and cannot throw to the user; no input is validated and no mutation exists in this slice. Authentication does not exist, so no redirect-to-login or forbidden case applies (play-page Exclusions).
- [ ] 2.5 Run `npm run test:run` and confirm every test is green, including «Seed is not shown» with the logo present, and no stub remains in `src/ui/`.

## 3. Validation, docs, and archive prep

- [ ] 3.1 Run `npm run lint`.
- [ ] 3.2 Run `npm run test:run`.
- [ ] 3.3 Run `npm run build`.
- [ ] 3.4 Run `npx openspec validate add-logo --strict`.
- [ ] 3.5 Run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs` (FR-65 cited and traced).
- [ ] 3.6 Update `README.md` (page usage: the header logo is an inline SVG, no image files) and `docs/current-state.md` (last update in UTC+5:30, phase, slice status, evidence paths, a "Scope NOT delivered" line naming held NFR-14 and NFR-13: legibility at 40 px and the look are not claimed).
- [ ] 3.7 Manual real-DB smoke test (no database exists; this is the real-browser page check, current Chromium): (a) run `npm run dev` and open the printed URL; (b) the header shows the logo next to «Бінарка»; zoom the page so the logo is about 40 px and look at the four digits: record whether «1 0 / 0 1» can be told apart (observation only, NFR-14 stays held); (c) open the browser's element inspector: the logo is an `svg` inside the `h1`, with no `img`, no `<text>`, and the Network panel shows no image request; (d) press «Нова головоломка», pick 4×4 and 8×8: the logo stays; (e) select all text on the page (Ctrl/Cmd+A): the logo adds no selectable word; (f) save a screenshot under `docs/qa/add-logo/` and record its path in `docs/current-state.md` as observed, not verified; (g) stop the server. The smoke test is a gate for 3.9.
- [ ] 3.8 Run the review-gate with `change: add-logo` (one run, one fix round for confirmed defects, one confirming run); record the report path in `docs/current-state.md`.
- [ ] 3.9 Archive only after 3.1 to 3.8 passed and the smoke test in 3.7 passed: before archive, rebase the delta on the baseline as archived by `update-controls-accessibility` (this change adds one requirement and touches no baseline requirement, so confirm only that «Logo» does not collide in name with a requirement archived by A, B or C); run `npx openspec archive add-logo --yes` (a normal merge, NOT `--skip-specs`); then in the same commit make the baseline text edits listed in `design.md`; run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`.
