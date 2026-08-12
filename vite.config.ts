import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      output: {
        // O catálogo muda com frequência diferente do código — separar melhora o cache.
        manualChunks(id) {
          if (id.includes('src/data/products') || id.includes('src/data/collections')) {
            return 'catalogo';
          }
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react';
          }
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
