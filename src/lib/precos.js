/* ============================================================
   Matemática de preço e lucro. Funções puras, sem React —
   é aqui que mora a verdade sobre quanto sobra em cada venda.
   ============================================================ */

 











































export const FAIXAS_PADRAO = { boa: 40, moderada: 20 };

/** Aplica um markup percentual sobre o custo. 80 com 125% vira 180. */
export const aplicarMarkup = (custo, markupPercent) =>
  Math.round(custo * (1 + markupPercent / 100) * 100) / 100;

/** Quanto de markup é preciso para o preço sair no valor desejado. */
export const markupNecessario = (custo, precoDesejado) =>
  custo <= 0 ? 0 : Math.round(((precoDesejado - custo) / custo) * 100);

/**
 * Preço mínimo para atingir uma margem líquida alvo, já descontando
 * taxas percentuais. Resolve: preco = (custosFixos) / (1 - taxas% - margem%)
 */
export function precoParaMargem(
  p,
  margemAlvo
) {
  const percentuais = (p.taxaGateway + p.imposto + margemAlvo) / 100;
  if (percentuais >= 1) return Infinity;

  const fixos = p.custo + p.fretePago + p.taxaFixa + p.outrosCustos;
  return Math.round((fixos / (1 - percentuais)) * 100) / 100;
}

export function classificar(margem, faixas = FAIXAS_PADRAO) {
  if (margem < 0) return 'prejuizo';
  if (margem >= faixas.boa) return 'bom';
  if (margem >= faixas.moderada) return 'moderado';
  return 'baixo';
}

export function calcularLucro(
  p,
  faixas = FAIXAS_PADRAO
) {
  const taxas = (p.precoVenda * p.taxaGateway) / 100 + p.taxaFixa;
  const imposto = (p.precoVenda * p.imposto) / 100;

  const custoTotal = p.custo + p.fretePago + taxas + imposto + p.outrosCustos;
  const lucro = p.precoVenda - custoTotal;

  const margem = p.precoVenda > 0 ? (lucro / p.precoVenda) * 100 : 0;
  const markup = p.custo > 0 ? (lucro / p.custo) * 100 : 0;

  return {
    precoVenda: p.precoVenda,
    custo: p.custo,
    frete: p.fretePago,
    taxas: Math.round(taxas * 100) / 100,
    imposto: Math.round(imposto * 100) / 100,
    outros: p.outrosCustos,
    custoTotal: Math.round(custoTotal * 100) / 100,
    lucro: Math.round(lucro * 100) / 100,
    margem: Math.round(margem * 10) / 10,
    markup: Math.round(markup * 10) / 10,
    nivel: classificar(margem, faixas),
  };
}

export const ROTULO_NIVEL = {
  prejuizo: 'Prejuízo',
  baixo: 'Lucro baixo',
  moderado: 'Lucro moderado',
  bom: 'Lucro bom',
};

/** Classes Tailwind por nível — mantém a cor consistente em todas as telas. */
export const COR_NIVEL = {
  prejuizo: { texto: 'text-red-700', fundo: 'bg-red-100', ponto: 'bg-red-500' },
  baixo: { texto: 'text-orange-700', fundo: 'bg-orange-100', ponto: 'bg-orange-500' },
  moderado: { texto: 'text-amber-700', fundo: 'bg-amber-100', ponto: 'bg-amber-500' },
  bom: { texto: 'text-emerald-700', fundo: 'bg-emerald-100', ponto: 'bg-emerald-500' },
};

/** Frase curta e direta sobre valer a pena ou não vender por esse preço. */
export function veredito(r, faixas = FAIXAS_PADRAO) {
  switch (r.nivel) {
    case 'prejuizo':
      return `Você perde ${Math.abs(r.lucro).toFixed(2).replace('.', ',')} por peça. Não venda por esse preço.`;
    case 'baixo':
      return `Sobra pouco: ${r.margem}% de margem. Só compensa em volume alto ou para girar estoque parado.`;
    case 'moderado':
      return `Margem de ${r.margem}% — dá para vender, mas há espaço para melhorar.`;
    case 'bom':
      return `Margem de ${r.margem}%, acima da sua meta de ${faixas.boa}%. Pode vender tranquilo.`;
  }
}
