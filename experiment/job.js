// One run: one searcher, one target, one RNG seed, one budget. Pure — runs in Node workers and browser workers.

import { createRng } from "../engine/rng.js";
import { buildTemplates } from "../engine/detect.js";
import { TARGETS } from "../engine/patterns.js";
import { createEvaluator, runSearch } from "./evaluator.js";
import { SEARCHERS } from "../search/index.js";

const templateCache = new Map();
export function templatesFor(targetId, customCells = null) {
  if (customCells) return buildTemplates(customCells.cells, customCells.period || 1);
  if (!templateCache.has(targetId)) {
    const t = TARGETS[targetId];
    templateCache.set(targetId, buildTemplates(t.cells, t.period));
  }
  return templateCache.get(targetId);
}

export function runJob({ searcher, target, run, seed, budget, contest = "reach", binary = false, custom = null, onEvaluate = null }) {
  const evaluator = createEvaluator({
    templates: templatesFor(target, custom), budget, contest, binary, stopOnHit: contest === "reach", onEvaluate,
  });
  const t0 = Date.now();
  const state = runSearch(SEARCHERS[searcher].run, evaluator, createRng(seed), { budget });
  return {
    searcher, target, run, seed, budget, contest, binary,
    hit: state.firstHitAt !== null,
    firstHitAt: state.firstHitAt,
    spent: state.spent,
    bestFitness: state.best ? +state.best.fitness.toFixed(4) : 0,
    bestHitLive: state.bestHit ? state.bestHit.live : null,
    bestBits: state.bestHit ? Array.from(state.bestHit.bits).join("") : null,
    ms: Date.now() - t0,
  };
}
