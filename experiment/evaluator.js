// The evaluator turns a seed into a fitness score and owns the evaluation budget.
// Searchers just call evaluate(bits) in a loop; when the budget is spent (or, if asked, the target is hit)
// evaluate throws Stop, which ends the search. No searcher can overspend.

import { step, hash, placeSeed, CONWAY } from "../engine/life.js";
import { bestMismatch, contains, windowSize } from "../engine/detect.js";

export class Stop extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}

// scanEvery: how often to check for an exact hit (cheap: fails on the first wrong cell).
// creditEvery: how often to measure partial credit (expensive: counts every mismatching cell).
export const DEFAULTS = { worldSize: 64, seedSize: 16, cap: 1000, scanEvery: 4, creditEvery: 8 };

export function createEvaluator({
  templates, budget, contest = "reach", stopOnHit = true, binary = false,
  worldSize = DEFAULTS.worldSize, seedSize = DEFAULTS.seedSize, cap = DEFAULTS.cap, scanEvery = DEFAULTS.scanEvery,
  creditEvery = DEFAULTS.creditEvery,
  onEvaluate = null,
}) {
  const W = worldSize, H = worldSize, cells = seedSize * seedSize;
  const window = windowSize(templates);
  let a = new Uint8Array(W * H), b = new Uint8Array(W * H);
  const seen = new Set();

  const state = {
    spent: 0,
    firstHitAt: null,       // evaluation number of the first hit
    best: null,             // { bits, fitness, hit, live, hitStep }
    bestHit: null,          // contest 2: fewest live cells among hitting seeds
  };

  function simulate(bits) {
    placeSeed(bits, seedSize, W, H, a);
    seen.clear();
    let mismatch = window;
    for (let t = 0; t <= cap; t++) {
      if (t % scanEvery === 0) {
        if (contains(a, W, H, templates)) return { hit: true, hitStep: t, mismatch: 0 };
        if (!binary && t % creditEvery === 0) mismatch = bestMismatch(a, W, H, templates, mismatch, true);
      }
      const hsh = hash(a);
      if (seen.has(hsh)) break; // the world repeats from here on: nothing new can appear
      seen.add(hsh);
      step(a, b, W, H, CONWAY);
      const tmp = a; a = b; b = tmp;
    }
    return { hit: false, hitStep: null, mismatch };
  }

  function evaluate(bits) {
    if (state.spent >= budget) throw new Stop("budget");
    state.spent++;
    let live = 0;
    for (let i = 0; i < cells; i++) live += bits[i];
    const r = simulate(bits);

    // Contest 1: 1 for a hit, else partial credit = how close the world ever came to the target.
    let fitness = r.hit ? 1 : (binary ? 0 : 1 - r.mismatch / window);
    // Contest 2: among hits, fewer live cells is better.
    if (contest === "minimal" && r.hit) fitness = 1 + (cells - live) / cells;

    const record = { bits: bits.slice(), fitness, hit: r.hit, live, hitStep: r.hitStep, evaluation: state.spent };
    if (!state.best || fitness > state.best.fitness) state.best = record;
    if (r.hit) {
      if (state.firstHitAt === null) state.firstHitAt = state.spent;
      if (!state.bestHit || live < state.bestHit.live) state.bestHit = record;
    }
    if (onEvaluate) onEvaluate(record, state);
    if (r.hit && stopOnHit && contest === "reach") throw new Stop("hit");
    return fitness;
  }

  return { evaluate, state, seedSize };
}

// Run one searcher to completion under an evaluator; returns the evaluator state.
export function runSearch(searcher, evaluator, rng, options = {}) {
  try {
    searcher({ evaluate: evaluator.evaluate, rng, seedSize: evaluator.seedSize, ...options });
  } catch (e) {
    if (!(e instanceof Stop)) throw e;
  }
  return evaluator.state;
}
