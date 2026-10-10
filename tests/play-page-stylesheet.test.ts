// Play page: the stylesheet requirements, read from src/ui/style.css (FR-64, FR-65; FR-61 for the rule that would drop the
// semantics of the board group and its buttons; FR-63 for the status regions that stay rendered while empty). Part (a) walks
// the parsed CSSOM; part (b) lets jsdom compute the cascade of the injected text. jsdom never matches :focus-visible and
// applies no @media or nested rule to computed style, so those are judged at declaration level only (A-28, TC-13). Scenarios of
// openspec/specs/play-page/spec.md (reconcile-ux-accessibility); the helper is tests/helpers/css.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  PAIR_PLUS_4,
  PAIR_PLUS_8,
  PAIR_ROW_PLUS,
  allCells,
  cellEl,
  clickCell,
  installPageLifecycle,
  mountFixture,
  mountThenSelect,
  q,
  rulesPanel,
} from './helpers/play-page';
import {
  PALETTE_LIGHT,
  TOKEN_NAMES,
  TRANSLUCENT_TOKENS,
  contrastProblems,
  contrastRatio,
  declarationsFor,
  injectPageStyles,
  injectStyles,
  lightRootRules,
  px,
  readStyleText,
  readStyles,
  rgbOf,
  rulesWithSelector,
  scanColours,
  themeTokenSets,
  withTokensInlined,
} from './helpers/css';
import type { ParsedStyles, TokenSet } from './helpers/css';

installPageLifecycle();

/** Assert the merged declaration `property` of the rules for `selector` (`var(--color-x)` written as the stylesheet has it). */
function expectDecl(parsed: ParsedStyles, selector: string, property: string, expected: string): void {
  expect(declarationsFor(parsed, selector).get(property)?.toLowerCase(), `${selector} { ${property}: ${expected} }`).toBe(expected);
}

/**
 * add-theme-switch (FR-65, A-51): the `#rrggbb` value of a token in one token set (light or dark), asserted to exist. The set list
 * comes from `themeTokenSets`, which fails on an assertion when the stylesheet has no `:root[data-theme="dark"]` block, so a loop
 * over it can never pass on the light set alone.
 */
function tokenIn(set: TokenSet, name: string): string {
  const value = set.tokens[name];
  expect.assert(value !== undefined && /^#[0-9a-f]{6}$/i.test(value), `${name} is #rrggbb in the ${set.label} token set`);
  return value;
}

/** The subject of a selector: its last compound selector (after the last combinator outside brackets and parentheses). */
function subjectOf(selector: string): string {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector.charAt(i);
    if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth -= 1;
    else if (depth === 0 && /[\s>+~]/.test(ch)) start = i + 1;
  }
  return selector.slice(start);
}

/** The token name of a value that is a single `var(--color-x)` of a token declared in :root, else undefined. */
function tokenOf(parsed: ParsedStyles, value: string | undefined): string | undefined {
  const name = /^var\(\s*(--color-[\w-]+)\s*\)$/.exec(value ?? '')?.[1];
  return name !== undefined && name in parsed.tokens ? name : undefined;
}

// ---------------------------------------------------------------------------------------------------------
// (a) CSSOM walk
// ---------------------------------------------------------------------------------------------------------

