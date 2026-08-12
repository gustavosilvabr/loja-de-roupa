import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../store/AdminProvider';
import { resolveProducts } from '../store/useResolvedCatalog';
import { uid } from '../store/persist';
import { brl, img, normalize, slug } from '../../lib/format';
import { isBaseSide } from '../../lib/catalog';
import type { CatalogOverrides, ProductPatch } from '../types';
import type { Product } from '../../types';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
} from '../ui';

const POR_PAGINA = 20;
const TIPOS = ['Camisa', 'Acessório', 'Patch'] as const;

type FiltroTipo = 'todos' | (typeof TIPOS)[number];
type FiltroDisponibilidade = 'todos' | 'disponivel' | 'esgotado';
type ModoLote = 'percentual' | 'fixo';

const arredonda = (v: number) => Math.round(v * 100) / 100;

/**
 * O painel precisa enxergar TUDO — inclusive o que está oculto ou excluído.
 * `resolveProducts` esconde esses itens, então resolvemos sobre uma cópia do
 * catálogo sem as flags `hidden`/`deleted` e marcamos o estado por fora.
 */
function catalogoSemFiltros(c: CatalogOverrides): CatalogOverrides {
  const products: Record<string, ProductPatch> = {};
  for (const [handle, patch] of Object.entries(c.products)) {
    products[handle] = { ...patch, hidden: false };
  }
  return { ...c, products, deleted: [] };
}

/** Quantas variantes-base estão disponíveis (o estoque real da loja). */
function estoque(p: Product) {
  const base = p.variants.filter(isBaseSide);
  const lista = base.length ? base : p.variants;
  return { disponiveis: lista.filter((v) => v.available).length, total: lista.length };
}

