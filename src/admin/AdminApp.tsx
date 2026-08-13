import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { lazy, Suspense } from 'react';
import { Login } from './Login';
import { useAdmin } from './store/AdminProvider';

// O editor tem layout próprio, fora do AdminLayout: é uma ferramenta
// focada só em aparência, não mais uma página do painel.
const EditorTema = lazy(() => import('../editor/EditorTema'));

import VisaoGeral from './pages/VisaoGeral';
import Ajuda from './pages/Ajuda';
import Precos from './pages/Precos';
import Sincronizacao from './pages/Sincronizacao';
import Visitantes from './pages/Visitantes';
import Carrinhos from './pages/Carrinhos';
import Clientes from './pages/Clientes';
import Vendas from './pages/Vendas';
import Produtos from './pages/Produtos';
import ProdutoEditar from './pages/ProdutoEditar';
import Categorias from './pages/Categorias';
import Banners from './pages/Banners';
import MenuAvisos from './pages/MenuAvisos';
import Marca from './pages/config/Marca';
import Dominio from './pages/config/Dominio';
import Gateway from './pages/config/Gateway';
import Frete from './pages/config/Frete';
import Seo from './pages/config/Seo';
import Pixels from './pages/config/Pixels';
import Politicas from './pages/config/Politicas';
import Dados from './pages/config/Dados';
import CatalogoNuvem from './pages/config/CatalogoNuvem';

/** Sub-aplicação do painel, carregada sob demanda em /admin. */
export default function AdminApp() {
  const { nuvem } = useAdmin();

  // Sem nuvem configurada o painel roda em modo local, como antes.
  if (nuvem.ativa) {
    if (nuvem.carregando) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"
            role="status"
            aria-label="Carregando o painel"
          />
        </div>
      );
    }
    if (!nuvem.email) return <Login primeiroAcesso={false} />;
  }

  return (
    <Routes>
      <Route
        path="editor"
        element={
          <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
            <EditorTema />
          </Suspense>
        }
      />

      <Route element={<AdminLayout />}>
        <Route index element={<VisaoGeral />} />
        <Route path="ajuda" element={<Ajuda />} />
        <Route path="visitantes" element={<Visitantes />} />
        <Route path="carrinhos" element={<Carrinhos />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="vendas" element={<Vendas />} />

        <Route path="produtos" element={<Produtos />} />
        <Route path="produtos/:handle" element={<ProdutoEditar />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="precos" element={<Precos />} />
        <Route path="sincronizacao" element={<Sincronizacao />} />

        {/* Aparência agora vive só no editor de tema. */}
        <Route path="aparencia" element={<Navigate to="/admin/editor" replace />} />
        <Route path="home" element={<Navigate to="/admin/editor" replace />} />
        <Route path="banners" element={<Banners />} />
        <Route path="menu" element={<MenuAvisos />} />

        <Route path="config/marca" element={<Marca />} />
        <Route path="config/dominio" element={<Dominio />} />
        <Route path="config/gateway" element={<Gateway />} />
        <Route path="config/frete" element={<Frete />} />
        <Route path="config/seo" element={<Seo />} />
        <Route path="config/pixels" element={<Pixels />} />
        <Route path="config/politicas" element={<Politicas />} />
        <Route path="config/dados" element={<Dados />} />
        <Route path="config/nuvem" element={<CatalogoNuvem />} />
      </Route>
    </Routes>
  );
}
