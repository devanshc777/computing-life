// Shared choosers for targets, searchers and budgets, plus run-history storage.

import { el, allTargets, store, go } from "./dom.js";
import { preview } from "./board.js";
import { SEARCHERS } from "../../search/index.js";

export function targetPicker(selected, onChange) {
  const list = allTargets();
  const wrap = el("div", { class: "pick", role: "group", "aria-label": "Target" });
  const render = () => {
    wrap.replaceChildren(...list.map((t) => {
      const c = el("canvas");
      preview(c, t.cells, t.custom ? "#3ee6f0" : "#ff3fa4");
      return el("button", { "aria-pressed": String(t.id === selected), onclick: () => { selected = t.id; render(); onChange(t); } },
        c, t.custom ? `★ ${t.name}` : t.name, el("small", {}, t.custom ? "your shape" : t.rarity));
    }), el("button", { onclick: () => go("#/custom"), title: "Draw your own target" },
      el("div", { style: { width: "72px", height: "72px", display: "grid", placeItems: "center", fontSize: "28px", color: "#3ee6f0" } }, "+"),
      "Custom…", el("small", {}, "draw a shape")));
  };
  render();
  return wrap;
}

export function budgetPicker(value, options, onChange) {
  const seg = el("div", { class: "seg", role: "group", "aria-label": "Budget" });
  const render = () => seg.replaceChildren(...options.map((b) =>
    el("button", { "aria-pressed": String(b === value), onclick: () => { value = b; render(); onChange(b); } }, String(b))));
  render();
  return seg;
}

export function searcherChips(selected, ids, onChange, { single = false } = {}) {
  const wrap = el("div", { class: "chips", role: "group", "aria-label": "Searchers" });
  const render = () => wrap.replaceChildren(...ids.map((id) => {
    const s = SEARCHERS[id];
    return el("button", { class: "chip", style: { "--c": s.colour }, "aria-pressed": String(selected.has(id)), title: s.blurb,
      onclick: () => {
        if (single) { selected.clear(); selected.add(id); }
        else if (selected.has(id)) { if (selected.size > 2) selected.delete(id); }
        else selected.add(id);
        render(); onChange(selected);
      } }, s.short);
  }));
  render();
  return wrap;
}

export const history = {
  list: () => store.get("history", []),
  add(entry) { const h = [entry, ...history.list()].slice(0, 40); store.set("history", h); },
  clear: () => store.set("history", []),
};

export const newRunSeed = () => (Math.random() * 1e9) >>> 0;
