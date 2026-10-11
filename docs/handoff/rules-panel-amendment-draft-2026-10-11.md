# Requirements amendment draft: the rules panel takes the design's size, place and paint, and opens at its top (2026-10-11)

Status: **SIGNED** by the user in chat on 2026-10-11 at about 16:13 (UTC+5:30) through the question form: RQ-1 «Sticky + reset on close and open», XQ-1 «data-size on the page root», PQ-1 «Yes, run it now», SQ-1 «Keep design value as decoration», and «Signed, use defaults» for the rest; the user saw the bug in Chrome (autonomy-log row 172). The text is folded into `docs/requirements.md`. The text below is kept as the record of what was signed. Written by the prep session `vibrant-tu-434033` (the parallel G2 plan, `docs/handoff/parallel-g2-plan-2026-10-11.md`, section P) from about 15:35 (UTC+5:30), at `main` `2e19235`. Read by a fresh independent auditor from about 15:53 to 16:03; its 4 major, 5 minor and 3 note findings are folded in (section 10). Nothing under `src/` changes before the user signs. The setup sheet has its own draft (`docs/handoff/setup-sheet-amendment-draft-2026-10-11.md`), which also carries the shared panel shell (its section 6) and the split (its section 9); both drafts are signed in one sitting.

## Basis

- **The user's report** (autonomy-log row 171, in chat on 2026-10-11, with a screenshot of their macOS browser): the «Правила» popover is narrow, scrolls inside and opens at its bottom; there was a design for it. Row 137 (3) recorded the "opens at its bottom" bug earlier; row 170 (4) placed it «Within the rules-panel block».
- **Today's page** (`src/ui/style.css`):
  - Phone: a bottom sheet, `max-height: 55dvh` (l. 636), as the design.
  - From 48rem (l. 654-671): `width: 28rem`, `max-width: calc(100% - 2rem)`, `height: fit-content`, centred by `margin: auto`; the phone `max-height: 55dvh` still applies. So on a desktop the panel is narrow and its contents scroll inside it.
  - `.rules-close` (l. 729-733) is an ordinary full-width button: no fill of its own, not sticky.
  - Fill `--color-control-bg`, border `--color-given-bg`, no shadow (l. 631-648). The example cells (l. 704-727): border `--color-control-border`, fill `--color-page`; the answer cell a dashed `--color-focus` border.
