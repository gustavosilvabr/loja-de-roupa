 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../admin/store/AdminProvider';


/* ============================================================
   O rascunho do editor.

   Enquanto o lojista mexe, nada sai daqui: as alterações vivem
   em memória e só viram loja de verdade ao clicar em Publicar.
   Isso é o que permite experimentar sem medo.
   ============================================================ */

const LIMITE_HISTORICO = 50;













export function useRascunho() {
  const { settings: publicado, updateSettings } = useAdmin();

  const [historico, setHistorico] = useState([publicado]);
  const [posicao, setPosicao] = useState(0);

  // O rascunho começa igual ao publicado; só recarrega enquanto estiver limpo,
  // senão uma gravação em segundo plano apagaria o que o lojista está fazendo.
  const sujoRef = useRef(false);
  useEffect(() => {
    if (sujoRef.current) return;
    setHistorico([publicado]);
    setPosicao(0);
  }, [publicado]);

  const settings = _nullishCoalesce(historico[posicao], () => ( publicado));

  const alterar = useCallback(
    (fn) => {
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



/** Lê um campo do rascunho a partir do caminho enviado pelo preview. */
export function lerCaminho(settings, caminho) {
  const [lista, id, campo] = caminho.split('.');
  const arr = (settings )[lista];
  if (!Array.isArray(arr)) return '';

  const item = (arr ).find((x) => x.id === id) 

;

  const valor = _optionalChain([item, 'optionalAccess', _ => _[campo]]);
  return typeof valor === 'string' ? valor : '';
}

/** Grava um campo do rascunho no caminho enviado pelo preview. */
export function gravarCaminho(
  settings,
  caminho,
  valor
) {
  const [lista, id, campo] = caminho.split('.');
  const arr = (settings )[lista];
  if (!Array.isArray(arr)) return settings;

  const nova = (arr ).map((item) =>
    item.id === id ? { ...item, [campo]: valor } : item
  );

  return { ...settings, [lista]: nova } ;
}
