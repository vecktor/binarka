// Play page: the rules panel's size, place and paint, read from src/ui/style.css (update-rules-panel, G2 block A, NFR-14, FR-57, FR-65, A-59). One or more
// tests per stylesheet scenario of the ADDED requirement «The rules panel takes the design's size, place and paint» in
// openspec/changes/update-rules-panel/specs/play-page/spec.md. Written FIRST (red) from the spec, before the port.
//
// HOW IT READS THE FILE (verified in jsdom 29 before this file was written; docs/qa/update-rules-panel/folder-audit.md, R1, R4):
//  - jsdom's CSSOM keeps only the LAST of two `max-height` declarations and DROPS a `padding` shorthand that holds `env()`, so those two checks read the raw text of
//    the top-level `.rules` rule (the shell's tests do the same for their raw counts). Everything else is read from the parsed rules (`readStyles`).
//  - jsdom serialises a zero length as `0px` and keeps a shorthand such as `margin: 6rem auto auto`; a declared value is compared with whitespace removed and with a
//    bare zero equal to `0px` (`norm` below), on both sides.
//  - Source order: `parsed.rules` is in file order, so "later in the file" is an index comparison. The two 48rem blocks of the file have the same at-rule text, so the
//    context alone cannot tell them apart; the index can.
//  - The panel's rules are the ones the requirement defines (selector `.rules`, or starting `.rules `, `.rules:`, `.rules>`, `.rules >`, `.rules[`, or `.rules-close`,
//    `.rule-example`, `.mini`, `.mini-answer`, `.mini-sep`); NEVER `.rules-button`, the header's «Правила» button.
//  - The computed style is jsdom's cascade of the TOP-LEVEL rules after `injectPageStyles(tokens)` (it applies no @media rule); `.rules-close` is a top-level rule.
// The browser half (the box of the open panel against the design, the opening at the top, the ring) is e2e/nfr-14-rules-panel.spec.ts; jsdom has no layout, so
// nothing here claims a size or a place, only the declarations the scenarios name.
//
// Tests that pass today by design are marked GUARD in their name (the value is already the design's, or the test pins what the port must not break).
//
// @trace FR-57
// @trace FR-65
// @trace NFR-14
import { describe, expect, it } from 'vitest';
import { CONTRAST_PAIRS, TOKEN_NAMES, contrastRatio, injectPageStyles, readStyleText, readStyles, rgbOf, scanColours, themeTokenSets } from './helpers/css';
import type { ParsedStyles, StyleRuleInfo } from './helpers/css';
import { WIN_PUZZLE, installPageLifecycle, mountFixture, q, rulesPanel } from './helpers/play-page';

installPageLifecycle();

// ---------------------------------------------------------------------------------------------------------
// Reading helpers
// ---------------------------------------------------------------------------------------------------------

