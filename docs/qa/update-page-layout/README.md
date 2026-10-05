# Real-browser check of update-page-layout (tasks 3.7)

2026-10-06 about 00:21 (UTC+5:30), built-in browser (Chromium), `npx vite --port 5301` from worktree `ux-orchestrator-run` at the green commit `e9c2709`. Layout is **observed, not verified**: the placement and visibility claims belong to the held NFR-9 and NFR-13 (`docs/requirements-held.md`), which stay NOT-EARNED.

| Step | Observation | Evidence |
|---|---|---|
| Mount at 375×812 | Header with «Бінарка» and «Правила»; size select; 6×6 board; «Підказка», «Скинути», «Нова головоломка»; idle line below the buttons; no rules block under the board | `375-mount.jpg` |
| «Правила» at 375 | The panel is open (`:popover-open` true), a bottom sheet: x 0, width 375, bottom 812; heading, three rules with decorative examples, «Зрозуміло» | `375-rules-open.jpg` |
| «Зрозуміло» | The panel closes (`:popover-open` false) | script check |
| «Підказка» | Hint sentence shown, idle line `display: none` | script check, `375-8x8-hint-idle-hidden.jpg` (8×8) |
| «Скинути» | Hint sentence gone, idle line `display: block` again | script check |
| Size 4, size 8, «Нова головоломка» | Panel element still connected and its text unchanged; 64 cells; no `details`; `scrollWidth` 375 (no horizontal scroll) | script check |
| «Правила» at 1280×800 | Centred panel, x 416, width 448, top 204 (below the header) | `1280-rules-open.jpg` |
| Console | No errors | `read_console_messages` |

The browser pane's screenshots of an emulated viewport come back cropped to the pane (800 px frames); they are illustrations, not pixel evidence (UX decision 11).
