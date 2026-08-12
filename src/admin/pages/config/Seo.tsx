import { useAdmin } from '../../store/AdminProvider';
import { Badge, Card, Field, Input, PageHeader, Select, Textarea } from '../../ui';
import type { SeoSettings } from '../../types';

const TITLE_MAX = 60;
const DESC_MAX = 160;

/** Corta no limite do Google acrescentando reticências, como no resultado real. */
const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export default function Seo() {
  const { settings, updateSettings } = useAdmin();
  const seo = settings.seo;
  const domain = settings.domain.primary || 'sualoja.com';

  const setSeo = (patch: Partial<SeoSettings>) =>
    updateSettings((s) => ({ ...s, seo: { ...s.seo, ...patch } }));

  const titleLen = seo.title.length;
  const descLen = seo.description.length;
  const descLonga = descLen > DESC_MAX;
  const noindex = seo.robots === 'noindex,nofollow';

  return (
    <>
      <PageHeader
        title="SEO"
        description="Como a loja aparece no Google e ao ser compartilhada nas redes."
        actions={noindex ? <Badge tone="red">Fora do Google</Badge> : <Badge tone="green">Indexável</Badge>}
      />

      <div className="grid gap-5">
        <Card title="Resultado no Google" description="Simulação do que o cliente vê na busca.">
          <div className="max-w-[600px] rounded-lg border border-slate-200 bg-white px-4 py-3 font-[system-ui]">
            <p className="truncate text-[12px] text-emerald-700">
              https://{domain} <span className="text-slate-400">›</span> loja
            </p>
            <p className="mt-0.5 cursor-pointer text-[18px] leading-snug text-[#1a0dab] hover:underline">
              {truncate(seo.title || 'Título da sua loja', TITLE_MAX)}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
              {truncate(
                seo.description || 'Escreva uma descrição convidativa para atrair cliques.',
                DESC_MAX
              )}
            </p>
          </div>

          {noindex && (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-800">
              Com <code className="rounded bg-red-100 px-1.5 py-0.5">noindex,nofollow</code> ligado a
              loja não aparece em busca nenhuma. Use só enquanto o site estiver em construção.
            </p>
          )}
        </Card>

        <Card title="Título e descrição" description="Os dois campos que mais influenciam o clique.">
          <div className="grid gap-4">
            <Field
              label="Título da página inicial"
              hint={`${titleLen} de ~${TITLE_MAX} caracteres visíveis no Google.`}
              error={
                titleLen > TITLE_MAX
                  ? `O Google corta o título perto de ${TITLE_MAX} caracteres — o final ficará escondido.`
                  : null
              }
            >
              <Input
                value={seo.title}
                onChange={(e) => setSeo({ title: e.target.value })}
                placeholder="XING SUN - Atacado de Camisas de Futebol"
              />
            </Field>

            <Field
              label="Meta description"
              hint={
                descLonga
                  ? undefined
                  : `${descLen} de ${DESC_MAX} caracteres. O ideal fica entre 120 e 160.`
              }
              error={
                descLonga
                  ? `${descLen} caracteres: passou de ${DESC_MAX} e o Google vai cortar o final.`
                  : null
              }
            >
              <Textarea
                rows={3}
                value={seo.description}
                onChange={(e) => setSeo({ description: e.target.value })}
                placeholder="Camisas de futebol no atacado com pronta entrega..."
              />
            </Field>

            <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  descLonga ? 'bg-red-500' : descLen >= 120 ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (descLen / DESC_MAX) * 100)}%` }}
              />
            </div>

            <Field
              label="Palavras-chave"
              hint="Separadas por vírgula. O Google ignora esta tag há anos, mas outros buscadores ainda leem."
            >
              <Input
                value={seo.keywords}
                onChange={(e) => setSeo({ keywords: e.target.value })}
                placeholder="camisa de futebol, atacado, retrô"
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Imagem de compartilhamento"
          description="Usada quando o link da loja é colado no WhatsApp, Instagram ou Facebook."
        >
          <Field label="URL da imagem (Open Graph)" hint="Proporção 1200x630px para não cortar nada.">
            <Input
              type="url"
              value={seo.ogImage}
              onChange={(e) => setSeo({ ogImage: e.target.value })}
              placeholder="https://..."
            />
          </Field>

          {seo.ogImage ? (
            <div className="mt-4 max-w-[420px] overflow-hidden rounded-lg border border-slate-200">
              <img
                src={seo.ogImage}
                alt="Pré-visualização da imagem de compartilhamento"
                className="aspect-[1200/630] w-full bg-slate-100 object-cover"
              />
              <div className="bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{domain}</p>
                <p className="truncate text-[13px] font-semibold text-slate-800">
                  {seo.title || 'Título da sua loja'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-slate-500">
              Sem imagem definida, as redes escolhem qualquer figura da página — normalmente a errada.
            </p>
          )}
        </Card>

        <Card title="Indexação" description="Controle se os buscadores podem listar a loja.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Robots">
              <Select
                value={seo.robots}
                onChange={(e) => setSeo({ robots: e.target.value as SeoSettings['robots'] })}
              >
                <option value="index,follow">index,follow — aparecer no Google</option>
                <option value="noindex,nofollow">noindex,nofollow — esconder dos buscadores</option>
              </Select>
            </Field>

            <Field
              label="Verificação do Google Search Console"
              hint="Cole apenas o conteúdo da meta tag google-site-verification."
            >
              <Input
                value={seo.gscVerification}
                onChange={(e) => setSeo({ gscVerification: e.target.value.trim() })}
                placeholder="AbC123..."
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
          </div>

          {seo.gscVerification && (
            <p className="mt-4 break-all rounded-lg bg-slate-50 px-4 py-3 text-[12px] text-slate-600">
              Tag gerada:{' '}
              <code>{`<meta name="google-site-verification" content="${seo.gscVerification}" />`}</code>
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
