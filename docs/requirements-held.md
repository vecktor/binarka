# Бінарка — Held requirements (signed in intent, not yet in force)

Status: signed in intent by the user in chat on 2026-10-05 at about 23:31 ("signed, defaults for all six", autonomy-log row 66), UX decisions 1-30. HELD, not part of `docs/requirements.md`.

Why held: `scripts/check-acceptance-methods.mjs` reads `docs/requirements.md`, and a declared verification method without a mechanism fails the check. A row written here is invisible to that check on purpose. Each row moves into `docs/requirements.md` (by a further signed step, IDs unchanged) only when its mechanism is built and seen failing against today's page. NFR-14 moves last, only after `npm run check:visual` is seen failing. NFR-11 and NFR-15 move only after a `check:vision` script exists (slice H) and is seen failing. Until then every row here is NOT-EARNED, never PASS (BC-6, process honesty).

Meanwhile NFR-7, TC-13 and A-14 stay at their current signed wording in `docs/requirements.md`.

Dependency approval: the user approved `@playwright/test`, `@axe-core/playwright`, `pixelmatch` and `pngjs` as dev dependencies on 2026-10-05 about 23:20 (in chat), effective after the signing; not yet installed. The `check:vision` mechanism needs a script, not a package. Motion that respects `prefers-reduced-motion` is design-only; no row is written for it.

Pending tags are written as `verify: <tag> (pending: …)`. Amendment markers carry the date 2026-10-05.

## Non-functional requirements (held)

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| NFR-11 | MVP | Usability | A violation, a given, a player entry and the hinted cell each differ from the others by a cue that is not colour alone (for example weight, border, shape or marker), so the four states stay distinguishable without colour. The DOM markers behind the cues are FR-32 (`cell-given`), FR-35 to FR-37 (`cell-violation`) and FR-66 (`cell-hinted`). (UX decision 5) (numbered NFR-10 until 2026-10-08) | verify: vision-verify (pending: no `check:vision` mechanism exists; slice H builds the script and it must be seen failing first) |
| NFR-14 | MVP | Usability | PENDING — not declared until `npm run check:visual` is proven runnable and seen failing against today's page. The page matches the frozen reference `design/v0-screenshots/review-set-5/` (78 shots; `SHA1SUMS` of the set 661048f7f4feee6d955511d2cc41478f5de522cd; design commit `736260a`) per shot, each shot scoring at least 0.98 on its own (no page average; threshold set by the user 2026-10-05 about 23:48, autonomy-log row 68); the product is captured under the same conditions as the reference: reduced motion forced, the framed window focused (the dialog's focus ring), the pointer kept off the page, viewport-cropped (never full page), scrollbars hidden, device scale 2, the same machine and fonts. This covers placement of the rules panel (bottom sheet below 48rem, centred panel from 48rem), the idle line visibility, board sizing and the other layout decisions (16, 21 and the rest). Per-shot, not a page average. (UX decisions 25, 30, plus 1, 9, 16, 21 and other layout decisions) (numbered NFR-13 until 2026-10-08) | verify: pixel-diff (pending: mechanism to be built — @playwright/test, pixelmatch, pngjs approved 2026-10-05; still needs `quality/visual-parity.config.json`; `check:visual` must be shown runnable and failing against today's page before this NFR is declared) |
| NFR-15 | MVP | Usability | The logo is legible at 40 px: the four digits of the 2×2 mini board «1 0 / 0 1» can be told apart at 40×40 CSS px, and the logo carries no text. (UX decision 10) (numbered NFR-14 until 2026-10-08) | verify: vision-verify (pending: no `check:vision` mechanism exists; slice H builds the script and it must be seen failing first) |

Notes on the held NFRs:

- NFR-10, NFR-12: not local-verifiable (jsdom has no layout). Sampled checks; coverage is `sampled`, not continuum. NFR-10 samples one viewport in three states (default, hint, win). NFR-12 samples the viewports 320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900, 1280×420, 844×390.
- NFR-11: perception of a cue is a rendering fact. The DOM-assertable half is already in FR-32, FR-35 to FR-37 and FR-66. Optional second tag once the visual check is built: pixel-diff against `review-set-5` (via NFR-14).
- NFR-13: the structural half (cells are buttons with labels, FR-69 and FR-70; the radiogroup, FR-43) is local-verifiable in those rows. Contrast of the warm dark theme (decision 17) falls under this check.
- NFR-14: today `npm run check:visual` exits 1 (no config; Playwright, pixelmatch, pngjs not installed). Sampling declaration: 7 pages × 5 viewports × 2 themes + 3 extra viewports + the logo at 40, 56, 64 px; coverage is `sampled`. The escalation path (finer sweep) is named when the check is set up. It also carries the placement and visibility parts left out of FR-57, FR-68, FR-71 and FR-72.
- NFR-15: fallback if the mini board fails at 40 px: the digits "01" as shapes (decision 10). Review set 5 has a 40 px logo capture.
- NFR-7: until each mechanism exists, the NFRs it carries (NFR-10 to NFR-15) stay held (never silently dropped, BC-6).
- **Note (2026-10-09, difficulty amendment signed in chat at about 12:27, autonomy-log row 86; no row text changed, no row moved):**
  - NFR-10: the level control and its description line (FR-87, FR-89) add height; the 375×812 sampled check may no longer pass and must include the level control when it is built.
  - NFR-12: the four level buttons and the disabled 4×4 ones (FR-91) must meet the 44×44 floor; four buttons with «Головоломка» and «Мозколамка» on a 320 px viewport may not fit on one row.
  - NFR-13: the focus and axe check extends to the level radiogroup.
  - NFR-14: OPEN CONFLICT with the frozen reference `design/v0-screenshots/review-set-5/` (no level control, no techniques section; every shot with the page body differs). Decision Q3: the user updates the design reference before the page slice (DL2) starts; the engine slice (DL1) does not wait. NFR-14 stays pending (not declared), so nothing fails today.
- **Note (2026-10-09, setup sheet amendment signed in chat at about 14:09, autonomy-log rows 90 and 92; no row text changed, no row moved):** the two always-visible pickers are replaced by a summary button and a setup sheet (FR-95 to FR-99; structure A at every form factor, wireframe `design/wireframes/setup-controls-2026-10-09/`). This supersedes the layout notes above.
  - NFR-10: the page body loses the two pickers and gains one 44 px summary button, so the board space returns; likely satisfied again with the original ~51.5 px cells. Not a claim: the sampled check does not exist; re-sample after the sheet design.
  - NFR-12: the 44×44 floor now covers the summary button, the three size buttons, the four level buttons (taller, with descriptions that may wrap at 320 px), the unavailable 4×4 level buttons and the close button «Закрити».
  - NFR-13: the focus and axe states gain "setup sheet open" (and open at 4×4); focus return to the summary button is included.
  - NFR-14: conflict persists and grows. `review-set-6` is an intermediate set (row 89) with the two pickers on the page, not a reference. The designer makes the visual design of structure A (summary button; sheet as bottom sheet on the phone and centred panel on tablet and desktop; level options with descriptions; the 4×4 state with the reason and a non-colour cue; light and dark; focus rings), reviewed by a fresh design-reviewer; then the user names the reference set in chat. NFR-14 stays pending and not declared.

## Constraints (held)

| ID | Phase | Description |
|---|---|---|

Note: TC-13 describes the intended end state; until each Playwright check is built and seen failing, the NFRs it carries are held, not PASS.

## Assumptions (held)

