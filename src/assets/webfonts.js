// Self-hosted Arabic web fonts (via @fontsource). Importing the CSS makes Vite
// bundle the woff2 files locally — no runtime network dependency, so text renders
// identically in the live preview and the offscreen export. For each weight we
// import BOTH the Latin and the Arabic subset so mixed Arabic + Latin/number text
// (e.g. scores, hashtags) renders in a single family.

import '@fontsource/cairo/400.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/900.css';
import '@fontsource/cairo/arabic-400.css';
import '@fontsource/cairo/arabic-700.css';
import '@fontsource/cairo/arabic-900.css';

import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/900.css';
import '@fontsource/tajawal/arabic-400.css';
import '@fontsource/tajawal/arabic-700.css';
import '@fontsource/tajawal/arabic-900.css';

import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';

// Family name → weights we actually shipped, for proactive loading.
const WEB_FONT_WEIGHTS = [
  ['Cairo', [400, 700, 900]],
  ['Tajawal', [400, 700, 900]],
  ['IBM Plex Sans Arabic', [400, 600, 700]],
];

// Ask the browser to fetch every shipped weight up front (with a mixed sample so
// both subsets load). Canvas can only draw a web font once its glyphs are ready,
// so we kick this off at boot; the RAF preview loop then picks them up on swap.
export async function preloadWebFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  const jobs = [];
  for (const [family, weights] of WEB_FONT_WEIGHTS) {
    for (const w of weights) {
      jobs.push(
        document.fonts.load(`${w} 40px "${family}"`, 'أبجد Abc 123').catch(() => {})
      );
    }
  }
  await Promise.allSettled(jobs);
}
