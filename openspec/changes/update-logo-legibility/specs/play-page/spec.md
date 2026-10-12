## MODIFIED Requirements

### Requirement: Logo

The page header SHALL show exactly one inline `<svg>` logo inside its heading, drawn as shapes in the page source: a 2×2 mini board with the digits «1 0 / 0 1» in a circle with 0/1 rays, and no text (FR-72). The mini board SHALL be four cell shapes `.logo-cell` (`rect`) in a 2×2 arrangement, each holding one digit shape: a bar for 1 (a `rect` with the class `logo-digit`) and a ring for 0 (an `ellipse` with the class `logo-digit-ring`), so that in reading order (top-left, top-right, bottom-left, bottom-right) the four digits are 1, 0, 0, 1. The circle SHALL be a `circle` element and the rays SHALL be shapes around it: bars (`rect`) for 1 and rings (`ellipse`) for 0, at least one of each. The SVG SHALL hold no `<text>` element, no `<title>`, no `<desc>`, no `<foreignObject>`, no text node of any kind (not even whitespace) and no word; its text content is empty. It SHALL be decorative: `aria-hidden="true"`; the title in the header remains the page's text heading, with the text «Бінарка». It SHALL NOT use an image file: no `<img>`, no `<image>`, no `<use>` and no `href` or `xlink:href` on any element of the SVG, no `src` attribute anywhere on the page (TC-14). The logo SHALL be created once at mount with the header, so a new puzzle, a size change and a win leave exactly one logo, the same element. The logo adds no page text, so NFR-5 is unaffected. The header holds one more inline `svg`, the drawn gear inside the settings button `[data-action="settings"]` (see «Settings button and panel»): it has `aria-hidden="true"`, no `<text>`, `<title>`, `<desc>`, `<foreignObject>`, `<use>`, `href` or `xlink:href` and no text node, and it is not the logo; these two are the only `svg` elements of the root (TC-14 and FR-72, amended 2026-10-10, autonomy-log rows 120 and 121: the logo and the gear are the two inline graphics allowed, and FR-72 describes the logo only). In the rest of this requirement «the svg» means the logo. So that the four digits can be told apart at 40×40 CSS px (the held NFR-15, see `docs/requirements-held.md`), the logo SHALL keep the `viewBox` `0 0 64 64` and draw its board at least this large, in viewBox units (one unit is 0.625 CSS px at 40 px): each `.logo-cell` at least 15 wide and 15 tall; each bar `rect.logo-digit` at least 4 wide and 10 tall; each ring `ellipse.logo-digit-ring` with a `stroke-width` attribute of at least 2.8 and an open hole at least 3.2 wide and 5.6 tall (2 × (`rx` − `stroke-width` / 2) and 2 × (`ry` − `stroke-width` / 2)), with its outer edge (`cx` ± (`rx` + `stroke-width` / 2), `cy` ± (`ry` + `stroke-width` / 2)) inside its cell. The board SHALL lie inside the circle (for each cell, the centre of each rounded corner, `rx` in from both edges, lies within `r` − `rx` of the circle centre), and each ray SHALL lie outside the circle and inside the viewBox: each ray is drawn upright above the circle centre inside a `g` with `transform` `rotate(<angle> 32 32)`, the circle centre is (32, 32), the inner edge of each ray (`y` + `height` of a bar ray, `cy` + `ry` + `stroke-width` / 2 of a ring ray) is at least `r` + 0.5 above the centre, i.e. at most 32 − `r` − 0.5, and its top (`y`, or `cy` − `ry` − `stroke-width` / 2) is at least 0. These numbers are spec-made proxies taken from the drawing the user chose on 2026-10-12 (a bigger 2×2 board with shorter rays, change `update-logo-legibility`); they do not prove legibility, which only the vision check of NFR-15 decides (clip `16-logo-40`), and the look of the mark is covered by NFR-14. the classes, the tag choices and "the same element after a board change" above are spec-made proxies for FR-72 and TC-14, taken from the frozen design (`design/v0/components/binarka-page.tsx`, the source of A-30) and the mount-once structure of the page so that the shapes are checkable in jsdom; they are not requirements of FR-72 itself.

Traces: FR-72, TC-14, FR-117

#### Scenario: One decorative inline logo in the header

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `header` element of the root
- **THEN** the heading in the header contains exactly one `svg` element (the logo), and the root contains exactly one other `svg`, the gear inside `[data-action="settings"]`, and no third
- **AND** both have `aria-hidden="true"`
- **AND** the heading in the header has the exact text content «Бінарка» (the logo adds no text to it)

#### Scenario: The logo holds no text

