 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

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

 



















/**
 * Só aceitamos mensagens da própria origem. Sem esta checagem, qualquer
 * página aberta em outra aba poderia mandar configurações para o editor.
 */
export function mensagemConfiavel(evento) {
  return evento.origin === window.location.origin;
}

export function enviarParaVitrine(
  janela,
  mensagem
) {
  _optionalChain([janela, 'optionalAccess', _ => _.postMessage, 'call', _2 => _2(mensagem, window.location.origin)]);
}

export function enviarParaEditor(mensagem) {
  if (window.parent === window) return;
  window.parent.postMessage(mensagem, window.location.origin);
}
