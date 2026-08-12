import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  findVariant,
  firstAvailableVariant,
  isAvailable,
  pseudoStock,
  relatedIn,
} from '../lib/catalog';
import { useCatalog } from '../admin/store/useResolvedCatalog';
import { useSettings } from '../admin/store/AdminProvider';
import { brl, discountPercent, img, installment, pix } from '../lib/format';
import { useCart } from '../store/cart';
import { Accordion } from '../components/Accordion';
import { Avaliacoes } from '../components/Avaliacoes';
import { Estrelas } from '../components/Estrelas';
import { ProductCarousel } from '../components/ProductCarousel';
import { CartIcon, PixIcon, TruckIcon } from '../components/Icons';
import { useRevealOnScroll } from '../hooks/useGsap';

export default function Product() {
  const { handle } = useParams<{ handle: string }>();
  const { products: allProducts, productByHandle } = useCatalog();
  const { gateway, shipping: shippingRates } = useSettings();
  const product = handle ? productByHandle.get(handle) : undefined;
  const { add } = useCart();
  const pixRate = gateway.pixDiscount / 100;

  const sizeOption = product?.options.find((o) => /tamanho/i.test(o.name));
  const persoOption = product?.options.find((o) => /personalizar/i.test(o.name));

  const initial = product ? firstAvailableVariant(product) : undefined;
  const [size, setSize] = useState<string | null>(initial?.o1 ?? null);
  const [perso, setPerso] = useState<string | null>(initial?.o2 ?? null);
  const [gallery, setGallery] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [error, setError] = useState('');
  const [cep, setCep] = useState('');
  const [rates, setRates] = useState<typeof shippingRates | null>(null);

  // Reinicia o estado ao navegar entre produtos
  useEffect(() => {
    const v = product ? firstAvailableVariant(product) : undefined;
    setSize(v?.o1 ?? null);
    setPerso(v?.o2 ?? null);
    setGallery(0);
    setQuantity(1);
    setNome('');
    setNumero('');
    setError('');
    setRates(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [product]);

  const ref = useRevealOnScroll<HTMLDivElement>('.reveal', { y: 20, stagger: 0.06 });

  if (!product) {
    return (
      <div className="page py-24 text-center">
        <h1 className="text-[24px] font-bold">Produto não encontrado</h1>
        <Link to="/" className="btn-brand mt-6">
          Voltar para a home
        </Link>
      </div>
    );
  }

  const variant = findVariant(product, size, perso) ?? initial;
  const available = isAvailable(product, variant);
  const price = variant?.price ?? product.price;
  const compareAt = variant?.compareAt ?? product.compareAt;
  const off = discountPercent(price, compareAt);
  const wantsPerso = Boolean(perso && /sim/i.test(perso));
  const stock = variant ? pseudoStock(variant.id) : { units: 5, sold: 40 };

  const unitTotal = price;

  /** Um tamanho só é comprável se a variante-base ("Não") daquele tamanho tiver estoque. */
  const sizeAvailable = (value: string) => {
    const base = findVariant(product, value, persoOption ? 'Não' : null);
    return base ? base.available : true;
  };

  const handleAdd = () => {
    if (!variant || !available) return;

    if (wantsPerso && (!nome.trim() || !numero.trim())) {
      setError(
        !nome.trim() && !numero.trim()
          ? 'Preencha o nome e o número da personalização.'
          : !nome.trim()
            ? 'Preencha o nome que vai na camisa.'
            : 'Preencha o número que vai na camisa.'
      );
      return;
    }
    setError('');

    const properties: Record<string, string> = {};
    if (wantsPerso) {
      properties.Nome = nome.trim();
      properties['Número'] = numero.trim();
    }

    add({
      productHandle: product.handle,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      image: product.images[gallery] ?? product.image,
      price,
      quantity,
      properties: Object.keys(properties).length ? properties : undefined,
    });

  };

  const calcShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (cep.replace(/\D/g, '').length !== 8) return;
    setRates(shippingRates.filter((r) => r.enabled));
  };

  const related = relatedIn(allProducts, product, 12);

  return (
    <div ref={ref}>
      <div className="page py-6 sm:py-8">
        <nav aria-label="Você está aqui" className="mb-4 text-[13px] text-neutral-500">
          <Link to="/" className="transition-colors hover:text-brand">
            Início
          </Link>
          <span className="mx-1.5">/</span>
          <span className="line-clamp-1 inline text-ink">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          {/* Galeria */}
          <div className="reveal gsap-init">
            <div className="overflow-hidden rounded-media border border-line bg-white">
              <img
                key={gallery}
                src={img(product.images[gallery] ?? product.image, 1000)}
                alt={`${product.title} — imagem ${gallery + 1}`}
                width={1000}
                height={1000}
                fetchPriority="high"
                className="aspect-square w-full object-contain"
              />
            </div>

            {product.images.length > 1 && (
              <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((src, i) => (
                  <li key={src}>
                    <button
                      type="button"
                      onClick={() => setGallery(i)}
                      aria-label={`Ver imagem ${i + 1}`}
                      aria-current={i === gallery}
                      className={`h-[70px] w-[70px] shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                        i === gallery ? 'border-brand' : 'border-line hover:border-neutral-300'
                      }`}
                    >
                      <img
                        src={img(src, 160)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Informações */}
          <div className="reveal gsap-init">
            <div className="mb-3 flex flex-wrap gap-2">
              {off > 0 && (
                <span className="rounded bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Promoção
                </span>
              )}
              <span className="rounded bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Unidades limitadas
              </span>
            </div>

            <h1 className="text-[22px] font-semibold leading-tight text-ink sm:text-[28px]">
              {product.title}
            </h1>

            <div className="mt-2">
              <Estrelas nota={product.nota} avaliacoes={product.avaliacoes} tamanho={15} />
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
              {compareAt && compareAt > price && (
                <s className="text-[16px] text-muted">{brl(compareAt)}</s>
              )}
              <span className="text-[22px] font-bold text-ink sm:text-[24px]">{brl(price)}</span>
              {off > 0 && (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[12px] font-bold text-emerald-700">
                  -{off}%
                </span>
              )}
            </div>

            <p className="mt-1 text-[13px] text-neutral-500">
              ou 3x de <strong className="text-ink">{brl(installment(price))}</strong> sem juros
            </p>

            {/* Caixa do PIX */}
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <PixIcon className="h-7 w-7 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-emerald-700">
                  {brl(pix(price, pixRate))} no PIX
                  <span className="rounded-pill bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    -5%
                  </span>
                </p>
                <p className="text-[12px] text-emerald-700/80">
                  Economize <strong>{brl(price * pixRate)}</strong> pagando no PIX
                </p>
              </div>
            </div>

            {/* Tamanho */}
            {sizeOption && (
              <fieldset className="mt-6">
                <legend className="mb-2 text-[13px] text-neutral-600">{sizeOption.name}</legend>
                <div className="flex flex-wrap gap-2">
                  {sizeOption.values.map((value) => {
                    const ok = sizeAvailable(value);
                    const selected = size === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => ok && setSize(value)}
                        disabled={!ok}
                        aria-pressed={selected}
                        title={ok ? value : `${value} — esgotado`}
                        className={`size-pill ${
                          selected
                            ? 'border-ink bg-ink text-white'
                            : ok
                              ? 'border-neutral-300 bg-white text-ink hover:border-ink'
                              : 'cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-300 line-through'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Personalização */}
            {persoOption && (
              <fieldset className="mt-5">
                <legend className="mb-2 text-[13px] text-neutral-600">{persoOption.name}</legend>
                <div className="flex flex-wrap gap-2">
                  {persoOption.values.map((value) => {
                    const selected = perso === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPerso(value)}
                        aria-pressed={selected}
                        className={`size-pill ${
                          selected
                            ? 'border-ink bg-ink text-white'
                            : 'border-neutral-300 bg-white text-ink hover:border-ink'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {wantsPerso && (
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-line bg-neutral-50 p-4 sm:grid-cols-[1fr_110px]">
                <div>
                  <label
                    htmlFor="perso-nome"
                    className="mb-1 block text-[12px] font-medium text-neutral-600"
                  >
                    Nome na camisa
                  </label>
                  <input
                    id="perso-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={20}
                    placeholder="Ex: Matias"
                    className="field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="perso-numero"
                    className="mb-1 block text-[12px] font-medium text-neutral-600"
                  >
                    Número
                  </label>
                  <input
                    id="perso-numero"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    inputMode="numeric"
                    placeholder="Ex: 10"
                    className="field"
                  />
                </div>
              </div>
            )}

            {/* Estoque */}
            {available && (
              <div className="mt-5 rounded-lg border border-red-100 bg-red-50/50 p-3.5">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  {stock.units} unidades disponíveis
                  {size && <span className="font-normal text-neutral-500"> — Tamanho {size}</span>}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(90, (stock.units / 12) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  {stock.sold} unidades já vendidas
                </p>
              </div>
            )}

            {/* Quantidade + comprar */}
            <div className="mt-5 flex flex-wrap items-stretch gap-3">
              <div className="flex items-center rounded-btn border border-neutral-300">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="px-3.5 py-3 text-[17px] leading-none transition-colors hover:bg-neutral-100"
                >
                  −
                </button>
                <input
                  aria-label="Quantidade"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))
                  }
                  className="w-11 border-0 bg-transparent text-center text-[14px] font-semibold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Aumentar quantidade"
                  className="px-3.5 py-3 text-[17px] leading-none transition-colors hover:bg-neutral-100"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!available}
                className="btn-brand min-w-[200px] flex-1"
              >
                {available ? 'Adicionar ao carrinho' : 'Indisponível'}
                {available && <CartIcon className="h-4 w-4" />}
              </button>
            </div>

            {quantity > 1 && available && (
              <p className="mt-2 text-center text-[13px] text-neutral-500">
                Total: <strong className="text-ink">{brl(unitTotal * quantity)}</strong>
              </p>
            )}

            {error && (
              <p role="alert" className="mt-2 text-[13px] font-medium text-red-600">
                {error}
              </p>
            )}

            {/* Frete e informações */}
            <div className="mt-6 divide-y divide-line border-y border-line">
              <Accordion
                title={
                  <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide">
                    <TruckIcon className="h-4 w-4" /> Calcular frete e prazo de entrega
                  </span>
                }
              >
                <form onSubmit={calcShipping} className="flex gap-2">
                  <input
                    value={cep}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setCep(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
                    }}
                    inputMode="numeric"
                    placeholder="Digite seu CEP"
                    aria-label="CEP"
                    className="field flex-1"
                  />
                  <button type="submit" className="btn-outline shrink-0 px-5">
                    Calcular
                  </button>
                </form>

                {rates && (
                  <ul className="mt-3 space-y-2">
                    {rates.map((r) => (
                      <li
                        key={r.name}
                        className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {r.name}
                          </span>
                          <span className="text-[12px] text-neutral-500">{r.days}</span>
                        </span>
                        <strong className="shrink-0 text-[13px]">{brl(r.price)}</strong>
                      </li>
                    ))}
                    <li className="pt-1 text-[11px] text-neutral-400">
                      Valores de referência — o frete final é confirmado no checkout.
                    </li>
                  </ul>
                )}
              </Accordion>

              <Accordion
                title={
                  <span className="text-[13px] font-semibold uppercase tracking-wide">
                    ✅ Autenticidade
                  </span>
                }
              >
                Trabalhamos exclusivamente com peças de alta qualidade, conferidas uma a uma antes
                do envio. Todo o estoque já está no Brasil — sem espera alfandegária, sem
                surpresa.
              </Accordion>

              <Accordion
                title={
                  <span className="text-[13px] font-semibold uppercase tracking-wide">
                    ✅ Trocas e devoluções
                  </span>
                }
              >
                Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução,
                conforme o Código de Defesa do Consumidor. A peça precisa estar sem uso e com a
                etiqueta original. Peças personalizadas com nome e número só são trocadas em caso de
                defeito.
              </Accordion>
            </div>

            {product.descriptionHtml && (
              <div
                className="prose-desc mt-8"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}

            <div className="mt-8">
              <Avaliacoes
                nota={product.nota}
                total={product.avaliacoes}
                comentarios={product.comentarios}
              />
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <ProductCarousel title="Produtos Recomendados" products={related} />
      )}
    </div>
  );
}
