# Change: add-theme-switch

> **Slice 2 of three, archived second.** Order: `update-setup-sheet-start`, then `add-theme-switch` (this folder), then `add-english-version`, then G2 (NFR-14). The MODIFIED blocks are written against the play-page spec as it is after `update-setup-sheet-start` is archived (checked by archiving the three in order in a scratch copy). Do not start section 2 of `tasks.md` before `update-setup-sheet-start` is archived and tasks 1.1 to 1.4 pass.

## Why

The user asked for a manual theme switch with three options, light, dark and auto (the system theme), remembered in `localStorage` as a preference, never as game state (autonomy-log row 116). The amendment was signed on 2026-10-10 about 00:03 (UTC+5:30) with all defaults (row 118; draft `docs/handoff/theme-language-amendment-draft-2026-10-09.md`, TD-Q1 to TD-Q15, A-48 to A-55). The wireframe was signed at about 00:26 (row 120, TD-Q15 completes FR-68): the controls live in a **settings panel**, opened by a gear button in the header next to «Правила». Today the page follows only the system scheme and has no dark palette of its own.

## What Changes

- A settings button `[data-action="settings"]` (drawn gear, accessible name «Налаштування») in the header and its popover panel `[data-section="settings"]` with the visible label «Тема», the theme control and «Закрити». A **fifth id** under the root (A-41 four becomes five, row 120) (FR-68, FR-117).
- The theme control `[data-control="theme"]`: radiogroup «Тема» with «Світла», «Темна», «Як у системі»; a press acts at once and changes nothing else (FR-102, FR-103, FR-118). `<html data-theme>` and `color-scheme` carry the effective theme; auto follows the system live; one `meta[name="theme-color"]` follows (FR-104 to FR-106).
- Preferences: `localStorage` key `binarka.theme` only; invalid or missing values fall back to auto; throwing storage never stops the page; a classic inline script in the head applies the theme before the first paint (FR-113 to FR-116, TC-12 narrowed, A-48). **NFR-18** (no flash on reload, e2e, one new `testMatch` pattern approved in row 117) is held until its spec is seen failing, then moves into `docs/requirements.md`.
- A dark token set `:root[data-theme="dark"]` on the stylesheet's tokens, every contrast pair checked per set (FR-65, A-51); the gear joins the logo as the second `svg` of the root (TC-14 and FR-72 amended 2026-10-10, autonomy-log rows 120 and 121).
- Theme parts of NFR-9, NFR-12 and NFR-13 (44 px, manual-theme a11y states).
- **PLACEHOLDER**: nothing design-dependent is left open except visual specifics, which stay out of the specs and are built against `review-set-12` (being made); see `design.md`. Language switch, English texts and the language group of the panel are `add-english-version`.

Baseline `play-page` requirements touched (17 ADDED, 10 MODIFIED, 0 REMOVED):

| Requirement | Action | FR / NFR |
|---|---|---|
| Settings button and panel, Theme control, Texts of the settings button, the settings panel and the theme control | ADDED | FR-68, FR-102, FR-117, NFR-5, NFR-9 |
| A theme press acts at once and changes nothing else, The option controls are not part of the marked choice, Common rules for the theme and language options | ADDED | FR-103, FR-117, FR-118 |
| Effective theme on the document, Auto follows the system theme live, Browser colour follows the theme | ADDED | FR-104 to FR-106 |
| Stored preferences, Invalid or missing stored values fall back, Failing storage does not stop the page, Preferences are applied before the first paint | ADDED | FR-113 to FR-116, TC-12 |
| No flash of the wrong theme on reload | ADDED | NFR-18 (held), FR-116 |
| The theme options set their own colours, The theme options meet the touch-target floor, The accessibility sweep covers the manual themes | ADDED | FR-65, FR-117, NFR-12, NFR-13 |
| Borders, cues and focus rings have enough contrast | MODIFIED | FR-65, A-51 |
| Page document order, Logo, The board is a labelled group of cell buttons | MODIFIED | FR-68, FR-117 |
| Hinted cell marker, Every cell is its own Tab stop, Cells and buttons show a visible, unobscured focus indicator | MODIFIED | FR-59, FR-66, FR-65 |
| The size buttons set their own colours…, The summary and level buttons set their own colours | MODIFIED | FR-65, A-51 (contrast per token set) |
| The page meets the WCAG 2.2 AA criteria… | MODIFIED | NFR-9 |

Out of scope: the language switch and every English text (next folder), the full design palette (G2, A-51), the pixel reference (the user moves it), a `prefers-color-scheme` fallback block (Q13), a `meta` description (Q12).

## Impact

- Affected specs: `play-page` (17 ADDED, 10 MODIFIED; `openspec archive` warns about more than 10 deltas, non-blocking). Baseline text edits at archive are in `design.md`.
- Affected code: `index.html` (head step, one `meta[name="theme-color"]`), `src/ui/play-page.ts`, a new preferences module under `src/ui/`, `src/ui/strings.ts`, `src/ui/style.css`, `playwright.config.ts` (one `testMatch` pattern, row 117), `e2e/nfr-18-*.spec.ts`; tests under `tests/` including `tests/helpers/css.ts` (TD finding 8). No dependency; `src/engine/` untouched.
- Commits that touch `src/` carry `Slice: add-theme-switch` and `Refs:` with the FR ids touched (FR-102 to FR-106, FR-113 to FR-118, FR-65, FR-68).
