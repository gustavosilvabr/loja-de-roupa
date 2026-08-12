import { describe, expect, it } from 'vitest';
import { products } from '../data/products';
import { collections } from '../data/collections';
import {
  baseVariant,
  findVariant,
  firstAvailableVariant,
  isAvailable,
  isBaseSide,
  relatedIn,
  searchIn,
} from '../lib/catalog';
import { brl, discountPercent, img, normalize, pix, slug } from '../lib/format';

describe('integridade do catálogo', () => {
  it('carrega os 205 produtos', () => {
    expect(products).toHaveLength(205);
  });

  it('tem as categorias principais da loja', () => {
    const existentes = new Set(collections.map((c) => c.handle));
    for (const esperada of ['brasileirao', 'internacional', 'selecoes', 'retro', 'infantil']) {
      expect(existentes).toContain(esperada);
    }
  });

  it('nenhuma categoria fica vazia', () => {
    const vazias = collections.filter((c) => c.productHandles.length === 0);
    expect(vazias.map((c) => c.handle)).toEqual([]);
  });

  it('a loja não vende patches — nenhum aparece em categoria', () => {
    const porHandle = new Map(products.map((p) => [p.handle, p]));
    const emCategoria = new Set(collections.flatMap((c) => c.productHandles));

    const patchesVisiveis = [...emCategoria]
      .map((h) => porHandle.get(h))
      .filter((p) => p?.type === 'Patch');

    expect(patchesVisiveis).toEqual([]);
    expect(collections.some((c) => c.handle === 'patches')).toBe(false);
  });

  it('não tem handle duplicado', () => {
    const handles = new Set(products.map((p) => p.handle));
    expect(handles.size).toBe(products.length);
  });

  it('todo produto tem imagem, título e ao menos uma variante', () => {
    const quebrados = products.filter(
      (p) => !p.image || !p.title.trim() || p.variants.length === 0
    );
    expect(quebrados.map((p) => p.handle)).toEqual([]);
  });

  it('nenhum produto tem preço negativo', () => {
    expect(products.filter((p) => p.price < 0)).toEqual([]);
  });

  it('toda coleção aponta só para produtos que existem', () => {
    const existentes = new Set(products.map((p) => p.handle));
    const orfaos: string[] = [];
    for (const c of collections) {
      for (const h of c.productHandles) if (!existentes.has(h)) orfaos.push(`${c.handle}/${h}`);
    }
    expect(orfaos).toEqual([]);
  });

  it('o preço do produto é o menor entre as variantes com preço', () => {
    const errados = products.filter((p) => {
      const precos = p.variants.filter((v) => v.price > 0).map((v) => v.price);
      return precos.length > 0 && p.price !== Math.min(...precos);
    });
    expect(errados.map((p) => p.handle)).toEqual([]);
  });
});

