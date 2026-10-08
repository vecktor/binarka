# ADR-0004: Path- and role-scoped conventions

Status: **ACCEPTED** by the user on 2026-10-06 (proposed by the agent the same day); see the decision record. It is level 1, because `AGENTS.md` and `.claude/` are harness files. The user asked whether conventions should load per area and on demand, so that a future backend agent sees backend conventions and a frontend agent sees frontend ones.

## Context

- Today, `AGENTS.md` carries one always-loaded pointer: read `docs/coding-conventions.md` before writing code. `docs/frontend-conventions.md` is proposed as the first area-specific file; a backend would add another.
- The static budget is 4k tokens, with about 3.1k in use (ADR-0002).

**Claude Code** facts, verified on 2026-10-06 (code.claude.com/docs/en/memory, sub-agents, skills):

- **Imports.** `@imports` in `CLAUDE.md` and `AGENTS.md` load at launch. They organise a file but save no context.
- **Nested files.** A nested `CLAUDE.md` loads on demand, when Read, Write or Edit touches a file in its subdirectory. A nested `AGENTS.md` is **ignored** while a `CLAUDE.md` exists in the working directory or above it, as it does here. It needs a `CLAUDE.md` beside it, as an import or a symlink.
- **Rules.** `.claude/rules/**/*.md` files without `paths` load at launch. Files with `paths:` globs load when Read, Write or Edit touches a matching file. `@imports` are documented only for `CLAUDE.md` and `AGENTS.md`, not for rule files, so a rule file should carry a pointer, not an import.
- **Subagents** inherit the `CLAUDE.md` hierarchy and the project rules by default. `skills:` in an agent's frontmatter preloads full skill content at start. `omitClaudeMd: true` drops `CLAUDE.md`, which would also drop the shared rules.
- **Context is not enforcement.** The docs: instructions are "context, not enforced configuration"; to block an action, use a PreToolUse hook.

**Other tools** (agents.md and the Codex, Cursor and Copilot docs):

- Nested `AGENTS.md` is the cross-tool convention for path scope, but tools apply it differently:
  - Codex builds the file chain once, from the repo root down to the directory the session starts in. A session started at the root never loads a nested file.
  - Cursor applies a nested file to its own directory.
  - Copilot's cloud agent uses the nearest file.
- Glob rules are tool-specific: Cursor `.cursor/rules/*.mdc` (`globs`), Copilot `.github/instructions/*.instructions.md` (`applyTo`).
- Role files are tool-specific too: Copilot `.github/agents/*.agent.md`, Codex `.codex/agents/*.toml`, Cursor `.cursor/agents/` (which also reads `.claude/agents/`).

**Vercel**, with each file fetched on 2026-10-06:

- Next.js writes its managed block into the `AGENTS.md` of the directory `next dev` runs in. In a monorepo that is each app's root. The block points at docs "resolved from this file's directory".
- Their repos keep an `AGENTS.md` per area, with a `CLAUDE.md` beside it. `vercel/next.js` has them at the root, `packages/next/`, `turbopack/` and `test/`. `vercel/vercel` has one at `packages/cli/`, where `CLAUDE.md` is a symlink to `AGENTS.md`.
- The next.js root file: "Use skills for conditional, deep workflows. Keep baseline iteration/build/test policy in this file." It also tells agents to read every `README.md` from the root down to the target's directory before editing.
- `vercel/packages/cli/AGENTS.md`: "Always-loaded guidance for work inside `packages/cli`. Keep this file small." Its deep UX rules live in a package-local skill.
- Vercel's evals: an always-loaded docs index passed 100%; an on-demand skill passed 53%, or 79% when told to use it (it was never invoked in 56% of cases). Path-triggered loading was not tested.

## Options

