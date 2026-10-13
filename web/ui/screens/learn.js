import { el, go, frame, backButton } from "../dom.js";
import { tile } from "../board.js";

// Each rule: the 8 neighbours around a centre cell, whether the centre is alive now, and what happens next.
const RULES = [
  { n: "01", name: "Lonely", text: "A live cell with fewer than 2 live neighbours dies.", alive: 1, next: 0,
    on: [[1, -1]] },
  { n: "02", name: "Content", text: "A live cell with 2 or 3 live neighbours survives.", alive: 1, next: 1,
    on: [[-1, 0], [1, 1]] },
  { n: "03", name: "Crowded", text: "A live cell with more than 3 live neighbours dies.", alive: 1, next: 0,
    on: [[-1, -1], [0, -1], [1, -1], [1, 0]] },
  { n: "04", name: "Born", text: "An empty cell with exactly 3 live neighbours comes alive.", alive: 0, next: 1,
    on: [[-1, -1], [1, -1], [0, 1]] },
];

const HISTORY = [
  ["1970", "John Conway, a mathematician at Cambridge, settles on four rules after long experiments on a Go board."],
  ["OCT 1970", "Martin Gardner publishes the game in his Scientific American column. Readers start hunting for patterns by hand."],
  ["NOV 1970", "Bill Gosper's team at MIT finds the glider gun, winning Conway's $50 prize: a finite pattern can grow forever."],
  ["1982", "Berlekamp, Conway and Guy show that Life can, in principle, compute anything a computer can."],
  ["2010", "Gemini: the first pattern that builds a copy of itself under Conway's rules. It is enormous."],
  ["2015", "Catagolue begins: volunteers' computers run trillions of random 16×16 seeds and record what appears."],
  ["2020", "Conway dies in April 2020. He was famously ambivalent about being best known for this game."],
];

function drawRule(canvas, rule, showNext) {
  const cell = 32, g = canvas.getContext("2d");
  canvas.width = canvas.height = cell * 5;
  g.fillStyle = "#150822"; g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = "rgba(201,166,255,.12)";
  for (let i = 0; i <= 5; i++) { g.fillRect(i * cell, 0, 1, canvas.height); g.fillRect(0, i * cell, canvas.width, 1); }
  for (const [x, y] of rule.on) g.drawImage(tile("#c9a6ff", cell), (x + 2) * cell, (y + 2) * cell);
  const centre = showNext ? rule.next : rule.alive;
  if (centre) g.drawImage(tile(showNext ? "#ffb23e" : "#ff3fa4", cell), 2 * cell, 2 * cell);
  g.strokeStyle = "#3ee6f0"; g.lineWidth = 3; g.setLineDash([6, 4]);
  g.strokeRect(2 * cell + 1.5, 2 * cell + 1.5, cell - 3, cell - 3);
  g.setLineDash([]);
  g.fillStyle = "#f6e8ff"; g.font = "9px 'Press Start 2P'";
  g.fillText(showNext ? "NEXT" : "NOW", 6, 14);
}

export default function learn(root) {
  const canvases = [];
  root.append(backButton("#/menu"),
    el("div", { class: "wrap" },
      el("div", { class: "stack-s rise", style: { margin: "40px 0 24px" } },
        el("h3", {}, "How it works"),
        el("h1", {}, "A grid. Four rules. No player."),
        el("p", { class: "lede" }, "Every square is a cell, alive or dead. Each tick, every cell counts its 8 neighbours and all cells update ",
          "at once. That is the whole game. Everything else on this site comes out of these four rules.")),
      el("div", { class: "grid rules rise" }, RULES.map((r) => {
        const c = el("canvas"); canvases.push([c, r]);
        return frame(`Rule ${r.n} · ${r.name}`,
          el("div", { class: "pad rulecard" }, c,
            el("div", { class: "stack-s" }, el("span", { class: "num" }, r.n), el("p", {}, r.text),
              el("p", { class: "muted" }, `Neighbours: ${r.on.length}`))));
      })),
      el("div", { style: { marginTop: "28px" } }, frame("A short history",
        el("div", { class: "pad timeline" }, HISTORY.map(([when, what]) =>
          el("div", { class: "row", style: { alignItems: "baseline", flexWrap: "nowrap" } },
            el("span", { class: "when", style: { minWidth: "110px" } }, when), el("span", {}, what)))))),
      el("div", { class: "row", style: { marginTop: "28px", justifyContent: "center" } },
        el("button", { class: "btn big", onclick: () => go("#/sandbox") }, "Try it ▶ Sandbox"),
        el("button", { class: "btn big ghost", onclick: () => go("#/gallery") }, "See the gallery"))));

  let flip = false;
  const tick = () => { canvases.forEach(([c, r]) => drawRule(c, r, flip)); flip = !flip; };
  tick();
  document.fonts.ready.then(tick);
  const id = setInterval(tick, 1100);
  return () => clearInterval(id);
}
