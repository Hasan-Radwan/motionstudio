import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5178,
    host: true,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        // The app (index.html) + a standalone bundle that renders the live
        // template previews on the server-rendered /templates category pages.
        main: 'index.html',
        preview: 'src/preview/templatePreview.js',
      },
      output: {
        // Fixed name for the preview entry so the Worker can reference it stably;
        // everything else keeps content-hashed filenames for cache-busting.
        entryFileNames: (chunk) => (chunk.name === 'preview' ? 'template-preview.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
});
