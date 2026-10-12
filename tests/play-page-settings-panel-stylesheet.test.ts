// Play page: the settings panel takes the design's size, place and paint, read from src/ui/style.css (update-settings-panel, NFR-14 G2 settings-panel block, A-61).
// One or more tests per stylesheet scenario of the ADDED requirement «The settings panel takes the design's size, place and paint» in
// openspec/changes/update-settings-panel/specs/play-page/spec.md. The browser read against the design build is e2e/nfr-14-settings-panel.spec.ts (jsdom has no
// layout), so everything here is read as declarations, which is what the scenarios ask. Written FIRST (red) from the spec, before the port.
//
// @trace NFR-14
// @trace FR-68
// @trace FR-65
// @trace FR-117
//
// Why the stylesheet is read from the raw text (the reader below is a file-local copy of tests/play-page-setup-sheet-stylesheet.test.ts, not an export of it): jsdom's CSSOM
// DROPS `padding: 1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))`, keeps only the LAST of two `max-height` declarations (the requirement asks for two) and cannot show
// the at-rule context together with the source order. The raw reader keeps the author's text, the at-rule chain and the order. `declarationsFor` of tests/helpers/css.ts
// returns a Map and could not see `max-height` twice.
//
// Values are compared in two ways. `declares` (the setup-sheet reader's) uses a canonical form: whitespace tidied, `0px` as `0`, a plain `rem` length as px. `expectWritten`
// compares the value AS WRITTEN, whitespace and comma spacing aside: design.md decision 2 asks the theme and language options for the same literal forms as `.size-control
// button` ("character for character"), so `padding: 0 8px` is not `padding: 0 0.5rem` here.
//
// Tests that pass today by design are marked GUARD in their title; the rest are red on today's page, each failing assertion naming the missing declaration.
import { describe, expect, it } from 'vitest';
import { COLOUR_LITERAL, CONTRAST_PAIRS, TOKEN_NAMES, namedColoursIn, readStyleText, readStyles } from './helpers/css';

// ---------------------------------------------------------------------------------------------------------
// A raw reader of the stylesheet: rules in source order, each with its at-rule chain, selector list and declarations as written
// (copied from tests/play-page-setup-sheet-stylesheet.test.ts; keep the two in step by hand)
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


/** Plain top-level rules of a selector. */
const topRules = (rules: RawRule[], selector: string): RawRule[] => outsideAtRules(exact(rules, selector));

/** A value as written, whitespace and comma spacing tidied (no unit conversion): the forms of `.size-control button` are copied character for character. */
const tidy = (value: string): string => squash(value).replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s*,\s*/g, ', ');

/** The last value written for `property` in the rule, tidied; `undefined` when the rule does not declare it. */
const writtenLast = (rule: RawRule, property: string): string | undefined => {
  const values = written(rule, property);
  const last = values[values.length - 1];
  return last === undefined ? undefined : tidy(last);
};

/** `expect.soft`: one failing test lists every declaration that is wrong or missing, each by name. */
function expectWritten(label: string, rule: RawRule, property: string, want: string): void {
  const have = writtenLast(rule, property);
  expect.soft(have ?? '(missing)', `${label} { ${property}: ${want} } (is ${have ?? 'missing'})`).toBe(tidy(want));
}

const SETTINGS = '.settings';
const SETTINGS_CLOSE = '.settings-close';
const SETTINGS_OPEN = '.settings:popover-open';
const SIZE_PLAIN = '.size-control button';
const THEME_PLAIN = '.theme-control button';
const LANGUAGE_PLAIN = '.language-control button';
const checkedOf = (plain: string): string => `${plain}[aria-checked='true']`;

const SHELL_DECLARATIONS = ['background-color', 'border-color', 'box-shadow'] as const;

// ---------------------------------------------------------------------------------------------------------
// Size and place
// ---------------------------------------------------------------------------------------------------------

