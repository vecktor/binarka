// Play page: the G2 palette of the main column, read from src/ui/style.css, index.html and src/ui/preferences.ts (update-page-palette, NFR-14 G2
// block 2). One test per stylesheet scenario of the ADDED requirement «The main column takes the design palette» and per NEW scenario of the MODIFIED
// ones (openspec/changes/update-page-palette/specs/play-page/spec.md); the scenarios that existed before sit in play-page-stylesheet.test.ts and its
// neighbours. Written FIRST (red) from the spec, before the implementation. The computed paint of the page is compared with the design build in a
// real browser by e2e/nfr-14-palette.spec.ts (jsdom does not lay out, and applies no @media or nested rule to computed style), so everything here is
// read as declarations, which is what the scenarios ask.
//
// Tests that pass today by design are marked GUARD in their comment and listed in docs/qa/update-page-palette/red-run.txt with the reason.
//
// @trace NFR-14
// @trace FR-65
// @trace FR-64
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DARK_LABEL,
  PALETTE_LIGHT,
  TOKEN_NAMES,
  contrastProblems,
  contrastRatio,
  darkRootRules,
  declarationsFor,
  lightRootRules,
  readStyleText,
  readStyles,
  scanColours,
  themeTokenSets,
} from './helpers/css';
import type { ParsedStyles, StyleRuleInfo, TokenSet } from './helpers/css';
import { CONTRAST_PAIRS } from './helpers/css';

/** A selector with its attribute quotes normalised to single quotes (jsdom keeps the quote style of the file). */
const norm = (selector: string): string => selector.replaceAll('"', "'");

/** The rules (anywhere in the file) one of whose selectors equals `selector` after the quotes are normalised. */
function rulesFor(parsed: ParsedStyles, selector: string): StyleRuleInfo[] {
  return parsed.rules.filter((r) => r.selectors.some((s) => norm(s) === norm(selector)));
}

/** property -> value merged over the rules of `rulesFor` in source order. */
function declared(parsed: ParsedStyles, selector: string): Map<string, string> {
  const merged = new Map<string, string>();
  for (const rule of rulesFor(parsed, selector)) for (const d of rule.declarations) merged.set(d.property, d.value);
  return merged;
}

