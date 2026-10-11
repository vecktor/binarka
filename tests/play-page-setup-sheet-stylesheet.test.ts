// Play page: the setup sheet takes the design's size, place and paint, read from src/ui/style.css (update-setup-sheet, NFR-14 G2 setup-sheet block).
// One or more tests per stylesheet scenario of the ADDED requirement «The setup sheet takes the design's size, place and paint» and of the two scenarios added
// to «Borders, cues and focus rings have enough contrast» in openspec/changes/update-setup-sheet/specs/play-page/spec.md. The browser read against the design
// build is e2e/nfr-14-setup-sheet.spec.ts (jsdom has no layout), so everything here is read as declarations, which is what the scenarios ask.
// Written FIRST (red) from the spec, before the port.
//
// @trace FR-96
// @trace FR-65
// @trace NFR-14
//
// Why the stylesheet is read from the raw text here (and not only through `readStyles`): jsdom's CSSOM is lossy for several values this requirement pins
// literally. It DROPS `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`, `border-left: 3px solid var(--color-primary)` and `border: 2px solid
// var(...)`, FOLDS `padding-left: calc(0.875rem + 0.5rem)` to `calc(1.375rem)`, rewrites `0` to `0px`, and keeps only the LAST of two `max-height`
// declarations (the requirement asks for two). A test that read those through the CSSOM would be red on today's page AND on the finished one. So the structure
// (at-rule chain, source order, selector list) and the declaration strings come from one small raw reader below, which keeps the author's text and order. The
// colour scan and the contrast helpers are the shared ones of tests/helpers/css.ts.
//
// Values are compared in a canonical form: whitespace tidied, `0px` as `0`, and a plain length in `rem` as px (1rem = 16px, so `0 8px` equals `0 0.5rem`, which is the
// same value, and `gap: 2px` equals `0.125rem`); a token with a function (`calc(`, `min(`, `var(`) is compared as written, whitespace aside.
//
// Tests that pass today by design are marked GUARD in their title and listed in docs/qa/update-setup-sheet/red-run.txt (section D) with the reason.
import { describe, expect, it } from 'vitest';
import { BLANK, installPageLifecycle, mountFixture, q } from './helpers/play-page';
import {
  COLOUR_LITERAL,
  CONTRAST_PAIRS,
  TOKEN_NAMES,
  TRANSLUCENT_TOKENS,
  contrastRatio,
  namedColoursIn,
  readStyleText,
  readStyles,
  scanColours,
  themeTokenSets,
} from './helpers/css';
import type { TokenSet } from './helpers/css';

installPageLifecycle();

// ---------------------------------------------------------------------------------------------------------
// A raw reader of the stylesheet: rules in source order, each with its at-rule chain, selector list and declarations as written
// ---------------------------------------------------------------------------------------------------------

interface RawDecl {
  property: string;
  value: string;
}

interface RawRule {
  /** the position in the file, for "comes after" */
  index: number;
  /** the at-rule chain, outermost first, for example `@media (min-width: 48rem)` */
  context: string[];
  selectors: string[];
  declarations: RawDecl[];
  /** a block nested inside the style rule (`@starting-style { }` or a nested rule): the reader does not descend into it */
  hasNestedBlock: boolean;
}

const squash = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** `@media (min-width:48rem)` and `@media (min-width: 48rem)` are the same chain element. */
const normaliseAtRule = (prelude: string): string =>
  squash(prelude).replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s*:\s*/g, ': ');