describe('The settings panel takes the design size and place (update-settings-panel, A-61)', () => {
  // Scenario «The phone regime and the small-phone padding». Red today: `max-height: 55dvh` once, padding `24px 16px 16px`, no 22.5rem rule.
  it('The phone regime and the small-phone padding', () => {
    const raw = RAW();
    const top = only(topRules(raw, SETTINGS), '.settings outside any at-rule');
    expect.soft(written(top, 'max-height'), '.settings { max-height } is declared exactly twice, 60vh then 55dvh (the fallback first)').toEqual(['60vh', '55dvh']);
    expectWritten('.settings', top, 'padding', '1.5rem 1rem calc(1rem + env(safe-area-inset-bottom))');
    // the shell's three declarations are each written once in the top-level rule
    for (const property of SHELL_DECLARATIONS) {
      expect.soft(written(top, property), `.settings { ${property} } is written once in the top-level rule`).toHaveLength(1);
    }
    // no rule that is exactly `.settings` declares `display`, at any width
    const withDisplay = exact(raw, SETTINGS).filter((r) => written(r, 'display').length > 0).map(where);
    expect.soft(withDisplay, 'rules that are exactly .settings and declare display').toEqual([]);
    // the 22.5rem rule, after the top-level rule in source order
    const small = only(insideOnly(exact(raw, SETTINGS), MEDIA_SMALL), `.settings inside ${MEDIA_SMALL}`);
    declares(`${MEDIA_SMALL} .settings`, merged([small]), 'padding-top', '1rem');
    expect.soft(small.index > top.index, `the ${MEDIA_SMALL} .settings block (rule ${small.index}) comes after the top-level .settings rule (rule ${top.index}), so it wins by source order`).toBe(true);
  });

  // Scenario «From 48rem the dropdown keeps its place». GUARD: true today (the rule is not edited) and must stay true.
  it('GUARD: From 48rem the dropdown keeps its place', () => {
    const rule = only(insideOnly(exact(RAW(), SETTINGS), MEDIA_48), `.settings inside ${MEDIA_48}`);
    const have = merged([rule]);
    declares('.settings (48rem)', have, 'width', 'min(22rem, var(--column))');
    declares('.settings (48rem)', have, 'max-width', 'calc(100% - 2rem)');
    declares('.settings (48rem)', have, 'max-height', 'calc(100dvh - 7rem)');
    declares('.settings (48rem)', have, 'margin', '6rem 0 auto calc(50% + var(--column) / 2 - min(22rem, var(--column)))');
    declares('.settings (48rem)', have, 'padding', '16px');
  });
});

// ---------------------------------------------------------------------------------------------------------
// The options
// ---------------------------------------------------------------------------------------------------------

const PLAIN_PAINT: [string, string][] = [
  ['min-width', '0'],
  ['min-height', '2.75rem'],
  ['padding', '0 0.5rem'],
  ['border-width', '2px'],
  ['border-style', 'solid'],
  ['border-color', 'transparent'],
  ['border-radius', 'calc(var(--radius-m) - 0.1875rem)'],
  ['background-color', 'var(--color-control-bg)'],
  ['color', 'var(--color-text-muted)'],
  ['font-size', '0.9375rem'],
  ['font-weight', '500'],
  ['line-height', '1.2'],
  ['white-space', 'nowrap'],
];
const CHECKED_PAINT: [string, string][] = [
  ['border-color', 'var(--color-primary)'],
  ['background-color', 'var(--color-primary-soft)'],
  ['color', 'var(--color-text)'],
  ['font-weight', '700'],
];

