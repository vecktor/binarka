# G1 browser checks: first runs (2026-10-09)

Phase G1 builds the real-browser checks for the held rows NFR-7, NFR-10, NFR-12, NFR-13, TC-13 and A-14 and shows each one running against the page of `fdfa516` (DL2). Chromium only (Playwright 1.64.0, Chrome for Testing 156.0.8078.4, headless), the built page served by `vite preview` on port 4173, `prefers-reduced-motion: reduce`, and a seeded `Math.random` so every run shows the same puzzles.

| Check | Command | Spec | Sampling (coverage `sampled`, not continuum) |
|---|---|---|---|
| NFR-10 | `npm run test:e2e` (project `layout`) | `e2e/nfr-10-fit.spec.ts` | 375×812, 6×6, states default, hint, win |
| NFR-12 | `npm run test:e2e` (project `layout`) | `e2e/nfr-12-targets.spec.ts` | 320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900, 1280×420, 844×390; cells at 4×4, 6×6, 8×8; page controls, rules panel, setup sheet (6×6 and 4×4), confirmation dialog |
| NFR-13 | `npm run check:a11y` (project `a11y`) | `e2e/nfr-13-a11y.spec.ts` | 375×812 and 1280×800, light and dark; axe (WCAG 2.0/2.1 A and AA, 2.2 AA, any impact fails) in the default, hint, win, rules, confirmation, setup sheet and setup sheet at 4×4 states; a keyboard focus sweep over every control kind |

Stricter instruments, not built here: a fine-step width and height sweep of the same measurements (NFR-10, NFR-12), and axe plus the focus sweep at more viewports (NFR-13). `scripts/check-a11y.mjs` (integrity-locked factory reference) checks routes only, so `check:a11y` runs the state-aware spec instead; the script is unchanged.

## Results against today's page

| Check | Result | Evidence |
|---|---|---|
| NFR-12 | **FAIL** at all 8 viewports: «Підказка» 100.6×40, «Скинути» 97.6×40, «Нова головоломка» 175×40 (floor 44×44). Cells (4×4, 6×6 ≥ 44; 8×8 ≥ 24), the summary button, «Правила», «Зрозуміло», the size and level options (also at 4×4), «Закрити» and the dialog buttons meet their floors. | `layout-first-run.txt`, `e2e-full-run.txt` |
| NFR-10 | PASS: no vertical scroll in the three states; the buttons do not move when the hint appears and move at most 7 px on win | `layout-first-run.txt` |
| NFR-13 | First run 28 of 32: the four focus tests failed with "confirm yes/no never reached". **Harness defect**, not a page finding: the dialog opens on «Скасувати», its last button, so the first Tab left the document and the sweep stopped. Fixed (the sweep records the starting control and steps over one Tab that leaves the page). Second run: PASS, 32 of 32. | `a11y-first-run.txt`, `a11y-run2.txt` |
| NFR-7 | The Playwright run itself: 8 failed (NFR-12), 33 passed | `e2e-full-run.txt`, `../e2e-report.json` |

## The passing checks can fail (probe)

A scratch copy of the build with one injected stylesheet (`.board-host` padding 320 px, focus outlines and shadows removed, text colour grey 128) makes all nine probed tests fail: NFR-10 (scroll height 942 > 812), axe in the default state (`color-contrast` on `.message-idle`, light and dark, both viewports), and the focus sweep (all 12 control kinds "no visible change on focus"). The probe build was outside the repository and `src/` was not touched. Evidence: `probe-broken-build-run.txt`.

Row 68 pre-authorises a move once a check is seen failing against today's page. That holds for NFR-12 and the Playwright run (NFR-7, TC-13, A-14). NFR-10 and NFR-13 pass on today's page; the user decided in chat on 2026-10-09 at about 22:10 to move them too, on the probe evidence.

The NFR-12 failure is a page defect for a later phase (G2 or a fix slice); G1 does not change `src/`. CI does not run these checks yet (`.github/workflows/ci.yml` unchanged; a CI change was not pre-authorised).
