// PROTOTYPE, throwaway. Answers two viability questions before the real build:
//   1. How many seed evaluations per second can plain JS do on a 64x64 torus?
//   2. How often does each candidate target object appear from random 16x16 seeds, in OUR setup
//      (64x64 torus, any step up to the cap)? That sets the target ladder and the search budget.
// Run: node prototypes/PROTOTYPE-census.mjs [soups] [density] [seed]
// Writes nothing; prints a table.

const W = 64, H = 64, SEED = 16, CAP = 1000, SCAN_EVERY = +(process.env.SCAN_EVERY ?? 4);
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const SOUPS = +(process.argv[2] ?? 1000);
const DENSITY = +(process.argv[3] ?? 0.5);
let rngState = (+(process.argv[4] ?? 12345)) >>> 0;
const rand = () => {
  // mulberry32: seeded so every run is reproducible
  rngState = (rngState + 0x6D2B79F5) >>> 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------- Life on a torus ----------
function step(src, dst) {
  for (let y = 0; y < H; y++) {
    const yu = ((y + H - 1) % H) * W, y0 = y * W, yd = ((y + 1) % H) * W;
    for (let x = 0; x < W; x++) {
      const xl = (x + W - 1) % W, xr = (x + 1) % W;
      const n = src[yu + xl] + src[yu + x] + src[yu + xr] + src[y0 + xl] + src[y0 + xr]
              + src[yd + xl] + src[yd + x] + src[yd + xr];
      const alive = src[y0 + x];
      dst[y0 + x] = (n === 3 || (alive && n === 2)) ? 1 : 0;
    }
  }
}
function hash(g) {
  let h = 0x811c9dc5;
  for (let i = 0; i < g.length; i++) { h ^= g[i]; h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

// ---------- target templates ----------
const CANON = {
  block: ["OO", "OO"],
  blinker: ["OOO"],
  beehive: [".OO.", "O..O", ".OO."],
  glider: [".O.", "..O", "OOO"],
  toad: [".OOO", "OOO."],
  beacon: ["OO..", "OO..", "..OO", "..OO"],
  LWSS: [".O..O", "O....", "O...O", "OOOO."],
  MWSS: ["...O..", ".O...O", "O.....", "O....O", "OOOOO."],
  HWSS: ["...OO..", ".O....O", "O......", "O.....O", "OOOOOO."],
  pulsar: ["..OOO...OOO..", ".............", "O....O.O....O", "O....O.O....O", "O....O.O....O",
           "..OOO...OOO..", ".............", "..OOO...OOO..", "O....O.O....O", "O....O.O....O",
           "O....O.O....O", ".............", "..OOO...OOO.."],
  pentadecathlon: ["..O....O..", "OO.OOOO.OO", "..O....O.."],
};
const PERIOD = { block: 1, blinker: 2, beehive: 1, glider: 4, toad: 2, beacon: 2, LWSS: 4, MWSS: 4, HWSS: 4,
                 pulsar: 3, pentadecathlon: 15 };

const toCells = rows => rows.flatMap((r, y) => [...r].flatMap((c, x) => (c === "O" ? [[x, y]] : [])));
function crop(cells) {
  const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
  const mx = Math.min(...xs), my = Math.min(...ys);
  return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
function evolvePlane(cells, n) {
  // non-wrapping plane big enough for any phase of these small objects
  const S = 60, off = 20;
  let a = new Uint8Array(S * S), b = new Uint8Array(S * S);
  for (const [x, y] of cells) a[(y + off) * S + x + off] = 1;
  for (let k = 0; k < n; k++) {
    for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) s += a[(y + dy) * S + x + dx];
      b[y * S + x] = (s === 3 || (a[y * S + x] && s === 2)) ? 1 : 0;
    }
    [a, b] = [b, a];
  }
  const out = [];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (a[y * S + x]) out.push([x, y]);
  return out;
}
const SYMS = [([x, y]) => [x, y], ([x, y]) => [-x, y], ([x, y]) => [x, -y], ([x, y]) => [-x, -y],
              ([x, y]) => [y, x], ([x, y]) => [-y, x], ([x, y]) => [y, -x], ([x, y]) => [-y, -x]];

function buildTemplates(name) {
  const seen = new Map();
  for (let p = 0; p < PERIOD[name]; p++) {
    const phase = evolvePlane(toCells(CANON[name]), p);
    for (const f of SYMS) {
      const cells = crop(phase.map(f));
      const key = JSON.stringify(cells);
      if (seen.has(key)) continue;
      const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1;
      const mask = new Uint8Array(w * h);
      for (const [x, y] of cells) mask[y * w + x] = 1;
      // anchor = first live cell in row-major order; we only try positions where that cell is alive
      seen.set(key, { w, h, mask, ax: cells[0][0], ay: cells[0][1] });
    }
  }
  return [...seen.values()];
}
const TEMPLATES = Object.fromEntries(Object.keys(CANON).filter(n => !ONLY || ONLY.includes(n)).map(n => [n, buildTemplates(n)]));

function matchesAt(g, t, ox, oy) {
  // template window plus a one-cell dead ring = an isolated copy of the object
  for (let y = -1; y <= t.h; y++) for (let x = -1; x <= t.w; x++) {
    const inside = x >= 0 && y >= 0 && x < t.w && y < t.h;
    const want = inside ? t.mask[y * t.w + x] : 0;
    const gx = (ox + x + W) % W, gy = (oy + y + H) % H;
    if (g[gy * W + gx] !== want) return false;
  }
  return true;
}
function scan(g, found, stepNo) {
  const live = [];
  for (let i = 0; i < g.length; i++) if (g[i]) live.push(i);
  for (const name in TEMPLATES) {
    if (found[name] !== undefined) continue;
    outer: for (const t of TEMPLATES[name]) for (const i of live) {
      const ox = (i % W) - t.ax, oy = ((i / W) | 0) - t.ay;
      if (matchesAt(g, t, ox, oy)) { found[name] = stepNo; break outer; }
    }
  }
}

// ---------- run one soup ----------
function runSoup({ detect }) {
  let a = new Uint8Array(W * H), b = new Uint8Array(W * H);
  const o = (W - SEED) >> 1;
  let pop0 = 0;
  for (let y = 0; y < SEED; y++) for (let x = 0; x < SEED; x++)
    if (rand() < DENSITY) { a[(y + o) * W + x + o] = 1; pop0++; }
  const seen = new Map();
  const found = {};
  let t = 0;
  for (; t < CAP; t++) {
    const h = hash(a);
    if (seen.has(h)) break; // first repeated state: lifespan ends
    seen.set(h, t);
    if (detect && t % SCAN_EVERY === 0) scan(a, found, t);
    step(a, b); [a, b] = [b, a];
  }
  if (detect) scan(a, found, t);
  return { lifespan: t, capped: t === CAP, pop0, found };
}

// ---------- 1. throughput ----------
let t0 = performance.now(), n = 0;
while (performance.now() - t0 < 3000) { runSoup({ detect: false }); n++; }
const evalsPerSec = n / ((performance.now() - t0) / 1000);

// ---------- 2. census ----------
const counts = Object.fromEntries(Object.keys(TEMPLATES).map(k => [k, 0]));
const firstStep = Object.fromEntries(Object.keys(TEMPLATES).map(k => [k, []]));
let lifeSum = 0, capped = 0;
t0 = performance.now();
for (let s = 0; s < SOUPS; s++) {
  const r = runSoup({ detect: true });
  lifeSum += r.lifespan; if (r.capped) capped++;
  for (const k in r.found) { counts[k]++; firstStep[k].push(r.found[k]); }
}
const censusSec = (performance.now() - t0) / 1000;

const med = arr => arr.length ? arr.sort((x, y) => x - y)[arr.length >> 1] : "-";
console.log(`grid ${W}x${H} torus · seed ${SEED}x${SEED} @ density ${DENSITY} · cap ${CAP} · scan every ${SCAN_EVERY} steps`);
console.log(`throughput (no detection): ${evalsPerSec.toFixed(1)} evals/sec`);
console.log(`census: ${SOUPS} soups in ${censusSec.toFixed(1)}s (${(SOUPS / censusSec).toFixed(1)} evals/sec with detection)`);
console.log(`mean lifespan ${(lifeSum / SOUPS).toFixed(0)} steps · hit the cap: ${capped}/${SOUPS}`);
console.log(`templates per object: ${Object.entries(TEMPLATES).map(([k, v]) => `${k}=${v.length}`).join(" ")}`);
console.log("\nobject           soups-with-it   rate        ~evals-to-first-hit   median-first-step");
for (const k of Object.keys(TEMPLATES).sort((x, y) => counts[y] - counts[x])) {
  const rate = counts[k] / SOUPS;
  console.log(`${k.padEnd(16)} ${String(counts[k]).padStart(8)}       ${rate.toFixed(4).padStart(7)}     ${(rate ? (1 / rate).toFixed(0) : "> " + SOUPS).padStart(10)}            ${med(firstStep[k])}`);
}
