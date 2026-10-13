// Headless benchmark: every (searcher × target × run) job, spread over worker threads.
// Usage: node cli/run-experiments.mjs [--targets hwss,pentadecathlon] [--searchers random,hill,anneal,ga,gaUniform]
//                                     [--runs 20] [--budget 2000] [--contest reach|minimal] [--binary]
//                                     [--workers N] [--out results/benchmark.json]
// Run i of every searcher uses the same RNG seed, so searchers face the same luck.

import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { availableParallelism } from "node:os";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

if (!isMainThread) {
  const { runJob } = await import("../experiment/job.js");
  parentPort.on("message", (job) => parentPort.postMessage(runJob(job)));
} else {
  const arg = (name, def) => {
    const i = process.argv.indexOf(`--${name}`);
    return i < 0 ? def : (process.argv[i + 1] ?? true);
  };
  const targets = String(arg("targets", "hwss,pentadecathlon")).split(",");
  const searchers = String(arg("searchers", "random,hill,anneal,ga,gaUniform")).split(",");
  const runs = +arg("runs", 20), budget = +arg("budget", 2000), contest = arg("contest", "reach");
  const binary = process.argv.includes("--binary");
  const workers = +arg("workers", Math.max(1, availableParallelism() - 2));
  const out = arg("out", "results/benchmark.json");

  const jobs = [];
  for (const target of targets) for (let run = 0; run < runs; run++) for (const searcher of searchers)
    jobs.push({ searcher, target, run, seed: 1000 + run, budget, contest, binary });

  console.log(`${jobs.length} jobs on ${workers} workers · budget ${budget} · contest ${contest}${binary ? " · binary fitness" : ""}`);
  const results = [];
  const t0 = Date.now();
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, () => new Promise((resolve, reject) => {
    const w = new Worker(fileURLToPath(import.meta.url));
    const feed = () => {
      if (next >= jobs.length) { w.terminate(); resolve(); return; }
      w.postMessage(jobs[next++]);
    };
    w.on("message", (r) => {
      results.push(r);
      process.stdout.write(`\r${results.length}/${jobs.length} done · ${((Date.now() - t0) / 1000).toFixed(0)}s   `);
      feed();
    });
    w.on("error", reject);
    feed();
  })));

  console.log("\n\nsearcher     target            hits    median first hit   mean best fitness");
  for (const target of targets) for (const searcher of searchers) {
    const rs = results.filter((r) => r.target === target && r.searcher === searcher);
    const hits = rs.filter((r) => r.hit).map((r) => r.firstHitAt).sort((a, b) => a - b);
    const mean = rs.reduce((s, r) => s + r.bestFitness, 0) / rs.length;
    console.log(`${searcher.padEnd(12)} ${target.padEnd(16)} ${`${hits.length}/${rs.length}`.padStart(6)}    ${String(hits.length ? hits[hits.length >> 1] : "-").padStart(10)}         ${mean.toFixed(3)}`);
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({
    created: new Date().toISOString(), budget, runs, contest, binary, targets, searchers,
    settings: { world: 64, seed: 16, cap: 1000, scanEvery: 4, density: 0.5 },
    results: results.sort((a, b) => a.target.localeCompare(b.target) || a.searcher.localeCompare(b.searcher) || a.run - b.run),
  }, null, 1));
  console.log(`\nwrote ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
