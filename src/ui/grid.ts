/** Pure, DOM-free helpers for the board's keyboard handling and accessible names. */

export type KeyAction = 'move' | 'cycle' | 'ignore';

export interface KeyInfo {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

/** Accessible name of a cell; `row` and `col` are 1-based. */
export function cellName(row: number, col: number, value: 0 | 1 | null): string {
  const text = value === null ? 'порожня' : String(value);
  return `Рядок ${row}, стовпець ${col}: ${text}`;
}

/** Destination (1-based) of a movement key, clamped at the edges; null for any other key. */
export function moveTarget(key: string, ctrl: boolean, row: number, col: number, n: number): [number, number] | null {
  switch (key) {
    case 'ArrowUp':
      return [Math.max(1, row - 1), col];
    case 'ArrowDown':
      return [Math.min(n, row + 1), col];
    case 'ArrowLeft':
      return [row, Math.max(1, col - 1)];
    case 'ArrowRight':
      return [row, Math.min(n, col + 1)];
    case 'Home':
      return ctrl ? [1, 1] : [row, 1];
    case 'End':
      return ctrl ? [n, n] : [row, n];
    default:
      return null;
  }
}

export function classifyKey(info: KeyInfo): KeyAction {
  if (info.altKey || info.metaKey || info.shiftKey) return 'ignore';
  const { key } = info;
  if (key === 'Home' || key === 'End') return 'move';
  if (info.ctrlKey) return 'ignore';
  if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') return 'move';
  if (key === 'Enter' || key === ' ') return 'cycle';
  return 'ignore';
}
