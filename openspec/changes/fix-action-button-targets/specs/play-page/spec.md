## ADDED Requirements

### Requirement: Action buttons meet the touch-target floor

The three action buttons «Підказка» (`[data-action="hint"]`), «Скинути» (`[data-action="reset"]`) and «Нова головоломка» (`[data-action="new"]`) SHALL each be at least 44×44 CSS px at every viewport (NFR-12). The stylesheet `src/ui/style.css` SHALL give each of them a `min-height` of at least `2.75rem` (44 px at the 16 px root, the value the other controls already use) as an ordinary declaration: no `!important`, not inside a media query, and without changing the `min-height`, padding, size or markup of any other control. The widths of the three buttons are already 97 px or more and SHALL NOT be reduced below 44 px. The buttons keep their markup, order, `type="button"` and behaviour (see «Hint button fills one cell», «Reset button» and «New puzzle button»). jsdom has no layout (TC-13), so the unit test decides the declaration, and the real-browser check `e2e/nfr-12-targets.spec.ts` (`npm run test:e2e`, project `layout`, eight sampled viewports) decides the measured size; the sampled viewports are not continuum coverage. Making the buttons taller SHALL NOT break NFR-10 (the 375×812 fit at 6×6): `e2e/nfr-10-fit.spec.ts` stays green. The wording of NFR-12 for the other controls and for the cells is unchanged and is not restated here. Cells and controls other than the three action buttons already meet their floors; this requirement adds nothing to them (that no other rule is edited is a review-gate item, not a test).

Traces: NFR-12

#### Scenario: The stylesheet declares a 44 px minimum height for each action button

- **GIVEN** the page is mounted in jsdom and the text of `src/ui/style.css` is applied to the document
- **WHEN** the test reads the computed `min-height` of `[data-action="hint"]`, `[data-action="reset"]` and `[data-action="new"]`
- **THEN** each value is a length of at least 44 px (`2.75rem` or more at the 16 px root, `44px` or more)
- **AND** every rule that declares that `min-height` for an action button is at the top level of the stylesheet, not inside an at-rule such as `@media`
- **AND** no `min-height` declaration in the stylesheet has the priority `important`

#### Scenario: A declared minimum height below the floor fails the stylesheet test

- **GIVEN** the `min-height` declaration of the action buttons is deleted from `src/ui/style.css`, or set to `2.5rem` (40 px)
- **WHEN** the stylesheet test runs
- **THEN** it fails for each of the three buttons, because the computed `min-height` is empty, `0` or below 44 px

#### Scenario: Measured in a real browser the buttons are at least 44 px tall at every sampled viewport

- **GIVEN** the built page is open in Chromium at each of the eight viewports of `e2e/nfr-12-targets.spec.ts` (320×700, 375×812, 768×1024, 1024×768, 1366×650, 1440×900, 1280×420, 844×390)
- **WHEN** the check measures «Підказка», «Скинути» and «Нова головоломка»
- **THEN** each is at least 44 px wide and at least 44 px tall, and the spec reports no line `page: button «…» is …x40, floor 44x44`

#### Scenario: The taller buttons keep the phone page fitting on one screen

- **GIVEN** the built page is open in Chromium at 375×812 at 6×6 in the default, hint and win states
- **WHEN** `e2e/nfr-10-fit.spec.ts` measures the page
- **THEN** it still passes: the board, the buttons and the messages fit without vertical scroll, and the buttons hold still when a message appears
