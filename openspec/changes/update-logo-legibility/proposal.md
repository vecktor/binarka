# Change: update-logo-legibility

## Why

NFR-15 (held in `docs/requirements-held.md`) says the logo is legible at 40 px: the four digits of the 2×2 mini board «1 0 / 0 1» can be told apart at 40×40 CSS px, and the logo carries no text. Fresh vision-judges rejected the page's own header logo (`src/ui/logo.ts`) drawn at 40×40 CSS px, at device pixel ratio 1 (vision-verify run `wf_8838166c-9f7`) and at ratio 2, the project's capture standard (run `wf_d236b692-54b`): «the four digits show only as tiny pale marks; I could not clearly tell bars from rings». The stills and verdicts are in `docs/qa/vision-probe/logo-40-*` (written by the recordings stream on `claude/wilbur-recordings`). On 2026-10-12 the user decided to keep NFR-15 held and fix the logo in its own slice, judged at ratio 2.

The cause is geometry, not stroke weight. In the 64-unit `viewBox` the board is 24 units of 64, so at 40 px a cell is 6.9 CSS px, a bar 1.6 px wide and a ring stroke 1.1 px. A thicker stroke alone would close the ring's hole.

## What Changes

The user's choices on 2026-10-12 (question form, this session; the comparison still `docs/qa/update-logo-legibility/options-40px-dpr2.png`):

1. **Drawing: option B, a bigger 2×2 board with shorter rays.** The circle grows from `r` 19.5 to 24; the cells from 11 to 16 units (2-unit gap, `rx` 3); a bar becomes 4.5 × 11 (was 2.6 × 7.2); a ring becomes `rx` 3.5, `ry` 5, `stroke-width` 3 (was 2.2, 3.1, 1.8); the rays get shorter and sit in the 8 units outside the circle (bar ray 3.2 × 6, ring ray `rx` 2.1, `ry` 2.7, `stroke-width` 1.6). At 40 px: cell 10 px, bar 2.8 × 6.9 px, ring stroke 1.9 px, hole 2.5 × 4.4 px. The drawing applies at every size (the header shows it at 44, 56 and 64 px). The structure, the classes, the colours and the order 1 0 / 0 1 do not change, so the text of FR-72 and NFR-15 does not change. The «01» fallback of UX decision 10 was not chosen.
2. **Design reference: mirror in `design/v0`.** `Logo` and `LogoDigit` in `design/v0/components/binarka-page.tsx` get the same coordinates, the design is rebuilt and a NEW review set `design/v0-screenshots/logo-drawing-b/` is captured with `design/tools/capture-review-set.sh`. Only the user moves the NFR-14 pixel reference from `review-set-14` to it, in chat. Until then the header logo of every shot differs from `review-set-14` and is reported, not hidden.
3. **Base: wait, then rebase.** The held clip (`16-logo-40`, `held: true`), the held note of NFR-15 and `docs/qa/vision-probe/` are uncommitted in the recordings worktree. This change writes the spec, the red tests, the drawing and the design mirror first, and rebases onto `claude/wilbur-recordings` once that work is committed, before recording the clip.

Spec: the requirement «Logo» is MODIFIED: one sentence (the held-legibility pointer) is replaced by geometric floors in viewBox units, and two scenarios are added («The digits are large enough to read at 40 px», «The board sits inside the circle and the rays outside it»). Every other sentence and scenario is unchanged. The floors are spec-made proxies; they do not prove legibility, which only the vision check decides.

| Baseline requirement | Action |
|---|---|
| Logo | MODIFIED (one sentence replaced, two scenarios added) |

Out of scope: the «01» fallback; a favicon (TC-14); the gear; any colour or token (FR-65); the logo's CSS size; the header layout; moving the NFR-14 reference (the user's step).

## Impact

- Affected specs: `play-page` (1 MODIFIED).
- Affected code: `src/ui/logo.ts` (coordinates only). `src/ui/style.css` is not changed. Tests: `tests/play-page-logo.test.ts` gains the two scenarios (no existing test changes: the new floors are new assertions; the source of each is the delta above).
- Design: `design/v0/components/binarka-page.tsx` (`Logo`, `LogoDigit`: coordinates only), `design/README.md` (an iteration entry), new `design/v0-screenshots/logo-drawing-b/`. `design/v0-screenshots/review-set-14/` is frozen and not touched.
- NFR-14: the header logo is in nearly every shot, so most shots change by the logo's pixels against `review-set-14`; the paint fixture (`quality/design-paint.json`) records only `fill`, `stroke` and `color` of the logo shapes, which do not change; the geometry fixture records the logo's box, which does not change.
- Recordings: `16-logo-40` loses `held: true` once a fresh vision-judge finds it met; NFR-15 then moves from `docs/requirements-held.md` into `docs/requirements.md` with its signed wording (row-68 (1) pattern, one logged commit).
- Commits that touch `src/` carry `Slice: update-logo-legibility` and `Refs: FR-72, NFR-15`.

## Round 2: drawing G (2026-10-12)

Drawing B was recorded and judged once by a fresh vision-judge (run `wf_ae715072-b48`): not met («could not clearly tell the two bars (1) from the two rings (0) … the sun rays add clutter»; `docs/qa/vision-probe/logo-40-verdicts.json`). A ring that reads as hollow at 40 px needs about a 3 px stroke and a 4 px hole, which leaves no room for rays. The user saw four candidates (`docs/qa/update-logo-legibility/options-3-40px-dpr2.png`), chose **G: the 2×2 board on a rounded square tile, no rays**, kept this slice open (drawing B is replaced, its commits stay as history) and **signed the FR-72 amendment** (commit `e8bc370`): «in a circle with 0/1 rays» became «(a bar for 1, a ring for 0), on a rounded square tile». NFR-15 keeps its text.

The delta «Logo» is re-cut: the tile replaces the circle and the rays (scenario «Rounded square tile, no rays» replaces «Circle and 0/1 rays»); the floors are re-calibrated to G; «The board sits inside the tile» replaces the circle-and-rays fit. Changed tests: `tests/play-page-logo.test.ts` «Circle and 0/1 rays» (source: the FR-72 amendment) and the two tests this change added. Also affected: `scripts/freeze-design-paint.mjs` and `quality/design-paint.json` (the frozen paint of the logo's rays and disc, `logo-tooth` and `logo-disc`, becomes the tile, `logo-tile`; re-frozen from the mirrored design), and the working set `design/v0-screenshots/logo-drawing-g/` (B's set `logo-drawing-b/` stays as evidence of the failed attempt).
