# Design review 4: independent `design-reviewer` (2026-10-05)

- **Reviewer:** a fresh Opus agent told to read and follow [`.claude/agents/design-reviewer.md`](../../.claude/agents/design-reviewer.md), read-only, about 214k tokens, 36 tool calls, about 4.5 minutes. It ran as the last check before freezing the set as the pixel reference; the user chose it at about 22:42.
- **Material:** `design/v0-screenshots/review-set-4/` (76 shots; two runs byte-identical). The reviewer opened the 22 shots that are new or changed against set 3, and checked the other 54 by checksum against set 3's. It also read the design sources, `design/README.md` iteration 6, decisions 1–25 and review 3.
- **Design reviewed:** iteration 6, commit `a802b5d` (re-signed; first committed as `6ad6cf0`).
- **The report below is verbatim.**

**Orchestrator's spot-check (2026-10-05 about 22:47).** N1 is confirmed by measurement in the built-in browser (`/rules/` in an iframe of the given size, scrollbars hidden):

| Window | Panel top | Header and logo bottom | Panel bottom |
|---|---|---|---|
| 1024×768 | 92.2 px | 96.0 px | 475.2 px |
| 1366×650 | 78.0 px | 96.0 px | 461.0 px |
| 1440×900 | 108.0 px | 96.0 px | 491.0 px |

