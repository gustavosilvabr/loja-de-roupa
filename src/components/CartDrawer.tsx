import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../store/cart';
import { brl, img, pix } from '../lib/format';
import { SITE } from '../data/site';
import { CloseIcon, PixIcon } from './Icons';

export function CartDrawer() {
  const { lines, isOpen, close, remove, setQty, subtotal, count } = useCart();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={close}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[17px] font-bold">
            Seu carrinho {count > 0 && <span className="text-neutral-400">({count})</span>}
          </h2>
          <button type="button" onClick={close} aria-label="Fechar carrinho" className="p-1">
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-[15px] text-neutral-500">Seu carrinho está vazio.</p>
            <Link to="/colecoes/produtos-mais-vendidos" onClick={close} className="btn-brand">
              Ver mais vendidas
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-3 py-4">
                  <Link to={`/produtos/${line.productHandle}`} onClick={close} className="shrink-0">
                    <img
                      src={img(line.image, 200)}
                      alt={line.title}
                      loading="lazy"
                      className="h-24 w-20 rounded-media bg-neutral-100 object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      to={`/produtos/${line.productHandle}`}
                      onClick={close}
                      className="line-clamp-2 text-[14px] font-medium leading-snug hover:text-brand"
                    >
                      {line.title}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-neutral-500">{line.variantTitle}</p>

                    {line.properties &&
                      Object.entries(line.properties).map(([k, v]) => (
                        <p key={k} className="text-[12px] text-neutral-500">
                          {k}: <span className="font-medium text-ink">{v}</span>
                        </p>
                      ))}

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded border border-neutral-300">
                        <button
                          type="button"
                          onClick={() => setQty(line.key, line.quantity - 1)}
                          aria-label={`Diminuir quantidade de ${line.title}`}
                          className="px-2.5 py-1 text-[15px] leading-none transition-colors hover:bg-neutral-100"
                        >
                          −
                        </button>
                        <span className="min-w-[28px] text-center text-[13px] font-medium">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.key, line.quantity + 1)}
                          aria-label={`Aumentar quantidade de ${line.title}`}
                          className="px-2.5 py-1 text-[15px] leading-none transition-colors hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[15px] font-bold">{brl(line.price * line.quantity)}</p>
                        <button
                          type="button"
                          onClick={() => remove(line.key)}
                          className="text-[12px] text-neutral-400 underline transition-colors hover:text-red-500"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line px-5 py-4">
              <div className="mb-2 flex items-center justify-between text-[15px]">
                <span className="text-neutral-600">Subtotal</span>
                <span className="text-[19px] font-bold">{brl(subtotal)}</span>
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                <PixIcon className="h-4 w-4" />
                <span className="text-[13px]">
                  <strong>{brl(pix(subtotal, SITE.pixDiscount))}</strong> à vista no PIX
                </span>
              </div>

              <p className="mb-3 text-center text-[12px] text-neutral-500">
                Frete e descontos calculados no checkout.
              </p>

              <Link to="/checkout" onClick={close} className="btn-brand w-full">
                Finalizar compra
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
