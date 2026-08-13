import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogoBase, definirBase, restaurarBase } from '../admin/store/baseCatalog';
import { resolveCollections, resolveProducts } from '../admin/store/useResolvedCatalog';
import { compararCatalogos, enviarMudancasParaNuvem } from '../admin/store/sync';
import { migrar } from '../admin/store/migrations';
import { DEFAULT_SETTINGS } from '../admin/defaults';
import { products as assados } from '../data/products';
import type { CatalogOverrides, MudancaSync, StoreSettings } from '../admin/types';
import type { Product } from '../types';

vi.mock('../admin/store/nuvem', () => ({
  salvarProduto: vi.fn(async () => true),
  atualizarCustoNaNuvem: vi.fn(async () => true),
}));

const { salvarProduto, atualizarCustoNaNuvem } = await import('../admin/store/nuvem');

const VAZIO: CatalogOverrides = {
  products: {},
  created: [],
  deleted: [],
  categories: {},
  categoriesCreated: [],
  categoriesDeleted: [],
};

const PRECOS = DEFAULT_SETTINGS.pricing;

const produtoFake = (handle: string, custo = 100): Product => ({
  id: handle,
  handle,
  title: `Camisa ${handle}`,
  type: 'Camisa',
  vendor: 'GP ESPORTES',
  tags: [],
  options: [],
  variants: [
    { id: `${handle}-v1`, title: 'P', o1: 'P', o2: null, price: custo, compareAt: null, available: true },
  ],
  images: ['https://cdn.exemplo.com/foto.png'],
  image: 'https://cdn.exemplo.com/foto.png',
  price: custo,
  custo,
  compareAt: null,
  available: true,
  descriptionHtml: '',
});

afterEach(() => {
  restaurarBase();
  vi.clearAllMocks();
});

describe('de onde sai o catálogo', () => {
  it('sem nuvem, a loja usa o catálogo que veio dentro do site', () => {
    expect(catalogoBase().daNuvem).toBe(false);
    expect(catalogoBase().products).toHaveLength(assados.length);
  });

  it('quando a nuvem responde, ela passa a mandar', () => {
    definirBase([produtoFake('camisa-da-nuvem')], null);

    expect(catalogoBase().daNuvem).toBe(true);
    expect(resolveProducts(VAZIO, PRECOS).map((p) => p.handle)).toEqual(['camisa-da-nuvem']);
  });

  it('nuvem vazia não apaga a loja', () => {
    // Tabela ainda não semeada: melhor mostrar o catálogo do site do que nada.
    definirBase([], []);

    expect(catalogoBase().daNuvem).toBe(false);
    expect(resolveProducts(VAZIO, PRECOS).length).toBeGreaterThan(0);
  });

  it('nuvem fora do ar (null) não apaga a loja', () => {
    definirBase(null, null);
    expect(resolveProducts(VAZIO, PRECOS).length).toBeGreaterThan(0);
  });

  it('produtos sem categorias na nuvem mantêm as categorias do site', () => {
    definirBase([produtoFake('camisa-da-nuvem')], null);
    expect(catalogoBase().collections.length).toBeGreaterThan(0);
  });

  it('o preço de venda continua saindo do markup, não do custo cru', () => {
    definirBase([produtoFake('camisa-da-nuvem', 80)], null);

    const [p] = resolveProducts(VAZIO, PRECOS);
    expect(p.custo).toBe(80);
    expect(p.price).toBeGreaterThan(80);
  });

  it('assina mudanças da base para a vitrine redesenhar', () => {
    const colecoes = resolveCollections(VAZIO, resolveProducts(VAZIO, PRECOS));
    expect(colecoes.length).toBeGreaterThan(0);
  });
});

describe('produto do olheiro não aparece duas vezes', () => {
  it('o esboço local some quando o produto entra na base da nuvem', () => {
    const overrides: CatalogOverrides = {
      ...VAZIO,
      created: ['camisa-nova'],
      products: { 'camisa-nova': { title: 'Camisa Nova', custo: 90 } },
    };

    // Antes de subir: só existe o esboço criado localmente.
    expect(resolveProducts(overrides, PRECOS).filter((p) => p.handle === 'camisa-nova')).toHaveLength(1);

    // Depois de subir: a versão da nuvem é a única, e é a completa.
    definirBase([produtoFake('camisa-nova', 90)], null);
    const depois = resolveProducts(overrides, PRECOS).filter((p) => p.handle === 'camisa-nova');

    expect(depois).toHaveLength(1);
    expect(depois[0].variants.length).toBe(1);
  });
});

