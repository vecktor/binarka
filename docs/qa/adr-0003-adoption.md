# ADR-0003 adoption evidence (2026-10-06)

Worktree `vite-coding-conventions-a4b96a`, base commit `cd90dca`. Times are UTC+5:30 (Kyiv −2:30). Decisions: `docs/adr/0003-coding-conventions.md`. Conventions: `docs/coding-conventions.md`.

## Environment repair before any measurement

This worktree's `node_modules` was stale: `@types/node` is in `package-lock.json` but was not installed. `tsc` then stopped at `TS2688: Cannot find type definition file for 'node'` and type-checked nothing, because TypeScript skips semantic checking when there is an options error. The first tsconfig probe ("0 errors beyond TS2688") was therefore vacuous and was discarded. `npm ci` reinstalled the lockfile exactly (no dependency added or changed). After that, `npx tsc --noEmit` exited 0.

## Battery before (14:08, unchanged tree)

| Check | Result |
|---|---|
| `npm run lint` (typescript-eslint `recommended`) | exit 0 |
| `npm run test:run` | 418 passed of 418 |
| `npm run build` | exit 0 |
| `npx openspec validate --all --strict` | 2 passed, 0 failed |

## Battery after (14:17, all changes applied)

| Check | Result |
|---|---|
| `npx tsc --noEmit` (aligned tsconfig) | exit 0 |
| `npm run lint` (strict + stylistic, type-aware) | exit 0, 0 problems |
| `npm run test:run` (`restoreMocks: true`) | 418 passed of 418, 18 files |
| `npm run build` | exit 0 |
| `npx openspec validate --all --strict` | 2 passed, 0 failed |
| `npm run check:docs` | `vendor-docs: OK (vite 8.3.2, vitest 5.0.3)` |
| `npm run check:trace` | 47 MVP FRs, 0 failures, 47 warnings |
| `npm run check:trajectory` | PASS, 1 warning (slice 1 review evidence `clean: false`, as before) |
| `npm run check:acceptance:artifact` | PASS, 54 contracts |
| `npm run check:integrity` | PASS, 1 warning: this worktree's `core.hooksPath` is the main checkout's absolute `.githooks` path (it existed before this change; git config was not touched) |
| `npm run check:process` | NOT-EARNED, no `trace/process-health.json` (it existed before this change) |

`check:trajectory` rewrote `docs/qa/trajectory-report.md` and `trace/trajectory.json` with one changed number: `add-size-selector` trailer commits went from 14 to 15. That comes from commits already in history, not from this change (uncommitted edits are not counted). Both files were restored to keep this change focused, and the committed report stays one commit stale.

## Lint: measured tiers, then the adopted one

Measured on `cd90dca` over `src/`, `tests/` and `vite.config.ts`:

| Tier | Problems | After `--fix` |
|---|---|---|
| `recommendedTypeChecked` | 0 | 0 |
| + `stylisticTypeChecked` | 40 | 0 (13 files) |
| `strictTypeChecked` + stylistic | 176; 57 with `restrict-template-expressions` `allowNumber: true` | 25 |

