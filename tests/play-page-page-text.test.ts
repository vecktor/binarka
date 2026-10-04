// Play page: Ukrainian page text (NFR-5). The page's own text only; hint sentences belong to puzzle-engine.
// jsdom starts with document.title === '' (index.html is not loaded), so the title must be set by the mounted page.
import { describe, expect, it } from 'vitest';
import {
  HINT_LABEL,
  NEW_LABEL,
  WIN_MESSAGE,
  WIN_PUZZLE,
  collectPageText,
  expectPageStructure,
  fillFrom,
  installPageLifecycle,
  mountFixture,
  mountPage,
  pressHint,
  q,
  solutionGrid,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

describe('@trace NFR-5 the page text is Ukrainian', () => {
  it('Static page text: every collected text has Cyrillic letters and no Latin letters', () => {
    const root = mountFixture(WIN_PUZZLE);
    expectPageStructure(root);
    const texts = collectPageText(root);

    // not vacuous: the collection holds at least the two button labels and the document title
    const trimmed = texts.map((t) => t.trim());
    expect(trimmed).toContain(HINT_LABEL);
    expect(trimmed).toContain(NEW_LABEL);
    expect(document.title).not.toBe('');
    expect(texts).toContain(document.title);

    for (const text of texts) {
      expect(/\p{Script=Cyrillic}/u.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });

  it('the button labels are exactly the two Ukrainian labels of the DOM contract', () => {
    const root = mountFixture(WIN_PUZZLE);
    expect(q(root, '[data-action="hint"]').textContent?.trim()).toBe(HINT_LABEL);
    expect(q(root, '[data-action="new"]').textContent?.trim()).toBe(NEW_LABEL);
  });

  it('Static page text with the real generator (seed 42): the digits in the cells are puzzle content, not collected', () => {
    const root = mountPage({ seedSource: () => 42 });
    const cellTexts = Array.from(root.querySelectorAll('[data-cell]')).map((c) => c.textContent ?? '');
    expect(cellTexts).toHaveLength(36);
    expect(cellTexts.some((t) => t === '0' || t === '1')).toBe(true);
    // none of the cell digits was collected as page text
    const texts = collectPageText(root);
    expect(texts.every((t) => t.trim() !== '0' && t.trim() !== '1')).toBe(true);
    expect(texts.map((t) => t.trim())).toContain(HINT_LABEL);
    for (const text of texts) {
      expect(/\p{Script=Cyrillic}/u.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });

  it('Win message text: exactly the Ukrainian message, with Cyrillic letters and no Latin letters', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    expect(winMessage(root)).toBe('');
    pressHint(root);

    const text = winMessage(root);
    expect(text).toBe(WIN_MESSAGE);
    expect(text).toBe(`Вітаємо, головоломку розв${String.fromCodePoint(0x27)}язано!`);
    expect(/\p{Script=Cyrillic}/u.test(text)).toBe(true);
    expect(/[A-Za-z]/.test(text)).toBe(false);
  });
});
