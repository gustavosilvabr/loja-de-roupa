import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { brl, discountPercent, img, installment, pix } from '../lib/format';
import { firstAvailableVariant } from '../lib/catalog';
import { useCart } from '../store/cart';
import { useSettings } from '../admin/store/AdminProvider';
import { Estrelas } from './Estrelas';
import { CartIcon } from './Icons';

interface Props {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = '' }: Props) {
  const { add } = useCart();
  const { gateway, pricing } = useSettings();

  const off = discountPercent(product.price, product.compareAt);
  const soldOut = !product.available;

  const taxaPix = (gateway?.pixDiscount ?? 5) / 100;
  const precoPix = pix(product.price, taxaPix);
  const parcelas = Math.min(gateway?.maxInstallments ?? 12, 6);
  const valorParcela = installment(product.price, parcelas);

  const freteGratis =
    (pricing?.freteGratisAcima ?? 0) > 0 && product.price >= pricing.freteGratisAcima;

  const quickAdd = () => {
    const variant = firstAvailableVariant(product);
    if (!variant) return;
    add({
      productHandle: product.handle,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      image: product.image,
      price: variant.price,
      quantity: 1,
    });
  };

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-media border border-line bg-white transition-shadow hover:shadow-soft ${className}`}
    >
      <Link
        to={`/produtos/${product.handle}`}
        className="relative block overflow-hidden bg-neutral-100"
      >
        <img
          src={img(product.image, 600)}
          alt={product.title}
          loading="lazy"
          width={600}
          height={600}
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-neutral-800/90 py-1 text-center text-[12px] font-bold text-white">
            Esgotado
          </span>
        )}

        {/* A faixa de desconto atravessa a base da foto, onde o olho já está. */}
        {!soldOut && off > 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-lime-300 py-0.5 text-center text-[12.5px] font-bold text-neutral-900">
            -{off}% OFF
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <Link
          to={`/produtos/${product.handle}`}
          className="line-clamp-2 text-[13.5px] leading-snug text-ink transition-colors hover:text-brand sm:text-[15px]"
        >
          {product.title}
        </Link>

        {/* Só aparece quando existe avaliação real cadastrada. */}
        <div className="mt-1.5 min-h-[16px]">
          <Estrelas nota={product.nota} avaliacoes={product.avaliacoes} />
        </div>

        <div className="mt-1.5">
          {product.compareAt && product.compareAt > product.price && (
            <s className="block text-[12.5px] leading-tight text-muted">
              {brl(product.compareAt)}
            </s>
          )}

          <p className="text-[15px] font-bold leading-tight text-ink sm:text-[17px]">
            {brl(precoPix)}{' '}
            <span className="text-[12.5px] font-semibold text-emerald-600">no Pix</span>
          </p>

          <p className="mt-0.5 text-[11.5px] leading-tight text-neutral-500">
            ou {parcelas}x de <strong className="font-semibold">{brl(valorParcela)}</strong> sem
            juros
          </p>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.selo && (
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-600">
              {product.selo}
            </span>
          )}
          {freteGratis && (
            <span className="rounded bg-lime-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-lime-900">
              Frete grátis
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut}
          aria-label={
            soldOut ? `${product.title} — esgotado` : `Adicionar ${product.title} ao carrinho`
          }
          className="btn-brand mt-auto w-full px-2 py-2.5 pt-2.5 text-[11px] sm:text-[12px]"
        >
          <span aria-hidden="true">{soldOut ? 'Esgotado' : 'Adicionar ao carrinho'}</span>
          {!soldOut && <CartIcon className="h-4 w-4" />}
        </button>
      </div>
    </article>
  );
}
