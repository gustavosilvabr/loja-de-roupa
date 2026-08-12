import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../store/AdminProvider';
import { resolveProducts } from '../store/useResolvedCatalog';
import { brl, discountPercent } from '../../lib/format';
import { isBaseSide } from '../../lib/catalog';
import type { CatalogOverrides, ProductPatch } from '../types';
import type { Variant } from '../../types';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  Toggle,
} from '../ui';
import { PainelLucro } from '../PainelLucro';
import { SeletorImagens } from '../SeletorImagens';

const TIPOS = ['Camisa', 'Acessório', 'Patch'];

const numero = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** O editor precisa abrir produtos ocultos — `resolveProducts` os esconde. */
function catalogoSemOcultos(c: CatalogOverrides): CatalogOverrides {
  const products: Record<string, ProductPatch> = {};
  for (const [h, patch] of Object.entries(c.products)) products[h] = { ...patch, hidden: false };
  return { ...c, products };
}

export default function ProdutoEditar() {
  const { handle = '' } = useParams<{ handle: string }>();
  const { catalog, setCatalog, settings } = useAdmin();
  const navigate = useNavigate();

  const produto = useMemo(
    () => resolveProducts(catalogoSemOcultos(catalog), settings.pricing).find((p) => p.handle === handle),
    [catalog, handle, settings.pricing]
  );

  const patch = catalog.products[handle];
  const criado = catalog.created.includes(handle);
  const editado = Boolean(patch && Object.keys(patch).length > 0);

  /* ---------- rascunhos: só gravam no blur, para não re-resolver 205 produtos a cada tecla ---------- */
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoBase, setPrecoBase] = useState('');
  const [precoDe, setPrecoDe] = useState('');
  const [novaTag, setNovaTag] = useState('');

  useEffect(() => {
    if (!produto) return;
    setTitulo(produto.title);
    setDescricao(produto.descriptionHtml);
    setPrecoBase(String(produto.price ?? 0));
    setPrecoDe(produto.compareAt == null ? '' : String(produto.compareAt));
  }, [produto]);

  const aplicar = (p: ProductPatch) =>
    setCatalog((c) => ({
      ...c,
      products: { ...c.products, [handle]: { ...c.products[handle], ...p } },
    }));

  const reverter = () =>
    setCatalog((c) => {
      const products = { ...c.products };
      delete products[handle];
      return { ...c, products };
    });

  const excluir = () => {
    setCatalog((c) => {
      const products = { ...c.products };
      delete products[handle];
      return {
        ...c,
        products,
        created: c.created.filter((h) => h !== handle),
        deleted: criado ? c.deleted : [...new Set([...c.deleted, handle])],
      };
    });
    navigate('/admin/produtos');
  };

  /* ---------- imagens ---------- */
  const imagens = produto?.images ?? [];

  const gravarImagens = (lista: string[]) => aplicar({ images: lista });

  /* ---------- tags ---------- */
  const tags = produto?.tags ?? [];

  const adicionarTag = () => {
    const t = novaTag.trim();
    if (!t || tags.includes(t)) return;
    aplicar({ tags: [...tags, t] });
    setNovaTag('');
  };

  /* ---------- variantes ---------- */
  const setVariante = (id: string, valor: { price?: number; available?: boolean }) =>
    aplicar({
      variantOverrides: {
        ...(patch?.variantOverrides ?? {}),
        [id]: { ...(patch?.variantOverrides?.[id] ?? {}), ...valor },
      },
    });

  const temPrecoPorVariante = Object.values(patch?.variantOverrides ?? {}).some(
    (o) => o.price !== undefined
  );

  /** Rótulo da variante-base que manda na disponibilidade de uma variante "Sim". */
  const baseDe = (v: Variant) =>
    produto?.variants.find((b) => b.o1 === v.o1 && b.o2 === 'Não')?.title ?? '—';

  if (!produto) {
    return (
      <>
        <PageHeader title="Produto não encontrado" />
        <EmptyState
          title="Esse produto não existe (ou foi excluído)"
          description={`Nenhum produto com o handle "${handle}" está disponível no catálogo.`}
          action={
            <Link
              to="/admin/produtos"
              className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-sky-700"
            >
              Voltar para produtos
            </Link>
          }
        />
      </>
    );
  }

  const desconto = discountPercent(numero(precoBase), precoDe ? numero(precoDe) : null);

  return (
    <>
      <PageHeader
        title={produto.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{handle}</span>
            {criado && <Badge tone="violet">Criado no painel</Badge>}
            {editado && !criado && <Badge tone="sky">Editado</Badge>}
            {patch?.hidden && <Badge tone="amber">Oculto na loja</Badge>}
          </span>
        }
        actions={
          <>
            <Link
              to="/admin/produtos"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>
            <a
              href={`/produtos/${handle}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver na loja
            </a>
            {criado ? (
              <ConfirmButton onConfirm={excluir} confirmLabel="Confirmar exclusão">
                Excluir produto
              </ConfirmButton>
            ) : (
              <ConfirmButton onConfirm={reverter} confirmLabel="Confirmar reversão">
                Reverter alterações
              </ConfirmButton>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
        <div className="grid gap-5">
          {/* ---------- informações ---------- */}
          <Card title="Informações" description="As alterações são salvas ao sair do campo.">
            <div className="grid gap-4">
              <Field label="Título">
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  onBlur={() => titulo.trim() && aplicar({ title: titulo.trim() })}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo">
                  <Select
                    value={produto.type}
                    onChange={(e) => aplicar({ type: e.target.value })}
                  >
                    {[...new Set([...TIPOS, produto.type])].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Handle (URL)" hint="O endereço do produto não pode ser alterado.">
                  <Input value={handle} readOnly className="bg-slate-50 text-slate-500" />
                </Field>
              </div>

              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">Tags</span>
                <div className="mb-2 flex flex-wrap gap-2">
                  {tags.length === 0 && (
                    <span className="text-[13px] text-slate-400">Nenhuma tag ainda.</span>
                  )}
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-700"
                    >
                      {t}
                      <button
                        type="button"
                        aria-label={`Remover tag ${t}`}
                        onClick={() => aplicar({ tags: tags.filter((x) => x !== t) })}
                        className="text-slate-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Field label="Nova tag" className="flex-1">
                    <Input
                      value={novaTag}
                      onChange={(e) => setNovaTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          adicionarTag();
                        }
                      }}
                      placeholder="Ex.: retro"
                    />
                  </Field>
                  <div className="self-end pb-[1px]">
                    <Button variant="secondary" onClick={adicionarTag}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              <Toggle
                checked={!patch?.hidden}
                onChange={(v) => aplicar({ hidden: !v })}
                label="Visível na loja"
                hint="Produtos ocultos somem da vitrine, mas continuam aqui no painel."
              />
            </div>
          </Card>

          {/* ---------- descrição ---------- */}
          <Card
            title="Descrição"
            description="Aceita HTML. O preview abaixo usa o mesmo estilo da página do produto."
          >
            <Field label="HTML da descrição">
              <Textarea
                rows={10}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                onBlur={() => aplicar({ descriptionHtml: descricao })}
                className="font-mono text-[13px]"
              />
            </Field>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                Preview
              </p>
              {descricao.trim() ? (
                <div className="prose-desc" dangerouslySetInnerHTML={{ __html: descricao }} />
              ) : (
                <p className="text-[13px] text-slate-400">Sem descrição.</p>
              )}
            </div>
          </Card>

          {/* ---------- variantes ---------- */}
          <Card
            title="Variantes"
            description={`${produto.variants.length} combinações de tamanho e personalização.`}
          >
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              <strong className="block font-semibold">Atenção ao estoque</strong>
              Na loja, a disponibilidade real de um tamanho vem sempre da variante com{' '}
              <strong>Personalizar: Não</strong>. As variantes “Sim” do mesmo tamanho seguem essa
              decisão, mesmo que estejam marcadas como disponíveis aqui. Para esgotar um tamanho,
              desmarque a linha “Não”.
            </div>

            {temPrecoPorVariante && (
              <p className="mb-3 text-[12px] text-slate-500">
                Há preços individuais definidos abaixo — eles têm prioridade sobre o preço base.
              </p>
            )}

            <div className="hidden gap-3 border-b border-slate-100 pb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[minmax(0,1fr)_130px_190px] md:items-center">
              <span>Variante</span>
              <span>Preço</span>
              <span>Disponibilidade</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {produto.variants.map((v) => {
                const base = isBaseSide(v);
                return (
                  <li
                    key={v.id}
                    className="flex flex-col gap-2 py-3 md:grid md:grid-cols-[minmax(0,1fr)_130px_190px] md:items-center md:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-slate-800">{v.title}</p>
                      <p className="text-[12px] text-slate-400">
                        {base ? 'Variante-base (manda no estoque)' : `Segue "${baseDe(v)}"`}
                      </p>
                    </div>

                    <Field label={<span className="md:sr-only">Preço de {v.title}</span>}>
                      <Input
                        key={`${v.id}-${v.price}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={v.price}
                        onBlur={(e) => {
                          const n = numero(e.target.value);
                          if (n !== v.price) setVariante(v.id, { price: n });
                        }}
                      />
                    </Field>

                    <Toggle
                      checked={v.available}
                      onChange={(val) => setVariante(v.id, { available: val })}
                      label={v.available ? 'Disponível' : 'Esgotado'}
                      hint={base ? undefined : 'Depende da variante "Não"'}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* ---------- coluna lateral ---------- */}
        <div className="grid gap-5">
          {/* ---------- preço ---------- */}
          <Card title="Preço">
            <div className="grid gap-4">
              <Field
                label="Preço base (R$)"
                hint="Vale para todas as variantes que não têm preço próprio."
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precoBase}
                  onChange={(e) => setPrecoBase(e.target.value)}
                  onBlur={() => aplicar({ price: numero(precoBase) })}
                />
              </Field>
              <Field label="Preço &ldquo;de&rdquo; (R$)" hint="Deixe vazio para não exibir o riscado.">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precoDe}
                  onChange={(e) => setPrecoDe(e.target.value)}
                  onBlur={() => aplicar({ compareAt: precoDe.trim() ? numero(precoDe) : null })}
                />
              </Field>
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-[13px]">
                {desconto > 0 ? (
                  <p className="text-slate-700">
                    <Badge tone="green">-{desconto}%</Badge>{' '}
                    <span className="ml-1 text-slate-400 line-through">
                      {brl(numero(precoDe))}
                    </span>{' '}
                    <strong className="text-slate-900">{brl(numero(precoBase))}</strong>
                  </p>
                ) : (
                  <p className="text-slate-500">
                    Sem desconto — o preço &ldquo;de&rdquo; precisa ser maior que o preço base.
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card
            title="Avaliação e selo"
            description="O que aparece no cartão do produto na vitrine."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nota (0 a 5)"
                hint="Deixe vazio se ainda não há avaliação."
              >
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={patch?.nota ?? ''}
                  onChange={(e) =>
                    aplicar({
                      nota: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </Field>

              <Field
                label="Quantas pessoas avaliaram"
                hint="Sem esse número as estrelas não aparecem."
              >
                <Input
                  type="number"
                  min="0"
                  value={patch?.avaliacoes ?? ''}
                  onChange={(e) =>
                    aplicar({
                      avaliacoes: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </Field>

              <Field label="Selo" hint='Ex.: "LANÇAMENTO", "MAIS VENDIDO". Vazio esconde.' className="sm:col-span-2">
                <Input
                  value={patch?.selo ?? ''}
                  onChange={(e) => aplicar({ selo: e.target.value || undefined })}
                  placeholder="LANÇAMENTO"
                />
              </Field>
            </div>

            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-900">
              Preencha a nota apenas com avaliação real de quem comprou. Nota
              inventada é review fabricada — engana o cliente e é passível de
              sanção pelo Código de Defesa do Consumidor.
            </p>
          </Card>

          <PainelLucro
            handle={produto.handle}
            custo={produto.custo ?? 0}
            precoVenda={produto.price}
          />

          {/* ---------- imagens ---------- */}
          <Card title="Imagens" description="A primeira imagem é a capa usada na vitrine.">
            <SeletorImagens
              valor={imagens}
              onChange={gravarImagens}
              rotulo="Fotos do produto"
              ajuda="As fotos ficam guardadas no navegador. Faça backup em Configurações → Dados."
            />
          </Card>
        </div>
      </div>
    </>
  );
}
