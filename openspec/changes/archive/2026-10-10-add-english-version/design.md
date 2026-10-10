# Design: add-english-version

Slice 3 of the combined amendment signed on 2026-10-10 (autonomy-log rows 116 to 120). Draft and dispositions: `docs/handoff/theme-language-amendment-draft-2026-10-09.md` (TD-Q2 to TD-Q10, A-49, A-52 to A-55). It copies the result of `add-theme-switch` (merge rule: earlier text first, this folder's sentences appended) and has the last word on the shared requirements.

## Goals

- An English version of every page text and every hint sentence, chosen by the player, remembered, applied before the first paint (FR-55, FR-56, FR-107 to FR-112, FR-113 to FR-116).
- A switch that re-renders in place: the board, entries, marked choice and focus stay; a hint on screen is the same hint in the other language (FR-108, FR-110).
- Text rules that a test can decide per mode, with exactly one named exception (NFR-5, A-52).

## Non-goals

- A third language, locale detection (A-49), a translated CLI (NFR-8, FR-28, FR-85 stay byte-identical), English pixel shots (TD-Q10), the pixel reference, a meta description (Q12).
- Visual specifics (English labels at 320 px, the summary button width, the one-screen fit): TD-D5, the designer checks them in `review-set-13`; the specs pin the fit only as sampled e2e (NFR-10).
- Authentication: none exists, so no redirect-to-login or forbidden case applies. No free value is typed, so no inline validation message and no raw 500 can occur.

## Key decisions

1. **ADR-worthy: the engine takes the language and exposes the data of a hint (TD-Q8, FR-110, FR-112).** `hint(board, ceiling = 1, language = 'uk')`; fill results gain `axis`, `line`, `digit`, `empties`, `other` and `size` (`steps` exists); a pure `hintSentence(hint, language = 'uk')` is exported from `src/engine/index.ts`. The page keeps the hint result on screen and calls the function on a switch. Why: after a hint the cell is filled, so a new hint call would be a different hint. Cost: the engine's public contract changes (the spec's "Engine interface" bullet, the export list and three whole-object `toEqual` tests: `tests/hint-line-balance.test.ts` l. 27, 35, 39, 43; `tests/hint-unique-lines.test.ts` l. 21, 29, 45; `tests/hint-order-ceiling.test.ts` l. 203; `tests/hint-look-ahead.test.ts` l. 113 stays unchanged as a guard, because a look-ahead fill gains no field: `docs/qa/add-english-version/changed-tests.md` l. 20). Alternative rejected: the page asks for both languages on the same board before the fill (no contract change, but two hint computations per press, and the second language is computed for nothing). The Ukrainian sentence and the other members of every result stay unchanged for every existing caller (the page at `src/ui/play-page.ts` l. 250, the eval case `evals/cases/hint-quality.eval.ts` l. 22 and the tests; the generator and the CLI do not call `hint`); the only new members are the data fields, and `hintSentence(hint, 'uk')` equals the old sentence (precedent: row 88, option B). The decision, with the rejected alternative (both sentences kept on the result), is written to `docs/adr/0005-hint-language-input.md` (task 1.5).
2. **Where the signature carries the language.** The draft says "the language is an engine input with the default Ukrainian" without naming the position; the delta pins the third parameter, `language`, after `ceiling`, so no existing call changes. A named-options object was rejected: it would change every call site.
3. **Two string tables of the same shape (FR-94).** `src/ui/strings.ts` keeps its Ukrainian export names and shapes unchanged (named constants, arrays, nested objects, `sizeLabel`, `cellLabel`, `summaryText`), adds an English table of the same shape (for example `EN`) and a language-keyed accessor; the parity test flattens the string leaves, compares the key sets and calls the format functions with sample arguments in both languages. The engine keeps its own sentences (A-54: the engine owns them), so the English hint wording lives in `src/engine/`, not in the strings module. The English wording is the appendix (row 119); the patterns for variants the appendix does not show (columns, ones, the other count endings, balance for a one) are derived by the same rule and listed in the engine scenarios; the eval judge and the reviewers may refine them, and a refinement edits the delta, the code and the tests together.
4. **Re-render in place (FR-108).** One `render()` pass re-sets texts and `aria-label`s on the existing elements; nothing is remounted, so focus, the sheet's marked choice, the board DOM and the hint-filled cell survive. Trade-off: every string has a render site; a test lists them (the table in «English page text»). A remount would lose focus and state.
5. **Per-mode scans with one exception (NFR-5, Q5, A-52).** Each language option is named in its own language and carries `lang`; the scan skips an element whose own `lang` differs from `<html lang>`, nothing else. "Binarka" is used for the title and `document.title` in English (Q3), so no second exception exists.
6. **Names kept, bodies per mode.** The «Ukrainian …» requirements keep their names so the archive matches; their bodies now start "In Ukrainian mode …" and an English scenario is added (precedent: `add-level-selector`). A reading rule in «English page text» says that every quoted Ukrainian text in an unmodified scenario describes Ukrainian mode.
7. **The shared requirements of the theme folder are extended, not duplicated.** «Stored preferences», «Invalid or missing…», «Failing storage…», «Preferences are applied before the first paint», «No flash…», «Common rules…», «The option controls are not part of the marked choice», «Settings button and panel», «Texts of the settings…», «The theme options set their own colours» get their language sentences here (the earlier-folder, later-extends rule). The panel gets «Мова» and the language group between the theme group and «Закрити».
8. **The head step becomes bilingual (FR-116).** It also sets `lang` and `document.title` and holds the second key name and both titles; the tests compare them with the module. A `MutationObserver` mount test asserts no Cyrillic is rendered and then replaced during an English mount (TD finding 5).
9. **Eval `hint-clarity-en` (TD-Q9, NFR-6).** Three cases (pair, sandwich, count), bar 80, graded by a fresh `eval-judge` in the `eval-suite` workflow; the baseline is minted only after a passing run (AGENTS.md, evals; `node scripts/check-eval-ratchet.mjs --update` writes `quality/eval-baseline.json`); the ratchet compares averages per dimension and would pass a new dimension as an improvement, so a vitest test (no script or CI change) reads `evals/results` for `hint-clarity-en` and fails on any `pass: false` or a score below 80; the rubric is adapted to English (English wording, no Cyrillic, "row"/"column"). Departs from row 9's "Ukrainian only".
10. **The pixel gate stays Ukrainian (Q10).** English is covered by the per-mode scans, e2e (NFR-10 fit, NFR-12 targets in English) and a11y (NFR-13 English states); the escalation for labels at 320 px is a 1 px-step width sweep from 320 to 400 px in English with the settings panel open, run before G2.

