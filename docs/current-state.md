# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-10-04 20:20:00 (UTC+5:30; Kyiv 17:50)
- **Current phase:** Phase 4
- **Last completed gate:** G3
- **Active change:** add-puzzle-engine (implemented and reviewed, archive pending in the next commit); next is `add-play-page`
- **Progress:** slice 1 `add-puzzle-engine` is implemented and test-first. P0–P3 are unchanged (see the claims below).
  - Order of work: change folder `d77d09a` (tag `step-13-s1-change`), `@types/node` approved by the user `8267f29` (`step-14-s1-deps`), red tests and stubs `5595e74` (`step-15-s1-red`), green `cb45d4e` (`step-16-s1-green`), review-gate fix round `50840e8` (`step-17-s1-fix1`).
  - Slice 1 timing: started 19:05, green at 20:10, confirming review run done 20:19, against the plan of about 21:25 and the cut line 4 limit of 22:00. No cut line applied in this session.
- **Next task:** archive slice 1 (`npx openspec archive add-puzzle-engine --skip-specs --yes`), read the usage meters, then build slice 2 `add-play-page` per `docs/mvp-capability-plan.md` section 4.2 (due about 23:25, freeze 00:00 user time). **Stretch:** if slice 2 is archived before about 23:00, ask the user whether to restore the size selector FR-43 (plan section 6); do not restore it without asking.
- **Claims:**
  - G0 passes: lint, build, hooks fire, `core.hooksPath` is `.githooks` — evidence: `npm run gate:status`, commits `cbc84fa` and `4ed10a8`, tag `step-02-factory-init`
  - Factory integrity lock holds 23 gate-bearing files with 6 recorded adaptations — evidence: `factory-lock.json`
  - G1: requirements signed off by the user, amendment re-signed — evidence: `docs/autonomy-log.md` rows 7 and 11, tags `step-07-p1-signoff` and `step-09-p1-amend` (`gate:status` prints "needs sign-off" because it cannot see a human sign-off)
  - G2: both baseline specs pass `npx openspec validate --all --strict`, and every one of the 46 MVP FRs is cited by a spec (traceability: 0 failures) — evidence: `docs/qa/traceability-report.md`, tag `step-10-p2-specs`, workflow run `wf_4388e25c-d35`
  - G3: capability plan signed off by the user, and every MVP FR/NFR row declares a real mechanism — evidence: `docs/mvp-capability-plan.md` Status line, `docs/autonomy-log.md` row 12, tag `step-11-p3-signoff`, `trace/acceptance-contracts.json`
  - Slice 1 tests were written first and seen red: 233 failed and 38 passed of 271 against stubs, the "exactly one solution" test red against a naive generator — evidence: `docs/qa/add-puzzle-engine-red-run.txt`, tag `step-15-s1-red`
  - Slice 1 is green: `npm run test:run` 271 of 271 passed, `npm run lint` clean, `npm run build` passes, `npx openspec validate --all --strict` passes 3 of 3 — evidence: commands run at 20:15 on commit `50840e8`; tag `step-16-s1-green`. One test (FR-6 duplicate columns) was corrected deliberately in `cb45d4e`: its expected cells were in the wrong order, so no implementation could pass (autonomy-log M9).
  - Slice 1 acceptance artifacts: every slice-1 FR/NFR row (FR-1 to FR-17, FR-19 to FR-26, FR-28 to FR-30, FR-49 to FR-54, NFR-1 to NFR-5, NFR-8) resolves to a real tagged test — evidence: `npm run check:acceptance:artifact` (the only failures are FR-31 to FR-42, not built yet, and NFR-6, not graded) and `trace/acceptance-contracts.json`
  - Slice 1 CLI smoke run (stands in for the DB smoke flow, task 5.9): 6×6 seed 42 prints 6 lines of 6 tokens, exit 0, nothing on stderr, repeat run identical; defaults, leading zeros, missing value, unknown option and every invalid size token behave as specified — run on 2026-10-04 at about 20:10, recorded in this file and `openspec/changes/add-puzzle-engine/tasks.md` 5.9
  - Slice 1 review-gate: round 1 `wf_01e59347-3e4` found 3 confirmed minor findings (fixed in `50840e8`); the confirming run `wf_f8542286-f1c` confirmed 1 minor documentation defect (a stale line in `tasks.md` 5.3), which was fixed by hand and **not re-run** under the one-confirming-run rule. Its evidence file therefore says `clean: false` and is not edited — evidence: `openspec/changes/add-puzzle-engine/review-findings.json`. No correctness or security defect was found by either run.
  - Worst-case generation time over seeds 1 to 20, measured by the implementer with `tsx` outside Vitest: 4×4 0.6 ms, 6×6 2.1 ms, 8×8 15.4 ms; the Vitest timing tests (NFR-1 to NFR-3) pass — evidence: `tests/generator-timing.test.ts` in the 271-test run.
  - Scope NOT delivered: NFR-6 hint-quality eval (NOT-EARNED until graded after slice 2), FR-18 (sizes 10 to 16 tested), FR-27 (rule-solvable guarantee), FR-56 (English hints), FR-43 (size selector, cut 0), all play-page behaviour (FR-31 to FR-42, slice 2). G4 to G8 are not earned: `npm run gate:status` reports G4 FAIL, G5 NOT-EARNED, G6 FAIL, G7 FAIL (by the user's decision, no Playwright), G8 PASS on traceability only.
  - Observation, not a defect: generated puzzles are sparse (average givens: 4×4 4.7 of 16, 6×6 8.3 of 36, 8×8 13.2 of 64), so a hint often answers "no rule applies" (FR-25; FR-27 is Future). Slice 2 should not promise a hint on every board.

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
7. `docs/adr/` — ADR-0001 stack, ADR-0002 context architecture.
8. `docs/qa/` — QA proof pack and recordings.
9. `docs/autonomy-log.md` and `docs/budget.md` — kept live; update them at every phase.

## OpenSpec Status

```bash
npx openspec validate --all --strict   # 2 specs, both pass
npx openspec list                      # expected: No active changes
```

Archived changes: none.

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
