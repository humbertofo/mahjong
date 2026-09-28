import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Essencial para carregamento local de assets no WebView do Capacitor
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2022',
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    port: 3000,
    open: false,
  },
});
