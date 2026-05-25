import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig(async () => {
  const { default: cssInjectedByJsPlugin } = await import('vite-plugin-css-injected-by-js');
  return {
    base: '/synt/',
    root: 'src',
    publicDir: '../public',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      assetsDir: '',
      rollupOptions: {
        input: { synt: resolve('./src/index.html') },
        output: {
          entryFileNames: '[name].js',
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      cssInjectedByJsPlugin(),
      legacy({
        targets: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead']
      }),
    ],
    server: {
      port: 9000,
      open: true,
    },
  };
});
