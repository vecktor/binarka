# Autonomy log (Бінарка)

Kept live while working. Levels: 1 assistant (human decides each action), 2 assistant→agent (edits itself, commands need permission), 3 agent (reaches the goal, brings evidence), 4 parallel subagents (human merges), 5 autonomous.

Three questions before each row: how fast will I notice a mistake, how cleanly can I roll back, what evidence will convince me.

## Work rows

| # | Date | Task | Level | Decided by | Evidence | Why this level |
|---|---|---|---|---|---|---|
| 1 | 2026-10-04 | Choose the project: build Бінарка from scratch | 1 | **User** | brief `binarka-brief.md` (outside repo); this row | User chose it after playing four previews (Бінарка, Ковзанка, Вимикач, Цариця). Not importing or simplifying the older puzzle project. |
| 2 | 2026-10-04 | P0: read brief and course notes, check repo and plugin, draft budget and this log | 3 | User (instruction) | `docs/budget.md`, this file, commit tagged `step-00-p0-start` | Docs only, trivially reversible by git. |
| 2a | 2026-10-04 | Grid size: engine takes N as a parameter (N = 4, 6, 8 tested); UI defaults to 6×6; size selector is a cut-line item, dropped first; N ≥ 10 is "later" | 1 | **User** (agent estimated about 10–20% extra work, mostly tests and generator speed, and recommended this) | this row; to be carried into `docs/requirements.md` in P1 | Cheap to build generic; the selector is the only piece that can be cut without touching the engine. Replies "that's fine" to the agent's recommendation, so P1 should re-confirm it in the scope sign-off. |
| 3 | 2026-10-04 | P0: stack ADR | 1 | **User decides**, agent proposes | `docs/adr/0001-stack.md` (accepted) | A stack choice shapes every later step; permanent level 1. |
| 4 | 2026-10-04 | Persistent config: dependencies, `/project-factory:init`, git hooks, `.claude/settings.json` PostToolUse hook, agent model/effort frontmatter, workflow options, CI, integrity lock | 1 | **User approved** ("Yes, I accept" to the ADR, the dependency list and init); agent executed | commits `step-01-scaffold`, `step-02-factory-init`; `factory-lock.json` adaptations | Harness files, hooks and dependencies are a permanent level-1 boundary. Frontmatter values come from the user's brief table. |
| 5 | 2026-10-04 | Dependency changes after P0: pin `@fission-ai/openspec` to 0.17.2 (fixes 4 high `npm audit` findings), add `@vitest/coverage-v8@5.0.3` | 1 | **User** (asked the agent to downgrade and to try fitting coverage in; the agent proposed neither) | commit `step-04-deps`; `npm audit`: 0 vulnerabilities | Dependencies are a permanent level-1 boundary; the agent had offered a forced downgrade only as a fix and had not applied it. |
| 6 | 2026-10-04 | P1: draft `docs/product-brief.md` and `docs/requirements.md` with the `requirements-analyst` (Opus, medium); one batched clarification list | 2 drafting, 1 scope | Agent drafts; **user decides** every scope item at the sign-off | commit `a1d3c70` (signed), tag `step-06-p1-draft`; sign-off in row 7 | Drafts are docs only and reversible; scope is a level-1 decision under L1, so every ambiguity waits for the user. |
| 7 | 2026-10-04 | P1 scope sign-off: answers to the 14 clarifications | 1 | **User** | `docs/requirements.md` Status line and Assumptions & Notes; diff `step-06-p1-draft..step-07-p1-signoff` | Scope is a level-1 decision. Answers: 1 Ukrainian (the user first wrote "US language"; asked whether that meant UA or US, picked "US English" in the dialog, then reversed: "let's keep it Ukrainian"); 2 digits; 3 "new puzzle for now" (no levels); 4–8 defaults (seed not shown; hint fills one cell and explains; no rule applies → says so, fills nothing; broken board → asks to fix first; grid size as in row 2a, **re-confirmed**); 9 keep the eval; 10–12 defaults (CLI shape, locked givens, highlight after every change, 200 ms / 500 ms / 3 s bounds); 13 size selector is cut 0, before cut line 1; 14 the "new puzzle" button stays if slice 2 shrinks at cut line 3. |
| 8 | 2026-10-04 | P2: baseline OpenSpec specs through the `spec-pipeline` workflow (spec-writer drafts on Sonnet/high, critique, revise, cross-capability coverage check) for `puzzle-engine` and `play-page` | 3 (parallel subagents inside one workflow) | **User approved the split** ("split looks fine"); agent assigned the travelling NFRs: NFR-1..4 and NFR-6 to `puzzle-engine` (NFR-6 grades engine output), NFR-5 to both, each for its own text | `openspec/specs/*/spec.md`; `npx openspec validate --all --strict`; workflow run `wf_4388e25c-d35`; tag `step-08-p2-specs` | Specs are reversible docs checked by strict validation and a fresh coverage reader; no scope may be invented beyond the signed-off requirements. |

