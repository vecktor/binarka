# PD-9: the two logo shots of NFR-14 have no state driver

Status: **APPROVED by the user** in chat on 2026-10-12 at about 16:05 (UTC+5:30), through the question form: «Approve (Recommended)» (session log `docs/qa/process-stream/session-log.md`, row P5). Executed in the commit with `Refs: PD-9`; **green proof complete** (`PD-9-proof.txt` §§ 4 to 6, 16:11). Drafted from 16:01 by stream P of wave 3 (`claude/feynman-process`). Unit P-LOGO of `docs/handoff/delivery-plan-2026-10-12.md` (section 2.1, item 2); the user chose «Logo state driver» on 2026-10-12 (plan section 7, Q3).

## Defect

- `review-set-14` holds two shots that are not a page state: `logo-light` and `logo-dark` (375×160 at device scale 2), taken from the design's review-only route `/logo/` (`design/v0/app/logo/page.tsx`: the logo mark at 40, 56 and 64 px, each over its size as a caption; `.logo-sheet` in `design/v0/app/binarka.css` lines 234 to 255).
- The locked adapter `scripts/check-visual-parity-adapters.mjs` has no `logo` driver, so both shots fail at capture («no state driver for "logo"») and their reports hold `score: null`. They fail NFR-14 at any threshold, and with PD-8 they are two of the 14 shots still below 0.98 (plan section 0).
- The page has no such route and should not get one (no `src/` change; the logo sheet is a review capture, not a feature).

## Red proof (`PD-9-proof.txt` § 1, 2026-10-12 16:01, base 6573)

A two-shot run (the committed config filtered to the two logo shots, through `--config` and `VISUAL_PARITY_CONFIG`) with today's adapter: `FAIL [logo-dark] capture failed: no state driver for "logo"`, the same for `logo-light`; Result FAIL.

## Fix (proposed)

A `logo` driver in the adapter, after `settings-focus`, that builds the design's sheet out of the page's own header logo:

```js
  logo: async (page) => {
    await page.evaluate((sizes) => {
      const source = document.querySelector('.page-header h1 svg.logo');
      if (!source) throw new Error('the page has no header logo');
      const sheet = document.createElement('div');
      sheet.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;gap:1.5rem;padding:1.5rem 1rem';
      for (const size of sizes) {
        const figure = document.createElement('figure');
        figure.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.5rem;margin:0';
        const mark = source.cloneNode(true);
        mark.setAttribute('width', String(size));
        mark.setAttribute('height', String(size));
        const caption = document.createElement('figcaption');
        caption.textContent = String(size);
        caption.style.cssText = 'color:var(--color-text-muted);font-size:0.875rem;font-variant-numeric:tabular-nums';
        figure.append(mark, caption);
        sheet.append(figure);
      }
      document.querySelector('#app').style.display = 'none';
      document.body.append(sheet);
    }, [40, 56, 64]);
  },
```

- **What is the page's and what is the driver's.** The marks are clones of the SVG the page draws in its header (`src/ui/logo.ts`, FR-89), painted by the page's own `.logo` rules (`--color-primary`, `--color-primary-text`), on the page's own `body` (background `--color-page`, font, smoothing; the same declarations as the design's `body`). The driver supplies only the sheet's layout and the three captions, written as the design's `.logo-sheet` rules with their values: `--space-5` = 1.5rem, `--space-4` = 1rem, `--space-2` = 0.5rem (the page keeps its space tokens on `#app`, which the driver hides, so they are written out), and the caption colour `--color-text-muted` (= the design's `--ink-muted` in both schemes, `src/ui/style.css` lines 8 and 45).
- **What it does not prove.** The shot compares the mark's drawing at three sizes, not where the header places it: the header's logo is covered by every other shot (56 px, `.page-header h1 .logo`). The captions are the driver's text, not page text.
- The adapter's header comment gains one line naming the `logo` state as a review-only sheet built by the driver.
- Re-seal `factory-lock.json` with `--init-lock --adaptation "PD-9: …"`.

## Pre-measure (`PD-9-proof.txt` §§ 2 and 3; an untracked copy of the adapter, no locked file changed)

| Run | logo-dark | logo-light |
|---|---|---|
| Today's adapter | `score: null` (no driver) | `score: null` |
| Copy with the driver above | **1** | **1** |
| Negative control: the copy with sizes 40, 56, **60** | 0.9716 (FAIL) | 0.9717 (FAIL) |

The control shows that the comparison sees a wrong sheet (the diff marks every mark and caption), so 1.0 is a measured match, not an inert comparison. Sampling, declared: two shots, one machine and its fonts (as every NFR-14 shot), the three sizes of the design's sheet; the logo at other sizes is not measured.

## Green is earned when (after the yes)

The same two-shot run with the real adapter scores both shots at or above 0.98 on base 6573, the reports are restored afterwards (only F commits the 170 reports), and `check-factory-integrity` passes after the re-seal.

## As executed

- `scripts/check-visual-parity-adapters.mjs` (locked): the `logo` driver above, with a comment naming the design route, PD-9 and why the spacing is written in rem; the header comment says the two logo shots are the design's review-only sheet laid out by their driver.
- Green (`PD-9-proof.txt` § 4, 16:11, base 6573): the real adapter scores **logo-dark 1** and **logo-light 1**. The two reports were restored with `git checkout` and the diff PNGs deleted (only F commits the 170 reports); ports free before and after.
- Integrity: FAIL (gate-bearing drift, no `Refs: PD-n` commit yet) before the re-seal, PASS after (27 locked files; the `core.hooksPath` warning is pre-existing).

## Rollback

Revert the `Refs: PD-9` commit; that restores the adapter and the previous lock.
