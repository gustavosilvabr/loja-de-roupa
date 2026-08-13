import { useAdmin } from '../../store/AdminProvider';
import { Badge, Card, Field, Input, PageHeader, Select, Toggle } from '../../ui';
import { brl } from '../../../lib/format';
import type { GatewayProvider, GatewaySettings } from '../../types';

const PROVIDERS: { value: GatewayProvider; label: string }[] = [
  { value: 'nenhum', label: 'Nenhum (checkout apenas por WhatsApp)' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'pagarme', label: 'Pagar.me' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'pagseguro', label: 'PagSeguro' },
];

/** Formato esperado da chave pública de cada provedor — ajuda a pegar chave trocada. */
const KEY_HINTS: Record<GatewayProvider, string> = {
  nenhum: '',
  mercadopago: 'Começa com APP_USR- (produção) ou TEST- (sandbox).',
  pagarme: 'Chave pública pk_ ou pk_test_.',
  stripe: 'Começa com pk_live_ ou pk_test_.',
  pagseguro: 'Token público gerado no painel do PagSeguro.',
};

/** Taxas de referência divulgadas pelos provedores. Podem variar por contrato e volume. */
const FEES = [
  { name: 'Mercado Pago', credito: '4,99% (na hora)', pix: '0,99%', boleto: 'R$ 3,49' },
  { name: 'Pagar.me', credito: '3,99% + R$ 0,40', pix: '1,19%', boleto: 'R$ 3,50' },
  { name: 'Stripe', credito: '3,99% + R$ 0,39', pix: '1,19%', boleto: 'não oferece' },
  { name: 'PagSeguro', credito: '4,99% (em 14 dias)', pix: '0,99%', boleto: 'R$ 2,99' },
];

const isHttpsUrl = (v: string) => {
  if (!v) return true;
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};

