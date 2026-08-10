import { roundedRectPath, drawImageContain, cornerR } from '../engine/canvasUtils.js';
import { TAU, pingpong } from '../engine/easing.js';

export const meta = {
  id: 'logo',
  name: 'Logo Reveal',
  category: 'Logo & Branding',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Logo size', min: 20, max: 80, step: 1, default: 46, unit: '%' },
  { key: 'anim', type: 'select', label: 'Animation', default: 'pop', options: [
      { value: 'none', label: 'Static' },
      { value: 'pop', label: 'Pop in' },
      { value: 'pulse', label: 'Pulse' },
      { value: 'float', label: 'Float' },
      { value: 'spin', label: 'Spin' },
    ] },
  { key: 'glow', type: 'range', label: 'Glow', min: 0, max: 100, step: 1, default: 40, unit: '%' },
  { key: 'plate', type: 'toggle', label: 'Backing plate', default: false },
  { key: 'radius', type: 'range', label: 'Plate corners', min: 0, max: 50, step: 1, default: 24, unit: '%' },
];

// A clean centred logo presentation. Uses "contain" so the whole mark stays
// visible (never cropped), with an optional backing plate and a soft glow.
// Best paired with a Transparent or solid background.
export function render(ctx, t, p, { image, w, h }) {
  const min = Math.min(w, h);
  const box = min * (p.size / 100); // square clearspace box for the logo
  const cx = w / 2;
  const cy = h / 2;

  // animation state (all seamless over the loop)
  let scale = 1;
  let dy = 0;
  let rot = 0;
  if (p.anim === 'pop') scale = 0.72 + 0.28 * pingpong(t);
  else if (p.anim === 'pulse') scale = 1 + 0.05 * Math.sin(t * TAU);
  else if (p.anim === 'float') dy = Math.sin(t * TAU) * box * 0.05;
  else if (p.anim === 'spin') rot = t * TAU;

  // soft glow behind the logo, breathing with the loop
  if (p.glow > 0) {
    const gr = box * (0.6 + 0.15 * pingpong(t));
    const g = ctx.createRadialGradient(cx, cy + dy, 0, cx, cy + dy, gr);
    const a = (p.glow / 100) * 0.5;
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy + dy, gr, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy + dy);
  ctx.scale(scale, scale);
  if (rot) ctx.rotate(rot);

  // optional backing plate (a little larger than the logo box)
  if (p.plate) {
    const pw = box * 1.4;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = min * 0.05;
    ctx.shadowOffsetY = min * 0.02;
    roundedRectPath(ctx, -pw / 2, -pw / 2, pw, pw, cornerR(p.radius, pw, pw));
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  drawImageContain(ctx, image, -box / 2, -box / 2, box, box);
  ctx.restore();
}