/** A value with a bare zero turned into `0px`, then all whitespace removed: the comparison of the scenarios ("whitespace aside", zero equal to `0px`). */
const norm = (value: string): string => value.replace(/(?<![\w.%-])0(?![\w.%-])/g, '0px').replace(/\s+/g, '');
/** A selector with one quote style and no space around `>`. */
const normSel = (selector: string): string => selector.replace(/"/g, "'").replace(/\s*>\s*/g, '>').replace(/\s+/g, ' ').trim();

const MEDIA_22 = /^@media\s*\(\s*max-width\s*:\s*22\.5rem\s*\)$/;
const MEDIA_48 = /^@media\s*\(\s*min-width\s*:\s*48rem\s*\)$/;
const MEDIA_64 = /^@media\s*\(\s*min-width\s*:\s*64rem\s*\)$/;
const inMedia = (rule: StyleRuleInfo, media: RegExp): boolean => rule.context.length === 1 && media.test(rule.context[0] ?? '');

/** The rules whose selector list is exactly `selector` (not `.rules h2`, not a list, not a pseudo-element). */
const exact = (parsed: ParsedStyles, selector: string): StyleRuleInfo[] =>
  parsed.rules.filter((r) => r.selectors.length === 1 && normSel(r.selectors[0] ?? '') === normSel(selector));
const topLevel = (rules: StyleRuleInfo[]): StyleRuleInfo[] => rules.filter((r) => r.context.length === 0);
const inside = (rules: StyleRuleInfo[], media: RegExp): StyleRuleInfo[] => rules.filter((r) => inMedia(r, media));
const raw = (rule: StyleRuleInfo, property: string): string | undefined => rule.declarations.find((d) => d.property === property)?.value;
const valueOf = (rule: StyleRuleInfo, property: string): string | undefined => {
  const value = raw(rule, property);
  return value === undefined ? undefined : norm(value);
};
const where = (rule: StyleRuleInfo): string => `${rule.context.join(' ')} ${rule.selectors.join(', ')}`.trim();
const indexOfRule = (parsed: ParsedStyles, rule: StyleRuleInfo): number => parsed.rules.indexOf(rule);

/** The first rule of `rules`; the caller has asserted that there is one. */
function first(rules: StyleRuleInfo[]): StyleRuleInfo {
  const rule = rules[0];
  expect.assert(rule !== undefined, 'a rule exists');
  return rule;
}

/** The one rule of `rules`, or an assertion failure that names `label`. */
function only(rules: StyleRuleInfo[], label: string): StyleRuleInfo {
  expect(rules.map(where), `${label}: exactly one rule`).toHaveLength(1);
  const rule = rules[0];
  expect.assert(rule !== undefined, `${label}: the rule exists`);
  return rule;
}

/** Each declaration of `want` is on `rule` with that value (both sides through `norm`). */
function expectDeclarations(rule: StyleRuleInfo, want: Record<string, string>, label: string): void {
  for (const [property, value] of Object.entries(want)) {
    expect(valueOf(rule, property), `${label} { ${property}: ${value} }`).toBe(norm(value));
  }
}

/** The panel's rules, as the requirement defines them: never `.rules-button`. */
const PANEL_EXACT = new Set(['.rules', '.rules-close', '.rule-example', '.mini', '.mini-answer', '.mini-sep']);
const isPanelSelector = (selector: string): boolean => {
  const s = normSel(selector);
  return PANEL_EXACT.has(s) || /^\.rules[ :>[]/.test(s);
};
const panelRules = (parsed: ParsedStyles): StyleRuleInfo[] => parsed.rules.filter((r) => r.selectors.some(isPanelSelector));

/** The comment-free raw text, so braces and selectors inside a comment are not read. */
const stripComments = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '');

/** The bodies of the blocks whose selector is exactly `selector` and that sit outside every at-rule (brace depth 0) in the raw text. */
function topLevelBodies(text: string, selector: string): string[] {
  const t = stripComments(text);
  const bodies: string[] = [];
  let depth = 0;
  let start = 0;
  let prelude = '';
  let bodyStart = 0;
  for (let i = 0; i < t.length; i += 1) {
    const ch = t[i];
    if (ch === '{') {
      if (depth === 0) {
        prelude = t.slice(start, i).trim();
        bodyStart = i + 1;
      }
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        if (normSel(prelude) === normSel(selector)) bodies.push(t.slice(bodyStart, i));
        start = i + 1;
      }
    } else if (ch === ';' && depth === 0) {
      start = i + 1;
    }
  }
  return bodies;
}

/** The declarations of a raw block body, in order: [property, normalised value]. */
function rawDeclarations(body: string): [string, string][] {
  return body
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d !== '')
    .map((d): [string, string] => {
      const at = d.indexOf(':');
      return [d.slice(0, at).trim().toLowerCase(), norm(d.slice(at + 1))];
    });
}

// ---------------------------------------------------------------------------------------------------------
// Below 48rem: a bottom sheet
// ---------------------------------------------------------------------------------------------------------