describe('the colours are tokens (FR-65)', () => {
  // update-page-palette DELIBERATE CHANGE (FR-65, A-57; delta «Borders, cues and focus rings have enough contrast», scenario «Tokens exist and are
  // literal», proposal.md Impact row `tests/play-page-stylesheet.test.ts:79-86`): the count of 13 becomes the list of 25 with the light value of
  // the spec's table, `#rrggbb` for 24 and `#rrggbbaa` for `--color-success-glow` only, and the top-level `:root` holds nothing else but
  // `color-scheme`.
  it('@trace FR-65 Tokens exist and are literal: the 25 names of the G2 palette, each declared once in the top-level :root with the light value of the list', () => {
    const parsed = readStyles();
    expect(TOKEN_NAMES).toHaveLength(25);
    for (const name of TOKEN_NAMES) {
      const declarations = parsed.tokenDeclarations.filter((d) => d.property === name);
      expect(declarations, `${name} is declared once in the top-level :root`).toHaveLength(1);
      expect(declarations[0]?.value.toLowerCase(), `${name} has the light value of the list`).toBe(PALETTE_LIGHT[name]);
      expect(declarations[0]?.value, `${name} is ${TRANSLUCENT_TOKENS.has(name) ? '#rrggbbaa' : '#rrggbb'}`).toMatch(
        TRANSLUCENT_TOKENS.has(name) ? /^#[0-9a-f]{8}$/i : /^#[0-9a-f]{6}$/i,
      );
    }
    expect(
      parsed.tokenDeclarations.map((d) => d.property).sort(),
      'the top-level :root declares the 25 tokens and no other --color-*',
    ).toEqual([...TOKEN_NAMES].sort());
    const rootProperties = lightRootRules(parsed).flatMap((r) => r.declarations.map((d) => d.property));
    expect(
      rootProperties.filter((property) => !property.startsWith('--color-')),
      'the top-level :root declares color-scheme and nothing else besides the tokens',
    ).toEqual(['color-scheme']);
  });

  it('@trace FR-65 No colour literal is left: no hex, rgb(), hsl() ... outside :root, wherever the rule is in the file', () => {
    const parsed = readStyles();
    expect(parsed.rules.length, 'the walk found the rules').toBeGreaterThan(5);
    expect(scanColours(parsed).literals).toEqual([]);
  });

  it('@trace FR-65 No CSS named colour is left outside :root', () => {
    expect(scanColours(readStyles()).named).toEqual([]);
  });

  it('@trace FR-65 Every colour-bearing shorthand has a var(--color-...) colour (or is none or 0)', () => {
    expect(scanColours(readStyles()).shorthands).toEqual([]);
  });

  it('@trace FR-65 Every color, background-color, border-color and outline-color is one declared token or an allowed keyword', () => {
    expect(scanColours(readStyles()).colourProperties).toEqual([]);
  });

  it('@trace FR-65 No --color-* property is declared outside :root', () => {
    expect(scanColours(readStyles()).tokensOutsideRoot).toEqual([]);
  });

  // update-page-palette DELIBERATE CHANGE (FR-65, A-57; delta «Borders, cues and focus rings have enough contrast», scenario «Rules use the tokens
  // and no colour literal is left», proposal.md Impact row `tests/play-page-stylesheet.test.ts:111-125`): `.cell` takes its text from
  // `--color-entry-text`, `.cell-given` its text from `--color-given-text`, its border at 1px and its weight at 800, and `.cell-hinted` has its
  // own binding.
  it('@trace FR-65 The named rules take their colours from the named tokens, written with the longhands', () => {
    const parsed = readStyles();
    expectDecl(parsed, 'body', 'background-color', 'var(--color-page)');
    expectDecl(parsed, 'body', 'color', 'var(--color-text)');
    expectDecl(parsed, '.cell', 'border-color', 'var(--color-cell-border)');
    expectDecl(parsed, '.cell', 'background-color', 'var(--color-cell-bg)');
    expectDecl(parsed, '.cell', 'color', 'var(--color-entry-text)');
    expectDecl(parsed, '.cell-given', 'border-color', 'var(--color-given-border)');
    expectDecl(parsed, '.cell-given', 'border-width', '1px');
    expectDecl(parsed, '.cell-given', 'background-color', 'var(--color-given-bg)');
    expectDecl(parsed, '.cell-given', 'color', 'var(--color-given-text)');
    expectDecl(parsed, '.cell-given', 'font-weight', '800');
    expectDecl(parsed, '.cell-hinted', 'border-color', 'var(--color-primary)');
    expectDecl(parsed, '.cell-hinted', 'background-color', 'var(--color-primary-soft)');
    expectDecl(parsed, '.cell-hinted', 'color', 'var(--color-text)');
    expectDecl(parsed, '.cell-violation', 'border-color', 'var(--color-violation-border)');
    expectDecl(parsed, '.cell-violation', 'background-color', 'var(--color-violation-bg)');
    expectDecl(parsed, '.cell-violation', 'color', 'var(--color-violation-text)');
    expectDecl(parsed, '.message-win', 'color', 'var(--color-win-text)');
    for (const selector of ['.cell:focus-visible', 'button:focus-visible']) {
      expectDecl(parsed, selector, 'outline-color', 'var(--color-focus)');
    }
  });

  it('@trace FR-65 The button rule takes text, fill and border from the control tokens', () => {
    const parsed = readStyles();
    for (const selector of ['button']) {
      expectDecl(parsed, selector, 'color', 'var(--color-text)');
      expectDecl(parsed, selector, 'background-color', 'var(--color-control-bg)');
      expectDecl(parsed, selector, 'border-color', 'var(--color-control-border)');
    }
  });
});

