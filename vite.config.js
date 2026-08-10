import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5178,
    host: true,
  },
  build: {
    target: 'es2022',
  },
});
