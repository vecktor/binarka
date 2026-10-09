# Change: fix-action-button-targets

## Why

NFR-12 (signed, `docs/requirements.md`) says every control, including «Підказка», «Скинути» and «Нова головоломка», is at least 44×44 CSS px at every viewport. Its check, `e2e/nfr-12-targets.spec.ts` (`npm run test:e2e`, project `layout`, eight sampled viewports), fails on today's page at all 8 viewports for one reason: the three action buttons are 40 px tall (100.6×40, 97.6×40, 175×40; `docs/qa/g1/layout-first-run.txt`, `docs/qa/g1/README.md`). Every other control already meets its floor.

The cause is in `src/ui/style.css`: the generic `button` rule gives `padding: 10px 16px` and no `min-height`, while the other controls (`.rules-button`, `.size-control button`, `.confirm-buttons button`, `.setup-button`, `.level-control button` and others) already declare `min-height: 2.75rem`. Widths are already 97 px or more.

## What Changes

- `src/ui/style.css`: the three action buttons (`[data-action="hint"]`, `[data-action="reset"]`, `[data-action="new"]`, the children of `.buttons`) declare `min-height: 2.75rem` (44 px at the 16 px root). No `!important`, no change to any other control, no new dependency, no markup change, no script change.
- One new jsdom stylesheet test, tagged `@trace NFR-12`, pins the declaration (TC-13: jsdom has no layout, so it checks the declaration, not the pixels). The real-browser proof is the existing `e2e/nfr-12-targets.spec.ts`, which is the red of this change and is not edited. Its red is the G1 evidence (`docs/qa/g1/layout-first-run.txt`) run again and saved in `docs/qa/fix-action-button-targets-red-run.txt` together with the unit red.
- `play-page` spec: one ADDED requirement, «Action buttons meet the touch-target floor».

## Baseline requirements touched

| Baseline requirement | Action |
|---|---|
| none | ADDED «Action buttons meet the touch-target floor» only; no MODIFIED, no REMOVED |

## Stale baseline text (not fixed by the delta)

The delta rules (ADDED, MODIFIED with the full requirement copied) cannot reach these without copying very long requirements for a wording fix, so they are listed here and left out of scope. They belong to a later documentation-sync change.

`grep -n requirements-held openspec/specs/play-page/spec.md` finds 12 lines. NFR-10, NFR-12 and NFR-13 are now in `docs/requirements.md` (phase G1, autonomy-log rows 105 to 110); NFR-11, NFR-14 and NFR-15 are still held (A-32 note).

| Line | Requirement | Held rows named | Stale? |
|---|---|---|---|
| 692 | Rules panel | NFR-14 (or NFR-10 / NFR-15) | partly: NFR-10 moved |
| 768 | Page document order | NFR-14 (or NFR-10 / NFR-15) | partly: NFR-10 moved |
| 815 | Idle line | NFR-14 (or NFR-10 / NFR-15) | partly: NFR-10 moved |
| 874 | Hinted cell marker | NFR-11, NFR-14 | no |
| 943 | Confirmation before discarding player entries | NFR-13, NFR-14 | partly: NFR-13 moved |
| 1091 | Cells are buttons | NFR-13 | yes |
| 1446 | Enter and Space activate a cell like a click | NFR-13 | yes |
| 1591 | Logo | NFR-15 (and NFR-14) | no |
| 1661 | Summary button | NFR-12, NFR-14 | partly: NFR-12 moved |
| 1705 | Setup sheet | NFR-10, NFR-12, NFR-14 | partly: NFR-10 and NFR-12 moved |
| 1862 | Level selector | NFR-10, NFR-12, NFR-14 | partly: NFR-10 and NFR-12 moved |
| 2213 | The summary and level buttons set their own colours | NFR-14 | no |

Nine of the 12 name a row that has moved (lines 692, 768, 815, 943, 1091, 1446, 1661, 1705, 1862); three do not (874, 1591, 2213). The behaviour these lines describe is unchanged; only the pointer is out of date. The new requirement of this change is the current home of the action-button rule.

Also stale, and not a requirement, so archive does not touch it: the «Exclusions» bullet «Two accessibility items the user declined (autonomy-log rows 43 and 66) are not provided: 44 px phone touch targets and the puzzle state in the URL.» The first half is false now (NFR-12 is signed). Task 6.4 corrects this one line by hand in the archive commit; the second half (puzzle state in the URL) stays true. The other Exclusions bullets that mention NFR-7 «Future», A-14 «mobile layout not specified» and the held NFR-10/12/13/14 are listed here as stale and left alone.

## Out of scope

- A fine-step width and height sweep of NFR-12 (the stricter instrument named in `docs/qa/g1/README.md`).
- Any change to `e2e/`, the other controls, cells (their floors already pass) or the 8×8 cell floor.
- Held NFR-11, NFR-14 and NFR-15.

## Impact

- Affected specs: `play-page` (1 ADDED). Normal merge at archive (not `--skip-specs`).
- Affected code: `src/ui/style.css` (one declaration); one new test file under `tests/`. No dependency; `src/engine/` untouched.
- Layout: each row of action buttons grows by 4 px. At 375×812 the content ends at 622 px of 812 (`docs/qa/fix-action-button-targets/headroom-before.txt`: one sample, default state, not a sweep) and the three buttons wrap to two rows, so the growth is at most 8 px; NFR-10 keeps ample headroom and its e2e check must still pass.
- Commits carry `Slice: fix-action-button-targets` and `Refs: NFR-12`.
