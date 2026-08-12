import { useState, type ReactNode } from 'react';
import { ChevronDown } from './Icons';

interface Props {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  titleClassName?: string;
}

/**
 * Abre/fecha animando `grid-template-rows` de 0fr para 1fr — assim a altura
 * real do conteúdo é respeitada sem precisar medir nada no JS.
 */
export function Accordion({
  title,
  children,
  defaultOpen = false,
  className = '',
  titleClassName = '',
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 py-3.5 text-left text-[13px] font-medium text-ink transition-colors hover:text-brand ${titleClassName}`}
      >
        <span className="min-w-0">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-4 text-[13px] leading-relaxed text-neutral-600">{children}</div>
        </div>
      </div>
    </div>
  );
}
