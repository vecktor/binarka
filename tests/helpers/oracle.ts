// INDEPENDENT solution counter (capped at 2). Never imports the engine.
// Method: enumerate every balanced no-three-in-a-row row of width N, keep those consistent with the
// given cells of each board row, then depth-first over the rows with column pruning.
export type OCell = 0 | 1 | null;
export type OGrid = OCell[][];

export interface OracleResult {
  /** 0, 1 or 2 (2 stands for "2 or more") */
  count: 0 | 1 | 2;
  /** the solutions found (at most 2) */
  solutions: (0 | 1)[][][];
}

const rowCache = new Map<number, (0 | 1)[][]>();

/** All rows of width n with n/2 zeros, n/2 ones and no three equal digits side by side. */
function balancedRows(n: number): (0 | 1)[][] {
  const cached = rowCache.get(n);
  if (cached) return cached;
  const out: (0 | 1)[][] = [];
  const cur: (0 | 1)[] = [];
  const walk = (zeros: number, ones: number): void => {
    if (cur.length === n) {
      out.push([...cur]);
      return;
    }
    for (const d of [0, 1] as const) {
      if (d === 0 ? zeros >= n / 2 : ones >= n / 2) continue;
      const len = cur.length;
      if (len >= 2 && cur[len - 1] === d && cur[len - 2] === d) continue;
      cur.push(d);
      walk(zeros + (d === 0 ? 1 : 0), ones + (d === 1 ? 1 : 0));
      cur.pop();
    }
  };
  walk(0, 0);
  rowCache.set(n, out);
  return out;
}

export function oracleSolve(board: OGrid): OracleResult {
  const n = board.length;
  const half = n / 2;
  const solutions: (0 | 1)[][][] = [];

  const candidates: (0 | 1)[][][] = board.map((givenRow) =>
    balancedRows(n).filter((row) => givenRow.every((g, c) => g === null || g === row[c])),
  );

  const zeros: number[] = Array.from({ length: n }, () => 0);
  const ones: number[] = Array.from({ length: n }, () => 0);
  const placed: (0 | 1)[][] = [];
  const used = new Set<string>();

  const dfs = (r: number): void => {
    if (solutions.length >= 2) return;
    if (r === n) {
      const cols = new Set<string>();
      for (let c = 0; c < n; c++) cols.add(placed.map((row) => row[c]).join(''));
      if (cols.size === n) solutions.push(placed.map((row) => [...row]));
      return;
    }
    const remainingAfter = n - r - 1;
    for (const cand of candidates[r] ?? []) {
      const key = cand.join('');
      if (used.has(key)) continue;
      let ok = true;
      for (let c = 0; c < n && ok; c++) {
        const d = cand[c];
        const z = (zeros[c] ?? 0) + (d === 0 ? 1 : 0);
        const o = (ones[c] ?? 0) + (d === 1 ? 1 : 0);
        if (z > half || o > half) ok = false;
        else if (z + remainingAfter < half || o + remainingAfter < half) ok = false;
        else if (r >= 2 && placed[r - 1]?.[c] === d && placed[r - 2]?.[c] === d) ok = false;
      }
      if (!ok) continue;
      cand.forEach((d, c) => {
        if (d === 0) zeros[c] = (zeros[c] ?? 0) + 1;
        else ones[c] = (ones[c] ?? 0) + 1;
      });
      placed.push(cand);
      used.add(key);
      dfs(r + 1);
      used.delete(key);
      placed.pop();
      cand.forEach((d, c) => {
        if (d === 0) zeros[c] = (zeros[c] ?? 0) - 1;
        else ones[c] = (ones[c] ?? 0) - 1;
      });
      if (solutions.length >= 2) return;
    }
  };
  dfs(0);
  return { count: Math.min(solutions.length, 2) as 0 | 1 | 2, solutions };
}

export function oracleCount(board: OGrid): 0 | 1 | 2 {
  return oracleSolve(board).count;
}
