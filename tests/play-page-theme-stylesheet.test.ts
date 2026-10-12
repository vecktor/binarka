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
  PALETTE_DARK,
  TOKEN_NAMES,
  TRANSLUCENT_TOKENS,
  compositeOver,
  contrastRatio,
  darkRootRules,
  declarationsFor,
  lightRootRules,
  readStyleText,
  readStyles,
  relativeLuminance,
  rgbTripleOf,
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
//
// update-page-backdrop DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta 2 «Effective theme on the document», scenarios «In dark every backdrop dims the page»
// (restated) and «In light every backdrop dims the page» (added); proposal.md Impact row `tests/play-page-theme-stylesheet.test.ts:63-87`): the old
// check took `contrastRatio(colour, '#ffffff')` of the token a backdrop rule names, which throws on a translucent `#rrggbbaa` value. A backdrop is a
// translucent token (A-57), so it is checked COMPOSITED over the page (FR-65): the five backdrop rules (`.rules::backdrop`,
// `.rules:popover-open::backdrop` inside `@media (min-width: 64rem)`, `.setup-sheet::backdrop`, `.settings::backdrop`, `.confirm::backdrop`) are resolved
// to a token of the set, the token must be `#rrggbbaa`, its composite over the set's `--color-page` (`compositeOver`: per channel in sRGB, rounded) must
// have a lower relative luminance than the page, and the composites are the spec's; in dark the stylesheet has no `:root[data-theme…] …::backdrop` rule.
interface Backdrop {
  selector: string;
  /** a rule that must sit inside this media prelude (jsdom normalises it to `@media (min-width: 64rem)`) */
  media?: RegExp;
}
const BACKDROPS: Backdrop[] = [
  { selector: '.rules::backdrop' },
  { selector: '.rules:popover-open::backdrop', media: /^@media \(min-width: 64rem\)$/ },
  { selector: '.setup-sheet::backdrop' },
  { selector: '.settings::backdrop' },
  { selector: '.confirm::backdrop' },
];

/** What is wrong with the five backdrops in a token set, and the composite of each over that set's page (`rgb(r, g, b)`), in the order of `BACKDROPS`. */
function backdropsOver(parsed: ParsedStyles, set: TokenSet): { problems: string[]; composites: string[] } {
  const problems: string[] = [];
  const composites: string[] = [];
  const page = hexOf(set, '--color-page');
  const pageLuminance = relativeLuminance(rgbTripleOf(page));
  for (const { selector, media } of BACKDROPS) {
    const rules = rulesWithSelector(parsed, selector).filter((rule) => media === undefined || rule.context.some((c) => media.test(c)));
    if (rules.length === 0) {
      problems.push(`${selector}: no rule${media === undefined ? '' : ' inside @media (min-width: 64rem)'} in src/ui/style.css`);
      continue;
    }
    const values = rules.flatMap((rule) => rule.declarations.filter((d) => d.property === 'background-color').map((d) => d.value));
    const value = values[values.length - 1];
    const name = /^var\(\s*(--color-[\w-]+)\s*\)$/.exec(value ?? '')?.[1];
    if (name === undefined) {
      problems.push(`${selector}: background-color is not a single var(--color-...), got ${String(value)}`);
      continue;
    }
    const colour = set.tokens[name];
    if (colour === undefined || !/^#[0-9a-f]{8}$/i.test(colour)) {
      problems.push(`${selector}: ${name} (${String(colour)}) in the ${set.label} set is not a translucent token (#rrggbbaa)`);
      continue;
    }
    const composite = compositeOver(colour, page);
    composites.push(`rgb(${composite.join(', ')})`);
    const luminance = relativeLuminance(composite);
    if (!(luminance < pageLuminance)) {
      problems.push(`${selector}: ${name} over ${page} is rgb(${composite.join(', ')}), luminance ${luminance.toFixed(4)}, not lower than the page's ${pageLuminance.toFixed(4)}`);
    }
  }
  return { problems, composites };
}

