import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderNaRota, renderSimples } from './utils';

import Produtos from '../admin/pages/Produtos';
import ProdutoEditar from '../admin/pages/ProdutoEditar';
import Categorias from '../admin/pages/Categorias';
import Banners from '../admin/pages/Banners';
import MenuAvisos from '../admin/pages/MenuAvisos';
import Vendas from '../admin/pages/Vendas';
import Clientes from '../admin/pages/Clientes';
import Visitantes from '../admin/pages/Visitantes';
import Carrinhos from '../admin/pages/Carrinhos';
import VisaoGeral from '../admin/pages/VisaoGeral';
import Marca from '../admin/pages/config/Marca';
import Dominio from '../admin/pages/config/Dominio';
import Gateway from '../admin/pages/config/Gateway';
import Frete from '../admin/pages/config/Frete';
import Seo from '../admin/pages/config/Seo';
import Pixels from '../admin/pages/config/Pixels';
import Politicas from '../admin/pages/config/Politicas';
import Dados from '../admin/pages/config/Dados';
import Ajuda from '../admin/pages/Ajuda';
import Precos from '../admin/pages/Precos';
import Sincronizacao from '../admin/pages/Sincronizacao';

const HANDLE = 'camisa-flamengo-i-26-27-torcedor-rubro-negra';

