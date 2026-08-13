import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../store/AdminProvider';
import { useSincronizador } from '../store/useSincronizador';
import { RESUMO_TIPO } from '../store/sync';
import { brl, img } from '../../lib/format';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
  Toggle,
} from '../ui';
import type { MudancaSync, SyncSettings } from '../types';

const TOM: Record<MudancaSync['tipo'], 'sky' | 'amber' | 'violet' | 'red'> = {
  novo: 'sky',
  preco: 'amber',
  estoque: 'violet',
  sumiu: 'red',
};

const quando = (ts: number | null) =>
  ts
    ? new Date(ts).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'nunca';

export default function Sincronizacao() {
  const { settings, updateSettings, sync } = useAdmin();
  const { verificar, aplicar, descartar } = useSincronizador();
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  const setSync = (patch: Partial<SyncSettings>) =>
    updateSettings((s) => ({ ...s, sync: { ...s.sync, ...patch } }));

  const chave = (m: MudancaSync) => `${m.tipo}:${m.handle}`;

  const alternar = (m: MudancaSync) =>
    setSelecionadas((s) => {
      const novo = new Set(s);
      const k = chave(m);
      if (novo.has(k)) novo.delete(k);
      else novo.add(k);
      return novo;
    });

  const contagem = sync.mudancas.reduce(
    (acc, m) => ({ ...acc, [m.tipo]: (acc[m.tipo] ?? 0) + 1 }),
    {} as Record<MudancaSync['tipo'], number>
  );

  const aplicarSelecionadas = () => {
    const alvo = sync.mudancas.filter((m) => selecionadas.has(chave(m)));
    if (alvo.length === 0) return;
    aplicar(alvo);
    setSelecionadas(new Set());
  };

  return (
    <>
      <PageHeader
        title="Olheiro do catálogo"
        description="Verifica a loja de origem e avisa quando entra produto novo ou muda preço."
        actions={
          <Button onClick={verificar} disabled={sync.verificando}>
            {sync.verificando ? 'Verificando…' : 'Verificar agora'}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Produtos novos" value={contagem.novo ?? 0} />
        <StatCard label="Preços mudaram" value={contagem.preco ?? 0} />
        <StatCard label="Estoque mudou" value={contagem.estoque ?? 0} />
        <StatCard label="Saíram do catálogo" value={contagem.sumiu ?? 0} />
      </div>

      {sync.ultimoErro && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {sync.ultimoErro}
        </p>
      )}

      <Card className="mb-6" title="Como o olheiro trabalha">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Loja de origem" hint="Endereço da Shopify que você acompanha">
            <Input
              value={settings.sync.origem}
              onChange={(e) => setSync({ origem: e.target.value })}
              spellCheck={false}
            />
          </Field>

          <Field label="Verificar a cada">
            <Select
              value={settings.sync.intervaloMinutos}
              onChange={(e) => setSync({ intervaloMinutos: Number(e.target.value) })}
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={360}>6 horas</option>
              <option value={1440}>1 vez por dia</option>
            </Select>
          </Field>

          <div className="flex items-end pb-1">
            <Toggle
              checked={settings.sync.ativo}
              onChange={(v) => setSync({ ativo: v })}
              label="Olheiro ligado"
              hint="Verifica sozinho enquanto o painel estiver aberto"
            />
          </div>

          <div className="flex items-end pb-1">
            <Toggle
              checked={settings.sync.aplicarAutomatico}
              onChange={(v) => setSync({ aplicarAutomatico: v })}
              label="Aplicar sozinho"
              hint="Atualiza custos sem pedir sua confirmação"
            />
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <Toggle
            checked={settings.sync.importarNovos}
            onChange={(v) => setSync({ importarNovos: v })}
            label="Importar produtos novos automaticamente"
            hint="Entram completos — tamanhos, fotos e descrição — mas revise antes de divulgar"
          />
        </div>

        <p className="mt-4 text-[12.5px] text-slate-500">
          Última verificação: <strong className="text-slate-700">{quando(sync.ultimaVerificacao)}</strong>
          . O preço de venda se recalcula sozinho quando o custo muda, então sua margem não é comida
          sem você perceber.
        </p>
        <p className="mt-2 text-[12.5px] text-slate-500">
          O que o olheiro encontra vai direto para o Supabase, então aparece para todo mundo — não só
          neste computador. Isso exige estar logado no painel:{' '}
          <Link to="/admin/config/nuvem" className="font-medium text-slate-700 underline">
            ver o catálogo na nuvem
          </Link>
          .
        </p>
      </Card>

      {sync.mudancas.length === 0 ? (
        <EmptyState
          title={sync.ultimaVerificacao ? 'Nada mudou desde a última olhada' : 'Ainda não verifiquei'}
          description={
            sync.ultimaVerificacao
              ? 'Quando a loja de origem lançar um produto ou mexer num preço, aparece aqui para você aprovar.'
              : 'Clique em “Verificar agora” para comparar seu catálogo com a loja de origem.'
          }
          action={
            <Button onClick={verificar} disabled={sync.verificando}>
              {sync.verificando ? 'Verificando…' : 'Verificar agora'}
            </Button>
          }
        />
      ) : (
        <Card
          title={`${sync.mudancas.length} mudanças encontradas`}
          description="Marque o que quer aplicar. Nada muda até você aprovar."
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setSelecionadas(new Set(sync.mudancas.map(chave)))}
              >
                Marcar todas
              </Button>
              <Button onClick={aplicarSelecionadas} disabled={selecionadas.size === 0}>
                Aplicar {selecionadas.size || ''}
              </Button>
              <Button variant="ghost" onClick={descartar}>
                Descartar
              </Button>
            </>
          }
        >
          <ul className="divide-y divide-slate-100">
            {sync.mudancas.map((m) => (
              <li key={chave(m)} className="flex flex-wrap items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={selecionadas.has(chave(m))}
                  onChange={() => alternar(m)}
                  aria-label={`Selecionar ${m.titulo}`}
                  className="h-4 w-4 shrink-0 accent-sky-600"
                />

                {m.imagem && (
                  <img
                    src={img(m.imagem, 80)}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                )}

                <div className="min-w-[200px] flex-1">
                  <p className="line-clamp-1 text-[13.5px] font-medium text-slate-900">
                    {m.titulo}
                  </p>
                  <code className="text-[11px] text-slate-400">{m.handle}</code>
                </div>

                <div className="shrink-0 text-right text-[12.5px]">
                  {m.tipo === 'preco' && (
                    <span className="tabular-nums text-slate-600">
                      custo {brl(m.custoAntigo ?? 0)} →{' '}
                      <strong
                        className={
                          (m.custoNovo ?? 0) > (m.custoAntigo ?? 0)
                            ? 'text-red-600'
                            : 'text-emerald-600'
                        }
                      >
                        {brl(m.custoNovo ?? 0)}
                      </strong>
                    </span>
                  )}
                  {m.tipo === 'novo' && (
                    <span className="tabular-nums text-slate-600">
                      custo {brl(m.custoNovo ?? 0)}
                    </span>
                  )}
                  {m.tipo === 'estoque' && (
                    <span className="text-slate-600">
                      {m.disponivelAgora ? 'voltou ao estoque' : 'esgotou'}
                    </span>
                  )}
                  {m.tipo === 'sumiu' && (
                    <span className="text-slate-600">será ocultado da loja</span>
                  )}
                </div>

                <Badge tone={TOM[m.tipo]}>{RESUMO_TIPO[m.tipo]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-6" title="O que o olheiro não faz sozinho">
        <ul className="space-y-2 text-[13px] leading-relaxed text-slate-600">
          <li>
            Ele só roda <strong className="text-slate-800">com o painel aberto</strong>. Uma página
            no navegador não executa nada quando está fechada. Para verificar 24 horas por dia,
            seria preciso um servidor ou uma tarefa agendada no computador.
          </li>
          <li>
            Produtos novos entram sem descrição, sem variantes e sem categoria — revise antes de
            deixar visível na loja.
          </li>
          <li>
            Quando um produto some da origem, ele é <strong className="text-slate-800">ocultado</strong>,
            nunca apagado. Assim você não perde o histórico de vendas.
          </li>
        </ul>
      </Card>
    </>
  );
}
