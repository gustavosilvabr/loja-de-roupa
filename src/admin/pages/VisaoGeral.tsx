import { useMemo, useState } from 'react';
import { Card, EmptyState, PageHeader, StatCard } from '../ui';
import { useAdmin } from '../store/AdminProvider';
import { brl } from '../../lib/format';
import type { AnalyticsEvent, Order, VisitorSession } from '../types';

/* ============================================================
   VISÃO GERAL — painel de métricas no estilo Nuvemshop.
   Tudo aqui é derivado de analytics (eventos, sessões, pedidos)
   e recalculado com useMemo, porque a base pode ter milhares
   de eventos guardados no localStorage.
   ============================================================ */

type PeriodKey = 'hoje' | 'semana' | '30dias' | 'mes';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Esta semana' },
  { key: '30dias', label: 'Últimos 30 dias' },
  { key: 'mes', label: 'Este mês' },
];

type ChartMetric = 'receita' | 'visitas';

interface Range {
  from: number;
  to: number;
  prevFrom: number;
  prevTo: number;
}

interface Bucket {
  label: string;
  start: number;
  end: number;
}

/* ---------- utilitários de data ---------- */

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Segunda-feira é o primeiro dia da semana no varejo brasileiro. */
function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts));
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  return d.getTime();
}

