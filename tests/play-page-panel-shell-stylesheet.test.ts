// Play page: the shared paint of the four surfaces, read from src/ui/style.css (update-panel-shell, NFR-14 G2 panel shell). One test per stylesheet
// scenario of the ADDED requirement «The panels take the shared surface paint» in openspec/changes/update-panel-shell/specs/play-page/spec.md: the
// three panels' fill, border colour and sheet shadow; the 48rem panel shadow and the `.rules` border of that block; the dialog's fill, panel shadow and
// kept control border; the footer strip and the two «Закрити» fills; no colour literal; the raised fill's three pairs. The browser read against the
// design build is e2e/nfr-14-panel-shell.spec.ts (jsdom has no box shadow to paint), so everything here is read as declarations, which is what the
// scenarios ask. Written FIRST (red) from the spec, before the port.
//
// Tests that pass today by design are marked GUARD in their comment and listed in docs/qa/update-panel-shell/red-run.txt (section C) with the reason.
//
// Deliberately NOT encoded (the coordinator's correction of the delta, 2026-10-11): the `git diff -U0` clause of the first panel scenario and any
// assertion that pins the current width, height, padding, max-height, radius, inset, margin or line-height of `.rules`, `.setup-sheet`, `.settings` or
// `.confirm`. That clause is a change-time check of this change (task 3.6, recorded in green-run.txt), not a lasting test: the later rules-panel and
// setup-sheet blocks change those declarations on purpose. This file reads fill, border colour and shadow only.
//
// @trace NFR-14
// @trace FR-65
import { describe, expect, it } from 'vitest';
import { CONTRAST_PAIRS, contrastRatio, readStyleText, readStyles, scanColours, themeTokenSets } from './helpers/css';
import type { ParsedStyles, StyleRuleInfo, TokenSet } from './helpers/css';

const RAISED = '--color-surface-raised';
const OVERLAY = '--color-overlay-border';
const SHADOW_PANEL = '--color-shadow-panel';
const SHADOW_SHEET = '--color-shadow-sheet';
const PANELS = ['.rules', '.setup-sheet', '.settings'] as const;

/** jsdom prints the prelude as `@media (min-width: 48rem)`; the pattern tolerates the spacing a hand-written file could use. */
const MEDIA_48REM = /^@media\s*\(\s*min-width\s*:\s*48rem\s*\)$/;

const SHEET_SHADOW = `0 -0.5rem 2rem var(${SHADOW_SHEET})`;
const PANEL_SHADOW = `0 1rem 2.5rem var(${SHADOW_PANEL})`;

/** The rules whose selector list is exactly `selector` (not `.rules h2`, not `.setup-sheet > .setup-close`, not a pseudo-element). */
const exactRules = (parsed: ParsedStyles, selector: string): StyleRuleInfo[] =>
  parsed.rules.filter((r) => r.selectors.length === 1 && r.selectors[0] === selector);
const topLevel = (rules: StyleRuleInfo[]): StyleRuleInfo[] => rules.filter((r) => r.context.length === 0);
const inMedia48 = (rules: StyleRuleInfo[]): StyleRuleInfo[] =>
  rules.filter((r) => r.context.length === 1 && MEDIA_48REM.test(r.context[0] ?? ''));
const valueOf = (rule: StyleRuleInfo, property: string): string | undefined => rule.declarations.find((d) => d.property === property)?.value;
const where = (rule: StyleRuleInfo): string => `${rule.context.join(' ')} ${rule.selectors.join(', ')}`.trim();

/** How many times `property:` is written inside the blocks whose selector is exactly `selector` in the raw text (a CSSOM keeps only the last of two). */
function rawDeclarationCounts(text: string, selector: string, property: string): number[] {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\>:]/g, '\\$&');
  const blocks = [...text.matchAll(new RegExp(`(?:^|\\n)[ \\t]*${escaped}[ \\t]*\\{([^{}]*)\\}`, 'g'))];
  return blocks.map((m) => (m[1] ?? '').split(';').filter((d) => new RegExp(`^\\s*${property}\\s*:`).test(d)).length);
}

