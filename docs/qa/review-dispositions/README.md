# Review dispositions (PD-10)

`scripts/check-trajectory.mjs` accepts an archived slice's review when its review file says `clean: true`, **or** when a signed disposition here covers it. A disposition never edits the review file or the archive folder, and nobody flips `clean` by hand.

## Where a review file belongs

`openspec/changes/archive/<YYYY-MM-DD-slice>/review-findings.json`, with a boolean top-level `clean` written as the run says (`clean: true` only when the run confirmed nothing). The review-gate workflow writes it into the active change folder before the archive moves it. When the workflow writes no file, write it by hand in the workflow's shape, with `clean` and a `persistedBy` note (`docs/handoff/next-session.md`).

The check names the two slips seen three times (palette, backdrop, settings):
- a file without a boolean `clean` reads `no-clean-field`;
- a missing archive file that exists at `docs/qa/<slice-without-date>/review-findings.json` is reported as found there.

A review that runs after the archive (the archive folder is never edited) writes `docs/qa/<slice-without-date>/review-findings.json`, and the slice's disposition names it in `reviewFile`.

## A disposition: `docs/qa/review-dispositions/<YYYY-MM-DD-slice>.json`

| Field | What the check enforces |
|---|---|
| `slice` | the archive folder name |
| `reviewFile` | exists on disk |
| `findings[]` | one entry per confirmed finding of every run in the review file (contested findings with substance too). Each has `title`, `productCodeDefect` (boolean) and `outcome`: `"fixed"` with `fixCommit` (exists, and is an ancestor of `HEAD`), or `"waived"` with a `waiver` reason. **A product-code defect can only be `fixed`.** |
| title tie | every title in the review file's top-level `confirmedTitles` (when it has one) appears among `findings[].title` |
| `designWaiver` | optional: `{ reason, pointsAt? }` stands for a missing `design.md`; `pointsAt` must exist |
| `signature` | `signedBy`, `signedAt`, `channel`, `words`, all non-empty. `null` until the user signs: an unsigned disposition does not count |

Other fields (`id`, `run`, `severity`, `evidence`, `excluded`, `compiledFrom`, `compilerNotes`) are for the reader and the signer; the check does not read them.

**What the check cannot verify:** that the signature is the user's, that a fix commit really closes its finding, and, for review files without `confirmedTitles`, that no confirmed finding was left out. That is what the user signs, from `signing-sheet.md`. Each entry's `evidence` says where its mapping came from.
