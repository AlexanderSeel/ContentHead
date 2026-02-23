import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['graphiql', '@graphiql/react', 'monaco-editor', 'monaco-graphql']
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
