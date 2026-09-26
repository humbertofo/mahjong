import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Essencial para carregamento local de assets no WebView do Capacitor
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: false,
  },
});
