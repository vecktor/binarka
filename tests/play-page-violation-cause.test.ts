// Play page: the cause marker (FR-120, A-58). One test per scenario of the ADDED requirement «Cause marker» of
// openspec/changes/add-violation-cause/specs/play-page/spec.md (title = scenario name; a table scenario has one test per row). Written FIRST
// (red, tasks.md 3.3 (a)): the page sets no class `cell-cause` and no cause suffix yet, so every scenario whose GIVEN needs a marker fails on its
// premise assertion ("(3,3) carries cell-cause"), which is what keeps the "no cell has cell-cause" THEN lines from passing vacuously.
//
// GUARDS (green on today's page by design; docs/qa/add-violation-cause/red-run.txt section B): «P5, a violation that is on the board at mount
// carries no marker» (both runs: no press, so no marker, today and after the port).
//
// The marker is judged against the engine's rule checker (`findViolations`), on the CHECKER's cells (`v.cells`), never on `checkerCells` of the
// helpers, which widens a count violation to the whole line (the page's highlight set, which A-58 says is NOT the cause set).
// Exact texts are literals; this file never imports src/ui/strings.ts. Coordinates are 1-based (data-row / data-col).
//
// @trace FR-120
// @trace FR-70
// @trace FR-64
// @trace FR-119
import { describe, expect, it } from 'vitest';
import { countSolutions, findViolations, generate } from '../src/engine/index';
import type { Cell, Grid } from '../src/engine/index';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  BROKEN_SENTENCE,
  DIRTY_GIVENS,
  HINT_BREAKS,
  PAIR_ROW,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  boardSize,
  cellEl,
  cellLabel,
  cellText,
  clickCell,
  confirmNo,
  confirmYes,
  dialogIsOpen,
  expectedCellLabel,
  fillFrom,
  generatorBySize,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  markLevel,
  markSize,
  mountFixture,
  mountPage,
  mountThenSelect,
  openSettings,
  openSheet,
  pressHint,
  pressLanguage,
  pressNew,
  pressReset,
  pressStart,
  pressTheme,
  q,
  readBoard,
  rulesPanel,
  seedQueue,
  sheetCloseButton,
  snapshot,
  solutionGrid,
  startNewPuzzle,
  violationCells,
  winMessage,
  chooseLevel,
  resetBoard,
  selectSize,
} from './helpers/play-page';

installPageLifecycle();

const CAUSE_UK = ', спричиняє порушення';

/** The cells (1-based [row, col], row-major) that carry the class `cell-cause`. */
function causeCells(root: ParentNode): [number, number][] {
  return allCells(root)
    .filter((el) => el.classList.contains('cell-cause'))
    .map((el): [number, number] => [Number(el.getAttribute('data-row')), Number(el.getAttribute('data-col'))]);
}

/** Every cell's text, row-major. */
const texts = (root: ParentNode): string[] => allCells(root).map((el) => el.textContent);

/** True when the 1-based cell X is among the `cells` of a violation that the engine checker reports on `board` (FR-120, A-58). */
function checkerCountsCell(board: Grid, row: number, col: number): boolean {
  return findViolations(board).some((v) => v.cells.some(([r, c]) => r === row - 1 && c === col - 1));
}

/** Click (2,1), (2,2) and (2,3) once each on a blank 6x6 board: three 0s side by side; (2,3) is the cause (the board of P1). */
function makeP1(root: ParentNode): void {
  clickCell(root, 2, 1);
  clickCell(root, 2, 2);
  clickCell(root, 2, 3);
  expect(violationCells(root), 'premise: the three 0s of row 2 are highlighted').toEqual([[2, 1], [2, 2], [2, 3]]);
}

