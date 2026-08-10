// Low-level canvas drawing helpers shared by every template.

// Draw an image so it covers the target rect (like CSS object-fit: cover),
// centered, cropping overflow. Returns nothing.
export function drawImageCover(ctx, img, x, y, w, h) {
  if (!img || !img.width) return;
  const ir = img.width / img.height;
  const rr = w / h;
  let sw, sh, sx, sy;
  if (ir > rr) {
    // image wider than target -> crop sides
    sh = img.height;
    sw = sh * rr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / rr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Draw an image scaled to CONTAIN the rect (whole image visible, letterboxed).
export function drawImageContain(ctx, img, x, y, w, h) {
  if (!img || !img.width) return;
  const ir = img.width / img.height;
  const rr = w / h;
  let dw, dh;
  if (ir > rr) {
    dw = w;
    dh = w / ir;
  } else {
    dh = h;
    dw = h * ir;
  }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// Convert a "Corners" percentage (0–50) into a pixel radius relative to a card's
// smaller side. At 50% the radius reaches half the shortest side, so a square
// card becomes a full circle (and a rectangle becomes a pill).
export function cornerR(pct, w, h) {
  return (Math.max(0, pct) / 100) * Math.min(w, h);
}

// ---------- Card shape ----------
// Global card shape applied by drawCard() across every card-based template.
// 'original' keeps each template's natural (image-aspect) box; the others reshape
// the card's box and clip path. Stored as module state so both the live preview
// and the offscreen exporter (which share this module) stay in sync.
let _cardShape = 'original';
export function setCardShape(shape) {
  _cardShape = shape || 'original';
}
export function getCardShape() {
  return _cardShape;
}

// Fit a rect of the given aspect ratio inside (x,y,w,h), centered (contain).
function fitRatio(x, y, w, h, ratio) {
  let nw, nh;
  if (w / h > ratio) {
    nh = h;
    nw = h * ratio;
  } else {
    nw = w;
    nh = w / ratio;
  }
  return { x: x + (w - nw) / 2, y: y + (h - nh) / 2, w: nw, h: nh };
}

// Map a template's card box to the active shape's box.
export function cardShapeBox(x, y, w, h, shape = _cardShape) {
  if (shape === 'landscape') return fitRatio(x, y, w, h, 1.6);
  if (shape === 'portrait') return fitRatio(x, y, w, h, 0.625);
  if (shape === 'square' || shape === 'circle' || shape === 'triangle') {
    const s = Math.min(w, h);
    return { x: x + (w - s) / 2, y: y + (h - s) / 2, w: s, h: s };
  }
  return { x, y, w, h }; // 'original'
}

// Path the active shape into ctx (does not fill/stroke).
export function pathCardShape(ctx, x, y, w, h, shape, r) {
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
    return;
  }
  if (shape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    return;
  }
  roundedRectPath(ctx, x, y, w, h, r);
}

// Draw an image clipped to the active card shape, with optional border.
function shapedImage(ctx, img, x, y, w, h, shape, r, border) {
  ctx.save();
  pathCardShape(ctx, x, y, w, h, shape, r);
  ctx.clip();
  if (img && img.width) {
    drawImageCover(ctx, img, x, y, w, h);
  } else {
    ctx.fillStyle = '#2a2f3a';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  if (border && border.width > 0) {
    ctx.save();
    pathCardShape(ctx, x, y, w, h, shape, r);
    ctx.lineWidth = border.width;
    ctx.strokeStyle = border.color;
    ctx.stroke();
    ctx.restore();
  }
}

// Path a rounded rectangle (does not fill/stroke — caller decides).
export function roundedRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// Draw an image clipped to a rounded rect, with optional border.
export function roundedImage(ctx, img, x, y, w, h, r, border) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  if (img && img.width) {
    drawImageCover(ctx, img, x, y, w, h);
  } else {
    // placeholder fill when no asset yet
    ctx.fillStyle = '#2a2f3a';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  if (border && border.width > 0) {
    ctx.save();
    roundedRectPath(ctx, x, y, w, h, r);
    ctx.lineWidth = border.width;
    ctx.strokeStyle = border.color;
    ctx.stroke();
    ctx.restore();
  }
}

// Set a soft drop shadow. Call before drawing, then resetShadow() after.
export function setShadow(ctx, blur, color, offsetY = 0, offsetX = 0) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
}
export function resetShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// A diagonal "shine" sweep across a rounded rect. `p` in [0,1] is sweep progress.
export function shineSweep(ctx, x, y, w, h, r, p, strength = 0.35) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  const band = w * 0.5;
  const cx = x - band + (w + band * 2) * p;
  const g = ctx.createLinearGradient(cx - band, y, cx + band, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, `rgba(255,255,255,${strength})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Draw a card (shadow + image + optional shine) in one call, honouring the active
// global card shape (see setCardShape). opts: { r, shadowBlur, shadowColor,
// shadowY, shine, border }.
export function drawCard(ctx, img, x, y, w, h, opts = {}) {
  const shape = _cardShape;
  const box = cardShapeBox(x, y, w, h, shape);
  x = box.x;
  y = box.y;
  w = box.w;
  h = box.h;
  const r = opts.r ?? 16;
  ctx.save();
  if (opts.shadowBlur) {
    setShadow(
      ctx,
      opts.shadowBlur,
      opts.shadowColor || 'rgba(0,0,0,0.45)',
      opts.shadowY ?? opts.shadowBlur * 0.4
    );
    // paint a solid shape first so the shadow shows even for transparent PNGs
    pathCardShape(ctx, x, y, w, h, shape, r);
    ctx.fillStyle = '#0e0f13';
    ctx.fill();
    resetShadow(ctx);
  }
  shapedImage(ctx, img, x, y, w, h, shape, r, opts.border);
  if (opts.shine != null && opts.shine !== false) {
    ctx.save();
    pathCardShape(ctx, x, y, w, h, shape, r);
    ctx.clip();
    const p = opts.shine;
    const band = w * 0.5;
    const sx = x - band + (w + band * 2) * p;
    const g = ctx.createLinearGradient(sx - band, y, sx + band, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${opts.shineStrength ?? 0.3})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  ctx.restore();
}

// Convert a hex/rgba color plus alpha into an rgba() string.
export function withAlpha(hex, a) {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16
  );
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
