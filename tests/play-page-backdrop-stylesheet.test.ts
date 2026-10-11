// Play page: the backdrops of the surfaces, read from src/ui/style.css (update-page-backdrop, NFR-14 G2 block 3). One test per stylesheet scenario of the
// ADDED requirement «The backdrops take the design's translucent tokens» (openspec/changes/update-page-backdrop/specs/play-page/spec.md): the map of the
// five rules and tokens, no `opacity`, no colour literal and only the five selectors, strong darker than soft, the fade not ported. The composited pixel
// of the open surface is read in a real browser by e2e/nfr-14-backdrop.spec.ts (jsdom has no `::backdrop` box), so everything here is read as
// declarations, which is what the scenarios ask. Written FIRST (red) from the spec, before the implementation.
//
// Tests that pass today by design are marked GUARD in their comment and listed in docs/qa/update-page-backdrop/red-run.txt (section B) with the reason.
//
// @trace NFR-14
// @trace FR-65
import { describe, expect, it } from 'vitest';
import {
  CONTRAST_PAIRS,
  COLOUR_LITERAL,
  compositeOver,
  parseStyles,
  readStyleText,
  readStyles,
  relativeLuminance,
  rgbTripleOf,
  rulesWithSelector,
  themeTokenSets,
} from './helpers/css';
import type { ParsedStyles, StyleRuleInfo } from './helpers/css';

const SOFT = '--color-backdrop-soft';
const STRONG = '--color-backdrop-strong';
/** jsdom prints the prelude as `@media (min-width: 64rem)`; the pattern tolerates the spacing a hand-written file could use. */
const MEDIA_64REM = /^@media\s*\(\s*min-width\s*:\s*64rem\s*\)$/;

/** The five selectors of the table of the ADDED requirement, in the order of the scenario «Each surface takes its backdrop token», with their token. */
const MAP: { selector: string; token: string }[] = [
  { selector: '.rules::backdrop', token: SOFT },
  { selector: '.rules:popover-open::backdrop', token: STRONG },
  { selector: '.setup-sheet::backdrop', token: SOFT },
  { selector: '.settings::backdrop', token: SOFT },
  { selector: '.confirm::backdrop', token: STRONG },
];

/** Every rule (anywhere in the file, nested rules and at-rules included) that has a selector with `::backdrop`. */
const backdropRules = (parsed: ParsedStyles): StyleRuleInfo[] => parsed.rules.filter((rule) => rule.selectors.some((sel) => sel.includes('::backdrop')));

/** The last value of `property` that the rules declare. */
const lastValue = (rules: StyleRuleInfo[], property: string): string | undefined =>
  rules.flatMap((rule) => rule.declarations.filter((d) => d.property === property).map((d) => d.value)).at(-1);

const varOf = (value: string | undefined): string | undefined => /^var\(\s*(--color-[\w-]+)\s*\)$/.exec(value ?? '')?.[1];