/** PAIR_ROW (givens 0 at (3,1) and (3,2)) after one click on (3,3): the board of «A given in the same violation is never marked». */
function mountGivenViolation(options: Parameters<typeof mountPage>[0] = {}): HTMLElement {
  const root = mountPage({ seedSource: seedQueue([1, 2, 3, 4]).source, generate: generatorBySize({ 6: PAIR_ROW, 4: BLANK_4, 8: BLANK_8 }), ...options });
  clickCell(root, 3, 3);
  expect(violationCells(root), 'premise: the run of 0s in row 3 is highlighted').toEqual([[3, 1], [3, 2], [3, 3]]);
  expect(causeCells(root), 'premise: (3,3) carries cell-cause').toEqual([[3, 3]]);
  return root;
}

// ---------------------------------------------------------------------------------------------------------
// A capture value (FR-119) built here with the engine: tests/helpers/play-page.ts has no capture-value helper. The base is generate(6, 5, 1)
// (as in tests/play-page-capture-board.test.ts): unique givens, row 3 columns 1 to 3 free of givens.
// ---------------------------------------------------------------------------------------------------------

const CAPTURE_KEY = '__binarkaCaptureBoard';

interface CaptureValue {
  size: number;
  level: number;
  givens: Grid;
  entries: Grid;
}

/** The valid 6x6 capture value whose only entries are three 0s at row 3 columns 1 to 3 (three equal digits side by side). */
function captureWithRun(): CaptureValue {
  const puzzle = generate(6, 5, 1);
  const givens: Grid = puzzle.givens.map((row) => [...row]);
  expect(countSolutions(givens), 'premise: the capture givens have one solution').toBe(1);
  expect(givens[2]?.slice(0, 3), 'premise: no given in row 3, columns 1 to 3').toEqual([null, null, null]);
  const entries: Grid = givens.map((row, r) => row.map((_cell, c): Cell => (r === 2 && c < 3 ? 0 : null)));
  return { size: 6, level: 1, givens, entries };
}

function mountCapture(value: CaptureValue): HTMLElement {
  Reflect.set(window, CAPTURE_KEY, value);
  try {
    return mountPage({ seedSource: seedQueue([7]).source, generate: generatorBySize({ 6: PAIR_ROW }) });
  } finally {
    Reflect.deleteProperty(window, CAPTURE_KEY);
  }
}

