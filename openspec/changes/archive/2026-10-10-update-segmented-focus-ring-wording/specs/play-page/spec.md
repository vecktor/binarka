## MODIFIED Requirements

### Requirement: Segmented options keep the focus ring inside the card

The options of the three segmented controls, the size control (`.size-control button`, FR-43), the theme control (`.theme-control button`, FR-102) and the language control (`.language-control button`, FR-107), SHALL pull their keyboard focus ring in, so that the ring of a focused option stays clear of the neighbouring option and of the frame of the card (FR-65 "unobscured"). The stylesheet `src/ui/style.css` SHALL contain, for each of the three, a rule whose selector is `<control> button:focus-visible` and which declares `outline-offset: -1px`, as an ordinary declaration (no `!important`), and no other outline property (no `outline`, `outline-style`, `outline-width` or `outline-color`). The ring therefore keeps the style, width and colour of `button:focus-visible` (solid, 3px, `var(--color-focus)`; see «Cells and buttons show a visible, unobscured focus indicator»). With that width the ring runs from 1px inside the option's border edge to 2px outside it. The card's gap and padding are 3px, so the ring covers part of the gap and stays 1px clear of the neighbour and of the frame; it is not drawn wholly inside the option. `button:focus-visible` keeps its positive `outline-offset` for every other button. jsdom never matches `:focus-visible` (A-28), so the unit test decides the declarations; that the ring is visible in a real browser is NFR-13 (`npm run check:a11y`). A ring drawn wholly inside the option (`outline-offset` of minus the ring width) would change the focused theme option in the pixel reference (NFR-14, `settings-focus` shots) and is not required.

Traces: FR-65, FR-43, FR-102, FR-107

#### Scenario: Each segmented control declares an inset focus ring

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of the rules for `.size-control button:focus-visible`, `.theme-control button:focus-visible` and `.language-control button:focus-visible`
- **THEN** a rule exists for each of the three and its `outline-offset` is `-1px`
- **AND** none of these declarations has the priority `important`

#### Scenario: The segmented rules change only the offset

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of the rules for the three segmented `button:focus-visible` selectors
- **THEN** none of them declares `outline`, `outline-style`, `outline-width` or `outline-color`, so the ring's style, width and colour come from `button:focus-visible`

#### Scenario: Other buttons keep the outset ring

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of the rule for `button:focus-visible`
- **THEN** its `outline-offset` is still greater than 0
