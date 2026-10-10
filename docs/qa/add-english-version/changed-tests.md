# add-english-version: tests that change on purpose (tasks 1.2, 1.3 engine re-read, 1.4, and the map of section 2)

Written 2026-10-10 by the test-engineer agent, from `openspec/changes/add-english-version/` (tasks 1.2, 1.3, 1.4, 2.1 to 2.6). Evidence document only. Line numbers are those of HEAD (`9f82cd7`) unless a line says "now". Rule applied (user memory "test changes trace to spec"): an existing test changes only when a changed scenario or requirement demands it, and its source is listed. No Ukrainian assertion was edited: every Ukrainian text, count of the Ukrainian page and sentence is byte-identical; English cases are added beside them. Nothing was weakened (the whole-object checks became `toStrictEqual`, which is stricter).

Evidence that the unchanged tests stay valid: the whole suite was run against a throw-away prototype of the change in a scratch copy (not in this tree, not committed): 67 files, 1651 tests, all green except the by-design NOT-EARNED gate of `tests/eval-hint-clarity-en.test.ts`; `npm run test:e2e` against the same prototype: 116 of 116 passed. So no test below is impossible to satisfy and no unlisted existing test breaks.

## 1. The greps as run (task 1.2)

`grep -rnE "localStorage|document.title|Script=Cyrillic|\[A-Za-z\]|documentElement|matchMedia|toEqual\(\{|toEqual\(fill\(|toEqual\(expected\)|expectedHint|hint-type|from '../src/ui/strings'" tests e2e evals` matches 264 lines in 43 files. Walked against the table of `design.md` ("Tests that change deliberately"):

| design.md row | Disposition |
|---|---|
| `play-page-page-text`, `-controls-text`, `ui-strings` (Ukrainian-only scans) | **Unchanged** (the Cyrillic/Latin scans run through `collectPageText`, which now skips an element whose own `lang` differs, see 2.5). `ui-strings.test.ts` gains one test (English texts live in strings.ts). Per-mode scans and key parity are NEW files. |
| `play-page-win`, `-cells`, `-techniques`, `-setup-sheet`, `-semantics` | **Unchanged**: they read Ukrainian texts of the default mode and none counts buttons or radiogroups. Confirmed green against the prototype. English cases are in `play-page-english-text.test.ts`. |
| `play-page-wcag` (58 to 60 buttons, 3 to 4 radiogroups) | **Changed** (2.4). |
| `hint-sentences`, `hint-sentences-techniques` | English blocks **added**, nothing edited. |
| `hint.test.ts` (`fill()` helper and about 13 whole-object checks) | **Changed** (2.1). |
| `helpers/hint-type.ts` l.16, `helpers/play-page.ts` l.966 | **Changed**; the real line of `expectedHint` at HEAD is **l.1209**, not 966 (stale number in design.md). |
| `play-page-level-seed`, `-confirm`, `-level-interplay`, `-level-4x4`, `-layout`, `-level-control` (Cyrillic scan about l.342) | **Unchanged** (Ukrainian mode). |
| `hint-line-balance`, `hint-unique-lines`, `hint-order-ceiling`, `hint-look-ahead` (whole-object `toEqual`) | **Three changed, one NOT**: see 2.2. `hint-look-ahead.test.ts` l.113 does not change (design.md lists it, the delta does not: a look-ahead fill carries only `steps`, which exists today; the table of «A hint exposes the data of its sentence» has "no" in every other column). It stays a guard. |
| `engine-purity.test.ts` | **Unchanged**, re-run green. A tagged copy of the scan is in `hint-language.test.ts`. |
| `main-entry`, `index-html` | **Changed/extended** (2.6). |
| `helpers/play-page.ts` (mount helper starts in English) | **Changed, additive** (2.5). |
| `e2e/nfr-10-fit`, `nfr-12-targets`, `nfr-13-a11y`, `nfr-18-flash`, `helpers` | **Changed/extended** (section 3). Not in the design table but touched for the same rows: `e2e/nfr-10-header-fit.spec.ts` (English variant). |
| `evals/cases/` | New file `hint-clarity-en.eval.ts` (2.7). |

Rows the grep and the design table both miss, found by a wider grep (`querySelectorAll('button'|'[role="radio"]'|'[role="radiogroup"]')`, `children`, `toHaveLength(3|5)` on the settings panel): `tests/play-page-stylesheet.test.ts` l.278 to 300 (radios 10 to 12, buttons 58 to 60) and `tests/play-page-settings.test.ts` (panel children 3 to 5, three places). Both are listed below.

## 2. Existing tests that change

Kind: C = assertion changes, H = helper only, A = additive change inside an existing file (nothing old edited).

