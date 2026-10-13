// One searcher at work: a worker runs the search; the pane replays the best seed found so far on a loop
// and frames the target when it appears. A hit freezes on the moment the target exists; REPLAY plays it again.

import { el } from "./dom.js";
import { Board } from "./board.js";
import { placeSeed } from "../../engine/life.js";
import { buildTemplates } from "../../engine/detect.js";
import { locate } from "../../engine/locate.js";
import { SEARCHERS } from "../../search/index.js";

const WORLD = 64, SEED = 16;

export class SearchPane {
  constructor({ searcher, target, budget, seed, chart, onDone, visible = true, cell = 6 }) {
    this.s = SEARCHERS[searcher];
    this.target = target;
    this.budget = budget;
    this.chart = chart;
    this.onDone = onDone;
    this.templates = buildTemplates(target.cells, target.period || 1);
    this.bestBits = null; this.bestHit = false; this.hitStep = null;
    this.result = null;
    this.frozen = false;
    this.replayLength = 240;

    this.spentEl = el("b", {}, "0"); this.bestEl = el("b", {}, "—"); this.hitEl = el("b", {}, "—");
    this.note = el("div", { class: "note" }, "Searching…");
    const canvas = el("canvas", { class: "board" });
    this.board = new Board(canvas, { w: WORLD, h: WORLD, cell, colour: this.s.colour });
    this.node = visible ? el("section", { class: "frame pane", style: { "--c": this.s.colour } },
      el("div", { class: "titlebar" }, this.s.name, el("span", { class: "sq" }, el("i"), el("i"), el("i"))),
      el("div", { class: "board-wrap" }, canvas),
      el("div", { class: "stats" },
        el("div", {}, "TRIES", this.spentEl), el("div", {}, "BEST", this.bestEl), el("div", {}, "HIT AT", this.hitEl)),
      this.note) : null;
    if (chart) chart.add(searcher, { colour: this.s.colour, label: this.s.name, dashed: searcher === "random" });

    this.worker = new Worker(new URL("../worker.js", import.meta.url), { type: "module" });
    this.worker.onmessage = (e) => this.message(e.data);
    this.worker.postMessage({ searcher, target: target.id, run: 0, seed, budget,
      custom: target.custom ? { cells: target.cells, period: target.period || 1 } : null });
  }

  message(m) {
    if (m.type === "progress") {
      this.spentEl.textContent = m.spent;
      this.bestEl.textContent = m.bestFitness.toFixed(3);
      if (this.chart) this.chart.push(this.s.id, m.spent, m.bestFitness);
      if (m.bestBits) this.showSeed(m.bestBits, m.bestHit, m.hitStep);
      if (m.firstHitAt !== null && this.hitEl.textContent === "—") {
        this.hitEl.textContent = `#${m.firstHitAt}`;
        if (this.chart) this.chart.hit(this.s.id, m.firstHitAt);
      }
    } else if (m.type === "done") {
      this.result = m.result;
      this.worker.terminate();
      this.spentEl.textContent = m.result.spent;
      if (m.result.hit) {
        this.note.textContent = `Found ${this.target.name} after ${m.result.firstHitAt} tries. Frozen on the step it appears; ↻ Replay to watch it form.`;
        if (this.node) this.node.querySelector(".board-wrap").append(
          el("div", { class: "hitflag" }, "HIT!"),
          el("button", { class: "btn replay", onclick: () => this.restartReplay() }, "↻ Replay"));
      } else {
        this.note.textContent = `No hit in ${m.result.spent} tries. Closest: ${(m.result.bestFitness * 100).toFixed(1)}% of the way.`;
      }
      if (this.chart) this.chart.push(this.s.id, m.result.spent, m.result.bestFitness);
      this.onDone && this.onDone(this);
    } else if (m.type === "error") {
      this.worker.terminate();
      this.result = { searcher: this.s.id, error: m.message, hit: false, spent: 0, bestFitness: 0 };
      if (this.node) this.node.classList.add("error");
      this.note.textContent = /not written yet/.test(m.message)
        ? "GA operators not written yet → search/ga-operators.js"
        : `Error: ${m.message}`;
      this.onDone && this.onDone(this);
    }
  }

  showSeed(bits, hit, hitStep) {
    this.bestBits = bits; this.bestHit = hit; this.hitStep = hitStep;
    this.replayLength = hit ? Math.min(1000, hitStep + 80) : 240;
    this.restartReplay();
  }

  restartReplay() {
    if (!this.bestBits) return;
    this.board.load(placeSeed(this.bestBits, SEED, WORLD, WORLD));
    this.board.box = null;
    this.frozen = false;
  }

  // Called by the screen's animation loop.
  frame(stepsPerFrame = 2) {
    if (!this.bestBits || this.frozen) return;
    for (let i = 0; i < stepsPerFrame; i++) {
      if (this.bestHit && this.board.generation >= this.hitStep) break;
      this.board.tick();
      if (!this.bestHit && this.board.generation >= this.replayLength) this.restartReplay();
    }
    if (this.bestHit && this.board.generation >= this.hitStep) {
      const box = locate(this.board.world, WORLD, WORLD, this.templates);
      this.board.box = box ? { ...box, colour: "#ffffff" } : null;
      this.frozen = true;
    }
    this.board.draw();
  }

  stop() { this.worker.terminate(); }
}
