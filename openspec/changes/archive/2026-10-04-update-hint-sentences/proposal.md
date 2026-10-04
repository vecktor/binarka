# Change: update-hint-sentences

## Why

The NFR-6 eval (`docs/qa/eval-report.md`) failed: the hint sentences say WHAT
may be placed but not WHY, so a player who does not know the rules cannot follow
them. The user signed the fix in chat on 2026-10-05 at about 00:03 (UTC+5:30;
`docs/autonomy-log.md` row 38): every pair, sandwich and count sentence appends
the reason. The rule is the same as before (FR-19, FR-20, FR-21); only the
wording changes, and with it the sentences pinned in the baseline spec and in the
tests.

## What Changes

- Pair sentence: «<Два нулі|Дві одиниці> поспіль у <рядку|стовпці> K, тож поруч
  може стояти лише <одиниця|нуль>, бо три однакові цифри поспіль заборонені.»
- Sandwich sentence: «Між двома <нулями|одиницями> у <рядку|стовпці> K може
  стояти лише <одиниця|нуль>, бо три однакові цифри поспіль заборонені.»
- Count sentence, 2 or more empty cells in the line: «У <рядку|стовпці> K вже
  <count phrase>, а нулів і одиниць має бути порівну, тож решта порожніх клітинок
  — <одиниці|нулі>.»
- Count sentence, exactly 1 empty cell in the line: same start, ending «тож
  остання порожня клітинка — <одиниця|нуль>.»
- Which rule fires, which cell is targeted, the value, the order of rules, the
  no-rule and broken-board sentences are unchanged.
- Spec: a delta `specs/puzzle-engine/spec.md` with six MODIFIED requirements
  (Pair hint, Sandwich hint, Count hint, Hint explanation names the line type and
  number, Broken-board hint, Every hint sentence is exactly one sentence) and
  one new scenario in Count hint. No ADDED or REMOVED requirement.
- Code: only `src/engine/hint.ts` (the three sentence builders). No dependency.

Scope in: FR-19, FR-20, FR-21 (wording), NFR-4 (still one sentence), NFR-5 (still
Ukrainian), NFR-6 (the quality bar the new wording must clear).

Scope out: the rule logic, hint choice order, the no-rule and broken-rule
sentences, the page, the rubric of `evals/cases/hint-quality.eval.ts`, English
hint sentences (FR-56, Future).

## Impact

- Affected specs: `puzzle-engine`. MODIFIED requirements only; a normal archive
  merge (not `--skip-specs`) replaces the six requirement blocks.
- Affected code: `src/engine/hint.ts`. Affected tests: see `design.md`.
- The page shows the engine sentence unchanged, so the play-page spec and
  `src/ui/` need no edit; the page tests that pin the old text do.
- Commits carry trailers `Slice: update-hint-sentences` and `Refs: FR-19`,
  `Refs: FR-20` or `Refs: FR-21`.
