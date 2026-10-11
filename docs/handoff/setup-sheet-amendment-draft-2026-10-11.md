# Requirements amendment draft: the setup sheet takes the design's size, place and paint; the shared panel shell (2026-10-11)

Status: **SIGNED** by the user in chat on 2026-10-11 at about 16:13 (UTC+5:30) through the question form: RQ-1 «Sticky + reset on close and open», XQ-1 «data-size on the page root», PQ-1 «Yes, run it now», SQ-1 «Keep design value as decoration», and «Signed, use defaults» for the rest; the user saw the bug in Chrome (autonomy-log row 172). The text is folded into `docs/requirements.md`. The text below is kept as the record of what was signed. Written by the prep session `vibrant-tu-434033` (the parallel G2 plan, `docs/handoff/parallel-g2-plan-2026-10-11.md`, section P) from about 15:50 (UTC+5:30), at `main` `2e19235`. Read by a fresh independent auditor from about 15:53 to 16:09; its 5 major, 3 minor and 3 note findings are folded in (section 10). Nothing under `src/` changes before the user signs. The rules panel has its own draft (`docs/handoff/rules-panel-amendment-draft-2026-10-11.md`); both are signed in one sitting. This draft also carries the shared panel shell (section 6) and the split between the blocks (section 9), because both drafts depend on them.

## Basis

- **The plan** (`docs/handoff/parallel-g2-plan-2026-10-11.md`, P1 "Setup sheet (B)"): the level-description indent; the idle line under the sheet at 1366×650; a proposal for `--color-option-border` at 1.98:1 (a known failure that "the sheet block proposes", A-57); `--color-shadow-sunken`; the soft-dim drop of `768-dark-setup-four`. Rows 168 and 170 (3) named the same items.
- **Today's page** (`src/ui/style.css`):
  - `.setup-sheet` (l. 780-801): a bottom sheet up to `80dvh` on phones; from 48rem (l. 807-818) `width: 28rem`, centred by `margin: auto`, `height: fit-content`. Fill `--color-control-bg`, border `--color-given-bg`, no shadow. It keeps `line-height: normal` (l. 784), a placeholder that block 1 left "until its own G2 block" (spec «Main column layout geometry follows the design reference»).
  - The level group's bottom margin is 28px (l. 922-927), not the design's 24px: with 24px the focus ring of the last option sat up to 1.8 px under the footer strip (`docs/qa/update-page-layout-geometry/nfr-13-red-after-port.txt`).
  - The level cards (l. 832-884): border `--color-control-border`; checked: border `--color-focus`, fill `--color-given-bg`, the radio ring filled `--color-focus` with an inset `--color-given-bg` shadow (the dot); unavailable: dashed border, `--color-page` fill, `--color-text`. The ring is 1rem; the description has no indent.
  - The size options in the sheet (l. 575-584): checked border `--color-focus`, fill `--color-given-bg`.
  - «Почати» (l. 957-967): outlined (`--color-focus` border, `--color-control-bg` fill).
- **The design** (`design/v0/app/binarka.css`, `review-set-14`):
  - **Phone:** a bottom sheet up to `88dvh` (`90vh` fallback) (l. 966-970); at 22.5rem and below, up to `100dvh - 9rem`, with tighter cards and a 1rem level-group margin (l. 972-998).
  - **From 48rem, window under 44rem tall** (for example 1366×650): full cover from 6rem, the column width plus 1rem, `height: fit-content`, `max-height: calc(100dvh - 7rem)`, `min-height: min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 8.5rem))`, "ends at least 0.5rem below the button row" (l. 949-962, 1053-1060).
  - **From 48rem, window at least 44rem tall** (768×1024, 1024×768, 1440×900): anchored under the summary button "like a dropdown", the column width, 9.75rem from the top, `max-height: calc(100dvh - 10.75rem)`, `min-height: min(calc(100dvh - 10.75rem), calc(min(var(--board-width), var(--column)) + 4.75rem))`, "so the messages stay visible when the cards fit" (l. 1000-1007, 1062-1072). Both floors end 0.5rem below the button row; taller contents grow up to the window, "covering the messages while open" (l. 1049-1053).
  - The level cards (l. 435-532): one column; `.level-text` indented by `calc(0.875rem + var(--space-2))`, so the description starts under the name, not under the ring; ring 0.875rem, 2px `--cell-border`; available border 2px `--option-border`, fill `--surface`; checked: border `--primary`, fill `--primary-soft`, ring `--primary` with a dot `radial-gradient(circle, var(--primary) 0 40%, var(--surface) 45%)` (l. 502); unavailable: dashed `--cell-border`, fill `--bg`, text `--ink-muted`, dashed ring. The reason line has a 3px `--primary` left border. The checked size option is `--primary` on `--primary-soft` (l. 408-414).
  - The design's `--cell-border` is `#8c8374` light and `#8a7f71` dark: the values of the page's `--color-control-border`. The page's `--color-cell-border` is darker in light (`#847b6d`) by A-57's deviation for the board cells only.
  - «Почати» filled (`--primary` fill and border, `--primary-ink`, weight 700) (l. 611-626); «Закрити» on the panel's own fill with a `--cell-border` border (l. 537-557).
  - `--sunken-shadow` "is now unused, kept as a token" since iteration 11 (l. 440-441); no rule reads it, and `review-set-14` shows no inset on the unavailable cards (`375-light-setup-four.png`, `1366-light-setup-four.png`, `1024-dark-setup-four.png`).
  - The design declares `--board-width` on `#app` (l. 120-126); the page declares it on `.board` (`src/ui/style.css:91-94, 205`) because FR-65 allows `:has(` in the idle-line rule only. The sheet is outside the board, so the design's `min-height` formula cannot be copied as it is (XQ-1).
