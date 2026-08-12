import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../store/AdminProvider';
import { useCatalog } from '../store/useResolvedCatalog';
import { brl, img, normalize } from '../../lib/format';
import {
  COR_NIVEL,
  ROTULO_NIVEL,
  calcularLucro,
  markupNecessario,
  precoParaMargem,
  type ResultadoLucro,
} from '../../lib/precos';
import {
  Button,
  Card,
  ConfirmButton,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
} from '../ui';
import type { PricingSettings } from '../types';

type Ordem = 'margem-asc' | 'margem-desc' | 'lucro-desc' | 'nome';

const POR_PAGINA = 25;

export default function Precos() {
  const { settings, updateSettings, catalog, setCatalog } = useAdmin();
  const { products } = useCatalog();
  const pricing = settings.pricing;

  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('margem-asc');
  const [pagina, setPagina] = useState(1);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [markupLote, setMarkupLote] = useState(String(pricing.markupPadrao));

  const setPricing = (patch: Partial<PricingSettings>) =>
    updateSettings((s) => ({ ...s, pricing: { ...s.pricing, ...patch } }));

  const faixas = { boa: pricing.margemBoa, moderada: pricing.margemModerada };

  /** O frete só entra no custo quando a loja o absorve. */
  const fretePago = (precoVenda: number) =>
    pricing.freteGratisAcima > 0 && precoVenda >= pricing.freteGratisAcima
      ? pricing.freteMedio
      : 0;

  const analise = useMemo(() => {
    return products.map((p) => {
      const custo = p.custo ?? 0;
      const resultado = calcularLucro(
        {
          custo,
          precoVenda: p.price,
          fretePago: fretePago(p.price),
          taxaGateway: pricing.taxaGateway,
          taxaFixa: pricing.taxaFixa,
          imposto: pricing.imposto,
          outrosCustos: pricing.outrosCustos,
        },
        faixas
      );
      return { produto: p, resultado };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, pricing]);

  const filtrados = useMemo(() => {
    const q = normalize(busca).trim();
    let lista = q ? analise.filter((a) => normalize(a.produto.title).includes(q)) : analise;

    lista = [...lista];
    switch (ordem) {
      case 'margem-asc':
        lista.sort((a, b) => a.resultado.margem - b.resultado.margem);
        break;
      case 'margem-desc':
        lista.sort((a, b) => b.resultado.margem - a.resultado.margem);
        break;
      case 'lucro-desc':
        lista.sort((a, b) => b.resultado.lucro - a.resultado.lucro);
        break;
      case 'nome':
        lista.sort((a, b) => a.produto.title.localeCompare(b.produto.title, 'pt-BR'));
        break;
    }
    return lista;
  }, [analise, busca, ordem]);

  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));

  const resumo = useMemo(() => {
    const contagem = { bom: 0, moderado: 0, baixo: 0, prejuizo: 0 };
    let lucroTotal = 0;
    for (const a of analise) {
      contagem[a.resultado.nivel] += 1;
      lucroTotal += a.resultado.lucro;
    }
    return {
      ...contagem,
      lucroMedio: analise.length ? lucroTotal / analise.length : 0,
      margemMedia: analise.length
        ? analise.reduce((s, a) => s + a.resultado.margem, 0) / analise.length
        : 0,
    };
  }, [analise]);

  const alternarSelecao = (handle: string) =>
    setSelecionados((s) => {
      const novo = new Set(s);
      if (novo.has(handle)) novo.delete(handle);
      else novo.add(handle);
      return novo;
    });

  const selecionarVisiveis = () =>
    setSelecionados(new Set(paginados.map((a) => a.produto.handle)));

  const selecionarTodos = () =>
    setSelecionados(new Set(filtrados.map((a) => a.produto.handle)));

  const aplicarMarkupLote = () => {
    const valor = Number(markupLote.replace(',', '.'));
    if (!Number.isFinite(valor) || valor < 0 || selecionados.size === 0) return;

    setCatalog((c) => {
      const produtos = { ...c.products };
      for (const handle of selecionados) {
        // Remove preço fixo: senão o markup não teria efeito.
        const { price: _ignorado, ...resto } = produtos[handle] ?? {};
        produtos[handle] = { ...resto, markup: valor };
      }
      return { ...c, products: produtos };
    });
    setSelecionados(new Set());
  };

  const limparMarkupsIndividuais = () =>
    setCatalog((c) => {
      const produtos = { ...c.products };
      for (const handle of Object.keys(produtos)) {
        const { markup: _m, price: _p, ...resto } = produtos[handle];
        produtos[handle] = resto;
      }
      return { ...c, products: produtos };
    });

  const comMarkupProprio = Object.values(catalog.products).filter(
    (p) => p.markup !== undefined || p.price !== undefined
  ).length;

  return (
    <>
      <PageHeader
        title="Preços e lucro"
        description="Quanto você paga, quanto cobra e quanto sobra em cada peça."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Lucro bom" value={resumo.bom} hint="Verde" />
        <StatCard label="Lucro moderado" value={resumo.moderado} hint="Amarelo" />
        <StatCard label="Lucro baixo" value={resumo.baixo} hint="Laranja" />
        <StatCard label="No prejuízo" value={resumo.prejuizo} hint="Vermelho" />
      </div>

      <Card
        className="mb-6"
        title="Regra de preço"
        description={`Markup de ${pricing.markupPadrao}% — uma peça de ${brl(80)} sai por ${brl(
          Math.round(80 * (1 + pricing.markupPadrao / 100) * 100) / 100
        )}.`}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field
            label="Markup padrão (%)"
            hint="100% dobra o preço; 125% faz 80 virar 180"
          >
            <Input
              type="number"
              min={0}
              value={pricing.markupPadrao}
              onChange={(e) => setPricing({ markupPadrao: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Terminar preço em" hint="Ex.: 0,90. Use 0 para não arredondar">
            <Input
              type="number"
              step="0.01"
              min={0}
              max={0.99}
              value={pricing.arredondarPara}
              onChange={(e) => setPricing({ arredondarPara: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Taxa do gateway (%)" hint="Mercado Pago ~4,99 · PIX ~0,99">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={pricing.taxaGateway}
              onChange={(e) => setPricing({ taxaGateway: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Taxa fixa por venda (R$)">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={pricing.taxaFixa}
              onChange={(e) => setPricing({ taxaFixa: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Frete médio (R$)" hint="Só entra na conta se a loja pagar">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={pricing.freteMedio}
              onChange={(e) => setPricing({ freteMedio: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Frete grátis acima de (R$)" hint="0 = o cliente sempre paga">
            <Input
              type="number"
              step="1"
              min={0}
              value={pricing.freteGratisAcima}
              onChange={(e) => setPricing({ freteGratisAcima: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Embalagem e outros (R$)">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={pricing.outrosCustos}
              onChange={(e) => setPricing({ outrosCustos: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Imposto (%)">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={pricing.imposto}
              onChange={(e) => setPricing({ imposto: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Margem boa a partir de (%)" hint="Fica verde">
            <Input
              type="number"
              min={0}
              value={pricing.margemBoa}
              onChange={(e) => setPricing({ margemBoa: Number(e.target.value) || 0 })}
            />
          </Field>

          <Field label="Margem moderada a partir de (%)" hint="Fica amarelo">
            <Input
              type="number"
              min={0}
              value={pricing.margemModerada}
              onChange={(e) => setPricing({ margemModerada: Number(e.target.value) || 0 })}
            />
          </Field>
        </div>

        <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
          Margem média do catálogo:{' '}
          <strong className="text-slate-900">{resumo.margemMedia.toFixed(1)}%</strong> · lucro médio
          por peça: <strong className="text-slate-900">{brl(resumo.lucroMedio)}</strong>
        </p>
      </Card>

      <Card
        className="mb-6"
        title="Mudar vários de uma vez"
        description={`${selecionados.size} selecionado${selecionados.size === 1 ? '' : 's'}`}
        actions={
          comMarkupProprio > 0 ? (
            <ConfirmButton onConfirm={limparMarkupsIndividuais} confirmLabel="Limpar todos">
              Voltar {comMarkupProprio} ao markup padrão
            </ConfirmButton>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Markup a aplicar (%)" className="w-[180px]">
            <Input
              type="number"
              min={0}
              value={markupLote}
              onChange={(e) => setMarkupLote(e.target.value)}
            />
          </Field>

          <Button onClick={aplicarMarkupLote} disabled={selecionados.size === 0}>
            Aplicar aos {selecionados.size} selecionados
          </Button>
          <Button variant="secondary" onClick={selecionarVisiveis}>
            Selecionar os {paginados.length} desta página
          </Button>
          <Button variant="secondary" onClick={selecionarTodos}>
            Selecionar todos os {filtrados.length}
          </Button>
          {selecionados.size > 0 && (
            <Button variant="ghost" onClick={() => setSelecionados(new Set())}>
              Limpar seleção
            </Button>
          )}
        </div>

        {selecionados.size > 0 && (
          <PreviaLote
            markup={Number(markupLote.replace(',', '.')) || 0}
            handles={selecionados}
            analise={analise}
            pricing={pricing}
            fretePago={fretePago}
          />
        )}
      </Card>

      <Card
        title={`${filtrados.length} produtos`}
        actions={
          <>
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar produto"
              aria-label="Buscar produto"
              className="!w-[200px]"
            />
            <Select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as Ordem)}
              aria-label="Ordenar"
              className="!w-auto"
            >
              <option value="margem-asc">Pior margem primeiro</option>
              <option value="margem-desc">Melhor margem primeiro</option>
              <option value="lucro-desc">Maior lucro em reais</option>
              <option value="nome">Nome A-Z</option>
            </Select>
          </>
        }
      >
        <ul className="divide-y divide-slate-100">
          {paginados.map(({ produto, resultado }) => {
            const cor = COR_NIVEL[resultado.nivel];
            const proprio = catalog.products[produto.handle];
            const markupAplicado =
              proprio?.markup !== undefined ? proprio.markup : pricing.markupPadrao;

            return (
              <li key={produto.handle} className="flex flex-wrap items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={selecionados.has(produto.handle)}
                  onChange={() => alternarSelecao(produto.handle)}
                  aria-label={`Selecionar ${produto.title}`}
                  className="h-4 w-4 shrink-0 accent-sky-600"
                />

                <img
                  src={img(produto.image, 80)}
                  alt=""
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded object-cover"
                />

                <div className="min-w-[180px] flex-1">
                  <Link
                    to={`/admin/produtos/${produto.handle}`}
                    className="line-clamp-1 text-[13.5px] font-medium text-slate-900 hover:text-sky-600"
                  >
                    {produto.title}
                  </Link>
                  <span className="text-[11.5px] text-slate-500">
                    markup {markupAplicado}%
                    {proprio?.price !== undefined && ' · preço fixo'}
                  </span>
                </div>

                <dl className="flex shrink-0 gap-4 text-right text-[12px]">
                  <div>
                    <dt className="text-slate-400">Custo</dt>
                    <dd className="font-medium tabular-nums text-slate-700">
                      {brl(resultado.custo)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Venda</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">
                      {brl(resultado.precoVenda)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Custos</dt>
                    <dd className="tabular-nums text-slate-500">
                      −{brl(resultado.taxas + resultado.frete + resultado.imposto + resultado.outros)}
                    </dd>
                  </div>
                  <div className="min-w-[74px]">
                    <dt className="text-slate-400">Sobra</dt>
                    <dd className={`font-bold tabular-nums ${cor.texto}`}>
                      {brl(resultado.lucro)}
                    </dd>
                  </div>
                </dl>

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${cor.fundo} ${cor.texto}`}
                  title={`Margem de ${resultado.margem}%`}
                >
                  <span className={`h-2 w-2 rounded-full ${cor.ponto}`} />
                  {ROTULO_NIVEL[resultado.nivel]} · {resultado.margem}%
                </span>
              </li>
            );
          })}
        </ul>

        {totalPaginas > 1 && (
          <nav
            aria-label="Paginação"
            className="mt-4 flex items-center justify-center gap-3 border-t border-slate-100 pt-4"
          >
            <Button
              variant="secondary"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >
              Anterior
            </Button>
            <span className="text-[13px] tabular-nums text-slate-500">
              {pagina} / {totalPaginas}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
            >
              Próxima
            </Button>
          </nav>
        )}
      </Card>

      <Card className="mt-6" title="Como a conta é feita">
        <p className="text-[13px] leading-relaxed text-slate-600">
          <strong className="text-slate-800">Sobra</strong> = preço de venda − custo do fornecedor −
          taxa do gateway − frete absorvido − imposto − embalagem.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
          A <strong className="text-slate-800">margem</strong> é a sobra dividida pelo preço de
          venda. É ela que classifica a cor, porque é o que sobra de cada real que entra no caixa —
          diferente do markup, que compara com o custo e sempre parece maior.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
          Com markup de {pricing.markupPadrao}% e taxa de {pricing.taxaGateway}%, uma peça de{' '}
          {brl(80)} vendida a{' '}
          {brl(Math.round(80 * (1 + pricing.markupPadrao / 100) * 100) / 100)} deixa margem de
          aproximadamente{' '}
          {
            calcularLucro(
              {
                custo: 80,
                precoVenda: Math.round(80 * (1 + pricing.markupPadrao / 100) * 100) / 100,
                fretePago: 0,
                taxaGateway: pricing.taxaGateway,
                taxaFixa: pricing.taxaFixa,
                imposto: pricing.imposto,
                outrosCustos: pricing.outrosCustos,
              },
              faixas
            ).margem
          }
          %.
        </p>
      </Card>
    </>
  );
}

/** Mostra o efeito do markup escolhido antes de aplicar. */
function PreviaLote({
  markup,
  handles,
  analise,
  pricing,
  fretePago,
}: {
  markup: number;
  handles: Set<string>;
  analise: { produto: { handle: string; custo?: number }; resultado: ResultadoLucro }[];
  pricing: PricingSettings;
  fretePago: (preco: number) => number;
}) {
  const alvo = analise.filter((a) => handles.has(a.produto.handle));
  if (alvo.length === 0) return null;

  const faixas = { boa: pricing.margemBoa, moderada: pricing.margemModerada };

  let somaMargem = 0;
  let piores = 0;
  for (const a of alvo) {
    const custo = a.produto.custo ?? 0;
    const novoPreco = Math.round(custo * (1 + markup / 100) * 100) / 100;
    const r = calcularLucro(
      {
        custo,
        precoVenda: novoPreco,
        fretePago: fretePago(novoPreco),
        taxaGateway: pricing.taxaGateway,
        taxaFixa: pricing.taxaFixa,
        imposto: pricing.imposto,
        outrosCustos: pricing.outrosCustos,
      },
      faixas
    );
    somaMargem += r.margem;
    if (r.nivel === 'baixo' || r.nivel === 'prejuizo') piores += 1;
  }

  const margemMedia = somaMargem / alvo.length;
  const exemplo = alvo[0];
  const custoExemplo = exemplo.produto.custo ?? 0;
  const precoExemplo = Math.round(custoExemplo * (1 + markup / 100) * 100) / 100;

  const minimoParaMargemBoa = precoParaMargem(
    {
      custo: custoExemplo,
      fretePago: fretePago(precoExemplo),
      taxaGateway: pricing.taxaGateway,
      taxaFixa: pricing.taxaFixa,
      imposto: pricing.imposto,
      outrosCustos: pricing.outrosCustos,
    },
    pricing.margemBoa
  );

  return (
    <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
      <p className="text-[13px] text-sky-900">
        Aplicando <strong>{markup}%</strong> nos {alvo.length} selecionados, a margem média fica em{' '}
        <strong>{margemMedia.toFixed(1)}%</strong>.
        {piores > 0 && (
          <>
            {' '}
            <strong>{piores}</strong> {piores === 1 ? 'produto ficaria' : 'produtos ficariam'} com
            lucro baixo ou no prejuízo.
          </>
        )}
      </p>
      {custoExemplo > 0 && (
        <p className="mt-2 text-[12.5px] text-sky-800">
          Exemplo: custo {brl(custoExemplo)} passa a ser vendido por {brl(precoExemplo)}. Para
          atingir {pricing.margemBoa}% de margem, o preço mínimo seria {brl(minimoParaMargemBoa)} —
          equivalente a {markupNecessario(custoExemplo, minimoParaMargemBoa)}% de markup.
        </p>
      )}
    </div>
  );
}
