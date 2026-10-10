// @trace NFR-10
import { expect, test } from '@playwright/test';
import { generate, hint } from '../src/engine/index';
import { expectLanguage, markLevel, openPage, sel, seededRandom, showHint, solveByHints } from './helpers';

// NFR-10 (sampled): one viewport, 375x812, at 6x6, in three states (default, hint, win). Not continuum coverage;
// the stricter instrument is a 1 px height sweep of the same states (G2).
// add-english-version (NFR-10, FR-108; delta «English mode keeps the phone page on one screen»): the same three states in English at the same viewport,
// the Ukrainian test above unchanged. The English hint state shows the longest English hint sentence, a line-balance fill of about 140 characters, on a
// board that a search step finds (below) and the test asserts to be a balance fill. Coverage is `sampled` (one viewport, three states), never continuum.
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

// ---------------------------------------------------------------------------------------------------------
// add-english-version: English mode
// ---------------------------------------------------------------------------------------------------------

const EN_LEVELS = ['Warm-up', 'Teaser', 'Puzzler', 'Brain-twister'];

interface Found {
  /** the start of the seeded Math.random (`openPage`'s second argument) */
  start: number;
  /** the level (2 to 4) the test chooses */
  level: number;
  /** the seed the page takes for that choice (the second draw) */
  seed: number;
  givens: string[];
}

/**
 * The search step of the delta: find a start of the seeded Math.random and a level at 6x6 whose FIRST hint at the page's ceiling 4 is a line-balance
 * fill. It replays the page's seeding (`seededRandom` is the arithmetic of the init script in `openPage`; the page draws its first seed at the mount,
 * level 1, and its second seed at the choice of the level, `src/ui/seed.ts`) and asks the engine, so the board is known before the page is opened.
 * The first level cannot qualify (it has no balance step); levels 2 to 4 are tried for each start.
 */
function searchBalanceBoard(): Found {
  for (let start = 1; start <= 400; start++) {
    const random = seededRandom(start);
    const first = Math.floor(random() * 2147483648);
    let seed = Math.floor(random() * 2147483648);
    while (seed === first) seed = Math.floor(random() * 2147483648);
    for (const level of [2, 3, 4]) {
      try {
        const puzzle = generate(6, seed, level);
        const h = hint(puzzle.givens, 4);
        if (h.kind === 'fill' && h.rule === 'balance') {
          return { start, level, seed, givens: puzzle.givens.flat().map((v) => (v === null ? '' : String(v))) };
        }
      } catch {
        // a run-out of the generator: the page would retry with the next seed, so this start is no candidate
      }
    }
  }
  throw new Error('the search found no start below 400 whose first hint is a line-balance fill at level 2 to 4 (6x6)');
}

test('NFR-10 English sampled 375x812 at 6x6: the default and the win states fit; buttons hold still', async ({ page }) => {
  await openPage(page, 1, { language: 'en' });
  await expectLanguage(page, 'en');
  await expect(page.locator(`${sel.board}[data-size="6"]`)).toBeVisible();

  const idle = await layout(page);
  expectFits(idle, 'English default');

  await solveByHints(page);
  await expect(page.locator(sel.winMessage)).toHaveText('Congratulations, puzzle solved!');
  const won = await layout(page);
  expectFits(won, 'English win');
  expect(Math.abs(won.buttonsTop - idle.buttonsTop), `buttons moved ${won.buttonsTop - idle.buttonsTop} px on win`).toBeLessThanOrEqual(7);
});

test('NFR-10 English sampled 375x812 at 6x6: the hint state with the longest English sentence (a line-balance fill) fits; buttons hold still', async ({ page }) => {
  const found = searchBalanceBoard(); // asserted below on the page: the shown sentence is the English line-balance sentence

  await openPage(page, found.start, { language: 'en' });
  await expectLanguage(page, 'en');
  await markLevel(page, found.level);
  await page.locator(sel.setupStart).click();
  await expect(page.locator(sel.summary), 'the chosen level is shown in English').toContainText(EN_LEVELS[found.level - 1] ?? '?');
  await expect(page.locator(`${sel.board}[data-size="6"]`)).toBeVisible();
  const shown = await page.locator(sel.cell).evaluateAll((cells) => cells.map((c) => (c.getAttribute('data-given') === 'true' ? c.textContent : '')));
  expect(shown, 'the board on the page is the board the search found (the replay of the page seeding agrees with the page)').toEqual(found.givens);

  const idle = await layout(page);
  expectFits(idle, 'English default at the searched level');

  await page.locator(sel.hint).click();
  await expect(page.locator(sel.hintMessage)).toContainText('has room for only one more');
  const sentence = (await page.locator(sel.hintMessage).textContent()) ?? '';
  expect(sentence.length, `the line-balance sentence is the longest English one (${sentence.length} characters)`).toBeGreaterThan(120);
  const hinted = await layout(page);
  expectFits(hinted, 'English hint (line balance, about 140 characters)');
  expect(Math.abs(hinted.buttonsTop - idle.buttonsTop), `buttons moved ${hinted.buttonsTop - idle.buttonsTop} px when the hint appeared`).toBeLessThanOrEqual(0.5);
});
