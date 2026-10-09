# UX decisions for the next iteration

Recorded 2026-10-05 at 16:07 (UTC+5:30, as the clock printed it at commit time) from the user's answers in chat, after the agent's UX review of the play page as delivered on 2026-10-04 (tag `submission-2026-10-04`). These are the user's **decisions of intent**, not signed requirements: each one becomes a requirements amendment (exact FR wording, signed in chat) before any spec, test or code, as in slices 3 and 4.

## Decisions

| # | Problem found | Decision | Requirement impact |
|---|---|---|---|
| 1 | The rules block sits between the board and the buttons; returning players scroll past it on every move. | ~~Bottom `<details>`, closed by default~~ (first decision). **Revised 2026-10-05 about 19:55: option D.** A «Правила» button in the header opens the rules in a native popover (`popover` attribute, no JavaScript), shown as a bottom sheet on phones (board stays visible) and a centred panel on wider screens. Each rule has a tiny example. The bottom `<details>` goes away. | Amend FR-57 ("always shows below the board" → a header button opening a popover) and A-26; the rules texts stay. |
| 2 | The hint and win messages sit at the very end, often below the fold on a phone (8×8), so a hint fills a cell without its explanation being visible. | Order: title → size → board → **message area** → buttons → rules. The message area sits directly under the board, with height reserved so the page does not jump. | Amend the DOM contract in `play-page/spec.md`; new NFR: board, message area and buttons fit on one 375×812 screen at 6×6. |
| 3 | The cell a hint filled looks like any player entry. | Mark it (`cell-hinted`) until the next board action. | New FR (hinted-cell marker); FR-39 scenarios gain the marker. |
| 4 | «Нова головоломка», a size change and «Скинути» wipe progress with no undo (FR-47 is Future). | **Confirm only when the board has player entries**, with a native `<dialog>`: «Почати заново? Ваші ходи на цьому полі буде втрачено.», «Так, почати» / «Скасувати». | Amend FR-42, FR-43, FR-58 (confirmation when entries exist); new page texts under NFR-5. |
| 5 | A broken rule, a given and a player entry differ mainly by colour. | A second, non-colour cue for violations, givens, player entries and the hinted cell. | New NFR (non-colour cues), verified by the vision-verify pass and `check-a11y`. |
| 6 | The size `<select>` needs two taps on mobile. | A segmented control of three buttons («Поле 4×4», «Поле 6×6», «Поле 8×8»), one tap, current size marked. | Amend FR-43 and A-24 (control type and DOM); the size-selector tests change deliberately. |
| 7 | Generated puzzles are sparse, so «Підказка» often says no rule applies. | **Include FR-27:** the generator guarantees every puzzle is solvable with the pair, sandwich and count rules alone, so a hint is always available on a correct board. | Move FR-27 from Future to MVP; a generator change with its own slice. NFR-1 to NFR-3 timing bounds must still hold. |
| 8 | Cells are clickable `div`s, not reachable by keyboard or screen reader. | Cells become `<button>`s with an `aria-label` («Рядок R, стовпець C, …»); visible focus everywhere. | Replace A-20 with keyboard and screen-reader requirements; verified by `check-a11y` (needs Playwright and `@axe-core/playwright`, a dependency approval). |

The user agreed with the page order in decision 2.

**Note on decision 6 (2026-10-10, phase S amendment signed in chat at about 00:03 (UTC+5:30), autonomy-log row 118):** decision 6 ("one tap, current size marked") is **superseded in part** by the user's decision of 2026-10-09 at about 22:33 (autonomy-log row 114): in the setup sheet a size press now only marks the size, and the new puzzle starts with «Почати» (select, then «Почати»; FR-43, FR-73, FR-100, FR-101 in `docs/requirements.md`). The segmented control of three buttons stays. The decision text above is not rewritten.

## Decisions after the first v0 build (2026-10-05 about 19:55)

