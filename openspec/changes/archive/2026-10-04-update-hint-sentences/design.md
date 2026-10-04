# Design: update-hint-sentences

## Goals

- Every pair, sandwich and count hint sentence states the reason, in one Ukrainian
  sentence (NFR-4, NFR-5), so a player without game knowledge can follow it
  (NFR-6).
- The NFR-6 eval cases (`eval-hint-clarity-pair`, `-sandwich`, `-count`) each
  reach at least 80 out of 100.

## Non-goals

- Changing which rule fires, which cell is targeted, or the rule order (FR-23).
- Changing the no-rule and broken-rule sentences, the page, or the eval rubric.
- English sentences (FR-56), a second hint level, or a longer explanation.

## Key decisions

1. **Append a reason clause to each sentence; keep the existing start.** Pair and
   sandwich get «, бо три однакові цифри поспіль заборонені». Trade-off: longer
   sentences (about 100 characters) in the message line under 375 px; the clause
   is what the eval asked for and the sentence stays one sentence (commas only).
2. **The count sentence chooses its ending by the number of empty cells in that
   line at hint time.** With 2 or more empty cells: «..., тож решта порожніх
   клітинок — <одиниці|нулі>.» With exactly 1: «..., тож остання порожня
   клітинка — <одиниця|нуль>.» The old «решта клітинок» read wrongly when only one
   cell was left, and the singular needs a singular noun (gender agreement,
   NFR-6). The count of empty cells is `N` minus the filled cells of the line,
   computed from the board alone (never the solution, A-6). Trade-off: the builder
   needs one more input (empty count) and the spec needs a scenario for each
   ending. The fill target is unchanged: still the first empty cell of the line.
3. **Count reason is the balance rule, not the triple rule.** «а нулів і одиниць
   має бути порівну» matches FR-21 (the line already holds N/2 of one digit).
   Not ADR-worthy: wording only, no structure or dependency changes; the signed
   user decision is in autonomy-log row 38.
4. **Existing count scenarios all have exactly one empty cell** (`0 1 0 1 . 0`,
   `1 0 1 0 . 1`, N = 4 `0 1 0 .`, N = 8 `0 1 0 1 0 1 0 .`), so they move to the
   singular ending. The plural ending gets a new scenario on the existing board
   row 2 `0 1 0 . . 0` (two empty cells). The user's brief assumed the existing
   scenarios were the plural case; they are not, so the added scenario is the
   plural one and the singular one is covered by the four modified scenarios.

## Data model

None. `Hint` keeps its shape (`kind`, `row`, `col`, `value`, `rule`, `sentence`);
only the `sentence` text changes. `COUNT_WORDS` and the count phrase are unchanged.

## Error handling

No new error path. A board that breaks a rule still returns the broken-rule
sentence before any rule sentence; a board with no applicable rule still returns
the no-rule sentence. The count builder is only reached for a line with at least
one empty cell, so the empty count is at least 1 and the singular and plural
branches are exhaustive.

## Affected tests (update first, red)

Grep of `tests/` for the old sentences («поспіль у», «Між двома», «решта»):

- `tests/hint.test.ts`: the table at lines 22 to 29 (4 pair, 2 sandwich, 2 count),
  the N = 4 and N = 8 count cases (lines 51 to 63), the numbering cases (lines 89
  and 95) and the broken-board case (line 190). Add the two-empty-cell count case.
- `tests/hint-sentences.test.ts`: line 60 (count sentence for row 5); keep the
  NFR-4 and NFR-5 loops over N = 4, 6, 8 (they assert one sentence and Cyrillic
  only, no sentence text).
- `tests/play-page-hint.test.ts`: lines 188, 193 and 235 (page message equals the
  engine sentence).
- `tests/play-page-helpers.test.ts`: line 251.
- `tests/play-page-rules-and-reset.test.ts` and `src/ui/play-page.ts` contain
  «поспіль у» only in the rules block text (FR-57); not a hint sentence, unchanged.

`evals/cases/hint-quality.eval.ts` does not pin any sentence: `produce()` calls
the real `hint()` on fixed boards, so the new wording reaches the judge without a
case edit. `evals/results/latest.json` holds the old scores and sentences and is
replaced by the eval-suite re-run. The ratchet baseline is raised only if every
case scores at least 80.

## Risks and mitigations

- A sentence grows a sentence break by accident (a full stop in the clause):
  `isOneSentence` is asserted for every kind at N = 4, 6 and 8
  (`tests/hint-sentences.test.ts`), and the templates use commas only.
- The wording still scores under 80: the eval-suite re-run decides; do not touch
  the rubric to pass it. If it fails, report back to the user for a new wording.
- The empty-cell count is computed on the wrong axis for columns: a column
  scenario (`1 0 1 0 . 1`) and a row scenario are both pinned.
- `docs/requirements.md` assumption A-15 quotes the old pair wording; it is
  documentation, not changed by this change (the orchestrator updates docs).

## Baseline text edits at archive

None expected beyond the merge. The six MODIFIED requirements replace their
baseline blocks as a whole; the Purpose and Exclusions text of
`openspec/specs/puzzle-engine/spec.md` pin no hint sentence. Archive with
`npx openspec archive update-hint-sentences --yes` (a normal merge, NOT
`--skip-specs`) and confirm with `git diff openspec/specs/puzzle-engine/spec.md`
that only those six blocks changed.
