import { useAdmin } from '../../store/AdminProvider';
import { Badge, Card, Field, Input, PageHeader, Toggle } from '../../ui';
import type { IntegrationSettings } from '../../types';

type PixelKey = Exclude<keyof IntegrationSettings, 'requireConsent'>;

interface PixelDef {
  key: PixelKey;
  label: string;
  placeholder: string;
  hint: string;
  /** Retorna a mensagem de erro ou null quando o formato está correto. */
  validate: (v: string) => string | null;
}

const PIXELS: PixelDef[] = [
  {
    key: 'facebookPixel',
    label: 'Facebook / Meta Pixel ID',
    placeholder: '1234567890123456',
    hint: 'Só números, entre 15 e 16 dígitos. Está no Gerenciador de Eventos da Meta.',
    validate: (v) =>
      /^\d{15,16}$/.test(v) ? null : 'O ID da Meta é composto apenas por 15 ou 16 números.',
  },
  {
    key: 'ga4',
    label: 'Google Analytics 4 (Measurement ID)',
    placeholder: 'G-XXXXXXXXXX',
    hint: 'Começa com G-. Fica em Admin › Fluxos de dados.',
    validate: (v) =>
      /^G-[A-Z0-9]{6,12}$/.test(v)
        ? null
        : 'O ID do GA4 começa com G- seguido de letras e números maiúsculos.',
  },
  {
    key: 'gtm',
    label: 'Google Tag Manager ID',
    placeholder: 'GTM-XXXXXXX',
    hint: 'Começa com GTM-. Use se preferir gerenciar todas as tags por lá.',
    validate: (v) =>
      /^GTM-[A-Z0-9]{6,9}$/.test(v) ? null : 'O ID do GTM começa com GTM- seguido de 6 a 9 caracteres.',
  },
  {
    key: 'tiktokPixel',
    label: 'TikTok Pixel ID',
    placeholder: 'CABCDEFGHIJKLMNOPQRS',
    hint: 'Sequência de 20 caracteres alfanuméricos maiúsculos.',
    validate: (v) =>
      /^[A-Z0-9]{15,25}$/.test(v) ? null : 'O ID do TikTok tem cerca de 20 letras e números maiúsculos.',
  },
  {
    key: 'hotjar',
    label: 'Hotjar Site ID',
    placeholder: '3456789',
    hint: 'Somente números, entre 6 e 9 dígitos. Grava a navegação do visitante.',
    validate: (v) => (/^\d{6,9}$/.test(v) ? null : 'O Site ID do Hotjar é composto só por números.'),
  },
];

export default function Pixels() {
  const { settings, updateSettings } = useAdmin();
  const integ = settings.integrations;

  const setInteg = (patch: Partial<IntegrationSettings>) =>
    updateSettings((s) => ({ ...s, integrations: { ...s.integrations, ...patch } }));

  const setPixel = (key: PixelKey, value: string) =>
    updateSettings((s) => {
      const integrations: IntegrationSettings = { ...s.integrations };
      integrations[key] = value;
      return { ...s, integrations };
    });

  const configurados = PIXELS.filter((p) => integ[p.key].trim().length > 0);
  const comErro = configurados.filter((p) => p.validate(integ[p.key].trim()) !== null);

  return (
    <>
      <PageHeader
        title="Pixels e analytics"
        description="Rastreamento de campanhas e comportamento dos visitantes."
        actions={
          comErro.length > 0 ? (
            <Badge tone="red">
              {comErro.length} {comErro.length === 1 ? 'ID inválido' : 'IDs inválidos'}
            </Badge>
          ) : (
            <Badge tone="green">{configurados.length} ativos</Badge>
          )
        }
      />

      <div className="grid gap-5">
        <Card
          title="Consentimento (LGPD)"
          description="Regra que decide quando os scripts podem ser carregados."
        >
          <Toggle
            checked={integ.requireConsent}
            onChange={(v) => setInteg({ requireConsent: v })}
            label="Exigir consentimento antes de carregar os scripts"
            hint="Recomendado. Nenhum pixel é injetado até o visitante aceitar o banner de cookies."
          />

          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] leading-relaxed text-sky-900">
            <p className="font-semibold">Por que deixar ligado</p>
            <p className="mt-1">
              A LGPD (Lei 13.709/2018) trata identificadores de navegação como dado pessoal. Pixels
              de marketing e análise não se enquadram como cookies estritamente necessários, então
              precisam de base legal — na prática, o consentimento do visitante antes do
              carregamento.
            </p>
            <p className="mt-2">
              Carregar depois do aceite muda pouco na medição, porque o evento de sessão é disparado
              logo em seguida, e evita registrar quem recusou.
            </p>
          </div>

          {!integ.requireConsent && (
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              Com a exigência desligada, os scripts sobem no primeiro acesso, antes de qualquer
              escolha do visitante. Só faça isso com orientação jurídica.
            </p>
          )}
        </Card>

        <Card title="Identificadores" description="Deixe em branco o que você não usa.">
          <div className="grid gap-4">
            {PIXELS.map((p) => {
              const raw = integ[p.key];
              const value = raw.trim();
              const erro = value ? p.validate(value) : null;

              return (
                <Field key={p.key} label={p.label} hint={erro ? undefined : p.hint} error={erro}>
                  <Input
                    value={raw}
                    onChange={(e) => setPixel(p.key, e.target.value.trim())}
                    placeholder={p.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Field>
              );
            })}
          </div>
        </Card>

        <Card title="Ordem de carregamento" description="O que a loja faz com o que está preenchido.">
          <ol className="grid gap-2 text-[13px] leading-relaxed text-slate-600">
            <li>
              <strong className="text-slate-800">1.</strong> O visitante abre a loja e vê o banner de
              cookies {integ.requireConsent ? '(obrigatório neste modo)' : '(informativo neste modo)'}.
            </li>
            <li>
              <strong className="text-slate-800">2.</strong>{' '}
              {integ.requireConsent
                ? 'Após o aceite, os scripts preenchidos acima são injetados no <head>.'
                : 'Os scripts preenchidos acima são injetados imediatamente.'}
            </li>
            <li>
              <strong className="text-slate-800">3.</strong> Eventos de visualização de produto,
              carrinho e compra passam a ser enviados para cada plataforma ativa.
            </li>
          </ol>
          <p className="mt-4 text-[12px] text-slate-500">
            Se você usa o Google Tag Manager, prefira cadastrar GA4 e Meta dentro dele e deixar os
            campos aqui em branco — assim a mesma tag não dispara duas vezes.
          </p>
        </Card>
      </div>
    </>
  );
}
