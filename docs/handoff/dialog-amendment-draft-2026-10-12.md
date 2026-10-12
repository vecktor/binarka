# Requirements amendment draft: the confirmation dialog takes the design's size, place and paint (2026-10-12)

Status: **DRAFT, awaiting the user's signature.** Written by the wave-2 prep session (`vigorous-darwin-94147c`, branch `claude/vigorous-darwin-wave2-prep`) from about 08:30 (UTC+5:30) on 2026-10-12, at `main` `b290715`, mirroring section P of `docs/handoff/parallel-g2-plan-2026-10-11.md` for the second wave. A fresh independent auditor reads it before the user (section 10). Nothing under `src/` changes before the user signs. The settings panel has its own draft (`docs/handoff/settings-panel-amendment-draft-2026-10-12.md`), which also carries the split between the two blocks, the question of a shared serial slice (its section 9, SP-1) and the NFR-14 phrase for both surfaces; both drafts are signed in one sitting.

## Basis

- **The plan** (`docs/handoff/parallel-g2-plan-2026-10-11.md`, P3 "Tokens": "`--color-violation-ink` («Так, почати») belongs to the dialog block in the second wave"). The A-57 appendix marks `--color-violation-ink` (light `#8f1d17`, dark `#ffb4ab`, "text of «Так, почати»") as "later"; it is the last "later" row.
- **The row:** the dialog is FR-67 (its text and two buttons, `showModal()`) with FR-98 (the sheet and the dialog); FR-101 is «Почати», which only asks for it. The brief's "FR-101 the dialog" is read as FR-67; FR-101 does not change.
- **Run 12** (`docs/qa/g2/check-visual-run-12.txt`): **4 confirm shots fail, at 320 and 375** (`320-dark-confirm` 0.9180, `320-light-confirm` 0.9194, `375-dark-confirm` 0.9590, `375-light-confirm` 0.9582); the 6 from 768 pass (0.9836 to 0.9904).
- **Evidence gathered for this draft:** `docs/qa/prep-g2-wave2/classify.txt` (`classify.mjs`): the page captured through the locked adapter's own `capture()` (every score equals run 12 to 4 places), the gate's own failing pixels bucketed by element box and colour pair, and the boxes and computed styles of the dialog, its text and its two buttons on the design build (`/confirm/`) and on the page. Contrast figures: `docs/qa/prep-g2-wave2/contrast.txt`.
- **Today's page** (`src/ui/style.css:612-649`):
  - `.confirm`: `width: min(22rem, calc(100vw - 32px))`, `margin: auto`, **padding 20px**, a 1px `--color-control-border` border, **radius 12px**, fill `--color-surface-raised` and the panel shadow (both from the shell), `--color-text`.
  - `.confirm p`: margin `0 0 20px`, line height 1.5.
  - `.confirm-buttons`: `flex-wrap: wrap-reverse`, `justify-content: flex-end`, gap 8px (as the design).
  - `.confirm-buttons button`: `flex: 1 1 auto`, `min-height: 2.75rem`, weight 700; everything else is the base `button` rule: **padding `10px 16px` (so 46px tall), a 1px `--color-control-border` border, radius 6px, `--color-control-bg` fill, `--color-text`, line height 24px**. Neither button has its own colours.
