import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../admin/store/AdminProvider';
import { gsap } from '../hooks/useGsap';
import { marcarCampo } from '../lib/modoEditor';
import { ChevronLeft, ChevronRight } from './Icons';

const AUTOPLAY_MS = 6000;

export function Hero() {
  const slides = useSettings().heroSlides.filter((s) => s.enabled);
  const [index, setIndex] = useState(0);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
  const timer = useRef<number>();

  const goTo = useCallback(
    (next: number) => {
      setIndex((current) => {
        const target = (next + slides.length) % slides.length;
        if (target === current) return current;

        const from = slidesRef.current[current];
        const to = slidesRef.current[target];
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (from && to && !reduced) {
          gsap.killTweensOf([from, to]);
          gsap.to(from, { opacity: 0, duration: 0.6, ease: 'power2.inOut' });
          gsap.fromTo(
            to,
            { opacity: 0, scale: 1.06 },
            { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' }
          );
        } else if (from && to) {
          gsap.set(from, { opacity: 0 });
          gsap.set(to, { opacity: 1, scale: 1 });
        }

        return target;
      });
    },
    [slides.length]
  );

  useEffect(() => {
    if (slides.length < 2) return;
    timer.current = window.setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer.current);
  }, [index, goTo, slides.length]);

  // Garante que o slide visível seja o primeiro após uma troca de configuração
  useEffect(() => {
    setIndex(0);
    slidesRef.current.forEach((el, i) => el && gsap.set(el, { opacity: i === 0 ? 1 : 0 }));
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section aria-label="Destaques" aria-roledescription="carrossel" className="relative bg-black">
      {/* As proporções são as dos arquivos reais: 1300x1300 no celular e
          2800x1000 no computador. Forçar outro formato corta a arte. */}
      <div className="relative aspect-square w-full overflow-hidden sm:aspect-[2800/1000]">
        {/* O campo editável é marcado pelo id do slide, não pelo índice:
            esta lista está filtrada por "enabled" e os índices não batem
            com os das configurações. */}
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            ref={(el) => (slidesRef.current[i] = el)}
            className="absolute inset-0"
            {...marcarCampo(`heroSlides.${slide.id}.desktop`)}
            style={{ opacity: i === 0 ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <Link to={slide.to} tabIndex={i === index ? 0 : -1} className="block h-full w-full">
              <picture>
                <source media="(min-width: 750px)" srcSet={slide.desktop} />
                <img
                  src={slide.mobile || slide.desktop}
                  alt={slide.alt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  className="h-full w-full object-cover"
                />
              </picture>
            </Link>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Slide anterior"
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70 sm:flex"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Próximo slide"
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70 sm:flex"
            >
              <ChevronRight />
            </button>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Ir para o slide ${i + 1}: ${slide.title}`}
                  aria-current={i === index}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-7 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
