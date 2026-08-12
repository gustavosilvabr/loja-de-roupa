import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { AdminProvider } from '../admin/store/AdminProvider';
import { ImagensProvider } from '../admin/store/ImagensProvider';
import { CartProvider } from '../store/cart';

function Providers({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <ImagensProvider>
        <CartProvider>{children}</CartProvider>
      </ImagensProvider>
    </AdminProvider>
  );
}

/**
 * Renderiza uma tela com os providers reais (nada de mock) na rota indicada.
 * `path` permite testar telas que leem parâmetros de URL.
 */
export function renderNaRota(
  ui: ReactElement,
  { rota = '/', path = '*' }: { rota?: string; path?: string } = {}
) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Providers>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </Providers>
    </MemoryRouter>
  );
}

export function renderSimples(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <Providers>{ui}</Providers>
    </MemoryRouter>
  );
}
