 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useMemo } from 'react';
import { products as baseProducts } from '../../data/products';
import { collections as baseCollections } from '../../data/collections';
import { aplicarMarkup } from '../../lib/precos';
import { DEFAULT_SETTINGS } from '../defaults';
import { useAdmin } from './AdminProvider';



/**
 * IMPORTANTE: em `data/products.ts` o campo `price` é o preço do FORNECEDOR,
 * ou seja, o seu custo. O preço que o cliente vê é calculado aqui aplicando o
 * markup. Assim, quando o olheiro trouxer um custo novo, o preço de venda se
 * ajusta sozinho e sua margem não é comida sem você perceber.
 */

/** Arredonda para o "final" configurado (ex.: 0,90) sem baixar o preço. */
function arredondar(valor, terminaEm) {
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
  custo,
  pricing,
  markupProduto,
  precoFixo
) {
  if (precoFixo !== undefined && precoFixo > 0) return Math.round(precoFixo * 100) / 100;
  if (custo <= 0) return 0;
  const markup = _nullishCoalesce(markupProduto, () => ( pricing.markupPadrao));
  return arredondar(aplicarMarkup(custo, markup), pricing.arredondarPara);
}

export function resolveProducts(
  overrides,
  pricing
) {
  const deleted = new Set(overrides.deleted);

  const merged = baseProducts
    .filter((p) => !deleted.has(p.handle))
    .map((p) => applyPatch(p, overrides, pricing));

  const created = overrides.created
    .filter((h) => !deleted.has(h))
    .map((handle) => criarProduto(handle, overrides, pricing));

  return [...created, ...merged].filter((p) => !_optionalChain([overrides, 'access', _ => _.products, 'access', _2 => _2[p.handle], 'optionalAccess', _3 => _3.hidden]));
}

function criarProduto(
  handle,
  overrides,
  pricing
) {
  const patch = _nullishCoalesce(overrides.products[handle], () => ( {}));
  const custo = _nullishCoalesce(patch.custo, () => ( 0));
  const venda = precoDeVenda(custo, pricing, patch.markup, patch.price);

  return {
    id: handle,
    handle,
    title: _nullishCoalesce(patch.title, () => ( 'Novo produto')),
    type: _nullishCoalesce(patch.type, () => ( 'Camisa')),
    vendor: 'XING SUN',
    tags: _nullishCoalesce(patch.tags, () => ( [])),
    options: [],
    variants: [
      {
        id: `${handle}-v1`,
        title: 'Padrão',
        o1: null,
        o2: null,
        price: venda,
        custo,
        compareAt: _nullishCoalesce(patch.compareAt, () => ( null)),
        available: _nullishCoalesce(patch.available, () => ( true)),
      },
    ],
    images: _nullishCoalesce(patch.images, () => ( [])),
    image: _nullishCoalesce(_optionalChain([patch, 'access', _4 => _4.images, 'optionalAccess', _5 => _5[0]]), () => ( '')),
    price: venda,
    custo,
    compareAt: _nullishCoalesce(patch.compareAt, () => ( null)),
    available: _nullishCoalesce(patch.available, () => ( true)),
    descriptionHtml: _nullishCoalesce(patch.descriptionHtml, () => ( '')),
    nota: patch.nota,
    avaliacoes: patch.avaliacoes,
    selo: patch.selo,
    comentarios: patch.comentarios,
  };
}

