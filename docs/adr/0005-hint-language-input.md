# ADR-0005: The hint engine takes the language as an input

Status: **ACCEPTED** by the signed amendment of 2026-10-10 (TD-Q8, autonomy-log row 118: "signed, use defaults"). Written at task 1.5 of `openspec/changes/add-english-version` before any engine code (audit finding E8, row 121).

## Context

- FR-56 and FR-112 make every hint sentence available in English, and FR-110 says a hint shown on screen re-renders as **the same hint** in the other language after a switch.
- After a hint the page fills the cell. A second `hint()` call on the board after the switch would then explain a different cell, so the page cannot ask the engine again.
- The engine owns the sentences (A-54, TC-7): no sentence text lives in `src/ui/`. The engine stays pure: it has no DOM, no storage and no `Math.random`.
- Today `hint(board, ceiling = 1)` returns a result whose `sentence` is Ukrainian. The page (`src/ui/play-page.ts`), the eval case `evals/cases/hint-quality.eval.ts` and the tests call it. The CLI and the generator do not.

## Decision

1. `hint(board, ceiling = 1, language = 'uk')`: the language is the **third parameter**, after `ceiling`, with the default `'uk'`, so no existing call changes (design decision 2).
2. A fill result gains the data its sentence is built from: `axis`, `line`, `digit`, `empties`, `other`, and `size` on count results only. `steps` already exists. `line` and `other` are 0-based like `row` and `col`; the sentences number from 1.
3. A pure `hintSentence(hint, language = 'uk')` is exported from `src/engine/index.ts`. It rebuilds the sentence of any result in either language. The page keeps the result on screen and calls it on a switch. Its parameter is `Sentenceless<Hint>`, a result without its `sentence`, also exported; a full `Hint` is one too. This was amended in the first review fix round of `add-english-version`, so that `hint()` builds no placeholder objects.
4. For every existing caller, the Ukrainian `sentence`, `kind`, `row`, `col`, `value`, `rule` and `steps` stay byte-identical. The only new members are the data fields, and `hintSentence(h, 'uk')` equals `h.sentence` (precedent: row 88, option B).

## Alternatives rejected

- **Keep both sentences on the result** (`sentence` plus `sentenceEn`, or a map by language). It needs no new export, but every hint computes a sentence in a language nobody shows. A third language would add a field to every result, and the page still could not re-render a result made before a wording change.
- **Ask the engine twice before the fill**, once per language on the same board. The contract is unchanged, but each press does two hint searches, and the second language is computed for nothing.
- **A named-options object** (`hint(board, { ceiling, language })`). It changes every call site and every test that passes a ceiling.

## Consequences

- The engine's public contract changes. The «Engine interface» bullet of `openspec/specs/puzzle-engine/spec.md`, the export list and the whole-object `toEqual` tests of fill results change deliberately (`tests/hint.test.ts` through `fill()`, and `hint-line-balance`, `hint-unique-lines`, `hint-order-ceiling`, `hint-look-ahead`).
- The CLI stays English-only and byte-identical. It never passes a language (NFR-8; a guard test pins that `src/cli.ts` imports neither `hint` nor a language).
- A language other than `'uk'` or `'en'` is a malformed call and is unspecified; the page passes only those two.
