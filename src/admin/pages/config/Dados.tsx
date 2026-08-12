import { useMemo, useRef, useState } from 'react';
import { useAdmin } from '../../store/AdminProvider';
import { Button, Card, ConfirmButton, PageHeader, StatCard } from '../../ui';
import { useImagens } from '../../store/ImagensProvider';
import { useCatalog } from '../../store/useResolvedCatalog';
import { aplicarDemo, contarDemo, removerDemo } from '../../store/avaliacoesDemo';
import { exportarImagens, importarImagens, formatarBytes, type ImagemExportada } from '../../store/imagens';

interface Backup {
  versao: number;
  exportadoEm: string;
  settings: unknown;
  catalog: unknown;
  analytics: unknown;
  imagens?: ImagemExportada[];
}

export default function Dados() {
  const {
    settings,
    catalog,
    analytics,
    updateSettings,
    setCatalog,
    resetSettings,
    resetCatalog,
    resetAnalytics,
  } = useAdmin();

  const { imagens: imagensLocais, usado: usoImagens } = useImagens();
  const { products } = useCatalog();
  const handlesDosProdutos = products.map((p) => p.handle);
  const comDemo = contarDemo(catalog);
  const inputRef = useRef<HTMLInputElement>(null);
  const [exportando, setExportando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [pendente, setPendente] = useState<Backup | null>(null);

  // Quanto os dados da loja ocupam no navegador
  const uso = useMemo(() => {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (!chave?.startsWith('xingsun:')) continue;
        total += (localStorage.getItem(chave) ?? '').length + chave.length;
      }
    } catch {
      return 0;
    }
    return total / 1024;
  }, [settings, catalog, analytics]);

  const exportar = async () => {
    setExportando(true);

    // As imagens vivem no IndexedDB. Se ele não estiver disponível (aba
    // anônima, navegador antigo), o backup do resto ainda precisa sair.
    let imagens: ImagemExportada[] = [];
    let falhouImagens = false;
    try {
      imagens = await exportarImagens();
    } catch {
      falhouImagens = true;
    }

    try {
      const backup: Backup = {
        versao: 2,
        exportadoEm: new Date().toISOString(),
        settings,
        catalog,
        analytics,
        imagens,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-loja-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setAviso(
        falhouImagens
          ? {
              tipo: 'erro',
              texto:
                'Backup baixado, mas as imagens enviadas do computador ficaram de fora — este navegador bloqueou o acesso ao armazenamento.',
            }
          : {
              tipo: 'ok',
              texto: `Backup baixado com ${imagens.length} imagem(ns) enviada(s) do computador.`,
            }
      );
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não consegui gerar o arquivo de backup.' });
    } finally {
      setExportando(false);
    }
  };

  const lerArquivo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dados = JSON.parse(String(reader.result)) as Backup;
        if (!dados.settings || !dados.catalog) throw new Error('estrutura inválida');
        setPendente(dados);
        setAviso(null);
      } catch {
        setPendente(null);
        setAviso({ tipo: 'erro', texto: 'Arquivo inválido. Use um backup gerado por esta tela.' });
      }
    };
    reader.readAsText(file);
  };

  const aplicarImportacao = async () => {
    if (!pendente) return;

    updateSettings(() => pendente.settings as typeof settings);
    setCatalog(() => pendente.catalog as typeof catalog);

    let restauradas = 0;
    if (pendente.imagens?.length) {
      restauradas = await importarImagens(pendente.imagens);
    }

    setPendente(null);
    setAviso({
      tipo: 'ok',
      texto: restauradas
        ? `Backup restaurado com ${restauradas} imagem(ns). Recarregue a página para vê-las.`
        : 'Backup restaurado. As estatísticas antigas foram mantidas.',
    });
  };

  return (
    <>
      <PageHeader
        title="Dados e backup"
        description="Exporte tudo antes de mexer em algo grande. É o seu ponto de retorno."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatCard label="Espaço usado" value={`${uso.toFixed(1)} KB`} hint="Limite do navegador: ~5 MB" />
        <StatCard label="Produtos editados" value={Object.keys(catalog.products).length} />
        <StatCard label="Pedidos" value={analytics.orders.length} />
        <StatCard
          label="Imagens enviadas"
          value={imagensLocais.length}
          hint={formatarBytes(usoImagens)}
        />
      </div>

      {aviso && (
        <p
          role="status"
          className={`mb-5 rounded-lg px-4 py-3 text-[13px] ${
            aviso.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {aviso.texto}
        </p>
      )}

      <div className="space-y-6">
        <Card
          title="Exportar"
          description="Configurações, catálogo, estatísticas e as imagens enviadas do computador, tudo num arquivo só."
        >
          <Button onClick={() => void exportar()}>{exportando ? 'Preparando…' : 'Baixar backup'}</Button>
        </Card>

        <Card
          title="Importar"
          description="Substitui as configurações e o catálogo pelo conteúdo do arquivo."
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) lerArquivo(file);
              e.target.value = '';
            }}
            className="block w-full text-[13px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            aria-label="Escolher arquivo de backup"
          />

          {pendente && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-[13px] text-amber-900">
                Backup de{' '}
                <strong>{new Date(pendente.exportadoEm).toLocaleString('pt-BR')}</strong>. Importar
                vai <strong>sobrescrever</strong> as configurações e o catálogo atuais.
              </p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => void aplicarImportacao()}>Importar mesmo assim</Button>
                <Button variant="ghost" onClick={() => setPendente(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Avaliações de demonstração"
          description="Para ver como a loja fica com avaliação antes de ter cliente."
        >
          {comDemo > 0 ? (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4">
              <p className="text-[13.5px] font-bold text-red-800">
                {comDemo} produtos estão com avaliação inventada agora.
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-red-700">
                Isso é texto de preenchimento, como numa maquete. Se a loja receber
                visita assim, o cliente lê depoimento falso como se fosse real — o que
                é propaganda enganosa pelo artigo 37 do Código de Defesa do Consumidor.
                Remova antes de divulgar o site.
              </p>
              <Button
                variant="danger"
                className="mt-3 !bg-red-600 !text-white"
                onClick={() => setCatalog(removerDemo)}
              >
                Remover as avaliações de demonstração
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-[13px] leading-relaxed text-slate-600">
                Preenche nota e comentários nos produtos para você conferir o layout.
                Avaliação de cliente de verdade nunca é sobrescrita, e some tudo com
                um clique.
              </p>
              <Button onClick={() => setCatalog((c) => aplicarDemo(c, handlesDosProdutos))}>
                Preencher avaliações de demonstração
              </Button>
            </>
          )}
        </Card>

        <Card
          title="Zona de risco"
          description="Cada reset é independente e não pode ser desfeito."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-slate-800">Resetar configurações</p>
                <p className="text-[12px] text-slate-500">
                  Volta marca, tema, SEO, frete e políticas aos valores originais.
                </p>
              </div>
              <ConfirmButton onConfirm={resetSettings}>Resetar</ConfirmButton>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-slate-800">Resetar catálogo</p>
                <p className="text-[12px] text-slate-500">
                  Descarta edições, exclusões e produtos criados. Os 205 produtos originais voltam.
                </p>
              </div>
              <ConfirmButton onConfirm={resetCatalog}>Resetar</ConfirmButton>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-slate-800">Apagar estatísticas</p>
                <p className="text-[12px] text-slate-500">
                  Remove visitas, sessões, carrinhos abandonados e pedidos.
                </p>
              </div>
              <ConfirmButton onConfirm={resetAnalytics}>Apagar</ConfirmButton>
            </div>
          </div>
        </Card>

        <Card title="Onde os dados ficam">
          <p className="text-[13px] leading-relaxed text-slate-600">
            Tudo é gravado no <strong>localStorage</strong> deste navegador. Isso significa que as
            alterações valem só nesta máquina e neste navegador — quem abrir a loja em outro
            computador vê os valores originais, e limpar os dados do navegador apaga tudo.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            Para o painel valer para todo mundo, é preciso um banco de dados. A troca é localizada:
            reimplementar as funções de <code className="rounded bg-slate-100 px-1">persist.ts</code>{' '}
            apontando para o Supabase resolve, sem mexer nas telas.
          </p>
        </Card>
      </div>
    </>
  );
}
