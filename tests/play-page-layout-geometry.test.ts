import { describe, expect, it } from 'vitest';
import { readStyles, themeTokenSets } from './helpers/css';

// update-page-layout-geometry (NFR-14, G2 block 1), scenario «Colours are unchanged»: the layout port changes geometry only. The 13 colour
// tokens of A-51 keep their names and their values in both token sets; the palette is a later block. The geometry itself is checked in a real
// browser by e2e/nfr-14-layout-geometry.spec.ts (jsdom does not lay out).
const LIGHT: Record<string, string> = {
  '--color-page': '#f9fafb',
  '--color-text': '#1f2937',
  '--color-cell-bg': '#ffffff',
  '--color-cell-border': '#6b7280',
  '--color-given-bg': '#e5e7eb',
  '--color-given-border': '#374151',
  '--color-violation-bg': '#fecaca',
  '--color-violation-border': '#b91c1c',
  '--color-violation-text': '#991b1b',
  '--color-focus': '#1d4ed8',
  '--color-control-bg': '#ffffff',
  '--color-control-border': '#6b7280',
  '--color-win-text': '#166534',
};
const DARK: Record<string, string> = {
  '--color-page': '#1a1714',
  '--color-text': '#f1ede4',
  '--color-cell-bg': '#24201b',
  '--color-cell-border': '#9a8f80',
  '--color-given-bg': '#4d4438',
  '--color-given-border': '#e0d6c4',
  '--color-violation-bg': '#3f2320',
  '--color-violation-border': '#ff8a7d',
  '--color-violation-text': '#ffb4ab',
  '--color-focus': '#f39a5b',
  '--color-control-bg': '#24201b',
  '--color-control-border': '#9a8f80',
  '--color-win-text': '#8fd19a',
};

describe('@trace NFR-14 the layout geometry port leaves the colours unchanged', () => {
  it('the light and dark token sets keep the 13 names and values of A-51', () => {
    const [light, dark] = themeTokenSets(readStyles());
    expect(light?.tokens).toEqual(LIGHT);
    expect(dark?.tokens).toEqual(DARK);
  });
});