- **The design** (`design/v0/app/binarka.css:1338-1397`, `review-set-14`):
  - `.confirm`: `width: min(22rem, calc(100vw - 2 * var(--page-pad)))`, `margin: auto`, `padding: var(--space-5)` (1.5rem), 1px `--cell-border` (the page's `--color-control-border` values), `--radius-l` (1rem), `--surface-raised`, `--ink`, the panel shadow. `--page-pad` is 1rem, and 0.75rem at 22.5rem and narrower (l. 149-152), so the dialog is 296px wide at 320, not 288.
  - `.confirm p`: margin `0 0 var(--space-5)` (1.5rem), 1rem, line height 1.5.
  - `.confirm-buttons button`: `flex: 1 1 auto`, `min-height: 2.75rem`, `padding: 0 var(--space-4)` (1rem), a 2px transparent border, `--radius-m`, weight 700, line height 1.2.
  - «Так, почати» `[data-confirm='yes']`: border `--violation` (the page's `--color-violation-border`), fill `--violation-bg` (`--color-violation-bg`), text `--violation-ink` (the token of this block).
  - «Скасувати» `[data-confirm='no']`: border and fill `--primary`, text `--primary-ink` (the page's `--color-primary`, `--color-primary-text`): the filled primary, like «Почати» and «Зрозуміло».
  - Focus: `outline: 3px solid var(--focus); outline-offset: 2px` (the page's `button:focus-visible`). The dialog opens on «Скасувати» (the user's choice, row 74), so every confirm shot shows its ring.
  - Hover and press (l. 1234-1270) and the dialog's fade and scale (l. 1629-1672): not ported anywhere on the page.
- **The signed rules this touches:**
  - FR-67: the text, the two buttons, `showModal()`; no presentation.
  - FR-65: «Так, почати» and «Скасувати» are in the `:focus-visible` list; FR-65 does not say they set their own colours.
  - NFR-12: "the dialog buttons" at least 44×44 (measured by `e2e/nfr-12-targets.spec.ts:80-81`).
  - NFR-13: the confirmation state in the a11y sweep.
  - A-57 appendix: `--color-violation-ink`, "later".
  - The spec's «The panels take the shared surface paint» (l. 4327): the dialog's fill, border colour and shadow come from the shell, and "the other paint … of the confirmation dialog (the second wave), and the dialog's `--color-violation-ink` (the dialog block)" are listed as not delivered by the shell. Its scenario «The dialog takes the raised fill and the panel shadow and keeps its control border» must stay green.
  - The spec's «Borders, cues and focus rings have enough contrast» (l. 1510): "The 'later' row of the appendix that remains is `--color-violation-ink` (the block of the confirmation dialog); it is NOT declared by this requirement: the block that binds it adds it by its own delta, so the stylesheet never holds an unused token."

## Ids

Checked by grep on 2026-10-12: the highest ids in use are **FR-120** and **A-60**; the settings draft takes **A-61**. This draft adds **A-62** and amends **FR-67** (one presentation sentence), **FR-65** (one clause) and the **A-57 appendix** (one row's block column). It adds no FR. It renumbers nothing. The NFR-14 phrase for both surfaces is in the settings draft (its section 2).

## 1. What changes for the player

| # | Today | After the amendment (defaults) |
|---|---|---|
| D1 | «Скасувати» and «Так, почати» are plain outlined buttons. | «Скасувати», the safe choice that has the focus, is filled with the primary orange; «Так, почати», the choice that discards the moves, is the soft red of a violation with a red frame and dark red text. |
| D2 | The dialog has 20px of padding and 12px corners; at 320 px it is 288px wide. | 24px of padding, 16px corners, as the other panels; 296px wide at 320 px. |
| D3 | The buttons are 46px tall. | 44px tall (the floor of NFR-12 holds). |
| D4 | Keyboard and screen reader: the dialog opens on «Скасувати»; Escape cancels. | Unchanged. |

## 2. Proposed rows

### FR-67 (amended: a presentation sentence)

> … **Presentation** (A-62): a centred modal panel at every width, `min(22rem, the window less twice the page padding)` wide (1rem; 0.75rem at 22.5rem and narrower); the two buttons side by side, each at least 44 px tall, «Так, почати» first in reading order; when they do not fit side by side (at 320 px), «Скасувати» sits above «Так, почати». «Скасувати» has the primary fill; «Так, почати» has the violation colours, because it discards the moves. The look matches NFR-14. …
>
> Added after «… «Скасувати» (and Escape) closes the dialog …»; nothing else of FR-67 changes (the text, the buttons, Escape, no seed on cancel).

The DOM order is «Так, почати», then «Скасувати» (`src/ui/play-page.ts:181-182`), and the page already has the design's `flex-wrap: wrap-reverse` with `justify-content: flex-end`, so the last child goes to the upper line when they wrap: measured in `classify.txt`, at 320 «Скасувати» at y 338 above «Так, почати» at 390 on both sides, at 375 side by side («Так, почати» left). No DOM change.

### FR-65 (amended, one clause)

> … «Зрозуміло» sets its own `color` and `background-color` …; **in the confirmation dialog «Скасувати» sets the design's primary fill (`--color-primary` fill and border, `--color-primary-text`) and «Так, почати» the design's warning paint (`--color-violation-bg` fill, a 2px `--color-violation-border` frame, `--color-violation-ink` text; A-62);** the board sets `touch-action: manipulation`. …

The pairs: `--color-primary-text` on `--color-primary` (5.40 light, 8.55 dark) is already in the list (`tests/helpers/css.ts:676`, the group `text`); **new:** `--color-violation-ink` on `--color-violation-bg` (7.34 light, 8.40 dark, text 4.5:1). The focus ring of either button lies at a 2px offset on the dialog fill: `--color-focus` on `--color-surface-raised` 15.88 / 12.79 (already in the list). The red frame against the dialog fill (6.43 / 6.54) is not a pair: the button is identified by its text (as the header buttons' rule of A-60: nothing requires a border on a text-labelled button).

### A-57 appendix (one row)

> | `--color-violation-ink` | `#8f1d17` | `#ffb4ab` | text of «Так, почати» | ~~later~~ **dialog** (A-62) |

The light value equals `--color-violation-text` (A-57's light violating digit took the design's `--violation-ink`); the dark values differ (`#ffb4ab` against `#ff8a7d`). They stay two tokens, as in the design (DQ-1).

## 3. New assumption

> **A-62 (2026-10-12), the confirmation dialog's size, place and paint (FR-67, FR-65).** The values are the design's (`design/v0/app/binarka.css`, `review-set-14`, l. 1338-1397): `width: min(22rem, calc(100vw - 2 * var(--page-pad)))`, so 296px at 320 (the page's `--page-pad` is already 0.75rem at 22.5rem and narrower); `padding: 1.5rem`; radius `--radius-l`; the text 1rem at line height 1.5 with a 1.5rem bottom margin; the buttons `flex: 1 1 auto`, `min-height: 2.75rem`, `padding: 0 1rem`, a 2px border, `--radius-m`, weight 700, line height 1.2, so 44px tall. «Скасувати»: `--color-primary` fill and frame, `--color-primary-text`. «Так, почати»: `--color-violation-bg` fill, `--color-violation-border` frame, `--color-violation-ink` text (the A-57 appendix row, bound here; light `#8f1d17`, dark `#ffb4ab`; 7.34 and 8.40 against the fill). The fill, the 1px `--color-control-border` border and the panel shadow stay the shell's. The dialog's focus stays on «Скасувати» at opening (row 74). Hover, press and the dialog's fade and scale are not ported (DQ-3). **ASSUMPTION; ratified by the user's signature.**

## 4. Cue and paint rules, with the reasoning

| Element | Today | Proposed (design) | Contrast (light / dark) | Reasoning |
|---|---|---|---|---|
| «Скасувати» | base button: 1px `--color-control-border`, `--color-control-bg`, `--color-text` | `--color-primary` fill and 2px frame, `--color-primary-text`, 700 | 5.40 / 8.55 (in the list) | The design: the safe, focused choice is the primary one, as «Почати» and «Зрозуміло». |
| «Так, почати» | base button | `--color-violation-bg` fill, 2px `--color-violation-border` frame, `--color-violation-ink`, 700 | text 7.34 / 8.40 (**new pair**); frame on the dialog 6.43 / 6.54 (not a pair) | The design: the destructive choice in the violation colours, so it reads as "this discards" without being the primary action. |
| Focus ring of either | 3px `--color-focus` at 2px | unchanged | 15.88 / 12.79 on the dialog fill (in the list) | The ring sits on the dialog fill, never on a button's paint. |
| The dialog | 20px padding, 12px radius | 1.5rem, `--radius-l` | — | Geometry. |

## 5. Impact: spec, tests and files (change folder, after the signature)

The change folder is `openspec/changes/update-confirm-dialog/` (proposed name).

**Spec deltas** (`openspec/specs/play-page/spec.md`); the split is in the settings draft, section 9:

| Delta | Requirement | Source |
|---|---|---|
| MODIFIED | «Borders, cues and focus rings have enough contrast» (l. 1510): the token table gains `--color-violation-ink` (32 → 33 tokens; not translucent); the sentence "The 'later' row of the appendix that remains is `--color-violation-ink` … it is NOT declared by this requirement" becomes the binding; the pair list gains `--color-violation-ink` on `--color-violation-bg` in the group `text` (41 → 42 pairs) | A-57, A-62, FR-65 |
| ADDED | «The confirmation dialog takes the design's size, place and paint» (FR-67, FR-65, A-62, NFR-14): the size, padding, radius, text margin, the two buttons' metrics and paint; a stylesheet test, a geometry test against the design build (new cases in `quality/design-geometry.json`) and the pixel check of `scripts/visual-block.mjs` and `check:visual` | FR-67, A-62, NFR-14 |
| (DQ-4 only) MODIFIED | «Confirmation before discarding player entries» (l. 1035): only if the presentation sentence of FR-67 is wanted in that requirement too; the default puts it in the ADDED requirement and leaves this behaviour requirement unchanged | FR-67 |

Not modified (their text stays true): «The panels take the shared surface paint» (its scenario on `.confirm` stays green: the fill, the border colour and the shadow are unchanged, and the dialog rule still declares them once, outside any at-rule); «The backdrops take the design's translucent tokens» (its "not delivered" item (2) says the later tokens "are not declared by this requirement or by the shell", still true); «The main column takes the design palette».

**Tests that change** (each because a changed row demands it):

| File and line | Change | Source |
|---|---|---|
| `tests/helpers/css.ts` (`TOKEN_NAMES`, the light and dark samples, `CONTRAST_PAIRS`) and the token and pair pins: `grep -rn "32\b.*token\|41\b.*pair" tests/` at the folder's writing (after block B: `tests/play-page-helpers.test.ts`, `tests/play-page-cause-stylesheet.test.ts`, `tests/play-page-theme-stylesheet.test.ts`, `tests/play-page-level-stylesheet.test.ts`, `tests/play-page-layout-geometry.test.ts`, `tests/play-page-stylesheet.test.ts`, `tests/play-page-palette-stylesheet.test.ts`, `tests/play-page-panel-shell-stylesheet.test.ts`; the folder lists the lines) | 32 → 33 tokens; 41 → 42 pairs; translucent unchanged (5) | A-57, A-62, FR-65 |
| The test that pins "no unused token" / the "later" row (`grep -rn "violation-ink" tests/`) | `--color-violation-ink` is declared and bound | A-62 |
| `e2e/nfr-12-targets.spec.ts:80-81` (the dialog buttons), `e2e/nfr-13-a11y.spec.ts` (the confirmation state), `e2e/nfr-14-panel-shell.spec.ts` and `e2e/nfr-14-backdrop.spec.ts` (the dialog) | Unchanged in text; they must stay green | NFR-12, NFR-13, NFR-14 |

**New tests** (red first, by the dialog session's test-engineer):
- e2e `e2e/nfr-14-confirm-dialog.spec.ts` (`@trace NFR-14`, `@trace FR-67`, `layout` project): the dialog's box, its text's box and the two buttons' boxes equal the design build's (`/confirm/`) within 0.5 px at the sampled viewports of `review-set-14` (light: 320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900); the computed `color`, `background-color`, `border-color` and `border-width` of both buttons equal the design's in light and dark at 375×812 and 1024×768; sampled, never continuum.
- A stylesheet test: `.confirm` declares `padding: 1.5rem` (or the token form), `border-radius: var(--radius-l)` and a width with `var(--page-pad)`; the two `[data-confirm]` rules declare `color`, `background-color` and `border-color` from the tokens of section 4; `.confirm-buttons button` declares `padding`, `border-width: 2px`, `border-radius: var(--radius-m)`, `line-height: 1.2`; no colour literal (the existing scan).

**Files:** `src/ui/style.css` only (`:root` and `:root[data-theme="dark"]` gain one token; `.confirm`, `.confirm p`, `.confirm-buttons button`, two new `[data-confirm]` rules). No DOM change. `quality/design-geometry.json` gains dialog cases (the dialog block refreezes first, settings draft section 9). `scripts/visual-block.mjs` gains a `confirm` block. No `design/v0` change.

## 6. The design

No design round: the design exists (`review-set-14`), reviewed and moved by the user (row 142). The reference does not move.

## 7. Pixel expectations: each failing shot of run 12

Measured in `docs/qa/prep-g2-wave2/classify.txt` (device pixels; sampled).

| Shot | Run 12 | What the failing pixels are |
|---|---|---|
| `320-light-confirm`, `320-dark-confirm` | 0.9194, 0.9180 | «Скасувати» unpainted: 42,755 px (light `#b4460d` and dark `#f39a5b` in the design where the page shows the dialog fill), the largest single cause; the dialog 8px narrower (288 against 296: the page's fixed 32px against the design's twice 0.75rem) and 8px shorter (210 against 218: padding 20 against 24), so its edge, its corners (12 against 16px) and the band of backdrop around it differ (22,858 / 24,133 px); «Так, почати» unpainted, its red frame and fill missing (6561 / 6555 px). The text box happens to be the same (37,266 246×48 on both: 16 + 1 + 20 = 12 + 1 + 24) |
| `375-light-confirm`, `375-dark-confirm` | 0.9582, 0.9590 | «Скасувати» unpainted (22,652 / 22,664 px); the dialog 10px shorter (156 against 166: padding and the 46px buttons), its text 8px wider and 4px further left (301 against 293 wide), so the lines start at another pixel (4156 / 4122 px); «Так, почати» unpainted (5316 / 5321 px) |

**Why the 768 and wider shots pass:** the same causes act there (`1024-light-confirm`: «Скасувати» 23,486 px, the dialog 18,558, «Так, почати» 5397, the text 4298), but the shots are 3.5 to 5.8 times larger, so the share is about 1.6% instead of 4 to 8%.

**Expected after this block:** every confirm shot rises; the four phone shots should pass if the box and the paint match (the per-block tool decides). No 0.98 claim per shot in this draft. If a confirm shot does not rise, the block stops and explains it before the review gate.

## 8. Questions for the user

Defaults apply to "signed, use defaults". The explicit questions of the second wave are OQ-1 and SP-1 in the settings draft.

- **DQ-1, the text colour of «Так, почати».** **Default A:** the design's `--color-violation-ink` as its own token (light `#8f1d17`, dark `#ffb4ab`; 7.34 / 8.40). **B:** reuse `--color-violation-text` (no new token; light the same, dark `#ff8a7d`, 6.24:1): a small mismatch in the dark shots' button text, and the A-57 appendix row is withdrawn.
- **DQ-2, the width at 320 px.** **Default:** the design's `calc(100vw - 2 * var(--page-pad))` (296px at 320). Alternative: keep 32px (288px; a known mismatch in both 320 confirm shots).
- **DQ-3, hover, press, the fade and scale.** **Default:** not in this block (as RQ-4, SQ-6, OQ-5).
- **DQ-4, where the presentation sentence lives.** **Default:** in FR-67 and in the ADDED requirement only; the behaviour requirement «Confirmation before discarding player entries» is not touched. Alternative: also there.

## 9. The split

In the settings draft, section 9: this block declares `--color-violation-ink` and its one pair, MODIFIES «Borders, cues and focus rings have enough contrast» only, ADDS «The confirmation dialog takes the design's size, place and paint», adds its geometry cases first, and merges first (SP-1 A).

## 10. Auditor findings: disposition

Pending: a fresh independent auditor reads this draft before the user.
