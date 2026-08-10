// Device mockup frames. compositeMockup(img, mockup) returns a canvas element
// that wraps the raw image in a frame; templates then treat it as the asset.

import { roundedRectPath, drawImageCover } from '../engine/canvasUtils.js';

export const MOCKUPS = [
  { id: 'none', name: 'None' },
  { id: 'browser', name: 'Browser' },
  { id: 'phone', name: 'Phone' },
  { id: 'laptop', name: 'Laptop' },
];

export const DEFAULT_MOCKUP = MOCKUPS[0];

// Long side of the composited frame (keeps mockups crisp at export sizes).
const BASE = 1400;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.round(w);
  c.height = Math.round(h);
  return c;
}

export function compositeMockup(img, mockup) {
  if (!img || !mockup || mockup.id === 'none') return img;
  switch (mockup.id) {
    case 'browser':
      return browserFrame(img);
    case 'phone':
      return phoneFrame(img);
    case 'laptop':
      return laptopFrame(img);
    default:
      return img;
  }
}

function browserFrame(img) {
  const ir = img.width / img.height;
  const barH = 0.09; // bar height as fraction of content height
  const contentW = BASE;
  const contentH = contentW / ir;
  const bar = contentH * barH;
  const pad = contentW * 0.012;
  const w = contentW + pad * 2;
  const h = contentH + bar + pad * 2;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const r = w * 0.02;
  // window body
  roundedRectPath(ctx, 0, 0, w, h, r);
  ctx.fillStyle = '#20232c';
  ctx.fill();
  // top bar
  roundedRectPath(ctx, pad, pad, contentW, bar, r * 0.5);
  ctx.fillStyle = '#2b2f3a';
  ctx.fill();
  // traffic-light dots
  const dotY = pad + bar / 2;
  const dotR = bar * 0.16;
  const colors = ['#ff5f57', '#febc2e', '#28c840'];
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(pad + bar * 0.5 + i * dotR * 3, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();
  }
  // url pill
  const pillX = pad + bar * 2.4;
  const pillW = contentW - bar * 3;
  roundedRectPath(ctx, pillX, dotY - bar * 0.22, pillW, bar * 0.44, bar * 0.22);
  ctx.fillStyle = '#171a21';
  ctx.fill();
  // content
  const cy = pad + bar;
  ctx.save();
  roundedRectPath(ctx, pad, cy, contentW, contentH, r * 0.3);
  ctx.clip();
  drawImageCover(ctx, img, pad, cy, contentW, contentH);
  ctx.restore();
  return c;
}

function phoneFrame(img) {
  // portrait phone; fit the image by cover into the screen area
  const screenW = BASE * 0.46;
  const screenH = screenW * 2.16; // ~19.5:9
  const bezel = screenW * 0.035;
  const w = screenW + bezel * 2;
  const h = screenH + bezel * 2;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const r = w * 0.13;
  // body
  roundedRectPath(ctx, 0, 0, w, h, r);
  ctx.fillStyle = '#0b0c10';
  ctx.fill();
  // screen
  ctx.save();
  roundedRectPath(ctx, bezel, bezel, screenW, screenH, r * 0.72);
  ctx.clip();
  drawImageCover(ctx, img, bezel, bezel, screenW, screenH);
  ctx.restore();
  // notch / pill
  const notchW = screenW * 0.32;
  const notchH = bezel * 1.4;
  roundedRectPath(
    ctx,
    w / 2 - notchW / 2,
    bezel * 1.1,
    notchW,
    notchH,
    notchH / 2
  );
  ctx.fillStyle = '#0b0c10';
  ctx.fill();
  return c;
}

function laptopFrame(img) {
  const ir = img.width / img.height;
  const screenW = BASE * 0.72;
  const screenH = screenW / ir;
  const bezel = screenW * 0.02;
  const lidW = screenW + bezel * 2;
  const lidH = screenH + bezel * 2;
  const baseH = lidH * 0.06;
  const baseOverhang = lidW * 0.09;
  const w = lidW + baseOverhang * 2;
  const h = lidH + baseH;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const lidX = baseOverhang;
  // lid
  const r = lidW * 0.02;
  roundedRectPath(ctx, lidX, 0, lidW, lidH, r);
  ctx.fillStyle = '#191b22';
  ctx.fill();
  // screen
  ctx.save();
  roundedRectPath(ctx, lidX + bezel, bezel, screenW, screenH, r * 0.4);
  ctx.clip();
  drawImageCover(ctx, img, lidX + bezel, bezel, screenW, screenH);
  ctx.restore();
  // base (trapezoid)
  ctx.beginPath();
  ctx.moveTo(0, lidH);
  ctx.lineTo(w, lidH);
  ctx.lineTo(w - baseOverhang * 0.4, lidH + baseH);
  ctx.lineTo(baseOverhang * 0.4, lidH + baseH);
  ctx.closePath();
  ctx.fillStyle = '#2a2d36';
  ctx.fill();
  // notch on base
  ctx.beginPath();
  const nW = w * 0.14;
  roundedRectPath(ctx, w / 2 - nW / 2, lidH, nW, baseH * 0.5, baseH * 0.25);
  ctx.fillStyle = '#20232b';
  ctx.fill();
  return c;
}

// Small preview for the picker modal.
export function paintMockupPreview(canvas, mockup) {
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 96);
  const h = (canvas.height = canvas.clientHeight || 60);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#3a3f4c';
  const pad = 10;
  if (!mockup || mockup.id === 'none') {
    roundedRectPath(ctx, pad, pad, w - pad * 2, h - pad * 2, 4);
    ctx.fill();
    return;
  }
  if (mockup.id === 'phone') {
    const pw = (h - pad * 2) * 0.5;
    roundedRectPath(ctx, w / 2 - pw / 2, pad, pw, h - pad * 2, 6);
    ctx.fill();
  } else if (mockup.id === 'laptop') {
    roundedRectPath(ctx, pad + 6, pad, w - pad * 2 - 12, h - pad * 2 - 8, 3);
    ctx.fill();
    ctx.fillRect(pad, h - pad - 4, w - pad * 2, 4);
  } else {
    roundedRectPath(ctx, pad, pad, w - pad * 2, h - pad * 2, 4);
    ctx.fill();
    ctx.fillStyle = '#20232b';
    ctx.fillRect(pad, pad, w - pad * 2, 8);
  }
}
