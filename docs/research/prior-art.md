# Prior art: search over Game of Life seeds

Researched 2026-10-13. **[verified]** means I read the primary source; **[secondary]** means a search snippet or someone else's summary; **[unverified]** means I could not confirm. LifeWiki (conwaylife.com) sits behind a Cloudflare challenge; I read it through a real browser session.

## 1. Prior art on evolutionary search for Life seeds

**No source found does exactly your task (GA vs HC vs SA vs random at equal budget, hitting a named object, then minimising population).** The nearest neighbours:

- **Wolper & Abraham, Swarthmore CS81 2015** [verified, full text read]. https://www.cs.swarthmore.edu/~meeden/cs81/f15/papers/JoshGeorge.pdf
  - Encoding: a CPPN (NEAT) maps each cell's (x, y, distance to origin) to alive/dead. Not a bitstring. Toroidal board. 100 individuals, 10 generations, 500 steps each.
  - Fitness: three hand-built functions from lifetime-until-still-life, lifetime-until-period-2 and end mass. It does **not** target a named object.
  - Result: objective search converged within 1-2 generations to trivial outcomes (blinkers and still lifes; "wave oscillators" that exist only because of the torus; a lone glider in 47 of 50 generations). Novelty search later produced a pulsar and pentadecathlon, with a complex oscillator best in 10 of 50 generations.
  - Their own caveat: fitness functions "were edited to converge to specific results we wanted", and they question whether EC is appropriate here. Against 100 random seeds, novelty search differed on lifetime-until-oscillator (Kruskal-Wallis p = 2.9e-6), but random seeds also reached oscillators, mostly low-period ones.
- **Alfonseca & Soler Gil, "Evolving Interesting Initial Conditions for Cellular Automata of the Game of Life Type", Complex Systems 21(1), 2012** [abstract verified, body not read]. https://www.complex-systems.com/?p=1522
  - A GA picks initial conditions that maximise the count of gliders, R-pentominoes and similar structures, in Life, HighLife, B38S23 and time-dependent rules.
  - From Turney's 2025 quotation [secondary]: 60x60 toroid, generations 1-54 per evaluation, over half an hour per GA run. Encoding, operators and population are **unverified**.
- **Turney, "Evolution of Spots and Stripes in Cellular Automata", arXiv 2501.04761** [verified, PDF read]. https://arxiv.org/pdf/2501.04761
  - Seed is 30x30 inside a 60x60 Golly toroid, run 100 steps. Fitness: +1 for a live cell on a black target cell, -1 for a live cell on a white target cell (cell-by-cell overlap).
  - Population 1000, tournament of two, **asexual, mutation only** (p = 0.1 per cell, about 90 flips per child). No crossover.
  - Targets are stripes and spots, not Life objects. His related Model-S (arXiv 2104.01242) evolves seeds by head-to-head Immigration Game contests [secondary].
- **Salo & Törmä, "Structure and computability of preimages in the Game of Life", arXiv 2308.10198, section 9** [verified]. https://arxiv.org/pdf/2308.10198
  - A hill-climber and a GA, both scored with a SAT solver. The GA keeps up to 100 patterns and uses a "genetic similarity" filter (count of equal cells) against homogeneity.
  - Mutation re-randomises a few small rectangles. Crossover builds a child row by row from two parents, with a Markov chain that prefers staying with the same parent.
  - The authors' verdict: the GA found the charger gadget only with "extensive human effort"; crossover sometimes freed a stalled run, but "we do not know ... whether it could have been replaced by a more aggressive mutation rule". The hill-climber found all the other gadgets.
