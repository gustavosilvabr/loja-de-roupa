import { useMemo, useState } from 'react';
import { useAdmin } from '../store/AdminProvider';
import { brl, normalize } from '../../lib/format';
import { Card, EmptyState, Input, PageHeader, Select, StatCard } from '../ui';

interface Cliente {
  email: string;
  nome: string;
  telefone: string;
  cidade: string;
  pedidos: number;
  total: number;
  ultimoPedido: number;
}

type Ordem = 'total' | 'pedidos' | 'recente';

export default function Clientes() {
  const { analytics } = useAdmin();
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('total');

  // Agrupa os pedidos por e-mail — é a chave que identifica o comprador.
  const clientes = useMemo(() => {
    const mapa = new Map<string, Cliente>();

    for (const o of analytics.orders) {
      if (o.status === 'cancelado') continue;
      const chave = o.customer.email.toLowerCase().trim();
      if (!chave) continue;

      const atual = mapa.get(chave);
      if (atual) {
        atual.pedidos += 1;
        atual.total += o.total;
        atual.ultimoPedido = Math.max(atual.ultimoPedido, o.createdAt);
        atual.telefone = atual.telefone || o.customer.phone;
      } else {
        mapa.set(chave, {
          email: chave,
          nome: o.customer.name,
          telefone: o.customer.phone,
          cidade: [o.customer.city, o.customer.state].filter(Boolean).join('/'),
          pedidos: 1,
          total: o.total,
          ultimoPedido: o.createdAt,
        });
      }
    }

    return [...mapa.values()];
  }, [analytics.orders]);

  const lista = useMemo(() => {
    const q = normalize(busca).trim();
    const filtrados = q
      ? clientes.filter(
          (c) => normalize(c.nome).includes(q) || normalize(c.email).includes(q)
        )
      : clientes;

    const copia = [...filtrados];
    if (ordem === 'total') copia.sort((a, b) => b.total - a.total);
    if (ordem === 'pedidos') copia.sort((a, b) => b.pedidos - a.pedidos);
    if (ordem === 'recente') copia.sort((a, b) => b.ultimoPedido - a.ultimoPedido);
    return copia;
  }, [clientes, busca, ordem]);

  const recorrentes = clientes.filter((c) => c.pedidos > 1).length;
  const receita = clientes.reduce((s, c) => s + c.total, 0);

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Quem já comprou na loja, agrupado por e-mail."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatCard label="Clientes" value={clientes.length} />
        <StatCard label="Recorrentes" value={recorrentes} />
        <StatCard label="Receita total" value={brl(receita)} />
        <StatCard
          label="Ticket médio"
          value={brl(clientes.length ? receita / clientes.length : 0)}
        />
      </div>

      {clientes.length === 0 ? (
        <EmptyState
          title="Nenhum cliente ainda"
          description="Cada pessoa que finalizar um pedido aparece aqui com o histórico de compras, o total gasto e o ticket médio."
        />
      ) : (
        <Card
          actions={
            <>
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                aria-label="Buscar cliente"
                className="!w-[220px]"
              />
              <Select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                aria-label="Ordenar clientes"
                className="!w-auto"
              >
                <option value="total">Maior gasto</option>
                <option value="pedidos">Mais pedidos</option>
                <option value="recente">Compra mais recente</option>
              </Select>
            </>
          }
        >
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wide text-slate-500">
                  <th scope="col" className="py-2 pr-3 font-semibold">Cliente</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Contato</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Cidade</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Pedidos</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Total</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Ticket</th>
                  <th scope="col" className="pl-3 py-2 text-right font-semibold">Último</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lista.map((c) => (
                  <tr key={c.email} className="text-[13px] text-slate-700">
                    <td className="py-3 pr-3">
                      <span className="block font-medium text-slate-900">{c.nome}</span>
                    </td>
                    <td className="px-3 py-3">
                      <a href={`mailto:${c.email}`} className="block text-sky-600 hover:underline">
                        {c.email}
                      </a>
                      {c.telefone && <span className="block text-slate-500">{c.telefone}</span>}
                    </td>
                    <td className="px-3 py-3">{c.cidade || '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{c.pedidos}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {brl(c.total)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {brl(c.total / c.pedidos)}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums">
                      {new Date(c.ultimoPedido).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lista.length === 0 && (
            <p className="py-10 text-center text-[14px] text-slate-500">
              Nenhum cliente encontrado para “{busca}”.
            </p>
          )}
        </Card>
      )}
    </>
  );
}
