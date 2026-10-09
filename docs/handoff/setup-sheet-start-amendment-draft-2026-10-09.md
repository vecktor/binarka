# Requirements amendment draft: setup sheet "select, then «Почати»" (2026-10-09)

Status: UNSIGNED. Waits for the user's signature in chat ("signed, use defaults" takes every default in section 5). Nothing in `docs/requirements.md`, `openspec/`, `design/`, `src/` or `tests/` has been changed by this draft.

Basis:

- The user's decision in chat on 2026-10-09 at about 22:33 (UTC+5:30), autonomy-log row 114, after testing the page: today a press on a size or level button in the setup sheet starts a puzzle at once and closes the sheet (FR-97(a)), and a size change keeps the earlier level where it applies (FR-92), so size and level cannot be chosen together. The user finds this not intuitive and chose **"Select, then «Почати»"**, done after the NFR-12 slice and before G2.
- The decision, in the user's terms: size and level presses only mark a pending choice inside the sheet (`aria-checked` moves, the sheet stays open, no puzzle, no seed, no confirmation). One button «Почати» makes ONE new puzzle with the pending size and level (one confirmation if the board has player entries: FR-67, FR-90, FR-98). Closing the sheet without «Почати» (Закрити, Escape, light dismiss) discards the pending choice; the next opening shows the size and level of the board shown. 4×4 still offers only «Розминка» (FR-91, A-34).
- Nothing in this file goes beyond that decision except where marked Q (open question, with a default) or ASSUMPTION.
- Kept as signed: the summary button and sheet structure (FR-95, FR-96, row 92), the level names and descriptions (FR-89), the page retry on a run-out (FR-88, A-38), the 100 attempt bound (FR-84), the summary format (FR-95), the close button (FR-97(e)), the ids rule (A-41).

Ids: checked by grep in `docs/requirements.md` and `docs/requirements-held.md`. Highest in use: FR-99, NFR-17, A-44, TC-14, BC-8. Next free: **FR-100**, **NFR-18**, **A-45**. New rows below: FR-100, FR-101, A-45 to A-47. No NFR, TC or BC row is added. No id is renumbered (BC-7).

Names proposed by this draft (confirm against the design): start button `[data-action="setup-start"]`. Existing hooks stay: `[data-action="setup"]`, `[data-section="setup"]`, `[data-action="setup-close"]`, `[data-control="size"]`, `[data-control="level"]`, `[data-level-reason]`. No new id and no new attribute that needs an id (A-41 unchanged: four ids per mount).

Part 2 of row 114 (wider, taller rules panel on desktop) is a design note, section 7. It is not a requirement.

## 1. Amended rows (existing id, new text)

"Board shown" below means the board in the page: its size and level are in the summary (FR-95) and in the board's `aria-label`. "Pending choice" means the size and level marked in the sheet and not yet started (FR-100).

