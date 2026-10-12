# Tasks: fix-reset-keeps-hint

Fix round 1 of the Phase 7 global review gate, stream F (branch `claude/friendly-lederberg-final`). Nothing is merged, pushed or archived without the user's word.

## 1. Spec and tests first

- [x] 1.1 MODIFIED «Reset button» (`specs/play-page/spec.md`): the untouched board defined; scenario «Reset on a board emptied again after a hint keeps the hint sentence» added. Evidence: `npx openspec validate --all --strict` in `docs/qa/fix-reset-keeps-hint/red-run.txt`.
- [x] 1.2 Red: the new test in `tests/play-page-rules-and-reset.test.ts` fails on assertions for N = 4, 6, 8 before the fix. Evidence: `docs/qa/fix-reset-keeps-hint/red-run.txt`.

## 2. Implement

- [ ] 2.1 `src/ui/play-page.ts`: the reset press does nothing on a board without entries. Evidence: `docs/qa/fix-reset-keeps-hint/green-run.txt` (the file and the full unit suite).

## 3. Review and archive

- [ ] 3.1 Review gate on the slice range (the user's yes). Evidence: `openspec/changes/fix-reset-keeps-hint/review-findings.json`.
- [ ] 3.2 Archive with `npx openspec archive fix-reset-keeps-hint` on the user's yes. Evidence: `docs/qa/fix-reset-keeps-hint/archive.txt`.
