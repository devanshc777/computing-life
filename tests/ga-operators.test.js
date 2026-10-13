// Contract tests for the GA operators in search/ga-operators.js.
// They fail until the operators exist; when they all pass, the GA works.

import test from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../engine/rng.js";
import { tournamentSelect, blockCrossover, uniformCrossover, mutate } from "../search/ga-operators.js";

const S = 16, N = S * S;
const zeros = () => new Uint8Array(N), ones = () => new Uint8Array(N).fill(1);

test("tournamentSelect returns a member of the population", () => {
  const rng = createRng(1);
  const pop = [0.1, 0.5, 0.9, 0.3].map((fitness, i) => ({ bits: zeros(), fitness, i }));
  for (let k = 0; k < 50; k++) assert.ok(pop.includes(tournamentSelect(pop, 3, rng)));
});

test("tournamentSelect with k = population size almost always picks the best", () => {
  const rng = createRng(2);
  const pop = Array.from({ length: 5 }, (_, i) => ({ bits: zeros(), fitness: i }));
  let best = 0;
  for (let k = 0; k < 200; k++) if (tournamentSelect(pop, 40, rng).fitness === 4) best++;
  assert.ok(best > 190, `picked the best ${best}/200 times`);
});

test("tournamentSelect with k = 1 is uniform random (picks the worst sometimes)", () => {
  const rng = createRng(3);
  const pop = Array.from({ length: 4 }, (_, i) => ({ bits: zeros(), fitness: i }));
  let worst = 0;
  for (let k = 0; k < 400; k++) if (tournamentSelect(pop, 1, rng).fitness === 0) worst++;
  assert.ok(worst > 60 && worst < 140, `picked the worst ${worst}/400 times`);
});

test("blockCrossover copies exactly one rectangle from B into A", () => {
  const rng = createRng(4);
  for (let trial = 0; trial < 100; trial++) {
    const a = zeros(), b = ones();
    const child = blockCrossover(a, b, S, rng);
    assert.equal(child.length, N);
    const taken = [];
    for (let i = 0; i < N; i++) if (child[i]) taken.push([i % S, (i / S) | 0]);
    assert.ok(taken.length >= 1, "rectangle must be at least 1×1");
    const xs = taken.map((c) => c[0]), ys = taken.map((c) => c[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    assert.equal(taken.length, w * h, "cells taken from B must form one solid rectangle");
  }
});

test("blockCrossover does not modify its parents", () => {
  const rng = createRng(5), a = zeros(), b = ones();
  blockCrossover(a, b, S, rng);
  assert.deepEqual(a, zeros()); assert.deepEqual(b, ones());
});

test("blockCrossover rectangles vary in size and position", () => {
  const rng = createRng(6), sizes = new Set();
  for (let t = 0; t < 50; t++) sizes.add(blockCrossover(zeros(), ones(), S, rng).reduce((s, v) => s + v, 0));
  assert.ok(sizes.size > 10);
});

test("uniformCrossover takes roughly half from each parent, only from the parents", () => {
  const rng = createRng(7), a = zeros(), b = ones();
  const child = uniformCrossover(a, b, rng);
  const fromB = child.reduce((s, v) => s + v, 0);
  assert.ok(fromB > 90 && fromB < 166, `took ${fromB}/256 from B`);
  const same = ones(); assert.deepEqual(uniformCrossover(same, ones(), rng), ones());
  assert.deepEqual(a, zeros()); assert.deepEqual(b, ones());
});

test("mutate flips about rate × cells, and never touches the input", () => {
  const rng = createRng(8), input = zeros();
  let flips = 0;
  for (let t = 0; t < 100; t++) flips += mutate(input, 4 / N, rng).reduce((s, v) => s + v, 0);
  assert.ok(flips > 300 && flips < 500, `~400 expected, got ${flips}`);
  assert.deepEqual(input, zeros());
  assert.deepEqual(mutate(input, 0, rng), zeros());
});
