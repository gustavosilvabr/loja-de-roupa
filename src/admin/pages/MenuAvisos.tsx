import { useAdmin } from '../store/AdminProvider';
import { uid } from '../store/persist';
import { Button, Card, ConfirmButton, Field, Input, PageHeader, Textarea } from '../ui';
import type { FaqItem, NavItem } from '../types';

function Setas({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (delta: number) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label="Mover para cima"
        className="rounded border border-slate-300 px-2 py-0.5 text-[12px] text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label="Mover para baixo"
        className="rounded border border-slate-300 px-2 py-0.5 text-[12px] text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
      >
        ↓
      </button>
    </div>
  );
}

export default function MenuAvisos() {
  const { settings, updateSettings } = useAdmin();

  const setNav = (fn: (l: NavItem[]) => NavItem[]) =>
    updateSettings((s) => ({ ...s, nav: fn(s.nav) }));

  const setAvisos = (fn: (l: string[]) => string[]) =>
    updateSettings((s) => ({ ...s, announcements: fn(s.announcements) }));

  const setFaq = (fn: (l: FaqItem[]) => FaqItem[]) =>
    updateSettings((s) => ({ ...s, faq: fn(s.faq) }));

  const trocar = <T,>(lista: T[], index: number, delta: number): T[] => {
    const alvo = index + delta;
    if (alvo < 0 || alvo >= lista.length) return lista;
    const copia = [...lista];
    [copia[index], copia[alvo]] = [copia[alvo], copia[index]];
    return copia;
  };

  return (
    <>
      <PageHeader
        title="Menu e avisos"
        description="Links do topo, barra de avisos rotativa e perguntas frequentes."
      />

      <div className="space-y-6">
        <Card
          title="Menu do topo"
          description="Aparece no cabeçalho e também na coluna “Acesso rápido” do rodapé."
          actions={
            <Button
              onClick={() =>
                setNav((l) => [...l, { id: uid('n'), label: 'Novo link', to: '/' }])
              }
            >
              Adicionar link
            </Button>
          }
        >
          <ul className="space-y-3">
            {settings.nav.map((item, i) => (
              <li key={item.id} className="flex flex-wrap items-end gap-3">
                <Setas
                  index={i}
                  total={settings.nav.length}
                  onMove={(d) => setNav((l) => trocar(l, i, d))}
                />
                <Field label="Texto" className="min-w-[160px] flex-1">
                  <Input
                    value={item.label}
                    onChange={(e) =>
                      setNav((l) =>
                        l.map((x) => (x.id === item.id ? { ...x, label: e.target.value } : x))
                      )
                    }
                  />
                </Field>
                <Field label="Endereço" className="min-w-[200px] flex-1">
                  <Input
                    value={item.to}
                    onChange={(e) =>
                      setNav((l) =>
                        l.map((x) => (x.id === item.id ? { ...x, to: e.target.value } : x))
                      )
                    }
                    placeholder="/colecoes/titular"
                  />
                </Field>
                <ConfirmButton onConfirm={() => setNav((l) => l.filter((x) => x.id !== item.id))}>
                  Excluir
                </ConfirmButton>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Barra de avisos"
          description="Os textos se alternam a cada 5 segundos no topo da loja."
          actions={<Button onClick={() => setAvisos((l) => [...l, 'Novo aviso'])}>Adicionar aviso</Button>}
        >
          {settings.announcements.length === 0 ? (
            <p className="text-[13px] text-slate-500">
              Sem avisos — a barra fica escondida na loja.
            </p>
          ) : (
            <ul className="space-y-3">
              {settings.announcements.map((texto, i) => (
                <li key={i} className="flex flex-wrap items-end gap-3">
                  <Setas
                    index={i}
                    total={settings.announcements.length}
                    onMove={(d) => setAvisos((l) => trocar(l, i, d))}
                  />
                  <Field label={`Aviso ${i + 1}`} className="min-w-[240px] flex-1">
                    <Input
                      value={texto}
                      onChange={(e) =>
                        setAvisos((l) => l.map((x, idx) => (idx === i ? e.target.value : x)))
                      }
                    />
                  </Field>
                  <ConfirmButton
                    onConfirm={() => setAvisos((l) => l.filter((_, idx) => idx !== i))}
                  >
                    Excluir
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Perguntas frequentes"
          description="Exibidas na seção de FAQ da home."
          actions={
            <Button
              onClick={() =>
                setFaq((l) => [...l, { id: uid('f'), q: 'Nova pergunta', a: 'Resposta.' }])
              }
            >
              Adicionar pergunta
            </Button>
          }
        >
          <ul className="space-y-5">
            {settings.faq.map((item, i) => (
              <li key={item.id} className="flex flex-wrap items-start gap-3">
                <Setas
                  index={i}
                  total={settings.faq.length}
                  onMove={(d) => setFaq((l) => trocar(l, i, d))}
                />
                <div className="min-w-[260px] flex-1 space-y-2">
                  <Field label="Pergunta">
                    <Input
                      value={item.q}
                      onChange={(e) =>
                        setFaq((l) =>
                          l.map((x) => (x.id === item.id ? { ...x, q: e.target.value } : x))
                        )
                      }
                    />
                  </Field>
                  <Field label="Resposta">
                    <Textarea
                      rows={3}
                      value={item.a}
                      onChange={(e) =>
                        setFaq((l) =>
                          l.map((x) => (x.id === item.id ? { ...x, a: e.target.value } : x))
                        )
                      }
                    />
                  </Field>
                </div>
                <ConfirmButton onConfirm={() => setFaq((l) => l.filter((x) => x.id !== item.id))}>
                  Excluir
                </ConfirmButton>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
