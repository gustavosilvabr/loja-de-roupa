import { useState } from 'react';
import { uid } from '../admin/store/persist';
import type { HomeSection, HomeSectionType, StoreSettings } from '../admin/types';

const ROTULO: Record<HomeSectionType, string> = {
  hero: 'Slideshow',
  countdown: 'Contador de ofertas',
  carousel: 'Carrossel de produtos',
  promoBanner: 'Banner largo',
  bannerGrid: 'Grade de banners',
  teams: 'Escolha por time',
  collectionBanners: 'Banners de coleção',
  faq: 'Perguntas frequentes',
};

const ICONE: Record<HomeSectionType, string> = {
  hero: '🖼️',
  countdown: '⏱️',
  carousel: '🛍️',
  promoBanner: '📢',
  bannerGrid: '🔲',
  teams: '⚽',
  collectionBanners: '🗂️',
  faq: '❓',
};

/** Seções que podem ser adicionadas mais de uma vez. */
const ADICIONAVEIS: HomeSectionType[] = ['carousel', 'promoBanner', 'bannerGrid', 'collectionBanners'];

interface Props {
  secoes: HomeSection[];
  selecionada: string | null;
  onSelecionar: (id: string) => void;
  onDestacar: (id: string | null) => void;
  onAlterar: (fn: (s: StoreSettings) => StoreSettings) => void;
  colecoes: { handle: string; title: string }[];
}

export function ArvoreSecoes({
  secoes,
  selecionada,
  onSelecionar,
  onDestacar,
  onAlterar,
  colecoes,
}: Props) {
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<number | null>(null);
  const [abrindoMenu, setAbrindoMenu] = useState(false);

  const setHome = (fn: (l: HomeSection[]) => HomeSection[]) =>
    onAlterar((s) => ({ ...s, home: fn(s.home) }));

  const mover = (de: number, para: number) => {
    if (de === para || para < 0 || para >= secoes.length) return;
    setHome((lista) => {
      const copia = [...lista];
      const [item] = copia.splice(de, 1);
      copia.splice(para, 0, item);
      return copia;
    });
  };

  const alternarVisivel = (id: string) =>
    setHome((l) => l.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));

  const excluir = (id: string) => setHome((l) => l.filter((s) => s.id !== id));

  const adicionar = (tipo: HomeSectionType) => {
    const nova: HomeSection = {
      id: uid('h'),
      type: tipo,
      enabled: true,
      title: tipo === 'carousel' ? 'Nova vitrine' : '',
      subtitle: '',
      collection: tipo === 'carousel' ? (colecoes[0]?.handle ?? '') : '',
      viewAllTo: tipo === 'carousel' ? `/colecoes/${colecoes[0]?.handle ?? ''}` : '',
    };
    setHome((l) => [...l, nova]);
    setAbrindoMenu(false);
    onSelecionar(nova.id);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          Seções da página
        </h2>
        <span className="text-[11.5px] text-slate-400">{secoes.length}</span>
      </div>

      <ul className="flex-1 overflow-y-auto p-2">
        {secoes.map((secao, i) => {
          const ativa = selecionada === secao.id;
          const sobrevoando = alvo === i && arrastando !== null && arrastando !== i;

          return (
            <li
              key={secao.id}
              draggable
              onDragStart={() => setArrastando(i)}
              onDragEnd={() => {
                setArrastando(null);
                setAlvo(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setAlvo(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (arrastando !== null) mover(arrastando, i);
                setArrastando(null);
                setAlvo(null);
              }}
              onMouseEnter={() => onDestacar(secao.id)}
              onMouseLeave={() => onDestacar(null)}
              className={`mb-1 rounded-lg border transition-colors ${
                sobrevoando
                  ? 'border-violet-400 bg-violet-50'
                  : ativa
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-transparent hover:bg-slate-100'
              } ${arrastando === i ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <span
                  aria-hidden="true"
                  title="Arraste para reordenar"
                  className="cursor-grab select-none text-[13px] text-slate-300 active:cursor-grabbing"
                >
                  ⠿
                </span>

                <button
                  type="button"
                  onClick={() => onSelecionar(secao.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left"
                >
                  <span aria-hidden="true" className="text-[13px]">
                    {ICONE[secao.type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[13px] ${
                        ativa ? 'font-semibold text-violet-800' : 'text-slate-700'
                      } ${secao.enabled ? '' : 'line-through opacity-50'}`}
                    >
                      {secao.title || ROTULO[secao.type]}
                    </span>
                    {secao.title && (
                      <span className="block truncate text-[11px] text-slate-400">
                        {ROTULO[secao.type]}
                      </span>
                    )}
                  </span>
                </button>

                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => mover(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Mover ${ROTULO[secao.type]} para cima`}
                    className="px-1 text-[11px] text-slate-400 hover:text-slate-700 disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, i + 1)}
                    disabled={i === secoes.length - 1}
                    aria-label={`Mover ${ROTULO[secao.type]} para baixo`}
                    className="px-1 text-[11px] text-slate-400 hover:text-slate-700 disabled:opacity-25"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarVisivel(secao.id)}
                    aria-label={secao.enabled ? 'Ocultar seção' : 'Mostrar seção'}
                    title={secao.enabled ? 'Ocultar da loja' : 'Mostrar na loja'}
                    className="px-1 text-[12px] text-slate-400 hover:text-slate-700"
                  >
                    {secao.enabled ? '👁' : '🚫'}
                  </button>
                  {secao.type !== 'hero' && (
                    <button
                      type="button"
                      onClick={() => excluir(secao.id)}
                      aria-label={`Excluir ${ROTULO[secao.type]}`}
                      className="px-1 text-[14px] text-slate-300 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="relative border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={() => setAbrindoMenu((v) => !v)}
          aria-expanded={abrindoMenu}
          className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
        >
          + Adicionar seção
        </button>

        {abrindoMenu && (
          <ul className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {ADICIONAVEIS.map((tipo) => (
              <li key={tipo}>
                <button
                  type="button"
                  onClick={() => adicionar(tipo)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <span aria-hidden="true">{ICONE[tipo]}</span>
                  {ROTULO[tipo]}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export { ROTULO as ROTULO_SECAO };
