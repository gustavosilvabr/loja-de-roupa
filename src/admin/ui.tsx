import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';

/* ============================================================
   COMPONENTES DE UI DO PAINEL — usados por todas as telas.
   Visual inspirado no admin da Nuvemshop: cards brancos,
   borda suave, tipografia pequena, muito respiro.
   ============================================================ */

export function Card({
  title,
  description,
  children,
  actions,
  className = '',
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className = '',
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-[12px] text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={4}
      {...props}
      className={`${inputBase} resize-y leading-relaxed ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sky-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-[12px] text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<BtnVariant, string> = {
  primary: 'bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-300',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: { variant?: BtnVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    />
  );
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'green' | 'amber' | 'red' | 'sky' | 'violet';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
      <p className="text-[15px] font-semibold text-slate-700">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-[420px] text-[13px] text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  previous,
  variation,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  previous?: ReactNode;
  variation?: number;
  hint?: ReactNode;
}) {
  const up = (variation ?? 0) > 0;
  const down = (variation ?? 0) < 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] text-slate-600" title={typeof hint === 'string' ? hint : undefined}>
          {label}
        </span>
        <strong className="text-[17px] font-bold text-slate-900">{value}</strong>
      </div>
      {previous !== undefined && (
        <div className="mt-2 flex items-center justify-between text-[12px] text-slate-400">
          <span>Mesmo período anterior</span>
          <span>{previous}</span>
        </div>
      )}
      {variation !== undefined && (
        <div className="mt-1 flex items-center justify-between text-[12px]">
          <span className="text-slate-400">Variação</span>
          <span
            className={`font-semibold ${up ? 'text-emerald-600' : down ? 'text-red-600' : 'text-slate-400'}`}
          >
            {up ? '+' : ''}
            {variation.toFixed(2).replace('.', ',')}%
          </span>
        </div>
      )}
    </div>
  );
}

/** Confirmação inline — evita window.confirm, que trava a aba. */
export function ConfirmButton({
  onConfirm,
  children = 'Excluir',
  confirmLabel = 'Confirmar exclusão',
}: {
  onConfirm: () => void;
  children?: ReactNode;
  confirmLabel?: string;
}) {
  return (
    <ConfirmInner onConfirm={onConfirm} label={children} confirmLabel={confirmLabel} />
  );
}

import { useState } from 'react';

function ConfirmInner({
  onConfirm,
  label,
  confirmLabel,
}: {
  onConfirm: () => void;
  label: ReactNode;
  confirmLabel: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button variant="danger" onClick={() => setArmed(true)}>
        {label}
      </Button>
    );
  }

  return (
    <span className="inline-flex gap-2">
      <Button
        variant="danger"
        className="!bg-red-600 !text-white"
        onClick={() => {
          onConfirm();
          setArmed(false);
        }}
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" onClick={() => setArmed(false)}>
        Cancelar
      </Button>
    </span>
  );
}
