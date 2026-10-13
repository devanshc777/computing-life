# Decisions

The design choices that shape the experiment, each with its reason. Settled 2026-10-13.

## Experiment

**1. Target ladder.** The ladder, measured in our exact setup (`research.md` §3): **glider** (appears from almost every seed) → **LWSS**
(~1 in 190 random seeds) → **MWSS** (~1 in 500) → **HWSS** (~1 in 1,500) → **pentadecathlon** (0 in 3,000;
Catagolue ~1 in 60,000).
→ The contest uses **HWSS and pentadecathlon**. LWSS separated nothing in the spike: every searcher hit it in about 60
evaluations. Glider and LWSS stay as sanity rungs, and pulsar is kept as a demo target in the UI.

**2. Fitness.** Partial credit (how close the world ever came to the target) rather than binary hit-or-nothing.
→ Partial credit is the main fitness, and binary fitness is available as an ablation (`--binary`). Whether partial
credit guides the search or misleads it is itself a finding.

**3. Budget and runs.** 2,000 evaluations per run, 20 runs per (searcher, target), and a run stops at its first hit.
→ This keeps the full benchmark under an hour on one machine.

**4. Searchers.** Random search, hill climbing (RMHC with restarts), simulated annealing, GA with block crossover,
and GA with uniform crossover.
→ These cover both heuristic search and genetic algorithms. The two GA variants test whether keeping 2D blocks
together during crossover matters.

**5. Contest 2: minimal seed.** Among the seeds that hit the target, fewest live cells wins. Searchers compete
only on the same budget, against LWSS, the rung where every searcher hits often enough to have something to minimise.

**6. Charts.** Hand-drawn on canvas with no chart library. Only two kinds are needed (score vs tries, and success
rates), and every line stays explainable.

## App

**7. Race participants are selectable** (2–5 searchers). Hill climbing, annealing and GA-block are shown by default.
Random search is always drawn as the dashed baseline. GA-uniform and a random pane sit behind a "more racers"
toggle, and fewer participants means a faster race.

**8. A hit freezes the pane.** When a searcher finds the target, its board stops on the step the target exists,
framed, with a replay button. The other panes keep searching.

**9. Grid sizes.** Races and single runs use the experiment's 64×64 world. The sandbox and gallery use bigger
free-form grids.

**10. Look.** 8-bit, CRT magenta/purple, NES-style title and menus, bevelled "block" cells, and one colour per
searcher. Details are in `VISUAL.md`.

## Priorities
The deliverable is a polished live demo with an explanation, so polish and explainability outrank extra
experiments. `VIVA.md` is part of the build.
