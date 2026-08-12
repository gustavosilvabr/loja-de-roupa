import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../admin/store/AdminProvider';
import type { StoreSettings } from '../admin/types';

/* ============================================================
   O rascunho do editor.

   Enquanto o lojista mexe, nada sai daqui: as alterações vivem
   em memória e só viram loja de verdade ao clicar em Publicar.
   Isso é o que permite experimentar sem medo.
   ============================================================ */

const LIMITE_HISTORICO = 50;

export interface Rascunho {
  settings: StoreSettings;
  alterar: (fn: (s: StoreSettings) => StoreSettings) => void;
  publicar: () => void;
  descartar: () => void;
  desfazer: () => void;
  refazer: () => void;
  podeDesfazer: boolean;
  podeRefazer: boolean;
  sujo: boolean;
}

export function useRascunho(): Rascunho {
  const { settings: publicado, updateSettings } = useAdmin();

  const [historico, setHistorico] = useState<StoreSettings[]>([publicado]);
  const [posicao, setPosicao] = useState(0);

  // O rascunho começa igual ao publicado; só recarrega enquanto estiver limpo,
  // senão uma gravação em segundo plano apagaria o que o lojista está fazendo.
  const sujoRef = useRef(false);
  useEffect(() => {
    if (sujoRef.current) return;
    setHistorico([publicado]);
    setPosicao(0);
  }, [publicado]);

  const settings = historico[posicao] ?? publicado;

  const alterar = useCallback(
    (fn: (s: StoreSettings) => StoreSettings) => {
      sujoRef.current = true;
      setHistorico((h) => {
        const base = h.slice(0, posicao + 1);
        const proximo = fn(base[base.length - 1]);
        const cheio = [...base, proximo];
        return cheio.length > LIMITE_HISTORICO ? cheio.slice(-LIMITE_HISTORICO) : cheio;
      });
      setPosicao((p) => Math.min(p + 1, LIMITE_HISTORICO - 1));
    },
    [posicao]
  );

  const publicar = useCallback(() => {
    updateSettings(() => settings);
    sujoRef.current = false;
    setHistorico([settings]);
    setPosicao(0);
  }, [settings, updateSettings]);

  const descartar = useCallback(() => {
    sujoRef.current = false;
    setHistorico([publicado]);
    setPosicao(0);
  }, [publicado]);

  const desfazer = useCallback(() => setPosicao((p) => Math.max(0, p - 1)), []);
  const refazer = useCallback(
    () => setPosicao((p) => Math.min(historico.length - 1, p + 1)),
    [historico.length]
  );

  const sujo = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(publicado),
    [settings, publicado]
  );

  // Mantém a flag alinhada: desfazer até o início devolve o estado limpo.
  useEffect(() => {
    sujoRef.current = sujo;
  }, [sujo]);

  return {
    settings,
    alterar,
    publicar,
    descartar,
    desfazer,
    refazer,
    podeDesfazer: posicao > 0,
    podeRefazer: posicao < historico.length - 1,
    sujo,
  };
}

/* ---------- acesso a campos por caminho ("heroSlides.sl1.desktop") ---------- */

type ListaComId = { id: string }[];

/** Lê um campo do rascunho a partir do caminho enviado pelo preview. */
export function lerCaminho(settings: StoreSettings, caminho: string): string {
  const [lista, id, campo] = caminho.split('.');
  const arr = (settings as unknown as Record<string, unknown>)[lista];
  if (!Array.isArray(arr)) return '';

  const item = (arr as ListaComId).find((x) => x.id === id) as
    | Record<string, unknown>
    | undefined;

  const valor = item?.[campo];
  return typeof valor === 'string' ? valor : '';
}

/** Grava um campo do rascunho no caminho enviado pelo preview. */
export function gravarCaminho(
  settings: StoreSettings,
  caminho: string,
  valor: string
): StoreSettings {
  const [lista, id, campo] = caminho.split('.');
  const arr = (settings as unknown as Record<string, unknown>)[lista];
  if (!Array.isArray(arr)) return settings;

  const nova = (arr as ListaComId).map((item) =>
    item.id === id ? { ...item, [campo]: valor } : item
  );

  return { ...settings, [lista]: nova } as StoreSettings;
}
