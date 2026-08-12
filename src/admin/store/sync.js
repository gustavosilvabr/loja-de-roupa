 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { products as baseProducts } from '../../data/products';


/* ============================================================
   O "olheiro": consulta a loja de origem e compara com o
   catálogo local. A Shopify serve /products.json com
   access-control-allow-origin: *, então dá para consultar
   direto do navegador, sem servidor no meio.
   ============================================================ */














const PAGINAS_MAX = 6;
const POR_PAGINA = 250;

/** Menor preço entre as variantes — é o custo da peça para você. */
function custoDe(p) {
  const precos = p.variants
    .map((v) => parseFloat(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return precos.length ? Math.min(...precos) : 0;
}

export async function buscarOrigem(
  origem,
  signal
) {
  const base = origem.replace(/\/+$/, '');
  const todos = [];

  for (let pagina = 1; pagina <= PAGINAS_MAX; pagina++) {
    const res = await fetch(`${base}/products.json?limit=${POR_PAGINA}&page=${pagina}`, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`A loja de origem respondeu ${res.status}`);

    const dados = (await res.json()) ;
    const lote = _nullishCoalesce(dados.products, () => ( []));
    todos.push(...lote);
    if (lote.length < POR_PAGINA) break;
  }

  if (todos.length === 0) throw new Error('A origem não devolveu nenhum produto');
  return todos;
}

/**
 * Compara a origem com o que temos hoje e devolve só o que mudou.
 * `custosConhecidos` guarda o que foi visto na última checagem, para não
 * reavisar a mesma mudança toda vez.
 */
export function compararCatalogos(
  origem,
  overrides,
  custosConhecidos
) {
  const mudancas = [];
  const excluidos = new Set(overrides.deleted);

  const locais = new Map(baseProducts.map((p) => [p.handle, p]));
  const naOrigem = new Set();

  for (const p of origem) {
    naOrigem.add(p.handle);
    if (excluidos.has(p.handle)) continue;

    const custoNovo = custoDe(p);
    if (custoNovo <= 0) continue;

    const local = locais.get(p.handle);

    if (!local) {
      mudancas.push({
        handle: p.handle,
        titulo: p.title,
        imagem: _nullishCoalesce(_optionalChain([p, 'access', _ => _.images, 'optionalAccess', _2 => _2[0], 'optionalAccess', _3 => _3.src]), () => ( '')),
        tipo: 'novo',
        custoNovo,
      });
      continue;
    }

    // O custo de referência é o já aplicado no painel, senão o da base.
    const custoAtual = _nullishCoalesce(_optionalChain([overrides, 'access', _4 => _4.products, 'access', _5 => _5[p.handle], 'optionalAccess', _6 => _6.custo]), () => ( local.price));
    const jaAvisado = custosConhecidos[p.handle];

    if (Math.abs(custoNovo - custoAtual) > 0.009 && jaAvisado !== custoNovo) {
      mudancas.push({
        handle: p.handle,
        titulo: local.title,
        imagem: local.image,
        tipo: 'preco',
        custoAntigo: custoAtual,
        custoNovo,
      });
      continue;
    }

    const disponivelAgora = p.variants.some((v) => v.available);
    const disponivelAntes =
      _nullishCoalesce(_optionalChain([overrides, 'access', _7 => _7.products, 'access', _8 => _8[p.handle], 'optionalAccess', _9 => _9.available]), () => ( local.available));

    if (disponivelAgora !== disponivelAntes) {
      mudancas.push({
        handle: p.handle,
        titulo: local.title,
        imagem: local.image,
        tipo: 'estoque',
        disponivelAntes,
        disponivelAgora,
      });
    }
  }

  // Produtos que existiam e sumiram da origem
  for (const local of baseProducts) {
    if (naOrigem.has(local.handle) || excluidos.has(local.handle)) continue;
    mudancas.push({
      handle: local.handle,
      titulo: local.title,
      imagem: local.image,
      tipo: 'sumiu',
      custoAntigo: local.price,
    });
  }

  return mudancas;
}

/** Aplica no catálogo local as mudanças escolhidas. */
export function aplicarMudancas(
  overrides,
  mudancas,
  opcoes
) {
  const produtos = { ...overrides.products };
  const criados = [...overrides.created];

  for (const m of mudancas) {
    switch (m.tipo) {
      case 'preco':
        if (m.custoNovo !== undefined) {
          produtos[m.handle] = { ...produtos[m.handle], custo: m.custoNovo };
        }
        break;

      case 'estoque':
        produtos[m.handle] = { ...produtos[m.handle], available: m.disponivelAgora };
        break;

      case 'sumiu':
        // Não apaga: esconde da loja para você decidir depois.
        produtos[m.handle] = { ...produtos[m.handle], available: false };
        break;

      case 'novo':
        if (!opcoes.importarNovos) break;
        if (!criados.includes(m.handle)) criados.push(m.handle);
        produtos[m.handle] = {
          ...produtos[m.handle],
          title: m.titulo,
          custo: m.custoNovo,
          images: m.imagem ? [m.imagem] : [],
          available: true,
        };
        break;
    }
  }

  return { ...overrides, products: produtos, created: criados };
}

/** Registra os custos vistos, para não repetir o mesmo aviso. */
export function registrarCustos(
  conhecidos,
  mudancas
) {
  const out = { ...conhecidos };
  for (const m of mudancas) {
    if (m.custoNovo !== undefined) out[m.handle] = m.custoNovo;
  }
  return out;
}

export const RESUMO_TIPO = {
  novo: 'Produto novo',
  preco: 'Preço mudou',
  estoque: 'Estoque mudou',
  sumiu: 'Saiu do catálogo',
};

export function precisaVerificar(
  sync,
  ultimaVerificacao
) {
  if (!sync.ativo) return false;
  if (!ultimaVerificacao) return true;
  return Date.now() - ultimaVerificacao >= sync.intervaloMinutos * 60000;
}
