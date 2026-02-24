import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['react-compiler-runtime', 'nullthrows', 'graphql-language-service'],
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
    // Prefer TypeScript sources when .ts/.tsx and .js siblings both exist.
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json']
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
