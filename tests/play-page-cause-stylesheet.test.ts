// Play page: the stylesheet of the cause mark (FR-64, FR-65, A-58). The stylesheet scenarios that add-violation-cause adds to «A violation shows a
// cue besides colour» («The cause mark is a corner triangle drawn with borders», «The cause cell keeps the cell's own border», «Forced colours keep
// the mark»; the fourth added scenario, the browser read, is e2e/nfr-14-cause-mark.spec.ts) and to «Borders, cues and focus rings have enough
// contrast» («The cause cue has 3:1 against the violation fill and the stripe», «The accepted adjacencies of the cause mark are not contrast pairs»,
// «A system colour keyword appears in exactly one declaration», and the token AND of «Rules use the tokens and no colour literal is left» extended
// with the top-level `.cell-cause::after`), in openspec/changes/add-violation-cause/specs/play-page/spec.md. Written FIRST (red, tasks.md 3.3 (b)):
// src/ui/style.css has no `.cell-cause` rule yet.
//
// GUARDS (green on today's stylesheet by design; docs/qa/add-violation-cause/red-run.txt section B): the contrast ratios of the cause cue and of
// the accepted adjacencies (the tokens exist today; the pair count of 35 comes from tests/helpers/css.ts), and the token count of 27.
// update-panel-shell DELIBERATE CHANGE (delta 1; proposal.md Impact row `tests/play-page-cause-stylesheet.test.ts:205-206` (comment at line 10)): the
// pair count is now 38 and the token count 31 (see the test that reads them).
// DELIBERATE CHANGE (update-setup-sheet): the pair count is now 41 and the token count 32 (see the test that reads them) — proposal.md Impact row
// «Borders, cues and focus rings have enough contrast» (`tests/play-page-cause-stylesheet.test.ts` comments 12 and 209).
//
// How a rule is read (design.md decision 6): `declarationsFor` merges every rule of a selector, the forced-colours rule being later in the file, so
// the top-level `.cell-cause::after` is read alone (empty context) and the forced-colours rule alone (its `@media` context). The values are compared
// as the jsdom CSSOM serialises them: `''` as `""`, a written `0` as `0px`, a system colour keyword in lower case (spiked on 2026-10-11, red-run.txt
// section B), and the `max()` widths as written. jsdom keeps a shorthand as a declaration of its own name, so "declares no `border-top`" is read
// from the declaration list.
//
// @trace FR-64
// @trace FR-65
// @trace FR-120
import { describe, expect, it } from 'vitest';
import {
  HINT_BREAKS,
  PAIR_PLUS_4,
  PAIR_PLUS_8,
  PAIR_ROW_PLUS,
  cellEl,
  clickCell,
  installPageLifecycle,
  mountFixture,
  mountThenSelect,
  pressHint,
} from './helpers/play-page';
import {
  CONTRAST_PAIRS,
  NAMED_COLOURS,
  TOKEN_NAMES,
  contrastRatio,
  injectPageStyles,
  namedColoursIn,
  readStyles,
  rulesWithSelector,
  scanColours,
  scanSystemColours,
  themeTokenSets,
} from './helpers/css';
import type { ParsedStyles, StyleRuleInfo, TokenSet } from './helpers/css';

installPageLifecycle();

const LEG = 'max(0.5rem, calc(((100cqi - (var(--n) - 1) * var(--board-gap)) / var(--n) - 4px) / 4))';
const FORCED = '@media (forced-colors: active)';

/** The rules of `selector` outside any at-rule. */
const topLevel = (parsed: ParsedStyles, selector: string): StyleRuleInfo[] => rulesWithSelector(parsed, selector).filter((r) => r.context.length === 0);

/** property -> value of the top-level rules of `selector` (a later declaration wins), asserting that at least one such rule exists. */
function topLevelDeclarations(parsed: ParsedStyles, selector: string): Map<string, string> {
  const rules = topLevel(parsed, selector);
  expect(rules.length, `src/ui/style.css has a top-level rule ${selector}`).toBeGreaterThan(0);
  const merged = new Map<string, string>();
  for (const rule of rules) for (const d of rule.declarations) merged.set(d.property, d.value);
  return merged;
}

