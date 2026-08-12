import { urlDe } from './imagensLocais';

/** Prefixo das imagens enviadas do computador. */
export const PREFIXO_LOCAL = 'local:';

/** "Camisa Retrô" -> "camisa retro" — base para busca e slugs. */
export const normalize = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

export const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Preço com o desconto do PIX aplicado. */
export const pix = (value: number, rate = 0.05) => value * (1 - rate);

export const installment = (value: number, times = 3) => value / times;

export const slug = (s: string) =>
  normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Resolve o endereço final de uma imagem.
 * - "local:<id>" → arquivo enviado do computador (guardado no IndexedDB)
 * - CDN do Shopify → pede já no tamanho certo, sem baixar o original
 * - qualquer outra URL → devolve como está
 */
export const img = (src: string, width = 800) => {
  if (!src) return '';

  if (src.startsWith(PREFIXO_LOCAL)) {
    // Enquanto o provider não terminou de carregar, devolve vazio em vez de
    // uma URL quebrada — o <img> fica em branco por um instante.
    return urlDe(src) ?? '';
  }

  if (!src.includes('cdn.shopify.com') && !src.includes('/cdn/shop/')) return src;
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}width=${width}`;
};

export const discountPercent = (price: number, compareAt: number | null) => {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
};
