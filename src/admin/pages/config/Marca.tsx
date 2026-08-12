import { useAdmin } from '../../store/AdminProvider';
import { img } from '../../../lib/format';
import { Badge, Button, Card, Field, Input, PageHeader, Select, Toggle } from '../../ui';
import { SeletorImagens } from '../../SeletorImagens';
import type { AlinhamentoLogo, BrandSettings, WhatsAppConfig } from '../../types';

/** Telefone internacional tem no máximo 13 dígitos no formato brasileiro (55 + DDD + 9). */
const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 13);

/** 5511989609774 -> +55 (11) 98960-9774 */
function maskWhats(value: string) {
  const d = onlyDigits(value);
  if (!d) return '';
  let out = `+${d.slice(0, 2)}`;
  const ddd = d.slice(2, 4);
  const rest = d.slice(4);
  if (ddd) out += ` (${ddd})`;
  if (rest.length > 4) out += ` ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
  else if (rest) out += ` ${rest}`;
  return out;
}

function whatsError(digits: string): string | null {
  if (!digits) return 'Informe o número com DDI, DDD e o telefone.';
  if (!digits.startsWith('55')) return 'O número precisa começar com o DDI 55 (Brasil).';
  if (digits.length < 12 || digits.length > 13)
    return 'Número incompleto. Use 55 + DDD + telefone (12 ou 13 dígitos).';
  return null;
}

const POSICOES: [AlinhamentoLogo, string][] = [
  ['esquerda', 'Esquerda'],
  ['centro', 'Centro'],
  ['direita', 'Direita'],
];

/** A logo como ela aparece na loja — usada nas duas prévias. */
function PreviaLogo({ brand }: { brand: BrandSettings }) {
  if (brand.logoMode === 'imagem' && brand.logoUrl) {
    return (
      <img
        src={img(brand.logoUrl, 600)}
        alt={brand.name}
        style={{ height: `${brand.logoAltura ?? 36}px` }}
        className="w-auto max-w-[200px] object-contain"
      />
    );
  }

  return (
    <span
      style={{ fontSize: `${Math.round((brand.logoAltura ?? 36) * 0.62)}px` }}
      className="block truncate font-bold uppercase leading-none tracking-wide text-white"
    >
      {brand.name || 'Nome da loja'}
    </span>
  );
}

function BotoesAlinhamento({
  valor,
  onChange,
  nome,
}: {
  valor: AlinhamentoLogo;
  onChange: (v: AlinhamentoLogo) => void;
  nome: string;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-slate-300 p-1">
      {POSICOES.map(([opcao, rotulo]) => (
        <button
          key={opcao}
          type="button"
          onClick={() => onChange(opcao)}
          aria-pressed={valor === opcao}
          aria-label={`Alinhar à ${rotulo.toLowerCase()} no ${nome}`}
          className={`flex-1 rounded px-2 py-1.5 text-[13px] font-medium transition-colors ${
            valor === opcao ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}

export default function Marca() {
  const { settings, updateSettings } = useAdmin();
  const brand = settings.brand;

  const setBrand = (patch: Partial<BrandSettings>) =>
    updateSettings((s) => ({ ...s, brand: { ...s.brand, ...patch } }));

  const setWhats = (patch: Partial<WhatsAppConfig>) =>
    updateSettings((s) => ({ ...s, brand: { ...s.brand, whatsapp: { ...s.brand.whatsapp, ...patch } } }));

  const setHour = (index: number, value: string) =>
    setBrand({ hours: brand.hours.map((h, i) => (i === index ? value : h)) });

  const addHour = () => setBrand({ hours: [...brand.hours, ''] });
  const removeHour = (index: number) => setBrand({ hours: brand.hours.filter((_, i) => i !== index) });

  const wa = brand.whatsapp;
  const waDigits = onlyDigits(wa.number);
  const waErr = whatsError(waDigits);
  const waLink = `https://wa.me/${waDigits}?text=${encodeURIComponent(wa.message)}`;

  return (
    <>
      <PageHeader
        title="Marca e contato"
        description="Identidade da loja, canais de atendimento e o botão flutuante do WhatsApp."
      />

      <div className="grid gap-5">
        <Card title="Identidade" description="Aparece no cabeçalho, no rodapé e nas abas do navegador.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa">
              <Input
                value={brand.name}
                onChange={(e) => setBrand({ name: e.target.value })}
                placeholder="XING SUN"
              />
            </Field>

            <Field label="Slogan" hint="Frase curta que acompanha o nome.">
              <Input
                value={brand.tagline}
                onChange={(e) => setBrand({ tagline: e.target.value })}
                placeholder="Atacado de Camisas de Futebol"
              />
            </Field>

            <Field
              label="Como exibir a logo"
              hint={
                brand.logoUrl
                  ? 'Enviar um arquivo já troca para imagem; volte para texto quando quiser.'
                  : 'Assim que você enviar um arquivo, a loja passa a usar a imagem.'
              }
            >
              <Select
                value={brand.logoMode}
                onChange={(e) => setBrand({ logoMode: e.target.value as BrandSettings['logoMode'] })}
                disabled={!brand.logoUrl}
              >
                <option value="texto">Texto (nome da loja)</option>
                <option value="imagem">Imagem (arquivo enviado)</option>
              </Select>
            </Field>

            <Field
              label={`Tamanho da logo — ${brand.logoAltura ?? 36}px de altura`}
              hint="Vale para a imagem e para o nome em texto."
            >
              <input
                type="range"
                min={20}
                max={72}
                value={brand.logoAltura ?? 36}
                onChange={(e) => setBrand({ logoAltura: Number(e.target.value) })}
                className="w-full accent-sky-600"
                aria-label="Tamanho da logo"
              />
            </Field>

            <Field
              label="Posição no computador"
              hint="Telas a partir de 1024px de largura."
            >
              <BotoesAlinhamento
                valor={brand.logoAlinhamento ?? 'esquerda'}
                onChange={(v) => setBrand({ logoAlinhamento: v })}
                nome="computador"
              />
            </Field>

            <Field
              label="Posição no celular"
              hint="Independente do computador — no celular o menu vira botão e sobra espaço no meio."
            >
              <BotoesAlinhamento
                valor={brand.logoAlinhamentoMobile ?? 'centro'}
                onChange={(v) => setBrand({ logoAlinhamentoMobile: v })}
                nome="celular"
              />
            </Field>

            <Field
              label={`Espaçamento em volta — ${brand.logoEspacamento ?? 8}px`}
              hint="Impede a logo de encostar nas bordas do cabeçalho."
            >
              <input
                type="range"
                min={0}
                max={32}
                value={brand.logoEspacamento ?? 8}
                onChange={(e) => setBrand({ logoEspacamento: Number(e.target.value) })}
                className="w-full accent-sky-600"
                aria-label="Espaçamento em volta da logo"
              />
            </Field>

            <Field
              label="Favicon (emoji)"
              hint="Um único emoji. É o ícone que aparece na aba do navegador."
            >
              <Input
                value={brand.faviconEmoji}
                onChange={(e) => setBrand({ faviconEmoji: [...e.target.value].slice(-1).join('') })}
                placeholder="⚽"
                className="w-24 text-center text-[20px]"
              />
            </Field>

            <div className="sm:col-span-2">
              <SeletorImagens
                unica
                rotulo="Arquivo da logo"
                ajuda="PNG ou WebP com fundo transparente, altura mínima de 80px."
                valor={brand.logoUrl ? [brand.logoUrl] : []}
                onChange={(lista) => {
                  const url = lista[0] ?? '';
                  // Enviar um arquivo já troca o modo: ninguém envia a logo
                  // para ela continuar escondida atrás do nome em texto.
                  setBrand({ logoUrl: url, logoMode: url ? 'imagem' : 'texto' });
                }}
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[13px] font-medium text-slate-700">
              Pré-visualização no cabeçalho
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['Computador', brand.logoAlinhamento ?? 'esquerda'],
                  ['Celular', brand.logoAlinhamentoMobile ?? 'centro'],
                ] as const
              ).map(([rotulo, posicao]) => (
                <div key={rotulo}>
                  <p className="mb-1 text-[11.5px] uppercase tracking-wide text-slate-400">
                    {rotulo}
                  </p>
                  <div
                    className={`flex min-h-[72px] items-center rounded-lg bg-black px-4 ${
                      posicao === 'centro'
                        ? 'justify-center'
                        : posicao === 'direita'
                          ? 'justify-end'
                          : 'justify-start'
                    }`}
                  >
                    <div style={{ padding: `${brand.logoEspacamento ?? 8}px` }}>
                      <PreviaLogo brand={brand} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {brand.logoMode === 'imagem' && !brand.logoUrl && (
              <p className="mt-2 text-[12px] text-amber-700">
                Modo imagem selecionado, mas nenhuma URL foi informada — o nome em texto será usado.
              </p>
            )}
          </div>
        </Card>

        <Card title="Contato" description="Dados usados no rodapé, nas políticas e nas notas fiscais.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone">
              <Input
                type="tel"
                value={brand.phone}
                onChange={(e) => setBrand({ phone: e.target.value })}
                placeholder="11 98960-9774"
              />
            </Field>

            <Field label="E-mail">
              <Input
                type="email"
                value={brand.email}
                onChange={(e) => setBrand({ email: e.target.value })}
                placeholder="contato@sualoja.com"
              />
            </Field>

            <Field label="CNPJ" hint="Opcional, mas recomendado para gerar confiança.">
              <Input
                value={brand.cnpj}
                onChange={(e) => setBrand({ cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
              />
            </Field>

            <Field label="Endereço">
              <Input
                value={brand.address}
                onChange={(e) => setBrand({ address: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Horários de atendimento"
          description="Uma linha por faixa de horário."
          actions={
            <Button variant="secondary" onClick={addHour}>
              Adicionar horário
            </Button>
          }
        >
          {brand.hours.length === 0 ? (
            <p className="text-[13px] text-slate-500">
              Nenhum horário cadastrado. O rodapé não exibirá a seção de atendimento.
            </p>
          ) : (
            <ul className="grid gap-2">
              {brand.hours.map((hour, i) => (
                <li key={i} className="flex items-end gap-2">
                  <Field label={`Linha ${i + 1}`} className="min-w-0 flex-1">
                    <Input
                      value={hour}
                      onChange={(e) => setHour(i, e.target.value)}
                      placeholder="Seg. à Sex. 09:00h às 18:30h"
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    onClick={() => removeHour(i)}
                    aria-label={`Remover horário ${i + 1}`}
                    className="shrink-0"
                  >
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Redes sociais" description="Deixe em branco para esconder o ícone no rodapé.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Instagram">
              <Input
                type="url"
                value={brand.instagram}
                onChange={(e) => setBrand({ instagram: e.target.value })}
                placeholder="https://instagram.com/sualoja"
              />
            </Field>
            <Field label="Facebook">
              <Input
                type="url"
                value={brand.facebook}
                onChange={(e) => setBrand({ facebook: e.target.value })}
                placeholder="https://facebook.com/sualoja"
              />
            </Field>
            <Field label="TikTok">
              <Input
                type="url"
                value={brand.tiktok}
                onChange={(e) => setBrand({ tiktok: e.target.value })}
                placeholder="https://tiktok.com/@sualoja"
              />
            </Field>
          </div>
        </Card>

        <Card
          title="WhatsApp flutuante"
          description="Botão fixo que abre a conversa já com uma mensagem pronta."
          actions={wa.enabled ? <Badge tone="green">Ativo</Badge> : <Badge>Desativado</Badge>}
        >
          <div className="grid gap-5">
            <Toggle
              checked={wa.enabled}
              onChange={(v) => setWhats({ enabled: v })}
              label="Exibir o botão do WhatsApp na loja"
              hint="Aparece em todas as páginas, inclusive no celular."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Número com DDI"
                hint="Somente números. Ex.: 55 11 98960-9774."
                error={waErr}
              >
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={maskWhats(wa.number)}
                  onChange={(e) => setWhats({ number: onlyDigits(e.target.value) })}
                  placeholder="+55 (11) 98960-9774"
                />
              </Field>

              <Field label="Posição na tela">
                <Select
                  value={wa.position}
                  onChange={(e) => setWhats({ position: e.target.value as WhatsAppConfig['position'] })}
                >
                  <option value="right">Canto inferior direito</option>
                  <option value="left">Canto inferior esquerdo</option>
                </Select>
              </Field>

              <Field label="Texto do balão" hint="Aparece ao lado do ícone no computador.">
                <Input
                  value={wa.greeting}
                  onChange={(e) => setWhats({ greeting: e.target.value })}
                  placeholder="Fale com a gente"
                />
              </Field>

              <Field label="Mensagem pré-preenchida" hint="Já vem digitada na conversa do cliente.">
                <Input
                  value={wa.message}
                  onChange={(e) => setWhats({ message: e.target.value })}
                  placeholder="Olá! Vim pelo site e quero saber mais."
                />
              </Field>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[13px] font-medium text-slate-700">Link gerado</p>
              {waErr ? (
                <p className="mt-1 text-[13px] text-red-600">
                  Corrija o número para gerar um link válido.
                </p>
              ) : (
                <>
                  <code className="mt-1 block break-all text-[12px] text-slate-600">{waLink}</code>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-[13px] font-semibold text-sky-700 hover:underline"
                  >
                    Testar em uma nova aba
                  </a>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
