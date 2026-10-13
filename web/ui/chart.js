// Best fitness vs evaluations spent, one stepped line per searcher, with a marker where each one hit.

export class Chart {
  constructor(canvas, budget) {
    this.canvas = canvas;
    this.budget = budget;
    this.series = new Map(); // id -> { colour, label, points: [[x, y]], hitAt, dashed }
  }

  add(id, { colour, label, dashed = false }) { this.series.set(id, { colour, label, dashed, points: [], hitAt: null }); }

  push(id, x, y) {
    const s = this.series.get(id);
    if (!s) return;
    const last = s.points[s.points.length - 1];
    if (last && last[0] === x) last[1] = y; else s.points.push([x, y]);
  }

  hit(id, x) { const s = this.series.get(id); if (s && s.hitAt === null) s.hitAt = x; }

  draw() {
    const c = this.canvas, dpr = devicePixelRatio || 1;
    const W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#150822"; g.fillRect(0, 0, W, H);
    const L = 64, R = 22, T = 16, B = 34, pw = W - L - R, ph = H - T - B;

    let ymin = 1;
    for (const s of this.series.values()) for (const [, y] of s.points) ymin = Math.min(ymin, y);
    ymin = Math.max(0, Math.floor((ymin - 0.01) * 20) / 20);
    const X = (x) => L + (x / this.budget) * pw, Y = (y) => T + (1 - (y - ymin) / (1 - ymin || 1)) * ph;

    g.font = "8px 'Press Start 2P'"; g.fillStyle = "#a98cc9"; g.strokeStyle = "rgba(201,166,255,.12)"; g.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = ymin + (1 - ymin) * (i / 4);
      g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(W - R, Y(y)); g.stroke();
      g.fillText(y.toFixed(2), 20, Y(y) + 3);
    }
    for (let i = 0; i <= 4; i++) {
      const x = Math.round((this.budget * i) / 4);
      const label = String(x);
      g.fillText(label, Math.min(X(x) - 8, W - R - label.length * 8), H - 18);
    }
    g.fillText("EVALUATIONS →", W - R - 110, H - 4);
    g.save(); g.translate(10, T + ph / 2 + 40); g.rotate(-Math.PI / 2); g.fillText("BEST SCORE", 0, 0); g.restore();
    g.fillStyle = "#3ee6f0"; g.fillText("1.00 = HIT", L + 6, T + 10);

    for (const s of this.series.values()) {
      if (!s.points.length) continue;
      g.strokeStyle = s.colour; g.lineWidth = 3; g.setLineDash(s.dashed ? [6, 5] : []);
      g.beginPath();
      s.points.forEach(([x, y], i) => {
        if (i === 0) g.moveTo(X(x), Y(y));
        else { g.lineTo(X(x), Y(s.points[i - 1][1])); g.lineTo(X(x), Y(y)); }
      });
      const lastX = s.hitAt ?? s.points[s.points.length - 1][0];
      g.lineTo(X(lastX), Y(s.points[s.points.length - 1][1]));
      g.stroke(); g.setLineDash([]);
      if (s.hitAt !== null) {
        g.fillStyle = s.colour;
        g.fillRect(X(s.hitAt) - 5, Y(1) - 5, 10, 10);
        g.fillStyle = "#0b0412"; g.fillRect(X(s.hitAt) - 2, Y(1) - 2, 4, 4);
      }
    }
  }
}
