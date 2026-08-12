import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderSimples } from './utils';
import { ProductCard } from '../components/ProductCard';
import { Estrelas } from '../components/Estrelas';
import type { Product } from '../types';

const base: Product = {
  id: 'p1',
  handle: 'camisa-teste',
  title: 'Camisa Teste I 26/27',
  type: 'Camisa',
  vendor: 'XING SUN',
  tags: [],
  options: [],
  variants: [
    {
      id: 'v1',
      title: 'P / Não',
      o1: 'P',
      o2: 'Não',
      price: 180,
      custo: 80,
      compareAt: 229.9,
      available: true,
    },
  ],
  images: ['https://exemplo.com/foto.png'],
  image: 'https://exemplo.com/foto.png',
  price: 180,
  custo: 80,
  compareAt: 229.9,
  available: true,
  descriptionHtml: '',
};

const produto = (extra: Partial<Product> = {}): Product => ({ ...base, ...extra });

describe('estrelas de avaliação', () => {
  it('não aparecem sem nota — nada de review fabricada', () => {
    renderSimples(<Estrelas />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('não aparecem com nota mas sem ninguém tendo avaliado', () => {
    renderSimples(<Estrelas nota={5} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('aparecem quando há avaliação real', () => {
    renderSimples(<Estrelas nota={4.5} avaliacoes={12} />);
    expect(screen.getByRole('img', { name: /4,5 de 5, 12 avaliações/i })).toBeInTheDocument();
  });

  it('usa o singular quando é uma avaliação só', () => {
    renderSimples(<Estrelas nota={5} avaliacoes={1} />);
    expect(screen.getByRole('img', { name: /1 avaliação$/i })).toBeInTheDocument();
  });

  it('não deixa a nota passar de 5', () => {
    renderSimples(<Estrelas nota={9} avaliacoes={3} />);
    expect(screen.getByRole('img', { name: /5,0 de 5/i })).toBeInTheDocument();
  });
});

describe('cartão do produto', () => {
  it('mostra o desconto calculado sobre o preço "de"', () => {
    renderSimples(<ProductCard product={produto()} />);
    // 180 sobre 229,90 = 22%
    expect(screen.getByText('-22% OFF')).toBeInTheDocument();
  });

  it('destaca o preço no Pix com o desconto configurado', () => {
    renderSimples(<ProductCard product={produto()} />);
    // 180 - 5% = 171,00
    expect(screen.getByText(/171,00/)).toBeInTheDocument();
    expect(screen.getByText(/no Pix/i)).toBeInTheDocument();
  });

  it('mostra o parcelamento sem juros', () => {
    renderSimples(<ProductCard product={produto()} />);
    expect(screen.getByText(/sem\s*juros/i)).toBeInTheDocument();
  });

  it('risca o preço cheio', () => {
    const { container } = renderSimples(<ProductCard product={produto()} />);
    expect(container.querySelector('s')?.textContent).toMatch(/229,90/);
  });

  it('sem preço "de", não inventa desconto', () => {
    renderSimples(<ProductCard product={produto({ compareAt: null })} />);
    expect(screen.queryByText(/OFF/)).not.toBeInTheDocument();
  });

  it('esconde as estrelas quando o produto não tem avaliação', () => {
    renderSimples(<ProductCard product={produto()} />);
    expect(screen.queryByRole('img', { name: /de 5/i })).not.toBeInTheDocument();
  });

  it('mostra as estrelas quando o lojista cadastrou a avaliação', () => {
    renderSimples(<ProductCard product={produto({ nota: 4, avaliacoes: 8 })} />);
    expect(screen.getByRole('img', { name: /4,0 de 5, 8 avaliações/i })).toBeInTheDocument();
  });

  it('exibe o selo cadastrado', () => {
    renderSimples(<ProductCard product={produto({ selo: 'LANÇAMENTO' })} />);
    expect(screen.getByText('LANÇAMENTO')).toBeInTheDocument();
  });

  it('produto esgotado não pode ser adicionado', () => {
    renderSimples(<ProductCard product={produto({ available: false })} />);
    const botao = screen.getByRole('button', { name: /esgotado/i });
    expect(botao).toBeDisabled();
  });

  it('adiciona ao carrinho pelo botão do cartão', async () => {
    const user = userEvent.setup();
    renderSimples(<ProductCard product={produto()} />);

    await user.click(screen.getByRole('button', { name: /adicionar camisa teste/i }));

    const carrinho = JSON.parse(localStorage.getItem('xingsun:cart') ?? '[]');
    expect(carrinho).toHaveLength(1);
    expect(carrinho[0].productHandle).toBe('camisa-teste');
  });
});
