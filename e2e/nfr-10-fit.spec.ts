// @trace NFR-10
import { expect, test } from '@playwright/test';
import { openPage, sel, showHint, solveByHints } from './helpers';

// NFR-10 (sampled): one viewport, 375x812, at 6x6, in three states (default, hint, win). Not continuum coverage;
// the stricter instrument is a 1 px height sweep of the same states (G2).
test.use({ viewport: { width: 375, height: 812 } });

interface Layout {
  scrollHeight: number;
  innerHeight: number;
  boardBottom: number;
  buttonsBottom: number;
  messagesBottom: number;
  buttonsTop: number;
}

async function layout(page: import('@playwright/test').Page): Promise<Layout> {
  return page.evaluate((s) => {
    const bottom = (q: string): number => document.querySelector(q)?.getBoundingClientRect().bottom ?? Number.NaN;
    return {
      scrollHeight: document.scrollingElement?.scrollHeight ?? Number.NaN,
      innerHeight: window.innerHeight,
      boardBottom: bottom(s.board),
      buttonsBottom: bottom(s.buttons),
      messagesBottom: bottom(s.messages),
      buttonsTop: document.querySelector(s.buttons)?.getBoundingClientRect().top ?? Number.NaN,
    };
  }, sel);
}

function expectFits(l: Layout, state: string): void {
  expect(l.scrollHeight, `${state}: page scroll height ${l.scrollHeight} > viewport ${l.innerHeight}`).toBeLessThanOrEqual(l.innerHeight);
  for (const [part, b] of [['board', l.boardBottom], ['buttons', l.buttonsBottom], ['message area', l.messagesBottom]] as const) {
    expect(b, `${state}: ${part} ends at ${b} px, below the 812 px screen`).toBeLessThanOrEqual(l.innerHeight);
  }
}

test('NFR-10 sampled 375x812 at 6x6: board, buttons and messages fit without vertical scroll; buttons hold still', async ({ page }) => {
  await openPage(page);
  await expect(page.locator(`${sel.board}[data-size="6"]`)).toBeVisible();

  const idle = await layout(page);
  expectFits(idle, 'default');

  await showHint(page);
  const hinted = await layout(page);
  expectFits(hinted, 'hint');
  expect(Math.abs(hinted.buttonsTop - idle.buttonsTop), `buttons moved ${hinted.buttonsTop - idle.buttonsTop} px when the hint appeared`).toBeLessThanOrEqual(0.5);

  await solveByHints(page);
  const won = await layout(page);
  expectFits(won, 'win');
  // Decision 23 accepts a 5-7 px shift of the buttons between play and win.
  expect(Math.abs(won.buttonsTop - idle.buttonsTop), `buttons moved ${won.buttonsTop - idle.buttonsTop} px on win`).toBeLessThanOrEqual(7);
});