/** The `#rrggbb` value of an opaque token of a token set, asserted. */
function tokenIn(set: TokenSet, name: string): string {
  const value = set.tokens[name];
  expect.assert(value !== undefined && /^#[0-9a-f]{6}$/i.test(value), `${name} is #rrggbb in the ${set.label} token set`);
  return value;
}

const ratio2 = (a: string, b: string): number => Number(contrastRatio(a, b).toFixed(2));

/** The rules outside the two token rules. */
const outsideRoot = (parsed: ParsedStyles): StyleRuleInfo[] => {
  const root = new Set([...lightRootRules(parsed), ...darkRootRules(parsed)]);
  return parsed.rules.filter((r) => !root.has(r));
};

// ---------------------------------------------------------------------------------------------------------
// «Borders, cues and focus rings have enough contrast» (MODIFIED): the new scenarios
// ---------------------------------------------------------------------------------------------------------

describe('Borders, cues and focus rings have enough contrast (the G2 palette)', () => {
  // update-page-backdrop DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta 1 «Borders, cues and focus rings have enough contrast», scenario «Every declared token
  // is bound by a rule», proposal.md Impact row `tests/play-page-palette-stylesheet.test.ts:67`): only the title text "25" becomes "27"; the body
  // reads `TOKEN_NAMES` and so now requires the two backdrop tokens to be bound by a rule outside `:root`.
  // update-panel-shell DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta 1 «Borders, cues and focus rings have enough contrast», scenario «Every declared token
  // is bound by a rule», proposal.md Impact row `tests/play-page-palette-stylesheet.test.ts:70` (comment 67-69)): only the title "27" becomes "31"; the body
  // reads `TOKEN_NAMES`, so it now requires the four shell tokens to be bound by a rule outside `:root`. Red on today's stylesheet: no rule references them.
  // DELIBERATE CHANGE (update-setup-sheet): only the title "31" becomes "32"; the body reads `TOKEN_NAMES`, so it now requires `--color-option-border` to be bound by a rule outside
  // `:root` — proposal.md Impact row «Borders, cues and focus rings have enough contrast» (`tests/play-page-palette-stylesheet.test.ts` 71-73). Red on today's stylesheet: no rule references it.
  // DELIBERATE CHANGE (update-confirm-dialog): only the title "32" becomes "33"; the body reads `TOKEN_NAMES`, so it now requires `--color-violation-ink` to be bound by a rule outside
  // `:root` — proposal.md Impact row «Borders» (`tests/play-page-palette-stylesheet.test.ts` 75). Red on today's stylesheet: no rule references it.
  it('Every declared token is bound by a rule: each of the 33 tokens is referenced by a declaration outside :root', () => {
    const parsed = readStyles();
    const declarations = outsideRoot(parsed).flatMap((r) => r.declarations.map((d) => ({ where: r.selectors.join(', '), ...d })));
    expect(declarations.length, 'the walk found declarations').toBeGreaterThan(50);
    const unbound = TOKEN_NAMES.filter((name) => {
      const reference = new RegExp(`var\\(\\s*${name}\\s*[,)]`);
      return !declarations.some((d) => reference.test(d.value));
    });
    expect(unbound, 'tokens no declaration outside :root references').toEqual([]);
  });

  // The rule of the spec's list «No rule uses color: var(--color-control-border)» (C13 of the palette amendment): the idle line and the `.mini-sep`
  // separator take the muted text colour, because the control border is a 3:1 border colour and not a 4.5:1 text colour.
  it('No declaration of color has the value var(--color-control-border); the idle line takes --color-text-muted', () => {
    const parsed = readStyles();
    const offending = outsideRoot(parsed).flatMap((r) =>
      r.declarations.filter((d) => d.property === 'color' && /^var\(\s*--color-control-border\s*\)$/.test(d.value)).map((d) => `${r.selectors.join(', ')} { color: ${d.value} }`),
    );
    expect(offending, 'rules that use the control border as a text colour').toEqual([]);
    expect(declared(parsed, '.message-idle').get('color'), '.message-idle { color }').toBe('var(--color-text-muted)');
  });

  // DELIBERATE CHANGE (update-settings-panel, delta «Cells and buttons show a visible, unobscured focus indicator», scenario «The ring's accepted adjacencies are recorded»; proposal.md
  // Impact row tests/play-page-palette-stylesheet.test.ts:97, source FR-65, A-61): the title gains the card fill under a chosen segmented option, and the body gains three assertions (marked
  // GUARD below: they pass today by design, because the tokens and the pair list already satisfy them, and they pin the adjacency so that a change that moves it is deliberate).
  it('The ring keeps its accepted adjacencies: --color-focus against the plate, the violation border, the primary and the success border, and its outer band on the card fill under a chosen segmented option (light and dark)', () => {
    const parsed = readStyles();
    const listed: Record<string, number[]> = { light: [11.72, 2.47, 2.94, 2.53], dark: [10.65, 1.96, 1.88, 1.53] };
    for (const set of themeTokenSets(parsed)) {
      const focus = tokenIn(set, '--color-focus');
      const ratios = ['--color-line', '--color-violation-border', '--color-primary', '--color-success'].map((name) => ratio2(focus, tokenIn(set, name)));
      expect(ratios, `${set.label}: the ring on the plate, then on the three accepted neighbours`).toEqual(listed[set.label]);
      expect(ratios[0], `${set.label}: the plate keeps the inner band at 10.65 or more`).toBeGreaterThanOrEqual(10.65);
    }
    // none of the three accepted neighbours is a contrast pair of the requirement
    const accepted = CONTRAST_PAIRS.filter(
      (pair) => pair.fg === '--color-focus' && ['--color-violation-border', '--color-primary', '--color-success'].includes(pair.bg),
    );
    expect(accepted, 'the accepted adjacencies are not listed as contrast pairs').toEqual([]);
    // GUARD (passes today): the outer band of the ring of a chosen segmented option lies on the card fill --color-control-bg, 15.88 light and 13.85 dark (at least 13.85 in each set);
    // --color-control-bg and --color-cell-bg resolve to one value in each set; and no pair of the requirement names --color-focus against --color-control-bg (--color-cell-bg is paired).
    const onCard: Record<string, number> = { light: 15.88, dark: 13.85 };
    for (const set of themeTokenSets(parsed)) {
      const card = tokenIn(set, '--color-control-bg');
      const ratio = ratio2(tokenIn(set, '--color-focus'), card);
      expect(ratio, `${set.label}: the ring on the card fill --color-control-bg`).toBe(onCard[set.label]);
      expect(ratio, `${set.label}: the ring on the card fill is at least 13.85`).toBeGreaterThanOrEqual(13.85);
      expect(card, `${set.label}: --color-control-bg equals --color-cell-bg`).toBe(tokenIn(set, '--color-cell-bg'));
    }
    expect(
      CONTRAST_PAIRS.filter((pair) => pair.fg === '--color-focus' && pair.bg === '--color-control-bg'),
      'no pair names --color-focus against --color-control-bg (--color-cell-bg, the same value, is paired)',
    ).toEqual([]);
  });

  it('The hinted cue and the primary colour have 3:1 against the soft fill, the plate and the page (light and dark)', () => {
    const parsed = readStyles();
    const listed: Record<string, number[]> = { light: [4.41, 3.99, 4.96], dark: [6.13, 5.68, 8.15] };
    for (const set of themeTokenSets(parsed)) {
      const primary = tokenIn(set, '--color-primary');
      const ratios = ['--color-primary-soft', '--color-line', '--color-page'].map((name) => ratio2(primary, tokenIn(set, name)));
      expect(ratios, `${set.label}: --color-primary on the soft fill, the plate and the page`).toEqual(listed[set.label]);
      expect(contrastProblems(set.tokens, ['hinted-cue']), `${set.label} token set`).toEqual([]);
    }
  });

  // GUARD: the declaration half of «The hinted cue and the primary colour have 3:1» is true of today's `.cell-hinted` (dashed, 2px, italic) and
  // must stay true: these are the cues that are not colour.
  it('GUARD .cell-hinted declares a 2px dashed border and italic besides the colours, so the hinted cell has cues that are not colour', () => {
    const hinted = declared(readStyles(), '.cell-hinted');
    expect(hinted.get('border-style')).toBe('dashed');
    expect(hinted.get('border-width')).toBe('2px');
    expect(hinted.get('font-style')).toBe('italic');
  });

  it('Violation text has 4.5:1 on the violation fill and on the darkest band of the stripe, and the stripe is below 3:1 against the fill (light and dark)', () => {
    const parsed = readStyles();
    const listed: Record<string, { stripe: number; text: [number, number] }> = {
      light: { stripe: 1.24, text: [7.34, 5.9] },
      dark: { stripe: 1.35, text: [6.24, 4.61] },
    };
    for (const set of themeTokenSets(parsed)) {
      const text = tokenIn(set, '--color-violation-text');
      const stripe = tokenIn(set, '--color-violation-stripe');
      const fill = tokenIn(set, '--color-violation-bg');
      expect([ratio2(text, fill), ratio2(text, stripe)], `${set.label}: the violating digit on the fill and on the stripe`).toEqual(listed[set.label]?.text);
      expect(ratio2(stripe, fill), `${set.label}: the stripe against the fill`).toBe(listed[set.label]?.stripe);
      expect(contrastRatio(stripe, fill), `${set.label}: the stripe is decoration, not a cue`).toBeLessThan(3);
    }
  });

  // GUARD: today's file has exactly the two value sets (light, dark) and no conditional `:root` block, as the spec says of the shipped stylesheet.
  it('GUARD The shipped stylesheet has exactly the two value sets and no conditional :root block', () => {
    expect(readStyles().tokenSets.map((set) => set.label)).toEqual(['top-level', DARK_LABEL]);
  });

  it('The light page colour of the palette is the page colour of the spec: #f7f3ea (light) and #1a1714 (dark)', () => {
    const [light, dark] = themeTokenSets(readStyles());
    expect(light?.tokens['--color-page']?.toLowerCase()).toBe(PALETTE_LIGHT['--color-page']);
    expect(dark?.tokens['--color-page']?.toLowerCase()).toBe('#1a1714');
  });
});

// ---------------------------------------------------------------------------------------------------------
// «A violation shows a cue besides colour» (MODIFIED): the new scenarios
// ---------------------------------------------------------------------------------------------------------

describe('A violation shows a cue besides colour (longhands and the stripe)', () => {
  it('The violating digit is underlined with longhands: text-decoration-line underline and thickness 2px; the reset button underlined; no shorthand', () => {
    const parsed = readStyles();
    const violation = declared(parsed, '.cell-violation');
    const reset = declared(parsed, ".buttons button[data-action='reset']");
    expect(violation.get('text-decoration-line'), '.cell-violation { text-decoration-line }').toBe('underline');
    expect(violation.get('text-decoration-thickness'), '.cell-violation { text-decoration-thickness }').toBe('2px');
    expect(reset.get('text-decoration-line'), "the «Скинути» rule { text-decoration-line }").toBe('underline');
    expect(violation.has('text-decoration'), '.cell-violation declares no text-decoration shorthand').toBe(false);
    expect(reset.has('text-decoration'), 'the «Скинути» rule declares no text-decoration shorthand').toBe(false);
  });

  it('The stripe is a gradient of the stripe token and transparent: a repeating linear gradient whose colour stops are --color-violation-stripe and transparent', () => {
    const value = declared(readStyles(), '.cell-violation').get('background-image');
    expect.assert(value !== undefined, '.cell-violation declares background-image');
    expect(value, 'a repeating linear gradient').toMatch(/^repeating-linear-gradient\(/);
    const inner = value.slice(value.indexOf('(') + 1, value.lastIndexOf(')'));
    // split on top-level commas; the first argument is the angle, the others are `<colour> <length>` stops
    const parts: string[] = [];
    let depth = 0;
    let current = '';
    for (const ch of inner) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth -= 1;
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else current += ch;
    }
    parts.push(current.trim());
    const colours = new Set(parts.slice(1).map((stop) => stop.replace(/\s+\S+$/, '')));
    expect([...colours].sort(), 'the colour stops').toEqual(['transparent', 'var(--color-violation-stripe)']);
  });
});

// ---------------------------------------------------------------------------------------------------------
// «The main column takes the design palette» (ADDED): the stylesheet scenarios
// ---------------------------------------------------------------------------------------------------------

describe('The main column takes the design palette (the stylesheet scenarios)', () => {
  const SOLVED = ".board-host[data-solved='true']";

  it('The solved paint and the win swap are keyed on the host hook: the plate, the ring, the cells and the two buttons, and no second :has(', () => {
    const parsed = readStyles();
    const solved = declared(parsed, `${SOLVED} .board`);
    expect(solved.get('border-color'), 'solved board border').toBe('var(--color-success)');
    expect(solved.get('background-color'), 'solved board plate').toBe('var(--color-success-bg)');
    expect(solved.get('box-shadow'), 'solved board ring: a 1px ring of the success colour').toBe('0 0 0 1px var(--color-success)');
    const cell = declared(parsed, `${SOLVED} .cell`);
    expect(cell.get('box-shadow'), 'solved cell box-shadow').toBe('none');
    expect(cell.get('cursor'), 'solved cell cursor').toBe('default');
    const fresh = declared(parsed, `${SOLVED} ~ .buttons button[data-action='new']`);
    expect([fresh.get('border-color'), fresh.get('background-color'), fresh.get('color'), fresh.get('font-weight')], '«Нова головоломка» after a win: filled').toEqual([
      'var(--color-primary)',
      'var(--color-primary)',
      'var(--color-primary-text)',
      '700',
    ]);
    const hint = declared(parsed, `${SOLVED} ~ .buttons button[data-action='hint']`);
    expect([hint.get('border-color'), hint.get('background-color'), hint.get('color'), hint.get('font-weight')], '«Підказка» after a win: muted').toEqual([
      'var(--color-control-border)',
      'var(--color-control-bg)',
      'var(--color-text-muted)',
      '500',
    ]);
  });

  // GUARD: the second half of the scenario is true of today's file (one :has(, none on .board[data-solved) and must stay true.
  it("GUARD The raw text has :has( exactly once (the idle-line rule) and no selector contains .board[data-solved", () => {
    const parsed = readStyles();
    expect(readStyleText().match(/:has\(/g) ?? []).toHaveLength(1);
    const withHas = parsed.rules.filter((r) => r.selectors.some((s) => s.includes(':has(')));
    expect(withHas.flatMap((r) => r.selectors).every((s) => s.includes('.message-idle')), 'the one :has( selector is the idle-line rule').toBe(true);
    expect(parsed.rules.flatMap((r) => r.selectors).filter((s) => norm(s).includes(".board[data-solved")), 'selectors on the design hook').toEqual([]);
  });

  it('The action row states its transparent fills and borders: .buttons button and the «Скинути» rule declare border-color and background-color transparent', () => {
    const parsed = readStyles();
    const row = declared(parsed, '.buttons button');
    expect(row.get('border-color'), '.buttons button { border-color }').toBe('transparent');
    expect(row.get('background-color'), '.buttons button { background-color }').toBe('transparent');
    const reset = declared(parsed, ".buttons button[data-action='reset']");
    expect([reset.get('color'), reset.get('border-color'), reset.get('background-color'), reset.get('text-decoration-line')], 'the «Скинути» rule').toEqual([
      'var(--color-text-muted)',
      'transparent',
      'transparent',
      'underline',
    ]);
  });

  it('The hover ring comes from the hover token: inset 0 0 0 2px var(--color-hover-ring) on a non-given cell of an unsolved board, and no color-mix(', () => {
    const parsed = readStyles();
    const hover = parsed.rules.filter((r) => r.selectors.some((s) => norm(s).endsWith('.cell:not(.cell-given):hover')));
    expect(hover.length, 'a rule whose selector ends with .cell:not(.cell-given):hover').toBeGreaterThan(0);
    for (const rule of hover) {
      expect(rule.selectors.every((s) => norm(s).includes(":not([data-solved='true'])")), `${rule.selectors.join(', ')} applies only to an unsolved board`).toBe(true);
      expect(rule.declarations.find((d) => d.property === 'box-shadow')?.value, `${rule.selectors.join(', ')} { box-shadow }`).toBe('inset 0 0 0 2px var(--color-hover-ring)');
    }
    const colorMix = parsed.rules.flatMap((r) => r.declarations.filter((d) => d.value.includes('color-mix(')));
    expect(colorMix, 'no declaration contains color-mix(').toEqual([]);
    expect(readStyleText(), 'and the file text has none').not.toContain('color-mix(');
  });

  // GUARD once task 1.1 has frozen the fixture (green by construction: the freeze script samples no hover state).
  it('GUARD The fixture has no hover case: hover is not captured', () => {
    expect.assert(existsSync('quality/design-paint.json'), 'quality/design-paint.json exists (task 1.1)');
    const fixture = JSON.parse(readFileSync('quality/design-paint.json', 'utf8')) as { cases: { shot: string; state: string }[] };
    expect(fixture.cases.length).toBeGreaterThan(0);
    expect(fixture.cases.filter((c) => /hover|active|pressed/i.test(`${c.shot} ${c.state}`))).toEqual([]);
  });

  it('The win glow comes from the glow token: keyframes glow from success and the glow token to transparent, applied under prefers-reduced-motion: no-preference', () => {
    const parsed = readStyles();
    const frame = (key: string): StyleRuleInfo | undefined => parsed.rules.find((r) => r.selectors.includes(`@keyframes glow ${key}`));
    const first = frame('0%');
    const last = frame('100%');
    expect.assert(first !== undefined, '@keyframes glow has a first keyframe');
    expect.assert(last !== undefined, '@keyframes glow has a last keyframe');
    const from = first.declarations.find((d) => d.property === 'box-shadow')?.value ?? '';
    const to = last.declarations.find((d) => d.property === 'box-shadow')?.value ?? '';
    expect(from, 'the first keyframe is a ring of the success colour and a ring of the glow token').toContain('var(--color-success)');
    expect(from).toContain('var(--color-success-glow)');
    expect(to, 'the last keyframe ends in transparent').toContain('transparent');
    for (const value of [from, to]) {
      expect(value, 'no colour literal in a keyframe').not.toMatch(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|color-mix)\(/i);
    }
    const applying = parsed.rules.filter((r) => r.declarations.some((d) => d.property === 'animation' && /^glow\b/.test(d.value)));
    expect(applying.length, 'a rule that sets animation: glow').toBeGreaterThan(0);
    for (const rule of applying) {
      expect(rule.selectors.map(norm), 'it selects the solved board').toEqual([`${SOLVED} .board`]);
      expect(rule.context.map((c) => c.replace(/\s+/g, ' ')), 'inside prefers-reduced-motion: no-preference').toContain('@media (prefers-reduced-motion: no-preference)');
    }
  });

  // GUARD: today's `:root` holds only the colour tokens and color-scheme, and the file declares no --hover-filter (block 2 does not port the hover
  // filter, design.md decision 8). The test guards the place if a later block ports it.
  it('GUARD Non-colour variables are not declared in the root: :root holds only --color-* and color-scheme, and --hover-filter, if any, is on #app', () => {
    const parsed = readStyles();
    for (const rule of [...lightRootRules(parsed), ...darkRootRules(parsed)]) {
      const foreign = rule.declarations.map((d) => d.property).filter((p) => !p.startsWith('--color-') && p !== 'color-scheme');
      expect(foreign, `${rule.selectors.join(', ')} declares only tokens and color-scheme`).toEqual([]);
    }
    const filterRules = parsed.rules.filter((r) => r.declarations.some((d) => d.property === '--hover-filter'));
    for (const rule of filterRules) {
      expect(rule.selectors.map(norm).every((s) => s === '#app' || s === ":root[data-theme='dark'] #app"), `${rule.selectors.join(', ')} declares --hover-filter`).toBe(true);
    }
  });

  // GUARD: today's file passes the colour scan (tokens only, no literal, no named colour); the port must keep it so, keyframes and gradients included.
  it('GUARD The colour scan still holds on the palette stylesheet: no literal, no named colour, tokens only (keyframes and gradients included)', () => {
    const scan = scanColours(readStyles());
    expect(scan).toEqual({ literals: [], named: [], shorthands: [], tokensOutsideRoot: [], colourProperties: [] });
    expect(declarationsFor(readStyles(), 'body').get('background-color')).toBe('var(--color-page)');
  });
});

// ---------------------------------------------------------------------------------------------------------
// The three copies of the light page colour (FR-106, FR-116; ADDED scenario «The light page colour has three copies that agree»)
// ---------------------------------------------------------------------------------------------------------

describe('The light page colour has three copies that agree', () => {
  it('The theme-color meta, the head step and THEME_COLOR_LIGHT all equal #f7f3ea, which is the light --color-page; the dark copies stay #1a1714', () => {
    const html = readFileSync('index.html', 'utf8');
    const preferences = readFileSync('src/ui/preferences.ts', 'utf8');
    const meta = /<meta\s+name="theme-color"\s+content="(#[0-9a-fA-F]{6})"/.exec(html)?.[1]?.toLowerCase();
    const step = /setAttribute\('content',\s*t === 'dark' \? '(#[0-9a-fA-F]{6})' : '(#[0-9a-fA-F]{6})'\)/.exec(html);
    const light = /THEME_COLOR_LIGHT\s*=\s*'(#[0-9a-fA-F]{6})'/.exec(preferences)?.[1]?.toLowerCase();
    const dark = /THEME_COLOR_DARK\s*=\s*'(#[0-9a-fA-F]{6})'/.exec(preferences)?.[1]?.toLowerCase();
    expect.assert(meta !== undefined, 'index.html has a theme-color meta with a #rrggbb content');
    expect.assert(step !== null, 'the head step of index.html sets the theme-color content from t');
    const [stepDark, stepLight] = [step[1]?.toLowerCase(), step[2]?.toLowerCase()];
    const [sheetLight] = themeTokenSets(readStyles()).map((set) => set.tokens['--color-page']?.toLowerCase());
    expect(sheetLight, 'the light --color-page of the stylesheet').toBe('#f7f3ea');
    expect(meta, 'the theme-color meta').toBe('#f7f3ea');
    expect(stepLight, "the head step's light value").toBe('#f7f3ea');
    expect(light, 'THEME_COLOR_LIGHT').toBe('#f7f3ea');
    expect([stepDark, dark], 'the dark copies stay').toEqual(['#1a1714', '#1a1714']);
  });
});
