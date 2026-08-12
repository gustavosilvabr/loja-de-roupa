import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const KEY = 'xingsun:consent';

/**
 * Banner de consentimento (LGPD). Só carregue Hotjar, Meta Pixel, GA ou
 * qualquer script de análise/marketing DEPOIS que `granted` for true.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* storage bloqueado — não insiste */
    }
  }, []);

  const decide = (value: 'granted' | 'denied') => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* segue sem persistir */
    }
    setVisible(false);
    window.dispatchEvent(new CustomEvent('consent', { detail: value }));
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[560px] rounded-lg border border-line bg-white p-4 shadow-lg sm:inset-x-auto sm:left-5 sm:bottom-5"
    >
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Usamos cookies para manter seu carrinho e entender como a loja é usada. Você escolhe se
        aceita os cookies de análise e marketing.{' '}
        <Link to="/paginas/politica-de-cookies" className="text-brand underline">
          Saiba mais
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => decide('granted')} className="btn-brand px-5 py-2.5">
          Aceitar
        </button>
        <button type="button" onClick={() => decide('denied')} className="btn-outline px-5 py-2.5">
          Só os essenciais
        </button>
      </div>
    </div>
  );
}
