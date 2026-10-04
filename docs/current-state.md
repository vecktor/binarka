# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-10-04 15:00:00 (UTC+5:30)
- **Current phase:** Phase 0
- **Last completed gate:** G0
- **Active change:** none
- **Progress:** P0 is finished. The stack is decided (ADR-0001, accepted by the user), the Vite + TypeScript + Vitest + ESLint scaffold builds and lints, and the Project Factory loop is installed with git hooks, CI, OpenSpec, agent frontmatter and the integrity lock. No product code and no requirements exist yet. `gate:status` prints G2 PASS, but that is vacuous: there are no specs and no requirements, so it checks nothing and must not be claimed.
- **Next task:** P1 in session B (Opus 5.5, medium). Read `docs/budget.md` and the usage meters, then run the `requirements-analyst` with the user to write `docs/product-brief.md` and `docs/requirements.md` (plain IDs `FR-1`; tags `local-verifiable`, plus `eval` only if kept). End at the user's scope sign-off. Re-confirm the grid-size decision (autonomy-log row 2a) in that sign-off.
- **Claims:**
  - G0 passes: lint, build, hooks fire (empty commit ran them), `core.hooksPath` is `.githooks` — evidence: `npm run gate:status`, commits `cbc84fa` and `4ed10a8`, tag `step-02-factory-init`
  - Factory integrity lock holds 23 gate-bearing files with 6 recorded adaptations — evidence: `factory-lock.json`

> This header is machine-read: keep the exact formats `Phase <N>` and `G<N>`,
> and give every done/verified claim an evidence path — `gate-status`
> hard-fails on divergence between this header and computed gate status.

## Source Of Truth

1. `AGENTS.md` — project agent rules.
2. `docs/current-state.md` — this handoff.
3. `docs/requirements.md` — canonical FR/NFR/TC/BC requirements (not written yet).
4. `docs/product-brief.md` — product narrative (not written yet).
5. `docs/mvp-capability-plan.md` — change sequence and scope (not written yet).
6. `openspec/config.yaml` + `openspec/specs/` — accepted behavior (no specs yet).
7. `docs/adr/` — ADR-0001 stack, ADR-0002 context architecture.
8. `docs/qa/` — QA proof pack and recordings.
9. `docs/autonomy-log.md` and `docs/budget.md` — kept live; update them at every phase.

## OpenSpec Status

```bash
npx openspec validate --all --strict   # no specs yet
npx openspec list                      # expected: No active changes
```

Archived changes: none.

## Open items and risks

- `npm audit` reports 4 high findings in OpenSpec's transitive `braces` dev dependency; the only offered fix is a forced downgrade to 0.17.2. CI audits shipped dependencies only (`--omit=dev`); G7 as shipped does not, so decide before release.
- `test:coverage` fails on purpose until `@vitest/coverage-v8` is approved and installed; G5 is not planned tonight.
- `recordings`, `visual-fidelity` and `eval-ratchet` remain in the battery and will show NOT-EARNED.
- The branch has not been pushed. Pushing to the public remote is the user's call.
- Hooks are per clone: `git config core.hooksPath .githooks`.
