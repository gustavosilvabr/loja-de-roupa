import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderSimples } from './utils';
import { Logo } from '../components/Logo';
import { Header } from '../components/Header';
import { registrarUrl } from '../lib/imagensLocais';
import type { StoreSettings } from '../admin/types';

/** Grava as configurações antes de montar — é de lá que a Logo lê. */
function comMarca(brand: Partial<StoreSettings['brand']>) {
  localStorage.setItem('xingsun:settings', JSON.stringify({ brand }));
}

describe('logo da loja', () => {
  it('sem arquivo enviado, mostra o nome em texto', () => {
    comMarca({ name: 'XING SUN', logoMode: 'texto', logoUrl: '' });
    renderSimples(<Logo />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/XING SUN — página inicial/i)).toBeInTheDocument();
  });

  it('com arquivo enviado, o nome em texto some e a imagem aparece', () => {
    comMarca({
      name: 'XING SUN',
      logoMode: 'imagem',
      logoUrl: 'https://exemplo.com/minha-logo.png',
    });
    renderSimples(<Logo />);

    const imagem = screen.getByRole('img');
    expect(imagem).toHaveAttribute('src', 'https://exemplo.com/minha-logo.png');
    expect(imagem).toHaveAttribute('alt', 'XING SUN');

    // O bloco colorido da letra só existe na versão em texto.
    expect(document.querySelector('.bg-brand')).not.toBeInTheDocument();
  });

  it('resolve a logo enviada do computador (referência "local:")', () => {
    registrarUrl('local:img_logo', 'blob:logo-de-teste');
    comMarca({ name: 'XING SUN', logoMode: 'imagem', logoUrl: 'local:img_logo' });

    renderSimples(<Logo />);

    // Sem passar por img(), o navegador receberia "local:img_logo" e
    // o cabeçalho ficaria vazio.
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:logo-de-teste');
  });

  it('se o arquivo não carregar, o nome em texto volta', () => {
    comMarca({
      name: 'XING SUN',
      logoMode: 'imagem',
      logoUrl: 'https://exemplo.com/quebrada.png',
    });
    renderSimples(<Logo />);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/XING SUN — página inicial/i)).toBeInTheDocument();
  });

  it('modo imagem sem arquivo continua mostrando o texto', () => {
    comMarca({ name: 'XING SUN', logoMode: 'imagem', logoUrl: '' });
    renderSimples(<Logo />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('tamanho da logo', () => {
  it('a imagem usa a altura escolhida', () => {
    comMarca({
      name: 'XING SUN',
      logoMode: 'imagem',
      logoUrl: 'https://exemplo.com/logo.png',
      logoAltura: 56,
    });
    renderSimples(<Logo />);

    expect(screen.getByRole('img')).toHaveStyle({ height: '56px' });
  });

  it('o texto acompanha a altura, para o cabeçalho não pular de tamanho', () => {
    comMarca({ name: 'XING SUN', logoMode: 'texto', logoAltura: 50 });
    renderSimples(<Logo />);

    // 50 * 0,62 arredondado
    expect(screen.getByLabelText(/página inicial/i)).toHaveStyle({ fontSize: '31px' });
  });

  it('sem altura definida, usa o padrão', () => {
    comMarca({ name: 'XING SUN', logoMode: 'imagem', logoUrl: 'https://exemplo.com/l.png' });
    renderSimples(<Logo />);

    expect(screen.getByRole('img')).toHaveStyle({ height: '36px' });
  });
});

describe('posição da logo no cabeçalho', () => {
  /** A célula da logo é quem carrega a posição — a grade é sempre a mesma. */
  const celulaDaLogo = (container: HTMLElement) =>
    container.querySelector('a[aria-label*="página inicial"]')?.parentElement?.className ?? '';

  it('celular e computador têm posições independentes', () => {
    comMarca({
      name: 'XING SUN',
      logoAlinhamentoMobile: 'centro',
      logoAlinhamento: 'esquerda',
    });
    const { container } = renderSimples(<Header />);
    const classes = celulaDaLogo(container);

    // celular: coluna do meio, centralizada
    expect(classes).toContain('col-start-2');
    expect(classes).toContain('justify-center');
    // computador: primeira coluna, encostada à esquerda
    expect(classes).toContain('lg:col-start-1');
    expect(classes).toContain('lg:justify-start');
  });

  it('aceita a combinação inversa', () => {
    comMarca({
      name: 'XING SUN',
      logoAlinhamentoMobile: 'esquerda',
      logoAlinhamento: 'centro',
    });
    const { container } = renderSimples(<Header />);
    const classes = celulaDaLogo(container);

    expect(classes).toContain('col-start-1');
    expect(classes).toContain('lg:col-start-2');
    expect(classes).toContain('lg:justify-center');
  });

  it('à direita, a logo encosta nos ícones', () => {
    comMarca({ name: 'XING SUN', logoAlinhamento: 'direita' });
    const { container } = renderSimples(<Header />);

    expect(celulaDaLogo(container)).toContain('lg:justify-end');
  });

  it('sem configuração, usa centro no celular e esquerda no computador', () => {
    comMarca({ name: 'XING SUN' });
    const { container } = renderSimples(<Header />);
    const classes = celulaDaLogo(container);

    expect(classes).toContain('col-start-2');
    expect(classes).toContain('lg:col-start-1');
  });

  it('a barra do cabeçalho tem uma única logo', () => {
    comMarca({ name: 'XING SUN', logoAlinhamentoMobile: 'centro', logoAlinhamento: 'direita' });
    const { container } = renderSimples(<Header />);

    // Duplicar a logo para posicionar em cada tela faria o leitor de tela
    // anunciar o link duas vezes. (A gaveta do menu mobile tem a sua
    // própria logo, por isso a busca é dentro da barra.)
    const barra = container.querySelector('header > div');
    expect(barra?.querySelectorAll('a[aria-label*="página inicial"]')).toHaveLength(1);
  });

  it('o menu de navegação continua presente em qualquer posição', () => {
    for (const posicao of ['esquerda', 'centro', 'direita'] as const) {
      localStorage.clear();
      comMarca({ name: 'XING SUN', logoAlinhamento: posicao });
      const { unmount } = renderSimples(<Header />);

      expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
      unmount();
    }
  });
});

describe('espaçamento da logo', () => {
  const celula = (container: HTMLElement) =>
    container.querySelector('a[aria-label*="página inicial"]')?.parentElement;

  it('aplica o respiro escolhido', () => {
    comMarca({ name: 'XING SUN', logoEspacamento: 20 });
    const { container } = renderSimples(<Header />);

    expect(celula(container)).toHaveStyle({ padding: '20px' });
  });

  it('sem configuração, usa o padrão', () => {
    comMarca({ name: 'XING SUN' });
    const { container } = renderSimples(<Header />);

    expect(celula(container)).toHaveStyle({ padding: '8px' });
  });

  it('aceita zero quando o lojista quer a logo colada', () => {
    comMarca({ name: 'XING SUN', logoEspacamento: 0 });
    const { container } = renderSimples(<Header />);

    expect(celula(container)).toHaveStyle({ padding: '0px' });
  });
});
