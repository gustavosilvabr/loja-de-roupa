import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS } from '../defaults';
import { migrar } from './migrations';
import { deepMerge, load, save, uid } from './persist';
import {
  aoMudarSessao,
  carregarCatalogo,
  carregarConfig,
  emailLogado,
  listarCarrinhos,
  listarPedidos,
  listarVisitas,
  removerCarrinhoAbandonado,
  salvarCarrinhoAbandonado,
  salvarPedido,
  atualizarStatusPedido,
  registrarVisita,
  salvarCatalogo,
  salvarConfig,
  carregarProdutos,
  carregarCategorias,
} from './nuvem';
import { definirBase } from './baseCatalog';
import { nuvemAtiva } from '../../lib/supabase';
import { estaNoEditor } from '../../editor/protocolo';
import { useRascunhoDoEditor } from '../../lib/modoEditor';
import type {
  AbandonedCart,
  AnalyticsEvent,
  AnalyticsState,
  CatalogOverrides,
  Order,
  StoreSettings,
  SyncState,
  VisitorSession,
} from '../types';

const K_SETTINGS = 'settings';
const K_CATALOG = 'catalog';
const K_ANALYTICS = 'analytics';
const K_SYNC = 'syncState';

const EMPTY_SYNC: SyncState = {
  ultimaVerificacao: null,
  ultimoErro: null,
  verificando: false,
  mudancas: [],
  custosConhecidos: {},
};

const EMPTY_CATALOG: CatalogOverrides = {
  products: {},
  created: [],
  deleted: [],
  categories: {},
  categoriesCreated: [],
  categoriesDeleted: [],
};

const EMPTY_ANALYTICS: AnalyticsState = {
  events: [],
  sessions: [],
  orders: [],
  abandoned: [],
};

/** Limites para o localStorage não estourar em lojas com muito tráfego. */
const MAX_EVENTS = 4000;
const MAX_SESSIONS = 800;

interface AdminContextValue {
  settings: StoreSettings;
  setSettings: (patch: Partial<StoreSettings>) => void;
  updateSettings: (fn: (s: StoreSettings) => StoreSettings) => void;
  resetSettings: () => void;

  catalog: CatalogOverrides;
  setCatalog: (fn: (c: CatalogOverrides) => CatalogOverrides) => void;
  resetCatalog: () => void;

  sync: SyncState;
  setSync: (fn: (s: SyncState) => SyncState) => void;

  analytics: AnalyticsState;
  track: (event: Omit<AnalyticsEvent, 'id' | 'ts'>) => void;
  upsertSession: (session: VisitorSession) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  upsertAbandoned: (cart: AbandonedCart) => void;
  removeAbandoned: (id: string) => void;
  resetAnalytics: () => void;

  /** true logo após um save — usado para o toast "salvo". */
  savedAt: number | null;

  /** Estado da sincronização com a nuvem. */
  nuvem: {
    ativa: boolean;
    /** E-mail do lojista logado, ou null se ninguém entrou. */
    email: string | null;
    /** Ainda buscando os dados da nuvem na abertura. */
    carregando: boolean;
    /** Gravando alterações agora. */
    gravando: boolean;
    /** Última falha ao gravar, para avisar que a alteração não subiu. */
    erro: string | null;
  };
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<StoreSettings>(() =>
    migrar(deepMerge(DEFAULT_SETTINGS, load<Partial<StoreSettings>>(K_SETTINGS, {})))
  );
  const [catalog, setCatalogState] = useState<CatalogOverrides>(() =>
    deepMerge(EMPTY_CATALOG, load<Partial<CatalogOverrides>>(K_CATALOG, {}))
  );
  const [analytics, setAnalyticsState] = useState<AnalyticsState>(() =>
    deepMerge(EMPTY_ANALYTICS, load<Partial<AnalyticsState>>(K_ANALYTICS, {}))
  );
  const [sync, setSyncState] = useState<SyncState>(() => ({
    ...deepMerge(EMPTY_SYNC, load<Partial<SyncState>>(K_SYNC, {})),
    // "verificando" nunca sobrevive a um reload — senão trava o botão.
    verificando: false,
  }));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [email, setEmail] = useState<string | null>(null);
  const [carregandoNuvem, setCarregandoNuvem] = useState(nuvemAtiva);
  const [gravandoNuvem, setGravandoNuvem] = useState(false);
  const [erroNuvem, setErroNuvem] = useState<string | null>(null);

