# PD-11: CI runs no browser check

Status: **APPROVED by the user** in chat on 2026-10-12 at about 16:35 (UTC+5:30), through the question form: «A + push + draft PR (Recommended)» (session log `docs/qa/process-stream/session-log.md`, row P11). Executed in the commit with `Refs: PD-11`; **green earned**: the `browser` job passed on the branch CI run of draft PR 1 (2026-10-12, 11:20 to 11:22 UTC, `PD-11-proof.txt` § 6). The same run's `verify` job failed on a pre-existing defect (PD-12). Drafted from 16:25 by stream P of wave 3 (`claude/feynman-process`). Unit P-CI of `docs/handoff/delivery-plan-2026-10-12.md` (section 2.8); the user chose «Add e2e + a11y to CI (Recommended)» on 2026-10-12 (plan section 7, Q4), with the instruction to measure first which specs depend on fonts and report before approving.

## Defect (red)

- `.github/workflows/ci.yml` runs lint, tsc, trace, trajectory, strict, audit, unit and build. Its header says «no Playwright». So NFR-10, NFR-12, NFR-13, NFR-14 geometry and paint, and NFR-18 (323 tests) run only on a developer's machine, and CI on `main` cannot catch a regression in them.

## Measured locally (macOS, base 6573, `2762e31` + PD-8/PD-9)

| Run | Result | Evidence |
|---|---|---|
| `npm run test:e2e`, `design/v0/out` absent (as on a fresh runner) | **12 failed, 12 did not run, 299 passed**: the confirm-dialog and panel-shell paint specs require the design build | `docs/qa/process-stream/wave3/e2e-without-design-build.txt` |
| the same after `pnpm install --frozen-lockfile && pnpm build` in `design/v0` | **323 of 323** | `wave3/e2e-base-6573.txt` |
| `npm run check:a11y` | **67 of 67** | `wave3/a11y-base-6573.txt` |

## Font dependence (static reading of every spec, no Linux run yet)

The page font is `system-ui`, which is a different face on Linux (design/README.md line 31 warns of it). Line heights are unitless, so a line's height does not move; glyph widths do, and with them every box that hugs its label and every line break. The frozen geometry (`quality/design-geometry.json`) was captured on macOS and records no OS or font.

| Class | Tests | Where |
|---|---|---|
| **Font-sensitive** (text-hugging or text-stacked boxes against macOS-frozen values within 0.5px, or a fit with less than a line of slack) | **76** | `nfr-10-header-fit` 14, `nfr-14-layout-geometry` 33, `nfr-14-confirm-dialog` 5, `nfr-14-rules-panel` 6, `nfr-14-settings-panel` 7, `nfr-14-setup-sheet` 11 |
| Possibly (text could push them, with more slack) | 33 | `nfr-10-fit` 3, `nfr-10-header-fit` 4, `nfr-13-a11y` 4, rules 6, settings 3, setup 13 |
| Font-independent (paint, DOM, focus, floors such as 44px, fixed-size boxes) | 214 | all of `nfr-12-targets` 16, `nfr-13-a11y` 63, `nfr-14-backdrop` 11, `nfr-14-cause-mark` 3, `nfr-14-palette` 27, `nfr-14-panel-shell` 24, `nfr-18-flash` 12, and the guards and paint tests of the mixed files |

Other blockers on a runner: the design build (Next 16, `output: 'export'`) is not committed, and `design/v0/package.json` pins `pnpm@12.3.4`, which does not run on Node 22 (design/README.md: pnpm 10 with `npm_config_manage_package_manager_versions=false`); Playwright's Chromium must be installed (`npx playwright install --with-deps chromium`). Ports are fine (default base 4173; the design server in the specs takes an OS-chosen port).

Sampling, declared: the classification is a reading of the code, not a Linux run. The 76 are a prediction; the first branch CI run measures it.

## Options

- **A (recommended): a `browser` job on ubuntu-latest that runs the font-independent files in full**, the a11y project and the e2e files whose tests are all font-independent: `nfr-12-targets`, `nfr-14-backdrop`, `nfr-14-cause-mark`, `nfr-14-palette`, `nfr-14-panel-shell`, `nfr-18-flash` (93 tests) plus `npm run check:a11y` (67). It builds the page and the design, installs Chromium (`npx playwright install --with-deps chromium`, Playwright is already a dev dependency) and uploads the Playwright report. **New on the runner, not in the project:** pnpm 10.32.1 installed from npm for the design build (`npm i -g pnpm@10.32.1`, then `npm_config_manage_package_manager_versions=false`), as the README does locally, because the pinned pnpm 12.3.4 does not run on Node 22. The seven geometry and fit files (163 tests) stay local, like `check:visual`, and are named under Scope NOT delivered with this PD as the reason. Cost: about 5 minutes per run.
- **B: the same job, all of `npm run test:e2e` plus `check:a11y`.** Expected red on about 76 tests until the geometry is frozen again on Linux, which is a second reference set to maintain (and the design build itself lays out differently there). Not recommended.
- **C: a macOS runner (`macos-latest`) for the full suite.** Its macOS version and fonts may differ from this machine's (26.5.2), so the 0.5px checks may still fail; about ten times the CI minutes. Worth one measurement run only if A is not enough.

## Green is earned when (after the yes)

A branch CI run of the new job passes. **`ci.yml` runs only on a push to `main` and on `pull_request`**, so a branch push alone runs nothing: the run needs the branch pushed and a draft pull request opened (both the user's word), the existing `verify` job is unchanged, and `check-factory-integrity` passes after the re-seal. The new job's run URL and result are recorded here.

## As executed

- `.github/workflows/ci.yml` (locked): the header no longer says «no Playwright» and names this PD; a new `browser` job (ubuntu-latest, 20 minutes): `npm ci`, `npx playwright install --with-deps chromium`, the design build in `design/v0` (pnpm 10.32.1 installed globally on the runner, `npm_config_manage_package_manager_versions=false`, `pnpm install --frozen-lockfile`, `pnpm build`), `npm run check:a11y`, then `npx playwright test --project=layout` on the six font-independent files, and an upload of the two reports and `test-results/`. The `verify` job is unchanged.
- Local run of the job's e2e command: 93 of 93 (`PD-11-proof.txt` § 3). Integrity FAIL before, PASS after the re-seal.
- **Scope NOT delivered by this PD:** the seven geometry and fit files (`nfr-10-fit`, `nfr-10-header-fit`, `nfr-14-layout-geometry`, `nfr-14-confirm-dialog`, `nfr-14-rules-panel`, `nfr-14-settings-panel`, `nfr-14-setup-sheet`; 163 tests) run only locally, as `check:visual` does.

## Rollback

Revert the `Refs: PD-11` commit.
