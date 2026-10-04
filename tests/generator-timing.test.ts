// NFR-1..3: generation time, worst case over the fixed seed set (seeds 1 to 20), after one warm-up call.
// NOTE: against a stub generator these bounds are trivially met; they gain meaning once generate() searches.
import { describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';

function slowestMs(n: number): { ms: number; seed: number } {
  generate(n, 0); // warm-up (module and JIT), not measured; seed 0 is outside the measured set
  let worst = { ms: 0, seed: 0 };
  for (let seed = 1; seed <= 20; seed++) {
    const t0 = performance.now();
    generate(n, seed);
    const ms = performance.now() - t0;
    if (ms > worst.ms) worst = { ms, seed };
  }
  return worst;
}

describe('generation time over seeds 1 to 20', () => {
  it('@trace NFR-1 N = 4: the slowest puzzle takes under 200 ms', () => {
    const w = slowestMs(4);
    expect(w.ms, `slowest: seed ${w.seed}`).toBeLessThan(200);
  }, 20_000);

  it('@trace NFR-2 N = 6: the slowest puzzle takes under 500 ms', () => {
    const w = slowestMs(6);
    expect(w.ms, `slowest: seed ${w.seed}`).toBeLessThan(500);
  }, 30_000);

  it('@trace NFR-3 N = 8: the slowest puzzle takes under 3 seconds', () => {
    const w = slowestMs(8);
    expect(w.ms, `slowest: seed ${w.seed}`).toBeLessThan(3000);
  }, 120_000);
});