| ID | Phase | Area | Proposed text | Verification |
|---|---|---|---|---|
| FR-43 | MVP | Play page | Structure unchanged (radiogroup «Розмір поля», three `button[role=radio]` «Поле 4×4», «Поле 6×6», «Поле 8×8», inside the sheet). **Behaviour replaced:** one press of a size button **marks that size as pending** (FR-100); it starts no puzzle, takes no seed, asks for no confirmation and does not close the sheet. The new puzzle of the pending size is started only by «Почати» (FR-101), after confirmation when the board has player entries (FR-67). `aria-checked="true"` is on the **pending** size while the sheet is open; when the sheet is closed it is on the size of the board shown (FR-100). 6×6 is selected at start. The choice is not remembered on reload (TC-12). If the generator fails after «Почати», the previous board, messages, size and level are kept (FR-88, FR-101). (amended) | verify: local-verifiable |
| FR-59 | MVP | Play page | The one exception to "showing a board never moves the focus" becomes: **«Почати» and the close button return focus to the summary button (FR-97, FR-101)**; a size or level press moves no focus (it stays on the pressed button). Everything else unchanged: no key handler, no `tabindex`. (amended) | verify: local-verifiable |
| FR-65 | MVP | Play page | The list of page buttons that show a `:focus-visible` indicator gains **«Почати»**; «Почати» sets its own `color` and `background-color` from the existing tokens, like the summary and level buttons. Nothing else changes. (amended: button list) | verify: local-verifiable |
| FR-66 | MVP | Play page | The list of non-removing actions gains «marking a size or level in the setup sheet» (next to «opening or closing the setup sheet»). The phrase «pressing the already selected size (FR-73)» stays valid. (amended: one phrase) | verify: local-verifiable |
| FR-67 | MVP | Play page | The sentence on the sheet becomes: **«Нова головоломка», «Почати» and «Скинути» ask for confirmation only when the board has player entries; a change of size or level is no longer an action of its own, it happens only through «Почати» (FR-101). When «Почати» needs the confirmation, the sheet is closed first and then the dialog opens (FR-98).** The first sentence's list «a change to another size or to another level» is replaced by ««Почати»». The text, buttons, Escape and no-seed-on-cancel rules are unchanged. (amended) | verify: local-verifiable |
| FR-73 | MVP | Play page | **Replaced.** A press on a size or level button, whether it is the one shown, the pending one or another, changes **only the pending choice** (FR-100): no dialog, no new puzzle, no seed taken, no generator call, and the board, the messages, the highlights, `cell-hinted` and the summary are unchanged. A press on the button that is already pending changes nothing at all. None of these presses closes the sheet or moves the focus. A press on a level that is unavailable at the pending size (FR-91) does nothing at all. Pressing «Почати» when the pending choice equals the board shown is **not** a no-op: see FR-101 (Q2). (Replaces the "no-op that closes the sheet" of row 92.) (amended) | verify: local-verifiable |
| FR-87 | MVP | Play page | One sentence changed: `aria-checked="true"` is on the **pending** level while the sheet is open, and on the level shown when the sheet is closed (FR-100). Structure, names, order and descriptions unchanged. (amended) | verify: local-verifiable |
| FR-88 | MVP | Play page | «Розминка» is selected at start; the choice is not remembered on reload (TC-12). **A press of a level button only marks it as pending (FR-100).** The page starts a new puzzle of the pending size and level only on «Почати» (FR-101) and clears the messages and the hinted-cell marker. The page retry on a run-out (at most 3 seeds for one «Почати», the first success is shown) is unchanged. If all 3 run out, or the generator fails in any other way, the previous board, messages, size and level are kept, `aria-checked` returns to the board shown, and the sheet is closed with focus on the summary button (FR-101). The same retry applies to «Нова головоломка» and the mount. The CLI with an explicit `--seed` keeps its run-out error (FR-86). (amended) | verify: local-verifiable |
| FR-90 | MVP | Play page | **Replaced.** «Почати» asks for confirmation under FR-67 when the board has player entries, and acts at once otherwise, whatever the pending choice (Q2). Until «Так, почати», and after «Скасувати», the level, the size, the board and every message stay unchanged and no seed is taken; the pending choice is discarded (FR-98). Marking a level asks for nothing. (amended: was «A change to another level asks for confirmation …») | verify: local-verifiable |
| FR-91 | MVP | Play page | The 4×4 rule now follows the **pending size**. While the pending size is 4×4, the sheet shows «Розминка» checked (pending), levels 2 to 4 with `aria-disabled="true"` (focusable, readable, as FR-69), the reason line `[data-level-reason]` and the non-colour cue; pressing an unavailable level does nothing (FR-73). Marking 4×4 **sets the pending level to «Розминка»** (Q1). Marking 6×6 or 8×8 afterwards removes `aria-disabled` and the reason and **keeps «Розминка» as the pending level**; it does not restore an earlier pending level. Wording of the reason, the cue and the placement unchanged. (amended) | verify: local-verifiable |
| FR-92 | MVP | Play page | **Replaced** (it described immediate changes). Size and level interplay: «Нова головоломка» and «Скинути» keep the size and the level of the board shown (FR-42, FR-58). In the sheet, marking a size 6 or 8 keeps the pending level; marking 4 sets the pending level to 1 (FR-91). Size and level can be marked in either order and in any number of presses; **one «Почати» makes one new puzzle with both** (FR-101), one seed (a retry only after a run-out, FR-88), and one confirmation when the board has entries. (amended) | verify: local-verifiable |
| FR-94 | MVP | Play page | The list of strings in `src/ui/strings.ts` gains the label of «Почати». Rule unchanged. (amended: list only) | verify: local-verifiable |
| FR-95 | MVP | Play page | One sentence added: **the summary shows the board shown, never the pending choice.** Marking a size or level changes the summary not at all; it changes after a shown board and after nothing else. Rest unchanged. (amended) | verify: local-verifiable |
| FR-96 | MVP | Play page | The "holds, in order" list becomes: the size radiogroup, the level radiogroup with the reason line, **the start button `[data-action="setup-start"]` «Почати» (FR-101)**, and the close button `[data-action="setup-close"]` (FR-97) (Q3). The sheet is still `popover`, `role="dialog"`, `aria-label` «Поле і складність», with no new id. (amended) | verify: local-verifiable |
| FR-97 | MVP | Play page | **Replaced. Marking and closing.** (a) A press on an available size or level button marks the pending choice (FR-100) and **leaves the sheet open, the focus on the pressed button, the board and the summary unchanged**. (b) A press on an unavailable level does nothing. (c) «Почати» acts as FR-101 says, closes the sheet and moves focus to the summary button. (d) Escape, a click outside the sheet (the `popover="auto"` light dismiss) and the close button close the sheet **without any change** to board, size, level, messages, marker or summary, **discard the pending choice** (FR-100), and the focus ends on the summary button (a light dismiss by a click on another control leaves the focus on that control, as the spec rule of 2026-10-09 says). (e) The close button is labelled «Закрити», `popovertargetaction="hide"`, 44 px, reachable by Tab inside the sheet. The page adds no key handler (FR-59; Escape is native). (amended) | verify: local-verifiable |
| FR-98 | MVP | Play page | **Sheet and confirmation.** When «Почати» needs the confirmation (FR-67), the page closes the sheet first and then opens `[data-dialog="confirm"]` with `showModal()`; the sheet and the dialog are never open together. «Скасувати» (and Escape) closes the dialog, leaves everything unchanged, **discards the pending choice**, returns focus to the summary button; the sheet does not reopen. «Так, почати» closes the dialog, performs the change with the pending size and level held at the press of «Почати», updates the summary and puts focus on the summary button. (amended: trigger is «Почати»; pending discarded on cancel) | verify: local-verifiable |
| FR-99 | MVP | Play page | Text unchanged. Note: `aria-checked` on a level button is the pending state while the sheet is open (FR-100); the accessible name rule does not change. (note only) | verify: local-verifiable |
| FR-44 | MVP | Play page | Pointer «FR-87 to FR-99» becomes «FR-87 to FR-101». (amended pointer) | verify: local-verifiable |
| NFR-5 | MVP | Localization | Scope gains the «Почати» label (Cyrillic, no Latin letters, `aria-label` included if any). (amended) | verify: local-verifiable |
| NFR-9 | MVP | Accessibility | Scope gains: «Почати» (name, keyboard operation, focus return), `aria-checked` as the pending state in the radiogroups, and the discard on Escape and light dismiss. Checked in jsdom with popover stubs (A-44); the real-browser check is NFR-13. (amended) | verify: local-verifiable |
| NFR-12 | MVP | Usability | The list of controls at least 44×44 CSS px gains «Почати» (and, as the row already implies for "all controls", the summary button and «Закрити»). The e2e probe (`e2e/nfr-12-targets.spec.ts`) gains the sheet open at 6×6 and 4×4. Sampled, as the row says. (amended: list) | verify: e2e (existing mechanism) |
| NFR-13 | MVP | Usability | The state list for the a11y sweep gains "sheet open with a pending choice that differs from the board" (the state this amendment creates). Sampled, as the row says. (amended: state list) | verify: a11y (existing mechanism) |

