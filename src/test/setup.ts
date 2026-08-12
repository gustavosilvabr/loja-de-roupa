import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cada teste começa com o navegador "limpo": sem carrinho, sem
// configurações salvas e sem sessão de visitante.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

// jsdom não implementa matchMedia, e o GSAP consulta prefers-reduced-motion.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// jsdom não implementa URL de objeto, usada pelas imagens enviadas do PC.
let contadorBlob = 0;
if (!URL.createObjectURL) {
  URL.createObjectURL = () => `blob:teste-${contadorBlob++}`;
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

class IntersectionObserverMock {
  root = null;
  rootMargin = '';
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
window.IntersectionObserver =
  IntersectionObserverMock as unknown as typeof IntersectionObserver;