function tokenIn(set: TokenSet, name: string): string {
  const value = set.tokens[name];
  expect.assert(value !== undefined && /^#[0-9a-f]{6}$/i.test(value), `${name} is #rrggbb in the ${set.label} token set`);
  return value;
}

// ---------------------------------------------------------------------------------------------------------
// «A violation shows a cue besides colour» (FR-64), the scenarios added by add-violation-cause
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-64 A violation shows a cue besides colour: the cause mark', () => {
  it('The cause mark is a corner triangle drawn with borders', () => {
    const parsed = readStyles();
    const cause = topLevelDeclarations(parsed, '.cell-cause');
    expect(cause.get('position'), '.cell-cause declares position relative').toBe('relative');
    const cell = topLevelDeclarations(parsed, '.cell');
    expect(cell.has('position'), '.cell declares no position').toBe(false);
    const positioned = parsed.rules
      .flatMap((r) => r.selectors.filter((s) => s.startsWith('.cell') && s !== '.cell-cause::after').map((s) => ({ s, r })))
      .flatMap(({ s, r }) => r.declarations.filter((d) => d.property === 'position').map((d) => `${s} { position: ${d.value} }`));
    expect(
      [...new Set(positioned)].sort(),
      'among the rules whose selector begins with .cell (other than .cell-cause::after) only .cell-cause and .cell:focus-visible declare position, both relative',
    ).toEqual(['.cell-cause { position: relative }', '.cell:focus-visible { position: relative }']);

    const after = topLevelDeclarations(parsed, '.cell-cause::after');
    const expected: [string, string][] = [
      ['content', '""'],
      ['position', 'absolute'],
      ['top', '0px'],
      ['right', '0px'],
      ['width', '0px'],
      ['height', '0px'],
      ['pointer-events', 'none'],
      ['border-top-style', 'solid'],
      ['border-top-color', 'var(--color-violation-border)'],
      ['border-left-style', 'solid'],
      ['border-left-color', 'transparent'],
    ];
    for (const [property, value] of expected) expect(after.get(property)?.toLowerCase(), `.cell-cause::after { ${property}: ${value} }`).toBe(value);
    expect(after.get('border-top-width'), 'border-top-width is the quarter of the inner width with the 0.5rem floor').toBe(LEG);
    expect(after.get('border-left-width'), 'border-left-width equals it').toBe(LEG);

    const forbidden = ['border', 'border-top', 'border-left', 'border-width', 'border-color', 'background', 'background-image', 'box-shadow', 'outline', 'opacity'];
    for (const selector of ['.cell-cause', '.cell-cause::after']) {
      for (const rule of rulesWithSelector(parsed, selector)) {
        const where = `${rule.context.join(' ')} ${selector}`.trim();
        expect(rule.declarations.map((d) => d.property).filter((p) => forbidden.includes(p)), `${where} declares none of ${forbidden.join(', ')}`).toEqual([]);
        for (const d of rule.declarations) {
          expect(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i.test(d.value), `${where} { ${d.property}: ${d.value} } holds no colour literal`).toBe(false);
          expect(namedColoursIn(d.value), `${where} { ${d.property}: ${d.value} } holds no named colour`).toEqual([]);
        }
      }
    }
  });

  // The four kinds at size n after one click on (3,3) (as in tests/play-page-stylesheet.test.ts), with a run of three player 0s in row 2 made
  // first, so the same page also holds a violating non-given cell WITHOUT the marker: (2,1).
  const sizes: [number, typeof PAIR_ROW_PLUS][] = [
    [4, PAIR_PLUS_4],
    [6, PAIR_ROW_PLUS],
    [8, PAIR_PLUS_8],
  ];
  for (const [n, puzzle] of sizes) {
    it(`The cause cell keeps the cell's own border at ${n}x${n}: the four kinds 1px, 1px, 2px, 2px; the cause cell 2px solid, coloured as a violating cell`, () => {
      injectPageStyles();
      const root = mountThenSelect(puzzle);
      clickCell(root, 2, 1);
      clickCell(root, 2, 2);
      clickCell(root, 2, 3);
      clickCell(root, 3, 3); // 0 next to the givens 0 0 at 3,1 and 3,2: the cause
      const plain = cellEl(root, 2, 1);
      const cause = cellEl(root, 3, 3);
      expect([plain.classList.contains('cell-violation'), plain.classList.contains('cell-cause')], 'premise: (2,1) is violating, without cell-cause').toEqual([true, false]);
      expect([cause.classList.contains('cell-violation'), cause.classList.contains('cell-cause')], 'premise: (3,3) is violating and carries cell-cause (from the page)').toEqual([true, true]);

      const kinds = [cellEl(root, 1, 1), cellEl(root, n, n), cause, cellEl(root, 3, 1)];
      expect(kinds.map((el) => getComputedStyle(el).borderTopWidth), 'ordinary, given, violating (the cause), given in the violation').toEqual(['1px', '1px', '2px', '2px']);
      const style = getComputedStyle(cause);
      expect([style.borderTopWidth, style.borderTopStyle], 'the cause cell keeps the 2px solid violation border').toEqual(['2px', 'solid']);
      const other = getComputedStyle(plain);
      expect(
        [style.borderTopColor, style.backgroundColor, style.color],
        'the cause cell and the violating cell without the class compute the same border colour, fill and text colour',
      ).toEqual([other.borderTopColor, other.backgroundColor, other.color]);
    });
  }

  it('The cause cell keeps the cell’s own border: a hinted cause (HINT_BREAKS at 6x6) keeps 2px dashed', () => {
    injectPageStyles();
    const root = mountFixture(HINT_BREAKS);
    pressHint(root);
    const hinted = cellEl(root, 1, 3);
    expect(['cell-hinted', 'cell-violation', 'cell-cause'].map((c) => hinted.classList.contains(c)), 'premise: (1,3) is a hinted violating cause').toEqual([true, true, true]);
    const style = getComputedStyle(hinted);
    expect([style.borderTopWidth, style.borderTopStyle]).toEqual(['2px', 'dashed']);
  });

  it('Forced colours keep the mark', () => {
    const parsed = readStyles();
    const forced = parsed.rules.filter((r) => r.selectors.some((s) => s.includes('.cell-cause')) && r.context.some((c) => c.includes('forced-colors')));
    expect(forced.map((r) => ({ selectors: r.selectors, context: r.context })), 'exactly one rule, .cell-cause::after in @media (forced-colors: active) and no other at-rule').toEqual([
      { selectors: ['.cell-cause::after'], context: [FORCED] },
    ]);
    const declarations = (forced[0]?.declarations ?? []).map((d) => `${d.property}: ${d.value.toLowerCase()}`).sort();
    expect(declarations, 'it declares exactly these three').toEqual(['border-left-color: transparent', 'border-top-color: buttontext', 'forced-color-adjust: none']);

    const adjustElsewhere = parsed.rules
      .filter((r) => r !== forced[0])
      .flatMap((r) => r.declarations.filter((d) => d.property === 'forced-color-adjust').map(() => `${r.context.join(' ')} ${r.selectors.join(', ')}`));
    expect(adjustElsewhere, 'no rule outside that block declares forced-color-adjust').toEqual([]);
    const otherAtRules = parsed.rules
      .filter((r) => r.selectors.some((s) => s.includes('.cell-cause')) && r.context.length > 0 && !(r.context.length === 1 && r.context[0] === FORCED))
      .map((r) => `${r.context.join(' ')} ${r.selectors.join(', ')}`);
    expect(otherAtRules, 'no rule whose selector contains .cell-cause sits in another at-rule').toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// «Borders, cues and focus rings have enough contrast» (FR-65), the scenarios added by add-violation-cause
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-65 Borders, cues and focus rings have enough contrast: the cause cue', () => {
  // GUARD (the tokens exist today; the pair is in tests/helpers/css.ts since tasks.md 3.1).
  it('The cause cue has 3:1 against the violation fill and the stripe', () => {
    const want: Record<string, [number, number]> = { light: [5.38, 4.33], dark: [6.24, 4.61] };
    for (const set of themeTokenSets(readStyles())) {
      const border = tokenIn(set, '--color-violation-border');
      const fill = contrastRatio(border, tokenIn(set, '--color-violation-bg'));
      const stripe = contrastRatio(border, tokenIn(set, '--color-violation-stripe'));
      expect(fill, `${set.label}: against the fill`).toBeGreaterThanOrEqual(3);
      expect(stripe, `${set.label}: against the stripe`).toBeGreaterThanOrEqual(3);
      expect([fill.toFixed(2), stripe.toFixed(2)], `${set.label}: the recorded ratios`).toEqual((want[set.label] ?? []).map((v) => v.toFixed(2)));
      expect(contrastRatio(tokenIn(set, '--color-violation-stripe'), tokenIn(set, '--color-violation-bg')), `${set.label}: the stripe is not a cue`).toBeLessThan(3);
    }
    expect(CONTRAST_PAIRS.filter((p) => p.group === 'cause-cue').map((p) => `${p.fg} on ${p.bg}`), 'the pair against the stripe, group cause-cue').toEqual([
      '--color-violation-border on --color-violation-stripe',
    ]);
    expect(CONTRAST_PAIRS.filter((p) => p.fg === '--color-violation-border' && p.bg === '--color-violation-bg').map((p) => p.group)).toEqual(['violation-cue']);
    // update-panel-shell DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta 1 «Borders, cues and focus rings have enough contrast», scenario «The cause cue has
    // 3:1 against the violation fill and the stripe», proposal.md Impact row `tests/play-page-cause-stylesheet.test.ts:205-206` (comment at line 10)):
    // `toHaveLength(35)` becomes 38 (the 3 pairs on `--color-surface-raised`) and `toHaveLength(27)` becomes 31 (the four shell tokens). The count of the
    // pairs is a GUARD (it comes from the helper, changed in task 2.1); the test fails on the token comparison on the next line, because today's stylesheet
    // declares 27 tokens.
    // DELIBERATE CHANGE (update-setup-sheet): 38 becomes 41 (the three ring pairs; GUARD, it comes from the helper) and 31 becomes 32 (`--color-option-border`; red on
    // today's stylesheet, which declares 31) — proposal.md Impact row «Borders, cues and focus rings have enough contrast» (`tests/play-page-cause-stylesheet.test.ts` 212-213).
    expect(CONTRAST_PAIRS, 'the list holds 41 pairs').toHaveLength(41);
    expect(TOKEN_NAMES, 'the mark has no token of its own: the 32 of the table').toHaveLength(32);
    expect(Object.keys(readStyles().tokens).filter((name) => name.startsWith('--color-')).sort()).toEqual([...TOKEN_NAMES].sort());
  });

  // GUARD (the ratios and the absence of the pairs hold today).
  it('The accepted adjacencies of the cause mark are not contrast pairs: the ratios and the pair list', () => {
    const want: Record<string, string> = { light: '2.45', dark: '2.00' };
    for (const set of themeTokenSets(readStyles())) {
      const ratio = contrastRatio(tokenIn(set, '--color-violation-border'), tokenIn(set, '--color-hover-ring'));
      expect(ratio, `${set.label}: below 3`).toBeLessThan(3);
      expect(ratio.toFixed(2), `${set.label}: the recorded ratio`).toBe(want[set.label]);
    }
    const adjacent = (a: string, b: string): boolean => CONTRAST_PAIRS.some((p) => (p.fg === a && p.bg === b) || (p.fg === b && p.bg === a));
    expect(adjacent('--color-violation-border', '--color-hover-ring'), 'no pair with the hover ring, either order').toBe(false);
    expect(adjacent('--color-violation-border', '--color-focus'), 'no pair with the focus ring, either order').toBe(false);
  });

  it('The accepted adjacencies of the cause mark are not contrast pairs: the focus ring is outside the cell and the mark declares no ring', () => {
    const parsed = readStyles();
    const focus = topLevelDeclarations(parsed, '.cell:focus-visible');
    expect([focus.get('outline-style'), focus.get('outline-offset')], 'the cell’s own focus ring is drawn outside its border box').toEqual(['solid', '2px']);
    const ringProperties = ['outline', 'outline-style', 'outline-width', 'outline-color', 'outline-offset', 'box-shadow'];
    for (const selector of ['.cell-cause', '.cell-cause::after']) {
      const rules = rulesWithSelector(parsed, selector);
      expect(rules.length, `premise: src/ui/style.css has a rule ${selector}`).toBeGreaterThan(0);
      const declared = rules.flatMap((r) => r.declarations.map((d) => d.property)).filter((p) => ringProperties.includes(p));
      expect(declared, `${selector} declares no outline and no box-shadow`).toEqual([]);
    }
  });

  it('A system colour keyword appears in exactly one declaration', () => {
    const parsed = readStyles();
    const hits = scanSystemColours(parsed);
    expect(hits, 'exactly one: border-top-color of .cell-cause::after in @media (forced-colors: active), ButtonText').toHaveLength(1);
    expect(hits[0]?.toLowerCase()).toBe(`${FORCED} .cell-cause::after { border-top-color: buttontext }`);
    // the existing scans find nothing in that rule and were not loosened: the keyword is not a named colour, and border-top-color is not read
    expect(NAMED_COLOURS.has('buttontext')).toBe(false);
    const scan = scanColours(parsed);
    const inRule = (messages: string[]): string[] => messages.filter((m) => m.startsWith(`${FORCED} .cell-cause::after`));
    expect([scan.literals, scan.named, scan.shorthands, scan.colourProperties].map(inRule), 'the old scans pass the forced-colours rule').toEqual([[], [], [], []]);
  });

  it('Rules use the tokens and no colour literal is left: the top-level .cell-cause::after takes its border-top-color from the token', () => {
    const parsed = readStyles();
    const rules = topLevel(parsed, '.cell-cause::after');
    expect(rules.length, 'premise: a top-level .cell-cause::after rule (outside any at-rule)').toBeGreaterThan(0);
    const merged = topLevelDeclarations(parsed, '.cell-cause::after');
    expect(merged.get('border-top-color'), 'the top-level rule, not the forced-colours one').toBe('var(--color-violation-border)');
    const scan = scanColours(parsed);
    expect(scan, 'the whole stylesheet still passes the colour scan').toEqual({ literals: [], named: [], shorthands: [], tokensOutsideRoot: [], colourProperties: [] });
  });
});
