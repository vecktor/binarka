# Fresh read-only checks of the UX change folders (2026-10-06 about 00:10, UTC+5:30)

Run by the orchestrator session on branch `worktree-ux-orchestrator-run`, before any test of the slice was written (handoff step 2). Agent: `spec-compliance-auditor` (Sonnet 5.5), one fresh agent for A and one for B, C and E. Both ran `npx openspec validate --all --strict`: 6 passed, 0 failed. No critical or major finding in any folder.

## update-page-layout (slice A): ready for tests

Minor:
1. The scenario "The panel is outside the sequence" also requires the panel to follow the message area (FR-61 only says outside the sequence): a spec-made constraint, accepted (design decision 2; slice C appends the dialog after it).
2. The unique panel id per mount is spec-made (design decision 3), no FR.
3. "Decorative examples hold no letters" passes vacuously if no examples are drawn.
4. Three scenarios pass against today's code (no details / three li; hint and win empty at mount; decorative examples): characterisation guards, green from the start.
5. tasks 2.1 writes the U+00A0 as a bare invisible character; the tests use ` `.
6. The stale-text grep at archive should also cover "rules block", "heading is not required" and "any heading, label or footer"; the baseline owner list on line 16 may gain FR-61 and FR-64.

Header match: MODIFIED "Ukrainian page text" and REMOVED "Rules block" match the baseline.

## add-hinted-cell (slice B): ready for tests

Minor:
1. A cancelled confirmation and a press of the shown size keep the marker; their scenarios live in change C.
2. tasks 1.x names fixture ISOLATED for "a hint with no target after a hint filled X", but ISOLATED has no first hint: another fixture, or "click to break a rule, then press the hint", is needed.
3. The baseline text edit list is complete.

Header match: MODIFIED "Hint button fills one cell" matches the baseline, independent of A.

## update-controls-accessibility (slice C): ready for tests

Minor, worth fixing before archive:
1. design.md:75 should remove only the A-20 sentence of the Exclusions bullet and keep the A-14 sentence.
2. The hook `data-size-option` is not signed; tests use order and label.
3. The FR-40 test "The next hint replaces it and a new puzzle clears it" (`tests/play-page-hint.test.ts`) meets the dialog and belongs in the changed-tests list.
4. The «Так, почати» scenario should assert that `close()` runs before the action.
5. FR-62 keyboard reachability is attribute-checked only in jsdom (held NFR-12, NOT-EARNED).
6. A hinted cell that also violates keeps «, підказка»: a judgement call, not literal in FR-63.
7. Observation only (baseline "selects" wording stays true under the confirmation reading rule).

Header match: the four MODIFIED headers match today's baseline; C depends on A (strings.ts, header, panel) and on B (`cell-hinted`).

## add-logo (slice E): ready for tests

Minor:
1. The classes `logo-cell`, `logo-digit` and `logo-digit-ring` are spec-made, not in A-29.
2. The digit-to-cell pairing needs one stated method.
3. `tests/no-image-assets.test.ts` is green by design (a guard); record it so in the red run.
4. The scan could include `public/`.
5. Observation only.
