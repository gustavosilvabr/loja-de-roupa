import { useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, PageHeader, Select } from '../ui';
import { useAdmin } from '../store/AdminProvider';
import type { VisitorSession } from '../types';

/* ============================================================
   VISITANTES — cada sessão registrada pelo Tracker da vitrine.
   ============================================================ */

type StatusKey = 'navegou' | 'carrinho' | 'checkout' | 'comprou';
type StatusFilter = StatusKey | 'todos';
type DeviceFilter = VisitorSession['device'] | 'todos';

const STATUS_META: Record<StatusKey, { label: string; tone: 'slate' | 'amber' | 'sky' | 'green' }> = {
  navegou: { label: 'Só navegou', tone: 'slate' },
  carrinho: { label: 'Adicionou ao carrinho', tone: 'amber' },
  checkout: { label: 'Chegou no checkout', tone: 'sky' },
  comprou: { label: 'Comprou', tone: 'green' },
};

const DEVICE_LABEL: Record<VisitorSession['device'], string> = {
  desktop: 'Computador',
  mobile: 'Celular',
  tablet: 'Tablet',
};

const PAGE_SIZE = 40;

/** O marco mais avançado que a sessão alcançou. */
function statusOf(s: VisitorSession): StatusKey {
  if (s.purchased) return 'comprou';
  if (s.reachedCheckout) return 'checkout';
  if (s.addedToCart) return 'carrinho';
  return 'navegou';
}

function formatDuration(ms: number): string {
  const total = Math.max(Math.round(ms / 1000), 0);
  if (total < 60) return `${total}s`;
  const min = Math.floor(total / 60);
  const sec = total % 60;
  if (min < 60) return sec ? `${min}min ${sec}s` : `${min}min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}min`;
}

function formatMoment(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Referrer legível: só o domínio, ou "Acesso direto". */
function originOf(referrer: string): string {
  const raw = (referrer || '').trim();
  if (!raw || raw === 'direto') return 'Acesso direto';
  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return raw;
  }
}

export default function Visitantes() {
  const { analytics } = useAdmin();
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [device, setDevice] = useState<DeviceFilter>('todos');
  const [order, setOrder] = useState<'recentes' | 'antigos'>('recentes');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const rows = useMemo(() => {
    const filtered = analytics.sessions.filter((s) => {
      if (status !== 'todos' && statusOf(s) !== status) return false;
      if (device !== 'todos' && s.device !== device) return false;
      return true;
    });

    return filtered.sort((a, b) =>
      order === 'recentes' ? b.startedAt - a.startedAt : a.startedAt - b.startedAt
    );
  }, [analytics.sessions, status, device, order]);

  const visible = rows.slice(0, limit);
  const hasSessions = analytics.sessions.length > 0;

  return (
    <>
      <PageHeader
        title="Visitantes"
        description={`${analytics.sessions.length.toLocaleString('pt-BR')} sessões registradas na loja.`}
      />

      {!hasSessions ? (
        <EmptyState
          title="Nenhuma visita registrada ainda"
          description="Assim que alguém abrir a loja, cada sessão aparece aqui com dispositivo, origem, páginas vistas e até onde a pessoa chegou na compra."
        />
      ) : (
        <Card
          title="Sessões"
          description={`${rows.length.toLocaleString('pt-BR')} sessões no filtro atual.`}
        >
          {/* Filtros */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as StatusFilter);
                  setLimit(PAGE_SIZE);
                }}
              >
                <option value="todos">Todos os status</option>
                {(Object.keys(STATUS_META) as StatusKey[]).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_META[k].label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Dispositivo">
              <Select
                value={device}
                onChange={(e) => {
                  setDevice(e.target.value as DeviceFilter);
                  setLimit(PAGE_SIZE);
                }}
              >
                <option value="todos">Todos os dispositivos</option>
                <option value="desktop">Computador</option>
                <option value="mobile">Celular</option>
                <option value="tablet">Tablet</option>
              </Select>
            </Field>

            <Field label="Ordenar por data">
              <Select value={order} onChange={(e) => setOrder(e.target.value as 'recentes' | 'antigos')}>
                <option value="recentes">Mais recentes primeiro</option>
                <option value="antigos">Mais antigas primeiro</option>
              </Select>
            </Field>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="Nenhuma sessão com esses filtros"
              description="Ajuste o status ou o dispositivo para ver outras sessões."
            />
          ) : (
            <>
              {/* Tabela (telas médias para cima) */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-2 pr-3 font-semibold">Entrou</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Última atividade</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Duração</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Dispositivo</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Origem</th>
                      <th scope="col" className="py-2 pr-3 text-right font-semibold">Páginas</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Página de saída</th>
                      <th scope="col" className="py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((s) => {
                      const st = STATUS_META[statusOf(s)];
                      return (
                        <tr key={s.id} className="align-top hover:bg-slate-50/60">
                          <td className="py-2.5 pr-3 text-slate-700">{formatMoment(s.startedAt)}</td>
                          <td className="py-2.5 pr-3 text-slate-500">{formatMoment(s.lastSeenAt)}</td>
                          <td className="py-2.5 pr-3 text-slate-700">
                            {formatDuration(s.lastSeenAt - s.startedAt)}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-700">{DEVICE_LABEL[s.device]}</td>
                          <td className="max-w-[160px] truncate py-2.5 pr-3 text-slate-700" title={s.referrer}>
                            {originOf(s.referrer)}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-semibold text-slate-900">
                            {s.pageViews}
                          </td>
                          <td className="max-w-[180px] truncate py-2.5 pr-3 text-slate-500" title={s.exitPath}>
                            {s.exitPath || '—'}
                          </td>
                          <td className="py-2.5">
                            <Badge tone={st.tone}>{st.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards empilhados (mobile) */}
              <ul className="space-y-3 lg:hidden">
                {visible.map((s) => {
                  const st = STATUS_META[statusOf(s)];
                  return (
                    <li key={s.id} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="text-[13px] font-semibold text-slate-900">
                          {formatMoment(s.startedAt)}
                        </span>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                        <div>
                          <dt className="text-slate-400">Duração</dt>
                          <dd className="text-slate-700">{formatDuration(s.lastSeenAt - s.startedAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Dispositivo</dt>
                          <dd className="text-slate-700">{DEVICE_LABEL[s.device]}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Origem</dt>
                          <dd className="truncate text-slate-700">{originOf(s.referrer)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Páginas vistas</dt>
                          <dd className="text-slate-700">{s.pageViews}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-slate-400">Página de saída</dt>
                          <dd className="truncate text-slate-700">{s.exitPath || '—'}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-slate-400">Última atividade</dt>
                          <dd className="text-slate-700">{formatMoment(s.lastSeenAt)}</dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>

              {rows.length > visible.length && (
                <div className="mt-4 text-center">
                  <Button variant="secondary" onClick={() => setLimit((v) => v + PAGE_SIZE)}>
                    Mostrar mais ({rows.length - visible.length} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </>
  );
}