| # | Problem found | Decision | Requirement impact |
|---|---|---|---|
| 9 | With no message, the reserved message area is an empty band between the board and «Підказка». | A quiet placeholder line, shown only when there is no hint or win message (CSS only): «Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.» It also points first-time players to the rules, since the page cannot detect a first visit (TC-12). | New page text under NFR-5; part of the decision 2 amendment. |
| 10 | The word «БІНАРКА» inside the logo is illegible at phone size. | Rework the inner mark: remove the word, put a 2×2 mini board (`1 0 / 0 1`, drawn as shapes) in the circle, keep the 0/1 rays. Fallback: the digits "01" as shapes. | Part of the logo FR (TC-14 amendment). |
| 11 | Built-in browser screenshots showed partial repaints. | Agreed: the pixel gate uses its own Playwright captures, never preview screenshots. | None (process). |
| 12 | The message area between the board and the buttons can push «Підказка» down when a hint wraps beyond the reserved lines; the controls should sit where the thumb is. | Order revised (2026-10-05 about 20:05): title with «Правила» → size → board → **buttons** → message area (placeholder, hint, win). Board, buttons and message still fit on one 375×812 screen at 6×6. | Replaces the order in decision 2; same NFR. |

The v0 credits ran out after iteration 2, so the agent applied `v0-followup-2.md` and decision 12 to the design sources itself (iteration 3, see `design/README.md`). Because the agent is now partly the design's author, the design needs an independent look before it becomes the pixel reference: the user's review, and a `vision-judge` pass.

Options considered for decision 1, with sources: `docs/design/v0-followup-2.md` is the resulting v0 request. The comparison was A bottom `<details>`, B modal dialog, C popover, D popover as a bottom sheet, and E tooltip or separate page. D was chosen because it needs no script, keeps the board visible on phones and is reachable without scrolling.

## Order of work (agent's proposal)

1. Decisions 1 and 2: layout only, the biggest gain, a small amendment.
2. Decision 3, then decision 5 through the design ([v0 prompt](v0-prompt.md)).
3. Decisions 4, 6 and 8, each a small separate change.
4. Decision 7, the generator slice. It is independent of the UI and can run in parallel.

The v0 prompt already uses the target structure from these decisions.

## Decisions after design review 1 (2026-10-05 at 20:49)

The user's answers to the five questions in [`review-1-design-reviewer.md`](review-1-design-reviewer.md):

| # | Question | Decision | Impact |
|---|---|---|---|
| 13 | 8×8 cells cannot reach 44 px on phones. | **Accept smaller 8×8 cells on phones** (at least WCAG 2.5.8's 24 px, in practice about 33 px at 320 and 39 px at 375 with the tightest gutters); 4×4 and 6×6 keep 44 px. Alternatives considered and not chosen: hiding 8×8 on narrow phones (loses a feature), a zoom/pan board or a row-focus mode (complex, more friction), horizontal scrolling (worst). | A touch-target NFR with this explicit exception. |
| 14 | The win message uses an ASCII apostrophe. | **Use the Ukrainian apostrophe ʼ (U+02BC)**: «Вітаємо, головоломку розвʼязано!» | **Product change, not only design:** FR-41 and the play-page spec pin the ASCII apostrophe, and tests compare it exactly; an amendment the user signs, then the tests change deliberately. |
| 15 | No 40 px logo capture exists. | **Add a 40 px logo capture** to the review set. | `design/tools/capture-review-set.sh`. |
| 16 | May the board grow beyond 4rem cells? | **Yes:** about 5rem on tablet, height-aware (about 4.5rem) on desktop, as the review proposes. | Design CSS; the fit-on-one-screen NFR must still hold. |
| 17 | Warm dark theme? | **Yes:** the warm brown-black palette from the review (§3). | Design CSS; contrast to be verified by `check-a11y`. |

**Note on decision 17 (2026-10-10, phase S amendment signed in chat at about 00:03 (UTC+5:30), autonomy-log row 118):** the warm dark palette of decision 17 stays. A manual theme choice (light, dark, or as the system) now sits on top of it (the user's decision of 2026-10-09 at about 23:15, autonomy-log row 116; FR-102 to FR-106 in `docs/requirements.md`), so dark is no longer reached only through the system theme. Decision 17 is not superseded and its text is not rewritten.

**Which findings to apply:** all 15, plus the review's motion (the user's choice, 2026-10-05 about 21:00; iteration 4 in `design/README.md`). Review 2 ([`review-2-design-reviewer.md`](review-2-design-reviewer.md)) asked four more questions.

## Decisions after design review 2 (2026-10-05 at 21:50)

| # | Question | Decision | Impact |
|---|---|---|---|
| 18 | Which review 2 findings to apply? | **All of them:** N1–N7 and the partly fixed #8, #9, #14 (the agent proposed the same set in order of priority). | Design iteration 5. |
| 19 | 4×4 and 1024×768 in the review set? | **Add both** before the set becomes the pixel reference. | `design/tools/capture-review-set.sh`, a `/four/` route. |
| 20 | 8×8 under 44 px on short tablet and desktop screens (1024×768)? | **Extend decision 13's exception:** 8×8 cells may be under 44 px (at least 24 px) on any screen too short for 44 px, so the page never scrolls; 4×4 and 6×6 keep 44 px everywhere. | The touch-target NFR's exception names screen height, not only phones. |
| 21 | 4×4 on tablet and desktop: grow or stay centred? | **Stay centred** in a column of at least 26rem. | Design CSS. |

Review 2's fourth question (should the product's parity capture also force reduced motion?) was answered as decision 25.

