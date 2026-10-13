// Finding a target object inside a world.
// A target is matched in any phase of its period and any of its 8 orientations, and only when isolated:
// its bounding box must match exactly AND the one-cell ring around it must be dead.

import { CONWAY } from "./life.js";

const SYMMETRIES = [
  ([x, y]) => [x, y], ([x, y]) => [-x, y], ([x, y]) => [x, -y], ([x, y]) => [-x, -y],
  ([x, y]) => [y, x], ([x, y]) => [-y, x], ([x, y]) => [y, -x], ([x, y]) => [-y, -x],
];

export function normalise(cells) {
  if (!cells.length) return [];
  const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
const keyOf = (cells) => cells.map((c) => c.join(",")).join(";");

// Evolve a small pattern on an open (non-wrapping) plane; returns its cells after n generations.
export function evolveOpen(cells, n, rule = CONWAY) {
  if (!cells.length) return [];
  let live = new Set(cells.map(([x, y]) => `${x},${y}`));
  for (let g = 0; g < n; g++) {
    const counts = new Map();
    for (const k of live) {
      const [x, y] = k.split(",").map(Number);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nk = `${x + dx},${y + dy}`;
        counts.set(nk, (counts.get(nk) || 0) + 1);
      }
    }
    const next = new Set();
    for (const [k, n2] of counts) if (live.has(k) ? rule.survive[n2] : rule.birth[n2]) next.add(k);
    for (const k of live) if (!counts.has(k) && rule.survive[0]) next.add(k);
    live = next;
    if (!live.size) break;
  }
  return [...live].map((k) => k.split(",").map(Number));
}

// Every distinct (phase × orientation) image of a pattern, as match templates.
export function buildTemplates(cells, period) {
  const seen = new Map();
  let phase = cells;
  for (let p = 0; p < period; p++) {
    for (const f of SYMMETRIES) {
      const norm = normalise(phase.map(f));
      const key = keyOf(norm);
      if (seen.has(key)) continue;
      const w = Math.max(...norm.map((c) => c[0])) + 1, h = Math.max(...norm.map((c) => c[1])) + 1;
      const mask = new Uint8Array(w * h);
      for (const [x, y] of norm) mask[y * w + x] = 1;
      // anchor = first live cell in row-major order: we only try positions where that cell is alive
      seen.set(key, { w, h, mask, ax: norm[0][0], ay: norm[0][1], window: (w + 2) * (h + 2) });
    }
    phase = evolveOpen(phase, 1);
  }
  return [...seen.values()];
}

// Smallest window a template has — partial credit is measured as a share of it.
export const windowSize = (templates) => Math.min(...templates.map((t) => t.window));

// Wrap tables: index (x + PAD) gives the wrapped column, (y + PAD) the wrapped row offset. No modulo in hot loops.
const PAD = 24;
const wrapCache = new Map();
function wrapTables(w, h) {
  const key = w * 100003 + h;
  let t = wrapCache.get(key);
  if (!t) {
    const col = new Int32Array(w + 2 * PAD), row = new Int32Array(h + 2 * PAD);
    for (let i = 0; i < col.length; i++) col[i] = (((i - PAD) % w) + w) % w;
    for (let i = 0; i < row.length; i++) row[i] = ((((i - PAD) % h) + h) % h) * w;
    t = { col, row };
    wrapCache.set(key, t);
  }
  return t;
}

// Fewest cells by which any template window (with its dead ring) differs from the world,
// trying anchors on live cells only. 0 means an isolated copy of the target is present.
// Stops counting a window once it can no longer beat `ceiling`.
// quick = true only tries anchors whose left / up-left / up / up-right cells are dead (the corner of a
// would-be object). That skips the middle of messy clusters and is ~10x faster; it is what the search uses.
export function bestMismatch(world, w, h, templates, ceiling = Infinity, quick = false) {
  const { col, row } = wrapTables(w, h);
  let best = ceiling;
  for (let i = 0; i < world.length; i++) {
    if (!world[i]) continue;
    const cx = i % w, cy = (i / w) | 0;
    if (quick) {
      const up = row[cy + PAD - 1], mid = row[cy + PAD], px = cx + PAD;
      if (world[mid + col[px - 1]] | world[up + col[px - 1]] | world[up + col[px]] | world[up + col[px + 1]]) continue;
    }
    for (const t of templates) {
      const ox = cx - t.ax + PAD, oy = cy - t.ay + PAD;
      let m = 0;
      for (let y = -1; y <= t.h && m < best; y++) {
        const r = row[oy + y];
        for (let x = -1; x <= t.w && m < best; x++) {
          const inside = x >= 0 && y >= 0 && x < t.w && y < t.h;
          if (world[r + col[ox + x]] !== (inside ? t.mask[y * t.w + x] : 0)) m++;
        }
      }
      if (m < best) { best = m; if (best === 0) return 0; }
    }
  }
  return best;
}

// Exact, isolated match anywhere? Same answer as bestMismatch(...) === 0, much faster:
// a template's anchor is its first live cell in reading order, so in any true match the cells
// left, up-left, up and up-right of the anchor are dead. One check rejects most anchors.
export function contains(world, w, h, templates) {
  const { col, row } = wrapTables(w, h);
  for (let i = 0; i < world.length; i++) {
    if (!world[i]) continue;
    const cx = i % w + PAD, cy = (i / w | 0) + PAD;
    const up = row[cy - 1], mid = row[cy];
    if (world[mid + col[cx - 1]] | world[up + col[cx - 1]] | world[up + col[cx]] | world[up + col[cx + 1]]) continue;
    for (const t of templates) {
      const ox = cx - t.ax, oy = cy - t.ay;
      let ok = true;
      for (let y = -1; y <= t.h && ok; y++) {
        const r = row[oy + y];
        for (let x = -1; x <= t.w; x++) {
          const inside = x >= 0 && y >= 0 && x < t.w && y < t.h;
          if (world[r + col[ox + x]] !== (inside ? t.mask[y * t.w + x] : 0)) { ok = false; break; }
        }
      }
      if (ok) return true;
    }
  }
  return false;
}

// What a drawn shape does on its own: still life, oscillator (period p), spaceship (period p), or transient.
export function classify(cells, maxGen = 64) {
  const start = normalise(cells);
  if (!start.length) return { kind: "empty" };
  const startKey = keyOf(start);
  const ox = Math.min(...cells.map((c) => c[0])), oy = Math.min(...cells.map((c) => c[1]));
  let cur = cells;
  for (let g = 1; g <= maxGen; g++) {
    cur = evolveOpen(cur, 1);
    if (!cur.length) return { kind: "transient", note: `dies after ${g} generation${g > 1 ? "s" : ""}` };
    if (keyOf(normalise(cur)) === startKey) {
      const dx = Math.min(...cur.map((c) => c[0])) - ox, dy = Math.min(...cur.map((c) => c[1])) - oy;
      if (dx || dy) return { kind: "spaceship", period: g };
      return g === 1 ? { kind: "still life", period: 1 } : { kind: "oscillator", period: g };
    }
  }
  return { kind: "transient", note: `does not repeat within ${maxGen} generations` };
}
