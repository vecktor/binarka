## ADDED Requirements

### Requirement: Main column layout geometry follows the design reference

The boxes of the page's main column SHALL equal those of the design reference (NFR-14) within 0.5 CSS px at the sampled cases of `quality/design-geometry.json`. The reference geometry is the design build (`design/v0`), which stands in for the frozen reference `design/v0-screenshots/review-set-14/` because, captured at a real device scale, it reproduces every reference shot exactly (`docs/qa/g2/harness-calibration.txt`). The elements are: the header `.page-header`, its title `h1` and logo, the settings button `[data-action="settings"]`, the «Правила» button `[data-action="rules"]`, the summary button `[data-action="setup"]`, the board `[data-board]`, its first and last cells, the action buttons `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]`, the message area `.messages`, the idle line `[data-message="idle"]` and the win line `[data-message="win"]`. A box is its `getBoundingClientRect()`; it matches when each of its four edges is within 0.5 px of the reference's. A box of zero width and zero height matches another such box wherever it is, because it paints nothing: the design hides an empty win line with `display: none`, while the page keeps it rendered as a live region (FR-63).

The sampled cases are the light shots of `review-set-14` whose state is reached at mount: the default state at 320×700, 375×812, 768×1024, 1024×768, 1366×650 and 1440×900; the 8×8 board at the same six viewports; and the 4×4 board, the 8×8 board at level 4 and the solved board at the same viewports except 1366×650. Each case shows the design's fixture board of its state through the capture-only board (FR-119), in Chromium with the browser setup of `playwright.config.ts`. Coverage is sampled, never continuum. The geometry does not depend on the colour scheme.

While the board is solved (the win line shows, FR-38), the board host `.board-host` SHALL carry `data-solved="true"`, and at no other time; the stylesheet reads it for the button row (after a win the new-puzzle button takes the bold weight from the hint button), because a has-selector is allowed only in the idle-line rule (FR-65). This requirement covers geometry only. The page's colours, shadows and backdrops, the panels' and the dialog's own geometry, and the pixel score of each shot are outside it. The settings panel stays under the header, its right edge on the column's right edge from 48rem, as the column changes.

Traces: NFR-14, NFR-10, NFR-12, FR-68, FR-119

#### Scenario: The default page matches the design's column at every sampled viewport

- **GIVEN** the default state with the design's 6×6 fixture board (FR-119) at 1024×768
- **WHEN** the page has loaded
- **THEN** the header, the summary button, the board, its first and last cells, the three action buttons and the message area each match the box in `quality/design-geometry.json` for `1024-light-default` within 0.5 px
- **AND** the same holds for the default state at 320×700, 375×812, 768×1024, 1366×650 and 1440×900

#### Scenario: The 4×4 and 8×8 boards keep the column

- **GIVEN** the design's 4×4 fixture, its 8×8 fixture, and its 8×8 fixture at level 4, each at the sampled viewports
- **WHEN** the page has loaded
- **THEN** every listed box matches its case in `quality/design-geometry.json` within 0.5 px, including the 8×8 board that bleeds into the page padding on phones

#### Scenario: The solved board keeps its geometry

- **GIVEN** the design's solved 6×6 fixture, which shows the win state at mount (FR-119)
- **WHEN** the page has loaded at a sampled viewport
- **THEN** every listed box, including the win line, matches its `win` case within 0.5 px

#### Scenario: The board host marks the solved state

- **GIVEN** the page with an unsolved board
- **WHEN** the last move solves it (a hint or a click), or a solved board is shown at mount (FR-119)
- **THEN** `.board-host` carries `data-solved="true"` together with the win line
- **AND** after «Нова головоломка», «Скинути» or a new size and level the attribute is gone together with the win line

#### Scenario: Colours are unchanged

- **GIVEN** the stylesheet after this change
- **WHEN** its `:root` and dark token sets are read
- **THEN** the 13 colour tokens of A-51 keep their names and values