describe('Effective theme on the document (the backdrops)', () => {
  it('In dark every backdrop dims the page', () => {
    const parsed = readStyles();
    const [, dark] = themeTokenSets(parsed);
    expect.assert(dark !== undefined, 'the dark token set exists');
    const { problems, composites } = backdropsOver(parsed, dark);
    expect(problems, 'each of the five backdrops is a translucent token of the dark set whose composite over the dark --color-page is darker than it').toEqual([]);
    // the page `#1a1714` has luminance 0.0088; the soft composite rgb(18, 15, 12) 0.0050, the strong rgb(15, 12, 9) 0.0038
    expect([...new Set(composites)].sort(), 'the composites are the soft and the strong one of the spec').toEqual(['rgb(15, 12, 9)', 'rgb(18, 15, 12)']);
    expect(relativeLuminance(rgbTripleOf(hexOf(dark, '--color-page'))), 'the dark --color-page').toBeCloseTo(0.0088, 4);
    expect(relativeLuminance([18, 15, 12])).toBeCloseTo(0.005, 4);
    expect(relativeLuminance([15, 12, 9])).toBeCloseTo(0.0038, 4);
    // the dark values come from the token set: no rule sets a ::backdrop colour for the dark theme only
    const overrides = parsed.rules.flatMap((rule) => rule.selectors.filter((sel) => sel.startsWith(':root[data-theme') && sel.includes('::backdrop')));
    expect(overrides, 'no selector that starts with :root[data-theme and contains ::backdrop').toEqual([]);
  });

  it('In light every backdrop dims the page', () => {
    const parsed = readStyles();
    const [light] = themeTokenSets(parsed);
    expect.assert(light !== undefined, 'the light token set exists');
    const { problems, composites } = backdropsOver(parsed, light);
    expect(problems, 'each of the five backdrops is a translucent token of the light set whose composite over the light --color-page is darker than it').toEqual([]);
    // the page `#f7f3ea` has luminance 0.8982; the soft composite rgb(208, 198, 186) 0.5734, the strong rgb(146, 134, 122) 0.2457
    expect([...new Set(composites)].sort(), 'the composites are the soft and the strong one of the spec').toEqual(['rgb(146, 134, 122)', 'rgb(208, 198, 186)']);
    expect(relativeLuminance(rgbTripleOf(hexOf(light, '--color-page'))), 'the light --color-page').toBeCloseTo(0.8982, 4);
    expect(relativeLuminance([208, 198, 186])).toBeCloseTo(0.5734, 4);
    expect(relativeLuminance([146, 134, 122])).toBeCloseTo(0.2457, 4);
  });
});

describe('Borders, cues and focus rings have enough contrast (the dark set)', () => {
  // update-page-palette DELIBERATE CHANGE (FR-65, A-51, A-57; delta «Borders, cues and focus rings have enough contrast», scenario «Tokens exist and
  // are literal», proposal.md Impact row `tests/play-page-theme-stylesheet.test.ts:90-100`): "the dark block redefines the 13 tokens and adds none"
  // becomes every token of the list of 25, each once, with the dark value of the list, `#rrggbbaa` for the translucent one only.
  // update-page-backdrop DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta 1 «Borders, cues and focus rings have enough contrast», scenario «Tokens exist
  // and are literal», proposal.md Impact row `tests/play-page-theme-stylesheet.test.ts:94-107`, comment 94-95 says "25"): the dark block declares the
  // 27 names of the list and adds none; `#rrggbbaa` for the three translucent tokens only.
  // update-panel-shell DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta 1 «Borders, cues and focus rings have enough contrast», scenario «Tokens exist and
  // are literal», proposal.md Impact row `tests/play-page-theme-stylesheet.test.ts:162, 165, 174`, comment 158-161): the title, `toHaveLength(27)` and
  // the message become 31; the dark block redefines the 31 names and adds none. Red on today's stylesheet: its dark block redefines 27.
  // DELIBERATE CHANGE (update-setup-sheet): the title, `toHaveLength(31)` and the message become 32; the dark block redefines the 32 names (the 32nd `--color-option-border`,
  // dark `#5a5045`) and adds none — proposal.md Impact row «Borders, cues and focus rings have enough contrast» (`tests/play-page-theme-stylesheet.test.ts` 165, 168, 177).
  // Red on today's stylesheet: its dark block redefines 31.
  // DELIBERATE CHANGE (update-confirm-dialog): the title, `toHaveLength(32)` and the message become 33; the dark block redefines the 33 names (the 33rd, `--color-violation-ink`,
  // dark `#ffb4ab`, after `--color-focus`) and adds none — proposal.md Impact row «Borders» (`tests/play-page-theme-stylesheet.test.ts` 168, 171, 180). Red on today's
  // stylesheet: its dark block redefines 32 and lacks `--color-violation-ink`.
  it('Tokens exist and are literal: the dark block declares each of the 33 names once with the dark value of the list, so each token has exactly two value sets', () => {
    const parsed = readStyles();
    expect(darkRootRules(parsed).length, 'a top-level :root[data-theme="dark"] rule exists').toBe(1);
    expect(TOKEN_NAMES).toHaveLength(33);
    for (const name of TOKEN_NAMES) {
      const declarations = parsed.darkTokenDeclarations.filter((d) => d.property === name);
      expect(declarations, `${name} is declared once in :root[data-theme="dark"]`).toHaveLength(1);
      expect(declarations[0]?.value.toLowerCase(), `${name} has the dark value of the list`).toBe(PALETTE_DARK[name]);
      expect(declarations[0]?.value, `${name} is ${TRANSLUCENT_TOKENS.has(name) ? '#rrggbbaa' : '#rrggbb'} in the dark block`).toMatch(
        TRANSLUCENT_TOKENS.has(name) ? /^#[0-9a-f]{8}$/i : /^#[0-9a-f]{6}$/i,
      );
    }
    expect(parsed.darkTokenDeclarations.map((d) => d.property).sort(), 'the dark block redefines the 33 tokens and adds none').toEqual([...TOKEN_NAMES].sort());
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
