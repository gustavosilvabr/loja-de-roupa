import { useEffect, useRef } from 'react';
import { DEFAULT_SETTINGS } from '../admin/defaults';
import { SeletorImagens } from '../admin/SeletorImagens';
import { Field, Input, Select, Textarea, Toggle } from '../admin/ui';
import { ROTULO_SECAO } from './ArvoreSecoes';
import type {
  BannerItem,
  HeroSlide,
  HomeSection,
  StoreSettings,
  ThemeSettings,
} from '../admin/types';

const FONTES = ['Inter Tight', 'Archivo', 'Poppins', 'Montserrat', 'Roboto', 'Oswald', 'system-ui'];

const CORES: { chave: keyof ThemeSettings; rotulo: string }[] = [
  { chave: 'primary', rotulo: 'Cor principal' },
  { chave: 'primaryDark', rotulo: 'Cor principal (hover)' },
  { chave: 'ink', rotulo: 'Texto' },
  { chave: 'muted', rotulo: 'Texto secundário' },
  { chave: 'headerBg', rotulo: 'Fundo do topo' },
  { chave: 'headerText', rotulo: 'Texto do topo' },
  { chave: 'footerBg', rotulo: 'Fundo do rodapé' },
];

type Aba = 'secao' | 'aparencia';

interface Props {
  aba: Aba;
  settings: StoreSettings;
  secao: HomeSection | null;
  campoFocado: string | null;
  onAlterar: (fn: (s: StoreSettings) => StoreSettings) => void;
  colecoes: { handle: string; title: string }[];
}

