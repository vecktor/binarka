# add-english-version: browser check and observations

The checks are **scripted** Playwright runs (`browser-check.mjs.txt`, `english-sweep.mjs.txt`), not a manual pass. They use Chromium and the built page via `vite preview`, with reduced motion. Coverage is sampled, not continuum.

## Browser check (task 6.1)

- **First run:** `browser-check-run.txt`, 72 PASS, 0 FAIL at 375×812 and 1280×800, light system scheme. It saved stills at 375 and 320 only.
- **Re-run in the first review fix round:** `browser-check-run-fix-round-1.txt`, 108 PASS, 0 FAIL. It adds a 375×812 run in a dark system scheme (theme «Як у системі») and saves stills of every state at each run.
- **Steps (b) to (i)** follow `tasks.md` 6.1:
  - Ukrainian at first, and the panel order «Тема», theme, «Мова», language, «Закрити».
  - "English" re-renders in place. Focus, the board and storage behave as specified, and only «Українська» stays Cyrillic.
  - The same hint switches language with the board unchanged.
  - With the bundle blocked, `lang` is `en` and the title is "Binarka".
  - The English sheet, the 4×4 reason and the confirmation dialog.
  - The English win message, which switches language.
  - A stored `EN` gives Ukrainian and is not rewritten.
  - A keyboard focus ring on both language options, and the panel closes the sheet.

Stills:
- Light, 375: `375-default-en.png`, `375-hint-en.png`, `375-sheet-en.png`, `375-panel-en.png`, `375-panel-uk.png`.
- Light, 1280: `1280-default-en.png`, `1280-hint-en.png`, `1280-sheet-en.png`, `1280-panel-en.png`, `1280-panel-uk.png`.
- Dark, 375: `375-dark-*.png` (the same five states).
- 320: `320-header-en.png`, `320-panel-en.png`.

## Observed, not verified

- **English at 320×640:** no sideways scroll (scroll width 320). The summary button is 288 px wide, and the page fits the screen height. The header fits: «Binarka», the gear and "Rules" sit on one row (`320-header-en.png`). The settings panel at 320 shows both groups on one line each (`320-panel-en.png`).
- **Width sweep, task 4.6:** `english-sweep-run.txt`, 1 px steps from 320 to 400 px in English with the settings panel open. At every width the header and the panel's controls stay inside the viewport and each option is at least 44×44 on one line. This is sampled at 81 widths.
- **English pixel shots:** none. The pixel gate stays Ukrainian (design decision 10), and these stills are not compared with a reference.
- **The one-screen fit at 375×812 in English** is checked by `e2e/nfr-10-fit.spec.ts` (default, hint and win). These stills only illustrate it.
- **The checked option's frame and the focus ring:** both are the focus colour, which is the open visual question from `add-theme-switch`. The language options inherit it (`375-dark-panel-en.png`).