- **Seen in the shots:** at 1366×650 the page's sheet is centred and ends just above the message area, so the bottom of the idle line («…кнопка «Правила» вгорі.») shows under the sheet's edge, cut (`docs/qa/update-page-layout-geometry/stills/1366-dark-setup.png`); the design's sheet covers it (`design/v0-screenshots/review-set-14/1366-light-setup.png`). That is "the idle line under the sheet".
- **Evidence gathered for this draft:** `docs/qa/prep-g2/soft-dim-768-classify.txt` (the drop of `768-dark-setup-four`, section 7; it supersedes the first reading in `soft-dim-768.txt`, correction COR-4). Contrast figures are WCAG 2 ratios from the A-57 literals, computed in the session scratchpad with the formula of `tests/helpers/css.ts`; the auditor recomputed all of them.
- **Run 9:** all 48 setup shots fail (0.7527 to 0.9447; `docs/qa/g2/check-visual-run-9.txt`).

## Ids

Checked by grep on 2026-10-11: the highest ids in use are **FR-120** and **A-58**; the rules-panel draft takes **A-59**. This draft adds **A-60** and amends **FR-96** (the presentation sentence and its "held" phrase), **FR-99** (its stale "held NFR-12"), **FR-65** (one clause, the ring pairs) and the **A-57 appendix** (two rows) and A-57's "known failures" sentence. It adds no FR. It renumbers nothing.

## 1. What changes for the player

| # | Today | After the amendment (defaults) |
|---|---|---|
| S1 | Phone: the sheet is up to 80% of the window. | Up to 88% (up to the window less 9rem at 320 px), as the design; the cards are a little tighter at 320 px. |
| S2 | Tablet and desktop: a 28rem panel in the middle of the window. | On a tall window, the sheet hangs under the summary button, as wide as the page column, like a dropdown; the message area below it stays visible when the cards fit. On a short window (for example 1366×650), it covers the page from 6rem, 1rem wider than the column. |
| S3 | At 1366×650 the cut bottom of the idle line shows under the sheet. | The sheet ends at least 0.5rem below the button row. When its contents are taller, it grows up to the window and covers the messages while open (as at 1366×650 in the design), so no cut line of text shows under it in the sampled cases. |
| S4 | The level description starts under the radio ring. | The description starts under the level's name. |
| S5 | Available cards have the control border; the checked card and the checked size have the dark focus border on the given fill. | Available cards have the design's warm card border; the checked card and the checked size have the primary border on the soft primary fill; the checked ring has an orange dot. |
| S6 | «Почати» is outlined. | «Почати» is filled with the primary colour (the change FR-65 already announces for "the setup-sheet block"). |
| S7 | Fill and border of the sheet: control fill, pale border, no shadow. | The shared shell: raised fill, overlay border, shadows (section 6). |

## 2. Proposed rows

### FR-96 (amended: the presentation sentence)

