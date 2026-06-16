import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 8 (rolldown) builtin:vite-transform determines OXC parse lang from
// file extension, so .js files are parsed as plain JS — JSX causes an error.
// This pre-plugin transforms JSX in .js files before the builtin sees them.
function jsJsxPlugin() {
  return {
    name: 'vite:js-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.endsWith('.js') || id.includes('node_modules')) return null;
      if (!/<[A-Za-z]/.test(code) && !code.includes('/>')) return null;
      const { transform: oxcTransform } = await import('rolldown/utils');
      const result = await oxcTransform(id, code, {
        lang: 'jsx',
        jsx: { runtime: 'automatic', importSource: 'react' },
        sourcemap: true,
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  plugins: [jsJsxPlugin(), react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/o': 'http://localhost:8000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
