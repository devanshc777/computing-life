// Game of Life on a wrapping (toroidal) grid. A world is a Uint8Array of 0/1, row-major.
// Rules are given as birth/survival neighbour counts, so the same code runs Conway (B3/S23)
// and neighbouring universes like HighLife (B36/S23).

export const CONWAY = parseRule("B3/S23");
export const HIGHLIFE = parseRule("B36/S23");

export function parseRule(text) {
  const m = /^B(\d*)\/S(\d*)$/i.exec(text.trim());
  if (!m) throw new Error(`bad rule: ${text}`);
  const birth = new Uint8Array(9), survive = new Uint8Array(9);
  for (const c of m[1]) birth[+c] = 1;
  for (const c of m[2]) survive[+c] = 1;
  return { text: text.toUpperCase(), birth, survive };
}

// Precomputed wrap tables so the inner loop never takes a modulo.
const wrapCache = new Map();
function wraps(w, h) {
  const key = w * 100003 + h;
  let t = wrapCache.get(key);
  if (!t) {
    const left = new Int32Array(w), right = new Int32Array(w), up = new Int32Array(h), down = new Int32Array(h);
    for (let x = 0; x < w; x++) { left[x] = (x + w - 1) % w; right[x] = (x + 1) % w; }
    for (let y = 0; y < h; y++) { up[y] = ((y + h - 1) % h) * w; down[y] = ((y + 1) % h) * w; }
    t = { left, right, up, down };
    wrapCache.set(key, t);
  }
  return t;
}

// Neighbour count = (sum of the 3×3 block) − the cell itself. Each row first sums its column of three
// (cell above + cell + cell below), so every cell costs 3 reads instead of 8.
let colSum = new Uint8Array(0);
export function step(src, dst, w, h, rule = CONWAY) {
  const { left, right, up, down } = wraps(w, h);
  const { birth, survive } = rule;
  if (colSum.length < w) colSum = new Uint8Array(w);
  for (let y = 0; y < h; y++) {
    const yu = up[y], y0 = y * w, yd = down[y];
    for (let x = 0; x < w; x++) colSum[x] = src[yu + x] + src[y0 + x] + src[yd + x];
    for (let x = 0; x < w; x++) {
      const self = src[y0 + x];
      const n = colSum[left[x]] + colSum[x] + colSum[right[x]] - self;
      dst[y0 + x] = self ? survive[n] : birth[n];
    }
  }
}

// FNV-1a over the cells. Used to spot the first repeated state; a collision would only end a run
// early, never fake a hit.
export function hash(world) {
  let h = 0x811c9dc5;
  for (let i = 0; i < world.length; i++) { h ^= world[i]; h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

export function population(world) {
  let n = 0;
  for (let i = 0; i < world.length; i++) n += world[i];
  return n;
}

// Copy a size×size seed into the centre of an empty w×h world.
export function placeSeed(bits, size, w, h, world = new Uint8Array(w * h)) {
  world.fill(0);
  const ox = (w - size) >> 1, oy = (h - size) >> 1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) world[(y + oy) * w + x + ox] = bits[y * size + x];
  return world;
}

// Stamp a list of [x, y] cells into a world at (ox, oy), wrapping.
export function stamp(world, w, h, cells, ox, oy) {
  for (const [x, y] of cells) world[((oy + y) % h + h) % h * w + ((ox + x) % w + w) % w] = 1;
  return world;
}
