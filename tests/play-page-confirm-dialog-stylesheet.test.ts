// Play page: the confirmation dialog's size, place and paint, read from src/ui/style.css (update-confirm-dialog, G2 dialog block, FR-67, FR-65, NFR-14, A-62).
// One or more tests per stylesheet scenario of the ADDED requirement «The confirmation dialog takes the design's size, place and paint» and of the scenario «The dialog's
// warning text has 4.5:1 and its frame is decoration» added to «Borders, cues and focus rings have enough contrast», in
// openspec/changes/update-confirm-dialog/specs/play-page/spec.md. The browser read against the design build is e2e/nfr-14-confirm-dialog.spec.ts (jsdom has no layout),
// so everything here is read as declarations, which is what the scenarios ask. Written FIRST (red) from the spec, before the port.
//
// @trace FR-67
// @trace FR-65
// @trace NFR-14
//
// HOW IT READS THE FILE (jsdom 29 probed before this file was written, docs/qa/update-confirm-dialog/red-run.txt section C):
//  - The CSSOM keeps shorthands and their longhands (`padding: 1.5rem`, `margin: 0 0 1.5rem`, `flex: 1 1 auto`, `border-width: 2px`) and serialises a bare zero as `0px`, but it
//    keeps only the LAST of two declarations of a property, so "each once" and "no second declaration" are read from the RAW text of the top-level blocks (comments stripped).
//    The CSSOM (`readStyles`) is used for the structure that the scenarios name: which at-rule a rule is inside, the colour scan and the token sets.
//  - A value is compared with whitespace removed and a bare zero equal to `0px` (`norm`, on both sides). A plain length in `rem` is NOT converted to px: the scenarios write
//    `1.5rem`, `2.75rem` and `0.5rem` and the test accepts the alternatives the scenarios list (`var(--space-5)`, `8px` or `0.5rem`).
//  - "The rule that is exactly `.confirm`" is a rule whose selector list is the single selector `.confirm` (not `.confirm p`, not `.confirm::backdrop`, not a list) outside any at-rule.
//  - The two colour rules are found by a selector that CONTAINS `[data-confirm='yes']` / `[data-confirm='no']`, with the quote style normalised (a port in double quotes is accepted too,
//    folder audit finding 11).
//
// Tests that pass today by design are marked GUARD in their title and listed in docs/qa/update-confirm-dialog/red-run.txt (section C) with the reason.
import { describe, expect, it } from 'vitest';
import { CONTRAST_PAIRS, TOKEN_NAMES, TRANSLUCENT_TOKENS, contrastRatio, readStyleText, readStyles, scanColours, themeTokenSets } from './helpers/css';
import type { ParsedStyles, StyleRuleInfo, TokenSet } from './helpers/css';

// ---------------------------------------------------------------------------------------------------------
// Reading helpers
// ---------------------------------------------------------------------------------------------------------

/** A value with a bare zero turned into `0px`, then all whitespace removed: the comparison of the scenarios ("whitespace aside"). */
const norm = (value: string): string => value.replace(/(?<![\w.%-])0(?![\w.%-])/g, '0px').replace(/\s+/g, '');
/** A selector with one quote style and one space between its parts. */
const normSel = (selector: string): string => selector.replace(/"/g, "'").replace(/\s+/g, ' ').trim();
const where = (rule: StyleRuleInfo): string => `${rule.context.join(' ')} ${rule.selectors.join(', ')}`.trim();
const stripComments = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '');

/** The rules whose selector list is exactly `selector`, wherever they are (the context tells whether one is inside an at-rule). */
const exact = (parsed: ParsedStyles, selector: string): StyleRuleInfo[] =>
  parsed.rules.filter((r) => r.selectors.length === 1 && normSel(r.selectors[0] ?? '') === normSel(selector));
const topLevel = (rules: StyleRuleInfo[]): StyleRuleInfo[] => rules.filter((r) => r.context.length === 0);

interface RawBlock {
  prelude: string;
  /** declarations in source order: [property, normalised value] */
  declarations: [string, string][];
}

/** The blocks at brace depth 0 of the raw text (outside every at-rule), in order, with their declarations. A nested block of a block is not read. */
function topLevelBlocks(text: string): RawBlock[] {
  const t = stripComments(text);
  const blocks: RawBlock[] = [];
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
        const body = t.slice(bodyStart, i);
        const declarations = body
          .split(';')
          .map((d) => d.trim())
          .filter((d) => d !== '' && d.includes(':'))
          .map((d): [string, string] => {
            const at = d.indexOf(':');
            return [d.slice(0, at).trim().toLowerCase(), norm(d.slice(at + 1))];
          });
        blocks.push({ prelude, declarations });
        start = i + 1;
      }
    } else if (ch === ';' && depth === 0) {
      start = i + 1;
    }
  }
  return blocks;
}

