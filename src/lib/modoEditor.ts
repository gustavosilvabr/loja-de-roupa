import { useEffect, useState } from 'react';
import {
  ATTR_CAMPO,
  ATTR_SECAO,
  enviarParaEditor,
  estaNoEditor,
  mensagemConfiavel,
  type MensagemParaVitrine,
} from '../editor/protocolo';
import type { StoreSettings } from '../admin/types';

/* ============================================================
   Lado da VITRINE quando ela roda dentro do editor.

   Aqui a loja não persiste nada e não conta estatística: ela
   apenas desenha o rascunho que o editor manda e avisa de volta
   no que o lojista clicou.
   ============================================================ */

const ID_ESTILO = 'estilos-modo-editor';

const CSS_EDITOR = `
  [${ATTR_SECAO}] { position: relative; }

  [${ATTR_SECAO}]::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 2px solid transparent;
    transition: border-color .15s ease, background-color .15s ease;
    z-index: 5;
  }

  [${ATTR_SECAO}]:hover::after { border-color: rgba(124,58,237,.45); }

  [${ATTR_SECAO}][data-selecionada='1']::after {
    border-color: #7c3aed;
    background: rgba(124,58,237,.06);
  }

  [${ATTR_CAMPO}] { cursor: pointer; outline-offset: -2px; }
  [${ATTR_CAMPO}]:hover { outline: 2px dashed #7c3aed; }

  /* O editor controla a navegação; links não devem sair do preview. */
  a { cursor: default; }
`;

function injetarEstilos() {
  if (document.getElementById(ID_ESTILO)) return;
  const tag = document.createElement('style');
  tag.id = ID_ESTILO;
  tag.textContent = CSS_EDITOR;
  document.head.appendChild(tag);
}

/**
 * Liga a vitrine ao editor. Devolve o rascunho recebido — `null` enquanto
 * o primeiro pacote não chega, ou sempre que não estamos no editor.
 */
export function useRascunhoDoEditor(): StoreSettings | null {
  const [rascunho, setRascunho] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (!estaNoEditor()) return;

    injetarEstilos();
    document.documentElement.dataset.modoEditor = '1';

    const aoReceber = (evento: MessageEvent) => {
      if (!mensagemConfiavel(evento)) return;
      const msg = evento.data as MensagemParaVitrine;
      if (!msg || typeof msg !== 'object') return;

      switch (msg.tipo) {
        case 'editor:configuracoes':
          setRascunho(msg.settings);
          break;

        case 'editor:selecionar': {
          document
            .querySelectorAll<HTMLElement>(`[${ATTR_SECAO}][data-selecionada]`)
            .forEach((el) => delete el.dataset.selecionada);

          if (!msg.secaoId) break;
          const alvo = document.querySelector<HTMLElement>(
            `[${ATTR_SECAO}="${CSS.escape(msg.secaoId)}"]`
          );
          if (!alvo) break;

          alvo.dataset.selecionada = '1';
          // A seção selecionada precisa continuar visível — é o que o
          // lojista está editando naquele momento.
          alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }

        case 'editor:destacar': {
          document
            .querySelectorAll<HTMLElement>(`[${ATTR_SECAO}][data-destacada]`)
            .forEach((el) => delete el.dataset.destacada);

          if (!msg.secaoId) break;
          const alvo = document.querySelector<HTMLElement>(
            `[${ATTR_SECAO}="${CSS.escape(msg.secaoId)}"]`
          );
          if (alvo) alvo.dataset.destacada = '1';
          break;
        }
      }
    };

    /** Clique no preview seleciona a seção — e o campo, quando houver. */
    const aoClicar = (evento: MouseEvent) => {
      const alvo = evento.target as HTMLElement | null;
      if (!alvo) return;

      // Dentro do editor, nada navega: o clique é para editar.
      evento.preventDefault();
      evento.stopPropagation();

      const secao = alvo.closest<HTMLElement>(`[${ATTR_SECAO}]`);
      const secaoId = secao?.getAttribute(ATTR_SECAO) ?? null;

      const campo = alvo.closest<HTMLElement>(`[${ATTR_CAMPO}]`);
      if (campo) {
        enviarParaEditor({
          tipo: 'vitrine:campo',
          caminho: campo.getAttribute(ATTR_CAMPO) ?? '',
          secaoId,
        });
        return;
      }

      if (secaoId) enviarParaEditor({ tipo: 'vitrine:secao', secaoId });
    };

    window.addEventListener('message', aoReceber);
    document.addEventListener('click', aoClicar, true);

    enviarParaEditor({ tipo: 'vitrine:pronta' });

    return () => {
      window.removeEventListener('message', aoReceber);
      document.removeEventListener('click', aoClicar, true);
      delete document.documentElement.dataset.modoEditor;
    };
  }, []);

  return rascunho;
}

/** Props que marcam um elemento como seção no preview. */
export const marcarSecao = (id: string) =>
  estaNoEditor() ? { [ATTR_SECAO]: id } : {};

/** Props que marcam um elemento como campo clicável no preview. */
export const marcarCampo = (caminho: string) =>
  estaNoEditor() ? { [ATTR_CAMPO]: caminho } : {};
