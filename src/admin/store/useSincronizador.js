import { useCallback, useEffect, useRef } from 'react';
import { useAdmin } from './AdminProvider';
import {
  aplicarMudancas,
  buscarOrigem,
  compararCatalogos,
  precisaVerificar,
  registrarCustos,
} from './sync';


/**
 * Roda o olheiro: verifica sob demanda e, se ligado, sozinho no intervalo
 * configurado. Só funciona com o painel aberto — o navegador não executa
 * nada com a aba fechada.
 */
export function useSincronizador() {
  const { settings, sync, setSync, catalog, setCatalog } = useAdmin();
  const emAndamento = useRef(false);

  const verificar = useCallback(async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setSync((s) => ({ ...s, verificando: true, ultimoErro: null }));

    try {
      const origem = await buscarOrigem(settings.sync.origem);
      const mudancas = compararCatalogos(origem, catalog, sync.custosConhecidos);

      if (settings.sync.aplicarAutomatico && mudancas.length > 0) {
        setCatalog((c) =>
          aplicarMudancas(c, mudancas, { importarNovos: settings.sync.importarNovos })
        );
        setSync((s) => ({
          ...s,
          verificando: false,
          ultimaVerificacao: Date.now(),
          mudancas: [],
          custosConhecidos: registrarCustos(s.custosConhecidos, mudancas),
        }));
        return;
      }

      setSync((s) => ({
        ...s,
        verificando: false,
        ultimaVerificacao: Date.now(),
        mudancas,
      }));
    } catch (err) {
      setSync((s) => ({
        ...s,
        verificando: false,
        ultimaVerificacao: Date.now(),
        ultimoErro:
          err instanceof Error
            ? `Não consegui consultar a loja de origem: ${err.message}`
            : 'Não consegui consultar a loja de origem.',
      }));
    } finally {
      emAndamento.current = false;
    }
  }, [settings.sync, catalog, sync.custosConhecidos, setSync, setCatalog]);

  /** Aplica as mudanças escolhidas e tira da lista de pendências. */
  const aplicar = useCallback(
    (escolhidas) => {
      setCatalog((c) =>
        aplicarMudancas(c, escolhidas, { importarNovos: true })
      );
      setSync((s) => ({
        ...s,
        mudancas: s.mudancas.filter(
          (m) => !escolhidas.some((e) => e.handle === m.handle && e.tipo === m.tipo)
        ),
        custosConhecidos: registrarCustos(s.custosConhecidos, escolhidas),
      }));
    },
    [setCatalog, setSync]
  );

  /** Ignora as pendências sem aplicar, mas lembra dos custos para não reavisar. */
  const descartar = useCallback(() => {
    setSync((s) => ({
      ...s,
      mudancas: [],
      custosConhecidos: registrarCustos(s.custosConhecidos, s.mudancas),
    }));
  }, [setSync]);

  return { verificar, aplicar, descartar };
}

/** Agenda a verificação automática. Fica montado no layout do painel. */
export function useOlheiroAutomatico() {
  const { settings, sync } = useAdmin();
  const { verificar } = useSincronizador();
  const verificarRef = useRef(verificar);
  verificarRef.current = verificar;

  useEffect(() => {
    if (!settings.sync.ativo) return;

    // Uma primeira olhada logo que abre, se já passou do intervalo.
    if (precisaVerificar(settings.sync, sync.ultimaVerificacao)) {
      const inicial = window.setTimeout(() => verificarRef.current(), 1500);
      return () => window.clearTimeout(inicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.sync.ativo]);

  useEffect(() => {
    if (!settings.sync.ativo) return;

    const id = window.setInterval(
      () => verificarRef.current(),
      Math.max(1, settings.sync.intervaloMinutos) * 60000
    );
    return () => window.clearInterval(id);
  }, [settings.sync.ativo, settings.sync.intervaloMinutos]);
}