// add-theme-switch DELIBERATE CHANGE (FR-65, A-51; autonomy-log rows 118 and 124, decision A1): the five scenarios «Cell borders have 3:1»,
// «The given cue has 3:1 and is not the fill», «The violation cue has 3:1», «The focus ring has 3:1 against every cell background» and «The
// control border has 3:1 and the text has 4.5:1» now say "the resolved colours of the tokens of each token set (light, then dark)": each
// loops over `themeTokenSets(parsed)` (the dark set is asserted to exist). The declarations are asserted once; no threshold changed.
describe('contrast (FR-65, NFR-9)', () => {
  // update-page-palette DELIBERATE CHANGE (FR-65, A-57; delta «Borders, cues and focus rings have enough contrast», scenario «Cell borders have 3:1»,
  // proposal.md Impact row `tests/play-page-stylesheet.test.ts:143`): the pairs are the page, the cell, the board plate and the solved plate; the
  // pair against the given fill is out (a given cell is inactive, FR-69, A-57), and the ratios are the ones the spec lists.
  it('@trace FR-65 Cell borders have 3:1 against the page, the cell, the board plate and the solved plate, in the light and in the dark token set', () => {
    const parsed = readStyles();
    const listed: Record<string, number[]> = { light: [3.77, 4.1, 3.03, 3.5], dark: [4.55, 4.13, 3.17, 3.44] };
    for (const set of themeTokenSets(parsed)) {
      const border = tokenIn(set, '--color-cell-border');
      const ratios = ['--color-page', '--color-cell-bg', '--color-line', '--color-success-bg'].map((name) =>
        Number(contrastRatio(border, tokenIn(set, name)).toFixed(2)),
      );
      expect(ratios, `${set.label}: the ratios of the cell border against the page, the cell, the plate and the solved plate`).toEqual(listed[set.label]);
      expect(contrastProblems(set.tokens, ['cell-border']), `${set.label} token set`).toEqual([]);
    }
  });

  // update-page-palette DELIBERATE CHANGE (FR-65, FR-64, A-57; delta «Borders, cues and focus rings have enough contrast», scenario «The given cue is
  // weight», proposal.md Impact row `tests/play-page-stylesheet.test.ts:151-166`; the signature of PA-Q1 A overrides the row-148 clause): the test
  // «The given cue has 3:1 and is not the fill: 2px border in its own colour, bold digits» is replaced. A given cell is told from an ordinary one by
  // weight 800 against 500 (in a violation too), its border is 1px in the cell border's colour, its digit keeps 4.5:1. The computed half is in the
  // cascade block below.
  it('@trace FR-65 @trace FR-64 The given cue is weight: .cell-given declares weight 800 and a 1px border in the cell border colour, the digit has 4.5:1 (light and dark)', () => {
    const parsed = readStyles();
    expectDecl(parsed, '.cell', 'font-weight', '500');
    expectDecl(parsed, '.cell-given', 'font-weight', '800');
    expectDecl(parsed, '.cell-given', 'border-width', '1px');
    expectDecl(parsed, '.cell-given', 'border-color', 'var(--color-given-border)');
    expectDecl(parsed, '.cell-given.cell-violation', 'font-weight', '800');
    const listed: Record<string, number> = { light: 10.87, dark: 8.62 };
    for (const set of themeTokenSets(parsed)) {
      const text = tokenIn(set, '--color-given-text');
      const fill = tokenIn(set, '--color-given-bg');
      expect(Number(contrastRatio(text, fill).toFixed(2)), `${set.label}: the given digit on the given fill`).toBe(listed[set.label]);
      expect(tokenIn(set, '--color-given-border').toLowerCase(), `${set.label}: the given border equals the cell border (deliberate, PA-Q1 A)`).toBe(
        tokenIn(set, '--color-cell-border').toLowerCase(),
      );
    }
  });

  it('@trace FR-65 @trace FR-64 The violation cue has 3:1 against the page, the cell and the violation fill (light and dark)', () => {
    const parsed = readStyles();
    for (const set of themeTokenSets(parsed)) {
      tokenIn(set, '--color-violation-border');
      expect(contrastProblems(set.tokens, ['violation-cue']), `${set.label} token set`).toEqual([]);
    }
  });

  it('@trace FR-65 The focus ring has 3:1 against the page and every cell background (light and dark)', () => {
    const parsed = readStyles();
    for (const set of themeTokenSets(parsed)) {
      tokenIn(set, '--color-focus');
      expect(contrastProblems(set.tokens, ['focus-ring']), `${set.label} token set`).toEqual([]);
    }
  });

  it('@trace FR-65 @trace NFR-9 The control border has 3:1 and the text pairs have 4.5:1 (light and dark)', () => {
    const parsed = readStyles();
    for (const set of themeTokenSets(parsed)) {
      tokenIn(set, '--color-control-border');
      tokenIn(set, '--color-text');
      expect(contrastProblems(set.tokens, ['control-border', 'text']), `${set.label} token set`).toEqual([]);
    }
  });

  it('@trace FR-65 @trace NFR-9 Every pair holds for the top-level token set, the dark set and every set a conditional :root block makes', () => {
    const parsed = readStyles();
    expect(parsed.tokenSets.length).toBeGreaterThanOrEqual(1);
    expect(parsed.tokenSets[0]?.label).toBe('top-level');
    // add-theme-switch: the light and the dark set always exist (themeTokenSets asserts the dark one), a conditional block adds sets only if the file has one
    expect(themeTokenSets(parsed).map((set) => set.label)).toEqual(['light', 'dark']);
    for (const set of parsed.tokenSets) {
      expect(contrastProblems(set.tokens), `token set "${set.label}"`).toEqual([]);
    }
  });
});

