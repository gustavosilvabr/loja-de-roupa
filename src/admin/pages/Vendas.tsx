import { useMemo, useState } from 'react';
import { useAdmin } from '../store/AdminProvider';
import { brl, img } from '../../lib/format';
import { Badge, Card, EmptyState, PageHeader, Select, StatCard } from '../ui';
import type { Order } from '../types';

const STATUS: Order['status'][] = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];

const TONE: Record<Order['status'], 'amber' | 'green' | 'sky' | 'violet' | 'red'> = {
  pendente: 'amber',
  pago: 'green',
  enviado: 'sky',
  entregue: 'violet',
  cancelado: 'red',
};

const data = (ts: number) =>
  new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function Vendas() {
  const { analytics, updateOrder } = useAdmin();
  const [filtro, setFiltro] = useState<'todos' | Order['status']>('todos');
  const [aberto, setAberto] = useState<string | null>(null);

  const pedidos = useMemo(() => {
    const list = [...analytics.orders].sort((a, b) => b.createdAt - a.createdAt);
    return filtro === 'todos' ? list : list.filter((o) => o.status === filtro);
  }, [analytics.orders, filtro]);

  const receita = useMemo(
    () => pedidos.filter((o) => o.status !== 'cancelado').reduce((s, o) => s + o.total, 0),
    [pedidos]
  );

  return (
    <>
      <PageHeader
        title="Vendas"
        description="Todos os pedidos feitos na loja, do mais recente para o mais antigo."
        actions={
          <Select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as typeof filtro)}
            aria-label="Filtrar por status"
          >
            <option value="todos">Todos os status</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Pedidos" value={pedidos.length} />
        <StatCard label="Receita" value={brl(receita)} />
        <StatCard
          label="Ticket médio"
          value={brl(pedidos.length ? receita / pedidos.length : 0)}
        />
      </div>

      {pedidos.length === 0 ? (
        <EmptyState
          title="Nenhum pedido ainda"
          description="Assim que alguém finalizar uma compra na loja, o pedido aparece aqui com os itens, o endereço e a forma de pagamento."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {pedidos.map((o) => {
              const expandido = aberto === o.id;
              return (
                <li key={o.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAberto(expandido ? null : o.id)}
                      aria-expanded={expandido}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block text-[14px] font-semibold text-slate-900">
                        #{o.id}
                        <span className="ml-2 font-normal text-slate-500">{o.customer.name}</span>
                      </span>
                      <span className="block text-[12px] text-slate-500">
                        {data(o.createdAt)} · {o.lines.length}{' '}
                        {o.lines.length === 1 ? 'item' : 'itens'} · {o.payment}
                      </span>
                    </button>

                    <strong className="text-[14px] text-slate-900">{brl(o.total)}</strong>

                    <Select
                      value={o.status}
                      onChange={(e) =>
                        updateOrder(o.id, { status: e.target.value as Order['status'] })
                      }
                      aria-label={`Status do pedido ${o.id}`}
                      className="!w-auto !py-1.5 !text-[12px]"
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s[0].toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </Select>

                    <Badge tone={TONE[o.status]}>{o.status}</Badge>
                  </div>

                  {expandido && (
                    <div className="mt-4 grid grid-cols-1 gap-5 rounded-lg bg-slate-50 p-4 lg:grid-cols-2">
                      <div>
                        <h3 className="mb-2 text-[13px] font-semibold text-slate-700">Itens</h3>
                        <ul className="space-y-2">
                          {o.lines.map((l, i) => (
                            <li key={i} className="flex items-center gap-3">
                              <img
                                src={img(l.image, 80)}
                                alt=""
                                loading="lazy"
                                className="h-11 w-11 shrink-0 rounded border border-slate-200 bg-white object-cover"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] text-slate-800">
                                  {l.title}
                                </span>
                                <span className="block text-[12px] text-slate-500">
                                  {l.variantTitle} · {l.quantity}x
                                </span>
                                {l.properties &&
                                  Object.entries(l.properties).map(([k, v]) => (
                                    <span key={k} className="block text-[11px] text-violet-600">
                                      {k}: {v}
                                    </span>
                                  ))}
                              </span>
                              <strong className="text-[13px]">{brl(l.price * l.quantity)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-[13px] text-slate-600">
                        <h3 className="mb-2 text-[13px] font-semibold text-slate-700">Entrega</h3>
                        <p>
                          {o.customer.address}, {o.customer.number}
                          {o.customer.complement && ` — ${o.customer.complement}`}
                        </p>
                        <p>
                          {o.customer.district} · {o.customer.city}/{o.customer.state}
                        </p>
                        <p>CEP {o.customer.cep}</p>
                        <p className="mt-1">{o.shippingMethod}</p>

                        <h3 className="mb-2 mt-4 text-[13px] font-semibold text-slate-700">
                          Contato
                        </h3>
                        <p>{o.customer.email}</p>
                        {o.customer.phone && <p>{o.customer.phone}</p>}

                        <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3">
                          <div className="flex justify-between">
                            <dt>Subtotal</dt>
                            <dd>{brl(o.subtotal)}</dd>
                          </div>
                          {o.discount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <dt>Desconto</dt>
                              <dd>−{brl(o.discount)}</dd>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <dt>Frete</dt>
                            <dd>{brl(o.shipping)}</dd>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900">
                            <dt>Total</dt>
                            <dd>{brl(o.total)}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
