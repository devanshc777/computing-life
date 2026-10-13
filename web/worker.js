// Runs one search off the main thread and streams progress back to the page.

import { runJob } from "../experiment/job.js";

self.onmessage = (event) => {
  const job = event.data;
  let lastPost = 0, lastBest = null;
  const onEvaluate = (record, state) => {
    const now = performance.now();
    const improved = state.best !== lastBest;
    if (!improved && !record.hit && now - lastPost < 100) return;
    lastPost = now;
    lastBest = state.best;
    self.postMessage({
      type: "progress",
      spent: state.spent,
      bestFitness: state.best.fitness,
      bestBits: improved ? state.best.bits : null,
      bestHit: state.best.hit,
      hitStep: state.best.hitStep,
      firstHitAt: state.firstHitAt,
    });
  };
  try {
    self.postMessage({ type: "done", result: runJob({ ...job, onEvaluate }) });
  } catch (err) {
    self.postMessage({ type: "error", message: String(err && err.message || err) });
  }
};
