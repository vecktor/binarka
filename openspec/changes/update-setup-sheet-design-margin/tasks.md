# Tasks: update-setup-sheet-design-margin

Spec delta for the design stream DS of wave 3 (branch `claude/youthful-bhabha-design28`). The code and the tests were done first (rows DS9 to DS15 of `docs/qa/design-stream/session-log.md`); this folder catches the living spec up, as part of the review gate's fix round (row DS16). Nothing is merged, pushed or archived without the user's word.

## 1. Code and tests (done before this folder)

- [x] 1.1 Remove the recorded deviation: `scripts/setup-sheet-deviation.mjs` → `scripts/setup-sheet.mjs`; `scripts/freeze-design-geometry.mjs` and `scripts/visual-block.mjs` inject nothing and guard 28px. Evidence: `docs/qa/design-stream/block-setup.txt`.
- [x] 1.2 Red first, traced to the signed A-60 wording and the reference moves. Evidence: `docs/qa/design-stream/red-run.txt`, `docs/qa/design-stream/red-run-set16.txt`.
- [x] 1.3 Refreeze `setupSheet`, with case hashes pre-registered. Evidence: `docs/qa/design-stream/refreeze.txt`, `docs/qa/design-stream/refreeze-set16.txt`.
- [x] 1.4 Green and NFR-14. Evidence: `docs/qa/design-stream/green-run-set16.txt`, `docs/qa/design-stream/check-visual-set16.txt` (170 of 170), `docs/qa/design-stream/battery-set16.txt`.

## 2. Spec delta

- [x] 2.1 MODIFIED «The setup sheet takes the design's size, place and paint» (`specs/play-page/spec.md`), to the signed A-60 wording. Evidence: `npx openspec validate --all --strict` in `docs/qa/design-stream/fix-round-1.txt`.

## 3. Review and archive

- [x] 3.1 Review gate (the user's yes, row DS10): run `wf_b4f0e083-6e6`, 10 confirmed; one fix round. Evidence: `docs/qa/design-stream/review-findings.json`, `docs/qa/design-stream/fix-round-1.txt`.
- [ ] 3.2 The user signs the disposition `docs/qa/review-dispositions/2026-10-12-update-setup-sheet-design-margin.json` (PD-10) and decides on the archive.
- [ ] 3.3 Archive with `npx openspec archive update-setup-sheet-design-margin` on the user's yes.
