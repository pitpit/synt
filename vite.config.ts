import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(async () => {
  const { default: cssInjectedByJsPlugin } = await import('vite-plugin-css-injected-by-js');
  return {
    root: 'src',
    publicDir: '../public',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
    plugins: [
      cssInjectedByJsPlugin(),
      legacy({
        targets: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead'],
      }),
    ],
    server: {
      port: 9000,
      open: true,
    },
  };
});
