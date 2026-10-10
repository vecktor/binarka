# Tasks: fix-size-option-focus-ring

Order of work: section 1 (the test) is written FIRST and seen red before section 2. Every new test is tagged `@trace FR-65`. Commits are GPG-signed (probe right before each), no `--no-verify`, no squash; trailers `Slice: fix-size-option-focus-ring` and `Refs: FR-65` on every commit.

## 1. Failing test first (red)

- [x] 1.1 In `tests/play-page-stylesheet.test.ts`, block «visible, unobscured focus indicators (FR-65)», add one test per scenario of «Segmented options keep the focus ring inside the card»: for each of `.size-control button:focus-visible`, `.theme-control button:focus-visible` and `.language-control button:focus-visible`, a rule exists and `outline-offset` is `-1px`, not `important`; and `button:focus-visible` keeps a positive offset (the existing test already asks this; cite it, do not duplicate it).
- [x] 1.2 Run `npm run test:run` and confirm the new test FAILS only for `.size-control button:focus-visible` (no rule). Save the output in `docs/qa/fix-size-option-focus-ring/red-run.txt`.

## 2. Implementation

- [ ] 2.1 In `src/ui/style.css`, after `.size-control button[aria-checked='true']`, add `.size-control button:focus-visible { outline-offset: -1px; }` with the comment of the theme and language rules. Edit no other rule.
- [ ] 2.2 Mutation check (scratch, never committed): delete the new rule; set it to `2px`. The new test fails each time; restore and confirm green. Save in `docs/qa/fix-size-option-focus-ring/mutation-run.txt`.

## 3. Battery

- [ ] 3.1 `npm run lint`, `npm run test:run`, `npm run build`, `npx openspec validate --all --strict`, `node scripts/check-eval-ratchet.mjs`.
- [ ] 3.2 `npm run check:a11y` (focus rings visible; NFR-13). Restore any rewritten report that is not this change's evidence.
- [ ] 3.3 A real-browser look: a keyboard-focused size option at 375×812 and 1366×650 in the setup sheet, light and dark, the ring inside the option. Save the shots in `docs/qa/fix-size-option-focus-ring/`.

## 4. Archive

- [ ] 4.1 Archive the change (`npx openspec archive fix-size-option-focus-ring --yes`), validate, update `docs/current-state.md` and an autonomy-log row.
