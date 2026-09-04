// Entry bundle for the server-rendered /templates category pages: mounts the live
// previews on every <canvas class="tpv" data-tpl="…">. The engine is shared with
// the homepage slider (see livePreview.js).

import { mountLivePreviews } from './livePreview.js';

function start() {
  mountLivePreviews(document.querySelectorAll('canvas.tpv[data-tpl]'));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