- **Kaggle "Conway's Reverse Game of Life" (2013)**: 20x20 end board, predict a start 1-5 steps earlier, scored by MAE on cell states [secondary]. https://www.kaggle.com/competitions/conway-s-reverse-game-of-life
  - Winner Miranda called the entry "not particularly innovative" [secondary]: https://www.kaggle.com/c/conway-s-reverse-game-of-life/forums/t/7254/congratulations-miranda. O'Leary combined per-cell probabilities from simulated boards, mixing several densities in a 1:10:100:1000 ratio [secondary]. Boosted-tree and random-forest entries also appear. I could not retrieve the winner's write-up, so the winning method is **unverified**.
  - A GA by ptyshevs (https://github.com/ptyshevs/rgol_ga) reports 0.0634 on the private set and says it "beats top solutions by a wide margin" [README verified; the Medium article with operators returned 403, so encoding, crossover and fitness are **unverified**]. The README says a Cython Life step gave an 8x speedup in fitness scoring.
  - A Duke course report (Posen & Li) found plain simulated annealing "ineffective due to the high dimensionality of the search space": 10,000 iterations took 8 hours and "did not come close to converging". Their best method was iterated per-cell MAP estimates [verified, PDF read]. Caveat: their SA ran over a continuous relaxation (per-cell probabilities), not binary flips, so it is weak evidence against binary SA.
- **Kaggle "Conway's Reverse Game of Life 2020"** (Oct-Nov 2020, 50K puzzles, wrapping edges). Only MathWorks Cody spin-offs surfaced; one suggests a greedy single-bit-flip search scoring under 0.09 [secondary]. Winners' methods **unverified**.
- **Mitchell, Crutchfield & Das, EvCA review** [abstract verified]. https://www.melaniemitchell.me/PapersContent/evca-review.pdf. It evolves **rules** (density classification, synchronisation), **not initial patterns**. Cite it for GA-on-CA methodology, not as seed-search precedent.
- **Sapin, Bailleux & Chabrier (Complex Systems 17(3), 2007); Adamatzky, Sapin, Bull & Collet** [secondary]. GA over rules for glider-supporting CAs, then large-scale glider-gun discovery (https://wolframscience.com/conference/2007/presentations/EmmanuelSapin.html). Rule space again.
- **ConwayLife forum "Experimental genetic algorithm"** (ngaylinn, 2022), https://conwaylife.com/forums/viewtopic.php?p=154601. A hobby GA test bed on Life; I read only the announcement post, so its results are **unverified**.

## 2. How the Life community searches (and what brute force already solved)

- **apgsearch / Catagolue.** Adam Goucher's census runs random 16x16 soups at density 0.5 in an infinite plane and records every ash object. https://conwaylife.com/wiki/Catagolue lists at least 5.9e14 soups and 7.3e15 objects. That is your **random-search baseline at industrial scale, with the same 16x16 seed size as yours**, and it gives base rates (section 3).
- **Glider synthesis.** Building an object from glider collisions, catalogued by glider cost. https://conwaylife.com/wiki/Glider_synthesis. This is the engineered counterpart of seed search. The cheapest causes are a few gliders arriving from afar, which a 16x16 seed cannot hold, so synthesis costs are not comparable to your seed population.
- **Logic Life Search (LLS).** Oscar Cunningham's SAT-solver pattern finder. https://conwaylife.com/wiki/Logic_Life_Search. It is complete rather than stochastic, so it can prove that no pattern satisfies given constraints; it could certify a minimality claim for your contest.
- **Bellman.** Finds catalytic interactions directly from the rule. https://conwaylife.com/wiki/Bellman. About reactions that restore a catalyst; low relevance.
- **CatForce.** Michael Simkin, 2015: brute-force enumeration of small catalyst objects in a bounded area, to complete glider-constructible conduits [secondary; the LifeWiki page was not retrievable]. Low relevance.
- **gfind / ikpx.** gfind (David Eppstein) uses de Bruijn graphs to find new spaceships; ikpx (Goucher, 2018) extends partial spaceships and found Sir Robin. https://conwaylife.com/wiki/Gfind, https://conwaylife.com/wiki/Ikpx. They hunt for new objects, not seeds for known ones.

Take-away: reaching a glider, LWSS, pulsar or pentadecathlon from random seeds is a **heavily sampled, essentially solved** problem. A student GA contributes comparison methodology, not discovery.

## 3. Smallest seed that produces X

LifeWiki figures [verified, read directly]:

| Target | Cells | Known facts |
|---|---|---|
| Glider | 5 | Smallest spaceship; 4th most common object on Catagolue. https://conwaylife.com/wiki/Glider |
| LWSS | 9 | Smallest orthogonal spaceship; 18th most common object, yet random soups emitted about one LWSS per 615 gliders (Flammenkamp). Several 3-glider syntheses; "a different one-glider seed that fits inside a 12 x 12 square" (a blinker and an eater 1). https://conwaylife.com/wiki/Lightweight_spaceship |
| Pulsar | 48 | "The smallest pattern by population that evolves into a pulsar has seven cells; there are several of these" (example 3bo$o5bo$b2ob2o!). 3-glider synthesis. 21st most common object; 30% more common in 8x8 soups than 16x16. https://conwaylife.com/wiki/Pulsar |
| Pentadecathlon | 12 | "An orthogonal row of 10 cells evolves into this object", so a 10-cell seed beats the target's own 12. Syntheses with 5, 4 and 3 gliders (Koenig, 1997). 52nd most common object; more common in small soups and at low density, **less common on a torus**. https://conwaylife.com/wiki/Pentadecathlon |

Implications for the "fewest live cells" contest:
- Concrete reference points: pulsar 7 cells (target 48), pentadecathlon 10 (target 12). Your search can be scored against these.
- For glider and LWSS I found **no LifeWiki figure for a minimum-population predecessor**. Whether a seed below the target's own population exists for them is **unverified**; the target's population is the trivial upper bound (5 and 9).
- Glider-synthesis cost counts gliders, not cells. The best known upper bound on the cost of any synthesisable object is 15 gliders (Glider synthesis page).
- Wrapping changes every number. On a 64x64 torus gliders wrap and hit debris, and Wolper & Abraham's search exploited the torus ("wave oscillators"). Decide whether the board wraps and whether the target must be isolated or may sit amid other cells.

## 4. Encoding and fitness advice from the sources

- **Encoding.** Direct binary grids are the norm: Turney (seed matrix), Salo & Törmä (rectangles), the Kaggle GA. The one indirect encoding found, CPPN/NEAT, produced trivial or symmetric outputs, and its authors blamed the fitness, not the encoding.
- **2D crossover.** Salo & Törmä's row-wise crossover with Markov persistence is the only Life-specific operator found. General literature [secondary, search snippets only]: block-uniform crossover (Anderson, Jones & Ryan) beat standard crossovers on an Ising problem; Kahng & Moon argue flattening a mesh to a string loses adjacency and propose n-dimensional crossover; a rectangular-swap crossover in a graph-evolution study was only slightly better than none. The test to run is Jones's "headless chicken" ablation: swap one parent for a random individual; if results match, crossover is acting as macromutation (https://fluidinfo.com/research/ch-abs.html [secondary]).
- **Partial credit.** Turney uses +1/-1 overlap against a fixed target, which is not shift-invariant. Wolper & Abraham use lifetime and end-mass proxies. For "target appears somewhere at some step" you need your own best-match score over positions and generations; I found no source doing that for Life. The Kaggle score is a Hamming-style MAE.
- **Pitfalls documented.** Collapse to trivial attractors (blinkers, still lifes, lone gliders, torus-only wave oscillators) in Wolper & Abraham. They also warn that comparing end states is confounded by phase. Their novelty-search remedy for deception is a general NEAT idea. Evaluation cost is the practical limit: Alfonseca & Soler Gil's runs took over half an hour, and the Kaggle GA needed a compiled Life step.

## 5. Contrarian evidence

- **Mitchell, Holland & Forrest, "When Will a Genetic Algorithm Outperform Hill Climbing?", NIPS 1993** [verified, PDF read]. https://proceedings.neurips.cc/paper_files/paper/1993/file/ab88b15733f543179858600245108dd8-Paper.pdf. On the Royal Road function R1, random-mutation hill climbing (flip one random bit, keep if not worse) needed a mean 6,179 evaluations versus 61,334 for the GA, "nearly a factor of ten faster". Steepest- and next-ascent hill climbing never succeeded within 256,000. They attribute the GA's slowness partly to hitchhiking. This is a bitstring benchmark, not a CA, but it is the standard citation against the building-block story, and it shows "hill climbing" must be defined carefully (the accept-equal single-flip variant won; the other two failed).
- **Salo & Törmä**: the authors cannot say crossover helped on a Life task, and the hill-climber found most gadgets.
- **Turney** got good matches with no crossover at all.
- **Wolper & Abraham**: evolution beat random on lifetime, but fitness hit its maximum within one or two generations, which suggests the goals were easy. Catagolue frequencies back this: a glider is the 4th most common object from a random 16x16 soup.
- **Duke report**: SA failed, but over a continuous relaxation, so it does not condemn binary SA.
- **Building-block critique specific to 2D grids**: I found no source analysing schema disruption for 2D Life seeds. The Life-specific argument below is mine, not sourced: a glider or LWSS depends on a compact local arrangement, and one-point crossover on a row-major string cuts across rows, separating cells that must travel together.

## Not verified

Winners' methods in both Kaggle contests; the Medium GA's operators; Alfonseca & Soler Gil's encoding and operators; minimum-population predecessors for glider and LWSS; the CatForce LifeWiki page; any source scoring "target appears anywhere, at any step".
