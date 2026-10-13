// Simulated annealing: flip one random cell; always accept improvements, and accept a worse seed with
// probability exp(change / temperature). The temperature cools geometrically from t0 to t1 over the budget,
// so early on it explores freely and later it behaves like hill climbing.

import { randomSeed, flipOne } from "./common.js";

export function anneal({ evaluate, rng, seedSize, budget, t0 = 0.05, t1 = 0.002 }) {
  let current = randomSeed(rng, seedSize);
  let fitness = evaluate(current);
  let used = 1;
  for (;;) {
    const temperature = t0 * Math.pow(t1 / t0, Math.min(1, used / budget));
    const candidate = flipOne(current, rng);
    const f = evaluate(candidate);
    used++;
    if (f >= fitness || rng.next() < Math.exp((f - fitness) / temperature)) {
      current = candidate;
      fitness = f;
    }
  }
}