describe('The theme and language options take the segmented paint (update-settings-panel, A-61)', () => {
  // Scenario «The theme and language options take the segmented paint», first two clauses. Red today: padding `0 8px`, radius `7px`, ink `--color-text`, no font-size, weight or
  // line-height on the plain rule; the checked rule is `--color-focus` on `--color-given-bg`.
  it('The theme and language options take the segmented paint: each plain rule and each checked rule declares the size options\' literal forms', () => {
    const raw = RAW();
    for (const plain of [THEME_PLAIN, LANGUAGE_PLAIN]) {
      const plainRule = only(topRules(raw, plain), `${plain} outside any at-rule`);
      for (const [property, want] of PLAIN_PAINT) expectWritten(plain, plainRule, property, want);
      const checked = checkedOf(plain);
      const checkedRule = only(topRules(raw, checked), `${checked} outside any at-rule`);
      for (const [property, want] of CHECKED_PAINT) expectWritten(checked, checkedRule, property, want);
    }
  });

  // Scenario «The theme and language options take the segmented paint», last clause, first half. Red today: both checked rules declare an inset `box-shadow`.
  it('The theme and language options take the segmented paint: neither checked rule declares box-shadow (the inner ring goes)', () => {
    const raw = RAW();
    for (const plain of [THEME_PLAIN, LANGUAGE_PLAIN]) {
      const checked = checkedOf(plain);
      const rule = only(topRules(raw, checked), `${checked} outside any at-rule`);
      expect(written(rule, 'box-shadow'), `${checked} declares no box-shadow`).toEqual([]);
    }
  });

  // Scenario «The theme and language options take the segmented paint», last clause, second half (the re-audited wording): no rule whose selector contains `.theme-control` or
  // `.language-control` names --color-focus or --color-given-bg in a background, background-color, border, border-color or border-*-color declaration. The `outline-color` of the
  // :focus-visible rules is the ring and is allowed. Red today: both checked rules.
  it('The theme and language options take the segmented paint: no rule of the two controls names --color-focus or --color-given-bg as a fill or a frame', () => {
    const rules = RAW().filter((r) => r.selectors.some((s) => s.includes('.theme-control') || s.includes('.language-control')));
    expect(rules.length, 'the walk found the rules of the two controls').toBeGreaterThan(4);
    const FILL_OR_FRAME = /^(background|background-color|border|border-color|border-(top|right|bottom|left)(-color)?)$/;
    const offenders = rules.flatMap((r) =>
      r.declarations
        .filter((d) => FILL_OR_FRAME.test(d.property) && /--color-(focus|given-bg)\b/.test(d.value))
        .map((d) => `${where(r)} { ${d.property}: ${d.value} }`),
    );
    expect(offenders, 'declarations of the theme and language controls that name --color-focus or --color-given-bg as a fill or a frame').toEqual([]);
  });

  // Scenario «The three segmented option rules agree». Red today: the theme and language rules differ from the size rule in padding, radius, ink, font size, weight, line height and flex-independent
  // declarations. A declaration missing from one rule is a difference (re-audited wording: min-width, border-style, border-color and white-space are compared too).
  it('The three segmented option rules agree: the plain rules declare the same value, written the same way, for the thirteen declarations; the checked rules for the four', () => {
    const raw = RAW();
    const compare = (label: string, selectors: string[], properties: string[]): void => {
      const rules = selectors.map((selector) => only(topRules(raw, selector), `${selector} outside any at-rule`));
      for (const property of properties) {
        const values = rules.map((rule) => writtenLast(rule, property));
        const list = selectors.map((selector, i) => `${selector} { ${property}: ${values[i] ?? 'missing'} }`).join('; ');
        expect.soft(values[0], `${label}: ${property} is declared by the size rule: ${list}`).toBeDefined();
        expect.soft(values[1], `${label}: the theme rule agrees with the size rule on ${property}: ${list}`).toBe(values[0]);
        expect.soft(values[2], `${label}: the language rule agrees with the size rule on ${property}: ${list}`).toBe(values[0]);
      }
    };
    compare('plain', [SIZE_PLAIN, THEME_PLAIN, LANGUAGE_PLAIN], [
      'min-width', 'min-height', 'padding', 'border-width', 'border-style', 'border-color', 'border-radius', 'font-size', 'font-weight', 'line-height', 'white-space', 'color', 'background-color',
    ]);
    compare('checked', [checkedOf(SIZE_PLAIN), checkedOf(THEME_PLAIN), checkedOf(LANGUAGE_PLAIN)], ['border-color', 'background-color', 'color', 'font-weight']);
  });

  // Scenario «The theme options grow by content and the language options are equal halves» (the stylesheet half; the browser half is e2e/nfr-14-settings-panel.spec.ts).
  // Red today: both options declare `flex: 1 1 auto`.
  it('The theme options grow by content and the language options are equal halves: flex 1 1 auto and flex 1 1 0', () => {
    const raw = RAW();
    expectWritten(THEME_PLAIN, only(topRules(raw, THEME_PLAIN), THEME_PLAIN), 'flex', '1 1 auto');
    expectWritten(LANGUAGE_PLAIN, only(topRules(raw, LANGUAGE_PLAIN), LANGUAGE_PLAIN), 'flex', '1 1 0');
  });
});