Unchanged: FR-42, FR-57, FR-58, FR-62, FR-63, FR-68, FR-84, FR-86, FR-89, FR-93, NFR-1 to NFR-4, NFR-10, NFR-16, NFR-17.

## 2. New functional requirements

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| FR-100 | MVP | Play page | **Pending choice.** The sheet holds a pending size and a pending level. Each time the sheet opens, they equal the size and level of the board shown. A press on an available size or level button sets the pending size or level and moves `aria-checked` in that group; nothing else (FR-73). Marking 4×4 sets the pending level to «Розминка» (FR-91). When the sheet closes by any route (Escape, light dismiss, «Закрити», «Почати», the confirmation dialog opening), the pending choice is discarded and `aria-checked` returns to the board shown in both groups; the next opening shows the board shown (Q1, Q6). The pending choice is kept in the page's state, not in the DOM alone, and is never written to storage (TC-12). | verify: local-verifiable |
| FR-101 | MVP | Play page | **«Почати».** The sheet holds a button `[data-action="setup-start"]`, `type="button"`, with the visible text «Почати» and no `aria-label` (Q3). It is always present and always available (Q2): a press starts **one** new puzzle of the pending size and level, with one seed (a retry only after a run-out, FR-88), clears the messages and the hinted-cell marker, updates the summary, closes the sheet and moves focus to the summary button. When the board has player entries the page first closes the sheet and asks for the confirmation (FR-67, FR-98). If the generator fails (FR-88), the previous board, messages, size, level and summary are kept, the sheet is closed and focus goes to the summary button. When no board is shown (the generation at mount failed), «Почати» generates at once. Its height is 44 CSS px (layout, NFR-12). | verify: local-verifiable |