> … **Presentation** (A-60): a bottom sheet on phones (up to 88% of the window height; up to the window less 9rem at 22.5rem and narrower); from 48rem, a panel centred on the page column: on a window at least 44rem tall, as wide as the column and hung 0.5rem under the summary button; on a shorter window, the column width plus 1rem, 6rem from the top. In both it ends at least 0.5rem below the button row (or at the window's limit, if that is higher), grows with its contents up to the window, and scrolls inside only when the window is too short; taller contents cover the messages while the sheet is open. The look matches NFR-14. …
>
> Replaces: «Presentation mirrors the rules panel: a bottom sheet on phones, a centred panel on tablet and desktop (structure A at every form factor, `design/wireframes/setup-controls-2026-10-09/`; layout held, NFR-14).» The structure-A reference stays. FR-96's other phrase «where they are drawn is layout, held NFR-14» becomes «… is layout, NFR-14» (NFR-14 is not held any more).

### FR-99 (amended: a stale word)

> «The four buttons are each at least 44 px tall (NFR-12).» Replaces «(held NFR-12)». No other change.

### FR-65 (amended, one clause, the ring pairs)

> … the size buttons, the four level buttons and the summary button set their own text and background colours (existing tokens); **the radio ring of a level button is the cue that identifies it as an option (A-60): its border has at least 3:1 against the card fill, and the checked ring's dot and the checked card's border have at least 3:1 against the card fill and the sheet fill;** «Почати» sets its own …

New pairs (owned by B): `--color-control-border` on `--color-control-bg` (3.68 light, 4.13 dark: the ring); `--color-primary` on `--color-control-bg` (5.40 / 7.39: the dot) and on `--color-surface-raised` (5.40 / 6.82: the checked border on the sheet). The available card's border is not a pair (SQ-1 A). Under SQ-1 B, the clause also names the available card border (3:1 on the card and the sheet).

### A-57 appendix (two rows) and A-57's text

> | `--color-option-border` | `#c4b59c` | `#5a5045` | available level card border (decoration, A-60; not a contrast pair) | setup sheet |
>
> ~~| `--color-shadow-sunken` | `#3c230a1f` | `#00000073` | the unavailable level's inset (translucent) | later |~~ **Withdrawn** (SQ-2): the design dropped the inset in iteration 11 and no rule uses `--sunken-shadow` (`binarka.css` l. 440-441); the stylesheet never holds an unbound token. If a later design brings the inset back, it adds the row again.
>
> A-57's «Known failures left to later blocks: the level card border (`--color-option-border`, 1.98 / 1.90) and …» becomes «Known failures left to later blocks: … (the level card border is decoration, A-60)».

## 3. New assumption

> **A-60 (2026-10-11), the setup sheet's size, place and paint.** The values are the design's (`design/v0/app/binarka.css`, `review-set-14`), as in FR-96's presentation sentence. From 48rem the sheet's `min-height` comes from the page geometry, with the board side B = min(the board's width, the column) read through the mechanism of XQ-1: `B + 4.75rem` anchored, `B + 8.5rem` full cover, each capped by the window, so the floor ends 0.5rem below the button row. The sheet keeps the body's line height (the placeholder `line-height: normal` of block 1 goes; the scenario «The setup sheet keeps its levels in view at 1366×650» stays and must pass). Each level description starts under the name (`padding-left` = the ring's width plus the gap, 0.875rem + 0.5rem). **Departure, said plainly:** the level group's bottom margin stays 28px at every width (the design: 24px from 48rem, 1rem at 22.5rem and narrower), because a smaller margin puts the keyboard focus ring of the last option under the footer strip (FR-65, WCAG 2.4.11; the scenario «A focused option in a scrolling sheet is not covered by the footer», `e2e/nfr-13-a11y.spec.ts:180-184`, at 320×700, 320×568, 375×667 and 1366×650); `scroll-padding-bottom` is re-derived if the footer or the padding changes. **The available card's border (`--color-option-border`, 1.98:1 light and 2.06:1 dark against the card) is decoration, not a contrast pair** (SQ-1 A). WCAG 1.4.11 asks for 3:1 for the visual information *needed to identify a component or its state*; its Understanding document says a text-labelled control needs no visible boundary. The card is identified by its text and by its radio ring (`--color-control-border`, the design's `--cell-border` values, on the card: 3.68 light, 4.13 dark), its checked state by the ring's dot and the primary border (`--color-primary` on the card 5.40 / 7.39, on the sheet 5.40 / 6.82, on the soft fill 4.41 / 6.13), and the unavailable state by the dashed border and the dashed ring (`--color-control-border` on the page 3.38 / 4.55). The header buttons' border is a pair (`--color-control-border` on the page) because there the design's value reaches 3:1; nothing in the project requires a border for a text-labelled button. The checked ring's dot is the design's radial gradient of `--color-primary` on the card fill (SQ-3). The unavailable card has no inset shadow (SQ-2). The checked size option takes the design's `--color-primary` border on `--color-primary-soft`. Inside the sheet, wherever the design uses `--cell-border` (the ring, the unavailable border, the «Закрити» border), the page uses `--color-control-border`, which has the same values. **ASSUMPTION; ratified by the user's signature.**

## 4. Cue and paint rules, with the reasoning

| Element | Today | Proposed (design) | Contrast (light / dark) | Reasoning |
|---|---|---|---|---|
| Available card border | 2px `--color-control-border` | 2px `--color-option-border` | 1.98 / 2.06 on the card; 1.98 / 1.90 on the sheet: **not a pair** (SQ-1 A) | Identification is the text and the ring. |
| Radio ring | 1rem, `--color-text` | 0.875rem, 2px `--color-control-border`, card fill inside | 3.68 / 4.13 on the card (new pair) | The design's ring, at the design's values. |
| Checked card | `--color-focus` border, `--color-given-bg` fill | `--color-primary` border, `--color-primary-soft` fill, `--color-text` | border 4.41 / 6.13 on the soft fill, 5.40 / 6.82 on the sheet (new pair); text on the soft fill ≥ 4.5 (in the list) | The design's checked look; the same pairs as the hinted cell. |
| Checked dot | `--color-focus` fill with an inset `--color-given-bg` shadow | radial gradient: `--color-primary` dot on the card fill | 5.40 / 7.39 on the card fill (new pair) | Shape cue kept (WCAG 1.4.1); see SQ-3 for the scenario that pins `inset`. |
| Unavailable card | dashed, `--color-page`, `--color-text` | dashed `--color-control-border`, `--color-page`, `--color-text-muted`; dashed ring, no fill | border 3.38 / 4.55 on the page, 3.68 / 3.81 on the sheet; text-muted on the page ≥ 4.5 (in the list) | The design's look, no inset (SQ-2). |
| Description | `--color-text`, no indent | `--color-text-muted` (checked: `--color-text`), indented | ≥ 4.5 (in the list) | The design. |
| Reason line | plain `p` | 3px `--color-primary` left border, `--color-text`, 0.875rem | decoration | The design. |
| Checked size option | `--color-focus` border, `--color-given-bg` fill | `--color-primary` border, `--color-primary-soft` fill, `--color-text`, 700 | 4.41 / 6.13; text in the list | The design (l. 408-414). The theme and language options keep their rule (second wave). |
| «Почати» | outlined | `--color-primary` fill and border, `--color-primary-text`, 700 | 5.40 / 8.55 | Signed (FR-65, A-57). |
| «Закрити» border | `button` default | 2px `--color-control-border` | ≥ 3 on the sheet | The design's `--cell-border` values. |
| «Закрити» fill, footer strip (shell) | `--color-control-bg` | `--color-surface-raised` | text, muted text and focus on it: pairs added by the shell | Bound by the shell (section 6); must equal the sheet fill, or a band shows in dark (`#24201b` on `#2c2620`). |

## 5. Impact: spec, tests and files (change folder B, after the signature)

The change folder is `openspec/changes/update-setup-sheet/` (proposed name).

**Spec deltas** (`openspec/specs/play-page/spec.md`); this folder owns each requirement below alone, after the shell (section 9):

| Delta | Requirement | Source |
|---|---|---|
| MODIFIED | «Setup sheet» (l. 2102): the "where the sheet is drawn … held NFR-10, NFR-12 and NFR-14, see `docs/requirements-held.md`" sentence becomes FR-96's presentation sentence | FR-96, A-60 |
| MODIFIED | «Main column layout geometry follows the design reference» (l. 3871): drop «While the column is ported, the setup sheet SHALL keep its text height … until its own block, …»; the scenario «The setup sheet keeps its levels in view at 1366×650» stays (written against the post-shell text; the shell owns the token-count scenario of this requirement, section 9) | A-60 |
| MODIFIED | «The summary and level buttons set their own colours» (l. 2675): «Почати» "keeps its current token bindings … the setup-sheet block binds it" becomes the binding; the scenario «The checked level has a cue besides colour» accepts the design's dot (SQ-3 A: a radial gradient in the checked ring's `background-image`, instead of an `inset` box shadow) | FR-65, FR-91, A-60 |
| MODIFIED | «Borders, cues and focus rings have enough contrast» (l. 1489), after the shell: the token table gains `--color-option-border` (not translucent; in no pair, SQ-1 A); `--color-shadow-sunken` withdrawn; 31 tokens become 32; the pair list gains the three ring pairs of FR-65 (38 → 41 pairs) | A-57, A-60, FR-65 |
| MODIFIED | «Cells and buttons show a visible, unobscured focus indicator» (l. 1892): only if its text about the sheet's footer and padding ("bottom padding of up to 24px") changes when the design's padding is ported; the 28px margin keeps the ring clear | FR-65, A-60 |
| MODIFIED | «The size buttons set their own colours and the board disables double-tap zoom» (l. 1950): only if its text pins the checked size option's tokens | FR-65 |
| MODIFIED | «The start button and the sheet buttons meet the touch-target floor» (l. 2877) and any other sheet requirement that says "(held NFR-14)" or "(held NFR-12)": the stale word goes | NFR-12, NFR-14 |
| ADDED | «The setup sheet takes the design's size, place and paint» (FR-96, FR-65, A-60, NFR-14): the regimes, the indent, the card and size-option paint, «Почати», «Закрити»'s border, the 28px departure; a stylesheet test, a geometry test against the design build (new cases in `quality/design-geometry.json`) and the pixel check | FR-96, A-60, NFR-14 |

**Tests that change** (each because a changed row demands it):

| File and line | Change | Source |
|---|---|---|
| `tests/play-page-level-stylesheet.test.ts:188` and the scenario «The checked level has a cue besides colour» | Accept a radial-gradient dot in place of the `inset` shadow (SQ-3 A) | FR-65, A-60 |
| `tests/play-page-level-stylesheet.test.ts:122-163` «The start button declares its colours» | Unchanged in text; it must stay green with the primary fill | FR-65 |
| `tests/play-page-stylesheet.test.ts:316-322` (`scroll-padding-bottom`) and `e2e/nfr-13-a11y.spec.ts:175-186` (focus not obscured) | Kept; the value is re-derived if the footer or the padding changes | FR-65 |
| The token and pair pins (after the shell: 31 tokens, 5 translucent, 38 pairs): `tests/helpers/css.ts` (`TOKEN_NAMES`, the light and dark samples, `CONTRAST_PAIRS`), `tests/play-page-helpers.test.ts:462, 466-467, 1432`, `tests/play-page-cause-stylesheet.test.ts:205-206`, `tests/play-page-theme-stylesheet.test.ts:165, 174`, `tests/play-page-level-stylesheet.test.ts:216`, `tests/play-page-layout-geometry.test.ts:78-82`, `tests/play-page-stylesheet.test.ts:92-105`, `tests/play-page-palette-stylesheet.test.ts:70` | 31 → 32 tokens; 38 → 41 pairs; translucent unchanged (5) | A-57, A-60, FR-65 |
| `e2e/nfr-12-targets.spec.ts`, `e2e/nfr-13-a11y.spec.ts` (the sheet states) | Unchanged in text; they must stay green | NFR-12, NFR-13 |

**New tests:** a stylesheet test of the regimes and the paint; an e2e geometry test (`e2e/nfr-14-setup-sheet.spec.ts`, `layout` project) of the sheet box and the first level description's left edge against the design build at the sampled viewports (light: 320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900; the default and `four` states, so a 4×4 board checks the board side of XQ-1), sampled; and at those viewports a check that the sheet's bottom edge is at least 0.5rem below the button row and does not cut the idle line's box (S3).

**Files:** `src/ui/style.css` only (no DOM change in this block; the root's `data-size` of XQ-1 A comes from the shell). `quality/design-geometry.json` gains setup-sheet cases (after A's cases; section 9). No `design/v0` change under SQ-1 A.

## 6. The shared panel shell (`update-panel-shell`, proposed to run now, in the prep session)

**What it is.** Four tokens of the A-57 appendix that every surface uses, and (under XQ-1 A) the board-size hook that both panels need:

| Token | Light | Dark | Bound to |
|---|---|---|---|
| `--color-surface-raised` | `#fffdf8` | `#2c2620` | the fill of the rules panel, the setup sheet, the settings panel and the confirmation dialog; the sheet's footer strip (gradient and offset shadow); the fill of «Закрити» in the sheet and in the settings panel |
| `--color-overlay-border` | `#e2dbcc` | `#8a7f71` | the border colour of the rules panel, the setup sheet and the settings panel (the design's `--overlay-border` is `var(--line)` in light and `var(--cell-border)` in dark) |
| `--color-shadow-panel` | `#00000040` | `#00000040` | `box-shadow: 0 1rem 2.5rem var(--color-shadow-panel)` on the three panels from 48rem and on the dialog at every width (translucent) |
| `--color-shadow-sheet` | `#0000002e` | `#0000002e` | `box-shadow: 0 -0.5rem 2rem var(--color-shadow-sheet)` on the three panels below 48rem (translucent) |

The appendix values equal the design's alphas (0.25 → `40`, 0.18 → `2e`). **The dialog's border stays `--color-control-border`**: the design's `.confirm` border is `--cell-border` (l. 1343), whose values are the page's `--color-control-border` in both sets. So the brief's "overlay-border … and the dialog" is off by one surface: the shell gives the dialog its fill and shadow only.

**New pairs** (the panels now have a fill that no existing pair covers; dark `#2c2620` equals no other background): `--color-text`, `--color-text-muted` and `--color-focus` on `--color-surface-raised` (15.88 / 12.79, 7.17 / 6.96, 15.88 / 12.79). 35 pairs become 38.

**The board-size hook (XQ-1 A).** The page root carries `data-size` (4, 6 or 8; set at mount and whenever the board changes size, like the board's own), and the size-dependent layout variables (`--n`, `--cell-max`, `--board-gap`, `--board-pad`, `--board-width`) are declared on the root keyed by it, so the board and the panels read the same `--board-width`. No `:has(`. Geometry unchanged (the geometry and layout tests guard it). A new scenario pins the attribute; two mounts stay independent. **This goes beyond "paint only", said plainly**: it is in the shell because both A and B need it and they run in parallel. Under XQ-1 B or C there is no hook.

**Paint only, otherwise.** No width, height, place, radius, padding or line height changes. The shell does not make «Зрозуміло» or «Почати» filled (blocks A and B), and does not port the settings panel's or the dialog's other paint (the second wave).

**Its spec deltas** (so that A and B need not touch the shared sentences):
- MODIFIED «Borders, cues and focus rings have enough contrast»: the token table gains the four rows (27 → 31); the translucent tokens grow from three to five (and the sentence «`#rrggbb` for 24 … three translucent», l. 1564, and «still the 27», l. 1621, follow); the three new pairs (35 → 38).
- MODIFIED «The main column takes the design palette»: «The setup sheet, the rules and settings panels and the confirmation dialog are outside this requirement and keep their current token bindings until their own blocks» names the shell's bindings as done and the rest as the blocks'; ««Почати» keeps its current tokens» becomes «… until the setup-sheet block».
- MODIFIED «The backdrops take the design's translucent tokens»: "not delivered" item (2) shrinks to `--color-option-border` (the setup-sheet block) and `--color-violation-ink` (the dialog block); `--color-shadow-sunken` "withdrawn by the setup-sheet block".
- MODIFIED «Main column layout geometry follows the design reference»: its scenario «Colours are the G2 palette» (l. 3926-3930, "the 27 tokens") follows the table (31). Nothing else of that requirement (B owns the line-height sentence).
- ADDED «The panels take the shared surface paint»: the bindings of the table above; a stylesheet test; an e2e computed-style check of the fill, border colour and shadow of the four surfaces against the design build (light and dark, 375×812 and 1024×768; sampled).
- ADDED (XQ-1 A) «The page root carries the board size»: the attribute and the variables.

**Its tests** (red first): `tests/helpers/css.ts` (`TOKEN_NAMES`, the light and dark samples, `TRANSLUCENT_TOKENS`, `CONTRAST_PAIRS`); `tests/play-page-helpers.test.ts:462, 466-467, 515, 648, 1432`; `tests/play-page-cause-stylesheet.test.ts:205-206`; `tests/play-page-theme-stylesheet.test.ts:165, 174`; `tests/play-page-level-stylesheet.test.ts:216`; `tests/play-page-layout-geometry.test.ts:78-82`; `tests/play-page-stylesheet.test.ts:92-105`; `tests/play-page-palette-stylesheet.test.ts:70` (title); the new stylesheet and e2e tests; (XQ-1 A) a jsdom test of the root's `data-size` after every size change.

**Expected pixel movement** (the gate decides): the settings and confirmation shots, whose remaining gap is mostly fill, border and shadow, should rise. Run 9 by state: `settings` dark 2 of 6 and light 4 of 6 at 0.98; all `*-settings*` dark shots 6 of 13; `confirm` dark 3 of 5 and light 3 of 5. The rules and setup shots move a little. If any shot falls, the shell stops and explains it before the review gate.

**Why now, in the prep session** (the plan's recommendation): if A and B each declared these tokens, both would edit the same `:root` lines, the same token table, the same 27-token pins in eight test files and the same three requirements, and conflict at every merge. The shell is small (one CSS file, possibly one attribute in `src/ui/play-page.ts`, the token tests, two ADDED requirements) and runs before A and B start.

## 7. Pixel expectations and the soft-dim drop

- **All 48 setup shots fail today** (run 9). The causes are the sheet's size and place (from 48rem), the phone height (80 against 88dvh), the card and size-option paint and the ring, the indent, «Почати» and the shell paint.
- **`768-dark-setup-four` (0.9004 to 0.8674 in run 8, soft dim) is explained** (`docs/qa/prep-g2/soft-dim-768-classify.txt`). Rebuilding the run-7 dim pixel by pixel reproduces both scores to 4 places. By the gate's own per-pixel verdict (pixelmatch 8.0.0), 103,380 of the 103,696 newly failing pixels are one pair: **the design's sheet fill `#2c2620` where the page shows its soft-dimmed bare page** (`#120f0c` now, `#1a1714` before). The design's sheet is anchored under the summary, the page's sits in the middle, so they cover different pixels. It is the masking of README § Run 8, under the soft dim, and it belongs to this block's placement. (The first reading of this drop, "the design's `--primary-soft` cards", came from a hand-written colour delta and is withdrawn; correction COR-4.)
- **Expected after this block:** every setup shot rises. No 0.98 claim per shot. If a setup shot does not rise, the block stops and explains it before the review gate.

## 8. Questions for the user

Defaults apply to "signed, use defaults", **except PQ-1 and SQ-1, which need an explicit answer** (and RQ-1 and XQ-1 of the rules-panel draft).

- **PQ-1, the shared panel shell. Explicit answer.**
  - **A (recommended):** run `update-panel-shell` now, in the prep session, as a small serial slice (section 6): change folder, a fresh auditor, red tests, the port, the battery, a smoke test, a `check:visual` run, the review gate only with your yes, the archive, and a merge into `main` only on your word, before A and B start.
  - **B:** no shell slice. Block A declares and binds the four tokens (and the XQ-1 hook) for the rules panel; block B waits for A's merge, then binds them for the sheet; the settings panel and the dialog wait for the second wave. Costs: B starts later, and the token pins change twice.
- **SQ-1, `--color-option-border` at 1.98:1. Explicit answer.**
  - **A (recommended):** keep the design's value and call the available card's border decoration (A-60): the text and the radio ring (3.68 / 4.13) identify the card, the ring's dot and the primary border its state; the ring's pairs are pinned instead. No pixel cost; no design round. A-57's "known failure" closes.
  - **B:** a darker value in the page only, for 3:1 on the card and the sheet: light `#9d917d` (3.05 on both), dark `#787066` (3.07 on the sheet, 3.32 on the card). Cost: a recorded deviation from the design (like the cell border), a small, unmeasured pixel cost on every setup shot (border pixels only), and FR-65 gains the pair.
  - **C:** the same darker value through a design round (the designer, a design-reviewer, a new review set that you move). Cost: the reference moves again; days, not hours.
- **SQ-2, `--color-shadow-sunken`.** **Default:** withdraw the row (section 2). Alternative: keep the row as "not bound".
- **SQ-3, the checked ring's dot.** **Default A:** the design's radial gradient (a `background-image` in tokens); the scenario that pins an `inset` shadow accepts it (a deliberate change). **B:** keep the page's inset shadow, a small pixel mismatch inside every checked ring.
- **SQ-4, the presentation sentence of FR-96.** **Default:** amend it as in section 2 (the sizes in the requirement, as RQ-2 for the rules panel). Alternative: only drop "held" and point at NFR-14.
- **SQ-5, the 28px level margin.** **Default:** keep 28px at every width (a departure from the design's 24px and 1rem) so the focus ring stays clear of the footer. Alternative: the design's margins and a different fix for the ring (for example a larger `scroll-padding-bottom`), to be proven by the same e2e.
- **SQ-6, the sheet's motion.** **Default:** not ported in this block (as RQ-4).

## 9. The split between the shell, block A and block B

Written here and repeated in both change folders' `design.md`.

- **Tokens.**
  - The shell (`update-panel-shell`): `--color-surface-raised`, `--color-overlay-border`, `--color-shadow-panel`, `--color-shadow-sheet`; the three pairs on `--color-surface-raised`; (XQ-1 A) the root's `data-size` and the size variables.
  - A (rules panel): none.
  - B (setup sheet): `--color-option-border`; the three ring pairs; `--color-shadow-sunken` withdrawn (SQ-2).
  - `--color-violation-ink` («Так, почати»): the dialog block, second wave.
  - **Under PQ-1 B:** A declares and binds the four shell tokens, their pairs and the hook, and owns the shell's MODIFIED requirements below; B starts after A merges.
- **Requirements of `openspec/specs/play-page/spec.md`, each MODIFIED by exactly one folder at a time:**

  | Requirement | Owner (in order) |
  |---|---|
  | «Borders, cues and focus rings have enough contrast» | the shell (four tokens, three pairs), then B (one token, three pairs); not A |
  | «The main column takes the design palette» | the shell |
  | «The backdrops take the design's translucent tokens» | the shell |
  | «Main column layout geometry follows the design reference» | the shell (its token-count scenario only), then B (the line-height sentence) |
  | «Rules panel» | A |
  | «Setup sheet» | B |
  | «The summary and level buttons set their own colours» | B |
  | «Cells and buttons show a visible, unobscured focus indicator» | B, if its text changes; not A |
  | «The size buttons set their own colours and the board disables double-tap zoom» | B, if its text changes |
  | «The start button and the sheet buttons meet the touch-target floor» | B (the stale "held" word) |
  | ADDED «The panels take the shared surface paint», «The page root carries the board size» | the shell |
  | ADDED «The rules panel takes the design's size, place and paint» | A |
  | ADDED «The setup sheet takes the design's size, place and paint» | B |

  The shell is archived before A and B start, so its MODIFIED requirements are baseline text for them; "then B" means B writes its delta against the post-shell text. Under PQ-1 B, read "A" for "the shell", and B rebases onto A.
- **Design freezes.** `quality/design-geometry.json` and `quality/design-paint.json` are refrozen by one stream at a time: A adds its cases first; B adds its cases after rebasing onto A's merge (if B is ready first, B waits for A, or the user decides the order). The shell adds no freeze case (its e2e reads the design build live).
- **Shared files.** `src/ui/style.css`: A edits the `.rules` rules, `.rules-close` and the example cells; B edits `.setup-sheet`, `.level-control`, `.size-control` (inside the sheet), `.setup-start`, `.setup-close` and the reason line; neither edits the other's rules or the `:root` blocks (except B's one token). The token and pair pins: only B (after the shell). `src/ui/play-page.ts`: A only (the scroll reset); B none.

## 10. Auditor findings: disposition

**The audit.** A fresh general-purpose subagent, read-only, audited the draft on 2026-10-11 from about 15:53 to 16:09. It recomputed every contrast figure (all right, including the SQ-1 B values), confirmed the design regimes, the sunken-shadow withdrawal, the shell's per-surface bindings and the dialog-border reasoning, and the ids. 5 major, 3 minor, 3 notes; all folded in. The parent re-checked findings 1 to 4 against the files before folding.

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | major | `--board-width` lives on `.board`; the sheet cannot read it, so the design's `min-height` becomes `auto`; "no DOM change" and the floor cannot both hold (the rules draft has the same defect) | XQ-1 (in the rules draft, shared); the hook goes to the shell under XQ-1 A; A-60 and section 5 say so; the geometry test samples the `four` state |
| 2 | major | The shell's 27 → 31 breaks the scenario «Colours are the G2 palette» of «Main column layout geometry…», which section 9 gave to B alone; the shell's pin list was incomplete (eight test files, `TRANSLUCENT_TOKENS`, spec l. 1564 and 1621) | The table gives that scenario to the shell, then B; section 6 lists every pin |
| 3 | major | The design's `--cell-border` inside the sheet (ring, unavailable border, «Закрити» border) has the page's `--color-control-border` values; binding `--color-cell-border` would add an unrecorded light deviation | Bound to `--color-control-border`; the figures are now 3.68 / 4.13, 3.38 / 4.55, 3.68 / 3.81 |
| 4 | major | The design's level margins (24px, 1rem at 320) conflict with the signed focus-not-obscured scenario at 320×700, 320×568, 375×667 and 1366×650; «Cells and buttons show a visible, unobscured focus indicator» was in no folder | A-60 keeps 28px as a stated departure (SQ-5); that requirement goes to B if its text changes; the 1366×650 scenario stays |
| 5 | major/minor | "Never ending across a control or a line of text" overclaimed: the design sets only a floor, and taller contents cover the messages | FR-96 and S3 reworded; the e2e checks the floor at every sampled viewport |
| 6 | minor | The checked dot sits on the card fill: 5.40 / 7.39, not 4.41 / 6.13 | Fixed in section 4 and A-60 |
| 7 | minor | "Text ≥ 4.5 (to add if missing)" contradicted "no new pair" | The shell adds text, muted text and focus on `--color-surface-raised` (35 → 38) |
| 8 | minor | The shell's carve-outs left «Почати» keeps its current tokens» and "the shadows" (incl. sunken) as B-blocking text; section 4 listed shell rows as B's | The shell's deltas word both sentences to stay true after B; section 4 marks the shell rows |
| 9 | note | SQ-1 A sound under 1.4.11 but not reconciled with the control-border pair precedent; the ring's pairs unpinned | A-60 cites the Understanding note and the precedent; FR-65 gains the ring pairs (B) |
| 10 | note | The 768-dark-setup-four reading inferred card identity from colour; the size option's paint and width were unowned | The reading is replaced by the pixelmatch classification (the sheet fill); the size option goes to B |
| 11 | note | Citations (`level-stylesheet.test.ts:188`, `:122-163`); the settings counts; FR-96's second "held", FR-99 "(held NFR-12)", spec l. 2879; "capped by the window" | All fixed |
