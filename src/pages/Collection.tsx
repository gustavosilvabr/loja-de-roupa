import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../admin/store/useResolvedCatalog';
import { productsOf } from '../lib/catalog';
import { brl } from '../lib/format';
import { ProductCard } from '../components/ProductCard';
import { Accordion } from '../components/Accordion';
import { useRevealOnScroll } from '../hooks/useGsap';

type SortKey = 'destaque' | 'preco-asc' | 'preco-desc' | 'nome';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'destaque', label: 'Em destaque' },
  { key: 'preco-asc', label: 'Preço: menor para maior' },
  { key: 'preco-desc', label: 'Preço: maior para menor' },
  { key: 'nome', label: 'Nome A-Z' },
];

export default function Collection() {
  const { handle } = useParams<{ handle: string }>();
  const { collectionByHandle, productByHandle } = useCatalog();
  const collection = handle ? collectionByHandle.get(handle) : undefined;
  const all = useMemo(
    () => productsOf(collection, productByHandle),
    [collection, productByHandle]
  );

  const [sort, setSort] = useState<SortKey>('destaque');
  const [availability, setAvailability] = useState<'todos' | 'em' | 'fora'>('todos');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const priceCeiling = useMemo(
    () => (all.length ? Math.ceil(Math.max(...all.map((p) => p.price))) : 0),
    [all]
  );

  const inStock = all.filter((p) => p.available).length;
  const outStock = all.length - inStock;

  const products = useMemo(() => {
    let list = [...all];

    if (availability === 'em') list = list.filter((p) => p.available);
    if (availability === 'fora') list = list.filter((p) => !p.available);
    if (maxPrice !== null) list = list.filter((p) => p.price <= maxPrice);

    switch (sort) {
      case 'preco-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'preco-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'nome':
        list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
        break;
      default:
        break;
    }
    return list;
  }, [all, sort, availability, maxPrice]);

  const gridRef = useRevealOnScroll<HTMLDivElement>('.reveal', { y: 22, stagger: 0.04 });

  if (!collection) {
    return (
      <div className="page py-24 text-center">
        <h1 className="text-[24px] font-bold">Coleção não encontrada</h1>
        <Link to="/" className="btn-brand mt-6">
          Voltar para a home
        </Link>
      </div>
    );
  }

  return (
    <div className="page py-8 sm:py-10">
      <nav aria-label="Você está aqui" className="mb-4 text-[13px] text-neutral-500">
        <Link to="/" className="transition-colors hover:text-brand">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{collection.title}</span>
      </nav>

      <header className="mb-6">
        <h1 className="inline-block border-b-[3px] border-brand pb-1.5 text-[22px] font-bold text-ink sm:text-[26px]">
          {collection.title}
        </h1>
        {collection.subtitle && (
          <p className="mt-2 text-[14px] text-neutral-500">{collection.subtitle}</p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[210px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-1 border-b border-line pb-2 text-[14px] font-semibold">
            Filtrar:
          </h2>

          <Accordion title="Disponibilidade" defaultOpen titleClassName="!text-[13px] font-semibold">
            <div className="space-y-2">
              {(
                [
                  ['todos', `Todos (${all.length})`],
                  ['em', `Em estoque (${inStock})`],
                  ['fora', `Fora de estoque (${outStock})`],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="availability"
                    checked={availability === value}
                    onChange={() => setAvailability(value)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-[13px] text-neutral-600">{label}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion
            title="Preço"
            defaultOpen
            className="border-t border-line"
            titleClassName="!text-[13px] font-semibold"
          >
            <label htmlFor="price-range" className="mb-2 block text-[13px] text-neutral-600">
              Até <strong className="text-ink">{brl(maxPrice ?? priceCeiling)}</strong>
            </label>
            <input
              id="price-range"
              type="range"
              min={0}
              max={priceCeiling}
              step={5}
              value={maxPrice ?? priceCeiling}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMaxPrice(v >= priceCeiling ? null : v);
              }}
              className="w-full accent-brand"
            />
          </Accordion>

          {(availability !== 'todos' || maxPrice !== null) && (
            <button
              type="button"
              onClick={() => {
                setAvailability('todos');
                setMaxPrice(null);
              }}
              className="mt-4 text-[13px] text-brand underline transition-opacity hover:opacity-70"
            >
              Limpar filtros
            </button>
          )}
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
            <label htmlFor="sort" className="text-[13px] text-neutral-500">
              Ordenar por:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded border border-neutral-300 px-2.5 py-1.5 text-[13px] outline-none focus:border-brand"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="text-[13px] text-neutral-500">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'}
            </span>
          </div>

          {products.length === 0 ? (
            <p className="py-20 text-center text-[15px] text-neutral-500">
              Nenhum produto encontrado com esses filtros.
            </p>
          ) : (
            <div
              ref={gridRef}
              className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 xl:grid-cols-4"
            >
              {products.map((p) => (
                <div key={p.handle} className="reveal gsap-init">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