// ---------------------------------------------------------------------------------------------------------
// Cause marker
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-120 Cause marker', () => {
  it('P1, three equal digits side by side: the pressed cell is marked', () => {
    const root = mountFixture(BLANK);
    expect(causeCells(root), 'no cell carries cell-cause at mount').toEqual([]);
    clickCell(root, 2, 1);
    expect([violationCells(root), causeCells(root)], 'after the first click').toEqual([[], []]);
    clickCell(root, 2, 2);
    expect([violationCells(root), causeCells(root)], 'after the second click').toEqual([[], []]);
    const elementsBefore = root.querySelectorAll('*').length;

    clickCell(root, 2, 3);

    expect(violationCells(root)).toEqual([[2, 1], [2, 2], [2, 3]]);
    for (const [r, c] of [[2, 1], [2, 2], [2, 3]] as const) expect(cellEl(root, r, c).getAttribute('aria-invalid'), `aria-invalid on ${r},${c}`).toBe('true');
    expect(causeCells(root), 'exactly one cell, (2,3), has cell-cause').toEqual([[2, 3]]);
    expect(root.querySelectorAll('[aria-describedby]'), 'no element has aria-describedby').toHaveLength(0);
    expect(root.querySelectorAll('*').length, 'the number of elements under the root is unchanged by the third click').toBe(elementsBefore);
  });

  it('P2, too many of one digit: the cell that holds the excess digit is marked', () => {
    const root = mountFixture(BLANK);
    clickCell(root, 1, 1, 2);
    clickCell(root, 1, 2, 2);
    clickCell(root, 1, 3, 1);
    clickCell(root, 1, 4, 2);
    expect(readBoard(root)[0], 'premise: row 1 reads 1 1 0 1 _ _').toEqual([1, 1, 0, 1, null, null]);
    expect([violationCells(root), causeCells(root)], 'premise: no violation and no marker').toEqual([[], []]);

    clickCell(root, 1, 5, 2);

    expect(readBoard(root)[0], 'row 1 holds four 1s').toEqual([1, 1, 0, 1, 1, null]);
    expect(violationCells(root), 'the whole row is highlighted (FR-36)').toEqual([1, 2, 3, 4, 5, 6].map((c) => [1, c]));
    for (let c = 1; c <= 6; c++) expect(cellEl(root, 1, c).getAttribute('aria-invalid'), `aria-invalid on 1,${c}`).toBe('true');
    expect(causeCells(root), 'exactly one cell, (1,5), has cell-cause; the other 1s and the 0s do not').toEqual([[1, 5]]);
  });

  it('P3, a correct digit put into an already broken line is not marked', () => {
    const root = mountFixture(BLANK);
    for (const [c, times] of [[1, 2], [2, 2], [3, 1], [4, 2], [5, 2]] as const) clickCell(root, 1, c, times);
    expect(causeCells(root), 'premise: the board of P2, (1,5) has cell-cause').toEqual([[1, 5]]);

    clickCell(root, 1, 6);

    expect(readBoard(root)[0]).toEqual([1, 1, 0, 1, 1, 0]);
    expect(violationCells(root), 'four 1s remain: the whole row stays highlighted').toEqual([1, 2, 3, 4, 5, 6].map((c) => [1, c]));
    expect(checkerCountsCell(readBoard(root), 1, 6), 'premise: the new 0 is not among the checker cells').toBe(false);
    expect(causeCells(root), 'no cell has cell-cause').toEqual([]);
    expect(cellLabel(root, 1, 5).endsWith(CAUSE_UK), 'the label of (1,5) no longer ends with the cause suffix').toBe(false);
    expect(cellLabel(root, 1, 5)).toBe('Рядок 1, стовпець 5, 1');
  });

  it('P4, adding to the excess marks the added cell', () => {
    const root = mountFixture(BLANK);
    for (const [c, times] of [[1, 2], [2, 2], [3, 1], [4, 2], [5, 2], [6, 1]] as const) clickCell(root, 1, c, times);
    expect(readBoard(root)[0], 'premise: the board of P3').toEqual([1, 1, 0, 1, 1, 0]);
    expect(causeCells(root), 'premise: no cell has cell-cause').toEqual([]);

    clickCell(root, 1, 6);

    expect(readBoard(root)[0], 'five 1s, three of them side by side at (1,4), (1,5), (1,6)').toEqual([1, 1, 0, 1, 1, 1]);
    expect(causeCells(root), 'exactly one cell, (1,6), has cell-cause').toEqual([[1, 6]]);
    expect(cellEl(root, 1, 6).classList.contains('cell-violation')).toBe(true);
  });

  it('Identical lines: the pressed cell of the second line is marked', () => {
    const root = mountThenSelect(BLANK_4);
    expect(boardSize(root)).toBe(4);
    for (const [r, c, times] of [[1, 1, 1], [1, 2, 2], [1, 3, 2], [1, 4, 1], [2, 1, 1], [2, 2, 2], [2, 3, 2]] as const) clickCell(root, r, c, times);
    expect(readBoard(root).slice(0, 2), 'premise: rows 1 and 2 read 0 1 1 0 and 0 1 1 _').toEqual([[0, 1, 1, 0], [0, 1, 1, null]]);
    expect([violationCells(root), causeCells(root)], 'premise: no violation and no marker').toEqual([[], []]);

    clickCell(root, 2, 4);

    expect(violationCells(root), 'every cell of rows 1 and 2').toEqual([1, 2].flatMap((r) => [1, 2, 3, 4].map((c) => [r, c])));
    expect(causeCells(root), 'exactly one cell, (2,4), has cell-cause').toEqual([[2, 4]]);
  });

  // GUARD (green on today's page: no press happened, so no marker exists today or after the port).
  it('P5, a violation that is on the board at mount carries no marker', () => {
    const root = mountFixture(DIRTY_GIVENS);
    expect(violationCells(root)).toEqual([[1, 1], [1, 2], [1, 3]]);
    for (let c = 1; c <= 3; c++) expect(cellEl(root, 1, c).getAttribute('aria-invalid')).toBe('true');
    expect(causeCells(root), 'no marker at mount').toEqual([]);
    clickCell(root, 1, 1); // a given: changes nothing
    expect(causeCells(root), 'after a click on a given cell').toEqual([]);
    clickCell(root, 4, 4);
    expect(checkerCountsCell(readBoard(root), 4, 4), 'premise: the 0 at (4,4) breaks no rule').toBe(false);
    expect(causeCells(root), 'after a click on a non-given cell that breaks no rule').toEqual([]);

    // the capture run (FR-119)
    const value = captureWithRun();
    const capture = mountCapture(value);
    expect(readBoard(capture)[2]?.slice(0, 3), 'premise: the capture board was shown').toEqual([0, 0, 0]);
    expect(violationCells(capture)).toEqual([[3, 1], [3, 2], [3, 3]]);
    for (let c = 1; c <= 3; c++) expect(cellEl(capture, 3, c).getAttribute('aria-invalid')).toBe('true');
    expect(causeCells(capture), 'no marker on a capture board at mount').toEqual([]);
  });

  it('P6, a hint fill that breaks a rule marks the hinted cell', () => {
    const root = mountFixture(HINT_BREAKS);
    pressHint(root);
    expect(cellText(root, 1, 3), 'premise: the hint wrote 0 at (1,3)').toBe('0');
    const cell = cellEl(root, 1, 3);
    expect(['cell-hinted', 'cell-violation', 'cell-cause'].map((cls) => cell.classList.contains(cls)), '(1,3) is hinted, violating and the cause').toEqual([true, true, true]);
    expect(hintedCells(root), 'the only hinted cell').toEqual([[1, 3]]);
    expect(causeCells(root), 'the only cause cell').toEqual([[1, 3]]);
    for (const [r, c] of [[2, 3], [3, 3]] as const) {
      expect(cellEl(root, r, c).classList.contains('cell-violation'), `the given ${r},${c} is in the violation`).toBe(true);
      expect(cellEl(root, r, c).getAttribute('aria-invalid')).toBe('true');
      expect(cellEl(root, r, c).classList.contains('cell-cause'), `the given ${r},${c} has no cell-cause`).toBe(false);
    }
    expect(cellLabel(root, 1, 3)).toBe('Рядок 1, стовпець 3, 0, підказка, спричиняє порушення');
  });

  it('P6, the next hint refuses and the marker stays', () => {
    const root = mountFixture(HINT_BREAKS);
    pressHint(root);
    expect(causeCells(root), 'premise: (1,3) carries cell-cause after the first hint').toEqual([[1, 3]]);
    const before = texts(root);

    pressHint(root);

    expect(hintMessage(root), 'the sentence for a board that breaks a rule (FR-26)').toBe(BROKEN_SENTENCE);
    expect(texts(root), 'no cell changes its text').toEqual(before);
    const cell = cellEl(root, 1, 3);
    expect(['cell-hinted', 'cell-violation', 'cell-cause'].map((cls) => cell.classList.contains(cls))).toEqual([true, true, true]);
  });

  it('P7, the marker shows the last press only', () => {
    const root = mountFixture(BLANK);
    makeP1(root);
    expect(causeCells(root), 'premise: (2,3) carries cell-cause').toEqual([[2, 3]]);

    clickCell(root, 5, 5);

    expect(checkerCountsCell(readBoard(root), 5, 5), 'premise: the 0 at (5,5) breaks no rule').toBe(false);
    expect(causeCells(root), 'no cell has cell-cause').toEqual([]);
    expect(violationCells(root), 'the run of row 2 is still highlighted').toEqual([[2, 1], [2, 2], [2, 3]]);
    for (let c = 1; c <= 3; c++) expect(cellEl(root, 2, c).getAttribute('aria-invalid')).toBe('true');
    expect(cellText(root, 2, 3)).toBe('0');
    expect(cellLabel(root, 2, 3), 'the suffix went with the marker').toBe('Рядок 2, стовпець 3, 0');
  });

  it('P7, a later press that breaks a rule moves the marker', () => {
    const root = mountFixture(BLANK);
    makeP1(root);
    expect(causeCells(root), 'premise: (2,3) carries cell-cause').toEqual([[2, 3]]);

    clickCell(root, 4, 1);
    expect(causeCells(root), 'after (4,1): the first click already took the marker from (2,3)').toEqual([]);
    clickCell(root, 4, 2);
    expect(causeCells(root), 'after (4,2)').toEqual([]);
    clickCell(root, 4, 3);

    expect(causeCells(root), 'exactly one cell, (4,3), and not (2,3)').toEqual([[4, 3]]);
    expect(violationCells(root), 'the cells of both runs').toEqual([[2, 1], [2, 2], [2, 3], [4, 1], [4, 2], [4, 3]]);
  });

  it('P7, pressing the marked cell again removes the marker', () => {
    const root = mountFixture(BLANK);
    makeP1(root);
    expect(causeCells(root), 'premise: (2,3) carries cell-cause').toEqual([[2, 3]]);

    clickCell(root, 2, 3);

    expect(cellText(root, 2, 3)).toBe('1');
    expect(causeCells(root), 'no cell has cell-cause').toEqual([]);
    expect(violationCells(root), 'the run is broken').toEqual([]);
  });

  it('P8, a solved board carries no marker', () => {
    // WIN_PUZZLE filled from its solution except the non-given (4,1), whose digit is 1: the first click puts a wrong 0 there, a fourth 0 in row 4
    // (the count rule, the checker counts the 0s), so X is the cause on the way; the second click puts the 1 and the board is solved.
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    expect(cellText(root, 4, 1), 'premise: X = (4,1) is the one empty cell').toBe('');
    expect(WIN_PUZZLE.solution[3]?.[0], 'premise: its solution digit is 1').toBe(1);
    clickCell(root, 4, 1);
    expect(checkerCountsCell(readBoard(root), 4, 1), 'premise: the wrong 0 at X breaks a rule').toBe(true);
    expect(causeCells(root), 'premise: on the way, X is the cause').toEqual([[4, 1]]);

    clickCell(root, 4, 1);

    expect(winMessage(root), 'the win message appears').toBe(WIN_MESSAGE);
    expect(violationCells(root), 'no cell has cell-violation').toEqual([]);
    expect(causeCells(root), 'no cell has cell-cause').toEqual([]);

    // the fixture of «Hinted cell marker» (a hint that wins): the hint fills X, the win shows, one hinted cell and no cause
    const hinted = mountFixture(WIN_PUZZLE);
    fillFrom(hinted, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    pressHint(hinted);
    expect(winMessage(hinted)).toBe(WIN_MESSAGE);
    expect(hintedCells(hinted)).toEqual([[4, 1]]);
    expect(causeCells(hinted)).toEqual([]);
  });

  it('A given in the same violation is never marked', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 3, 3);
    expect(violationCells(root)).toEqual([[3, 1], [3, 2], [3, 3]]);
    expect(causeCells(root), 'only (3,3) has cell-cause').toEqual([[3, 3]]);
    for (const c of [1, 2]) {
      const given = cellEl(root, 3, c);
      expect([given.getAttribute('data-given'), given.getAttribute('aria-disabled'), given.classList.contains('cell-cause')], `the given 3,${c}`).toEqual(['true', 'true', false]);
    }
  });

  describe('Later board changes remove the marker', () => {
    const rows: { action: string; run: (root: HTMLElement) => void }[] = [
      {
        action: 'clicks a non-given cell other than (3,3), here (5,5), which breaks no rule',
        run: (root) => {
          clickCell(root, 5, 5);
          expect(checkerCountsCell(readBoard(root), 5, 5), 'premise: (5,5) breaks no rule').toBe(false);
        },
      },
      {
        action: 'clicks (3,3) itself (the 0 becomes 1, which breaks no rule)',
        run: (root) => {
          clickCell(root, 3, 3);
          expect(cellText(root, 3, 3)).toBe('1');
          expect(violationCells(root), 'premise: the 1 breaks no rule').toEqual([]);
        },
      },
      { action: 'presses «Нова головоломка» and then «Так, почати»', run: (root) => { startNewPuzzle(root); } },
      {
        action: 'changes the size to 4 by a choice (mark, «Почати», «Так, почати»)',
        run: (root) => {
          selectSize(root, 4);
          expect(boardSize(root)).toBe(4);
        },
      },
      {
        action: 'changes the size to 8 by a choice (mark, «Почати», «Так, почати»)',
        run: (root) => {
          selectSize(root, 8);
          expect(boardSize(root)).toBe(8);
        },
      },
      { action: 'changes the level to «Задачка» by a choice (mark, «Почати», «Так, почати»)', run: (root) => { chooseLevel(root, 2); } },
      {
        action: 'presses «Почати» with the marked choice equal to the board shown, and then «Так, почати»',
        run: (root) => {
          openSheet(root);
          pressStart(root);
          expect(dialogIsOpen(root), 'premise: the board has entries, so «Почати» asks').toBe(true);
          confirmYes(root);
        },
      },
      { action: 'presses «Скинути» and then «Так, почати»', run: (root) => { resetBoard(root); } },
    ];
    it.each(rows)('$action', ({ run }) => {
      const root = mountGivenViolation();
      run(root);
      expect(causeCells(root), 'no cell of the board shown has cell-cause').toEqual([]);
      for (const cell of allCells(root)) expect(cell.getAttribute('aria-label') ?? '', 'no label holds the cause word').not.toContain('спричиняє');
    });
  });

  it('A hint cannot follow a marker', () => {
    const root = mountGivenViolation();
    const before = texts(root);
    pressHint(root);
    expect(hintMessage(root), 'the hint refuses a board that breaks a rule (FR-26)').toBe(BROKEN_SENTENCE);
    expect(texts(root), 'no cell was filled').toEqual(before);
    expect(causeCells(root), '(3,3) still has cell-cause').toEqual([[3, 3]]);
  });

  describe('Actions that change no cell keep the marker', () => {
    const rows: { action: string; run: (root: HTMLElement) => void }[] = [
      {
        action: 'clicks a given cell, (3,1) (once, and again twice)',
        run: (root) => {
          clickCell(root, 3, 1);
          clickCell(root, 3, 1, 2);
        },
      },
      { action: 'presses «Підказка» (the hint refuses, FR-26)', run: (root) => { pressHint(root); } },
      {
        action: 'clicks [data-action="rules"] and then the close button «Зрозуміло»',
        run: (root) => {
          q(root, '[data-action="rules"]').click();
          const close = q(rulesPanel(root), '.rules-close');
          expect(close.textContent.trim()).toBe('Зрозуміло');
          close.click();
        },
      },
      {
        action: 'opens the setup sheet through the stubbed showPopover(), then clicks [data-action="setup-close"]',
        run: (root) => {
          openSheet(root);
          sheetCloseButton(root).click();
        },
      },
      {
        action: 'opens the setup sheet, presses «Поле 8×8» and «Задачка» (marking presses), then clicks [data-action="setup-close"]',
        run: (root) => {
          openSheet(root);
          markSize(root, 8);
          markLevel(root, 2);
          sheetCloseButton(root).click();
        },
      },
      {
        action: 'opens the setup sheet, presses the already selected «Поле 6×6» (it only marks), then clicks [data-action="setup-close"]',
        run: (root) => {
          openSheet(root);
          markSize(root, 6);
          sheetCloseButton(root).click();
        },
      },
      {
        action: 'opens the settings panel through the stubbed showPopover() and presses a theme option',
        run: (root) => {
          openSettings(root);
          pressTheme(root, 'dark');
        },
      },
      {
        action: 'opens the settings panel and presses the language option that is not shown',
        run: (root) => {
          openSettings(root);
          pressLanguage(root, 'en');
        },
      },
      {
        action: 'presses «Нова головоломка» and then «Скасувати»',
        run: (root) => {
          pressNew(root);
          confirmNo(root);
        },
      },
      {
        action: 'presses «Скинути» and then «Скасувати»',
        run: (root) => {
          pressReset(root);
          confirmNo(root);
        },
      },
    ];
    it.each(rows)('$action', ({ run }) => {
      const root = mountGivenViolation();
      const textsBefore = texts(root);
      const violationsBefore = violationCells(root);
      const digit = cellText(root, 3, 3);
      run(root);
      expect(causeCells(root), 'exactly one cell, (3,3), has cell-cause').toEqual([[3, 3]]);
      expect(cellEl(root, 3, 3).classList.contains('cell-violation'), '(3,3) still has cell-violation').toBe(true);
      expect(cellText(root, 3, 3), '(3,3) shows the digit it showed').toBe(digit);
      expect(violationCells(root), 'the set of violating cells is unchanged').toEqual(violationsBefore);
      expect(texts(root), 'every cell shows the text it showed before').toEqual(textsBefore);
    });
  });

  it('A confirmation removes the marker when it is performed, not when it is requested', () => {
    const root = mountGivenViolation();
    pressNew(root);
    expect(dialogIsOpen(root), 'premise: the dialog is open').toBe(true);
    expect(causeCells(root), 'while the dialog is open (3,3) still has cell-cause').toEqual([[3, 3]]);
    expect(cellLabel(root, 3, 3).endsWith(CAUSE_UK), 'and its label still ends with the cause suffix').toBe(true);
    confirmNo(root);
    expect(causeCells(root), 'after «Скасувати»').toEqual([[3, 3]]);

    const fresh = mountGivenViolation();
    pressNew(fresh);
    confirmYes(fresh);
    expect(causeCells(fresh), 'after «Так, почати» the new board has no marker').toEqual([]);
  });

  it('A failed generation keeps the marker', () => {
    // the injected generator has a fixture for 6 only: a request for 8 throws, and the page keeps the board (FR-88)
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: PAIR_ROW }) });
    clickCell(root, 3, 3);
    expect(causeCells(root), 'premise: (3,3) carries cell-cause').toEqual([[3, 3]]);
    const before = texts(root);

    markSize(root, 8);
    pressStart(root);
    expect(dialogIsOpen(root), 'the board has entries, so «Почати» asks').toBe(true);
    confirmYes(root);

    expect(q(root, '[data-board]').getAttribute('data-size'), 'the board stays 6x6').toBe('6');
    expect(texts(root), 'the same cell texts').toEqual(before);
    expect(causeCells(root), '(3,3) still has cell-cause').toEqual([[3, 3]]);
  });

  it('The marker follows a language switch', () => {
    const root = mountFixture(BLANK);
    makeP1(root);
    expect(causeCells(root), 'premise: (2,3) carries cell-cause').toEqual([[2, 3]]);
    const classesBefore = snapshot(root);
    openSettings(root);

    pressLanguage(root, 'en');

    expect(causeCells(root), 'after "English" (2,3) still has cell-cause').toEqual([[2, 3]]);
    expect(cellLabel(root, 2, 3)).toBe('Row 2, column 3, 0, causes a violation');
    expect(cellLabel(root, 2, 1)).toBe('Row 2, column 1, 0');
    expect(cellLabel(root, 2, 2)).toBe('Row 2, column 2, 0');

    pressLanguage(root, 'uk');

    expect(cellLabel(root, 2, 3)).toBe('Рядок 2, стовпець 3, 0, спричиняє порушення');
    expect(snapshot(root), 'the class lists of all cells are those before the first switch').toEqual(classesBefore);
  });

  it('Two mounts are independent', () => {
    const first = mountFixture(BLANK);
    makeP1(first);
    expect(causeCells(first), 'premise: the marker is made on the first page').toEqual([[2, 3]]);
    const second = mountFixture(BLANK);
    expect(causeCells(second), 'no cell of the second page has cell-cause before its own press').toEqual([]);

    clickCell(second, 5, 1);
    clickCell(second, 5, 2);
    clickCell(second, 5, 3);

    expect(causeCells(second), 'exactly one cell of the second page').toEqual([[5, 3]]);
    expect(causeCells(first), 'the marker of the first page is where it was').toEqual([[2, 3]]);
  });

  describe('The marker is the checker’s answer after every press (oracle)', () => {
    const sizes = [
      { n: 4, puzzle: BLANK_4 },
      { n: 6, puzzle: BLANK },
      { n: 8, puzzle: BLANK_8 },
    ];
    it.each(sizes)('N = $n: three passes over every cell, the marker equals {X} exactly when the checker counts X', ({ n, puzzle }) => {
      const root = n === 6 ? mountFixture(puzzle) : mountThenSelect(puzzle);
      expect(boardSize(root)).toBe(n);
      const order: [number, number][] = [];
      for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) order.push([r, c]);
      const passes = [order, [...order].reverse(), order];
      const mismatches: string[] = [];
      let withMarker = 0;
      let withoutMarker = 0;
      passes.forEach((pass, p) => {
        for (const [r, c] of pass) {
          cellEl(root, r, c).click();
          // one read of the DOM per press (row-major cells): the board for the checker, the marker set and the labels
          const cells = allCells(root);
          const board: Grid = Array.from({ length: n }, (_row, i) =>
            cells.slice(i * n, i * n + n).map((el): Cell => (el.textContent === '' ? null : el.textContent === '0' ? 0 : 1)),
          );
          const counted = checkerCountsCell(board, r, c);
          if (counted) withMarker += 1;
          else withoutMarker += 1;
          const want = counted ? [[r, c]] : [];
          const have = cells
            .filter((el) => el.classList.contains('cell-cause'))
            .map((el) => [Number(el.getAttribute('data-row')), Number(el.getAttribute('data-col'))]);
          const where = `pass ${p + 1}, press ${r},${c}`;
          if (JSON.stringify(have) !== JSON.stringify(want)) mismatches.push(`${where}: cell-cause on ${JSON.stringify(have)}, the checker says ${JSON.stringify(want)}`);
          for (const el of cells) {
            const label = el.getAttribute('aria-label') ?? '';
            const isCause = el.classList.contains('cell-cause');
            if (isCause) {
              const state = [el.classList.contains('cell-violation'), el.getAttribute('aria-invalid'), el.getAttribute('data-given'), /^[01]$/.test(el.textContent)];
              if (JSON.stringify(state) !== JSON.stringify([true, 'true', 'false', true])) mismatches.push(`${where}: a cause cell has the state ${JSON.stringify(state)}`);
            }
            if (label.includes(CAUSE_UK) !== isCause) mismatches.push(`${where}: the label «${label}» and the class disagree`);
            const expected = expectedCellLabel(el);
            if (label !== expected) mismatches.push(`${where}: the label «${label}» is not the FR-70 label «${expected}»`);
          }
        }
      });
      expect(allCells(root).every((el) => el.textContent === ''), 'premise: three passes bring every cell back to empty').toBe(true);
      expect(withMarker, 'not vacuous: at least one press with a marker').toBeGreaterThan(0);
      expect(withoutMarker, 'not vacuous: at least one press without a marker').toBeGreaterThan(0);
      expect(mismatches.slice(0, 5), `${mismatches.length} disagreements with the checker (the first five shown)`).toEqual([]);
    }, 30_000);
  });
});
