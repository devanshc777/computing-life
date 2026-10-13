# Research

What the design rests on. Detail lives in `research/`; this file is the synthesis plus the verdict.
Written 2026-10-13. Claims are marked **measured** (we ran it), **sourced** (cited), or **inference**.

## 1. Prior art (sourced — full notes in `research/prior-art.md`)
- **Nobody has run this exact race.** No source found compares GA, hill climbing, simulated annealing and random on
  an equal budget toward a named object, then minimises population. Closest: Wolper & Abraham (Swarthmore 2015,
  CPPN encoding, objective fitness collapsed to blinkers/still lifes/lone gliders within 1-2 generations; they also
  exploited torus wrap-around), Turney (arXiv 2501.04761, 2025: 30x30 seed in a 60x60 torus, overlap fitness against
  a fixed target, **mutation only, no crossover**), Alfonseca & Soler Gil (2012, abstract only). So the project's
  core comparison is **open ground**, not a re-run.
- **Crossover on 2D Life seeds is barely studied.** Only Salo & Torma (arXiv 2308.10198) use a 2D-aware crossover
  (row-wise, Markov persistence), and they say they "do not know" if it beat stronger mutation. Our block-vs-uniform
  ablation answers a question the literature leaves open.
- **Strongest dissent (verified):** Mitchell, Holland & Forrest, *When Will a Genetic Algorithm Outperform Hill
  Climbing?* (NIPS 1993): random-mutation hill climbing (single random bit flip, accept-if-not-worse) needed ~6,179
  evaluations vs the GA's ~61,334 on Royal Road. Design consequence: our hill climber must be that RMHC variant, a
  real rival, not a straw man.
- **Random is not a straw man either:** Catagolue has brute-forced ~10^14+ random 16x16 soups; the record
  methuselahs came from random search.
- **Minimal seeds known (LifeWiki):** pulsar (48 cells) has 7-cell predecessors; a row of **10 cells** becomes a
  pentadecathlon (12 cells). So pentadecathlon is near-impossible for random seeds but has a tiny structured seed:
  a perfect rung for showing guided search vs sampling. No smaller seed found for glider or LWSS beyond their
  own size (5, 9).
- **Community tools** (apgsearch, glider synthesis, Logic Life Search SAT solver, gfind/ikpx) solve different
  problems (census, construction, exhaustive spaceship search); they are context for the viva, not competitors.

## 2. Target rarity in the wild (sourced — `research/targets.md`)
Catagolue's census of 3.4×10¹⁴ random 16×16 soups (density 0.5, same as our seed) gives per-soup rates:
glider 1.92 (expected count) · LWSS 2.8×10⁻³ · pulsar 1.5×10⁻³ · MWSS 7.4×10⁻⁴ · HWSS 1.3×10⁻⁴ ·
pentadecathlon 1.7×10⁻⁵ · figure eight 5.9×10⁻⁷ · Gosper glider gun **0** (never in this census).

## 3. Our setup, measured (spike: `prototypes/PROTOTYPE-census.mjs`)
**Measured** on random density-0.5 seeds, 64×64 torus, cap 1000, any step, isolated match in any orientation/phase.

| Object | Our hit rate (seeds containing it) | Sample | Catagolue per-soup | Ratio |
|---|---|---|---|---|
| glider | 76.5% | 200 | 1.92 (expected count) | — |
| beacon | 5.8% | 3,000 | 1.5×10⁻² | ~3.9× |
| LWSS | 0.53% (16) | 3,000 | 2.8×10⁻³ | ~1.9× |
| pulsar | 0.33% (10) | 3,000 | 1.5×10⁻³ | ~2.2× |
| MWSS | 0.20% (6) | 3,000 | 7.4×10⁻⁴ | ~2.7× |
| HWSS | 0.07% (2) | 3,000 | 1.3×10⁻⁴ | ~5× (n=2, noisy) |
| pentadecathlon | 0 | 3,000 | 1.7×10⁻⁵ | expected ~0.05 hits, consistent |

Our rates run ~2–5× higher than Catagolue, which matches the expected direction: we count an object if it exists at
**any** step (Catagolue counts final debris), and the torus recycles gliders into new collisions (**inference**).
Also measured: mean lifespan ~480–530 steps; ~20–24% of random seeds are still changing at step 1000.

**Throughput (measured, one core, plain JS, Uint8Array grid):** ~96–111 evaluations/s for lifespan only;
~25 evaluations/s scanning six targets at once; ~40/s for a single target with early stop.

## 4. The race (spike: `prototypes/PROTOTYPE-race.mjs`)
**Measured**, spike defaults (hill = 1-3 bit flips, GA pop 20 + block crossover), partial-credit fitness, scan every
4 steps, runs spend the full budget. Raw rows: `research/race/*.jsonl`.

