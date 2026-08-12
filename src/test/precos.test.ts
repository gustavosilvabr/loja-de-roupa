import { describe, expect, it } from 'vitest';
import {
  FAIXAS_PADRAO,
  aplicarMarkup,
  calcularLucro,
  classificar,
  markupNecessario,
  precoParaMargem,
  veredito,
} from '../lib/precos';
import { compararCatalogos, registrarCustos, aplicarMudancas } from '../admin/store/sync';
import { resolveProducts } from '../admin/store/useResolvedCatalog';
import { DEFAULT_SETTINGS } from '../admin/defaults';
import type { CatalogOverrides } from '../admin/types';

const CATALOGO_VAZIO: CatalogOverrides = {
  products: {},
  created: [],
  deleted: [],
  categories: {},
  categoriesCreated: [],
  categoriesDeleted: [],
};

const SEM_CUSTOS_EXTRA = {
  fretePago: 0,
  taxaGateway: 0,
  taxaFixa: 0,
  imposto: 0,
  outrosCustos: 0,
};

describe('markup', () => {
  it('125% faz 80 virar 180 — o exemplo do lojista', () => {
    expect(aplicarMarkup(80, 125)).toBe(180);
  });

  it('100% é literalmente "o dobro"', () => {
    expect(aplicarMarkup(80, 100)).toBe(160);
  });

  it('0% mantém o custo', () => {
    expect(aplicarMarkup(80, 0)).toBe(80);
  });

  it('calcula o markup necessário para um preço alvo', () => {
    expect(markupNecessario(80, 180)).toBe(125);
    expect(markupNecessario(80, 160)).toBe(100);
    expect(markupNecessario(0, 180)).toBe(0);
  });
});

describe('lucro por peça', () => {
  it('sem taxas, a sobra é preço menos custo', () => {
    const r = calcularLucro({ custo: 80, precoVenda: 180, ...SEM_CUSTOS_EXTRA });
    expect(r.lucro).toBe(100);
    expect(r.margem).toBeCloseTo(55.6, 1);
    expect(r.nivel).toBe('bom');
  });

  it('desconta a taxa do gateway sobre o preço de venda', () => {
    const r = calcularLucro({
      custo: 80,
      precoVenda: 180,
      fretePago: 0,
      taxaGateway: 4.99,
      taxaFixa: 0,
      imposto: 0,
      outrosCustos: 0,
    });
    // 180 * 4,99% = 8,98
    expect(r.taxas).toBeCloseTo(8.98, 2);
    expect(r.lucro).toBeCloseTo(91.02, 2);
  });

  it('desconta o frete só quando a loja o absorve', () => {
    const comFrete = calcularLucro({
      custo: 80,
      precoVenda: 180,
      ...SEM_CUSTOS_EXTRA,
      fretePago: 25,
    });
    const semFrete = calcularLucro({ custo: 80, precoVenda: 180, ...SEM_CUSTOS_EXTRA });
    expect(semFrete.lucro - comFrete.lucro).toBe(25);
  });

  it('soma todos os custos com os padrões da loja', () => {
    const p = DEFAULT_SETTINGS.pricing;
    const r = calcularLucro({
      custo: 80,
      precoVenda: 180,
      fretePago: 0,
      taxaGateway: p.taxaGateway,
      taxaFixa: p.taxaFixa,
      imposto: p.imposto,
      outrosCustos: p.outrosCustos,
    });
    // 180 − 80 − 8,98 − 2 = 89,02
    expect(r.lucro).toBeCloseTo(89.02, 2);
    expect(r.nivel).toBe('bom');
  });

  it('acusa prejuízo quando o preço não cobre os custos', () => {
    const r = calcularLucro({
      custo: 80,
      precoVenda: 85,
      fretePago: 25,
      taxaGateway: 4.99,
      taxaFixa: 0,
      imposto: 0,
      outrosCustos: 2,
    });
    expect(r.lucro).toBeLessThan(0);
    expect(r.nivel).toBe('prejuizo');
    expect(veredito(r)).toMatch(/não venda/i);
  });

  it('não quebra com custo zero', () => {
    const r = calcularLucro({ custo: 0, precoVenda: 0, ...SEM_CUSTOS_EXTRA });
    expect(r.lucro).toBe(0);
    expect(r.margem).toBe(0);
    expect(r.markup).toBe(0);
  });
});

