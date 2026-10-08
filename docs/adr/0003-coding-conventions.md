# ADR-0003: Coding conventions and version-matched framework docs

Status: **ACCEPTED** by the user on 2026-10-06 (proposed by the agent the same day); see the decision record. This is level 1, because build config and `AGENTS.md` are permanent level-1 boundaries (autonomy-log rows 4, 15 and 32).

## Context

- ADR-0001 chose the stack but no coding conventions. Each slice followed whatever its author picked.
- The installed TypeScript 6.0.3, Vite 8.3.2, Vitest 5.0.3, ESLint 10.12 and typescript-eslint 8.71 are all newer than the agent's reliable training data.
- `docs/context-architecture.md` tells agents to take framework APIs from "the installed package's bundled docs (`node_modules/<pkg>/dist/docs/`)". That path is the Next.js 16.2+ layout. Vite, Vitest, TypeScript and ESLint ship no docs in their packages (checked in `node_modules` on 2026-10-06), so the row points at nothing.
- Vercel's evidence for Next.js: an always-present docs index in `AGENTS.md` passed 100% of their agent evals, against 53% for an on-demand skill (79% with explicit instructions). Next.js 16.3 now ships version-matched docs inside the package and writes a short `AGENTS.md` block telling agents to read them before writing code.
- The static budget is 4k tokens and about 3k is used (ADR-0002). A short pointer fits. A Vercel-style docs index (about 8 KB) does not, and neither do the `llms.txt` indexes (Vite 3.5 KB, Vitest 11.7 KB).
- The conventions found, with sources and measured gaps, are in `docs/coding-conventions.md`.

## Options

### A. Where the version-matched framework docs live

- **A1 (recommended): vendored and committed.** Copy the official docs at the installed tags into `.vendor-docs/`:
  - `.vendor-docs/vite/` from Vite `v8.3.2`: `guide/`, `config/` and `changes/` (38 files, 415 KB)
  - `.vendor-docs/vitest/` from Vitest `v5.0.3`: `guide/`, `api/` and `config/` (216 files, 1.35 MB)

  That is 254 Markdown files and 1.73 MB in all, with no blog posts. A `README.md` names the tags. A small Node script (`scripts/vendor-docs.mjs`, using git sparse checkout, no new dependency) re-copies the docs after an upgrade and fails if `package-lock.json` versions differ from the vendored tags. This is the Next.js model: always present in every clone and worktree, offline, and exactly the installed version. Being a dot-directory, it stays out of default code searches, as `.next-docs/` does.
- **A2: same files, gitignored.** The same script fills the directory (`npm run docs:sync`). There is no weight in git, but a fresh clone or worktree has no docs until someone runs it. An agent cannot notice docs it does not know are missing; this worktree's `node_modules` was stale today in the same way.
- **A3: no local copy.** Use the live `.md` pages (`vite.dev/<path>.md`, `vitest.dev/<path>.md`, indexes at `/llms.txt`). It costs nothing, but the pages track the latest release, not the installed one, and need network.
- **A4: antfu/skills.** The `vite` and `vitest` skills are generated from the official docs (MIT) and installed with `npx skills add`. They are on-demand, which is the mode that scored lower in Vercel's evals. They are not pinned to our versions, and they need an external CLI.

### B. `tsconfig.json`

- **B1 (recommended):** adopt the create-vite 9.2.1 checking flags plus Vite's `isolatedModules: true`, and drop `DOM.Iterable` (TS 6.0 merged it into `DOM`). Keep `target`/`lib` at ES2022, because Vite 8's default browser target includes Firefox 114, which lacks ES2023's `toSorted`/`with`. Measured: **0 `tsc` errors**.
- **B2:** leave it as it is.

### C. Lint tier, with Vitest's `restoreMocks`