| Target (budget, runs) | Random | Hill climbing | Annealing | GA (block) |
|---|---|---|---|---|
| LWSS (400, 12) | 12/12, median first hit 58 | 12/12, 63 | 12/12, 57 | 12/12, 57 |
| HWSS (1500, 8) | **1/8** (713) | **5/8** (982) | **4/8** (111) | **5/8** (253) |
| Pentadecathlon (1500, 8) | 1/8 (932) | **0/8** | **3/8** (290) | 1/8 (689) |

Reading it:
- **LWSS** separates nothing: every searcher hits in ~60 evaluations. Sanity rung only. (Random hitting 12/12 implies ~1-2% per seed, above the census's 0.53%; the race scanned every 4 steps vs the census's 8, so short-lived LWSS were caught more often. Inference: scan interval changes measured rarity, so it must be fixed before the real experiment.)
- **HWSS** is the first rung with a gap: guided searchers hit 4-5 of 8, random 1 of 8. With n=8 this is a
  **signal, not a result** (5/8 vs 1/8 is roughly p~0.06 one-sided by Fisher's exact test, inference). The real
  experiment needs >= 20 runs.
- **Pentadecathlon:** annealing best (3/8), hill climbing never (0/8, consistent with getting stuck on a near-miss
  that never becomes the target). Random's 1 hit is luck at ~1e-4 per seed.
- Partial credit did produce a gradient (mean best fitness 0.95-0.99 even in missed runs) — whether it points the
  right way is target-dependent.

**Speed under load (measured):** 12 processes at once gave ~7-19 evaluations/s each (~90-150/s total), not the
~40/s per core a lone process gets. Pentadecathlon runs were slowest (period-15 object, 30 templates).

## 5. Viability verdict
**Viable.** Inference from the measurements above:
1. The core claim is testable and non-trivial: on a mid-rare target (HWSS) guided search already looks ~4-5x
   random in a crude spike, and on the rarest rung the winner changes (annealing, not GA). There is a real
   race with a story, and the GA is not guaranteed to win — good for an honest viva.
2. Rungs to use: **HWSS and pentadecathlon** carry the contest; MWSS likely sits between (untested); LWSS and
   glider are sanity rungs; figure eight is a stretch the spike did not try.
3. **Must fix before the real experiment:** speed. 20 runs x 5 searchers x ~3 rungs x 2,000 evaluations is
   ~600k evaluations, ~1-2 h at the measured aggregate rate. Three cheap wins: stop a run at its first hit
   (contest 1 needs nothing after it), bit-packed simulation, and scanning only near cells that changed.
4. **Must change from the spike:** hill climbing becomes single-bit RMHC (the NIPS 1993 rival); GA parameters
   get one tuning pass, then frozen.
5. No work found in the literature has run this exact comparison, so the result is new for a
   course project, whatever it says.

## 6. Final benchmark (measured, 2026-10-14)
`npm run bench`: 20 runs × 2,000 evaluations per (searcher, target), partial-credit fitness, stop at first hit,
run *i* of every searcher on the same RNG seed. Raw data: `web/data/benchmark.json`.

| Searcher | HWSS hits (median first hit) | Pentadecathlon hits (median first hit) | Mean best fitness (HWSS / PD) |
|---|---|---|---|
| Random | 12/20 (818) | 3/20 (1183) | 0.992 / 0.954 |
| Hill climbing | 13/20 (797) | 1/20 (243) | 0.992 / 0.952 |
| Annealing | 11/20 (441) | 2/20 (1618) | 0.991 / 0.950 |
| GA, block | 11/20 (546) | 2/20 (1319) | 0.987 / 0.946 |
| GA, uniform | 8/20 (1290) | 1/20 (739) | 0.988 / 0.947 |

Reading it:
- **No searcher separates from random.** The spike's HWSS gap (guided 4-5/8 vs random 1/8, n=8) did not survive
  n=20. Random's 12/20 matches the census rate: at ~0.07% per seed, 2,000 seeds give P(hit) ~ 0.75.
- **Partial credit does not point the way** (inference): mean best fitness is 0.95-0.99 for everyone, so the
  gradient exists, but near-misses do not lead to hits in a chaotic system. Deception, as flagged in §4.
- **Block > uniform crossover** on HWSS (11 vs 8, faster median); suggestive at n=20, not significant.
- **Guided searchers hit earlier when they hit** (annealing median 441, GA-block 546 vs random 818 on HWSS).
- Next: novelty search, fitness on stabilised debris, binary-fitness ablation (`--binary`), more runs.