describe('regra de estoque da personalização', () => {
  const flamengo = products.find(
    (p) => p.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra'
  )!;

  it('encontra o produto usado como referência', () => {
    expect(flamengo).toBeDefined();
    expect(flamengo.variants.length).toBeGreaterThan(1);
  });

  it('trata "Não" e ausência de 2ª opção como variante-base', () => {
    expect(isBaseSide({ ...flamengo.variants[0], o2: 'Não' })).toBe(true);
    expect(isBaseSide({ ...flamengo.variants[0], o2: null })).toBe(true);
    expect(isBaseSide({ ...flamengo.variants[0], o2: 'Sim' })).toBe(false);
  });

  it('resolve a variante "Sim" para a gêmea "Não" do mesmo tamanho', () => {
    const sim = findVariant(flamengo, 'M', 'Sim')!;
    const base = baseVariant(flamengo, sim);
    expect(base.o1).toBe('M');
    expect(base.o2).toBe('Não');
  });

  it('bloqueia tamanho esgotado mesmo quando a variante "Sim" está disponível', () => {
    // É o bug real da loja: M/Não está esgotado, M/Sim consta disponível.
    const naoM = findVariant(flamengo, 'M', 'Não')!;
    const simM = findVariant(flamengo, 'M', 'Sim')!;

    expect(naoM.available).toBe(false);
    expect(simM.available).toBe(true);
    expect(isAvailable(flamengo, simM)).toBe(false);
  });

  it('mantém disponível o tamanho que tem estoque de verdade', () => {
    const simP = findVariant(flamengo, 'P', 'Sim')!;
    expect(isAvailable(flamengo, simP)).toBe(true);
  });

  it('a primeira variante sugerida é do lado base e está disponível', () => {
    const v = firstAvailableVariant(flamengo)!;
    expect(isBaseSide(v)).toBe(true);
    expect(v.available).toBe(true);
  });

  it('nenhum produto do catálogo é comprável só por marcar "Sim"', () => {
    const furos: string[] = [];
    for (const p of products) {
      for (const v of p.variants) {
        if (isBaseSide(v)) continue;
        if (v.available && !isAvailable(p, v)) {
          // Sem a regra, esta variante venderia estoque inexistente.
          furos.push(`${p.handle} ${v.title}`);
        }
      }
    }
    // A regra precisa cobrir todos: isAvailable é a única fonte de verdade.
    expect(furos.every((f) => typeof f === 'string')).toBe(true);
    expect(
      products.every((p) =>
        p.variants.every((v) => isBaseSide(v) || isAvailable(p, v) === baseVariant(p, v).available)
      )
    ).toBe(true);
  });
});

describe('busca', () => {
  it('ignora acento e maiúscula', () => {
    const comAcento = searchIn(products, 'retrô', 50);
    const semAcento = searchIn(products, 'RETRO', 50);
    expect(comAcento.length).toBeGreaterThan(0);
    expect(semAcento.map((p) => p.handle)).toEqual(comAcento.map((p) => p.handle));
  });

  it('devolve vazio para busca em branco', () => {
    expect(searchIn(products, '   ')).toEqual([]);
  });

  it('respeita o limite pedido', () => {
    expect(searchIn(products, 'camisa', 5)).toHaveLength(5);
  });
});

describe('relacionados', () => {
  const base = products.find((p) => p.type === 'Camisa' && p.available)!;

  it('não devolve o próprio produto', () => {
    const rel = relatedIn(products, base, 10);
    expect(rel.some((p) => p.handle === base.handle)).toBe(false);
  });

  it('devolve só produtos do mesmo tipo e disponíveis', () => {
    const rel = relatedIn(products, base, 10);
    expect(rel.every((p) => p.type === base.type && p.available)).toBe(true);
  });
});

describe('formatação', () => {
  it('formata moeda em real', () => {
    expect(brl(80).replace(/ /g, ' ')).toBe('R$ 80,00');
    expect(brl(1234.5).replace(/ /g, ' ')).toBe('R$ 1.234,50');
  });

  it('aplica o desconto do PIX', () => {
    expect(pix(100, 0.05)).toBe(95);
    expect(pix(80, 0.1)).toBe(72);
  });

  it('calcula o percentual de desconto', () => {
    expect(discountPercent(80, 229.9)).toBe(65);
    expect(discountPercent(80, null)).toBe(0);
    expect(discountPercent(80, 50)).toBe(0);
  });

  it('normaliza acentos', () => {
    expect(normalize('Camisa Retrô São Paulo')).toBe('camisa retro sao paulo');
  });

  it('gera slug a partir do título', () => {
    expect(slug('Seleções Europeias 26/27')).toBe('selecoes-europeias-26-27');
  });

  it('redimensiona imagem do CDN sem quebrar URL externa', () => {
    expect(img('https://cdn.shopify.com/x/foto.png', 600)).toContain('width=600');
    expect(img('https://exemplo.com/foto.png', 600)).toBe('https://exemplo.com/foto.png');
    expect(img('', 600)).toBe('');
  });
});
