# ADR-0001: Stack

Status: **ACCEPTED** by the user on 2026-10-04 (proposed by the agent).

## Context

Бінарка is a 6×6 Takuzu puzzle: a rule checker, a solver, a seeded generator, a hint engine, a small CLI (slice 1) and a single play page (slice 2). There is no server state, no accounts and no database. Puzzles are generated in the browser from a seed. Verification tags are `local-verifiable` only (plus `eval` if kept), so UI tests run in jsdom. The factory's pre-commit hook runs ESLint and `tsc --noEmit`, so the project needs TypeScript and ESLint. The course default (Next + Postgres/Drizzle + Better Auth + Resend + Vercel) is far more than this needs. Package manager: npm (the factory battery, hooks and CI assume it).

## Proposed decision

| Piece | Choice |
|---|---|
| Language | TypeScript (strict) |
| App | Vite, vanilla TypeScript DOM, no UI framework; one static page |
| Engine | Pure TS modules in `src/engine/` with no DOM imports, so the CLI and the page share them |
| CLI | `tsx` runs `src/cli.ts` (prints a puzzle as text) |
| Tests | Vitest; `environment: jsdom` for the page tests; `@trace FR-x` tags |
| Lint | ESLint (flat config) + `tsc --noEmit` |
| Specs | OpenSpec (version pinned, run through `npx`) |
| Package manager | npm |
| Dropped from the factory default | Next, Postgres/Drizzle, Better Auth, Resend, Playwright, Vercel |

## Alternatives considered

1. **Vite + React.** Nicer for state, but a 6×6 grid with a click handler does not need it. It adds dependencies (a level-1 change each) and makes jsdom tests heavier.
2. **Next.js (factory default).** SSR, routing and build weight with no use here; slower to scaffold and to test.
3. **Python or Go CLI only.** Simplest engine, but slice 2 (the play page) needs a browser stack anyway.

## Consequences

- The engine is testable without a DOM; the page tests cover only wiring and rendering.
- `src/` is the module scope for `check-trajectory`.
- Dependencies to approve before install (all level 1): `typescript`, `vite`, `vitest`, `jsdom`, `tsx`, `eslint` (+ `typescript-eslint`), `@fission-ai/openspec`.
- Deploy is out of scope tonight; the repo and the video are the deliverable.
- Costs: no real browser tests (Playwright is "later"); rendering bugs that jsdom cannot see will not be caught.

## Decision record

User decision: accepted as proposed ("Yes, I accept"), together with approval to install the listed dependencies and run `/project-factory:init`. Grid size is engine-generic (N = 4, 6, 8 tested), see `docs/autonomy-log.md` row 2a.