// ---------------------------------------------------------------------------------------------------------
// «Закрити»
// ---------------------------------------------------------------------------------------------------------

describe('«Закрити» of the settings panel is sticky with the mask (update-settings-panel, A-61)', () => {
  // Scenario ««Закрити» is sticky with the mask». Red today: no position, bottom or shadow, `margin-top: 8px` is the only kept value, weight 700, no padding, style or colour of the border.
  it('«Закрити» is sticky with the mask: the one .settings-close rule outside any at-rule declares the design\'s sticky button', () => {
    const rules = exact(RAW(), SETTINGS_CLOSE);
    const rule = only(rules, '.settings-close');
    expect(rule.context, '.settings-close is outside any at-rule').toEqual([]);
    // The mask is compared as written (the spec: "whitespace aside"); the other values by their canonical form, so `margin-top: 8px` is `0.5rem` (the spec names no literal form here).
    const label = SETTINGS_CLOSE;
    expectWritten(label, rule, 'box-shadow', '0 0 0 1rem var(--color-surface-raised), 0 1rem 0 1rem var(--color-surface-raised)');
    const have = merged([rule]);
    for (const [property, want] of [
      ['position', 'sticky'],
      ['bottom', '0'],
      ['width', '100%'],
      ['min-height', '2.75rem'],
      ['margin-top', '0.5rem'],
      ['padding', '0 0.5rem'],
      ['border-width', '2px'],
      ['border-style', 'solid'],
      ['border-color', 'var(--color-control-border)'],
      ['border-radius', 'var(--radius-m)'],
      ['background-color', 'var(--color-surface-raised)'],
      ['font-weight', '600'],
    ] as const) {
      declares(label, have, property, want);
    }
  });

  // Scenario ««Закрити» is sticky with the mask», second clause. GUARD: the sheet's «Закрити» is unmasked today (its footer strip masks, A-60) and must stay so.
  it('GUARD: the rule that is exactly .setup-close still declares no box-shadow (the sheet\'s «Закрити» stays unmasked)', () => {
    const rules = exact(RAW(), '.setup-close');
    expect(rules.length, 'the rule .setup-close exists').toBeGreaterThan(0);
    expect(rules.flatMap((r) => written(r, 'box-shadow')), '.setup-close box-shadow declarations').toEqual([]);
  });

  /**
   * Reading of "a length of at least calc(2.75rem + 2rem + 2px + env(safe-area-inset-bottom))" (the parent's wording of the re-audit): the value contains the term
   * `env(safe-area-inset-bottom)`, and its other terms, `+`-joined rem (1rem = 16px) and px lengths, sum to at least 78px (2.75rem + 2rem + 2px = 44 + 32 + 2). A value the evaluator
   * cannot read (a `-`, a `*`, another function, a unit other than rem and px) is reported by name, never accepted.
   */
  function scrollPaddingProblem(value: string): string | null {
    const inner = /^calc\((.*)\)$/i.exec(value.trim())?.[1] ?? value;
    let sum = 0;
    let env = false;
    for (const term of splitTopLevel(inner, '+').map((t) => t.trim())) {
      if (/^env\(\s*safe-area-inset-bottom\s*\)$/i.test(term)) {
        env = true;
        continue;
      }
      const m = /^(\d*\.?\d+)(rem|px)$/.exec(term);
      if (m?.[1] === undefined) return `the term "${term}" is not a rem or px length or env(safe-area-inset-bottom) (value ${value})`;
      sum += Number(m[1]) * (m[2] === 'rem' ? 16 : 1);
    }
    if (!env) return `the value has no env(safe-area-inset-bottom) term (value ${value})`;
    if (sum < 78) return `the other terms sum to ${sum}px, less than 78px (value ${value})`;
    return null;
  }

  // Scenario «The open panel reserves «Закрити» in its scroll padding». Red today: there is no rule `.settings:popover-open`.
  it('The open panel reserves «Закрити» in its scroll padding: .settings:popover-open declares scroll-padding-bottom of at least calc(2.75rem + 2rem + 2px + env(safe-area-inset-bottom)) and no display', () => {
    const rule = only(exact(RAW(), SETTINGS_OPEN), '.settings:popover-open');
    const values = written(rule, 'scroll-padding-bottom');
    expect.assert(values.length > 0, '.settings:popover-open declares scroll-padding-bottom');
    expect.soft(scrollPaddingProblem(values[values.length - 1] ?? ''), '.settings:popover-open { scroll-padding-bottom } reserves 78px and the safe-area inset').toBeNull();
    expect.soft(written(rule, 'display'), '.settings:popover-open declares no display').toEqual([]);
  });

  // The evaluator itself, so a test that reads "78" is not trusted blind: the exact value of the spec passes; a missing env term, a short sum and an unreadable term fail by name.
  it('GUARD: the scroll padding reading accepts the spec\'s value and rejects a value without the inset, a short sum and a term it cannot read', () => {
    expect(scrollPaddingProblem('calc(2.75rem + 2rem + 2px + env(safe-area-inset-bottom))')).toBeNull();
    expect(scrollPaddingProblem('calc(6rem + env(safe-area-inset-bottom))')).toBeNull();
    expect(scrollPaddingProblem('calc(2.75rem + 2rem + 2px)')).toContain('no env(safe-area-inset-bottom)');
    expect(scrollPaddingProblem('calc(2.75rem + 2rem + env(safe-area-inset-bottom))')).toContain('less than 78px');
    expect(scrollPaddingProblem('calc(100% - 2rem + env(safe-area-inset-bottom))')).toContain('not a rem or px length');
  });
});

