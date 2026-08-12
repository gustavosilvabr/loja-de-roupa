import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { SectionHeading } from './SectionHeading';
import { ChevronLeft, ChevronRight } from './Icons';
import { useRevealOnScroll } from '../hooks/useGsap';

interface Props {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllTo?: string;
  /** Quantos cards por "página" no desktop — usado no indicador 1/4. */
  perPage?: number;
}

export function ProductCarousel({
  title,
  subtitle,
  products,
  viewAllTo,
  perPage = 6,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const sectionRef = useRevealOnScroll<HTMLElement>('.reveal', { y: 24 });
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(products.length / perPage));

  const syncPage = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) {
      setPage(1);
      return;
    }
    const ratio = el.scrollLeft / max;
    setPage(Math.min(pages, Math.max(1, Math.round(ratio * (pages - 1)) + 1)));
  }, [pages]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.addEventListener('scroll', syncPage, { passive: true });
    return () => el.removeEventListener('scroll', syncPage);
  }, [syncPage]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-10 sm:py-12">
      <div className="page">
        <SectionHeading title={title} subtitle={subtitle} />

        <div className="relative mt-7">
          <div
            ref={scroller}
            className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2"
          >
            {products.map((p) => (
              <div
                key={p.handle}
                className="reveal gsap-init w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[19%] xl:w-[15.6%]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {products.length > 2 && (
            <>
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                aria-label="Produtos anteriores"
                className="absolute -left-2 top-[38%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-soft transition-all hover:bg-white hover:shadow-md lg:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                aria-label="Próximos produtos"
                className="absolute -right-2 top-[38%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-soft transition-all hover:bg-white hover:shadow-md lg:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-center gap-4 text-neutral-400">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              aria-label="Anterior"
              className="p-1 transition-colors hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] tabular-nums text-neutral-500">
              {page}/{pages}
            </span>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              aria-label="Próximo"
              className="p-1 transition-colors hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {viewAllTo && (
            <div className="mt-4 text-center">
              <Link to={viewAllTo} className="btn-brand px-10">
                Ver tudo
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