- **GIVEN** the page has just been mounted
- **WHEN** the test walks every node under the `svg`
- **THEN** there is no `text`, `title`, `desc` or `foreignObject` element and no text node (a `TreeWalker` over `SHOW_TEXT` finds none)
- **AND** the `svg`'s `textContent` is the empty string

#### Scenario: The gear holds no text and no reference

- **GIVEN** the page has just been mounted
- **WHEN** the test walks every node under the gear `svg`
- **THEN** there is no `text`, `title`, `desc`, `foreignObject` or `use` element, no text node, and no element has an `href` or `xlink:href` attribute

#### Scenario: The mini board shows 1 0 / 0 1

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the shapes of the `svg` with the classes `logo-cell`, `logo-digit` and `logo-digit-ring`
- **THEN** there are exactly four `rect` elements with the class `logo-cell`, with two distinct `x` values and two distinct `y` values, each of the four (x, y) combinations occurring once
- **AND** there are exactly four digit shapes, one in each cell, and in reading order of the cells they are: a `rect.logo-digit` (1), an `ellipse.logo-digit-ring` (0), an `ellipse.logo-digit-ring` (0), a `rect.logo-digit` (1)
- **AND** reading order means the cells ordered by (`y`, then `x`) ascending, the values read with `getAttribute` and compared as numbers
- **AND** each digit shape lies inside its cell: for a `rect.logo-digit` its `x` and `y` (and for an `ellipse.logo-digit-ring` its `cx` and `cy`) are within the cell's `x` to `x` + `width` and `y` to `y` + `height`, and exactly one digit shape lies in each cell

#### Scenario: Circle and 0/1 rays

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `svg`
- **THEN** it contains exactly one `circle` element
- **AND** it contains at least one `rect` and at least one `ellipse` that carry none of the classes `logo-cell`, `logo-digit` and `logo-digit-ring` (the rays: bars for 1, rings for 0)

#### Scenario: No image file is used

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the whole root
- **THEN** the root contains no `img`, `image`, `use`, `picture`, `object`, `embed` or `canvas` element
- **AND** no element of the root has a `src` attribute, and no element of the `svg` has an `href` or `xlink:href` attribute

#### Scenario: The repository holds no image asset

- **GIVEN** the source tree
- **WHEN** the test lists every file under `src/` (and under `public/` if that directory exists; it does not exist today), and reads `index.html` and `src/ui/style.css`
- **THEN** no file under `src/` (or `public/`) has the extension `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico` or `.svg`
- **AND** `index.html` has no `<link>` element whose `rel` contains `icon` and no `<img>` element, and `src/ui/style.css` contains no `url(`

#### Scenario: The logo survives every board change

- **GIVEN** a mounted page with a fixture puzzle and the logo element read at mount
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 (one run) and to 8 (one run) |
| reaches a win |

- **THEN** after each action the heading in the header still holds exactly one `svg`, it is the same element as at mount, and it still holds no text node, and the root still holds exactly two `svg` elements (the logo and the gear)

#### Scenario: The logo does not leak the seed

- **GIVEN** the page is mounted with a seed source returning 987654 and the logo present
- **WHEN** the test inspects every text node under the page root, `document.title` and every attribute value of every element in the root, including those of the `svg` and its shapes, each as a separate string
- **THEN** none of those strings contains `987654` and none matches `/9\D?8\D?7\D?6\D?5\D?4/` (so no shape coordinate or `viewBox` accidentally spells the seed)

#### Scenario: The digits are large enough to read at 40 px

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the attributes of the logo with `getAttribute`, compared as numbers
- **THEN** the `viewBox` is `0 0 64 64`
- **AND** each of the four `.logo-cell` shapes is at least 15 wide and at least 15 tall
- **AND** each of the two `rect.logo-digit` bars is at least 4 wide and at least 10 tall
- **AND** each of the two `ellipse.logo-digit-ring` rings has a `stroke-width` of at least 2.8, a hole of 2 × (`rx` − `stroke-width` / 2) at least 3.2 and 2 × (`ry` − `stroke-width` / 2) at least 5.6, and its outer edge inside the cell that holds its centre

#### Scenario: The board sits inside the circle and the rays outside it

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `circle`, the four `.logo-cell` shapes and every ray (the `rect` and `ellipse` shapes without a logo class)
- **THEN** the circle centre is (32, 32)
- **AND** for each cell, each of its four rounded-corner centres (`x` + `rx` or `x` + `width` − `rx`, and `y` + `rx` or `y` + `height` − `rx`) lies at most `r` − `rx` from (32, 32)
- **AND** each ray is the only child of a `g` whose `transform` is `rotate(<angle> 32 32)`, its inner edge is at most 32 − `r` − 0.5 and its top is at least 0
