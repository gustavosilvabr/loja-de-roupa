import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../store/cart';
import { brl, img, installment, pix } from '../lib/format';
import { useAdmin } from '../admin/store/AdminProvider';
import { markSession, getSessionId } from '../lib/tracking';
import { uid } from '../admin/store/persist';
import type { Order } from '../admin/types';
import { Logo } from '../components/Logo';
import { CartIcon, PixIcon, ShieldIcon } from '../components/Icons';

type Payment = 'cartao' | 'pix' | 'boleto';

interface Address {
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const EMPTY: Address = { cep: '', endereco: '', bairro: '', cidade: '', estado: '' };

export default function Checkout() {
  const { lines, subtotal, count, setQty, remove, clear } = useCart();
  const { settings, addOrder, upsertAbandoned, removeAbandoned } = useAdmin();
  const rates = settings.shipping.filter((r) => r.enabled);
  const pixRate = settings.gateway.pixDiscount / 100;

  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [address, setAddress] = useState<Address>(EMPTY);
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [shipping, setShipping] = useState(rates[0]?.name ?? '');
  const [payment, setPayment] = useState<Payment>('cartao');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);

  const cepDigits = address.cep.replace(/\D/g, '');

  // Busca o endereço no ViaCEP assim que o CEP fica completo
  useEffect(() => {
    if (cepDigits.length !== 8) return;
    let cancelled = false;
    setCepStatus('loading');

    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
      .then((r) => r.json())
      .then((data: Record<string, string> & { erro?: boolean }) => {
        if (cancelled) return;
        if (data.erro) {
          setCepStatus('error');
          return;
        }
        setCepStatus('idle');
        setAddress((a) => ({
          ...a,
          endereco: data.logradouro || a.endereco,
          bairro: data.bairro || a.bairro,
          cidade: data.localidade || a.cidade,
          estado: data.uf || a.estado,
        }));
      })
      .catch(() => !cancelled && setCepStatus('error'));

    return () => {
      cancelled = true;
    };
  }, [cepDigits]);

  const shippingRate = rates.find((r) => r.name === shipping) ?? rates[0];
  const shippingCost = lines.length && shippingRate ? shippingRate.price : 0;

