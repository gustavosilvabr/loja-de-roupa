import { describe, expect, it } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminProvider } from '../admin/store/AdminProvider';
import { ImagensProvider } from '../admin/store/ImagensProvider';
import { CartProvider } from '../store/cart';
import { DEFAULT_SETTINGS } from '../admin/defaults';
import { gravarCaminho, lerCaminho, useRascunho } from '../editor/useRascunho';
import { ArvoreSecoes } from '../editor/ArvoreSecoes';
import { estaNoEditor, mensagemConfiavel } from '../editor/protocolo';
import type { ReactNode } from 'react';
import type { HomeSection, StoreSettings } from '../admin/types';

function Envoltorio({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AdminProvider>
        <ImagensProvider>
          <CartProvider>{children}</CartProvider>
        </ImagensProvider>
      </AdminProvider>
    </MemoryRouter>
  );
}

const renderRascunho = () => renderHook(() => useRascunho(), { wrapper: Envoltorio });

describe('protocolo do editor', () => {
  it('fora do editor, a vitrine não entra em modo edição', () => {
    expect(estaNoEditor()).toBe(false);
  });

  it('recusa mensagem vinda de outra origem', () => {
    const daPropria = { origin: window.location.origin } as MessageEvent;
    const deFora = { origin: 'https://site-malicioso.com' } as MessageEvent;

    expect(mensagemConfiavel(daPropria)).toBe(true);
    expect(mensagemConfiavel(deFora)).toBe(false);
  });
});

describe('caminho de campo (imagem clicada na prévia)', () => {
  const settings = DEFAULT_SETTINGS;

  it('lê a imagem de um slide pelo id', () => {
    const slide = settings.heroSlides[0];
    expect(lerCaminho(settings, `heroSlides.${slide.id}.desktop`)).toBe(slide.desktop);
  });

  it('grava só no item certo, sem tocar nos vizinhos', () => {
    const alvo = settings.heroSlides[1];
    const novo = gravarCaminho(settings, `heroSlides.${alvo.id}.desktop`, 'nova.png');

    expect(novo.heroSlides[1].desktop).toBe('nova.png');
    expect(novo.heroSlides[0].desktop).toBe(settings.heroSlides[0].desktop);
    expect(novo.heroSlides[2].desktop).toBe(settings.heroSlides[2].desktop);
  });

  it('não quebra com caminho inexistente', () => {
    expect(lerCaminho(settings, 'listaQueNaoExiste.x.y')).toBe('');
    expect(gravarCaminho(settings, 'listaQueNaoExiste.x.y', 'a')).toBe(settings);
  });
});

describe('rascunho do editor', () => {
  it('começa limpo e igual ao publicado', () => {
    const { result } = renderRascunho();
    expect(result.current.sujo).toBe(false);
    expect(result.current.podeDesfazer).toBe(false);
  });

  it('alterar marca como sujo sem publicar nada', () => {
    const { result } = renderRascunho();

    act(() => {
      result.current.alterar((s) => ({
        ...s,
        theme: { ...s.theme, primary: '#ff0000' },
      }));
    });

    expect(result.current.settings.theme.primary).toBe('#ff0000');
    expect(result.current.sujo).toBe(true);

    // O que está salvo continua o original — o rascunho não vazou.
    const salvo = JSON.parse(localStorage.getItem('xingsun:settings') ?? '{}') as StoreSettings;
    expect(salvo.theme?.primary).not.toBe('#ff0000');
  });

  it('desfazer volta ao valor anterior', () => {
    const { result } = renderRascunho();

    act(() => {
      result.current.alterar((s) => ({ ...s, theme: { ...s.theme, primary: '#111111' } }));
    });
    act(() => {
      result.current.alterar((s) => ({ ...s, theme: { ...s.theme, primary: '#222222' } }));
    });
    expect(result.current.settings.theme.primary).toBe('#222222');

    act(() => result.current.desfazer());
    expect(result.current.settings.theme.primary).toBe('#111111');
    expect(result.current.podeRefazer).toBe(true);

    act(() => result.current.refazer());
    expect(result.current.settings.theme.primary).toBe('#222222');
  });

  it('descartar devolve tudo ao publicado', () => {
    const { result } = renderRascunho();

    act(() => {
      result.current.alterar((s) => ({ ...s, theme: { ...s.theme, primary: '#abcdef' } }));
    });
    act(() => result.current.descartar());

    expect(result.current.settings.theme.primary).toBe(DEFAULT_SETTINGS.theme.primary);
    expect(result.current.sujo).toBe(false);
  });

  it('publicar grava e zera o estado sujo', async () => {
    const { result } = renderRascunho();

    act(() => {
      result.current.alterar((s) => ({ ...s, theme: { ...s.theme, primary: '#00ff00' } }));
    });
    act(() => result.current.publicar());

    expect(result.current.sujo).toBe(false);

    await new Promise((r) => setTimeout(r, 10));
    const salvo = JSON.parse(localStorage.getItem('xingsun:settings') ?? '{}') as StoreSettings;
    expect(salvo.theme.primary).toBe('#00ff00');
  });

  it('reordenar seções mexe só na ordem, sem perder nenhuma', () => {
    const { result } = renderRascunho();
    const antes = result.current.settings.home.map((s) => s.id);

    act(() => {
      result.current.alterar((s) => {
        const home = [...s.home];
        const [primeiro] = home.splice(0, 1);
        home.splice(2, 0, primeiro);
        return { ...s, home };
      });
    });

    const depois = result.current.settings.home.map((s) => s.id);
    expect(depois).toHaveLength(antes.length);
    expect([...depois].sort()).toEqual([...antes].sort());
    expect(depois).not.toEqual(antes);
  });
});

describe('árvore de seções', () => {
  const secoes: HomeSection[] = [
    { id: 'a', type: 'hero', enabled: true, title: '', subtitle: '', collection: '', viewAllTo: '' },
    {
      id: 'b',
      type: 'carousel',
      enabled: true,
      title: 'Mais vendidas',
      subtitle: '',
      collection: 'titular',
      viewAllTo: '',
    },
  ];

  const montar = (props: Partial<Parameters<typeof ArvoreSecoes>[0]> = {}) =>
    render(
      <ArvoreSecoes
        secoes={secoes}
        selecionada={null}
        onSelecionar={() => {}}
        onDestacar={() => {}}
        onAlterar={() => {}}
        colecoes={[{ handle: 'titular', title: 'Titular' }]}
        {...props}
      />
    );

  it('lista as seções pelo título quando existe', () => {
    montar();
    expect(screen.getByText('Mais vendidas')).toBeInTheDocument();
    expect(screen.getByText('Slideshow')).toBeInTheDocument();
  });

  it('avisa qual seção foi escolhida', async () => {
    const user = userEvent.setup();
    const escolhidas: string[] = [];
    montar({ onSelecionar: (id) => escolhidas.push(id) });

    await user.click(screen.getByText('Mais vendidas'));
    expect(escolhidas).toEqual(['b']);
  });

  it('não deixa excluir o slideshow', () => {
    montar();
    expect(screen.queryByRole('button', { name: /excluir slideshow/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /excluir carrossel de produtos/i })
    ).toBeInTheDocument();
  });

  it('a primeira seção não pode subir e a última não pode descer', () => {
    montar();
    expect(screen.getByRole('button', { name: /mover slideshow para cima/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /mover carrossel de produtos para baixo/i })
    ).toBeDisabled();
  });
});