## 3. Assumptions and notes (new)

- **A-45:** this amendment replaces row 92's "a press starts a puzzle at once" (FR-97(a)) and the immediate size/level changes of FR-43, FR-88, FR-90 and FR-92, by the user's decision in chat (row 114). The summary, sheet, descriptions, retry and ids rules of rows 86 to 92 stay. **ASSUMPTION: the user's "closing without «Почати» changes nothing" also covers the confirmation dialog being cancelled: the pending choice is discarded and the sheet does not reopen (FR-98 already says the sheet does not reopen). The human ratifies.**
- **A-46:** the pending choice lives only while the sheet is open. The page needs a way to learn that the sheet closed; it already listens to the `toggle` event of the sheet (spec, «Choosing and closing the sheet»), so no new listener type and no key handler (FR-59). jsdom has no `popover`, so tests drive it with the stubbed `toggle` event (A-44).
- **A-47:** `aria-checked` was "the board shown"; now it is "the pending choice while the sheet is open". Tests that read `aria-checked` to learn the board shown must read the summary or the board's `aria-label` instead, or read it with the sheet closed. This is a deliberate change of meaning, not a regression.
- FR-69 style (`aria-disabled`) stays for the unavailable levels, now by the pending size.
- A-34 (4×4 offers only level 1) is unchanged; only the moment it applies moves from "board shown" to "pending size".
- Escape in the confirmation dialog and in the sheet stays native (FR-59).

## 4. Where a real choice was made (the user's questions, one line each)

