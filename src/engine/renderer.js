// The renderer owns the live preview loop and the single source of truth for
// "what a frame looks like": drawScene(ctx, w, h, t). Both the on-screen preview
// and the exporter call drawScene, so export is pixel-identical to preview.

import { drawBackground } from '../assets/backgrounds.js';
import { compositeMockup } from '../assets/mockups.js';
import { resolveFontStack, isRtlFont } from '../assets/fonts.js';
import { TAU, pingpong, triangle } from './easing.js';

// Arabic / Hebrew / other RTL script ranges — used to auto-detect direction.
const RTL_RE = /[֐-׿؀-ۿ܀-ݏݐ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿]/;

const ASPECTS = {
  '16:9': [16, 9],
  '1:1': [1, 1],
  '9:16': [9, 16],
  '4:5': [4, 5],
  '4:3': [4, 3],
};

// Preview backing-store long side (CSS scales it to fit the stage).
const PREVIEW_LONG = 1000;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.template = null;
    this.params = {};
    this.images = []; // raw uploaded images (filled slots, in order)
    this._composites = []; // each possibly wrapped in a mockup frame
    this.placeholder = null; // demo asset shown before any upload
    this.sampleImages = []; // optional per-template default card images (before upload)
    this.autoBackground = null; // optional per-template default background (transient)
    this.useAutoBackground = false; // draw autoBackground instead of `background`
    this._easing = null; // optional global timing curve applied to the loop time
    this.texts = []; // optional text overlay layers
    this.watermark = null; // optional logo overlay { img, size, corner, opacity, margin }
    this.background = null;
    this.mockup = null;
    this.aspect = '16:9';
    this.duration = 4; // seconds per loop
    this._raf = null;
    this.t = 0; // current normalized loop time [0,1)
    this._playing = true; // whether time advances (timeline play/pause)
    this._last = null; // last rAF timestamp
    this._onFrame = []; // callbacks(t, playing) for UI: timeline + audio sync
    this.resizeToAspect();
  }

  aspectRatio() {
    const [aw, ah] = ASPECTS[this.aspect] || ASPECTS['16:9'];
    return aw / ah;
  }

  resizeToAspect() {
    const r = this.aspectRatio();
    let w, h;
    if (r >= 1) {
      w = PREVIEW_LONG;
      h = Math.round(PREVIEW_LONG / r);
    } else {
      h = PREVIEW_LONG;
      w = Math.round(PREVIEW_LONG * r);
    }
    this.canvas.width = w;
    this.canvas.height = h;
  }

  setTemplate(tpl) {
    this.template = tpl;
    return this;
  }
  setParams(p) {
    this.params = p;
    return this;
  }
  patchParams(partial) {
    this.params = { ...this.params, ...partial };
    return this;
  }
  setAspect(a) {
    if (ASPECTS[a]) {
      this.aspect = a;
      this.resizeToAspect();
      this._rebuildComposite();
    }
    return this;
  }
  setDuration(sec) {
    this.duration = Math.max(0.5, sec);
    return this;
  }
  setBackground(bg) {
    this.background = bg;
    return this;
  }
  setMockup(mock) {
    this.mockup = mock;
    this._rebuildComposite();
    return this;
  }
  // The demo asset used when the user hasn't uploaded anything yet.
  setPlaceholder(img) {
    this.placeholder = img;
    return this;
  }
  // Per-template default card images, shown (cycled) before the user uploads any.
  // Set the global timing curve (a function t→t' with fixed 0/1 endpoints so the
  // loop stays seamless). Pass null for linear.
  setEasing(fn) {
    this._easing = typeof fn === 'function' ? fn : null;
    return this;
  }
  setSampleImages(arr) {
    this.sampleImages = (arr || []).filter(Boolean);
    return this;
  }
  // Per-template default background (transient; never persisted). `useAuto` gates
  // whether it's drawn instead of the user/global background.
  setAutoBackground(bg) {
    this.autoBackground = bg || null;
    return this;
  }
  setUseAutoBackground(v) {
    this.useAutoBackground = !!v;
    return this;
  }
  // Set the full list of uploaded images (already filtered to filled slots).
  setImages(arr) {
    this.images = (arr || []).filter(Boolean);
    this._rebuildComposite();
    return this;
  }
  // Back-compat single-image setter.
  setImage(img) {
    return this.setImages(img ? [img] : []);
  }
  // Back-compat single-text setter (wraps into the layer list).
  setText(t) {
    this.texts = t ? [t] : [];
    return this;
  }
  // Full list of text overlays, drawn back-to-front.
  setTexts(list) {
    this.texts = Array.isArray(list) ? list : [];
    return this;
  }
  // Optional logo watermark config (or null to clear).
  setWatermark(wm) {
    this.watermark = wm || null;
    return this;
  }
  onFrame(cb) {
    // Multiple subscribers (the timeline UI + the audio sync) can listen.
    if (typeof cb === 'function') this._onFrame.push(cb);
    return this;
  }
  _emitFrame(t, playing) {
    for (const cb of this._onFrame) cb(t, playing);
  }

  hasImage() {
    return this._composites.length > 0;
  }

  // The image a template should draw for logical index i. Cycles through the
  // uploaded images; falls back to the demo placeholder when none exist. Negative
  // indices are handled (carousel wraps past 0), so it's always safe to call.
  imageAt(i) {
    const list = this._composites;
    if (!list.length) {
      // No uploads: prefer the template's default sample cards, else the placeholder.
      const s = this.sampleImages;
      if (s.length) return s[(((i | 0) % s.length) + s.length) % s.length];
      return this.placeholder;
    }
    const n = list.length;
    return list[(((i | 0) % n) + n) % n];
  }

  _rebuildComposite() {
    if (this.mockup && this.mockup.id !== 'none') {
      this._composites = this.images.map((im) => compositeMockup(im, this.mockup));
    } else {
      this._composites = this.images.slice();
    }
  }

  get asset() {
    return this.imageAt(0);
  }

  // The pure scene function. Draws one frame at normalized loop time t in [0,1).
  drawScene(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    // Remap the linear loop time through the global easing curve (endpoints are
    // pinned so the loop stays seamless). Everything drawn uses the eased time so
    // the whole composition shares one motion feel.
    const te = this._easing ? this._easing(t) : t;
    const bg = this.useAutoBackground && this.autoBackground ? this.autoBackground : this.background;
    drawBackground(ctx, w, h, bg, te);
    this._drawText(ctx, w, h, te, 'back'); // text layers placed behind the cards
    if (this.template && typeof this.template.render === 'function') {
      ctx.save();
      // Global Position X/Y for templates that don't handle it themselves: shift
      // the whole composition (its cards) together. Native-position templates set
      // hasOwnPos and apply their own offset inside render().
      if (!this.template.hasOwnPos) {
        const ox = ((this.params.posX || 0) / 100) * w;
        const oy = ((this.params.posY || 0) / 100) * h;
        if (ox || oy) ctx.translate(ox, oy);
      }
      this.template.render(ctx, te, this.params, {
        image: this.imageAt(0),
        imageAt: (i) => this.imageAt(i),
        // Fall back to the count of default sample cards when nothing is uploaded,
        // so multi-image templates (carousels/grids) lay out their sample set
        // instead of collapsing to a single card.
        count: Math.max(1, this._composites.length || this.sampleImages.length),
        w,
        h,
      });
      ctx.restore();
    }
    this._drawText(ctx, w, h, te, 'front'); // text layers on top of the cards
    this._drawWatermark(ctx, w, h);
  }

  // A user-supplied logo pinned to a corner. Drawn on top of everything so it
  // survives into the export. Size is the logo's longer side as a % of the frame's
  // shorter side; corner is 'tl' | 'tr' | 'bl' | 'br' | 'center'.
  _drawWatermark(ctx, w, h) {
    const wm = this.watermark;
    if (!wm || wm.enabled === false || !wm.img || !wm.img.width) return;
    const min = Math.min(w, h);
    const target = (min * (wm.size ?? 14)) / 100;
    const ratio = wm.img.width / wm.img.height;
    let lw, lh;
    if (ratio >= 1) {
      lw = target;
      lh = target / ratio;
    } else {
      lh = target;
      lw = target * ratio;
    }
    const m = (min * (wm.margin ?? 4)) / 100;
    const corner = wm.corner || 'br';
    let x, y;
    if (corner === 'center') {
      x = (w - lw) / 2;
      y = (h - lh) / 2;
    } else {
      x = corner.endsWith('l') ? m : w - m - lw;
      y = corner.startsWith('t') ? m : h - m - lh;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, (wm.opacity ?? 100) / 100));
    ctx.drawImage(wm.img, x, y, lw, lh);
    ctx.restore();
  }

  // Optional text overlays, drawn on top of the template every frame so they show
  // in both the live preview and the export. Animations are seamless over the loop.
  _drawText(ctx, w, h, t, layer = 'front') {
    if (!this.texts || !this.texts.length) return;
    for (const tx of this.texts) {
      if ((tx.layer || 'front') === layer) this._drawOneText(ctx, w, h, t, tx);
    }
  }

  _drawOneText(ctx, w, h, t, tx) {
    if (!tx || !tx.content) return;
    const min = Math.min(w, h);
    const size = min * (tx.size / 100);
    const anim = tx.anim || 'none';

    let alpha = 1;
    let dy = 0;
    let scale = 1;
    let reveal = 1;
    if (anim === 'fade') alpha = pingpong(t);
    else if (anim === 'rise') {
      alpha = pingpong(t);
      dy = (1 - pingpong(t)) * size * 0.9;
    } else if (anim === 'float') dy = Math.sin(t * TAU) * size * 0.22;
    else if (anim === 'pop') scale = 1 + 0.08 * Math.sin(t * TAU);
    else if (anim === 'type') reveal = triangle(t);

    // Text direction: explicit ('rtl'/'ltr') wins; otherwise 'auto' picks RTL when
    // the content contains Arabic (or the chosen font is an Arabic face). Canvas
    // shapes Arabic joining automatically; direction fixes bidi order + alignment.
    let dir = tx.dir && tx.dir !== 'auto' ? tx.dir : null;
    if (!dir) dir = RTL_RE.test(tx.content) || isRtlFont(tx.font) ? 'rtl' : 'ltr';

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.direction = dir;
    ctx.textAlign = tx.align || 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${tx.weight || 600} ${size}px ${resolveFontStack(tx.font)}`;
    ctx.translate(w * (tx.x / 100), h * (tx.y / 100) + dy);
    ctx.scale(scale, scale);
    // Optional drop shadow (off by default; toggled per text from the text panel).
    if (tx.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = size * 0.14;
      ctx.shadowOffsetY = size * 0.04;
    }
    ctx.fillStyle = tx.color || '#ffffff';

    const lines = String(tx.content).split('\n');
    const lineH = size * 1.18;
    const totalH = lineH * (lines.length - 1);
    lines.forEach((line, i) => {
      let out = line;
      if (anim === 'type') out = line.slice(0, Math.round(line.length * reveal));
      ctx.fillText(out, 0, i * lineH - totalH / 2);
    });
    ctx.restore();
  }

  // Whether the current background wants a transparent canvas (for WebM alpha).
  isTransparent() {
    return this.background && this.background.type === 'transparent';
  }

  // The rAF loop runs continuously while the studio is open so the preview always
  // reflects live edits — but the loop TIME only advances while `_playing`, so the
  // timeline can pause/scrub on a frozen frame that still updates as you edit.
  _tick = (now) => {
    if (this._last == null) this._last = now;
    const dt = (now - this._last) / 1000;
    this._last = now;
    if (this._playing) {
      this.t = (this.t + dt / this.duration) % 1;
      if (this.t < 0) this.t += 1;
    }
    this.drawScene(this.ctx, this.canvas.width, this.canvas.height, this.t);
    this._emitFrame(this.t, this._playing);
    this._raf = requestAnimationFrame(this._tick);
  };

  // Start/stop own the rAF lifecycle (studio open/close). Play/pause/seek drive the
  // timeline without tearing down the loop.
  start() {
    if (this._raf) return;
    this._playing = true;
    this._last = null;
    this._raf = requestAnimationFrame(this._tick);
  }
  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this._last = null;
  }
  play() {
    this._playing = true;
    this._last = null;
    if (!this._raf) this._raf = requestAnimationFrame(this._tick);
    this._emitFrame(this.t, true);
  }
  pause() {
    this._playing = false;
    this._emitFrame(this.t, false);
  }
  toggle() {
    if (this._playing) this.pause();
    else this.play();
  }
  // Jump to a normalized time [0,1). Repaints immediately when the loop is stopped.
  seek(t) {
    this.t = ((t % 1) + 1) % 1;
    this._last = null;
    if (!this._raf) this.drawScene(this.ctx, this.canvas.width, this.canvas.height, this.t);
    this._emitFrame(this.t, this._playing);
  }
  isPlaying() {
    return !!this._playing;
  }
  getTime() {
    return this.t;
  }
}