function applyPatch(
  product,
  overrides,
  pricing
) {
  const patch = overrides.products[product.handle];
  const images = _nullishCoalesce(_optionalChain([patch, 'optionalAccess', _6 => _6.images]), () => ( product.images));

  const variants = product.variants.map((v) => {
    const vo = _optionalChain([patch, 'optionalAccess', _7 => _7.variantOverrides, 'optionalAccess', _8 => _8[v.id]]);

    // O custo vem do fornecedor; só um override explícito o substitui.
    const custo = _nullishCoalesce(_optionalChain([patch, 'optionalAccess', _9 => _9.custo]), () => ( v.price));
    const precoFixo = _nullishCoalesce(_optionalChain([vo, 'optionalAccess', _10 => _10.price]), () => ( _optionalChain([patch, 'optionalAccess', _11 => _11.price])));
    const venda = precoDeVenda(custo, pricing, _optionalChain([patch, 'optionalAccess', _12 => _12.markup]), precoFixo);

    return {
      ...v,
      custo,
      price: venda,
      available: _nullishCoalesce(_nullishCoalesce(_optionalChain([vo, 'optionalAccess', _13 => _13.available]), () => ( _optionalChain([patch, 'optionalAccess', _14 => _14.available]))), () => ( v.available)),
      compareAt: _optionalChain([patch, 'optionalAccess', _15 => _15.compareAt]) !== undefined ? patch.compareAt : v.compareAt,
    };
  });

  const vendas = variants.filter((v) => v.price > 0).map((v) => v.price);
  const custos = variants.filter((v) => (_nullishCoalesce(v.custo, () => ( 0))) > 0).map((v) => _nullishCoalesce(v.custo, () => ( 0)));

  return {
    ...product,
    title: _nullishCoalesce(_optionalChain([patch, 'optionalAccess', _16 => _16.title]), () => ( product.title)),
    type: _nullishCoalesce(_optionalChain([patch, 'optionalAccess', _17 => _17.type]), () => ( product.type)),
    tags: _nullishCoalesce(_optionalChain([patch, 'optionalAccess', _18 => _18.tags]), () => ( product.tags)),
    descriptionHtml: _nullishCoalesce(_optionalChain([patch, 'optionalAccess', _19 => _19.descriptionHtml]), () => ( product.descriptionHtml)),
    images,
    image: _nullishCoalesce(images[0], () => ( product.image)),
    variants,
    price: vendas.length ? Math.min(...vendas) : 0,
    custo: custos.length ? Math.min(...custos) : 0,
    compareAt: _optionalChain([patch, 'optionalAccess', _20 => _20.compareAt]) !== undefined ? patch.compareAt : product.compareAt,
    available: variants.some((v) => v.available),
    nota: _optionalChain([patch, 'optionalAccess', _21 => _21.nota]),
    avaliacoes: _optionalChain([patch, 'optionalAccess', _22 => _22.avaliacoes]),
    selo: _optionalChain([patch, 'optionalAccess', _23 => _23.selo]),
    comentarios: _optionalChain([patch, 'optionalAccess', _24 => _24.comentarios]),
  };
}

export function resolveCollections(
  overrides,
  products
) {
  const alive = new Set(products.map((p) => p.handle));
  const deleted = new Set(overrides.categoriesDeleted);

  const merged = baseCollections
    .filter((c) => !deleted.has(c.handle))
    .map((c) => {
      const patch = overrides.categories[c.handle];
      const handles = (_nullishCoalesce(_optionalChain([patch, 'optionalAccess', _25 => _25.productHandles]), () => ( c.productHandles))).filter((h) => alive.has(h));
      return {
        ...c,
        title: _nullishCoalesce(_optionalChain([patch, 'optionalAccess', _26 => _26.title]), () => ( c.title)),
        subtitle: _nullishCoalesce(_optionalChain([patch, 'optionalAccess', _27 => _27.subtitle]), () => ( c.subtitle)),
        productHandles: handles,
      };
    })
    .filter((c) => !_optionalChain([overrides, 'access', _28 => _28.categories, 'access', _29 => _29[c.handle], 'optionalAccess', _30 => _30.hidden]));

  const created = overrides.categoriesCreated
    .filter((h) => !deleted.has(h))
    .map((handle) => {
      const patch = _nullishCoalesce(overrides.categories[handle], () => ( {}));
      return {
        handle,
        title: _nullishCoalesce(patch.title, () => ( 'Nova categoria')),
        subtitle: _nullishCoalesce(patch.subtitle, () => ( '')),
        productHandles: (_nullishCoalesce(patch.productHandles, () => ( []))).filter((h) => alive.has(h)),
      } ;
    });

  return [...merged, ...created];
}

/** Hook único usado pela vitrine e pelo painel. */
export function useCatalog() {
  const { catalog, settings } = useAdmin();
  const pricing = _nullishCoalesce(settings.pricing, () => ( DEFAULT_SETTINGS.pricing));

  return useMemo(() => {
    const products = resolveProducts(catalog, pricing);
    const collections = resolveCollections(catalog, products);
    return {
      products,
      collections,
      productByHandle: new Map(products.map((p) => [p.handle, p])),
      collectionByHandle: new Map(collections.map((c) => [c.handle, c])),
    };
  }, [catalog, pricing]);
}
