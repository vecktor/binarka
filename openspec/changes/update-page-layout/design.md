# Design: update-page-layout

## Goals

- A header with the title and a «Правила» button; the rules in a native popover panel (FR-57); the document order of FR-61; the always-present idle line (FR-64).
- One module, `src/ui/strings.ts`, holding every Ukrainian page text (user decision 2026-10-05 about 23:40, autonomy-log row 58), so slices B, C and E add their texts there and inline none.
- NFR-5 holds for the new texts and stays checkable by a source scan.

## Non-goals

- Layout, placement of the panel (bottom sheet below 48rem, centred panel from 48rem), the idle line's visibility, reserved message height, one-screen fit, pixel parity with `design/v0-screenshots/review-set-5/`: held NFR-9, NFR-13 (and NFR-14), `docs/requirements-held.md`. Not claimed here; the CSS is ported far enough to make the page usable and reported NOT-EARNED against the held rows.
- The confirmation dialog, the segmented size control, button cells (change C), the logo (change E), the win apostrophe (slice D), FR-27 (slice F).
- A language switch, a translation layer or message catalogues (FR-55, FR-56 are Future). `strings.ts` is a flat module of constants and two small functions, not an i18n framework. Hint sentences stay in `src/engine/` (they are engine output).
- Authentication: none exists, so no redirect-to-login or forbidden case applies (play-page Exclusions).

## Key decisions

1. **Native popover, no script (FR-57, A-26).** The panel is `<div popover id=...>`; the header button carries `popovertarget`, the close button `popovertarget` and `popovertargetaction="hide"`. The browser opens, closes, handles Escape and light dismiss; the page code never calls `showPopover`. Trade-off: no focus management beyond the browser's (the close button carries `autofocus`, so opening the popover moves focus into it, and the panel has `role="dialog"` named by its heading; both depart from the frozen markup by the user's decisions of 2026-10-06, review rounds 1 and 2, autonomy-log row 62), and jsdom has no popover behaviour, so tests assert attributes and that no `showPopover`/`hidePopover`/`togglePopover` is called. Browser support (current Chromium tested, others by design) is A-14 held. Alternative rejected: a script toggling a `hidden` section, which would need handlers, focus return and Escape code the browser already provides.
2. **The panel is created once at mount, as the last child of the root, after the message area.** `showPuzzle` replaces only the board host, so the panel is never rebuilt (A-26). It is outside the FR-61 sequence. Change C appends the confirmation dialog after it.
3. **The panel `id` is unique per mount.** A module counter gives `rules-panel-1`, `rules-panel-2`, ... (also used for `aria-labelledby` of the heading). The frozen design uses the fixed id `rules`; with two mounts in one document (allowed by the baseline: "two mounts on two roots are independent") a fixed id would make the second button open the first panel. Cost: one counter.
4. **Decorative examples are optional and aria-hidden.** A-26 and A-29 ratify the examples of the frozen design (`0 0 1`, `0 1 0 1`, `0110 ≠ 1001`). They are built as `span`s with `aria-hidden="true"` inside each `li`; the text of an item is compared without them. They hold digits and `≠` only, no letter (tested). Because their digits are text nodes, the baseline «Ukrainian page text» requirement needed a one-line exemption for `aria-hidden` text; this is why A MODIFIES that requirement (single owner, see proposal table). The scenario «Win message text» there is reworded to point at FR-41 so that slice D's apostrophe change does not overlap.
5. **The idle line is hidden by CSS only.** `.messages:has([data-message="hint"]:not(:empty), [data-message="win"]:not(:empty)) .message-idle { display: none }` (as in `design/v0/app/binarka.css`). It relies on the hint and win elements having no child node when empty; the page already sets `textContent = ''`, and a scenario pins "no child node". The scenario that the idle element is never removed and never gets `hidden`/`style` is the DOM half of "CSS only". Whether the line is actually visible or hidden is layout: held.
6. **`strings.ts` is a flat module.** Shape (names are guidance, the tests do not import it, so a test asserting an exact text cannot become a tautology):

   ```ts
   export const TITLE = 'Бінарка';
   export const BUTTONS = { hint: 'Підказка', reset: 'Скинути', newPuzzle: 'Нова головоломка', rules: 'Правила', rulesClose: 'Зрозуміло' } as const;
   export const sizeLabel = (n: number): string => `Поле ${n}×${n}`;
   export const RULES = { heading: 'Правила', items: [ ...three texts ] } as const;
   export const IDLE = 'Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.';
   export const WIN = "Вітаємо, головоломку розв'язано!";   // ASCII apostrophe until slice D
   ```

   Trade-offs: constants over a keyed catalogue (no switch needed); one place to review for NFR-5; `play-page.ts` imports from it and keeps no Cyrillic literal. This is a convention decision that touches the later language switch (FR-55); it is **ADR-worthy when FR-55 is taken up, not now** (no new dependency, no storage, no contract between modules).