describe('visible, unobscured focus indicators (FR-65)', () => {
  const targets = ['.cell:focus-visible', 'button:focus-visible'];

  it('@trace FR-65 Focus-visible rules exist for the cell and the button: solid, at least 2px, the focus token', () => {
    const parsed = readStyles();
    for (const selector of targets) {
      expect(rulesWithSelector(parsed, selector).length, `a rule for ${selector}`).toBeGreaterThan(0);
      expectDecl(parsed, selector, 'outline-style', 'solid');
      expect(px(declarationsFor(parsed, selector).get('outline-width')), `${selector} outline-width`).toBeGreaterThanOrEqual(2);
      expectDecl(parsed, selector, 'outline-color', 'var(--color-focus)');
    }
  });

  it('@trace FR-65 The cell ring is outside the border and above the neighbours: offset 2px, position relative, z-index at least 1', () => {
    const parsed = readStyles();
    expectDecl(parsed, '.cell:focus-visible', 'outline-offset', '2px');
    expectDecl(parsed, '.cell:focus-visible', 'position', 'relative');
    const zIndex = Number(declarationsFor(parsed, '.cell:focus-visible').get('z-index'));
    expect(Number.isInteger(zIndex) && zIndex >= 1, `z-index ${zIndex} is an integer of at least 1`).toBe(true);
  });

  it('@trace FR-65 The button ring has a positive outline-offset', () => {
    const parsed = readStyles();
    for (const selector of ['button:focus-visible']) {
      expect(px(declarationsFor(parsed, selector).get('outline-offset')), `${selector} outline-offset`).toBeGreaterThan(0);
    }
  });

  // fix-size-option-focus-ring (FR-65 "unobscured"; «Segmented options keep the focus ring inside the card»): inside a segmented card an
  // outset ring runs over the gap and the neighbour option, so the options of the size, theme and language controls pull it inside.
  // That every other button keeps the outset ring is the test above («The button ring has a positive outline-offset»).
  it('@trace FR-65 Each segmented control declares an inset focus ring: outline-offset -1px, not important', () => {
    const parsed = readStyles();
    for (const control of ['.size-control', '.theme-control', '.language-control']) {
      const selector = `${control} button:focus-visible`;
      expect(rulesWithSelector(parsed, selector).length, `a rule for ${selector}`).toBeGreaterThan(0);
      expectDecl(parsed, selector, 'outline-offset', '-1px');
      const important = rulesWithSelector(parsed, selector).flatMap((r) =>
        r.declarations.filter((d) => d.property === 'outline-offset' && d.important),
      );
      expect(important, `${selector} outline-offset is not !important`).toEqual([]);
    }
  });

  // update-segmented-focus-ring-wording («The segmented rules change only the offset»): the ring keeps the style, width and colour of
  // button:focus-visible, so the three segmented rules set nothing but the offset.
  it('@trace FR-65 The segmented rules change only the offset: no outline, outline-style, outline-width or outline-color', () => {
    const parsed = readStyles();
    for (const control of ['.size-control', '.theme-control', '.language-control']) {
      const selector = `${control} button:focus-visible`;
      const declared = rulesWithSelector(parsed, selector).flatMap((r) => r.declarations.map((d) => d.property));
      for (const property of ['outline', 'outline-style', 'outline-width', 'outline-color']) {
        expect(declared, `${selector} declares no ${property}`).not.toContain(property);
      }
    }
  });

  // update-setup-sheet-start, review-gate second fix round (finding 1, FR-65): the sticky footer strip hides a keyboard-focused
  // level option when the sheet scrolls, unless the scroll container reserves the strip in its scroll padding.
  it('@trace FR-65 The open sheet reserves the footer in its scroll padding: scroll-padding-bottom of at least calc(2.75rem + 48px) (92px)', () => {
    const parsed = readStyles();
    expect(rulesWithSelector(parsed, '.setup-sheet:popover-open').length, 'a rule for .setup-sheet:popover-open').toBeGreaterThan(0);
    const value = declarationsFor(parsed, '.setup-sheet:popover-open').get('scroll-padding-bottom');
    expect(value, '.setup-sheet:popover-open declares scroll-padding-bottom').toBeDefined();
    // 1rem = 16px; accept one length (px or rem) or a calc() sum of such lengths
    const lengthPx = (term: string): number => {
      const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(term.trim());
      return m?.[1] === undefined ? Number.NaN : Number(m[1]) * (m[2] === 'rem' ? 16 : 1);
    };
    const inner = /^calc\(\s*(.+)\s*\)$/i.exec((value ?? '').trim())?.[1] ?? (value ?? '').trim();
    const terms = inner.split(/\s+\+\s+/);
    const total = terms.reduce((sum, term) => sum + lengthPx(term), 0);
    expect(Number.isFinite(total), `scroll-padding-bottom «${value}» is a px/rem length or a calc() sum of them`).toBe(true);
    expect(total, `scroll-padding-bottom «${value}» = ${total}px, at least the strip, the bottom padding and the ring: 2.75rem + 48px = 92px (the measured need, focus-obscured-repro.txt)`).toBeGreaterThanOrEqual(92);
  });

  it('@trace FR-65 Nothing removes the outline (text search and declarations)', () => {
    const text = readStyleText();
    expect(text).not.toMatch(/outline\s*:\s*(none|0(px)?(?![\d.]))/i);
    expect(text).not.toMatch(/outline-style\s*:\s*none/i);
    expect(text).not.toMatch(/outline-width\s*:\s*0(px)?(?![\d.])/i);
    const parsed = readStyles();
    const removing = parsed.rules.flatMap((r) =>
      r.declarations.filter(
        (d) =>
          (d.property === 'outline' && /^(none|0|0px)$/i.test(d.value)) ||
          (d.property === 'outline-style' && d.value.toLowerCase() === 'none') ||
          (d.property === 'outline-width' && px(d.value) === 0),
      ),
    );
    expect(removing).toEqual([]);
  });

  it('@trace FR-65 Every page button is a button element, so button:focus-visible (and .cell:focus-visible for the cells) applies to it', () => {
    // Slice DL2 DELIBERATE CHANGE (FR-65 modified, FR-87, FR-95, FR-97): seven radio buttons (three sizes, four levels), the
    // summary button and the close button of the setup sheet join the list (was three radios and 1 + 3 + 3 + 1 + 2 + 36 buttons);
    // update-setup-sheet-start (FR-65, FR-101): the start button «Почати» joins it too (one more button)
    const root = mountFixture(BLANK);
    const panel = rulesPanel(root);
    // add-theme-switch DELIBERATE CHANGE (FR-65, FR-102, FR-117; delta «Every page button is a button element»): the three theme options are
    // radios inside the root too (7 becomes 10), and the settings button and the settings panel's close button join the list (53 becomes 58)
    // add-english-version DELIBERATE CHANGE (FR-65, FR-107; delta «Every page button is a button element»): the two language options are radios
    // too (10 becomes 12), and the list of buttons grows from 58 to 60
    const radios = Array.from(root.querySelectorAll('[role="radio"]'));
    expect(radios, 'the three size buttons, the four level buttons, the three theme options and the two language options').toHaveLength(12);
    const panelButtons = Array.from(panel.querySelectorAll('button'));
    expect(panelButtons, 'premise: the rules panel holds one button, its close button').toHaveLength(1);
    const buttons: Element[] = [
      q(root, '[data-action="rules"]'),
      q(root, '[data-action="settings"]'),
      q(root, '[data-action="setup"]'),
      ...radios,
      q(root, '[data-action="setup-start"]'),
      q(root, '[data-action="setup-close"]'),
      q(root, '[data-action="settings-close"]'),
      q(root, '[data-action="hint"]'),
      q(root, '[data-action="reset"]'),
      q(root, '[data-action="new"]'),
      ...panelButtons,
      q(root, '[data-confirm="yes"]'),
      q(root, '[data-confirm="no"]'),
      ...allCells(root),
    ];
    expect(buttons).toHaveLength(1 + 1 + 1 + 12 + 1 + 1 + 1 + 3 + 1 + 2 + 36);
    for (const button of buttons) {
      expect(button.tagName, `${button.getAttribute('data-action') ?? button.getAttribute('data-confirm') ?? button.getAttribute('role') ?? 'cell'} is a button element`).toBe('BUTTON');
    }
  });

  it('@trace FR-65 The stylesheet stays inside the build target, with one :has( exception: no !important; exactly one rule has :has(, its subject is .message-idle and it declares only display: none', () => {
    expect(readStyleText()).not.toMatch(/!\s*important/i);
    const parsed = readStyles();
    expect(parsed.rules.flatMap((r) => r.declarations.filter((d) => d.important))).toEqual([]);
    const withHas = parsed.rules.filter((r) => r.selectors.some((s) => s.includes(':has(')));
    expect(withHas, 'exactly one rule contains :has(').toHaveLength(1);
    expect(readStyleText().match(/:has\(/gi) ?? [], 'the raw text holds :has( exactly once (no rule the parser drops, no at-rule prelude)').toHaveLength(1);
    const rule = withHas[0];
    expect.assert(rule !== undefined, 'premise: one rule contains :has(');
    expect(rule.selectors.map(subjectOf), 'the subject of its selector is .message-idle').toEqual(['.message-idle']);
    expect(rule.declarations.map((d) => `${d.property}: ${d.value}`), 'it declares nothing but display: none').toEqual(['display: none']);
  });
});

describe('rows are kept in the accessibility tree and the label is not hidden', () => {
  it('@trace FR-61 No rule uses display: contents (it has a history of dropping row semantics)', () => {
    expect(readStyleText()).not.toMatch(/display\s*:\s*contents/i);
    const parsed = readStyles();
    expect(parsed.rules.flatMap((r) => r.declarations.filter((d) => d.property === 'display' && d.value === 'contents'))).toEqual([]);
  });
});

describe('the selector sets its own colours and the board disables double-tap zoom (FR-65)', () => {
  // add-theme-switch DELIBERATE CHANGE (FR-65, A-51; delta «The size buttons set their own colours...», decision A1): the 4.5:1 ratio of the
  // text to the background is computed in the light AND in the dark token set; the declarations are asserted once.
  it('@trace FR-65 The size buttons declare a color and a background-color token, unchecked and checked, with 4.5:1 between them (light and dark)', () => {
    const parsed = readStyles();
    const unchecked = declarationsFor(parsed, '.size-control button');
    const checkedOwn = declarationsFor(parsed, ".size-control button[aria-checked='true']");
    expect(rulesWithSelector(parsed, '.size-control button').length, 'a rule for the size buttons').toBeGreaterThan(0);
    expect(rulesWithSelector(parsed, ".size-control button[aria-checked='true']").length, 'a rule for the checked size button').toBeGreaterThan(0);
    const checked = new Map([...unchecked, ...checkedOwn]); // the declarations of the checked state: its own laid over the unchecked ones
    for (const set of themeTokenSets(parsed)) {
      for (const [state, declarations] of [['unchecked', unchecked], ['checked', checked]] as const) {
        const fg = tokenOf(parsed, declarations.get('color'));
        const bg = tokenOf(parsed, declarations.get('background-color'));
        expect.assert(fg !== undefined, `${state}: color is a single var(--color-...) of a declared token (is ${declarations.get('color') ?? 'missing'})`);
        expect.assert(bg !== undefined, `${state}: background-color is a single var(--color-...) of a declared token (is ${declarations.get('background-color') ?? 'missing'})`);
        expect(contrastRatio(tokenIn(set, fg), tokenIn(set, bg)), `${set.label} set, ${state}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('@trace FR-65 The board sets touch-action: manipulation and [data-board] has the class board', () => {
    const parsed = readStyles();
    expectDecl(parsed, '.board', 'touch-action', 'manipulation');
    const root = mountFixture(BLANK);
    expect(q(root, '[data-board]').classList.contains('board')).toBe(true);
  });
});

describe('the hint and win regions stay rendered while empty (FR-63)', () => {
  /** The selector of a rule as a subject without its pseudo-classes and pseudo-elements, with single-quoted attribute values. */
  const baseOf = (selector: string): string => subjectOf(selector).replace(/::?[\w-]+(\([^()]*\))?/g, '').replaceAll('"', "'");
  const regionSubjects = new Set(['.message', '.message-win', "[data-message='hint']", "[data-message='win']"]);

  it('@trace FR-63 Empty hint and win regions stay rendered: they compute no display none and no hidden visibility, and no rule of theirs declares either', () => {
    injectPageStyles();
    const root = mountFixture(BLANK);
    for (const name of ['hint', 'win']) {
      const region = q(root, `[data-message="${name}"]`);
      expect(region.textContent, `premise: the ${name} region is empty`).toBe('');
      const style = getComputedStyle(region);
      expect(style.display, `the empty ${name} region computes a display`).not.toBe('none');
      expect(['hidden', 'collapse'], `the empty ${name} region is not hidden`).not.toContain(style.visibility);
    }
    const parsed = readStyles();
    const own = parsed.rules.filter((r) => r.selectors.some((s) => regionSubjects.has(baseOf(s))));
    expect(own.length, 'the walk found the rules of the message regions').toBeGreaterThan(0);
    const hiding = own.flatMap((r) =>
      r.declarations
        .filter((d) => (d.property === 'display' && d.value === 'none') || (d.property === 'visibility' && ['hidden', 'collapse'].includes(d.value)))
        .map((d) => `${r.selectors.join(', ')} { ${d.property}: ${d.value} }`),
    );
    expect(hiding).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// (b) The cascade, computed by jsdom on the injected stylesheet (var(--color-x) replaced by the :root value)
// ---------------------------------------------------------------------------------------------------------

describe('the cascade gives each cell state its border and the colours whose contrast is checked', () => {
  const sizes: [number, typeof PAIR_ROW_PLUS][] = [
    [4, PAIR_PLUS_4],
    [6, PAIR_ROW_PLUS],
    [8, PAIR_PLUS_8],
  ];

  /** The four kinds at size n: ordinary 1,1; a plain given at n,n; a violating player cell 3,3; a given in the violation 3,1. */
  function fourKinds(puzzle: typeof PAIR_ROW_PLUS): Record<'ordinary' | 'given' | 'violating' | 'givenViolating', HTMLElement> {
    const n = puzzle.size;
    const root = mountThenSelect(puzzle);
    clickCell(root, 3, 3); // 0 next to the givens 0 0 at 3,1 and 3,2
    const kinds = {
      ordinary: cellEl(root, 1, 1),
      given: cellEl(root, n, n),
      violating: cellEl(root, 3, 3),
      givenViolating: cellEl(root, 3, 1),
    };
    const has = (el: HTMLElement, cls: string): boolean => el.classList.contains(cls);
    expect([has(kinds.ordinary, 'cell-given'), has(kinds.ordinary, 'cell-violation')], 'ordinary cell').toEqual([false, false]);
    expect([has(kinds.given, 'cell-given'), has(kinds.given, 'cell-violation')], 'plain given').toEqual([true, false]);
    expect([has(kinds.violating, 'cell-given'), has(kinds.violating, 'cell-violation')], 'violating cell').toEqual([false, true]);
    expect([has(kinds.givenViolating, 'cell-given'), has(kinds.givenViolating, 'cell-violation')], 'given in violation').toEqual([true, true]);
    return kinds;
  }

  // update-page-palette DELIBERATE CHANGE (FR-64, A-57; delta «A violation shows a cue besides colour», proposal.md Impact row
  // `tests/play-page-stylesheet.test.ts:444-450`; the signature of PA-Q1 A overrides the border-widths test): the widths are 1px, 1px, 2px and 2px
  // (was 1, 2, 3 and 3): the given cell is told by weight, not by width, and a violation is wider than both.
  for (const [n, puzzle] of sizes) {
    it(`@trace FR-64 The computed border is heavier for a violation at ${n}x${n}: 1px, 1px, 2px and 2px`, () => {
      injectPageStyles();
      const kinds = fourKinds(puzzle);
      const widths = [kinds.ordinary, kinds.given, kinds.violating, kinds.givenViolating].map((el) => getComputedStyle(el).borderTopWidth);
      expect(widths).toEqual(['1px', '1px', '2px', '2px']);
      const [ordinary, given, violating, givenViolating] = widths.map((w) => px(w));
      expect(violating, 'the violating width is greater than the ordinary one').toBeGreaterThan(ordinary ?? Number.NaN);
      expect(violating, 'and than the given one').toBeGreaterThan(given ?? Number.NaN);
      expect(givenViolating, 'a given cell in a violation has the violation width').toBe(violating);
    });
  }

  // update-page-palette (FR-64, FR-65, A-57; delta «Borders, cues and focus rings have enough contrast», scenario «The given cue is weight»): the
  // computed weights are 500, 800, 700 and 800, and the given border is 1px; in each token set (the weights do not depend on it, the border colour
  // does).
  /**
   * The page stylesheet with the values of `tokens` inlined and the `font: inherit` resets removed. jsdom applies a `font` shorthand that comes
   * later in the file over the `font-weight` longhand of a rule with higher specificity (the `button { font: inherit }` rule follows `.cell`), which
   * a browser does not (the cascade is per longhand), so the weights would read `normal` for every kind. Dropping the reset leaves the cascade of
   * the weight declarations, specificity included, to jsdom.
   */
  const injectForWeights = (tokens: Record<string, string>): HTMLStyleElement =>
    injectStyles(withTokensInlined(readStyleText(), tokens).replace(/(^|[;{\s])font\s*:\s*inherit\s*;/g, '$1'));

  for (const [n, puzzle] of sizes) {
    it(`@trace FR-65 @trace FR-64 The given cue is weight at ${n}x${n}: the computed weights are 500, 800, 700 and 800, the given border is 1px and the cell border colour`, () => {
      const parsed = readStyles();
      for (const set of themeTokenSets(parsed)) {
        const style = injectForWeights(set.tokens);
        const kinds = fourKinds(puzzle);
        const weights = [kinds.ordinary, kinds.given, kinds.violating, kinds.givenViolating].map((el) => getComputedStyle(el).fontWeight);
        expect(weights, `${set.label}: ordinary, given, violating, given in a violation`).toEqual(['500', '800', '700', '800']);
        expect(getComputedStyle(kinds.given).borderTopWidth, `${set.label}: the given border width`).toBe('1px');
        expect(getComputedStyle(kinds.given).borderTopColor, `${set.label}: the given border colour equals the ordinary cell's`).toBe(
          getComputedStyle(kinds.ordinary).borderTopColor,
        );
        style.remove();
        document.body.replaceChildren();
      }
    });
  }

  // add-theme-switch DELIBERATE CHANGE (FR-65, A-51; delta «The cascade gives each cell state the colours whose contrast is checked»): the test
  // injects the stylesheet once with the light values and once with the dark values substituted (`injectPageStyles(set.tokens)`).
  // update-page-palette DELIBERATE CHANGE (FR-65, A-57; same scenario, proposal.md Impact row `tests/play-page-stylesheet.test.ts:455-475`): an
  // ordinary cell takes its text from `--color-entry-text`, a given cell from `--color-given-text`, the violating kinds from
  // `--color-violation-text` (the given in a violation too), and a cell with the class `cell-hinted` joins the kinds with `--color-primary`,
  // `--color-primary-soft` and `--color-text`.
  for (const [n, puzzle] of sizes) {
    it(`@trace FR-65 The cascade gives each cell kind the token colours at ${n}x${n}, and the page the page colour (light and dark values)`, () => {
      const parsed = readStyles();
      for (const set of themeTokenSets(parsed)) {
        const style = injectPageStyles(set.tokens);
        const kinds = fourKinds(puzzle);
        const hinted = document.createElement('button');
        hinted.className = 'cell cell-hinted';
        q(document.body, '[data-board]').append(hinted);
        const expected: [HTMLElement, string, string, string, string][] = [
          [kinds.ordinary, '--color-cell-border', '--color-cell-bg', '--color-entry-text', 'ordinary cell'],
          [kinds.given, '--color-given-border', '--color-given-bg', '--color-given-text', 'given cell'],
          [kinds.violating, '--color-violation-border', '--color-violation-bg', '--color-violation-text', 'violating cell'],
          [kinds.givenViolating, '--color-violation-border', '--color-violation-bg', '--color-violation-text', 'given in violation'],
          [hinted, '--color-primary', '--color-primary-soft', '--color-text', 'hinted cell'],
        ];
        for (const [el, border, fill, text, what] of expected) {
          const computed = getComputedStyle(el);
          expect(computed.borderTopColor, `${set.label}: ${what} border`).toBe(rgbOf(tokenIn(set, border)));
          expect(computed.backgroundColor, `${set.label}: ${what} fill`).toBe(rgbOf(tokenIn(set, fill)));
          expect(computed.color, `${set.label}: ${what} text`).toBe(rgbOf(tokenIn(set, text)));
        }
        expect(getComputedStyle(document.body).backgroundColor, `${set.label}: the page colour`).toBe(rgbOf(tokenIn(set, '--color-page')));
        style.remove();
        document.body.replaceChildren();
      }
    });
  }
});

describe('the contrast helper is not vacuous', () => {
  it('@trace FR-65 contrastRatio gives 21:1 for black on white, 1:1 for equal colours and 1.41:1 (below 3:1) for the old given fill on the page', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#6b7280', '#6b7280')).toBeCloseTo(1, 5);
    const oldGivenFill = contrastRatio('#d1d5db', '#f9fafb');
    expect(oldGivenFill).toBeCloseTo(1.41, 2);
    expect(oldGivenFill).toBeLessThan(3);
  });
});
