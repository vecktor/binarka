# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-10-04 20:55:00 (UTC+5:30; Kyiv 18:25)
- **Current phase:** Phase 4
- **Last completed gate:** G3
- **Active change:** none (both MVP slices are archived)
- **Progress:** slice 1 `add-puzzle-engine` and slice 2 `add-play-page` are implemented, reviewed and archived, test-first, both about 2.5 hours ahead of the plan table (slice 1 archived 20:20, slice 2 20:50; plan: 21:25 and 23:25). No cut line applied in session C. P0–P3 are unchanged (claims below).
  - Commit and tag order, slice 2: change `383c529` (`step-19-s2-change`), red tests `d2a0174` (`step-20-s2-red`), green `1f336b9` (`step-21-s2-green`), review fix round `dfb8f60` (`step-22-s2-fix1`), archive commit with the tasks and README after that. Slice 1: see tags `step-13` to `step-18`.
  - **Commits from `383c529` onward are UNSIGNED** (the GPG cache expired; the user allowed unsigned commits to be re-signed later in one batch, autonomy-log M8 and row 19). Find them with `git log --format='%h %G? %s'` (the `N` rows). Re-signing rewrites SHAs, so the `step-19` onward tags must be re-pointed.
- **Next task:** the user decides (1) whether to restore the size selector FR-43 (stretch, plan section 6; do not restore it without asking), (2) whether to run the optional hint-quality eval (NFR-6, plan 4.3, `eval-suite`), then `npm run retro:digest`, the PR text and the README branch. Re-sign the unsigned commits when the user has cached the GPG passphrase.
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
  - Acceptance artifacts: `npm run check:acceptance:artifact` fails only on NFR-6 (no eval artifact) — evidence `trace/acceptance-contracts.json`. `npm run check:trace`: 46 MVP FRs, 0 failures. `npm run check:trajectory`: PASS, 2 archived slices, 1 warning (slice 1 review evidence unclean).
  - `npm audit`: 0 vulnerabilities after the user-approved `@types/node@22.20.5` (autonomy-log row 15).
  - Scope NOT delivered: NFR-6 hint-quality eval (NOT-EARNED, no eval run yet), FR-43 size selector (cut 0, NOT-EARNED), FR-18, FR-27, FR-44 to FR-48, FR-55, FR-56, NFR-7 (all Future). `npm run gate:status` at 20:49: G0 PASS, G1 and G3 "needs sign-off" (a human sign-off the script cannot see), G2 PASS, **G4 FAIL** (acceptance artifact for NFR-6), G5 NOT-EARNED, **G6 FAIL**, **G7 FAIL** (by the user's decision, no Playwright, and the same NFR-6 artifact), G8 PASS on traceability only.
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
7. `docs/adr/` — ADR-0001 stack, ADR-0002 context architecture.
8. `docs/qa/` — QA proof pack and recordings.
9. `docs/autonomy-log.md` and `docs/budget.md` — kept live; update them at every phase.

## OpenSpec Status

```bash
npx openspec validate --all --strict   # 2 specs, both pass
npx openspec list                      # expected: No active changes (both slices archived)
```

Archived changes: `2026-10-04-add-puzzle-engine`, `2026-10-04-add-play-page`.

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
