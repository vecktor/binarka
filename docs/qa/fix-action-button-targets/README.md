# fix-action-button-targets: real-browser check (NFR-12, NFR-10)

2026-10-09, about 22:42 (UTC+5:30). Tree `057a57e` (the green commit). `npm run build`, served by `npx vite preview --port 4175`. Chromium (Playwright 1.64.0), headless, `reducedMotion: reduce`, the seeded `Math.random` of `e2e/helpers.ts` (seed 1), 6×6 «Розминка». Measured with `getBoundingClientRect` in the page; one look in the built-in browser pane at 375×812 as well: the same button sizes and tops; that instrument read the content bottom as 629 against 630 here (sub-pixel rounding of the same layout).

| Viewport | State | «Підказка» | «Скинути» | «Нова головоломка» | Content bottom | Scroll height | Screenshot |
|---|---|---|---|---|---|---|---|
| 375×812 | default | 100.6×44, top 466 | 97.6×44, top 466 | 175×44, top 522 | 630 (622 before, `headroom-before.txt`) | 812 (no scroll) | `375-6x6-default.png` |
| 375×812 | hint shown | 100.6×44, top 466 | 97.6×44, top 466 | 175×44, top 522 | 650 | 812 (no scroll) | `375-6x6-hint.png` |
| 320×700 | default | 100.6×44, top 456 | 97.6×44, top 456 | 175×44, top 512 | 620 | 700 (no scroll) | `320x700-default.png` |
| 1280×800 | default | 100.6×44, top 474 | 97.6×44, top 474 | 175×44, top 474 | 582 | 800 (no scroll) | `1280x800-default.png` |

- At 375 and 320 the buttons wrap to two rows, so the page grew by 8 px (622 to 630 at 375×812); at 1280 they sit in one row.
- The buttons do not move when the hint appears (tops 466 and 522 in both states at 375×812).
- By eye: the buttons are not clipped, the labels are centred, nothing overlaps.

Limit: eyes on three widths and one height each, not a continuum. The gate is the e2e run (`e2e-green-run.txt`: NFR-12 at eight sampled viewports, NFR-10 at 375×812 in three states), also sampled. The stricter instrument (a fine-step width and height sweep) is not built.

Other evidence of the slice: `../fix-action-button-targets-red-run.txt` (red), `mutation-run.txt`, `e2e-green-run.txt`, `a11y-green-run.txt`, `headroom-before.txt`.
