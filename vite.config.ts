import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    legacy({
      targets: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead'],
    }),
  ],
  server: {
    port: 9000,
    open: true,
  },
});
