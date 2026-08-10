// Background presets rendered under the animated content each frame.
// Each preset: { id, name, type, ...data }. drawBackground() paints it.

import { drawImageCover, drawImageContain } from '../engine/canvasUtils.js';

export const BACKGROUNDS = [
  { id: 'transparent', name: 'Transparent', type: 'transparent' },
  { id: 'dark', name: 'Charcoal', type: 'solid', color: '#0e0f13' },
  { id: 'light', name: 'Paper', type: 'solid', color: '#f4f5f7' },
  {
    id: 'grad-violet',
    name: 'Violet',
    type: 'linear',
    angle: 135,
    stops: ['#6c5cff', '#c86dff', '#ff8fb1'],
  },
  {
    id: 'grad-ocean',
    name: 'Ocean',
    type: 'linear',
    angle: 160,
    stops: ['#0f2a4a', '#1e6f9f', '#57c7d4'],
  },
  {
    id: 'grad-sunset',
    name: 'Sunset',
    type: 'linear',
    angle: 120,
    stops: ['#ff7a45', '#ff477e', '#7c3aed'],
  },
  {
    id: 'grad-mint',
    name: 'Mint',
    type: 'linear',
    angle: 145,
    stops: ['#0b3d2e', '#1f9c6f', '#8fe3c0'],
  },
  {
    id: 'radial-glow',
    name: 'Spotlight',
    type: 'radial',
    inner: '#2a2f45',
    outer: '#0b0c12',
  },
  {
    id: 'mesh-aurora',
    name: 'Aurora',
    type: 'mesh',
    colors: ['#6c5cff', '#ff5c9d', '#3ad1c6', '#12131a'],
  },
  {
    id: 'mesh-peach',
    name: 'Peach',
    type: 'mesh',
    colors: ['#ffb37a', '#ff6b9d', '#a06bff', '#1a1526'],
  },
];

export const DEFAULT_BACKGROUND = BACKGROUNDS.find((b) => b.id === 'mesh-aurora');

function angleGradient(ctx, w, h, angleDeg, stops) {
  const a = (angleDeg * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a));
  const dx = (Math.cos(a) * len) / 2;
  const dy = (Math.sin(a) * len) / 2;
  const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

// t (loop time) lets meshes drift slowly for subtle life; keep it seamless.
export function drawBackground(ctx, w, h, bg, t = 0) {
  if (!bg || bg.type === 'transparent') {
    // leave transparent (canvas already cleared)
    return;
  }
  if (bg.type === 'solid') {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (bg.type === 'image') {
    // dark base (shows through 'contain' letterboxing / while the image decodes)
    ctx.fillStyle = bg.pad || '#0e0f13';
    ctx.fillRect(0, 0, w, h);
    if (bg.img && bg.img.width) {
      if (bg.fit === 'contain') drawImageContain(ctx, bg.img, 0, 0, w, h);
      else drawImageCover(ctx, bg.img, 0, 0, w, h);
    }
    // optional dim overlay to keep foreground/text legible over busy photos
    if (bg.dim) {
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0, Math.min(100, bg.dim)) / 100})`;
      ctx.fillRect(0, 0, w, h);
    }
    return;
  }
  if (bg.type === 'linear') {
    ctx.fillStyle = angleGradient(ctx, w, h, bg.angle, bg.stops);
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (bg.type === 'radial') {
    const g = ctx.createRadialGradient(
      w / 2,
      h * 0.42,
      0,
      w / 2,
      h * 0.5,
      Math.max(w, h) * 0.75
    );
    g.addColorStop(0, bg.inner);
    g.addColorStop(1, bg.outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (bg.type === 'mesh') {
    // base fill with the last (darkest) color
    const cols = bg.colors;
    ctx.fillStyle = cols[cols.length - 1];
    ctx.fillRect(0, 0, w, h);
    // several drifting radial blobs, additively blended
    const drift = Math.sin(t * Math.PI * 2);
    const pts = [
      [0.25 + 0.04 * drift, 0.3],
      [0.78, 0.28 - 0.04 * drift],
      [0.35, 0.75 + 0.03 * drift],
      [0.7, 0.72],
    ];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pts.length; i++) {
      const [px, py] = pts[i];
      const color = cols[i % cols.length];
      const rad = Math.max(w, h) * 0.55;
      const g = ctx.createRadialGradient(
        px * w,
        py * h,
        0,
        px * w,
        py * h,
        rad
      );
      g.addColorStop(0, hexToRgba(color, 0.85));
      g.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
    return;
  }
}

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Render a small preview swatch of a background into a canvas element.
export function paintSwatch(canvas, bg) {
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 96);
  const h = (canvas.height = canvas.clientHeight || 60);
  if (!bg || bg.type === 'transparent') {
    // checkerboard
    const s = 8;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        ctx.fillStyle = (x / s + y / s) % 2 ? '#3a3f4c' : '#2a2e39';
        ctx.fillRect(x, y, s, s);
      }
    }
    return;
  }
  if (bg.type === 'image' && bg.img && bg.img.width) {
    drawImageCover(ctx, bg.img, 0, 0, w, h);
    return;
  }
  drawBackground(ctx, w, h, bg, 0);
}