// ---------------------------------------------------------------------------------------------------------
// No new colour, token or pair; no motion
// ---------------------------------------------------------------------------------------------------------

/** Selectors of the scan: `.settings`, `.settings:popover-open`, `.settings-label`, `.settings-close`, `.theme-control*`, `.language-control*` with their state and pseudo rules. NOT `.settings-button`, NOT `.settings::backdrop` (folder-audit note 12). */
const SCAN_SELECTOR = /^\.(settings|settings-label|settings-close|theme-control|language-control)(?![\w-])/;
const inScan = (selector: string): boolean => SCAN_SELECTOR.test(selector) && !selector.includes('::backdrop');

// Copied from main's tests/helpers/css.ts at 18e5f3f; refreshed at the rebase onto main from `git show main:tests/helpers/css.ts`, never from this branch.
const BASELINE_TOKEN_NAMES = [
  '--color-page',
  '--color-text',
  '--color-text-muted',
  '--color-cell-bg',
  '--color-control-bg',
  '--color-line',
  '--color-cell-border',
  '--color-control-border',
  '--color-given-bg',
  '--color-given-border',
  '--color-given-text',
  '--color-entry-text',
  '--color-primary',
  '--color-primary-text',
  '--color-primary-soft',
  '--color-hover-ring',
  '--color-violation-bg',
  '--color-violation-border',
  '--color-violation-stripe',
  '--color-violation-text',
  '--color-success',
  '--color-success-bg',
  '--color-success-glow',
  '--color-win-text',
  '--color-focus',
  '--color-backdrop-soft',
  '--color-backdrop-strong',
  '--color-surface-raised',
  '--color-overlay-border',
  '--color-shadow-panel',
  '--color-shadow-sheet',
  '--color-option-border',
];

