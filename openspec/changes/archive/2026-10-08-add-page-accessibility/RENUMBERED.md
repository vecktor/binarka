# Renumbered requirement ids

The user signed this change's requirements on 2026-10-06 as FR-57 to FR-63. On 2026-10-08 the user decided to renumber them to FR-59 to FR-65, because `main` already used FR-57 (the rules block) and FR-58 (the reset button) from the slice `add-rules-and-reset`.

| Signed as | Now |
|---|---|
| FR-57 | FR-59 |
| FR-58 | FR-60 |
| FR-59 | FR-61 |
| FR-60 | FR-62 |
| FR-61 | FR-63 |
| FR-62 | FR-64 |
| FR-63 | FR-65 |
| A-26 | A-28 |

The assumption A-26 of this change became A-28, because `main` already used A-26 and A-27 for the rules block and the reset button. NFR-9 keeps its id.

Updated to the new ids on 2026-10-08: `proposal.md`, `design.md`, `tasks.md` and `specs/play-page/spec.md` in this folder.

Still using the old ids, because they are evidence or published history and are never edited:

- `review-findings.json` in this folder;
- `docs/qa/add-page-accessibility-red-run.txt` and `docs/qa/add-page-accessibility/keyboard-check.md`;
- the messages and trailers of the slice's commits, `31883c6` to `17893bc`, and of `4084dcd` and `cf9352e`;
- the autonomy-log row that records the signed amendment.