| # | Question | Default taken if "signed, use defaults" |
|---|---|---|
| Q1 | What does marking 4×4 do to a pending level 2 to 4? | The pending level becomes «Розминка»; levels 2 to 4 show `aria-disabled`; marking 6×6 or 8×8 again keeps «Розминка» (does not restore the earlier pending level). Same as today's rule "the page does not restore the earlier level" (spec, «Size and level interplay»). Alternative: remember the earlier level while the sheet is open and restore it on 6×6/8×8. Not chosen: more state, and the user's decision text does not ask for it. |
| Q2 | Is «Почати» present and available when the pending choice equals the board shown? | Always present, never disabled. A press makes one new puzzle of that size and level, exactly like «Нова головоломка» (same seed rule, same confirmation when there are entries). Why: FR-73 is about the size and level buttons, and those are now mark-only, so FR-73 does not apply to «Почати»; the user said «Почати» "makes ONE new puzzle"; a dead or hidden button would break the no-board-shown path (mount failure) and give no reason for the press. Alternative: unchanged choice closes the sheet with no change (a "no-op like FR-73"). Not chosen: a button labelled «Почати» that starts nothing surprises the player; and with an unchanged choice there would be two behaviours behind one label. |
| Q3 | Label, place, size, focus? | Label «Почати» (visible text only, no `aria-label`, string in `src/ui/strings.ts`, FR-94). Place: after the level control (and reason line), **before** «Закрити»; «Закрити» is kept, because the sheet must still be closable without choosing (FR-97(d), (e)). Both 44 px high (NFR-12). Focus after «Почати»: the summary button, also after the confirmation ends and after a failed generation (FR-97, FR-98). Which one is the primary look is a design matter (section 7). Alternative: «Почати» replaces «Закрити» (then Escape and light dismiss are the only ways out; worse on touch). Not chosen. |
| Q4 | Do the radios keep `role=radio` with `aria-checked`? What does the summary show? | Yes: the same buttons, `role="radio"`, `aria-checked` is now the pending state while the sheet is open (A-47). The summary shows the board shown, never the pending choice (FR-95). Alternative: show "6×6 · Задачка → 8×8 · Мозколамка" on the summary. Not chosen: not asked for, and it changes FR-95's format and NFR-5 scope. |
| Q5 | What does FR-73 mean now, and does «Нова головоломка» change? | FR-73 now says a size or level press only marks (section 1). «Нова головоломка» is unchanged: it keeps the size and level of the board shown and never reads the pending choice (FR-42, FR-92). |
| Q6 | What does closing without «Почати» do, in every route? | Discards the pending choice for Закрити, Escape, light dismiss, and a cancelled confirmation (FR-100, FR-98). The next opening shows the board shown. |
| Q7 | Generator failure or run-out (FR-88 retry)? | As today: the page retries up to 3 seeds on a run-out; if all fail, or on any other error, the sheet is closed, the old board, messages, size, level and summary stay, `aria-checked` shows the old board when the sheet is next opened, focus goes to the summary button. No message text. |
| Q8 | Accessibility? | No new key handler (FR-59); every name stays Ukrainian (NFR-5); the sheet is still `role="dialog"` with `aria-label` «Поле і складність»; no new id (A-41). Marking a choice moves no focus, so a screen-reader or keyboard user stays on the pressed radio and Tabs on to «Почати». |
| Q9 | Does the desktop rules-panel remark need a requirement? | No. Design only (section 7). Alternative: a new FR about panel size. Not chosen: size is layout, held NFR-14. |

## 5. Defaults, in one line each (for "signed, use defaults")

1. Q1 4×4 sets pending level 1; 6×6/8×8 does not restore the earlier one.
2. Q2 «Почати» always present; unchanged choice still makes one new puzzle like «Нова головоломка».
3. Q3 «Почати», after the level control and before «Закрити» (both kept), 44 px, focus to the summary button.
4. Q4 radios keep `role=radio`, `aria-checked` = pending while open; summary = board shown.
5. Q5 FR-73 = presses only mark; «Нова головоломка» unchanged.
6. Q6 every close route and a cancelled confirmation discard the pending choice.
7. Q7 failure path as today (sheet closes, old board stays, retry up to 3 seeds on a run-out).
8. Q8 no new key handler, Ukrainian names, `role=dialog`, no new id.
9. Q9 rules-panel size is design only.
10. New ids FR-100, FR-101, A-45 to A-47; slice `update-setup-sheet-start`.

## 6. Impact

Amended ids: FR-43, FR-44 (pointer), FR-59, FR-65, FR-66, FR-67, FR-73, FR-87, FR-88, FR-90, FR-91, FR-92, FR-94, FR-95, FR-96, FR-97, FR-98, FR-99 (note), NFR-5, NFR-9, NFR-12, NFR-13. New ids: FR-100, FR-101, A-45, A-46, A-47. Notes on closing the signed rows of row 92 (FR-97 (a) and (b)) to be added when this is signed, in the style of row 92's note.

