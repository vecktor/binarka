// Play page: the dark token set, color-scheme and the colours of the theme options, read from src/ui/style.css (add-theme-switch).
// One test per scenario of the delta spec openspec/changes/add-theme-switch/specs/play-page/spec.md, title = scenario name, from the
// requirements «Effective theme on the document» (the stylesheet half), «Borders, cues and focus rings have enough contrast» (the new
// scenarios of the MODIFIED block: the dark clause of «Tokens exist and are literal», «The page has no prefers-color-scheme block») and
// «The theme options set their own colours». The per-set contrast loops of the older scenarios sit in play-page-stylesheet.test.ts and
// play-page-level-stylesheet.test.ts. Written FIRST (red): the stylesheet has no `:root[data-theme="dark"]` block, no `color-scheme`
// and no `.theme-control` rules. A-51 (the dark values are mapped onto the 13 tokens) is cited here only: @trace tags carry plain ids.
//
// The rules are read as declarations (jsdom never matches :focus-visible and applies no nested rule to computed style, A-28, TC-13).
// The dark block is found through the helper, never by a raw-text search for one quote style (jsdom keeps the quote style the file uses).
//
// @trace FR-65
// @trace FR-104
// @trace FR-117
// @trace NFR-9
import { describe, expect, it } from 'vitest';
import { BLANK, installPageLifecycle, mountFixture, q } from './helpers/play-page';
import {
  TOKEN_NAMES,
  contrastRatio,
  darkRootRules,
  declarationsFor,
  lightRootRules,
  readStyleText,
  readStyles,
  rulesWithSelector,
  themeTokenSets,
} from './helpers/css';
import type { ParsedStyles, TokenSet } from './helpers/css';

installPageLifecycle();

const PLAIN = '.theme-control button';
const CHECKED = ".theme-control button[aria-checked='true']";

/** The token name of a value that is a single `var(--color-x)` of a token declared in :root, else undefined. */
function tokenOf(parsed: ParsedStyles, value: string | undefined): string | undefined {
  const name = /^var\(\s*(--color-[\w-]+)\s*\)$/.exec(value ?? '')?.[1];
  return name !== undefined && name in parsed.tokens ? name : undefined;
}

