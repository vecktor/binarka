# Tasks: update-segmented-focus-ring-wording

Trailers `Slice: update-segmented-focus-ring-wording` and `Refs: FR-65`; signed commits, GPG probed before each.

## 1. Test

- [x] 1.1 In `tests/play-page-stylesheet.test.ts`, add the scenario «The segmented rules change only the offset» (`@trace FR-65`): the three segmented rules declare no `outline`, `outline-style`, `outline-width` or `outline-color`. It is green at once (the rules already comply); its proof is 2.1.

## 2. Evidence

- [x] 2.1 Mutation run 2 (scratch, restored): `important-size` (`outline-offset: -1px !important`), `delete-theme`, `colour-size` (`outline-color` added to the size rule), `width-language` (`outline-width: 1px` added to the language rule). Each is killed. Saved as `docs/qa/fix-size-option-focus-ring/mutation-run-2.txt`.
- [x] 2.2 Browser shots of an UNCHECKED focused size option next to the checked one (4×4 focused, 6×6 checked) at 375×812 and 1366×650, light and dark, with the measured ring edges. Saved as `docs/qa/fix-size-option-focus-ring/size-focus-unchecked-*.png` and `ring-geometry.txt`.
- [ ] 2.3 Battery: lint, test:run, build, strict validate, eval ratchet.

## 3. Archive

- [ ] 3.1 Write the review-findings.json of `fix-size-option-focus-ring` with dispositions, archive this change, validate, and log it.
