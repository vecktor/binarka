# Change: add-rule-solvable-generator

## Why

Today a generated puzzle is only guaranteed to have exactly one solution (FR-15). Uniqueness does not mean that the three hint rules can finish it (A-5): `docs/current-state.md` records that generated puzzles are sparse and that a hint often answers «Жодне з трьох правил зараз не підказує наступного ходу.» even when the player has made no mistake. UX decision 7 of the amendment signed on 2026-10-05 about 23:31 (autonomy-log row 66) moved FR-27 from Future to MVP: every puzzle the generator returns for N = 4, 6 and 8 must be solvable from its givens by the pair, sandwich and count rules alone, so a hint is always available on a board whose entries agree with the solution. This is slice F of `docs/mvp-capability-plan.md` section 4.8. It is engine only (no DOM) and independent of the UI slices A to E.

## What Changes

- A new engine check, `solveByRules`, repeats the hint engine's fill from a board until no empty cell remains or a call returns no fill (FR-27, A-31). It lives in `src/engine/rule-solve.ts` and is not part of the public `index.ts`.
- The generator accepts a candidate puzzle only if this check passes (A-31). The candidate is built by construction: the carving phase removes a given only if the board is still rule-solvable after the removal. The fill phase and its random draws stay exactly as they are, so the solution for every seed is unchanged; only the givens change.
- The budgeted solver check in the carving loop is replaced (a rule-solvable puzzle is unique by soundness, see `design.md`). FR-15 stays checked by the solver and the independent oracle in the existing tests.
- Stop condition (A-31): if the check cannot keep NFR-1 to NFR-3, the slice stops and an amendment is raised. The bounds are never relaxed. See `design.md` and task 2.6.
- Spec: one ADDED requirement of `puzzle-engine`, «Every generated puzzle is solvable by the three rules alone» (FR-27). No baseline requirement is MODIFIED or REMOVED. «No-rule hint» (FR-25) stays as it is: it still describes boards that carry player errors or no entries (A-5).

Out of scope: difficulty grading (FR-44, Future); N = 10 to 16 (FR-18, Future, no claim); any page change (the page already shows the engine's hint); other hint rules (X-wing and the like); relaxing a timing bound.

## Impact

- Affected specs: `puzzle-engine` (1 ADDED). Normal merge at archive (not `--skip-specs`), then the hand edits of non-requirement text listed in `design.md` (the Exclusions bullet that calls FR-27 Future, the test conventions, the Purpose).
- Affected code: `src/engine/generator.ts` (carving predicate, unused constant and import removed), new `src/engine/rule-solve.ts`. `src/engine/hint.ts`, `solver.ts`, `rng.ts`, `rules.ts`, `src/cli.ts` and `src/ui/` are unchanged. No dependency added.
- Affected tests: new `tests/generator-rule-solvable.test.ts`. No existing test changes deliberately (evidence in `design.md`); `tests/generator-timing.test.ts`, `tests/generator-unique.test.ts` and `tests/generator.test.ts` must pass unchanged. Output of the CLI and the page for a given seed now has other givens (the same solution); no test pins those givens literally.
- Commits that touch `src/` carry trailers `Slice: add-rule-solvable-generator` and `Refs: FR-27`.
