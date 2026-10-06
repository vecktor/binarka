// Play page: the Ukrainian texts of the confirmation dialog, the size control and the cell labels (NFR-5). Scenario of the delta spec
// openspec/changes/update-controls-accessibility/specs/play-page/spec.md ("Ukrainian texts of the confirmation dialog, size
// control and cell labels"). Written FIRST (red): the page has no dialog, a select instead of the radiogroup, no cell labels.
// This file NEVER imports src/ui/strings.ts: the texts are literals. The module is only read as a source file by the scan.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PAIR_ROW,
  clickCell,
  installPageLifecycle,
  mountFixture,
  pressHint,
  q,
  sizeControl,
} from './helpers/play-page';

installPageLifecycle();

const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /[A-Za-z]/;
const USER_ATTRIBUTES = ['aria-label', 'title', 'alt', 'label'];

/**
 * The texts the new controls expose: the text nodes of the size control and of the confirmation dialog, and the aria-label, title,
 * alt and label attributes of those two elements, of every cell and of all their descendants (so the group name and every cell
 * label are in). Not trimmed.
 */
function collectControlTexts(root: HTMLElement): string[] {
  const out: string[] = [];
  const containers = [q(root, '[data-control="size"]'), q(root, '[data-dialog="confirm"]')];
  const cells = Array.from(root.querySelectorAll<HTMLElement>('[data-cell]'));
  for (const container of containers) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
      const text = (n as Text).data;
      if (text.trim() !== '') out.push(text);
    }
  }
  for (const holder of [...containers, ...cells]) {
    for (const el of [holder, ...Array.from(holder.querySelectorAll('*'))]) {
      for (const name of USER_ATTRIBUTES) {
        const value = el.getAttribute(name);
        if (value !== null) out.push(value);
      }
    }
  }
  return out;
}

describe('@trace NFR-5 the new texts are Ukrainian', () => {
  it('The new texts are Ukrainian: the collection holds the group name, the three size labels, the confirmation text and both buttons', () => {
    const root = mountFixture(PAIR_ROW);
    const texts = collectControlTexts(root);
    const trimmed = texts.map((t) => t.trim());

    for (const required of [
      'Розмір поля',
      'Поле 4×4',
      'Поле 6×6',
      'Поле 8×8',
      'Почати заново? Ваші ходи на цьому полі буде втрачено.',
      'Так, почати',
      'Скасувати',
    ]) {
      expect(trimmed, `the collection contains «${required}»`).toContain(required);
    }
    // the cell labels are in the collection too (36 cells), so the Latin check below is not vacuous for them
    expect(trimmed.filter((t) => /^Рядок \d+, стовпець \d+, /.test(t)).length, 'one label per cell').toBeGreaterThanOrEqual(36);
    for (const text of texts) {
      expect(CYRILLIC.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(LATIN.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });

  it('the multiplication sign of the size labels is U+00D7, not the Latin letter x', () => {
    const root = mountFixture(PAIR_ROW);
    sizeControl(root); // a radiogroup of three radio buttons
    const labels = Array.from(q(root, '[data-control="size"]').querySelectorAll('button')).map((b) => b.textContent ?? '');
    expect(labels).toEqual(['Поле 4×4', 'Поле 6×6', 'Поле 8×8']);
    for (const label of labels) expect(label.codePointAt(6)).toBe(0xd7);
  });

  it('the cell labels stay Ukrainian after play: a digit, a given, a hint-filled cell (every label has Cyrillic and no Latin letter)', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 1, 1);
    pressHint(root);
    const labels = collectControlTexts(root);
    expect(labels).toContain('Рядок 3, стовпець 3, 1, підказка');
    expect(labels).toContain('Рядок 3, стовпець 1, 0, задано');
    expect(labels).toContain('Рядок 1, стовпець 1, 0');
    for (const text of labels) {
      expect(CYRILLIC.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(LATIN.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// Source scan of change update-page-layout, re-run: no Cyrillic outside src/ui/strings.ts (the new texts live there too)
// ---------------------------------------------------------------------------------------------------------

const UI_DIR = `${process.cwd()}/src/ui`;
const STRINGS_FILE = `${UI_DIR}/strings.ts`;
const MAIN_FILE = `${process.cwd()}/src/main.ts`;

function uiSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) out.push(...uiSources(path));
    else if (entry.endsWith('.ts') || entry.endsWith('.css')) out.push(path);
  }
  return out;
}

describe('@trace NFR-5 no Cyrillic text outside the strings module (re-run after the new texts)', () => {
  // (characterisation guard) passes against the page before this change: nothing under src/ui outside strings.ts holds Cyrillic yet.
  // It is expected GREEN from the start and must stay green once the new texts are added to strings.ts; it is not the red evidence.
  it('src/ui/*.ts, src/ui/*.css (not strings.ts) and src/main.ts hold no Cyrillic character', () => {
    const files = [...uiSources(UI_DIR).filter((f) => f !== STRINGS_FILE), MAIN_FILE];
    const names = files.map((f) => f.slice(process.cwd().length + 1)).sort();
    for (const expected of ['src/main.ts', 'src/ui/index.ts', 'src/ui/play-page.ts', 'src/ui/seed.ts', 'src/ui/style.css']) {
      expect(names, `${expected} is scanned`).toContain(expected);
    }
    const offenders = files.filter((f) => CYRILLIC.test(readFileSync(f, 'utf8'))).map((f) => f.slice(process.cwd().length + 1));
    expect(offenders, 'files with a Cyrillic character outside src/ui/strings.ts').toEqual([]);
  });

  it('src/ui/strings.ts, the single module, carries the new texts (read as source text, never imported by a test)', () => {
    const source = readFileSync(STRINGS_FILE, 'utf8');
    for (const text of [
      'Розмір поля',
      'Почати заново? Ваші ходи на цьому полі буде втрачено.',
      'Так, почати',
      'Скасувати',
      'Рядок',
      'стовпець',
      'порожньо',
      'задано',
      'підказка',
    ]) {
      expect(source, `strings.ts contains «${text}»`).toContain(text);
    }
  });
});