## Placeholders of TD-Q15

None open for this folder: the place of the language group is signed (row 120: the settings panel, «Мова» below «Тема»). Visual specifics only, kept out of the specs and built against `review-set-13`: English label wrapping at 320 px, the summary button width, the header at 320 px (TD-D5). The hooks `[data-control="language"]`, `[data-language-option]` and the class `language-control` are spec-made proxies confirmed in task 1.4.

## Data model

Stored: `localStorage['binarka.language']` = `uk` | `en` beside the theme key, nothing else. Page state: `language` (default `uk`), the hint result on screen (or none), the win flag. Engine: the fill result gains the optional fields of «A hint exposes the data of its sentence». New DOM: the label «Мова», the language radiogroup of two options with `lang`. New data: the English table in `src/ui/strings.ts`, the English sentences in `src/engine/`.

## Error handling strategy

- Bad stored language, missing key, empty value: Ukrainian, not rewritten (FR-114). Storage that throws: defaults, the press still applies for the session, no retry, no message (FR-115).
- A language other than `'uk'` or `'en'` passed to the engine is a malformed call and unspecified; the page only passes the two. The CLI never passes a language.
- A press during a pending action cannot happen (modal dialog, A-55); a press with the settings panel over the sheet leaves the marked choice to the panel-open rule of the theme folder.
- A hint region that is empty stays empty; the win region follows the same re-render.

## Tests that change deliberately (by FR)

From the draft's grep; the implementer re-greps (task 1.2). No test is weakened; the Ukrainian assertions stay byte-identical, English cases are added.

