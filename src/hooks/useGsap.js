import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cria um contexto GSAP com escopo no elemento e limpa tudo na desmontagem.
 * Se o usuário pediu menos movimento, apenas revela o conteúdo sem animar.
 */
export function useGsapContext(
  setup,
  deps = []
) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced()) {
      el.querySelectorAll('.gsap-init').forEach((n) => {
        n.style.opacity = '1';
        n.classList.remove('gsap-init');
      });
      return;
    }

    const ctx = gsap.context(() => setup({ self: el, gsap }), el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/** Fade + subida conforme a seção entra na viewport. */
export function useRevealOnScroll(
  selector = '.reveal',
  options = {}
) {
  const { y = 28, stagger = 0.08, start = 'top 85%' } = options;

  return useGsapContext(({ self }) => {
    const targets = self.querySelectorAll(selector);
    if (!targets.length) return;

    targets.forEach((n) => n.classList.remove('gsap-init'));

    gsap.fromTo(
      targets,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger,
        ease: 'power3.out',
        scrollTrigger: { trigger: self, start, once: true },
      }
    );
  });
}
