# Context Architecture — Бінарка

> A **versioned, cost-bearing** decision (whitepaper: *"treat the static/dynamic
> context boundary as an architectural decision with direct TCO impact"*).
> Static context is paid for on **every** agent turn; dynamic context is loaded
> only when a task needs it. Keep the static layer lean on purpose.

## Static layer — loaded every interaction (keep small)

The minimum the agent must know on every turn. Budget: **≤ 4k tokens.**

- `CLAUDE.md` → `@AGENTS.md` (durable cross-cutting rules only: module conventions,
  correctness rules learned from bugs, validation cadence, test-first, the handoff
  protocol). NOT per-domain detail.
- The active handoff pointer (`docs/current-state.md` is read at session start, not
  embedded).

When `AGENTS.md` grows past the budget, that is a signal to **move detail out** to
the dynamic layer (a skill or a domain doc), not to raise the budget silently.

## Dynamic layer — loaded on demand (progressive disclosure)

Loaded only when the task touches it, so its tokens are not paid on unrelated turns:

| Loaded when… | Source |
|---|---|
| working in a domain | `src/engine/` code + that domain's spec under `openspec/specs/<capability>/` |
| a reusable procedure applies | a `SKILL.md` skill (vendored under `.agents/skills/`, listed in `skills-lock.json`) |
| writing or reviewing code | `docs/coding-conventions.md` (ADR-0003), found through the routing block in `AGENTS.md` |
| touching page code (`index.html`, `src/main.ts`, `src/ui/**`) | `docs/frontend-conventions.md`, reached three ways (ADR-0004): the `AGENTS.md` routing block (every tool); `.claude/rules/frontend.md`, which Claude Code loads when a matching file is read or edited; and `src/ui/AGENTS.md` with `src/ui/CLAUDE.md`, loaded when a file in `src/ui/` is touched |
| using a Vite or Vitest API or option | the version-matched docs vendored in `.vendor-docs/<pkg>/` (ADR-0003; `npm run check:docs` after upgrades) — never memory. Vite and Vitest ship no docs in their packages, unlike Next.js (`node_modules/next/dist/docs/`) |
| doing QA / release | the QA pack under `docs/qa/`, the trajectory/traceability reports |
| resuming work | `docs/current-state.md` (read, not embedded) |

## Rules

1. **Default to dynamic.** A rule goes in the static layer only if it's needed on
   *most* turns and can't be discovered from the code/spec in front of the agent.
2. **Progressive disclosure.** Prefer a one-line pointer in static context to an
   on-demand skill/doc over inlining the detail.
3. **Budget is enforced, not aspirational.** Review the static layer's size on a
   cadence; when it exceeds the budget, demote content to a skill.
4. **Versioned.** Any change to this boundary (promote/demote a layer, change the
   budget) is recorded as an ADR in `docs/adr/`.

## Current decision

- **Static budget:** 4k. **Today:** about 3.2k (AGENTS.md is 12.8 KB, most of it the six factory lessons).
- **Recently added to the dynamic layer (2026-10-06):** the coding and frontend conventions, the vendored Vite/Vitest docs and Vercel's Web Interface Guidelines. The static layer only gained a four-line routing block (about 120 tokens), not a docs index. Area pointers load on demand (ADR-0004).
- **Owning ADRs:** ADR-0002-context-architecture; ADR-0003 for the conventions and framework-docs rows; ADR-0004 for path-scoped loading.