| File | What pins the old behaviour | Source |
|---|---|---|
| `tests/play-page-page-text.test.ts`, `tests/play-page-controls-text.test.ts`, `tests/ui-strings.test.ts` | Ukrainian-only scans and lists: the source scan stays, the per-mode scans and the key-parity test are added | NFR-5, FR-94, FR-111 |
| `tests/play-page-win.test.ts`, `-cells`, `-techniques`, `-setup-sheet`, `-wcag`, `-semantics` | Ukrainian texts read as the only texts; English scenarios added; button count 58 to 60, radiogroups 3 to 4 | FR-41, FR-70, FR-93, FR-96, NFR-9 |
| `tests/hint-sentences.test.ts`, `tests/hint-sentences-techniques.test.ts` | Ukrainian-only sentence checks; English cases added | FR-112, NFR-4, NFR-5 |
| `tests/hint.test.ts` | whole-object `toEqual` through the `fill()` helper (about l. 11 to 12, 34, 40, 46, 50, 54, 60, 63, 69, 75, 101, 107, 202) changes with the new fields; English cases added | FR-110, FR-112 |
| `tests/helpers/hint-type.ts` (l. 16: `hint` is cast to `(board, ceiling?) => HintAny`) and `tests/helpers/play-page.ts` (l. 966: `expectedHint` calls `hint(readBoard(root), 4)`) | the signature gains the language; `expectedHint` takes a language argument (default `'uk'`) | FR-112, FR-40 |
| `tests/play-page-level-seed.test.ts`, `-confirm`, `-level-interplay`, `-level-4x4`, `-layout`, `-level-control` (the Cyrillic/Latin scan at about l. 342 to 343) | import Ukrainian texts from `src/ui/strings.ts` or scan texts for Cyrillic: they keep the Ukrainian exports and run in Ukrainian mode | NFR-5, FR-94 |
| `tests/hint-line-balance.test.ts`, `tests/hint-unique-lines.test.ts`, `tests/hint-order-ceiling.test.ts`, `tests/hint-look-ahead.test.ts` | whole-object `toEqual` on a fill result (new fields) | FR-110, FR-112 |
| `tests/engine-purity.test.ts` | no change expected (the language is a plain value); re-run | TC-7 |
| `tests/main-entry.test.ts`, `tests/index-html.test.ts` | the head step gains `lang`, the title and the second key | FR-116, FR-109 |
| `tests/helpers/play-page.ts` | the mount helper can start in English (stores `binarka.language` before the mount) | FR-113 |
| `e2e/nfr-10-fit.spec.ts`, `e2e/nfr-12-targets.spec.ts`, `e2e/nfr-13-a11y.spec.ts`, `e2e/nfr-18-*.spec.ts`, `e2e/helpers.ts` | Ukrainian only; gain English samples and the `lang` assertions | NFR-10, NFR-12, NFR-13, NFR-18 |
| `evals/cases/` | a new case file in the dimension `hint-clarity-en` | NFR-6 |

## Risks and mitigations

- **The contract change breaks callers:** the default keeps every Ukrainian sentence and the old members of every result unchanged; the four `toEqual` files are listed and the purity test re-run.
- **A string without a render site:** the key-parity test and the "English page at mount" scenario catch a missing counterpart; the in-place render test (a switch and a switch back restores every text byte for byte) catches a missed site.
- **A string without a render site, an export that changed shape:** the Ukrainian exports keep their names and shapes, so the six test files that import them do not change.
- **English wording drift:** the appendix is the wording; a refinement edits the delta, the code and the tests in one step.
- **Screen readers announce a changed live region again** (A-53): accepted, not tested (A-28).
- **English labels at 320 px:** observed in the browser check; the design owns the fix (TD-D5).

## Ambiguities in the draft and the reading chosen

- The signature position of `language` (above, decision 2) and the exact field names of Q8 (the draft lists "axis, line, digit, empties, other, steps, and the board size"): `size` for the board size, present only for the count sentence, which needs it for the number word; `line` and `other` are 0-based like `row` and `col`, the sentences number from 1.
- "The language half of FR-116 is completed in the English slice" and "built for both keys" (draft section 8): read as the theme folder specified the machinery for the theme key and this folder MODIFIES the same requirements for the language key.
- The draft lists NFR-8 as "note only": no delta; the CLI stays English and byte-identical, checked by the existing CLI scenarios.
- English sentence patterns not in the appendix (see decision 3): derived by the same rule; the balance sentence for d = 1 was "one more one" in the draft; the audit refinement (E15, below) made it "one more 1 … this must be a 0", which is what the code says. The eval grades pair, sandwich and count only (task 2.5); the balance, unique and look-ahead sentences are not graded (Scope NOT delivered, first review run).
- A-1, A-20 and A-28 are assumption rows ("labels in the page language"); they change in `docs/requirements.md` at application, not in a spec.

- The audit (row 121, E15 to E20) refined the wording of the appendix, as row 119 allows: the balance sentence says "one more 0" / "one more 1" and "this must be a 1" / "a 0"; the look-ahead sentence says "a rule would break … so this cell must be 0"; the idle line says "Press the cells"; the cell suffix is ", hinted"; techniques item 1 says "only one more 0 or only one more 1". The number style of the other sentences ("two zeros", "three ones") is left as it is (E18).

