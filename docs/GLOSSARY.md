# Glossary

Terms used across the code, the report and the viva. One meaning each.

**World** — the 64×64 wrapping (toroidal) Game of Life grid every evaluation runs in.

**Seed** — the 16×16 block of cells, alive or dead, placed in the centre of an empty world. The thing every search
algorithm proposes. Also the genome: 256 bits, row-major.

**Target** — a named Game of Life object (e.g. glider, LWSS, pulsar) that a run is trying to produce. Matched in
any of its phases and any of its 8 orientations, and only when **isolated** (a one-cell dead ring around it).

**Hit** — the target is found somewhere in the world at some step up to the cap. A seed either hits or it does not.

**Cap** — the maximum number of steps one evaluation simulates (default 1000).

**Lifespan** — steps until the world first repeats a state it has already been in, or the cap. Repeats cover
extinction, still lifes, oscillators and spaceships looping the torus.

**Evaluation** — simulating one seed and scoring it. The unit of cost. Every algorithm is charged per evaluation.

**Budget** — the number of evaluations one run of one algorithm may spend. Equal budgets make algorithms comparable.

**Searcher** — an algorithm that proposes seeds: random search, hill climbing, simulated annealing, genetic
algorithm.

**Run** — one searcher, one target, one budget, one RNG seed. Its result: did it hit, after how many evaluations,
and the best seed found.

**Fitness** — the number a searcher tries to raise. A hit is the top score; below that, partial credit for how
close the world came to containing the target.

**Contest 1 — reach** — which searcher hits the target most often, and fastest, within the budget.

**Contest 2 — minimal seed** — among seeds that hit, which searcher finds the one with the fewest live cells.
Searchers only; random seeding is not a contestant.

**Ladder** — the ordered set of targets from common to rare, chosen from measured hit rates.