describe('Below 48rem the panel is a bottom sheet with the design\'s size', () => {
  it('the raw text of the top-level .rules declares max-height 60vh first and 55dvh after it, and padding 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))', () => {
    const bodies = topLevelBodies(readStyleText(), '.rules');
    expect(bodies, 'one top-level block that is exactly .rules in the raw text').toHaveLength(1);
    const declarations = rawDeclarations(bodies[0] ?? '');
    expect(
      declarations.filter(([p]) => p === 'max-height').map(([, v]) => v),
      '.rules { max-height } is written twice, 60vh first and the 55dvh fallback after it',
    ).toEqual(['60vh', '55dvh']);
    expect(
      declarations.filter(([p]) => p === 'padding').map(([, v]) => v),
      '.rules { padding } is written once, with the safe-area inset',
    ).toEqual([norm('1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))')]);
  });

  it('the parsed top-level .rules declares border-radius 1rem 1rem 0 0', () => {
    const rule = only(topLevel(exact(readStyles(), '.rules')), 'top-level .rules');
    expectDeclarations(rule, { 'border-radius': '1rem 1rem 0 0' }, '.rules');
  });

  it('GUARD: the parsed top-level .rules keeps position fixed, inset auto 0 0 0, width 100%, max-width none, margin 0, overflow-y auto, box-sizing border-box and its border widths', () => {
    const rule = only(topLevel(exact(readStyles(), '.rules')), 'top-level .rules');
    expectDeclarations(rule, { position: 'fixed', inset: 'auto 0 0 0', width: '100%', 'max-width': 'none', margin: '0', 'overflow-y': 'auto', 'box-sizing': 'border-box' }, '.rules');
    // jsdom collapses `1px 1px 0 1px` to `1px 1px 0px`, so the border widths (1px, none at the bottom) are read from the raw text
    const declarations = rawDeclarations(topLevelBodies(readStyleText(), '.rules')[0] ?? '');
    expect(declarations.filter(([p]) => p === 'border-width').map(([, v]) => v), '.rules { border-width } (raw)').toEqual([norm('1px 1px 0 1px')]);
  });

  it('inside @media (max-width: 22.5rem) .rules declares padding-top 1rem and .mini declares width and height 1.5rem and font-size 0.875rem', () => {
    const parsed = readStyles();
    const small = only(inside(exact(parsed, '.rules'), MEDIA_22), '.rules inside @media (max-width: 22.5rem)');
    expectDeclarations(small, { 'padding-top': '1rem' }, '.rules (22.5rem)');
    const mini = only(inside(exact(parsed, '.mini'), MEDIA_22), '.mini inside @media (max-width: 22.5rem)');
    expectDeclarations(mini, { width: '1.5rem', height: '1.5rem', 'font-size': '0.875rem' }, '.mini (22.5rem)');
  });

  it('the 22.5rem .rules and .mini rules come later in the file than the top-level .rules and .mini rules (an earlier block would lose at the same specificity)', () => {
    const parsed = readStyles();
    const topRules = only(topLevel(exact(parsed, '.rules')), 'top-level .rules');
    const topMini = only(topLevel(exact(parsed, '.mini')), 'top-level .mini');
    const smallRules = inside(exact(parsed, '.rules'), MEDIA_22).filter((r) => valueOf(r, 'padding-top') !== undefined);
    const smallMini = inside(exact(parsed, '.mini'), MEDIA_22).filter((r) => valueOf(r, 'width') !== undefined);
    expect(smallRules.map(where), 'a .rules rule with padding-top inside @media (max-width: 22.5rem)').toHaveLength(1);
    expect(smallMini.map(where), 'a .mini rule with width inside @media (max-width: 22.5rem)').toHaveLength(1);
    expect(indexOfRule(parsed, first(smallRules)), '22.5rem .rules is later than the top-level .rules').toBeGreaterThan(indexOfRule(parsed, topRules));
    expect(indexOfRule(parsed, first(smallMini)), '22.5rem .mini is later than the top-level .mini').toBeGreaterThan(indexOfRule(parsed, topMini));
  });

  // GUARD: the shell's raw counts (tests/play-page-panel-shell-stylesheet.test.ts:72) read the first block of the raw text that is exactly `.rules`.
  it('GUARD: the first block of the raw text whose selector is exactly .rules is the top-level one (not indented, outside every at-rule)', () => {
    const text = readStyleText();
    const first = /(?:^|\n)([ \t]*)\.rules[ \t]*\{([^{}]*)\}/.exec(text);
    expect.assert(first !== null, 'the raw text has a block that is exactly .rules');
    expect(first[1], 'the first .rules block is not indented').toBe('');
    const before = stripComments(text.slice(0, first.index));
    const depth = (before.match(/\{/g) ?? []).length - (before.match(/\}/g) ?? []).length;
    expect(depth, 'the first .rules block is outside every at-rule').toBe(0);
    expect(first[2], 'and it is the sheet rule (position: fixed)').toMatch(/position:\s*fixed/);
  });
});

// ---------------------------------------------------------------------------------------------------------
// From 48rem to 64rem
// ---------------------------------------------------------------------------------------------------------

describe('From 48rem the open panel is a flex column and «Зрозуміло» takes the spare height', () => {
  it('.rules:popover-open declares display flex and flex-direction column inside @media (min-width: 48rem)', () => {
    const rule = only(inside(exact(readStyles(), '.rules:popover-open'), MEDIA_48), '.rules:popover-open inside @media (min-width: 48rem)');
    expectDeclarations(rule, { display: 'flex', 'flex-direction': 'column' }, '.rules:popover-open');
  });

  it('.rules > * declares flex-shrink 0 inside @media (min-width: 48rem)', () => {
    const rule = only(inside(exact(readStyles(), '.rules > *'), MEDIA_48), '.rules > * inside @media (min-width: 48rem)');
    expectDeclarations(rule, { 'flex-shrink': '0' }, '.rules > *');
  });

  // GUARD: green today and must stay green: a `display` on the bare rule would override the user agent's `display: none` of a closed popover.
  it('GUARD: no rule whose selector is exactly .rules (alone or in a list) declares display, at any width and in any at-rule', () => {
    const parsed = readStyles();
    const hits = parsed.rules.filter((r) => r.selectors.some((s) => normSel(s) === '.rules') && raw(r, 'display') !== undefined);
    expect(hits.map(where), 'a rule exactly .rules that declares display').toEqual([]);
  });

  it('.rules-close declares margin-top auto and the techniques section declares margin-top 0 inside @media (min-width: 48rem)', () => {
    const parsed = readStyles();
    const close = inside(exact(parsed, '.rules-close'), MEDIA_48).filter((r) => valueOf(r, 'margin-top') !== undefined);
    expectDeclarations(only(close, '.rules-close with margin-top inside @media (min-width: 48rem)'), { 'margin-top': 'auto' }, '.rules-close');
    const techniques = inside(exact(parsed, ".rules [data-section='techniques']"), MEDIA_48).filter((r) => valueOf(r, 'margin-top') !== undefined);
    expectDeclarations(only(techniques, "the techniques section with margin-top inside @media (min-width: 48rem)"), { 'margin-top': '0' }, 'techniques');
  });

  it('those two 48rem rules come later in the file than the top-level .rules-close and techniques rules, so they win at the same specificity', () => {
    const parsed = readStyles();
    for (const [selector, label] of [['.rules-close', '.rules-close'], [".rules [data-section='techniques']", 'the techniques section']] as const) {
      const top = topLevel(exact(parsed, selector));
      expect(top.map(where), `${label}: a top-level rule exists`).toHaveLength(1);
      const wide = inside(exact(parsed, selector), MEDIA_48).filter((r) => valueOf(r, 'margin-top') !== undefined);
      expect(wide.map(where), `${label}: a margin-top rule inside @media (min-width: 48rem)`).toHaveLength(1);
      expect(indexOfRule(parsed, first(wide)), `${label}: the 48rem rule is later than the top-level rule`).toBeGreaterThan(indexOfRule(parsed, first(top)));
    }
  });
});