export default function Gateway() {
  const { settings, updateSettings, nuvem } = useAdmin();
  const gw = settings.gateway;

  const setGw = (patch: Partial<GatewaySettings>) =>
    updateSettings((s) => ({ ...s, gateway: { ...s.gateway, ...patch } }));

  const ativo = gw.provider !== 'nenhum';
  const exemplo = 299.9;
  const comDesconto = exemplo * (1 - gw.pixDiscount / 100);

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description="Provedor do checkout, métodos aceitos e parcelamento."
        actions={ativo ? <Badge tone="green">Provedor configurado</Badge> : <Badge>Sem provedor</Badge>}
      />

      <div className="grid gap-5">
        {nuvem.ativa && (
          <p className="rounded-lg bg-slate-100 px-4 py-3 text-[13px] text-slate-700">
            {nuvem.email ? (
              <>
                Cada alteração desta tela é gravada no Supabase automaticamente — não existe botão
                de salvar. O selo <strong>No ar</strong>, lá no topo, confirma que já subiu.
              </>
            ) : (
              <>
                Você não está logado, então as alterações ficam só neste navegador.{' '}
                <strong>Entre no painel</strong> para que elas sejam gravadas no Supabase.
              </>
            )}
          </p>
        )}

        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-[13px] leading-relaxed text-red-900">
          <p className="text-[14px] font-semibold">A chave secreta nunca entra aqui</p>
          <p className="mt-1">
            Tudo o que está nesta tela é código de front-end: qualquer visitante consegue ler o
            conteúdo abrindo o inspetor do navegador. Só a <strong>chave pública</strong> pode ficar
            no site.
          </p>
          <p className="mt-2">
            Para cobrar de verdade você precisa de um back-end — uma função serverless (Vercel
            Functions, Netlify Functions, Supabase Edge Functions) que guarde a chave secreta em
            variável de ambiente, crie a cobrança no provedor e receba o webhook de confirmação.
            Enquanto essa função não existir, o painel apenas <strong>registra</strong> a
            configuração; nenhum pagamento é processado.
          </p>
        </div>

        <Card title="Provedor" description="Escolha quem vai processar as cobranças.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gateway de pagamento">
              <Select
                value={gw.provider}
                onChange={(e) => setGw({ provider: e.target.value as GatewayProvider })}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Chave pública"
              hint={KEY_HINTS[gw.provider] || 'Selecione um provedor para informar a chave.'}
            >
              <Input
                value={gw.publicKey}
                onChange={(e) => setGw({ publicKey: e.target.value.trim() })}
                placeholder="pk_..."
                disabled={!ativo}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <Toggle
              checked={gw.sandbox}
              onChange={(v) => setGw({ sandbox: v })}
              label="Modo sandbox (testes)"
              hint="Use cartões de teste do provedor. Nenhum valor real é cobrado."
            />
            {!gw.sandbox && ativo && (
              <p className="mt-2 text-[12px] font-medium text-amber-700">
                Modo produção: as cobranças passam a ser reais.
              </p>
            )}
          </div>
        </Card>

        <Card title="Métodos de pagamento" description="O que o cliente pode escolher na finalização.">
          <div className="grid gap-5">
            <div>
              <Toggle
                checked={gw.pixEnabled}
                onChange={(v) => setGw({ pixEnabled: v })}
                label="PIX"
                hint="Aprovação imediata e a menor taxa entre os métodos."
              />
              {gw.pixEnabled && (
                <div className="mt-3 grid gap-3 pl-12 sm:grid-cols-2">
                  <Field label="Desconto no PIX (%)">
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      value={gw.pixDiscount}
                      onChange={(e) =>
                        setGw({ pixDiscount: Math.min(30, Math.max(0, Number(e.target.value) || 0)) })
                      }
                    />
                  </Field>
                  <p className="self-end pb-2 text-[13px] text-slate-600">
                    Uma camisa de {brl(exemplo)} sai por{' '}
                    <strong className="text-emerald-700">{brl(comDesconto)}</strong> no PIX.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <Toggle
                checked={gw.cardEnabled}
                onChange={(v) => setGw({ cardEnabled: v })}
                label="Cartão de crédito"
                hint="Parcelamento aumenta a conversão, mas encarece a taxa."
              />
              {gw.cardEnabled && (
                <div className="mt-3 grid gap-3 pl-12 sm:grid-cols-2">
                  <Field label="Máximo de parcelas">
                    <Select
                      value={String(gw.maxInstallments)}
                      onChange={(e) => setGw({ maxInstallments: Number(e.target.value) })}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}x
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <p className="self-end pb-2 text-[13px] text-slate-600">
                    {brl(exemplo)} em até {gw.maxInstallments}x de{' '}
                    <strong>{brl(exemplo / gw.maxInstallments)}</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <Toggle
                checked={gw.boletoEnabled}
                onChange={(v) => setGw({ boletoEnabled: v })}
                label="Boleto bancário"
                hint="Compensação em até 3 dias úteis — o pedido só é liberado depois."
              />
            </div>

            {!gw.pixEnabled && !gw.cardEnabled && !gw.boletoEnabled && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                Nenhum método está ativo. O cliente não conseguirá finalizar o pedido.
              </p>
            )}
          </div>
        </Card>

        <Card
          title="Webhook"
          description="Endereço que o provedor chama quando o pagamento muda de status."
        >
          <Field
            label="URL do webhook"
            hint="Precisa ser uma função serverless pública e responder HTTP 200."
            error={isHttpsUrl(gw.webhookUrl) ? null : 'Informe uma URL completa começando com https://'}
          >
            <Input
              type="url"
              value={gw.webhookUrl}
              onChange={(e) => setGw({ webhookUrl: e.target.value.trim() })}
              placeholder="https://sualoja.com/api/webhook-pagamento"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            É o webhook — e não o navegador do cliente — que deve marcar o pedido como pago. Confiar
            no retorno do front-end permite que alguém finja um pagamento aprovado. Valide a
            assinatura enviada pelo provedor antes de aceitar o evento.
          </p>
        </Card>

        <Card
          title="Comparativo de taxas"
          description="Valores de tabela divulgados pelos provedores em planos padrão — confirme no contrato antes de decidir."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Provedor</th>
                  <th className="py-2 pr-3 font-semibold">Crédito à vista</th>
                  <th className="py-2 pr-3 font-semibold">PIX</th>
                  <th className="py-2 font-semibold">Boleto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {FEES.map((f) => (
                  <tr key={f.name} className={f.name === PROVIDERS.find((p) => p.value === gw.provider)?.label ? 'bg-sky-50' : ''}>
                    <td className="py-2.5 pr-3 font-medium text-slate-800">{f.name}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{f.credito}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{f.pix}</td>
                    <td className="py-2.5 text-slate-600">{f.boleto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-slate-500">
            As taxas de crédito caem conforme o prazo de recebimento: receber em 14 ou 30 dias custa
            menos do que receber na hora. Parcelamento sem juros para o cliente é descontado do
            lojista.
          </p>
        </Card>
      </div>
    </>
  );
}
