# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-10-06 15:15:00 (UTC+5:30; Kyiv 12:45)
- **Current phase:** Phase 4
- **Last completed gate:** G3
- **Active change:** none (slices 1 to 3 are archived)
- **Progress:** **2026-10-06:** coding conventions and version-matched framework docs adopted by the user's decisions (ADR-0003, accepted). Changes: `docs/coding-conventions.md`; `.vendor-docs/` (Vite 8.3.2 and Vitest 5.0.3 docs, `npm run check:docs`); `tsconfig.json` aligned with create-vite 9.2.1; type-aware typescript-eslint strict + stylistic for TypeScript; `restoreMocks: true`; a two-sentence `AGENTS.md` pointer. Committed and signed on the user's go-ahead: `7b76610` (docs and vendored docs) and `ba430c5` (config and code, `Refs: TC-1, TC-4`). The records follow in the next commit, on branch `claude/vite-coding-conventions-a4b96a` (worktree `vite-coding-conventions-a4b96a`, base `cd90dca`). Not pushed. Earlier: slice 3 `add-size-selector` (FR-43, restored by the user, autonomy-log rows 22 and 24) is implemented, reviewed and archived, test-first, at about 22:45, about 45 minutes ahead of the 23:30 target. Slices 1 and 2 as before (archived 20:20 and 20:50). No cut line applied. P0–P3 are unchanged (claims below).
  - Commit and tag order, slice 3: change `a3adf3c` (`step-25-s3-change`), revised change `41b7730`, red tests `47b25bd` (`step-26-s3-red`) and `ca12f12` (24th test, red evidence 67 red), green `d7613cf` (`step-27-s3-green`), review fix round `8b52593` (`step-28-s3-fix1`), archive commit (`step-29-s3-archived`). Slice 2: tags `step-19` to `step-23`; slice 1: `step-13` to `step-18`.
  - **Signing:** every commit in this branch's history is signed (`git log --format='%G?' | sort | uniq -c` gives 37 `G`, 0 `N`, checked 2026-10-04 about 22:57). The slice 3 commits were re-signed on that date by a forced rebase (tags `step-26` to `step-29` re-pointed; the unsigned originals are on the local branch `backup/slice3-unsigned-6877f25`), so the slice 3 SHAs in this file are the re-signed ones.
