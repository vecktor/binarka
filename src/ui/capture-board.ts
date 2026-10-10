import { countSolutions } from '../engine/index';
import type { Cell, Grid } from '../engine/index';

/** A board for a capture harness (FR-119, A-56): set before the page mounts, read once, never written. */
export interface CaptureBoard {
  size: number;
  level: number;
  givens: Grid;
  entries: Grid;
  hinted: [number, number] | null;
}

const SIZES = [4, 6, 8];

function readGrid(value: unknown, n: number): Grid | null {
  if (!Array.isArray(value) || value.length !== n) return null;
  const grid: Grid = [];
  for (const row of value as unknown[]) {
    if (!Array.isArray(row) || row.length !== n) return null;
    const cells: Cell[] = [];
    for (const cell of row as unknown[]) {
      if (cell !== 0 && cell !== 1 && cell !== null) return null;
      cells.push(cell);
    }
    grid.push(cells);
  }
  return grid;
}

/** The capture board of the window, copied; null when it is absent or invalid (then the page generates as usual). Reads the property once. */
export function readCaptureBoard(): CaptureBoard | null {
  const value: unknown = (window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard;
  if (typeof value !== 'object' || value === null) return null;
  const { size, level, givens: rawGivens, entries: rawEntries, hinted: rawHinted } = value as Record<string, unknown>;
  if (typeof size !== 'number' || !SIZES.includes(size)) return null;
  if (typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > 4 || (size === 4 && level !== 1)) return null;
  const givens = readGrid(rawGivens, size);
  const entries = readGrid(rawEntries, size);
  if (givens === null || entries === null) return null;
  if (countSolutions(givens) !== 1) return null;
  if (entries.some((row, r) => row.some((cell, c) => cell !== null && givens[r]?.[c] !== null))) return null;
  let hinted: [number, number] | null = null;
  if (rawHinted !== undefined) {
    if (!Array.isArray(rawHinted) || rawHinted.length !== 2) return null;
    const [r, c] = rawHinted as unknown[];
    if (!Number.isInteger(r) || !Number.isInteger(c)) return null;
    if (entries[r as number]?.[c as number] == null) return null;
    hinted = [r as number, c as number];
  }
  return { size, level, givens, entries, hinted };
}
