# Design: update-setup-sheet-start

Slice S of the combined amendment signed on 2026-10-10 (autonomy-log rows 114, 116 to 119). Draft and dispositions: `docs/handoff/setup-sheet-start-amendment-draft-2026-10-09.md`. The sibling folders `add-theme-switch` and `add-english-version` are archived after this one and copy this folder's result (merge rule: this folder's text first, their sentences appended).

## Goals

- A size or level press marks; «Почати» makes one puzzle with both; closing without it changes nothing (FR-43, FR-73, FR-87 to FR-92, FR-95 to FR-101).
- Every behaviour has a scenario that a tester can decide from the DOM, the stubs (A-44) or the existing Playwright mechanisms (NFR-12, NFR-13).
- No new dependency, no storage (TC-12), no change to `src/engine/`.

## Non-goals

- Layout and look: the drawing of the footer, the primary fill, the taller sheet's inner scroll, the desktop rules panel (signed R3, row 120: one column of about 40rem, height fits the content, no `min-height`; design only, no FR) (held NFR-14, NFR-10; design round). The pixel reference is NOT moved by this slice (autonomy-log row 119); the slice is built against the new review set once the design-reviewer's confirming run has no blocking finding.
- The theme and language controls (the two later folders), an error text for a failed generation (A-38), arrow keys (A-24).
- Authentication: none exists, so no redirect-to-login or forbidden case applies. Every mutation is a click on a fixed button; no free value, so no inline validation message and no raw 500 can occur.

## Key decisions

1. **The marked choice lives in page state, not in the DOM (A-46; ASSUMPTION ratified by the signature).** `markedSize` and `markedLevel` sit beside `size` and `level`. `aria-checked` always renders the marked choice; the marked choice equals the board shown whenever the sheet is closed, because it is reset (a) on the sheet's closing `toggle`, (b) by the press of «Почати» (before the sheet closes), (c) after every shown board, and (d) on the sheet's opening `toggle` too: browsers coalesce a quick close and reopen into one `toggle` with `newState: 'open'`, so (a) alone could leave an old mark, while FR-100 says each opening shows the board shown (review-gate fix round, 2026-10-10). In jsdom the stubbed `showPopover()` fires no event, so the tests dispatch the opening `toggle` themselves. Trade-off: one more piece of state and one reset rule; the alternative of reading the checked button back from the DOM was rejected (A-46).
2. **«Почати» is the only way the sheet creates a puzzle (FR-101).** The pending action of FR-67 becomes the pair `(size, level)` marked at the press. The single generation path `newPuzzle(size, level)` with the 3-seed retry of FR-88 is unchanged; «Нова головоломка» still reads the board shown, never the marked choice. Trade-off: «Почати» with an unchanged choice makes a new puzzle (Q2) instead of closing quietly; one label never hides two behaviours.
3. **Close routes, one rule.** «Закрити», Escape and light dismiss are native; the page reacts only to the `toggle` event with `newState: 'closed'` (the existing listener, no new listener type, no key handler, FR-59). The two guards of the baseline stay (dialog open; focus already on an element outside the sheet). A cancelled confirmation drops the pending action and does not reopen the sheet (A-45).
4. **The reading rule replaces the rewrite of 15 unmodified scenarios.** «Setup sheet» now says that "chooses" (and, in requirements this change does not modify, "presses/selects/changes the size to N" followed by an effect) means a **choice** (mark, «Почати», `[data-confirm="yes"]` where the scenario confirms), and that `aria-checked` read after a choice is read with the sheet closed. In the modified blocks "chooses" is the only choice verb and every literal press is written "marks" or "(a marking press)". Trade-off: shorter delta, but a test author must apply the rule; the 15 scenarios are listed under "Scenarios governed by the reading rule" so none is missed.
5. **Names that no longer describe their body are kept so the archive matches** (precedent: `add-level-selector`): «Pressing the shown size changes nothing» (now: a press only marks), «A level change follows the confirmation rule» (now: «Почати» asks), «Choosing and closing the sheet» (now: marking and closing). Later folders keep them too.
6. **MODIFIED, not REMOVED plus ADDED.** A REMOVED requirement would break a later `MODIFIED` of the same name and loses the scenario history. The two requirements whose behaviour is replaced keep their name and every old scenario is rewritten or listed.
7. **FR-65 and the token count are loosened, not pinned.** «The summary and level buttons set their own colours» no longer says "stay exactly 13": the 13 baseline names stay declared and a token that the signed design adds for «Почати» is declared once in `:root` and contrast-checked. «Borders, cues and focus rings…» still checks each listed name, so a 14th token breaks nothing.
8. **Spec-made proxies, to confirm against `review-set-13`** (task 1.4): the hook `[data-action="setup-start"]` (the draft proposes it), the 44 px `min-height` declaration for «Почати», the summary button and «Закрити» (mirrors «Action buttons meet the touch-target floor»). The DOM order is signed by the wireframe: size, level, «Почати», «Закрити», all direct children of the sheet; Footer-1 is CSS on two siblings, no wrapper, so FR-96's child list stays. The sheet adds no id (A-41 changes only in `add-theme-switch`, which adds the settings panel's).

