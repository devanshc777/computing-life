# life-ga

AISC (AI & soft computing) course project + viva. Search algorithms race to make a 16×16 Game of
Life seed produce a target object. A genetic algorithm is the headline, with hill climbing, simulated annealing and
random search as rivals on an equal evaluation budget.

## Read first
- `docs/GLOSSARY.md` — the vocabulary. Use these words in code, UI and report. Challenge a new term before adding it.
- `docs/research.md` — what is known, what was measured, what the design rests on.
- `docs/design.md` — encoding, fitness, searchers, experiment protocol, architecture, stack.
- `docs/decisions.md` — settled design decisions and their reasons.

## Status (2026-10-14)
Done: engine, detection, evaluator, all 5 searchers, experiment CLI, full web app, 20-run benchmark shipped in
`web/data/benchmark.json`. Demo script and viva Q&A: `docs/VIVA.md`.

## Layout
```
docs/          design, research, glossary, decisions, viva script, screenshots
prototypes/    PROTOTYPE-*.mjs — throwaway spikes, never imported by real code
```
Code: `engine/` pure simulation + detection · `search/` searchers · `experiment/` evaluator + job · `cli/` serve + benchmark ·
`web/` app (ui/screens, worker.js, fonts, data) · `tests/` node:test. Docs in `docs/`: VISUAL.md (look + flow), VIVA.md (demo script + Q&A), research/ (raw research + spike output).

## Rules for this repo
- **Engine modules are pure ES modules with no DOM** — the same files run in the browser worker and in Node.
- **Every random choice goes through the seeded RNG** passed in. A run must be reproducible from its seed.
- **Budgets are counted by the evaluator, not by the searcher.** No searcher can overspend by accident.
- Detection is checked against known answers (each object, every orientation and phase) before any experiment
  is trusted. A detector that cannot fail cannot pass.
- GA operators (selection, crossover, mutation) are what the viva examines: keep them short and commented so
  every line can be explained.
- No co-author trailers in commits.

## Run / verify
```
node cli/serve.mjs                    # app on http://localhost:5280/
npm test                              # all 22 tests (engine + detection + GA operators)
node --test tests/engine.test.js      # engine + detection known-answer tests (14)
node --test tests/ga-operators.test.js  # GA operator contracts (8)
node cli/run-experiments.mjs --runs 20 --budget 2000   # benchmark → results/benchmark.json (uses all cores but 2)
cp results/benchmark.json web/data/   # ship it as the Results page's "then"
```
Speed (measured): ~34 evals/s (HWSS) / ~14 (pentadecathlon) per core in Node; ~18-20 per worker in the browser.
While the CLI benchmark runs it saturates the CPU and the browser stalls — don't demo during a benchmark.
