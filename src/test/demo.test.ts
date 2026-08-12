import { describe, expect, it } from 'vitest';
import { aplicarDemo, contarDemo, removerDemo } from '../admin/store/avaliacoesDemo';
import type { CatalogOverrides } from '../admin/types';

const VAZIO: CatalogOverrides = {
  products: {},
  created: [],
  deleted: [],
  categories: {},
  categoriesCreated: [],
  categoriesDeleted: [],
};

const HANDLES = ['camisa-a', 'camisa-b', 'camisa-c'];

describe('avaliações de demonstração', () => {
  it('preenche nota, contagem e comentários', () => {
    const c = aplicarDemo(VAZIO, HANDLES);

    for (const h of HANDLES) {
      const p = c.products[h];
      expect(p.nota).toBeGreaterThanOrEqual(4);
      expect(p.nota).toBeLessThanOrEqual(5);
      expect(p.avaliacoes).toBeGreaterThan(0);
      expect(p.comentarios?.length).toBe(p.avaliacoes);
    }
  });

  it('marca toda avaliação gerada como demonstração', () => {
    const c = aplicarDemo(VAZIO, HANDLES);
    const todas = Object.values(c.products).flatMap((p) => p.comentarios ?? []);

    expect(todas.length).toBeGreaterThan(0);
    expect(todas.every((a) => a.demo === true)).toBe(true);
  });

  it('a nota é a média dos comentários, não um número solto', () => {
    const c = aplicarDemo(VAZIO, HANDLES);

    for (const h of HANDLES) {
      const p = c.products[h];
      const media = p.comentarios!.reduce((s, a) => s + a.nota, 0) / p.comentarios!.length;
      expect(p.nota).toBeCloseTo(media, 1);
    }
  });

  it('o mesmo produto recebe sempre a mesma amostra', () => {
    const a = aplicarDemo(VAZIO, HANDLES);
    const b = aplicarDemo(VAZIO, HANDLES);

    expect(a.products['camisa-a'].nota).toBe(b.products['camisa-a'].nota);
    expect(a.products['camisa-a'].avaliacoes).toBe(b.products['camisa-a'].avaliacoes);
  });

  it('conta quantos produtos estão com demonstração ativa', () => {
    expect(contarDemo(VAZIO)).toBe(0);
    expect(contarDemo(aplicarDemo(VAZIO, HANDLES))).toBe(3);
  });
});

describe('remoção da demonstração', () => {
  it('limpa nota, contagem e comentários', () => {
    const comDemo = aplicarDemo(VAZIO, HANDLES);
    const limpo = removerDemo(comDemo);

    expect(contarDemo(limpo)).toBe(0);
    for (const h of HANDLES) {
      expect(limpo.products[h]?.nota).toBeUndefined();
      expect(limpo.products[h]?.avaliacoes).toBeUndefined();
    }
  });

  it('preserva o resto do produto ao limpar', () => {
    const base: CatalogOverrides = {
      ...VAZIO,
      products: { 'camisa-a': { title: 'Título editado', markup: 150 } },
    };

    const limpo = removerDemo(aplicarDemo(base, ['camisa-a']));

    expect(limpo.products['camisa-a'].title).toBe('Título editado');
    expect(limpo.products['camisa-a'].markup).toBe(150);
    expect(limpo.products['camisa-a'].nota).toBeUndefined();
  });

  it('NÃO apaga avaliação de cliente real', () => {
    const comReal: CatalogOverrides = {
      ...VAZIO,
      products: {
        'camisa-a': {
          nota: 5,
          avaliacoes: 1,
          comentarios: [
            {
              id: 'r1',
              nome: 'Maria',
              cidade: 'Recife',
              uf: 'PE',
              nota: 5,
              texto: 'Chegou certinho.',
              data: new Date().toISOString(),
            },
          ],
        },
      },
    };

    const limpo = removerDemo(aplicarDemo(comReal, ['camisa-a']));

    expect(limpo.products['camisa-a'].comentarios).toHaveLength(1);
    expect(limpo.products['camisa-a'].comentarios![0].nome).toBe('Maria');
    expect(limpo.products['camisa-a'].nota).toBe(5);
  });

  it('gerar demonstração não sobrescreve avaliação real existente', () => {
    const comReal: CatalogOverrides = {
      ...VAZIO,
      products: {
        'camisa-a': {
          nota: 3,
          avaliacoes: 1,
          comentarios: [
            {
              id: 'r1',
              nome: 'João',
              cidade: 'Goiânia',
              uf: 'GO',
              nota: 3,
              texto: 'Demorou a chegar.',
              data: new Date().toISOString(),
            },
          ],
        },
      },
    };

    const depois = aplicarDemo(comReal, ['camisa-a']);

    // A crítica verdadeira do cliente continua lá e a nota não foi inflada.
    expect(depois.products['camisa-a'].nota).toBe(3);
    expect(depois.products['camisa-a'].comentarios).toHaveLength(1);
  });
});
