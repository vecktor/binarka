## ADDED Requirements

### Requirement: Segmented options keep the focus ring inside the card

The options of the three segmented controls, the size control (`.size-control button`, FR-43), the theme control (`.theme-control button`, FR-102) and the language control (`.language-control button`, FR-107), SHALL draw their keyboard focus ring inside the option, so that the ring of a focused option does not run over the gap, over a neighbouring option or over the frame of the card (FR-65 "unobscured"). The stylesheet `src/ui/style.css` SHALL contain, for each of the three, a rule whose selector is `<control> button:focus-visible` and which declares `outline-offset: -1px`, as an ordinary declaration (no `!important`). The ring keeps the style, width and colour of `button:focus-visible` (solid, at least 2px, `var(--color-focus)`; see «Cells and buttons show a visible, unobscured focus indicator»), and `button:focus-visible` keeps its positive `outline-offset` for every other button. jsdom never matches `:focus-visible` (A-28), so the unit test decides the declarations; that the ring is visible in a real browser is NFR-13 (`npm run check:a11y`).

Traces: FR-65, FR-43, FR-102, FR-107

#### Scenario: Each segmented control declares an inset focus ring

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of the rules for `.size-control button:focus-visible`, `.theme-control button:focus-visible` and `.language-control button:focus-visible`
- **THEN** a rule exists for each of the three and its `outline-offset` is `-1px`
- **AND** none of these declarations has the priority `important`

#### Scenario: Other buttons keep the outset ring

- **GIVEN** the parsed `src/ui/style.css`
- **WHEN** the test reads the declarations of the rule for `button:focus-visible`
- **THEN** its `outline-offset` is still greater than 0
