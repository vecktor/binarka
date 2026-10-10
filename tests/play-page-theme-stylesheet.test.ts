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
// add-english-version (FR-65, FR-107, FR-117, NFR-9; delta «The theme options set their own colours», scenario «The language options declare their
// colours and a cue»): the last block of this file asks the same of `.language-control button` and its checked rule. Nothing above changes.
//
// @trace FR-65
// @trace FR-107
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

// Review-gate fix round (autonomy-log row 129): the delta scenario «In dark every backdrop dims the page» of «Effective theme on the document».
describe('Effective theme on the document (the backdrops)', () => {
  it('In dark every backdrop dims the page', () => {
    const parsed = readStyles();
    const [, dark] = themeTokenSets(parsed);
    expect.assert(dark !== undefined, 'the dark token set exists');
    const page = dark.tokens['--color-page'];
    expect.assert(page !== undefined, 'the dark set has --color-page');
    for (const host of ['.rules', '.setup-sheet', '.settings', '.confirm']) {
      const darkSelector = new RegExp(`^:root\\[data-theme=["']dark["']\\] ${host.replace('.', '\\.')}::backdrop$`);
      const overrides = parsed.rules.filter((rule) => rule.context.length === 0 && rule.selectors.some((sel) => darkSelector.test(sel)));
      const rules = overrides.length > 0 ? overrides : rulesWithSelector(parsed, `${host}::backdrop`);
      const values = rules.flatMap((rule) => rule.declarations.filter((d) => d.property === 'background-color').map((d) => d.value));
      const value = values[values.length - 1];
      const name = /^var\(\s*(--color-[\w-]+)\s*\)$/.exec(value ?? '')?.[1];
      expect.assert(name !== undefined, `${host}::backdrop takes its background from a token in dark, got ${String(value)}`);
      const colour = dark.tokens[name];
      expect.assert(colour !== undefined, `${name} is in the dark set`);
      // no lighter than the page: at least the page's contrast against white
      expect(contrastRatio(colour, '#ffffff'), `${host}::backdrop (${name} = ${colour}) is no lighter than the dark --color-page ${page}`).toBeGreaterThanOrEqual(
        contrastRatio(page, '#ffffff'),
      );
    }
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

describe('The theme options set their own colours (the language options)', () => {
  const LANGUAGE_PLAIN = '.language-control button';
  const LANGUAGE_CHECKED = ".language-control button[aria-checked='true']";

  it('The language options declare their colours and a cue', () => {
    const root = mountFixture(BLANK);
    expect(q(root, '[data-control="language"]').classList.contains('language-control'), 'the language control carries the class language-control (a spec-made proxy)').toBe(true);
    const parsed = readStyles();
    for (const selector of [LANGUAGE_PLAIN, LANGUAGE_CHECKED]) {
      expect(rulesWithSelector(parsed, selector).length, `a rule for ${selector}`).toBeGreaterThan(0);
      const declarations = declarationsFor(parsed, selector);
      for (const property of ['color', 'background-color']) {
        const value = declarations.get(property);
        expect(tokenOf(parsed, value), `${selector} { ${property} } is a single var(--color-...) of a declared token (is ${value ?? 'missing'})`).toBeDefined();
      }
      expect(declarations.has('opacity'), `${selector} does not declare opacity`).toBe(false);
    }

    // the ratio of text to background is at least 4.5 in each state in the light and in the dark token set
    const plain = declarationsFor(parsed, LANGUAGE_PLAIN);
    const checked = new Map([...plain, ...declarationsFor(parsed, LANGUAGE_CHECKED)]); // the checked rule laid over the plain rule
    let ratios = 0;
    for (const set of themeTokenSets(parsed)) {
      for (const [state, declarations] of [['plain', plain], ['checked', checked]] as const) {
        const fg = tokenOf(parsed, declarations.get('color'));
        const bg = tokenOf(parsed, declarations.get('background-color'));
        expect.assert(fg !== undefined && bg !== undefined, `${state}: color and background-color are single tokens`);
        expect(contrastRatio(hexOf(set, fg), hexOf(set, bg)), `${set.label} set, ${state}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        ratios += 1;
      }
    }
    expect(ratios, 'four ratios were computed').toBe(4);

    // the checked rule declares a cue the plain rule does not (the reading of the theme test above)
    const shape = (property: string, value: string | undefined): string | undefined =>
      value === undefined ? undefined : property === 'border' ? value.replace(/var\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() : value.trim();
    const cues = ['border-style', 'border-width', 'border', 'box-shadow', 'text-decoration', 'text-decoration-line'].filter((property) => {
      const own = shape(property, declarationsFor(parsed, LANGUAGE_CHECKED).get(property));
      if (own === undefined || /^(none|0|0px|medium)$/i.test(own)) return false;
      return own !== shape(property, plain.get(property));
    });
    expect(cues, 'the checked rule declares a border-style, border-width, box-shadow or text-decoration that the plain rule does not').not.toEqual([]);
  });
});
