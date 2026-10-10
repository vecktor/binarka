# PD-2: the NFR-14 capture adapter shows the design's fixture boards and measures only its own preview

Status: **APPROVED by the user** in chat on 2026-10-10 at about 15:33 (UTC+5:30), «Approve PD-2 (Recommended)» (autonomy-log row 147). Executed in the commit with `Refs: PD-2`.

The second process improvement. Like PD-1 it lives here, not in an OpenSpec change folder: it edits a gate-bearing script and no product spec. The product half, the capture-only board, is FR-119 (slice `add-capture-board`, archived).

## Defects

1. **Board content (gap 1 of `docs/qa/visual-diff/README.md`).** Every board shot of the reference uses a fixture board (`design/v0/lib/boards.json`). The adapter captured the page's seeded puzzle instead, so no board shot could reach 0.98 even with a perfect port. FR-119 lets a capture set the board, but the locked adapter did not use it.
2. **A stale preview is measured silently (gap 6).** `ensureServer` spawned `vite preview --port 4174 --strictPort` and only checked that the URL answered. If another server already answered on 4174, the spawn failed quietly and the capture measured that server's page, possibly an old build.

## Fix (`scripts/check-visual-parity-adapters.mjs`)

- `captureBoardFor(state)`, exported, turns a `boards.json` fixture into the FR-119 value. Tokens: `.` empty, `gX` a given, `pX` an entry, `hX` the hinted entry. The board for each state is the board of the design route of that state (`design/v0/app/<state>/page.tsx`):

  | State | Board | Level |
  |---|---|---|
  | default, confirm, rules, rules-techniques, settings, settings-light, settings-dark, settings-focus | `fixtureBoard` | 1 |
  | setup (sheet opened, «Почати» not pressed) | `fixtureBoard` | 2 |
  | setup-marked, setup-marked-four (choices marked in the sheet by the drivers, as before) | `fixtureBoard` | 1 |
  | hint (without its hinted cell; one `element.click()` on «Підказка» places it) | `hintBoard` | 1 |
  | win (the win state at mount) | `solvedBoard` | 1 |
  | four, setup-four | `fourBoard` | 1 |
  | eight | `eightBoard` | 1 |
  | level | `eightBoard` | 4 |

- An init script sets `window.__binarkaCaptureBoard` before the page mounts. Math.random stays seeded (seed 1).
- **Board guard.** FR-119 ignores an invalid value silently, so after load the adapter compares every cell (given or not, digit) with the value, and the shot fails with "the page does not show the capture board" when they differ. Without the guard, a broken fixture would quietly put the seeded puzzle back.
- The drivers no longer start puzzles through the sheet: `four`, `eight` and `level` need nothing after mount, `setup` and `setup-four` only open the sheet, `win` waits for the win message, and `confirm` presses «Нова головоломка» directly, because the fixture already has entries (FR-67). The helper `startPuzzle` and the `emptyCell` selector went with them.
- **Own preview only.** Before it spawns, the adapter fails if something already answers on the config's `localUrl`. While it waits, it fails if its own preview exits (or cannot start), with the tail of its stderr.
- The lock was re-sealed (`--init-lock --adaptation "PD-2: …"`).

## Red to green proof (`docs/qa/improvements/PD-2-proof.txt`)

1. **DOM probe** (`PD-2-dom-probe.mjs`, 1440×900, the built page): for each of the 8 board states, the page loaded as before PD-2 shows **not** the fixture; with `captureBoardFor(state)` set it shows the fixture, with the right size and level in the summary («Задачка» for setup, «Мозколамка» for level).
2. **Sample of 12 shots**, before and after: every shot is captured and passes the guard. The pixel scores barely move (for example 1440-light-hint 0.9135 → 0.9138, 375-dark-hint 0.6524 → 0.7128): the palette, header and type dominate every shot. That is G2 work. These scores are telemetry, not the proof.
3. **Gap 6:** with another server on port 4174 (a copy of `dist/`), the old adapter scored its page (0.9125) without a word. The new one fails: "something already answers on http://localhost:4174/".
4. **Guard:** with every given removed from `fixtureBoard` (scratch, restored), the page ignores the value and the shot fails with the guard's message. A milder edit (one given removed) still had one solution, so the page accepted it, and the guard agreed.
5. **Integrity:** before the re-seal the check gave **PASS with a warning**, not FAIL: the PD-1 commit already "covers" later drift of the same file. This is the weakness the PD-1 doc foresaw, now observed; it is the checker's design (locked) and stays open. After the re-seal: PASS, no drift warning.

## Not in this PD (still open)

- Gap 3: `qa-verify` runs the checker without the adapter (a separate PD).
- Gap 2: the logo shots have no state driver.
- The integrity checker accepts any later drift of a file once one `Refs: PD-<n>` commit touched it (seen in proof 5).
- A `core.hooksPath` warning of `check-factory-integrity` (the path is the main checkout's absolute `.githooks`); not from this change.

## Rollback

Revert the `Refs: PD-2` commit. That restores the PD-1 adapter and lock.