None of these is ADR-worthy: no dependency, no storage, no new module contract.

## Placeholders of TD-Q15: completed by the signed wireframe, one item left to the review set

The user signed the wireframe `design/wireframes/sheet-start-theme-language-2026-10-10/` on 2026-10-10 (autonomy-log row 120); under TD-Q15 that signature completes the design-dependent text, logged, no re-sign. The visual result is `review-set-13` (designer phase 2, being built; a fresh design-reviewer, two iterations); implementing agents never edit `design/`.

- **COMPLETED, the footer (SD-Q10):** Footer-1. «Почати» primary and «Закрити» secondary share one sticky footer row, «Почати» first (DOM order and Tab order), both direct children of the sheet, no wrapper. «Start button», «Setup sheet» and «The start button and the sheet buttons meet the touch-target floor» say so; the drawing (widths, fill, stickiness) is visual specifics and stays out of the requirements (held NFR-14).
- **COMPLETED, the desktop rules panel (SD part 2, R3):** one column of about 40rem, height fits the content, no rules-only `min-height`, spacing tightened to fit 1366×650 with no inner scroll (scrolls only if that proves impossible). Design only, no FR; FR-57 and FR-93 are unchanged.
- **OPEN, left to `review-set-13`: a primary colour token.** «The summary and level buttons set their own colours» requires that «Почати» sets its own `color` and `background-color` from tokens with 4.5:1 and allows one new token. If the set adds a token, it is declared once in `:root`; `add-theme-switch` gives it a dark value (its FR-65 block says "13 today, 14 if…") and the completing text is written into this delta before the colour tests are written (task 1.3).
- **Observed, no requirement:** the sheet's inner scroll with the extra 44 px button (4×4 at 1366×650, 600 to 722 px, 6×6 at 320×700); the designer re-measures and reports.

## Data model

No stored state (TC-12, FR-100). Page state in `mountPlayPage`: `size`, `level` (the board shown), `markedSize`, `markedLevel`, `pending` (none, or the action that performs the change; for «Почати» it captures the marked pair `{ size, level }` at the press, review-gate fix round), next to `board`, `givens`, `hinted`. Derived on every mark and every shown board: the summary text (board shown), `aria-checked` (marked), `aria-disabled` of levels 2 to 4 (true exactly when `markedSize === 4`), the reason line's `hidden` and text. `src/ui/strings.ts` gains the «Почати» label. New DOM: one button; ids stay four per mount (A-41).

## Error handling strategy

- Generator run-out: retried up to 3 seeds per «Почати» (FR-88); other errors and a wrong-size result keep everything at once. In every failure the sheet is already closed, `aria-checked` shows the board shown, focus is on the summary button, no text appears (A-38; the quality-bar "inline error" does not apply: nothing is typed).
- Marking presses, an unavailable-level press, a cancelled confirmation and a dropped pending action take no seed and call no generator.
- No board shown (mount failed): the sheet opens on 6×6 · Розминка and «Почати» generates at once; nothing can be confirmed.
- A late `toggle` never steals focus from the dialog, the rules panel or a control the player clicked (the baseline guards).

## Tests that change deliberately (by FR)

Found by the draft's grep of `tests/` for `chooseSize|chooseLevel|selectSize|selectLevel|setup|data-control|radio`; the implementer re-greps (task 1.2) and confirms line by line. A test with no changed scenario behind it does not change; no test is weakened; each change is listed with its source in the red commit.