// Copied from main's tests/helpers/css.ts at 18e5f3f (CONTRAST_PAIRS expanded, in order); refreshed at the rebase onto main from `git show main:tests/helpers/css.ts`, never from this branch.
const BASELINE_CONTRAST_PAIRS = [
  { group: 'cell-border', fg: '--color-cell-border', bg: '--color-page', min: 3 },
  { group: 'cell-border', fg: '--color-cell-border', bg: '--color-cell-bg', min: 3 },
  { group: 'cell-border', fg: '--color-cell-border', bg: '--color-line', min: 3 },
  { group: 'cell-border', fg: '--color-cell-border', bg: '--color-success-bg', min: 3 },
  { group: 'violation-cue', fg: '--color-violation-border', bg: '--color-page', min: 3 },
  { group: 'violation-cue', fg: '--color-violation-border', bg: '--color-cell-bg', min: 3 },
  { group: 'violation-cue', fg: '--color-violation-border', bg: '--color-violation-bg', min: 3 },
  { group: 'violation-cue', fg: '--color-violation-border', bg: '--color-line', min: 3 },
  { group: 'cause-cue', fg: '--color-violation-border', bg: '--color-violation-stripe', min: 3 },
  { group: 'hinted-cue', fg: '--color-primary', bg: '--color-primary-soft', min: 3 },
  { group: 'hinted-cue', fg: '--color-primary', bg: '--color-line', min: 3 },
  { group: 'hinted-cue', fg: '--color-primary', bg: '--color-page', min: 3 },
  { group: 'hinted-cue', fg: '--color-primary', bg: '--color-control-bg', min: 3 },
  { group: 'hinted-cue', fg: '--color-primary', bg: '--color-surface-raised', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-page', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-cell-bg', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-given-bg', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-violation-bg', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-line', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-primary-soft', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-success-bg', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-cell-border', min: 3 },
  { group: 'focus-ring', fg: '--color-focus', bg: '--color-surface-raised', min: 3 },
  { group: 'control-border', fg: '--color-control-border', bg: '--color-page', min: 3 },
  { group: 'control-border', fg: '--color-control-border', bg: '--color-control-bg', min: 3 },
  { group: 'text', fg: '--color-text', bg: '--color-page', min: 4.5 },
  { group: 'text', fg: '--color-text', bg: '--color-cell-bg', min: 4.5 },
  { group: 'text', fg: '--color-text', bg: '--color-given-bg', min: 4.5 },
  { group: 'text', fg: '--color-text', bg: '--color-control-bg', min: 4.5 },
  { group: 'text', fg: '--color-text', bg: '--color-primary-soft', min: 4.5 },
  { group: 'text', fg: '--color-text', bg: '--color-surface-raised', min: 4.5 },
  { group: 'text', fg: '--color-given-text', bg: '--color-given-bg', min: 4.5 },
  { group: 'text', fg: '--color-entry-text', bg: '--color-cell-bg', min: 4.5 },
  { group: 'text', fg: '--color-text-muted', bg: '--color-page', min: 4.5 },
  { group: 'text', fg: '--color-text-muted', bg: '--color-cell-bg', min: 4.5 },
  { group: 'text', fg: '--color-text-muted', bg: '--color-control-bg', min: 4.5 },
  { group: 'text', fg: '--color-text-muted', bg: '--color-surface-raised', min: 4.5 },
  { group: 'text', fg: '--color-violation-text', bg: '--color-violation-bg', min: 4.5 },
  { group: 'text', fg: '--color-violation-text', bg: '--color-violation-stripe', min: 4.5 },
  { group: 'text', fg: '--color-primary-text', bg: '--color-primary', min: 4.5 },
  { group: 'text', fg: '--color-win-text', bg: '--color-success-bg', min: 4.5 },
];

