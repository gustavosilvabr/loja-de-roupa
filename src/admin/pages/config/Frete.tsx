import { useAdmin } from '../../store/AdminProvider';
import { uid } from '../../store/persist';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Toggle,
} from '../../ui';
import { brl } from '../../../lib/format';
import type { ShippingRate } from '../../types';

export default function Frete() {
  const { settings, updateSettings } = useAdmin();
  const rates = settings.shipping;

  const setRates = (fn: (list: ShippingRate[]) => ShippingRate[]) =>
    updateSettings((s) => ({ ...s, shipping: fn(s.shipping) }));

  const patchRate = (id: string, patch: Partial<ShippingRate>) =>
    setRates((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRate = () =>
    setRates((list) => [
      ...list,
      {
        id: uid('frete'),
        name: 'Nova opção de frete',
        carrier: '',
        days: '',
        price: 0,
        enabled: true,
      },
    ]);

  const removeRate = (id: string) => setRates((list) => list.filter((r) => r.id !== id));

  const ativos = rates.filter((r) => r.enabled);
  const maisBarato = ativos.length ? Math.min(...ativos.map((r) => r.price)) : 0;

  return (
    <>
      <PageHeader
        title="Fretes"
        description="Opções de entrega mostradas no carrinho e na finalização do pedido."
        actions={
          <Button onClick={addRate} aria-label="Adicionar opção de frete">
            Adicionar frete
          </Button>
        }
      />

      <div className="grid gap-5">
        {ativos.length > 0 && (
          <p className="text-[13px] text-slate-600">
            {ativos.length} {ativos.length === 1 ? 'opção ativa' : 'opções ativas'} · frete mais
            barato: <strong className="text-slate-900">{brl(maisBarato)}</strong>
          </p>
        )}

        {rates.length === 0 ? (
          <EmptyState
            title="Nenhuma opção de frete"
            description="Sem fretes cadastrados o cliente não consegue escolher a entrega."
            action={<Button onClick={addRate}>Adicionar o primeiro frete</Button>}
          />
        ) : (
          <div className="grid gap-4">
            {rates.map((rate) => (
              <Card
                key={rate.id}
                title={rate.name || 'Sem nome'}
                description={
                  [rate.carrier, rate.days].filter(Boolean).join(' · ') || 'Sem transportadora'
                }
                actions={
                  rate.enabled ? <Badge tone="green">Ativo</Badge> : <Badge>Desativado</Badge>
                }
                className={rate.enabled ? '' : 'opacity-70'}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Nome da opção">
                    <Input
                      value={rate.name}
                      onChange={(e) => patchRate(rate.id, { name: e.target.value })}
                      placeholder="Correios PAC"
                    />
                  </Field>

                  <Field label="Transportadora">
                    <Input
                      value={rate.carrier}
                      onChange={(e) => patchRate(rate.id, { carrier: e.target.value })}
                      placeholder="Melhor Envio"
                    />
                  </Field>

                  <Field label="Prazo de entrega">
                    <Input
                      value={rate.days}
                      onChange={(e) => patchRate(rate.id, { days: e.target.value })}
                      placeholder="6 a 8 dias úteis"
                    />
                  </Field>

                  <Field label="Preço (R$)" hint={rate.price === 0 ? 'Zero = frete grátis' : undefined}>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={rate.price}
                      onChange={(e) =>
                        patchRate(rate.id, { price: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <Toggle
                    checked={rate.enabled}
                    onChange={(v) => patchRate(rate.id, { enabled: v })}
                    label="Disponível para o cliente"
                    hint={rate.price === 0 ? 'Aparecerá como Frete grátis.' : `Cobrando ${brl(rate.price)}.`}
                  />
                  <ConfirmButton
                    onConfirm={() => removeRate(rate.id)}
                    confirmLabel="Excluir mesmo"
                  >
                    Excluir
                  </ConfirmButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