describe('classificação por cor', () => {
  it('usa as faixas configuradas', () => {
    expect(classificar(50, FAIXAS_PADRAO)).toBe('bom');
    expect(classificar(40, FAIXAS_PADRAO)).toBe('bom');
    expect(classificar(30, FAIXAS_PADRAO)).toBe('moderado');
    expect(classificar(20, FAIXAS_PADRAO)).toBe('moderado');
    expect(classificar(10, FAIXAS_PADRAO)).toBe('baixo');
    expect(classificar(-5, FAIXAS_PADRAO)).toBe('prejuizo');
  });

  it('respeita faixas personalizadas', () => {
    const exigente = { boa: 60, moderada: 45 };
    expect(classificar(50, exigente)).toBe('moderado');
    expect(classificar(65, exigente)).toBe('bom');
  });
});

describe('preço mínimo para uma margem alvo', () => {
  it('o preço calculado atinge exatamente a margem pedida', () => {
    const base = {
      custo: 80,
      fretePago: 0,
      taxaGateway: 4.99,
      taxaFixa: 0,
      imposto: 0,
      outrosCustos: 2,
    };
    const preco = precoParaMargem(base, 40);
    const r = calcularLucro({ ...base, precoVenda: preco });
    expect(r.margem).toBeCloseTo(40, 0);
  });

  it('devolve Infinity quando as taxas inviabilizam a margem', () => {
    const preco = precoParaMargem(
      { custo: 80, fretePago: 0, taxaGateway: 70, taxaFixa: 0, imposto: 40, outrosCustos: 0 },
      30
    );
    expect(preco).toBe(Infinity);
  });
});

describe('markup aplicado ao catálogo real', () => {
  const pricing = DEFAULT_SETTINGS.pricing;

  it('o preço de venda é o custo com markup', () => {
    const produtos = resolveProducts(CATALOGO_VAZIO, pricing);
    const flamengo = produtos.find(
      (p) => p.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra'
    )!;

    expect(flamengo.custo).toBe(80);
    expect(flamengo.price).toBe(180);
  });

  it('markup por produto sobrepõe o markup da loja', () => {
    const produtos = resolveProducts(
      {
        ...CATALOGO_VAZIO,
        products: { 'camisa-flamengo-i-26-27-torcedor-rubro-negra': { markup: 100 } },
      },
      pricing
    );
    const flamengo = produtos.find(
      (p) => p.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra'
    )!;

    expect(flamengo.price).toBe(160);
  });

  it('preço fixo ignora o markup por completo', () => {
    const produtos = resolveProducts(
      {
        ...CATALOGO_VAZIO,
        products: {
          'camisa-flamengo-i-26-27-torcedor-rubro-negra': { markup: 100, price: 199.9 },
        },
      },
      pricing
    );
    const flamengo = produtos.find(
      (p) => p.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra'
    )!;

    expect(flamengo.price).toBe(199.9);
  });

  it('custo atualizado pelo olheiro recalcula o preço sozinho', () => {
    const produtos = resolveProducts(
      {
        ...CATALOGO_VAZIO,
        products: { 'camisa-flamengo-i-26-27-torcedor-rubro-negra': { custo: 100 } },
      },
      pricing
    );
    const flamengo = produtos.find(
      (p) => p.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra'
    )!;

    // custo subiu de 80 para 100 → venda vai de 180 para 225, margem preservada
    expect(flamengo.custo).toBe(100);
    expect(flamengo.price).toBe(225);
  });

  it('arredondamento faz o preço terminar no valor escolhido', () => {
    const produtos = resolveProducts(CATALOGO_VAZIO, {
      ...pricing,
      markupPadrao: 118,
      arredondarPara: 0.9,
    });
    const flamengo = produtos.find(
      (p) => p.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra'
    )!;

    // 80 * 2,18 = 174,40 → arredonda para 174,90
    expect(flamengo.price).toBe(174.9);
  });

  it('todo produto do catálogo tem venda maior que o custo', () => {
    const produtos = resolveProducts(CATALOGO_VAZIO, pricing);
    const invertidos = produtos.filter((p) => (p.custo ?? 0) > 0 && p.price <= (p.custo ?? 0));
    expect(invertidos.map((p) => p.handle)).toEqual([]);
  });
});