describe('todas as telas montam sem quebrar', () => {
  const telas: [string, () => void][] = [
    ['Visão geral', () => renderSimples(<VisaoGeral />)],
    ['Visitantes', () => renderSimples(<Visitantes />)],
    ['Carrinhos', () => renderSimples(<Carrinhos />)],
    ['Clientes', () => renderSimples(<Clientes />)],
    ['Vendas', () => renderSimples(<Vendas />)],
    ['Produtos', () => renderSimples(<Produtos />)],
    ['Categorias', () => renderSimples(<Categorias />)],
    ['Banners', () => renderSimples(<Banners />)],
    ['Menu e avisos', () => renderSimples(<MenuAvisos />)],
    ['Marca', () => renderSimples(<Marca />)],
    ['Domínio', () => renderSimples(<Dominio />)],
    ['Gateway', () => renderSimples(<Gateway />)],
    ['Frete', () => renderSimples(<Frete />)],
    ['SEO', () => renderSimples(<Seo />)],
    ['Pixels', () => renderSimples(<Pixels />)],
    ['Políticas', () => renderSimples(<Politicas />)],
    ['Dados', () => renderSimples(<Dados />)],
    ['Ajuda', () => renderSimples(<Ajuda />)],
    ['Preços e lucro', () => renderSimples(<Precos />)],
    ['Olheiro', () => renderSimples(<Sincronizacao />)],
  ];

  for (const [nome, montar] of telas) {
    it(`monta ${nome}`, () => {
      expect(() => montar()).not.toThrow();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  }

  it('monta o editor de produto com o handle da URL', () => {
    renderNaRota(<ProdutoEditar />, {
      rota: `/admin/produtos/${HANDLE}`,
      path: '/admin/produtos/:handle',
    });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('Produtos — busca e edição', () => {
  it('filtra a lista pelo texto buscado', async () => {
    const user = userEvent.setup();
    renderSimples(<Produtos />);

    const busca = screen.getByPlaceholderText(/flamengo, retro/i);
    await user.type(busca, 'flamengo');

    await waitFor(() => {
      expect(screen.getAllByText(/flamengo/i).length).toBeGreaterThan(0);
    });
  });

  it('mostra aviso quando a busca não encontra nada', async () => {
    const user = userEvent.setup();
    renderSimples(<Produtos />);

    await user.type(screen.getByPlaceholderText(/flamengo, retro/i), 'zzzznaoexistezzz');

    await waitFor(() => {
      expect(screen.getByText(/nenhum produto/i)).toBeInTheDocument();
    });
  });
});

describe('ProdutoEditar — alterações persistem', () => {
  // O título grava ao sair do campo (onBlur), não a cada tecla — assim o
  // localStorage não é reescrito a cada caractere digitado.
  it('salva o novo título ao sair do campo', async () => {
    const user = userEvent.setup();
    renderNaRota(<ProdutoEditar />, {
      rota: `/admin/produtos/${HANDLE}`,
      path: '/admin/produtos/:handle',
    });

    const titulo = await screen.findByDisplayValue(/Camisa Flamengo I 26\/27/i);
    await user.clear(titulo);
    await user.type(titulo, 'Camisa Teste');
    await user.tab();

    await waitFor(() => {
      const salvo = JSON.parse(localStorage.getItem('xingsun:catalog') ?? '{}');
      expect(salvo.products?.[HANDLE]?.title).toBe('Camisa Teste');
    });
  });

  it('não grava título vazio', async () => {
    const user = userEvent.setup();
    renderNaRota(<ProdutoEditar />, {
      rota: `/admin/produtos/${HANDLE}`,
      path: '/admin/produtos/:handle',
    });

    const titulo = await screen.findByDisplayValue(/Camisa Flamengo I 26\/27/i);
    await user.clear(titulo);
    await user.tab();

    const salvo = JSON.parse(localStorage.getItem('xingsun:catalog') ?? '{}');
    expect(salvo.products?.[HANDLE]?.title).toBeUndefined();
  });
});

describe('Marca — WhatsApp', () => {
  it('grava o nome da loja', async () => {
    const user = userEvent.setup();
    renderSimples(<Marca />);

    const nome = screen.getByDisplayValue('GP ESPORTES');
    await user.clear(nome);
    await user.type(nome, 'LOJA TESTE');

    await waitFor(() => {
      const salvo = JSON.parse(localStorage.getItem('xingsun:settings') ?? '{}');
      expect(salvo.brand?.name).toBe('LOJA TESTE');
    });
  });
});

describe('MenuAvisos — adicionar e excluir', () => {
  it('adiciona um link ao menu', async () => {
    const user = userEvent.setup();
    renderSimples(<MenuAvisos />);

    const antes = JSON.parse(localStorage.getItem('xingsun:settings') ?? '{}').nav?.length ?? 8;
    await user.click(screen.getByRole('button', { name: /adicionar link/i }));

    await waitFor(() => {
      const depois = JSON.parse(localStorage.getItem('xingsun:settings') ?? '{}').nav.length;
      expect(depois).toBe(antes + 1);
    });
  });

  it('exclui só depois da confirmação', async () => {
    const user = userEvent.setup();
    renderSimples(<MenuAvisos />);

    const antes = JSON.parse(localStorage.getItem('xingsun:settings') ?? '{}').nav?.length ?? 8;

    const excluir = screen.getAllByRole('button', { name: /^excluir$/i })[0];
    await user.click(excluir);

    // primeiro clique só arma a confirmação — nada some ainda
    const aindaIgual =
      JSON.parse(localStorage.getItem('xingsun:settings') ?? '{}').nav?.length ?? antes;
    expect(aindaIgual).toBe(antes);

    await user.click(screen.getAllByRole('button', { name: /confirmar/i })[0]);

    await waitFor(() => {
      const depois = JSON.parse(localStorage.getItem('xingsun:settings') ?? '{}').nav.length;
      expect(depois).toBe(antes - 1);
    });
  });
});

describe('Categorias — criar', () => {
  it('cria categoria e gera o handle a partir do título', async () => {
    const user = userEvent.setup();
    renderSimples(<Categorias />);

    await user.type(screen.getByPlaceholderText(/Seleções Europeias/i), 'Times Teste');
    await user.click(screen.getByRole('button', { name: /criar categoria/i }));

    await waitFor(() => {
      const salvo = JSON.parse(localStorage.getItem('xingsun:catalog') ?? '{}');
      expect(salvo.categoriesCreated).toContain('times-teste');
    });
  });
});

describe('telas de estatística sem dados', () => {
  it('Vendas mostra estado vazio em vez de tabela quebrada', () => {
    renderSimples(<Vendas />);
    expect(screen.getByText(/nenhum pedido/i)).toBeInTheDocument();
  });

  it('Clientes mostra estado vazio', () => {
    renderSimples(<Clientes />);
    expect(screen.getByText(/nenhum cliente/i)).toBeInTheDocument();
  });

  it('Visão geral monta com zero eventos', () => {
    const { container } = renderSimples(<VisaoGeral />);
    expect(within(container).getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('Dados — backup', () => {
  it('exporta sem erro', async () => {
    const user = userEvent.setup();
    // jsdom não implementa createObjectURL
    URL.createObjectURL = () => 'blob:teste';
    URL.revokeObjectURL = () => {};

    renderSimples(<Dados />);
    await user.click(screen.getByRole('button', { name: /baixar backup/i }));

    await waitFor(() => {
      expect(screen.getByText(/backup baixado/i)).toBeInTheDocument();
    });
  });
});
