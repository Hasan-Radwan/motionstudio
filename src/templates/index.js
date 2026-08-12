// Template registry. Every module exports { meta, controls, render }.
// The gallery and controls panel are generated entirely from this data —
// adding a template = adding a file here, no UI code changes.

import * as logo from './logo.js';
import * as cardTilt3d from './cardTilt3d.js';
import * as flip3d from './flip3d.js';
import * as cardTunnel from './cardTunnel.js';
import * as cube from './cube.js';
import * as orbit from './orbit.js';
import * as spiral from './spiral.js';
import * as globe from './globe.js';
import * as carousel from './carousel.js';
import * as coverflow from './coverflow.js';
import * as deck from './deck.js';
import * as filmstrip from './filmstrip.js';
import * as slideshow from './slideshow.js';
import * as grid from './grid.js';
import * as wave from './wave.js';
import * as mosaic from './mosaic.js';
import * as marquee from './marquee.js';
import * as totem from './totem.js';
import * as spotlight from './spotlight.js';
import * as pan from './pan.js';
import * as zoomBlur from './zoomBlur.js';
import * as revealWipe from './revealWipe.js';
import * as iris from './iris.js';
import * as blinds from './blinds.js';
import * as stackScatter from './stackScatter.js';
import * as fan from './fan.js';
import * as cascade from './cascade.js';
import * as isometric from './isometric.js';
import * as isoTiles from './isoTiles.js';
import * as orbWall from './orbWall.js';
import * as haloGlobe from './haloGlobe.js';
import * as arcCarousel from './arcCarousel.js';
import * as driftTiles from './driftTiles.js';
import * as depthDive from './depthDive.js';
import * as featureStream from './featureStream.js';
import * as neonFrame from './neonFrame.js';
import * as reflection from './reflection.js';
import * as ribbonFlow from './ribbonFlow.js';
import * as splitScreen from './splitScreen.js';
import * as cinematic from './cinematic.js';
import * as polaroidStack from './polaroidStack.js';

// Ordered so the gallery groups cleanly by category type.
export const TEMPLATES = [
  logo, neonFrame, // Logo & Branding
  cardTilt3d, flip3d, cardTunnel, cube, reflection, // 3D & Perspective
  orbit, spiral, globe, haloGlobe, orbWall, // Orbit
  carousel, coverflow, deck, filmstrip, arcCarousel, ribbonFlow, // Carousel & Flow
  slideshow, featureStream, splitScreen, // Slideshow & Story
  grid, wave, mosaic, driftTiles, // Grid
  marquee, totem, // Ticker & Marquee
  spotlight, pan, zoomBlur, cinematic, // Spotlight & Focus
  revealWipe, iris, blinds, // Reveal & Wipe
  stackScatter, fan, cascade, depthDive, polaroidStack, // Stack & Scatter
  isometric, isoTiles, // Isometric
].map((m) => ({ ...m.meta, controls: m.controls, render: m.render }));

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

// Build a params object from a template's control defaults.
export function defaultParams(tpl) {
  const p = {};
  for (const c of tpl.controls) p[c.key] = c.default;
  return p;
}

// How many image slots a template exposes, with sane fallbacks.
export function mediaConfig(tpl) {
  const m = tpl.media || {};
  const max = m.max ?? 12;
  const min = m.min ?? 1;
  const def = Math.min(max, Math.max(min, m.default ?? 1));
  return { min, max, default: def };
}

// A branded placeholder "screenshot" used for gallery thumbs and the empty stage,
// so users see motion immediately before uploading anything.
let _placeholder = null;
export function getPlaceholder() {
  if (_placeholder) return _placeholder;
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 750;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, '#2563EB');
  g.addColorStop(0.5, '#0ea5e9');
  g.addColorStop(1, '#00E5A0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  // a few UI-ish shapes so templates have structure to show
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(80, 90, 460, 60);
  ctx.fillRect(80, 190, 300, 34);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  roundRect(ctx, 80, 300, 1040, 360, 24);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '600 120px -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Aa', c.width - 90, 220);
  _placeholder = c;
  return c;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Render a static representative frame of a template into a thumb canvas.
export function paintThumb(canvas, tpl) {
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = 200);
  const h = (canvas.height = 78 * (200 / (canvas.clientWidth || 200)));
  canvas.width = 200;
  canvas.height = 78;
  const W = 200;
  const H = 78;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#181b22');
  bg.addColorStop(1, '#101218');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  try {
    tpl.render(ctx, 0.32, defaultParams(tpl), {
      image: getPlaceholder(),
      imageAt: () => getPlaceholder(),
      w: W,
      h: H,
    });
  } catch (e) {
    /* ignore thumb render errors */
  }
  ctx.restore();
}
