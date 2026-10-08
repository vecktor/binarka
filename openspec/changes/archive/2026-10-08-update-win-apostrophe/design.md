# Design: update-win-apostrophe

## Goals

- The win message is exactly «Вітаємо, головоломку розвʼязано!» with the modifier letter ʼ (U+02BC) as the apostrophe (FR-41, UX decision 14).
- The spec, the tests and the page agree on that one code point, and a test pins it so that a lookalike (U+0027, U+2019, U+02B9, U+2032) cannot slip in.
- NFR-5 (Cyrillic, no Latin letter) keeps holding for the win message.

## Non-goals

- Any other text. The page texts are owned by A (`src/ui/strings.ts`), B and C add theirs; D changes the win constant only.
- The hint sentences. The engine's «п’ять» uses U+2019 (FR-21, `src/engine/hint.ts`); it is engine output, NFR-5 only, and is not changed or re-tested here.
- Normalising apostrophes elsewhere, a typography helper, or a check that scans all Ukrainian text for U+0027 (see decision 3).
- A language switch (FR-55 and FR-56 stay Future). Authentication does not exist, so no redirect-to-login or forbidden case applies (play-page Exclusions).

## Key decisions

1. **Change the constant, not the code path.** After slice A the win text is `WIN` in `src/ui/strings.ts`, and `play-page.ts` writes `isSolved(board) ? WIN : ''` (no literal there). D replaces the literal in that one line and deletes the comment "ASCII apostrophe until slice D changes it". Trade-off: none; a second copy of the text would break the NFR-5 source scan of A, which allows Cyrillic only in `strings.ts`. In the source the apostrophe is written as the character itself, not as an escape, so a reviewer sees the same glyph the player sees; the test pins the code point, so a wrong character cannot pass review by looking right. Alternative rejected: `ʼ` in the source, which hides the text from a plain read of the file and from a grep for the sentence.
2. **The test constant changes with the spec, and exact texts stay literals in tests.** A test never imports `src/ui/strings.ts` (A's rule: it would make an exact-text assertion a tautology). `WIN_MESSAGE` in `tests/helpers/play-page.ts` is changed to the new text, and the code-point tests build the expected text from `String.fromCodePoint(0x2bc)`, so the test fails if the helper constant and the source both drift the same way to a wrong character.
3. **One scenario, one test for the code points, no global scan.** The new scenario «The apostrophe is U+02BC and no other character» pins the win message only. A scan of all page text for U+0027 was considered and rejected: the apostrophe appears in no other page text today, FR-41 is the only requirement that names it, and a scan would also have to exempt engine hint text (U+2019). If another Ukrainian text with an apostrophe is added later, its FR pins it.
4. **NFR-5 holds; judgement recorded.** The tests define "Latin letter" in two ways: `/[A-Za-z]/` (`tests/play-page-page-text.test.ts`, `tests/ui-strings.test.ts`, `tests/play-page-helpers.test.ts`) and `/\p{Script=Latin}/u` (`hasLatin` in `tests/helpers/board.ts`, used by the CLI English check, not by the page). U+02BC is script Common, so neither matches it (checked with Node on 2026-10-06: both false); the Cyrillic check `/\p{Script=Cyrillic}/u` still matches the Cyrillic letters around it. Note for later readers: U+02BC is in the category Lm, so `/\p{L}/u` matches it. That regex is used in `tests/ui-strings.test.ts` only for decorative `aria-hidden` text (it must hold no letter), which the win message is not. Do not widen that check to page text without exempting the apostrophe.
5. **Ordering against A and C (no overlap).** The baseline text has these places that quote the apostrophe, and each has exactly one owner:

   | Place in `openspec/specs/play-page/spec.md` | Owner and handling |
   |---|---|
   | Requirement «Win message when solved», its text and two scenarios | D (this delta, MODIFIED) |
   | Scenario «Win message text» of «Ukrainian page text» | A: reworded to «its text is the one required by «Win message when solved» (FR-41)»; no apostrophe left |
   | Scenarios «Win at 4x4» and «Win at 8x8» of «Grid size selector» | C: rewritten to point at «Win message when solved» (C's delta, scenario «Hint and win at the chosen size»); no apostrophe left (re-checked on 2026-10-09) |
   | Scenario «The same elements carry every message» of the requirement «The hint and win messages are status regions» (added to the baseline by `reconcile-ux-accessibility`, archived 2026-10-08; it quotes the win message with U+0027) | D (this delta, second MODIFIED requirement, the whole requirement copied; only the apostrophe changed, plus the note "(apostrophe U+02BC)" after the quote) |
   | DOM contract paragraph, the sentence "The apostrophe in «розв'язано» is the ASCII apostrophe U+0027 (as in FR-41) ..." | D by hand at archive (not a requirement, so the merge does not touch it) |

   **Order (precondition, one order only): A is archived (done: it created `strings.ts`), then C (`update-controls-accessibility`) is archived, then D runs and is archived.** D does not start before C is archived (tasks 1.1 and 3.9 check it). Reasons: C rewrites «Win at 4x4» and «Win at 8x8» of the baseline to point at «Win message when solved» and rewrites `tests/play-page-size-selector.test.ts` for the radiogroup, so after C no baseline text outside D's own two requirements (the second one was added to the baseline on 2026-10-08) and the DOM-contract sentence quotes U+0027, and the test file has one owner at a time. D therefore does not edit those two baseline scenarios (single owner: C). If C's rewrite leaves a U+0027 pin in the test file, D changes it deliberately (see «Tests that change deliberately»); if that pin were to contradict C's spec, that is a defect of C to fix before D starts, not a reason to reorder.

## Data model

No state, no storage (TC-12), no new DOM. The only data change is one string constant: `WIN` = `Вітаємо, головоломку розв` + U+02BC + `язано!` (32 code points, the same length as before: the apostrophe is replaced, not added).

## Error handling strategy

The slice adds no input, no failing call and no branch. The win message is set from `isSolved(board)` exactly as before; a wrong or missing constant is caught by the tests, not at run time. No path can raise an uncaught error from this slice.

## Tests that change deliberately (by FR)

Grep of `tests/` and `src/` for «розв'язано», `0x27`, `\u0027`, `U+0027` and `'` inside the win text, made on 2026-10-09 on the baseline after C (archived 2026-10-06) and after `reconcile-ux-accessibility` (archived 2026-10-08). It found four test files and one source file. D re-makes the grep at its start (tasks 1.2) and any pin found that is not named here is added to the list by FR and changed deliberately; a pin that has gone drops from the list:

- FR-41, `tests/helpers/play-page.ts` lines 14 and 15: `WIN_MESSAGE` becomes the U+02BC text; its comment changes from "ASCII apostrophe U+0027" to "modifier letter apostrophe U+02BC".
- FR-41, `tests/play-page-win.test.ts` line 30 (the title says "apostrophe U+0027", test tagged by its `describe`, `@trace FR-41`) and line 45 (`String.fromCodePoint(0x27)`): both change to U+02BC. Add the tests of the new scenario there: code point after «розв» is `0x2bc`, text length 32 UTF-16 units, no U+0027 and no U+2019 in the text, text equals the template built with `String.fromCodePoint(0x2bc)`.
- FR-41, `tests/play-page-helpers.test.ts` lines 333 to 335 (`the win message uses the ASCII apostrophe U+0027 and no Latin letters`): becomes the U+02BC check, `codePointAt(...)` equals `0x2bc`, the template uses `0x2bc`, and `/[A-Za-z]/` still does not match. This file carries no `@trace` on purpose (line 1: self-check of the helpers); it changes because its assertion contradicts FR-41 as amended (row 66), and no tag is added.
- NFR-5, `tests/play-page-page-text.test.ts` line 150 (`String.fromCodePoint(0x27)`, in the test «Win message text», inside the `describe` tagged `@trace NFR-5`): changes to `0x2bc`; the `WIN_MESSAGE` assertion on line 149 follows the constant, and the Cyrillic and `/[A-Za-z]/` assertions on the next lines stay and still pass (decision 4). Tag stays `@trace NFR-5`.
- No pin in `tests/play-page-size-selector.test.ts`: C removed them. The file compares the win text with `WIN_MESSAGE` only (its header comment says so), so it needs no edit.
- Tests that follow `WIN_MESSAGE` need no edit and are expected to fail red until the source changes (collateral): `tests/play-page-new-puzzle-and-seed.test.ts` (line 63), `tests/play-page-size-selector.test.ts` (lines 200, 205, 385, 389, 446, 462), `tests/play-page-layout.test.ts` (lines 326, 405, 481), `tests/play-page-rules-and-reset.test.ts` (lines 194, 203), `tests/play-page-confirm.test.ts` (lines 409, 417), `tests/play-page-hinted-cell.test.ts` (line 308), and `tests/play-page-semantics.test.ts` (lines 406, 407, 425, 442). The semantics file holds the test of the scenario «The same elements carry every message» of «The hint and win messages are status regions» (line 375, `@trace FR-63`; it compares `winMessage(root)` and `winRegion.textContent` with `WIN_MESSAGE` at lines 406 and 407, so it follows the constant). It is the test of the second MODIFIED requirement; it needs no edit because the spec change only moves the apostrophe, which the constant carries.
- No test of FR-27, FR-31 to FR-40, FR-42 or FR-43 changes. `tests/ui-strings.test.ts` needs no edit (it reads no win text; its source scan allows Cyrillic in `strings.ts`).

No assertion is weakened: each pinned code point moves from U+0027 to U+02BC, and one test is added that rejects both of the old characters.

## Risks and mitigations

- **A lookalike apostrophe enters by copy and paste** (U+2019, U+02B9 or U+2032 looks the same): the new test compares the code point after «розв» and the whole text against a template built from `String.fromCodePoint(0x2bc)`.
- **The spec text and the test constant are edited with a different character**: the delta spec states the code point in words in two places and the scenario spells the expected text as `розв` + U+02BC + `язано!`; a tester can decide pass or fail from the code point alone.
- **Editors or the build normalise the character**: Vite and Vitest read UTF-8 as is; the manual check in tasks 3.7 reads the rendered text in a real browser and copies it to a code-point check.
- **Stale U+0027 text in the baseline after archive**: the DOM-contract sentence only, since both requirements that quote U+0027 are MODIFIED by this delta and C removed its quotes; listed below and grepped. The status-regions quote was missed by the audit of 2026-10-06 because that requirement did not exist yet; it was found by grep on 2026-10-09. A later baseline change can add another quote the same way, so tasks 1.2(c) and 3.9 grep the whole baseline again.
- **A U+0027 pin in a test file that nobody owns** (the audit of 2026-10-06 found two in `tests/play-page-size-selector.test.ts`; C removed them): D re-greps all of `tests/` at its start (tasks 1.2) and owns every pin it finds, listed by FR above.
- **D started before C is archived**: tasks 1.1 stops the work if `openspec/changes/archive/` has no `update-controls-accessibility`, and 3.9 repeats the check before D's archive. C is archived (2026-10-06-update-controls-accessibility), so the gate is met today.
- **The delta drifts from the baseline** (a requirement copied whole goes stale when another change edits the same requirement before D archives): tasks 3.9 diffs both requirements against the baseline before archive; the only differences allowed are the apostrophe, the added scenario, and the apostrophe sentence in «Win message when solved».
- **Overlap with A and C**: none by the ownership table in decision 5; D edits two requirements, both through its own delta, and each changes only the apostrophe and adds the note "(apostrophe U+02BC)" after each exact-text quote (plus, in «Win message when solved», the apostrophe sentence and one added scenario). Every other scenario is byte-identical to the baseline (diffed on 2026-10-09).

## Baseline text edits at archive

Archive normally (not `--skip-specs`) so «Win message when solved» and «The hint and win messages are status regions» are replaced by the delta, and in the SAME commit edit the non-requirement text of `openspec/specs/play-page/spec.md`, rebased on the baseline as it stands when D archives:

1. **DOM contract paragraph** (section «DOM contract used by the scenarios»; the sentence is at the end of its first paragraph, line 11 of the baseline; re-checked on 2026-10-09 after `reconcile-ux-accessibility` and found to match the text below character for character; still re-grep `The apostrophe in` before editing and quote the sentence as it then reads): replace the sentence "The apostrophe in «розв'язано» is the ASCII apostrophe U+0027 (as in FR-41); an equality check on the win message compares against that codepoint exactly." with "The apostrophe in «розвʼязано» is the modifier letter ʼ (U+02BC) (as in FR-41); an equality check on the win message compares against that code point exactly." No other sentence of that paragraph is touched.
2. **Purpose, Ownership, Exclusions:** no change by D (FR-41 is already in "FR-31 to FR-43").

Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`, and grep the baseline twice. (a) `розв'язано` (ASCII apostrophe): the expected result is no match at all. (b) `U+0027`: the expected result is exactly two lines, both inside «Win message when solved» and both negations that this delta writes on purpose (its text: "not the ASCII apostrophe U+0027"; its scenario «The apostrophe is U+02BC and no other character»: "contains no U+0027"). No other line may match; in particular the DOM-contract line and the status-regions scenario must not. The two requirements that quoted U+0027 as the right character are replaced by the merge and the DOM-contract sentence is edited by item 1. A match on (a), or a line on (b) other than those two, means the archive merge or the item-1 edit did not apply (or the baseline gained a new quote after 2026-10-09): stop and report, do not guess.