### 2.1 Engine, source rows FR-110 and FR-112 (Q8 adds fields; design.md decision 1)
| File, HEAD line | Old behaviour | Change |
|---|---|---|
| `tests/hint.test.ts` l.11 to 13 | `fill()` returned a `Hint` without data | C: takes `{ axis, line, digit, empties?, size? }`, returns `HintAny` (type from `helpers/hint-type`) |
| `tests/hint.test.ts` l.21 to 30 (8 entries of `FILL_BOARDS`) | whole-object `toEqual` through `fill()` | C: data per entry; l.34, 40, 46 `toEqual(expected)` become `toStrictEqual` |
| `tests/hint.test.ts` l.50 to 75 (N=4, N=8, two plural-ending tests) | `toEqual(fill(...))` | C: data (`empties`, `size`) and `toStrictEqual` |
| `tests/hint.test.ts` l.101, 107 (numbering from 1) | `toEqual(fill(...))` | C: data, `toStrictEqual` |
| `tests/hint.test.ts` l.156 | `before[result.row]?.[result.col]` | C (type only): `result` is `HintAny` now, so `result.row ?? -1`; it is stricter (a non-fill fails) |
| `tests/hint.test.ts` l.201 to 202 (4x4 legal entry) | `toEqual(fill(...))` | C: data, `toStrictEqual` |
| `tests/hint-line-balance.test.ts` l.27, 35, 39, 43 | whole-object `toEqual` of a balance fill | C: + `axis`, `line`, `digit`; `toStrictEqual` |
| `tests/hint-unique-lines.test.ts` l.21, 29, 45 | same, unique fill | C: + `axis`, `line`, `other` (no `digit`); `toStrictEqual` |
| `tests/hint-order-ceiling.test.ts` l.203 | 4x4 legal-entry pair fill | C: + `axis` row, `line` 0, `digit` 1; `toStrictEqual` |
| `tests/helpers/hint-type.ts` l.16 | `hint` cast to `(board, ceiling?) => HintAny` | C: third parameter `language?`, the six data fields on `HintAny`, `sentenceOf`/`hasHintSentence` (a missing `hintSentence` is an assertion failure, never a TypeError), `dataFieldsOf` |
| `tests/helpers/play-page.ts` l.1209 (design.md says 966) `expectedHint` | `hint(board, 4)` | C: `expectedHint(root, language = 'uk')`, `hint(board, 4, language)` through a typed assignment, so tests still type-check against today's engine |

`tests/hint-sentences.test.ts`, `tests/hint-sentences-techniques.test.ts`: A only (English blocks appended, two comment lines, two imports).

### 2.2 Page helpers (`tests/helpers/play-page.ts`), source rows FR-111, FR-113, NFR-5 (A-52)
| HEAD line | Change |
|---|---|
| l.322 to 334 `resetPreferenceEnvironment` | H: also removes `<html lang>` (the page sets it, jsdom starts without one) |
| l.356 to 369 `mountOn`, `mountPage`, `mountFixture` | H: optional `language` ('uk' or 'en') stores `binarka.language` BEFORE the mount (task 2.3); not an option of the page |
| l.1078 (after `openSettings`) | A: `languageControl`, `languageOptions`, `languageOption`, `pressLanguage`, `languageStates`, `checkedLanguage`, `documentLanguage`, `storeLanguage` |
| l.805 to 835 `sizeButton`, l.1108 `levelButton` | H: the expected text of a button is the one of the page language (read from `<html lang>`); lookup by position unchanged |
| l.1523 to 1559 `collectPageText` | H: skips an element, and the text under it, whose own `lang` differs from `<html lang>` (NFR-5 per mode, design.md decision 5, A-52). This is a guard dependency: without it every Ukrainian scan would see the option "English". No test asserts the helper itself; with no `lang` on the page it skips nothing. |

### 2.3 Settings panel, stylesheet and accessibility counts (play-page), source rows FR-107, FR-65, NFR-9, design.md decision 7
| File, HEAD line | Old behaviour | Change |
|---|---|---|
| `tests/play-page-settings.test.ts` l.103 to 107 | the panel holds 3 children: label, theme control, close | C: 5 children, adding the label «Мова» and the language control before «Закрити» |
| same file l.180 to 192 (6 tests, retitled "five children") | the panel survives 6 actions, 3 children | C: 5 children; a 7th action (a language press) |
| same file l.261 to 274 «The theme texts are Ukrainian» | every collected text has Cyrillic and no Latin | C: skips the element with `lang="en"` (A-52); «Мова» and «Українська» join the required texts |
| `tests/play-page-wcag.test.ts` l.92 to 97 | 58 buttons, 3 radiogroups, 58 + 6 names, no Latin in any name | C: 60, 4, 60 + 7; the name "English" is the one exception; the names also include «Мова», «Українська», "English"; one English-mode test added (A) |
| `tests/play-page-stylesheet.test.ts` l.278 to 300 | 10 radios, 58 buttons in the list | C: 12 radios (the two language options), 60 buttons |
| `tests/play-page-action-buttons-stylesheet.test.ts` l.309 to 330 | the settings controls test loops over 5 controls | C (refactor only): the loop body is a function used by the old test (unchanged inputs) and by the new language test |

