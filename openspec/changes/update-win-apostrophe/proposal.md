# Change: update-win-apostrophe

## Why

UX decision 14 of the amendment signed on 2026-10-05 about 23:31 (autonomy-log row 57, `docs/design/ux-decisions.md`): the win message used the ASCII apostrophe, which is a typographic error in Ukrainian text. FR-41 was amended: the message is exactly «Вітаємо, головоломку розвʼязано!» with the modifier letter ʼ (U+02BC) as the apostrophe; it was «e.g. «Вітаємо, головоломку розв'язано!»» with U+0027. The play-page baseline and its tests pin the old code point, so this is a product change, not only a design one: the spec, the tests and one constant change together. This is slice D of `docs/mvp-capability-plan.md` section 4.7 ("a one-line change with its test constant").

## What Changes

- The page shows «Вітаємо, головоломку розвʼязано!» with U+02BC in `[data-message="win"]` (FR-41). The text lives in `src/ui/strings.ts` (constant `WIN`, created by slice A); that constant is the only source line that changes.
- A test asserts the exact code point U+02BC after «розв», the absence of U+0027 and of U+2019 anywhere in the text, and that NFR-5 still holds (see `design.md`: U+02BC is not a Latin letter under either definition the tests use).
- The tests that pin the ASCII apostrophe change deliberately; they are listed by FR in `design.md`.
- Spec: one MODIFIED requirement of `play-page`, «Win message when solved», copied whole with the apostrophe changed in its text and in its two exact-text scenarios, plus one added scenario («The apostrophe is U+02BC and no other character»). No ADDED or REMOVED requirement.

Baseline requirements touched by this change (the table of the four UI changes is in `openspec/changes/update-page-layout/proposal.md`):

| Baseline requirement (play-page) | Action | Owner |
|---|---|---|
| Win message when solved | MODIFIED | this change (D) |
| Ukrainian page text | its «Win message text» scenario already points at FR-41 after A; no edit here | `update-page-layout` (A) |
| Grid size selector | its «Win at 4x4» and «Win at 8x8» scenarios quote U+0027; C rewrites them to point at «Win message when solved»; no edit here | `update-controls-accessibility` (C) |

Out of scope: any other page text, the hint sentences (their apostrophe U+2019 in «п’ять» is engine text, FR-21, and does not change), English text, a language switch (FR-55 and FR-56 stay Future).

## Impact

- Affected specs: `play-page` (1 MODIFIED). Normal merge at archive (not `--skip-specs`), then one hand edit of non-requirement text listed in `design.md`.
- Affected code: `src/ui/strings.ts` (one constant and its "until slice D" comment). `src/ui/play-page.ts` and `src/engine/` are unchanged. No dependency added.
- Affected tests: `tests/helpers/play-page.ts`, `tests/play-page-win.test.ts`, `tests/play-page-helpers.test.ts`, `tests/play-page-page-text.test.ts` (list by FR in `design.md`).
- Ordering: A is archived first (it creates `strings.ts` and rewords «Win message text»). D can be archived before or after C; the stale quotes in «Grid size selector» disappear only when C is archived, see `design.md`.
- Commits that touch `src/` carry trailers `Slice: update-win-apostrophe` and `Refs: FR-41`.
