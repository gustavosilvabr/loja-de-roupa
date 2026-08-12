import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../store/AdminProvider';
import { useCatalog } from '../store/useResolvedCatalog';
import { normalize, slug as toSlug, img } from '../../lib/format';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  Field,
  Input,
  PageHeader,
  Toggle,
} from '../ui';
import type { CategoryPatch } from '../types';

export default function Categorias() {
  const { catalog, setCatalog } = useAdmin();
  const { collections, products, productByHandle } = useCatalog();

  const [aberta, setAberta] = useState<string | null>(null);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');

  const patch = (handle: string, p: CategoryPatch) =>
    setCatalog((c) => ({
      ...c,
      categories: { ...c.categories, [handle]: { ...c.categories[handle], ...p } },
    }));

  const criar = () => {
    const titulo = novaCategoria.trim();
    if (!titulo) return;
    const handle = toSlug(titulo);
    if (!handle || collections.some((c) => c.handle === handle)) return;

    setCatalog((c) => ({
      ...c,
      categoriesCreated: [...c.categoriesCreated, handle],
      categories: { ...c.categories, [handle]: { title: titulo, productHandles: [] } },
    }));
    setNovaCategoria('');
    setAberta(handle);
  };

  const excluir = (handle: string) =>
    setCatalog((c) => ({
      ...c,
      categoriesDeleted: [...c.categoriesDeleted, handle],
      categoriesCreated: c.categoriesCreated.filter((h) => h !== handle),
    }));

  const categoriaAberta = collections.find((c) => c.handle === aberta) ?? null;

  const candidatos = useMemo(() => {
    if (!categoriaAberta) return [];
    const q = normalize(buscaProduto).trim();
    if (!q) return [];
    const dentro = new Set(categoriaAberta.productHandles);
    return products
      .filter((p) => !dentro.has(p.handle) && normalize(p.title).includes(q))
      .slice(0, 8);
  }, [categoriaAberta, buscaProduto, products]);

  const mudarProdutos = (handle: string, lista: string[]) =>
    patch(handle, { productHandles: lista });

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Organize quais produtos aparecem em cada coleção da loja."
      />

      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Nova categoria" className="min-w-[240px] flex-1">
            <Input
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && criar()}
              placeholder="Ex: Seleções Europeias"
            />
          </Field>
          <Button onClick={criar} disabled={!novaCategoria.trim()}>
            Criar categoria
          </Button>
        </div>
        {novaCategoria.trim() && (
          <p className="mt-2 text-[12px] text-slate-500">
            Endereço: <code className="text-slate-700">/colecoes/{toSlug(novaCategoria)}</code>
          </p>
        )}
      </Card>

      <div className="space-y-3">
        {collections.map((c) => {
          const editada = Boolean(catalog.categories[c.handle]);
          const oculta = catalog.categories[c.handle]?.hidden;
          const expandida = aberta === c.handle;

          return (
            <Card key={c.handle}>
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-[240px] flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                      {c.handle}
                    </code>
                    <Badge>{c.productHandles.length} produtos</Badge>
                    {editada && <Badge tone="violet">editada</Badge>}
                    {oculta && <Badge tone="amber">oculta</Badge>}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Título">
                      <Input
                        value={c.title}
                        onChange={(e) => patch(c.handle, { title: e.target.value })}
                      />
                    </Field>
                    <Field label="Subtítulo">
                      <Input
                        value={c.subtitle}
                        onChange={(e) => patch(c.handle, { subtitle: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Toggle
                    checked={!oculta}
                    onChange={(v) => patch(c.handle, { hidden: !v })}
                    label={oculta ? 'Oculta' : 'Visível'}
                  />
                  <div className="flex gap-2">
                    <Link
                      to={`/colecoes/${c.handle}`}
                      target="_blank"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Ver na loja ↗
                    </Link>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAberta(expandida ? null : c.handle);
                        setBuscaProduto('');
                      }}
                    >
                      {expandida ? 'Fechar' : 'Produtos'}
                    </Button>
                  </div>
                  <ConfirmButton onConfirm={() => excluir(c.handle)}>Excluir</ConfirmButton>
                </div>
              </div>

              {expandida && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <Field
                    label="Adicionar produto"
                    hint="Digite parte do nome para buscar entre os 205 produtos"
                  >
                    <Input
                      value={buscaProduto}
                      onChange={(e) => setBuscaProduto(e.target.value)}
                      placeholder="Ex: flamengo"
                    />
                  </Field>

                  {candidatos.length > 0 && (
                    <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                      {candidatos.map((p) => (
                        <li key={p.handle}>
                          <button
                            type="button"
                            onClick={() => {
                              mudarProdutos(c.handle, [...c.productHandles, p.handle]);
                              setBuscaProduto('');
                            }}
                            className="flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-slate-50"
                          >
                            <img
                              src={img(p.image, 80)}
                              alt=""
                              loading="lazy"
                              className="h-9 w-9 shrink-0 rounded object-cover"
                            />
                            <span className="min-w-0 flex-1 truncate text-[13px]">{p.title}</span>
                            <span className="shrink-0 text-[12px] font-semibold text-sky-600">
                              adicionar
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3 className="mb-2 mt-5 text-[13px] font-semibold text-slate-700">
                    Nesta categoria ({c.productHandles.length})
                  </h3>

                  {c.productHandles.length === 0 ? (
                    <p className="text-[13px] text-slate-500">
                      Nenhum produto ainda. Use a busca acima para incluir.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {c.productHandles.map((h, i) => {
                        const p = productByHandle.get(h);
                        if (!p) return null;
                        return (
                          <li
                            key={h}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5"
                          >
                            <img
                              src={img(p.image, 80)}
                              alt=""
                              loading="lazy"
                              className="h-8 w-8 shrink-0 rounded object-cover"
                            />
                            <span className="min-w-0 flex-1 truncate text-[12.5px]">{p.title}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const lista = [...c.productHandles];
                                if (i > 0) [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]];
                                mudarProdutos(c.handle, lista);
                              }}
                              disabled={i === 0}
                              aria-label={`Mover ${p.title} para cima`}
                              className="shrink-0 px-1 text-[12px] text-slate-500 hover:text-slate-800 disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                mudarProdutos(
                                  c.handle,
                                  c.productHandles.filter((x) => x !== h)
                                )
                              }
                              aria-label={`Remover ${p.title} da categoria`}
                              className="shrink-0 px-1 text-[14px] text-slate-400 hover:text-red-600"
                            >
                              ×
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
