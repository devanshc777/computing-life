// Random search: a fresh random seed every evaluation. The baseline every other searcher must beat.

import { randomSeed } from "./common.js";

export function randomSearch({ evaluate, rng, seedSize }) {
  for (;;) evaluate(randomSeed(rng, seedSize));
}