Held rows touched (docs/requirements-held.md, notes only): **NFR-14** (design fidelity vs `review-set-11`): the sheet gains a «Почати» button and a pending state, so the sheet shots change; NFR-14 stays held and is not declared. NFR-10 (one-screen fit) is unaffected (the sheet is not on the page body); re-sample is not needed.

Spec sections of `openspec/specs/play-page/spec.md` likely to change on purpose (the change folder will use MODIFIED/ADDED/REMOVED blocks; line numbers are of today's file):

- «Choosing and closing the sheet» (l. 1751): rewritten around marking, «Почати», discard and focus.
- «Sheet and confirmation» (l. 1820): the trigger is «Почати»; the pending choice is discarded on cancel.
- «Only the first level exists at 4x4» (l. 1977): the 4×4 state follows the pending size; scenarios press 4×4 and check without a board change; the "failed change to 4x4" scenario moves to «Почати».
- «Pressing the shown size changes nothing» (l. 1041): replaced by "A press only marks"; the table scenarios change; the mount-failure scenario moves to «Почати».
- «Size and level interplay» (l. 2022): marking order, one «Почати» one puzzle, one seed, one confirmation.
- «Level selector», «Grid size selector», the summary button and setup-sheet structure requirements ("holds in order", `aria-checked` meaning), the confirmation requirement, the focus requirement, the stylesheet requirement «The summary and level buttons set their own colours» (add «Почати») and the strings/Cyrillic scan requirement. The implementer re-greps for `Choose`, `hidePopover`, `aria-checked`, `selectSize`.
- New requirements: «Pending choice», «Start button».

Tests likely to change on purpose (found by grep of `tests/` for `chooseSize|chooseLevel|selectSize|selectLevel|setup|data-control|radio`; the implementer re-greps and confirms line by line, no test is weakened, a test with no changed scenario behind it does not change):

| File | What pins the old behaviour | Source row |
|---|---|---|
| `tests/play-page-setup-sheet.test.ts` | choose closes the sheet and moves focus; the shown size/level closes the sheet; 4×4 press; Escape/close/toggle | FR-97, FR-73, FR-100, FR-101 |
| `tests/helpers/play-page.ts` | the size/level choose helpers press once and expect a new puzzle (proposal: keep the helper names for "choose and start" as mark + «Почати» + confirm, add mark-only helpers, so most tests keep their meaning) | FR-43, FR-88, FR-101 |
| `tests/play-page-size-selector.test.ts`, `tests/play-page-size-control.test.ts` | a press starts a puzzle; `aria-checked` equals the shown size; FR-73 no-op and "sheet closes" tests | FR-43, FR-73 |
| `tests/play-page-level-control.test.ts`, `tests/play-page-level-4x4.test.ts`, `tests/play-page-level-interplay.test.ts` | immediate level change, 4×4 level lock, size/level interplay (counts of seeds and `generate` calls per press) | FR-88, FR-91, FR-92 |
| `tests/play-page-level-seed.test.ts`, `tests/play-page-retry.test.ts`, `tests/play-page-new-puzzle-and-seed.test.ts` | seed and retry counts per press (now per «Почати»; marks take none) | FR-88, FR-101, A-38 |
| `tests/play-page-confirm.test.ts` | confirmation raised by a size/level press | FR-67, FR-98 |
| `tests/play-page-semantics.test.ts`, `tests/play-page-wcag.test.ts` | button count (+1 «Почати»), ids stay four, `aria-checked` meaning | NFR-9, FR-96, FR-100 |
| `tests/play-page-layout.test.ts` | sheet content order, tab order inside the sheet | FR-96, FR-59 |
| `tests/play-page-stylesheet.test.ts`, `tests/play-page-level-stylesheet.test.ts`, `tests/play-page-action-buttons-stylesheet.test.ts` | button lists for colours, focus, 44 px | FR-65, NFR-12 |
| `tests/play-page-controls-text.test.ts`, `tests/play-page-page-text.test.ts` | visible control texts and Cyrillic scan (adds «Почати») | NFR-5, FR-94 |
| `tests/play-page-hinted-cell.test.ts`, `tests/play-page-techniques.test.ts`, `tests/play-page-level-hint.test.ts`, `tests/play-page-rules-and-reset.test.ts`, `tests/play-page-logo.test.ts`, `tests/play-page-highlighting.test.ts`, `tests/play-page-cells.test.ts`, `tests/play-page-rendering.test.ts`, `tests/play-page-keyboard.test.ts` | use the choose helpers only; expected to need helper updates, not scenario changes | FR-66 (check) |
| `e2e/helpers.ts`, `e2e/nfr-12-targets.spec.ts`, `e2e/nfr-13-a11y.spec.ts` | the e2e choose helper presses a size/level and expects the change (now mark + «Почати»); the NFR-12 and NFR-13 sweeps gain the «Почати» button and the pending state | NFR-12, NFR-13 |

Also: `docs/design/ux-decisions.md` gets a new decision row (by the designer round, not by this draft); `docs/mvp-capability-plan.md` and `docs/current-state.md` get the new change in the sequence (before G2).

## 7. Design

- **Needed:** a new review set from `review-set-11` (the frozen pixel reference, `design/README.md`). The designer agent makes it from the sheet shots: the sheet with «Почати» and «Закрити» (hierarchy of the two buttons, primary look for «Почати», 44 px, light and dark, phone bottom sheet and desktop panel), the pending state (a choice marked but not started; the summary still showing the board shown), 4×4 pending with the reason and the unavailable levels, focus ring on «Почати». A fresh design-reviewer checks it (maker≠checker). **The user moves the pixel reference** to the new set in chat; implementing agents never edit `design/`. The design budget is two iterations per signed wireframe (user memory); a third asks first. A wireframe of the sheet footer may be needed before the full set (designer's call).
- **Design note, not a requirement (row 114, part 2):** on desktop the rules panel could be wider and taller with no inner scroll. The frozen design already sets `max-height: calc(100dvh - 7rem)` at 48rem and above (`design/v0/app/binarka.css:766`, also lines 863 and 864), and the page has not ported it yet. Default: **design only**, done in the same design round, no FR row; layout is held NFR-14. Alternative: add a row that the rules panel needs no inner scroll at 1280×800. Not chosen: it is a layout sample that the pixel reference already covers.

## 8. Slice plan

Proposed slice: **`update-setup-sheet-start`** (after `fix-action-button-targets`, before G2).

1. The user signs this draft in chat; the amendment is applied to `docs/requirements.md` (agent), a row is added to `docs/autonomy-log.md`.
2. Design round (section 7): designer, design-reviewer, the user moves the reference. The slice stays blocked on this, as `add-level-selector` was.
3. Spec-writer makes `openspec/changes/update-setup-sheet-start/` (proposal, design, tasks, delta spec) with the test-change list of section 6 and an independent audit.
4. Red tests first (pending choice, «Почати», discard routes, 4×4 pending, seeds, confirmation, focus), seen failing; then the page (`src/main.ts`/`src/ui/`, `src/ui/strings.ts`, stylesheet).
5. Review-gate, `npm run test:e2e`, `npm run check:a11y`, the full battery (lint, tests, build, `openspec validate --all --strict`), a browser check of the sheet (light dismiss and focus are not testable in jsdom).
6. Archive; update `docs/current-state.md` with evidence pointers.

Verification of the rows: jsdom tests with popover and dialog stubs (A-44) for FR-43, FR-59, FR-65 to FR-67, FR-73, FR-87, FR-88, FR-90 to FR-92, FR-94 to FR-101, NFR-5, NFR-9; the existing Playwright mechanisms for NFR-12 and NFR-13 (sampled). Each test is written first and seen failing. No new tool or dependency.

Open questions remaining: none beyond the defaults in section 4. One ASSUMPTION to ratify when signing: A-45 (a cancelled confirmation discards the pending choice).