describe('o olheiro grava na nuvem', () => {
  const novo: MudancaSync = {
    handle: 'camisa-nova',
    titulo: 'Camisa Nova',
    imagem: '',
    tipo: 'novo',
    custoNovo: 90,
    produto: produtoFake('camisa-nova', 90),
  };

  it('produto novo vai inteiro para o Supabase', async () => {
    const r = await enviarMudancasParaNuvem([novo], { importarNovos: true });

    expect(r.novos).toBe(1);
    expect(salvarProduto).toHaveBeenCalledWith(novo.produto);
  });

  it('não importa produto novo quando a opção está desligada', async () => {
    const r = await enviarMudancasParaNuvem([novo], { importarNovos: false });

    expect(r.novos).toBe(0);
    expect(salvarProduto).not.toHaveBeenCalled();
  });

  it('mudança de preço atualiza o custo, não o preço de venda', async () => {
    await enviarMudancasParaNuvem(
      [{ handle: 'camisa-x', titulo: 'X', imagem: '', tipo: 'preco', custoNovo: 95 }],
      { importarNovos: true }
    );

    expect(atualizarCustoNaNuvem).toHaveBeenCalledWith('camisa-x', { custo: 95 });
  });

  it('produto que sumiu da origem é escondido, nunca apagado', async () => {
    await enviarMudancasParaNuvem(
      [{ handle: 'camisa-y', titulo: 'Y', imagem: '', tipo: 'sumiu' }],
      { importarNovos: true }
    );

    expect(atualizarCustoNaNuvem).toHaveBeenCalledWith('camisa-y', { disponivel: false });
  });

  it('falha na nuvem é contada, não estourada', async () => {
    vi.mocked(salvarProduto).mockResolvedValueOnce(false);

    const r = await enviarMudancasParaNuvem([novo], { importarNovos: true });
    expect(r.falhas).toBe(1);
  });
});

describe('o olheiro compara com o catálogo que está no ar', () => {
  const daOrigem = (handle: string, preco: string) => ({
    handle,
    title: `Camisa ${handle}`,
    product_type: 'Camisa',
    variants: [{ price: preco, available: true }],
    images: [{ src: 'https://cdn.exemplo.com/f.png' }],
  });

  it('produto já importado para a nuvem não volta como "novo"', () => {
    definirBase([produtoFake('camisa-ja-importada', 100)], null);

    const mudancas = compararCatalogos([daOrigem('camisa-ja-importada', '100.00')], VAZIO, {});
    expect(mudancas.filter((m) => m.tipo === 'novo')).toEqual([]);
  });

  it('produto de verdade novo traz o produto inteiro para gravar', () => {
    definirBase([produtoFake('camisa-antiga', 100)], null);

    const mudancas = compararCatalogos(
      [daOrigem('camisa-antiga', '100.00'), daOrigem('camisa-inedita', '120.00')],
      VAZIO,
      {}
    );

    const novo = mudancas.find((m) => m.tipo === 'novo');
    expect(novo?.handle).toBe('camisa-inedita');
    expect(novo?.produto?.variants.length).toBe(1);
    expect(novo?.produto?.custo).toBe(120);
  });
});

describe('migração v4 — links de banner e menu', () => {
  const migrarDe = (versaoSalva: number, s: StoreSettings) => {
    localStorage.setItem('xingsun:schemaVersion', JSON.stringify(versaoSalva));
    return migrar(s);
  };

  it('conserta o banner "Internacionais" que caía na lista misturada', () => {
    const salvo: StoreSettings = {
      ...DEFAULT_SETTINGS,
      featureBanners: DEFAULT_SETTINGS.featureBanners.map((b) =>
        b.id === 'fb3' ? { ...b, to: '/colecoes/produtos-mais-vendidos' } : b
      ),
    };

    const depois = migrarDe(3, salvo);
    expect(depois.featureBanners.find((b) => b.id === 'fb3')?.to).toBe('/colecoes/internacional');
  });

  it('não mexe em link que o lojista escolheu de propósito', () => {
    const salvo: StoreSettings = {
      ...DEFAULT_SETTINGS,
      featureBanners: DEFAULT_SETTINGS.featureBanners.map((b) =>
        b.id === 'fb3' ? { ...b, to: '/colecoes/flamengo' } : b
      ),
    };

    const depois = migrarDe(3, salvo);
    expect(depois.featureBanners.find((b) => b.id === 'fb3')?.to).toBe('/colecoes/flamengo');
  });

  it('quem já está na versão atual passa sem alteração', () => {
    const salvo: StoreSettings = {
      ...DEFAULT_SETTINGS,
      featureBanners: DEFAULT_SETTINGS.featureBanners.map((b) =>
        b.id === 'fb3' ? { ...b, to: '/colecoes/produtos-mais-vendidos' } : b
      ),
    };

    const depois = migrarDe(4, salvo);
    expect(depois.featureBanners.find((b) => b.id === 'fb3')?.to).toBe(
      '/colecoes/produtos-mais-vendidos'
    );
  });
});