export default function Produtos() {
  const { catalog, setCatalog, settings } = useAdmin();
  const navigate = useNavigate();

  /* ---------- filtros ---------- */
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [tipo, setTipo] = useState<FiltroTipo>('todos');
  const [disponibilidade, setDisponibilidade] = useState<FiltroDisponibilidade>('todos');
  const [pagina, setPagina] = useState(1);

  /* ---------- seleção e edição em lote ---------- */
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [modoLote, setModoLote] = useState<ModoLote>('percentual');
  const [valorLote, setValorLote] = useState('10');

  // Busca com debounce de 200ms: não refiltra 205 produtos a cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca), 200);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    setPagina(1);
  }, [buscaAtiva, tipo, disponibilidade]);

  /* ---------- catálogo resolvido (com ocultos e excluídos) ---------- */
  const todos = useMemo(
    () => resolveProducts(catalogoSemFiltros(catalog), settings.pricing),
    [catalog, settings.pricing]
  );

  const excluidos = useMemo(() => new Set(catalog.deleted), [catalog.deleted]);

  const ativos = useMemo(() => todos.filter((p) => !excluidos.has(p.handle)), [todos, excluidos]);

  const removidos = useMemo(
    () => todos.filter((p) => excluidos.has(p.handle)),
    [todos, excluidos]
  );

  const filtrados = useMemo(() => {
    const q = normalize(buscaAtiva).trim();
    return ativos.filter((p) => {
      if (q && !normalize(p.title).includes(q)) return false;
      if (tipo !== 'todos' && p.type !== tipo) return false;
      if (disponibilidade === 'disponivel' && !p.available) return false;
      if (disponibilidade === 'esgotado' && p.available) return false;
      return true;
    });
  }, [ativos, buscaAtiva, tipo, disponibilidade]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = useMemo(
    () => filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA),
    [filtrados, paginaAtual]
  );

  /* ---------- lote ---------- */
  const selecionadosSet = useMemo(() => new Set(selecionados), [selecionados]);

  const alvos = useMemo(
    () => ativos.filter((p) => selecionadosSet.has(p.handle)),
    [ativos, selecionadosSet]
  );

  const valorNumero = Number(valorLote.replace(',', '.'));
  const valorValido =
    Number.isFinite(valorNumero) &&
    (modoLote === 'percentual' ? valorNumero !== 0 : valorNumero > 0);

  const previa = useMemo(() => {
    if (!valorValido) return [];
    const fator = 1 + valorNumero / 100;
    return alvos.map((p) => ({
      handle: p.handle,
      title: p.title,
      de: p.price,
      para: modoLote === 'percentual' ? arredonda(p.price * fator) : arredonda(valorNumero),
    }));
  }, [alvos, modoLote, valorNumero, valorValido]);

  const alternarSelecao = (handle: string) =>
    setSelecionados((s) => (s.includes(handle) ? s.filter((h) => h !== handle) : [...s, handle]));

  const paginaToda = visiveis.length > 0 && visiveis.every((p) => selecionadosSet.has(p.handle));

  const alternarPagina = () =>
    setSelecionados((s) => {
      const daPagina = visiveis.map((p) => p.handle);
      if (paginaToda) return s.filter((h) => !daPagina.includes(h));
      return [...new Set([...s, ...daPagina])];
    });

  const aplicarLote = () => {
    if (!valorValido || alvos.length === 0) return;
    const fator = 1 + valorNumero / 100;

    setCatalog((c) => {
      const products = { ...c.products };

      for (const p of alvos) {
        const atual: ProductPatch = products[p.handle] ?? {};

        if (modoLote === 'percentual') {
          // Reajuste proporcional: cada variante mantém a própria diferença.
          const overrides = { ...(atual.variantOverrides ?? {}) };
          const precos: number[] = [];
          for (const v of p.variants) {
            const novo = arredonda(v.price * fator);
            overrides[v.id] = { ...overrides[v.id], price: novo };
            if (novo > 0) precos.push(novo);
          }
          products[p.handle] = {
            ...atual,
            variantOverrides: overrides,
            price: precos.length ? Math.min(...precos) : arredonda(p.price * fator),
          };
        } else {
          // Preço fixo: vale para todas as variantes, então limpamos os preços
          // individuais para o valor base não ser sobrescrito.
          const overrides: NonNullable<ProductPatch['variantOverrides']> = {};
          for (const [id, o] of Object.entries(atual.variantOverrides ?? {})) {
            if (o.available !== undefined) overrides[id] = { available: o.available };
          }
          products[p.handle] = {
            ...atual,
            price: arredonda(valorNumero),
            variantOverrides: overrides,
          };
        }
      }

      return { ...c, products };
    });

    setSelecionados([]);
  };

  /* ---------- ações por linha ---------- */
  const alternarOculto = (handle: string, oculto: boolean) =>
    setCatalog((c) => ({
      ...c,
      products: { ...c.products, [handle]: { ...c.products[handle], hidden: oculto } },
    }));

  const excluir = (handle: string) =>
    setCatalog((c) => ({ ...c, deleted: [...new Set([...c.deleted, handle])] }));

  const restaurar = (handle: string) =>
    setCatalog((c) => ({ ...c, deleted: c.deleted.filter((h) => h !== handle) }));

  const criarProduto = () => {
    const handle = slug(uid('novo-produto'));
    setCatalog((c) => ({
      ...c,
      created: [...c.created, handle],
      products: {
        ...c.products,
        [handle]: { title: 'Novo produto', type: 'Camisa', price: 0, images: [], tags: [] },
      },
    }));
    navigate(`/admin/produtos/${handle}`);
  };

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`${ativos.length} produtos no catálogo · ${filtrados.length} no filtro atual`}
        actions={<Button onClick={criarProduto}>Novo produto</Button>}
      />

      {/* ---------- filtros ---------- */}
      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Buscar por título">
            <Input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: flamengo, retro, seleção…"
            />
          </Field>
          <Field label="Tipo">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as FiltroTipo)}>
              <option value="todos">Todos os tipos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Disponibilidade">
            <Select
              value={disponibilidade}
              onChange={(e) => setDisponibilidade(e.target.value as FiltroDisponibilidade)}
            >
              <option value="todos">Todas</option>
              <option value="disponivel">Disponíveis</option>
              <option value="esgotado">Esgotados</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* ---------- edição de preço em lote ---------- */}
      {selecionados.length > 0 && (
        <Card
          className="mb-5 border-sky-200 bg-sky-50/40"
          title={`${selecionados.length} produto(s) selecionado(s)`}
          description="Ajuste os preços em lote. Confira o resumo antes de aplicar."
          actions={
            <Button variant="ghost" onClick={() => setSelecionados([])}>
              Limpar seleção
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <Field label="Tipo de ajuste">
              <Select value={modoLote} onChange={(e) => setModoLote(e.target.value as ModoLote)}>
                <option value="percentual">Ajuste percentual (%)</option>
                <option value="fixo">Definir preço fixo (R$)</option>
              </Select>
            </Field>
            <Field
              label={modoLote === 'percentual' ? 'Percentual' : 'Novo preço'}
              hint={
                modoLote === 'percentual'
                  ? 'Use valores negativos para descontos. Ex.: 10 ou -15.'
                  : 'O mesmo preço vale para todas as variantes do produto.'
              }
            >
              <Input
                type="number"
                step="0.01"
                value={valorLote}
                onChange={(e) => setValorLote(e.target.value)}
              />
            </Field>
            <div className="pb-1">
              <Button onClick={aplicarLote} disabled={!valorValido}>
                Aplicar a {alvos.length} produto(s)
              </Button>
            </div>
          </div>

          {previa.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-[13px] font-semibold text-slate-700">
                Resumo das alterações
              </p>
              <ul className="space-y-1 text-[13px] text-slate-600">
                {previa.slice(0, 8).map((l) => (
                  <li key={l.handle} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{l.title}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="text-slate-400 line-through">{brl(l.de)}</span>{' '}
                      <span className="font-semibold text-slate-900">{brl(l.para)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {previa.length > 8 && (
                <p className="mt-2 text-[12px] text-slate-400">
                  e mais {previa.length - 8} produto(s)…
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ---------- lista ---------- */}
      <Card
        title="Lista de produtos"
        description={`Página ${paginaAtual} de ${totalPaginas}`}
        actions={
          visiveis.length > 0 ? (
            <Button variant="secondary" onClick={alternarPagina}>
              {paginaToda ? 'Desmarcar página' : 'Selecionar página'}
            </Button>
          ) : undefined
        }
      >
        {visiveis.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Ajuste a busca ou os filtros para ver outros resultados."
          />
        ) : (
          <>
            {/* cabeçalho só no desktop — no mobile cada item vira um card */}
            <div className="hidden gap-3 border-b border-slate-100 pb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[24px_minmax(0,1fr)_84px_120px_88px_180px] md:items-center">
              <span aria-hidden="true" />
              <span>Produto</span>
              <span>Tipo</span>
              <span>Preço</span>
              <span>Estoque</span>
              <span className="text-right">Ações</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {visiveis.map((p) => {
                const patch = catalog.products[p.handle];
                const editado = Boolean(patch && Object.keys(patch).length > 0);
                const oculto = Boolean(patch?.hidden);
                const novo = catalog.created.includes(p.handle);
                const { disponiveis, total } = estoque(p);

                return (
                  <li
                    key={p.handle}
                    className="flex flex-col gap-3 py-3 md:grid md:grid-cols-[24px_minmax(0,1fr)_84px_120px_88px_180px] md:items-center md:gap-3"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-sky-600"
                      checked={selecionadosSet.has(p.handle)}
                      onChange={() => alternarSelecao(p.handle)}
                      aria-label={`Selecionar ${p.title}`}
                    />

                    <div className="flex min-w-0 items-center gap-3">
                      {p.image ? (
                        <img
                          src={img(p.image, 96)}
                          alt=""
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-400">
                          sem foto
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          to={`/admin/produtos/${p.handle}`}
                          className="block truncate text-[14px] font-medium text-slate-900 hover:text-sky-700"
                        >
                          {p.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[12px] text-slate-400">{p.handle}</span>
                          {novo && <Badge tone="violet">Novo</Badge>}
                          {editado && !novo && <Badge tone="sky">Editado</Badge>}
                          {oculto && <Badge tone="amber">Oculto</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="text-[13px] text-slate-600">
                      <span className="md:hidden">Tipo: </span>
                      {p.type}
                    </div>

                    <div className="text-[13px] tabular-nums">
                      <strong className="font-semibold text-slate-900">{brl(p.price)}</strong>
                      {p.compareAt && p.compareAt > p.price && (
                        <span className="ml-2 text-slate-400 line-through">{brl(p.compareAt)}</span>
                      )}
                    </div>

                    <div className="text-[13px] tabular-nums">
                      {disponiveis > 0 ? (
                        <span className="text-slate-600">
                          {disponiveis}/{total}
                        </span>
                      ) : (
                        <Badge tone="red">Esgotado</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Link
                        to={`/admin/produtos/${p.handle}`}
                        className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                      <Button
                        variant="secondary"
                        onClick={() => alternarOculto(p.handle, !oculto)}
                        aria-label={oculto ? `Mostrar ${p.title}` : `Ocultar ${p.title}`}
                      >
                        {oculto ? 'Mostrar' : 'Ocultar'}
                      </Button>
                      <ConfirmButton onConfirm={() => excluir(p.handle)}>Excluir</ConfirmButton>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ---------- paginação ---------- */}
            <nav
              className="mt-4 flex flex-wrap items-center justify-between gap-3"
              aria-label="Paginação de produtos"
            >
              <span className="text-[13px] text-slate-500">
                Mostrando {(paginaAtual - 1) * POR_PAGINA + 1}–
                {Math.min(paginaAtual * POR_PAGINA, filtrados.length)} de {filtrados.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={paginaAtual <= 1}
                  onClick={() => setPagina(paginaAtual - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() => setPagina(paginaAtual + 1)}
                >
                  Próxima
                </Button>
              </div>
            </nav>
          </>
        )}
      </Card>

      {/* ---------- excluídos ---------- */}
      {removidos.length > 0 && (
        <Card
          className="mt-5"
          title="Produtos excluídos"
          description="Eles saíram da loja, mas podem voltar a qualquer momento."
        >
          <ul className="divide-y divide-slate-100">
            {removidos.map((p) => (
              <li
                key={p.handle}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {p.image && (
                    <img
                      src={img(p.image, 64)}
                      alt=""
                      loading="lazy"
                      className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover opacity-60"
                    />
                  )}
                  <span className="min-w-0 truncate text-[14px] text-slate-600">{p.title}</span>
                </div>
                <Button variant="secondary" onClick={() => restaurar(p.handle)}>
                  Restaurar
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