At 1024 the panel overlaps the header box by 3.8 px (the reviewer puts the logo's lowest ray tip at 93.5 px). At 1366×650 it would cover the header's lowest 18 px. At 1440 it is clear. N2 and N3 were not measured.

---

# Design review 4: independent `design-reviewer` (iteration 6)

**Material and method.** I was read-only.
- **Shots opened:** all 22 that are new or changed against review set 3: the 14 at 768×1024, the 4 rules shots at 1024 and 1440, and the 4 new shots at 1366×650.
- **Unchanged shots:** I checked the other 54 by checksum. All 54 lines in `review-set-4/SHA1SUMS` match `review-set-3/SHA1SUMS`, and review 3 already reviewed those images. I also re-opened a sample of them (`1024-light-default`, `375-light-hint`, `320-dark-rules`, `logo-light`) to confirm the context.
- **Sources read:** `design/v0/app/binarka.css`, `components/binarka-page.tsx`, `design/README.md` (iteration 6), `docs/design/ux-decisions.md`, review 3 and `design/tools/capture-review-set.sh`.
- **Measurements:** pixel values come from the shots, converted with the display scale the viewer reported and then divided by 2 for device scale. Values marked "computed" come from the CSS.

## 1. Verdict

Iteration 6 delivers what decisions 22 and 24 asked for.
- **Convenience:** the cell-size floor works. At 1366×650, 6×6 cells are about 44 px and the page scrolls by about 53 px instead of shrinking the board; 8×8 cells are about 25 px. At 768, the board and the column share one 514 px edge with 80 px cells. The new backdrop and dialog motion stays inside `prefers-reduced-motion: no-preference` and ends at the static style.
- **Warmth:** both themes are unchanged and consistent across all 76 shots.

**Ready to freeze as the pixel reference: no, but only because of one small blocker, N1.**
- R3's fixed `12vh` offset is not tied to the header. At 1024×768 the rules panel's top edge (92.2 px) cuts about 1.3 px off the logo's lowest ray, which ends at 93.5 px, so the panel visibly touches the sun.
- At 1366×650, a state the set does not include, the same rule would put the panel 18 px over the title and «Правила».
- The fix is one rule. It changes only the two `1024-*-rules.png` shots.
- If you would rather accept the touch at 1024, nothing else blocks freezing. N2 is optional and N3 can land after freezing.

## 2. Findings

### Review 3 findings re-checked

| # | Status | Evidence |
|---|---|---|
| R1 | **fixed** | **CSS:** from 48rem, `--cell-max: clamp(2.75rem, calc((100dvh - 28rem) / var(--n)), 5rem)` and the 8×8 rule `clamp(1.5rem, …)`. From 64rem both are repeated with `4.5rem` (the `:has(…8)` rule too, so its specificity does not keep the 5rem cap). `--column` uses the same clamp.<br>**`1366-*-default.png`:** 6×6 cells about 43.7 px, so the 44 px floor holds. Column 415–416 px, the 26rem floor. The idle line sits on the bottom edge of the viewport. I compute 439.25 px of chrome + 264 px of cells = 703 px of page, so the page scrolls by 53 px, as the author measured.<br>**`1366-*-eight.png`:** cells about 25–26 px (computed (650 − 448) / 8 = 25.25, at least 24). No scroll, with about 30 px to spare.<br>**Other widths:** `768-*-default.png` cells are 80 px (the 5rem cap wins over 96). The 1024 and 1440 shots are byte-identical to set 3, so 72 / 53.3 / 40 and 72 / 72 / 54.4 px still hold.<br>**Short and landscape windows (computed):** 1280×420 and 844×390 hit the floors (44 / 24) with nothing collapsing, and landscape phones are now height-aware from 48rem. |
| R2 | accepted by the user | Decision 23. Still visible in `768-*-default.png` against `768-*-win.png` («Скинути» moves about 10 display px). Not raised again. |
| R3 | applied, with a side effect | `@media (min-width: 64rem) { .rules { margin-block: 12vh auto } }`. In `1440-*-rules.png` the panel top is at 108 px, 12 px under the header: good. In `1024-*-rules.png` it is at 92.2 px, under the header's bottom edge at 96 px, so it covers the logo's lowest ray. See **N1**. The panel lying over the size picker is fine: the backdrop separates the layers. |
| R4 | **fixed (source)** | Inside `prefers-reduced-motion: no-preference`:<br>• `.rules::backdrop, .confirm::backdrop` transition `background-color 220ms ease-out` with `overlay`/`display allow-discrete`. They start from `transparent` (`@starting-style`) and return to `transparent` when closed.<br>• `.confirm` transitions `opacity`/`transform` over 160 ms from `opacity: 0; transform: scale(0.98)`, in and out.<br>No fill mode is used. Closed states are `display: none`, so no settled frame changes. The confirm and rules shots are byte-identical or changed only by R3/R6, as expected. |
| R5 | covered by decision 25 | — |
| R6 | **fixed** | From 48rem, `--page-max: calc(var(--column) + 2 * var(--page-pad))`. In all 14 `768-*` shots the header, picker, board, buttons and messages share one 514 px edge (x about 127–641). 6×6 cells are 80 px and the 8×8 board is 514 px. The win ring sits 1 px outside the same edge (`768-*-win.png`). Side effect on notched phones: see **N3**. |

### New findings

"Blocker" means the issue changes pixels in the reference set or concerns a state the set lacks. "After" means it can land after freezing.

| # | Lens | Severity | Where | What you see | Proposed change |
|---|---|---|---|---|---|
| N1 | warmth (and convenience on short windows) | low, **blocker** (changes `1024-light-rules.png` and `1024-dark-rules.png`) | `1024-light-rules.png`, `1024-dark-rules.png`. `@media (min-width: 64rem) { .rules { margin-block: 12vh auto } }` | **At 1024×768:**<br>• The header is 32–96 px (`#app` padding-top 2rem, 4rem logo).<br>• The bottom bar ray of the logo ends at 32 + 61.5 = 93.5 px.<br>• `12vh` puts the panel top at 92.2 px, so the opaque panel and its border cover the last 1.3 px of that ray. In the shot the sun's bottom ray runs straight into the panel edge, and the panel reads as sitting on the logo. This is the same docking R3 removed from the button row, moved to the top.<br>**At 1366×650 (computed, not in the set):** `12vh` = 78 px, so the panel would cover the lowest 18 px of the logo, the title and «Правила».<br>The panel lying over the size picker is fine. | Anchor the panel below the header, and keep it inside short windows:<br>`@media (min-width: 64rem) { .rules { margin-block: max(12vh, 6.5rem) auto; max-height: min(80vh, calc(100dvh - max(12vh, 6.5rem) - 1rem)); } }`<br>**Results:**<br>• 1024×768: top 104 px, 10 px clear of the ray tip. The panel bottom is about 485 px, about 89 px above the button row (574 px).<br>• 1440×900: `12vh` = 108 wins, so the shot is unchanged.<br>• 1366×650: top 104, bottom about 485, fits.<br>• 1280×420: the panel scrolls inside itself instead of running off the screen.<br>Only the two 1024 rules shots change. Optionally add `1366-{light,dark}-rules` to the set. |
| N2 | warmth | low; changes pixels only if you choose it (recommend: bundle it with N1, since the rules shots are re-captured anyway) | `768-*-rules.png`, `1024-*-rules.png`, `1440-*-rules.png`. `.rules { box-shadow: 0 -0.5rem 2rem rgba(0,0,0,0.18) }`, not overridden in the `min-width: 48rem` block. | The centred panel still has the bottom sheet's **upward** shadow. In the light shots it darkens a band above the panel: the board's second row at 768, the header and logo at 1024 and 1440. The confirm dialog casts its shadow downward (`0 1rem 2.5rem`), so the two overlays are lit from opposite directions. It is not visible in dark. | Inside `@media (min-width: 48rem) { .rules { … } }` add `box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.25);`, the same as `.confirm`. This changes the 6 rules shots at 768, 1024 and 1440 (light visibly, dark barely). If you don't do it before freezing, leave it as it is. |
| N3 | convenience | low, **after** (no shot changes: headless insets are 0) | **Computed.** From 48rem: `--page-max: calc(var(--column) + 2 * var(--page-pad))` against `#app { padding-inline: max(var(--page-pad), env(safe-area-inset-*)) }` (`viewportFit: 'cover'`). | R6 sized the page for a 1rem gutter. On a notched phone in landscape (844×390 or 932×430, both 48–64rem wide), the safe-area insets are about 47 px. The content box then drops from 416 to about 354 px, even though the page sits centred and far from the notch. As a result:<br>• the header (logo + title + «Правила», about 353 px) barely fits;<br>• the three buttons wrap to two rows;<br>• the column no longer matches the 26rem the layout assumes.<br>Before R6, `34rem` absorbed this. | `--page-max: calc(var(--column) + max(var(--page-pad), env(safe-area-inset-left)) + max(var(--page-pad), env(safe-area-inset-right)));` This is the same in every shot and correct on notched devices. |

**Not a finding; record it for the user.** At 1366×650 the 8×8 board (about 233 px) is narrower than the 6×6 board (298 px) on the same window. The reason is that 6×6 stops at its 44 px floor and scrolls, while 8×8 shrinks to fit (decisions 20 and 22). The decisions intend this, and the shots show it; it only looks odd when you switch sizes. Similarly, at 1366×650 a three-line hint on 6×6 would end about 21 px below the fold (computed). That is decision 22's "below that the page scrolls".

**Determinism:** two runs were byte-identical. The 1366 shots are viewport crops (1300 px at 2×) of a page that scrolls by 53 px. That is deterministic, but the product's parity capture must also crop to the viewport, not capture the full page.

## 3. Visual direction

- **Palette:** keep both themes exactly as built. No token changes.
  - Light: `--bg #f7f3ea`, `--surface #fffdf8`, `--ink #1e2126`, `--primary #b4460d`, `--primary-soft #f6e3d4`, `--given-bg #ddd3be`, `--violation #b3261e`, `--success #2f6b3a`, `--backdrop-soft rgba(70,40,15,.22)`, `--backdrop-strong rgba(45,25,10,.5)`.
  - Dark: `--bg #1a1714`, `--surface #24201b`, `--surface-raised #2c2620`, `--ink #f1ede4`, `--primary #f39a5b`, `--given-bg #4d4438`, `--violation #ff8a7d`, `--success #8fd19a`, `--backdrop-soft rgba(8,5,2,.45)`, `--backdrop-strong rgba(8,5,2,.6)`.
- **Type:** as built, using the system stack.
  - Title 2rem/700, and 2.5rem from 48rem.
  - Buttons 1rem/500; the filled one 700.
  - Picker 0.9375rem.
  - Messages 0.9375rem/1.45; the idle line 0.875rem; the win line 1.0625rem/700.
  - Cell digits `100cqi / n × 0.46`: givens 800, entries 500, hinted 700 italic.
- **Components:** keep all of them. The only changes:
  - **Rules panel from 64rem:** anchored at `max(12vh, 6.5rem)` with a matching `max-height` (N1).
  - **Centred rules panel (from 48rem):** optionally the dialog's downward shadow (N2).
- **Shape:** `--radius-s` 0.375rem, `--radius-m` 0.625rem, `--radius-l` 1rem. The hint box's left corners are 0.125rem.
- **Motion:** as built, all under `no-preference` and with no fill mode.
  - Sheet: 220 ms `cubic-bezier(.2,.8,.2,1)`, in and out; from 48rem a fade plus a 0.5rem rise.
  - Backdrops: fade over 220 ms.
  - Dialog: fades and scales from 0.98 over 160 ms, in and out.
  - Hinted cell: pops from 0.92 over 160 ms.
  - Win: a 600 ms glow that keeps the 1 px ring.
  - Buttons: 120 ms colour/filter, 80 ms press.
  - Reduced motion: nothing moves. The reference set is a reduced-motion render.

## 4. Layout per screen size

- **Phone (≤ 480 px).** Unchanged from review 3, and the shots are byte-identical to set 3.
  - One column: header → picker → board → buttons → messages. The padding is constant, and 8×8 bleeds 4–8 px into it.
  - The rules open as a 55dvh bottom sheet.
  - Why: nothing the thumb just touched moves, and at 375×812 every size fits on one screen.
- **Tablet (481–1023 px).**
  - From 48rem the page is exactly the column wide (R6): 514 px at 768×1024, with 80 px 6×6 cells and a shared edge for board and controls.
  - Cells are height-aware with floors (R1). Landscape phones shrink to 44 / 24 px and scroll rather than hide the buttons.
  - **Change (N3, after):** include the safe-area insets in `--page-max`, so notched landscape phones keep the 26rem column.
  - Why: decision 16 (a bigger board on tablet) holds without the board outgrowing short screens.
- **Desktop (≥ 1024 px).**
  - Height-aware cells up to 4.5rem with the same floors. At 1366×650, 6×6 sits at 44 px and the page scrolls by about 53 px; 8×8 is at about 25 px with no scroll.
  - **Change (N1, blocker):** the rules panel sits at `max(12vh, 6.5rem)`, clear of the header at every height, and fits short windows.
  - Why: height is the real limit on laptops. The floors protect decisions 20 and 22.
- **Harness:** unchanged, matching decision 25:
  - forced reduced motion;
  - the `frame.html` window focus;
  - the pointer off the page;
  - the same machine and fonts;
  - viewport-cropped shots (they matter at 1366×650, where the page scrolls).

## 5. What already works (keep)

- The cell-size floor: 44 px for 4×4 and 6×6, and at least 24 px for 8×8, at 1366×650 in both themes. Nothing collapses on very short windows.
- At 768: one exact 514 px edge for header, picker, board, buttons and messages, and exact 80 px cells. The win ring does not shift the cells.
- The 1440 rules panel, now 12 px under the header and clear of the button row.
- The backdrop and dialog motion: gentle, symmetric in and out, and invisible to settled shots.
- Everything review 3 listed: the stable phone column, the centred 4×4, the warm dark theme with dimming backdrops, the win and hint states, the 320 sheet, and the logo at 40–64 px.
- Determinism: byte-identical double capture, and only the expected 18 shots changed against set 3.

## 6. Questions for the user

1. N1: should the rules panel move from `12vh` to `max(12vh, 6.5rem)` from 64rem, with a matching `max-height`, so it no longer touches the logo at 1024×768 or covers the header on short laptop windows? It changes only the two 1024 rules shots. I recommend yes, before freezing.
2. N2: should the centred rules panel cast the dialog's downward shadow instead of the bottom sheet's upward one? It changes the six rules shots at 768, 1024 and 1440. I recommend doing it together with N1, or else leaving it for good.
3. Should `1366-{light,dark}-rules` join the set, so the anchored panel is proven on a short window? I recommend yes. It is cheap.
4. N3, after freezing: include the safe-area insets in `--page-max` for notched landscape phones? I recommend yes. No shot changes.