Adopted: strict + stylistic with `allowNumber: true` (user's choice C3). Under the real `eslint.config.js` (`eslint .`, which also covers `.claude/workflows/*.js` and `eslint.config.js`): 57 problems, all in `src/` (23) and `tests/` (34), none in the locked workflow files. `eslint --fix` changed `Array<T>` to `T[]` (26), wrapped void arrow bodies in braces (6), and turned 14 `as` non-null assertions into `!`. strict's `no-non-null-assertion` then rejects those 14, because the two configs conflict. That left 25, fixed by hand:

| Where | Finding | Fix | Why behaviour is unchanged |
|---|---|---|---|
| `src/engine/generator.ts` `bump`, `place` | 6 non-null assertions | `setAt()` helper next to the existing `at()`, and `rc[d] = (rc[d] ?? 0) + by`. After review, the guards throw a `RangeError` on an out-of-range row or line | Indexes are always in range (`r, c < n`, `d ∈ {0, 1}`). The old casts would also have crashed out of range |
| `src/engine/solver.ts` | 7 non-null assertions on `cells[...]` | `cells[...] ?? EMPTY` (the idiom at `board[r]?.[c] ?? EMPTY`). After review, `set()` reads `cells[idx]` with no fallback, so a missing cell is a contradiction, exactly as before | `cells` is an `Int8Array` of length n², read only with in-range indexes |
| `src/engine/solver.ts:128` | `no-unnecessary-condition`: `s.exhausted` "always falsy" | `isDone(s, limit)` predicate at both stop checks | False positive: TypeScript keeps the narrowing from the guard across the recursive `search()` call that sets `s.exhausted`. The check is kept, not deleted |
| `src/engine/rules.ts:65` (and line 28 after review, for consistency) | `cell === undefined` unnecessary by type | `cell == null` / `v != null` | Same truth table (null or undefined, including holes in sparse rows) |
| `src/ui/play-page.ts:88` | second optional chain unnecessary | `givens[r]?.[c] !== null` | `x === undefined \|\| x !== null` equals `x !== null` |
| `src/ui/play-page.ts` click and hint handlers, `src/engine/generator.ts` carve loop (after review) | not lint findings: four `as` casts that strip `undefined` | guards. Handlers return early; the carve loop throws a `RangeError` | Unreachable for in-range cells. This removes the contradiction with conventions §4 |
| `src/engine/rng.ts` `shuffle` (after review) | generic `items[i] as T` | kept, with a comment | `T` may itself include `undefined`, so a guard could not tell a missing cell from a stored `undefined` |
| `tests/helpers/play-page.ts` `q()` | non-null assertion | `expect.assert(el !== null, msg)`, which narrows (Vitest `api/expect.md` § assert) | Still fails as an assertion with the same message text |
| `tests/helpers/play-page.ts`, `tests/play-page-page-text.test.ts` | 7 × `textContent ?? ''` / `textContent?.trim()` | dropped | `Element.textContent` is typed `string` in TS 6.0's DOM lib, and is never null on elements |
| `tests/solver.test.ts:71` | second optional chain unnecessary | `board[r][c]` after the `== null` check | Narrowed by the left operand |

## Behaviour snapshot: engine and CLI (before 14:09, after 14:17)

The engine snapshot covers `generate` for sizes 4, 6 and 8 over seeds 0 to 149 plus 99999, 123456789 and 2147483647. For each puzzle it records the givens and the solution, `countSolutions`, `countSolutionsBudgeted(…, 40)`, `isSolved`, `findViolations` on the solution and on a one-cell-flipped board, `hint` on that broken board, `hint`/`findViolations`/`countSolutions` on boards 25%, 50% and 75% filled from the solution, and the full hint chain from the givens. It also records empty boards, seven invalid-argument errors (name and message), `mulberry32` and `shuffle`.

| | Before | After |
|---|---|---|
| Records / bytes | 463 / 1,291,465 | 463 / 1,291,465 |
| sha256 | `0d47317eab9f0793c1a8491ee68a6a746a9e2adaa14a9679a3d53430a719ed3e` | same; `cmp` reports the files identical |

CLI (`npx tsx src/cli.ts …`): stdout, stderr and exit code identical for all nine cases: no arguments; `--size 4 --seed 7`; `--size 8 --seed 2147483647`; `--size 6 --seed 042`; `--size 16 --seed 3`; `--size 5`; `--seed x`; `--size`; `--bogus`.

<details><summary>Snapshot script (run with <code>npx tsx snapshot.mts &lt;repo&gt; &lt;out.json&gt;</code> from outside the repo)</summary>

```ts
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const ROOT = process.argv[2];
const OUT = process.argv[3];
const engine = await import(`${ROOT}/src/engine/index.ts`);
const solverMod = await import(`${ROOT}/src/engine/solver.ts`);
const rngMod = await import(`${ROOT}/src/engine/rng.ts`);

type Cell = 0 | 1 | null;
type Grid = Cell[][];
const copy = (g: Grid): Grid => g.map((r) => [...r]);
const out: unknown[] = [];
function attempt(fn: () => unknown): unknown {
  try { return { ok: fn() }; } catch (e) { const err = e as Error; return { error: err.name, message: err.message }; }
}
for (const size of [4, 6, 8]) {
  for (const seed of [...Array(150).keys(), 2147483647, 123456789, 99999]) {
    const p = engine.generate(size, seed);
    const rec: Record<string, unknown> = { size, seed, givens: p.givens, solution: p.solution };
    rec.countGivens = engine.countSolutions(p.givens);
    rec.budgeted = solverMod.countSolutionsBudgeted(p.givens, 40);
    rec.solved = [engine.isSolved(p.solution), engine.isSolved(p.givens)];
    rec.violSolution = engine.findViolations(p.solution);
    const broken = copy(p.solution);
    const r0 = seed % size, c0 = (seed * 7) % size;
    broken[r0]![c0] = broken[r0]![c0] === 0 ? 1 : 0;
    rec.violBroken = engine.findViolations(broken);
    rec.hintBroken = engine.hint(broken);
    const empties: [number, number][] = [];
    p.givens.forEach((row: Cell[], r: number) => row.forEach((c: Cell, ci: number) => { if (c === null) empties.push([r, ci]); }));
    rec.partial = [0.25, 0.5, 0.75].map((f) => {
      const b = copy(p.givens);
      for (const [r, c] of empties.slice(0, Math.floor(empties.length * f))) b[r]![c] = p.solution[r]![c]!;
      return { h: engine.hint(b), v: engine.findViolations(b), n: engine.countSolutions(b) };
    });
    const chain: unknown[] = [];
    const b = copy(p.givens);
    for (let i = 0; i < size * size; i++) {
      const h = engine.hint(b);
      chain.push(h);
      if (h.kind !== 'fill') break;
      b[h.row]![h.col] = h.value;
    }
    rec.chain = chain;
    out.push(rec);
  }
  const empty: Grid = Array.from({ length: size }, () => Array<Cell>(size).fill(null));
  out.push({ size, emptyCount: engine.countSolutions(empty), emptyHint: engine.hint(empty) });
}
out.push({
  errors: [
    attempt(() => engine.generate(5, 1)), attempt(() => engine.generate(18, 1)),
    attempt(() => engine.generate(6, -1)), attempt(() => engine.generate(6, 2147483648)),
    attempt(() => engine.generate(6, 1.5)), attempt(() => engine.generate('6' as unknown as number, 1)),
    attempt(() => engine.generate(6, Number.NaN)),
  ],
  rng: Array.from({ length: 5 }, ((g) => () => g())(rngMod.mulberry32(42))),
  shuffle: rngMod.shuffle([1, 2, 3, 4, 5, 6, 7, 8], rngMod.mulberry32(7)),
});
const json = JSON.stringify(out);
writeFileSync(OUT, json);
console.log(`records=${out.length} bytes=${json.length} sha256=${createHash('sha256').update(json).digest('hex')}`);
```

</details>

## Docs vendoring

- `node scripts/vendor-docs.mjs` (10.5 s) copied Vite `v8.3.2` (commit `1003321`): 38 files, 415 KB. It copied Vitest `v5.0.3` (commit `33cadea`): 216 files, 1354 KB. Both include their MIT `LICENSE`. The commits match `git ls-remote` for the two tags.
- `--check` before the copy: exit 1, manifest missing. With the manifest's Vite version edited to 8.3.1: exit 1, `vite: docs are 8.3.1, installed is 8.3.2`. Restored: exit 0.
- Type-aware lint of one file (the per-edit hook's cost): `npx eslint src/engine/solver.ts` took 2.1 s.

## Independent review (maker≠checker)

A fresh `code-reviewer` subagent reviewed the uncommitted diff against `cd90dca`. It re-ran `tsc` (0), `eslint .` (0) and `npm run test:run` (418 of 418) itself. It confirmed, by reading the code, that every hand edit is equivalent on all reachable inputs. That covers all four click cases, including a missing or non-numeric `data-row`. It found that no test lost strength, that no file dropped out of linting (`eslint . --debug`), that no tsconfig flag changes runtime behaviour, and that nothing contradicts `AGENTS.md`. It reported no blocker and no major, and six findings:

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | minor (future risk) | The locked `.claude/workflows/*.js` files got the strict and stylistic non-type rules. A harness update could then fail lint on files that may not be edited | **Fixed:** strict + stylistic now apply to `**/*.ts` only. `.js` keeps `js` + typescript-eslint `recommended`, as before this change |
| 2 | nit | `set()` with `?? EMPTY` treats a missing cell as writable, where the old code returned "contradiction" | **Fixed:** no fallback in `set()`, so the semantics are exactly the original's |
| 3 | nit | `setAt` and `bump` guards silently skip out-of-range writes, where the old casts threw | **Fixed:** they throw a `RangeError` |
| 4 | nit | `expect.assert` (chai) is not counted by `expect.assertions()`, and the message loses its "expected null not to be null" tail | **Comment added** on `q()`. No test uses assertion counting |
| 5 | nit | `rules.ts:28` still used the long null/undefined form | **Fixed:** `v != null` |
| 6 | nit (optional) | `play-page.ts:91` kept an `as` cast | **Fixed**, together with the other three `undefined`-stripping casts in `src/` (see the table above) |

Battery after the review fixes (14:46): `tsc` 0; `eslint .` 0 problems over the same 41 files; `npm run lint` 0; `npm run test:run` 418 of 418; `npm run build` 0; `npx openspec validate --all --strict` 2 of 2; `npm run check:docs` OK. Engine snapshot again byte-identical (same sha256 `0d47317e…`), and CLI identical for all nine cases. The fixes were not sent back to the reviewer for a second pass.

`npm run gate:status` (14:48, uncommitted tree): G0 PASS, G1 and G3 "needs sign-off", G2 PASS, and no header divergence. G4, G5, G6 and G8 read NOT-EARNED with "implementation paths are dirty/untracked — evidence must be committed". G7 is FAIL, as before, by the user's no-Playwright decision. The script rewrites generated reports: its G7 release run leaves `docs/qa/traceability-report.md` at "FAIL (47 failures)". Those reports were restored. Its two `gate-status-run` lines appended to `trace/ledger.jsonl` were kept, as telemetry.

## After the commits (user's go-ahead "commit it", 2026-10-06)

- **Commits:** `7b76610` (docs, vendored docs, script, `AGENTS.md`) and `ba430c5` (config, `src/`, `tests/`; `Refs: TC-1, TC-4`). Both are GPG-signed (`%G?` = `G`; probe exit 0 beforehand). The pre-commit hook ran secret scan, type-aware ESLint on the staged files, `tsc`, traceability and trajectory, and passed both times. The commit-msg trailer check passed. `--no-verify` was not used. The first commit's hook regenerated the trajectory report, which removed the one-count staleness noted above.
- **`npm run gate:status`:** G0 PASS, G1 and G3 "needs sign-off", G2 PASS, **G4 PASS**, G5 and G6 NOT-EARNED (coverage and recordings, as before), G7 FAIL (the user's no-Playwright decision, as before), **G8 PASS**. G4 and G8 were NOT-EARNED only because the work was uncommitted. They are back to their 2026-10-04 state.
- **`npm run check:trajectory`:** PASS, 1 warning (slice 1's unclean review evidence, as before). The `Refs:`-only `src/` commit outside any slice raised nothing.
- The handoff, autonomy log, context architecture and this file follow in the next commit.