## Raises

None yet.

## Lowerings

| # | Date | From → to | What happened | Decided by |
|---|---|---|---|---|
| L1 | 2026-10-04 | Interpreting the task and scope: 3 → 1 | The agent misread "simplify my puzzles project" as a brownfield import (see mistake M1). Since then the agent confirms its reading of scope with the user before acting on it. | Proposed by agent after the user's correction; **confirmed by the user on 2026-10-04**, as described: the agent states its reading of ambiguous scope and waits; scope changes and conflicts between artifacts also wait for the user. Pre-agreed cut lines from the brief are applied and logged without asking; dependency, harness and push approvals are unchanged. |

## Escalations deliberately not taken

- Letting the agent start `/project-factory:init` as soon as the plugin was found. Init writes hooks, settings and many files at the repo root, so it waits for the stack decision and the user's approval.

## Permanent level-1 boundaries

- Harness files: `.claude/settings.json`, hooks, `.githooks/`, rules, `AGENTS.md`.
- Dependencies and build config.
- Anything touching `.env`, keys or secrets.
- Anything that goes public or changes remote data (push, PR, fork).

## Agent mistakes caught

| # | Date | Mistake | Caught by | Fix |
|---|---|---|---|---|
| M2 | 2026-10-04 | The agent read "starting with the two listed in the brief" as two mistakes and wrote a placeholder row for a second mistake that does not exist (the brief lists one decision and one mistake). | Agent, before committing | Row removed before the first commit; nothing invented. |
| M3 | 2026-10-04 | The agent copied `scripts/lib/` (parity-capture helper) into the repo although the init steps do not list it. | Agent, while reviewing the file list | Removed before commit. |
| M4 | 2026-10-04 | The agent chained `git tag` after a `git commit | tail` pipe, which hid the failed pre-commit (ESLint rejected the workflow files for undeclared runtime globals), so tag `step-02-factory-init` pointed at the wrong commit. | Agent, from the missing commit in `git log` | Tag deleted and recreated on the real commit after a clean commit; ESLint config now declares the workflow globals. The pre-commit hook did its job. |
| M5 | 2026-10-04 | The `requirements-analyst` wrote BC-3 as cut lines applied "without asking the user", dropping the user's instruction to tell them about every cut. | Agent (orchestrator review of the draft) | BC-3 rewritten at sign-off: cuts are logged in the autonomy log and budget and the user is told. |
| M6 | 2026-10-04 | The agent ran a GPG-signed commit from a non-interactive tool call without checking that the passphrase was still cached. Signing waited about 30 minutes for a passphrase prompt nobody could see, and the command was stopped. Nothing was committed or tagged (the tag was conditional on exit 0). | Agent, from the background timeout | The user cached the passphrase in their own terminal; the commit was retried, exit 0, then tagged. GPG settings untouched. Before a signed commit, ask the user to cache the passphrase if the last one is more than a few minutes old. |
| M1 | 2026-10-04 | The agent first treated "simplify my puzzles project" as a brownfield import of the old code. | User | Project restarted as a greenfield build from requirements; the old project is off-limits. |

## Numbers

_Filled in later from the action log: what the agent proposed versus what was never executed, including one case where the agent proposed something wrong and the user stopped it._
