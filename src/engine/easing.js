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