/** The top-level blocks of the raw text whose selector is exactly `selector`. */
const rawBlocks = (selector: string): RawBlock[] => topLevelBlocks(readStyleText()).filter((b) => normSel(b.prelude) === normSel(selector));
/** The values the block declares for `property`, in order (a property written twice shows twice). */
const rawValues = (block: RawBlock, property: string): string[] => block.declarations.filter(([p]) => p === property).map(([, v]) => v);

/** The one top-level block that is exactly `selector`, or an assertion failure that names it. */
function onlyBlock(selector: string): RawBlock {
  const blocks = rawBlocks(selector);
  expect(blocks.length, `${selector}: exactly one block outside any at-rule in the raw text`).toBe(1);
  const block = blocks[0];
  expect.assert(block !== undefined, `${selector}: the block exists`);
  return block;
}

/** `property` is declared in `block` exactly once, with one of the accepted values (compared through `norm`); the message names the declaration. */
function expectDeclared(block: RawBlock, selector: string, property: string, accepted: string[]): void {
  const values = rawValues(block, property);
  const want = accepted.join(' or ');
  expect(values.length, `${selector} { ${property}: ${want} } is declared once (found ${values.length})`).toBe(1);
  expect(accepted.map(norm), `${selector} { ${property} } is ${want} (found "${values[0] ?? 'nothing'}")`).toContain(values[0]);
}

/** The top-level rule (CSSOM) whose selector contains `fragment`, quote style normalised. */
const withSelectorContaining = (parsed: ParsedStyles, fragment: string): StyleRuleInfo[] =>
  parsed.rules.filter((r) => r.context.length === 0 && r.selectors.some((s) => normSel(s).includes(fragment)));

