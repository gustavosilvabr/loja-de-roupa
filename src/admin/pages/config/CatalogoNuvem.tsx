import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdmin } from '../../store/AdminProvider';
import { useCatalog } from '../../store/useResolvedCatalog';
import { catalogoBase, definirBase } from '../../store/baseCatalog';
import {
  carregarCategorias,
  carregarProdutos,
  ehImagemDaNuvem,
  espelharImagem,
  salvarCategorias,
  salvarProdutos,
  salvarProduto,
} from '../../store/nuvem';
import { Badge, Button, Card, PageHeader, StatCard } from '../../ui';
import type { Product } from '../../../types';

/* ============================================================
   Leva o catálogo e as fotos para o Supabase.

   Por que existe esta tela: enquanto os produtos moram só dentro
   do site publicado, cada mudança exige um novo deploy, e as
   fotos continuam dependendo do CDN do fornecedor. Depois desta
   carga, o catálogo passa a viver no banco — o olheiro grava lá,
   e todo cliente, em qualquer aparelho, lê de lá.
   ============================================================ */

interface Progresso {
  rodando: boolean;
  feitos: number;
  total: number;
  /** Etapa atual, para o lojista saber o que está acontecendo. */
  etapa: string;
  erros: number;
}

const PARADO: Progresso = { rodando: false, feitos: 0, total: 0, etapa: '', erros: 0 };

/** Quantas fotos baixar/subir ao mesmo tempo. */
const IMAGENS_EM_PARALELO = 4;

