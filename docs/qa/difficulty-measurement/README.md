# Difficulty levels: feasibility measurement (2026-10-09, before the amendment)

This is a scratch prototype by the orchestrator. It is **not product code and not acceptance evidence**. Its only purpose is to inform the requirements amendment for difficulty levels (FR-44, currently Future). The source is `proto.ts.txt`: a copy of `src/engine` at `5b03b53` with `fillGrid` exported, run with `npx tsx`. Machine: Darwin 25.5.0 arm64, node v22.21.1, timed with `performance.now()`.

## Techniques

| Level | Technique | How the prototype checks it |
|---|---|---|
| 1 | Basic | Today's `hint()`: pair, sandwich, count. |
| 2 | Line balance | A line holds exactly N/2−1 of a digit d. Put d in an empty cell e and the other digit in every other empty cell of the line. If that makes three in a row, e takes the other digit. |
| 3 | Unique lines | A line has exactly two empty cells and agrees with a complete line of the same direction on every filled cell. Its empty cells take the opposite of that complete line's digits. |
| 4 | Look-ahead | Put a value in an empty cell and propagate with levels 1 to 3 for at most K steps. If a rule violation appears, the cell takes the other value. Among such cells, the one with the shortest contradiction is used. |

## How a level-L puzzle is built

1. The fill phase is unchanged, so the solution is the same as at level 1.
2. Carving keeps a removal only if the board stays solvable with techniques 1 to L.
3. The result is accepted only if it is NOT solvable with techniques 1 to L−1.
4. If it is not accepted, carving starts again with a new shuffle from the continued RNG stream (deterministic), up to 30 attempts.

## Results, seeds 1 to 20

"ok" counts seeds that gave an accepted puzzle within 30 attempts. "Worst" is the slowest single generation.

| N | L | K (look-ahead cap) | ok | Avg attempts (max) | Avg givens | Worst | Fills by level 1/2/3/4 | Max depth |
|---|---|---|---|---|---|---|---|---|
| 4 | 1 | – | 20/20 | 1.0 (1) | 4.3/16 | 2 ms | 235/0/0/0 | – |
| 4 | 2 | – | **0/20** | – | – | 25 ms | – | – |
| 4 | 3 | – | 20/20 | 2.6 (8) | 5.0/16 | 4 ms | 199/0/20/0 | – |
| 4 | 4 | none | **1/20** | 13 | 8.0/16 | 143 ms | 7/0/0/1 | 8 |
| 6 | 1 | – | 20/20 | 1.0 (1) | 9.2/36 | 4 to 11 ms | 537/0/0/0 | – |
| 6 | 2 | – | 20/20 | 2.5 (7) | 9.0/36 | 26 ms | 498/42/0/0 | – |
| 6 | 3 | – | 20/20 | 1.3 (3) | 8.4/36 | 12 ms | 476/43/33/0 | – |
| 6 | 4 | none | 20/20 | 2.4 (6) | 8.3/36 | 348 ms | 458/46/18/31 | **25** |
| 6 | 4 | 4 | 20/20 | 4.3 (20) | 8.7/36 | **359 ms** | 465/39/18/25 | 4 |
| 6 | 4 | 2 | 19/20 | 6.6 (20) | 8.9/36 | 375 ms | 437/40/18/20 | 2 |
| 8 | 1 | – | 20/20 | 1.0 (1) | 16.6/64 | 17 ms | 949/0/0/0 | – |
| 8 | 2 | – | 20/20 | 1.3 (2) | 15.3/64 | 36 ms | 868/107/0/0 | – |
| 8 | 3 | – | 20/20 | 1.0 (1) | 13.7/64 | 20 ms | 824/134/48/0 | – |
| 8 | 4 | 4 | 20/20 | 3.1 (11) | 14.1/64 | 746 ms | 828/108/37/26 | 4 |
| 8 | 4 | 2 | 20/20 | 6.5 (28) | 14.4/64 | 1238 ms | 831/103/37/21 | 2 |

## Reading

- **4×4:** level 2 never occurs. Level 4 occurs for 1 seed of 20. 4×4 is too small for graded levels.
- **6×6 and 8×8:** every level can be built for every seed when the look-ahead is capped at 4 steps.
- **Uncapped look-ahead** needs contradiction chains up to 25 steps long, which no one-sentence hint can explain. A cap of 4 keeps the chains short. A cap of 2 loses one 6×6 seed and is slower, because it needs more attempts.
- **Timing risk at level 4:**
  - 6×6 worst case is 359 ms, 72% of NFR-2's 500 ms bound. That is over the 50% tripwire used in phase F.
  - 8×8 worst case is 746 ms, 25% of NFR-3's 3 s bound.
  - The prototype is unoptimised: every carving step re-runs the full look-ahead scan. So the implementation needs a faster level-4 check, or a different construction, to keep a safe margin. The bounds are never relaxed.
- **Levels 2 and 3** are fast, with a worst case of 36 ms or less.
