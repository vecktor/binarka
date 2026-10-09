# Design: fix-action-button-targets

## Goals

- «Підказка», «Скинути» and «Нова головоломка» are at least 44×44 CSS px at every viewport (NFR-12), so `e2e/nfr-12-targets.spec.ts` goes from 8 failed viewports to green.
- The smallest possible change: one CSS declaration, in the same form the other controls already use.
- NFR-10 (375×812 fit at 6×6) stays green.

## Non-goals

- Any other control, the cells, the 8×8 cell floor, the rules panel, the setup sheet: they already pass NFR-12 (`docs/qa/g1/README.md`).
- Markup, script, strings, engine, dependencies: untouched.
- A fine-step viewport sweep (the stricter instrument for sampled checks); the eight viewports of the existing spec are what NFR-12 names, and the requirement text says they are sampled.
- Fixing the stale baseline pointers to `docs/requirements-held.md` (all 12 listed in `proposal.md`).
- Any change to `e2e/nfr-12-targets.spec.ts`: it is the red of this change and stays as it is.

## Key decisions

1. **Declare `min-height: 2.75rem` on the three action buttons only.** The generic `button` rule has `padding: 10px 16px` and a line height that makes the button 40 px; `min-height: 2.75rem` makes it 44 px (4 px more) and is the value `.rules-button`, `.size-control button`, `.confirm-buttons button`, `.setup-button` and `.level-control button` already use, so every control follows one convention. The selector is the implementer's choice; `.buttons button` is the natural one (the three buttons are the only children of `.buttons`). It has specificity (0,1,1), above the generic `button` rule (0,0,1), so no `!important` is needed. Trade-off: a selector tied to the `.buttons` container; if a fourth button is added there later it gets the floor too, which is the wanted behaviour.
2. **Alternatives considered and rejected.**
   - Put `min-height: 2.75rem` in the generic `button` rule: one line, and it would protect any future button, but it changes every control at once, and the cells are buttons too: a 44 px floor there would break the 8×8 cell floor of 24 px that NFR-12 allows. The brief for this slice is also "no change to any other control". It is a reasonable later clean-up, not part of a fix for three buttons.
   - Raise the vertical padding (10px to 12px): also reaches 44 px, but depends on the font size and line height (a larger user font would add to it), and it differs from the `min-height` convention of the other controls.
   - Use `height: 44px`: a fixed height clips the text when the user enlarges the font; `min-height` lets it grow.
   - Use `!important`: not needed; specificity is enough, and `!important` is forbidden by the requirement.
   - Use `44px` instead of `2.75rem`: same size at the 16 px root; `rem` matches the other controls and follows the user's root font size.
3. **The unit test checks the declaration, not the pixels.** jsdom has no layout (TC-13), so it cannot see 44 px. The test mounts the page, injects the stylesheet (`injectPageStyles` of `tests/helpers/css.ts`) and reads the computed `min-height` of the three buttons by their `data-action` attributes, so it does not depend on the selector chosen for the fix. It also scans the parsed rules (`readStyles` of `tests/helpers/css.ts`): no `min-height` with `!important`, and every rule that declares `min-height` for one of the buttons (found by `button.matches(selector)` on the rule's selectors, skipping selectors with a pseudo-class) has an empty `context` (`StyleRuleInfo.context` is the at-rule chain, so empty means top level, not inside `@media`). Deleting the declaration makes the computed value empty, so the test goes red; a value below 44 px (for example `2.5rem`) also goes red. A mutation run (task 2.3) records both reds. The helpers named here exist: `mountFixture`, `installPageLifecycle` and `q` in `tests/helpers/play-page.ts`; `injectPageStyles`, `readStyles` and `rulesWithSelector` in `tests/helpers/css.ts`. This is a declaration-level guard, honestly weaker than the e2e check, and the spec says so. Alternative: assert the selector `.buttons button` directly with `declarationsFor`; rejected because it would fail on a harmless selector rename and would not prove that the buttons receive the value.
4. **Real-browser proof stays the existing e2e.** `e2e/nfr-12-targets.spec.ts` measures with a real layout and is already red for exactly this cause. No second instrument is added. The evidence of the fix is the same spec turning green at all eight viewports, plus the 375 px screenshots of tasks 5.x.

## Data model

None. No state, no storage (TC-12), no network (TC-11).

## Error handling

No input, no mutation, no new failure path. Authentication does not exist, so no redirect-to-login or forbidden case applies (play-page Exclusions). If the declaration is removed or lowered, the unit test and the e2e check fail with the button name and the measured size.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The extra 4 px per row breaks the NFR-10 fit at 375×812. | Content ends at 622 px of 812 (`docs/qa/fix-action-button-targets/headroom-before.txt`, one sample in the default state); the three buttons wrap to two rows, so at most +8 px. `e2e/nfr-10-fit.spec.ts` is part of the battery (task 3.6) and a 375 px screenshot is taken (task 5). |
| A later, more specific rule overrides the declaration (for example a `button` rule inside a media query). | The unit test reads the computed value in jsdom and the e2e check measures real size at eight viewports. |
| jsdom computed style does not reflect the cascade the way a browser does (nested rules, TC-13). | The test uses a top-level rule and the helper already used by other stylesheet tests; if a nested rule is ever used, the test reads the declaration through the parsed rules instead. The e2e check is the proof. |
| A different red than the intended one (the e2e red could hide another failure). | `docs/qa/g1/layout-first-run.txt` shows only the three buttons failing; task 1.2 runs the spec again and task 1.3 saves the output next to the unit red, so the red is checked, not assumed. |
| The sampled viewports miss a width between them. | Stated in the spec and design: sampled, not continuum. The stricter instrument is the fine-step sweep named as a non-goal. |
| The stale «held ...» pointers mislead a reader. | All 12 lines are listed in `proposal.md` and left to a later documentation-sync change; the one false Exclusions line is corrected at task 6.4. |

## ADR

Nothing here is ADR-worthy: one declaration, no new dependency, no new pattern.