### 2.4 Head step and entry point, source rows FR-116, FR-109, FR-114, FR-115, FR-113
| File | Change |
|---|---|
| `tests/index-html.test.ts` helper `runHeadStep` | H: `language` option; returns `lang` and `title` |
| same, «The head step survives bad and throwing storage» | C: each run also asserts `<html lang>` = uk and the title «Бінарка» (added lines, theme assertions untouched) |
| same, «The duplicated names and colours equal the module and the tokens» | C: also the second key name in the head step and in the preferences module, and both titles in the head step and in `strings.ts` |
| `tests/main-entry.test.ts` | A: cleanup also clears storage and `lang`; one new test (`en` stored mounts English) |
| `tests/play-page-preferences.test.ts`, `tests/play-page-theme-stylesheet.test.ts`, `tests/ui-strings.test.ts` | A: new blocks at the end, nothing old edited |

### 2.5 e2e (task 2.4)
| File | Change |
|---|---|
| `e2e/helpers.ts` | `seedTheme` now calls `seedPreference(page, key, value)` with a marker per key (the shared `e2e-theme-seeded` marker would skip the second write of a test that seeds both); `openPage(..., { language })`; `sel.languageControl/languageOption`; `expectLanguage`, `pressLanguage`, `seededRandom` (the arithmetic of the `Math.random` seeding, for the search step) |
| `e2e/nfr-12-targets.spec.ts` | C: the Ukrainian probe is now `probe(page, w, h, 'uk')` (same measurements) and also measures the two language options with the settings panel open (NFR-12, FR-107); English test per viewport added |
| `e2e/nfr-13-a11y.spec.ts` | C: the focus sweep must reach a `language option` (list `expected` and `look()`); English axe states, the focused language option: added |
| `e2e/nfr-18-flash.spec.ts` | C: the observer filters `['data-theme', 'lang']` and tags each record by attribute; the theme tests read the same records as before; language variants 1 and 2 added |
| `e2e/nfr-10-fit.spec.ts`, `e2e/nfr-10-header-fit.spec.ts` | A: English tests (the header test is refactored into a function used by both languages) |

## 3. New files (the map of section 2)
`tests/hint-language.test.ts` (engine input, data, `hintSentence`, CLI guard, purity), `tests/helpers/hint-cases.ts`, `tests/play-page-language.test.ts` (task 2.2), `tests/play-page-english-text.test.ts` (task 2.2), `tests/helpers/english.ts`, `tests/eval-hint-clarity-en.test.ts` (task 2.5), `evals/cases/hint-clarity-en.eval.ts`. Every file carries `@trace` with plain ids.

## 4. Task 1.3 (engine re-read) and task 1.4
- Engine, read at HEAD: `src/engine/hint.ts` l.88 `export function hint(board: Grid, ceiling = 1): Hint`; `types.ts` `Hint` = fill (pair, sandwich, count, balance, unique) | fill (lookahead, `steps`) | none/broken, each with `sentence`; `index.ts` exports `hint` and no `hintSentence`. The delta pins the third parameter and the export list accordingly: no mismatch. The internal `Fill` of `techniques.ts` already holds `axis`, `line`, `digit`, `empties`, `other`, `steps` (no `size`): the page-visible fields of Q8 exist inside the engine already.
- Task 1.4 hooks against `design/README.md` iteration 13: `[data-control="language"]` with class `language-control`, `role=radiogroup`, `aria-label` «Мова»; options with `lang` and `data-language-option`; the label «Мова» above the group; the order theme group, language group, «Закрити». All agree. One difference to know: the design says the visible label is `p.settings-label` with `aria-hidden` ("the group carries the same aria-label"), while the signed decision F2 of the theme slice and the theme test demand the label NOT be `aria-hidden`; the delta says only "a plain-text element". The language tests assert "not a `label` element, immediately precedes the control, text «Мова»" and do not assert either way for `aria-hidden`.
- Drift of the baseline: `git diff 0445fd0 -- openspec/specs/` (0445fd0 added the folder) shows the effect of archiving `update-setup-sheet-start` and `add-theme-switch` (979 insertions, `play-page` only); `git diff 3532b42 -- openspec/specs/` (the last commit that edited the folder) is empty. A scripted comparison of the MODIFIED blocks against the baseline: all 35 + 13 MODIFIED requirement names exist in the baselines, no baseline scenario of any MODIFIED block is missing from the delta, no ADDED name (9 + 2) exists in a baseline.
- English variants not in the appendix, derived by the pattern of the requirement: pair of ones in a row, pair of zeros in a column, count of ones with several empty cells (listed `quoted: false` in `tests/helpers/hint-cases.ts`); the other cases are quoted verbatim by a scenario. The delta wins over the appendix wherever they differ (idle "Press" not "Tap", ", hinted", "one more 0 ... this must be a 1", "a rule would break within a few steps, so this cell must be 0").
