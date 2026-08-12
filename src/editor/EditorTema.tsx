import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../admin/store/useResolvedCatalog';
import { ArvoreSecoes } from './ArvoreSecoes';
import { Inspetor } from './Inspetor';
import { Preview, type Dispositivo } from './Preview';
import { useRascunho } from './useRascunho';

const DISPOSITIVOS: { chave: Dispositivo; rotulo: string; icone: string }[] = [
  { chave: 'computador', rotulo: 'Computador', icone: '🖥️' },
  { chave: 'tablet', rotulo: 'Tablet', icone: '📱' },
  { chave: 'celular', rotulo: 'Celular', icone: '📲' },
];

/**
 * Editor de tema: árvore de seções à esquerda, prévia ao vivo no centro,
 * ajustes à direita. Fica fora do painel de propósito — aqui só se mexe
 * na aparência, sem misturar com pedidos, produtos e estatísticas.
 */
export default function EditorTema() {
  const rascunho = useRascunho();
  const { collections } = useCatalog();

  const [aba, setAba] = useState<'secao' | 'aparencia'>('secao');
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [destacada, setDestacada] = useState<string | null>(null);
  const [campoFocado, setCampoFocado] = useState<string | null>(null);
  const [dispositivo, setDispositivo] = useState<Dispositivo>('computador');

  const secao = rascunho.settings.home.find((s) => s.id === selecionada) ?? null;

  const selecionarSecao = useCallback((id: string) => {
    setSelecionada(id);
    setAba('secao');
    setCampoFocado(null);
  }, []);

  /** Clique numa imagem da prévia abre exatamente aquele campo. */
  const clicarCampo = useCallback((caminho: string, secaoId: string | null) => {
    if (secaoId) setSelecionada(secaoId);
    setAba('secao');
    setCampoFocado(caminho);
  }, []);

  // Ctrl+Z / Ctrl+Shift+Z, como em qualquer editor
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
      const alvo = e.target as HTMLElement;
      // Não sequestra o desfazer de dentro de um campo de texto.
      if (/^(INPUT|TEXTAREA)$/.test(alvo.tagName)) return;

      e.preventDefault();
      if (e.shiftKey) rascunho.refazer();
      else rascunho.desfazer();
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [rascunho]);

  // Impede fechar a aba com alteração não publicada
  useEffect(() => {
    if (!rascunho.sujo) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [rascunho.sujo]);

  const colecoes = collections.map((c) => ({ handle: c.handle, title: c.title }));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      {/* Barra superior */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/admin"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            ← Painel
          </Link>
          <span className="hidden text-[14px] font-semibold text-slate-900 sm:block">
            Editor de tema
          </span>
          {rascunho.sujo && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-800">
              Alterações não publicadas
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-1 hidden items-center rounded-lg border border-slate-200 p-0.5 sm:flex">
            {DISPOSITIVOS.map((d) => (
              <button
                key={d.chave}
                type="button"
                onClick={() => setDispositivo(d.chave)}
                aria-pressed={dispositivo === d.chave}
                title={d.rotulo}
                className={`rounded px-2.5 py-1 text-[13px] transition-colors ${
                  dispositivo === d.chave
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <span aria-hidden="true">{d.icone}</span>
                <span className="sr-only">{d.rotulo}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={rascunho.desfazer}
            disabled={!rascunho.podeDesfazer}
            title="Desfazer (Ctrl+Z)"
            aria-label="Desfazer"
            className="rounded-lg px-2 py-1.5 text-[15px] text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={rascunho.refazer}
            disabled={!rascunho.podeRefazer}
            title="Refazer (Ctrl+Shift+Z)"
            aria-label="Refazer"
            className="rounded-lg px-2 py-1.5 text-[15px] text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30"
          >
            ↷
          </button>

          <button
            type="button"
            onClick={rascunho.descartar}
            disabled={!rascunho.sujo}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={rascunho.publicar}
            disabled={!rascunho.sujo}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-violet-700 disabled:bg-slate-300"
          >
            Publicar
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Árvore de seções */}
        <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white lg:block">
          <ArvoreSecoes
            secoes={rascunho.settings.home}
            selecionada={selecionada}
            onSelecionar={selecionarSecao}
            onDestacar={setDestacada}
            onAlterar={rascunho.alterar}
            colecoes={colecoes}
          />
        </aside>

        {/* Prévia ao vivo */}
        <main className="min-w-0 flex-1">
          <Preview
            settings={rascunho.settings}
            dispositivo={dispositivo}
            secaoSelecionada={selecionada}
            secaoDestacada={destacada}
            onSelecionarSecao={selecionarSecao}
            onClicarCampo={clicarCampo}
          />
        </main>

        {/* Inspetor */}
        <aside className="hidden w-[330px] shrink-0 flex-col border-l border-slate-200 bg-white md:flex">
          <div className="flex shrink-0 border-b border-slate-200">
            {(
              [
                ['secao', 'Seção'],
                ['aparencia', 'Aparência'],
              ] as const
            ).map(([chave, rotulo]) => (
              <button
                key={chave}
                type="button"
                onClick={() => setAba(chave)}
                aria-current={aba === chave}
                className={`flex-1 border-b-2 py-3 text-[13px] font-medium transition-colors ${
                  aba === chave
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1">
            <Inspetor
              aba={aba}
              settings={rascunho.settings}
              secao={secao}
              campoFocado={campoFocado}
              onAlterar={rascunho.alterar}
              colecoes={colecoes}
            />
          </div>
        </aside>
      </div>

      <p className="shrink-0 border-t border-slate-200 bg-white px-4 py-2 text-center text-[12px] text-slate-400 md:hidden">
        O editor precisa de uma tela maior. Abra no computador para usar todos os controles.
      </p>
    </div>
  );
}
