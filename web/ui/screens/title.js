import { el, go } from "../dom.js";
import { Board, loop } from "../board.js";
import { EXHIBITS } from "../../../engine/patterns.js";

export default function title(root) {
  const canvas = el("canvas", { class: "bg board" });
  const cell = 10;
  const board = new Board(canvas, { w: Math.ceil(innerWidth / cell), h: Math.ceil(innerHeight / cell), cell, grid: false });
  board.randomise(0.18);
  board.place(EXHIBITS.acorn.cells, board.w >> 1, board.h >> 1);

  const start = () => go("#/menu");
  root.append(el("div", { class: "title" }, canvas,
    el("div", { class: "stack rise" },
      el("div", { class: "subtitle" }, "Conway's Game of Life × search algorithms"),
      el("div", { class: "logo", "aria-label": "Computing Life" }, "COMPUTING", el("span", {}, "LIFE")),
      el("ul", { class: "menu title-menu", style: { justifyItems: "start" } },
        el("li", {}, el("button", { onclick: start, autofocus: true }, "Start")),
        el("li", {}, el("button", { onclick: () => go("#/aisc") }, "AISC project"))),
      el("div", { class: "press" }, "PRESS ENTER"),
      el("div", { class: "credit" }, "© 2026 DEVANSH CHOWDHARY · AI & SOFT COMPUTING"))));

  const onKey = (e) => { if (e.key === "Enter" && !e.target.closest("button")) start(); };
  addEventListener("keydown", onKey);
  root.querySelector(".menu button").focus();
  const l = loop(() => { board.tick(); if (board.generation % 600 === 0) board.randomise(0.18); board.draw(); }, 12);
  board.draw();
  return () => { l.stop(); removeEventListener("keydown", onKey); };
}
