# Folder audit: update-page-backdrop (tasks 1.1 and 1.2)

**Auditor:** a fresh `spec-compliance-auditor` subagent, not the author (the folder was written by a `spec-writer` subagent). Read-only, 2026-10-11, about 07:43 to 07:50 (UTC+5:30). Scratch extracts and diffs were kept in the session scratchpad, not committed.

**Checked and found right:**
- The 27 token rows match the A-57 appendix (`docs/requirements.md:316-346`) and today's `src/ui/style.css` value for value.
- The four composites, recomputed: light soft rgb(208,198,186), light strong rgb(146,134,122), dark soft rgb(18,15,12), dark strong rgb(15,12,9). Each is darker than the page. In dark they are 1.070 and 1.093 against the page.
- The design facts: the soft rule at `binarka.css:791-795`; strong for the rules panel only from 64rem (1082-1084); strong for confirm (1311-1313); the fade inside `prefers-reduced-motion: no-preference` (opens at 1468).
- The capture forces reduced motion and disables animations (`scripts/check-visual-parity-adapters.mjs:272, 304`).
- The two edits beyond the brief are needed.
- tasks.md runs red first, every task names its evidence, and every user-gated step stays gated.

**Verdict as first read: not ready for red tests** (1 major, 7 minor, 3 notes).

| # | Severity | Finding | Disposition (the author, about 07:50) |
|---|---|---|---|
| 1 | major | `DARK_SAMPLE` (`tests/play-page-helpers.test.ts:1149-1181`, assertions 1232 and 1268-1270) was missing from Impact and task 2.1. Two existing tests would fail (27 against 25 keys; uninlined `var(--color-backdrop-*)`). | Impact row added and named in task 2.1 |
| 2 | minor | The spec called the backdrop rows "block 3" rows of the appendix, which marks them "later" | Reworded in 3 places |
| 3 | minor | proposal.md did not name edits (a) to (e) of «Borders, cues and focus rings…» | Listed |
| 4 | minor | The body sentence and the A-57 trace added to «Effective theme…» were not named | Named |
| 5 | minor | The e2e browser setup was said to be the capture's | Now `playwright.config.ts` |
| 6 | note | Decision 3(b) wording | "the frozen reference nor the page capture" |
| 7 | minor | Impact line ranges missed the "25" comments | Widened |
| 8 | minor | The orphan checks skipped port 4173 | Added to tasks 2.6, 3.5, 4.6, 5.1 and design.md |
| 9 | minor | The archive was not gated on the battery | Task 8.1 now gated on 4.1 to 4.4, 4.6 and 7.1 |
| 10 | note | Smoke step order | Steps 2 and 3 swapped |
| 11 | note | "the" 64rem block | "an `@media (min-width: 64rem)` block" |

**Task 1.2, the validation after the fixes** (run by the parent, 2026-10-11 07:50):

```
$ npx openspec validate update-page-backdrop --strict
Change 'update-page-backdrop' is valid
```

The author also reported `npx openspec validate --all --strict`: `Totals: 3 passed, 0 failed (3 items)`.
