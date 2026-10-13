import { el, backButton, toast } from "../dom.js";
import { Board, loop } from "../board.js";
import { CONWAY, HIGHLIFE } from "../../../engine/life.js";
import { TARGETS, EXHIBITS } from "../../../engine/patterns.js";

export default function sandbox(root, [preset] = []) {
  const cell = innerWidth < 800 ? 7 : 9;
  const canvas = el("canvas", { class: "board" });
  const w = Math.floor((innerWidth - 40) / cell), h = Math.floor((innerHeight - 200) / cell);
  const board = new Board(canvas, { w, h, cell });
  const presets = { ...TARGETS, ...EXHIBITS };
  if (presets[preset]) {
    const p = presets[preset];
    const pw = Math.max(...p.cells.map((c) => c[0])) + 1, ph = Math.max(...p.cells.map((c) => c[1])) + 1;
    board.place(p.cells, (w - pw) >> 1, (h - ph) >> 1);
    if (p.rule === "B36/S23") board.rule = HIGHLIFE;
  } else board.randomise(0.25);

  let running = false, speed = 15, stamp = null;
  const stat = el("div", { class: "overlay-stat" });
  const playBtn = el("button", { class: "btn" }, "▶ Run");
  const setRunning = (v) => { running = v; playBtn.textContent = v ? "❚❚ Pause" : "▶ Run"; };
  const update = () => { stat.innerHTML = `GEN ${board.generation}<br>POP ${board.population}<br>${board.rule.text}`; };

  const patterns = { ...TARGETS, ...EXHIBITS };
  const select = el("select", { class: "btn ghost", "aria-label": "Place a pattern" },
    el("option", { value: "" }, "Place pattern…"),
    Object.entries(patterns).map(([id, p]) => el("option", { value: id }, p.name)));
  select.addEventListener("change", () => {
    stamp = patterns[select.value] || null;
    if (stamp) toast(`Click the grid to place: ${stamp.name}`);
  });

  canvas.addEventListener("pointerdown", (ev) => {
    if (!stamp) return;
    const c = board.cellAt(ev);
    if (c) { board.place(stamp.cells, c.x, c.y); if (stamp.rule) { board.rule = stamp.rule === "B36/S23" ? HIGHLIFE : CONWAY; ruleBtn.textContent = `Rule: ${board.rule.text}`; toast("Switched to HighLife (B36/S23) for the replicator"); } board.draw(); update(); }
    stamp = null; select.value = "";
    ev.stopImmediatePropagation();
  }, true);
  board.enablePainting(update);

  const density = el("input", { type: "range", min: 5, max: 60, value: 25, class: "range", "aria-label": "Random density" });
  const speedIn = el("input", { type: "range", min: 1, max: 60, value: speed, class: "range", "aria-label": "Speed" });
  speedIn.addEventListener("input", () => { speed = +speedIn.value; });
  const ruleBtn = el("button", { class: "btn ghost", title: "Switch between Conway's rules and HighLife" }, `Rule: ${board.rule.text}`);
  ruleBtn.addEventListener("click", () => {
    board.rule = board.rule === CONWAY ? HIGHLIFE : CONWAY;
    ruleBtn.textContent = `Rule: ${board.rule.text}`; update();
  });

  playBtn.addEventListener("click", () => setRunning(!running));
  root.append(backButton("#/menu"),
    el("div", { class: "topbar" },
      el("h1", {}, "Sandbox"),
      el("span", { class: "muted" }, "Draw with the mouse · SPACE run · N step · R random · C clear"),
      el("span", { class: "spacer" })),
    el("div", { class: "toolbar", style: { padding: "10px 14px" } },
      playBtn,
      el("button", { class: "btn ghost", onclick: () => { board.tick(); board.draw(); update(); } }, "Step"),
      el("button", { class: "btn ghost", onclick: () => { board.randomise(density.value / 100); board.draw(); update(); } }, "Random"),
      el("label", { class: "mono" }, "Density ", density),
      el("button", { class: "btn ghost", onclick: () => { board.clear(); board.draw(); update(); } }, "Clear"),
      el("label", { class: "mono" }, "Speed ", speedIn),
      ruleBtn, select),
    el("div", { class: "board-wrap", style: { padding: "0 14px" } }, canvas, stat));

  const onKey = (e) => {
    if (e.target.closest("input, select")) return;
    if (e.key === " ") { setRunning(!running); e.preventDefault(); }
    if (e.key === "n" || e.key === "N") { board.tick(); board.draw(); update(); }
    if (e.key === "r" || e.key === "R") { board.randomise(density.value / 100); board.draw(); update(); }
    if (e.key === "c" || e.key === "C") { board.clear(); board.draw(); update(); }
  };
  addEventListener("keydown", onKey);
  const l = loop(() => { if (running) { board.tick(); board.draw(); update(); } }, () => speed);
  board.draw(); update();
  return () => { l.stop(); removeEventListener("keydown", onKey); };
}
