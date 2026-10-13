// Known-answer tests: each one checks something whose right answer we know independently.

import test from "node:test";
import assert from "node:assert/strict";
import { step, stamp, population, CONWAY, HIGHLIFE, placeSeed, hash } from "../engine/life.js";
import { TARGETS, EXHIBITS, parseRle, toRle } from "../engine/patterns.js";
import { buildTemplates, bestMismatch, contains, classify, evolveOpen, normalise } from "../engine/detect.js";

const W = 64, H = 64;
const world = () => new Uint8Array(W * H);
function run(g, n, rule = CONWAY, w = W, h = H) {
  let a = g, b = new Uint8Array(a.length);
  for (let i = 0; i < n; i++) { step(a, b, w, h, rule); [a, b] = [b, a]; }
  return a;
}
const cellsOf = (g, w = W) => [...g].flatMap((v, i) => (v ? [[i % w, (i / w) | 0]] : []));

test("glider moves one cell diagonally every 4 generations", () => {
  const g = stamp(world(), W, H, TARGETS.glider.cells, 10, 10);
  const after = cellsOf(run(g, 4));
  const before = TARGETS.glider.cells.map(([x, y]) => [x + 11, y + 11]);
  assert.deepEqual(normalise(after), normalise(before));
  assert.equal(Math.min(...after.map((c) => c[0])), Math.min(...before.map((c) => c[0])));
});

test("glider wraps around the torus edge and survives", () => {
  const g = stamp(world(), W, H, TARGETS.glider.cells, 62, 62);
  assert.equal(population(run(g, 40)), 5);
});

test("blinker has period 2", () => {
  const g = stamp(world(), W, H, EXHIBITS.blinker.cells, 30, 30);
  assert.deepEqual(run(g.slice(), 2), g);
  assert.notDeepEqual(run(g.slice(), 1), g);
});

test("every target returns to its own shape after its period (catches a bad RLE)", () => {
  for (const [id, t] of Object.entries(TARGETS)) {
    const k = classify(t.cells, 40);
    assert.ok(k.kind === "oscillator" || k.kind === "spaceship", `${id} classified ${k.kind}`);
    assert.equal(k.period, t.period, `${id} period`);
  }
});

test("diehard dies at generation 130", () => {
  const big = 200;
  const g = stamp(new Uint8Array(big * big), big, big, EXHIBITS.diehard.cells, 90, 90);
  assert.ok(population(run(g.slice(), 129, CONWAY, big, big)) > 0);
  assert.equal(population(run(g.slice(), 130, CONWAY, big, big)), 0);
});

test("Gosper gun adds one glider (5 cells) every 30 generations", () => {
  const big = 160;
  const g = stamp(new Uint8Array(big * big), big, big, EXHIBITS.gosperGun.cells, 20, 20);
  const p30 = population(run(g.slice(), 30, CONWAY, big, big));
  const p60 = population(run(g.slice(), 60, CONWAY, big, big));
  assert.equal(p60 - p30, 5);
});

test("HighLife replicator makes two copies of itself after 12 generations", () => {
  const after = evolveOpen(EXHIBITS.replicator.cells, 12, HIGHLIFE);
  assert.equal(after.length, EXHIBITS.replicator.cells.length * 2);
});

test("RLE round-trips", () => {
  for (const t of Object.values(TARGETS)) assert.deepEqual(normalise(parseRle(toRle(t.cells))), normalise(t.cells));
});

test("detector finds every target in every orientation and phase, anywhere, including across the edge", () => {
  for (const [id, t] of Object.entries(TARGETS)) {
    const templates = buildTemplates(t.cells, t.period);
    for (const pos of [[20, 20], [W - 3, H - 2]]) {
      let phase = t.cells;
      for (let p = 0; p < t.period; p++) {
        for (const flip of [(c) => c, ([x, y]) => [y, -x], ([x, y]) => [-x, y]]) {
          const cells = normalise(phase.map(flip));
          const g = stamp(world(), W, H, cells, pos[0], pos[1]);
          assert.ok(contains(g, W, H, templates), `${id} phase ${p} at ${pos}`);
        }
        phase = evolveOpen(phase, 1);
      }
    }
  }
});

test("detector rejects a near miss and reports the exact mismatch", () => {
  const t = TARGETS.hwss, templates = buildTemplates(t.cells, t.period);
  const g = stamp(world(), W, H, t.cells, 20, 20);
  g[20 * W + 20] ^= 1; // one cell wrong
  assert.equal(contains(g, W, H, templates), false);
  assert.equal(bestMismatch(g, W, H, templates), 1);
});

test("detector rejects a target that is touching something (not isolated)", () => {
  const t = TARGETS.glider, templates = buildTemplates(t.cells, t.period);
  const g = stamp(world(), W, H, t.cells, 20, 20);
  g[19 * W + 19] = 1; // diagonal neighbour of the glider's bounding box
  assert.equal(contains(g, W, H, templates), false);
});

test("empty world contains nothing", () => {
  assert.equal(contains(world(), W, H, buildTemplates(TARGETS.glider.cells, 4)), false);
});

test("classify labels drawn shapes", () => {
  assert.equal(classify(EXHIBITS.block.cells).kind, "still life");
  assert.equal(classify(TARGETS.glider.cells).kind, "spaceship");
  assert.equal(classify(EXHIBITS.blinker.cells).period, 2);
  assert.equal(classify([[0, 0], [1, 0]]).kind, "transient");
});

test("placeSeed centres the seed and hash differs for different worlds", () => {
  const bits = new Uint8Array(256); bits[0] = 1;
  const g = placeSeed(bits, 16, W, H);
  assert.equal(g[24 * W + 24], 1);
  assert.notEqual(hash(g), hash(world()));
});
