import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Só TypeScript. Se alguma ferramenta emitir um .js ao lado do .ts,
    // o Vitest rodaria a mesma suíte duas vezes.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
