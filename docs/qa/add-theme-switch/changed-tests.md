# add-theme-switch: tests that change on purpose (tasks 1.1, 1.2 and the evidence for 1.4)

Written 2026-10-10 (task 1.2 of `openspec/changes/add-theme-switch/tasks.md`; task 1.4 is answered in section 9 only as far as it can be read from files: it needs the user or the orchestrator for the decisions marked DECIDE). Evidence document only: no test, source or spec file was edited, no box was ticked, nothing was committed. Read first: `proposal.md`, `design.md`, `tasks.md`, the whole of `specs/play-page/spec.md` of the change folder, and the design source `design/v0/app/binarka.css`, `design/v0/components/binarka-page.tsx`, `design/v0/app/layout.tsx`, `design/v0/components/open-settings-panel.tsx`.

Rule applied (user memory "test changes trace to spec"): an existing test changes only when a changed requirement, scenario or rule demands it. The source of each change is the delta scenario plus the signed row. Signed rows behind the slice: autonomy-log row 116 (the request), 117 (the `testMatch` pattern), 118 (amendment signed 2026-10-10, TD-Q1 to TD-Q15, A-48 to A-55), 120 (wireframe B: settings button, panel, fifth id, header order), 121 (TC-14 and FR-72 amended: the gear is the second `svg`), 123 (design gate on `review-set-13`).

Line numbers are those of HEAD f9ddf47 (`update-setup-sheet-start` implemented at e9e8df0, plus its review-gate fix round 3e4fd71 and f9ddf47, not archived; those two commits changed only `tests/play-page-marked-choice.test.ts` (+18 lines, one new test) and `src/ui/play-page.ts` / `src/ui/style.css` comments and rules, so no other cited line moved; the 13 tokens are unchanged). Several lines that `design.md` cites are stale; this file uses the lines found now (section 10 lists the differences).

## 1. Task 1.1 evidence (basis check)

| Check | Result |
|---|---|
| `ls openspec/changes/archive \| grep update-setup-sheet-start` | no match. `openspec/changes/update-setup-sheet-start/` is still a change folder. |
| `grep -c "Marked choice" openspec/specs/play-page/spec.md` | 0 (the task wants at least 1). So the stated precondition ("archived") is NOT met. |
| autonomy-log rows 116 to 120 | present (lines 130 to 134); rows 121, 122, 123 also present (135 to 137) |
| `docs/requirements.md` carries FR-102 to FR-118 and TC-12 as amended | yes: FR-102 l.142, FR-113 l.152, FR-118 l.157, TC-12 l.202 (FR-102..FR-118 all in the 142..158 block) |
| NFR-18 in `docs/requirements-held.md` with its pending tag | yes: l.20 (row) and l.41 (note "moves into `docs/requirements.md` on the row-68 (1) pattern once the spec exists and is seen failing"). It is NOT in `docs/requirements.md` (correct for now). |
| the sheet's implementation is in the tree | yes: `git log` shows e9e8df0 "setup sheet marks a choice; one «Почати» starts one puzzle" and the review-gate fix round 3e4fd71, f9ddf47; `tests/play-page-marked-choice.test.ts`, `tests/play-page-start-button.test.ts` exist and `src/ui/style.css` still has exactly 13 `--color-*` tokens. |

Verdict: this document was produced on the caller's instruction although the "archived" precondition is not met, so it is written against the code at HEAD f9ddf47, which is what the red tests will run against. 1.1 is NOT ticked. The remaining 1.1 items (rows, requirements, held NFR-18) are as expected. Before section 2 starts, the archive of `update-setup-sheet-start` is still pending; the test files that both slices touch (`play-page-wcag`, `play-page-stylesheet`, `play-page-level-stylesheet`, `play-page-keyboard`, `play-page-hinted-cell`) are already in their post-`update-setup-sheet-start` state, so this list does not depend on the archive. `trace/ledger.jsonl` and `docs/qa/update-setup-sheet-start-green-run.txt` are modified in the working tree; neither is part of this task and neither was touched here.

Task 1.3, read from files only (not asked, recorded because 1.2 depends on it): `tests/play-page-level-stylesheet.test.ts` l.112 records "the tokens are the 13 of the baseline (no 14th is added by this slice)". So the FR-65 sentence "13, or 14 with that token" resolves to 13, `TOKEN_NAMES` stays 13, and the "no 14th colour token" assertions keep their number.

## 2. The greps as run, and what they miss

Command of task 1.2, run as written over `tests` and `e2e`: 242 matching lines in 28 files (`e2e/helpers.ts`, `tests/engine-purity.test.ts`, `tests/helpers/css.ts`, `tests/helpers/play-page.ts` and 24 test files; counts per file are in the table of section 5). Most `toHaveLength(2|4|8)` hits are false positives (`spy.calls` length 2, given-cell counts, `violationCells` 8, `children` of the level control or the sheet). Each hit was walked; the ones that matter are in sections 4 to 7.

Gaps of the 1.2 pattern, closed by a wider grep (`querySelectorAll('button' | '[role="radio"]' | '[role="radiogroup"]' | 'svg' | '*' | 'label')`, `role="radio"`, `aria-checked=`, `popovertarget`, `popoverCalls`, `tabindex`, `index.html`). What it added:

- `tests/play-page-stylesheet.test.ts` l.234 to 235 `root.querySelectorAll('[role="radio"]')` `toHaveLength(7)`: not matched by the pattern; the theme options are `[role="radio"]` inside the root, so it becomes 10.
- `tests/play-page-logo.test.ts` l.36 to 42 `logoOf` (`header.querySelectorAll('svg')` must be exactly 1) and l.148 to 152 `expectSameLogo`, which reach the logo only through that helper.
- `tests/play-page-hinted-cell.test.ts` l.362 to 377 (the "actions that change no cell keep the marker" tests): needs a new row for the settings panel (FR-66 MODIFIED).
- `tests/play-page-keyboard.test.ts` l.68 to 130 (T1 to T3): the focus scenario for a theme press is new; T1 to T3 stay.
- `tests/ui-strings.test.ts` l.165 to 185 (`wanted` list of the strings module) and l.83 to 90 (the `aria-hidden` letter guard, see section 9 flag F2).
- `tests/main-entry.test.ts` and `index.html`: not in the grep output at all (no matching term), listed by `design.md`; see section 6.
- Confirmed NOT affected by the wider grep: every helper that counts radios or buttons is scoped by `data-control` (`sizeControl`, `levelControl`, `sizeButtons`, `levelButtons`, `tests/helpers/play-page.ts` l.653 to 665 and l.885 to 896), so the theme options do not leak into them.

Method for the scenario comparison: each `#### Scenario:` of the delta was compared by name and text with the baseline and with the `update-setup-sheet-start` delta. Result: 10 MODIFIED requirements (the proposal and `design.md` say 10; `tasks.md` l.12 and l.57 say "8 MODIFIED blocks", see ambiguity A7) and 17 ADDED. None of the 17 ADDED names exists in the baseline or in the `update-setup-sheet-start` delta. Five of the 10 MODIFIED names (Hinted cell marker, Every cell is its own Tab stop, Cells and buttons show a visible, unobscured focus indicator, The summary and level buttons set their own colours, The page meets the WCAG 2.2 AA criteria) are also MODIFIED by `update-setup-sheet-start`; a sentence-level comparison of the first paragraph shows that the theme version keeps every sentence of more than 30 characters of the setup-sheet version (no drift found by that check; it reads only the first paragraph and does not prove the scenario lists).

## 3. Kind legend

