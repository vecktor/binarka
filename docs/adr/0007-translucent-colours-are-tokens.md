# ADR-0007: Translucent colours are tokens too

Status: **ACCEPTED by the user** in chat on 2026-10-12 at about 16:45 (UTC+5:30), through the question form: «Accept all four (Recommended)» (stream P of wave 3, `docs/qa/process-stream/session-log.md` row P13; line pointers refreshed to `2762e31` before the review). Before that: **PROPOSED, for the user's review.** Written 2026-10-11 by session C of the parallel G2 plan, on the user's word (autonomy-log row 170: «write … palette decision 7»). The format was signed on 2026-10-10 (PA-Q4, «Signed, use defaults», autonomy-log row 157) and is implemented and archived (`openspec/changes/archive/2026-10-10-update-page-palette/design.md`, decision 7; extended by `2026-10-11-update-page-backdrop` and `2026-10-11-update-panel-shell`, decision 6). How such a token is checked is ADR-0008.

## Context

- FR-65 keeps every colour in a `--color-*` token: two value sets (`:root` light, `:root[data-theme="dark"]` dark), no colour literal elsewhere, no `color-mix()`, and every contrast pair checked on the literal values.
- The design uses translucent colours: the violation stripe and the hover ring (`rgba`), the backdrops, the panel and sheet shadows, and the win glow (`color-mix(in srgb, var(--success) 45%, transparent)`).
- The token reader and the contrast function accepted only `#rrggbb`.

## Decision

1. **A colour that lies over one known background becomes an opaque token**: the composite of the design's translucent colour over that background. The stripe lies only over `--color-violation-bg` (`#f1c9c6` light, `#5e332f` dark), the hover ring only over a plain cell. Same pixels, and the token stays `#rrggbb`.
2. **A truly translucent colour is a `#rrggbbaa` token**, with the alpha rounded at 8 bits. Five today: `--color-success-glow`, `--color-backdrop-soft`, `--color-backdrop-strong`, `--color-shadow-panel` and `--color-shadow-sheet` (`TRANSLUCENT_TOKENS`, `tests/helpers/css.ts`; pinned by `tests/play-page-helpers.test.ts:573`).
3. **A translucent token is never the foreground or the background of a contrast pair.** The contrast function still refuses `#rrggbbaa`, so it cannot enter a pair by mistake.
4. **A shadow's geometry stays in the rule; only its colour is a token.** `color-mix()` is replaced by a translucent token.

## Alternatives rejected

- **Allow `rgba()` or `color-mix()` in rules.** The colour scan could no longer read every colour, and a pair could not be checked on literal values.
- **Drop the glow and sign the format later, with the backdrop block** (PA-Q4's alternative). It defers the reader change by one block, and the backdrops need it anyway.
- **Make every translucent colour opaque.** A backdrop or a shadow lies over many different pixels, so no single composite is right.

## Consequences

- The token reader reads two formats. The cost was accepted because later blocks need it (backdrops, shadows).
- A translucent token needs its own check, since no pair covers it: for a backdrop, the composite over the page (ADR-0008); for the shadows and the glow, none (they paint no text and mark no component).
- Rounding the alpha at 8 bits moves the design's value by up to 0.002. Browser checks allow 1 per channel.
