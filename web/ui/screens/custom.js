import { el, frame, backButton, store, go, toast } from "../dom.js";
import { Board, loop, preview } from "../board.js";
import { classify, normalise } from "../../../engine/detect.js";

const N = 12;

export default function custom(root) {
  const canvas = el("canvas", { class: "board", style: { width: "100%", maxWidth: "420px", cursor: "crosshair" } });
  const board = new Board(canvas, { w: N, h: N, cell: 32, colour: "#3ee6f0" });
  const verdict = el("div", { class: "stack-s" });
  const name = el("input", { class: "btn ghost", style: { textTransform: "none", fontFamily: "var(--body)", fontSize: "22px" }, placeholder: "Name your shape", maxlength: 18 });
  const saved = el("div", { class: "grid cols-3" });
  let info = { kind: "empty" };

  const cells = () => [...board.world].flatMap((v, i) => (v ? [[i % N, (i / N) | 0]] : []));
  const analyse = () => {
    const cs = cells();
    info = cs.length ? classify(cs, 64) : { kind: "empty" };
    const ok = info.kind !== "empty";
    verdict.replaceChildren(...[
      el("h2", {}, ok ? info.kind.toUpperCase() : "DRAW A SHAPE"),
      el("p", {}, info.kind === "still life" ? "Never changes. Searchers just need to make it appear once."
        : info.kind === "oscillator" ? `Repeats every ${info.period} ticks. Matched in any of its phases.`
        : info.kind === "spaceship" ? `Travels across the grid, repeating every ${info.period} ticks.`
        : info.kind === "transient" ? `It ${info.note}. It only counts at the instant it exists, so it may be very hard or impossible to reach.`
        : "Click cells on the grid. Up to 12×12."),
      info.kind === "transient" ? el("span", { class: "badge warn", style: { justifySelf: "start" } }, "may be unreachable") : null,
      el("p", { class: "muted" }, `${cs.length} live cells`)].filter(Boolean));
  };
  board.enablePainting(analyse);

  const save = () => {
    const cs = cells();
    if (!cs.length) return toast("Draw something first");
    const list = store.get("custom", []);
    const id = `custom-${Date.now().toString(36)}`;
    list.unshift({ id, name: name.value.trim() || `Shape ${list.length + 1}`, kind: info.kind,
      period: info.period || 1, cells: normalise(cs), rarity: "unknown" });
    store.set("custom", list.slice(0, 8));
    toast("Saved — it now appears in every target picker");
    renderSaved();
    return id;
  };

  const renderSaved = () => {
    const list = store.get("custom", []);
    saved.replaceChildren(...(list.length ? list.map((t) => {
      const c = el("canvas", { style: { width: "72px", height: "72px" } });
      preview(c, t.cells, "#3ee6f0");
      return el("section", { class: "frame" }, el("div", { class: "pad row" }, c,
        el("div", { class: "stack-s" }, el("b", {}, t.name), el("span", { class: "muted" }, t.kind),
          el("div", { class: "row" },
            el("button", { class: "btn", onclick: () => go(`#/race/${t.id}`) }, "Race"),
            el("button", { class: "btn ghost", onclick: () => { store.set("custom", store.get("custom", []).filter((x) => x.id !== t.id)); renderSaved(); } }, "✕")))));
    }) : [el("p", { class: "muted" }, "No saved shapes yet.")]));
  };

  let playing = null;
  const play = () => {
    if (playing) { playing.stop(); playing = null; board.load(snapshot); board.draw(); playBtn.textContent = "▶ Preview"; return; }
    snapshot = board.world.slice();
    playBtn.textContent = "■ Stop";
    playing = loop(() => { board.tick(); board.draw(); }, 6);
  };
  let snapshot = null;
  const playBtn = el("button", { class: "btn ghost", onclick: play }, "▶ Preview");

  root.append(backButton("#/aisc"),
    el("div", { class: "wrap" },
      el("div", { class: "stack-s rise", style: { margin: "40px 0 20px" } },
        el("h3", {}, "AISC project"), el("h1", {}, "Custom target"),
        el("p", { class: "lede" }, "Draw a shape. It becomes a target the searchers can race for. Nobody knows how rare it is — the race will tell you.")),
      el("div", { class: "grid cols-2" },
        frame("Draw (12×12)", el("div", { class: "pad stack-s" }, canvas,
          el("div", { class: "row" }, playBtn, el("button", { class: "btn ghost", onclick: () => { board.clear(); board.draw(); analyse(); } }, "Clear")))),
        frame("What it is", el("div", { class: "pad stack-s" }, verdict, name,
          el("div", { class: "row" },
            el("button", { class: "btn", onclick: save }, "Save target"),
            el("button", { class: "btn", onclick: () => { const id = save(); if (id) go(`#/race/${id}`); } }, "Save + race ▶"))))),
      el("div", { style: { marginTop: "26px" } }, el("h2", {}, "Your shapes"), el("div", { style: { marginTop: "12px" } }, saved))));

  board.draw(); analyse(); renderSaved();
  return () => { if (playing) playing.stop(); };
}
