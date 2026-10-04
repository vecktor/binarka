const SEED_RANGE = 2147483648; // seeds are integers 0..2^31-1

let previous: number | null = null;

/** Default seed source: a random integer 0..2147483647, never equal to the previous one. */
export function defaultSeedSource(): number {
  let seed = Math.floor(Math.random() * SEED_RANGE);
  while (seed === previous) seed = Math.floor(Math.random() * SEED_RANGE);
  previous = seed;
  return seed;
}
