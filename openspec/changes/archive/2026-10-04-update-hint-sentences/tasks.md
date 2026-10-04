# Tasks: update-hint-sentences

Order of work: section 1 (tests) is written FIRST from the delta spec and seen red
before section 2 is implemented. No database exists, so the DB smoke flow of the
template maps to the manual page check in 3.7. Commits carry
`Slice: update-hint-sentences` and `Refs: FR-19`, `Refs: FR-20` or `Refs: FR-21`.

## 1. Update the pinned tests first (red)

- [x] 1.1 In `tests/hint.test.ts` replace every pinned pair, sandwich and count sentence with the delta text (table lines 22 to 29, N = 4 and N = 8 count cases, the two numbering cases, the broken-board case); the four existing count boards move to the singular ending «тож остання порожня клітинка — ...».
- [x] 1.2 In `tests/hint.test.ts` add the plural count case: 6×6, row 2 `0 1 0 . . 0`, target row 2 column 4 value 1, sentence «У рядку 2 вже три нулі, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — одиниці.» (FR-21).
- [x] 1.3 In `tests/hint-sentences.test.ts` update the pinned count sentence (line 60) to the singular text; tag stays `@trace NFR-4`; add a check that a pair sentence with the «бо» clause is one sentence.
- [x] 1.4 In `tests/play-page-hint.test.ts` (lines 188, 193, 235) and `tests/play-page-helpers.test.ts` (line 251) update the pinned pair sentences to the new text.
- [x] 1.5 (evidence: `docs/qa/update-hint-sentences-red-run.txt`, commits `2c08c44` and `77111fb`, tag `step-37-s5-red`) Run `npm run test:run`, confirm the updated tests FAIL (red) and only for the old wording, and save the failing output to `docs/qa/update-hint-sentences-red-run.txt` with the red and green counts.

## 2. Implement in `src/engine/hint.ts`

- [x] 2.1 `pairSentence`: append «, бо три однакові цифри поспіль заборонені» before the full stop (FR-19).
- [x] 2.2 `sandwichSentence`: same clause (FR-20).
- [x] 2.3 `countSentence`: take the number of empty cells in the line (N minus its filled cells); build «У <рядку|стовпці> K вже <count phrase>, а нулів і одиниць має бути порівну, тож » plus «решта порожніх клітинок — <одиниці|нулі>.» for 2 or more empty cells and «остання порожня клітинка — <одиниця|нуль>.» for exactly 1 (FR-21); pass the count from the call site; the target cell stays the first empty one.
- [x] 2.4 Run `npm run test:run` and confirm every test is green (including NFR-4 one-sentence and NFR-5 no-Latin checks at N = 4, 6, 8); the engine stays free of DOM imports and `Math.random`.

## 3. Validation, eval re-run, docs, and archive

- [x] 3.1 Run `npm run lint`. Done: clean (orchestrator, 00:20).
- [x] 3.2 Run `npm run test:run`. Done: 445 of 445 (orchestrator, 00:20).
- [x] 3.3 Run `npm run build`. Done: build passes.
- [x] 3.4 Run `npx openspec validate update-hint-sentences --strict` and `npx openspec validate --all --strict`. Done: 3 of 3 before archive, 2 of 2 after.
- [x] 3.5 Review-gate with `change: update-hint-sentences` (one run, one fix round for confirmed defects, one confirming run); save the report path in `docs/current-state.md`. Done: round 1 `wf_75ed24a7-c25` (2 confirmed minor: no test for the plural «нулі»/column branch, section 1 unticked; fixed `b6d2705`); confirming run `wf_f99b8fd6-6d1` clean (0 findings, `review-findings.json` `clean: true`).
- [x] 3.6 Re-run the `eval-suite` workflow for the NFR-6 cases (`evals/cases/hint-quality.eval.ts`, unchanged); it writes `docs/qa/eval-report.md` and `evals/results/*.json`. Raise the ratchet baseline (`node scripts/check-eval-ratchet.mjs`, `npm run check:eval`) only if every case scores at least 80; otherwise stop and report the scores to the user, and do not edit the rubric or the cases to pass. Done: `wf_5267cfbd-58f`, pair 92, sandwich 95, count 95 (bar 80), hint-clarity 94; the run journal shows the judges graded the new sentences; baseline minted (`quality/eval-baseline.json`, commit `e2d0d7d`), `node scripts/check-eval-ratchet.mjs` PASS.
- [x] 3.7 Real-browser check (stands in for the DB smoke flow; no database exists): (a) `npm run dev` and open the printed URL at the 375 px preset; (b) put two equal digits side by side in a row and press «Підказка»: the message ends with «бо три однакові цифри поспіль заборонені.» and wraps without a horizontal scrollbar; (c) repeat for a gap between two equal digits (sandwich) and for a line with N/2 of one digit and two empty cells («решта порожніх клітинок») and with one empty cell («остання порожня клітинка»); (d) save a screenshot under `docs/qa/update-hint-sentences/` and record its path in `docs/current-state.md`; (e) stop the server. Done at 00:20, built-in browser, 375 px: a real generated 6×6 board, «Підказка» filled row 3 column 4 with 0 and showed «Дві одиниці поспіль у рядку 3, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.»; no horizontal scroll — `docs/qa/update-hint-sentences/375-pair-hint-new-sentence.jpg`. Count and sandwich sentences checked by tests only.
- [x] 3.8 Confirm no new dependency: `git diff package.json package-lock.json` shows no change from this slice. Done: no change to `package.json` or `package-lock.json` since `cd90dca`.
- [x] 3.9 Update `docs/current-state.md` (last update date and time in UTC+5:30, phase, slice status, evidence paths, "Scope NOT delivered"), `README.md` if it quotes a hint sentence, and the A-15 wording example in `docs/requirements.md`. Done in the archive commit (current-state.md; README needs no change: it does not quote hint sentences).
- [x] 3.10 Archive, only after 3.1 to 3.9 passed (3.7 smoke test included) and the review-gate has no open confirmed defect: run `npx openspec archive update-hint-sentences --yes` (a normal merge, NOT `--skip-specs`); confirm `git diff openspec/specs/puzzle-engine/spec.md` shows only the six modified requirement blocks (no baseline text edits expected); run `npx openspec validate --all --strict`; run `npm run check:trace`. Done: normal archive (~6 modified), `npx openspec validate --all --strict` 2 of 2, `npm run check:trace`.