export default function CatalogoNuvem() {
  const { nuvem } = useAdmin();
  const { products } = useCatalog();

  const [naNuvem, setNaNuvem] = useState<number | null>(null);
  const [envio, setEnvio] = useState<Progresso>(PARADO);
  const [fotos, setFotos] = useState<Progresso>(PARADO);
  const [recado, setRecado] = useState<string | null>(null);

  const cancelar = useRef(false);
  useEffect(() => () => { cancelar.current = true; }, []);

  const contar = useCallback(async () => {
    const lista = await carregarProdutos();
    setNaNuvem(lista?.length ?? 0);
  }, []);

  useEffect(() => {
    if (nuvem.ativa) void contar();
  }, [nuvem.ativa, contar]);

  /* ---- 1. produtos e categorias ---- */
  async function enviarCatalogo() {
    const base = catalogoBase();
    setRecado(null);
    setEnvio({ rodando: true, feitos: 0, total: base.products.length, etapa: 'produtos', erros: 0 });

    const LOTE = 25;
    let gravados = 0;

    for (let i = 0; i < base.products.length; i += LOTE) {
      if (cancelar.current) return;
      const lote = base.products.slice(i, i + LOTE);
      gravados += await salvarProdutos(lote);
      setEnvio((p) => ({ ...p, feitos: Math.min(i + LOTE, base.products.length) }));
    }

    setEnvio((p) => ({ ...p, etapa: 'categorias' }));
    const cats = await salvarCategorias(base.collections);

    setEnvio({ ...PARADO, erros: base.products.length - gravados });
    setRecado(
      gravados === base.products.length
        ? `${gravados} produtos e ${cats} categorias estão na nuvem.`
        : `${gravados} de ${base.products.length} produtos subiram. Tente de novo para os que faltaram.`
    );

    definirBase(await carregarProdutos(), await carregarCategorias());
    await contar();
  }

  /* ---- 2. fotos ---- */
  async function enviarImagens() {
    const base = catalogoBase();

    // Uma foto pode se repetir em vários produtos: subir uma vez basta.
    const pendentes = [
      ...new Set(base.products.flatMap((p) => p.images).filter((u) => u && !ehImagemDaNuvem(u))),
    ];

    if (pendentes.length === 0) {
      setRecado('Todas as fotos já estão no Supabase.');
      return;
    }

    setRecado(null);
    setFotos({ rodando: true, feitos: 0, total: pendentes.length, etapa: 'copiando', erros: 0 });

    const mapa = new Map<string, string>();
    let erros = 0;

    for (let i = 0; i < pendentes.length; i += IMAGENS_EM_PARALELO) {
      if (cancelar.current) return;

      const fatia = pendentes.slice(i, i + IMAGENS_EM_PARALELO);
      const novas = await Promise.all(fatia.map((u) => espelharImagem(u)));

      fatia.forEach((antiga, k) => {
        const nova = novas[k];
        if (nova) mapa.set(antiga, nova);
        else erros++;
      });

      setFotos((p) => ({ ...p, feitos: Math.min(i + IMAGENS_EM_PARALELO, pendentes.length), erros }));
    }

    // Reescreve só os produtos cujas fotos realmente mudaram de endereço.
    setFotos((p) => ({ ...p, etapa: 'atualizando produtos' }));

    const trocados: Product[] = base.products
      .map((p) => {
        const imagens = p.images.map((u) => mapa.get(u) ?? u);
        return imagens.some((u, k) => u !== p.images[k])
          ? { ...p, images: imagens, image: imagens[0] ?? p.image }
          : null;
      })
      .filter((p): p is Product => p !== null);

    for (const p of trocados) {
      if (cancelar.current) return;
      if (!(await salvarProduto(p))) erros++;
    }

    setFotos({ ...PARADO, erros });
    setRecado(
      erros === 0
        ? `${mapa.size} fotos copiadas para o Supabase. A loja não depende mais do CDN do fornecedor.`
        : `${mapa.size} fotos copiadas; ${erros} não deram certo. As que falharam continuam apontando para o endereço antigo — nenhuma foto sumiu da loja.`
    );

    definirBase(await carregarProdutos(), null);
  }

  /* ---- números da tela ---- */
  const base = catalogoBase();
  const totalFotos = new Set(base.products.flatMap((p) => p.images).filter(Boolean));
  const fotosNaNuvem = [...totalFotos].filter(ehImagemDaNuvem).length;
  const ocupado = envio.rodando || fotos.rodando;

  if (!nuvem.ativa) {
    return (
      <>
        <PageHeader title="Catálogo na nuvem" description="Onde ficam os produtos, preços e fotos." />
        <Card title="Nuvem desligada">
          <p className="text-[13px] text-slate-600">
            Este site está sem as chaves do Supabase, então o catálogo funciona apenas com o que veio
            no próprio site. Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_KEY</code>{' '}
            para ativar.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Catálogo na nuvem"
        description="Envia produtos, preços e fotos para o Supabase. É de lá que todo cliente lê."
        actions={
          base.daNuvem ? <Badge tone="green">Lendo da nuvem</Badge> : <Badge>Lendo do site</Badge>
        }
      />

      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Produtos no site" value={String(products.length)} />
          <StatCard
            label="Produtos na nuvem"
            value={naNuvem === null ? '…' : String(naNuvem)}
          />
          <StatCard label="Fotos no Supabase" value={`${fotosNaNuvem}/${totalFotos.size}`} />
        </div>

        {!nuvem.email && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            Você precisa estar logado para gravar na nuvem. Sem sessão, o banco recusa a escrita e
            nada é enviado.
          </p>
        )}

        {recado && (
          <p className="rounded-lg bg-sky-50 px-4 py-3 text-[13px] text-sky-900">{recado}</p>
        )}

        <Card
          title="1. Enviar produtos e preços"
          description="Sobe o catálogo inteiro. Rodar de novo atualiza o que mudou, sem duplicar nada."
        >
          <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
            O que sobe é o <strong>custo do fornecedor</strong>, não o preço de venda. O preço que o
            cliente vê continua sendo calculado com o seu markup — assim, quando o fornecedor aumenta,
            a sua margem não é comida sem você perceber.
          </p>

          {envio.rodando ? (
            <Barra p={envio} />
          ) : (
            <Button onClick={() => void enviarCatalogo()} disabled={ocupado || !nuvem.email}>
              Enviar {base.products.length} produtos para a nuvem
            </Button>
          )}
        </Card>

        <Card
          title="2. Enviar as fotos"
          description="Copia as imagens do CDN do fornecedor para o Storage do Supabase."
        >
          <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
            Hoje as fotos são servidas pelo fornecedor. Se ele apagar um arquivo ou tirar a loja do
            ar, os produtos ficam sem imagem. Copiando para o Supabase, as fotos passam a ser suas.
            {totalFotos.size > 200 && ' São muitas imagens: deixe esta aba aberta até terminar.'}
          </p>

          {fotos.rodando ? (
            <Barra p={fotos} />
          ) : (
            <Button
              onClick={() => void enviarImagens()}
              disabled={ocupado || !nuvem.email || fotosNaNuvem === totalFotos.size}
            >
              {fotosNaNuvem === totalFotos.size
                ? 'Todas as fotos já estão no Supabase'
                : `Copiar ${totalFotos.size - fotosNaNuvem} fotos`}
            </Button>
          )}
        </Card>

        <Card title="Como fica depois" description="O caminho que os dados passam a percorrer.">
          <ol className="grid gap-2 text-[13px] leading-relaxed text-slate-600">
            <li>
              <strong>1.</strong> O olheiro consulta o fornecedor e grava produtos novos e preços
              direto no Supabase.
            </li>
            <li>
              <strong>2.</strong> Qualquer visitante — outro computador, outro celular — abre a loja e
              lê esse mesmo catálogo.
            </li>
            <li>
              <strong>3.</strong> Se o Supabase estiver fora do ar, a loja volta sozinha para o
              catálogo que veio dentro do site. Ninguém vê tela em branco.
            </li>
          </ol>
        </Card>
      </div>
    </>
  );
}

function Barra({ p }: { p: Progresso }) {
  const pct = p.total ? Math.round((p.feitos / p.total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="font-medium text-slate-700">
          {p.etapa} — {p.feitos} de {p.total}
        </span>
        <span className="tabular-nums text-slate-500">{pct}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {p.erros > 0 && (
        <p className="mt-2 text-[12px] text-amber-700">{p.erros} não deram certo até agora.</p>
      )}
    </div>
  );
}
