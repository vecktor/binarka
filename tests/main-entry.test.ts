// The page entry point. openspec/specs/play-page/spec.md, "Mount entry point and fixtures": `src/main.ts` calls
// `mountPlayPage` with the `#app` element and no options; with no injected generator the board is the default 6x6
// (requirement "Board rendering and default size").
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
  document.title = '';
  localStorage.clear(); // add-english-version: a stored language of one test must not reach the next
  document.documentElement.removeAttribute('lang');
});

describe('@trace FR-31 src/main.ts mounts the page into #app', () => {
  it('importing src/main.ts with a #app element in the document mounts a 6x6 board into it', async () => {
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    vi.resetModules();
    await import('../src/main');
    const board = app.querySelector('[data-board]');
    expect(board, 'the board is inside #app').not.toBeNull();
    expect(board?.getAttribute('data-size')).toBe('6');
    expect(app.querySelectorAll('[data-cell]')).toHaveLength(36);
  });
});

describe('@trace FR-113 @trace FR-109 src/main.ts mounts the page in the stored language', () => {
  it('importing src/main.ts with binarka.language = en stored mounts an English page with <html lang> en', async () => {
    localStorage.setItem('binarka.language', 'en');
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    vi.resetModules();
    await import('../src/main');
    expect(app.querySelectorAll('[data-cell]'), 'the board is mounted').toHaveLength(36);
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.title).toBe('Binarka');
    expect(app.querySelector('[data-action="hint"]')?.textContent).toBe('Hint');
  });
});