describe('The backdrops take the design\'s translucent tokens (the stylesheet half)', () => {
  it('@trace NFR-14 @trace FR-65 Each surface takes its backdrop token: rules soft (strong from 64rem), setup sheet soft, settings soft, confirm strong', () => {
    const parsed = readStyles();
    const taken = MAP.map(({ selector }) => {
      const rules = rulesWithSelector(parsed, selector);
      expect(rules.length, `a rule for ${selector} exists in src/ui/style.css`).toBeGreaterThan(0);
      return varOf(lastValue(rules, 'background-color'));
    });
    expect(taken, 'the background-color of the five backdrop rules, in the order rules, rules from 64rem, setup sheet, settings, confirm').toEqual(
      MAP.map(({ token }) => token),
    );
    // the longhand, one var() each (the colour scan's longhand clause applies to it)
    for (const { selector } of MAP) {
      const declared = rulesWithSelector(parsed, selector).flatMap((rule) => rule.declarations.map((d) => d.property));
      expect(declared, `${selector} paints with background-color, not the background shorthand`).not.toContain('background');
    }
  });

  it('@trace NFR-14 @trace FR-65 Each surface takes its backdrop token: the four plain rules are declared once outside any at-rule, the strong rule of the rules panel only inside @media (min-width: 64rem)', () => {
    const parsed = readStyles();
    for (const selector of ['.rules::backdrop', '.setup-sheet::backdrop', '.settings::backdrop', '.confirm::backdrop']) {
      const rules = rulesWithSelector(parsed, selector);
      expect(rules.filter((rule) => rule.context.length === 0), `${selector} is declared once at the top level`).toHaveLength(1);
      expect(rules.filter((rule) => rule.context.length > 0).map((rule) => rule.context), `${selector} is declared nowhere else`).toEqual([]);
    }
    const strong = rulesWithSelector(parsed, '.rules:popover-open::backdrop');
    expect(strong, 'exactly one .rules:popover-open::backdrop rule exists (a missing rule would make "only inside 64rem" vacuously true)').toHaveLength(1);
    expect(strong[0]?.context.length, 'it sits inside exactly one at-rule').toBe(1);
    expect(strong[0]?.context[0] ?? '', 'and that at-rule is @media (min-width: 64rem)').toMatch(MEDIA_64REM);
    // the strong token is taken by those two rules only, the soft token by the other three; no .settings rule takes the strong one
    const takers = (token: string): string[] =>
      parsed.rules
        .filter((rule) => rule.declarations.some((d) => d.value.includes(`var(${token})`)))
        .flatMap((rule) => rule.selectors)
        .sort();
    expect(takers(STRONG), 'the rules that take --color-backdrop-strong').toEqual(['.confirm::backdrop', '.rules:popover-open::backdrop']);
    expect(takers(SOFT), 'the rules that take --color-backdrop-soft').toEqual(['.rules::backdrop', '.settings::backdrop', '.setup-sheet::backdrop']);
    expect(takers(STRONG).filter((sel) => sel.includes('.settings')), 'no .settings rule takes the strong token').toEqual([]);
  });

  it('@trace NFR-14 @trace FR-65 No backdrop rule sets opacity: no opacity, no colour literal, no color-mix(, only a backdrop token, and only the five selectors contain ::backdrop', () => {
    const parsed = readStyles();
    const rules = backdropRules(parsed);
    expect(rules.length, 'the walk found backdrop rules').toBeGreaterThan(0);
    const where = (rule: StyleRuleInfo): string => `${rule.context.join(' ')} ${rule.selectors.join(', ')}`.trim();
    const opacity = rules.filter((rule) => rule.declarations.some((d) => d.property === 'opacity')).map(where);
    expect(opacity, '::backdrop rules that declare opacity').toEqual([]);
    const literal = rules.flatMap((rule) =>
      rule.declarations.filter((d) => COLOUR_LITERAL.test(d.value) || d.value.includes('color-mix(')).map((d) => `${where(rule)} { ${d.property}: ${d.value} }`),
    );
    expect(literal, '::backdrop declarations with a colour literal or color-mix(').toEqual([]);
    const background = rules.flatMap((rule) =>
      rule.declarations.filter((d) => d.property === 'background-color').map((d) => ({ where: where(rule), token: varOf(d.value) })),
    );
    expect(background.length, 'every backdrop rule has a background-color').toBe(rules.length);
    expect(
      background.filter((b) => b.token !== SOFT && b.token !== STRONG).map((b) => b.where),
      'every background-color among them is a single var(--color-backdrop-soft) or var(--color-backdrop-strong)',
    ).toEqual([]);
    const tokensUsed = rules.flatMap((rule) => rule.declarations.flatMap((d) => [...d.value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => `${where(rule)} -> ${m[1] ?? ''}`)));
    expect(
      tokensUsed.filter((use) => !use.endsWith(`-> ${SOFT}`) && !use.endsWith(`-> ${STRONG}`)),
      'no ::backdrop rule takes a colour from any token other than the two backdrop tokens',
    ).toEqual([]);
    // the only selectors with ::backdrop are the five of the table: today's four dark overrides (:root[data-theme='dark'] .x::backdrop) are not among them
    const selectors = [...new Set(rules.flatMap((rule) => rule.selectors.filter((sel) => sel.includes('::backdrop'))))].sort();
    expect(selectors, 'the selectors that contain ::backdrop').toEqual(MAP.map(({ selector }) => selector).sort());
    expect(
      selectors.filter((sel) => sel.startsWith(':root[data-theme')),
      'no dark-only ::backdrop rule: the dark values come from the token set',
    ).toEqual([]);
  });

  it('@trace NFR-14 @trace FR-65 The strong backdrop dims more than the soft one: in each token set the strong composite is darker than the soft one, which is darker than the page', () => {
    const parsed = readStyles();
    const expected: Record<string, { soft: number[]; strong: number[]; softLuminance: number; strongLuminance: number }> = {
      light: { soft: [208, 198, 186], strong: [146, 134, 122], softLuminance: 0.5734, strongLuminance: 0.2457 },
      dark: { soft: [18, 15, 12], strong: [15, 12, 9], softLuminance: 0.005, strongLuminance: 0.0038 },
    };
    for (const set of themeTokenSets(parsed)) {
      const token = (name: string): string => {
        const value = set.tokens[name];
        expect.assert(value !== undefined, `${name} is declared in the ${set.label} token set`);
        return value;
      };
      const page = token('--color-page');
      const [soft, strong] = [compositeOver(token(SOFT), page), compositeOver(token(STRONG), page)];
      const want = expected[set.label];
      expect.assert(want !== undefined, `the ${set.label} set is one of light and dark`);
      expect([...soft], `${set.label}: the soft composite over ${page}`).toEqual(want.soft);
      expect([...strong], `${set.label}: the strong composite over ${page}`).toEqual(want.strong);
      expect(relativeLuminance(soft), `${set.label}: soft`).toBeCloseTo(want.softLuminance, 4);
      expect(relativeLuminance(strong), `${set.label}: strong`).toBeCloseTo(want.strongLuminance, 4);
      expect(relativeLuminance(strong), `${set.label}: the strong composite is darker than the soft one`).toBeLessThan(relativeLuminance(soft));
      expect(relativeLuminance(soft), `${set.label}: the soft composite is darker than the page`).toBeLessThan(relativeLuminance(rgbTripleOf(page)));
    }
  });

  // GUARD: green today by design. `tests/helpers/css.ts` lists the pairs of the spec and no backdrop is in one; the test keeps a later edit of
  // CONTRAST_PAIRS from adding one ("a translucent token is never the foreground or the background of a contrast pair").
  it('@trace NFR-14 @trace FR-65 The strong backdrop dims more than the soft one: neither backdrop token is the foreground or the background of any contrast pair', () => {
    expect(CONTRAST_PAIRS.length, 'the pair list is not empty').toBeGreaterThan(0);
    for (const pair of CONTRAST_PAIRS) {
      for (const name of [SOFT, STRONG]) {
        expect(pair.fg === name || pair.bg === name, `${pair.group}: ${pair.fg} on ${pair.bg}`).toBe(false);
      }
    }
  });
});

