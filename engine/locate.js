// Where is the target? Same isolated-match rule as detect.js, but returns the box so the UI can frame it.

export function locate(world, w, h, templates) {
  for (let i = 0; i < world.length; i++) {
    if (!world[i]) continue;
    const cx = i % w, cy = (i / w) | 0;
    for (const t of templates) {
      const ox = cx - t.ax, oy = cy - t.ay;
      let ok = true;
      for (let y = -1; y <= t.h && ok; y++) {
        const row = ((oy + y) % h + h) % h * w;
        for (let x = -1; x <= t.w && ok; x++) {
          const inside = x >= 0 && y >= 0 && x < t.w && y < t.h;
          if (world[row + ((ox + x) % w + w) % w] !== (inside ? t.mask[y * t.w + x] : 0)) ok = false;
        }
      }
      if (ok) return { x: ((ox % w) + w) % w, y: ((oy % h) + h) % h, w: t.w, h: t.h };
    }
  }
  return null;
}
