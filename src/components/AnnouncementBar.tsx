import { useEffect, useState } from 'react';
import { useSettings } from '../admin/store/AdminProvider';
import { ChevronLeft, ChevronRight } from './Icons';

export function AnnouncementBar() {
  const messages = useSettings().announcements;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => window.clearInterval(id);
  }, [messages.length]);

  if (messages.length === 0) return null;

  const go = (delta: number) =>
    setIndex((i) => (i + delta + messages.length) % messages.length);

  return (
    <div className="bg-brand text-white">
      <div className="page flex h-9 items-center justify-between gap-4">
        {messages.length > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Aviso anterior"
            className="rounded p-1 transition-opacity hover:opacity-70"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <p
          key={index}
          className="flex-1 truncate text-center text-[12px] font-semibold tracking-wide sm:text-[13px]"
          role="status"
        >
          {messages[Math.min(index, messages.length - 1)]}
        </p>

        {messages.length > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo aviso"
            className="rounded p-1 transition-opacity hover:opacity-70"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