describe('The settings paint adds no colour literal, token or pair (update-settings-panel, OQ-1 A)', () => {
  // Scenario «The settings paint adds no colour literal, token or pair», first clause. GUARD: the scan is clean today (the existing rules use tokens only) and must stay clean after the port.
  it('GUARD: the settings rules hold no colour literal, no named colour but transparent, no color-mix(, no !important; every box-shadow colour is a var(--color-...) token naming a declared token', () => {
    const raw = RAW().filter((r) => r.selectors.some(inScan));
    const bases = new Set(raw.flatMap((r) => r.selectors.filter(inScan).map((s) => /^\.[\w-]+/.exec(s)?.[0] ?? s)));
    expect([...bases].sort(), 'the scan found the rules of the panel, its label, its «Закрити» and the two controls').toEqual(['.language-control', '.settings', '.settings-close', '.settings-label', '.theme-control']);
    const problems: string[] = [];
    const declared = new Set(Object.keys(readStyles().tokens));
    for (const rule of raw) {
      for (const d of rule.declarations) {
        const at = `${where(rule)} { ${d.property}: ${d.value} }`;
        if (COLOUR_LITERAL.test(d.value)) problems.push(`colour literal: ${at}`);
        if (namedColoursIn(d.value).length > 0) problems.push(`named colour: ${at}`);
        if (d.value.includes('color-mix(')) problems.push(`color-mix(: ${at}`);
        for (const [, name] of d.value.matchAll(/var\(\s*(--color-[\w-]+)/g)) {
          if (name !== undefined && !declared.has(name)) problems.push(`token not declared in :root (${name}): ${at}`);
        }
        if (d.property === 'box-shadow') {
          for (const layer of splitTopLevel(d.value, ',')) {
            const rest = layer.replace(/var\(\s*--color-[\w-]+\s*\)/, ' ').trim();
            const hasToken = /var\(\s*--color-[\w-]+\s*\)/.test(layer);
            const onlyLengths = rest.split(/\s+/).filter((t) => t !== '').every((t) => t === 'inset' || /^-?\d*\.?\d+(px|rem)?$/.test(t));
            if (!hasToken || !onlyLengths) problems.push(`box-shadow layer "${squash(layer)}" has no var(--color-...) colour: ${at}`);
          }
        }
      }
    }
    // !important: the raw reader strips it from the value, so the parsed rules answer (their Declaration carries the flag)
    for (const rule of readStyles().rules.filter((r) => r.selectors.some(inScan))) {
      for (const d of rule.declarations) if (d.important) problems.push(`!important: ${rule.selectors.join(', ')} { ${d.property} }`);
    }
    expect(problems, 'colour literals, named colours, color-mix(, !important or undeclared tokens in the settings rules').toEqual([]);
  });

  // Scenario «The settings paint adds no colour literal, token or pair», second clause. GUARD: equal to main's lists today. Compared as lists, not as counts: the dialog block (merged first)
  // moves the counts, and the copies are refreshed at the rebase from main's helper, never from this branch.
  it('GUARD: TOKEN_NAMES and CONTRAST_PAIRS of tests/helpers/css.ts equal the baseline copies as lists, not as counts', () => {
    expect([...TOKEN_NAMES], 'TOKEN_NAMES equals the baseline copy (no token added by this block)').toEqual(BASELINE_TOKEN_NAMES);
    expect(CONTRAST_PAIRS, 'CONTRAST_PAIRS equals the baseline copy (no pair added by this block)').toEqual(BASELINE_CONTRAST_PAIRS);
  });
});

describe('Hover, press and motion are not ported (update-settings-panel, OQ-5)', () => {
  // Scenario «Hover, press and motion are not ported». GUARD: nothing of the panel has motion or a hover rule today, and nothing may gain one.
  it('GUARD: Hover, press and motion are not ported: no panel rule declares transition or animation, has :hover or :active, or sits in @starting-style or prefers-reduced-motion: no-preference', () => {
    const rules = RAW().filter((r) =>
      r.selectors.some((s) => !s.includes('::backdrop') && (/^\.(settings|settings-close)(?![\w-])/.test(s) || s.includes('.theme-control') || s.includes('.language-control'))),
    );
    expect(rules.length, 'the walk found the panel, its «Закрити» and the two controls').toBeGreaterThan(8);
    const motion = rules.flatMap((r) => r.declarations.filter((d) => /^(transition|animation)(-|$)/.test(d.property)).map((d) => `${where(r)} { ${d.property} }`));
    expect(motion, 'declarations of transition or animation').toEqual([]);
    const states = rules.flatMap((r) => r.selectors.filter((s) => /:(hover|active)\b/.test(s)));
    expect(states, 'selectors with :hover or :active').toEqual([]);
    const inMotion = rules.filter((r) => r.context.some((c) => /prefers-reduced-motion|starting-style/i.test(c))).map(where);
    expect(inMotion, 'rules inside @starting-style or prefers-reduced-motion').toEqual([]);
    expect(rules.filter((r) => r.hasNestedBlock).map(where), 'rules with a nested block (a nested @starting-style would hide there)').toEqual([]);
  });
});
