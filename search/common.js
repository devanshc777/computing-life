// Helpers every searcher shares.

export const DENSITY = 0.5; // same as Catagolue's random soups

export function randomSeed(rng, seedSize, density = DENSITY) {
  const bits = new Uint8Array(seedSize * seedSize);
  for (let i = 0; i < bits.length; i++) bits[i] = rng.next() < density ? 1 : 0;
  return bits;
}

export function flipOne(bits, rng) {
  const child = bits.slice();
  child[rng.int(child.length)] ^= 1;
  return child;
}