- **Next task:** (0) two items the user asked for on 2026-10-06. First, a proposal for UI conventions (HTML, CSS, DOM, accessibility; not covered yet, `docs/coding-conventions.md` §8): research is running, and the user decides what to adopt. Second, an answer on path- and role-scoped loading of conventions (frontend versus backend agents). Then the user decides (1) what to do about the failed NFR-6 hint-quality eval (the hint sentences are pinned in the signed puzzle-engine spec; count 76 against a pass mark of 80), (2) the new request from about 21:40: a rules block for new players and a reset button (autonomy-log row 27; a requirements amendment to sign, then slice 4 `add-rules-and-reset`; reset keeps the puzzle and clears the player's entries). Then `npm run retro:digest`, the PR text and the README branch. Re-sign the unsigned commits when the user has cached the GPG passphrase.
- **Claims:**
  - G0 passes: lint, build, hooks fire, `core.hooksPath` is `.githooks` — evidence: `npm run gate:status`, commits `cbc84fa` and `4ed10a8`, tag `step-02-factory-init`
  - Factory integrity lock holds 23 gate-bearing files with 6 recorded adaptations — evidence: `factory-lock.json`
  - G1: requirements signed off by the user, amendment re-signed — evidence: `docs/autonomy-log.md` rows 7 and 11, tags `step-07-p1-signoff` and `step-09-p1-amend` (`gate:status` prints "needs sign-off" because it cannot see a human sign-off)
  - G2: both baseline specs pass `npx openspec validate --all --strict`, and every one of the 46 MVP FRs is cited by a spec — evidence: `docs/qa/traceability-report.md`, tag `step-10-p2-specs`
  - G3: capability plan signed off by the user, and every MVP FR/NFR row declares a real mechanism — evidence: `docs/mvp-capability-plan.md` Status line, `docs/autonomy-log.md` row 12, tag `step-11-p3-signoff`, `trace/acceptance-contracts.json`
  - Slice 1 (engine and CLI) was test-first, red then green, reviewed and archived: red 233 failed and 38 passed of 271 — evidence `docs/qa/add-puzzle-engine-red-run.txt`, tag `step-15-s1-red`; green 271 of 271 — tag `step-16-s1-green`; review-gate round 1 `wf_01e59347-3e4` (3 minor, fixed `50840e8`), confirming run `wf_f8542286-f1c` (1 minor documentation defect, fixed by hand, not re-run, so its evidence file says `clean: false`) — evidence `openspec/changes/archive/2026-10-04-add-puzzle-engine/review-findings.json`; archived `c074469`, tag `step-18-s1-archived`. One test (FR-6 duplicate columns) was corrected deliberately in `cb45d4e` because it could never pass (autonomy-log M9). Worst-case generation: 4×4 0.6 ms, 6×6 2.1 ms, 8×8 15.4 ms (implementer, `tsx`); a later sweep of 30,000 random 6×6 seeds had no throw, no non-unique puzzle and a worst case of 5.6 ms (orchestrator, 20:40).
  - Slice 2 (play page) was test-first, red then green, reviewed and archived: red 68 failed and 24 helper self-checks passed of 92 — evidence `docs/qa/add-play-page-red-run.txt`, tag `step-20-s2-red` (the test-engineer also ran a reference implementation, all 92 passed, and 14 mutants, all caught); green: page tests 92 of 92, full suite 363 of 363, lint, tsc, build and `npx openspec validate --all --strict` pass — run at 20:48 on commit `dfb8f60`, tag `step-21-s2-green`; review-gate round 1 `wf_421a44c2-0ea` (2 minor documentation findings, 3 rejected robustness remarks, no code defect; fixed in `dfb8f60`), confirming run `wf_84916d1b-463` (four finders returned empty lists after 30 tool calls in all, `clean: true`) — evidence `openspec/changes/archive/2026-10-04-add-play-page/review-findings.json`.
  - Page smoke (stands in for the DB smoke flow): `npx vite` served `/`, `/src/main.ts` and `/src/ui/style.css` with 200 (implementer, about 20:37, and orchestrator, 20:38); the orchestrator then looked at the page in the built-in browser: grid, grey bold givens, red three-in-a-row highlight, broken-board hint sentence, a hint that filled the pair-rule cell with its Ukrainian sentence, new puzzle, and a 375-wide phone layout all looked right. One click on «Нова головоломка» right after a hint press did not change the board in a screenshot; three repeats worked and nothing explains it, so it is recorded as an unreproduced observation (autonomy-log row 20). jsdom cannot see rendering and no real-browser test exists (TC-13, NFR-7 Future).
  - Slice 2 CLI smoke for slice 1 (task 5.9): 6×6 seed 42 prints 6 lines of 6 tokens, exit 0, repeat identical; defaults, leading zeros and every invalid token behave as specified — run 2026-10-04 about 20:10.
  - Slice 3 (size selector, FR-43) was test-first, red then green, reviewed and archived: red 67 failed and 351 passed of 418 (24 new selector tests, 32 slice-2 page tests that call `expectPageStructure`, 11 new tests in extended files; the orchestrator re-ran it in a scratch copy with `src/` from `47b25bd`) — evidence `docs/qa/add-size-selector-red-run.txt`, tags `step-26-s3-red`; green: full suite 418 of 418 (page tests and helper self-checks 147, engine and CLI 271), lint, build and `npx openspec validate --all --strict` pass — run 22:19 on `d7613cf` and again 22:36 on the archive tree, tag `step-27-s3-green`; review-gate round 1 `wf_0bc461db-6d2` (1 minor documentation defect fixed in `8b52593`, no code defect), confirming run `wf_0e97aafa-73f` (four finders returned empty lists, `clean: true`) — evidence `openspec/changes/archive/2026-10-04-add-size-selector/review-findings.json`; archive with a normal merge (+1 added, ~7 modified) and the seven manual baseline text edits; `npm run check:trace`: 47 MVP FRs, 0 failures, FR-43 has 11 tests (`docs/qa/traceability-report.md`). Deviation: the implementation was committed from a fork session's uncommitted edits, which I reviewed against the design and verified, and I did not run the `capability-implementer` myself (autonomy-log row 28).
  - Real-browser check of slice 3 (TC-13, 2026-10-04 22:20 to 22:25, built-in browser, `npx vite` served by a server already running on port 5199 from this worktree): the select shows «Поле 6×6» with a 6×6 board; choosing 4×4 gives 16 cells and a hint filled one cell with its Ukrainian sentence (`docs/qa/add-size-selector/4x4-hint-desktop.jpg`), choosing 8×8 cleared that sentence and gave 64 cells (`docs/qa/add-size-selector/8x8-desktop.jpg`); at a 375 px wide phone the 8×8 board is 343 px wide with square 41.1 px cells and `scrollWidth` 375, so no horizontal scroll (`docs/qa/add-size-selector/8x8-mobile-375.jpg`); three zeros side by side in an 8×8 row turned red (`docs/qa/add-size-selector/8x8-mobile-375-three-in-a-row.jpg`); five zeros with no three in a row turned the whole 8-cell row red, including the empty cell (`docs/qa/add-size-selector/8x8-mobile-375-count-whole-row.jpg`); «Нова головоломка» at 8×8 kept 8×8 with empty player entries and no highlights; 6×6 and 4×4 at 375 px (`docs/qa/add-size-selector/6x6-mobile-375.jpg`, `docs/qa/add-size-selector/4x4-mobile-375.jpg`); a reload went back to 6×6; no console errors. The earlier unexplained «Нова головоломка» no-op was not seen again in this check. I did not stop the dev server on port 5199 (it was not started by this session) and I reset the viewport to desktop.
  - Acceptance artifacts: `npm run check:acceptance:artifact` now prints PASS (54 contracts), but only because the NFR-6 eval artifact file exists; it checks existence, not scores, and **NFR-6 is FAIL** (pair 82, sandwich 88, count 76 against 80) — evidence `docs/qa/eval-report.md`, `trace/acceptance-contracts.json`. `npm run check:trace`: 47 MVP FRs, 0 failures. `npm run check:trajectory`: PASS, 3 archived slices, 1 warning (slice 1 review evidence unclean).
  - `npm audit`: 0 vulnerabilities after the user-approved `@types/node@22.20.5` (autonomy-log row 15).
  - ADR-0003 adoption (committed `7b76610` and `ba430c5`, signed) — evidence `docs/qa/adr-0003-adoption.md`:
    - After the commits, `gate:status` shows G4 and G8 PASS again, G5 and G6 NOT-EARNED, and G7 FAIL, as on 2026-10-04. `check:trajectory`: PASS, 1 warning.
    - Battery before the commits: `tsc` 0; lint 0 problems over 41 files; 418 of 418 tests; build passes; strict validation 2 of 2; `check:docs` OK.
    - An engine behaviour snapshot (463 records, sha256 `0d47317e…`) and the CLI output for nine cases were byte-identical before and after.
    - An independent `code-reviewer` found no blocker or major. All six of its findings were addressed, and the fixes were not re-reviewed.
  - Scope NOT delivered: NFR-6 hint-quality eval (**FAIL**, count hint 76 against 80, `docs/qa/eval-report.md`; the user's decision), the rules block and reset button requested at about 21:40 (slice 4, not started, autonomy-log row 27), FR-18 (sizes 10 to 16), FR-27, FR-44 to FR-48, FR-55, FR-56, NFR-7 (all Future). FR-43 is delivered (evidence above). `npm run gate:status` at 22:36: G0 PASS, G1 and G3 "needs sign-off" (a human sign-off the script cannot see), G2 PASS, G4 PASS (only because the NFR-6 artifact check tests file existence), G5 NOT-EARNED, G6 NOT-EARNED, **G7 FAIL** (by the user's decision, no Playwright), G8 PASS on traceability only. The header keeps G3 as the last completed gate.
  - Observation, not a defect: generated puzzles are sparse (average givens 4×4 4.7 of 16, 6×6 8.3 of 36, 8×8 13.2 of 64), so a hint often answers "no rule applies" (FR-25; FR-27 is Future).

> This header is machine-read: keep the exact formats `Phase <N>` and `G<N>`,
> and give every done/verified claim an evidence path — `gate-status`
> hard-fails on divergence between this header and computed gate status.

## Source Of Truth

1. `AGENTS.md` — project agent rules.
2. `docs/current-state.md` — this handoff.
3. `docs/requirements.md` — canonical FR/NFR/TC/BC requirements (signed off 2026-10-04 16:13, amendment re-signed 18:45).
4. `docs/product-brief.md` — product narrative (signed off 2026-10-04).
5. `docs/mvp-capability-plan.md` — change sequence and scope (signed off 2026-10-04 18:54).
6. `openspec/config.yaml` + `openspec/specs/` — accepted behavior (`puzzle-engine`, `play-page`).
7. `docs/adr/` — ADR-0001 stack, ADR-0002 context architecture, ADR-0003 coding conventions and vendored framework docs (`docs/coding-conventions.md`, `.vendor-docs/`).
8. `docs/qa/` — QA proof pack and recordings.
9. `docs/autonomy-log.md` and `docs/budget.md` — kept live; update them at every phase.

## OpenSpec Status

```bash
npx openspec validate --all --strict   # 2 specs, both pass
npx openspec list                      # expected: No active changes (all slices archived)
```

Archived changes: `2026-10-04-add-puzzle-engine`, `2026-10-04-add-play-page`, `2026-10-04-add-size-selector`.

## Open items and risks

- `npm audit`: 0 vulnerabilities after the user-approved downgrade of OpenSpec to 0.17.2 (exact pin; the 1.x line pulled in a vulnerable `braces`). OpenSpec 0.17.2 is older than the version `init` created `openspec/config.yaml` with; `validate` and `list` run, but re-check scenario and delta-spec behaviour when the first spec is written.
- `@vitest/coverage-v8@5.0.3` is installed and `npm run test:coverage` is real (json-summary reporter, `src/**`). CI does not run it yet: adding it to the locked `ci.yml` needs a re-lock or a `Refs: PD-x` commit once the first tests exist (slice 1). G5 is "try to fit in", not promised.
- `recordings`, `visual-fidelity` and `eval-ratchet` remain in the battery and will show NOT-EARNED.
- `npm audit`: 0 vulnerabilities after adding the user-approved `@types/node@22.20.5` (autonomy-log row 15); `tsconfig.json` `types` now lists `node`.
- The branch has not been pushed. Pushing to the public remote is the user's call.
- P0–P3 commits live on the worktree branch `claude/binarka-p1-requirements-45688c` (tags `step-06` to `step-11`); `main` does not have them yet. Session C must start from this branch (or the user merges it into `main` first). Merging and pushing are the user's call.
- Process-defect candidate (for the retro, not fixed: the scripts are locked harness files): `gate-status` counts G1 "needs sign-off" as earned for the frontier and prints G2 PASS over zero specs, so the computed frontier reads G2 with no sign-off and no specs behind it.
- G7 will report FAIL: it runs `traceability --release --strict-recordings`, which needs a recording manifest for every MVP FR and takes no waiver. The user decided at the plan sign-off not to add Playwright (autonomy-log row 12).
- NFR-1 to NFR-3 timing bounds may be flaky in CI; NFR-5 forbids Latin letters in all user-facing text, CLI errors included.
- Hooks are per clone: `git config core.hooksPath .githooks`.
- The worktree `vite-coding-conventions-a4b96a` has `core.hooksPath` set to the main checkout's absolute `.githooks` path. `check:integrity` warns about it. It was left unchanged, because git config is level 1.
- After a Vite or Vitest upgrade, run `npm run docs:vendor`; `npm run check:docs` fails until the copy matches. `check:docs` is not in CI: `ci.yml` is locked.