function startOfMonth(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

/** O período anterior tem exatamente a mesma duração e termina onde o atual começa. */
function computeRange(key: PeriodKey, now: number): Range {
  let from: number;

  if (key === 'hoje') from = startOfDay(now);
  else if (key === 'semana') from = startOfWeek(now);
  else if (key === 'mes') from = startOfMonth(now);
  else {
    const d = new Date(startOfDay(now));
    d.setDate(d.getDate() - 29);
    from = d.getTime();
  }

  const span = Math.max(now - from, 1);
  return { from, to: now, prevFrom: from - span, prevTo: from };
}

/** "Hoje" vira barras por hora; os outros períodos, barras por dia. */
function buildBuckets(key: PeriodKey, range: Range): Bucket[] {
  const out: Bucket[] = [];

  if (key === 'hoje') {
    const base = startOfDay(range.to);
    const lastHour = new Date(range.to).getHours();
    for (let h = 0; h <= lastHour; h++) {
      const start = base + h * 3600_000;
      out.push({ label: `${String(h).padStart(2, '0')}h`, start, end: start + 3600_000 });
    }
    return out;
  }

  const cursor = new Date(startOfDay(range.from));
  const limit = startOfDay(range.to);
  while (cursor.getTime() <= limit) {
    const start = cursor.getTime();
    const next = new Date(start);
    next.setDate(next.getDate() + 1);
    out.push({
      label: cursor.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      start,
      end: next.getTime(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/* ---------- utilitários de número ---------- */

function variation(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function pct(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

const int = (n: number) => n.toLocaleString('pt-BR');

/** Arredonda o topo do eixo Y para um valor "redondo" (1, 2, 2,5, 5, 10 x 10^n). */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return m * exp;
}

/** Rótulo curto para o eixo: 12.400 -> "12,4 mil". */
function shortNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} mil`;
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

const asText = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Agrupa referrers por domínio para não explodir a lista com URLs completas. */
function trafficSource(referrer: string): string {
  const raw = (referrer || '').trim();
  if (!raw || raw === 'direto') return 'Acesso direto';
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '');
    if (host.includes('google')) return 'Google';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('whatsapp')) return 'WhatsApp';
    return host;
  } catch {
    return raw;
  }
}

/* ============================================================
   Gráfico de barras em SVG puro — sem biblioteca.
   ============================================================ */

function BarChart({
  buckets,
  values,
  formatValue,
  ariaLabel,
}: {
  buckets: Bucket[];
  values: number[];
  formatValue: (n: number) => string;
  ariaLabel: string;
}) {
  const W = 760;
  const H = 260;
  const padL = 62;
  const padR = 14;
  const padT = 18;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = niceMax(Math.max(...values, 0));
  const slot = innerW / Math.max(buckets.length, 1);
  const barW = Math.max(3, Math.min(40, slot * 0.62));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  // Com muitas barras, mostra só alguns rótulos no eixo X.
  const labelStep = Math.max(1, Math.ceil(buckets.length / 12));
  const showValues = buckets.length <= 12;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Linhas de grade e eixo Y */}
      {ticks.map((t) => {
        const y = padT + innerH - innerH * t;
        return (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray={t === 0 ? undefined : '3 3'}
            />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
              {shortNumber(max * t)}
            </text>
          </g>
        );
      })}

      {/* Eixo X */}
      <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="#e2e8f0" strokeWidth={1} />

      {buckets.map((b, i) => {
        const value = values[i] ?? 0;
        const h = max > 0 ? (value / max) * innerH : 0;
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + innerH - h;

        return (
          <g key={b.start}>
            <rect
              x={x}
              y={value > 0 ? y : padT + innerH - 2}
              width={barW}
              height={value > 0 ? Math.max(h, 2) : 2}
              rx={3}
              fill={value > 0 ? '#8b5cf6' : '#e2e8f0'}
            >
              <title>{`${b.label}: ${formatValue(value)}`}</title>
            </rect>

            {showValues && value > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={10} fill="#475569">
                {shortNumber(value)}
              </text>
            )}

            {i % labelStep === 0 && (
              <text
                x={x + barW / 2}
                y={padT + innerH + 18}
                textAnchor="middle"
                fontSize={10.5}
                fill="#94a3b8"
              >
                {b.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- barra de proporção reutilizada nos rankings ---------- */

function RankBar({ label, value, total, suffix }: { label: string; value: number; total: number; suffix?: string }) {
  const share = total > 0 ? (value / total) * 100 : 0;
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate text-slate-700">{label}</span>
        <span className="shrink-0 font-semibold text-slate-900">
          {suffix ? `${int(value)} ${suffix}` : int(value)}
          <span className="ml-2 font-normal text-slate-400">{pct(share)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-violet-500" style={{ width: `${share}%` }} />
      </div>
    </li>
  );
}

/* ============================================================ */

export default function VisaoGeral() {
  const { analytics } = useAdmin();
  const [period, setPeriod] = useState<PeriodKey>('30dias');
  const [metric, setMetric] = useState<ChartMetric>('receita');
  // Congelado no mount para que os cálculos não mudem a cada render.
  const [now, setNow] = useState(() => Date.now());

  const range = useMemo(() => computeRange(period, now), [period, now]);
  const buckets = useMemo(() => buildBuckets(period, range), [period, range]);

  /* ---- fatias do período atual e anterior ---- */
  const slices = useMemo(() => {
    const inRange = (ts: number, a: number, b: number) => ts >= a && ts <= b;

    const sessions: VisitorSession[] = [];
    const prevSessions: VisitorSession[] = [];
    for (const s of analytics.sessions) {
      if (inRange(s.startedAt, range.from, range.to)) sessions.push(s);
      else if (inRange(s.startedAt, range.prevFrom, range.prevTo)) prevSessions.push(s);
    }

    const orders: Order[] = [];
    const prevOrders: Order[] = [];
    for (const o of analytics.orders) {
      if (o.status === 'cancelado') continue;
      if (inRange(o.createdAt, range.from, range.to)) orders.push(o);
      else if (inRange(o.createdAt, range.prevFrom, range.prevTo)) prevOrders.push(o);
    }

    const events: AnalyticsEvent[] = [];
    for (const e of analytics.events) {
      if (inRange(e.ts, range.from, range.to)) events.push(e);
    }

    return { sessions, prevSessions, orders, prevOrders, events };
  }, [analytics, range]);

  /* ---- números dos cards ---- */
  const kpis = useMemo(() => {
    const sum = (list: Order[]) => list.reduce((acc, o) => acc + o.total, 0);

    const visits = slices.sessions.length;
    const prevVisits = slices.prevSessions.length;
    const sales = slices.orders.length;
    const prevSales = slices.prevOrders.length;
    const revenue = sum(slices.orders);
    const prevRevenue = sum(slices.prevOrders);
    const avg = sales > 0 ? revenue / sales : 0;
    const prevAvg = prevSales > 0 ? prevRevenue / prevSales : 0;

    const carts = slices.sessions.filter((s) => s.addedToCart).length;
    const bought = slices.sessions.filter((s) => s.purchased).length;
    const prevCarts = slices.prevSessions.filter((s) => s.addedToCart).length;
    const prevBought = slices.prevSessions.filter((s) => s.purchased).length;
    const cartConv = carts > 0 ? (bought / carts) * 100 : 0;
    const prevCartConv = prevCarts > 0 ? (prevBought / prevCarts) * 100 : 0;

    return {
      visits,
      prevVisits,
      sales,
      prevSales,
      revenue,
      prevRevenue,
      avg,
      prevAvg,
      cartConv,
      prevCartConv,
    };
  }, [slices]);

  /* ---- série do gráfico ---- */
  const series = useMemo(() => {
    const values = buckets.map(() => 0);

    if (metric === 'receita') {
      for (const o of slices.orders) {
        const i = buckets.findIndex((b) => o.createdAt >= b.start && o.createdAt < b.end);
        if (i >= 0) values[i] += o.total;
      }
    } else {
      for (const s of slices.sessions) {
        const i = buckets.findIndex((b) => s.startedAt >= b.start && s.startedAt < b.end);
        if (i >= 0) values[i] += 1;
      }
    }

    return { values, total: values.reduce((a, b) => a + b, 0) };
  }, [buckets, slices, metric]);

  /* ---- funil de conversão ---- */
  const funnel = useMemo(() => {
    const visits = slices.sessions.length;
    const steps = [
      { label: 'Visitas', value: visits },
      { label: 'Adicionou ao carrinho', value: slices.sessions.filter((s) => s.addedToCart).length },
      { label: 'Chegou no checkout', value: slices.sessions.filter((s) => s.reachedCheckout).length },
      { label: 'Comprou', value: slices.sessions.filter((s) => s.purchased).length },
    ];
    return steps.map((s) => ({ ...s, share: visits > 0 ? (s.value / visits) * 100 : 0 }));
  }, [slices]);

  /* ---- clientes novos x recorrentes ---- */
  const customers = useMemo(() => {
    // Quem já tinha pedido antes do início do período é recorrente.
    const before = new Set(
      analytics.orders
        .filter((o) => o.createdAt < range.from && o.customer.email)
        .map((o) => o.customer.email.toLowerCase())
    );

    const seen = new Set<string>();
    let novos = 0;
    let recorrentes = 0;

    for (const o of slices.orders) {
      const email = (o.customer.email || o.id).toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      if (before.has(email)) recorrentes += 1;
      else novos += 1;
    }

    return { novos, recorrentes, total: novos + recorrentes };
  }, [analytics.orders, slices.orders, range.from]);

  /* ---- fontes de tráfego ---- */
  const sources = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of slices.sessions) {
      const key = trafficSource(s.referrer);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [slices.sessions]);

  /* ---- produtos mais vistos ---- */
  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of slices.events) {
      if (e.type !== 'product_view') continue;
      const label = asText(e.data?.title) || asText(e.data?.handle) || e.path;
      if (!label) continue;
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [slices.events]);

  const updatedAt = new Date(now);
  const hasAnyData =
    analytics.sessions.length > 0 || analytics.orders.length > 0 || analytics.events.length > 0;

  return (
    <>
      <PageHeader
        title="Visão geral"
        description={
          <>
            Última atualização: {updatedAt.toLocaleDateString('pt-BR')} às{' '}
            {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => setNow(Date.now())}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Atualizar dados
          </button>
        }
      />

      {/* Filtro de período */}
      <div className="mb-5 overflow-x-auto">
        <div
          className="inline-flex min-w-full gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:min-w-0"
          role="group"
          aria-label="Filtro de período"
        >
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              aria-pressed={period === p.key}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors sm:flex-none ${
                period === p.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Visitas únicas"
          value={int(kpis.visits)}
          previous={int(kpis.prevVisits)}
          variation={variation(kpis.visits, kpis.prevVisits)}
          hint="Sessões que começaram dentro do período"
        />
        <StatCard
          label="Vendas"
          value={int(kpis.sales)}
          previous={int(kpis.prevSales)}
          variation={variation(kpis.sales, kpis.prevSales)}
          hint="Pedidos não cancelados"
        />
        <StatCard
          label="Receita"
          value={brl(kpis.revenue)}
          previous={brl(kpis.prevRevenue)}
          variation={variation(kpis.revenue, kpis.prevRevenue)}
        />
        <StatCard
          label="Ticket médio"
          value={brl(kpis.avg)}
          previous={brl(kpis.prevAvg)}
          variation={variation(kpis.avg, kpis.prevAvg)}
        />
        <StatCard
          label="Conversão do carrinho"
          value={pct(kpis.cartConv)}
          previous={pct(kpis.prevCartConv)}
          variation={variation(kpis.cartConv, kpis.prevCartConv)}
          hint="Sessões que compraram ÷ sessões que adicionaram ao carrinho"
        />
      </div>

      {/* Gráfico */}
      <Card
        title={metric === 'receita' ? 'Receita por período' : 'Visitas por período'}
        description={
          metric === 'receita'
            ? `Total no período: ${brl(series.total)}`
            : `Total no período: ${int(series.total)} visitas`
        }
        actions={
          <div className="inline-flex gap-1 rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Métrica do gráfico">
            {(['receita', 'visitas'] as ChartMetric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                aria-pressed={metric === m}
                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold capitalize transition-colors ${
                  metric === m ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        }
        className="mb-5"
      >
        {series.total > 0 ? (
          <BarChart
            buckets={buckets}
            values={series.values}
            formatValue={(n) => (metric === 'receita' ? brl(n) : `${int(n)} visitas`)}
            ariaLabel={`Gráfico de barras de ${metric} por ${period === 'hoje' ? 'hora' : 'dia'}`}
          />
        ) : (
          <EmptyState
            title="Ainda não há movimento neste período"
            description={
              hasAnyData
                ? 'Experimente ampliar o filtro de período — pode haver dados em outra faixa de datas.'
                : 'Assim que a loja receber visitas e pedidos, o gráfico mostra a evolução dia a dia.'
            }
          />
        )}
      </Card>

      {/* Funil + Clientes */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Conversão das vendas" description="Do primeiro acesso até o pedido pago.">
          {funnel[0].value > 0 ? (
            <ol className="space-y-3">
              {funnel.map((step, i) => (
                <li key={step.label}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="text-slate-700">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                        {i + 1}
                      </span>
                      {step.label}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {int(step.value)}
                      <span className="ml-2 font-normal text-slate-400">{pct(step.share)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${Math.max(step.share, step.value > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="Sem visitas no período"
              description="O funil mostra quantas pessoas visitaram, adicionaram ao carrinho, chegaram no checkout e compraram."
            />
          )}
        </Card>

        <Card title="Clientes" description="Comparação entre quem comprou pela primeira vez e quem voltou.">
          {customers.total > 0 ? (
            <>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-violet-500"
                  style={{ width: `${(customers.novos / customers.total) * 100}%` }}
                />
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(customers.recorrentes / customers.total) * 100}%` }}
                />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                  <dt className="flex items-center gap-2 text-[12px] text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    Novos
                  </dt>
                  <dd className="mt-0.5 text-[18px] font-bold text-slate-900">{int(customers.novos)}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                  <dt className="flex items-center gap-2 text-[12px] text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Recorrentes
                  </dt>
                  <dd className="mt-0.5 text-[18px] font-bold text-slate-900">
                    {int(customers.recorrentes)}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <EmptyState
              title="Nenhum cliente comprou ainda"
              description="Aqui aparece quantos clientes são de primeira compra e quantos já haviam comprado antes."
            />
          )}
        </Card>
      </div>

      {/* Tráfego + produtos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Fontes de tráfego" description="De onde vieram as sessões do período.">
          {sources.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {sources.map((s) => (
                <RankBar key={s.label} label={s.label} value={s.value} total={kpis.visits} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Sem sessões registradas"
              description="Quando alguém acessar a loja, mostramos se veio do Google, do Instagram, de link direto ou de outro site."
            />
          )}
        </Card>

        <Card title="Produtos mais vistos" description="Baseado nas visitas às páginas de produto.">
          {topProducts.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {topProducts.map((p) => (
                <RankBar
                  key={p.label}
                  label={p.label}
                  value={p.value}
                  total={topProducts.reduce((a, b) => a + b.value, 0)}
                  suffix="visualizações"
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nenhum produto visualizado"
              description="Assim que os visitantes abrirem páginas de produto, o ranking dos mais vistos aparece aqui."
            />
          )}
        </Card>
      </div>
    </>
  );
}