- **The design** (`design/v0/app/binarka.css`, `review-set-14`) has three regimes:
  - **Below 48rem:** a bottom sheet up to `55dvh` (with a `60vh` fallback), padding `1.5rem 1rem` plus `env(safe-area-inset-bottom)` (l. 809-829); at 22.5rem and below, padding-top 1rem and example cells 1.5rem (l. 931-943).
  - **48rem to 64rem** (l. 949-962, 1018-1047): the column width plus 1rem (`calc(var(--column) + 1rem)`), 6rem from the top, `max-height: calc(100dvh - 7rem)`, a `min-height` that covers the page down through the messages, `min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 13.875rem))`, a flex column (`.rules:popover-open`) with «Зрозуміло» pushed to the bottom (`margin-top: auto`), rounded corners all round and the panel shadow.
  - **From 64rem** (l. 1133-1152, "iteration 14, R3, autonomy-log row 120"): one column `40rem` wide, `height: fit-content`, `min-height: 0`, tighter spacing (padding-top 1rem, h2 margin 0.25rem, list margin 0.5rem, items 0.3125rem), "so the rules and techniques fit a 1366×650 window with no inner scroll"; top and `max-height` as from 48rem. The strong backdrop from 64rem (l. 1122-1126) is already ported (block 3).
  - At every width «Зрозуміло» is **sticky at the panel's bottom** (`position: sticky; bottom: 0`, l. 904-923), **filled** with the primary colour (`--primary` fill and border, `--primary-ink` text, weight 700), with a mask of two spread shadows in the panel fill that hides text scrolling under it.
  - The list separators are `--line`; the example cells are `--bg` with `--entry-ink` digits and `--cell-border` borders (light `#8c8374`, dark `#8a7f71`: the values of the page's `--color-control-border`, not of its `--color-cell-border`, which A-57 darkened in light to `#847b6d` for the cells only); the answer cell is a dashed `--primary` border on `--primary-soft` (l. 843-902).
- **The signed rules this touches:**
  - FR-57: «Placement (bottom sheet on phones, centred panel from 48rem) is covered by the held NFR-14 (or NFR-10 / NFR-15), see docs/requirements-held.md.» NFR-14 is no longer held (it moved into `docs/requirements.md` on 2026-10-10, row 138). FR-57 also says the panel is «opened by that button with no script».
  - NFR-14 (`docs/requirements.md:184`) names "centred panel from 48rem" among the layout decisions it covers.
  - SD-Q9 (`docs/handoff/setup-sheet-start-amendment-draft-2026-10-09.md:96`): «Does the desktop rules-panel remark need a requirement? No. Design only … size is layout, held NFR-14.» `docs/mvp-capability-plan.md:158` repeats it as a scope-out.
  - The `autofocus` on «Зрозуміло»: chosen by the user in review fix round 2 of 2026-10-06 (`tests/play-page-layout.test.ts:200-212`); the spec scenario «The panel is a named dialog and takes focus when opened» (`openspec/specs/play-page/spec.md:768-773`) requires the attribute on «Зрозуміло» and on no other element of the root.
  - FR-65: «Зрозуміло» is in the list of buttons with a `:focus-visible` indicator; FR-65 does not say it sets its own colours.
  - NFR-12 (44 px) and NFR-13 (focus visible, not obscured; the a11y sweep's `rules` state, `e2e/nfr-13-a11y.spec.ts:37`).
  - **The board width is not visible to the panel.** The design declares `--board-width` on `#app` (l. 120-126) through `#app:has(.board[data-size='…'])`; the page declares it on `.board` (`src/ui/style.css:91-94, 205`), because FR-65 allows `:has(` in the idle-line rule only. The panel is outside the board, so the design's `min-height` formula cannot be copied as it is (section 8, XQ-1).
- **Evidence gathered for this draft:**
  - `docs/qa/prep-g2/rules-open-probe.txt`: in Chromium the panel opens scrolled to its end at 375×812, 320×700, 768×1024 and 1366×650 (`scrollTop` at its maximum, focus on «Зрозуміло»). With only the design's `.rules-close { position: sticky; bottom: 0 }` injected, it opens at `scrollTop` 0 at all four sizes, focus kept.
  - `docs/qa/prep-g2/rules-reopen-probe.txt` (after the audit): **with the sticky button alone, the second opening is at the end again** (Chromium restores a popover's scroll offset across hide and show), closed by the button or by Escape. Resetting the scroll position when the panel closes (`beforetoggle`) or when it opens (`toggle`) gives `scrollTop` 0 on every opening.
  - `docs/qa/prep-g2/soft-dim-768-classify.txt`: the drop of `768-dark-rules` from 0.9314 (run 7) to 0.8882 (run 8) is reproduced exactly and explained by the gate's own per-pixel verdict (section 7). It supersedes the first reading in `soft-dim-768.txt` (correction COR-4).
  - Run 9 (`docs/qa/g2/check-visual-run-9.txt`): all 20 rules shots fail, light 0.7767 to 0.9010, dark 0.8168 to 0.9029.
  - Not checked: Safari and Firefox. Only Chromium is installed for the tests. The user's "macOS browser" may be Safari (RQ-1).

## Ids

Checked by grep in `docs/requirements.md` and `docs/requirements-held.md` on 2026-10-11: the highest ids in use are **FR-120** and **A-58**. This draft amends **FR-57**, **FR-65** (one clause) and **NFR-14** (one phrase), and adds **A-59**. It adds no FR. It renumbers nothing. The setup-sheet draft takes **A-60**.

## 1. What changes for the player

| # | Today | After the amendment (defaults) |
|---|---|---|
| R1 | Phone: the sheet opens scrolled to its end, «Зрозуміло» in view, the rules above it out of view. The same on every later opening. | The sheet opens at its top on every opening: the heading and the first rule are in view; «Зрозуміло» sits at the sheet's bottom, in view and focused. Scrolling moves the text under it. |
| R2 | 768 to 1023 px: a 28rem centred panel up to 55% of the window, scrolling inside. | The panel is as wide as the page column plus 1rem, 6rem from the top, and as tall as the page down through the messages (up to the window less 7rem). «Зрозуміло» sits at its bottom. |
| R3 | From 1024 px: the same 28rem panel, scrolling inside and opening at its end. | One 40rem column, as tall as its contents, with tighter spacing: at 1366×650 the rules and the techniques fit without scrolling. |
| R4 | «Зрозуміло» is an outlined button. | «Зрозуміло» is filled with the primary colour, like «Підказка» and «Почати». |
| R5 | The panel has the control fill and a pale border, no shadow. | The shared panel shell (raised fill, overlay border, shadows), from `update-panel-shell` (PQ-1 A) or from this block (PQ-1 B). |
| R6 | Keyboard: focus moves to «Зрозуміло» when the panel opens. | Unchanged. |

## 2. Proposed rows

### FR-57 (amended: the placement sentence)

> … **Placement** (A-59): below 48rem, a bottom sheet up to 55% of the window height; from 48rem to 64rem, a panel the page column's width plus 1rem, 6rem from the top of the window, at most the window height less 7rem, and at least tall enough to cover the page down through the message area (or the window less 7rem, if that is less), with «Зрозуміло» at its bottom; from 64rem, one column 40rem wide (never wider than the window less 2rem), 6rem from the top, as tall as its contents up to the window less 7rem. At every width «Зрозуміло» stays in view at the panel's bottom while the panel scrolls. **Every time the panel opens, it opens at its top** (its scroll position is 0), with focus on «Зрозуміло» (A-20). Opening and closing stay native (the `popovertarget` buttons); the page may reset the panel's scroll position when it opens or closes (RQ-1). The look matches NFR-14. …
>
> Replaces: «Placement (bottom sheet on phones, centred panel from 48rem) is covered by the held NFR-14 (or NFR-10 / NFR-15), see docs/requirements-held.md.»

«Never wider than the window less 2rem» keeps today's `max-width: calc(100% - 2rem)` (`src/ui/style.css:658`). The design text has no such cap; at 64rem (1024 px) 40rem is 640 px, inside the window, so it changes no shot. **A departure from the design text, said plainly** (RQ-2).

### FR-65 (amended, one clause)

> … «Почати» sets its own `color` and `background-color` from the colour tokens …; **«Зрозуміло» sets its own `color` and `background-color` from the colour tokens: the design's primary fill, `--color-primary` and `--color-primary-text`, with a `--color-primary` border (A-59);** the board sets `touch-action: manipulation`. …

The pair `--color-primary-text` on `--color-primary` (5.40 light, 8.55 dark) is already in the pair list (`tests/helpers/css.ts:637`). The focus ring is 3px wide at a 2px offset, so both its sides are the panel fill: `--color-focus` on `--color-surface-raised` is 15.88 light and 12.79 dark (on today's `--color-control-bg`, 15.88 and 13.85). The pairs on `--color-surface-raised` (text, muted text, focus) are added by the shell (setup-sheet draft, section 6). The ring against the primary fill itself (2.94 / 1.88) is never adjacent, because of the offset (the same geometry as «Почати» and «Підказка»).

### NFR-14 (amended, one phrase)

> … (bottom sheet on phones, **the rules panel and the setup sheet placed as FR-57 and FR-96 say from 48rem**), …
>
> Replaces: «(bottom sheet on phones, centred panel from 48rem)». The reference, the threshold and the mechanism are unchanged.

## 3. New assumption

> **A-59 (2026-10-11), the rules panel's size, place and paint.** The values are the design's (`design/v0/app/binarka.css`, `review-set-14`), as in FR-57's placement sentence, at the three regimes: below 48rem `max-height: 55dvh` with the `60vh` fallback, padding `1.5rem 1rem` plus the bottom safe-area inset (at 22.5rem and below, padding-top 1rem and 1.5rem example cells); from 48rem the open panel (`.rules:popover-open`, never the bare `.rules`, which would undo the browser's hiding of a closed popover) is a flex column and «Зрозуміло» takes `margin-top: auto`, so spare height sits above it, never below; its `min-height` uses the board side B = min(the board's width, the column) through the mechanism of XQ-1; from 64rem the design's 40rem column and tighter spacing (R3, row 120). «Зрозуміло» is `position: sticky; bottom: 0` at every width, with the design's mask (two spread shadows in the panel fill). **The panel opens at its top every time:** the sticky button is in view when the browser's popover focusing steps focus it, so the first opening does not scroll (`docs/qa/prep-g2/rules-open-probe.txt`); and, because Chromium restores a popover's scroll offset when it reopens (`docs/qa/prep-g2/rules-reopen-probe.txt`), the page resets the panel's scroll position as RQ-1 says. The list separators are `--color-line`; the decorative example cells (`aria-hidden`, A-26) are `--color-page` with `--color-entry-text` digits and `--color-control-border` borders (the design's `--cell-border` values), and the answer cell has a dashed `--color-primary` border on `--color-primary-soft` with `--color-text`. The rules panel adds no colour token of its own. The panel's motion (`binarka.css` l. 1508-1560) is not ported (RQ-4). **ASSUMPTION; ratified by the user's signature.**

## 4. Cue and paint rules, with the reasoning

| Element | Today | Proposed (design) | Contrast (light / dark) | Reasoning |
|---|---|---|---|---|
| «Зрозуміло» | outlined, `button` defaults | `--color-primary` fill and border, `--color-primary-text`, weight 700 | text 5.40 / 8.55; ring on the panel fill 15.88 / 12.79 | The design's primary action of the panel, like «Почати» and «Підказка». |
| Item separators | `--color-given-bg` | `--color-line` | not a pair (decoration) | Separators are not UI components (WCAG 1.4.11 does not apply). |
| Example cells | border `--color-control-border`, fill `--color-page`, inherited text | border `--color-control-border` (kept), fill `--color-page`, digit `--color-entry-text` | not a pair (`aria-hidden`, decoration, A-26) | The design's values exactly (its `--cell-border` = the page's `--color-control-border`). |
| Answer cell | dashed `--color-focus` | dashed `--color-primary` on `--color-primary-soft`, `--color-text` | 4.41 / 6.13 (the hinted-cue pair, already in the list) | The design reuses the hinted cell's look: "the answer". |
| Panel fill, border, shadows | `--color-control-bg`, `--color-given-bg`, none | `--color-surface-raised`, `--color-overlay-border`, `--color-shadow-sheet` (phone) / `--color-shadow-panel` (from 48rem) | the border is not a pair (1.24 light against the page; decoration, the backdrop already separates the panel) | The shared shell (PQ-1). |

## 5. Impact: spec, tests and files (change folder A, after the signature)

The change folder is `openspec/changes/update-rules-panel/` (proposed name).

**Spec deltas** (`openspec/specs/play-page/spec.md`); the split is in the setup-sheet draft, section 9:

| Delta | Requirement | Source |
|---|---|---|
| MODIFIED | «Rules panel» (l. 727): the placement sentence; the scenario «The panel opens with no script» keeps its meaning (opening and closing call no popover method; the scroll reset is not an opening); a new scenario «The panel opens at its top» (e2e, Chromium: the first opening, and a second opening after the player scrolled and closed it by «Зрозуміло» and by Escape); «The panel is a named dialog and takes focus when opened» keeps the `autofocus` under RQ-1 A and B and changes under RQ-1 C | FR-57, A-59, A-20 |
| ADDED | «The rules panel takes the design's size, place and paint» (FR-57, FR-65, A-59, NFR-14): the three regimes, the sticky and filled «Зрозуміло», the paint of section 4; a stylesheet test, a geometry test against the design build (new cases in `quality/design-geometry.json`) and the pixel check of `scripts/visual-block.mjs` and `check:visual` | FR-57, FR-65, A-59, NFR-14 |
| (PQ-1 B only) MODIFIED | «Borders, cues and focus rings have enough contrast», «The main column takes the design palette», «The backdrops take the design's translucent tokens», «Main column layout geometry follows the design reference» (its 27-token scenario): the four shell tokens and their pairs, as the setup-sheet draft's section 6 lists, then owned by this folder | A-57 |

**Tests that change** (each because a changed row demands it):

| File and line | Change | Source |
|---|---|---|
| `tests/play-page-layout.test.ts:200-212` | Unchanged under RQ-1 A and B. Under RQ-1 C, the `autofocus` assertion becomes "no element of the root has `autofocus`", and a new test checks the focus on opening | FR-57 (RQ-1) |
| The jsdom test of «The panel opens with no script» | Unchanged: the stubbed popover methods are still never called; a scroll reset sets `scrollTop` only | FR-57 |
| `e2e/nfr-13-a11y.spec.ts` (the `rules` state, l. 37) | Unchanged in text; the a11y sweep must stay green with the filled button and the new size | NFR-13 |
| `e2e/nfr-12-targets.spec.ts:53` | Unchanged in text; «Зрозуміло» stays at least 44 px in every regime | NFR-12 |
| The capture driver `rules-techniques` (`scripts/check-visual-parity-adapters.mjs:144-148`, locked) | Unchanged: it scrolls the panel to its end, as the design route does; the `rules` driver now captures the panel at its top, as the design | NFR-14 |
| (PQ-1 B only) the token-count and pair-count pins listed in the setup-sheet draft, section 6 | 27 → 31 tokens, 3 → 5 translucent, 35 → 38 pairs | A-57 |

**New tests** (red first, by the test-engineer of session A):
- e2e `e2e/nfr-14-rules-panel.spec.ts` (`@trace NFR-14`, `@trace FR-57`, `layout` project):
  - (1) the panel opens with `scrollTop` 0 and focus on «Зрозуміло» at 320×700, 375×812, 768×1024 and 1366×650, by a mouse click and by the keyboard; and again on a second opening after scrolling to the end and closing by «Зрозуміло», and by Escape (red today: `docs/qa/prep-g2/rules-open-probe.txt`, `rules-reopen-probe.txt`);
  - (2) the panel's box equals the design build's within 0.5 px at the sampled viewports of `review-set-14` (light: 320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900), plus one viewport where the board is narrower than the column (a 4×4 board at 768×1024) and one short window from 48rem to 64rem (for example 800×600), so the `min-height` is checked where the column is not the board side; «Зрозуміло» inside the panel and at its bottom. Sampled, never continuum.
- A stylesheet test: `.rules-close` declares `position: sticky`, `bottom: 0`, `color` and `background-color` from the tokens above; the flex rule selects `.rules:popover-open`; `.rules` from 48rem does not keep `55dvh`; from 64rem `width: 40rem`; no colour literal (the existing colour scan).

**Files:** `src/ui/style.css` (the `.rules` rules, `.rules-close`, the example cells). `src/ui/play-page.ts` for the scroll reset (RQ-1 A, B, C). `quality/design-geometry.json` gains rules-panel cases (refrozen by `scripts/freeze-design-geometry.mjs`; the design does not change, so only cases are added). No `design/v0` change.

## 6. The design

No design round: the design exists (`review-set-14`; iteration 14 R3 for the desktop column, iterations 9 and 11 for the sticky «Зрозуміло»), reviewed and moved by the user (row 142). The reference does not move.

## 7. Pixel expectations and the dark mismatch

- **All 20 rules shots fail today** (run 9). The causes are the panel's size and place (all widths from 48rem), the scroll position (every `rules` shot: the page shows the end, the design the top; the probe measured the end at 1366×650 too), «Зрозуміло» (outlined against filled) and the panel paint.
- **The dark rules shots from 64rem** (1024, 1366, 1440) fell in run 8 (`docs/qa/visual-diff/README.md` § Run 8): the old dark dim was the page colour, so the page's bare page under it stayed `#1a1714`, close enough to the design's panel fill `#2c2620` to pass; the strong composite `#0f0c09` does not. The panel mismatch was always there; this block fixes it by the place and the paint.
- **`768-dark-rules` (0.9314 to 0.8882 in run 8, soft dim) is explained** (`docs/qa/prep-g2/soft-dim-768-classify.txt`). Rebuilding the run-7 dim pixel by pixel reproduces both scores to 4 places. By the gate's own per-pixel verdict (pixelmatch 8.0.0), 135,776 of the 135,961 newly failing pixels are one pair: **the design's panel fill `#2c2620` where the page shows its soft-dimmed bare page** (`#120f0c` now, `#1a1714` before). It is the same masking as above, under the soft dim. The README's statement that this "cannot" be the cause, because a YIQ delta of 283 is under 352, used a formula the gate does not use; correction COR-4 records it, and the README is fixed after the user's disposition.
- **Expected after this block:** every rules shot rises. The block does not claim 0.98 per shot: text rendering inside the panel, the board under the backdrop and the shell paint all contribute. The per-block tool (`scripts/visual-block.mjs`, a `rules` block to add) localises any residual. If a rules shot does not rise, the block stops and explains it before the review gate.

## 8. Questions for the user

Defaults apply to "signed, use defaults", **except RQ-1 and XQ-1, which need an explicit answer.** PQ-1 (the shell) is in the setup-sheet draft.

- **RQ-1, how the panel opens at its top on every opening. Explicit answer.** Keep the `autofocus` (your 2026-10-06 choice) in A and B. A focused button scrolled out of view would also break WCAG 2.4.11 (focus not obscured), so the button must stay in view.
  - **A (recommended):** the design's sticky «Зрозуміло», plus a small script that sets the panel's scroll position to 0 **when it closes** (`beforetoggle`, while it is still shown) **and when it opens** (`toggle`). The close reset covers Chromium's restored scroll offset with no visible jump; the open reset is a net for a browser that scrolls the autofocused button into view anyway (Safari and Firefox are not tested here). Opening and closing stay native.
  - **B:** sticky, plus the reset on opening only. Simpler; the first frame may show the old position for a moment before the reset (the `toggle` event comes after the panel is shown).
  - **C:** drop `autofocus`; on opening, focus «Зрозуміло» with `preventScroll` and reset the scroll position. Cost: your 2026-10-06 choice and the spec scenario change.
  - Not offered: sticky alone, because the second opening is at the end again (`rules-reopen-probe.txt`).
  - **Please also say which browser you saw it in** (Safari, Chrome or another): the project tests Chromium only.
- **XQ-1, how the panels learn the board's size** (shared with the setup sheet, which needs it at every width from 48rem). **Explicit answer.**
  - **A (recommended):** the page root carries `data-size` (set by the page whenever the board changes size, like the board's own `data-size`), and the size-dependent layout variables move from `.board` to rules keyed on the root's `data-size`, so the board and the panels read the same `--board-width`. No `:has(`. A small DOM-contract addition (one attribute on the root), owned by `update-panel-shell` (PQ-1 A), so both blocks can use it. The geometry and paint tests guard that the board does not move.
  - **B:** the panels use the column (`--column`) for the board side. Exact when the board fills the column (6×6 on a tall window); too tall for a 4×4 board and on short windows (the column's 26rem floor). A departure from the design, with an unmeasured pixel cost in the `four` shots of the setup sheet.
  - **C:** no `min-height` from 48rem (the panel as tall as its contents). The 768 rules shot would show the board under the panel's bottom edge, against the design's rule that panels end in empty page space.
- **RQ-2, the desktop size as requirement text.**
  - **Default A:** FR-57's placement sentence states the design's three regimes (section 2), A-59 holds the values, and NFR-14's phrase points at FR-57 and FR-96. Reason: SD-Q9 left the size to the pixel gate, and the narrow panel reached you anyway.
  - **B:** keep SD-Q9: no size in the requirement; FR-57 only drops "held" and points at NFR-14.
  - Sub-question, default **yes**: keep today's cap of the panel at the window less 2rem (not in the design text; it changes no shot).
- **RQ-3, the filled «Зрозуміло».** **Default:** yes, primary fill as the design (FR-65 clause). Alternative: keep it outlined (a known mismatch in every rules shot).
- **RQ-4, the panel's motion** (the slide and fade, `binarka.css` l. 1508-1560). **Default:** not in this block; the gate captures with reduced motion, and the backdrop block left the backdrop fade out too. Alternative: port it here, under `prefers-reduced-motion: no-preference` only.

## 9. The split

In the setup-sheet draft, section 9: this block declares no token, MODIFIES «Rules panel» only and ADDS «The rules panel takes the design's size, place and paint» (under PQ-1 B it also owns the four shell tokens and their requirements). It adds its geometry cases first; B rebases onto it.

## 10. Auditor findings: disposition

**The audit.** A fresh general-purpose subagent, read-only, audited the draft on 2026-10-11 from about 15:53 to 16:03. It recomputed the contrast figures (none wrong), re-scored the saved product capture with the gate's pixelmatch, and ran its own standalone popover probe in Chromium. 4 major, 5 minor, 3 notes; all folded in. Its findings 1 and 2 were re-checked by the parent before folding (`docs/qa/prep-g2/soft-dim-768-classify.txt`, `rules-reopen-probe.txt`).

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | major | The 768-dark-rules explanation used a hand-written YIQ delta; the gate runs pixelmatch 8.0.0. By the gate's verdict the drop is the design's panel fill `#2c2620` over the page's dimmed bare page (135,776 px), not `--line` and `--primary-soft` (2231 px). README § Run 8's "283 < 352" is wrong too | Re-classified with pixelmatch's own output (`soft-dim-768-classify.txt`); section 7 rewritten; `soft-dim-768.txt` marked superseded in part; correction COR-4 filed for the README claim; the user dispositions it |
| 2 | major | Under the sticky-only fix the second opening is at the end again (Chromium restores the scroll offset) | Confirmed (`rules-reopen-probe.txt`); RQ-1 reframed: a reset on close and on open is recommended; sticky alone not offered; the e2e covers a second opening |
| 3 | major | `--board-width` lives on `.board`, so the design's `min-height` cannot be copied; a 768×1024 6×6 sample would not catch an approximation | XQ-1 added (shared with the setup sheet); A-59 names the mechanism; the geometry cases gain a 4×4 viewport and a short 48-64rem window |
| 4 | major | Ownership under PQ-1 B was inconsistent (no token-count tests, the sibling table had no PQ-1 B branch) | Section 5 lists the PQ-1 B deltas and tests; the setup-sheet draft's section 9 gives the PQ-1 B branch |
| 5 | minor | No pair pins text, muted text and focus on `--color-surface-raised` | The shell adds the three pairs (setup-sheet draft, section 6) |
| 6 | minor | The example-cell border `--color-cell-border` would depart from the design in light | Kept `--color-control-border` (the design's `--cell-border` values) |
| 7 | minor | The 2rem cap is today's rule, not new | Said so in section 2 and RQ-2 |
| 8 | minor | Citations: `css.ts:637`, 13.85, the 64rem block to l. 1152, backdrop l. 1122-1126, spec l. 768-773, test l. 200-212; the `rules` shots from 64rem also open at the end | All fixed |
| 9 | minor | NFR-14's own "centred panel from 48rem" | NFR-14 amended (one phrase) |
| 10 | note | A-59 omitted the 22.5rem block, the safe-area padding, the `60vh` fallback, the `:popover-open` flex selector; the ring is 3px at a 2px offset | All in A-59 and section 2 |
| 11 | note | The probe was mouse-only and Chromium-only; the user's browser may be Safari | The e2e covers keyboard opening; RQ-1 asks for the user's browser and recommends the open reset as a net |
| 12 | note | Verified correct: the contrast figures, run 9, the citations listed, the three regimes, the ids | No change |
