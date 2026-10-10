# Change: fix-size-option-focus-ring

## Why

The size control (`[data-control="size"]`, class `size-control`) is a segmented card: three options side by side with a 3px gap, inside a 3px padded frame. Its options take the page-wide `button:focus-visible` ring (3px, `outline-offset: 2px`), so a keyboard-focused size option draws its ring outside itself, over the gap, across the neighbour option and onto the card's frame. The theme and language options, the same kind of segmented card, already pull the ring inside with `outline-offset: -1px` (`src/ui/style.css`, `.theme-control button:focus-visible` and `.language-control button:focus-visible`). The confirming design review of `review-set-13` listed the same inset ring for the size options as open polish (autonomy-log row 123; "carried into the product port"). The user said "add it" in chat on 2026-10-10 (autonomy-log row 137).

No shot of the pixel reference `design/v0-screenshots/review-set-13/` has a focused size option, so the NFR-14 reference is unaffected.

## What Changes

- `src/ui/style.css`: one rule `.size-control button:focus-visible { outline-offset: -1px; }`, next to the size control rules, with the comment the theme and language rules carry. No other rule changes; no markup, script, token or dependency change.
- One jsdom stylesheet test, tagged `@trace FR-65`, pins the inset offset for the three segmented controls (size, theme, language). The theme and language rules exist already and had no test; pinning them guards the shared pattern.
- `play-page` spec: one ADDED requirement, «Segmented options keep the focus ring inside the card».

## Baseline requirements touched

| Baseline requirement | Action |
|---|---|
| none | ADDED «Segmented options keep the focus ring inside the card» only. «Cells and buttons show a visible, unobscured focus indicator» still holds: `button:focus-visible` keeps its positive offset, and the new rule narrows only the offset of the options inside the three segmented cards. |

## Impact

- FR-65 (visible, unobscured focus indicators), FR-43 (the size control), FR-102 and FR-107 (the theme and language controls, already inset).
- NFR-13 (`npm run check:a11y`): the focus ring stays visible; the check must stay green.
- Not in scope: the rules panel opening scrolled to its bottom (row 137 (3), a separate bug), the gear pressed look and «Почати» filled (within G2, row 137 (2)).
