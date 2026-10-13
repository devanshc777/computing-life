import { el, frame, backButton, toast } from "../dom.js";
import { history } from "../pickers.js";
import { SEARCHERS } from "../../../search/index.js";
import { TARGETS } from "../../../engine/patterns.js";

// "Then": the shipped benchmark (cli/run-experiments.mjs, 20 runs per searcher per target).
// "Now": races and single runs made in this browser.
export default function historyScreen(root) {
  const thenBox = el("div", { class: "pad" }, el("p", { class: "muted" }, "Loading benchmark…"));
  const nowBox = el("div", { class: "pad" });

  root.append(backButton("#/aisc"),
    el("div", { class: "wrap" },
      el("div", { class: "stack-s rise", style: { margin: "40px 0 20px" } },
        el("h3", {}, "AISC project"), el("h1", {}, "Results"),
        el("p", { class: "lede" }, "One race is one roll of the dice. The benchmark repeats every race 20 times with the same seeds for every searcher, so luck evens out.")),
      el("div", { class: "grid" }, frame("Then · the benchmark", thenBox), frame("Now · runs on this machine", nowBox))));

  fetch(new URL("../../data/benchmark.json", import.meta.url)).then((r) => (r.ok ? r.json() : Promise.reject())).then((data) => {
    const byTarget = {};
    for (const r of data.results) (byTarget[r.target] ??= {})[r.searcher] ??= [], byTarget[r.target][r.searcher].push(r);
    thenBox.replaceChildren(
      el("p", { class: "muted" }, `${data.runs} runs × ${data.searchers.length} searchers · budget ${data.budget} tries · ${new Date(data.created).toDateString()}`),
      ...Object.entries(byTarget).map(([tid, bySearcher]) => el("div", { style: { marginTop: "16px" } },
        el("h2", {}, TARGETS[tid]?.name || tid),
        el("table", {},
          el("tr", {}, el("th", {}, "Searcher"), el("th", { style: { width: "45%" } }, "Runs that hit"), el("th", {}, "Median tries to hit")),
          Object.entries(bySearcher).sort(([a], [b]) => Object.keys(SEARCHERS).indexOf(a) - Object.keys(SEARCHERS).indexOf(b)).map(([sid, rs]) => {
            const hits = rs.filter((r) => r.hit).map((r) => r.firstHitAt).sort((a, b) => a - b);
            const share = hits.length / rs.length;
            return el("tr", { style: { "--c": SEARCHERS[sid].colour } },
              el("td", {}, el("span", { class: "legend" }, el("span", {}, el("i"), SEARCHERS[sid].name))),
              el("td", {}, el("div", { class: "row", style: { flexWrap: "nowrap" } },
                el("div", { class: "bar", style: { width: `${Math.max(2, share * 100)}%` } }), el("span", { class: "mono" }, `${hits.length}/${rs.length}`))),
              el("td", {}, hits.length ? hits[hits.length >> 1] : "—"));
          })))),
      el("p", { class: "lede", style: { marginTop: "18px" } },
        "The twist: random search kept up with everyone. Partial credit gets every searcher to 95–99% of the shape, " +
        "but in a chaotic system \"almost\" does not predict \"exactly\". Guided search hits sooner when it hits; " +
        "block crossover beats uniform. The fitness signal matters more than the algorithm."));
  }).catch(() => thenBox.replaceChildren(el("p", { class: "muted" }, "No benchmark shipped yet. Run: node cli/run-experiments.mjs, then copy results/benchmark.json to web/data/.")));

  const renderNow = () => {
    const list = history.list();
    nowBox.replaceChildren(...[
      list.length ? el("table", {},
        el("tr", {}, el("th", {}, "When"), el("th", {}, "Mode"), el("th", {}, "Target"), el("th", {}, "Budget"), el("th", {}, "Results")),
        list.map((h) => el("tr", {},
          el("td", {}, new Date(h.when).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })),
          el("td", { class: "mono" }, h.mode), el("td", {}, h.targetName), el("td", {}, h.budget),
          el("td", {}, el("div", { class: "chips" }, h.results.map((r) => el("span", { class: "chip", "aria-pressed": String(!!r.hit),
            style: { "--c": SEARCHERS[r.searcher]?.colour || "#fff", cursor: "default" } },
            `${SEARCHERS[r.searcher]?.short || r.searcher} ${r.error ? "ERR" : r.hit ? "#" + r.firstHitAt : "✕"}`)))))))
        : el("p", { class: "muted" }, "Nothing yet. Run a race and it will appear here."),
      list.length ? el("button", { class: "btn ghost", style: { marginTop: "14px" }, onclick: () => { history.clear(); renderNow(); toast("History cleared"); } }, "Clear history") : null].filter(Boolean));
  };
  renderNow();
}