describe('olheiro do catálogo', () => {
  const origem = [
    {
      handle: 'camisa-flamengo-i-26-27-torcedor-rubro-negra',
      title: 'Camisa Flamengo I 26/27',
      product_type: 'Camisa',
      variants: [{ price: '95.00', available: true }],
      images: [{ src: 'foto.png' }],
    },
    {
      handle: 'produto-totalmente-novo',
      title: 'Camisa Nova 27/28',
      product_type: 'Camisa',
      variants: [{ price: '90.00', available: true }],
      images: [{ src: 'nova.png' }],
    },
  ];

  it('detecta produto novo e mudança de preço', () => {
    const mudancas = compararCatalogos(origem, CATALOGO_VAZIO, {});

    const novo = mudancas.find((m) => m.handle === 'produto-totalmente-novo');
    expect(novo?.tipo).toBe('novo');
    expect(novo?.custoNovo).toBe(90);

    const preco = mudancas.find(
      (m) => m.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra' && m.tipo === 'preco'
    );
    expect(preco?.custoAntigo).toBe(80);
    expect(preco?.custoNovo).toBe(95);
  });

  it('marca como "sumiu" quem saiu da origem', () => {
    const mudancas = compararCatalogos(origem, CATALOGO_VAZIO, {});
    const sumidos = mudancas.filter((m) => m.tipo === 'sumiu');
    expect(sumidos.length).toBeGreaterThan(100);
  });

  it('não repete o mesmo aviso de preço duas vezes', () => {
    const primeira = compararCatalogos(origem, CATALOGO_VAZIO, {});
    const conhecidos = registrarCustos({}, primeira);
    const segunda = compararCatalogos(origem, CATALOGO_VAZIO, conhecidos);

    const repetido = segunda.find(
      (m) => m.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra' && m.tipo === 'preco'
    );
    expect(repetido).toBeUndefined();
  });

  it('aplicar mudança de preço grava o novo custo e preserva a margem', () => {
    const mudancas = compararCatalogos(origem, CATALOGO_VAZIO, {}).filter(
      (m) => m.tipo === 'preco'
    );
    const novoCatalogo = aplicarMudancas(CATALOGO_VAZIO, mudancas, { importarNovos: false });

    expect(
      novoCatalogo.products['camisa-flamengo-i-26-27-torcedor-rubro-negra'].custo
    ).toBe(95);

    const produtos = resolveProducts(novoCatalogo, DEFAULT_SETTINGS.pricing);
    const flamengo = produtos.find(
      (p) => p.handle === 'camisa-flamengo-i-26-27-torcedor-rubro-negra'
    )!;
    expect(flamengo.price).toBe(213.75); // 95 * 2,25
  });

  it('produto que sumiu é ocultado, nunca apagado', () => {
    const mudancas = compararCatalogos(origem, CATALOGO_VAZIO, {}).filter(
      (m) => m.tipo === 'sumiu'
    );
    const novo = aplicarMudancas(CATALOGO_VAZIO, mudancas, { importarNovos: false });

    expect(novo.deleted).toEqual([]);
    expect(novo.products[mudancas[0].handle].available).toBe(false);
  });

  it('só importa produto novo quando autorizado', () => {
    const novos = compararCatalogos(origem, CATALOGO_VAZIO, {}).filter((m) => m.tipo === 'novo');

    const sem = aplicarMudancas(CATALOGO_VAZIO, novos, { importarNovos: false });
    expect(sem.created).toEqual([]);

    const com = aplicarMudancas(CATALOGO_VAZIO, novos, { importarNovos: true });
    expect(com.created).toContain('produto-totalmente-novo');
    expect(com.products['produto-totalmente-novo'].custo).toBe(90);
  });
});
