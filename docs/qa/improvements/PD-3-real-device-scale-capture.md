# PD-3: the NFR-14 capture adapter captures at a real device scale

Status: **APPROVED by the user** in chat on 2026-10-10 between about 16:10 and 16:40 (UTC+5:30; after the calibration file of 16:09, before the proof run of 16:46), «Approve PD-3 (Recommended)» (autonomy-log row 149). Executed in the commit with `Refs: PD-3`.

## Defect (found by calibrating the harness before any block work)

- The adapter captured the page in a Playwright context with `deviceScaleFactor: 2`, an *emulated* device scale. The frozen reference was made by the Chrome command line with `--force-device-scale-factor=2`, a *real* one.
- The two rasterise text and fractional edges differently: glyph stems come out lighter, and 8×8 cell edges at quarter pixels land a pixel apart.
- Measured on the design build itself (`docs/qa/g2/harness-calibration.txt`): the old method scores the design against its own reference at 0.9765 to 0.9993, with **5 shots below 0.98** (320 eight and level, light and dark; 375 light rules-techniques). Even a page identical to the design would fail those shots, so the gate was not trustworthy at its floor (AGENTS.md, capture-determinism lesson).
- Ruled out: the browser binary (Playwright with the installed Chrome 155, emulated: same scores), the frame page (through `design/tools/frame.html`, emulated: same or worse), and the colour profile (without `--force-color-profile=srgb`: no change). The reference's own command-line method reproduces itself exactly (1.0000).

## Fix (`scripts/check-visual-parity-adapters.mjs`)

- Each product shot gets its own browser, launched with `--hide-scrollbars --force-device-scale-factor=2 --window-size=W,H`, and a context with `viewport: null` (no emulation). The system scheme and reduced motion are still set on the context.
- **Window guard:** before loading the page, the adapter checks that the window is exactly W×H at scale 2, and fails the shot otherwise. For example, the installed Chrome clamps a headless window to 500 px wide, and the guard would catch it.
- States, drivers, fixture boards (PD-2), the board guard and the own-preview rule are unchanged. The shared browser is gone, and `close()` now only stops the preview.
- The lock was re-sealed (`--init-lock --adaptation "PD-3: …"`).

## Red to green proof (`docs/qa/improvements/PD-3-proof.txt`)

1. **Ceiling:** with this method, all 170 design shots reproduce their frozen reference at exactly 1.0000. With the old method, none did, and 5 fell below 0.98.
2. **Sample of 12 product shots:** every shot is still captured through its driver. Scores are mostly unchanged, as expected while the page is far from the design. One phone shot moved most (375-light-setup-marked-four, 0.8477 → 0.8292): with a real scale, the page's text lays out a few pixels taller.
3. **Determinism:** 7 shots captured twice through `capture()`: 7 of 7 byte-identical (`PD-3-determinism-probe.mjs`).
4. **Integrity:** PASS with a warning before the re-seal (the PD-1 weakness again), and PASS without it after.
5. **Run 4** of `check:visual` with this adapter: `docs/qa/g2/check-visual-run-4.txt`.

## Cost

One browser launch per shot (170 per run). The full run takes a few minutes longer.

## Not in this PD

- Gap 3 (`qa-verify` without the adapter) and gap 2 (logo) stay open.
- The integrity checker's acceptance of later drift stays open (PD-1, PD-2).

## Rollback

Revert the `Refs: PD-3` commit. That restores the PD-2 adapter and lock.
