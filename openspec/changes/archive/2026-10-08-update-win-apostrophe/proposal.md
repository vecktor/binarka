# Change: update-win-apostrophe

## Why

UX decision 14 of the amendment signed on 2026-10-05 about 23:31 (autonomy-log row 66, `docs/design/ux-decisions.md`): the win message used the ASCII apostrophe, which is a typographic error in Ukrainian text. FR-41 was amended: the message is exactly «Вітаємо, головоломку розвʼязано!» with the modifier letter ʼ (U+02BC) as the apostrophe; it was «e.g. «Вітаємо, головоломку розв'язано!»» with U+0027. The play-page baseline and its tests pin the old code point, so this is a product change, not only a design one: the spec, the tests and one constant change together. This is slice D of `docs/mvp-capability-plan.md` section 4.8 ("a one-line change with its test constant").

## What Changes

- The page shows «Вітаємо, головоломку розвʼязано!» with U+02BC in `[data-message="win"]` (FR-41). The text lives in `src/ui/strings.ts` (constant `WIN`, created by slice A); that constant is the only source line that changes.
- A test asserts the exact code point U+02BC after «розв», the absence of U+0027 and of U+2019 anywhere in the text, and that NFR-5 still holds (see `design.md`: U+02BC is not a Latin letter under either definition the tests use).
- The tests that pin the ASCII apostrophe change deliberately, in every file under `tests/` that has one when D starts (re-checked on 2026-10-09: four files, none of them `tests/play-page-size-selector.test.ts`, where C removed the pins); they are listed by FR in `design.md`.
- Spec: two MODIFIED requirements of `play-page`, each copied whole from the baseline of 2026-10-09. «Win message when solved»: the apostrophe changed in its text and in its two exact-text scenarios, plus one added scenario («The apostrophe is U+02BC and no other character»). «The hint and win messages are status regions»: the apostrophe changed in the one scenario that quotes the win message («The same elements carry every message»), nothing else. No ADDED or REMOVED requirement.

Baseline requirements touched by this change (the table of the four UI changes is in `openspec/changes/update-page-layout/proposal.md`):

| Baseline requirement (play-page) | Action | Owner |
|---|---|---|
| Win message when solved | MODIFIED | this change (D) |
| The hint and win messages are status regions | MODIFIED (only its scenario «The same elements carry every message» quotes the win message; the apostrophe changes there, nothing else) | this change (D); it was added to the baseline by `reconcile-ux-accessibility` (archived 2026-10-08) |
| Ukrainian page text | its «Win message text» scenario already points at FR-41 after A; no edit here | `update-page-layout` (A) |
| Grid size selector | C already removed the U+0027 quotes (archived 2026-10-06); no edit here | `update-controls-accessibility` (C) |

Out of scope: any other page text, the hint sentences (their apostrophe U+2019 in «п’ять» is engine text, FR-21, and does not change), English text, a language switch (FR-55 and FR-56 stay Future).

## Impact

- Affected specs: `play-page` (2 MODIFIED). Normal merge at archive (not `--skip-specs`), then one hand edit of non-requirement text listed in `design.md`.
- Affected code: `src/ui/strings.ts` (one constant and its "until slice D" comment). `src/ui/play-page.ts` and `src/engine/` are unchanged. No dependency added.
- Affected tests: `tests/helpers/play-page.ts` (line 15), `tests/play-page-win.test.ts` (lines 30 and 45), `tests/play-page-helpers.test.ts` (lines 333 to 335), `tests/play-page-page-text.test.ts` (line 150). `tests/play-page-size-selector.test.ts` has no U+0027 pin left (C removed them; it compares with `WIN_MESSAGE` only). Tests that follow `WIN_MESSAGE` need no edit but fail red until the source changes; among them the test of the status-region scenario, `tests/play-page-semantics.test.ts` line 375 (`@trace FR-63`). D re-greps at its start; list by FR in `design.md`.
- Ordering (precondition): D runs and archives AFTER C (`update-controls-accessibility`). A is already archived (it created `strings.ts` and reworded «Win message text»); C is archived (2026-10-06), so the stale U+0027 quotes in «Grid size selector» («Win at 4x4», «Win at 8x8») are already gone from the baseline. The baseline changed again on 2026-10-08 (`reconcile-ux-accessibility`), which added the status-regions requirement with one U+0027 quote; this delta covers it. D does not start (no test is written) until C is archived; see `design.md` decision 5 and tasks 1.1 and 3.9.
- Commits that touch `src/` carry trailers `Slice: update-win-apostrophe` and `Refs: FR-41`.
