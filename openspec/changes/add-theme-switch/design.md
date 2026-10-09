# Design: add-theme-switch

Slice 2 of the combined amendment signed on 2026-10-10 (autonomy-log rows 116 to 120). Draft and dispositions: `docs/handoff/theme-language-amendment-draft-2026-10-09.md` (TD-Q1 to TD-Q15). It copies the result of `update-setup-sheet-start` and is copied by `add-english-version` (merge rule: earlier text first, later sentences appended).

## Goals

- A manual theme (light, dark, auto) that applies at once, follows the system live while auto, survives a reload without a flash, and stores nothing but the preference (FR-102 to FR-106, FR-113 to FR-118, NFR-18, TC-12, A-48 to A-51, A-55).
- Every contrast pair of the stylesheet holds for the light and the dark token set (FR-65).
- The controls are reachable, named and large enough (NFR-9, NFR-12, NFR-13 theme parts).

## Non-goals

- The language switch, English texts and the language group of the panel (`add-english-version`). The full design palette (G2, A-51: the dark values are mapped onto the 13 tokens, not ported). The pixel reference (the user moves it). A `prefers-color-scheme` fallback (Q13), a meta description (Q12), a real-browser screen-reader test (A-28).
- Visual specifics (where the gear sits in the header at 320 px, the panel as a bottom sheet on the phone and a panel under the header on the right from tablet up, the drawing of the gear) stay out of the specs: they are `review-set-13` and held NFR-14.
- Authentication: none exists, so no redirect-to-login or forbidden case applies. No free value is typed, so no inline validation message and no raw 500 can occur; a failing storage is silent by FR-115.

## Key decisions

