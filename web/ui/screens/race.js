import { el, frame, backButton, targetById, toast } from "../dom.js";
import { targetPicker, budgetPicker, searcherChips, history, newRunSeed } from "../pickers.js";
import { SearchPane } from "../pane.js";
import { Chart } from "../chart.js";
import { loop } from "../board.js";
import { SEARCHERS } from "../../../search/index.js";

const MAIN = ["hill", "anneal", "ga"], MORE = ["gaUniform", "random"];

export default function race(root, [preset] = []) {
  let target = targetById(preset) || targetById("hwss");
  let budget = 1000;
  const chosen = new Set(MAIN);
  let showMore = false;
  let panes = [], chart = null, anim = null;

  const setup = el("div", { class: "grid" });
  const arena = el("div");
  const moreBox = el("div", { style: { display: "none" } }, searcherChips(chosen, MORE, () => {}));
  const startBtn = el("button", { class: "btn big", onclick: start }, "▶ Start race");

  setup.append(
    frame("1 · Target", el("div", { class: "pad" }, targetPicker(target.id, (t) => { target = t; }))),
    el("div", { class: "grid cols-2" },
      frame("2 · Racers", el("div", { class: "pad stack-s" },
        searcherChips(chosen, MAIN, () => {}),
        el("button", { class: "btn ghost", style: { justifySelf: "start" },
          onclick: (e) => { showMore = !showMore; moreBox.style.display = showMore ? "" : "none"; e.target.textContent = showMore ? "− fewer" : "+ more racers"; } }, "+ more racers"),
        moreBox,
        el("p", { class: "muted" }, "Random search always runs too, as the dashed baseline on the chart. Fewer racers = faster race."))),
      frame("3 · Budget", el("div", { class: "pad stack-s" },
        budgetPicker(budget, [300, 1000, 2000], (b) => { budget = b; }),
        el("p", { class: "muted" }, "Tries each racer may spend. Every racer starts from the same random seed and gets the same budget.")))),
    el("div", { class: "row", style: { justifyContent: "center" } }, startBtn));

  root.append(backButton("#/aisc"),
    el("div", { class: "wrap", style: { maxWidth: "1400px" } },
      el("div", { class: "stack-s rise", style: { margin: "40px 0 20px" } },
        el("h3", {}, "AISC project"), el("h1", {}, "Race"),
        el("p", { class: "lede" }, "Each pane replays the best seed its searcher has found so far. When a seed produces the target, the pane freezes on that moment with the shape framed.")),
      setup, arena));

  function start() {
    stop();
    const ids = [...chosen];
    const seed = newRunSeed();
    chart = new Chart(el("canvas", { class: "chart" }), budget);
    const done = () => { if (panes.every((p) => p.result)) finish(seed); };
    const cell = ids.length <= 2 ? 8 : ids.length === 3 ? 6 : 4;
    panes = ids.map((id) => new SearchPane({ searcher: id, target, budget, seed, chart, onDone: done, cell }));
    if (!chosen.has("random")) panes.push(new SearchPane({ searcher: "random", target, budget, seed, chart, onDone: done, visible: false }));

    const cols = Math.min(ids.length, 3);
    arena.replaceChildren(
      el("div", { class: "row", style: { margin: "28px 0 12px" } },
        el("h2", {}, `Target: ${target.name}`), el("span", { class: "muted" }, `budget ${budget} · run seed ${seed}`),
        el("span", { style: { flex: 1 } }),
        el("button", { class: "btn ghost", onclick: () => { stop(); toast("Race stopped"); } }, "■ Stop"),
        el("button", { class: "btn", onclick: start }, "↻ Rerun")),
      el("div", { class: "panes", style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } }, panes.filter((p) => p.node).map((p) => p.node)),
      el("div", { style: { marginTop: "18px" } }, frame("Best score vs tries",
        el("div", { class: "pad" }, chart.canvas,
          el("div", { class: "legend" }, panes.map((p) => el("span", { style: { "--c": p.s.colour } }, el("i"), p.s.name + (p.node ? "" : " (baseline)"))))))),
      el("div", { class: "results" }));
    arena.scrollIntoView({ behavior: "smooth", block: "start" });
    anim = loop(() => { panes.forEach((p) => p.frame(2)); chart.draw(); }, 30);
  }

  function finish(seed) {
    const rows = panes.map((p) => p.result).filter(Boolean);
    const ranked = [...rows].sort((a, b) => (b.hit - a.hit) || ((a.firstHitAt ?? 1e9) - (b.firstHitAt ?? 1e9)) || (b.bestFitness - a.bestFitness));
    history.add({ when: new Date().toISOString(), mode: "race", target: target.id, targetName: target.name, budget, seed,
      results: rows.map(({ searcher, hit, firstHitAt, spent, bestFitness, error }) => ({ searcher, hit, firstHitAt, spent, bestFitness, error })) });
    const box = arena.querySelector(".results");
    box.replaceChildren(el("div", { style: { marginTop: "18px" } }, frame("Result",
      el("div", { class: "pad" }, el("table", {},
        el("tr", {}, el("th", {}, "#"), el("th", {}, "Searcher"), el("th", {}, "Hit?"), el("th", {}, "Tries to hit"), el("th", {}, "Closest")),
        ranked.map((r, i) => el("tr", { style: { "--c": SEARCHERS[r.searcher].colour } },
          el("td", { class: "mono" }, i + 1),
          el("td", {}, el("span", { class: "legend" }, el("span", {}, el("i"), SEARCHERS[r.searcher].name))),
          el("td", {}, r.error ? "error" : r.hit ? "YES" : "no"),
          el("td", {}, r.hit ? r.firstHitAt : "—"),
          el("td", {}, `${(r.bestFitness * 100).toFixed(1)}%`)))),
        el("p", { class: "muted" }, "One race is one sample: luck matters. The Results page shows 20-run averages.")))));
  }

  function stop() { panes.forEach((p) => p.stop()); if (anim) anim.stop(); }
  return stop;
}