describe('From 48rem the panel takes the column\'s width plus 1rem, 6rem from the top', () => {
  it('the one .rules rule inside @media (min-width: 48rem) declares inset, width, max-width, height, max-height, margin, padding-bottom, border-radius and the min-height of the table, and no padding shorthand', () => {
    const rule = only(inside(exact(readStyles(), '.rules'), MEDIA_48), '.rules inside @media (min-width: 48rem) (the declarations are merged into the one rule)');
    expectDeclarations(
      rule,
      {
        inset: '0',
        width: 'calc(var(--column) + 1rem)',
        'max-width': 'calc(100% - 2rem)',
        height: 'fit-content',
        'max-height': 'calc(100dvh - 7rem)',
        margin: '6rem auto auto',
        'padding-bottom': '1rem',
        'border-radius': '1rem',
        'min-height': 'min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 13.875rem))',
      },
      '.rules (48rem)',
    );
    expect(raw(rule, 'padding'), 'the 48rem .rules has no padding shorthand (the old padding: 24px is gone)').toBeUndefined();
  });

  // GUARD: the shell's bindings (update-panel-shell) stay in the same one rule.
  it('GUARD: the same rule still declares box-shadow 0 1rem 2.5rem var(--color-shadow-panel) and border-color var(--color-overlay-border)', () => {
    const rule = only(inside(exact(readStyles(), '.rules'), MEDIA_48), '.rules inside @media (min-width: 48rem)');
    expectDeclarations(rule, { 'box-shadow': '0 1rem 2.5rem var(--color-shadow-panel)', 'border-color': 'var(--color-overlay-border)' }, '.rules (48rem)');
  });
});