1. **The settings panel and its structure live in this folder (user note after row 120).** The gear button, the panel (`popover`, `role="dialog"`, `aria-label` «Налаштування»), the visible label «Тема», the theme group and «Закрити» are specified here in «Settings button and panel». `add-english-version` extends the same requirement (label «Мова», language group between the theme group and «Закрити») rather than creating a second panel. Trade-off: the panel holds one group until the next folder is archived; chosen because the earlier folder owns a row that touches both (the user's assignment rule) and the panel has to exist for the theme control to be reachable.
2. **Five ids per mount (row 120, A-41).** The settings panel's `id` is the fifth (rules panel, its heading, setup sheet, settings panel, confirmation text). «The board is a labelled group of cell buttons» changes from four to five and ten for two mounts; the DOM contract text (l. 38) changes at archive. The gear, the theme group and the options carry no id.
3. **ADR-worthy: the classic inline script in `index.html` (FR-116).** Module scripts run after parsing and the mount is synchronous, so the page module cannot prevent a flash. A classic inline head script sets `data-theme` and the meta before the body is parsed; `color-scheme` is owned by the stylesheet (`:root` and `:root[data-theme="dark"]`), so exactly one mechanism sets it and the e2e check of the rendered value is the binding one. Cost: a deliberate duplicate outside `src/ui/strings.ts` and the preferences module (the key name and the two theme-color values), outside lint and `tsc`. Mitigation: a test asserts that the name and the two colours equal the module's values and the tokens; the built `dist/index.html` keeps the script ahead of Vite's module script and CSS link. Alternative rejected: apply the theme from the module (flash on every reload, NFR-18 impossible).
4. **ADR-worthy: TC-12 is narrowed, not dropped.** "No persistence of game state" stays; the only stored data are the preference keys. `localStorage` only, no cookie, `sessionStorage` or IndexedDB (a source scan in «Stored preferences»). The key is written only on a press of a not-chosen option and also when the value is the default (A-48, ASSUMPTION ratified by the signature), never at mount or on a system change.
5. **Dark values on the stylesheet's tokens, no media block (Q13, A-51).** The light set stays in `:root`; one `:root[data-theme="dark"]` block redefines every token. The page always sets `data-theme`, so with scripts off the page is light. Trade-off: no second copy of the dark values for a case the page cannot play in. The helper `tests/helpers/css.ts` must read the attribute block as a `:root` rule and as an override token set (TD finding 8), or the "outside `:root`" scans fail and the dark set is never contrast-checked.
6. **Auto is live (FR-105, A-50).** One `change` listener on `matchMedia('(prefers-color-scheme: dark)')` per mount while the page lives; with a manual choice the listener does nothing; no `matchMedia` means light. Tests install a stub (A-50).
7. **The theme-color meta is one element (FR-106).** The page and the head step hold the same two colours (the `--color-page` of both sets); a test pins them to the tokens. The design's media-keyed pair in `layout.tsx` is not ported (TD D4).
8. **Generic names for rows that both folders touch.** «Stored preferences», «Invalid or missing stored values fall back», «Failing storage does not stop the page», «Preferences are applied before the first paint», «Common rules for the theme and language options», «The option controls are not part of the marked choice» are written for the theme now and MODIFIED by `add-english-version` (kept names so the archive matches).
9. **The gear is the second `svg` of the root.** «Logo» said "exactly one svg"; it now says the logo inside the heading plus the gear inside the settings button, and no third. Trade-off: a stricter structure instead of exempting `svg` in buttons.
10. **NFR-18 is held (row 117, TD section 5 item 16).** It is written as a requirement here so the spec cites it, with the e2e mechanism spelled out; the row moves from `docs/requirements-held.md` to `docs/requirements.md` only after the new spec is seen failing against the page without the head step (task 2.6, the pattern of row 68 (1)); `playwright.config.ts` gains one `testMatch` pattern.

## Placeholders of TD-Q15

- **COMPLETED by the signed wireframe (row 120, Topic 3 B):** the place of the controls (FR-68), the fifth id, the accessible name «Налаштування» of button and panel, the visible labels, the header order (title, gear, «Правила»).
- **OPEN, to `review-set-13` (built; confirming design review passed, row 123):** visual specifics only, kept out of the specs: the header at 320 px (the wireframe notes it needs a 28 px title or a narrower «Правила»), the dark values of any new primary token of `update-setup-sheet-start`, the exact dark mapping beyond the 13 tokens (G2). The hooks `[data-action="settings"]`, `[data-section="settings"]`, `[data-action="settings-close"]` and the classes `theme-control` are spec-made proxies, confirmed in task 1.4.

## Data model

Stored: `localStorage['binarka.theme']` = `light` | `dark` | `auto`, nothing else (the language key arrives with the next folder). Page state: `theme` (the choice, default `auto`), the effective theme (derived), the `matchMedia` list. Derived on every change: `<html data-theme>`, root `color-scheme`, the meta content, `aria-checked` of the three options. New DOM: the gear button, the settings panel (label, group, close), one `meta[name="theme-color"]` and the head script in `index.html`. New strings (under the page's language rule): «Налаштування», «Тема», «Світла», «Темна», «Як у системі», and the existing «Закрити».

## Error handling strategy

- Storage that throws (access, `getItem`, `setItem`): caught in the preferences module; the page mounts with defaults, a press still applies for the session, nothing is retried, no message (FR-115). The head step has its own try/catch.
- Bad stored values: ignored, not rewritten, not removed (FR-114).
- No `matchMedia`: auto is light (A-50). A press while a confirmation is open cannot happen (modal dialog, A-55).
- Opening the settings panel while the sheet is open closes the sheet natively; the marked choice is discarded by the existing `toggle` rule (FR-97(d)).

## Tests that change deliberately (by FR)

From the draft's grep of `tests/` and `e2e/`; the implementer re-greps (task 1.2). No test is weakened.

| File | What pins the old behaviour | Source |
|---|---|---|
| `tests/helpers/css.ts` | l. 149 `isRootRule` accepts only the selector `:root`; l. 165 to 178 build token sets only from `:root` in at-rules: read `:root[data-theme="dark"]` as a `:root` rule and as an override set over the top-level tokens, each token still declared once in the plain `:root` | FR-65, A-51 |
| `tests/play-page-helpers.test.ts` | the helper's own tests (about l. 484, l. 536) gain cases for the new token-set selector | FR-65 |
| `tests/play-page-stylesheet.test.ts` | l. 74 and 76 (13 names, each declared once in the top-level `:root`), l. 84 and 102 (no literal and no `--color-*` outside `:root`: pass only once the helper reads the attribute block), l. 173 (covers the dark set once the helper builds it) | FR-65, A-51 |
| `tests/play-page-level-stylesheet.test.ts`, `tests/play-page-action-buttons-stylesheet.test.ts` | l. 139, 141, 148 (13 tokens, "no 14th token"): change only if `update-setup-sheet-start` added a token; the button lists gain the gear, the options and the panel's «Закрити» | FR-65 |
| `tests/play-page-wcag.test.ts` (l. 71: radiogroups `toHaveLength(2)`), `tests/play-page-semantics.test.ts` | button count 53 to 58, radiogroups 2 to 3, ids four to five (and eight to ten), Cyrillic names | NFR-9, FR-117, A-41 |
| `tests/play-page-size-selector.test.ts`, `tests/play-page-level-control.test.ts` | "storage still holds no entry" (kept, true: no test presses a theme option); helpers gain a storage clear | TC-12, FR-113, A-48 |
| `tests/play-page-logo.test.ts` | "exactly one svg" in the header and the root (now the logo in the heading plus the gear in the settings button) | FR-72 and TC-14 as amended 2026-10-10, FR-117 |
| `tests/play-page-rendering.test.ts` | l. 122 to 139: four ids per mount, `toHaveLength(4)`, eight in all (now five and ten) | A-41, FR-117 |
| `tests/play-page-level-stylesheet.test.ts` (l. 70 to 86), `tests/play-page-stylesheet.test.ts` (the size-button colour test) | resolve the colour pairs from the top-level tokens only: they run once per token set | FR-65, A-51 |
| `tests/play-page-layout.test.ts` | header children and order, root order | FR-68 |
| `tests/play-page-page-text.test.ts`, `tests/play-page-controls-text.test.ts`, `tests/ui-strings.test.ts` | text scans and string lists gain the five strings | NFR-5, FR-94 |
| `tests/main-entry.test.ts` | the mount from `index.html`; gains the head step and the built-file premise | FR-116 |
| `tests/helpers/play-page.ts` | the mount helper clears `localStorage` before and after, installs and removes the `matchMedia` stub (A-50), opens the settings panel through the stubbed `showPopover()` | A-50, FR-113 |
| `e2e/nfr-12-targets.spec.ts`, `e2e/nfr-13-a11y.spec.ts`, `e2e/helpers.ts` | the gear and the panel's controls; manual-theme states (the sweep today only emulates the system scheme, `nfr-13-a11y.spec.ts` l. 29 to 31) | NFR-12, NFR-13 |
| `e2e/nfr-18-*.spec.ts`, `playwright.config.ts` | new spec and one `testMatch` pattern | NFR-18, row 117 |

## Risks and mitigations

- **Cross-test leakage:** jsdom's `localStorage` survives between tests of a file: the mount helper clears it before and after each test, and also removes `data-theme` and the inline `color-scheme` from `<html>`, any injected `meta[name=theme-color]`, `sessionStorage` and cookies, and resets the `matchMedia` stub's listeners; Playwright uses a fresh context per test (no `storageState`), and a sweep that changes a preference inside a test clears storage or sets it by `addInitScript` before each shot (an `addInitScript` runs again on every reload: a press-then-reload check writes the key with a once-only guard or with `page.evaluate`) (AGENTS.md lesson, capture determinism item 5).
- **`color-scheme` in jsdom:** jsdom may not resolve it: the stylesheet owns it, the unit test reads the declarations and the e2e check reads the rendered value (binding).
- **Head step is unlinted:** its tests are its only check (listed); a drift of the duplicated colours fails the token test.
- **Header room at 320 px:** observed in the browser check; the design owns the fix.
- **Dark shots of the reference change:** held NFR-14 stays NOT-EARNED; the user moves the pixel reference.
- **A-51 mapping is an ASSUMPTION** ratified by the signature; the full palette is G2.

## Ambiguities in the draft and the reading chosen

- "The storage module and the head step are built here for both keys; the language half of FR-116 is completed in the English slice" (draft section 8): read as: this folder specifies and builds them for the theme key; `add-english-version` MODIFIES the same requirements to add the language key, `lang` and the title, and builds that half.
- Draft FR-102 says the group has "the accessible name «Тема»"; the wireframe adds a visible «Тема» label above it: both kept (aria-label is the name, the plain-text element is the label, no `label` element).
- The panel's position in the document is not pinned beyond "after the message area, before the confirmation dialog, outside the header"; its order against the rules panel and the sheet is not specified.
- Draft Q13's alternative (guarded media block) is not specified; the default is.

## Baseline text edits at archive

Archive normally and in the SAME commit edit the non-requirement text of `openspec/specs/play-page/spec.md`:

1. **Purpose and Ownership:** the header settings button and panel with a theme control, remembered as a preference; add FR-102 to FR-106, FR-113 to FR-118 (theme parts), NFR-18 (held), TC-12; FR-65, FR-68 amended.
2. **DOM contract:** the mount-entry and fixtures bullets gain a `matchMedia` and storage stub line next to the popover stubs (A-50); the «Page root» bullet gains `<html data-theme>`; the «Logo» bullet says the gear is the second `svg`; the «Ids» bullet goes from four to five (the settings panel); new bullets «Settings button», «Settings panel», «Theme control».
3. **Exclusions:** "No persistence (TC-12) … nothing is stored" becomes "no game state is stored; the only stored data are the preferences of FR-113"; "Image files and bitmap or other graphics assets are intentionally unsupported (TC-14); the only graphic is the inline SVG logo of FR-72" becomes "…; the only graphics are the inline SVG logo of FR-72 and the inline SVG gear of the settings button (TC-14 as amended 2026-10-10)".

Before archive confirm that no baseline requirement already carries one of the 17 ADDED names, and rebase the 10 MODIFIED blocks on the baseline as it is then. Afterwards run `npx openspec validate --all --strict` and `node scripts/check-traceability.mjs`.

## Audit findings: disposition

Fresh audit of 2026-10-10 (autonomy-log row 121). Each cited line was checked against the files before folding.

- T1 (major, contrast per token set not extended to the other button pairs): folded. «The size buttons set their own colours and the board disables double-tap zoom» and «The summary and level buttons set their own colours» are MODIFIED here (per token set, light then dark, «Почати» included); `tests/play-page-level-stylesheet.test.ts` l. 70 to 86 (checked: top-level tokens only) and the size-button test are in the changed-tests table.
- T2 (major, the gear against TC-14 and FR-72): folded. TC-14 and FR-72 were amended in `docs/requirements.md` (rows 120 and 121); «Logo» cites them, `design.md` says "FR-72 and TC-14 as amended 2026-10-10", and the Exclusions bullet ("the only graphic is the inline SVG logo") is in "Baseline text edits at archive".
- T3 (major, a non-test NFR-18 scenario): folded. The scenario «The spec fails against a page without the head step» is deleted; the red-run duty stays in task 2.6; the held wording is "NFR-18 is held (row 118)".
- T4 (major, variant 2 vacuous and spuriously failing): folded. The observer counts only records whose `oldValue` differs (`attributeOldValue: true`), requires at least one counted record, the stored final value and all records before the first child of `<body>`; the red run (2.6) must show variant 2 failing too.
- T5 (major, browser checks without a home): folded. A new scenario «Auto follows a live change in a real browser» (`page.emulateMedia`), and the rendered-colours, manual-versus-auto and focus-indicator scenarios are assigned to `e2e/nfr-13-a11y.spec.ts` (project `a11y`) in the scenarios and in task 2.4. No new Playwright project is needed.
- T6 (major, stale `dist`): folded. The built-file test makes its own `vite build --outDir <tmp>` and fails loudly, never skips (`test:run` is plain `vitest run`, checked in `package.json`).
- T7: folded as Option A. The stylesheet owns `color-scheme`; no script writes it; "where jsdom resolves it" is removed; the e2e check is binding.
- T8: folded (helper cleanup list, once-only `addInitScript` guard) in task 2.1, 2.4 and the risks.
- T9: folded (`tests/play-page-rendering.test.ts` l. 122 to 139, `tests/play-page-wcag.test.ts` l. 71, the 1.2 grep extended). Both lines were checked.
- T10: partly folded. Added: a broken `matchMedia` scenario, the `index.html` scan for `sessionStorage`, `document.cookie`, `indexedDB`. NOT folded as proposed: "pressing the checked default on a fresh page writes". The draft's FR-113 writes "only when the player presses an option that is not already chosen", and on a fresh page the default is the chosen option; A-48 concerns pressing the default while another option is chosen (already covered by «A press writes the pressed value once», dark then auto). The delta now has the scenario «Pressing the default option on a fresh page writes nothing» so the reading is explicit; if the user means the other reading, one scenario flips.
- T11: folded (one listener per mount, a no-op under a manual choice, in task 3.3; a missing `meta[name=theme-color]` scenario).
- T12: folded (axe with the settings panel closed and open in both manual themes; the browser check adds "stored `light` on a dark OS, reload" and the light-dismiss check).
- T13: folded in «Borders, cues and focus rings have enough contrast»: the conditional-block clause is the helper's generality and the shipped stylesheet has exactly two value sets.
- T14: folded. `theme-control` is marked a proxy; the NFR-18 red-run file sits next to the main one (`docs/qa/add-theme-switch-nfr-18-red-run.txt`); the spec file and its `testMatch` pattern are added in the same step so the red run fails on an assertion; NFR-18 moves to `docs/requirements.md` only after the 2.7 STOP confirmation.
