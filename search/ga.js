// Genetic algorithm. Generational, with elitism: each generation keeps the best `elite` seeds unchanged and
// fills the rest with children made by selection -> crossover -> mutation. The operators live in
// ga-operators.js; this file is only the loop.

import { randomSeed } from "./common.js";
import { tournamentSelect, blockCrossover, uniformCrossover, mutate } from "./ga-operators.js";

export function geneticAlgorithm({
  evaluate, rng, seedSize,
  populationSize = 20, elite = 2, tournament = 3, crossover = "block", mutationRate = 1 / 256,
}) {
  const cross = crossover === "uniform"
    ? (a, b) => uniformCrossover(a, b, rng)
    : (a, b) => blockCrossover(a, b, seedSize, rng);

  let population = [];
  for (let i = 0; i < populationSize; i++) {
    const bits = randomSeed(rng, seedSize);
    population.push({ bits, fitness: evaluate(bits) });
  }
  for (;;) {
    population.sort((x, y) => y.fitness - x.fitness);
    const next = population.slice(0, elite);
    while (next.length < populationSize) {
      const mother = tournamentSelect(population, tournament, rng);
      const father = tournamentSelect(population, tournament, rng);
      const child = mutate(cross(mother.bits, father.bits), mutationRate, rng);
      next.push({ bits: child, fitness: evaluate(child) });
    }
    population = next;
  }
}

export const geneticAlgorithmUniform = (opts) => geneticAlgorithm({ ...opts, crossover: "uniform" });