| Code | Kind | Meaning |
|---|---|---|
| H | helper only | The test file is not edited; only `tests/helpers/*.ts` or an in-file helper changes. |
| C | assertions change | The delta changed what is asserted (a count, a list, a set loop). The title may stay. |
| R | renamed | The scenario name changed; the test is retitled. (None needed here: no baseline scenario name disappears.) |
| N | new test | A delta scenario with no existing test. |
| G | guard, unchanged | The test stays as it is and keeps passing, or is green by construction now and will cover the new surface. |

## 4. `tests/helpers/css.ts` (the helper, T-C lines)

The design decision is that the dark values live in `:root[data-theme="dark"]`, an attribute block that is a `:root` rule for the colour scan and an override set for the contrast checks. A naive change (`isRootRule` also accepting the attribute selector) is WRONG and is spelled out here because it fails three ways: `tokenDeclarations` (l.165 to 167) would collect each token twice (the "declared once" tests would go red for the wrong reason), `parsed.tokens` would silently become the dark set (last declaration wins), and `withTokensInlined` / `injectPageStyles` would inline dark values everywhere. Four separate predicates or changes are needed:

| Line (today) | What it does now | Change | Source |
|---|---|---|---|
| l.149 `isRootRule` | accepts only the selector `:root` (every selector of the rule) | keep as the PLAIN predicate. It stays the filter of `tokenDeclarations`, `tokens` and the conditional sets. Add a second predicate, e.g. `isDarkRootRule`: selector matches `:root[data-theme=<q>dark<q>]` with `<q>` a double quote, a single quote or none (jsdom keeps the quote style in `selectorText`, probed in jsdom 29: `":root[data-theme='dark']"` and `":root[data-theme=\"dark\"]"` stay different strings). Only the top level (context `[]`) counts; a dark block inside `@media` is not the shipped shape and is treated as an ordinary conditional `:root`-like rule, not as the dark set. | FR-65, A-51, TD finding 8 |
| l.281 to 303 `scanColours`, skip at l.284 | skips `isRootRule` rules | skip when `isRootRule(rule) \|\| isDarkRootRule(rule)`. Then `--color-*` and `#rrggbb` inside the dark block are allowed and a literal or token anywhere else still fails. | FR-65 («Rules use the tokens and no colour literal is left») |
| l.165 to 168 `tokenDeclarations`, `tokens` | top-level `:root` rules only | UNCHANGED. `tokenDeclarations` and `tokens` stay the light set, so "each token declared once in the plain `:root`" (stylesheet l.76 to 82, level-stylesheet l.197 to 200) and "no 14th token" (level-stylesheet l.206) keep their meaning. A new field, e.g. `darkTokenDeclarations`, holds the `--color-*` declarations of the dark block for the "declared once in the dark block" assertion. | FR-65 («Tokens exist and are literal») |
| l.169 to 178 `tokenSets` | `[top-level, ...one per conditional :root rule]` | insert the dark set SECOND, label e.g. `data-theme=dark`, built as an override set over the top-level tokens exactly like the `@media` branch (`{ ...tokens, ...overrides }`). Conditional sets still apply over the top-level set (spec: "the top-level set with each conditional block's overrides applied"). If the file has no dark block there is no dark set (a stylesheet test must then fail on an assertion, see section 5.2). | FR-65, A-51 |
| l.349 to 353 `withTokensInlined(text)` and l.426 to 429 `injectPageStyles()` | inline the top-level tokens only | gain an optional token-set argument (default: the top-level set, so every current caller is unchanged): `withTokensInlined(text, tokens?)`, `injectPageStyles(tokens?)`. Needed by «The cascade gives each cell state the colours whose contrast is checked» (the test injects the stylesheet once per set with that set's values substituted). | FR-65 |
| l.309 to 323 `TOKEN_NAMES`, l.368 to 377 `CONTRAST_PAIRS` | 13 names, 20 pairs | unchanged | FR-65 (13 tokens, section 1) |
| new export | none | a way to get `[light, dark]` as `[{label, tokens}, ...]` with an assertion that the dark one exists (so a per-set loop cannot pass on the light set alone) | FR-65 |

`tests/play-page-helpers.test.ts` self-tests of these (the helper's own tests; no existing test there changes, the cases are NEW):

| Existing lines that touch token sets (all stay, G) | New cases (N) |
|---|---|
| l.438 to 445 "finds the :root tokens" (tokens, `tokenDeclarations` length 2); l.467 to 478 "builds one extra token set per conditional :root rule" (`tokenSets` length 2, label `top-level`, `toHaveLength(1)` on a file without a conditional block); l.480 to 486 "a token redefined in @media ... in its own set only"; l.488 to 495 "counts a token declared in two :root rules"; l.549 to 550 "does not scan :root, but scans inside @media ..."; l.582 to 588 `withTokensInlined` | (1) a dark attribute block is a token set: second in `tokenSets`, label as chosen, overrides applied over the top-level set, `parsed.tokens` and `tokenDeclarations` unchanged; (2) both quote styles and the unquoted form are accepted, `:root[data-theme="light"]` and `:root[data-theme="dark"] .x` are NOT; (3) a `#rrggbb` literal and a `--color-*` declaration inside the dark block are allowed by `scanColours`, the same literal in `.x` and in `@media` still fail, and `--color-*` in `.x` still counts in `tokensOutsideRoot`; (4) a file with no dark block gives no dark set; (5) a conditional `:root` plus a dark block gives both sets, the conditional one built from the top-level set; (6) `withTokensInlined(text, tokens)` and `injectPageStyles(tokens)` use the given set and default to the top-level one; (7) a dark set with a failing pair is found in its own set only (like l.480). |

## 5. `tests/helpers/play-page.ts` (T-P lines) and the lifecycle

| Line (today) | What it does now | Change | Source |
|---|---|---|---|
| l.184 to 198 `installPageLifecycle` | `beforeEach`: title, dialog stubs, popover stubs; `afterEach`: remove roots, body, title, injected styles, stubs | before AND after each test: clear `localStorage` and `sessionStorage`; remove `data-theme` and the inline `color-scheme` from `<html>`; remove any `meta[name="theme-color"]` a test injected (the baseline jsdom head has none); expire every cookie; reset the `matchMedia` stub (listeners) and remove it after; RESTORE `window.localStorage` if a test replaced it with a throwing getter (`Object.defineProperty` is NOT undone by `restoreMocks: true` in `vitest.config.ts`; spies on `Storage.prototype` ARE restored by it, so use `vi.spyOn(Storage.prototype, ...)` for `getItem`/`setItem` and an explicit descriptor restore for the access test). | A-50, FR-113, FR-115, design.md "Risks": cross-test leakage |
| new | none | `installMatchMedia({matches})` returning `{ setMatches, fire, listeners }` for `(prefers-color-scheme: dark)` (object `{ matches, media, addEventListener, removeEventListener }`, records `change` listeners, lets the test fire them; a variant that throws when called and one that returns an object without `addEventListener`) | A-50, FR-105 |
| new | none | constants `SETTINGS_LABEL = 'Налаштування'`, `THEME_LABEL = 'Тема'`, `THEME_OPTION_LABELS = ['Світла','Темна','Як у системі']`, `THEME_KEY = 'binarka.theme'` beside `CLOSE_LABEL` (l.800); helpers `settingsButton(root)`, `settingsPanel(root)` (l.819 `sheetOf` pattern), `settingsCloseButton`, `themeControl(root)`, `themeOptions(root)`, `pressTheme(root, 'light'\|'dark'\|'auto')`, `checkedTheme(root)`, `openSettings(root)` (calls the stubbed `showPopover()`, like `openSheet` l.843) | FR-102, FR-117, A-44 |
| l.41 to 51 `PAGE_ORDER` | nine elements | UNCHANGED (the delta still names nine; the gear sits between two of them inside `header`) | FR-68 |
| l.480 to 505 `expectPageStructure` | header holds the title and exactly one rules button | UNCHANGED (still true; the gear is an extra child of the header) | FR-68 |
| l.1331 `collectPageText` | skips text under `aria-hidden="true"` | UNCHANGED, but see F2: if the «Тема» label carries `aria-hidden` (the design's markup), `collectPageText` and the `ui-strings` guard treat it differently | NFR-5 |

## 6. Existing tests that change, per file

Format: `file:line, test name` | what pins the old behaviour | delta requirement / scenario | source | kind.

### 6.1 `tests/play-page-stylesheet.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.74 to 82 "Tokens exist and are literal: 13 names, each declared once in the top-level :root" | `tokenDeclarations` per name has length 1 | «Tokens exist and are literal» first clause (top-level `:root` once) | FR-65 | G (stays; goes red only if the helper is wrong). The AND clause (dark block declares each once) is a NEW sibling test (section 7). |
| l.84 to 88 "No colour literal is left", l.102 to 104 "No --color-* property is declared outside :root" | `scanColours(parsed).literals` / `.tokensOutsideRoot` empty | «Rules use the tokens and no colour literal is left» (the dark block counts as `:root`) | FR-65, A-51, TD finding 8 | H (the file is not edited; these two would fail once the dark block exists if the helper still skipped only `:root`. In the planned order, task 2.1 changes `css.ts` BEFORE `style.css` gets the dark block, so they stay green throughout and the red evidence comes entirely from the new tests and the new helper self-tests; do not wait for a red here) |
| l.90 to 100 named / shorthands / colourProperties | scans over non-root rules | same scenario | FR-65 | G |
| l.106 to 131 named rules and the `button` rule take their tokens | `expectDecl` on `body`, `.cell`, ... | same scenario (unchanged text) | FR-65 | G |
| l.134 to 138 "Cell borders have 3:1", l.140 to 152 "The given cue has 3:1 and is not the fill", l.154 to 158 "The violation cue has 3:1", l.160 to 164 "The focus ring has 3:1", l.166 to 171 "The control border has 3:1 and the text pairs 4.5:1" | each calls `contrastProblems(parsed.tokens, [group])`, i.e. the LIGHT set only; l.148 to 151 also compare `given-border` with `cell-border` on `parsed.tokens` | five scenarios whose GIVEN is now "the resolved colours of the tokens of each token set (light, then dark)" | FR-65, A-51 | C (loop the same assertion over `[light, dark]`; keep the declaration assertions of l.144 to 147 once). Not listed in `design.md`'s table (it lists only l.173); the delta text demands it. See A1 if the orchestrator prefers l.173 alone. |
| l.173 to 180 "Every pair holds for the top-level token set and for every set a conditional :root block makes" | loop over `parsed.tokenSets` (length at least 1, first label `top-level`) | «A token redefined in a conditional block is checked too» (light AND dark always exist) | FR-65 | C: add a non-vacuity assertion that a dark-labelled set exists (without it the loop passes on the light set alone) and that it has all 13 `#rrggbb` tokens; title may gain "and the dark set". |
| l.228 to 256 "Every page button is a button element" | `[role="radio"]` `toHaveLength(7)` (l.234 to 235); button list; total `1+1+7+1+1+3+1+2+36` = 53 (l.252) | «Every page button is a button element» (now also the three theme radios, `[data-action="settings"]`, `[data-action="settings-close"]`) | FR-65, FR-102, FR-117 | C: 7 becomes 10 (the size, level AND theme radios are all inside the root), the list gains the gear and the panel's close, the total becomes 58. `panelButtons` premise (rules panel holds 1 button) stays. |
| l.258 to 269 the `:has(` / `!important` exception | one rule with `:has(` | «The stylesheet stays inside the build target, with one `:has(` exception» (unchanged text) | FR-65 | G |
| l.281 to 295 "The size buttons declare a color and a background-color token, unchecked and checked, with 4.5:1" | resolves from `parsed.tokens` only (helpers `token`, `tokenOf` l.44 to 67) | «The size buttons declare their colours» third clause: 4.5:1 "in each of the two states in the light token set and in the dark token set" | FR-65, A-51 | C (run the ratio once per set; the declaration assertions once) |
| l.297 to 302 touch-action | | «The board sets touch-action» | | G |
| l.336 to 369 "The computed border is heavier ..." | border widths only | unchanged | | G |
| l.371 to 390 "The cascade gives each cell kind the token colours at NxN" | `injectPageStyles()` then colours resolved from `parsed.tokens` | «The cascade gives each cell state the colours whose contrast is checked» (once with the light values, once with the dark values; the test injects the stylesheet with the values of the set substituted) | FR-65, A-51 | C + H (needs `injectPageStyles(tokens)` from section 4) |
| l.393 to 401 "The contrast helper is not vacuous" | | unchanged | | G |

### 6.2 `tests/play-page-level-stylesheet.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.57 to 69 "The summary and level buttons declare their colours" | `tokenOf` against `parsed.tokens` (names only) | unchanged text | FR-65 | G |
| l.71 to 87 "Each state has 4.5:1 text" | `hexOf(parsed, name)` reads `parsed.tokens` | «Each state has 4.5:1 text» "in each token set" | FR-65, A-51 | C (loop the four states over light and dark; `hexOf` takes a token set) |
| l.89 to 103 "The unavailable level has a cue besides colour" | | unchanged | | G |
| l.119 to 161 "The start button declares its colours" | l.144 to 147 and l.153 to 160 compute the ratio from `parsed.tokens` | «The start button declares its colours» last clause "at least 4.5:1 in each token set" (`design.md` T1: «Почати» included) | FR-65, A-51 | C (ratio once per set, for the plain pair and for every hover / active / focus-visible state pair). Not named in `design.md`'s table (it names l.70 to 86 only); the delta text demands it. |
| l.164 to 177 checked-level cue, l.179 to 191 classes | | unchanged | | G |
| l.193 to 215 "The existing stylesheet scans still pass" | `tokenDeclarations` once per name (l.197 to 200); scans empty; `Object.keys(parsed.tokens)` is 13 (l.206); one `:has(` | «The existing stylesheet scans still pass» (unchanged text) | FR-65 | G (this is the test that keeps "13" honest; do NOT raise 13: section 1) |

### 6.3 `tests/play-page-wcag.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.49 to 66 `accessibleNames` (in-file helper) | groups = `[role="radiogroup"]`, `[data-section="setup"]`, `[data-board]` | «Every button, the radiogroups, the sheet and the board have a Ukrainian name»: the settings panel joins the named groups ("the board group, the three radiogroups, the setup sheet and the settings panel") | NFR-9, FR-117 | C (add `[data-section="settings"]` to the groups) |
| l.69 to 102 "Every button, the radiogroups, the setup sheet and the board have a non-empty Ukrainian accessible name" | `button` `toHaveLength(53)` (l.76), radiogroups `toHaveLength(2)` (l.77), `names` `toHaveLength(53 + 4)` (l.79); `all` contains the 53 names | same scenario: 58 buttons, three radiogroups, the setup sheet, the settings panel and the board (6 groups), names 58 + 6 = 64; the names also include «Налаштування», «Тема», «Світла», «Темна», «Як у системі» | NFR-9, FR-117, A-41 | C |
| l.104 to 114 no tabindex | | unchanged | | G |
| l.117 to 130, l.132 to 148 level / marked-state groups | | unchanged | | G |

### 6.4 `tests/play-page-semantics.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.80 to 95 `expectedIdElements` (in-file helper) | returns `[panel, heading, sheet, dialog text]` in a FIXED order | «The cell contract is unchanged and only five elements have ids»: adds the settings panel | A-41, FR-117 | C. DECIDE (A2): the delta does not pin where the settings panel sits relative to the rules panel and the sheet, and `idElements(root)` is in document order, so a fixed-order `toEqual` would pin an unspecified order. Proposal: compare as sets (sort both by `compareDocumentPosition`) and keep the order-free assertion. |
| l.138 to 178 "The cell contract is unchanged and exactly four elements have an id" | `three` length 4; the action list ends at `pressNew`; titles say four | same scenario: five ids; after "a click, a hint, a size change, a level change, a theme press and a new puzzle" | A-41, FR-117 | C + renamed title ("five"): count 4 to 5, the list gains a theme press (`pressTheme`), the premise comment about eight/four |
| l.169 to 178 "Two mounts in one document share no id: four ids each, eight different ones" | 4, 4, 8, 8 | «Two mounts share no id»: five each, ten different, `document.querySelectorAll('[id]')` is ten | A-41 | C + renamed title |
| l.97 to 136 role and name of the board, size follows, failed size change | | unchanged | | G |
| l.338 to 367 "The radiogroup is named «Розмір поля» by its aria-label; no label, no select, no for, and no text node shows the name" | `root.querySelectorAll('label')` 0; the text nodes of the page do not contain «Розмір поля» | still true under the delta (the theme label is a plain text element, not a `label`) | FR-62 | G (and it now covers the "no label element" half of «The group is named by its aria-label and no label element exists» for the whole root) |

### 6.5 `tests/play-page-rendering.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.122 to 139 "two mounts on two roots have no tabindex, stay independent and have four different ids each" | `idsA`, `idsB` `toHaveLength(4)`, `Set` size 8, `document.querySelectorAll('[id]')` 8 | «Two mounts share no id» (five each, ten) | A-41, FR-117 | C + renamed title |
| l.99 to 120 "mounting replaces the previous content of the root", "two mounts ... independent" | | unchanged | | G |

### 6.6 `tests/play-page-logo.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.36 to 43 `logoOf` | `headerOf(root).querySelectorAll('svg')` must be exactly 1 (the header now holds two) | «One decorative inline logo in the header»: "the heading in the header contains exactly one `svg` (the logo)" | FR-72 and TC-14 as amended 2026-10-10, FR-117 | H (scope the query to the heading: `header h1 svg` / the heading found by `HEADINGS`); makes l.78 to 84, 86 to 121, 123 to 130, the "survives every board change" body and the seed test follow the new scope with no edit |
| l.66 to 76 "One decorative inline logo in the header" | `header.querySelectorAll('svg').length` 1 (l.69), `root.querySelectorAll('svg').length` 1 (l.70) | same: the heading holds the logo, the root holds exactly one other `svg` (the gear inside `[data-action="settings"]`), no third, both `aria-hidden="true"` | FR-72, TC-14, FR-117, rows 120 and 121 | C |
| l.147 to 182 "The logo survives every board change" (`expectSameLogo` l.148 to 153) | heading holds exactly one `svg`, same element, no text node | adds "and the root still holds exactly two `svg` elements" | FR-72, FR-117 | C (one added assertion in `expectSameLogo`) |
| l.132 to 145 "No image file is used" | loops over `root.querySelectorAll('svg')` for `href`/`xlink:href`; `use`, `img`, ... 0 | unchanged text; now also covers the gear | TC-14 | G |
| l.184 to 194 "The logo does not leak the seed" | every text node and attribute of the root | unchanged; covers the gear's attributes for free | | G |
| «The gear holds no text and no reference» | none | new scenario | TC-14, FR-117 | N (section 7) |

### 6.7 `tests/play-page-layout.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.372 to 380 "the header holds the heading «Бінарка» followed by the rules button" | `expectInDocumentOrder([heading, rulesButton])` only | «Order at mount» AND clause: the header holds the heading, then `[data-action="settings"]`, then `[data-action="rules"]`, in this order | FR-68, FR-117, row 120 | C (rename: "... the settings button and the rules button"; order is now a 3-element sequence) |
| l.367 to 370 "header, summary button, board, hint, reset, new, idle, hint and win messages follow each other" (`expectNineInOrder`, `PAGE_ORDER`) | nine elements once, in order | «Order at mount» first clause (unchanged nine) | FR-68 | G |
| l.401 to 409 "the panel is not inside the header, the message area or [data-board], and it follows the message area" | for the RULES panel | the rules scenario is unchanged; «The settings panel is outside the sequence» is NEW | FR-68, FR-117 | G + N (section 7) |
| l.137 to 155, l.157 to 199 rules button / panel | `header.querySelectorAll(RULES_BUTTON)` 1 | unchanged | | G |
| l.383 to 398 message area | `area.querySelector('[data-board], [data-action], [data-section="rules"]')` null | unchanged | | G |

### 6.8 `tests/play-page-action-buttons-stylesheet.test.ts`

| Line, test | Old behaviour | Delta scenario | Source | Kind |
|---|---|---|---|---|
| l.135 to 246 the seven existing tests (length reader, action buttons, stripping, no `!important`) | the three action buttons | not MODIFIED | NFR-12 | G |
| l.259 to 288 «The stylesheet declares a 44 px minimum height for the three buttons» | `SHEET_BUTTONS` (start, summary, close) | not MODIFIED; the settings controls are a different scenario | NFR-12, FR-101 | G |
| new section, same pattern as `SHEET_BUTTONS` | none | «The stylesheet declares a 44 px minimum height for the settings controls» (the three theme options, `[data-action="settings"]`, `[data-action="settings-close"]`: computed `min-height` at least 44 px, no declaring rule inside an at-rule, no `!important`) | NFR-12, FR-117 | N (section 7). `design.md` says the "button lists gain the gear ..."; they are NEW tests in a new section, no existing test is edited. |

### 6.9 Storage-related tests (verified true; kept)

| Line, test | Old behaviour | Verdict | Kind |
|---|---|---|---|
| `tests/play-page-marked-choice.test.ts` l.252 to 272 "The marked choice is not remembered" (clears both stores, mounts, marks, asserts `localStorage.length` 0 and `sessionStorage.length` 0) | true under the delta: no theme press, no write at mount (FR-113) | G (the file's own `clear()` becomes redundant once the lifecycle clears; not removed) |
| `tests/play-page-size-selector.test.ts` l.309 to 326 "The choice is not remembered", `tests/play-page-level-control.test.ts` l.305 to 319 "The level is not remembered" | same. NOTE: level-control l.306 to 308 asserts "premise: localStorage is empty" WITHOUT a prior `clear()`: it holds only because no earlier test of the file writes. The lifecycle clear (section 5) makes the premise independent of file order. | G, protected by H (lifecycle) |
| `tests/engine-purity.test.ts` l.39 | `src/engine` must not name `localStorage` | G (TC-7: the engine never reads storage; the preferences module lives in `src/ui/`) |

### 6.10 Other files named by `design.md`, with the verdict

| File | `design.md` says | Verdict | Reason |
|---|---|---|---|
| `tests/ui-strings.test.ts` | "text scans and string lists gain the five strings" | NO existing test changes. The scenario «The settings and theme texts live in the strings module» is NEW and goes next to the existing `wanted` test (l.165 to 185), the pattern `update-setup-sheet-start` used for «Почати» (l.161 to 164 comment). The Cyrillic source scans (l.130 to 147, l.186 to 192) are guards and already cover the new `src/ui/*.ts`/`*.css` files. The `aria-hidden` letter guard (l.83 to 90) is relevant to F2. | The strings sentence in the delta is a new requirement, not a modified one. |
| `tests/play-page-page-text.test.ts`, `tests/play-page-controls-text.test.ts` | "text scans ... gain the five strings" | NO change. page-text l.32 to 61 loops over `collectPageText(root)`; it covers the five strings (Cyrillic, no Latin) automatically (the settings panel is in the root). controls-text collects the size control, the dialog and the cells only. Counts in page-text (`'Поле 6×6'` twice, 36 cell names) are unaffected. | Guards. |
| `tests/main-entry.test.ts` | "gains the head step and the built-file premise" | NO change. It imports `src/main.ts` and asserts the 6x6 board (`FR-31`). The head step and the built file are tested in the NEW `tests/index-html.test.ts` (task 2.2). Mounting without a `matchMedia` stub resolves auto to light (FR-105) and does not throw. | The delta does not modify «Mount entry point and fixtures» (the doc edit of `design.md` "Baseline text edits" is prose, not a requirement). |
| `tests/play-page-cells.test.ts` l.159 to 187 | | NO change: its own list of seven controls (three sizes, hint, reset, new, rules), `toHaveLength(7)` is that list, not a page count. FR-69 is not in the MODIFIED set. | |
| `tests/play-page-confirm.test.ts` l.74 to 96 | | NO change: the dialog still follows the rules panel; the settings panel also precedes it (not asserted), two dialog buttons. | |
| `tests/play-page-setup-sheet.test.ts` l.116 to 122, l.215, l.240 to 246, l.316 to 346 | | NO change: the sheet children and the sheet outside the header are unchanged; the theme control is not in the sheet. | |
| `tests/play-page-keyboard.test.ts` T1 to T3 (l.68 to 135) | | NO change (T1: no tabindex anywhere is still true; the order cells-between-summary-and-hint is unchanged). The new focus scenario is a NEW test beside them. | |
| `tests/no-image-assets.test.ts` | | NO change: `index.html` has no icon link / `img`, the stylesheet no `url(`; the gear is inline in `src/ui/play-page.ts`. Its header comment still says "the single inline SVG graphic" (a comment; not edited here). | |
| `tests/play-page-hinted-cell.test.ts` l.362 to 377 | | NO existing test changes; one NEW `it` for the settings row (section 7). | |

## 7. New tests per delta scenario (N), with the proposed file

Every test gets the plain `@trace` ids of its requirement. Files are the ones named by `tasks.md` 2.2 unless noted. "Red" = fails now (no settings button, no theme control, no head step); "guard" = can pass before the implementation.

### 7.1 `tests/play-page-settings.test.ts` (`@trace FR-68`, `FR-102`, `FR-117`, `NFR-9`, `NFR-5`)

| Requirement | Scenarios (one test each) |
|---|---|
| Settings button and panel (6) | «Settings button and panel at mount»; «The close button»; «The panel opens and closes with no script» (spies on `showPopover`/`hidePopover`/`togglePopover`, click gear then close, nothing else changes); «The header order is the title, the settings button, «Правила»» (positions of the heading, gear and rules inside `header`); «Two mounts stay independent»; «The panel survives every action» (hint, win, reset, new, size, level, theme press: same element, same three children) |
| Theme control (4) | «Theme control structure and default» (localStorage empty, no `matchMedia`); «The control follows its visible label in the settings panel»; «The stored choice is checked at mount» (the value is unchanged: spy on `setItem`/`removeItem`); «The group is named by its aria-label and no label element exists» |
| Texts of the settings button, panel and theme control (1 of 2) | «The theme texts are Ukrainian» (collection of text nodes and `aria-label`/`title`/`alt`/`label` of the gear and the panel; contains the six texts; Cyrillic, no Latin). Do NOT use `collectPageText` for this (it skips `aria-hidden`); use a collector like `ui-strings` l.45 to 61 over the two roots, so a hidden «Тема» does not slip through (F2). |
| Common rules for the theme and language options (2) | «The options are native buttons in the tab order» (no `tabindex`/`aria-label`/`disabled`, `pressKey` events not default-prevented); «No id is added» (ids under the root: none on the group or options) |
| Page document order, MODIFIED (1 NEW) | «The settings panel is outside the sequence» goes into `tests/play-page-layout.test.ts` beside l.401 (same shape as the rules scenario) |

### 7.2 `tests/play-page-theme.test.ts` (`@trace FR-103`, `FR-104`, `FR-105`, `FR-106`, `FR-118`, `FR-100`)

| Requirement | Scenarios |
|---|---|
| A theme press acts at once and changes nothing else (3) | «A theme press changes only the theme» (6x6 board with entries, hint with `cell-hinted`, violations, sheet marked with 8x8 and Мозколамка, counting seed source, `generate` spy, `showModal` spy, settings panel open, focus on «Темна»); «A theme press opens and closes nothing»; «Pressing the chosen option changes nothing» (`setItem` spy, stored `dark`) |
| Effective theme on the document (1 here, 2 elsewhere) | «The attribute follows the choice» (dark, light, auto = light system). «The stylesheet sets color-scheme for each theme` → `tests/play-page-theme-stylesheet.test.ts` (7.5). «The rendered colours follow the effective theme» → `e2e/nfr-13-a11y.spec.ts` (8). |
| Auto follows the system theme live (5 here, 1 e2e) | «Auto resolves to the system theme at mount» (stub matches / not matches); «Auto follows a live change» (fire the recorded listener; meta follows; second fire gives light); «A manual choice ignores the system» (light pressed + dark pressed); «A broken matchMedia does not stop the page» (throws / no `addEventListener`); «Without matchMedia auto is light». «A system change writes nothing» → preferences file (7.3). «Auto follows a live change in a real browser» → e2e (8). |
| Browser colour follows the theme (2 here) | «A document without the meta does not stop the page»; «The meta follows every change of the effective theme» (document with the head of `index.html`, `content` equals `--color-page` of the dark / light / dark set read from the stylesheet via the css helper, never a literal copied from the page). «The meta exists once and has the page colour» → `tests/index-html.test.ts`. |
| The option controls are not part of the marked choice (2) | «A press leaves the marked choice alone» (sheet marked, settings panel opened via the stub, the sheet's closing `toggle` not yet dispatched, press «Темна», `hidePopover` not called); «Opening the panel closes the sheet and discards the marked choice» (focus is placed OUTSIDE the sheet, e.g. on the gear; with the existing code the focus half is a GUARD because `src/ui/play-page.ts` l.350 to 366 already returns focus only from inside the sheet; the theme-option-still-checked half is red) |

### 7.3 `tests/play-page-preferences.test.ts` (`@trace FR-113`, `FR-114`, `FR-115`, `FR-100`, `TC-12`)

| Requirement | Scenarios |
|---|---|
| Stored preferences (5) | «A press writes the pressed value once» (`setItem` called twice: `dark`, then `auto`; no other key); «Pressing the default option on a fresh page writes nothing»; «Nothing else writes» (cells, hint, «Нова головоломка» confirmed, «Скинути», marks, «Почати», system `change`; stores and `document.cookie` empty); «The page source names no other store» (scan of `src/**` and `index.html` for `sessionStorage`, `document.cookie`, `indexedDB`; a GUARD, green now); «The stored choice survives a remount» |
| Invalid or missing stored values fall back (6 rows) | one parametrised test over the table (key missing, empty, `Dark`, `system`, `ru`, `{}`): `aria-checked="true"` on «Як у системі» only, effective theme the system theme, no `setItem`/`removeItem` call, stored value unchanged |
| Failing storage does not stop the page (3) | «The access to localStorage throws» (descriptor override, restored in `afterEach`); «getItem throws» (`vi.spyOn(Storage.prototype,'getItem')`); «setItem throws and is not retried» (spy counts 1, a second press on the same option does not call it again) |
| Auto (1) | «A system change writes nothing» |

### 7.4 `tests/index-html.test.ts` (`@trace FR-116`, `FR-106`, `FR-113`)

| Requirement | Scenarios |
|---|---|
| Browser colour follows the theme (1) | «The meta exists once and has the page colour»: exactly one `meta[name="theme-color"]`, none `meta[name="description"]` (design source has a description via Next metadata; the delta says none, Q12, F7) |
| Preferences are applied before the first paint (5) | «The head step is a classic inline script in the head» (parse `index.html`; the Vite module script stays in the body); «The head step sets the attributes» (stored `dark`, `light`, `auto` with a dark system); «The head step survives bad and throwing storage»; «The duplicated names and colours equal the module and the tokens» (key and the two colours against the preferences module's exports and `--color-page` of the light and dark sets); «The built file keeps the order» (the test runs its own `vite build --outDir <mkdtemp> --emptyOutDir`, fails loudly, never skips; per-test timeout of tens of seconds; `vite` 8 is a dev dependency and there is no `vite.config.ts`, so defaults apply). |

Proposed way to run the head step in jsdom (DECIDE A5): `new JSDOM(html, { runScripts: 'dangerously', beforeParse(window) { /* install localStorage / matchMedia stubs */ } })` runs the REAL inline script exactly as a browser does (jsdom is already a dev dependency; external module scripts are not loaded, `resources` defaults to none). The alternative, extracting the text and calling `new Function`, would pass a fake `window`/`document` and could miss a bare `localStorage` or `location` reference.

### 7.5 `tests/play-page-theme-stylesheet.test.ts` (new file; `@trace FR-65`, `FR-104`, `FR-117`, `NFR-9`; A-51 is cited in the file comment only, because `@trace` tags carry plain FR/NFR ids)

| Requirement | Scenarios |
|---|---|
| Effective theme on the document | «The stylesheet sets color-scheme for each theme» (top-level `:root` declares `color-scheme: light`, the dark block `dark`; via the helper's dark rule, not raw text) |
| Borders, cues and focus rings (NEW scenarios of a MODIFIED requirement) | «Tokens exist and are literal», second clause: the dark block declares each of the 13 names once as `#rrggbb` (sibling of stylesheet l.74); «The page has no prefers-color-scheme block» (raw text search). Per-set pair tests are the C rows of 6.1. |
| The theme options set their own colours (3) | «The theme options declare their colours» (`.theme-control button` and `.theme-control button[aria-checked='true']` each declare `color` and `background-color` as a single `var(--color-...)` of a declared token, no `opacity`; the class `theme-control` is on `[data-control="theme"]`); «Each state has 4.5:1 text in both themes» (four ratios); «The chosen option has a cue besides colour» (a `border-style`/`border-width`/`box-shadow`/`text-decoration` declaration in the checked rule that the plain rule lacks). Rules are looked up with `rulesWithSelector` (a grouped selector list such as `.size-control button, .theme-control button` is found). |

### 7.6 Other new tests in existing files

| File | New test | Scenario | Source |
|---|---|---|---|
| `tests/play-page-action-buttons-stylesheet.test.ts` | new section «The stylesheet declares a 44 px minimum height for the settings controls» | NFR-12 touch-target floor (jsdom half) | NFR-12, FR-117 |
| `tests/play-page-wcag.test.ts` | «The theme radiogroup exposes its state» (`aria-checked` on «Як у системі», then «Темна» after a press; no `aria-disabled`) | NFR-9 | NFR-9, FR-102 |
| `tests/play-page-hinted-cell.test.ts` | one `it` beside l.362: "Opening the settings panel and pressing a theme option keeps the marker" | «Actions that change no cell keep the marker», new table row | FR-66, FR-103 |
| `tests/play-page-keyboard.test.ts` | «A theme press leaves the focus on the option» (focus on «Темна», press, `document.activeElement` still it, `root.querySelectorAll('[tabindex]')` 0) | «Every cell is its own Tab stop», new scenario | FR-59, FR-103, FR-117 |
| `tests/play-page-logo.test.ts` | «The gear holds no text and no reference» | Logo, new scenario | TC-14, FR-117 |
| `tests/ui-strings.test.ts` | «The settings and theme texts live in the strings module» (`src/ui/strings.ts` contains the six texts as source text; no other `.ts`/`.css` of `src/ui/` and no `src/main.ts` has Cyrillic) | Texts of the settings button ..., second scenario | NFR-5, FR-94 |
| `tests/play-page-layout.test.ts` | «The settings panel is outside the sequence» | Page document order, new scenario | FR-68, FR-117 |
| `tests/play-page-helpers.test.ts` | the css-helper cases (section 4) and lifecycle cases: the `matchMedia` stub records and fires listeners and is removed after a test; storage, `<html data-theme>`, `meta[name=theme-color]` and cookies are clean at the start of a test; a replaced `window.localStorage` getter is restored | A-50, FR-113, FR-115 | helper self-checks, no `@trace` (like the rest of that file) |

## 8. e2e changes (task 2.4, 2.5) and `playwright.config.ts`

| File, line | Today | Change | Source | Kind |
|---|---|---|---|---|
| `e2e/helpers.ts` l.21 to 44 `sel` | no settings hooks | add `settings`, `settingsPanel`, `settingsClose`, `themeOption`, `themeControl` | NFR-12, NFR-13 | H |
| `e2e/helpers.ts` l.6 to 19 `openPage` | `addInitScript` seeds `Math.random`, `goto('/')` | accept an optional stored theme: `addInitScript` that sets `localStorage['binarka.theme']` with a ONCE-ONLY guard (an `addInitScript` runs again on every reload and would overwrite a press); a press-then-reload step sets storage by `page.evaluate` instead. New `openSettings`/`closeSettings`. Existing callers unchanged. | design.md "Risks"; AGENTS.md lesson, capture determinism item 5 | H |
| `e2e/nfr-12-targets.spec.ts` l.34 to 41 `pageControls` | summary, hint, reset, new, rules | add the gear (`sel.settings`) to the closed-state page controls | NFR-12, FR-117 | C |
| `e2e/nfr-12-targets.spec.ts` after l.45 | rules panel, then sheet | new block: `openSettings`, measure the three theme options and `settingsClose`, close (Escape); same eight viewports and `below(..., CONTROL_FLOOR, ...)` | NFR-12 «Measured in a real browser ...» | N/C |
| `e2e/nfr-13-a11y.spec.ts` l.150 to 165 `look()` | kinds: cell, size option, level option, rules-close, confirm, else `data-action` | add `[data-theme-option]` to the kinds (otherwise `kind` is `''` and `record` returns early, so the theme option is silently skipped); `settings-close` already falls out of `data-action` | NFR-13 «The focused theme option shows an indicator» | C |
| `e2e/nfr-13-a11y.spec.ts` l.72 `expected` | 13 kinds | add `settings`, `settings-close`, `theme option` (the first two follow the existing rule "every control reached by the keyboard"; the delta names only the theme option: DECIDE A6) | NFR-13 | C |
| `e2e/nfr-13-a11y.spec.ts` after l.58 in the focus test | rules, sheet, confirmation | open the settings panel by keyboard (Enter on the gear), `sweep` | NFR-13 | C |
| `e2e/nfr-13-a11y.spec.ts` new `describe`s | system scheme only (l.34 `test.use({ colorScheme })`) | (a) manual `dark` on a light system and manual `light` on a dark system, each axe run with the settings panel closed and open (all five axe tags of l.17); (b) «A manual theme resolves the same tokens as auto on that system» (computed colours of `body`, a cell and a button, `dark` stored on light vs `auto` on dark); (c) «The focused theme option shows an indicator» (Tab to a theme option; computed outline style not `none`, width at least 2px); (d) «The rendered colours follow the effective theme» (`body` background equals the dark `--color-page`, root `color-scheme` is `dark`); (e) «Auto follows a live change in a real browser» (`page.emulateMedia`, no reload, `data-theme`, `body` background and the meta); (f) the T12 browser check "`light` stored on a dark OS, reload". Dark `--color-page` is read from the built stylesheet or computed, never copied from the design. | NFR-13, FR-104 to FR-106 | N |
| `e2e/nfr-18-flash.spec.ts` | none | variant 1 (`page.route('**/assets/*.js', r => r.abort())`, `data-theme` and body background), variant 2 (`addInitScript` observer: `attributeOldValue: true`, only records with a different `oldValue` count, at least one counted record, last value stored, all before the first child of `<body>`), at 375x812 and 1280x800, both stored/system pairs; storage by `addInitScript` per test | NFR-18, FR-116, row 117 | N |
| `playwright.config.ts` l.20 to 23 | `layout`: `/nfr-1[02]-.*\.spec\.ts/`, `a11y`: `/nfr-13-.*\.spec\.ts/` | one new `testMatch` pattern for `nfr-18-*` (A3: extend `layout` or add a project); the header comment ("Projects: ... ") gets the new project/pattern. `check:a11y` (`--project=a11y`) will not run NFR-18; `npm run test:e2e` will. | row 117 | C |
| `e2e/nfr-10-fit.spec.ts` | 375x812 fit, three states | NO change (it runs in 4.6; the header grows by the gear but must still fit: observe) | NFR-10 | G |

## 9. Design facts the tests must pin, against the design source (task 1.4)

Pinned and CONFIRMED in `design/v0/components/binarka-page.tsx` / `design/v0/app/binarka.css`: `[data-action="settings"]` (button, `type="button"`, class `settings-button`, `popoverTarget`); `[data-section="settings"]` (`popover="auto"`, `role="dialog"`, `aria-label="Налаштування"`, class `settings`); `[data-action="settings-close"]` (class `settings-close`, `popoverTargetAction="hide"`); `[data-control="theme"]` (`role="radiogroup"`, `aria-label="Тема"`, class `theme-control`); `data-theme-option` `light`/`dark`/`auto` with the texts «Світла», «Темна», «Як у системі», `aria-checked`; the header order heading, gear, «Правила»; the gear is an inline `svg` (class `gear`, `aria-hidden="true"`, `focusable="false"`; eight `rect` teeth and two `circle`, no `text`/`title`/`desc`/`use`/`href`), the second `svg` of the root after the logo; panel after the message area and before the confirm `dialog`; the panel's 44 px sizes (`min-height: 2.75rem` on `.settings-close` and on the shared `.size-control button, .theme-control button, .language-control button` rule). `:root[data-theme='dark']` exists as an override block over `:root`, with `color-scheme: dark` and `color-scheme: light` in the top-level `:root`. Dark `--bg` `#1a1714`, light `#f7f3ea`, no `prefers-color-scheme` block.

### Divergences between the delta (spec proxies) and the design: DECIDE before section 2 (task 1.4: "spec-made proxies move to the design, never the FR texts")

| ID | Design source | Delta / spec | Effect on the tests | Proposed resolution |
|---|---|---|---|---|
| F1 | settings button has TWO children: `<span class="visually-hidden">Налаштування</span>` and the `svg`; NO `aria-label` (the span is the name) | «Settings button and panel at mount»: exactly one child, an `svg`, no text node; accessible name from `aria-label` | The tests pin the delta; the design's markup fails it (and the name test would not find the name) | Move the delta to the design (a `visually-hidden` span name is valid) OR keep the delta and tell the designer. It is a proxy decision, not an FR. Needs the orchestrator/user. |
| F2 | «Тема» label is `<p class="settings-label" aria-hidden="true">Тема</p>` (and the same for «Мова») | «a visible plain-text label «Тема»» (no mention of `aria-hidden`); `tests/ui-strings.test.ts` l.83 to 90 asserts "no element with `aria-hidden="true"` has a letter of any alphabet in its text content" | Copying the design markup makes the existing guard fail; it would also hide «Тема» from `collectPageText`/`collectTexts` | Decide: implement WITHOUT `aria-hidden` (the guard stays), or amend the delta and the guard together. Tests will not assert `aria-hidden` either way on the label. The group's name «Тема» stays its `aria-label` (design and delta agree). |
| F3 | checked option rule changes only `border-color`, `background`, `color`, `font-weight`; the plain rule already has `border: 2px solid transparent` | «The chosen option has a cue besides colour»: the checked rule declares a `border-style`, `border-width`, `box-shadow` or `text-decoration` that the plain rule does not | The design's cue (a border colour change, a weight change) fails the scenario | Implementer adds a non-colour cue (e.g. `box-shadow: inset ...` or a different `border-width`); or relax the scenario with the user (WCAG 1.4.1 argument for a shape cue is in the baseline for level buttons). |
| F4 | unchecked option `color: var(--ink-muted)`, `background: transparent` | «each a single `var(--color-...)` of a token declared in `:root`» for `color` and `background-color`; `transparent` is not a token (`tokenOf` fails) | The scenario fails on the design's values | Map to existing tokens (A-51 has no "muted" token); the colours are the stylesheet's job, not the design's. No test change. |
| F5 | `.settings-button { width: 2.75rem; height: 2.75rem }`, no `min-height` | «The stylesheet declares a 44 px minimum height for the settings controls»: computed `min-height` at least 44 px for `[data-action="settings"]` | The design's gear fails the jsdom half | Implementer adds `min-height: 2.75rem` to the gear rule. |
| F6 | head script (`layout.tsx`) also attaches a live `change` listener (`addEventListener('change', apply)`) and has the manual override routes `/settings-light/` and `/settings-dark/` | decision 6: ONE `change` listener per mount, in the page module; the head step "applies from storage and the system query" | A listener in the head step would double-fire `data-theme` writes and could make the variant-2 observer see two records | Do not port the listener or the routes. Not test-visible beyond variant 2. |
| F7 | `layout.tsx` metadata has `description`; `<meta name="theme-color" content="#f7f3ea">`; dark `#1a1714` | Q12: no `meta[name="description"]`; the two colours are the product's `--color-page` of the light and dark sets (today `#f9fafb`, not `#f7f3ea`) | The tests pin the meta to the PRODUCT tokens; copying the design's colours would fail the token test | Implementer uses product tokens. Note: the design's `--bg` `#f7f3ea` differs from the product `--color-page` `#f9fafb` (the full palette is G2). |
| F8 | `.theme-control button:focus-visible { outline-offset: -1px }` | «Cells and buttons show a visible, unobscured focus indicator»: `button:focus-visible` declares a positive `outline-offset` | The `button:focus-visible` assertion (stylesheet l.204 to 209, `declarationsFor(parsed, 'button:focus-visible')`) reads that selector only, so a more specific `.theme-control button:focus-visible` with `-1px` does not break it | Allowed. The browser check reads the rendered outline (width at least 2px), not the offset. |
| F9 | panel ids are static in the design (`id="settings"`) | id ends in a number belonging to the mount (A-41 amended) | none (existing practice for the rules panel and the sheet) | none |
| F10 | the language group is in the design's panel (label «Мова», `[data-control="language"]`) | this slice: exactly three children (label, theme control, close) | The test «Settings button and panel at mount» pins THREE children; the design shows five | `add-english-version` MODIFIES the same requirement; do not add the language group here. |
| F11 | selector written `:root[data-theme='dark']` (single quotes) in the CSS, double quotes in the comment | the delta writes `:root[data-theme="dark"]` | jsdom keeps the quote style in `selectorText` (probed) | The helper accepts both (section 4); tests go through the helper, never a raw-text search for one spelling. |
| F12 | Cyrillic appears in the design CSS comments (e.g. «Правила») | `tests/ui-strings.test.ts` l.130 to 147 and `play-page-controls-text` l.116 to 127 forbid Cyrillic in any `src/ui/*.css` / `*.ts` outside `strings.ts` (comments included) | porting design comments into `src/ui/style.css` breaks the guard | Write the product comments in English. Includes the new preferences module. |

Spec proxies confirmed as still needed with no design counterpart: the class `theme-control` (present in the design), `data-action="settings-close"` (present). Not in the design and not pinned by the delta: the classes `settings-button`, `settings`, `settings-close`, `settings-label`, `gear`, `gear-hole` (tests must not rely on them).

## 10. Ambiguities and corrections to `design.md` / `tasks.md`

| ID | Question | Where | Proposed reading |
|---|---|---|---|
| A1 | `design.md` lists only `play-page-stylesheet` l.173 as the dark-coverage test; the delta scenarios «Cell borders have 3:1», «The given cue», «The violation cue», «The focus ring», «The control border ...» all say "each token set (light, then dark)" | 6.1 | Loop the five tests (kind C) as written in 6.1. If the orchestrator prefers the minimum, l.173 alone already covers every group for the dark set once the helper builds it; the five stay light-only and the delta text is then only partly mirrored. |
| A2 | The position of the settings panel among the rules panel, the sheet and the dialog is not pinned by the delta (design.md admits this); the design source orders rules, setup, settings, confirm | 6.4 | `expectedIdElements` compares sets / sorts by document position; the id tests do not pin an order. |
| A3 | Row 117 allows "one `testMatch` pattern". Extend the `layout` regex to `/nfr-1[028]-.*\.spec\.ts/`, put the pattern in an array on `layout`, or add a third project? `design.md` T5 only rules out a new project for the NFR-13 scenarios. | 8 | A third project named for the check keeps `layout` and `a11y` meaning unchanged and makes `--project=` selection possible; extending `layout` is the smaller edit. Either is one pattern. Decide in the red-test commit. |
| A4 | Where do the two «option controls are not part of the marked choice» scenarios live? `tasks.md` 2.2 says `play-page-theme.test.ts`; the sheet helpers are in `play-page-marked-choice.test.ts` | 7.2 | Follow `tasks.md` (theme file); it can import the same helpers. |
| A5 | How to execute the head script in jsdom | 7.4 | JSDOM with `runScripts: 'dangerously'` and `beforeParse` stubs (runs the real script). |
| A6 | Do `settings` and `settings-close` join `expected` in the NFR-13 focus test? The delta names only the theme control focused by keyboard | 8 | Yes: the existing comment says "reaches every control by the keyboard"; adding two kinds is the same rule applied to two new controls. |
| A7 | `tasks.md` 1.4 and 7.2 say "8 MODIFIED blocks"; `proposal.md`, `design.md` and the delta have 10 | 2 | Treat 10 as correct (counted: 10 `### Requirement:` under `## MODIFIED Requirements`); `tasks.md` is stale. |
| A8 | `design.md` line citations are stale (it cites `play-page-level-stylesheet` l.139/141/148 and `play-page-helpers` l.~484/536 for the 13-token assertions and the helper's own tests; the tokens are at stylesheet l.76/79 and level-stylesheet l.197/199/206; the helper self-tests are at helpers.test l.467 to 495, l.549 to 550) | all | This file's lines are the current ones. |
| A9 | The built-file test runs `vite build` inside `test:run` (tens of seconds, writes only to a temp directory). `vitest.config.ts` has the default 5 s test timeout | 7.4 | Give that one test an explicit timeout; keep it in `tests/index-html.test.ts` so it can be isolated. |
| A10 | Drift check of the MODIFIED blocks against `git diff <base>` (task 1.4) | 2 | Cannot be done mechanically until `update-setup-sheet-start` is archived (the baseline has no «Marked choice»). The sentence-level proxy in section 2 found no missing sentence; repeat the real diff after the archive. |

## 11. Counts

- Existing test files read for this list: the 28 files matched by the grep plus `tests/main-entry.test.ts`, `tests/no-image-assets.test.ts`, `tests/play-page-start-button.test.ts` (read, not matched), the two e2e specs `nfr-10`, `nfr-12`, `nfr-13` and `playwright.config.ts`.
- Delta size (counted with `awk` on `specs/play-page/spec.md`): 17 ADDED requirements with 56 scenarios, of which 8 are real-browser scenarios (rendered colours, auto live in a browser, NFR-18 variants 1 and 2, measured 44 px, manual themes sweep, manual vs auto tokens, focused option) and 48 are jsdom/source scenarios; 10 MODIFIED requirements with 67 scenarios (most keep their name and text; the changed or new ones are the C and N rows of section 6 and 7). The 48 jsdom/source ADDED scenarios map to the rows of 7.1 to 7.5 (one test each; the table groups them).
- Existing tests that change (C/H), by file: `tests/helpers/css.ts` and `tests/helpers/play-page.ts` (helpers), `e2e/helpers.ts` (helper); `tests/play-page-stylesheet.test.ts` (the five contrast tests l.134 to 171, l.173, l.228, l.281, and the cascade `it` loop l.371 to 390), `tests/play-page-level-stylesheet.test.ts` (l.71 to 87, l.119 to 161), `tests/play-page-wcag.test.ts` (l.69 to 102 plus the in-file `accessibleNames`), `tests/play-page-semantics.test.ts` (l.138, l.169 plus `expectedIdElements`), `tests/play-page-rendering.test.ts` (l.124), `tests/play-page-logo.test.ts` (`logoOf`, l.66, `expectSameLogo`), `tests/play-page-layout.test.ts` (l.372), `e2e/nfr-12-targets.spec.ts` (page controls), `e2e/nfr-13-a11y.spec.ts` (`look`, `expected`, focus test). Everything else that matched the grep is a guard (G) or a false positive.
- New test files: `tests/play-page-settings.test.ts`, `tests/play-page-theme.test.ts`, `tests/play-page-preferences.test.ts`, `tests/index-html.test.ts`, `tests/play-page-theme-stylesheet.test.ts` (an addition to `tasks.md` 2.2, which says "extend the stylesheet tests"; one new file keeps the theme CSS scenarios together, or they can be appended to `play-page-stylesheet.test.ts`), `e2e/nfr-18-flash.spec.ts`. Plus new `it`s in existing files listed in 7.6.

## 12. Section 1 closed (2026-10-10 about 08:00 UTC+5:30, review-gate finding 4 of run `wf_dfa2a0c3-9a9`)

Re-run by the orchestrator after the archive of `update-setup-sheet-start` (`c0ce96f`):

| Task | Check now | Result |
|---|---|---|
| 1.1 | `ls openspec/changes/archive \| grep update-setup-sheet-start` | `2026-10-10-update-setup-sheet-start` |
| 1.1 | `grep -c "Marked choice" openspec/specs/play-page/spec.md` | 2 (at least 1) |
| 1.1 | autonomy-log rows 116 to 120; FR-102 to FR-118 and TC-12 in `docs/requirements.md` | each present once |
| 1.1 | NFR-18 held with its pending tag before the red run | yes until `c0812f2`, where it moved on the row-68 (1) pattern after its red run (row 128) |
| 1.2 | the confirmed list | sections 4 to 8 of this file; every changed assertion in the red commit `1c34ddb` carries its source row |
| 1.3 | the design gate | the confirming design review of `review-set-13` has no blocking finding (autonomy-log row 123); `update-setup-sheet-start` added no token, so FR-65 reads 13 and no TD-Q15 edit is needed |
| 1.4 | hooks against the signed wireframe and the review set | section 9 above; the divergences F1 to F3 decided in autonomy-log row 124, F4 to F12 resolved as proposed; `git diff c0ce96f..HEAD -- openspec/specs/play-page/spec.md` is empty (no drift of the baseline under the 10 MODIFIED blocks) |
