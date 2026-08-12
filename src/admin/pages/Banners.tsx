import { useState } from 'react';
import { useAdmin } from '../store/AdminProvider';
import { uid } from '../store/persist';
import { Button, Card, ConfirmButton, Field, Input, PageHeader, Toggle } from '../ui';
import { SeletorImagens } from '../SeletorImagens';
import { img } from '../../lib/format';
import type { BannerItem, HeroSlide, StoreSettings } from '../types';

type Aba = 'slides' | 'destaques' | 'colecoes' | 'times';

const ABAS: { key: Aba; label: string }[] = [
  { key: 'slides', label: 'Slideshow' },
  { key: 'destaques', label: 'Grade de banners' },
  { key: 'colecoes', label: 'Banners de coleção' },
  { key: 'times', label: 'Escudos dos times' },
];

/** Miniatura que não quebra o layout quando a URL está errada. */
function Preview({ src, alt }: { src: string; alt: string }) {
  const [erro, setErro] = useState(false);

  const resolvido = img(src, 300);

  if (!resolvido || erro) {
    return (
      <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
        sem imagem
      </div>
    );
  }

  return (
    <img
      src={resolvido}
      alt={alt}
      onError={() => setErro(true)}
      className="h-16 w-28 shrink-0 rounded border border-slate-200 bg-slate-50 object-cover"
    />
  );
}

function Ordenar({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (delta: number) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label="Mover para cima"
        className="rounded border border-slate-300 px-2 py-0.5 text-[12px] text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label="Mover para baixo"
        className="rounded border border-slate-300 px-2 py-0.5 text-[12px] text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
      >
        ↓
      </button>
    </div>
  );
}

