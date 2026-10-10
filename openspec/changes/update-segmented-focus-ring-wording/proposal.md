# Change: update-segmented-focus-ring-wording

## Why

The review gate of `fix-size-option-focus-ring` (run `wf_a93ad2d1-bf4`, `openspec/changes/archive/2026-10-10-fix-size-option-focus-ring/review-findings.json`) confirmed that the requirement «Segmented options keep the focus ring inside the card» states a geometry the CSS does not have.

- **The text says** the ring is drawn "inside the option" and does not run "over the gap".
- **The CSS draws** a 3px outline (`button:focus-visible`) at `outline-offset: -1px`. So the ring runs from 1px inside the option's border edge to 2px outside it.
- **The result:** it covers 2 of the 3px of the card's gap and padding. It stays 1px clear of the neighbouring option and the card's frame.

The ring is unobscured, and that is what FR-65 asks. Only the wording is wrong.

Pulling the ring fully inside (`outline-offset: -3px`) would change the theme option's focus ring in the pixel reference `review-set-13` (the `settings-focus` shots). So this change corrects the text to the real geometry and keeps the CSS.

It also closes a contested finding: the requirement says the ring "keeps the style, width and colour of `button:focus-visible`", but nothing pinned that. A new scenario now says the three rules declare no other outline property.

## What Changes

- `play-page` spec: the requirement «Segmented options keep the focus ring inside the card» is MODIFIED. It now gives the true geometry (from 1px inside to 2px outside the option, clear of the neighbour and the frame) and adds the scenario «The segmented rules change only the offset».
- `tests/play-page-stylesheet.test.ts`: one assertion for that scenario. The rules already comply, so the assertion is green at once. Its proof is the mutation run: a mutant adding `outline-color` or `outline-width` to a segmented rule is killed (`docs/qa/fix-size-option-focus-ring/mutation-run-2.txt`).
- No CSS, markup, script or dependency change.

## Impact

FR-65. No product behaviour changes. The pixel reference is unaffected.
