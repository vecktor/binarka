## ADDED Requirements

### Requirement: Logo

The page header SHALL show exactly one inline `<svg>` logo, drawn as shapes in the page source: a 2×2 mini board with the digits «1 0 / 0 1» in a circle with 0/1 rays, and no text (FR-65). The mini board SHALL be four cell shapes `.logo-cell` (`rect`) in a 2×2 arrangement, each holding one digit shape: a bar for 1 (a `rect` with the class `logo-digit`) and a ring for 0 (an `ellipse` with the class `logo-digit-ring`), so that in reading order (top-left, top-right, bottom-left, bottom-right) the four digits are 1, 0, 0, 1. The circle SHALL be a `circle` element and the rays SHALL be shapes around it: bars (`rect`) for 1 and rings (`ellipse`) for 0, at least one of each. The SVG SHALL hold no `<text>` element, no `<title>`, no `<desc>`, no `<foreignObject>`, no text node of any kind (not even whitespace) and no word; its text content is empty. It SHALL be decorative: `aria-hidden="true"`; the title in the header remains the page's text heading, with the text «Бінарка». It SHALL NOT use an image file: no `<img>`, no `<image>`, no `<use>` and no `href` or `xlink:href` on any element of the SVG, no `src` attribute anywhere on the page (TC-14). The logo SHALL be created once at mount with the header, so a new puzzle, a size change and a win leave exactly one logo, the same element. The logo adds no page text, so NFR-5 is unaffected. Legibility of the four digits at 40 px and the look of the mark are covered by the held NFR-14 (and NFR-13), see `docs/requirements-held.md`; the classes above are the hooks of the frozen design (`design/v0/components/binarka-page.tsx`, A-29) chosen so the shapes are checkable in jsdom.

Traces: FR-65, TC-14

#### Scenario: One decorative inline logo in the header

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the `header` element of the root
- **THEN** the header contains exactly one `svg` element, and the root contains no other `svg` element
- **AND** that `svg` has `aria-hidden="true"`
- **AND** the heading in the header has the exact text content «Бінарка» (the logo adds no text to it)

#### Scenario: The logo holds no text

- **GIVEN** the page has just been mounted
- **WHEN** the test walks every node under the `svg`
- **THEN** there is no `text`, `title`, `desc` or `foreignObject` element and no text node (a `TreeWalker` over `SHOW_TEXT` finds none)
- **AND** the `svg`'s `textContent` is the empty string

#### Scenario: The mini board shows 1 0 / 0 1

- **GIVEN** the page has just been mounted
- **WHEN** the test reads the shapes of the `svg` with the classes `logo-cell`, `logo-digit` and `logo-digit-ring`
- **THEN** there are exactly four `rect` elements with the class `logo-cell`, with two distinct `x` values and two distinct `y` values, each of the four (x, y) combinations occurring once
- **AND** there are exactly four digit shapes, one in each cell, and in reading order of the cells they are: a `rect.logo-digit` (1), an `ellipse.logo-digit-ring` (0), an `ellipse.logo-digit-ring` (0), a `rect.logo-digit` (1)

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
- **WHEN** the test lists every file under `src/`, and reads `index.html` and `src/ui/style.css`
- **THEN** no file under `src/` has the extension `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico` or `.svg`
- **AND** `index.html` has no `<link>` element whose `rel` contains `icon` and no `<img>` element, and `src/ui/style.css` contains no `url(`

#### Scenario: The logo survives every board change

- **GIVEN** a mounted page with a fixture puzzle and the logo element read at mount
- **WHEN** the player does each of the actions in this table, each from a freshly mounted page

| Action |
|--------|
| presses «Нова головоломка» |
| changes the size to 4 (one run) and to 8 (one run) |
| reaches a win |

- **THEN** after each action the header still holds exactly one `svg`, it is the same element as at mount, and it still holds no text node

#### Scenario: The logo does not leak the seed

- **GIVEN** the page is mounted with a seed source returning 987654 and the logo present
- **WHEN** the test inspects every text node under the page root, `document.title` and every attribute value of every element in the root, including those of the `svg` and its shapes, each as a separate string
- **THEN** none of those strings contains `987654` and none matches `/9\D?8\D?7\D?6\D?5\D?4/` (so no shape coordinate or `viewBox` accidentally spells the seed)
