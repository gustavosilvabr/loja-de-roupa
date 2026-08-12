import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCatalog } from '../admin/store/useResolvedCatalog';
import { searchIn } from '../lib/catalog';
import { ProductCard } from '../components/ProductCard';
import { useRevealOnScroll } from '../hooks/useGsap';

export default function Search() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const { products } = useCatalog();

  const results = useMemo(() => searchIn(products, query, 60), [products, query]);
  const ref = useRevealOnScroll<HTMLDivElement>('.reveal', { y: 20, stagger: 0.04 });

  return (
    <div className="page py-10">
      <h1 className="text-[22px] font-bold sm:text-[26px]">Resultados para “{query}”</h1>
      <p className="mt-1 text-[14px] text-neutral-500">
        {results.length} {results.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
      </p>

      {results.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[15px] text-neutral-500">
            Nada encontrado. Tente buscar pelo nome do time, como “Flamengo” ou “Retrô”.
          </p>
          <Link to="/colecoes/produtos-mais-vendidos" className="btn-brand mt-6">
            Ver mais vendidas
          </Link>
        </div>
      ) : (
        <div
          ref={ref}
          className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {results.map((p) => (
            <div key={p.handle} className="reveal gsap-init">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
