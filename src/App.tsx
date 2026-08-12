import { Suspense, lazy, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CookieBanner } from './components/CookieBanner';
import { Pixels, SeoHead, ThemeVars, WhatsAppButton } from './components/StoreChrome';
import { Tracker } from './lib/tracking';
import { useImagensVersao } from './lib/useImagensVersao';
import Home from './pages/Home';

// A home entra no bundle inicial; o resto carrega sob demanda.
// O painel é pesado e nunca deve pesar no carregamento da loja.
const Collection = lazy(() => import('./pages/Collection'));
const Product = lazy(() => import('./pages/Product'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Search = lazy(() => import('./pages/Search'));
const StaticPage = lazy(() => import('./pages/StaticPage'));
const Tracking = lazy(() => import('./pages/Tracking'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

function StoreLayout() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="conteudo">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <CookieBanner />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  // Re-renderiza a árvore quando as imagens enviadas do computador ficam
  // prontas — só então img() consegue resolver as referências "local:".
  useImagensVersao();

  return (
    <>
      <ThemeVars />
      <SeoHead />
      <Pixels />
      <ScrollToTop />
      <Tracker />

      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-ink focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>

      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />

          {/* Checkout fica fora do layout da loja, como no Shopify */}
          <Route path="/checkout" element={<Checkout />} />

          <Route element={<StoreLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/colecoes/:handle" element={<Collection />} />
            <Route path="/produtos/:handle" element={<Product />} />
            <Route path="/busca" element={<Search />} />
            <Route path="/paginas/:slug" element={<StaticPage />} />
            <Route path="/rastreio" element={<Tracking />} />
            <Route path="/conta" element={<Tracking />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
