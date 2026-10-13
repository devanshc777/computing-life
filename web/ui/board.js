// A canvas that draws a Life world as bevelled "Block Blast" tiles and can run it.

import { step, CONWAY, population, stamp } from "../../engine/life.js";

// Age palette: newborn cells are lilac, settled ones magenta, old survivors amber.
export const AGE_COLOURS = ["#c9a6ff", "#ff6fc0", "#ff3fa4", "#ff8a5c", "#ffb23e"];

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// One pre-rendered tile per colour per cell size.
const tileCache = new Map();
export function tile(colour, size) {
  const key = colour + size;
  if (tileCache.has(key)) return tileCache.get(key);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const gap = size >= 6 ? 1 : 0, s = size - gap, e = Math.max(1, Math.round(s / 6));
  g.fillStyle = shade(colour, -0.45); g.fillRect(0, 0, s, s);            // dark bottom-right edge
  g.fillStyle = shade(colour, 0.45); g.fillRect(0, 0, s - e, s - e);     // light top-left edge
  g.fillStyle = colour; g.fillRect(e, e, s - 2 * e, s - 2 * e);          // face
  if (s >= 8) { g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(e + 1, e + 1, e, e); } // glint
  tileCache.set(key, c);
  return c;
}

export class Board {
  constructor(canvas, { w, h, cell = 8, rule = CONWAY, colour = null, grid = true } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.rule = rule;
    this.colour = colour;   // fixed colour, or null = colour by age
    this.showGrid = grid;
    this.box = null;        // highlight rectangle {x,y,w,h,colour}
    this.resize(w, h, cell);
  }

  resize(w, h, cell = this.cell) {
    this.w = w; this.h = h; this.cell = cell;
    this.world = new Uint8Array(w * h);
    this.next = new Uint8Array(w * h);
    this.age = new Uint16Array(w * h);
    this.generation = 0;
    this.canvas.width = w * cell;
    this.canvas.height = h * cell;
  }

  clear() { this.world.fill(0); this.age.fill(0); this.generation = 0; this.box = null; }

  load(world) { this.world.set(world); this.age.fill(0); for (let i = 0; i < world.length; i++) if (world[i]) this.age[i] = 1; this.generation = 0; }

  place(cells, x, y) { stamp(this.world, this.w, this.h, cells, x, y); for (let i = 0; i < this.world.length; i++) if (this.world[i] && !this.age[i]) this.age[i] = 1; }

  randomise(density = 0.35, rng = Math.random) {
    for (let i = 0; i < this.world.length; i++) { this.world[i] = rng() < density ? 1 : 0; this.age[i] = this.world[i]; }
    this.generation = 0;
  }

  tick() {
    step(this.world, this.next, this.w, this.h, this.rule);
    for (let i = 0; i < this.next.length; i++) this.age[i] = this.next[i] ? Math.min(this.age[i] + 1, 65535) : 0;
    [this.world, this.next] = [this.next, this.world];
    this.generation++;
  }

  get population() { return population(this.world); }

  draw() {
    const { ctx, w, h, cell } = this;
    ctx.fillStyle = "#150822";
    ctx.fillRect(0, 0, w * cell, h * cell);
    if (this.showGrid && cell >= 5) {
      ctx.fillStyle = "rgba(201,166,255,.07)";
      for (let x = 0; x <= w; x++) ctx.fillRect(x * cell - 0.5, 0, 1, h * cell);
      for (let y = 0; y <= h; y++) ctx.fillRect(0, y * cell - 0.5, w * cell, 1);
    }
    const tiles = this.colour ? null : AGE_COLOURS.map((c) => tile(c, cell));
    const fixed = this.colour ? tile(this.colour, cell) : null;
    for (let i = 0; i < this.world.length; i++) {
      if (!this.world[i]) continue;
      let t = fixed;
      if (!t) { const a = this.age[i]; t = tiles[a < 2 ? 0 : a < 6 ? 1 : a < 30 ? 2 : a < 120 ? 3 : 4]; }
      ctx.drawImage(t, (i % w) * cell, ((i / w) | 0) * cell);
    }
    if (this.box) {
      const { x, y, w: bw, h: bh, colour } = this.box;
      ctx.strokeStyle = colour || "#3ee6f0";
      ctx.lineWidth = Math.max(2, cell / 3);
      ctx.setLineDash([cell, cell / 2]);
      ctx.strokeRect((x - 1) * cell, (y - 1) * cell, (bw + 2) * cell, (bh + 2) * cell);
      ctx.setLineDash([]);
    }
  }

  // Cell under a pointer event.
  cellAt(ev) {
    const r = this.canvas.getBoundingClientRect();
    const x = Math.floor(((ev.clientX - r.left) / r.width) * this.w);
    const y = Math.floor(((ev.clientY - r.top) / r.height) * this.h);
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? { x, y, i: y * this.w + x } : null;
  }

  // Click/drag to paint; the first cell decides whether the stroke draws or erases.
  enablePainting(onChange = () => {}) {
    let mode = null;
    const paint = (ev) => {
      const c = this.cellAt(ev);
      if (!c) return;
      if (mode === null) mode = this.world[c.i] ? 0 : 1;
      this.world[c.i] = mode; this.age[c.i] = mode;
      this.draw(); onChange();
    };
    this.canvas.addEventListener("pointerdown", (ev) => { mode = null; this.canvas.setPointerCapture(ev.pointerId); paint(ev); });
    this.canvas.addEventListener("pointermove", (ev) => { if (ev.buttons) paint(ev); });
    this.canvas.addEventListener("pointerup", () => { mode = null; });
  }
}

// Run a callback at about `rate` steps per second until stop() is called.
export function loop(fn, rate = 15) {
  let id = 0, last = 0, acc = 0, running = true;
  const frame = (t) => {
    if (!running) return;
    acc += Math.min(250, t - (last || t)); last = t;
    const every = 1000 / loop.rateOf(rate);
    let steps = 0;
    while (acc >= every && steps < 8) { fn(); acc -= every; steps++; }
    id = requestAnimationFrame(frame);
  };
  id = requestAnimationFrame(frame);
  return { stop() { running = false; cancelAnimationFrame(id); } };
}
loop.rateOf = (r) => (typeof r === "function" ? r() : r);

// Draw a small static preview of a pattern into a canvas.
export function preview(canvas, cells, colour = "#ff3fa4", pad = 1) {
  const w = Math.max(...cells.map((c) => c[0])) + 1 + pad * 2, h = Math.max(...cells.map((c) => c[1])) + 1 + pad * 2;
  const n = Math.max(w, h), cell = Math.max(3, Math.floor(72 / n));
  canvas.width = canvas.height = n * cell;
  const g = canvas.getContext("2d");
  g.clearRect(0, 0, canvas.width, canvas.height);
  const t = tile(colour, cell), ox = Math.floor((n - w) / 2) + pad, oy = Math.floor((n - h) / 2) + pad;
  for (const [x, y] of cells) g.drawImage(t, (x + ox) * cell, (y + oy) * cell);
}