| File | What pins the old behaviour | Source |
|---|---|---|
| `tests/play-page-setup-sheet.test.ts` | choose closes the sheet and moves focus; the shown size or level closes it; 4×4 press; Escape, close, `toggle` | FR-97, FR-73, FR-100, FR-101 |
| `tests/helpers/play-page.ts` | the choose helpers press once and expect a new puzzle: keep the names for "choose and start" (mark, «Почати», confirm), add mark-only helpers | FR-43, FR-88, FR-101 |
| `tests/play-page-size-selector.test.ts`, `tests/play-page-size-control.test.ts` | a press starts a puzzle; `aria-checked` equals the shown size; FR-73 no-op | FR-43, FR-73 |
| `tests/play-page-level-control.test.ts`, `tests/play-page-level-4x4.test.ts`, `tests/play-page-level-interplay.test.ts` | immediate level change, 4×4 lock, seeds and `generate` calls per press | FR-88, FR-91, FR-92 |
| `tests/play-page-level-seed.test.ts`, `tests/play-page-retry.test.ts`, `tests/play-page-new-puzzle-and-seed.test.ts` | seed and retry counts per press (now per «Почати»; marks take none) | FR-88, FR-101, A-38 |
| `tests/play-page-confirm.test.ts` | confirmation raised by a size or level press | FR-67, FR-98 |
| `tests/play-page-semantics.test.ts`, `tests/play-page-wcag.test.ts` | button count 52 to 53, ids stay four, `aria-checked` meaning | NFR-9, FR-96, FR-100 |
| `tests/play-page-layout.test.ts` | sheet content order, tab order inside the sheet | FR-96, FR-59 |
| `tests/play-page-stylesheet.test.ts`, `tests/play-page-level-stylesheet.test.ts`, `tests/play-page-action-buttons-stylesheet.test.ts` | button lists for colours, focus, 44 px | FR-65, NFR-12 |
| `tests/play-page-helpers.test.ts` | the helpers' own tests (the choose helpers press once and expect a new puzzle; the popover stub) | FR-43, FR-88, FR-101, A-44 |
| `tests/play-page-controls-text.test.ts`, `tests/play-page-page-text.test.ts`, `tests/ui-strings.test.ts` | visible control texts, the language scan, the entries of `strings.ts` (adds «Почати») | NFR-5, FR-94 |
| `tests/play-page-hinted-cell.test.ts`, `-techniques`, `-level-hint`, `-rules-and-reset`, `-logo`, `-highlighting`, `-cells`, `-rendering`, `-keyboard` | use the choose helpers only: helper updates, no scenario change expected | FR-66 (check) |
| `e2e/helpers.ts`, `e2e/nfr-12-targets.spec.ts`, `e2e/nfr-13-a11y.spec.ts` | the choose helper presses once and expects a change; the sheet measurement gains «Почати»; the sweep gains the marked state | NFR-12, NFR-13 |

### Scenarios governed by the reading rule (unmodified requirements, text kept)

«Board rendering and default size» (Board follows the chosen size); «Highlight a line with too many of one digit» (Too many zeros in a row of an 8x8 board); «New puzzle button» (New puzzle keeps the chosen size; New puzzle keeps the chosen level); «Ukrainian page text» (Accessible names at every size); «Reset button» (Reset keeps the level); «Rules panel» (The panel survives every board change); «Page document order» (The order and the message area survive every board change); «Cells expose a Ukrainian name and their state» (A new board has fresh names); «The hint and win messages are status regions» (The same elements carry every message); «The board is a labelled group of cell buttons» (The group name follows the size; A failed size change keeps the board and its name); «Level option content» (The description does not move with a pending press); «The page hint uses all four techniques» (The same board gives the same hint at every level); «Logo» (The logo survives every board change). Each reads "presses/selects/changes" a size or level and then checks an effect, so each means a choice; none depends on the old immediate press or on a shown-size no-op. The implementer confirms each against the helper change (task 1.2).

## Risks and mitigations

- **jsdom has no popover** (A-44): native open, light dismiss and focus restoration are covered by the stubs and the browser check only; nothing is claimed in jsdom beyond the dispatched `toggle`.
- **Tests that read `aria-checked` as the board shown** (A-47): they read the summary or the board's `aria-label`, or read with the sheet closed. A deliberate change of meaning, not a regression.
- **The extra 44 px button may bring back inner scroll** (design): the browser check observes at 375 and 320 px and 1366×650; held NFR-10 and NFR-14 stay NOT-EARNED.
- **The reading rule hides 15 scenarios**: listed above; tasks 1.2 and 2.3 check each.
- **The pending action and the late `toggle` race** (focus stolen after `hidePopover()` then `showModal()`): the baseline guards stay; the scenarios of "Choosing and closing the sheet" cover the late event; the real-browser check covers Escape.

## Ambiguities in the draft and the reading chosen

- Draft FR-66 says "a size change" becomes "«Почати»" in the removing list, but «Нова головоломка» is already there: the composed list names each path once.
- Draft NFR-12 says the probe "already measures" the summary button and «Закрити»: the delta adds «Почати» to the sheet measurement only and does not claim a change for the other two.
- Draft FR-100 says the marked choice "return[s] to that after a failure" for the no-board case: read as "a failed «Почати» leaves the sheet opening on 6×6 · Розминка again".

## Baseline text edits at archive

