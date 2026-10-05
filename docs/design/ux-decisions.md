# UX decisions for the next iteration

Recorded 2026-10-05 at 16:07 (UTC+5:30, as the clock printed it at commit time) from the user's answers in chat, after the agent's UX review of the play page as delivered on 2026-10-04 (tag `submission-2026-10-04`). These are the user's **decisions of intent**, not signed requirements: each one becomes a requirements amendment (exact FR wording, signed in chat) before any spec, test or code, as in slices 3 and 4.

## Decisions

| # | Problem found | Decision | Requirement impact |
|---|---|---|---|
| 1 | The rules block sits between the board and the buttons; returning players scroll past it on every move. | Move it to the bottom of the page as a native `<details>` with the summary «Правила», **closed by default**. No script, no persistence (TC-12). | Amend FR-57 ("always shows below the board" → collapsed `<details>` at the bottom) and A-26. |
| 2 | The hint and win messages sit at the very end, often below the fold on a phone (8×8), so a hint fills a cell without its explanation being visible. | Order: title → size → board → **message area** → buttons → rules. The message area sits directly under the board, with height reserved so the page does not jump. | Amend the DOM contract in `play-page/spec.md`; new NFR: board, message area and buttons fit on one 375×812 screen at 6×6. |
| 3 | The cell a hint filled looks like any player entry. | Mark it (`cell-hinted`) until the next board action. | New FR (hinted-cell marker); FR-39 scenarios gain the marker. |
| 4 | «Нова головоломка», a size change and «Скинути» wipe progress with no undo (FR-47 is Future). | **Confirm only when the board has player entries**, with a native `<dialog>`: «Почати заново? Ваші ходи на цьому полі буде втрачено.», «Так, почати» / «Скасувати». | Amend FR-42, FR-43, FR-58 (confirmation when entries exist); new page texts under NFR-5. |
| 5 | A broken rule, a given and a player entry differ mainly by colour. | A second, non-colour cue for violations, givens, player entries and the hinted cell. | New NFR (non-colour cues), verified by the vision-verify pass and `check-a11y`. |
| 6 | The size `<select>` needs two taps on mobile. | A segmented control of three buttons («Поле 4×4», «Поле 6×6», «Поле 8×8»), one tap, current size marked. | Amend FR-43 and A-24 (control type and DOM); the size-selector tests change deliberately. |
| 7 | Generated puzzles are sparse, so «Підказка» often says no rule applies. | **Include FR-27:** the generator guarantees every puzzle is solvable with the pair, sandwich and count rules alone, so a hint is always available on a correct board. | Move FR-27 from Future to MVP; a generator change with its own slice. NFR-1 to NFR-3 timing bounds must still hold. |
| 8 | Cells are clickable `div`s, not reachable by keyboard or screen reader. | Cells become `<button>`s with an `aria-label` («Рядок R, стовпець C, …»); visible focus everywhere. | Replace A-20 with keyboard and screen-reader requirements; verified by `check-a11y` (needs Playwright and `@axe-core/playwright`, a dependency approval). |

The user agreed with the page order in decision 2.

## Order of work (agent's proposal)

1. Decisions 1 and 2: layout only, the biggest gain, a small amendment.
2. Decision 3, then decision 5 through the design ([v0 prompt](v0-prompt.md)).
3. Decisions 4, 6 and 8, each a small separate change.
4. Decision 7, the generator slice. It is independent of the UI and can run in parallel.

The v0 prompt already uses the target structure from these decisions.
