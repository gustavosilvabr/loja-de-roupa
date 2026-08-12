import { useMemo, useState } from 'react';
import { Badge, Card, ConfirmButton, EmptyState, Field, PageHeader, Select, StatCard } from '../ui';
import { useAdmin } from '../store/AdminProvider';
import { brl } from '../../lib/format';
import type { AbandonedCart } from '../types';

/* ============================================================
   CARRINHOS ABANDONADOS — quem montou o carrinho e não comprou.
   ============================================================ */

type Filtro = 'todos' | 'checkout' | 'comEmail';

function formatMoment(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** "há 3 dias" — ajuda o lojista a priorizar o contato. */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'há 1 dia' : `há ${d} dias`;
}

const totalItems = (cart: AbandonedCart) => cart.lines.reduce((acc, l) => acc + l.quantity, 0);

/**
 * Monta o link de recuperação. O número usado é o WhatsApp da loja
 * (configurado em Marca e contato) — o carrinho não guarda telefone do
 * visitante, então a mensagem já vem pronta para o lojista encaminhar.
 */
function whatsappLink(number: string, storeName: string, cart: AbandonedCart): string {
  const itens = cart.lines
    .map((l) => `• ${l.quantity}x ${l.title}${l.variantTitle ? ` (${l.variantTitle})` : ''}`)
    .join('\n');

  const texto =
    `Olá! Aqui é da ${storeName}. 👋\n\n` +
    `Vi que você deixou estas peças no carrinho:\n${itens}\n\n` +
    `Total: ${brl(cart.total)}\n\n` +
    `Quer que eu finalize o pedido pra você? Ainda temos as peças em estoque.`;

  const digits = (number || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(texto)}`;
}

export default function Carrinhos() {
  const { analytics, settings, removeAbandoned } = useAdmin();
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const resumo = useMemo(() => {
    const carts = analytics.abandoned;
    const perdido = carts.reduce((acc, c) => acc + c.total, 0);
    const noCheckout = carts.filter((c) => c.reachedCheckout).length;
    const comEmail = carts.filter((c) => !!c.email).length;
    return {
      quantidade: carts.length,
      perdido,
      noCheckout,
      comEmail,
      ticket: carts.length > 0 ? perdido / carts.length : 0,
    };
  }, [analytics.abandoned]);

  const lista = useMemo(() => {
    const filtrada = analytics.abandoned.filter((c) => {
      if (filtro === 'checkout') return c.reachedCheckout;
      if (filtro === 'comEmail') return !!c.email;
      return true;
    });
    return [...filtrada].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [analytics.abandoned, filtro]);

  const whats = settings.brand.whatsapp.number;

  if (analytics.abandoned.length === 0) {
    return (
      <>
        <PageHeader title="Carrinhos abandonados" />
        <EmptyState
          title="Nenhum carrinho abandonado"
          description="Quando um visitante adicionar produtos ao carrinho e sair sem finalizar, o carrinho aparece aqui com os itens, o valor e um atalho para recuperar a venda pelo WhatsApp."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Carrinhos abandonados"
        description="Contate essas pessoas — é a venda mais barata que existe."
      />

      {/* Destaque do valor perdido */}
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-[13px] font-medium text-amber-800">Valor total perdido em carrinhos</p>
        <p className="mt-1 text-[30px] font-bold leading-none text-amber-900">{brl(resumo.perdido)}</p>
        <p className="mt-2 text-[12.5px] text-amber-700">
          {resumo.quantidade} {resumo.quantidade === 1 ? 'carrinho abandonado' : 'carrinhos abandonados'} ·{' '}
          {resumo.noCheckout} {resumo.noCheckout === 1 ? 'chegou' : 'chegaram'} até o checkout
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Carrinhos" value={resumo.quantidade.toLocaleString('pt-BR')} />
        <StatCard label="Valor médio por carrinho" value={brl(resumo.ticket)} />
        <StatCard
          label="Com e-mail informado"
          value={`${resumo.comEmail} de ${resumo.quantidade}`}
          hint="Só dá para recuperar quem deixou contato"
        />
      </div>

      <Card
        title="Carrinhos"
        description={`${lista.length} ${lista.length === 1 ? 'carrinho' : 'carrinhos'} no filtro atual.`}
        actions={
          <div className="w-[210px]">
            <Field label="Filtrar">
              <Select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
                <option value="todos">Todos os carrinhos</option>
                <option value="checkout">Chegaram ao checkout</option>
                <option value="comEmail">Com e-mail informado</option>
              </Select>
            </Field>
          </div>
        }
      >
        {lista.length === 0 ? (
          <EmptyState
            title="Nenhum carrinho com esse filtro"
            description="Troque o filtro para ver os demais carrinhos abandonados."
          />
        ) : (
          <ul className="space-y-4">
            {lista.map((cart) => (
              <li key={cart.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-slate-900">{brl(cart.total)}</p>
                    <p className="mt-0.5 text-[12.5px] text-slate-500">
                      {totalItems(cart)} {totalItems(cart) === 1 ? 'item' : 'itens'} · atualizado{' '}
                      {timeAgo(cart.updatedAt)} ({formatMoment(cart.updatedAt)})
                    </p>
                    <p className="mt-1 text-[12.5px] text-slate-600">
                      {cart.email ? (
                        <a href={`mailto:${cart.email}`} className="underline underline-offset-2">
                          {cart.email}
                        </a>
                      ) : (
                        <span className="text-slate-400">E-mail não informado</span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {cart.reachedCheckout ? (
                      <Badge tone="sky">Chegou ao checkout</Badge>
                    ) : (
                      <Badge tone="slate">Parou no carrinho</Badge>
                    )}
                  </div>
                </div>

                {/* Itens */}
                <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                  {cart.lines.map((l, i) => (
                    <li key={`${cart.id}-${l.productHandle}-${i}`} className="flex items-center gap-3 py-2.5">
                      {l.image ? (
                        <img
                          src={l.image}
                          alt=""
                          loading="lazy"
                          className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="h-11 w-11 shrink-0 rounded-lg bg-slate-100" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-800">
                          {l.title}
                        </span>
                        {l.variantTitle && (
                          <span className="block text-[12px] text-slate-500">{l.variantTitle}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-[12.5px] text-slate-500">{l.quantity}x</span>
                      <span className="shrink-0 text-[13px] font-semibold text-slate-900">
                        {brl(l.price * l.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={whatsappLink(whats, settings.brand.name, cart)}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!whats}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
                      whats
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'pointer-events-none bg-slate-200 text-slate-400'
                    }`}
                  >
                    Recuperar por WhatsApp
                  </a>
                  <ConfirmButton onConfirm={() => removeAbandoned(cart.id)}>
                    Excluir carrinho
                  </ConfirmButton>
                </div>

                {!whats && (
                  <p className="mt-2 text-[12px] text-slate-400">
                    Cadastre o número de WhatsApp em Configurações → Marca e contato para habilitar a recuperação.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