export default function Banners() {
  const { settings, updateSettings } = useAdmin();
  const [aba, setAba] = useState<Aba>('slides');

  /** Reordena qualquer uma das listas de banners. */
  function mover<K extends 'heroSlides' | 'featureBanners' | 'collectionBanners' | 'teams'>(
    chave: K,
    index: number,
    delta: number
  ) {
    updateSettings((s) => {
      const lista = [...(s[chave] as StoreSettings[K])] as StoreSettings[K];
      const alvo = index + delta;
      if (alvo < 0 || alvo >= lista.length) return s;
      [lista[index], lista[alvo]] = [lista[alvo], lista[index]];
      return { ...s, [chave]: lista };
    });
  }

  const patchSlide = (id: string, p: Partial<HeroSlide>) =>
    updateSettings((s) => ({
      ...s,
      heroSlides: s.heroSlides.map((x) => (x.id === id ? { ...x, ...p } : x)),
    }));

  const patchBanner = (
    chave: 'featureBanners' | 'collectionBanners',
    id: string,
    p: Partial<BannerItem>
  ) =>
    updateSettings((s) => ({
      ...s,
      [chave]: s[chave].map((x) => (x.id === id ? { ...x, ...p } : x)),
    }));

  return (
    <>
      <PageHeader
        title="Banners e carrosséis"
        description="Envie as imagens do seu computador ou cole o endereço de uma imagem da internet."
      />

      <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-200">
        {ABAS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setAba(a.key)}
            aria-current={aba === a.key}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors ${
              aba === a.key
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'slides' && (
        <div className="space-y-3">
          {settings.heroSlides.map((slide, i) => (
            <Card key={slide.id} className={slide.enabled ? '' : 'opacity-60'}>
              <div className="flex flex-wrap items-start gap-4">
                <Ordenar
                  index={i}
                  total={settings.heroSlides.length}
                  onMove={(d) => mover('heroSlides', i, d)}
                />
                <Preview src={slide.desktop} alt={slide.title} />

                <div className="grid min-w-[260px] flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Título interno">
                    <Input
                      value={slide.title}
                      onChange={(e) => patchSlide(slide.id, { title: e.target.value })}
                    />
                  </Field>
                  <Field label="Link ao clicar">
                    <Input
                      value={slide.to}
                      onChange={(e) => patchSlide(slide.id, { to: e.target.value })}
                      placeholder="/colecoes/titular"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <SeletorImagens
                      unica
                      rotulo="Imagem para computador"
                      valor={slide.desktop ? [slide.desktop] : []}
                      onChange={(lista) => patchSlide(slide.id, { desktop: lista[0] ?? '' })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <SeletorImagens
                      unica
                      rotulo="Imagem para celular"
                      ajuda="Deixe vazio para usar a mesma imagem do computador."
                      valor={slide.mobile ? [slide.mobile] : []}
                      onChange={(lista) => patchSlide(slide.id, { mobile: lista[0] ?? '' })}
                    />
                  </div>
                  <Field
                    label="Texto alternativo"
                    hint="Descreve a imagem para leitores de tela e para o Google"
                    className="sm:col-span-2"
                  >
                    <Input
                      value={slide.alt}
                      onChange={(e) => patchSlide(slide.id, { alt: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <Toggle
                    checked={slide.enabled}
                    onChange={(v) => patchSlide(slide.id, { enabled: v })}
                    label={slide.enabled ? 'Visível' : 'Oculto'}
                  />
                  <ConfirmButton
                    onConfirm={() =>
                      updateSettings((s) => ({
                        ...s,
                        heroSlides: s.heroSlides.filter((x) => x.id !== slide.id),
                      }))
                    }
                  >
                    Excluir
                  </ConfirmButton>
                </div>
              </div>
            </Card>
          ))}

          <Button
            onClick={() =>
              updateSettings((s) => ({
                ...s,
                heroSlides: [
                  ...s.heroSlides,
                  {
                    id: uid('sl'),
                    title: 'Novo slide',
                    desktop: '',
                    mobile: '',
                    to: '/',
                    alt: '',
                    enabled: true,
                  },
                ],
              }))
            }
          >
            Adicionar slide
          </Button>
        </div>
      )}

      {(aba === 'destaques' || aba === 'colecoes') && (
        <div className="space-y-3">
          {(aba === 'destaques' ? settings.featureBanners : settings.collectionBanners).map(
            (b, i, lista) => {
              const chave = aba === 'destaques' ? 'featureBanners' : 'collectionBanners';
              return (
                <Card key={b.id} className={b.enabled ? '' : 'opacity-60'}>
                  <div className="flex flex-wrap items-start gap-4">
                    <Ordenar index={i} total={lista.length} onMove={(d) => mover(chave, i, d)} />
                    <Preview src={b.image} alt={b.title} />

                    <div className="grid min-w-[260px] flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field label="Título">
                        <Input
                          value={b.title}
                          onChange={(e) => patchBanner(chave, b.id, { title: e.target.value })}
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <SeletorImagens
                          unica
                          rotulo="Imagem do banner"
                          valor={b.image ? [b.image] : []}
                          onChange={(lista) => patchBanner(chave, b.id, { image: lista[0] ?? '' })}
                        />
                      </div>
                      <Field label="Link ao clicar">
                        <Input
                          value={b.to}
                          onChange={(e) => patchBanner(chave, b.id, { to: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-3">
                      <Toggle
                        checked={b.enabled}
                        onChange={(v) => patchBanner(chave, b.id, { enabled: v })}
                        label={b.enabled ? 'Visível' : 'Oculto'}
                      />
                      <ConfirmButton
                        onConfirm={() =>
                          updateSettings((s) => ({
                            ...s,
                            [chave]: s[chave].filter((x) => x.id !== b.id),
                          }))
                        }
                      >
                        Excluir
                      </ConfirmButton>
                    </div>
                  </div>
                </Card>
              );
            }
          )}

          <Button
            onClick={() => {
              const chave = aba === 'destaques' ? 'featureBanners' : 'collectionBanners';
              updateSettings((s) => ({
                ...s,
                [chave]: [
                  ...s[chave],
                  { id: uid('b'), title: 'Novo banner', image: '', to: '/', enabled: true },
                ],
              }));
            }}
          >
            Adicionar banner
          </Button>
        </div>
      )}

      {aba === 'times' && (
        <div className="space-y-3">
          {settings.teams.map((t, i) => (
            <Card key={t.id} className={t.enabled ? '' : 'opacity-60'}>
              <div className="flex flex-wrap items-center gap-4">
                <Ordenar index={i} total={settings.teams.length} onMove={(d) => mover('teams', i, d)} />
                <Preview src={t.crest} alt={t.name} />

                <div className="grid min-w-[260px] flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Nome do time">
                    <Input
                      value={t.name}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          teams: s.teams.map((x) =>
                            x.id === t.id ? { ...x, name: e.target.value } : x
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Coleção (handle)" hint="Leva para /colecoes/…">
                    <Input
                      value={t.handle}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          teams: s.teams.map((x) =>
                            x.id === t.id ? { ...x, handle: e.target.value } : x
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Escudo (URL)">
                    <Input
                      value={t.crest}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          teams: s.teams.map((x) =>
                            x.id === t.id ? { ...x, crest: e.target.value } : x
                          ),
                        }))
                      }
                      spellCheck={false}
                    />
                  </Field>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <Toggle
                    checked={t.enabled}
                    onChange={(v) =>
                      updateSettings((s) => ({
                        ...s,
                        teams: s.teams.map((x) => (x.id === t.id ? { ...x, enabled: v } : x)),
                      }))
                    }
                    label={t.enabled ? 'Visível' : 'Oculto'}
                  />
                  <ConfirmButton
                    onConfirm={() =>
                      updateSettings((s) => ({
                        ...s,
                        teams: s.teams.filter((x) => x.id !== t.id),
                      }))
                    }
                  >
                    Excluir
                  </ConfirmButton>
                </div>
              </div>
            </Card>
          ))}

          <Button
            onClick={() =>
              updateSettings((s) => ({
                ...s,
                teams: [
                  ...s.teams,
                  { id: uid('t'), name: 'Novo time', handle: '', crest: '', enabled: true },
                ],
              }))
            }
          >
            Adicionar time
          </Button>
        </div>
      )}
    </>
  );
}
