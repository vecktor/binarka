# ADR-0002: Context architecture

Status: ACCEPTED (installed by `/project-factory:init`, approved by the user on 2026-10-04).

## Decision

`AGENTS.md` (with `CLAUDE.md` containing only `@AGENTS.md`) is the static context: stack, module conventions, correctness rules, process honesty and the six factory lessons. Everything else is loaded on demand: engine code and specs per capability, `docs/current-state.md` at session start, QA artifacts at release time. Static budget: 4k tokens; today about 3k. Details and rules are in `docs/context-architecture.md`.

## Consequences

When `AGENTS.md` exceeds the budget, content moves to the dynamic layer, and that change is recorded in a new ADR.
