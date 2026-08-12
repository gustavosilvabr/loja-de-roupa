import { useEffect, useState } from 'react';
import { useAdmin } from '../../store/AdminProvider';
import { Button, Card, ConfirmButton, EmptyState, Field, Input, PageHeader, Textarea } from '../../ui';
import { slug as toSlug } from '../../../lib/format';
import type { PolicyDoc } from '../../types';

/** Garante slug único mesmo quando dois documentos têm o mesmo título. */
function uniqueSlug(base: string, taken: string[]) {
  const raiz = toSlug(base) || 'pagina';
  if (!taken.includes(raiz)) return raiz;
  let n = 2;
  while (taken.includes(`${raiz}-${n}`)) n += 1;
  return `${raiz}-${n}`;
}

export default function Politicas() {
  const { settings, updateSettings } = useAdmin();
  const policies = settings.policies;
  const [selected, setSelected] = useState(policies[0]?.slug ?? '');

  // O documento aberto pode sumir após uma exclusão — cai para o primeiro da lista.
  useEffect(() => {
    if (policies.length && !policies.some((p) => p.slug === selected)) {
      setSelected(policies[0].slug);
    }
  }, [policies, selected]);

  const atual = policies.find((p) => p.slug === selected) ?? null;

  const setPolicies = (fn: (list: PolicyDoc[]) => PolicyDoc[]) =>
    updateSettings((s) => ({ ...s, policies: fn(s.policies) }));

  const patchAtual = (patch: Partial<PolicyDoc>) => {
    if (!atual) return;
    setPolicies((list) => list.map((p) => (p.slug === atual.slug ? { ...p, ...patch } : p)));
  };

  const renomearSlug = (valor: string) => {
    if (!atual) return;
    const novo = uniqueSlug(
      valor,
      policies.filter((p) => p.slug !== atual.slug).map((p) => p.slug)
    );
    setPolicies((list) => list.map((p) => (p.slug === atual.slug ? { ...p, slug: novo } : p)));
    setSelected(novo);
  };

  const adicionar = () => {
    const novoSlug = uniqueSlug('nova-pagina', policies.map((p) => p.slug));
    setPolicies((list) => [...list, { slug: novoSlug, title: 'Nova página', body: '' }]);
    setSelected(novoSlug);
  };

  const excluir = (slugAlvo: string) => setPolicies((list) => list.filter((p) => p.slug !== slugAlvo));

  return (
    <>
      <PageHeader
        title="Páginas e políticas"
        description="Textos institucionais publicados em /paginas/{slug} e linkados no rodapé."
        actions={
          <Button onClick={adicionar} aria-label="Adicionar página">
            Adicionar página
          </Button>
        }
      />

      {policies.length === 0 ? (
        <EmptyState
          title="Nenhuma página cadastrada"
          description="Trocas, privacidade e termos de uso são exigidos pelo Código de Defesa do Consumidor e pela LGPD."
          action={<Button onClick={adicionar}>Criar a primeira página</Button>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <nav aria-label="Lista de páginas">
            <Card title="Páginas" className="lg:sticky lg:top-4">
              <ul className="grid gap-1">
                {policies.map((p) => {
                  const ativo = p.slug === selected;
                  return (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => setSelected(p.slug)}
                        aria-current={ativo ? 'true' : undefined}
                        className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                          ativo ? 'bg-sky-50 text-sky-800' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block truncate text-[13px] font-medium">
                          {p.title || 'Sem título'}
                        </span>
                        <span className="block truncate text-[11px] text-slate-400">/{p.slug}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </nav>

          {atual && (
            <Card
              title="Editar página"
              description={
                <>
                  Link público:{' '}
                  <a
                    href={`/paginas/${atual.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sky-700 hover:underline"
                  >
                    /paginas/{atual.slug}
                  </a>
                </>
              }
              actions={
                <ConfirmButton onConfirm={() => excluir(atual.slug)} confirmLabel="Excluir página">
                  Excluir
                </ConfirmButton>
              }
            >
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Título">
                    <Input
                      value={atual.title}
                      onChange={(e) => patchAtual({ title: e.target.value })}
                      placeholder="Política de Trocas e Devoluções"
                    />
                  </Field>

                  <Field
                    label="Endereço (slug)"
                    hint="Só letras, números e hífens. Alterar quebra links já divulgados."
                  >
                    <Input
                      value={atual.slug}
                      onChange={(e) => renomearSlug(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </Field>
                </div>

                <Field
                  label="Conteúdo"
                  hint="Texto puro. Cada linha em branco vira um novo parágrafo na loja."
                >
                  <Textarea
                    rows={18}
                    value={atual.body}
                    onChange={(e) => patchAtual({ body: e.target.value })}
                    placeholder="Escreva o texto da política..."
                    className="font-[system-ui] text-[13px]"
                  />
                </Field>

                <p className="text-[12px] text-slate-500">
                  {atual.body.trim() ? atual.body.trim().split(/\s+/).length : 0} palavras ·{' '}
                  {atual.body.split('\n\n').filter((t) => t.trim()).length} parágrafos
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
