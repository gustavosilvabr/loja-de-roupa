import { useEffect, useRef, useState } from 'react';
import {
  PARAM_EDITOR,
  enviarParaVitrine,
  mensagemConfiavel,
  type MensagemParaEditor,
} from './protocolo';
import type { StoreSettings } from '../admin/types';

export type Dispositivo = 'computador' | 'tablet' | 'celular';

/** Larguras reais dos pontos de quebra usados na loja. */
export const LARGURAS: Record<Dispositivo, number | null> = {
  computador: null,
  tablet: 820,
  celular: 390,
};

interface Props {
  settings: StoreSettings;
  dispositivo: Dispositivo;
  secaoSelecionada: string | null;
  secaoDestacada: string | null;
  onSelecionarSecao: (id: string) => void;
  onClicarCampo: (caminho: string, secaoId: string | null) => void;
}

/**
 * A vitrine roda dentro de um iframe.
 *
 * Não é preciosismo: a loja grava as variáveis de cor no elemento raiz do
 * documento. No mesmo documento do editor, mudar a cor da marca repintaria
 * a própria interface do editor. O iframe elimina isso por construção,
 * e ainda garante que os pontos de quebra respondam à largura simulada.
 */
export function Preview({
  settings,
  dispositivo,
  secaoSelecionada,
  secaoDestacada,
  onSelecionarSecao,
  onClicarCampo,
}: Props) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [pronta, setPronta] = useState(false);

  // Escuta o que acontece dentro do preview
  useEffect(() => {
    const aoReceber = (evento: MessageEvent) => {
      if (!mensagemConfiavel(evento)) return;
      if (evento.source !== iframe.current?.contentWindow) return;

      const msg = evento.data as MensagemParaEditor;
      if (!msg || typeof msg !== 'object') return;

      switch (msg.tipo) {
        case 'vitrine:pronta':
          setPronta(true);
          break;
        case 'vitrine:secao':
          onSelecionarSecao(msg.secaoId);
          break;
        case 'vitrine:campo':
          onClicarCampo(msg.caminho, msg.secaoId);
          break;
      }
    };

    window.addEventListener('message', aoReceber);
    return () => window.removeEventListener('message', aoReceber);
  }, [onSelecionarSecao, onClicarCampo]);

  // Manda o rascunho a cada alteração
  useEffect(() => {
    if (!pronta) return;
    enviarParaVitrine(iframe.current?.contentWindow ?? null, {
      tipo: 'editor:configuracoes',
      settings,
    });
  }, [settings, pronta]);

  useEffect(() => {
    if (!pronta) return;
    enviarParaVitrine(iframe.current?.contentWindow ?? null, {
      tipo: 'editor:selecionar',
      secaoId: secaoSelecionada,
    });
  }, [secaoSelecionada, pronta]);

  useEffect(() => {
    if (!pronta) return;
    enviarParaVitrine(iframe.current?.contentWindow ?? null, {
      tipo: 'editor:destacar',
      secaoId: secaoDestacada,
    });
  }, [secaoDestacada, pronta]);

  const largura = LARGURAS[dispositivo];

  return (
    <div className="relative flex h-full w-full justify-center overflow-hidden bg-slate-200 p-4">
      {!pronta && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"
            role="status"
            aria-label="Carregando a prévia da loja"
          />
        </div>
      )}

      <div
        className="h-full overflow-hidden rounded-xl bg-white shadow-lg transition-[width] duration-300"
        style={{ width: largura ? `${largura}px` : '100%', maxWidth: '100%' }}
      >
        <iframe
          ref={iframe}
          title="Prévia da loja"
          src={`/?${PARAM_EDITOR}=1`}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
