# ADR-0008: A backdrop is checked as a composite over the page, not as a contrast pair

Status: **PROPOSED, for the user's review.** Written 2026-10-11 by session C of the parallel G2 plan, on the user's word (autonomy-log row 170: «write … backdrop decision 2 (a backdrop checked as a composite)»). Implemented and archived (`openspec/changes/archive/2026-10-11-update-page-backdrop/design.md`, decision 2). It is the "how a translucent token is verified" half of ADR-0007.

## Context

- The backdrop tokens are translucent (`#rrggbbaa`, ADR-0007), and the contrast function refuses that format by design.
- The old check ("no lighter than the page", by `contrastRatio` against white) could not read a translucent value.
- The design's dark backdrops dim a near-black page: their composites are 1.07:1 and 1.09:1 against the page. Any ratio floor would fail the design's own, legitimate dark dim.
- The design's light backdrop dims too, so the light set needs the check as well.

## Decision

1. **Composite per channel in sRGB:** `round(alpha × token + (1 − alpha) × page)`, the values the browser blends for a plain `background-color`, not linear light. Then the relative luminance of the result.
2. **The requirement is an order, not a ratio:** in each token set, the strong composite is darker than the soft one, and the soft one is darker than the page (`tests/play-page-backdrop-stylesheet.test.ts:122`).
3. **The four composites are pinned** in the spec's scenarios, over the page only: light soft `rgb(208, 198, 186)`, strong `rgb(146, 134, 122)`; dark soft `rgb(18, 15, 12)`, strong `rgb(15, 12, 9)`.
4. **A new helper does it** (`compositeOver`, `tests/helpers/css.ts:585`). It throws on anything but `#rrggbbaa` over an opaque `#rrggbb` page. `contrastRatio` and `rgbOf` keep refusing translucent values.
5. **A real-browser check reads the pixel:** `e2e/nfr-14-backdrop.spec.ts` reads one screenshot pixel outside the open surface, after reading the same pixel with the surface closed (it must be the page colour). Coverage is sampled: rules at 2 widths, setup, settings and confirm, 2 schemes, 10 cases.

## Alternatives rejected

- **A contrast ratio floor for the backdrop against the page.** It fails the design's dark dim (1.07 and 1.09).
- **Compositing in linear light.** That is not what the browser paints for `background-color`, so the pinned values would not match the pixels.
- **Reading `getComputedStyle(el, '::backdrop')` as the browser check.** Its support for popovers and dialogs was not verified; it is allowed as a secondary read only.

## Consequences

- The check holds over the bare page only. Over lighter content the composite differs; the browser check and NFR-14's gate read real pixels.
- A new backdrop needs its row in the spec and its two composites pinned. The "only the five selectors" clause fails first if one is added without them.
