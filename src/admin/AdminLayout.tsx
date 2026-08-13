import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAdmin } from './store/AdminProvider';
import { useOlheiroAutomatico } from './store/useSincronizador';
import { sair } from './store/nuvem';
import { contarDemo } from './store/avaliacoesDemo';

interface NavGroup {
  label: string;
  items: { to: string; label: string; end?: boolean }[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Estatísticas',
    items: [
      { to: '/admin', label: 'Visão geral', end: true },
      { to: '/admin/visitantes', label: 'Visitantes' },
      { to: '/admin/carrinhos', label: 'Carrinhos abandonados' },
      { to: '/admin/clientes', label: 'Clientes' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/admin/vendas', label: 'Vendas' },
      { to: '/admin/produtos', label: 'Produtos' },
      { to: '/admin/categorias', label: 'Categorias' },
      { to: '/admin/precos', label: 'Preços e lucro' },
      { to: '/admin/sincronizacao', label: 'Olheiro do catálogo' },
    ],
  },
  {
    label: 'Loja online',
    items: [
      { to: '/admin/banners', label: 'Banners e carrosséis' },
      { to: '/admin/menu', label: 'Menu e avisos' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { to: '/admin/config/marca', label: 'Marca e contato' },
      { to: '/admin/config/dominio', label: 'Domínio' },
      { to: '/admin/config/gateway', label: 'Pagamento' },
      { to: '/admin/config/frete', label: 'Frete' },
      { to: '/admin/config/seo', label: 'SEO' },
      { to: '/admin/config/pixels', label: 'Pixels e integrações' },
      { to: '/admin/config/politicas', label: 'Políticas' },
      { to: '/admin/config/nuvem', label: 'Catálogo na nuvem' },
      { to: '/admin/config/dados', label: 'Dados e backup' },
    ],
  },
];

/** Confirma visualmente cada alteração: aparece por 2s a cada gravação. */
function SavedIndicator() {
  const { savedAt } = useAdmin();
  const [visivel, setVisivel] = useState(false);
  const primeiro = useRef(true);

  useEffect(() => {
    // A primeira gravação é a hidratação inicial, não uma edição do lojista.
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    if (!savedAt) return;

    setVisivel(true);
    const id = window.setTimeout(() => setVisivel(false), 2000);
    return () => window.clearTimeout(id);
  }, [savedAt]);

  return (
    <span
      role="status"
      aria-live="polite"
      className={`hidden items-center gap-1.5 text-[12px] text-emerald-600 transition-opacity duration-300 sm:flex ${
        visivel ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {visivel ? 'Alterações salvas' : ''}
    </span>
  );
}

export function AdminLayout() {
  const { settings, nuvem, catalog } = useAdmin();
  const comDemo = contarDemo(catalog);
  useOlheiroAutomatico();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topo */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Alternar menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>

            <Link to="/admin" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-[13px] font-bold text-white">
                X
              </span>
              <span className="text-[15px] font-bold text-slate-900">Painel</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {nuvem.ativa && (
              <span
                className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold sm:inline-flex ${
                  nuvem.erro
                    ? 'bg-red-50 text-red-700'
                    : nuvem.gravando
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                }`}
                title={nuvem.erro ?? 'As alterações já aparecem para os clientes'}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    nuvem.erro ? 'bg-red-500' : nuvem.gravando ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                {nuvem.erro ? 'Falha ao publicar' : nuvem.gravando ? 'Publicando…' : 'No ar'}
              </span>
            )}
            <SavedIndicator />
            <Link
              to="/"
              target="_blank"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ver loja ↗
            </Link>
            <span className="hidden text-[13px] font-medium text-slate-700 sm:block">
              {settings.brand.name}
            </span>
            {nuvem.email && (
              <button
                type="button"
                onClick={() => void sair()}
                title={nuvem.email}
                className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      {comDemo > 0 && (
        <p className="bg-red-600 px-4 py-2 text-center text-[13px] font-semibold text-white">
          {comDemo} produtos estão com avaliação de demonstração (inventada).{' '}
          <Link to="/admin/config/dados" className="underline">
            Remover antes de divulgar a loja
          </Link>
        </p>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 top-14 z-20 w-[240px] overflow-y-auto border-r border-slate-200 bg-white pb-10 transition-transform lg:sticky lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ height: 'calc(100vh - 3.5rem)' }}
        >
          <nav className="px-3 py-4">
            <NavLink
              to="/admin/ajuda"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `mb-5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${
                  isActive
                    ? 'bg-violet-50 font-semibold text-violet-700'
                    : 'bg-violet-50/50 text-violet-700 hover:bg-violet-50'
                }`
              }
            >
              <span aria-hidden="true">💡</span>
              Como usar o painel
            </NavLink>

            <NavLink
              to="/admin/editor"
              onClick={() => setOpen(false)}
              className="mb-5 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <span aria-hidden="true">🎨</span>
              Editar aparência da loja
            </NavLink>

            {GROUPS.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
                            isActive
                              ? 'bg-sky-50 font-semibold text-sky-700'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {open && (
          <div
            className="fixed inset-0 top-14 z-10 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