/** What is wrong, for the fade scenario, with the parsed rules of a stylesheet text (the walk throws on `@starting-style`, so that is read from the raw text). */
function fadeProblemsOfRules(parsed: ParsedStyles): string[] {
  const problems: string[] = [];
  for (const rule of backdropRules(parsed)) {
    const where = `${rule.context.join(' ')} ${rule.selectors.join(', ')}`.trim();
    for (const d of rule.declarations) {
      if (/^(transition|animation)/.test(d.property)) problems.push(`${where} { ${d.property}: ${d.value} }`);
    }
    if (rule.context.some((c) => /prefers-reduced-motion\s*:\s*no-preference/.test(c))) problems.push(`${where} is inside @media (prefers-reduced-motion: no-preference)`);
  }
  return problems;
}

/** The `@starting-style` blocks of a raw text that name a `::backdrop`, either in their body or in the selector of the rule that holds them. */
function startingStyleBackdrops(text: string): string[] {
  const css = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const found: string[] = [];
  for (const match of css.matchAll(/@starting-style/g)) {
    const at = match.index;
    // the block of the at-rule: from its first `{` to the matching `}`
    const open = css.indexOf('{', at);
    let depth = 0;
    let end = open;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}') depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    const own = css.slice(at, end + 1);
    // the prelude of the rule that holds it (nested form `.x::backdrop { @starting-style { ... } }`): scan back to the enclosing unmatched `{`
    let up = 0;
    let start = at;
    for (let i = at - 1; i >= 0; i -= 1) {
      if (css[i] === '}') up += 1;
      if (css[i] === '{') {
        if (up === 0) {
          start = i;
          break;
        }
        up -= 1;
      }
    }
    const holder = css.slice(css.lastIndexOf('}', start) + 1, start);
    if (own.includes('::backdrop') || holder.includes('::backdrop')) found.push(`${holder.trim()} ${own.replace(/\s+/g, ' ').slice(0, 80)}`.trim());
  }
  return found;
}

