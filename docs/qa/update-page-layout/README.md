# Real-browser check of update-page-layout (tasks 3.7)

## Run 2: at the review round 2 fix `1723234`

2026-10-06 about 09:10 (UTC+5:30), built-in browser (Chromium), `npx vite --port 5302 --strictPort` from worktree `heuristic-lovelace-5e57b4` at `1723234` (autofocus on «Зрозуміло», `role="dialog"`, idle line NBSP as escapes). Layout is **observed, not verified**: placement and visibility belong to the held NFR-9 and NFR-13 (`docs/requirements-held.md`), which stay NOT-EARNED.

| Step | Observation | Evidence |
|---|---|---|
| Mount at 375×812 | Header with «Бінарка» and «Правила»; size select; 6×6 board; «Підказка», «Скинути», «Нова головоломка»; idle line below the buttons; no rules block under the board. Nothing focused at load (`activeElement` is `BODY`: the `autofocus` inside the closed popover does not take focus on page load); panel closed; the idle line holds 2 U+00A0 | `375-mount-1723234.jpg` (half scale), script check |
| «Правила» by mouse click at 375 | Panel open, a bottom sheet: x 0, y 412, width 375, height 400; `role="dialog"`, `aria-labelledby` names «Правила»; focus is on «Зрозуміло» (`activeElement` is the close button) and `:focus-visible` is false, so no focus ring is drawn after a mouse click; «Зрозуміло» at y 752, height 44, fully inside the 812 px viewport and **seen in the still** | `375-rules-open-1723234.jpg` |
| Escape | Panel closes; focus returns to «Правила» | script check |
| «Правила» by keyboard (focus on the button, Enter) | Panel opens; focus on «Зрозуміло» with `:focus-visible` true (keyboard users see the ring) | script check |
| Enter on «Зрозуміло» | Panel closes | script check |
| «Підказка» | Hint sentence shown («Два нулі поспіль у стовпці 3, …»), idle line `display: none` | script check |
| «Скинути» | Hint sentence empty, idle line `display: block` | script check |
| Size 4, size 8, «Нова головоломка» | 16 and 64 cells; panel is the same element with the same text; no `details`; exactly one `[autofocus]`; `scrollWidth` 375 (no horizontal scroll) | script check |
| «Правила» by mouse click at 1280×800 | Centred panel x 416, y 204, width 448, height 391, below the header (header bottom 78); focus on «Зрозуміло», `:focus-visible` false | `1280-rules-open-1723234.jpg` (800×500 pane frame) |
| Console | No errors | `read_console_messages` |

For NFR-13 (G2): a rules-open shot captured after a mouse click shows no focus ring on «Зрозуміло», so the `autofocus` the user chose (2026-10-06) is expected not to change those shots' pixels; a keyboard-opened shot would show the ring.

The browser pane's screenshots are illustrations, not pixel evidence (UX decision 11).

## Run 1: at the green commit `e9c2709` (superseded)

2026-10-06 about 00:21, `npx vite --port 5301` from worktree `ux-orchestrator-run`, before fix round 1 (`41bbda6`). Observations as in run 2 except focus (not checked) and the 375 rules-open still, which was cropped above «Зрозуміло» (the button was found and clicked by script, not seen). Stills: `375-mount-e9c2709.jpg`, `375-rules-open-e9c2709.jpg`, `375-8x8-hint-idle-hidden-e9c2709.jpg` (8×8, hint shown, idle line hidden), `1280-rules-open-e9c2709.jpg`.
