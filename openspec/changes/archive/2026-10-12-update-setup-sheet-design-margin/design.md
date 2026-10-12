# Design: update-setup-sheet-design-margin

## Context

This folder is a spec delta that **follows the code**. It does not lead it, and it says so plainly. The design stream DS of wave 3 was planned as design, tool and test work under the signed A-60 amendment (start prompt `docs/handoff/delivery-wave3-start-prompts-2026-10-12.md` § DS). The living OpenSpec requirement was not on its list. The review gate of the stream (run `wf_b4f0e083-6e6`) confirmed that the requirement still described the removed deviation. This delta is part of that gate's one fix round (`docs/qa/design-stream/session-log.md` row DS16).

## Decisions

1. **Rewrite, not append.** The departure paragraph, the injection description and the two scenarios are rewritten to the signed wording. The old wording is kept as one clause each («until 2026-10-12 …»), as `docs/requirements.md` keeps it inline («was …»).
2. **The cross-iteration guard is the cases' SHA-1.** A design change rewrites every key's provenance (the freeze writes fresh provenance when `designCommit` or `designCssSha1` differ). A whole-key pin would only be re-recorded, which proves nothing. The specs pin each key's `cases`, and each refreeze pre-registers them (`docs/qa/design-stream/refreeze.txt`, `refreeze-set16.txt`).
3. **The margin stays guarded twice:** in the page by the stylesheet test (`margin-bottom: 28px`, unchanged), and in the design by the freeze and `visual-block.mjs` (`LEVEL_MARGIN`, `scripts/setup-sheet.mjs`).

## Risks

- **The pinned design commit `521ce03` must reach `main` unchanged.** The user chose a merge commit (row DS10). A rebase-merge or squash would orphan it, and the fixture and three specs would need a refreeze and re-pins.
