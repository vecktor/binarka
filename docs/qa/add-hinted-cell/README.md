# Real-browser check of add-hinted-cell (tasks 3.7)

2026-10-06 about 09:33 (UTC+5:30), built-in browser (Chromium), `npx vite --port 5302 --strictPort` from worktree `heuristic-lovelace-5e57b4` at the green commit `a38ee72`, viewport 375×812. The look of the cue is **observed, not verified** (held NFR-10, NFR-13).

| Step | Observation | Evidence |
|---|---|---|
| Mount | No cell has `cell-hinted` | script check |
| «Підказка» twice at 6×6 | The marker is on (2,2), then moves to (2,5); computed style of the marked cell: border dashed 2px, italic, weight 700; the earlier hinted cell shows a plain digit | `375-6x6-hinted-a38ee72.jpg` |
| Click a given cell | Marker kept on (2,5) | script check |
| Click a non-given cell | Marker gone | script check |
| «Підказка», then «Скинути» | Marker on (5,3), then gone | script check |
| Size 8, «Підказка» | 64 cells, marker on (7,4) | script check |
| «Нова головоломка», «Підказка» | Marker gone, then on (7,1); `scrollWidth` 375 (no horizontal scroll) | `375-8x8-hinted-a38ee72.jpg` |
| Console | No errors | `read_console_messages` |

## Run 2: the steps run 1 skipped (after the confirming review `wf_88d3903c-ecf`)

2026-10-06 about 09:42, same setup, at `ad2712d` (no `src/` change since `a38ee72` except a CSS comment), 375×812, a fresh page.

| Step (tasks 3.7) | Observation | Evidence |
|---|---|---|
| (d) «Підказка» until a press fills no cell | The 7th press filled nothing and showed «Жодне з трьох правил зараз не підказує наступного ходу.»; the marker stayed on (1,2) | `375-no-rule-hint-keeps-marker-ad2712d.jpg`, script check |
| (f) «Правила», then «Зрозуміло» | Panel opened and closed; marker stayed on (1,2) | script check |
| (g) «Нова головоломка», «Підказка», then size 4 | Marker on (2,6), then no marker on the 16-cell board | script check |
| Console | No errors | `read_console_messages` |

A violating board with a marker (the other half of (d)) is reachable only when the hint's own fill breaks a rule (spec, «Actions that change no cell keep the marker»); a generated puzzle has no such hint, so it is covered by the jsdom test with the `HINT_BREAKS` fixture only. Step (h), the path in `docs/current-state.md`, is done with task 3.6 at archive.

Capture note: one screenshot taken right after the scripted sequence showed a stale frame (a reset 6×6 board) while the DOM already held the 8×8 board with the marker on (7,1); a second screenshot showed the real state. Kept as `375-stale-frame-a38ee72.jpg`. This probably explains the unreproduced «Нова головоломка» no-op of slice 2 (autonomy-log row 20): a pane screenshot can lag the DOM, so state claims here rest on script checks.
