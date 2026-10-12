# PD-10: the trajectory check reads an honest «not clean» as «review did not pass»

Status: **APPROVED by the user** in chat on 2026-10-12 at about 16:05 (UTC+5:30), through the question form: «Approve mechanism (Recommended)», and the one review-gate run «Yes, run it (Recommended)» (session log `docs/qa/process-stream/session-log.md`, row P5). The 24 dispositions and the three `design.md` waivers were **signed at about 16:35** («Sign all 24 as compiled (Recommended)», «Sign all three (Recommended)», row P11). Executed in the commit with `Refs: PD-10`; **green proof complete** (`PD-10-green-proof.txt`). Drafted from 16:02 by stream P of wave 3 (`claude/feynman-process`). Unit P-TRAJ of `docs/handoff/delivery-plan-2026-10-12.md` (section 2.4); the user chose «PD: signed dispositions (Recommended)» on 2026-10-12 (plan section 7, Q2).

## Defect

- `scripts/check-trajectory.mjs` (locked) accepts an archived slice's review only if `openspec/changes/archive/<slice>/review-findings.json` has `clean: true`, and it requires `design.md` in every archived folder. In `--release` mode (G7, and CI on `main`) both are failures.
- This project's practice: one fix round, one confirming run, and if that run still confirms a minor finding, the session writes `clean: false` and says why, rather than looping (`docs/handoff/next-session.md`, «How a phase runs», step 5). The check cannot tell that honest «not clean, no product-code defect, every finding dispositioned» from «the review failed».
- Three review files were written by hand in another shape without a `clean` field (palette, backdrop) or outside the archive folder (settings: `docs/qa/update-settings-panel/review-findings.json`). The check reports them only as «unclean» or «missing», without naming the slip, so it happened three times.
- OpenSpec treats `design.md` as optional for small changes (`openspec/config.yaml` does not require it); three small archived changes have none.

## Red proof (`PD-10-proof.txt`, 2026-10-12 16:02, `--release --check-fresh`, nothing written)

**28 failures**: 24 `review-evidence` (20 `unclean` with `clean: false`, 2 `unclean` because the field is missing, 2 `missing`: `update-segmented-focus-ring-wording`, never reviewed, and `update-settings-panel`, whose file is elsewhere), 3 `process` (no `design.md`: `add-capture-board`, `fix-size-option-focus-ring`, `update-segmented-focus-ring-wording`), 1 `freshness` (the committed default-mode report differs from the release-mode one only by the failures). 31 archived slices, 7 `clean: true`.

## Fix (proposed)

### 1. A signed disposition counts as review evidence

For a slice whose archive review file is not `clean: true`, the check reads `docs/qa/review-dispositions/<archive-folder>.json`. It is accepted (`dispositioned`) only when every rule holds; otherwise the check names the first rule broken:

