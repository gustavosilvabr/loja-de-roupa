import { useMemo, useSyncExternalStore } from 'react';
import { assinarBase, catalogoBase } from './baseCatalog';
import { aplicarMarkup } from '../../lib/precos';
import { DEFAULT_SETTINGS } from '../defaults';
import { useAdmin } from './AdminProvider';
import type { Collection, Product } from '../../types';
import type { CatalogOverrides, PricingSettings } from '../types';

/**
 * IMPORTANTE: em `data/products.ts` o campo `price` é o preço do FORNECEDOR,
 * ou seja, o seu custo. O preço que o cliente vê é calculado aqui aplicando o
 * markup. Assim, quando o olheiro trouxer um custo novo, o preço de venda se
 * ajusta sozinho e sua margem não é comida sem você perceber.
 */

/** Arredonda para o "final" configurado (ex.: 0,90) sem baixar o preço. */
function arredondar(valor: number, terminaEm: number): number {
  if (terminaEm <= 0) return Math.round(valor * 100) / 100;
  const inteiro = Math.floor(valor);
  const alvo = inteiro + terminaEm;
  return Math.round((alvo >= valor ? alvo : alvo + 1) * 100) / 100;
}

/**
 * Preço de venda a partir do custo.
 * Precedência: preço fixo do produto > markup do produto > markup da loja.
 */
export function precoDeVenda(
  custo: number,
  pricing: PricingSettings,
  markupProduto?: number,
  precoFixo?: number
): number {
  if (precoFixo !== undefined && precoFixo > 0) return Math.round(precoFixo * 100) / 100;
  if (custo <= 0) return 0;
  const markup = markupProduto ?? pricing.markupPadrao;
  return arredondar(aplicarMarkup(custo, markup), pricing.arredondarPara);
}

export function resolveProducts(
  overrides: CatalogOverrides,
  pricing: PricingSettings,
  base: Product[] = catalogoBase().products
): Product[] {
  const deleted = new Set(overrides.deleted);

  const merged = base
    .filter((p) => !deleted.has(p.handle))
    .map((p) => applyPatch(p, overrides, pricing));

  // Um produto trazido pelo olheiro fica em `created` até subir para a nuvem.
  // Quando ele passa a existir na base, o esboço local sai de cena — senão o
  // mesmo produto apareceria duas vezes na vitrine.
  const naBase = new Set(base.map((p) => p.handle));

  const created = overrides.created
    .filter((h) => !deleted.has(h) && !naBase.has(h))
    .map((handle) => criarProduto(handle, overrides, pricing));

  return [...created, ...merged].filter((p) => !overrides.products[p.handle]?.hidden);
}

function criarProduto(
  handle: string,
  overrides: CatalogOverrides,
  pricing: PricingSettings
): Product {
  const patch = overrides.products[handle] ?? {};
  const custo = patch.custo ?? 0;
  const venda = precoDeVenda(custo, pricing, patch.markup, patch.price);

  return {
    id: handle,
    handle,
    title: patch.title ?? 'Novo produto',
    type: patch.type ?? 'Camisa',
    vendor: 'GP ESPORTES',
    tags: patch.tags ?? [],
    options: [],
    variants: [
      {
        id: `${handle}-v1`,
        title: 'Padrão',
        o1: null,
        o2: null,
        price: venda,
        custo,
        compareAt: patch.compareAt ?? null,
        available: patch.available ?? true,
      },
    ],
    images: patch.images ?? [],
    image: patch.images?.[0] ?? '',
    price: venda,
    custo,
    compareAt: patch.compareAt ?? null,
    available: patch.available ?? true,
    descriptionHtml: patch.descriptionHtml ?? '',
    nota: patch.nota,
    avaliacoes: patch.avaliacoes,
    selo: patch.selo,
    comentarios: patch.comentarios,
  };
}

function applyPatch(
  product: Product,
  overrides: CatalogOverrides,
  pricing: PricingSettings
): Product {
  const patch = overrides.products[product.handle];
  const images = patch?.images ?? product.images;

  const variants = product.variants.map((v) => {
    const vo = patch?.variantOverrides?.[v.id];

    // O custo vem do fornecedor; só um override explícito o substitui.
    const custo = patch?.custo ?? v.price;
    const precoFixo = vo?.price ?? patch?.price;
    const venda = precoDeVenda(custo, pricing, patch?.markup, precoFixo);

    return {
      ...v,
      custo,
      price: venda,
      available: vo?.available ?? patch?.available ?? v.available,
      compareAt: patch?.compareAt !== undefined ? patch.compareAt : v.compareAt,
    };
  });

  const vendas = variants.filter((v) => v.price > 0).map((v) => v.price);
  const custos = variants.filter((v) => (v.custo ?? 0) > 0).map((v) => v.custo ?? 0);

  return {
    ...product,
    title: patch?.title ?? product.title,
    type: patch?.type ?? product.type,
    tags: patch?.tags ?? product.tags,
    descriptionHtml: patch?.descriptionHtml ?? product.descriptionHtml,
    images,
    image: images[0] ?? product.image,
    variants,
    price: vendas.length ? Math.min(...vendas) : 0,
    custo: custos.length ? Math.min(...custos) : 0,
    compareAt: patch?.compareAt !== undefined ? patch.compareAt : product.compareAt,
    available: variants.some((v) => v.available),
    nota: patch?.nota,
    avaliacoes: patch?.avaliacoes,
    selo: patch?.selo,
    comentarios: patch?.comentarios,
  };
}

export function resolveCollections(
  overrides: CatalogOverrides,
  products: Product[],
  base: Collection[] = catalogoBase().collections
): Collection[] {
  const alive = new Set(products.map((p) => p.handle));
  const deleted = new Set(overrides.categoriesDeleted);

  const merged = base
    .filter((c) => !deleted.has(c.handle))
    .map((c) => {
      const patch = overrides.categories[c.handle];
      const handles = (patch?.productHandles ?? c.productHandles).filter((h) => alive.has(h));
      return {
        ...c,
        title: patch?.title ?? c.title,
        subtitle: patch?.subtitle ?? c.subtitle,
        productHandles: handles,
      };
    })
    .filter((c) => !overrides.categories[c.handle]?.hidden);

  const created = overrides.categoriesCreated
    .filter((h) => !deleted.has(h))
    .map((handle) => {
      const patch = overrides.categories[handle] ?? {};
      return {
        handle,
        title: patch.title ?? 'Nova categoria',
        subtitle: patch.subtitle ?? '',
        productHandles: (patch.productHandles ?? []).filter((h) => alive.has(h)),
      } satisfies Collection;
    });

  return [...merged, ...created];
}

/** Hook único usado pela vitrine e pelo painel. */
export function useCatalog() {
  const { catalog, settings } = useAdmin();
  const pricing = settings.pricing ?? DEFAULT_SETTINGS.pricing;

  // Redesenha sozinho quando o catálogo da nuvem chega e substitui o do bundle.
  const base = useSyncExternalStore(assinarBase, catalogoBase, catalogoBase);

  return useMemo(() => {
    const products = resolveProducts(catalog, pricing, base.products);
    const collections = resolveCollections(catalog, products, base.collections);
    return {
      products,
      collections,
      productByHandle: new Map(products.map((p) => [p.handle, p])),
      collectionByHandle: new Map(collections.map((c) => [c.handle, c])),
    };
  }, [catalog, pricing, base]);
}