## Decisions after design review 3 (2026-10-05 at 22:20)

The user's answers to [`review-3-design-reviewer.md`](review-3-design-reviewer.md):

| # | Question | Decision | Impact |
|---|---|---|---|
| 22 | A floor on the height-aware cell size (R1), and a short desktop size in the set? | **Yes, both:** 4×4 and 6×6 cells at least 44 px and 8×8 at least 24 px on every screen; below that the page scrolls. Add 1366×650 (default and 8×8, light and dark) to the set. | Design CSS; capture script. |
| 23 | The 5–7 px button shift between play and win (R2)? | **Accept it.** | None. |
| 24 | Which low findings? | **R3** (rules panel anchored higher from 64rem), **R4** (backdrop and dialog motion), **R6** (exact 80 px cells at 768). R5 is covered by decision 25. | Design CSS; R3 and R6 change the 1024/1440 rules shots and the 768 shots. |
| 25 | Should the product's parity capture match the design capture? | **Yes:** reduced motion forced, the framed window focused (the dialog's focus ring), and the pointer kept off the page (R5). | A requirement for `quality/visual-parity.config.json` and the product's capture, when the pixel check is set up. |

## Decisions after design review 4 (2026-10-05 at 22:50)

The user's answers to [`review-4-design-reviewer.md`](review-4-design-reviewer.md):

| # | Question | Decision | Impact |
|---|---|---|---|
| 26 | Keep the rules panel below the header from 64rem (N1)? | **Yes:** anchored at `max(12vh, 6.5rem)` with a matching maximum height. | Design CSS; the 1024 rules shots change. |
| 27 | The centred panel's shadow (N2)? | **Yes:** the dialog's downward shadow, from 48rem. | Design CSS; the rules shots at 768, 1024 and 1440 change. |
| 28 | The rules page at 1366×650 in the set? | **Yes**, light and dark. | Capture script. |
| 29 | Notch (safe-area) insets in the page width (N3)? | **Yes, now.** | Design CSS; no shot changes. |

## Freezing the reference (2026-10-05 at 23:12)

| # | Question | Decision | Impact |
|---|---|---|---|
| 30 | Freeze iteration 7's `review-set-5` as the pixel reference, or run review 5 first? | **Freeze** (the user, "freeze", about 23:11). No review has looked at iteration 7; review 4's only blocker (N1) was applied and measured. | `design/README.md` "Pixel reference: frozen". It is the `referenceUrl` and baseline for `npm run check:visual` once the pixel check is set up (Playwright, `pixelmatch` and `pngjs` still need the user's approval). |

