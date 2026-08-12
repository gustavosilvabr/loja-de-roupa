import { useSettings } from '../admin/store/AdminProvider';
import { SectionHeading } from './SectionHeading';
import { Accordion } from './Accordion';
import { useRevealOnScroll } from '../hooks/useGsap';

export function Faq({ title = 'Dúvidas Frequentes' }: { title?: string }) {
  const items = useSettings().faq;
  const ref = useRevealOnScroll<HTMLElement>('.reveal', { y: 20, stagger: 0.06 });

  if (items.length === 0) return null;

  return (
    <section ref={ref} className="py-10 sm:py-14">
      <div className="page">
        <SectionHeading title={title} />

        <div className="reveal gsap-init mx-auto mt-8 max-w-[640px] rounded-media border border-line px-5 py-1 shadow-sm">
          {items.map((item, i) => (
            <Accordion
              key={item.id}
              title={item.q}
              className={i > 0 ? 'border-t border-dashed border-line' : ''}
            >
              {item.a}
            </Accordion>
          ))}
        </div>
      </div>
    </section>
  );
}
