import { useAdmin } from './store/AdminProvider';
import { brl } from '../lib/format';
import {
  COR_NIVEL,
  ROTULO_NIVEL,
  calcularLucro,
  markupNecessario,
  precoParaMargem,
  veredito,
} from '../lib/precos';
import { Card, Field, Input } from './ui';

/**
 * Mostra a conta do lucro de um produto e permite dar um markup próprio a ele.
 * Reaproveitado pelo editor de produto — a matemática vive em lib/precos.
 */
export function PainelLucro({
  handle,
  custo,
  precoVenda,
}: {
  handle: string;
  custo: number;
  precoVenda: number;
}) {
  const { settings, catalog, setCatalog } = useAdmin();
  const pricing = settings.pricing;
  const faixas = { boa: pricing.margemBoa, moderada: pricing.margemModerada };

  const patch = catalog.products[handle];
  const markupAtual = patch?.markup ?? pricing.markupPadrao;
  const temPrecoFixo = patch?.price !== undefined;

  const fretePago =
    pricing.freteGratisAcima > 0 && precoVenda >= pricing.freteGratisAcima
      ? pricing.freteMedio
      : 0;

  const base = {
    custo,
    fretePago,
    taxaGateway: pricing.taxaGateway,
    taxaFixa: pricing.taxaFixa,
    imposto: pricing.imposto,
    outrosCustos: pricing.outrosCustos,
  };

  const r = calcularLucro({ ...base, precoVenda }, faixas);
  const cor = COR_NIVEL[r.nivel];
  const precoIdeal = precoParaMargem(base, pricing.margemBoa);

  const definirMarkup = (valor: number) =>
    setCatalog((c) => {
      // Preço fixo tem precedência: manter os dois tornaria o markup inócuo.
      const { price: _ignorado, ...resto } = c.products[handle] ?? {};
      return {
        ...c,
        products: { ...c.products, [handle]: { ...resto, markup: valor } },
      };
    });

  const linhas: [string, string, string?][] = [
    ['Preço de venda', brl(r.precoVenda)],
    ['Custo no fornecedor', `− ${brl(r.custo)}`],
    [`Taxa do gateway (${pricing.taxaGateway}%)`, `− ${brl(r.taxas)}`],
  ];
  if (r.frete > 0) linhas.push(['Frete que você paga', `− ${brl(r.frete)}`]);
  if (r.imposto > 0) linhas.push([`Imposto (${pricing.imposto}%)`, `− ${brl(r.imposto)}`]);
  if (r.outros > 0) linhas.push(['Embalagem e outros', `− ${brl(r.outros)}`]);

  return (
    <Card
      title="Quanto você lucra"
      description={`Markup de ${markupAtual}%${temPrecoFixo ? ' (ignorado: há preço fixo)' : ''}`}
    >
      <div className={`mb-4 rounded-lg px-4 py-3 ${cor.fundo}`}>
        <p className={`flex items-center gap-2 text-[15px] font-bold ${cor.texto}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${cor.ponto}`} />
          {ROTULO_NIVEL[r.nivel]} — sobra {brl(r.lucro)} por peça
        </p>
        <p className={`mt-1 text-[12.5px] ${cor.texto} opacity-90`}>{veredito(r, faixas)}</p>
      </div>

      <dl className="space-y-1.5 text-[13px]">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-3">
            <dt className="text-slate-600">{rotulo}</dt>
            <dd className="shrink-0 tabular-nums text-slate-700">{valor}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-[14px] font-bold">
          <dt className="text-slate-800">Sobra no bolso</dt>
          <dd className={`shrink-0 tabular-nums ${cor.texto}`}>{brl(r.lucro)}</dd>
        </div>
        <div className="flex justify-between gap-3 text-[12px]">
          <dt className="text-slate-500">Margem sobre a venda</dt>
          <dd className="tabular-nums text-slate-600">{r.margem}%</dd>
        </div>
        <div className="flex justify-between gap-3 text-[12px]">
          <dt className="text-slate-500">Retorno sobre o custo</dt>
          <dd className="tabular-nums text-slate-600">{r.markup}%</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <Field
          label="Markup só deste produto (%)"
          hint={`Deixe igual a ${pricing.markupPadrao}% para seguir a regra da loja`}
        >
          <Input
            type="number"
            min={0}
            value={markupAtual}
            onChange={(e) => definirMarkup(Number(e.target.value) || 0)}
          />
        </Field>

        {custo > 0 && Number.isFinite(precoIdeal) && (
          <p className="mt-3 text-[12.5px] text-slate-600">
            Para atingir sua meta de {pricing.margemBoa}% de margem, este produto precisaria ser
            vendido por <strong className="text-slate-900">{brl(precoIdeal)}</strong> — markup de{' '}
            {markupNecessario(custo, precoIdeal)}%.
          </p>
        )}
      </div>
    </Card>
  );
}
