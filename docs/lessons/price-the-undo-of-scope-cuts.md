# Lesson: price the undo when you cut scope

Recorded 2026-10-05 about 01:02 (UTC+5:30) at the user's request (autonomy-log row 49; row 41 on its original branch). It answers the user's question why the slice 3 tests took so long, and corrects the first answer to it (M17; M16 on its original branch).

## Finding

Cutting the size selector (FR-43) was cheap when it was decided. Restoring it was expensive, because the page spec and the test helpers written after the cut assumed 6×6 only. The decision priced building for every size and priced the cut, but never priced undoing the cut.

- Row 2a (`docs/autonomy-log.md:13`): the agent put building for every size at "about 10–20% extra work" and noted that the selector "is the only piece that can be cut without touching the engine". Nothing said what a restore would cost once the page was written for one size.
- Cut item 0 (`docs/requirements.md:153`, applied 18:40): "The engine stays generic … the page stays at 6×6." It names what stays flexible in the engine, not what gets hard-wired in the page.
- The order of events: the page spec was revised for the cut at 18:55 (`b67a7b6`: "The page is always 6×6"); the user made the selector a "restore if time" item at 19:00 (`bfc6e1a`, row 13); the slice 2 test helpers were committed at 20:36 with `export const SIZE = 6` in `tests/helpers/play-page.ts` (tag `step-20-s2-red`). The hard-wiring happened after a comeback was already planned.

## What the restore cost (slice 3, `add-size-selector`)

| Cost | Count | Evidence |
|---|---|---|
| Existing requirements modified | 7 | `openspec/changes/archive/2026-10-04-add-size-selector/specs/play-page/spec.md` |
| Scenarios copied word for word into those 7 | 17 of their 26 (6,020 of the delta's 24,108 bytes) | the same file, compared with `git show a3adf3c:openspec/specs/play-page/spec.md` |
| Hand edits of non-requirement text at archive | 7 | `openspec/changes/archive/2026-10-04-add-size-selector/design.md`, "Baseline text edits at archive" (line 114) |
| Test-helper lines changed to take N | about 490 (helpers 328, helper self-checks 160) | `git show --stat step-26-s3-red` |

The new behaviour itself is 17 scenarios under one ADDED requirement plus 6 new scenarios inside the modified ones. How much of slice 3's wall time the hard-wiring caused is not measured. Part of the test time went to a reference implementation and 34 mutants that the orchestrator asked the test-engineer for (`docs/qa/add-size-selector-red-run.txt`): a separate, deliberate cost.

## Why a MODIFIED requirement costs so much in OpenSpec

- `openspec archive` replaces a MODIFIED requirement as a whole block (`node_modules/@fission-ai/openspec/dist/core/archive.js`, lines 443 to 454, version 0.17.2). The delta has to restate every scenario that should survive; a scenario left out is deleted at archive.
- Strict validation only requires SHALL or MUST and at least one scenario per requirement (`node_modules/@fission-ai/openspec/dist/core/validation/validator.js`, line 87), so a dropped scenario passes validation. Slice 3 dropped exactly one, on purpose: "New puzzle is always 6x6".
- The merge never touches text outside the requirement blocks (Purpose, the DOM contract, Exclusions). That is why 7 edits had to be made by hand.

## Gate or decision record?

- The failure happened when the decision was made, not at a later check. A script can confirm that a record exists, not that its estimate is right, and a hard gate invites "N/A" entries.
- The factory reverts a new check whose metric does not move (`templates/retro/improvement.template.md`, line 48). None of the current process-health metrics would move for this kind of problem.
- The repo already has a form that keeps several options together with their consequences: the ADR (`docs/adr/0001-stack.md`, "Alternatives considered" at line 23 and "Consequences" at line 29). Scope cuts never got that form; they lived in a one-line cut item and a log row.
- Like the sign-offs in `docs/lessons/factory-enforces-artifacts-not-order.md` ("Sign-offs are judgment gates, by design"), this is a judgment a script cannot make. A gate fits only as a backstop.

## How to apply

1. Every scope option offered to the user (the P1 clarification list, a question in chat) states three things: the cost now, the cost to undo it later, and what it hard-wires.
2. A cut or deferral that may come back gets a short ADR: the options, their consequences, what stays flexible, and the user's sign-off.
3. When a variation point is known (grid size; the page language, FR-55), write the requirements and the test helpers for it from the start, even if only one value ships: "an N×N board, 6×6 at start", not "always 6×6"; a `size` parameter in the helpers, not `SIZE = 6`.
4. Write requirements in terms of events, not controls ("until the board is replaced", not "until the new puzzle button is pressed"), and name them by topic. A new trigger then needs an ADDED requirement, not a MODIFIED one.
5. Optional backstop. This is a harness change and waits for the user's approval:
   - a check that every applied cut or "restore if time" item links to its record, shown as "needs sign-off" and never as PASS;
   - a count per change, in `npm run retro:digest`, of modified requirements, copied scenarios and dropped scenarios.

## What this corrects

Row 30's retro item (`docs/autonomy-log.md:41`) carries three claims from the first answer that the evidence above contradicts:

- "16 new scenarios": there are 23 (17 added, 6 new inside modified requirements).
- "a per-size copy of the … dirty-givens scenarios": the two 8×8 dirty-givens scenarios test different rules. One is three equal digits in a row; the other is the whole-line highlight for too many of one digit, which is exactly where a leftover `SIZE = 6` would hide.
- "found mostly wording faults": the examples listed in rows 25 and 26 are behaviour, test, layout and plan defects. Of the 9 second-pass findings (commit `41b7730`), only one, the CSS rationale, was wording alone.

Row 30 stays as written. M17 records the correction.
