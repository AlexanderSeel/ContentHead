import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
const graphqlEsmEntry = require.resolve('graphql/index.mjs');
const nullthrowsShimEntry = fileURLToPath(new URL('./src/vendor/nullthrows.ts', import.meta.url));

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['graphql'],
    exclude: ['monaco-editor', 'monaco-graphql'],
    esbuildOptions: {
      // monaco-graphql publishes sourcemap references that are not shipped.
      // Suppress the noisy warning from dependency scanning/prebundling.
      logOverride: {
        'invalid-source-mappings': 'silent'
      }
    }
  },
  resolve: {
    alias: [
      { find: /^graphql$/, replacement: graphqlEsmEntry },
      { find: /^graphql\/index\.mjs$/, replacement: graphqlEsmEntry },
      { find: /^nullthrows$/, replacement: nullthrowsShimEntry }
    ],
    dedupe: ['graphql'],
    // Prefer TypeScript sources when .ts/.tsx and .js siblings both exist.
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json']
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
