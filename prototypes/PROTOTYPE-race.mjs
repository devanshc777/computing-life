// PROTOTYPE, throwaway. Answers: on an equal evaluation budget, does any searcher reach a target object
// faster than random seeds? If nothing beats random, the project still stands (that is a result), but we want
// to know before building the UI around it.
// Run: node prototypes/PROTOTYPE-race.mjs <target> <algo> [budget] [runs] [firstRngSeed]
//   algo: random | hill | anneal | ga
// Prints one JSON line per run, then a summary line.

const [TARGET = "LWSS", ALGO = "random"] = process.argv.slice(2, 4);
const BUDGET = +(process.argv[4] ?? 300), RUNS = +(process.argv[5] ?? 10), RNG0 = +(process.argv[6] ?? 100);
const W = 64, H = 64, S = 16, CAP = 1000, SCAN_EVERY = 4, DENSITY = 0.5, G = S * S;

let rngState = 1;
const rand = () => {
  rngState = (rngState + 0x6D2B79F5) >>> 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randInt = n => (rand() * n) | 0;

function step(src, dst) {
  for (let y = 0; y < H; y++) {
    const yu = ((y + H - 1) % H) * W, y0 = y * W, yd = ((y + 1) % H) * W;
    for (let x = 0; x < W; x++) {
      const xl = (x + W - 1) % W, xr = (x + 1) % W;
      const n = src[yu + xl] + src[yu + x] + src[yu + xr] + src[y0 + xl] + src[y0 + xr]
              + src[yd + xl] + src[yd + x] + src[yd + xr];
      dst[y0 + x] = (n === 3 || (src[y0 + x] && n === 2)) ? 1 : 0;
    }
  }
}
function hash(g) {
  let h = 0x811c9dc5;
  for (let i = 0; i < g.length; i++) { h ^= g[i]; h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

// ----- templates (same construction as PROTOTYPE-census) -----
const CANON = {
  glider: [".O.", "..O", "OOO"],
  LWSS: [".O..O", "O....", "O...O", "OOOO."],
  MWSS: ["...O..", ".O...O", "O.....", "O....O", "OOOOO."],
  HWSS: ["...OO..", ".O....O", "O......", "O.....O", "OOOOOO."],
  pulsar: ["..OOO...OOO..", ".............", "O....O.O....O", "O....O.O....O", "O....O.O....O",
           "..OOO...OOO..", ".............", "..OOO...OOO..", "O....O.O....O", "O....O.O....O",
           "O....O.O....O", ".............", "..OOO...OOO.."],
  pentadecathlon: ["..O....O..", "OO.OOOO.OO", "..O....O.."],
  beacon: ["OO..", "OO..", "..OO", "..OO"],
};
const PERIOD = { glider: 4, LWSS: 4, MWSS: 4, HWSS: 4, pulsar: 3, pentadecathlon: 15, beacon: 2 };
const toCells = rows => rows.flatMap((r, y) => [...r].flatMap((c, x) => (c === "O" ? [[x, y]] : [])));
function crop(cells) {
  const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
function evolvePlane(cells, n) {
  const P = 60, off = 20;
  let a = new Uint8Array(P * P), b = new Uint8Array(P * P);
  for (const [x, y] of cells) a[(y + off) * P + x + off] = 1;
  for (let k = 0; k < n; k++) {
    for (let y = 1; y < P - 1; y++) for (let x = 1; x < P - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) s += a[(y + dy) * P + x + dx];
      b[y * P + x] = (s === 3 || (a[y * P + x] && s === 2)) ? 1 : 0;
    }
    [a, b] = [b, a];
  }
  const out = [];
  for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) if (a[y * P + x]) out.push([x, y]);
  return out;
}
const SYMS = [([x, y]) => [x, y], ([x, y]) => [-x, y], ([x, y]) => [x, -y], ([x, y]) => [-x, -y],
              ([x, y]) => [y, x], ([x, y]) => [-y, x], ([x, y]) => [y, -x], ([x, y]) => [-y, -x]];
const TEMPLATES = (() => {
  const seen = new Map();
  for (let p = 0; p < PERIOD[TARGET]; p++) for (const f of SYMS) {
    const cells = crop(evolvePlane(toCells(CANON[TARGET]), p).map(f));
    const key = JSON.stringify(cells);
    if (seen.has(key)) continue;
    const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1;
    const mask = new Uint8Array(w * h);
    for (const [x, y] of cells) mask[y * w + x] = 1;
    seen.set(key, { w, h, mask, ax: cells[0][0], ay: cells[0][1], size: (w + 2) * (h + 2) });
  }
  return [...seen.values()];
})();

// Fewest mismatching cells between any template window (with its dead ring) and the world, over anchors on
// live cells. 0 = an isolated copy of the target is present.
function bestMismatch(g, ceiling) {
  let best = ceiling;
  for (let i = 0; i < g.length; i++) {
    if (!g[i]) continue;
    const cx = i % W, cy = (i / W) | 0;
    for (const t of TEMPLATES) {
      const ox = cx - t.ax, oy = cy - t.ay;
      let m = 0;
      for (let y = -1; y <= t.h && m < best; y++) {
        const gy = ((oy + y + H) % H) * W;
        for (let x = -1; x <= t.w && m < best; x++) {
          const inside = x >= 0 && y >= 0 && x < t.w && y < t.h;
          if (g[gy + (ox + x + W) % W] !== (inside ? t.mask[y * t.w + x] : 0)) m++;
        }
      }
      if (m < best) { best = m; if (best === 0) return 0; }
    }
  }
  return best;
}
const WINDOW = Math.min(...TEMPLATES.map(t => t.size));

// ----- evaluator: owns the budget -----
let spent = 0, firstHitAt = null, bestEver = { fit: -1 };
function evaluate(bits) {
  if (spent >= BUDGET) throw new Error("budget");
  spent++;
  let a = new Uint8Array(W * H), b = new Uint8Array(W * H);
  const o = (W - S) >> 1;
  let pop0 = 0;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (bits[y * S + x]) { a[(y + o) * W + x + o] = 1; pop0++; }
  const seen = new Set();
  let best = WINDOW;
  for (let t = 0; t <= CAP; t++) {
    if (t % SCAN_EVERY === 0) { best = bestMismatch(a, best); if (best === 0) break; }
    const h = hash(a);
    if (seen.has(h)) break;
    seen.add(h);
    step(a, b); [a, b] = [b, a];
  }
  const hit = best === 0;
  const fit = hit ? 1 : 1 - best / WINDOW; // partial credit: how close the world ever came
  if (hit && firstHitAt === null) firstHitAt = spent;
  if (fit > bestEver.fit) bestEver = { fit, pop0 };
  return fit;
}
const randomSeed = () => Uint8Array.from({ length: G }, () => (rand() < DENSITY ? 1 : 0));
const flip = (bits, k) => { const c = bits.slice(); for (let i = 0; i < k; i++) c[randInt(G)] ^= 1; return c; };

// ----- searchers (each runs until the evaluator refuses) -----
const searchers = {
  random() { for (;;) evaluate(randomSeed()); },
  hill() {
    for (;;) {
      let cur = randomSeed(), f = evaluate(cur), stale = 0;
      while (stale < 40) {
        const nxt = flip(cur, 1 + randInt(3)), g = evaluate(nxt);
        if (g >= f) { stale = g > f ? 0 : stale + 1; cur = nxt; f = g; } else stale++;
      }
    }
  },
  anneal() {
    let cur = randomSeed(), f = evaluate(cur);
    const T0 = 0.05, T1 = 0.002;
    for (;;) {
      const T = T0 * Math.pow(T1 / T0, spent / BUDGET);
      const nxt = flip(cur, 1 + randInt(3)), g = evaluate(nxt);
      if (g >= f || rand() < Math.exp((g - f) / T)) { cur = nxt; f = g; }
    }
  },
  ga() {
    const P = 20, ELITE = 2, MUT = 1 / G;
    let pop = Array.from({ length: P }, () => { const b = randomSeed(); return { b, f: evaluate(b) }; });
    const pick = () => { let w = pop[randInt(P)]; for (let i = 0; i < 2; i++) { const c = pop[randInt(P)]; if (c.f > w.f) w = c; } return w; };
    for (;;) {
      pop.sort((x, y) => y.f - x.f);
      const next = pop.slice(0, ELITE);
      while (next.length < P) {
        const A = pick().b, B = pick().b, child = A.slice();
        // block crossover: copy a random rectangle of B into A
        const x0 = randInt(S), y0 = randInt(S), x1 = x0 + 1 + randInt(S - x0), y1 = y0 + 1 + randInt(S - y0);
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) child[y * S + x] = B[y * S + x];
        for (let i = 0; i < G; i++) if (rand() < MUT) child[i] ^= 1;
        next.push({ b: child, f: evaluate(child) });
      }
      pop = next;
    }
  },
};

const results = [];
const t0 = performance.now();
for (let r = 0; r < RUNS; r++) {
  rngState = (RNG0 + r) >>> 0; spent = 0; firstHitAt = null; bestEver = { fit: -1 };
  try { searchers[ALGO](); } catch (e) { if (e.message !== "budget") throw e; }
  const row = { target: TARGET, algo: ALGO, run: r, hit: firstHitAt !== null, firstHitAt, bestFit: +bestEver.fit.toFixed(3) };
  results.push(row);
  console.log(JSON.stringify(row));
}
const hits = results.filter(r => r.hit).map(r => r.firstHitAt).sort((a, b) => a - b);
console.log(`SUMMARY ${TARGET} ${ALGO} budget=${BUDGET} runs=${RUNS} hits=${hits.length}/${RUNS} ` +
  `medianFirstHit=${hits.length ? hits[hits.length >> 1] : "-"} meanBestFit=${(results.reduce((s, r) => s + r.bestFit, 0) / RUNS).toFixed(3)} ` +
  `secs=${((performance.now() - t0) / 1000).toFixed(0)}`);