7. **The source-scan test (NFR-5).** Like the engine-purity scan (A-21), `tests/ui-strings.test.ts` reads `src/ui/*.ts`, `src/ui/*.css` and `src/main.ts` (not `strings.ts`) and fails on any Cyrillic character, comments included (comments are written in English). `index.html` is outside the scan (its static `<title>` is overwritten at mount by `document.title`).
8. **Document order is built, not styled.** `root.replaceChildren(header, sizeControl, boardHost, buttons, messages, rulesPanel)`. The old order (`h1, select, boardHost, rules, buttons, hint, win`) changes. The select stays a select until change C.

## Data model

No new page state. New DOM only: `header.page-header` (h1 «Бінарка», button), `div.messages` (three `p`), the popover `div`. The `src/ui/strings.ts` constants above. No persistence (TC-12).

## Error handling strategy

The slice adds no input and no failing call: opening and closing the panel is the browser's; the idle line is static. Existing paths (generator failure keeps the previous board) are untouched. No path can raise an uncaught error from this slice.

## jsdom limits (TC-13)

jsdom 29 in this repository has no layout, no popover behaviour (`showPopover`, `popoverTarget` property absent; attributes still round-trip through `getAttribute`), and `HTMLDialogElement.prototype.showModal`, `show` and `close` are absent too (verified). Tests therefore assert attributes and DOM position, and install spies where a method would be called. Visible placement, focus visibility and pixels are the held NFRs and are not claimed.

## Tests that change deliberately (by FR)

- FR-57: in `tests/play-page-rules-and-reset.test.ts` the scenarios «Rules block at mount» and «Rules block survives every board change» are replaced by the «Rules panel» tests (the block no longer follows `[data-board]`; item text ignores `aria-hidden` descendants). The reset tests in that file (FR-58) stay unchanged.
- NFR-5: `collectPageText` in `tests/helpers/play-page.ts` skips text under `aria-hidden="true"`; `tests/play-page-page-text.test.ts` stays as it is otherwise.
- FR-61: `expectPageStructure` gains the header, the idle line and the order check.
- No test of FR-31 to FR-43 changes in this slice.

## Risks and mitigations

- **Hidden duplication of a text** left in `play-page.ts`: the source-scan test fails on any Cyrillic literal.
- **Popover id clash** between two mounts: scenario «Two mounts stay independent».
- **The `:empty` rule fails when a message holds whitespace**: scenario «The hint and win messages are empty at mount» (no child node); a task checks it after hint, new and reset by reading the code path that clears them.
- **Fixed-id popover in the frozen design differs from ours**: only the id; the held pixel check compares rendering, not ids.
- **Baseline text drift**: hand edits at archive are listed below; later changes rebase on the baseline as archived by A.

## Baseline text edits at archive

Archive normally (not `--skip-specs`) and in the SAME commit edit the non-requirement text of `openspec/specs/play-page/spec.md`:

1. **Purpose:** replace "a rules block under the board" with "a «Правила» button in the header that opens a rules popover" and mention the idle line.
2. **Ownership:** "FR-31 to FR-43, FR-57 and FR-58" gains "FR-61 and FR-64"; NFR-5 text covers "header, rules panel, idle line".
3. **DOM contract:** replace the line "Rules block: `[data-section="rules"]`, follows `[data-board]` ..." with the popover panel (outside the sequence, after the message area); "Message regions" gains `[data-message="idle"]`; "Page root" says the header with the heading «Бінарка» is required (FR-61), not optional; the mounting sentence lists the header, the panel and the three messages.
4. **Exclusions:** no change by A.

Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`; grep the baseline for "below the board" and "follows `[data-board]`": no stale sentence may remain.
