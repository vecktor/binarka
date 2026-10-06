# Coding conventions — Бінарка

Status: **ACCEPTED** by the user on 2026-10-06 (ADR-0003; decisions in its decision record). Evidence of the adoption: `docs/qa/adr-0003-adoption.md`.

This file collects the established upstream conventions for this stack. Every rule names its source and the version it was checked against. Where the project deliberately differs from upstream, the rule says so and why. Precedence: `AGENTS.md` and the signed specs first, then this file, then the upstream docs it cites.

**Versions checked (installed on 2026-10-06):** TypeScript 6.0.3, Vite 8.3.2, Vitest 5.0.3, ESLint 10.12.0, typescript-eslint 8.71.0, jsdom 29.1.1. Re-check this file when any of these changes major or minor version.

## 1. Read the docs, do not recall them

All five tools above are newer than the agent's reliable training data. Vite 8 transpiles with Oxc, not esbuild. TypeScript 6.0 changed several defaults. typescript-eslint deprecated `tseslint.config()` in favour of ESLint's `defineConfig()`. Answers from memory are likely to be stale.

- **Vite and Vitest:** before using an API or config option, read its page in `.vendor-docs/`. That folder holds the official docs copied from the git tag of each installed version (`vite/` from v8.3.2: `guide/`, `config/`, `changes/`; `vitest/` from v5.0.3: `guide/`, `api/`, `config/`). Paths mirror the live sites (`.vendor-docs/vite/guide/features.md` is https://vite.dev/guide/features). On long pages, read the relevant section.
- **After upgrading Vite or Vitest,** run `npm run docs:vendor`. `npm run check:docs` fails while the copy and `package-lock.json` disagree.
- **TypeScript 6.0:** the [release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html) list the changed defaults and deprecations. They are not vendored.
- This is the model Vercel ships for Next.js: version-matched docs inside the project, plus an always-loaded `AGENTS.md` instruction to read them first. In Vercel's agent evals, the always-present docs passed 100% of cases. An on-demand skill scored 53% by default and 79% with explicit instructions. Sources: [vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals), [nextjs.org/docs/app/guides/ai-agents](https://nextjs.org/docs/app/guides/ai-agents).

## 2. `tsconfig.json`

Baseline: the official `create-vite` 9.2.1 `template-vanilla-ts`. It pins `typescript ~6.0.2` and `vite ^8.3.0`, which is our version line. Requirements: Vite 8.3.2 `guide/features.md` § TypeScript and the TypeScript 6.0 release notes. Every template flag is adopted, plus Vite's `isolatedModules`. The one deliberate deviation is `target`/`lib`.

| Option | Template 9.2.1 | Ours | Reason |
|---|---|---|---|
| `isolatedModules` | (not set) | `true` | Vite: "Should be set to `true`", because Oxc transpiles each file without type information and does not support `const enum` or implicit type-only imports. |
| `verbatimModuleSyntax` | `true` | `true` | Type-only imports must say `import type`, which Vite asks for so that types are not "incorrectly bundled". |
| `erasableSyntaxOnly` | `true` | `true` | No `enum`, `namespace` or constructor parameter properties, which a per-file transpiler cannot erase. |
| `moduleDetection` | `"force"` | `"force"` | Every file is a module. |
| `allowImportingTsExtensions` | `true` | `true` | Allows `./x.ts` imports (Vite's performance guide). We keep extensionless imports (§3); the flag makes a later migration mechanical. |
| `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` | `true` | `true` | The template's "Linting" block. |
| `allowArbitraryExtensions` | `true` | `true` | Template parity. It has no effect here (there are no `*.d.<ext>.ts` files). |
| `module` / `moduleResolution` / `noEmit` / `skipLibCheck` | `esnext` / `bundler` / `true` / `true` | same | TS 6.0 lists `bundler` resolution as the setting for bundled apps. `skipLibCheck` is on in every Vite starter. |
| `strict` | (TS 6.0 default `true`) | `true` | Kept explicit (TC-1). TS 6.0 made `strict: true` the default; setting it explicitly costs nothing and states the intent. |
| `noUncheckedIndexedAccess` | not set | `true` | Stricter than the template. Read indexes with a fallback (`grid[r]?.[c] ?? -1`, `cells[i] ?? EMPTY`), not `!` or `as`. |
| `types` | `["vite/client"]` | `["vite/client", "node"]` | Explicit. TS 6.0 changed the default to `[]`. Vite recommends listing `types` ("recommended since TS 5.9"). `node` is needed for `src/cli.ts` and its tests. |
| `target` / `lib` | `es2023` / `["ES2023", "DOM"]` | `ES2022` / `["ES2022", "DOM"]` | **Deliberate deviation.** Vite 8.3.2's default `build.target` is Chrome 111, Edge 111, Firefox 114 and Safari 16.4, and Vite does not polyfill. ES2023's `toSorted`, `toReversed` and `with` need Firefox 115 (MDN browser-compat-data), so an ES2023 `lib` would type-check calls that break in a target browser. Vite ignores `target` for transpiling (it uses `oxc.target` and `build.target`), so `lib` only controls which APIs type-check. `DOM.Iterable` was dropped: TS 6.0 merged it into `DOM`. |
| `baseUrl`, `paths` | not set | not set | Do not add them. TS 6.0 deprecates `baseUrl`. For `paths`, Vite needs `resolve.tsconfigPaths` and warns that it has a performance cost and that the TypeScript team discourages it. Use relative imports. |

## 3. Modules and imports

Source: Vite 8.3.2 `guide/features.md` and `guide/performance.md`. The two deviations from Vite's performance guide below are the user's decisions (ADR-0003, option D).

- **Type-only imports use `import type` / `export type`.** `verbatimModuleSyntax` enforces it.
- **Barrel files are house style (deviation from Vite).** Vite advises against barrels, because importing one name makes the dev server fetch and transform every re-exported file. Here, each folder's `index.ts` is its public API (`src/engine/index.ts`, `src/ui/index.ts`; ADR-0001, TC-7). Code outside a folder imports from its barrel. Today that is `src/ui/`, `src/cli.ts`, `src/main.ts` and all 27 test imports of `src/`. Code inside a folder imports its siblings directly (`./rules`, `./types`), never through its own barrel, which avoids import cycles. A new public name gets re-exported from the folder's `index.ts`. With 12 TypeScript files in `src/`, the dev-server cost is too small to measure.
- **Imports stay extensionless (deviation from Vite).** Vite: "it's usually better to be explicit with your import paths", because each extensionless import costs up to six filesystem checks. All 69 relative `from` imports leave the extension out, and new code matches them. Do not mix the two styles. The side-effect CSS import names its extension, as it must.
- **Side-effect imports are for CSS only** (`import './ui/style.css'` in `src/main.ts`). TS 6.0 checks them by default (`noUncheckedSideEffectImports`).
- **Named exports only** in `src/` and `tests/`. Config files are the exception, because Vite and ESLint expect `export default`.

## 4. TypeScript language features

- Use only erasable syntax: no `enum`, `const enum`, `namespace` or constructor parameter properties (enforced by `erasableSyntaxOnly`). Use union literal types, or `as const` objects with a derived union.
- No `any`, and no `!` non-null assertions (enforced by `no-non-null-assertion` in the strict lint tier).
- An `as` cast that strips `undefined` is just as unchecked, and no rule catches it. Narrow with a guard, or read with a fallback (`?? EMPTY`), instead.
  - In engine code, a guard on an index that cannot be out of range throws a `RangeError`, so a future indexing bug fails loudly (`setAt` in `src/engine/generator.ts`).
  - Page event handlers return early instead.
  - The one justified cast is a generic in-range read where `T` itself may include `undefined` (`shuffle` in `src/engine/rng.ts`, with a comment).
  - Casts that narrow a domain are fine (`(1 - d) as Digit`).
- Use `== null` only to test for "null or undefined" together, as in `isSolved` (sparse rows). Use `===` everywhere else.
- Where TypeScript keeps a narrowing that a call invalidates (a property changed by a recursive call), wrap the test in a small named predicate instead of disabling the lint rule. See `isDone` in `src/engine/solver.ts`.
- `import.meta.env` and `import.meta.hot` are typed through `vite/client`. Only `VITE_`-prefixed variables reach the client. Vite: "`VITE_*` variables should _not_ contain sensitive information". The page uses no env variables.

## 5. Static checks are not Vite's job

Source: Vite 8.3.2 `guide/features.md` § Transpile Only: "Vite only performs transpilation on `.ts` files and does **NOT** perform type checking".

- `tsc --noEmit` runs in `npm run build`, the pre-commit hook and CI (TC-4).
- **ESLint:** `eslint.config.js` uses ESLint core's `defineConfig()`. TypeScript files get typescript-eslint's type-aware `strictTypeChecked` and `stylisticTypeChecked` configs (`projectService`). `restrict-template-expressions` allows numbers, because sizes, seeds and cell coordinates go into strings on purpose. `.js` files (this config and the locked workflow harness files) keep the earlier non-type-aware `recommended` tier, so a harness update cannot be blocked by rules chosen for our TypeScript.
- Do not silence a finding with `eslint-disable`. Fix the code, or, for a real false positive, restructure as in §4. If a rule is wrong for this project, change `eslint.config.js` with a comment that says why.
- Cost: type-aware linting takes about 2 s per file. This affects the per-edit ESLint hook in `.claude/settings.json`.
- A commit that touches non-test `src/` needs a `Refs:` or `Slice:` trailer (`scripts/hooks-commit-msg.mjs`); for lint or TypeScript-only changes, use `Refs: TC-1, TC-4`.

## 6. Tests (Vitest)

Source: Vitest 5.0.3 `guide/learn/writing-tests-with-ai.md` and `api/expect.md`, plus the project rules in `AGENTS.md` (`tests/*.test.ts`, `@trace FR-x`, test-first).

- **Use the `vi.*` API, never `jest.*`.** Vitest calls Jest APIs "the most frequent issue with AI-generated Vitest tests". `globals` is off in `vite.config.ts`, so every test imports from `'vitest'`.
- **Agents run `vitest run`** (`npm run test:run`), never watch mode. Vitest: "always use `vitest run` or `vitest --no-watch`".
- **Spies are restored automatically.** `restoreMocks: true` in `vite.config.ts` calls `vi.restoreAllMocks()` before each test, which restores spies made with `vi.spyOn`. A `mockRestore()` in a `finally` is still fine, and it is the safe choice in concurrent tests (Vitest warns that `restoreMocks` can restore a spy that another running concurrent test still uses).
- **To narrow a type in a test,** use `expect.assert(cond, message)` or chai's narrowing asserts (`expect.assert.isDefined`). `expect(...).to*` matchers do not narrow (Vitest `api/expect.md` § assert). Example: `q()` in `tests/helpers/play-page.ts`.
- **Module mocks use the `import()` form,** `vi.mock(import('./x'))`, not a string path. There are no module mocks today. Test against the real implementation unless a test needs isolation. Vitest notes that "AI tools tend to over-mock".
- **Assert on behaviour.** Do not write `toBeDefined()`-only assertions or assertions about mock internals. Ask for edge cases explicitly: empty, boundary, `null`/`undefined`, error paths.
- **Short test names that describe behaviour** ("formats USD prices", not "should correctly return …").

## 7. Page code and project layout (Vite conventions)

Source: Vite 8.3.2 `guide/index.md` § `index.html` and Project Root, `guide/assets.md` § The `public` Directory, and `guide/performance.md`.

- `index.html` at the project root is the entry point and is part of the module graph. It loads `/src/main.ts` with `<script type="module">`. Keep it minimal and build the page in TypeScript.
- Assets: Vite says to "prefer **importing assets**" so they get hashed URLs. Use `public/` only for files that must keep their exact name or are never referenced from code, and reference them with a root-absolute path (`/icon.png`).
- Use plain CSS (Vite: "Use CSS instead of Sass/Less/Stylus when possible").
- Set user-visible text with `textContent` or `createElement`, never `innerHTML`. Page text is Ukrainian (`AGENTS.md`).

## 8. What this file does not cover yet

- **UI conventions for HTML, CSS and DOM code** (semantics, accessibility, keyboard and focus, CSS structure, responsive layout, motion). Vite is unopinionated about UI, so §7 only covers how Vite processes these files. Candidate sources: Vercel's Web Interface Guidelines, the W3C WAI-ARIA Authoring Practices (Grid pattern for the board), MDN. Proposal pending.
- **Formatting** (quotes, semicolons, line width): there is no formatter in the stack (ADR-0001), so match the surrounding code. Adding Prettier or Oxfmt would be a dependency, which is a level-1 decision.
- **Vite+** (`vp`, VoidZero's unified toolchain) would replace parts of the stack, not add conventions. It is out of scope.

## Sources (checked 2026-10-06)

- Vercel: [AGENTS.md outperforms skills in our agent evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals); [Next.js: set up your project for AI coding agents](https://nextjs.org/docs/app/guides/ai-agents) (16.3: docs bundled in `node_modules/next/dist/docs/` plus a managed `AGENTS.md` block).
- `create-vite` 9.2.1, `template-vanilla-ts/tsconfig.json` (npm tarball; tag `create-vite@9.2.1`).
- Vite 8.3.2 and Vitest 5.0.3 docs: vendored in `.vendor-docs/` (see its `README.md` for the commits). Pages cited: Vite `guide/features.md`, `guide/performance.md`, `guide/index.md`, `guide/assets.md`, `guide/env-and-mode.md`, `config/build-options.md`; Vitest `guide/learn/writing-tests-with-ai.md`, `config/restoremocks.md`, `api/expect.md`.
- [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
- typescript-eslint 8.71.0: `config-helper.d.ts` (`config()` marked `@deprecated` in favour of `defineConfig()`); [typescript-eslint package docs](https://typescript-eslint.io/packages/typescript-eslint/); shared configs measured locally (`docs/qa/adr-0003-adoption.md`).
- MDN browser-compat-data, `javascript/builtins/Array.json` (`toSorted`, `toReversed`, `with`: Firefox 115).
- Also found, not used: [antfu/skills](https://github.com/antfu/skills) (MIT; `vite` and `vitest` skills generated from the official docs). These are on-demand skills, not pinned to our versions.
