import { useState } from 'react';
import { useAdmin } from '../../store/AdminProvider';
import { Badge, Button, Card, Field, Input, PageHeader, Toggle } from '../../ui';
import type { DomainSettings } from '../../types';

/** Aceita "loja.com.br" e subdomínios, rejeita protocolo, barra e espaços. */
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

/** Remove protocolo, caminho e www para guardar sempre o domínio puro. */
const cleanDomain = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\s+/g, '');

export default function Dominio() {
  const { settings, updateSettings } = useAdmin();
  const domain = settings.domain;
  const [novo, setNovo] = useState('');

  const setDomain = (patch: Partial<DomainSettings>) =>
    updateSettings((s) => ({ ...s, domain: { ...s.domain, ...patch } }));

  const primaryValid = !domain.primary || DOMAIN_RE.test(domain.primary);

  const novoLimpo = cleanDomain(novo);
  const jaExiste =
    novoLimpo === domain.primary || domain.customDomains.includes(novoLimpo);
  const novoErro = !novoLimpo
    ? null
    : !DOMAIN_RE.test(novoLimpo)
      ? 'Domínio inválido. Use apenas o endereço, como loja.com.br.'
      : jaExiste
        ? 'Este domínio já está na lista.'
        : null;

  const addDomain = () => {
    if (!novoLimpo || novoErro) return;
    setDomain({ customDomains: [...domain.customDomains, novoLimpo] });
    setNovo('');
  };

  const removeDomain = (value: string) =>
    setDomain({ customDomains: domain.customDomains.filter((d) => d !== value) });

  const url = `${domain.forceHttps ? 'https' : 'http'}://${domain.primary || 'seudominio.com'}`;

  return (
    <>
      <PageHeader
        title="Domínio"
        description="Endereço público da loja, redirecionamentos e configuração de DNS."
      />

      <div className="grid gap-5">
        <Card title="Domínio principal" description="É o endereço canônico usado em links e no SEO.">
          <div className="grid gap-4">
            <Field
              label="Domínio"
              hint="Sem http:// e sem barra no final."
              error={primaryValid ? null : 'Formato inválido. Exemplo: xingestoque.com'}
            >
              <Input
                value={domain.primary}
                onChange={(e) => setDomain({ primary: cleanDomain(e.target.value) })}
                placeholder="xingestoque.com"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>

            <p className="text-[13px] text-slate-600">
              A loja responderá em <code className="rounded bg-slate-100 px-1.5 py-0.5">{url}</code>
            </p>

            <div className="grid gap-3 border-t border-slate-100 pt-4">
              <Toggle
                checked={domain.redirectWww}
                onChange={(v) => setDomain({ redirectWww: v })}
                label="Redirecionar www para o domínio principal"
                hint="Evita conteúdo duplicado: www.seudominio.com passa a apontar para seudominio.com."
              />
              <Toggle
                checked={domain.forceHttps}
                onChange={(v) => setDomain({ forceHttps: v })}
                label="Forçar HTTPS"
                hint="Todo acesso em http:// é redirecionado para https://. Mantenha ligado."
              />
            </div>
          </div>
        </Card>

        <Card
          title="Domínios adicionais"
          description="Endereços extras que redirecionam para o domínio principal."
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Novo domínio" error={novoErro} className="min-w-0 flex-1">
              <Input
                value={novo}
                onChange={(e) => setNovo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDomain();
                  }
                }}
                placeholder="xingsun.com.br"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Button onClick={addDomain} disabled={!novoLimpo || !!novoErro} className="shrink-0">
              Adicionar
            </Button>
          </div>

          {domain.customDomains.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {domain.customDomains.map((d) => (
                <li
                  key={d}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span className="min-w-0 truncate text-[14px] text-slate-800">{d}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone="sky">redireciona</Badge>
                    <Button
                      variant="ghost"
                      onClick={() => removeDomain(d)}
                      aria-label={`Remover o domínio ${d}`}
                    >
                      Remover
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Como apontar o domínio"
          description="Configure estes registros no painel de quem registrou o domínio (Registro.br, GoDaddy, Cloudflare...)."
        >
          <div className="grid gap-5 text-[13px] leading-relaxed text-slate-700">
            <p>
              O domínio precisa de dois registros: um <strong>A</strong> para a raiz (o domínio sem
              www) e um <strong>CNAME</strong> para o subdomínio www. A propagação do DNS costuma
              levar de alguns minutos até 48 horas.
            </p>

            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-slate-900">Se a loja está na Vercel</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Nome</th>
                      <th className="py-2 font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 pr-3">A</td>
                      <td className="py-2 pr-3">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5">@</code>
                      </td>
                      <td className="py-2">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5">76.76.21.21</code>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3">CNAME</td>
                      <td className="py-2 pr-3">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5">www</code>
                      </td>
                      <td className="py-2">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5">cname.vercel-dns.com</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[12px] text-slate-500">
                Depois de criar os registros, adicione o domínio em Project Settings › Domains na
                Vercel para que o certificado HTTPS seja emitido.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-slate-900">Se a loja está na Netlify</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Nome</th>
                      <th className="py-2 font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 pr-3">A</td>
                      <td className="py-2 pr-3">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5">@</code>
                      </td>
                      <td className="py-2">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5">75.2.60.5</code>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3">CNAME</td>
                      <td className="py-2 pr-3">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5">www</code>
                      </td>
                      <td className="py-2">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5">
                          seu-site.netlify.app
                        </code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[12px] text-slate-500">
                Troque <code className="rounded bg-slate-100 px-1 py-0.5">seu-site</code> pelo nome
                real do site na Netlify.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <p className="font-semibold">Atenção</p>
              <p className="mt-1">
                Alguns provedores não aceitam CNAME na raiz do domínio. Se o seu DNS oferecer
                <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5">ALIAS</code> ou
                <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5">ANAME</code>, prefira esse
                tipo em vez do registro A — assim o IP pode mudar sem quebrar o site.
              </p>
            </div>

            <p className="text-[12px] text-slate-500">
              As opções desta tela ficam salvas no painel. Elas descrevem a configuração desejada,
              mas o redirecionamento em si acontece no DNS e na hospedagem.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
