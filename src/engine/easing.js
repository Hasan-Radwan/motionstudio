// Easing functions. All take t in [0,1] and return an eased value.
export const linear = (t) => t;

export const easeInOut = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export const easeIn = (t) => t * t * t;

export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

// A seamless "breathing" wave: 0 -> 1 -> 0 across the loop, C1-continuous at the seam.
export const pingpong = (t) => 0.5 - 0.5 * Math.cos(t * Math.PI * 2);

// Triangle wave 0..1..0 (linear), also seamless.
export const triangle = (t) => 1 - Math.abs(1 - 2 * t);

// Small deterministic pseudo-random from an integer seed (for scatter layouts).
export function seeded(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const TAU = Math.PI * 2;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A CSS-style cubic-bezier timing function. Returns f(x) → y for x in [0,1],
// with the endpoints pinned at (0,0) and (1,1) so a loop stays seamless (only the
// PACING between the ends changes). x1,y1,x2,y2 are the two control handles.
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const bezX = (s) => ((ax * s + bx) * s + cx) * s;
  const bezY = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Newton–Raphson to invert x = Bx(s), then evaluate By(s).
    let s = x;
    for (let i = 0; i < 8; i++) {
      const err = bezX(s) - x;
      if (Math.abs(err) < 1e-5) break;
      const d = dX(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    s = s < 0 ? 0 : s > 1 ? 1 : s;
    return bezY(s);
  };
}

// Built-in easing presets (control-handle coords [x1, y1, x2, y2]). Linear first.
export const EASING_PRESETS = [
  { id: 'linear', name: 'Linear', pts: [0, 0, 1, 1] },
  { id: 'ease', name: 'Ease', pts: [0.25, 0.1, 0.25, 1] },
  { id: 'flow', name: 'Flow', pts: [0.4, 0, 0.2, 1] },
  { id: 'glide', name: 'Glide', pts: [0.25, 0.46, 0.45, 0.94] },
  { id: 'sweep', name: 'Sweep', pts: [0.7, 0, 0.3, 1] },
  { id: 'smooth', name: 'Smooth', pts: [0.45, 0.05, 0.55, 0.95] },
];
export const DEFAULT_EASING = { preset: 'linear', pts: [0, 0, 1, 1] };