export function Inspetor({ aba, settings, secao, campoFocado, onAlterar, colecoes }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);

  // Clicar numa imagem no preview traz o campo dela para a vista.
  useEffect(() => {
    if (!campoFocado) return;
    const alvo = areaRef.current?.querySelector<HTMLElement>(
      `[data-campo-editor="${CSS.escape(campoFocado)}"]`
    );
    alvo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    alvo?.classList.add('ring-2', 'ring-violet-400');
    const id = window.setTimeout(
      () => alvo?.classList.remove('ring-2', 'ring-violet-400'),
      1600
    );
    return () => window.clearTimeout(id);
  }, [campoFocado]);

  const setTema = (patch: Partial<ThemeSettings>) =>
    onAlterar((s) => ({ ...s, theme: { ...s.theme, ...patch } }));

  const setSecao = (patch: Partial<HomeSection>) => {
    if (!secao) return;
    onAlterar((s) => ({
      ...s,
      home: s.home.map((x) => (x.id === secao.id ? { ...x, ...patch } : x)),
    }));
  };

  const setSlide = (id: string, patch: Partial<HeroSlide>) =>
    onAlterar((s) => ({
      ...s,
      heroSlides: s.heroSlides.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));

  const setBanner = (
    lista: 'featureBanners' | 'collectionBanners',
    id: string,
    patch: Partial<BannerItem>
  ) =>
    onAlterar((s) => ({
      ...s,
      [lista]: s[lista].map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));

  return (
    <div ref={areaRef} className="h-full overflow-y-auto">
      {aba === 'aparencia' ? (
        <div className="space-y-6 p-4">
          <section>
            <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Cores
            </h3>
            <div className="space-y-3">
              {CORES.map((c) => (
                <Field key={c.chave} label={c.rotulo}>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.theme[c.chave] as string}
                      onChange={(e) =>
                        setTema({ [c.chave]: e.target.value } as Partial<ThemeSettings>)
                      }
                      aria-label={c.rotulo}
                      className="h-[38px] w-11 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                    />
                    <Input
                      value={settings.theme[c.chave] as string}
                      onChange={(e) =>
                        setTema({ [c.chave]: e.target.value } as Partial<ThemeSettings>)
                      }
                      aria-label={`${c.rotulo} em hexadecimal`}
                      spellCheck={false}
                    />
                  </div>
                </Field>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Tipografia
            </h3>
            <div className="space-y-3">
              <Field label="Fonte dos títulos">
                <Select
                  value={settings.theme.fontHeading}
                  onChange={(e) => setTema({ fontHeading: e.target.value })}
                >
                  {FONTES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Fonte do corpo">
                <Select
                  value={settings.theme.fontBody}
                  onChange={(e) => setTema({ fontBody: e.target.value })}
                >
                  {FONTES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              Formato
            </h3>
            <div className="space-y-3">
              <Field label={`Cantos do botão — ${settings.theme.radiusButton}px`}>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={settings.theme.radiusButton}
                  onChange={(e) => setTema({ radiusButton: Number(e.target.value) })}
                  className="w-full accent-violet-600"
                  aria-label="Raio do botão"
                />
              </Field>
              <Field label={`Cantos das imagens — ${settings.theme.radiusMedia}px`}>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={settings.theme.radiusMedia}
                  onChange={(e) => setTema({ radiusMedia: Number(e.target.value) })}
                  className="w-full accent-violet-600"
                  aria-label="Raio das imagens"
                />
              </Field>
              <Field label={`Largura do conteúdo — ${settings.theme.containerWidth}px`}>
                <input
                  type="range"
                  min={1100}
                  max={1920}
                  step={20}
                  value={settings.theme.containerWidth}
                  onChange={(e) => setTema({ containerWidth: Number(e.target.value) })}
                  className="w-full accent-violet-600"
                  aria-label="Largura do conteúdo"
                />
              </Field>
              <Field label={`Título do produto — ${settings.theme.cardTitleSize}px`}>
                <input
                  type="range"
                  min={12}
                  max={24}
                  value={settings.theme.cardTitleSize}
                  onChange={(e) => setTema({ cardTitleSize: Number(e.target.value) })}
                  className="w-full accent-violet-600"
                  aria-label="Tamanho do título do produto"
                />
              </Field>
              <Field label={`Preço do produto — ${settings.theme.cardPriceSize}px`}>
                <input
                  type="range"
                  min={12}
                  max={28}
                  value={settings.theme.cardPriceSize}
                  onChange={(e) => setTema({ cardPriceSize: Number(e.target.value) })}
                  className="w-full accent-violet-600"
                  aria-label="Tamanho do preço do produto"
                />
              </Field>
              <Toggle
                checked={settings.theme.buttonUppercase}
                onChange={(v) => setTema({ buttonUppercase: v })}
                label="Botões em MAIÚSCULAS"
              />
            </div>
          </section>

          <button
            type="button"
            onClick={() => setTema(DEFAULT_SETTINGS.theme)}
            className="w-full rounded-lg border border-slate-300 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Restaurar cores e fontes originais
          </button>
        </div>
      ) : !secao ? (
        <div className="p-6 text-center">
          <p className="text-[14px] font-medium text-slate-700">Nenhuma seção selecionada</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            Clique numa parte da loja à direita, ou escolha uma seção na lista à esquerda,
            para editar o conteúdo dela.
          </p>
        </div>
      ) : (
        <div className="space-y-5 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-semibold text-slate-800">
              {ROTULO_SECAO[secao.type]}
            </h3>
            <Toggle
              checked={secao.enabled}
              onChange={(v) => setSecao({ enabled: v })}
              label={secao.enabled ? 'Visível' : 'Oculta'}
            />
          </div>

          {secao.type !== 'hero' &&
            secao.type !== 'promoBanner' &&
            secao.type !== 'bannerGrid' && (
              <>
                <Field label="Título">
                  <Input
                    value={secao.title}
                    onChange={(e) => setSecao({ title: e.target.value })}
                  />
                </Field>
                <Field label="Subtítulo">
                  <Input
                    value={secao.subtitle}
                    onChange={(e) => setSecao({ subtitle: e.target.value })}
                  />
                </Field>
              </>
            )}

          {secao.type === 'carousel' && (
            <>
              <Field label="Produtos de qual categoria?">
                <Select
                  value={secao.collection}
                  onChange={(e) =>
                    setSecao({
                      collection: e.target.value,
                      viewAllTo: `/colecoes/${e.target.value}`,
                    })
                  }
                >
                  {colecoes.map((c) => (
                    <option key={c.handle} value={c.handle}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Link do botão “Ver tudo”" hint="Vazio esconde o botão">
                <Input
                  value={secao.viewAllTo}
                  onChange={(e) => setSecao({ viewAllTo: e.target.value })}
                />
              </Field>
            </>
          )}

          {secao.type === 'hero' && (
            <div className="space-y-5">
              <p className="text-[12.5px] text-slate-500">
                Clique numa imagem da prévia para editá-la direto.
              </p>
              {settings.heroSlides.map((slide) => (
                <div
                  key={slide.id}
                  data-campo-editor={`heroSlides.${slide.id}.desktop`}
                  className="rounded-lg border border-slate-200 p-3 transition-shadow"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Input
                      value={slide.title}
                      onChange={(e) => setSlide(slide.id, { title: e.target.value })}
                      aria-label="Nome do slide"
                      className="!py-1 !text-[12.5px]"
                    />
                    <Toggle
                      checked={slide.enabled}
                      onChange={(v) => setSlide(slide.id, { enabled: v })}
                      label=""
                    />
                  </div>

                  <SeletorImagens
                    unica
                    rotulo="Imagem do computador"
                    valor={slide.desktop ? [slide.desktop] : []}
                    onChange={(l) => setSlide(slide.id, { desktop: l[0] ?? '' })}
                  />
                  <div className="mt-3">
                    <SeletorImagens
                      unica
                      rotulo="Imagem do celular"
                      ajuda="Vazio usa a mesma do computador."
                      valor={slide.mobile ? [slide.mobile] : []}
                      onChange={(l) => setSlide(slide.id, { mobile: l[0] ?? '' })}
                    />
                  </div>

                  <Field label="Para onde leva o clique" className="mt-3">
                    <Input
                      value={slide.to}
                      onChange={(e) => setSlide(slide.id, { to: e.target.value })}
                      placeholder="/colecoes/titular"
                    />
                  </Field>
                  <Field
                    label="Descrição da imagem"
                    hint="Lida por leitores de tela e pelo Google"
                    className="mt-3"
                  >
                    <Textarea
                      rows={2}
                      value={slide.alt}
                      onChange={(e) => setSlide(slide.id, { alt: e.target.value })}
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {secao.type === 'promoBanner' && (
            <div
              data-campo-editor="promoBanner.desktop"
              className="space-y-3 rounded-lg border border-slate-200 p-3 transition-shadow"
            >
              <Toggle
                checked={settings.promoBanner?.enabled ?? true}
                onChange={(v) =>
                  onAlterar((s) => ({ ...s, promoBanner: { ...s.promoBanner, enabled: v } }))
                }
                label="Mostrar a faixa"
              />

              <SeletorImagens
                unica
                rotulo="Imagem do computador"
                valor={settings.promoBanner?.desktop ? [settings.promoBanner.desktop] : []}
                onChange={(l) =>
                  onAlterar((s) => ({ ...s, promoBanner: { ...s.promoBanner, desktop: l[0] ?? '' } }))
                }
              />
              <SeletorImagens
                unica
                rotulo="Imagem do celular"
                ajuda="Vazio usa a mesma do computador."
                valor={settings.promoBanner?.mobile ? [settings.promoBanner.mobile] : []}
                onChange={(l) =>
                  onAlterar((s) => ({ ...s, promoBanner: { ...s.promoBanner, mobile: l[0] ?? '' } }))
                }
              />

              <Field label="Para onde leva o clique">
                <Input
                  value={settings.promoBanner?.to ?? ''}
                  onChange={(e) =>
                    onAlterar((s) => ({ ...s, promoBanner: { ...s.promoBanner, to: e.target.value } }))
                  }
                  placeholder="/colecoes/titular"
                />
              </Field>
              <Field label="Descrição da imagem">
                <Textarea
                  rows={2}
                  value={settings.promoBanner?.alt ?? ''}
                  onChange={(e) =>
                    onAlterar((s) => ({ ...s, promoBanner: { ...s.promoBanner, alt: e.target.value } }))
                  }
                />
              </Field>
            </div>
          )}

          {(secao.type === 'bannerGrid' || secao.type === 'collectionBanners') && (
            <div className="space-y-4">
              {(secao.type === 'bannerGrid'
                ? settings.featureBanners
                : settings.collectionBanners
              ).map((b) => {
                const lista = secao.type === 'bannerGrid' ? 'featureBanners' : 'collectionBanners';
                return (
                  <div
                    key={b.id}
                    data-campo-editor={`${lista}.${b.id}.image`}
                    className="rounded-lg border border-slate-200 p-3 transition-shadow"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Input
                        value={b.title}
                        onChange={(e) => setBanner(lista, b.id, { title: e.target.value })}
                        aria-label="Nome do banner"
                        className="!py-1 !text-[12.5px]"
                      />
                      <Toggle
                        checked={b.enabled}
                        onChange={(v) => setBanner(lista, b.id, { enabled: v })}
                        label=""
                      />
                    </div>
                    <SeletorImagens
                      unica
                      rotulo="Imagem"
                      valor={b.image ? [b.image] : []}
                      onChange={(l) => setBanner(lista, b.id, { image: l[0] ?? '' })}
                    />
                    <Field label="Para onde leva o clique" className="mt-3">
                      <Input
                        value={b.to}
                        onChange={(e) => setBanner(lista, b.id, { to: e.target.value })}
                      />
                    </Field>
                  </div>
                );
              })}
            </div>
          )}

          {secao.type === 'faq' && (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-600">
              As perguntas e respostas são editadas no painel, em{' '}
              <strong>Loja online → Menu e avisos</strong>.
            </p>
          )}

          {secao.type === 'teams' && (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-600">
              Os escudos são editados no painel, em{' '}
              <strong>Loja online → Banners e carrosséis</strong>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
