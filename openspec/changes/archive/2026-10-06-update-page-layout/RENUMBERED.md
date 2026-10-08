# Renumbered ids (2026-10-08)

The UX line's ids were renumbered on 2026-10-08 so they no longer collide with `main` (`cf6ad37`), which uses FR-59 to FR-65, NFR-9, A-28, autonomy-log rows 41 to 49, mistakes M16 to M17 and plan section 4.7 for its own work (slice 6 `add-page-accessibility` and its records). The user signed the mapping in chat on 2026-10-08 (autonomy-log row 76).

| Was | Now |
|---|---|
| FR-59 to FR-66 | FR-66 to FR-73 (FR-59 → FR-66, FR-60 → FR-67, FR-61 → FR-68, FR-62 → FR-69, FR-63 → FR-70, FR-64 → FR-71, FR-65 → FR-72, FR-66 → FR-73) |
| NFR-9 to NFR-14 (held) | NFR-10 to NFR-15 |
| A-28 to A-31 | A-29 to A-32 |
| autonomy-log rows 41 to 66 | rows 50 to 75 |
| mistakes M16 to M19 | M18 to M21 |
| `docs/mvp-capability-plan.md` section 4.7 | section 4.8 |

Updated in this folder: `proposal.md`, `design.md`, `tasks.md` and the delta spec under `specs/` (naming only, no change of meaning).

Keeps the old ids (evidence and history, unchanged on purpose):

- `review-findings.json` in this folder (written by the review run).
- `docs/qa/update-page-layout-red-run.txt` and `docs/qa/update-page-layout/README.md` (run outputs and browser-check reports).
- `docs/qa/ux-folder-audits-2026-10-06.md` (the independent folder audits).
- The commit messages of this change.

TC and BC ids, OpenSpec folder names and the ids this change only amended (for example FR-57, FR-58, NFR-5, A-20, A-26) keep their numbers.