  /** Evita gravar na nuvem o que acabou de vir dela. */
  const vindoDaNuvem = useRef(false);
  const primeiraConfig = useRef(true);
  const primeiroCatalogo = useRef(true);

  /* ---- 0. modo editor: a vitrine só desenha o rascunho ---- */
  const noEditor = estaNoEditor();
  const rascunhoEditor = useRascunhoDoEditor();

  // Enquanto o primeiro pacote não chega, mostra o que já está salvo —
  // assim o preview nunca pisca em branco.
  const settingsVisiveis = noEditor ? (rascunhoEditor ?? settings) : settings;

  /* ---- 1. cache local: pinta a tela na hora ---- */
  useEffect(() => {
    // No editor nada é gravado: o rascunho só vira definitivo ao publicar.
    if (noEditor) return;
    save(K_SETTINGS, settings);
    setSavedAt(Date.now());
  }, [settings, noEditor]);

  useEffect(() => {
    if (noEditor) return;
    save(K_CATALOG, catalog);
    setSavedAt(Date.now());
  }, [catalog, noEditor]);

  /* ---- 2. nuvem manda: o que está lá é o que o cliente vê ---- */
  useEffect(() => {
    if (!nuvemAtiva || noEditor) return;
    let vivo = true;

    Promise.all([carregarConfig(), carregarCatalogo(), emailLogado()])
      .then(([config, cat, mail]) => {
        if (!vivo) return;
        vindoDaNuvem.current = true;

        if (config) setSettingsState(migrar(deepMerge(DEFAULT_SETTINGS, config)));
        if (cat) setCatalogState(deepMerge(EMPTY_CATALOG, cat));
        setEmail(mail);

        // Volta a permitir gravação depois que o React aplicar o estado.
        queueMicrotask(() => {
          vindoDaNuvem.current = false;
        });
      })
      .catch(() => {
        if (vivo) setErroNuvem('Não consegui carregar os dados da nuvem.');
      })
      .finally(() => {
        if (vivo) setCarregandoNuvem(false);
      });

    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => aoMudarSessao(setEmail), []);

  /* ---- 2a. catálogo da nuvem: produtos e preços que todo cliente vê ---- */
  useEffect(() => {
    if (!nuvemAtiva) return;
    let vivo = true;

    // Sem await bloqueante: a tela já está pintada com o catálogo do bundle,
    // e a nuvem só troca a base quando (e se) responder com produtos.
    Promise.all([carregarProdutos(), carregarCategorias()])
      .then(([prods, cats]) => {
        if (vivo) definirBase(prods, cats);
      })
      .catch(() => {
        /* segue com o catálogo do bundle */
      });

    return () => {
      vivo = false;
    };
  }, []);

  /* ---- 2b. dados de venda: só o lojista logado consegue ler ---- */
  useEffect(() => {
    if (!nuvemAtiva || !email) return;
    let vivo = true;

    Promise.all([listarPedidos(), listarVisitas(), listarCarrinhos()])
      .then(([pedidos, visitas, carrinhos]) => {
        if (!vivo) return;
        setAnalyticsState((a) => ({
          ...a,
          orders: pedidos ?? a.orders,
          sessions: visitas ?? a.sessions,
          abandoned: carrinhos ?? a.abandoned,
        }));
      })
      .catch(() => {
        /* o painel segue com o que está em cache */
      });

    return () => {
      vivo = false;
    };
  }, [email]);

  /* ---- 3. publica as alterações (só quem está logado grava) ---- */
  useEffect(() => {
    if (primeiraConfig.current) {
      primeiraConfig.current = false;
      return;
    }
    if (!nuvemAtiva || !email || vindoDaNuvem.current || noEditor) return;

    setGravandoNuvem(true);
    const id = window.setTimeout(() => {
      salvarConfig(settings)
        .then((ok) => setErroNuvem(ok ? null : 'A última alteração não subiu para a nuvem.'))
        .finally(() => setGravandoNuvem(false));
    }, 800);

    return () => window.clearTimeout(id);
  }, [settings, email]);

  useEffect(() => {
    if (primeiroCatalogo.current) {
      primeiroCatalogo.current = false;
      return;
    }
    if (!nuvemAtiva || !email || vindoDaNuvem.current || noEditor) return;

    setGravandoNuvem(true);
    const id = window.setTimeout(() => {
      salvarCatalogo(catalog)
        .then((ok) => setErroNuvem(ok ? null : 'A última alteração não subiu para a nuvem.'))
        .finally(() => setGravandoNuvem(false));
    }, 800);

    return () => window.clearTimeout(id);
  }, [catalog, email]);

  useEffect(() => {
    save(K_ANALYTICS, analytics);
  }, [analytics]);

  useEffect(() => {
    save(K_SYNC, { ...sync, verificando: false });
  }, [sync]);

  /* ---- settings ---- */
  const setSettings = useCallback((patch: Partial<StoreSettings>) => {
    setSettingsState((s) => ({ ...s, ...patch }));
  }, []);

  const updateSettings = useCallback((fn: (s: StoreSettings) => StoreSettings) => {
    setSettingsState(fn);
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  /* ---- catálogo ---- */
  const setCatalog = useCallback((fn: (c: CatalogOverrides) => CatalogOverrides) => {
    setCatalogState(fn);
  }, []);

  const resetCatalog = useCallback(() => setCatalogState(EMPTY_CATALOG), []);

  /* ---- analytics ---- */
  const track = useCallback((event: Omit<AnalyticsEvent, 'id' | 'ts'>) => {
    setAnalyticsState((a) => ({
      ...a,
      events: [...a.events, { ...event, id: uid('ev'), ts: Date.now() }].slice(-MAX_EVENTS),
    }));
  }, []);

  const upsertSession = useCallback((session: VisitorSession) => {
    setAnalyticsState((a) => {
      const i = a.sessions.findIndex((s) => s.id === session.id);
      const sessions =
        i >= 0
          ? a.sessions.map((s, idx) => (idx === i ? { ...s, ...session } : s))
          : [...a.sessions, session];
      return { ...a, sessions: sessions.slice(-MAX_SESSIONS) };
    });
    void registrarVisita(session);
  }, []);

  const addOrder = useCallback((order: Order) => {
    setAnalyticsState((a) => ({ ...a, orders: [order, ...a.orders] }));
    void salvarPedido(order);
  }, []);

  const updateOrder = useCallback((id: string, patch: Partial<Order>) => {
    setAnalyticsState((a) => ({
      ...a,
      orders: a.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
    if (patch.status) void atualizarStatusPedido(id, patch.status);
  }, []);

  const upsertAbandoned = useCallback((cart: AbandonedCart) => {
    setAnalyticsState((a) => {
      const i = a.abandoned.findIndex((c) => c.sessionId === cart.sessionId);
      const abandoned =
        i >= 0
          ? a.abandoned.map((c, idx) => (idx === i ? { ...c, ...cart } : c))
          : [...a.abandoned, cart];
      return { ...a, abandoned };
    });
    void salvarCarrinhoAbandonado(cart);
  }, []);

  const removeAbandoned = useCallback((id: string) => {
    setAnalyticsState((a) => ({ ...a, abandoned: a.abandoned.filter((c) => c.id !== id && c.sessionId !== id) }));
    void removerCarrinhoAbandonado(id);
  }, []);

  const resetAnalytics = useCallback(() => setAnalyticsState(EMPTY_ANALYTICS), []);

  const value = useMemo<AdminContextValue>(
    () => ({
      settings: settingsVisiveis,
      setSettings,
      updateSettings,
      resetSettings,
      catalog,
      setCatalog,
      resetCatalog,
      sync,
      setSync: setSyncState,
      analytics,
      track,
      upsertSession,
      addOrder,
      updateOrder,
      upsertAbandoned,
      removeAbandoned,
      resetAnalytics,
      savedAt,
      nuvem: {
        ativa: nuvemAtiva,
        email,
        carregando: carregandoNuvem,
        gravando: gravandoNuvem,
        erro: erroNuvem,
      },
    }),
    [
      settingsVisiveis,
      setSettings,
      updateSettings,
      resetSettings,
      catalog,
      setCatalog,
      resetCatalog,
      sync,
      analytics,
      track,
      upsertSession,
      addOrder,
      updateOrder,
      upsertAbandoned,
      removeAbandoned,
      resetAnalytics,
      savedAt,
      email,
      carregandoNuvem,
      gravandoNuvem,
      erroNuvem,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin precisa estar dentro de <AdminProvider>');
  return ctx;
}

/** Atalho para telas que só leem as configurações. */
// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useAdmin().settings;
}