describe('The backdrop fade is not ported', () => {
  // GUARD: green today by design (the stylesheet has no transition, animation or @starting-style on a backdrop, and the scenario pins that a later block
  // changes it by its own delta). The two self-checks below prove the readers are not vacuous: they find a fade in a sample that has one.
  it('@trace NFR-14 @trace FR-65 The backdrop fade is not ported: no ::backdrop rule declares transition, transition-property or animation, and none is inside @media (prefers-reduced-motion: no-preference)', () => {
    const parsed = readStyles();
    expect(backdropRules(parsed).length, 'the walk found backdrop rules').toBeGreaterThan(0);
    expect(fadeProblemsOfRules(parsed)).toEqual([]);
  });

  // GUARD: green today by design, as above.
  it('@trace NFR-14 @trace FR-65 The backdrop fade is not ported: no @starting-style rule names a ::backdrop', () => {
    expect(startingStyleBackdrops(readStyleText())).toEqual([]);
  });

  // GUARD: self-check of the two readers above, on literal samples (green before the port).
  it('the fade readers are not vacuous: they find a transition, an animation, a reduced-motion wrapper and a @starting-style on a backdrop in a sample that has them', () => {
    const sample = parseStyles(`
      .a::backdrop { background-color: var(--color-backdrop-soft); transition: background-color 220ms; }
      .b::backdrop { animation: fade 1s; }
      @media (prefers-reduced-motion: no-preference) { .c::backdrop { background-color: var(--color-backdrop-soft); } }
      .d { transition: opacity 1s; }
    `);
    expect(fadeProblemsOfRules(sample)).toEqual([
      '.a::backdrop { transition: background-color 220ms }',
      '.b::backdrop { animation: fade 1s }',
      '@media (prefers-reduced-motion: no-preference) .c::backdrop is inside @media (prefers-reduced-motion: no-preference)',
    ]);
    expect(startingStyleBackdrops('.e::backdrop { background-color: red; } @starting-style { .e::backdrop { background-color: transparent; } }')).toHaveLength(1);
    expect(startingStyleBackdrops('.f::backdrop { @starting-style { background-color: transparent; } }'), 'the nested form').toHaveLength(1);
    expect(startingStyleBackdrops('@starting-style { .g { opacity: 0; } } /* @starting-style { .h::backdrop {} } */'), 'a rule that names no backdrop, and a comment').toEqual([]);
    expect(startingStyleBackdrops('.i::backdrop { color: red; }')).toEqual([]);
  });
});
