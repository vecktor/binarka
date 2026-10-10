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

/** Copy an n×n grid by index (never through the value's own iterator, which a hostile array can replace); null when it is not one. */
function readGrid(value: unknown, n: number): Grid | null {
  if (!Array.isArray(value) || value.length !== n) return null;
  const grid: Grid = [];
  for (let r = 0; r < n; r++) {
    const row: unknown = value[r];
    if (!Array.isArray(row) || row.length !== n) return null;
    const cells: Cell[] = [];
    for (let c = 0; c < n; c++) {
      const cell: unknown = row[c];
      if (cell !== 0 && cell !== 1 && cell !== null) return null;
      cells.push(cell);
    }
    grid.push(cells);
  }
  return grid;
}

/** The capture board of the window, copied; null when it is absent or invalid (then the page generates as usual). Reads the property once. */
export function readCaptureBoard(): CaptureBoard | null {
  // A getter on the global, or a getter, a Proxy or a revoked Proxy inside the value, may throw while it is read: that value is invalid
  // too, and is ignored silently. The global is still read once, inside the try.
  try {
    return validate((window as unknown as { __binarkaCaptureBoard?: unknown }).__binarkaCaptureBoard);
  } catch {
    return null;
  }
}

function validate(value: unknown): CaptureBoard | null {
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
