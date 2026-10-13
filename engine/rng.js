// Seeded random numbers. Every random choice in a run goes through one of these,
// so a run can be replayed exactly from its seed.

export function createRng(seed) {
  let state = seed >>> 0;
  const next = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n) => (next() * n) | 0,
    chance: (p) => next() < p,
  };
}