function tokenIn(set: TokenSet, name: string): string {
  const value = set.tokens[name];
  expect.assert(value !== undefined, `${set.label}: ${name} is declared in the token set`);
  return value;
}

describe('The panels take the shared surface paint (update-panel-shell)', () => {
  // Scenario «The three panels take the raised fill, the overlay border and the sheet shadow below 48rem». Red today: the rules paint
  // --color-control-bg, --color-given-bg and no shadow. (The scenario's `git diff -U0` clause is task 3.6's check, not a test; see the header.)
  it('The three panels take the raised fill, the overlay border and the sheet shadow below 48rem: one rule each outside any at-rule, each declaration once', () => {
    const parsed = readStyles();
    const text = readStyleText();
    for (const selector of PANELS) {
      const rules = topLevel(exactRules(parsed, selector));
      expect(rules, `${selector}: one rule outside any at-rule`).toHaveLength(1);
      const rule = rules[0];
      expect.assert(rule !== undefined, `premise: ${selector} has a top-level rule`);
      expect(valueOf(rule, 'background-color'), `${selector} { background-color }`).toBe(`var(${RAISED})`);
      expect(valueOf(rule, 'border-color'), `${selector} { border-color }`).toBe(`var(${OVERLAY})`);
      expect(valueOf(rule, 'box-shadow'), `${selector} { box-shadow }`).toBe(SHEET_SHADOW);
      // "each of the three declarations appears once in that rule": the raw text, because the CSSOM keeps only the last of two. The top-level
      // block of each panel is the first block of that selector in the file.
      for (const property of ['background-color', 'border-color', 'box-shadow']) {
        expect(rawDeclarationCounts(text, selector, property)[0], `${selector}: ${property} is written once in its top-level block`).toBe(1);
      }
    }
  });

  // Scenario «From 48rem the three panels take the panel shadow and keep the overlay border». Red today: no shadow, and the `.rules` rule of the 48rem
  // block states `--color-given-bg` again.
  it('From 48rem the three panels take the panel shadow and keep the overlay border: no rule that is exactly a panel names another border colour or fill', () => {
    const parsed = readStyles();
    for (const selector of PANELS) {
      const rules = inMedia48(exactRules(parsed, selector));
      const shadows = rules.filter((r) => valueOf(r, 'box-shadow') !== undefined);
      expect(shadows.map((r) => valueOf(r, 'box-shadow')), `${selector}: one box-shadow inside @media (min-width: 48rem)`).toEqual([PANEL_SHADOW]);
      // across every width: no other border colour and no other fill
      for (const rule of exactRules(parsed, selector)) {
        const border = valueOf(rule, 'border-color');
        if (border !== undefined) expect(border, `${where(rule)} { border-color }`).toBe(`var(${OVERLAY})`);
        const fill = valueOf(rule, 'background-color');
        if (fill !== undefined) expect(fill, `${where(rule)} { background-color }`).toBe(`var(${RAISED})`);
      }
    }
    // the rule of the 48rem block that states the border again, the `.rules` one, now states the overlay border
    const rules48 = inMedia48(exactRules(parsed, '.rules'));
    expect(
      rules48.map((r) => valueOf(r, 'border-color')),
      '.rules inside @media (min-width: 48rem) declares border-color var(--color-overlay-border), not var(--color-given-bg)',
    ).toEqual([`var(${OVERLAY})`]);
  });

  // Scenario «The dialog takes the raised fill and the panel shadow and keeps its control border». Red today: the fill is --color-control-bg and there
  // is no shadow.
  it('The dialog takes the raised fill and the panel shadow: one rule outside any at-rule', () => {
    const rules = topLevel(exactRules(readStyles(), '.confirm'));
    expect(rules, '.confirm: one rule outside any at-rule').toHaveLength(1);
    const rule = rules[0];
    expect.assert(rule !== undefined, 'premise: .confirm has a top-level rule');
    expect(valueOf(rule, 'background-color'), '.confirm { background-color }').toBe(`var(${RAISED})`);
    expect(valueOf(rule, 'box-shadow'), '.confirm { box-shadow }').toBe(PANEL_SHADOW);
  });

  // GUARD: green today (the dialog keeps its control border, owns no rule inside an at-rule and never takes the overlay border) and must stay green.
  it('GUARD: the dialog keeps --color-control-border, has one fill, border and shadow at every width, and never takes the overlay border', () => {
    const parsed = readStyles();
    const rules = exactRules(parsed, '.confirm');
    const rule = topLevel(rules)[0];
    expect.assert(rule !== undefined, 'premise: .confirm has a top-level rule');
    expect(valueOf(rule, 'border-color'), '.confirm { border-color } is kept').toBe('var(--color-control-border)');
    const inAtRule = rules.filter((r) => r.context.length > 0 && ['box-shadow', 'border-color', 'background-color'].some((p) => valueOf(r, p) !== undefined));
    expect(inAtRule.map(where), 'no .confirm rule inside an at-rule declares a shadow, border colour or fill').toEqual([]);
    const overlayOnDialog = parsed.rules.filter(
      (r) => r.selectors.some((s) => /\.confirm(?![\w-])/.test(s)) && r.declarations.some((d) => d.value.includes(OVERLAY)),
    );
    expect(overlayOnDialog.map(where), 'no rule declares var(--color-overlay-border) for .confirm').toEqual([]);
  });

  // Scenario «The footer strip and the two close buttons take the raised fill». Red today: the strip uses --color-control-bg, and neither close rule
  // declares a fill.
  it('The footer strip and the two close buttons take the raised fill; the strip uses --color-control-bg nowhere', () => {
    const parsed = readStyles();
    const strip = exactRules(parsed, '.setup-sheet:popover-open::before');
    expect(strip, 'one rule .setup-sheet:popover-open::before').toHaveLength(1);
    const stripRule = strip[0];
    expect.assert(stripRule !== undefined, 'premise: the strip rule exists');
    expect(stripRule.context, 'the strip rule is outside any at-rule').toEqual([]);
    expect(valueOf(stripRule, 'background'), 'the strip { background }').toBe(`linear-gradient(to bottom, transparent, var(${RAISED}) 16px)`);
    expect(valueOf(stripRule, 'box-shadow'), 'the strip { box-shadow }').toBe(`0 16px 0 16px var(${RAISED})`);
    for (const d of stripRule.declarations) expect(d.value, `strip { ${d.property} } does not use the control fill`).not.toContain('--color-control-bg');
    for (const selector of ['.setup-close', '.settings-close']) {
      const rules = topLevel(exactRules(parsed, selector));
      expect(rules, `${selector}: one rule outside any at-rule`).toHaveLength(1);
      const rule = rules[0];
      expect.assert(rule !== undefined, `premise: ${selector} has a rule`);
      expect(valueOf(rule, 'background-color'), `${selector} { background-color }`).toBe(`var(${RAISED})`);
    }
  });

  // Scenario «No shell binding adds a colour literal». Red today: the shadows do not exist yet and the four shell tokens are referenced by no declaration.
  it('No shell binding adds a colour literal: each shadow colour is a token, each of the four shell tokens is referenced outside :root', () => {
    const parsed = readStyles();
    // every box-shadow of the rules of this requirement has its colour as a token
    const shadowRules = [...PANELS, '.confirm'].flatMap((s) => exactRules(parsed, s)).filter((r) => valueOf(r, 'box-shadow') !== undefined);
    expect(shadowRules.length, 'the panels and the dialog declare shadows (3 below 48rem, 3 from 48rem, 1 on the dialog)').toBe(7);
    for (const rule of shadowRules) expect(valueOf(rule, 'box-shadow'), `${where(rule)} { box-shadow } has a var(--color-...) colour`).toMatch(/var\(--color-[\w-]+\)\s*$/);
    // each of the four shell tokens is referenced by at least one declaration outside :root
    const outside = parsed.rules.filter((r) => !r.selectors.every((s) => s === ':root' || /^:root\[data-theme=["']?dark["']?\]$/.test(s)));
    const used = (name: string): number => outside.flatMap((r) => r.declarations).filter((d) => new RegExp(`var\\(\\s*${name}\\s*[,)]`).test(d.value)).length;
    for (const name of [RAISED, OVERLAY, SHADOW_PANEL, SHADOW_SHEET]) expect(used(name), `${name} is referenced outside :root`).toBeGreaterThan(0);
  });

  // GUARD: green today (the stylesheet has no literal, no !important and one `:has(`) and must stay green after the port.
  it('GUARD: the colour scan finds nothing, there is no !important and exactly one :has(', () => {
    const parsed = readStyles();
    const text = readStyleText();
    const scan = scanColours(parsed);
    expect(scan.literals, 'no colour literal').toEqual([]);
    expect(scan.named, 'no named colour').toEqual([]);
    expect(scan.shorthands, 'every colour-bearing shorthand has a token colour').toEqual([]);
    expect(scan.colourProperties, 'every colour property is a token or an allowed keyword').toEqual([]);
    expect(scan.tokensOutsideRoot, 'no token declared outside :root').toEqual([]);
    expect(text, 'no color-mix( anywhere').not.toContain('color-mix(');
    expect(text, 'no !important').not.toMatch(/!\s*important/i);
    expect(text.match(/:has\(/gi) ?? [], 'exactly one :has(').toHaveLength(1);
  });

  // Scenario «The raised fill is covered by pairs». The pair list is the helper's (changed in task 2.1), so the list half is a GUARD of the helper; the
  // ratios are computed from the stylesheet's own tokens, so the test is red today (the tokens are not declared).
  it('The raised fill is covered by pairs: exactly three, with the recorded ratios in the light and the dark set; no pair names the border or a shadow; 38 pairs', () => {
    const onRaised = CONTRAST_PAIRS.filter((p) => p.bg === RAISED);
    expect(
      onRaised.map((p) => `${p.group}: ${p.fg} at ${p.min}`).sort(),
      'the pairs on the raised fill (helper list, GUARD once task 2.1 is done)',
    ).toEqual(['focus-ring: --color-focus at 3', 'text: --color-text at 4.5', 'text: --color-text-muted at 4.5']);
    expect(CONTRAST_PAIRS.filter((p) => [OVERLAY, SHADOW_PANEL, SHADOW_SHEET].some((n) => p.fg === n || p.bg === n))).toEqual([]);
    expect(CONTRAST_PAIRS, 'the list holds 38 pairs (GUARD of the helper)').toHaveLength(38);
    const want: Record<string, [number, number, number]> = { light: [15.88, 7.17, 15.88], dark: [12.79, 6.96, 12.79] };
    for (const set of themeTokenSets(readStyles())) {
      const fill = tokenIn(set, RAISED);
      const ratios = ['--color-text', '--color-text-muted', '--color-focus'].map((name) => Number(contrastRatio(tokenIn(set, name), fill).toFixed(2)));
      expect(ratios, `${set.label}: text, muted text and focus ring on the raised fill`).toEqual(want[set.label]);
      expect(ratios[0], `${set.label}: text at least 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(ratios[1], `${set.label}: muted text at least 4.5`).toBeGreaterThanOrEqual(4.5);
      expect(ratios[2], `${set.label}: focus ring at least 3`).toBeGreaterThanOrEqual(3);
    }
  });
});
