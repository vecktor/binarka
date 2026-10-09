# Change: add-english-version

> **Slice 3 of three, archived last.** Order: `update-setup-sheet-start`, `add-theme-switch`, `add-english-version` (this folder), then G2 (NFR-14). The MODIFIED blocks are written against the play-page spec as it is after the first two folders are archived, and the engine MODIFIED blocks against the current puzzle-engine spec (checked by archiving the three in order in a scratch copy). Do not start section 2 of `tasks.md` before `add-theme-switch` is archived and tasks 1.1 to 1.4 pass.

## Why

The user asked for an English version of the page: every page text and the hint sentences, with a language switch, Ukrainian by default, remembered as a preference; the CLI stays English (autonomy-log row 116). FR-55 and FR-56 move from Future to MVP. The amendment was signed on 2026-10-10 about 00:03 (UTC+5:30) with all defaults (row 118; draft `docs/handoff/theme-language-amendment-draft-2026-10-09.md`, TD-Q2 to TD-Q10, A-52 to A-54). The English wording is the draft's appendix, taken as final by row 119 and refined only by the eval judge and the reviewers. The wireframe (row 120) puts the language group in the settings panel under the theme group.

## What Changes

- A language control `[data-control="language"]` («Мова» / "Language"; «Українська», "English", each named in its own language with its own `lang`) in the settings panel; a press re-renders every text and accessible name **in place**, keeps the board, entries, marked choice and focus, and stores `binarka.language` (FR-107, FR-108, FR-118, FR-113 to FR-116 language halves). `<html lang>` and `document.title` follow ("Binarka") (FR-109).
- English page text (`src/ui/strings.ts` holds two tables with the same keys) and per-mode text rules: Cyrillic and no Latin in Ukrainian mode, Latin and no Cyrillic in English mode, with the one `lang` exception (FR-111, NFR-5 per mode, FR-94, A-52).
- English hint sentences: **the engine takes the language as an input** (`hint(board, ceiling, language = 'uk')`, byte-identical Ukrainian by default) and exposes `hintSentence(hint, language)` over the hint's data, so a hint on screen re-renders as the same hint after a switch (FR-112, FR-110, FR-55, FR-56, TD-Q8; **ADR-worthy**, it changes the engine's public contract and four whole-object `toEqual` tests).
- The amended text rows: win message, summary, sheet, levels, 4×4 reason, rules, idle line, confirmation, cell and board names (FR-40, FR-41, FR-43, FR-57, FR-61, FR-62, FR-70, FR-71, FR-87, FR-89, FR-91, FR-93, FR-95 to FR-97, FR-101); NFR-9 (WCAG 3.1.1, 3.1.2), NFR-10, NFR-12, NFR-13 English states; NFR-4 and NFR-6 (eval dimension `hint-clarity-en`, three cases, bar 80, TD-Q9).
- Not changed: the CLI (NFR-8, English as before), the engine's choice of hint (FR-23), the pixel gate (Ukrainian shots only, TD-Q10; English by scans, e2e and a11y).

Baseline requirements touched (play-page: 9 ADDED, 35 MODIFIED; puzzle-engine: 2 ADDED, 13 MODIFIED; 0 REMOVED):

| Requirement | Action | FR / NFR |
|---|---|---|
| Language control, A language press re-renders in place…, Document language and title, A hint message on screen re-renders as the same hint, English page text, Page text is per mode | ADDED | FR-55, FR-56, FR-107 to FR-111, NFR-5, NFR-9 |
| English mode keeps the phone page on one screen, English labels meet the touch-target floor, The accessibility sweep covers English mode | ADDED | NFR-10, NFR-12, NFR-13 |
| Hint language is an engine input, A hint exposes the data of its sentence (engine) | ADDED | FR-112, FR-110, FR-56 |
| The "Ukrainian …" text requirements, Win message, Hint button shows…, Idle line, Rules panel, Confirmation, Summary button, Setup sheet, Level option content, Grid size selector, Level selector, Only the first level…, Cell labels, board group, size radiogroup name | MODIFIED | NFR-5, FR-40, FR-41, FR-43, FR-57 to FR-71, FR-87 to FR-97, FR-111 |
| Settings panel, Theme control, Stored preferences, fallback, failing storage, head step, NFR-18, common rules, not part of the marked choice, texts, option colours (the theme folder's, extended to the language) | MODIFIED | FR-107 to FR-109, FR-113 to FR-118, NFR-18 |
| Hinted cell marker, Every cell is its own Tab stop, focus indicator, WCAG requirement | MODIFIED | FR-59, FR-65, FR-66, NFR-9 |
| Pair, Sandwich, Count, Line balance, Unique lines, Look-ahead, No-rule, Broken-board hints; line type and number; one sentence; language of sentences; clear and correct; public interface (engine) | MODIFIED | FR-19 to FR-22, FR-25, FR-26, FR-78 to FR-80, FR-112, NFR-4, NFR-5, NFR-6 |

Out of scope: a third language, `navigator.language` detection (A-49), a translated CLI (NFR-8), English pixel shots (TD-Q10), a meta description (Q12), the pixel reference (the user moves it).

## Impact

- Affected specs: `play-page` (9 ADDED, 35 MODIFIED) and `puzzle-engine` (2 ADDED, 13 MODIFIED); archive warns about more than 10 deltas, non-blocking. Baseline text edits at archive are in `design.md`.
- Affected code: `src/engine/` (the hint module and `index.ts`: English sentences, the language input, `hintSentence`, the result fields), `src/ui/play-page.ts`, `src/ui/strings.ts`, `src/ui/style.css`, `index.html` (the language half of the head step), the preferences module, `evals/cases/` (dimension `hint-clarity-en`); tests under `tests/` and `e2e/`. No dependency.
- Commits that touch `src/` carry `Slice: add-english-version` and `Refs:` with the FR ids touched (FR-55, FR-56, FR-107 to FR-112, FR-19 to FR-22).
- The `AGENTS.md` line and the three harness files of row 117 change in the commit that applies the amendment (not in this slice); task 1.1 checks it.
