// Named patterns, stored as RLE (the format LifeWiki and Golly use) and decoded to [x, y] cell lists.

export function parseRle(rle) {
  const body = rle.split("\n").filter((l) => !l.startsWith("#") && !/^\s*x\s*=/.test(l)).join("");
  const cells = [];
  let x = 0, y = 0, count = "";
  for (const ch of body) {
    if (ch >= "0" && ch <= "9") { count += ch; continue; }
    const n = count ? +count : 1;
    count = "";
    if (ch === "b" || ch === ".") x += n;
    else if (ch === "o" || ch === "O") { for (let i = 0; i < n; i++) cells.push([x + i, y]); x += n; }
    else if (ch === "$") { y += n; x = 0; }
    else if (ch === "!") break;
  }
  return cells;
}

export function toRle(cells) {
  if (!cells.length) return "!";
  const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1;
  const on = new Set(cells.map(([x, y]) => y * w + x));
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = "", run = 0, cur = null;
    const flush = () => { if (run) row += (run > 1 ? run : "") + cur; };
    for (let x = 0; x < w; x++) {
      const c = on.has(y * w + x) ? "o" : "b";
      if (c === cur) run++; else { flush(); cur = c; run = 1; }
    }
    if (cur === "o") flush();
    rows.push(row);
  }
  return `x = ${w}, y = ${h}, rule = B3/S23\n${rows.join("$")}!`;
}

const p = (name, kind, period, rle, extra = {}) => ({ name, kind, period, cells: parseRle(rle), rle, ...extra });

// Search targets (the ladder) plus sanity targets. Rarity = share of random 16×16 seeds that produced the object
// in our setup (research.md §3) or Catagolue's per-soup rate where ours was zero.
export const TARGETS = {
  glider: p("Glider", "spaceship", 4, "bo$2bo$3o!", { rarity: "3 in 4 random seeds", rung: "sanity" }),
  lwss: p("Lightweight spaceship", "spaceship", 4, "bo2bo$o4b$o3bo$4o!", { rarity: "~1 in 190", rung: "sanity" }),
  mwss: p("Middleweight spaceship", "spaceship", 4, "3bo2b$bo3bo$o5b$o4bo$5o!", { rarity: "~1 in 500", rung: "mid" }),
  hwss: p("Heavyweight spaceship", "spaceship", 4, "3b2o2b$bo4bo$o6b$o5bo$6o!", { rarity: "~1 in 1,500", rung: "contest" }),
  pulsar: p("Pulsar", "oscillator", 3,
    "2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!",
    { rarity: "~1 in 300", rung: "demo" }),
  pentadecathlon: p("Pentadecathlon", "oscillator", 15, "2bo4bo2b$2ob4ob2o$2bo4bo!",
    { rarity: "~1 in 60,000 (Catagolue)", rung: "contest" }),
  figureEight: p("Figure eight", "oscillator", 8, "3o3b$3o3b$3o3b$3b3o$3b3o$3b3o!",
    { rarity: "~1 in 1.7 million (Catagolue)", rung: "stretch" }),
};

// Gallery exhibits that are not search targets.
export const EXHIBITS = {
  gosperGun: p("Gosper glider gun", "gun", 30,
    "24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4bobo$10bo5bo7bo$11bo3bo$12b2o!"),
  replicator: p("Replicator (HighLife)", "replicator", 12, "2b3o$bo2bo$o3bo$o2bo$3o!", { rule: "B36/S23" }),
  rPentomino: p("R-pentomino", "methuselah", 1103, "b2o$2o$bo!"),
  acorn: p("Acorn", "methuselah", 5206, "bo5b$3bo3b$2o2b3o!"),
  diehard: p("Diehard", "methuselah", 130, "6bob$2o6b$bo3b3o!"),
  blinker: p("Blinker", "oscillator", 2, "3o!"),
  block: p("Block", "still life", 1, "2o$2o!"),
};
