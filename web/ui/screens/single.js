import { el, frame, backButton, targetById } from "../dom.js";
import { targetPicker, budgetPicker, searcherChips, history, newRunSeed } from "../pickers.js";
import { SearchPane } from "../pane.js";
import { Chart } from "../chart.js";
import { loop } from "../board.js";
import { SEARCHERS } from "../../../search/index.js";

export default function single(root, [preset] = []) {
  let target = targetById(preset) || targetById("hwss");
  let budget = 1000;
  const chosen = new Set(["ga"]);
  let pane = null, chart = null, anim = null;

  const blurb = el("p", { class: "muted" }, SEARCHERS.ga.blurb);
  const arena = el("div");

  root.append(backButton("#/aisc"),
    el("div", { class: "wrap" },
      el("div", { class: "stack-s rise", style: { margin: "40px 0 20px" } },
        el("h3", {}, "AISC project"), el("h1", {}, "Single run"),
        el("p", { class: "lede" }, "One searcher against one target. The board replays the best seed it has found so far; the chart shows its score climbing.")),
      el("div", { class: "grid" },
        el("div", { class: "grid cols-2" },
          frame("1 · Searcher", el("div", { class: "pad stack-s" },
            searcherChips(chosen, Object.keys(SEARCHERS), (s) => { blurb.textContent = SEARCHERS[[...s][0]].blurb; }, { single: true }), blurb)),
          frame("3 · Budget", el("div", { class: "pad stack-s" },
            budgetPicker(budget, [300, 1000, 2000], (b) => { budget = b; }),
            el("p", { class: "muted" }, "How many seeds it may try.")))),
        frame("2 · Target", el("div", { class: "pad" }, targetPicker(target.id, (t) => { target = t; }))),
        el("div", { class: "row", style: { justifyContent: "center" } }, el("button", { class: "btn big", onclick: start }, "▶ Run"))),
      arena));

  function start() {
    stop();
    const id = [...chosen][0], seed = newRunSeed();
    chart = new Chart(el("canvas", { class: "chart", style: { height: "100%", minHeight: "320px" } }), budget);
    pane = new SearchPane({ searcher: id, target, budget, seed, chart, cell: 8, onDone: (p) => {
      const r = p.result;
      history.add({ when: new Date().toISOString(), mode: "single", target: target.id, targetName: target.name, budget, seed,
        results: [{ searcher: r.searcher || id, hit: r.hit, firstHitAt: r.firstHitAt, spent: r.spent, bestFitness: r.bestFitness, error: r.error }] });
    } });
    arena.replaceChildren(
      el("div", { class: "row", style: { margin: "28px 0 12px" } },
        el("h2", {}, `${SEARCHERS[id].name} → ${target.name}`), el("span", { class: "muted" }, `budget ${budget} · run seed ${seed}`),
        el("span", { style: { flex: 1 } }),
        el("button", { class: "btn ghost", onclick: stop }, "■ Stop"), el("button", { class: "btn", onclick: start }, "↻ Rerun")),
      el("div", { class: "grid", style: { gridTemplateColumns: "minmax(0, 520px) minmax(0, 1fr)", alignItems: "stretch" } },
        pane.node,
        frame("Best score vs tries", el("div", { class: "pad", style: { height: "calc(100% - 30px)" } }, chart.canvas))));
    arena.scrollIntoView({ behavior: "smooth", block: "start" });
    anim = loop(() => { pane.frame(2); chart.draw(); }, 30);
  }

  function stop() { if (pane) pane.stop(); if (anim) anim.stop(); }
  return stop;
}
