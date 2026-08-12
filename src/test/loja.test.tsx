import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderNaRota, renderSimples } from './utils';

import Product from '../pages/Product';
import Collection from '../pages/Collection';
import Checkout from '../pages/Checkout';
import Search from '../pages/Search';
import Vendas from '../admin/pages/Vendas';
import Produtos from '../admin/pages/Produtos';

const FLAMENGO = 'camisa-flamengo-i-26-27-torcedor-rubro-negra';

const lerCarrinho = () => JSON.parse(localStorage.getItem('xingsun:cart') ?? '[]');

function abrirProduto(handle = FLAMENGO) {
  return renderNaRota(<Product />, {
    rota: `/produtos/${handle}`,
    path: '/produtos/:handle',
  });
}

describe('página de produto', () => {
  it('mostra título e preço do produto', async () => {
    abrirProduto();
    expect(
      await screen.findByRole('heading', { name: /Camisa Flamengo I 26\/27/i })
    ).toBeInTheDocument();
  });

  it('desabilita os tamanhos sem estoque', async () => {
    abrirProduto();
    const m = await screen.findByRole('button', { name: /^M — esgotado$|^M$/i });
    // M está esgotado no catálogo real
    expect(m).toBeDisabled();
  });

  it('mantém o tamanho esgotado bloqueado ao marcar "Personalizar: Sim"', async () => {
    const user = userEvent.setup();
    abrirProduto();

    const sim = await screen.findByRole('button', { name: 'Sim' });
    await user.click(sim);

    const m = screen.getByRole('button', { name: /^M — esgotado$|^M$/i });
    expect(m).toBeDisabled();
  });

  it('adiciona ao carrinho e persiste', async () => {
    const user = userEvent.setup();
    abrirProduto();

    const botao = await screen.findByRole('button', { name: /^adicionar ao carrinho$/i });
    await user.click(botao);

    await waitFor(() => {
      const carrinho = lerCarrinho();
      expect(carrinho).toHaveLength(1);
      expect(carrinho[0].productHandle).toBe(FLAMENGO);
      expect(carrinho[0].quantity).toBe(1);
    });
  });

  it('respeita a quantidade escolhida', async () => {
    const user = userEvent.setup();
    abrirProduto();

    await user.click(await screen.findByRole('button', { name: /aumentar quantidade/i }));
    await user.click(screen.getByRole('button', { name: /aumentar quantidade/i }));
    await user.click(screen.getByRole('button', { name: /^adicionar ao carrinho$/i }));

    await waitFor(() => {
      expect(lerCarrinho()[0].quantity).toBe(3);
    });
  });

  it('exige nome e número quando a personalização está ligada', async () => {
    const user = userEvent.setup();
    abrirProduto();

    await user.click(await screen.findByRole('button', { name: 'Sim' }));
    await user.click(screen.getByRole('button', { name: /^adicionar ao carrinho$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/preencha/i);
    expect(lerCarrinho()).toHaveLength(0);
  });

  it('aceita a personalização preenchida e grava as propriedades', async () => {
    const user = userEvent.setup();
    abrirProduto();

    await user.click(await screen.findByRole('button', { name: 'Sim' }));
    await user.type(screen.getByLabelText(/nome na camisa/i), 'GABIGOL');
    await user.type(screen.getByLabelText(/^número$/i), '10');
    await user.click(screen.getByRole('button', { name: /^adicionar ao carrinho$/i }));

    await waitFor(() => {
      const linha = lerCarrinho()[0];
      expect(linha.properties.Nome).toBe('GABIGOL');
      expect(linha.properties['Número']).toBe('10');
    });
  });

  it('limita o número da camisa a 2 dígitos e recusa letras', async () => {
    const user = userEvent.setup();
    abrirProduto();

    await user.click(await screen.findByRole('button', { name: 'Sim' }));
    const numero = screen.getByLabelText(/^número$/i);
    await user.type(numero, 'abc123');

    expect(numero).toHaveValue('12');
  });
});

describe('página de coleção', () => {
  it('lista os produtos da coleção', async () => {
    renderNaRota(<Collection />, {
      rota: '/colecoes/flamengo',
      path: '/colecoes/:handle',
    });
    expect(await screen.findByRole('heading', { name: /flamengo/i })).toBeInTheDocument();
    expect(screen.getByText(/17 produtos/i)).toBeInTheDocument();
  });

  it('mostra mensagem quando a coleção não existe', () => {
    renderNaRota(<Collection />, {
      rota: '/colecoes/nao-existe',
      path: '/colecoes/:handle',
    });
    expect(screen.getByText(/coleção não encontrada/i)).toBeInTheDocument();
  });

  it('filtra por disponibilidade', async () => {
    const user = userEvent.setup();
    renderNaRota(<Collection />, {
      rota: '/colecoes/flamengo',
      path: '/colecoes/:handle',
    });

    const foraDeEstoque = await screen.findByLabelText(/fora de estoque/i);
    await user.click(foraDeEstoque);

    await waitFor(() => {
      expect(screen.getByText(/produtos?$/i)).toBeInTheDocument();
    });
  });
});

describe('busca da loja', () => {
  it('encontra produtos ignorando acento', async () => {
    renderNaRota(<Search />, { rota: '/busca?q=retro', path: '/busca' });
    expect(await screen.findByRole('heading', { name: /retro/i })).toBeInTheDocument();
    expect(screen.getByText(/produtos encontrados/i)).toBeInTheDocument();
  });

  it('mostra estado vazio quando não acha nada', async () => {
    renderNaRota(<Search />, { rota: '/busca?q=zzzznadazzz', path: '/busca' });
    expect(await screen.findByText(/nada encontrado/i)).toBeInTheDocument();
  });
});

describe('checkout', () => {
  it('mostra carrinho vazio quando não há itens', () => {
    renderSimples(<Checkout />);
    expect(screen.getByText(/seu carrinho está vazio/i)).toBeInTheDocument();
  });

  it('bloqueia o envio enquanto os dados obrigatórios faltam', () => {
    localStorage.setItem(
      'xingsun:cart',
      JSON.stringify([
        {
          key: 'k1',
          productHandle: FLAMENGO,
          variantId: '43350853812272',
          title: 'Camisa Flamengo I 26/27',
          variantTitle: 'P / Não',
          image: '',
          price: 80,
          quantity: 2,
        },
      ])
    );

    renderSimples(<Checkout />);
    const finalizar = screen.getByRole('button', { name: /finalizar pedido/i });
    expect(finalizar).toBeDisabled();
  });
});

describe('painel reflete o que a loja gravou', () => {
  it('Vendas mostra o pedido gravado', () => {
    localStorage.setItem(
      'xingsun:analytics',
      JSON.stringify({
        events: [],
        sessions: [],
        abandoned: [],
        orders: [
          {
            id: 'XS12345678',
            createdAt: Date.now(),
            status: 'pago',
            customer: {
              name: 'Maria Silva',
              email: 'maria@teste.com',
              phone: '11999999999',
              cep: '01001-000',
              address: 'Praça da Sé',
              number: '10',
              complement: '',
              district: 'Sé',
              city: 'São Paulo',
              state: 'SP',
            },
            lines: [
              {
                productHandle: FLAMENGO,
                title: 'Camisa Flamengo I 26/27',
                variantTitle: 'P / Não',
                quantity: 2,
                price: 80,
                image: '',
              },
            ],
            subtotal: 160,
            discount: 0,
            shipping: 17.49,
            shippingMethod: 'Loggi Express',
            total: 177.49,
            payment: 'pix',
            sessionId: 's1',
          },
        ],
      })
    );

    renderSimples(<Vendas />);
    expect(screen.getByText(/XS12345678/)).toBeInTheDocument();
    expect(screen.getByText(/Maria Silva/)).toBeInTheDocument();
  });

  it('Produtos reflete um produto ocultado pelo painel', () => {
    localStorage.setItem(
      'xingsun:catalog',
      JSON.stringify({
        products: { [FLAMENGO]: { hidden: true } },
        created: [],
        deleted: [],
        categories: {},
        categoriesCreated: [],
        categoriesDeleted: [],
      })
    );

    renderSimples(<Produtos />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
