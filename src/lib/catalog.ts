import { normalize } from './format';
import type { Collection, Product, Variant } from '../types';

/* ============================================================
   Regras de catálogo. Todas as funções recebem a lista de
   produtos já resolvida (base + edições do painel), por isso
   nenhuma delas importa `data/products` diretamente.
   Use `useCatalog()` de admin/store/useResolvedCatalog.ts.
   ============================================================ */

/**
 * A loja modela a personalização como 2ª opção de variante (Não/Sim) e o
 * estoque só é lançado no lado "Não". Sem isso, um tamanho esgotado volta a
 * ficar comprável só por marcar "Personalizar: Sim".
 */
export const isBaseSide = (v: Variant) => !v.o2 || v.o2 === 'Não';

export const baseVariant = (product: Product, variant: Variant): Variant => {
  if (isBaseSide(variant)) return variant;
  return product.variants.find((v) => v.o1 === variant.o1 && v.o2 === 'Não') ?? variant;
};

export const isAvailable = (product: Product, variant: Variant | undefined) => {
  if (!variant) return false;
  return baseVariant(product, variant).available;
};

export const findVariant = (
  product: Product,
  o1: string | null,
  o2: string | null
): Variant | undefined =>
  product.variants.find(
    (v) => (v.o1 ?? null) === (o1 ?? null) && (v.o2 ?? null) === (o2 ?? null)
  );

export const firstAvailableVariant = (product: Product): Variant | undefined =>
  product.variants.find((v) => isBaseSide(v) && v.available) ??
  product.variants.find((v) => v.available) ??
  product.variants[0];

/** Produtos relacionados: mesmo tipo, priorizando tags em comum. */
export const relatedIn = (all: Product[], product: Product, limit = 6): Product[] =>
  all
    .filter((p) => p.handle !== product.handle && p.type === product.type && p.available)
    .map((p) => ({ p, score: p.tags.filter((t) => product.tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);

/** Busca por título, ignorando acento e caixa. */
export const searchIn = (all: Product[], query: string, limit = 12): Product[] => {
  const q = normalize(query).trim();
  if (!q) return [];
  return all.filter((p) => normalize(p.title).includes(q)).slice(0, limit);
};

export const productsOf = (
  collection: Collection | undefined,
  byHandle: Map<string, Product>
): Product[] => {
  if (!collection) return [];
  return collection.productHandles
    .map((h) => byHandle.get(h))
    .filter((p): p is Product => Boolean(p));
};

/** Deriva um "estoque restante" estável a partir do id — só para a barra de urgência. */
export const pseudoStock = (variantId: string) => {
  let h = 0;
  for (let i = 0; i < variantId.length; i++) h = (h * 31 + variantId.charCodeAt(i)) | 0;
  return { units: (Math.abs(h) % 8) + 2, sold: (Math.abs(h >> 3) % 60) + 12 };
};