## Baseline text edits at archive

Archive normally and in the SAME commit edit the non-requirement text:

1. **`openspec/specs/play-page/spec.md`:** Purpose (the page offers Ukrainian and English); Ownership (FR-55, FR-56 MVP, FR-107 to FR-112, FR-113 to FR-116 language parts, NFR-5 per mode, NFR-18 held); DOM contract: the mount reads the stored language, the board label (l. 24) per language, `document.title` (l. 36) per language, the «Ids» bullet unchanged (five), new bullets «Language control» and the settings panel contents; the generator/hint bullet (l. 20: "an expected hint … is `hint(board, 4)`") gains the language argument (`hint(board, 4, language)`, default `'uk'`); Exclusions: remove "FR-55 … is Future" and "FR-56 … is Future" (l. 2302 to 2303).
2. **`openspec/specs/puzzle-engine/spec.md`:** the "Engine interface" bullet (l. 13): `hint(board, ceiling = 1, language = 'uk')`, the fill result's added fields, the `hintSentence` export; the Purpose line on Ukrainian sentences; the Exclusions line "FR-56 (English hint sentences) is Future" removed; the prose of «Hint order and ceiling» (`hint(board, ceiling = 1)`).
3. **Harness files (row 117):** the `AGENTS.md` line and the three harness lines change in the commit that applies the amendment; confirm in task 1.1.

Before archive confirm that no baseline requirement already carries one of the ADDED names, and rebase the MODIFIED blocks on the baseline as it is then. Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`.

## Audit findings: disposition

Fresh audit of 2026-10-10 (autonomy-log row 121). Each cited line was checked against the files before folding.

- E1 (major, «Idle line» "never changes its text"): folded ("…except on a language switch (FR-108)").
- E2 (major, "byte-identical" with new data fields): folded. «Hint language is an engine input» now says the `sentence`, `kind`, `row`, `col`, `value`, `rule` and `steps` are unchanged and the only new members are the data fields; the "English changes only the sentence" scenario also asserts the data fields equal across languages.
- E3 (major, row/column clause for no-rule and broken sentences): folded; the clause is restricted to pair, sandwich, count, balance, unique and the look-ahead pair.
- E4 (major, changed-tests gaps): folded. Checked: `tests/hint.test.ts` `fill()` helper, `tests/helpers/hint-type.ts` l. 16, `tests/helpers/play-page.ts` l. 966, and the six strings importers are in the table; the 1.2 grep catches `toEqual(fill(` and `toEqual(expected)`.
- E5 (major, strings shape): folded. «English page text» says the Ukrainian exports keep their names and shapes, the English table has the same shape plus an accessor, and the parity test flattens leaves and calls the format functions.
- E6 (major, no exit-coded per-case gate): folded. Checked: `scripts/check-eval-ratchet.mjs` compares per-dimension averages and says "improved" for a new dimension. A vitest test (no script or CI change) fails on any `pass: false` or score below 80; task 4.5 names `--update` and `quality/eval-baseline.json`; the rubric is adapted to English, not "the same".
- E7 (major, NFR-10 fixture not injectable): folded. Checked: `e2e/helpers.ts` seeds `Math.random`. A search step (task 2.4) finds a seed and level whose first hint is a balance fill and the test asserts it.
- E8 (major, ADR): folded as task 1.5, `docs/adr/0005-hint-language-input.md` (0001 to 0004 exist).
- E9 (major, FR-116 language key): folded in the two head-step scenarios.
- E10 (major, stale-state re-render): folded (three new scenarios: cleared hint and win stay empty; 4×4 state across a switch, reason hidden at 6×6 and 8×8).
- E11: folded. Checked by grep: `hint` is called only at `src/ui/play-page.ts` l. 250, `evals/cases/hint-quality.eval.ts` l. 22 and the tests; `src/cli.ts` imports only `generate`, and the generator does not import `hint`. The "generator, CLI" claim is removed; a CLI guard scenario is added.
- E12: folded. `size` only on count results; the exact `Object.keys` scenario is dropped; the English number words "five" to "eight" are stated as untested like the Ukrainian side; the 1 px width sweep is a task in 4.6 or goes under "Scope NOT delivered".
- E13, E14: folded (7.1; the proposal table).
- E15 to E17, E19, E20: folded as wording refinements (row 119 lets reviewers refine): balance "one more 0 … this must be a 1", look-ahead "a rule would break … so this cell must be 0", techniques item 1, "Press the cells", ", hinted". E18 (number style): left as is, noted under "Ambiguities".