describe('The min-height reads the board side through the root', () => {
  it('the min-height of the 48rem .rules is min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 13.875rem))', () => {
    const rule = only(inside(exact(readStyles(), '.rules'), MEDIA_48), '.rules inside @media (min-width: 48rem)');
    expect(valueOf(rule, 'min-height'), '.rules (48rem) { min-height }').toBe(norm('min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 13.875rem))'));
  });

  // GUARD: the shell's hook (tests/play-page-root-size.test.ts) already puts the variables on #app; the panel must not re-declare them.
  it('GUARD: no rule whose selector starts with .rules declares --board-width, --column, --n, --cell-max, --board-gap or --board-pad, and the rules that declare --board-width and --column begin with #app', () => {
    const parsed = readStyles();
    const variables = ['--board-width', '--column', '--n', '--cell-max', '--board-gap', '--board-pad'];
    const panelDeclaring = parsed.rules.filter((r) => r.selectors.some((s) => normSel(s).startsWith('.rules')) && r.declarations.some((d) => variables.includes(d.property)));
    expect(panelDeclaring.map(where), 'a rule starting with .rules that declares a size variable').toEqual([]);
    for (const variable of ['--board-width', '--column']) {
      const declaring = parsed.rules.filter((r) => r.declarations.some((d) => d.property === variable));
      expect(declaring.length, `a rule declares ${variable}`).toBeGreaterThan(0);
      expect(declaring.filter((r) => !r.selectors.every((s) => s.startsWith('#app'))).map(where), `rules that declare ${variable} outside #app`).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// From 64rem
// ---------------------------------------------------------------------------------------------------------

describe('From 64rem the panel is one 40rem column with tighter spacing', () => {
  it('inside @media (min-width: 64rem): .rules declares width 40rem, height fit-content, min-height 0, padding-top 1rem; .rules h2 margin-bottom 0.25rem; .rules ul margin-bottom 0.5rem; .rules li padding 0.3125rem 0', () => {
    const parsed = readStyles();
    expectDeclarations(
      only(inside(exact(parsed, '.rules'), MEDIA_64), '.rules inside @media (min-width: 64rem)'),
      { width: '40rem', height: 'fit-content', 'min-height': '0', 'padding-top': '1rem' },
      '.rules (64rem)',
    );
    expectDeclarations(only(inside(exact(parsed, '.rules h2'), MEDIA_64), '.rules h2 inside 64rem'), { 'margin-bottom': '0.25rem' }, '.rules h2 (64rem)');
    expectDeclarations(only(inside(exact(parsed, '.rules ul'), MEDIA_64), '.rules ul inside 64rem'), { 'margin-bottom': '0.5rem' }, '.rules ul (64rem)');
    expectDeclarations(only(inside(exact(parsed, '.rules li'), MEDIA_64), '.rules li inside 64rem'), { padding: '0.3125rem 0' }, '.rules li (64rem)');
  });

  it('the .rules rule of the 64rem block is later in the file than the .rules rule of the 48rem block that declares min-height (the min-height 0 wins by source order)', () => {
    const parsed = readStyles();
    const wide = inside(exact(parsed, '.rules'), MEDIA_48).filter((r) => valueOf(r, 'min-height') !== undefined);
    const desktop = inside(exact(parsed, '.rules'), MEDIA_64).filter((r) => valueOf(r, 'min-height') !== undefined);
    expect(wide.map(where), 'the 48rem .rules rule that declares min-height').toHaveLength(1);
    expect(desktop.map(where), 'the 64rem .rules rule that declares min-height').toHaveLength(1);
    expect(indexOfRule(parsed, first(desktop))).toBeGreaterThan(indexOfRule(parsed, first(wide)));
  });

  // GUARD: today's cap, kept (RQ-2); the 48rem rule declares it, no rule below 48rem does.
  it('GUARD: the max-width cap calc(100% - 2rem) is declared by the .rules rule of the 48rem block and by no .rules rule outside @media (min-width: 48rem) and @media (min-width: 64rem)', () => {
    const parsed = readStyles();
    const cap = norm('calc(100% - 2rem)');
    const rules = parsed.rules.filter((r) => r.selectors.some((s) => normSel(s) === '.rules'));
    const withCap = rules.filter((r) => valueOf(r, 'max-width') === cap);
    expect(withCap.map(where), 'the rules that declare the cap').toEqual([where(only(inside(exact(parsed, '.rules'), MEDIA_48), '.rules (48rem)'))]);
    const below = parsed.rules.filter((r) => !inMedia(r, MEDIA_48) && !inMedia(r, MEDIA_64) && r.declarations.some((d) => d.property === 'max-width' && norm(d.value).includes(cap)));
    expect(below.map(where), 'a rule below 48rem that declares the cap').toEqual([]);
  });

  // GUARD: the backdrops are not restated (the shell's / update-page-backdrop's rules stay as they are).
  it('GUARD: .rules:popover-open::backdrop is declared exactly once, inside @media (min-width: 64rem), with --color-backdrop-strong', () => {
    const rules = exact(readStyles(), '.rules:popover-open::backdrop');
    const rule = only(rules, '.rules:popover-open::backdrop');
    expect(inMedia(rule, MEDIA_64), 'inside @media (min-width: 64rem)').toBe(true);
    expect(valueOf(rule, 'background-color')).toBe('var(--color-backdrop-strong)');
  });
});

// ---------------------------------------------------------------------------------------------------------
// «Зрозуміло»
// ---------------------------------------------------------------------------------------------------------

const MASK = '0 0 0 1rem var(--color-surface-raised), 0 1rem 0 1rem var(--color-surface-raised)';

describe('«Зрозуміло» is sticky and filled, with the design\'s mask', () => {
  it('the top-level .rules-close declares position sticky, bottom 0, width 100%, min-height 2.75rem, padding 1px 6px, a 2px solid primary border, radius 0.625rem, the primary fill and text, weight 700 and the two-layer mask', () => {
    const rule = only(topLevel(exact(readStyles(), '.rules-close')), 'top-level .rules-close');
    expectDeclarations(
      rule,
      {
        position: 'sticky',
        bottom: '0',
        width: '100%',
        'min-height': '2.75rem',
        padding: '1px 6px',
        'border-width': '2px',
        'border-style': 'solid',
        'border-color': 'var(--color-primary)',
        'border-radius': '0.625rem',
        'background-color': 'var(--color-primary)',
        color: 'var(--color-primary-text)',
        'font-weight': '700',
        'box-shadow': MASK,
      },
      '.rules-close',
    );
  });

  for (const label of ['light', 'dark'] as const) {
    it(`the computed style of the close button in the ${label} token set: position sticky, color --color-primary-text, background-color and border-top-color --color-primary`, () => {
      const set = themeTokenSets(readStyles()).find((s) => s.label === label);
      expect.assert(set !== undefined, `the ${label} token set exists`);
      const root = mountFixture(WIN_PUZZLE);
      const button = q(rulesPanel(root), '.rules-close');
      expect(button.tagName).toBe('BUTTON');
      injectPageStyles(set.tokens);
      const computed = getComputedStyle(button);
      const token = (name: string): string => {
        const value = set.tokens[name];
        expect.assert(value !== undefined, `${label}: ${name} is declared`);
        return rgbOf(value);
      };
      expect(computed.position, `${label}: position`).toBe('sticky');
      expect(computed.color, `${label}: color is --color-primary-text`).toBe(token('--color-primary-text'));
      expect(computed.backgroundColor, `${label}: background-color is --color-primary`).toBe(token('--color-primary'));
      expect(computed.borderTopColor, `${label}: border-top-color is --color-primary`).toBe(token('--color-primary'));
    });
  }

  // GUARD: the base `button:focus-visible` indicator covers the button; no focus rule is added for it.
  it('GUARD: the stylesheet has no :focus or :focus-visible rule for .rules-close (the base button:focus-visible ring is kept)', () => {
    const parsed = readStyles();
    const hits = parsed.rules.filter((r) => r.selectors.some((s) => s.includes('.rules-close') && s.includes(':focus')));
    expect(hits.map(where), 'a focus rule for .rules-close').toEqual([]);
    const base = parsed.rules.filter((r) => r.selectors.includes('button:focus-visible'));
    expect(base.length, 'the base button:focus-visible rule exists').toBeGreaterThan(0);
  });

  // GUARD: the pair is already in the list; the text and the ratios hold in each token set.
  it('GUARD: the pair --color-primary-text on --color-primary (4.5) is in CONTRAST_PAIRS and holds in each token set', () => {
    expect(CONTRAST_PAIRS.filter((p) => p.fg === '--color-primary-text' && p.bg === '--color-primary').map((p) => `${p.group} ${p.min}`)).toEqual(['text 4.5']);
    for (const set of themeTokenSets(readStyles())) {
      const fg = set.tokens['--color-primary-text'];
      const bg = set.tokens['--color-primary'];
      expect.assert(fg !== undefined && bg !== undefined, `${set.label}: both tokens are declared`);
      expect(contrastRatio(fg, bg), `${set.label}: --color-primary-text on --color-primary`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// Paint of the list and the examples
// ---------------------------------------------------------------------------------------------------------

describe('The separators and the example cells take the design\'s tokens', () => {
  it('.rules li declares border-top-color var(--color-line)', () => {
    const rules = topLevel(exact(readStyles(), '.rules li')).filter((r) => raw(r, 'border-top-color') !== undefined);
    expectDeclarations(only(rules, '.rules li with border-top-color'), { 'border-top-color': 'var(--color-line)' }, '.rules li');
  });

  it('.mini declares border-color var(--color-control-border), background-color var(--color-page) and color var(--color-entry-text)', () => {
    const rule = only(topLevel(exact(readStyles(), '.mini')), 'top-level .mini');
    expectDeclarations(rule, { 'border-color': 'var(--color-control-border)', 'background-color': 'var(--color-page)', color: 'var(--color-entry-text)' }, '.mini');
  });

  it('.mini-answer declares a 2px dashed border in --color-primary on --color-primary-soft with --color-text', () => {
    const rule = only(topLevel(exact(readStyles(), '.mini-answer')), 'top-level .mini-answer');
    expectDeclarations(
      rule,
      { 'border-style': 'dashed', 'border-width': '2px', 'border-color': 'var(--color-primary)', 'background-color': 'var(--color-primary-soft)', color: 'var(--color-text)' },
      '.mini-answer',
    );
  });

  it('GUARD: .mini-sep keeps color var(--color-text-muted)', () => {
    expectDeclarations(only(topLevel(exact(readStyles(), '.mini-sep')), 'top-level .mini-sep'), { color: 'var(--color-text-muted)' }, '.mini-sep');
  });

  it('none of the panel\'s rules contains --color-given-bg, --color-cell-border or --color-focus in any declaration', () => {
    const parsed = readStyles();
    const rules = panelRules(parsed);
    expect(rules.length, 'the walk found the panel\'s rules').toBeGreaterThan(10);
    const banned = /--color-(given-bg|cell-border|focus)(?![\w-])/;
    const hits = rules.flatMap((r) => r.declarations.filter((d) => banned.test(d.value)).map((d) => `${where(r)} { ${d.property}: ${d.value} }`));
    expect(hits, 'declarations of the panel\'s rules that use a token the design does not').toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Inner metrics
// ---------------------------------------------------------------------------------------------------------

describe('The inner metrics are the design\'s', () => {
  const METRICS: [string, Record<string, string>][] = [
    ['.rules h2', { 'font-size': '1.125rem', 'font-weight': '700', margin: '0 0 0.5rem' }],
    ['.rules ul', { margin: '0 0 1rem', padding: '0', 'list-style': 'none' }],
    ['.rules li', { display: 'flex', 'flex-direction': 'column', gap: '0.5rem', padding: '0.5rem 0', 'font-size': '0.9375rem', 'line-height': '1.45' }],
    [".rules [data-section='techniques']", { margin: '0.5rem 0 0' }],
    ['.rules h3', { 'font-size': '1rem', 'font-weight': '700', margin: '0 0 0.5rem' }],
    ['.rule-example', { display: 'flex', 'align-items': 'center', gap: '0.1875rem' }],
    ['.mini', { width: '1.75rem', height: '1.75rem', 'font-size': '0.9375rem', 'font-weight': '500', 'font-variant-numeric': 'tabular-nums', 'border-radius': '0.375rem' }],
    ['.mini-sep', { padding: '0 0.5rem' }],
  ];
  for (const [selector, want] of METRICS) {
    it(`${selector}: ${Object.entries(want).map(([p, v]) => `${p} ${v}`).join(', ')}`, () => {
      const rules = topLevel(exact(readStyles(), selector));
      // the top-level rules of the selector, merged in source order (a later declaration wins), so the test does not fix how many rules carry them
      expect(rules.length, `a top-level rule ${selector}`).toBeGreaterThan(0);
      const merged: StyleRuleInfo = { selectors: [selector], context: [], declarations: rules.flatMap((r) => r.declarations) };
      const last = (property: string): string | undefined => merged.declarations.filter((d) => d.property === property).at(-1)?.value;
      for (const [property, value] of Object.entries(want)) {
        const got = last(property);
        expect(got === undefined ? undefined : norm(got), `${selector} { ${property}: ${value} }`).toBe(norm(value));
      }
    });
  }
});

// ---------------------------------------------------------------------------------------------------------
// No token, no pair, no literal
// ---------------------------------------------------------------------------------------------------------

// The 31 tokens and the 38 pairs as they stood before this change (baseline «Borders, cues and focus rings have enough contrast», after update-panel-shell).
// LITERAL COPIES taken from tests/helpers/css.ts on 2026-10-11 at ebaf49b; compared as lists, not as the numbers 31 and 38, because the setup-sheet block moves the counts.
// DELIBERATE CHANGE (update-setup-sheet, rebased onto this block): the baseline list of «Borders, cues and focus rings have enough contrast» is now
// 32 tokens and 41 pairs (the setup sheet's --color-option-border, decoration in no pair, and the three ring pairs of FR-65, marked «setup sheet»
// below). This block still adds none; the guard keeps comparing the helper with the baseline list, as its re-scoped scenario says — proposal.md of
// update-setup-sheet, Impact row «The rules panel takes the design's size, place and paint» (the user's decision of 2026-10-12).
// DELIBERATE CHANGE (update-confirm-dialog, proposal.md Impact row «Rules panel»: `tests/play-page-rules-panel-stylesheet.test.ts` comment 476-481, `BASELINE_TOKEN_NAMES` 482-489,
// `BASELINE_PAIRS` 490-532, assertions 560-561): the baseline list of «Borders, cues and focus rings have enough contrast» is now 33 tokens and 42 pairs (the dialog's
// `--color-violation-ink` right after `--color-focus`, and its pair `violation-ink` on `violation-bg` after the `violation-text` pairs and before `primary-text`, both marked «dialog»
// below; the order is the helper's, because the guard compares ordered lists). This block still adds none; the guard keeps comparing the helper with the baseline list. GUARD:
// it compares two lists that are both changed here (the helper and the literal copy), so it is green; it fails if either list drifts from the other.
const BASELINE_TOKEN_NAMES = [
  '--color-page', '--color-text', '--color-text-muted', '--color-cell-bg', '--color-control-bg', '--color-line', '--color-cell-border', '--color-control-border',
  '--color-given-bg', '--color-given-border', '--color-given-text', '--color-entry-text', '--color-primary', '--color-primary-text', '--color-primary-soft',
  '--color-hover-ring', '--color-violation-bg', '--color-violation-border', '--color-violation-stripe', '--color-violation-text', '--color-success',
  '--color-success-bg', '--color-success-glow', '--color-win-text', '--color-focus',
  '--color-violation-ink', // dialog
  '--color-backdrop-soft', '--color-backdrop-strong',
  '--color-surface-raised', '--color-overlay-border', '--color-shadow-panel', '--color-shadow-sheet',
  '--color-option-border', // setup sheet
];
const BASELINE_PAIRS: [string, string, string, number][] = [
  ['cell-border', '--color-cell-border', '--color-page', 3],
  ['cell-border', '--color-cell-border', '--color-cell-bg', 3],
  ['cell-border', '--color-cell-border', '--color-line', 3],
  ['cell-border', '--color-cell-border', '--color-success-bg', 3],
  ['violation-cue', '--color-violation-border', '--color-page', 3],
  ['violation-cue', '--color-violation-border', '--color-cell-bg', 3],
  ['violation-cue', '--color-violation-border', '--color-violation-bg', 3],
  ['violation-cue', '--color-violation-border', '--color-line', 3],
  ['cause-cue', '--color-violation-border', '--color-violation-stripe', 3],
  ['hinted-cue', '--color-primary', '--color-primary-soft', 3],
  ['hinted-cue', '--color-primary', '--color-line', 3],
  ['hinted-cue', '--color-primary', '--color-page', 3],
  ['hinted-cue', '--color-primary', '--color-control-bg', 3], // setup sheet
  ['hinted-cue', '--color-primary', '--color-surface-raised', 3], // setup sheet
  ['focus-ring', '--color-focus', '--color-page', 3],
  ['focus-ring', '--color-focus', '--color-cell-bg', 3],
  ['focus-ring', '--color-focus', '--color-given-bg', 3],
  ['focus-ring', '--color-focus', '--color-violation-bg', 3],
  ['focus-ring', '--color-focus', '--color-line', 3],
  ['focus-ring', '--color-focus', '--color-primary-soft', 3],
  ['focus-ring', '--color-focus', '--color-success-bg', 3],
  ['focus-ring', '--color-focus', '--color-cell-border', 3],
  ['focus-ring', '--color-focus', '--color-surface-raised', 3],
  ['control-border', '--color-control-border', '--color-page', 3],
  ['control-border', '--color-control-border', '--color-control-bg', 3], // setup sheet
  ['text', '--color-text', '--color-page', 4.5],
  ['text', '--color-text', '--color-cell-bg', 4.5],
  ['text', '--color-text', '--color-given-bg', 4.5],
  ['text', '--color-text', '--color-control-bg', 4.5],
  ['text', '--color-text', '--color-primary-soft', 4.5],
  ['text', '--color-text', '--color-surface-raised', 4.5],
  ['text', '--color-given-text', '--color-given-bg', 4.5],
  ['text', '--color-entry-text', '--color-cell-bg', 4.5],
  ['text', '--color-text-muted', '--color-page', 4.5],
  ['text', '--color-text-muted', '--color-cell-bg', 4.5],
  ['text', '--color-text-muted', '--color-control-bg', 4.5],
  ['text', '--color-text-muted', '--color-surface-raised', 4.5],
  ['text', '--color-violation-text', '--color-violation-bg', 4.5],
  ['text', '--color-violation-text', '--color-violation-stripe', 4.5],
  ['text', '--color-violation-ink', '--color-violation-bg', 4.5], // dialog
  ['text', '--color-primary-text', '--color-primary', 4.5],
  ['text', '--color-win-text', '--color-success-bg', 4.5],
];

describe('The panel adds no token, no pair and no colour literal', () => {
  // GUARD: green today; the port must keep it (no colour literal in any declaration of the panel's rules, every box-shadow colour a var(--color-...) token).
  it('GUARD: the colour scan over the panel\'s rules finds no literal, no named colour, no color-mix(, no bare shorthand colour; every box-shadow layer ends in a var(--color-...) token', () => {
    const parsed = readStyles();
    const rules = panelRules(parsed);
    expect(rules.length, 'the walk found the panel\'s rules').toBeGreaterThan(10);
    expect(rules.some((r) => r.selectors.some((s) => normSel(s).startsWith('.rules-button'))), 'the header button .rules-button is not one of the panel\'s rules').toBe(false);
    const scan = scanColours({ ...parsed, rules });
    expect(scan.literals, 'no colour literal').toEqual([]);
    expect(scan.named, 'no named colour').toEqual([]);
    expect(scan.shorthands, 'every colour-bearing shorthand has a token colour').toEqual([]);
    expect(scan.colourProperties, 'every colour property is a token or an allowed keyword').toEqual([]);
    expect(scan.tokensOutsideRoot, 'no token declared in a panel rule').toEqual([]);
    for (const rule of rules) {
      for (const d of rule.declarations) {
        expect(d.value, `${where(rule)} { ${d.property} } has no color-mix(`).not.toContain('color-mix(');
        if (d.property !== 'box-shadow' || d.value === 'none') continue;
        for (const layer of d.value.split(/,(?![^(]*\))/)) {
          expect(layer.trim(), `${where(rule)} { box-shadow } layer has a var(--color-...) colour`).toMatch(/var\(--color-[\w-]+\)$/);
        }
      }
    }
  });

  // GUARD: the helper lists are the baseline's: this change declares no token and adds no pair.
  it('GUARD: TOKEN_NAMES and CONTRAST_PAIRS of tests/helpers/css.ts equal the literal copies of the baseline lists (compared as lists, not as counts)', () => {
    expect([...TOKEN_NAMES], 'TOKEN_NAMES').toEqual(BASELINE_TOKEN_NAMES);
    expect(CONTRAST_PAIRS.map((p) => [p.group, p.fg, p.bg, p.min]), 'CONTRAST_PAIRS').toEqual(BASELINE_PAIRS);
    expect(BASELINE_PAIRS.some(([, fg, bg]) => fg === '--color-primary-text' && bg === '--color-primary'), 'the pair --color-primary-text on --color-primary is in the list').toBe(true);
  });

  // GUARD: the stylesheet has no !important, exactly one :has( (the idle-line rule), and no rule of the panel in the motion block or in @starting-style.
  it('GUARD: no !important, :has( exactly once in the raw text, and no panel rule inside @media (prefers-reduced-motion: no-preference) or @starting-style', () => {
    const parsed = readStyles();
    const text = readStyleText();
    expect(text, 'no !important').not.toMatch(/!\s*important/i);
    expect(text.match(/:has\(/gi) ?? [], 'exactly one :has(').toHaveLength(1);
    const motion = panelRules(parsed).filter((r) => r.context.some((c) => /prefers-reduced-motion|starting-style/i.test(c)));
    expect(motion.map(where), 'a panel rule inside the motion block or @starting-style').toEqual([]);
    expect(stripComments(text), 'no @starting-style anywhere in the file').not.toMatch(/@starting-style/);
  });
});