- **C1 (recommended):** `recommendedTypeChecked`, which is type-aware with **0 problems**, plus `restoreMocks: true` in `vite.config.ts`. No code changes.
- **C2:** also add `stylisticTypeChecked`: 40 problems, all fixed by `eslint --fix` in 13 files. The commit touches `src/`, so it carries `Refs: TC-4`.
- **C3:** `strictTypeChecked` plus stylistic: 25 problems stay after `--fix`, and 14 of them come from a conflict between the two configs. This would be its own change, with review.
- **C4:** keep `recommended`, which is not type-aware.

### D. Import style

- **D1 (recommended):** keep extensionless imports, which all 69 relative imports use today. Keep `src/engine/index.ts` as the engine's public boundary and add no new barrels. (Superseded by the decision record: barrels are house style.) The extension flag from B1 makes a later migration a mechanical change. At 12 TypeScript files, Vite's dev-server saving is too small to measure.
- **D2:** migrate all 69 imports to explicit `.ts` now, in one mechanical commit with `Refs: TC-2`. Then re-run `npm run cli` and the full test battery.
- Mixing the two (`.ts` only in new code) is not offered: the codebase would be inconsistent.

## Proposed decision (the agent's recommendation)

A1, B1, C1, D1. Then:

- `AGENTS.md` gains one line (about 60 tokens) under "Stack": read `docs/coding-conventions.md` before writing code, and the version-matched docs in `.vendor-docs/` before using a Vite or Vitest API; never rely on memory.
- The framework-API row in `docs/context-architecture.md` points at `.vendor-docs/`. ADR-0002's static/dynamic split is otherwise unchanged.

## Decision record

The user answered the four questions on 2026-10-06, about 14:00 (UTC+5:30):

| Option | User's choice | Note |
|---|---|---|
| A (docs) | **A1, committed copy** | Asked for more context first. Then asked how much context it adds: none until a page is opened. The `AGENTS.md` line is about 50 tokens. |
| B (tsconfig) | **B1, align** | As recommended. |
| C (lint) | **C3, strict + stylistic** | Not the recommended C1. `restoreMocks: true` comes with it. |
| D (imports) | **D1, keep extensionless**, "though let's continue using barrel files" | Barrels are house style, not just tolerated: `docs/coding-conventions.md` §3. |

What was applied (evidence: `docs/qa/adr-0003-adoption.md`):

- **A1:** `.vendor-docs/` holds 254 Markdown files (1.73 MB) from Vite `v8.3.2` (`1003321`) and Vitest `v5.0.3` (`33cadea`), each with its MIT `LICENSE`. Adds `scripts/vendor-docs.mjs` and the npm scripts `docs:vendor` and `check:docs`. `AGENTS.md` gains a two-sentence pointer that replaces "No framework docs to consult" (12,374 → 12,572 bytes). The framework-API row in `docs/context-architecture.md` now points at `.vendor-docs/`.
- **B1:** `tsconfig.json`, 0 `tsc` errors.
- **C3:** `eslint.config.js` now uses `defineConfig()`. Strict + stylistic apply to TypeScript files. `.js` files, including the locked workflow harness, keep the earlier `recommended` tier (an independent review's finding). 57 findings, 25 left after `eslint --fix`, 0 after hand fixes in `src/engine/{generator,solver,rules,rng}.ts`, `src/ui/play-page.ts` and five test files. An engine behaviour snapshot and the CLI output were byte-identical before and after. `vite.config.ts` gains `restoreMocks: true`. An independent `code-reviewer` found no blocker or major; its one minor and five nits were all addressed.
- **D1:** no import changes.

## Consequences

- Agents check APIs against the installed versions, not their memory, and the conventions doc gives one place to check style.
- Each Vite or Vitest minor upgrade includes `npm run docs:vendor`. `npm run check:docs` fails while the copied docs and the lockfile disagree.
- Lint is type-aware: about 2 s per file, including the per-edit hook in `.claude/settings.json`.
- The C3 hand fixes touch `src/` without changing behaviour. Their commit carries `Refs: TC-1, TC-4`.
