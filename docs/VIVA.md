# Viva walkthrough

How to explain Computing Life in ~5 minutes, then the questions an examiner is likely to ask, with honest answers.
Numbers marked *(measured)* come from `research.md` and the final benchmark (`web/data/benchmark.json`).

## The 5-minute demo path
1. **Title → Learn** (30 s). "A grid, four rules, no player." Point at one rule card flipping NOW/NEXT.
2. **Gallery** (45 s). Spaceships move, oscillators repeat, the Gosper gun manufactures gliders forever.
   Say: "These are the shapes my searchers try to build. Some are common, some are one-in-a-million."
3. **AISC → Race** (2 min). Target: heavyweight spaceship. Racers: hill climbing, annealing, GA.
   While it runs, explain the setup (below). Point at the dashed white line: random search, the baseline.
   When a pane flashes HIT, the box shows the spaceship emerging from the chaos.
4. **Results** (1 min). One race is one roll of the dice; the benchmark repeats it 20 times per searcher with the
   same seeds. Read out who hit how often, then the honest twist: random search kept up with everyone.
5. **Custom** (30 s, if time). Draw a shape, send the searchers after it.

## The setup in four sentences
- A **seed** is a 16×16 patch of cells (256 bits) placed in the middle of a 64×64 wrapping world.
- The world runs Conway's rules for up to 1000 steps; we stop early when it starts repeating.
- **Fitness** is 1 if the target shape appears — isolated, in any orientation or phase — and otherwise how close
  the world ever came, as a share of the cells in the target's window.
- Every searcher gets the **same budget** of evaluations and the **same random-number seed**, so the comparison is fair.

## The searchers, one line each
- **Random search** — a fresh random seed every try. If nothing beats this, the "intelligence" is not helping.
- **Hill climbing (RMHC)** — flip one cell; keep it if the score did not drop; restart when stuck.
- **Simulated annealing** — same move, but sometimes accept a worse seed, more often early ("hot") than late
  ("cold"): `accept if rand < exp(Δ/T)`, T cooling 0.05 → 0.002.
- **Genetic algorithm** — 20 seeds; keep the best 2 (elitism); breed the rest by tournament selection (k = 3),
  **block crossover** (copy a rectangle from one parent into the other — keeps 2D shapes intact), and mutation
  (each cell flips with probability 1/256).
- **GA with uniform crossover** — each cell from either parent at random. Exists to test whether keeping blocks
  together matters.

## Likely questions
**Why a GA here, not gradient descent?** The genome is 256 bits and the fitness comes from running a simulation:
there is no gradient to follow. GAs, hill climbing and annealing need only "is this one better?".

**What is the search space?** 2²⁵⁶ seeds (~10⁷⁷). Exhaustive search is impossible.

**Why is this hard for a GA?** Game of Life is chaotic: one flipped cell can change everything 500 steps later.
Good "building blocks" from two parents do not necessarily stay good when combined. That is the building-block
hypothesis, and it is contested — which is exactly why block vs uniform crossover is compared.

**Did the GA win?** No, and nothing beat random search either. Final benchmark *(measured, 20 runs × 2,000
evaluations)*: on HWSS, random 12/20, hill 13/20, annealing 11/20, GA-block 11/20, GA-uniform 8/20. On the
pentadecathlon, every searcher hit only 1–3 times out of 20. The differences are within noise. Say why: partial credit
gets every searcher to 95–99% of the shape, but in a chaotic system "almost" does not predict "exactly". Guided
search spends its budget near a near-miss, while random keeps drawing fresh seeds. What does show: when guided search
hits, it hits sooner (annealing's median first hit was 441 tries, GA-block's 546, random's 818), and block crossover
beat uniform crossover (11 vs 8), the direction the building-block argument predicts. There is a 1993 paper
(Mitchell, Holland & Forrest, NIPS) where simple hill climbing beat a GA about tenfold. The fitness signal matters
more than the algorithm.

**How do you know random search is a fair baseline?** It uses density 0.5 seeds of 16×16, the same as Catagolue,
the community census of 3.4×10¹⁴ random seeds — so our measured random rates can be checked against theirs
(ours run 2–5× higher because we count a shape at any step, on a wrapping world).

**What does partial credit do, and can it mislead?** It turns "no" into "closer / further", which gives hill
climbing and the GA something to climb. It can mislead: a near-miss shape that never becomes the target scores
well (deception). Hill climbing's 0/8 on the pentadecathlon in the spike looks like that.

**Why does the world wrap around?** So the grid has no edges where shapes die artificially. Side effect: gliders
come back around and collide, which changes how often things appear.

**What is the cap and why stop at a repeated state?** 1000 steps. Once a world repeats a state it loops forever,
so nothing new can appear — stopping there saves time without changing any result.

**Is this a new result?** No paper found by the research pass runs this exact comparison (four searchers, equal
budget, named target). Closest work: Wolper & Abraham 2015 (evolved seeds, objective fitness collapsed to trivial
oscillators), Turney 2025 (mutation-only evolution toward a target). So: a small, honest new experiment.

**What would you do next?** Evolve the rules instead of the seeds (2¹⁸ = 262,144 Life-like rules), novelty search
instead of a fixed target, and a faster bit-packed engine.

## Facts to check before saying them out loud
Conway died in April 2020; Gemini (2010) was the first Conway-rule self-replicator; Gosper's gun won Conway's
$50 prize in 1970. These came from memory/background reading, not from this project's cited research.
