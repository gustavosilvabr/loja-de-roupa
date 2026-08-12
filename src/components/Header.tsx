import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSettings } from '../admin/store/AdminProvider';
import { useCart } from '../store/cart';
import { useCatalog } from '../admin/store/useResolvedCatalog';
import { searchIn } from '../lib/catalog';
import { brl, img } from '../lib/format';
import { Logo } from './Logo';
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';
import type { AlinhamentoLogo } from '../admin/types';

/* A grade tem sempre 3 colunas; o alinhamento decide em qual delas a logo
   cai e como ela se encosta dentro dessa coluna. Escrito por extenso porque
   o Tailwind precisa ver a classe inteira no código para gerá-la. */
const CELULA_LOGO: Record<AlinhamentoLogo, string> = {
  esquerda: 'col-start-1 justify-start',
  centro: 'col-start-2 justify-center',
  direita: 'col-start-2 justify-end',
};

const CELULA_LOGO_LG: Record<AlinhamentoLogo, string> = {
  esquerda: 'lg:col-start-1 lg:justify-start',
  centro: 'lg:col-start-2 lg:justify-center',
  direita: 'lg:col-start-2 lg:justify-end',
};

export function Header() {
  const { count, open } = useCart();
  const { nav, brand } = useSettings();
  const { products } = useCatalog();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = searchOpen ? searchIn(products, query, 6) : [];

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Trava o scroll do fundo enquanto o menu mobile está aberto
  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/busca?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery('');
  };

  const noCelular = brand.logoAlinhamentoMobile ?? 'centro';
  const noComputador = brand.logoAlinhamento ?? 'esquerda';

  /**
   * Celular e computador se alinham sozinhos, então a logo não pode
   * mudar de lugar no HTML — ela fica numa célula fixa e é a coluna da
   * grade que muda em cada tamanho de tela.
   */
  const celulaDaLogo = `${CELULA_LOGO[noCelular]} ${CELULA_LOGO_LG[noComputador]}`;
  const celulaDoMenu = noComputador === 'esquerda' ? 'lg:col-start-2' : 'lg:col-start-1';

  const menuPrincipal = (
    <nav
      className={`hidden items-center justify-center gap-6 lg:flex ${celulaDoMenu} lg:row-start-1`}
      aria-label="Navegação principal"
    >
      {nav.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          className={({ isActive }) =>
            `relative whitespace-nowrap text-[14px] font-medium transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:bg-brand after:transition-all ${
              isActive
                ? 'text-white after:w-full'
                : 'text-white/85 hover:text-white after:w-0 hover:after:w-full'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 bg-headerbg text-headertext">
      {/* "1fr auto 1fr" é o que centraliza de verdade: com as pontas iguais,
          a logo fica no meio da tela mesmo que o menu cresça. */}
      <div className="page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div className="col-start-1 row-start-1 flex min-w-0 items-center lg:hidden">
          <button
            type="button"
            className="p-1"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        <div
          className={`row-start-1 flex min-w-0 items-center ${celulaDaLogo}`}
          style={{ padding: `${brand.logoEspacamento ?? 8}px` }}
        >
          <Logo />
        </div>

        {menuPrincipal}

        <div className="col-start-3 row-start-1 flex items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar produtos"
            aria-expanded={searchOpen}
            className="rounded p-2 transition-colors hover:bg-white/10"
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </button>

          <Link
            to="/conta"
            aria-label="Minha conta"
            className="hidden rounded p-2 transition-colors hover:bg-white/10 sm:block"
          >
            <UserIcon />
          </Link>

          <button
            type="button"
            onClick={open}
            aria-label={`Carrinho com ${count} ${count === 1 ? 'item' : 'itens'}`}
            className="relative rounded p-2 transition-colors hover:bg-white/10"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-white/10 bg-headerbg">
          <div className="page py-4">
            <form onSubmit={submitSearch} role="search">
              <label htmlFor="site-search" className="sr-only">
                Buscar produtos
              </label>
              <div className="flex items-center gap-2 rounded-btn bg-white/10 px-3">
                <SearchIcon className="h-5 w-5 shrink-0 text-white/60" />
                <input
                  id="site-search"
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar camisas, times, retrô..."
                  className="w-full bg-transparent py-3 text-[15px] text-white outline-none placeholder:text-white/50"
                />
              </div>
            </form>

            {results.length > 0 && (
              <ul className="mt-3 divide-y divide-white/10 overflow-hidden rounded-btn bg-white/5">
                {results.map((p) => (
                  <li key={p.handle}>
                    <Link
                      to={`/produtos/${p.handle}`}
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center gap-3 p-2.5 transition-colors hover:bg-white/10"
                    >
                      <img
                        src={img(p.image, 120)}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate text-[14px]">{p.title}</span>
                      <span className="shrink-0 text-[14px] font-bold">{brl(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {query.trim() && results.length === 0 && (
              <p className="mt-3 text-[14px] text-white/60">
                Nenhum produto encontrado para “{query}”.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Menu mobile */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-headerbg/60 transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[82%] max-w-[320px] bg-headerbg transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Logo />
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col p-2" aria-label="Navegação mobile">
            {nav.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded px-4 py-3.5 text-[15px] font-medium transition-colors ${
                    isActive ? 'bg-brand text-white' : 'text-white/90 hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
