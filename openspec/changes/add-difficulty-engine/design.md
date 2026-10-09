# Design: add-difficulty-engine

## Goals

- `hint(board, ceiling = 1)` offers techniques 1 to ceiling in the order of FR-77 (default: today's three rules). `generate(size, seed, level = 1)` returns a puzzle that is solvable with techniques 1 to L and not with 1 to L − 1 (FR-82), unique (FR-15), deterministic (FR-14), with one solution per (N, seed) at every level (FR-83), in at most 100 attempts (FR-84).
- Level 1 is byte-identical to today: same givens, same solution, same CLI text, for every (N, seed) (FR-14, FR-85). The golden file of task 0.1 is the guard.
- NFR-16: every valid (N, level) keeps NFR-1 to NFR-3; the slice's own tripwire is 50% of each bound on the dev machine (A-36). NFR-17: one hint under 100 ms.
- The page needs no code change in this slice and behaves as today: it calls `hint(board)` (ceiling 1) and `generate(n, seed)` (level 1). The page passes ceiling 4 in DL2 (FR-77 page clause).

## Non-goals

- Any page behaviour: the level control, the description lines, the rules panel section, the 4×4 behaviour (DL2, `add-level-selector`).
- N = 4 above level 1 (A-34); N = 10 to 16 (FR-18); English sentences (FR-56); a `level` field on `Puzzle` (the page knows the level it asked for; a field can be added later without breaking anything).
- Page behaviour for the hint button (DL2 passes ceiling 4 and owns the FR-66 hinted-cell page test change).
- Relaxing NFR-1 to NFR-3, shrinking the seed set, loosening the level test, raising the 100 attempts or the 4-step cap, or weakening «exactly one solution».

## Key decisions

### 1. Each technique is a forced deduction (soundness, FR-15)

A fill is forced if every valid completion of the board has that value in that cell.

- **Line balance (FR-74).** A valid completion has exactly N/2 of d in the line, so exactly one more d among the empty cells. If e took d, every other empty cell would take the other digit; if that line then has three in a row, no valid completion has e = d.
- **Unique lines (FR-75).** A valid completion of the line has N/2 of each digit, so its two empty cells hold exactly the digits that the complete line holds there. If those two differ, the line is the complete line or its swap; the complete line is a duplicate, so both cells take the opposite digit. If the two are equal, the line must equal the complete line, which no valid completion allows: the board has no completion and the fill is vacuously forced. This cannot happen in a generator walk (every board there is a subset of a valid solution); on a wrong player board the next hint shows the violation (A-6).
- **Look-ahead (FR-76).** Put v, then fill forced cells (each is forced in every completion of the board with v), and stop at a violation. `findViolations` is monotone: every extension of a violating partial board violates. A completion with v would be a completion of the board with no violation, a contradiction, so v is excluded in every completion. The cap of 4 limits what is found, not soundness.
- **Consequence.** A puzzle finished by forced fills from its givens has exactly one solution, so FR-15 is implied. The tests still check the solver and the independent oracle on all 180 puzzles and do not rely on this argument.

### 2. API: a ceiling parameter, default 1; the generator passes L

- `hint(board, ceiling = 1)`; `solveByRules(board, ceiling = 1)`; `generate(size, seed, level = 1)`. The user decided the default (autonomy-log row 88, option B): every existing caller keeps today's behaviour, the page is not touched in DL1, and DL2 calls `hint(board, 4)` for the FR-77 page clause.
- Rejected alternative A (default 4, so the page gets four techniques with no page edit). Measured on a scratch copy (2026-10-09, not evidence): it fails five existing tests (the FR-24 hint test, three FR-27 fixture tests, the FR-66 page test), changes the page in DL1 before the level control exists, and needs those tests edited for an engine default. B keeps all of them unchanged except for the sentence of decision 12.
- `Hint.rule` gains `balance`, `unique`, `lookahead`; a look-ahead hint also carries `steps` (forced fills, 0 to 4).
- `src/engine/index.ts` exports `InvalidLevelError` and `GenerationRunOutError` (the page's retry in DL2 tells a run-out apart by `instanceof`, FR-88, A-38); `buildPuzzle`, `MAX_ATTEMPTS` and `solveByRules` stay internal. This is pinned by the requirement «The public engine interface exports the level API» and a test (task 1.7).
- New errors in `types.ts`: `InvalidLevelError` (a `RangeError`: a bad level, and a level above 1 at N = 4) and `GenerationRunOutError` (an `Error`, distinct); each message is one English sentence.
- Validation order: types, size, seed, level, then size with level.

### 3. «Solvable with techniques 1 to L» is operational, not a closure (ADR-worthy: it defines the levels)

- Capped look-ahead with single-cell propagation depends on the order of the fills (extra known cells can use up steps before the contradiction), so a closure definition is not well-defined. We define: the hint walk (FR-77 order, ceiling L) from the givens reaches the solution.
- The carving predicate, the rejection test «not solvable with L − 1» and the test loops of FR-27 and FR-82 all call one function, `solveByRules(board, ceiling)`, a loop over the same selection routine that `hint` uses. The generator and the tests cannot disagree.
- A differential test compares `solveByRules` with a loop of public `hint` calls (same `{ solved, steps }`; both share `selectFill`, so cells, values and rules are not compared) over the fixed boards.
- Consequence: the FR-27 clause «a hint is available on a board whose entries agree with the solution» follows at level 1 from the monotonicity of the three rules, and at levels 2 to 4 is checked on a sample (360 boards, each at ceiling L and again at ceiling 4, the page's ceiling). A failing sample STOPS the slice and goes to the user as a requirements question (an amendment); it is never patched in code or loosened in the test.

### 4. Selection order and tie-breaks (A-7 extended, FR-77)

- Lowest technique first. Technique 1 keeps today's code path (pair, sandwich, count).
- Technique 2: rows before columns, lower line, then lower cell position, then d = 0 before d = 1 (cell-outer, digit-inner). The prototype iterates digit-outer. The two orders can pick different cells only in a line where both digits hold N/2 − 1; an exhaustive search over all 3^N single-line patterns for N = 4, 6 and 8 (scratch, 2026-10-09, not evidence) found every such pattern also triggers a pair, sandwich or count fill in the same line, so technique 1 fires first and technique 2 never chooses between the orders. The difference is unobservable through `hint`, and so no scenario discriminates; the cell-outer order is pinned only so that the choice is definite.
- Technique 3: rows before columns, lower line, then the lowest complete line that agrees; the target is the first empty cell of the line.
- Technique 4: fewest steps, then lower row, then lower column, then v = 0 before v = 1. The scan may stop at the first 0-step candidate, since nothing can beat it.
- FR-77 says «then the order of FR-77» but gives no cell order for look-ahead; this is a pinned reading (ambiguity A).

### 5. Look-ahead depth and the cap (A-37)

- A step is one forced cell chosen by techniques 1 to 3 in their order, on a copy. After the placement and after each step the copy is checked with `findViolations`: a placement that violates at once has 0 steps, a contradiction after the fourth step is accepted, one that needs a fifth is not.
- Measured on the scratch copy for the spec's boards: depths 2, 4, 3 and 5. The depth-5 board finds a contradiction with a cap of 5 and none with 4.
- Propagation that gets stuck with no violation is not a contradiction.

### 6. Determinism and the random stream (FR-83)

- `generate` keeps its order: `mulberry32(seed)`, the `fillGrid` restart loop, then per attempt one `shuffle` of the positions and one carving pass.
- The first attempt draws exactly what today's code draws, and level 1 accepts it unconditionally (today's predicate, no L − 1 test), so level 1 output is unchanged.
- A retry (levels 2 to 4) shuffles again from the continued stream and never calls `fillGrid` again: the solution is the same at every level and after any number of attempts.
- No draw is added before the fill. No optimisation may change the attempt-1 walk of level 1; the golden file fails if it does. No clock, no `Math.random`, no node budget in the level logic.

### 7. At most 100 attempts and a distinct error (FR-84, A-35, A-38)

- `buildPuzzle(size, seed, level, maxAttempts)` is internal to `generator.ts` (exported there for tests, not from `index.ts`); `generate` calls it with the exported `MAX_ATTEMPTS = 100`. The user raised the bound from 30 to 100 (autonomy-log row 91, signed with row 92) after the spike.
- Run-out throws `GenerationRunOutError`. No path returns a candidate that failed the L − 1 test.
- Evidence (scratch, `docs/qa/add-difficulty-engine/spike.txt`, not acceptance evidence): at 30 attempts 18 of 6000 (N, level, seed) combinations over seeds 1 to 1000 ran out (15 at 6×6 level 2, 3 at 6×6 level 4); the largest number of attempts needed over seeds 1 to 1000 is 84, and no seed in 1 to 1000 failed at an attempt bound of 500. The fixed seed set must still show 0 run-outs for all 180 combinations (a test). A run-out outside the fixed set is not excluded; DL1 only throws, and the page's handling (a retry, FR-88) is DL2's.
- The tests cannot make `generate` itself hit 100 attempts, so the 100 is pinned by the constant and by the builder test with a small `maxAttempts` (1). The spike found 438 of 1200 combinations (N in 6 and 8, levels 2 to 4, seeds 1 to 200) that need more than one attempt, so the premise of that test holds.

### 8. How level-4 generation stays fast: the chosen construction (task 0.3, evidence `docs/qa/add-difficulty-engine/spike.txt`)

- **Verdict of the spike: TARGET MET** with candidates (a)+(b)+(c)+(d) and the base construction; (e) is not used. The numbers are from a scratch program on a heavily loaded machine (worst of three rounds) and are not acceptance evidence; task 2.9 re-measures on the real code.
- **Construction (unchanged generator).** Fill once (`fillGrid`, as today). Each attempt: one `shuffle` of the positions from the continued stream, then one carving pass in that order with the predicate «the walk at ceiling L solves the board». An attempt is accepted iff the walk at ceiling L − 1 does not solve the carved board. Level 1 accepts attempt 1 unconditionally (no L − 1 test). A retry reshuffles from the continued stream and never refills. At most 100 attempts. FR-83 and FR-84 keep their wording apart from the limit.
- **Speed-ups used (semantics-preserving, byte-identical puzzles for all 180 combinations across candidates 0 and (a) to (d) in the spike):**
  - (a) a sentence-free shared `nextFill(board, ceiling)` used by `hint` and by `solveByRules`;
  - (b) stop the look-ahead scan at the first 0-step candidate. Measured as a no-op (0 of 2463 scans had a 0-step candidate, because a placement that violates at once always implies a technique-1 fill, which runs first). It stays for definiteness and is not credited with any saving;
  - (c) a local violation check (the row and the column through the changed cell: triple, count, duplicate against every other complete line of that axis) instead of `findViolations` inside the look-ahead; in the walk, one full `findViolations` at the start and a local check after each fill. Exact because each check follows exactly one change on a violation-free board. A differential test against `findViolations` is required (the spike's 99911 changes on random boards plus 742 targeted duplicate-line changes had 0 mismatches);
  - (d) a flat `Int8Array` board (−1 empty) with an empties counter, and an undo trail for the look-ahead instead of a board copy per candidate. The spike attributes the real gain to (d); (a) to (c) as Grid rewrites did not give a separate gain at 6×6 level 4 in quiet rounds.
- **Spike numbers (worst of three rounds, 50% target: 100 / 250 / 1500 ms):** candidate 0 (the prototype) failed at 6×6 level 4 (up to 930 ms, 372% of the target; 345 ms in the quietest round) and 8×8 level 4 (2139 ms, 143%). With (a)+(b)+(c)+(d): worst 28.8 ms at 6×6 level 4 (seed 15) and 183.5 ms at 8×8 level 4 (seed 5, under load; about 51 ms quiet), at most 12% of the target at every valid (N, level); 0 run-outs over seeds 1 to 20; golden level 1 identical (60 of 60 and 540 of 540 hashes); exact level, uniqueness and same-solution properties pass for 180 of 180; `hint(board, 4)` on the stalled 8×8 boards A and B at most 0.59 ms (0.6% of 100 ms).
- **Rejected:** (e) a two-pass carving for levels 2 to 4: it added run-outs in the fixed set and did not beat (d) on time.
- **Caveat carried forward:** the (c)/(d) numbers assume `solveByRules` does not run a full `findViolations` per step; re-adding it gives back part of the cost. Task 2.4 and 2.9 keep this.
- **Stop rule (A-36) stays for the real code:** if the real implementation exceeds 50% of any bound, shows a run-out on the fixed seed set, or the hint read exceeds 100 ms, the slice stops and asks; no bound, cap, attempt limit or seed set is touched.

### 9. Module layout

- `src/engine/techniques.ts` (new): `nextFill(board, ceiling)` returns the cell, the value, the technique and the data a sentence needs; the look-ahead; no sentence text.
- `hint.ts`: broken check (FR-26), `nextFill`, the sentence templates (level-1 templates moved unchanged). `rule-solve.ts`: `solveByRules(board, ceiling)`. `generator.ts`: validation, fill, `buildPuzzle`.
- No cycle: `generator` imports `rule-solve`, which imports `techniques` and `rules`; `hint` imports `techniques`.
- The level-1 selection and sentences are moved, not rewritten. `tests/hint.test.ts`, `tests/hint-sentences.test.ts` and the golden file guard them.

### 10. NFR-17 measurement

- The set is fixed in the spec: empty boards of size 4, 6, 8; the givens of the 180 puzzles; boards E and O of each (360); the look-ahead scenario boards; each at ceilings 1 to 4 after a warm-up; worst case under 100 ms.
- The worst case is expected at 8×8 on a board stalled at ceiling 4, where every empty cell is tried with both values (up to 128 propagations of at most 4 steps). Generated givens and partial boards finish early (a simple technique fires), so the set declares two such stalled 8×8 boards explicitly (A and B in the spec, found by random search on a scratch copy: of 8000 random partial boards, 29 were stalled; the prototype took about 7 ms on the slowest). Not measured on the real code yet; the number and its share of 100 ms go to `docs/qa/add-difficulty-engine/timing.txt`.
- If it fails, the speed-ups of decision 8 apply to the hint path; the budget is not relaxed.

### 11. Sentences are provisional (Q6)

- The three templates are the drafts of FR-78 to FR-80, pinned by the tests; the user confirms the final strings in the page slice, and the pinned strings then change deliberately (listed in that slice's test commit).
- Line balance uses «одного нуля / однієї одиниці» and «його / її» (the missing count is always one, so no N dependence); unique lines and look-ahead write the digit as a numeral, as the signed examples do.

### 12. The no-rule sentence changes (FR-25 as amended, autonomy-log row 87)

- The sentence becomes «Жодне з правил зараз не підказує наступного ходу.» (was «Жодне з трьох правил…»); the condition is «no technique allowed to the hint applies (FR-77)». It is the same at every ceiling. The spec's «No-rule hint» requirement is MODIFIED to say so.
- The source change is one constant in `src/engine/hint.ts`. Every test that pins the old sentence changes deliberately (list below).

## Data model

- `Hint = { kind: 'fill', row, col, value, rule, sentence } | { kind: 'none' | 'broken', sentence }`; `rule: 'pair' | 'sandwich' | 'count' | 'balance' | 'unique' | 'lookahead'`; for `lookahead` also `steps: number`. Indices stay 0-based; sentences number from 1.
- `generate(size: number, seed: number, level: number = 1): Puzzle`; `Puzzle` is unchanged. There is no `Level` type: the argument is validated at run time, because a string or `null` must be rejected.
- Internal: `buildPuzzle`, `MAX_ATTEMPTS = 100`, `solveByRules(board, ceiling): { solved, steps }`, `nextFill`. No state, no storage (TC-12), no network (TC-11).
- Golden file `tests/fixtures/level1-golden.json`: for N in 4, 6, 8 and seeds 1 to 20, the stdout text of the unchanged CLI and the solution. Provenance (commit, command, SHA-256) in `docs/qa/add-difficulty-engine/golden-provenance.txt`.

## Error handling strategy

- Generator: type, size and seed errors as before; `InvalidLevelError` for a level that is not an integer from 1 to 4 (`null`, strings, NaN and Infinity included; `undefined` means 1) and for a level above 1 at N = 4; `GenerationRunOutError` after 100 failed attempts. Three distinct classes; the run-out never returns a puzzle.
- CLI: `parseNumber` is reused for `--level` (digits only). A level of `0` or `5` passes the grammar and is rejected by the generator. Every error is one English sentence on stderr, nothing on stdout, exit code 1; the run-out goes through the existing handler. The unknown-option sentence names `--level` (wording not pinned, A-22).
- Hint: a malformed ceiling is out of contract (the baseline exclusion on malformed engine input applies). A board that breaks a rule gets the broken sentence at every ceiling (FR-26).
- The page has no new path in this slice; a run-out on the page is DL2's (A-38). No authentication exists, so no redirect-to-login or forbidden case applies.

## Tests that change deliberately (by FR, with the source sentence)

With the default ceiling 1 (decision 2) the engine tests of FR-24 and FR-27 and the FR-66 page test stay as they are, apart from the sentence below. A scratch run of the unchanged suite against a hint with the new sentence is expected to fail only the tests that pin the old text. The changes, each listed in the test commit by FR with its source:

- **The no-rule sentence.** Source: FR-25 as amended 2026-10-09 (autonomy-log row 87): «Жодне з правил зараз не підказує наступного ходу.». Changed files: `tests/hint.test.ts` (the `NO_RULE` constant), `tests/play-page-hint.test.ts` (line 268, a literal), `tests/helpers/play-page.ts` (`NO_RULE_SENTENCE`, used by many page tests), `tests/generator-rule-solvable.test.ts` (`NO_RULE_SENTENCE`). Only the constant or literal changes; no assertion changes. These tests are red at the red commit (the engine still returns the old text) and green after `src/engine/hint.ts` changes. `tests/hint-sentences.test.ts` has no literal (it asserts shape only).
- `tests/cli.test.ts`, lines 181 and 210 (`['--level', '3']` as the unknown option in FR-54 and NFR-8). Source: FR-85 (`--level` is now a known option). Change: `['--depth', '3']`; the delta scenario «The level option is no longer unknown» pins the new behaviour. This edit is green at the red commit.
- `tests/helpers/hint-type.ts` (task 2.8a): a typing-only identity cast of the public `hint` to the wide type the shim provided; replaces the shim's wide type, no behaviour.
- `solveByRules` gets a default `ceiling = 1`, so its unit tests need no change. The tests of FR-24, FR-27 (walk, fixture) and FR-66 are NOT changed in DL1; the FR-66 hinted-cell page test (after the pair hint the board has a balance fill at ceiling 4) changes in DL2, citing FR-77's page clause (autonomy-log row 88).
- Unchanged on purpose: `tests/generator-timing.test.ts`, `tests/generator-unique.test.ts`, `tests/generator.test.ts`, `tests/hint-sentences.test.ts`, the eval cases (level-1 boards, no old sentence).
- Type-check at the red commit: the pre-commit hook runs `tsc --noEmit` over `tests/`, so new tests reach the new API (ceiling argument, level argument, `steps`, the new errors, `buildPuzzle`, `MAX_ATTEMPTS`) only through the typed shim `tests/helpers/engine-shim.ts` (tasks 1.11, 1.12); the shim is deleted in task 2.8a, a deliberate edit listed in the green commit.
- New files (names are guidance, each test tagged `@trace` with the FR it checks): `hint-line-balance`, `hint-unique-lines`, `hint-look-ahead`, `hint-order-ceiling`, `hint-sentences-techniques`, `hint-budget`, `generator-level`, `generator-run-out`, `generator-level1-golden`, `generator-timing-levels`, `cli-level`.

## Risks and mitigations

- **Level 4 time (A-36).** Task 0.2 before any code; the stop rule; the 50% tripwire; a timing test per (N, level).
- **Attempt bound (A-35).** Raised to 100 by the user after the spike (30 ran out for 18 of 6000 combinations over seeds 1 to 1000; the largest need was 84). The 0-run-out test over the 180 fixed combinations; a miss stops the slice. A run-out for an unseen seed stays possible in principle; the page retries (DL2, FR-88).
- **Level 1 drifts** when the level-1 selection moves into `techniques.ts`. The golden file (60 entries) and the existing hint tests are green at the start and must be green at every commit.
- **Two code paths for violations** (decision 8c, chosen). A required differential test of the local check against `findViolations` on random boards and on targeted duplicate-line changes.
- **The partial-board claim at level 4** (decision 3): a sample can fail. It is reported, not patched.
- **The page keeps today's hints until DL2** (default ceiling 1). The only page-visible change in DL1 is the new no-rule sentence (FR-25). The smoke test checks it.
- **The pinned sentences change later** (Q6). The strings are constants in `hint.ts`, and their tests are in one file.

## Ambiguities found in the requirements

- **A.** FR-77 gives no cell order inside look-ahead; pinned as fewest steps, then row, then column, then v = 0 first.
- **B.** Resolved by the user: FR-25's condition is «no technique allowed to the hint applies» and its sentence is «Жодне з правил…» (row 87).
- **C.** Resolved by the user (row 88): the default ceiling is 1; FR-77's page clause is delivered and verified in DL2, DL1 pins only the engine parameter.
- **D.** FR-79's example writes the digit as a numeral where FR-19 to FR-21 use words; kept as the signed example.
- **E.** FR-27's requirement is renamed in the spec from «…three rules alone» to «…the techniques of its level» (a RENAMED block).
- **F.** The FR-27 consequence at levels 2 to 4 is sampled (decision 3).
- **G.** The choice among several agreeing complete lines (FR-75) is pinned as the lowest; it cannot occur on a board with a solution.
- **H.** FR-23 is modified only to point at FR-77. **I.** `Puzzle` carries no `level`.
- **J (signed reading, FR-26).** FR-26's row says its precedence is over FR-19 to FR-21 and FR-25. The spec widens it to the techniques of FR-74 to FR-76 («a broken board is reported before any technique», every ceiling). This is a reading, not a new rule: techniques 2 to 4 are hints too. It is recorded here and in the archive Exclusions for the user to confirm.

## Modified requirements and why

Reading-forced, because the baseline text would otherwise be false or silent after the change:
- FR-13, FR-14, FR-15, FR-22, FR-27, NFR-1 to NFR-3 and NFR-4, NFR-5: amended in `docs/requirements.md` (row 86).
- FR-25: amended in `docs/requirements.md` (row 87), new sentence and condition.
- FR-23: its text says the order is pair, sandwich, count; with four techniques it must point at FR-77 (the first three keep the order).
- FR-24: additive; extends «only empty cells» to techniques 2 to 4 with one ceiling-4 scenario. Not strictly forced; kept so the guarantee is stated for every ceiling.
- FR-26: the signed reading J.
- FR-53 and FR-54: `--level` joins the digits-only grammar and the set of known options; the old unknown-option scenario used `--level`, so it had to change.
- NFR-8: the level and run-out errors join the scenarios.

## Baseline text edits at archive

Archive normally (not `--skip-specs`) and in the same commit edit the non-requirement text of `openspec/specs/puzzle-engine/spec.md`:

1. **Purpose:** the generator takes a level 1 to 4 (N = 6 and 8 offer all four, N = 4 only level 1) and the hint engine has four techniques.
2. **Test conventions:** the fixed seed set is used by FR-15, FR-27, FR-82, FR-84, NFR-1 to NFR-3 and NFR-16, for (4, 1), (6, 1..4), (8, 1..4); the engine interface line becomes `generate(size, seed, level = 1)`, `hint(board, ceiling = 1)` with the six rule names and `steps`, the errors `InvalidLevelError` and `GenerationRunOutError`; the CLI line gains `--level`.
3. **Exclusions:** replace «The generator takes no difficulty parameter.» and «The CLI never prints the solution and has no options other than the size and the seed.» (the CLI never prints the solution and has `--size`, `--seed`, `--level`); the FR-27 bullet covers (4, 1), (6, 1..4), (8, 1..4); add bullets: the page clause of FR-77 is verified in the play-page capability (DL2); `buildPuzzle`, `MAX_ATTEMPTS`, `solveByRules` and the error classes are test seams, internal and not part of the public interface, and 100 attempts cannot be forced through `generate` in a test, and a run-out outside the fixed seed set is possible in principle; a ceiling outside 1 to 4 is unspecified; N = 4 above level 1 is rejected; FR-26's precedence covers techniques 2 to 4 (reading J, for the user to confirm); a line that cannot be completed without a reported violation within 4 steps is not a contradiction (A-37); the unique-lines case where the two digits of the complete line at the empty positions are equal concerns a board with no completion and is not scenario-tested (decision 1); the golden-file check is a sample of 60 seeds.
4. **Exclusions, specified error paths:** extend the list of specified error paths with a level that is not an integer from 1 to 4, a level above 1 at N = 4, a CLI level that breaks the grammar or is missing, and a generator run-out (`GenerationRunOutError`).
5. Afterwards `npx openspec validate --all --strict`, `node scripts/check-traceability.mjs` (FR-74 to FR-86, NFR-16, NFR-17 cited and traced) and a grep of the baseline for «no difficulty» and «three rules alone».