function hexOf(set: TokenSet, name: string): string {
  const value = set.tokens[name];
  expect.assert(value !== undefined && /^#[0-9a-f]{6}$/i.test(value), `${name} is #rrggbb in the ${set.label} token set`);
  return value;
}

describe('Effective theme on the document (the stylesheet half)', () => {
  it('The stylesheet sets color-scheme for each theme', () => {
    const parsed = readStyles();
    const colorScheme = (rules: ReturnType<typeof darkRootRules>): string[] =>
      rules.flatMap((rule) => rule.declarations.filter((d) => d.property === 'color-scheme').map((d) => d.value));
    expect(colorScheme(lightRootRules(parsed)), 'the top-level :root declares color-scheme: light').toEqual(['light']);
    expect(darkRootRules(parsed).length, 'a top-level :root[data-theme="dark"] rule exists').toBe(1);
    expect(colorScheme(darkRootRules(parsed)), ':root[data-theme="dark"] declares color-scheme: dark').toEqual(['dark']);
  });
});

describe('Borders, cues and focus rings have enough contrast (the dark set)', () => {
  it('Tokens exist and are literal: the dark block declares each of the 13 names once as #rrggbb, so each token has exactly two value sets', () => {
    const parsed = readStyles();
    expect(darkRootRules(parsed).length, 'a top-level :root[data-theme="dark"] rule exists').toBe(1);
    for (const name of TOKEN_NAMES) {
      const declarations = parsed.darkTokenDeclarations.filter((d) => d.property === name);
      expect(declarations, `${name} is declared once in :root[data-theme="dark"]`).toHaveLength(1);
      expect(declarations[0]?.value, `${name} is #rrggbb in the dark block`).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(parsed.darkTokenDeclarations, 'the dark block redefines the 13 tokens and adds none').toHaveLength(13);
    expect(themeTokenSets(parsed).map((set) => set.label), 'two value sets').toEqual(['light', 'dark']);
  });

  // GUARD: green before the implementation (the stylesheet has no such block today) and must stay green (Q13).
  it('The page has no prefers-color-scheme block', () => {
    expect(readStyleText()).not.toContain('prefers-color-scheme');
  });
});

describe('The theme options set their own colours', () => {
  it('The theme options declare their colours', () => {
    const root = mountFixture(BLANK);
    expect(q(root, '[data-control="theme"]').classList.contains('theme-control'), 'the theme control carries the class theme-control (a spec-made proxy)').toBe(true);
    const parsed = readStyles();
    for (const selector of [PLAIN, CHECKED]) {
      expect(rulesWithSelector(parsed, selector).length, `a rule for ${selector}`).toBeGreaterThan(0);
      const declarations = declarationsFor(parsed, selector);
      for (const property of ['color', 'background-color']) {
        const value = declarations.get(property);
        expect(tokenOf(parsed, value), `${selector} { ${property} } is a single var(--color-...) of a declared token (is ${value ?? 'missing'})`).toBeDefined();
      }
      expect(declarations.has('opacity'), `${selector} does not declare opacity`).toBe(false);
    }
  });

  it('Each state has 4.5:1 text in both themes', () => {
    const parsed = readStyles();
    const plain = declarationsFor(parsed, PLAIN);
    const checked = new Map([...plain, ...declarationsFor(parsed, CHECKED)]); // the checked rule laid over the plain rule
    const ratios: string[] = [];
    for (const set of themeTokenSets(parsed)) {
      for (const [state, declarations] of [['plain', plain], ['checked', checked]] as const) {
        const fg = tokenOf(parsed, declarations.get('color'));
        const bg = tokenOf(parsed, declarations.get('background-color'));
        expect.assert(fg !== undefined, `${state}: color is a single var(--color-...) of a declared token (is ${declarations.get('color') ?? 'missing'})`);
        expect.assert(bg !== undefined, `${state}: background-color is a single var(--color-...) of a declared token (is ${declarations.get('background-color') ?? 'missing'})`);
        const ratio = contrastRatio(hexOf(set, fg), hexOf(set, bg));
        ratios.push(`${set.label} ${state}`);
        expect(ratio, `${set.label} set, ${state}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(ratios, 'four ratios were computed: plain and checked in the light and in the dark set').toHaveLength(4);
  });

  // Reading of "declares a border-style, border-width, box-shadow or text-decoration that the plain rule does not": the checked rule has
  // one of them with a real value (not none / 0) that the plain rule lacks or declares with another value. The `border` shorthand counts
  // by its width and style only (a changed colour inside it is the colour cue the scenario says is not enough).
  it('The chosen option has a cue besides colour', () => {
    const parsed = readStyles();
    expect(rulesWithSelector(parsed, CHECKED).length, `a rule for ${CHECKED}`).toBeGreaterThan(0);
    const plain = declarationsFor(parsed, PLAIN);
    const checked = declarationsFor(parsed, CHECKED);
    const shape = (property: string, value: string | undefined): string | undefined =>
      value === undefined ? undefined : property === 'border' ? value.replace(/var\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() : value.trim();
    const cues = ['border-style', 'border-width', 'border', 'box-shadow', 'text-decoration', 'text-decoration-line'].filter((property) => {
      const own = shape(property, checked.get(property));
      if (own === undefined || /^(none|0|0px|medium)$/i.test(own)) return false;
      return own !== shape(property, plain.get(property));
    });
    expect(
      cues,
      `the checked rule declares a border-style, border-width, box-shadow or text-decoration that the plain rule does not (checked: ${[...checked.keys()].join(', ')})`,
    ).not.toEqual([]);
  });
});