| Field | Rule the check enforces |
|---|---|
| `slice` | equals the archive folder name |
| `reviewFile` | exists on disk. The archive file when there is one; a file outside the archive (settings; the post-archive run below) is accepted only through this field |
| `findings[]` | each has `title`, `productCodeDefect` (boolean) and `outcome`. `outcome: "fixed"` needs `fixCommit`, a commit that exists and is an ancestor of `HEAD` (`git cat-file -e`, `git merge-base --is-ancestor`). `outcome: "waived"` needs a non-empty `waiver` text. **A `productCodeDefect: true` finding must be `fixed`**: no open product-code defect can be waived |
| title tie | when the review file has a top-level `confirmedTitles` array, every title in it appears among `findings[].title` (no confirmed finding left out) |
| `signature` | `signedBy`, `signedAt`, `channel` and `words` are non-empty (the user's sign-off, recorded as in `docs/qa/sign-offs/G1.md`) |

An unsigned disposition (`signature: null`) is reported as «disposition … is not signed», so the compiled files alone change nothing. **What the check cannot verify:** that the signature is really the user's, that a fix commit really fixes its finding, and, for files without `confirmedTitles`, that no confirmed finding is missing. Those are what the user signs (one table, below), and the compiled `evidence` per finding says where each mapping came from.

### 2. A signed waiver for a missing `design.md`

The same file may carry `designWaiver: { reason, pointsAt? }` (under the same signature). The process check then accepts the folder without `design.md` and shows `waived` in the report; `pointsAt`, when given, must exist (for `add-capture-board`: its signed amendment `docs/handoff/capture-board-amendment-draft-2026-10-10.md`, which holds its design). No archived folder is edited.

### 3. A misplaced or field-less review file is named

In every mode, when the archive review file is missing the check looks for `docs/qa/<slice-without-date>/review-findings.json` and says «found at …: a review file belongs in the archive folder, or is referenced from a disposition». When the archive file has no boolean `clean`, the evidence reads `no-clean-field` (not `unclean`) with the same hint. Both stay failures in `--release` unless a signed disposition covers them. The place and required fields of a review file are written into the check's header comment and into `docs/qa/review-dispositions/README.md`.

### 4. The report

The «Review evidence» column shows `clean`, `dispositioned` or the failing state; «design+tasks» shows `yes`, `waived` or **no**. Default mode keeps every non-pass as a warning, so the committed `docs/qa/trajectory-report.md` stays the default-mode one (CI runs `--check-fresh` in default mode) and is regenerated in the PD's commit.

### 5. The slice that was never reviewed

`2026-10-10-update-segmented-focus-ring-wording` (wording of the size-option ring and one assertion; commits `cc91685`, archived in `b864892`; autonomy-log row 141: «The follow-up was not re-reviewed») gets **one review-gate run** on `ed03a83..b864892` (the user's yes; 6 to 18 minutes). Its file is written to `docs/qa/update-segmented-focus-ring-wording/review-findings.json` (with `clean`), and its disposition references it. A waiver in place of a review is not proposed.

## The 24 dispositions and the one sitting

Compiled from the files, never by editing them: 20 archive files with `clean: false`, the 2 field-less hand-saved files (palette: fixes mapped from autonomy-log row 160, `2fc41d5`, `faf0b91`; backdrop: outcomes in the file, row 163), the settings file outside its folder, and the segmented slice after its run. Each per-finding mapping states its source. The user gets one table (`docs/qa/review-dispositions/signing-sheet.md`) with, per slice: the confirmed count, how many are fixed with a commit, how many are waived and why, any product-code defect, and the design waiver if any. One answer signs all, or names changes.

## Green is earned when

`node scripts/check-trajectory.mjs --release` exits 0 after the signatures, on 31 archived slices: 7 `clean`, 24 `dispositioned`, 3 `design.md` waived. Also seen red first on purpose: a disposition with `signature: null`, a `fixCommit` that does not exist, a waived `productCodeDefect: true`, and a `confirmedTitles` title left out each fail by name (a probe on scratch copies). `check-factory-integrity` passes after the re-seal; the default-mode report is regenerated and committed.

## As executed

- `scripts/check-trajectory.mjs` (locked): the disposition rules of § 1 (`dispositionProblem`), the design waiver of § 2, the `no-clean-field` state and the «found at docs/qa/…» hint of § 3, the report columns of § 4, a warning for a disposition file that names no archived slice, and a per-commit cache of the git checks (240 entries share about 60 commits; one run went from minutes to about 3 s). The header comment says where a review file belongs and what the check cannot verify.
- The segmented slice was reviewed once (`wf_94ea915a-989`, 3 confirmed, 5 contested, 4 rejected, all minor, no product-code defect), persisted by hand to `docs/qa/update-segmented-focus-ring-wording/review-findings.json` with `clean: false`.
- `docs/qa/review-dispositions/`: `README.md` (the rules), 24 signed files, `signing-sheet.md` (what was signed). 240 entries: 213 fixed with a commit on `HEAD`'s history, 27 waived, 26 product-code defects all fixed. Compiled by six subagents and the main session; four entries that a compiler marked fixed close only part of their title and were re-classified as waived (the sheet's point 1).
- Green (`PD-10-green-proof.txt`): `--release --check-fresh` exit 0 (31 slices: 7 clean, 24 dispositioned, 3 `design.md` waived); the negative probe fails each broken rule by name; battery green; integrity FAIL before the re-seal, PASS after. The default-mode report and `trace/trajectory.json` are regenerated in the same commit, so CI's `--check-fresh` passes.

## Rollback

Revert the `Refs: PD-10` commit; the dispositions stay as records, and the check reads them no more.
