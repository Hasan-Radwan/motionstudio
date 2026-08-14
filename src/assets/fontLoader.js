// Load a user-uploaded font file (.ttf/.otf/.woff/.woff2) as a live FontFace so
// it can be used on text layers and included in the export. Returns the generated
// { family, name }.

import { registerCustomFont } from './fonts.js';

let _seq = 0;

function cleanName(fileName) {
  return String(fileName || 'Custom font')
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

// Register a font from a Blob/File. `family` is optional (kept stable across
// reloads when restoring a saved project); a fresh one is generated otherwise.
export async function loadFontFromBlob(blob, fileName, family) {
  const buf = await blob.arrayBuffer();
  const fam = family || `user-font-${Date.now().toString(36)}-${_seq++}`;
  const face = new FontFace(fam, buf);
  await face.load();
  document.fonts.add(face);
  const name = cleanName(fileName);
  const id = `font:${fam}`;
  registerCustomFont({ id, name, family: fam });
  return { id, name, family: fam };
}
