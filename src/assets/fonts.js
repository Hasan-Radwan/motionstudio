// Curated font families for the text overlay. System stacks render instantly;
// the Arabic families are self-hosted web fonts (see webfonts.js) and are marked
// rtl:true so the renderer defaults their text direction to right-to-left.

export const FONTS = [
  { id: 'system', name: 'System', stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif' },
  { id: 'serif', name: 'Serif', stack: 'Georgia, "Times New Roman", serif' },
  { id: 'mono', name: 'Mono', stack: '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace' },
  { id: 'rounded', name: 'Rounded', stack: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif' },
  { id: 'condensed', name: 'Condensed', stack: '"Arial Narrow", "Helvetica Neue", Arial, sans-serif' },
  { id: 'display', name: 'Display', stack: 'Impact, Haettenschweiler, "Arial Black", sans-serif' },
  // Arabic web fonts (self-hosted)
  { id: 'cairo', name: 'Cairo · عربي', stack: '"Cairo", sans-serif', rtl: true },
  { id: 'tajawal', name: 'Tajawal · عربي', stack: '"Tajawal", sans-serif', rtl: true },
  { id: 'ibm-arabic', name: 'IBM Plex Arabic · عربي', stack: '"IBM Plex Sans Arabic", sans-serif', rtl: true },
];

export const DEFAULT_FONT = FONTS[0];

// User-uploaded fonts, registered at runtime (see fontLoader.js). Each:
// { id, name, stack, custom: true }.
let CUSTOM = [];

// Built-in + user fonts, for the Font picker.
export function getAllFonts() {
  return [...FONTS, ...CUSTOM];
}

// Register an already-loaded custom font family so the picker + renderer see it.
export function registerCustomFont({ id, name, family }) {
  if (CUSTOM.some((f) => f.id === id)) return;
  CUSTOM.push({ id, name, stack: `"${family}", sans-serif`, custom: true });
}

export function resolveFontStack(id) {
  const f = getAllFonts().find((x) => x.id === id) || DEFAULT_FONT;
  return f.stack;
}

// Whether a font family is a right-to-left (Arabic) face.
export function isRtlFont(id) {
  const f = getAllFonts().find((x) => x.id === id);
  return !!(f && f.rtl);
}
