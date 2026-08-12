 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { uid } from './persist';


/* ============================================================
   Avaliações de DEMONSTRAÇÃO.

   Servem para ver o layout pronto antes de existir cliente — o mesmo
   papel do texto de preenchimento numa maquete. Todas nascem com
   `demo: true`, o painel avisa enquanto elas existirem e some tudo
   num clique.

   NUNCA deixe isto ativo com a loja recebendo visita: mostrar
   depoimento inventado como se fosse de cliente é propaganda
   enganosa (CDC, art. 37).
   ============================================================ */

const NOMES = [
  'Cliente verificado', 'Comprador anônimo', 'Cliente XING SUN',
  'Comprador verificado', 'Cliente da loja',
];

const LUGARES = [
  ['São Paulo', 'SP'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'],
  ['Curitiba', 'PR'], ['Porto Alegre', 'RS'], ['Salvador', 'BA'],
  ['Recife', 'PE'], ['Fortaleza', 'CE'], ['Goiânia', 'GO'],
  ['Campinas', 'SP'], ['Manaus', 'AM'], ['Florianópolis', 'SC'],
  ['Brasília', 'DF'], ['Vitória', 'ES'], ['Natal', 'RN'],
];

const TEXTOS = [
  'Chegou em uma semana, bem antes do previsto. Tecido muito bom.',
  'Recebi em 6 dias úteis. Qualidade acima do que eu esperava.',
  'Entrega rápida, menos de 10 dias. Camisa igual à da foto.',
  'Chegou muito rápido e bem embalada. Recomendo.',
  'Demorou 8 dias e valeu a espera. Costura caprichada.',
  'Produto conforme o anunciado, entrega dentro do prazo.',
  'Muito bom o acabamento. Chegou antes do prazo informado.',
  'Segunda vez que compro. Sempre chega rápido.',
];

/** Sorteio estável: o mesmo produto sempre recebe a mesma amostra. */
function semente(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function gerarPara(handle) {
  const s = semente(handle);
  const quantidade = (s % 5) + 3;
  const comentarios = [];

  for (let i = 0; i < quantidade; i++) {
    const k = s + i * 977;
    const [cidade, uf] = LUGARES[k % LUGARES.length];
    const nota = 4 + ((k % 3) === 0 ? 1 : 0);
    const diasAtras = (k % 60) + 3;

    comentarios.push({
      id: uid('av'),
      nome: NOMES[k % NOMES.length],
      cidade,
      uf,
      nota,
      texto: TEXTOS[k % TEXTOS.length],
      data: new Date(Date.now() - diasAtras * 86400000).toISOString(),
      demo: true,
    });
  }

  const media = comentarios.reduce((soma, c) => soma + c.nota, 0) / comentarios.length;
  return {
    nota: Math.round(media * 10) / 10,
    avaliacoes: comentarios.length,
    comentarios,
  };
}

export function aplicarDemo(catalogo, handles) {
  const produtos = { ...catalogo.products };

  for (const handle of handles) {
    // Não sobrescreve avaliação de cliente real.
    const atual = produtos[handle];
    if (_optionalChain([atual, 'optionalAccess', _ => _.comentarios, 'optionalAccess', _2 => _2.some, 'call', _3 => _3((c) => !c.demo)])) continue;

    produtos[handle] = { ...atual, ...gerarPara(handle) };
  }

  return { ...catalogo, products: produtos };
}

export function removerDemo(catalogo) {
  const produtos = {};

  for (const [handle, patch] of Object.entries(catalogo.products)) {
    const reais = (_nullishCoalesce(patch.comentarios, () => ( []))).filter((c) => !c.demo);

    if (reais.length > 0) {
      const media = reais.reduce((s, c) => s + c.nota, 0) / reais.length;
      produtos[handle] = {
        ...patch,
        comentarios: reais,
        nota: Math.round(media * 10) / 10,
        avaliacoes: reais.length,
      };
      continue;
    }

    // Sem avaliação real: limpa nota, contagem e comentários.
    const { nota: _n, avaliacoes: _a, comentarios: _c, ...resto } = patch;
    if (Object.keys(resto).length > 0) produtos[handle] = resto;
  }

  return { ...catalogo, products: produtos };
}

/** Quantos produtos estão com avaliação de demonstração ativa. */
export function contarDemo(catalogo) {
  return Object.values(catalogo.products).filter((p) =>
    _optionalChain([p, 'access', _4 => _4.comentarios, 'optionalAccess', _5 => _5.some, 'call', _6 => _6((c) => c.demo)])
  ).length;
}