/** The rules the requirement defines: a selector that mentions `.confirm` (the dialog, its text, its button row, its backdrop) or `[data-confirm`. */
const isDialogSelector = (selector: string): boolean => /\.confirm(?![\w-])|\.confirm-buttons|\[data-confirm/.test(selector);
const dialogRules = (parsed: ParsedStyles): StyleRuleInfo[] => parsed.rules.filter((r) => r.selectors.some(isDialogSelector));

function tokenIn(set: TokenSet, name: string): string {
  const value = set.tokens[name];
  expect.assert(value !== undefined, `${set.label}: ${name} is declared in the token set`);
  return value;
}

const YES = "[data-confirm='yes']";
const NO = "[data-confirm='no']";

// ---------------------------------------------------------------------------------------------------------
// Scenario «The dialog has the design's width, padding and corners»
// ---------------------------------------------------------------------------------------------------------

describe('The dialog has the design\'s width, padding and corners (the rule that is exactly .confirm)', () => {
  // Red today: `min(22rem, calc(100vw - 32px))`.
  it('.confirm declares width: min(22rem, calc(100vw - 2 * var(--page-pad))) once (whitespace aside)', () => {
    expectDeclared(onlyBlock('.confirm'), '.confirm', 'width', ['min(22rem, calc(100vw - 2 * var(--page-pad)))']);
  });

  // Red today: `padding: 20px`.
  it('.confirm declares padding: 1.5rem (or var(--space-5)) once', () => {
    expectDeclared(onlyBlock('.confirm'), '.confirm', 'padding', ['1.5rem', 'var(--space-5)']);
  });

  // Red today: `border-radius: 12px`.
  it('.confirm declares border-radius: var(--radius-l) once', () => {
    expectDeclared(onlyBlock('.confirm'), '.confirm', 'border-radius', ['var(--radius-l)']);
  });

  // Red today: the rule declares 32px in the width, 20px in the padding and 12px in the radius.
  it('.confirm declares none of 12px, 20px and 32px in its width, padding and border-radius', () => {
    const block = onlyBlock('.confirm');
    for (const property of ['width', 'padding', 'border-radius']) {
      for (const value of rawValues(block, property)) {
        expect(value, `.confirm { ${property}: ${value} } holds none of 12px, 20px and 32px (the old values are gone)`).not.toMatch(/(?<![\w.])(12|20|32)px/);
      }
    }
  });

  // GUARD: green today (the dialog owns no rule inside an at-rule) and must stay green: the port edits the rule in place.
  it('GUARD: no rule that is exactly .confirm inside an at-rule declares width, padding or border-radius', () => {
    const parsed = readStyles();
    const inAtRule = exact(parsed, '.confirm').filter((r) => r.context.length > 0);
    const offending = inAtRule.filter((r) => r.declarations.some((d) => /^(width|padding(-[a-z]+)?|border(-[a-z]+)*-radius)$/.test(d.property)));
    expect(offending.map(where), 'a .confirm rule inside an at-rule that declares width, padding or border-radius').toEqual([]);
  });

  // GUARD: green today (the variable is declared on #app, 1rem and 0.75rem at 22.5rem and narrower) and must stay green: the dialog inherits it.
  it('GUARD: --page-pad is declared on #app (1rem; 0.75rem inside @media (max-width: 22.5rem)) and on no rule of the dialog', () => {
    const parsed = readStyles();
    const pad = (rules: StyleRuleInfo[]): string[] => rules.flatMap((r) => r.declarations.filter((d) => d.property === '--page-pad').map((d) => d.value));
    const app = exact(parsed, '#app');
    expect(pad(topLevel(app)), '#app { --page-pad } outside any at-rule').toEqual(['1rem']);
    const narrow = app.filter((r) => r.context.length === 1 && /^@media\s*\(\s*max-width\s*:\s*22\.5rem\s*\)$/.test(r.context[0] ?? ''));
    expect(pad(narrow), '#app { --page-pad } inside @media (max-width: 22.5rem)').toEqual(['0.75rem']);
    const onDialog = dialogRules(parsed).filter((r) => r.declarations.some((d) => d.property === '--page-pad'));
    expect(onDialog.map(where), 'a rule of the dialog that declares --page-pad (the dialog inherits it from #app)').toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Scenario «The text and the buttons have the design's metrics»
// ---------------------------------------------------------------------------------------------------------

describe('The text and the buttons have the design\'s metrics', () => {
  // Red today: `margin: 0 0 20px`.
  it('.confirm p declares margin: 0 0 1.5rem once', () => {
    expectDeclared(onlyBlock('.confirm p'), '.confirm p', 'margin', ['0 0 1.5rem']);
  });

  // GUARD: green today.
  it('GUARD: .confirm p declares line-height: 1.5', () => {
    expectDeclared(onlyBlock('.confirm p'), '.confirm p', 'line-height', ['1.5']);
  });

  // GUARD: green today (the button row is already the design's) and must stay green.
  it('GUARD: .confirm-buttons declares display: flex, flex-wrap: wrap-reverse, justify-content: flex-end and gap: 8px (or 0.5rem)', () => {
    const block = onlyBlock('.confirm-buttons');
    expectDeclared(block, '.confirm-buttons', 'display', ['flex']);
    expectDeclared(block, '.confirm-buttons', 'flex-wrap', ['wrap-reverse']);
    expectDeclared(block, '.confirm-buttons', 'justify-content', ['flex-end']);
    expectDeclared(block, '.confirm-buttons', 'gap', ['8px', '0.5rem']);
  });

  // GUARD: green today.
  it('GUARD: .confirm-buttons button declares flex: 1 1 auto, min-height: 2.75rem and font-weight: 700', () => {
    const block = onlyBlock('.confirm-buttons button');
    expectDeclared(block, '.confirm-buttons button', 'flex', ['1 1 auto']);
    expectDeclared(block, '.confirm-buttons button', 'min-height', ['2.75rem']);
    expectDeclared(block, '.confirm-buttons button', 'font-weight', ['700']);
  });

  // Red today: the base `button` rule gives `padding: 10px 16px` and the rule declares none.
  it('.confirm-buttons button declares padding: 0 1rem once', () => {
    expectDeclared(onlyBlock('.confirm-buttons button'), '.confirm-buttons button', 'padding', ['0 1rem']);
  });

  // Red today: the base rule's 1px border.
  it('.confirm-buttons button declares border-width: 2px once', () => {
    expectDeclared(onlyBlock('.confirm-buttons button'), '.confirm-buttons button', 'border-width', ['2px']);
  });

  // Red today: the base rule's radius.
  it('.confirm-buttons button declares border-radius: var(--radius-m) once', () => {
    expectDeclared(onlyBlock('.confirm-buttons button'), '.confirm-buttons button', 'border-radius', ['var(--radius-m)']);
  });

  // Red today: the base rule's 24px line.
  it('.confirm-buttons button declares line-height: 1.2 once', () => {
    expectDeclared(onlyBlock('.confirm-buttons button'), '.confirm-buttons button', 'line-height', ['1.2']);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Scenario «The two buttons take their colours from tokens»
// ---------------------------------------------------------------------------------------------------------

/** The one top-level rule (CSSOM) whose selector contains `fragment`, and the raw block with the same selector text, for the declaration reads. */
function colourRule(fragment: string): { rule: StyleRuleInfo; block: RawBlock } {
  const rules = withSelectorContaining(readStyles(), fragment);
  expect(rules.map(where), `exactly one top-level rule whose selector contains ${fragment}`).toHaveLength(1);
  const rule = rules[0];
  expect.assert(rule !== undefined, `a top-level rule whose selector contains ${fragment} exists`);
  const selector = rule.selectors.find((s) => normSel(s).includes(fragment)) ?? fragment;
  const blocks = topLevelBlocks(readStyleText()).filter((b) => normSel(b.prelude).split(',').map((s) => s.trim()).includes(normSel(selector)));
  expect(blocks.length, `the raw text has exactly one top-level block for ${selector}`).toBe(1);
  const block = blocks[0];
  expect.assert(block !== undefined, `the raw block for ${selector} exists`);
  return { rule, block };
}

describe('The two buttons take their colours from tokens', () => {
  const WANT: [string, string, Record<string, string>][] = [
    ['«Так, почати»', YES, { color: 'var(--color-violation-ink)', 'background-color': 'var(--color-violation-bg)', 'border-color': 'var(--color-violation-border)' }],
    ['«Скасувати»', NO, { color: 'var(--color-primary-text)', 'background-color': 'var(--color-primary)', 'border-color': 'var(--color-primary)' }],
  ];

  // Red today: neither rule exists.
  for (const [label, fragment, declarations] of WANT) {
    it(`the top-level rule whose selector contains ${fragment} (${label}) declares color, background-color and border-color once each, each a single var()`, () => {
      const { block } = colourRule(fragment);
      for (const [property, value] of Object.entries(declarations)) {
        expectDeclared(block, fragment, property, [value]);
        const only = rawValues(block, property)[0] ?? '';
        expect(only, `${fragment} { ${property} } is a single var(--color-...)`).toMatch(/^var\(--color-[\w-]+\)$/);
      }
    });

    it(`the rule of ${fragment} (${label}) declares no outline, outline-color, box-shadow or opacity`, () => {
      const { block } = colourRule(fragment);
      for (const property of ['outline', 'outline-color', 'box-shadow', 'opacity']) {
        expect(rawValues(block, property), `${fragment} declares no ${property} (the focus ring is the page's button:focus-visible rule)`).toEqual([]);
      }
    });
  }

  // GUARD: the helper's pair list (changed in task 2.2) holds both pairs, once each, in the group text at 4.5.
  it('GUARD: --color-violation-ink on --color-violation-bg and --color-primary-text on --color-primary are each in CONTRAST_PAIRS once, group text, at 4.5', () => {
    for (const [fg, bg] of [
      ['--color-violation-ink', '--color-violation-bg'],
      ['--color-primary-text', '--color-primary'],
    ] as const) {
      const found = CONTRAST_PAIRS.filter((p) => p.fg === fg && p.bg === bg);
      expect(found.map((p) => `${p.group} at ${p.min}`), `CONTRAST_PAIRS holds ${fg} on ${bg} once, group text, at 4.5`).toEqual(['text at 4.5']);
    }
  });

  // Red today: --color-violation-ink is not declared (the ratio of the primary pair is a GUARD inside the same test; the failure names the token).
  it('the text pairs hold in each token set: --color-violation-ink on --color-violation-bg 7.34 (light) and 8.40 (dark), --color-primary-text on --color-primary 5.40 and 8.55, each at least 4.5', () => {
    const want: Record<string, [number, number]> = { light: [7.34, 5.4], dark: [8.4, 8.55] };
    for (const set of themeTokenSets(readStyles())) {
      const ink = tokenIn(set, '--color-violation-ink');
      const primary = Number(contrastRatio(tokenIn(set, '--color-primary-text'), tokenIn(set, '--color-primary')).toFixed(2));
      const warning = Number(contrastRatio(ink, tokenIn(set, '--color-violation-bg')).toFixed(2));
      expect([warning, primary], `${set.label}: --color-violation-ink on --color-violation-bg, then --color-primary-text on --color-primary`).toEqual(want[set.label]);
      expect(warning, `${set.label}: the warning text is at least 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(primary, `${set.label}: the primary text is at least 4.5`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// Scenario «The dialog's warning text has 4.5:1 and its frame is decoration» («Borders, cues and focus rings have enough contrast»)
// ---------------------------------------------------------------------------------------------------------

describe('The dialog\'s warning text has 4.5:1 and its frame is decoration', () => {
  // Red today: the token is not declared in either set.
  it('--color-violation-ink is declared in both sets as #rrggbb (#8f1d17 light, #ffb4ab dark) and is not a translucent token', () => {
    expect(TOKEN_NAMES, 'the token is in the helper list (GUARD of task 2.2)').toContain('--color-violation-ink');
    expect(TRANSLUCENT_TOKENS.has('--color-violation-ink'), 'not in the translucent set').toBe(false);
    const want: Record<string, string> = { light: '#8f1d17', dark: '#ffb4ab' };
    for (const set of themeTokenSets(readStyles())) {
      const value = tokenIn(set, '--color-violation-ink');
      expect(value.toLowerCase(), `${set.label}: --color-violation-ink`).toBe(want[set.label]);
      expect(value, `${set.label}: --color-violation-ink is #rrggbb`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  // GUARD: the pair list is the helper's (changed in task 2.2): the token is in exactly one pair, with the violation fill.
  it('GUARD: --color-violation-ink is in exactly one pair of CONTRAST_PAIRS, with --color-violation-bg, and no pair names --color-violation-border with --color-surface-raised', () => {
    const withInk = CONTRAST_PAIRS.filter((p) => p.fg === '--color-violation-ink' || p.bg === '--color-violation-ink');
    expect(withInk.map((p) => `${p.fg} on ${p.bg}`), 'the pairs that name --color-violation-ink').toEqual(['--color-violation-ink on --color-violation-bg']);
    const frame = CONTRAST_PAIRS.filter(
      (p) => (p.fg === '--color-violation-border' && p.bg === '--color-surface-raised') || (p.fg === '--color-surface-raised' && p.bg === '--color-violation-border'),
    );
    expect(frame, 'no pair of --color-violation-border with --color-surface-raised (the red frame is decoration, A-62)').toEqual([]);
  });

  // GUARD: both tokens exist today; the frame ratio is recorded, not relied on (6.43 light, 6.54 dark).
  it('GUARD: the recorded frame ratio of --color-violation-border on --color-surface-raised is 6.43 (light) and 6.54 (dark)', () => {
    const want: Record<string, number> = { light: 6.43, dark: 6.54 };
    for (const set of themeTokenSets(readStyles())) {
      const ratio = Number(contrastRatio(tokenIn(set, '--color-violation-border'), tokenIn(set, '--color-surface-raised')).toFixed(2));
      expect(ratio, `${set.label}: --color-violation-border on --color-surface-raised`).toBe(want[set.label]);
    }
  });

  // Red today: no declaration outside :root has the value var(--color-violation-ink).
  it('the stylesheet binds the token: a declaration outside :root has the value var(--color-violation-ink) (the color of «Так, почати»)', () => {
    const parsed = readStyles();
    const bound = parsed.rules
      .filter((r) => !r.selectors.every((s) => s === ':root' || /^:root\[data-theme=["']?dark["']?\]$/.test(s)))
      .flatMap((r) => r.declarations.filter((d) => d.value === 'var(--color-violation-ink)').map((d) => `${where(r)} { ${d.property} }`));
    expect(bound, 'declarations outside :root with the value var(--color-violation-ink)').not.toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Scenario «The dialog's rules add no colour literal, no motion and no hover paint»
// ---------------------------------------------------------------------------------------------------------

describe('The dialog\'s rules add no colour literal, no motion and no hover paint', () => {
  // GUARD: green today (the five rules of the dialog have no literal) and must stay green after the port adds the two colour rules.
  it('GUARD: the colour scan over the rules that mention .confirm or [data-confirm finds no literal, no named colour, no color-mix(; every colour is a var(--color-...) token', () => {
    const parsed = readStyles();
    const rules = dialogRules(parsed);
    expect(rules.length, 'the walk found the dialog\'s rules (.confirm, ::backdrop, p, the button row, the buttons)').toBeGreaterThanOrEqual(5);
    const scan = scanColours({ ...parsed, rules });
    expect(scan.literals, 'no colour literal').toEqual([]);
    expect(scan.named, 'no named colour').toEqual([]);
    expect(scan.shorthands, 'every colour-bearing shorthand has a token colour').toEqual([]);
    expect(scan.colourProperties, 'every color, background-color, border-color and outline-color is a single declared var(--color-...) or an allowed keyword').toEqual([]);
    expect(scan.tokensOutsideRoot, 'no token declared in a rule of the dialog').toEqual([]);
    for (const rule of rules) {
      for (const d of rule.declarations) expect(d.value, `${where(rule)} { ${d.property} } has no color-mix(`).not.toContain('color-mix(');
    }
  });

  // GUARD: green today; hover, press, fade and scale are not ported (DQ-3).
  it('GUARD: no rule of the dialog declares transition, animation, transform or opacity, none is inside prefers-reduced-motion or @starting-style, and none has :hover or :active', () => {
    const parsed = readStyles();
    const rules = dialogRules(parsed);
    expect(rules.length, 'the walk found the dialog\'s rules').toBeGreaterThanOrEqual(5);
    const motion = rules.flatMap((r) =>
      r.declarations.filter((d) => /^(transition|animation|transform|opacity)(-|$)/.test(d.property)).map((d) => `${where(r)} { ${d.property}: ${d.value} }`),
    );
    expect(motion, 'dialog declarations of transition, animation, transform or opacity').toEqual([]);
    expect(rules.filter((r) => r.context.some((c) => /prefers-reduced-motion|starting-style/i.test(c))).map(where), 'dialog rules inside the motion block or @starting-style').toEqual([]);
    expect(stripComments(readStyleText()), 'no @starting-style anywhere in the file (a nested one would hide from the CSSOM walk)').not.toMatch(/@starting-style/);
    expect(rules.filter((r) => r.selectors.some((s) => /:(hover|active)/.test(s))).map(where), 'dialog rules with :hover or :active').toEqual([]);
  });

  // GUARD: green today.
  it('GUARD: the stylesheet has no !important and the raw text contains :has( exactly once (the idle-line rule)', () => {
    const text = readStyleText();
    expect(text, 'no !important').not.toMatch(/!\s*important/i);
    expect(text.match(/:has\(/gi) ?? [], 'exactly one :has(').toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Scenario «The shell's bindings of the dialog stay true»
// ---------------------------------------------------------------------------------------------------------

describe('The shell\'s bindings of the dialog stay true', () => {
  // GUARD: green today and must stay green: the port edits .confirm in place and adds no second rule.
  it('GUARD: exactly one rule is exactly .confirm outside any at-rule; it declares background-color var(--color-surface-raised), border-color var(--color-control-border) and box-shadow 0 1rem 2.5rem var(--color-shadow-panel) once each', () => {
    const parsed = readStyles();
    expect(topLevel(exact(parsed, '.confirm')).map(where), '.confirm: one rule outside any at-rule').toHaveLength(1);
    const block = onlyBlock('.confirm');
    expectDeclared(block, '.confirm', 'background-color', ['var(--color-surface-raised)']);
    expectDeclared(block, '.confirm', 'border-color', ['var(--color-control-border)']);
    expectDeclared(block, '.confirm', 'box-shadow', ['0 1rem 2.5rem var(--color-shadow-panel)']);
  });

  // GUARD: green today.
  it('GUARD: no rule that is exactly .confirm inside an at-rule declares a fill, a border colour or a shadow', () => {
    const inAtRule = exact(readStyles(), '.confirm').filter(
      (r) => r.context.length > 0 && r.declarations.some((d) => /^(background(-color)?|border(-[a-z]+)?-color|box-shadow)$/.test(d.property)),
    );
    expect(inAtRule.map(where), 'a .confirm rule inside an at-rule that declares a fill, border colour or shadow').toEqual([]);
  });

  // GUARD: green today.
  it('GUARD: .confirm::backdrop declares background-color var(--color-backdrop-strong), and no rule declares var(--color-overlay-border) for .confirm', () => {
    const parsed = readStyles();
    const backdrop = exact(parsed, '.confirm::backdrop');
    expect(backdrop.map(where), '.confirm::backdrop: one rule').toHaveLength(1);
    expect(backdrop[0]?.declarations.find((d) => d.property === 'background-color')?.value, '.confirm::backdrop { background-color }').toBe('var(--color-backdrop-strong)');
    const overlay = dialogRules(parsed).filter((r) => r.declarations.some((d) => d.value.includes('--color-overlay-border')));
    expect(overlay.map(where), 'a rule of the dialog that declares var(--color-overlay-border)').toEqual([]);
  });
});
