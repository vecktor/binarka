# Tasks: fix-action-button-targets

Order of work: section 1 (tests) is written FIRST and seen red before section 2. No database exists, so the smoke test of the template maps to the real-browser check in section 5. Every new test is tagged `@trace NFR-12`. Do not edit `e2e/nfr-12-targets.spec.ts`.

Commits (GPG-signed, no `--no-verify`, no squash; probe the GPG cache right before each; trailers `Slice: fix-action-button-targets` and `Refs: NFR-12` on every commit):

1. Red commit: the new test, this change folder, `docs/qa/fix-action-button-targets-red-run.txt`, `docs/qa/fix-action-button-targets/headroom-before.txt`.
2. Green commit: the CSS fix and the green evidence (including the green run's `docs/qa/e2e-report.json`).
3. Archive commit: archive, the Exclusions line correction, handoff docs.

`docs/qa/e2e-report.json` is tracked and rewritten by every Playwright run. The red run's copy is NOT committed (restore it, see 1.4); the green run's copy is committed with the green evidence (3.6).

## 1. Failing tests first (red)

- [x] 1.1 Create `tests/play-page-action-buttons-stylesheet.test.ts`, tagged `@trace NFR-12`, following `tests/play-page-stylesheet.test.ts` and `tests/play-page-level-stylesheet.test.ts` (helpers `mountFixture`, `installPageLifecycle`, `q` of `tests/helpers/play-page.ts`; `injectPageStyles`, `readStyles`, `rulesWithSelector` of `tests/helpers/css.ts`). One test per scenario of «Action buttons meet the touch-target floor» that jsdom can decide:
  - for each of `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]`, the computed `min-height` (after `injectPageStyles`) is a length of at least 44 px (`rem` times 16, or `px`); an empty value, `0` or `2.5rem` fails;
  - top level: using the parsed rules of `readStyles()`, find every rule that declares `min-height` and has a selector that the button matches (`button.matches(selector)`, skipping selectors with a pseudo-class); assert at least one such rule exists and every one has an empty `context` (`StyleRuleInfo.context` is the at-rule chain, so empty means not inside `@media`, `@supports` or `@layer`). The helper does expose this, so the clause "not inside a media query" is tested; if it turns out not to work for nested rules, drop the clause from the spec instead of claiming it;
  - no `min-height` declaration in the parsed stylesheet has `important: true`.
  Say in the file header that jsdom has no layout (TC-13) and that the measured size is decided by `e2e/nfr-12-targets.spec.ts`.
- [x] 1.2 Run `npm run test:e2e -- --project=layout e2e/nfr-12-targets.spec.ts`. This is the G1 evidence (`docs/qa/g1/layout-first-run.txt`) run again, not a new red: 8 viewports fail, only with the three lines `button «Підказка» is 100.6x40`, `«Скинути» is 97.6x40` and `«Нова головоломка» is 175x40`, floor 44x44. If another line fails, stop and report it.
- [x] 1.3 Run `npm run test:run` and confirm the new action-button tests FAIL for the right reason (no `min-height` on the buttons). Save the unit output and the e2e output of 1.2 together in `docs/qa/fix-action-button-targets-red-run.txt` with the red and green counts, stating which tests are red and which pass before the fix (for example the `!important` guard).
- [x] 1.4 The Playwright run of 1.2 rewrote `docs/qa/e2e-report.json`: restore it to the committed copy (`git checkout -- docs/qa/e2e-report.json`) so the red copy is not committed. Then make the red commit (commit 1 above).

## 2. Implementation

Dependencies and database schema: none. No dependency (TC-10), no storage (TC-12), no network (TC-11); `src/engine/`, `src/ui/strings.ts`, markup and scripts untouched.

- [x] 2.1 In `src/ui/style.css`, after the `.buttons` rule or after the generic `button` rule, add a rule for the three action buttons (for example `.buttons button { min-height: 2.75rem; }`) with no `!important`, outside any at-rule, and no colour literal. Edit no other rule.
- [x] 2.2 Error paths: confirm by reading that nothing else changed: no input is validated, no mutation exists, no authentication exists (no redirect-to-login or forbidden case, play-page Exclusions). Run `npm run test:run` and confirm every test is green, including the new ones.
- [x] 2.3 Mutation check, in a scratch copy of the repository or with the file restored after each run (never committed): (a) delete the new declaration; (b) set it to `2.5rem`; (c) wrap it in `@media (min-width: 1px)`. For each, run the new test file and confirm it FAILS for the three buttons (for (c): fails the top-level check); restore the file and confirm green. Save the three outputs in `docs/qa/fix-action-button-targets/mutation-run.txt`.

## 3. Battery

- [x] 3.1 Run `npm run lint`.
- [x] 3.2 Run `npm run test:run`.
- [x] 3.3 Run `npm run build`.
- [x] 3.4 Run `npx openspec validate --all --strict`.
- [x] 3.5 Run `node scripts/check-eval-ratchet.mjs`.
- [x] 3.6 Run `npm run test:e2e` and confirm all green, including `e2e/nfr-12-targets.spec.ts` at the eight viewports and `e2e/nfr-10-fit.spec.ts` at 375×812. Save the output as `docs/qa/fix-action-button-targets/e2e-green-run.txt`. This run's `docs/qa/e2e-report.json` is the green copy: keep it for the green commit.
- [x] 3.7 Run `npm run check:a11y` and confirm it passes (the buttons got taller; focus rings and axe states must be unchanged). If it rewrites `docs/qa/a11y-report.json`, commit that copy with the green evidence.
- [x] 3.8 Make the green commit (commit 2 above): the CSS fix, `docs/qa/fix-action-button-targets/e2e-green-run.txt`, `mutation-run.txt`, the green `docs/qa/e2e-report.json`.

## 4. Review gate

- [ ] 4.1 Run the review-gate with `change: fix-action-button-targets` (one run, one fix round for confirmed defects, one confirming run); record the report path in `docs/current-state.md`.
- [ ] 4.2 Review item (no test checks it): the diff of `src/ui/style.css` adds the action-button `min-height` rule only; no rule of another control is edited, and the rules of `.rules-button`, `.setup-button`, `.size-control button`, `.level-control button` and `.confirm-buttons button` keep their `min-height: 2.75rem`. The reviewer states the result in the report.

## 5. Real-browser check at 375 px

Do not tick a sub-step until it has evidence (a file path).

- [x] 5.1 Run `npm run dev` (or `npm run build` and `npm run preview`) and open the printed URL in Chromium at 375×812.
- [x] 5.2 Save a screenshot of the default 6×6 page to `docs/qa/fix-action-button-targets/375-6x6-default.png`; with the inspector, read the height of the three action buttons (44 px or more) and the bottom of the content (compare with 622 px in `docs/qa/fix-action-button-targets/headroom-before.txt`), and note both in `docs/qa/fix-action-button-targets/README.md`.
- [x] 5.3 Press «Підказка» so a hint message shows, and save `docs/qa/fix-action-button-targets/375-6x6-hint.png`: the page still fits without vertical scroll and the buttons do not move.
- [x] 5.4 Look at 320×700 and at 1280×800: the buttons look right and are not clipped; save one screenshot each in the same folder. Record in the README the limit of the check: eyes on three widths, not a continuum (the e2e check samples eight).
- [x] 5.5 Stop the server. This check is a gate for section 6.

## 6. Archive and validation

- [ ] 6.1 Run `npx openspec validate fix-action-button-targets --strict`.
- [ ] 6.2 Do NOT edit `docs/requirements.md` (NFR-12 is signed). In the handoff (7.1) propose to the user that the verify column of NFR-12, which says «seen failing on 2026-10-09», gets the evidence path of the green run; the user decides. Update `README.md` only if it states the button size (it should not).
- [ ] 6.3 Archive only after sections 1 to 5 passed and the real-browser check passed: run `npx openspec archive fix-action-button-targets --yes` (a normal merge, NOT `--skip-specs`). This is commit 3.
- [ ] 6.4 In the archive commit, correct the Exclusions line of `openspec/specs/play-page/spec.md` that archive does not touch: «Two accessibility items the user declined (autonomy-log rows 43 and 66) are not provided: 44 px phone touch targets and the puzzle state in the URL.» becomes a line that says 44 px touch targets are required by NFR-12 (see «Action buttons meet the touch-target floor») and only the puzzle state in the URL is not provided. Do not edit the other stale lines listed in `proposal.md`.
- [ ] 6.5 Run `npx openspec validate --all --strict` and `npm run check:trace` (NFR-12 cited by the new test and by the e2e spec).

## 7. Handoff

- [ ] 7.1 Update `docs/current-state.md`: last update date and time in UTC+5:30, phase, slice status, evidence paths (`docs/qa/fix-action-button-targets-red-run.txt`, `docs/qa/fix-action-button-targets/e2e-green-run.txt`, `mutation-run.txt`, `headroom-before.txt`, the screenshots, the review-gate report), and a "Scope NOT delivered" section that matches `proposal.md`: the 12 pointers to `docs/requirements-held.md` in `openspec/specs/play-page/spec.md` (lines 692, 768, 815, 874, 943, 1091, 1446, 1591, 1661, 1705, 1862, 2213 before this change; 9 of them name a row that has moved: NFR-10, NFR-12 or NFR-13) stay for a later documentation-sync change; the other stale Exclusions bullets (NFR-7, A-14) stay; the fine-step viewport sweep is not built; the proposal to update the NFR-12 verify column awaits the user.
- [ ] 7.2 Add a row to `docs/autonomy-log.md` for this slice (what was decided, by whom, the evidence paths).
- [ ] 7.3 Make sure the archive commit (commit 3) carries 6.4, 7.1 and 7.2 and the trailers `Slice: fix-action-button-targets` and `Refs: NFR-12`.
