import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../admin/store/AdminProvider';
import { SectionHeading } from './SectionHeading';
import { ChevronLeft, ChevronRight } from './Icons';
import { useRevealOnScroll } from '../hooks/useGsap';
import { marcarCampo } from '../lib/modoEditor';

/** Faixa full-width — usa o 2º slide cadastrado como banner promocional. */
export function PromoBanner() {
  const promo = useSettings().promoBanner;

  if (!promo?.enabled || !promo.desktop) return null;

  return (
    <section className="bg-black">
      <Link to={promo.to || '/'} {...marcarCampo('promoBanner.desktop')} className="block">
        <picture>
          <source media="(min-width: 750px)" srcSet={promo.desktop} />
          <img
            src={promo.mobile || promo.desktop}
            alt={promo.alt}
            loading="lazy"
            className="aspect-square w-full object-cover sm:aspect-[2800/1000]"
          />
        </picture>
      </Link>
    </section>
  );
}

/** Grade com 1 banner grande + 3 menores. */
export function FeatureBannerGrid() {
  const banners = useSettings().featureBanners.filter((b) => b.enabled);
  const ref = useRevealOnScroll<HTMLElement>('.reveal', { y: 30, stagger: 0.1 });

  if (banners.length === 0) return null;

  const [large, ...small] = banners;

  return (
    <section ref={ref} className="py-8 sm:py-10">
      {/* 1.78fr/1fr é geometria, não estética: o banner grande é 1,48:1 e os
          menores 2,5:1, então a coluna da esquerda precisa ser 1,78x a da
          direita para uma imagem ter a mesma altura de três empilhadas.
          Sobra ~23px de diferença por causa dos vãos — imperceptível. */}
      <div className="page grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1.78fr_1fr]">
        <Link
          to={large.to}
          {...marcarCampo(`featureBanners.${large.id}.image`)}
          className="reveal gsap-init group overflow-hidden rounded-media bg-black"
        >
          <img
            src={large.image}
            alt={large.title}
            loading="lazy"
            className="aspect-[1527/1030] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>

        {small.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:h-full lg:grid-cols-1 lg:grid-rows-3">
            {small.map((b) => (
              <Link
                key={b.id}
                to={b.to}
                {...marcarCampo(`featureBanners.${b.id}.image`)}
                className="reveal gsap-init group min-h-0 overflow-hidden rounded-media bg-black"
              >
                <img
                  src={b.image}
                  alt={b.title}
                  loading="lazy"
                  className="aspect-[1983/793] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] lg:aspect-auto lg:h-full"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function TeamSelector({ title = 'Escolha por time' }: { title?: string }) {
  const teams = useSettings().teams.filter((t) => t.enabled);
  const ref = useRevealOnScroll<HTMLElement>('.reveal', { y: 22, stagger: 0.05 });
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  const perPage = 6;
  const pages = Math.max(1, Math.ceil(teams.length / perPage));

  if (teams.length === 0) return null;

  const scrollByPage = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
    setPage((p) => Math.min(pages, Math.max(1, p + dir)));
  };

  return (
    <section ref={ref} className="py-10 sm:py-12">
      <div className="page">
        <h2 className="reveal gsap-init text-center text-[20px] font-bold uppercase tracking-wide text-ink sm:text-[24px]">
          {title}
        </h2>

        <div
          ref={scroller}
          className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 sm:gap-4"
        >
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/colecoes/${team.handle}`}
              aria-label={`Ver camisas do ${team.name}`}
              className="reveal gsap-init group flex aspect-square w-[30%] shrink-0 snap-start items-center justify-center rounded-2xl border border-line bg-gradient-to-b from-brand-50 to-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-soft sm:w-[22%] lg:w-[15.6%]"
            >
              <img
                src={team.crest}
                alt={team.name}
                loading="lazy"
                className="max-h-[70%] max-w-[70%] object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </Link>
          ))}
        </div>

        {teams.length > perPage && (
          <div className="mt-4 flex items-center justify-center gap-4 text-neutral-400">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              aria-label="Times anteriores"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line transition-colors hover:bg-neutral-100 hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] tabular-nums text-neutral-500">
              {page} / {pages}
            </span>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              aria-label="Próximos times"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line transition-colors hover:bg-neutral-100 hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function CollectionBanners({ title = 'Coleções' }: { title?: string }) {
  const banners = useSettings().collectionBanners.filter((b) => b.enabled);
  const ref = useRevealOnScroll<HTMLElement>('.reveal', { y: 26, stagger: 0.1 });

  if (banners.length === 0) return null;

  return (
    <section ref={ref} className="py-10 sm:py-12">
      <div className="page">
        <SectionHeading title={title} />
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {banners.map((b) => (
            <Link
              key={b.id}
              to={b.to}
              {...marcarCampo(`collectionBanners.${b.id}.image`)}
              className="reveal gsap-init group overflow-hidden rounded-media bg-black"
            >
              {/* Arquivos 480x240 (2:1) */}
              <img
                src={b.image}
                alt={b.title}
                loading="lazy"
                className="aspect-[2/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
