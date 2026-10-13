// GA operators: selection, crossover, mutation. The GA loop that calls them is in search/ga.js.
// Contracts are pinned by tests/ga-operators.test.js. Run:  node --test tests/ga-operators.test.js
//
// Types: a seed is a Uint8Array of 0/1 with length size*size (row-major).
//        an individual is { bits, fitness }.  rng has next() -> [0,1), int(n) -> 0..n-1, chance(p) -> bool.
// Every random choice goes through rng, never Math.random, so a run replays exactly from its seed.

// Pick k individuals at random (with replacement) and return the fittest of them.
// Larger k = stronger selection pressure: weak seeds rarely win a tournament of many.
export function tournamentSelect(population, k, rng) {
  let best = population[rng.int(population.length)];
  for (let i = 1; i < k; i++) {
    const rival = population[rng.int(population.length)];
    if (rival.fitness > best.fitness) best = rival;
  }
  return best;
}

// Child = a copy of parent A, with one random axis-aligned rectangle copied in from parent B.
// The rectangle must be at least 1×1 and lie inside the size×size grid. Must not modify either parent.
// Why a rectangle: Life patterns are 2D, so a block keeps neighbouring cells (a would-be shape) together.
export function blockCrossover(a, b, size, rng) {
  const child = a.slice();
  const x0 = rng.int(size), y0 = rng.int(size);
  const w = 1 + rng.int(size - x0), h = 1 + rng.int(size - y0);
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) child[y * size + x] = b[y * size + x];
  }
  return child;
}

// Child takes each cell from A or B with probability 0.5. Must not modify either parent.
export function uniformCrossover(a, b, rng) {
  const child = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) child[i] = rng.chance(0.5) ? a[i] : b[i];
  return child;
}

// Return a copy of bits where each cell flips with probability `rate`. Must not modify the input.
export function mutate(bits, rate, rng) {
  const out = bits.slice();
  for (let i = 0; i < out.length; i++) if (rng.chance(rate)) out[i] ^= 1;
  return out;
}
