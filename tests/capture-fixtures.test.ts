// The fixture boards of the design (design/v0/lib/boards.json) are valid capture values (FR-119, A-56). Scenario «The fixture boards
// are valid capture values» of openspec/changes/add-capture-board/specs/play-page/spec.md. Written FIRST (red): the file
// design/v0/lib/boards.json does not exist yet, and the page does not read window.__binarkaCaptureBoard.
//
// @trace FR-119
//
// THE SHAPE of design/v0/lib/boards.json (the implementer produces exactly this; the five keys are required, extra keys such as
// `"solved": true` on solvedBoard are tolerated):
//
//   {
//     "fixtureBoard": { "size": 6, "rows": ["g1 .  .  .  g0 .", ... six strings ...], "violations": [[3, 1], [3, 2], [3, 3]] },
//     "hintBoard":    { "size": 6, "rows": [...] },
//     "solvedBoard":  { "size": 6, "rows": [...] },
//     "eightBoard":   { "size": 8, "rows": [...] },
//     "fourBoard":    { "size": 4, "rows": [...] }
//   }
//
// - `rows` holds `size` strings; each string holds `size` tokens separated by whitespace (one or more spaces);
// - a token is `gD` (a given with digit D), `pD` (a player entry D), `hD` (the hinted entry D) or `.` (empty), D being 0 or 1;
// - `violations` is optional, 1-based [row, col] pairs, exactly the cells the design highlights;
// - the cells are the cells of design/v0/lib/boards.ts at commit 0d5491b, unchanged.
//
// The test owns the conversion to a capture value { size, level, givens, entries, hinted? }: level 1 for all fixtures; `hinted` is the
// 0-based [row, col] of the `hD` cell. The file is read INSIDE each test (never at module load), so a missing file is an assertion
// failure with a message, not a crash.
//
// The last test is red in two stages: it fails first on the missing file, and after boards.json exists it still fails until the page
// loads the capture board (task 2.2): the page would take a seed and call the generator.
import { existsSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { countSolutions, findViolations, generate, hint, isSolved } from '../src/engine/index';
import type { Cell, Grid } from '../src/engine/index';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  WIN_MESSAGE,
  boardSize,
  bySize,
  generateSpy,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  mountPage,
  readBoard,
  readGivenFlags,
  seedQueue,
  summaryLabel,
  summaryText,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

const BOARDS_PATH = `${process.cwd()}/design/v0/lib/boards.json`;
const CAPTURE_KEY = '__binarkaCaptureBoard';
const NAMES = ['fixtureBoard', 'hintBoard', 'solvedBoard', 'eightBoard', 'fourBoard'] as const;
type Name = (typeof NAMES)[number];

afterEach(() => {
  Reflect.deleteProperty(window, CAPTURE_KEY);
});

interface BoardData {
  size: number;
  rows: string[];
  violations?: [number, number][];
}
type Boards = Record<Name, BoardData>;

interface CaptureValue {
  size: number;
  level: number;
  givens: Grid;
  entries: Grid;
  hinted?: [number, number];
}

/** Read and shape-check boards.json. Always called inside a test. */
function loadBoards(): Boards {
  expect(existsSync(BOARDS_PATH), 'design/v0/lib/boards.json exists').toBe(true);
  const raw: unknown = JSON.parse(readFileSync(BOARDS_PATH, 'utf8'));
  expect(typeof raw === 'object' && raw !== null && !Array.isArray(raw), 'boards.json holds one object').toBe(true);
  const data = raw as Record<string, unknown>;
  for (const name of NAMES) {
    const board = data[name] as Partial<BoardData> | undefined;
    expect(board, `boards.json has the key ${name}`).toBeDefined();
    expect.assert(board !== undefined, `premise: ${name} exists`);
    expect(Number.isInteger(board.size), `${name}.size is an integer`).toBe(true);
    expect(Array.isArray(board.rows), `${name}.rows is an array`).toBe(true);
    expect.assert(board.size !== undefined && board.rows !== undefined, `premise: ${name} has size and rows`);
    expect(board.rows, `${name} has ${board.size} rows`).toHaveLength(board.size);
    board.rows.forEach((row, r) => {
      expect(typeof row, `${name}.rows[${r}] is a string`).toBe('string');
      expect(row.trim().split(/\s+/), `${name}.rows[${r}] has ${board.size} tokens`).toHaveLength(board.size ?? 0);
    });
  }
  return data as unknown as Boards;
}

interface Parsed {
  size: number;
  givens: Grid;
  entries: Grid;
  /** the 0-based cell of the `hD` token, when there is one */
  hinted?: [number, number];
}

function parse(board: BoardData): Parsed {
  const givens: Grid = [];
  const entries: Grid = [];
  let hinted: [number, number] | undefined;
  board.rows.forEach((row, r) => {
    const givenRow: Cell[] = [];
    const entryRow: Cell[] = [];
    row
      .trim()
      .split(/\s+/)
      .forEach((token, c) => {
        const m = /^([gph])([01])$/.exec(token);
        if (token === '.') {
          givenRow.push(null);
          entryRow.push(null);
        } else {
          expect.assert(m !== null, `${board.size}x${board.size} row ${r + 1}, token ${c + 1} "${token}" is . or gD, pD, hD`);
          const kind = m[1];
          const digit = Number(m[2]) as 0 | 1;
          givenRow.push(kind === 'g' ? digit : null);
          entryRow.push(kind === 'g' ? null : digit);
          if (kind === 'h') hinted = [r, c];
        }
      });
    givens.push(givenRow);
    entries.push(entryRow);
  });
  return hinted === undefined ? { size: board.size, givens, entries } : { size: board.size, givens, entries, hinted };
}

/** The conversion that the capture adapter will do: level 1, hinted 0-based from the hD token. */
function toCaptureValue(board: BoardData): CaptureValue {
  const p = parse(board);
  const value: CaptureValue = { size: p.size, level: 1, givens: p.givens, entries: p.entries };
  if (p.hinted !== undefined) value.hinted = p.hinted;
  return value;
}

/** givens and entries laid over each other (entries never sit on a given in a valid board; asserted by the claims below). */
function filled(p: Parsed): Grid {
  return p.givens.map((row, r) => row.map((cell, c) => cell ?? p.entries[r]?.[c] ?? null));
}

describe('@trace FR-119 the fixture boards are valid capture values', () => {
  it('boards.json exists and holds the five fixture boards in the data notation', () => {
    const boards = loadBoards();
    expect(Object.keys(boards)).toEqual(expect.arrayContaining([...NAMES]));
    expect([boards.fixtureBoard.size, boards.hintBoard.size, boards.solvedBoard.size, boards.eightBoard.size, boards.fourBoard.size]).toEqual([
      6, 6, 6, 8, 4,
    ]);
  });

  it('the givens of the three 6x6 boards are equal and have exactly one solution', () => {
    const boards = loadBoards();
    const fixture = parse(boards.fixtureBoard).givens;
    expect(parse(boards.hintBoard).givens, 'hintBoard givens equal fixtureBoard givens').toEqual(fixture);
    expect(parse(boards.solvedBoard).givens, 'solvedBoard givens equal fixtureBoard givens').toEqual(fixture);
    expect(countSolutions(fixture), 'the shared givens have exactly one solution').toBe(1);
  });

  it('the shared givens are the engine puzzle generate(6, 5, 1) (ENGINE-CHECK of review-set-14)', () => {
    const boards = loadBoards();
    expect(parse(boards.fixtureBoard).givens).toEqual(generate(6, 5, 1).givens);
  });

  it('the fixture board has exactly one violation: rule three, row 3 (1-based), cells 1 to 3', () => {
    const boards = loadBoards();
    const p = parse(boards.fixtureBoard);
    expect(findViolations(filled(p))).toEqual([{ rule: 'three', axis: 'row', index: 2, cells: [[2, 0], [2, 1], [2, 2]] }]);
    // the design highlights these cells, 1-based: [3, 1], [3, 2], [3, 3]
    expect(boards.fixtureBoard.violations).toEqual([[3, 1], [3, 2], [3, 3]]);
    // every filled cell is the solution digit except the one wrong cell [2][2] = 0 (ENGINE-CHECK)
    const solution = generate(6, 5, 1).solution;
    const wrong: [number, number, Cell][] = [];
    filled(p).forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== null && cell !== solution[r]?.[c]) wrong.push([r, c, cell]);
      });
    });
    expect(wrong).toEqual([[2, 2, 0]]);
  });

  it('on the hint board without its hinted cell the first hint fills row 3, column 3 (1-based) with 1, with the exact sentence', () => {
    const boards = loadBoards();
    const p = parse(boards.hintBoard);
    expect(p.hinted, 'the hint board has one hD token').toEqual([2, 2]);
    expect(p.entries[2]?.[2], 'the hinted entry is 1').toBe(1);
    const before = filled(p).map((row) => [...row]);
    const target = before[2];
    expect.assert(target !== undefined, 'premise: row 3 exists');
    target[2] = null; // the board without its hinted cell
    expect(findViolations(before), 'no violation before the hint').toEqual([]);
    const sentence = 'Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.';
    for (const ceiling of [4, 1]) {
      const h = hint(before, ceiling);
      expect(h.kind, `hint(board, ${ceiling}) is a fill`).toBe('fill');
      expect.assert(h.kind === 'fill', 'premise: the hint is a fill');
      expect([h.row, h.col, h.value], `hint(board, ${ceiling}) fills row 3, column 3 with 1 (0-based 2, 2)`).toEqual([2, 2, 1]);
      expect(h.sentence).toBe(sentence);
    }
    // the hinted entry agrees with the solution of the shared givens
    expect(generate(6, 5, 1).solution[2]?.[2]).toBe(1);
  });

  it('the solved board is solved and is the solution of the shared givens', () => {
    const boards = loadBoards();
    const p = parse(boards.solvedBoard);
    expect(isSolved(filled(p)), 'solvedBoard is solved').toBe(true);
    expect(filled(p), 'solvedBoard equals the solution of the shared givens').toEqual(generate(6, 5, 1).solution);
    expect(countSolutions(filled(p)), 'solvedBoard has exactly one solution as a full grid').toBe(1);
  });

  it('the 4x4 and 8x8 fixtures have exactly one solution', () => {
    const boards = loadBoards();
    expect(countSolutions(parse(boards.fourBoard).givens), '4x4 givens').toBe(1);
    expect(countSolutions(parse(boards.eightBoard).givens), '8x8 givens').toBe(1);
  });

  it('the hint board, the 4x4 board and the 8x8 board hold no rule violation', () => {
    const boards = loadBoards();
    for (const name of ['hintBoard', 'eightBoard', 'fourBoard'] as const) {
      expect(findViolations(filled(parse(boards[name]))), `${name} has no violation`).toEqual([]);
    }
  });

  it('every fixture, converted to a capture value, is valid: the page takes no seed and calls no generator', () => {
    const boards = loadBoards();
    for (const name of NAMES) {
      const value = toCaptureValue(boards[name]);
      Reflect.set(window, CAPTURE_KEY, value);
      const seeds = seedQueue([1]);
      const spy = generateSpy(bySize({ 4: BLANK_4, 6: BLANK, 8: BLANK_8 }));
      const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
      expect(seeds.calls(), `${name}: no seed was taken`).toBe(0);
      expect(spy.calls, `${name}: the generator was not called`).toEqual([]);
      expect(boardSize(root), `${name}: the board shown is ${value.size}x${value.size}`).toBe(value.size);
      expect(summaryText(root), `${name}: the summary`).toBe(summaryLabel(value.size, 1));
      const shown = readBoard(root);
      expect(shown, `${name}: the board shown is the givens and the entries`).toEqual(filled(parse(boards[name])));
      expect(readGivenFlags(root), `${name}: the givens are the given cells`).toEqual(value.givens.map((row) => row.map((cell) => cell !== null)));
      Reflect.deleteProperty(window, CAPTURE_KEY);
      root.remove();
    }
  });

  // Fix round 1 (review wf_551a83f7-f44, contested coverage finding): the real fixtures, mounted, show what the pixel shots need:
  // the fixture's violation cells, the hint board's hinted cell with an empty hint message, and the solved board's win text.
  it('mounted, the fixtures show their violation, their hinted cell and the win text', () => {
    const boards = loadBoards();
    const mounted = (name: (typeof NAMES)[number]): ParentNode => {
      Reflect.set(window, CAPTURE_KEY, toCaptureValue(boards[name]));
      const root = mountPage({ seedSource: seedQueue([1]).source, generate: generateSpy(bySize({ 4: BLANK_4, 6: BLANK, 8: BLANK_8 })).generate });
      Reflect.deleteProperty(window, CAPTURE_KEY);
      return root;
    };
    const fixture = mounted('fixtureBoard');
    expect(violationCells(fixture), 'fixtureBoard: the violation cells are its 1-based violations').toEqual(boards.fixtureBoard.violations);
    expect(hintedCells(fixture), 'fixtureBoard: no hinted cell').toEqual([]);
    const hintBoard = mounted('hintBoard');
    expect(hintedCells(hintBoard), 'hintBoard: the hinted cell is row 3, column 3 (1-based)').toEqual([[3, 3]]);
    expect(hintMessage(hintBoard), 'hintBoard: the hint message is empty').toBe('');
    expect(violationCells(hintBoard), 'hintBoard: no violation').toEqual([]);
    const solved = mounted('solvedBoard');
    expect(winMessage(solved), 'solvedBoard: the win text shows at mount').toBe(WIN_MESSAGE);
    expect(winMessage(fixture), 'fixtureBoard: no win text').toBe('');
  });
});
