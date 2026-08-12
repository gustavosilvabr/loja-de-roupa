import type { StoreSettings } from '../admin/types';

/* ============================================================
   CONTRATO entre o editor e a vitrine dentro do iframe.

   O editor e a loja são duas aplicações separadas rodando em
   documentos diferentes. Tudo que passa entre elas passa por
   aqui — se um lado mudar sem o outro, o TypeScript acusa.
   ============================================================ */

/** Marca na URL da vitrine que ela está sendo previsualizada. */
export const PARAM_EDITOR = 'editor';

export const estaNoEditor = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get(PARAM_EDITOR) === '1';

/** Atributo que marca o elemento de cada seção da home. */
export const ATTR_SECAO = 'data-secao';

/**
 * Atributo que marca um campo editável dentro da vitrine.
 * O valor é o caminho da configuração, ex.: "heroSlides.0.desktop".
 */
export const ATTR_CAMPO = 'data-campo';

/* ---------- editor → vitrine ---------- */

export type MensagemParaVitrine =
  /** Estado completo do rascunho. A vitrine desenha exatamente isto. */
  | { tipo: 'editor:configuracoes'; settings: StoreSettings }
  /** Rola até a seção e a mantém visível enquanto estiver selecionada. */
  | { tipo: 'editor:selecionar'; secaoId: string | null }
  /** Contorno de destaque ao passar o mouse na árvore. */
  | { tipo: 'editor:destacar'; secaoId: string | null };

/* ---------- vitrine → editor ---------- */

export type MensagemParaEditor =
  /** A vitrine montou e está pronta para receber o rascunho. */
  | { tipo: 'vitrine:pronta' }
  /** O lojista clicou numa seção dentro do preview. */
  | { tipo: 'vitrine:secao'; secaoId: string }
  /** O lojista clicou num campo editável (imagem, texto) dentro do preview. */
  | { tipo: 'vitrine:campo'; caminho: string; secaoId: string | null }
  /** Altura do conteúdo, para o editor saber se precisa rolar. */
  | { tipo: 'vitrine:altura'; altura: number };

/**
 * Só aceitamos mensagens da própria origem. Sem esta checagem, qualquer
 * página aberta em outra aba poderia mandar configurações para o editor.
 */
export function mensagemConfiavel(evento: MessageEvent): boolean {
  return evento.origin === window.location.origin;
}

export function enviarParaVitrine(
  janela: Window | null,
  mensagem: MensagemParaVitrine
): void {
  janela?.postMessage(mensagem, window.location.origin);
}

export function enviarParaEditor(mensagem: MensagemParaEditor): void {
  if (window.parent === window) return;
  window.parent.postMessage(mensagem, window.location.origin);
}
