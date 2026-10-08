# Browser check: update-win-apostrophe (task 3.7, FR-41)

- **When:** 2026-10-09 02:41 to 02:43 (UTC+5:30), by the orchestrator.
- **Where:** built-in browser pane (Chromium), `npx vite` from worktree `claude/ux-phases-d-h` at `99df705` on port 5211, viewport 375 × 812 (mobile preset).
- **Steps:** (a) the page opened at 6×6; (b) a real click on «Поле 4×4» gave a 4×4 board with no confirmation, because the board had no entries; (c) a page script read the board, found the one solution by brute force over the 11 open cells with the page's own `isSolved` (`/src/engine/rules.ts`), and filled each open cell with `element.click()`, which fires the page's own click handler. No hint was used and nothing was solved by hand.
- **Result (script output, the evidence this claim rests on):** `[data-message="win"]` text «Вітаємо, головоломку розвʼязано!»; code points `412 456 442 430 454 43c 43e 2c 20 433 43e 43b 43e 432 43e 43b 43e 43c 43a 443 20 440 43e 437 432 2bc 44f 437 430 43d 43e 21`. Index 25 (counting from 0) is `2bc`, and neither `27` nor `2019` occurs. `document.documentElement.scrollWidth` is 375, so there is no horizontal scroll. No console errors.
- **Screenshot:** `375-4x4-win-message.jpg`. It was taken after the script output above and shows the solved 4×4 board and the green win line. The glyph is observed, not pixel-verified (NFR-14 is held until G2). At this size the ʼ looks like ’; the code points above are what tell them apart.
- **Not covered:** the win by the final hint in a real browser (jsdom covers it in `tests/play-page-win.test.ts`), and other sizes.
