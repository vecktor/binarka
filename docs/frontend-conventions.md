# Frontend conventions — Бінарка (HTML, CSS, DOM, accessibility)

Status: **ACCEPTED** by the user on 2026-10-06, with Vercel's guidelines vendored at `.vendor-docs/web-interface-guidelines/AGENTS.md`. ADR-0004 covers how this file is loaded. The gaps in §9 will be fixed by a separate accessibility slice, after a requirements amendment that the user signs.

Applies to `index.html`, `src/main.ts` and `src/ui/**` (TypeScript and CSS). TypeScript, tooling and test rules stay in `docs/coding-conventions.md`. Vite's own handling of HTML, CSS and assets is in §7 of that file.

**Precedence:**
1. The signed requirements and specs. For example, NFR-5 makes all page text Ukrainian, and that includes `aria-label` and `title`: the page tests read them.
2. WCAG 2.2 AA, as the measurable bar.
3. WAI-ARIA APG, for widget behaviour.
4. Vercel's Web Interface Guidelines, as the practice checklist.
5. The Google HTML/CSS guide, for formatting.

MDN is the reference for the APIs themselves.

## 1. HTML and semantics

1. Use native elements before ARIA: `<button type="button">` for actions, `<select>` for the size, and a visible `<label>` for every form control. The label is either `<label for>`, or a wrapping `<label>` when the same markup can be mounted more than once in a document. The play page mounts per root, so ids would collide and a wrapping label is used (amended 2026-10-06, `add-page-accessibility` critic). Use ARIA roles only where no native element fits (the board, §2). Sources: Vercel "Prefer native semantics … before ARIA"; WCAG 4.1.2; MDN `<label>`.
2. One `<h1>`, `lang="uk"`, an accurate `<title>`. Never disable zoom: no `user-scalable=no`, no `maximum-scale` (Vercel NEVER rule).
3. Classes are for styling. `data-*` attributes are the scripting and test contract (the play-page spec's DOM contract): keep them when markup changes. Do not use ID selectors or `!important` in CSS (Google HTML/CSS guide).
4. Build the DOM with `createElement` and `textContent`, never `innerHTML` (as in `docs/coding-conventions.md` §7).

## 2. The board is an APG grid

Source: WAI-ARIA APG Grid pattern and "Developing a Keyboard Interface". The board needs both data-grid keys and a puzzle's cell semantics.

5. `role="grid"` on the board, with a Ukrainian `aria-label` that names the size (for example «Поле 6×6»). Each row gets `role="row"` and each cell `role="gridcell"`.
6. The board is one tab stop, using a roving tabindex: `tabindex="0"` on the active cell, `-1` on the others, and `focus()` when it moves.
   - Arrow keys move one cell and stop at the edges. No wrapping: in a data grid, APG calls wrapping disorienting.
   - Home/End go to the start or end of the row. Ctrl+Home/Ctrl+End go to the first or last cell.
   - Prevent the browser default (page scrolling) only for keys the board handles.
7. Enter and Space cycle the focused cell exactly like a click, through the same code path. A click also moves the roving tabindex to the clicked cell.
8. Given cells stay focusable, carry `aria-readonly="true"`, and ignore toggles.
9. Each cell's accessible text states its value: empty, «0» or «1». A cell in a violation carries `aria-invalid="true"`.

## 3. Names, states and announcements

10. Every interactive element has an accessible name, in Ukrainian (NFR-5). A visible label beats an `aria-label` alone: the WCAG 3.3.2 Understanding page notes that `aria-label` can pass 4.1.2 and still fail 3.3.2.
11. Status text (the hint sentence and the win message) lives in `role="status"` elements. They are in the page, empty, from the first render. Only their text changes, and focus never moves to them (WCAG 4.1.3; MDN live regions; Vercel "polite `aria-live`").

## 4. Focus

12. Every focusable element shows a `:focus-visible` indicator that has at least 3:1 contrast with its surroundings. Never use `outline: none` without a replacement. Nothing covers the focused element (WCAG 2.4.7 and 2.4.11; Vercel "Visible, unobscured focus rings"). Candidate colour: `#1d4ed8`, which measures 4.55:1 or better against white, the page, given cells and violation cells.

## 5. Colour and contrast

13. Text needs at least 4.5:1. Component boundaries, state indicators and focus rings need at least 3:1 against adjacent colours (WCAG 1.4.3 and 1.4.11). The WCAG 2 ratios are the gate. Vercel prefers APCA, which is not used here.
14. Never convey a state by colour alone. A violation needs a second cue, such as a heavier border, a pattern or an icon, plus `aria-invalid` (WCAG 1.4.1; Vercel "Redundant status cues"). Givens already have one: bold digits.
15. Keep colours as CSS custom properties in one place, so contrast is checked once. A native `<select>` gets an explicit `background-color` and `color` (Vercel; Windows rendering).

## 6. Touch and pointer

16. Targets are at least 24×24 CSS px (WCAG 2.5.8). Vercel asks for 44 px on phones. The 8×8 board at 375 px has 41 px cells, so that rule is a recorded gap unless the user decides otherwise.
17. Set `touch-action: manipulation` on the board, to avoid the double-tap zoom delay (Vercel).

## 7. Layout, motion and CSS

18. Lay out with grid or flex, never with measurements taken in JS. Check the page at 375 px (no horizontal scroll) and on desktop (Vercel "Verify mobile, laptop, ultra-wide").
19. Animate only `transform` and `opacity`. List transition properties instead of `transition: all`. Honour `prefers-reduced-motion` (Vercel). The page has no animation today.
20. CSS features must work in Vite 8's build target: Chrome/Edge 111, Firefox 114, Safari 16.4 (MDN browser-compat-data, 2026-10-06). Vite lowers syntax only in `vite build`, and only through the CSS minifier. With the default `build.cssMinify`, that minifier is Lightning CSS. `vite dev` serves CSS as written, so check in a current browser.

| Feature | Use it? | Why |
|---|---|---|
| Nesting | yes, while `build.cssMinify` stays at its default | Firefox and Safari in the target lack it. The default minifier (Lightning CSS) flattens it in `vite build`; with minify off, raw nesting would ship |
| `:has()` | **no**, not for state | Firefox 114–120 lack it, and Vite does not lower it, so the rule never matches there |
| `text-wrap: balance` | enhancement only | not in Firefox 114 or Safari 16.4; it is simply ignored there |
| `:focus-visible`, custom properties, `@layer`, container queries, logical properties, `inset`, `aspect-ratio`, grid `gap`, `dvh`, `color-mix()`, media queries for motion and colour scheme | yes | inside the target |

21. Formatting (Google HTML/CSS guide): lowercase, 2-space indent, hyphenated class names, no user-agent hacks.

## 8. Behaviour rules that need a product decision

These are Vercel rules that change product behaviour, so they are listed, not applied:

- "Confirm destructive actions or provide Undo window": «Нова головоломка» and a size change both discard the player's progress without asking.
- "URL reflects state": the seed and size are not in the URL.

## 9. Gaps in the current page

Measured 2026-10-06 on `b748b11`. The contrast ratios were computed with the WCAG formula. None of these is a spec violation, because the requirements have no accessibility NFR. G1–G4 and G6 change the page's DOM or its visible text, so they need a requirements amendment and a slice. G5, G7 and G9 are CSS-only; whether they need an amendment is the user's call.

| # | Rule | Now | Proposed fix |
|---|---|---|---|
| G1 | §2, WCAG 2.1.1 and 4.1.2 | cells are `<div>`s with only a click handler: no keyboard access, no role, name or state | APG grid (rules 5–9) |
| G2 | rule 10, WCAG 3.3.2 | the size `<select>` has no label | a visible wrapping `<label>` «Розмір поля» (no ids, see rule 1) |
| G3 | rule 11, WCAG 4.1.3 | the hint and win paragraphs are not live regions | `role="status"` |
| G4 | rule 14, WCAG 1.4.1 | violations are shown by colour only (fill 1.45:1 against white) | a second cue plus `aria-invalid`; for example a 2 px `#b91c1c` border (4.47:1 or better) |
| G5 | rule 13, WCAG 1.4.11 | cell border `#9ca3af` is 2.43:1 against the page and 2.54:1 against a cell | `#6b7280` (4.63:1 against the page, 3.28:1 against a given cell) |
| G6 | rule 12, WCAG 2.4.7 | no focus style; cells cannot take focus | a `:focus-visible` ring, together with G1 |
| G7 | rule 16 (Vercel 44 px) | 8×8 cells at 375 px are 41 px | accept and record, or reduce the gaps |
| G8 | §8 | progress is discarded silently; URL has no state | product decision |
| G9 | rule 15 (Vercel) | the `<select>` sets `background` but inherits `color` | set `color` explicitly |

Already fine: all text contrast (5.74:1 or better); `lang="uk"`; zoom allowed; buttons are native; 8×8 targets are above WCAG's 24 px; layout works at 375 px.

## Sources (checked 2026-10-06)

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (W3C Recommendation, 12 Dec 2024): 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.4.7, 2.4.11, 2.5.8, 3.3.2, 4.1.2, 4.1.3. W3C Document License, so link only.
- WAI-ARIA APG: [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) and [Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/). W3C Software and Document License, which allows copying with the notice.
- Vercel [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines), `AGENTS.md` at commit `434b7f9` (2026-10-05), MIT. Vendored at `.vendor-docs/web-interface-guidelines/AGENTS.md`; `npm run check:docs` guards the pin. Not used: the Copywriting, Hydration and React-specific rules.
- MDN: [Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Keyboard-navigable_JavaScript_widgets), [ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions), [`status` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role), [`grid` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/grid_role). The prose is CC-BY-SA, so link and paraphrase.
- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html) (CC-BY 3.0; updated 2026-09).
- Vite 8.3.2: `build.cssTarget` defaults to `build.target`, and `build.cssMinify` uses Lightning CSS (`.vendor-docs/vite/config/build-options.md`). Feature data: MDN browser-compat-data `css/` at `03b0ca3`.