Archive normally (not `--skip-specs`) and in the SAME commit edit the non-requirement text of `openspec/specs/play-page/spec.md`, found again by text:

1. **Purpose:** the summary opens a setup sheet with a size control, a level control and «Почати»; choices are marked and started by «Почати».
2. **Ownership paragraph:** add FR-100 and FR-101; FR-87 to FR-101; add FR-43, FR-59, FR-65 to FR-67, FR-73, FR-87, FR-88, FR-90 to FR-92, FR-94 to FR-99 to the amended list; NFR-9 extended to «Почати» and the marked state.
3. **DOM contract:** the seed-source bullet ("each performed press of «Почати»", not "size change and level change"); the «Size control», «Level control» and «Setup sheet» bullets (`aria-checked` is the marked state while the sheet is open; the sheet holds the start button `[data-action="setup-start"]`; a test opens the sheet by `showPopover()`, marks, then presses «Почати»); a new «Start button» bullet.
4. **Exclusions:** the size and level choice and the marked choice are not remembered (TC-12); «Почати» is never a no-op (FR-101); the last Exclusions bullet "on a size change any generator error keeps the previous board" says «Почати» instead of "a size change".
5. **DOM contract, mount bullet** (baseline l. 18): "the setup sheet (with the size control and the level control)" gains "the start button".

Before archive confirm that no baseline requirement already carries one of the four ADDED names (`grep -n "### Requirement: \(Marked choice\|Start button\|The start button\|The accessibility sweep\)" openspec/specs/play-page/spec.md`) and rebase the 21 MODIFIED blocks on the baseline as it is then (`git diff 1b9716d -- openspec/specs/play-page/spec.md`). Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`.

## Audit findings: disposition

Fresh audit of 2026-10-10 (autonomy-log row 121). Each cited line was checked against the files before folding.

- S1 (major, no scenario for a failed «Почати» with no board shown): folded. New scenario «With no board shown a failed «Почати» leaves the mount values» in «Start button».
- S2 (major, "presses" read two ways): folded. «chooses» is the only choice verb in the modified blocks (the reading rule in «Setup sheet» says so and lists the retained verbs for unmodified requirements); every literal press is «marks» or «(a marking press)»; about 35 scenario lines were rewritten, none dropped.
- S3 (major, «Violations in the givens…»): folded ("chooses «Поле 8×8» (marks it, then presses «Почати») and presses nothing else").
- S4 (major, NFR-13 Tab-sweep list): folded in `tasks.md` 2.4 (`'setup-start'` in the `expected` list of `e2e/nfr-13-a11y.spec.ts`, the marked state added to STATES by clicks through a mark-only e2e helper, `chooseSize`/`chooseLevel` stay mark plus «Почати» for the 4x4 state); the "outline width at least 2px" assertion is dropped from the scenario because the stylesheet test of FR-65 pins it.
- S5 (NFR-12 overclaim): folded. The body and the scenario say «Почати» at both sizes, the summary button and «Закрити» as the probe already measures them; `tasks.md` 2.4 adds `setup-start` to the 6×6 and the 4×4 sheet measurement.
- S6 (drawing sentence at SHALL level without a scenario): folded. «Start button» now says only that both buttons stay direct children and that the drawing is layout (held NFR-14); the Footer-1 clause of «Setup sheet» is cut to "the footer drawing".
- S7: folded (15 governed scenarios, not 14; the carried text "wording to confirm with the user in chat … Q6 … task 1.4" in «Only the first level exists at 4x4» now says "signed wording, autonomy-log row 101" and "confirmed against the signed review set in task 1.4 of this change"; "Q2 of the signed amendment" is "SD-Q2").
- S8: folded in "Baseline text edits at archive" (Exclusions bullet, the Purpose sentence).
- S9: folded (`tests/play-page-helpers.test.ts` in the table).
- S10: folded in `tasks.md` (restore `docs/qa/e2e-report.json` and `a11y-report.json` after the red and green Playwright runs; red-commit and green-commit steps; the autonomy-log row at hand-off; an optional mutation check of the new stylesheet tests; 1.3 and section 2 no longer contradict; the garbled "add `PAGE_ORDER` nothing new" is gone; the mark helpers call `showPopover()` only while the stub is closed, because `pressSizeButton` and `pressLevelButton` call `openSheet()` on every press (`tests/helpers/play-page.ts` l. 694, 896)).
- S11: folded in the browser check 6.1 (Escape in the dialog, light dismiss by a click on «Підказка» and «Правила», «Почати» by Enter and Space).
- S12: folded. «Marked choice» keeps the mechanism (the closing `toggle` event) only as a "Test contract" sentence.
