import { useEffect, useState } from 'react';
import { ClockIcon } from './Icons';

/**
 * Fim do próximo domingo às 23:59:59 no horário de Brasília.
 * Fixar o fuso evita que o prazo mude conforme o relógio do visitante.
 */
function nextResetTs(now = new Date()): number {
  const saoPaulo = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
  const skew = now.getTime() - saoPaulo.getTime();

  const end = new Date(saoPaulo);
  const daysUntilSunday = (7 - saoPaulo.getDay()) % 7;
  end.setDate(saoPaulo.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  if (end.getTime() <= saoPaulo.getTime()) end.setDate(end.getDate() + 7);

  return end.getTime() + skew;
}

const pad = (n: number) => String(n).padStart(2, '0');

function useCountdown() {
  const [remaining, setRemaining] = useState(() => nextResetTs() - Date.now());

  useEffect(() => {
    const id = window.setInterval(
      () => setRemaining(nextResetTs() - Date.now()),
      1000
    );
    return () => window.clearInterval(id);
  }, []);

  const total = Math.max(0, remaining);
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[20px] font-bold leading-none tabular-nums sm:text-[26px]">
        {pad(value)}
      </span>
      <span className="mt-1 text-[9px] font-medium uppercase tracking-widest text-white/60 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

interface Props {
  title?: string;
  subtitle?: string;
}

export function CountdownBar({
  title = 'Super descontos',
  subtitle = 'Aproveite! Essas ofertas antes que acabem.',
}: Props) {
  const { days, hours, minutes, seconds } = useCountdown();

  return (
    <section className="bg-black text-white">
      <div className="page flex flex-col items-center justify-between gap-3 py-3.5 sm:flex-row sm:py-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <ClockIcon className="hidden h-7 w-7 shrink-0 sm:block" />
          <div className="flex flex-col items-center gap-x-3 sm:flex-row sm:items-baseline">
            <strong className="text-[15px] font-bold uppercase tracking-wide sm:text-[17px]">
              {title}
            </strong>
            <span className="text-[13px] text-white/70">{subtitle}</span>
          </div>
        </div>

        <div
          className="flex items-start gap-2 sm:gap-3"
          role="timer"
          aria-label="Tempo restante da promoção"
        >
          <Unit value={days} label="Dias" />
          <span className="text-[18px] font-bold leading-none text-white/40 sm:text-[22px]">:</span>
          <Unit value={hours} label="Horas" />
          <span className="text-[18px] font-bold leading-none text-white/40 sm:text-[22px]">:</span>
          <Unit value={minutes} label="Min" />
          <span className="text-[18px] font-bold leading-none text-white/40 sm:text-[22px]">:</span>
          <Unit value={seconds} label="Seg" />
        </div>
      </div>
    </section>
  );
}