const normaliseSelector = (selector: string): string => squash(selector).replace(/"/g, "'");

/** Split on commas that are outside parentheses, brackets and quotes. */
function splitTopLevel(text: string, separator: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = '';
  let current = '';
  for (const ch of text) {
    if (quote !== '') {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(' || ch === '[') {
      depth += 1;
    } else if (ch === ')' || ch === ']') {
      depth -= 1;
    } else if (ch === separator && depth === 0) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function parseDeclarations(body: string): RawDecl[] {
  const declarations: RawDecl[] = [];
  for (const piece of splitTopLevel(body, ';')) {
    const colon = piece.indexOf(':');
    if (colon < 1) continue;
    const property = piece.slice(0, colon).trim().toLowerCase();
    const value = squash(piece.slice(colon + 1)).replace(/\s*!important$/i, '');
    if (property !== '' && value !== '') declarations.push({ property, value });
  }
  return declarations;
}

/** The index of the `}` that closes the block whose `{` is just before `from`. */
function closingBrace(text: string, from: number): number {
  let depth = 1;
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error('src/ui/style.css has an unclosed block');
}

function readRawRules(text: string): RawRule[] {
  const source = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const rules: RawRule[] = [];
  const walk = (from: number, to: number, context: string[]): void => {
    let cursor = from;
    while (cursor < to) {
      const open = source.indexOf('{', cursor);
      const semicolon = source.indexOf(';', cursor);
      if (open === -1 || open >= to) return;
      if (semicolon !== -1 && semicolon < open) {
        cursor = semicolon + 1; // `@layer a, b;` and the like
        continue;
      }
      const prelude = source.slice(cursor, open).trim();
      const close = closingBrace(source, open + 1);
      if (prelude.startsWith('@')) {
        if (/^@(keyframes|-webkit-keyframes|font-face|property)\b/i.test(prelude)) {
          // keyframes hold frames, not rules of the sheet's selectors: kept as one rule per block would only add noise here
        } else {
          walk(open + 1, close, [...context, normaliseAtRule(prelude)]);
        }
      } else {
        const inner = source.slice(open + 1, close);
        const hasNestedBlock = inner.includes('{');
        const body = hasNestedBlock ? inner.replace(/[^{};]*\{[^{}]*\}/g, ' ') : inner;
        rules.push({
          index: rules.length,
          context,
          selectors: splitTopLevel(prelude, ',').map(normaliseSelector).filter((s) => s !== ''),
          declarations: parseDeclarations(body),
          hasNestedBlock,
        });
      }
      cursor = close + 1;
    }
  };
  walk(0, source.length, []);
  return rules;
}

const RAW = (): RawRule[] => readRawRules(readStyleText());

/** The rules whose selector list is exactly `selector`. */
const exact = (rules: RawRule[], selector: string): RawRule[] => rules.filter((r) => r.selectors.length === 1 && r.selectors[0] === selector);
const outsideAtRules = (rules: RawRule[]): RawRule[] => rules.filter((r) => r.context.length === 0);
const insideOnly = (rules: RawRule[], atRule: string): RawRule[] => rules.filter((r) => r.context.length === 1 && r.context[0] === atRule);

const MEDIA_SMALL = '@media (max-width: 22.5rem)';
const MEDIA_48 = '@media (min-width: 48rem)';
const MEDIA_ANCHORED = '@media (min-width: 48rem) and (min-height: 44rem)';

const where = (rule: RawRule): string => `${rule.context.join(' ')} ${rule.selectors.join(', ')}`.trim();

/** Every value written for `property` in the rule, in order (a duplicate shows twice, which the CSSOM would hide). */
const written = (rule: RawRule, property: string): string[] => rule.declarations.filter((d) => d.property === property).map((d) => d.value);

/** property -> last value, over the rules in the order given (a later declaration wins; the caller orders by the cascade). */
function merged(rules: RawRule[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const rule of rules) for (const d of rule.declarations) map.set(d.property, d.value);
  return map;
}

/** A value in a canonical form, see the header: a plain `rem` length as px, `0px` as `0`, a function kept as written with its spacing tidied. */
function canon(value: string | undefined): string {
  if (value === undefined) return '(missing)';
  const tidy = squash(value).replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s*,\s*/g, ', ');
  return splitTopLevel(tidy, ' ')
    .filter((token) => token !== '')
    .map((token) => {
      const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(token);
      if (m?.[1] !== undefined) {
        const n = Number(m[1]) * (m[2] === 'rem' ? 16 : 1);
        return n === 0 ? '0' : `${Number(n.toFixed(4))}px`;
      }
      return token === '0px' ? '0' : token;
    })
    .join(' ');
}

/** `expect.soft`, so one failing test lists every declaration that is wrong or missing, each by name. */
function declares(label: string, from: Map<string, string>, property: string, want: string): void {
  const have = from.get(property);
  expect.soft(canon(have), `${label} { ${property}: ${want} } (is ${have ?? 'missing'})`).toBe(canon(want));
}

/** One rule, asserted (a missing rule is a failure that names the selector and the at-rule). */
function only(rules: RawRule[], label: string): RawRule {
  expect.assert(rules.length >= 1, `${label}: the rule exists in src/ui/style.css`);
  expect(rules, `${label}: exactly one such rule`).toHaveLength(1);
  const rule = rules[0];
  expect.assert(rule !== undefined, `premise: ${label} has a rule`);
  return rule;
}

/** The width, style and colour of a border from `border`, `border-width`, `border-style` and `border-color`, in the order written. */
function borderOf(map: Iterable<RawDecl>): { width?: string; style?: string; color?: string } {
  const out: { width?: string; style?: string; color?: string } = {};
  for (const { property, value } of map) {
    if (property === 'border') {
      for (const token of splitTopLevel(value, ' ').filter((t) => t !== '')) {
        if (/^-?\d*\.?\d+(px|rem)?$/.test(token)) out.width = token;
        else if (/^(none|solid|dashed|dotted|double|groove|ridge|inset|outset|hidden)$/.test(token)) out.style = token;
        else out.color = token;
      }
    } else if (property === 'border-width') out.width = value;
    else if (property === 'border-style') out.style = value;
    else if (property === 'border-color') out.color = value;
  }
  return out;
}

const declarationsOfAll = (rules: RawRule[]): RawDecl[] => rules.flatMap((r) => r.declarations);

function declaresBorder(label: string, rules: RawRule[], want: { width?: string; style?: string; color?: string }): void {
  const have = borderOf(declarationsOfAll(rules));
  if (want.width !== undefined) expect.soft(canon(have.width), `${label} { border width ${want.width} } (is ${have.width ?? 'missing'})`).toBe(canon(want.width));
  if (want.style !== undefined) expect.soft(have.style, `${label} { border style ${want.style} } (is ${have.style ?? 'missing'})`).toBe(want.style);
  if (want.color !== undefined) expect.soft(have.color, `${label} { border color ${want.color} } (is ${have.color ?? 'missing'})`).toBe(want.color);
}

/** The first value of `margin` or `padding` shorthand for a side, or the longhand. */
function sideOf(map: Map<string, string>, box: 'margin' | 'padding', side: 'top' | 'right' | 'bottom' | 'left'): string | undefined {
  const longhand = map.get(`${box}-${side}`);
  if (longhand !== undefined) return longhand;
  const shorthand = map.get(box);
  if (shorthand === undefined) return undefined;
  const parts = splitTopLevel(shorthand, ' ').filter((p) => p !== '');
  const [a, b, c, d] = parts;
  if (a === undefined) return undefined;
  const top = a;
  const right = b ?? a;
  const bottom = c ?? a;
  const left = d ?? b ?? a;
  return { top, right, bottom, left }[side];
}

/** A selector's specificity as [ids, classes/attributes/pseudo-classes, types/pseudo-elements], enough to order the rules that match one element. */
function specificity(selector: string): [number, number, number] {
  const text = selector.replace(/\[[^\]]*\]/g, '[a]');
  const ids = (text.match(/#[\w-]+/g) ?? []).length;
  const elements = (text.match(/::[\w-]+/g) ?? []).length;
  const classes = (text.replace(/::[\w-]+/g, '').match(/\.[\w-]+|\[a\]|:[\w-]+/g) ?? []).length;
  const types = (text.replace(/::[\w-]+/g, '').match(/(?:^|[\s>+~(])[a-z][\w-]*/gi) ?? []).length;
  return [ids, classes, types + elements];
}

const compareSpecificity = (a: [number, number, number], b: [number, number, number]): number => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const matchesSafely = (element: Element, selector: string): boolean => {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
};

/** The rules outside any at-rule that match `element` and not `other`, in cascade order (specificity, then source order). Selectors with a pseudo-class or element are states: left out. */
function cascadeFor(rules: RawRule[], element: Element, other: Element | null): RawRule[] {
  const entries = outsideAtRules(rules).flatMap((rule) => {
    const hit = rule.selectors.filter((s) => !s.startsWith('@') && !s.includes(':') && matchesSafely(element, s) && (other === null || !matchesSafely(other, s)));
    if (hit.length === 0) return [];
    const best = hit.map(specificity).sort(compareSpecificity).at(-1) ?? [0, 0, 0];
    return [{ rule, best }];
  });
  entries.sort((a, b) => compareSpecificity(a.best, b.best) || a.rule.index - b.rule.index);
  return entries.map((e) => e.rule);
}

const DOT = 'radial-gradient(circle, var(--color-primary) 0 40%, var(--color-control-bg) 45%)';
const PLAIN = '.level-control button';
const CHECKED = ".level-control button[aria-checked='true']";
const UNAVAILABLE = ".level-control button[aria-disabled='true']";
const RING = '.level-control button .level-name::before';
const RING_CHECKED = ".level-control button[aria-checked='true'] .level-name::before";
const RING_UNAVAILABLE = ".level-control button[aria-disabled='true'] .level-name::before";
const MIN_HEIGHT_48 = 'min(calc(100dvh - 7rem), calc(min(var(--board-width), var(--column)) + 8.5rem))';
const MIN_HEIGHT_ANCHORED = 'min(calc(100dvh - 10.75rem), calc(min(var(--board-width), var(--column)) + 4.75rem))';

function tokenIn(set: TokenSet, name: string): string {
  const value = set.tokens[name];
  expect.assert(value !== undefined, `${set.label}: ${name} is declared in the token set`);
  return value;
}

/** Plain top-level rules of a selector, as the cards' state rules merge over them. */
const topRules = (rules: RawRule[], selector: string): RawRule[] => outsideAtRules(exact(rules, selector));

// ---------------------------------------------------------------------------------------------------------
// Size and place
// ---------------------------------------------------------------------------------------------------------

describe('The setup sheet takes the design size and place (update-setup-sheet, FR-96, A-60)', () => {
  // Scenario «The phone regime». Red today: padding is `20px 16px 16px`, the radius `12px 12px 0 0`, the placeholder line height is there.
  it('The phone regime: the rule that is exactly .setup-sheet outside any at-rule declares the bottom sheet', () => {
    const rule = only(topRules(RAW(), '.setup-sheet'), '.setup-sheet outside any at-rule');
    const have = merged([rule]);
    declares('.setup-sheet', have, 'position', 'fixed');
    declares('.setup-sheet', have, 'inset', 'auto 0 0 0');
    declares('.setup-sheet', have, 'width', '100%');
    declares('.setup-sheet', have, 'max-width', 'none');
    declares('.setup-sheet', have, 'margin', '0');
    declares('.setup-sheet', have, 'box-sizing', 'border-box');
    declares('.setup-sheet', have, 'overflow-y', 'auto');
    declares('.setup-sheet', have, 'border-width', '1px 1px 0 1px');
    declares('.setup-sheet', have, 'border-radius', 'var(--radius-l) var(--radius-l) 0 0');
    declares('.setup-sheet', have, 'padding', '1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))');
  });

  // Scenario «The phone regime», second clause. Red today: one `max-height: 80dvh`.
  it('The phone regime: max-height is declared exactly twice, 90vh first and 88dvh second (the browser without dvh keeps 90vh)', () => {
    const rule = only(topRules(RAW(), '.setup-sheet'), '.setup-sheet outside any at-rule');
    expect(written(rule, 'max-height'), '.setup-sheet { max-height } as written, in order').toEqual(['90vh', '88dvh']);
  });

  // Scenario «The phone regime», third clause. Red today: there is no `.setup-sheet` rule inside the 22.5rem block.
  it('The small phone: the rule that is exactly .setup-sheet inside @media (max-width: 22.5rem) declares max-height calc(100dvh - 9rem) and padding-top 1rem; the base padding-top is 1.5rem', () => {
    const raw = RAW();
    const small = only(insideOnly(exact(raw, '.setup-sheet'), MEDIA_SMALL), '.setup-sheet inside @media (max-width: 22.5rem)');
    const have = merged([small]);
    declares('.setup-sheet (22.5rem)', have, 'max-height', 'calc(100dvh - 9rem)');
    declares('.setup-sheet (22.5rem)', have, 'padding-top', '1rem');
    const base = merged([only(topRules(raw, '.setup-sheet'), '.setup-sheet outside any at-rule')]);
    expect.soft(canon(sideOf(base, 'padding', 'top')), 'the base rule { padding-top } is 1.5rem (through the padding shorthand)').toBe(canon('1.5rem'));
  });

  // Audit finding 7 / design.md decision 2: the 22.5rem rule comes AFTER the base rule. Red today: the rule does not exist.
  it('The small phone rule comes after the base .setup-sheet rule in the file, so it wins by source order', () => {
    const raw = RAW();
    const base = only(topRules(raw, '.setup-sheet'), '.setup-sheet outside any at-rule');
    const small = only(insideOnly(exact(raw, '.setup-sheet'), MEDIA_SMALL), '.setup-sheet inside @media (max-width: 22.5rem)');
    expect(small.index, 'the 22.5rem .setup-sheet rule is later in the file than the base rule').toBeGreaterThan(base.index);
  });

  // GUARD (audit finding 7): tests/play-page-panel-shell-stylesheet.test.ts:44-48 reads the FIRST `.setup-sheet {` block of the file as the top-level one. Green today; must stay green.
  it('GUARD: the first .setup-sheet rule of the file is the one outside any at-rule (the shell test reads the first block)', () => {
    const first = exact(RAW(), '.setup-sheet')[0];
    expect.assert(first !== undefined, 'premise: the file has a .setup-sheet rule');
    expect(first.context, 'the first .setup-sheet rule of the file is outside any at-rule').toEqual([]);
    expect(written(first, 'position'), 'and it is the phone rule (position: fixed)').toEqual(['fixed']);
  });

  // Scenario «The small phone tightens the cards». Red today: no 22.5rem rule for them, and the cards have no padding of their own.
  it('The small phone tightens the cards: gap 0.375rem and padding 0.375rem 0.625rem at 22.5rem, 0.5rem and 0.5rem 0.75rem outside any at-rule', () => {
    const raw = RAW();
    const small = (selector: string): Map<string, string> => merged(insideOnly(exact(raw, selector), MEDIA_SMALL));
    const base = (selector: string): Map<string, string> => merged(topRules(raw, selector));
    declares('.level-control (22.5rem)', small('.level-control'), 'gap', '0.375rem');
    declares('.level-control button (22.5rem)', small(PLAIN), 'padding', '0.375rem 0.625rem');
    declares('.level-control', base('.level-control'), 'gap', '0.5rem');
    declares('.level-control button', base(PLAIN), 'padding', '0.5rem 0.75rem');
  });

  // Scenario «The small phone tightens the cards», last clause. GUARD: no at-rule declares a min-height for these three controls today.
  it('GUARD: no min-height of .setup-start, .setup-close or .level-control button is declared inside an at-rule', () => {
    const offenders = RAW()
      .filter((r) => r.context.length > 0 && r.declarations.some((d) => d.property === 'min-height'))
      .filter((r) => r.selectors.some((s) => s.includes('.setup-start') || s.includes('.setup-close') || s.includes(PLAIN)))
      .map(where);
    expect(offenders, 'rules inside an at-rule that declare min-height for the footer buttons or the level cards').toEqual([]);
  });

  // Scenario «From 48rem the sheet covers the page from 6rem». Red today: 28rem wide, `margin: auto`, no min-height or max-height.
  it('From 48rem the sheet covers the page from 6rem: the one .setup-sheet rule inside @media (min-width: 48rem) declares the full-cover regime', () => {
    const rule = only(insideOnly(exact(RAW(), '.setup-sheet'), MEDIA_48), '.setup-sheet inside @media (min-width: 48rem)');
    const have = merged([rule]);
    declares('.setup-sheet (48rem)', have, 'inset', '0');
    declares('.setup-sheet (48rem)', have, 'width', 'calc(var(--column) + 1rem)');
    declares('.setup-sheet (48rem)', have, 'max-width', 'calc(100% - 2rem)');
    declares('.setup-sheet (48rem)', have, 'height', 'fit-content');
    declares('.setup-sheet (48rem)', have, 'max-height', 'calc(100dvh - 7rem)');
    declares('.setup-sheet (48rem)', have, 'min-height', MIN_HEIGHT_48);
    declares('.setup-sheet (48rem)', have, 'margin', '6rem auto auto');
    declares('.setup-sheet (48rem)', have, 'padding-bottom', '1rem');
    declares('.setup-sheet (48rem)', have, 'border-width', '1px');
    declares('.setup-sheet (48rem)', have, 'border-radius', 'var(--radius-l)');
  });

  // Scenario «From 48rem the sheet covers the page from 6rem», last clause. GUARD: the shell's three bindings are in the 48rem rule today, once each, and must stay.
  it("GUARD: the 48rem rule keeps the shell's bindings: box-shadow 0 1rem 2.5rem var(--color-shadow-panel), border-color and background-color only the shell's tokens, each at most once", () => {
    const rule = only(insideOnly(exact(RAW(), '.setup-sheet'), MEDIA_48), '.setup-sheet inside @media (min-width: 48rem)');
    expect(written(rule, 'box-shadow').map(canon), '.setup-sheet (48rem) { box-shadow }').toEqual([canon('0 1rem 2.5rem var(--color-shadow-panel)')]);
    const borders = written(rule, 'border-color');
    expect(borders.length, 'border-color is written at most once').toBeLessThanOrEqual(1);
    for (const value of borders) expect(value, '.setup-sheet (48rem) { border-color }').toBe('var(--color-overlay-border)');
    const fills = written(rule, 'background-color');
    expect(fills.length, 'background-color is written at most once').toBeLessThanOrEqual(1);
    for (const value of fills) expect(value, '.setup-sheet (48rem) { background-color }').toBe('var(--color-surface-raised)');
  });

  // Scenario «On a tall window the sheet hangs under the summary button». Red today: there is no such block.
  it('On a tall window the sheet hangs under the summary button: the one .setup-sheet rule inside @media (min-width: 48rem) and (min-height: 44rem)', () => {
    const rule = only(insideOnly(exact(RAW(), '.setup-sheet'), MEDIA_ANCHORED), `.setup-sheet inside ${MEDIA_ANCHORED}`);
    const have = merged([rule]);
    declares('.setup-sheet (anchored)', have, 'inset', '0 0 auto 0');
    declares('.setup-sheet (anchored)', have, 'width', 'var(--column)');
    declares('.setup-sheet (anchored)', have, 'max-height', 'calc(100dvh - 10.75rem)');
    declares('.setup-sheet (anchored)', have, 'min-height', MIN_HEIGHT_ANCHORED);
    declares('.setup-sheet (anchored)', have, 'margin', '9.75rem auto 0');
    for (const property of ['box-shadow', 'border-color', 'background-color']) {
      expect.soft(rule.declarations.some((d) => d.property === property), `.setup-sheet (anchored) does not declare ${property} (the shell's bindings stay in the 48rem rule)`).toBe(false);
    }
  });

  // Scenario «On a tall window...», second clause: source order. Red today: the block does not exist.
  it('The anchored block comes after the @media (min-width: 48rem) block that holds the .setup-sheet rule, so it wins by source order', () => {
    const raw = RAW();
    const full = only(insideOnly(exact(raw, '.setup-sheet'), MEDIA_48), '.setup-sheet inside @media (min-width: 48rem)');
    const anchored = only(insideOnly(exact(raw, '.setup-sheet'), MEDIA_ANCHORED), `.setup-sheet inside ${MEDIA_ANCHORED}`);
    expect(anchored.index, 'the anchored .setup-sheet rule is later in the file than the 48rem full-cover rule').toBeGreaterThan(full.index);
  });

  // Scenario «The sheet reads the board side through the root», first clause. Red today: neither min-height exists.
  it('The sheet reads the board side through the root: both min-height values read var(--board-width) and var(--column)', () => {
    const raw = RAW();
    const full = only(insideOnly(exact(raw, '.setup-sheet'), MEDIA_48), '.setup-sheet inside @media (min-width: 48rem)');
    const anchored = only(insideOnly(exact(raw, '.setup-sheet'), MEDIA_ANCHORED), `.setup-sheet inside ${MEDIA_ANCHORED}`);
    for (const rule of [full, anchored]) {
      const values = written(rule, 'min-height');
      expect.assert(values.length === 1, `${where(rule)} declares min-height once (is ${values.length} times)`);
      const value = values[0] ?? '';
      expect.soft(value, `${where(rule)} { min-height } reads var(--board-width)`).toContain('var(--board-width)');
      expect.soft(value, `${where(rule)} { min-height } reads var(--column)`).toContain('var(--column)');
      expect.soft(value, `${where(rule)} { min-height } is a min() of the window part and the board part`).toMatch(/^min\(/);
    }
  });

  // Scenario «The sheet reads the board side through the root», GUARD clauses: one `:has(` (the idle-line rule) and no `.board*` rule declares --board-width (the shell moved it to #app).
  it('GUARD: the raw text contains :has( exactly once and no rule whose selector begins with .board declares --board-width', () => {
    expect(readStyleText().match(/:has\(/gi) ?? [], 'exactly one :has(').toHaveLength(1);
    const offenders = RAW()
      .filter((r) => r.selectors.some((s) => s.startsWith('.board')) && r.declarations.some((d) => d.property === '--board-width'))
      .map(where);
    expect(offenders, 'rules beginning .board that declare --board-width').toEqual([]);
  });

  // Scenario «The sheet reads the board side through the root», GUARD clause: the closed sheet stays hidden by the user agent.
  it('GUARD: no rule that is exactly .setup-sheet declares display, at any width', () => {
    const offenders = exact(RAW(), '.setup-sheet').filter((r) => r.declarations.some((d) => d.property === 'display')).map(where);
    expect(offenders, 'rules exactly .setup-sheet that declare display').toEqual([]);
  });

  // Scenario «The sheet reads the board side through the root», last clause. Red today: `line-height: normal`.
  it('No rule that is exactly .setup-sheet declares line-height (the placeholder line-height: normal is gone), at any width', () => {
    const offenders = exact(RAW(), '.setup-sheet')
      .filter((r) => r.declarations.some((d) => d.property === 'line-height'))
      .map((r) => `${where(r)} { line-height: ${written(r, 'line-height').join(', ')} }`);
    expect(offenders, 'rules exactly .setup-sheet that declare line-height').toEqual([]);
  });

  // GUARD: the level group's bottom margin stays 28px outside any at-rule and no media rule changes it; the scroll padding covers the footer strip.
  it('GUARD: .setup-sheet > [data-control=level] keeps margin-bottom 28px outside any at-rule, and no rule inside an at-rule sets a margin on the level group', () => {
    const raw = RAW();
    const rule = only(topRules(raw, ".setup-sheet > [data-control='level']"), ".setup-sheet > [data-control='level']");
    expect(written(rule, 'margin-bottom'), '.setup-sheet > [data-control=level] { margin-bottom }').toEqual(['28px']);
    const changed = raw
      .filter((r) => r.context.length > 0 && r.selectors.some((s) => s.includes("[data-control='level']") || s.endsWith('.level-control')))
      .filter((r) => r.declarations.some((d) => d.property === 'margin' || d.property === 'margin-bottom'))
      .map(where);
    expect(changed, 'media rules that change the level group margin').toEqual([]);
  });

  it('GUARD: .setup-sheet:popover-open keeps scroll-padding-bottom of at least calc(2.75rem + 48px)', () => {
    const rule = only(topRules(RAW(), '.setup-sheet:popover-open'), '.setup-sheet:popover-open');
    const value = written(rule, 'scroll-padding-bottom').at(-1);
    expect.assert(value !== undefined, '.setup-sheet:popover-open declares scroll-padding-bottom');
    const m = /^calc\(\s*(-?[\d.]+)rem\s*\+\s*(-?[\d.]+)px\s*\)$/.exec(value) ?? /^(-?[\d.]+)px$/.exec(value);
    expect.assert(m?.[1] !== undefined, `scroll-padding-bottom is a calc(rem + px) or px value (is ${value})`);
    const px = m[2] !== undefined ? Number(m[1]) * 16 + Number(m[2]) : Number(m[1]);
    expect(px, `scroll-padding-bottom ${value} is at least 44px + 48px`).toBeGreaterThanOrEqual(2.75 * 16 + 48);
  });
});

// ---------------------------------------------------------------------------------------------------------
// The indent, the cards and the rings
// ---------------------------------------------------------------------------------------------------------

describe('The setup sheet takes the design paint (update-setup-sheet, FR-96, FR-65, A-60)', () => {
  // Scenario «The description starts under the name». Red today: the ring is 1rem, the description has no rule.
  it('The description starts under the name: padding-left calc(0.875rem + 0.5rem), the ring 0.875rem square, the name gap 0.5rem', () => {
    const raw = RAW();
    declares('.level-text', merged(topRules(raw, '.level-text')), 'padding-left', 'calc(0.875rem + 0.5rem)');
    declares(RING, merged(topRules(raw, RING)), 'width', '0.875rem');
    declares(RING, merged(topRules(raw, RING)), 'height', '0.875rem');
    declares('.level-control .level-name', merged(topRules(raw, '.level-control .level-name')), 'gap', '0.5rem');
  });

  // Scenario «The cards are painted as the design paints them», first clause. Red today: the card border is --color-control-border, the checked card --color-focus.
  it('The cards are painted as the design paints them: the plain, checked and unavailable card', () => {
    const raw = RAW();
    const plain = topRules(raw, PLAIN);
    const checked = topRules(raw, CHECKED);
    const unavailable = topRules(raw, UNAVAILABLE);
    expect.assert(plain.length > 0 && checked.length > 0 && unavailable.length > 0, 'the three card rules exist outside any at-rule');
    const base = merged(plain);
    declares(PLAIN, base, 'border-color', 'var(--color-option-border)');
    declares(PLAIN, base, 'background-color', 'var(--color-control-bg)');
    declares(PLAIN, base, 'color', 'var(--color-text)');
    declaresBorder(PLAIN, plain, { width: '2px', style: 'solid' });
    declares(CHECKED, merged([...plain, ...checked]), 'border-color', 'var(--color-primary)');
    declares(CHECKED, merged([...plain, ...checked]), 'background-color', 'var(--color-primary-soft)');
    const gone = merged([...plain, ...unavailable]);
    declaresBorder(UNAVAILABLE, [...plain, ...unavailable], { style: 'dashed', color: 'var(--color-control-border)' });
    declares(UNAVAILABLE, gone, 'background-color', 'var(--color-page)');
    declares(UNAVAILABLE, gone, 'color', 'var(--color-text-muted)');
    expect.soft(gone.has('opacity'), `${UNAVAILABLE} declares no opacity`).toBe(false);
  });

  // Scenario «The cards are painted as the design paints them», second clause. Red today: the ring border is --color-text, its fill --color-cell-bg, the dot an inset shadow.
  it('The cards are painted as the design paints them: the ring, the checked ring with the gradient dot, the unavailable ring', () => {
    const raw = RAW();
    const ring = topRules(raw, RING);
    const checked = topRules(raw, RING_CHECKED);
    const unavailable = topRules(raw, RING_UNAVAILABLE);
    expect.assert(ring.length > 0 && checked.length > 0 && unavailable.length > 0, 'the three ring rules exist outside any at-rule');
    declaresBorder(RING, ring, { width: '2px', style: 'solid', color: 'var(--color-control-border)' });
    declares(RING, merged(ring), 'background-color', 'var(--color-control-bg)');
    const dot = merged([...ring, ...checked]);
    declares(RING_CHECKED, dot, 'border-color', 'var(--color-primary)');
    declares(RING_CHECKED, merged(checked), 'background-image', DOT);
    declaresBorder(RING_UNAVAILABLE, [...ring, ...unavailable], { style: 'dashed' });
    declares(RING_UNAVAILABLE, merged([...ring, ...unavailable]), 'background-color', 'transparent');
    expect.soft(merged(unavailable).has('background-image'), `${RING_UNAVAILABLE} declares no background-image`).toBe(false);
  });

  // Scenario «The cards are painted as the design paints them», third clause. Red today: the checked ring's dot is an inset box-shadow.
  it('No box-shadow in any of the six card and ring rules (no inset shadow on the unavailable card, no inset dot on the checked ring)', () => {
    const raw = RAW();
    const six = [PLAIN, CHECKED, UNAVAILABLE, RING, RING_CHECKED, RING_UNAVAILABLE];
    for (const selector of six) expect.assert(exact(raw, selector).length > 0, `${selector}: the rule exists`);
    const offenders = six.flatMap((selector) => exact(raw, selector)).filter((r) => r.declarations.some((d) => d.property === 'box-shadow')).map((r) => `${where(r)} { box-shadow: ${written(r, 'box-shadow').join(', ')} }`);
    expect(offenders, 'card and ring rules that declare box-shadow').toEqual([]);
  });

  // Scenario «The cards are painted as the design paints them», last clause. Red today: `.level-text` has no rule.
  it('The description is muted, and the checked card has its description in --color-text', () => {
    const raw = RAW();
    declares('.level-text', merged(topRules(raw, '.level-text')), 'color', 'var(--color-text-muted)');
    declares(`${CHECKED} .level-text`, merged(topRules(raw, `${CHECKED} .level-text`)), 'color', 'var(--color-text)');
  });

  // Scenario «The reason line has its accent». The rule is found by matching the mounted element. Red today: only `.level-control p { margin: 0; line-height: 1.4 }`.
  it('The reason line has its accent: border-left 3px solid var(--color-primary), color var(--color-text), font-size 0.875rem, line-height 1.35', () => {
    const root = mountFixture(BLANK);
    const reason = q(root, '[data-level-reason]');
    const rules = cascadeFor(RAW(), reason, null);
    const have = merged(rules);
    declares('[data-level-reason]', have, 'border-left', '3px solid var(--color-primary)');
    declares('[data-level-reason]', have, 'color', 'var(--color-text)');
    declares('[data-level-reason]', have, 'font-size', '0.875rem');
    declares('[data-level-reason]', have, 'line-height', '1.35');
  });

  // Scenario «Only the size options in the sheet take the primary paint», first clause. Red today: checked is --color-focus on --color-given-bg; unchecked has no muted ink or weight.
  it('The size options take the primary paint: the checked option and the unchecked option (muted ink, weight 500, control fill)', () => {
    const raw = RAW();
    const plain = topRules(raw, '.size-control button');
    const checked = topRules(raw, ".size-control button[aria-checked='true']");
    expect.assert(plain.length > 0 && checked.length > 0, 'the two size-option rules exist outside any at-rule');
    declares(".size-control button[aria-checked='true']", merged(checked), 'border-color', 'var(--color-primary)');
    declares(".size-control button[aria-checked='true']", merged(checked), 'background-color', 'var(--color-primary-soft)');
    declares(".size-control button[aria-checked='true']", merged(checked), 'color', 'var(--color-text)');
    declares(".size-control button[aria-checked='true']", merged(checked), 'font-weight', '700');
    declares('.size-control button', merged(plain), 'color', 'var(--color-text-muted)');
    declares('.size-control button', merged(plain), 'background-color', 'var(--color-control-bg)');
    declares('.size-control button', merged(plain), 'font-weight', '500');
  });

  // Scenario «Only the size options in the sheet take the primary paint», last clause. GUARD: the theme and language options are not changed by this change.
  it('GUARD: the theme and language options still declare border-color var(--color-focus) and background-color var(--color-given-bg)', () => {
    const raw = RAW();
    for (const selector of [".theme-control button[aria-checked='true']", ".language-control button[aria-checked='true']"]) {
      const rule = only(topRules(raw, selector), selector);
      declares(selector, merged([rule]), 'border-color', 'var(--color-focus)');
      declares(selector, merged([rule]), 'background-color', 'var(--color-given-bg)');
    }
  });

  // Scenario «Почати» is filled and «Закрити» has a border», first clause: the rule is found by matching the mounted button. Red today: outlined, `--color-focus` on `--color-control-bg`.
  it('«Почати» is filled: the rules that match [data-action=setup-start] and not [data-action=setup-close] declare the primary fill, border, ink, padding and weight', () => {
    const root = mountFixture(BLANK);
    const start = q(root, '[data-action="setup-start"]');
    const close = q(root, '[data-action="setup-close"]');
    const own = cascadeFor(RAW(), start, close);
    expect.assert(own.length > 0, 'a plain rule that matches «Почати» and not «Закрити»');
    const have = merged(own);
    declares('«Почати»', have, 'background-color', 'var(--color-primary)');
    declares('«Почати»', have, 'border-color', 'var(--color-primary)');
    declares('«Почати»', have, 'color', 'var(--color-primary-text)');
    declares('«Почати»', have, 'padding', '0 0.75rem');
    declares('«Почати»', have, 'font-weight', '700');
  });

  // Scenario «Почати» is filled and «Закрити» has a border», second clause. Red today: no border colour, no padding, the fill is raised already (the shell).
  it('«Закрити» has a border: the rule that is exactly .setup-close outside any at-rule declares border-color var(--color-control-border), a 2px border, padding 0 0.5rem and the raised fill', () => {
    const rule = only(topRules(RAW(), '.setup-close'), '.setup-close outside any at-rule');
    declares('.setup-close', merged([rule]), 'border-color', 'var(--color-control-border)');
    declaresBorder('.setup-close', [rule], { width: '2px' });
    declares('.setup-close', merged([rule]), 'padding', '0 0.5rem');
    declares('.setup-close', merged([rule]), 'background-color', 'var(--color-surface-raised)');
  });

  // Scenario «The sheet has no motion and no new colour literal», first clause. GUARD: no motion on the sheet's or the level group's rules today.
  it('GUARD: no .setup-sheet* or .level-control* rule is inside prefers-reduced-motion: no-preference or @starting-style, and none declares transition or animation', () => {
    const rules = RAW().filter((r) => r.selectors.some((s) => s.startsWith('.setup-sheet') || s.startsWith('.level-control')));
    expect(rules.length, 'the walk found the sheet and level rules').toBeGreaterThan(10);
    const inMotion = rules.filter((r) => r.context.some((c) => /prefers-reduced-motion|starting-style/i.test(c))).map(where);
    expect(inMotion, 'sheet or level rules inside a motion at-rule').toEqual([]);
    const nested = rules.filter((r) => r.hasNestedBlock).map(where);
    expect(nested, 'sheet or level rules with a nested block (a nested @starting-style would hide here)').toEqual([]);
    const moving = rules
      .filter((r) => r.declarations.some((d) => /^(transition|animation)(-|$)/.test(d.property)))
      .map((r) => `${where(r)} { ${r.declarations.filter((d) => /^(transition|animation)/.test(d.property)).map((d) => `${d.property}: ${d.value}`).join('; ')} }`);
    expect(moving, 'sheet or level rules that declare transition or animation').toEqual([]);
  });

  // Scenario «The sheet has no motion and no new colour literal», second clause: the colour scan over those rules. GUARD: nothing in them is a literal today; it must stay so.
  it('GUARD: the colour scan over the .setup-sheet* and .level-control* rules finds no literal, no named colour and no color-mix(', () => {
    const parsed = readStyles();
    const sheet = parsed.rules.filter((r) => r.selectors.some((s) => s.startsWith('.setup-sheet') || s.startsWith('.level-control')));
    expect(sheet.length, 'the scan reads the sheet and level rules').toBeGreaterThan(10);
    const scan = scanColours({ ...parsed, rules: sheet });
    expect(scan.literals, 'no colour literal').toEqual([]);
    expect(scan.named, 'no named colour').toEqual([]);
    expect(scan.shorthands, 'every colour-bearing shorthand has a token colour').toEqual([]);
    expect(scan.colourProperties, 'every colour property is a token or an allowed keyword').toEqual([]);
    // the raw read adds what the CSSOM drops (a shorthand with var(), a function value)
    const raw = RAW().filter((r) => r.selectors.some((s) => s.startsWith('.setup-sheet') || s.startsWith('.level-control')));
    const hits = raw.flatMap((r) => r.declarations.filter((d) => COLOUR_LITERAL.test(d.value) || namedColoursIn(d.value).length > 0 || d.value.includes('color-mix(')).map((d) => `${where(r)} { ${d.property}: ${d.value} }`));
    expect(hits, 'raw declarations with a colour literal, a named colour or color-mix(').toEqual([]);
  });

  // Scenario «The sheet has no motion and no new colour literal», last clause. Red today: the checked ring has no gradient.
  it('The gradient of the checked ring has its colours as var(--color-...) tokens', () => {
    const rule = only(topRules(RAW(), RING_CHECKED), RING_CHECKED);
    const image = written(rule, 'background-image').at(-1);
    expect.assert(image !== undefined, `${RING_CHECKED} declares a background-image (the dot)`);
    expect(image, 'the dot is a radial-gradient').toContain('radial-gradient(');
    const stops = [...image.matchAll(/var\(\s*(--color-[\w-]+)\s*\)/g)].map((m) => m[1]);
    expect(stops, 'the gradient names two colours, both tokens').toEqual(['--color-primary', '--color-control-bg']);
    const leftover = image.replace(/var\(\s*--color-[\w-]+\s*\)/g, ' ');
    expect(COLOUR_LITERAL.test(leftover) || namedColoursIn(leftover).filter((n) => n !== 'circle').length > 0, 'no colour literal or named colour beside the tokens').toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------
// The inner metrics (the design's)
// ---------------------------------------------------------------------------------------------------------

describe('The setup sheet takes the design inner metrics (update-setup-sheet, «Inner metrics», A-60)', () => {
  // Red today: padding 0 8px is the same value as 0 0.5rem (GUARD part), but there is no font-size, line-height or radius.
  it('The size options: padding 0 0.5rem, 2px border, font-size 0.9375rem, line-height 1.2, weight 500, radius calc(var(--radius-m) - 0.1875rem)', () => {
    const rules = topRules(RAW(), '.size-control button');
    expect.assert(rules.length > 0, '.size-control button exists');
    const have = merged(rules);
    declares('.size-control button', have, 'padding', '0 0.5rem');
    declaresBorder('.size-control button', rules, { width: '2px' });
    declares('.size-control button', have, 'font-size', '0.9375rem');
    declares('.size-control button', have, 'line-height', '1.2');
    declares('.size-control button', have, 'font-weight', '500');
    declares('.size-control button', have, 'border-radius', 'calc(var(--radius-m) - 0.1875rem)');
  });

  // Red today: max-width 22rem, margin 0 auto 12px, radius 8px, padding and gap 3px (0.1875rem is 3px: those two are the same value).
  it('The size control: width 100% with no max-width, margin 0, radius var(--radius-m), 1px border, padding and gap 0.1875rem', () => {
    const rules = topRules(RAW(), '.size-control');
    expect.assert(rules.length > 0, '.size-control exists');
    const have = merged(rules);
    declares('.size-control', have, 'width', '100%');
    expect.soft(have.get('max-width'), '.size-control declares no max-width (is the page max-width: 22rem)').toBeUndefined();
    declares('.size-control', have, 'margin', '0');
    declares('.size-control', have, 'border-radius', 'var(--radius-m)');
    declaresBorder('.size-control', rules, { width: '1px' });
    declares('.size-control', have, 'padding', '0.1875rem');
    declares('.size-control', have, 'gap', '0.1875rem');
  });

  // Red today: gap 6px, margin 0 0 16px.
  it('The level group: gap 0.5rem and margin-top 0.75rem', () => {
    const rules = topRules(RAW(), '.level-control');
    expect.assert(rules.length > 0, '.level-control exists');
    const have = merged(rules);
    declares('.level-control', have, 'gap', '0.5rem');
    expect.soft(canon(sideOf(have, 'margin', 'top')), '.level-control { margin-top: 0.75rem } (through margin or margin-top)').toBe(canon('0.75rem'));
  });

  // Red today: no padding of its own, gap 2px (the same value as 0.125rem), border-radius from the base button.
  it('The level cards: padding 0.5rem 0.75rem, gap 0.125rem, min-height 2.75rem, 2px border, radius var(--radius-m)', () => {
    const rules = topRules(RAW(), PLAIN);
    expect.assert(rules.length > 0, `${PLAIN} exists`);
    const have = merged(rules);
    declares(PLAIN, have, 'padding', '0.5rem 0.75rem');
    declares(PLAIN, have, 'gap', '0.125rem');
    declares(PLAIN, have, 'min-height', '2.75rem');
    declaresBorder(PLAIN, rules, { width: '2px' });
    declares(PLAIN, have, 'border-radius', 'var(--radius-m)');
  });

  // Red today: the name has weight 700 and gap 0.5rem only.
  it('The card name: font-size 1rem, weight 700, line-height 1.25, gap 0.5rem', () => {
    const have = merged(topRules(RAW(), '.level-control .level-name'));
    declares('.level-control .level-name', have, 'font-size', '1rem');
    declares('.level-control .level-name', have, 'font-weight', '700');
    declares('.level-control .level-name', have, 'line-height', '1.25');
    declares('.level-control .level-name', have, 'gap', '0.5rem');
  });

  // Red today: the page has no .level-text rule.
  it('The card description: font-size 0.875rem, weight 400, line-height 1.35', () => {
    const have = merged(topRules(RAW(), '.level-text'));
    declares('.level-text', have, 'font-size', '0.875rem');
    declares('.level-text', have, 'font-weight', '400');
    declares('.level-text', have, 'line-height', '1.35');
  });

  // Red today: no rule for the reason line besides `.level-control p`.
  it('The reason line: margin 0, padding 0.25rem 0 0.25rem 0.75rem, font-size 0.875rem, line-height 1.35', () => {
    const root = mountFixture(BLANK);
    const have = merged(cascadeFor(RAW(), q(root, '[data-level-reason]'), null));
    declares('[data-level-reason]', have, 'margin', '0');
    declares('[data-level-reason]', have, 'padding', '0.25rem 0 0.25rem 0.75rem');
    declares('[data-level-reason]', have, 'font-size', '0.875rem');
    declares('[data-level-reason]', have, 'line-height', '1.35');
  });

  // Red today: the page's base button padding applies (10px 16px) and the weight is 700 on «Закрити».
  it('«Почати»: padding 0 0.75rem, 2px border, radius var(--radius-m), weight 700, line-height 1.2, min-height 2.75rem', () => {
    const root = mountFixture(BLANK);
    const own = cascadeFor(RAW(), q(root, '[data-action="setup-start"]'), q(root, '[data-action="setup-close"]'));
    expect.assert(own.length > 0, 'a plain rule that matches «Почати» and not «Закрити»');
    const have = merged(own);
    declares('«Почати»', have, 'padding', '0 0.75rem');
    declaresBorder('«Почати»', own, { width: '2px' });
    declares('«Почати»', have, 'border-radius', 'var(--radius-m)');
    declares('«Почати»', have, 'font-weight', '700');
    declares('«Почати»', have, 'line-height', '1.2');
    declares('«Почати»', have, 'min-height', '2.75rem');
  });

  // Red today: no padding, no radius, weight 700.
  it('«Закрити»: padding 0 0.5rem, 2px border, radius var(--radius-m), weight 600, min-height 2.75rem', () => {
    const rule = only(topRules(RAW(), '.setup-close'), '.setup-close outside any at-rule');
    const have = merged([rule]);
    declares('.setup-close', have, 'padding', '0 0.5rem');
    declaresBorder('.setup-close', [rule], { width: '2px' });
    declares('.setup-close', have, 'border-radius', 'var(--radius-m)');
    declares('.setup-close', have, 'font-weight', '600');
    declares('.setup-close', have, 'min-height', '2.75rem');
  });
});

// ---------------------------------------------------------------------------------------------------------
// «Borders, cues and focus rings have enough contrast»: the tokens and pairs this change adds
// ---------------------------------------------------------------------------------------------------------

describe('The ring pairs and the option border token (update-setup-sheet, FR-65, A-60)', () => {
  // Scenario «The level ring and the checked state have 3:1 on the card and the sheet». The tokens exist today, so the ratios are a GUARD; the pair list is the helper's.
  it('GUARD: the ring, the dot and the checked border have 3:1 on the card and the sheet (3.68 / 4.13, 5.40 / 7.39, 5.40 / 6.82), and the pairs are in the right groups', () => {
    const want: Record<string, [number, number, number]> = { light: [3.68, 5.4, 5.4], dark: [4.13, 7.39, 6.82] };
    for (const set of themeTokenSets(readStyles())) {
      const ratios = [
        contrastRatio(tokenIn(set, '--color-control-border'), tokenIn(set, '--color-control-bg')),
        contrastRatio(tokenIn(set, '--color-primary'), tokenIn(set, '--color-control-bg')),
        contrastRatio(tokenIn(set, '--color-primary'), tokenIn(set, '--color-surface-raised')),
      ];
      expect(ratios.map((r) => Number(r.toFixed(2))), `${set.label}: ring on the card, dot on the ring fill, checked border on the sheet`).toEqual(want[set.label]);
      for (const ratio of ratios) expect(ratio, `${set.label}: at least 3`).toBeGreaterThanOrEqual(3);
      expect(Number(contrastRatio(tokenIn(set, '--color-primary'), tokenIn(set, '--color-primary-soft')).toFixed(2)), `${set.label}: the checked border on its own fill (the existing hinted-cue pair)`).toBe(
        set.label === 'light' ? 4.41 : 6.13,
      );
    }
    const groupOf = (fg: string, bg: string): string[] => CONTRAST_PAIRS.filter((p) => p.fg === fg && p.bg === bg).map((p) => p.group);
    expect(groupOf('--color-control-border', '--color-control-bg'), 'the ring pair is in group control-border, once').toEqual(['control-border']);
    expect(groupOf('--color-primary', '--color-control-bg'), 'the dot pair is in group hinted-cue, once').toEqual(['hinted-cue']);
    expect(groupOf('--color-primary', '--color-surface-raised'), 'the checked border pair is in group hinted-cue, once').toEqual(['hinted-cue']);
    expect([...new Set(CONTRAST_PAIRS.map((p) => p.group))].sort(), 'no new PairGroup').toEqual(['cause-cue', 'cell-border', 'control-border', 'focus-ring', 'hinted-cue', 'text', 'violation-cue']);
    expect(CONTRAST_PAIRS, '41 pairs').toHaveLength(41);
  });

  // Scenario «The available card's border is decoration and in no pair», first clause. Red today: the token is not declared.
  it('The available card border is decoration: --color-option-border is #c4b59c / #5a5045, not translucent, 1.98 / 1.98 (light) and 2.06 / 1.90 (dark), and in no pair', () => {
    expect(TOKEN_NAMES.at(-1), 'the 32nd name of the helper').toBe('--color-option-border');
    expect(TRANSLUCENT_TOKENS.has('--color-option-border'), 'not a translucent token').toBe(false);
    const want: Record<string, { value: string; onCard: number; onSheet: number }> = {
      light: { value: '#c4b59c', onCard: 1.98, onSheet: 1.98 },
      dark: { value: '#5a5045', onCard: 2.06, onSheet: 1.9 },
    };
    for (const set of themeTokenSets(readStyles())) {
      const token = tokenIn(set, '--color-option-border');
      const expected = want[set.label];
      expect.assert(expected !== undefined, `premise: ${set.label} is a known set`);
      expect(token, `${set.label}: --color-option-border is #rrggbb`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(token.toLowerCase(), `${set.label}: --color-option-border`).toBe(expected.value);
      expect(Number(contrastRatio(token, tokenIn(set, '--color-control-bg')).toFixed(2)), `${set.label}: on the card (--color-control-bg)`).toBe(expected.onCard);
      expect(Number(contrastRatio(token, tokenIn(set, '--color-surface-raised')).toFixed(2)), `${set.label}: on the sheet (--color-surface-raised)`).toBe(expected.onSheet);
    }
    expect(
      CONTRAST_PAIRS.filter((p) => p.fg === '--color-option-border' || p.bg === '--color-option-border'),
      'no pair of CONTRAST_PAIRS names --color-option-border (decoration, below 3:1 on purpose)',
    ).toEqual([]);
  });

  // Scenario «The available card's border is decoration and in no pair», last clause. Red today: the token is not declared and bound by nothing.
  it('--color-option-border is bound: a declaration outside :root has the value var(--color-option-border) (the available card border-color)', () => {
    const parsed = readStyles();
    const outside = parsed.rules.filter((r) => !r.selectors.every((s) => s === ':root' || /^:root\[data-theme=["']?dark["']?\]$/.test(s)));
    const bound = outside.flatMap((r) => r.declarations.filter((d) => d.value === 'var(--color-option-border)').map((d) => `${r.selectors.join(', ')} { ${d.property} }`));
    expect(bound.length, '--color-option-border is the value of at least one declaration outside :root').toBeGreaterThan(0);
    const raw = RAW();
    expect(merged(topRules(raw, PLAIN)).get('border-color'), `${PLAIN} { border-color }`).toBe('var(--color-option-border)');
  });
});
