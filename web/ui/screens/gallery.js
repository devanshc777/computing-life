import { el, go, frame, backButton } from "../dom.js";
import { Board, loop } from "../board.js";
import { CONWAY, HIGHLIFE } from "../../../engine/life.js";
import { TARGETS, EXHIBITS } from "../../../engine/patterns.js";

const SECTIONS = [
  { title: "Search targets", lede: "The shapes the AISC searchers hunt for, from common to very rare.",
    items: Object.entries(TARGETS).map(([id, t]) => ({ id, t, size: [26, 26], reset: 104,
      note: `Period ${t.period}. How often a random 16×16 seed makes it: ${t.rarity}.`, badge: t.rung })) },
  { title: "It makes copies", lede: "Patterns that build more of something, forever.",
    items: [
      { id: "gosperGun", t: EXHIBITS.gosperGun, size: [48, 30], reset: 150,
        note: "Fires a glider every 30 ticks. Found by Bill Gosper's team at MIT in 1970; it proved a pattern can grow without limit." },
      { id: "replicator", t: EXHIBITS.replicator, size: [48, 30], reset: 72, rule: HIGHLIFE,
        note: "Copies itself every 12 ticks — but under HighLife (B36/S23), a neighbouring universe. Conway-rule self-replicators exist (Gemini, 2010) but are far too large to show here.",
        badge: "different rule" },
    ] },
  { title: "Methuselahs", lede: "Tiny seeds that take a very long time to settle down.",
    items: [
      { id: "rPentomino", t: EXHIBITS.rPentomino, size: [64, 40], reset: 400, note: "5 cells. Runs for 1,103 generations before it stabilises." },
      { id: "acorn", t: EXHIBITS.acorn, size: [64, 40], reset: 400, note: "7 cells. Runs for 5,206 generations." },
      { id: "diehard", t: EXHIBITS.diehard, size: [40, 26], reset: 140, note: "7 cells. Vanishes completely after exactly 130 generations." },
    ] },
];

export default function gallery(root) {
  const live = [];
  const card = (it) => {
    const canvas = el("canvas", { class: "board" });
    const [w, h] = it.size;
    const board = new Board(canvas, { w, h, cell: 8, rule: it.rule || CONWAY });
    const reset = () => {
      board.clear();
      const cw = Math.max(...it.t.cells.map((c) => c[0])) + 1, ch = Math.max(...it.t.cells.map((c) => c[1])) + 1;
      board.place(it.t.cells, (w - cw) >> 1, (h - ch) >> 1);
    };
    reset(); board.draw();
    live.push({ board, reset, every: it.reset });
    return el("section", { class: "frame card clickable", tabindex: 0, role: "button",
      title: "Open in the sandbox", onclick: () => go(`#/sandbox/${it.id}`), onkeydown: (e) => e.key === "Enter" && go(`#/sandbox/${it.id}`) },
      el("div", { class: "titlebar" }, it.t.name),
      canvas,
      el("div", { class: "pad stack-s" },
        el("div", { class: "row" }, el("span", { class: "badge dim" }, it.t.kind), it.badge ? el("span", { class: "badge" }, it.badge) : null),
        el("p", {}, it.note)));
  };

  root.append(backButton("#/menu"),
    el("div", { class: "wrap" },
      el("div", { class: "stack-s rise", style: { margin: "40px 0 12px" } },
        el("h3", {}, "Limited demonstration"),
        el("h1", {}, "Gallery"),
        el("p", { class: "lede" }, "Everything here follows the same four rules. Click a card to open it in the sandbox.")),
      SECTIONS.map((s) => el("div", { style: { marginTop: "26px" } },
        el("h2", {}, s.title), el("p", { class: "muted" }, s.lede),
        el("div", { class: "grid cols-3" }, s.items.map(card))))));

  const l = loop(() => {
    for (const c of live) { c.board.tick(); if (c.board.generation >= c.every) c.reset(); c.board.draw(); }
  }, 10);
  return () => l.stop();
}
