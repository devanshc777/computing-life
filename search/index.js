// The searchers, with the colour each one wears everywhere in the UI.

import { randomSearch } from "./random.js";
import { hillClimb } from "./hill.js";
import { anneal } from "./anneal.js";
import { geneticAlgorithm, geneticAlgorithmUniform } from "./ga.js";

export const SEARCHERS = {
  random: { id: "random", name: "Random search", short: "RANDOM", colour: "#efe6d8", run: randomSearch,
    blurb: "A brand-new random seed every try. The baseline." },
  hill: { id: "hill", name: "Hill climbing", short: "HILL", colour: "#3ee6f0", run: hillClimb,
    blurb: "Flip one cell; keep it if the score did not drop. Restart when stuck." },
  anneal: { id: "anneal", name: "Simulated annealing", short: "ANNEAL", colour: "#ffb23e", run: anneal,
    blurb: "Like hill climbing, but sometimes accepts a worse seed early on, to escape dead ends." },
  ga: { id: "ga", name: "Genetic algorithm", short: "GA", colour: "#ff3fa4", run: geneticAlgorithm,
    blurb: "A population of seeds. The fittest breed: cut a block from one parent into another, then mutate." },
  gaUniform: { id: "gaUniform", name: "GA (uniform crossover)", short: "GA-U", colour: "#b98cff", run: geneticAlgorithmUniform,
    blurb: "Same GA, but children take each cell from either parent at random. Tests whether blocks matter." },
};
