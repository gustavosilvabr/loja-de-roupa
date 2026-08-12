 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }import { normalize } from './format';


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
export const isBaseSide = (v) => !v.o2 || v.o2 === 'Não';

export const baseVariant = (product, variant) => {
  if (isBaseSide(variant)) return variant;
  return _nullishCoalesce(product.variants.find((v) => v.o1 === variant.o1 && v.o2 === 'Não'), () => ( variant));
};

export const isAvailable = (product, variant) => {
  if (!variant) return false;
  return baseVariant(product, variant).available;
};

export const findVariant = (
  product,
  o1,
  o2
) =>
  product.variants.find(
    (v) => (_nullishCoalesce(v.o1, () => ( null))) === (_nullishCoalesce(o1, () => ( null))) && (_nullishCoalesce(v.o2, () => ( null))) === (_nullishCoalesce(o2, () => ( null)))
  );

export const firstAvailableVariant = (product) =>
  _nullishCoalesce(_nullishCoalesce(product.variants.find((v) => isBaseSide(v) && v.available), () => (
  product.variants.find((v) => v.available))), () => (
  product.variants[0]));

/** Produtos relacionados: mesmo tipo, priorizando tags em comum. */
export const relatedIn = (all, product, limit = 6) =>
  all
    .filter((p) => p.handle !== product.handle && p.type === product.type && p.available)
    .map((p) => ({ p, score: p.tags.filter((t) => product.tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);

/** Busca por título, ignorando acento e caixa. */
export const searchIn = (all, query, limit = 12) => {
  const q = normalize(query).trim();
  if (!q) return [];
  return all.filter((p) => normalize(p.title).includes(q)).slice(0, limit);
};

export const productsOf = (
  collection,
  byHandle
) => {
  if (!collection) return [];
  return collection.productHandles
    .map((h) => byHandle.get(h))
    .filter((p) => Boolean(p));
};

/** Deriva um "estoque restante" estável a partir do id — só para a barra de urgência. */
export const pseudoStock = (variantId) => {
  let h = 0;
  for (let i = 0; i < variantId.length; i++) h = (h * 31 + variantId.charCodeAt(i)) | 0;
  return { units: (Math.abs(h) % 8) + 2, sold: (Math.abs(h >> 3) % 60) + 12 };
};