  // Marca a sessão como "chegou ao checkout" e guarda o carrinho para
  // aparecer em Estatísticas → Carrinhos abandonados caso não finalize.
  useEffect(() => {
    if (lines.length === 0) return;
    markSession('reachedCheckout');

    const sessionId = getSessionId();
    if (!sessionId) return;

    upsertAbandoned({
      id: sessionId,
      sessionId,
      updatedAt: Date.now(),
      email,
      total: subtotal,
      reachedCheckout: true,
      lines: lines.map((l) => ({
        productHandle: l.productHandle,
        title: l.title,
        variantTitle: l.variantTitle,
        quantity: l.quantity,
        price: l.price,
        image: l.image,
        properties: l.properties,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, email]);

  const discount = useMemo(() => {
    if (appliedCoupon === 'XING10') return subtotal * 0.1;
    if (payment === 'pix') return subtotal * pixRate;
    return 0;
  }, [appliedCoupon, payment, subtotal]);

  const total = Math.max(0, subtotal - discount) + shippingCost;

  const canSubmit =
    lines.length > 0 &&
    /\S+@\S+\.\S+/.test(email) &&
    nome.trim().length > 1 &&
    sobrenome.trim().length > 1 &&
    cepDigits.length === 8 &&
    address.endereco.trim().length > 2 &&
    numero.trim().length > 0 &&
    address.cidade.trim().length > 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const sessionId = getSessionId();
    const id = `XS${Date.now().toString().slice(-8)}`;

    // Sem gateway conectado o pedido é registrado localmente e aparece
    // no painel em Gestão → Vendas. A cobrança em si exige um servidor.
    const order: Order = {
      id,
      createdAt: Date.now(),
      status: 'pendente',
      customer: {
        name: `${nome.trim()} ${sobrenome.trim()}`.trim(),
        email: email.trim(),
        phone: telefone.trim(),
        cep: address.cep,
        address: address.endereco,
        number: numero,
        complement: complemento,
        district: address.bairro,
        city: address.cidade,
        state: address.estado,
      },
      lines: lines.map((l) => ({
        productHandle: l.productHandle,
        title: l.title,
        variantTitle: l.variantTitle,
        quantity: l.quantity,
        price: l.price,
        image: l.image,
        properties: l.properties,
      })),
      subtotal,
      discount,
      shipping: shippingCost,
      shippingMethod: shippingRate ? `${shippingRate.name} (${shippingRate.carrier})` : '',
      total,
      payment,
      sessionId: sessionId || uid('s'),
    };

    addOrder(order);
    markSession('purchased');
    if (sessionId) removeAbandoned(sessionId);

    setPlaced(id);
    clear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    setAppliedCoupon(code === 'XING10' ? code : null);
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-[560px] px-5 py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <ShieldIcon className="h-8 w-8" />
        </div>
        <h1 className="text-[24px] font-bold">Pedido registrado!</h1>
        <p className="mt-2 text-[15px] text-neutral-600">
          Seu número de pedido é <strong className="text-ink">{placed}</strong>.
        </p>
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Esta é a tela de confirmação da interface. Para cobrar de verdade, conecte um gateway de
          pagamento — veja as instruções no <code>README.md</code>.
        </p>
        <Link to="/" className="btn-brand mt-7">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line bg-black py-4">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5">
          <Logo />
          <Link to="/" aria-label="Voltar ao carrinho" className="text-white/80 hover:text-white">
            <CartIcon />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-5 py-8 lg:grid-cols-[1fr_400px] lg:gap-14">
        {/* Formulário */}
        <form onSubmit={submit} className="order-2 lg:order-1">
          <section aria-labelledby="contato">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="contato" className="text-[19px] font-bold">
                Contato
              </h2>
              <Link to="/conta" className="text-[13px] text-brand hover:underline">
                Fazer login
              </Link>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              aria-label="E-mail"
              autoComplete="email"
              className="field"
              required
            />
            <label className="mt-2 flex items-center gap-2 text-[13px] text-neutral-600">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand" />
              Enviar novidades e ofertas para mim por e-mail
            </label>
          </section>

          <section aria-labelledby="entrega" className="mt-8">
            <h2 id="entrega" className="mb-3 text-[19px] font-bold">
              Entrega
            </h2>

            <select className="field mb-3" aria-label="País/Região" defaultValue="BR">
              <option value="BR">Brasil</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome"
                aria-label="Nome"
                autoComplete="given-name"
                className="field"
                required
              />
              <input
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                placeholder="Sobrenome"
                aria-label="Sobrenome"
                autoComplete="family-name"
                className="field"
                required
              />
            </div>

            <div className="mt-3">
              <input
                value={address.cep}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setAddress((a) => ({
                    ...a,
                    cep: d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d,
                  }));
                }}
                inputMode="numeric"
                placeholder="CEP"
                aria-label="CEP"
                autoComplete="postal-code"
                className="field"
                required
              />
              {cepStatus === 'loading' && (
                <p className="mt-1 text-[12px] text-neutral-500">Buscando endereço…</p>
              )}
              {cepStatus === 'error' && (
                <p className="mt-1 text-[12px] text-red-600">
                  CEP não encontrado. Preencha o endereço manualmente.
                </p>
              )}
            </div>

            <div className="mt-3 grid grid-cols-[1fr_110px] gap-3">
              <input
                value={address.endereco}
                onChange={(e) => setAddress((a) => ({ ...a, endereco: e.target.value }))}
                placeholder="Endereço"
                aria-label="Endereço"
                autoComplete="address-line1"
                className="field"
                required
              />
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Número"
                aria-label="Número"
                className="field"
                required
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apartamento, bloco etc. (opcional)"
                aria-label="Complemento"
                className="field"
              />
              <input
                value={address.bairro}
                onChange={(e) => setAddress((a) => ({ ...a, bairro: e.target.value }))}
                placeholder="Bairro"
                aria-label="Bairro"
                className="field"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                value={address.cidade}
                onChange={(e) => setAddress((a) => ({ ...a, cidade: e.target.value }))}
                placeholder="Cidade"
                aria-label="Cidade"
                autoComplete="address-level2"
                className="field"
                required
              />
              <input
                value={address.estado}
                onChange={(e) => setAddress((a) => ({ ...a, estado: e.target.value }))}
                placeholder="Estado"
                aria-label="Estado"
                autoComplete="address-level1"
                className="field"
              />
            </div>

            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Telefone"
              aria-label="Telefone"
              autoComplete="tel"
              inputMode="tel"
              className="field mt-3"
            />
          </section>

          <section aria-labelledby="frete" className="mt-8">
            <h2 id="frete" className="mb-3 text-[19px] font-bold">
              Forma de frete
            </h2>
            <ul className="overflow-hidden rounded-md border border-neutral-300">
              {rates.map((rate, i) => (
                <li key={rate.name} className={i > 0 ? 'border-t border-neutral-200' : ''}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors ${
                      shipping === rate.name ? 'bg-brand-50' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shipping === rate.name}
                      onChange={() => setShipping(rate.name)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-ink">
                        {rate.name} ({rate.carrier})
                      </span>
                      <span className="text-[12px] text-neutral-500">{rate.days}</span>
                    </span>
                    <strong className="shrink-0 text-[13px]">{brl(rate.price)}</strong>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pagamento" className="mt-8">
            <h2 id="pagamento" className="text-[19px] font-bold">
              Pagamento
            </h2>
            <p className="mb-3 text-[13px] text-neutral-500">
              Todas as transações são seguras e criptografadas.
            </p>

            <ul className="overflow-hidden rounded-md border border-neutral-300">
              {(
                [
                  ['cartao', 'Cartão de crédito', `em até 12x — 3x de ${brl(installment(total))}`],
                  ['pix', 'PIX', '5% de desconto à vista'],
                  ['boleto', 'Boleto bancário', 'compensação em até 3 dias úteis'],
                ] as const
              ).map(([value, label, hint], i) => (
                <li key={value} className={i > 0 ? 'border-t border-neutral-200' : ''}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors ${
                      payment === value ? 'bg-brand-50' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === value}
                      onChange={() => setPayment(value)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="flex-1">
                      <span className="block text-[13px] font-medium text-ink">{label}</span>
                      <span className="text-[12px] text-neutral-500">{hint}</span>
                    </span>
                    {value === 'pix' && <PixIcon className="h-5 w-5 text-emerald-600" />}
                  </label>
                </li>
              ))}
            </ul>

            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
              <strong>Nenhum gateway conectado.</strong> Esta tela valida e monta o pedido, mas não
              cobra. Instruções para plugar Mercado Pago, Pagar.me ou Stripe estão no{' '}
              <code>README.md</code>.
            </p>

            <button type="submit" disabled={!canSubmit} className="btn-brand mt-5 w-full py-4">
              Finalizar pedido — {brl(total)}
            </button>

            {!canSubmit && lines.length > 0 && (
              <p className="mt-2 text-center text-[12px] text-neutral-500">
                Preencha e-mail, nome, CEP, endereço e cidade para continuar.
              </p>
            )}
          </section>
        </form>

        {/* Resumo */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg bg-brand-50/50 p-5">
            {lines.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[15px] text-neutral-600">Seu carrinho está vazio.</p>
                <Link to="/" className="btn-brand mt-4">
                  Escolher produtos
                </Link>
              </div>
            ) : (
              <>
                <ul className="space-y-4">
                  {lines.map((line) => (
                    <li key={line.key} className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={img(line.image, 120)}
                          alt={line.title}
                          loading="lazy"
                          className="h-14 w-14 rounded-md border border-line bg-white object-cover"
                        />
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-600 px-1 text-[11px] font-bold text-white">
                          {line.quantity}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] font-medium leading-snug">
                          {line.title}
                        </p>
                        <p className="text-[12px] text-neutral-500">{line.variantTitle}</p>
                        {line.properties &&
                          Object.entries(line.properties).map(([k, v]) => (
                            <p key={k} className="text-[11px] text-neutral-500">
                              {k}: {v}
                            </p>
                          ))}
                        <div className="mt-1 flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setQty(line.key, line.quantity - 1)}
                            className="rounded border border-neutral-300 px-1.5 hover:bg-white"
                            aria-label={`Diminuir ${line.title}`}
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => setQty(line.key, line.quantity + 1)}
                            className="rounded border border-neutral-300 px-1.5 hover:bg-white"
                            aria-label={`Aumentar ${line.title}`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(line.key)}
                            className="text-neutral-400 underline hover:text-red-500"
                          >
                            remover
                          </button>
                        </div>
                      </div>

                      <strong className="shrink-0 text-[13px]">
                        {brl(line.price * line.quantity)}
                      </strong>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Código de desconto"
                    aria-label="Código de desconto"
                    className="field bg-white py-2.5 text-[13px]"
                  />
                  <button type="button" onClick={applyCoupon} className="btn-outline shrink-0 px-5 py-2.5">
                    Aplicar
                  </button>
                </div>
                {coupon && appliedCoupon === null && (
                  <p className="mt-1 text-[12px] text-red-600">Cupom inválido.</p>
                )}
                {appliedCoupon && (
                  <p className="mt-1 text-[12px] text-emerald-600">
                    Cupom {appliedCoupon} aplicado — 10% de desconto.
                  </p>
                )}

                <dl className="mt-5 space-y-2 border-t border-brand-100 pt-4 text-[14px]">
                  <div className="flex justify-between">
                    <dt className="text-neutral-600">
                      Subtotal · {count} {count === 1 ? 'item' : 'itens'}
                    </dt>
                    <dd className="font-medium">{brl(subtotal)}</dd>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <dt>{appliedCoupon ? `Desconto (${appliedCoupon})` : 'Desconto PIX (5%)'}</dt>
                      <dd className="font-medium">−{brl(discount)}</dd>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <dt className="text-neutral-600">Frete</dt>
                    <dd className="font-medium">{brl(shippingCost)}</dd>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-brand-100 pt-3 text-[20px] font-bold">
                    <dt>Total</dt>
                    <dd>
                      <span className="mr-1.5 text-[12px] font-normal text-neutral-500">BRL</span>
                      {brl(total)}
                    </dd>
                  </div>
                </dl>

                {payment !== 'pix' && (
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] text-emerald-700">
                    <PixIcon className="h-4 w-4" />
                    {brl(pix(total, pixRate))} pagando no PIX
                  </p>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