| Option | Scope | Loaded when | Tools | Trade-off |
|---|---|---|---|---|
| A. Routing index in root `AGENTS.md`: plain-text pointers by path | path | always in context; the agent follows the pointer | all | about 60 tokens on every turn; the pointer pattern Vercel measured at 100% |
| B. Nested `AGENTS.md` + `CLAUDE.md` pair per area directory (Vercel's repos) | directory | when a file there is touched (Claude, Cursor, Copilot); at start for Codex, start directory only | all | directory-shaped: `src/ui/AGENTS.md` misses `index.html` and `src/main.ts`; two files per area |
| C. `.claude/rules/<area>.md` with `paths:` globs | glob | Claude Code loads it when a matching file is read or edited | Claude Code (Cursor and Copilot have equivalents) | globs reach any file; holds a pointer, because imports in rules are undocumented |
| D. Role agents (`.claude/agents/<role>.md`) that name the role's file, or preload it as a skill via `skills:` | role | at agent start | Claude Code (other tools have their own role files) | the shared root rules are inherited automatically; do not use `omitClaudeMd` |
| E. Skills chosen by description | task | when the model decides | all | weakest for rules that must always hold (Vercel: 53–79%) |

What an agent may **edit**, as opposed to what it reads, would be a PreToolUse hook per agent. That is out of scope here.

## Proposed decision (the agent's recommendation)

**A + C now, D when separate frontend and backend agents exist, B if another coding tool joins or the repo grows into packages.**

1. In `AGENTS.md`, the current two-sentence pointer becomes a routing block. In the same edit, the "Commit trailers" line changes to match the hook, which accepts `Refs:` or `Slice:`:

   ```markdown
   ## Conventions (read the matching file before editing; do not rely on memory)
   - TypeScript, tooling and tests: `docs/coding-conventions.md`
   - Page code (`index.html`, `src/main.ts`, `src/ui/**`): `docs/frontend-conventions.md`
   - Vite and Vitest APIs: the version-matched docs in `.vendor-docs/`
   ```

2. Add `.claude/rules/frontend.md`, which Claude Code loads only when page files are touched:

   ```markdown
   ---
   paths:
     - "index.html"
     - "src/main.ts"
     - "src/ui/**"
   ---
   You are working on page code. Before editing, read `docs/frontend-conventions.md` (HTML, CSS, DOM, accessibility) and follow it. Page text, including accessible names, is Ukrainian (NFR-5).
   ```

3. Later, a backend area adds one routing line and one rule file. A role agent such as `frontend-implementer` names its conventions file in its prompt.

## Consequences

- The static layer grows by about 20 tokens compared with today.
- In Claude Code, the frontend rule enters context only when page files are touched. Other tools get the routing index.
- The rule is path-triggered, so any agent role that touches page files gets it. That is right for conventions; restricting edits needs hooks.
- `docs/context-architecture.md` gains a row for path-scoped rules. The ADR-0002 boundary is otherwise unchanged.

## Decision record

The user asked, about 15:45 (UTC+5:30), "can we use both 1st and 2nd?", meaning option A + C and option A + B together. Yes: they are complementary. **Decision: A + B + C.** All three only point at `docs/frontend-conventions.md`, so the rules stay in one file. If that file moves, update the three pointers together.

Applied:

- `AGENTS.md`: the routing block above replaces the ADR-0003 pointer, and the commit-trailer line now matches the hook and real practice. Slice commits carry `Slice:` and `Refs:` (for example `d7613cf`); other `src/` commits carry `Refs:` (for example `ba430c5`).
- `.claude/rules/frontend.md` (C), with paths `index.html`, `src/main.ts` and `src/ui/**`.
- `src/ui/AGENTS.md` with `src/ui/CLAUDE.md` containing `@AGENTS.md` (B, Vercel's pattern).

Verified on 2026-10-06:

- **B:** a fresh subagent that read `src/ui/seed.ts` got `src/ui/CLAUDE.md` and, through its import, `src/ui/AGENTS.md` injected on demand.
- **C:** not verified yet. Neither this session nor a fresh subagent got the rule when reading `index.html` or `src/ui/seed.ts`. Per the Claude Code docs, subagents take their instruction files from the main conversation, which started before the rule file existed. **Check in the next new session:** read `index.html` and confirm that the frontend rule appears.
