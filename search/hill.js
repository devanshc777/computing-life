// Random-mutation hill climbing (RMHC): flip one random cell, keep the change if fitness did not drop.
// Accepting equal fitness lets it walk across flat ground. After `patience` moves without improvement
// it restarts from a new random seed. This is the variant that beat a GA ~10x in
// Mitchell, Holland & Forrest (NIPS 1993), so it is a serious rival.

import { randomSeed, flipOne } from "./common.js";

export function hillClimb({ evaluate, rng, seedSize, patience = 60 }) {
  for (;;) {
    let current = randomSeed(rng, seedSize);
    let fitness = evaluate(current);
    let stale = 0;
    while (stale < patience) {
      const candidate = flipOne(current, rng);
      const f = evaluate(candidate);
      if (f > fitness) { stale = 0; } else { stale++; }
      if (f >= fitness) { current = candidate; fitness = f; }
    }
  }
}
