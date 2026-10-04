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

## Raises

None yet.

## Lowerings

| # | Date | From → to | What happened | Decided by |
|---|---|---|---|---|
| L1 | 2026-10-04 | Interpreting the task and scope: 3 → 1 | The agent misread "simplify my puzzles project" as a brownfield import (see mistake M1). Since then the agent confirms its reading of scope with the user before acting on it. | Proposed by agent after the user's correction; **user to confirm** |

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
| M1 | 2026-10-04 | The agent first treated "simplify my puzzles project" as a brownfield import of the old code. | User | Project restarted as a greenfield build from requirements; the old project is off-limits. |

## Numbers

_Filled in later from the action log: what the agent proposed versus what was never executed, including one case where the agent proposed something wrong and the user stopped it._
