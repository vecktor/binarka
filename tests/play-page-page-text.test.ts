// Play page: Ukrainian page text (NFR-5). The page's own text only; hint sentences belong to puzzle-engine.
// jsdom starts with document.title === '' (index.html is not loaded), so the title must be set by the mounted page.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  HINT_LABEL,
  NEW_LABEL,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  collectPageText,
  expectPageStructure,
  expectedCellLabel,
  fillFrom,
  generatorBySize,
  installPageLifecycle,
  mountFixture,
  mountPage,
  pressHint,
  q,
  seedQueue,
  selectSize,
  sizeButtons,
  solutionGrid,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

describe('@trace NFR-5 the page text is Ukrainian', () => {
  it('@trace FR-61 @trace FR-62 Static page text: every collected text has Cyrillic letters and no Latin letters', () => {
    const root = mountFixture(WIN_PUZZLE);
    expectPageStructure(root);
    const texts = collectPageText(root);

    // not vacuous: the collection holds at least the two button labels and the document title
    const trimmed = texts.map((t) => t.trim());
    expect(trimmed).toContain(HINT_LABEL);
    expect(trimmed).toContain(NEW_LABEL);
    expect(document.title).not.toBe('');
    expect(texts).toContain(document.title);

    // Slice 6 (add-page-accessibility), DELIBERATE CHANGE (tasks 5.7): the collected texts also include the radiogroup name,
    // the board name as an aria-label and the 36 cell names (a new scenario line; nothing removed).
    expect(trimmed).toContain('Розмір поля');
    expect(q(root, '[data-board]').getAttribute('aria-label')).toBe('Поле 6×6');
    expect(trimmed.filter((t) => t === 'Поле 6×6'), 'the option text and the board aria-label').toHaveLength(2);
    expect(trimmed.filter((t) => /^Рядок [1-6], стовпець [1-6], (порожньо|0|1)(, задано|, підказка)?$/.test(t))).toHaveLength(36);
    // each cell's exact name is collected (folded in from a duplicate test; review finding F6)
    for (const cell of allCells(root)) {
      const name = expectedCellLabel(cell);
      expect(trimmed, `the cell name «${name}» is collected`).toContain(name);
    }

    for (const text of texts) {
      expect(/\p{Script=Cyrillic}/u.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });

  it('@trace NFR-5 @trace FR-61 Accessible names at every size: 4x4 and 8x8 board names and cell names match the pattern, Cyrillic, no Latin', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2, 3]).source,
      generate: generatorBySize({ 4: BLANK_4, 6: BLANK, 8: BLANK_8 }),
    });
    for (const n of [4, 8]) {
      selectSize(root, n);
      const names = [q(root, '[data-board]').getAttribute('aria-label') ?? '', ...allCells(root).map((c) => c.getAttribute('aria-label') ?? '')];
      expect(names[0]).toBe(`Поле ${n}×${n}`);
      expect(names).toHaveLength(1 + n * n);
      for (const name of names.slice(1)) expect(name).toMatch(/^Рядок [1-8], стовпець [1-8], (порожньо|0|1)(, задано|, підказка)?$/);
      for (const name of names) {
        expect(/\p{Script=Cyrillic}/u.test(name), `"${name}" has Cyrillic letters`).toBe(true);
        expect(/[A-Za-z]/.test(name), `"${name}" has no Latin letters`).toBe(false);
      }
    }
  });

  it('Static page text includes the size buttons: «Поле 4×4», «Поле 6×6» and «Поле 8×8» exactly', () => {
    const root = mountFixture(WIN_PUZZLE);
    const texts = collectPageText(root).map((t) => t.trim());
    for (const label of ['Поле 4×4', 'Поле 6×6', 'Поле 8×8']) {
      expect(texts, `collected text contains ${label}`).toContain(label);
    }
    // the sign is the multiplication sign U+00D7, not the Latin letter x, and it is exactly three buttons (the size control is a
    // radiogroup of buttons since change update-controls-accessibility; it was three option elements)
    expect(sizeButtons(root).map((b) => b.textContent)).toEqual(['Поле 4×4', 'Поле 6×6', 'Поле 8×8']);
    expect('Поле 4×4'.codePointAt(6)).toBe(0xd7);
    for (const text of texts) {
      expect(/\p{Script=Cyrillic}/u.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });

  it('the label attribute of an option or optgroup is page text: it is collected and would fail the Ukrainian check', () => {
    // The page has no select any more (the size control is a radiogroup), so the test builds its own select element inside a
    // mounted page: the collector must still read the label attribute of option and optgroup.
    const root = mountFixture(WIN_PUZZLE);
    const select = document.createElement('select');
    root.appendChild(select);
    const option = document.createElement('option');
    option.textContent = 'Поле';
    select.appendChild(option);
    // a Latin label on an option would be shown by a browser instead of the option text (NFR-5)
    option.setAttribute('label', 'Size four');
    const group = document.createElement('optgroup');
    group.setAttribute('label', 'Sizes');
    select.appendChild(group);
    const texts = collectPageText(root);
    expect(texts).toContain('Size four');
    expect(texts).toContain('Sizes');
    expect(texts.some((t) => /[A-Za-z]/.test(t))).toBe(true);
    // and the page as mounted carries no such attribute and no option at all
    const fresh = mountFixture(WIN_PUZZLE);
    expect(fresh.querySelectorAll('option[label], optgroup[label]')).toHaveLength(0);
    expect(fresh.querySelectorAll('option, select')).toHaveLength(0);
  });

  it('the button labels are exactly the two Ukrainian labels of the DOM contract', () => {
    const root = mountFixture(WIN_PUZZLE);
    expect(q(root, '[data-action="hint"]').textContent.trim()).toBe(HINT_LABEL);
    expect(q(root, '[data-action="new"]').textContent.trim()).toBe(NEW_LABEL);
  });

  it('Static page text with the real generator (seed 42): the digits in the cells are puzzle content, not collected', () => {
    const root = mountPage({ seedSource: () => 42 });
    const cellTexts = Array.from(root.querySelectorAll('[data-cell]')).map((c) => c.textContent);
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
    expect(text).toBe(`Вітаємо, головоломку розв${String.fromCodePoint(0x2bc)}язано!`);
    expect(/\p{Script=Cyrillic}/u.test(text)).toBe(true);
    expect(/[A-Za-z]/.test(text)).toBe(false);
  });
});
