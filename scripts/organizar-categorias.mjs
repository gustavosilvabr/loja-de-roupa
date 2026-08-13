/**
 * Organiza os produtos nas categorias da loja.
 *
 *   node scripts/organizar-categorias.mjs           mostra o resultado
 *   node scripts/organizar-categorias.mjs --aplicar grava em data/collections.ts
 *
 * O catálogo do fornecedor vem sem categoria confiável: tudo cai em
 * "titular", "reserva" e "retro" misturados. Este script lê o título de cada
 * produto e decide a categoria pelo time, para a sua loja ficar organizada
 * mesmo que a origem esteja bagunçada.
 *
 * Quando o fornecedor lançar produtos novos, rode de novo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARQ_PRODUTOS = join(RAIZ, 'src/data/products.ts');
const ARQ_COLECOES = join(RAIZ, 'src/data/collections.ts');

const aplicar = process.argv.includes('--aplicar');

/* ============================================================
   LISTAS DE TIMES

   Série A 2026 conferida na tabela oficial do campeonato. As demais
   entradas cobrem clubes de divisões inferiores e clubes históricos
   que aparecem nas camisas retrô.
   ============================================================ */

const CLUBES_BRASILEIROS = [
  // Série A 2026
  'flamengo', 'palmeiras', 'corinthians', 'sao paulo', 'santos', 'gremio',
  'internacional', 'cruzeiro', 'atletico mineiro', 'atletico mg', 'fluminense',
  'vasco', 'vasco da gama', 'botafogo', 'bahia', 'bragantino', 'mirassol',
  'vitoria', 'athletico', 'athletico paranaense', 'chapecoense', 'coritiba',
  'remo',
  // Outras divisões e clubes tradicionais
  'sport', 'sport recife', 'fortaleza', 'ceara', 'goias', 'america mg',
  'juventude', 'cuiaba', 'criciuma', 'nautico', 'paysandu', 'ponte preta',
  'guarani', 'avai', 'figueirense', 'parana', 'portuguesa', 'santa cruz',
  'atletico goianiense', 'operario', 'novorizontino', 'amazonas', 'volta redonda',
  // Variações que aparecem nos títulos do fornecedor
  'corintiano', 'cruzeirense', 'flamenguista', 'palmeirense',
];

const CLUBES_ESTRANGEIROS = [
  // Espanha
  'real madrid', 'barcelona', 'atletico de madrid', 'sevilla', 'valencia',
  'villarreal', 'betis', 'athletic bilbao',
  // Inglaterra
  'manchester united', 'manchester city', 'liverpool', 'arsenal', 'chelsea',
  'tottenham', 'newcastle', 'aston villa', 'everton', 'leeds', 'west ham',
  'wolverhampton', 'nottingham forest', 'brighton',
  // Itália
  'juventus', 'milan', 'inter de milao', 'napoli', 'roma', 'lazio', 'atalanta',
  'fiorentina',
  // Alemanha
  'bayern de munique', 'bayern', 'borussia dortmund', 'borussia', 'dortmund',
  'leverkusen', 'leipzig',
  // França
  'psg', 'paris saint germain', 'marseille', 'monaco', 'lyon', 'lille',
  // Portugal e Holanda
  'porto', 'benfica', 'sporting', 'braga', 'ajax', 'psv', 'feyenoord',
  // Resto do mundo
  // "nacional" (clube uruguaio) e "racing" ficaram de fora de propósito:
  // são palavras genéricas demais. "Nacional" captura a linha "Nacional
  // Premium", que são 5 camisas da seleção brasileira.
  'boca juniors', 'river plate', 'independiente', 'penarol',
  'al nassr', 'al hilal', 'inter miami', 'celtic', 'rangers',
  'galatasaray', 'fenerbahce', 'besiktas',
];

const SELECOES = [
  'brasil', 'selecao brasileira', 'argentina', 'franca', 'alemanha', 'espanha',
  'portugal', 'inglaterra', 'italia', 'holanda', 'paises baixos', 'belgica',
  'uruguai', 'colombia', 'mexico', 'japao', 'croacia', 'escocia', 'marrocos',
  'estados unidos', 'canada', 'chile', 'peru', 'equador', 'paraguai', 'bolivia',
  'venezuela', 'nigeria', 'senegal', 'camaroes', 'gana', 'coreia', 'australia',
  'suica', 'austria', 'dinamarca', 'suecia', 'noruega', 'polonia', 'servia',
  'turquia', 'grecia', 'irlanda', 'gales',
];

const normalizar = (texto) =>
  (texto || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

/**
 * Compara por palavra inteira. Com `includes`, o termo "sport" (Sport Recife)
 * capturaria "SportingBet", que patrocina 5 camisas do Palmeiras, e elas
 * cairiam na categoria errada.
 */
function encontrarTime(titulo, lista) {
  return lista.find((termo) => {
    const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escapado}([^a-z0-9]|$)`).test(titulo);
  });
}

/**
 * Tipos que a loja não vende. Ficam fora de todas as categorias, então não
 * aparecem em nenhuma vitrine. Os produtos seguem no arquivo de dados: se
 * um dia entrarem no catálogo, basta tirar o tipo daqui e rodar de novo.
 */
const TIPOS_EXCLUIDOS = ['Patch'];

function categoriaDe(produto) {
  const titulo = normalizar(produto.title);
  const tags = (produto.tags || []).map(normalizar);

  if (TIPOS_EXCLUIDOS.includes(produto.type)) {
    return { categoria: null, motivo: 'tipo não vendido: ' + produto.type, excluido: true };
  }
  if (produto.type === 'Acessório') return { categoria: 'acessorios', motivo: 'tipo Acessório' };

  // Infantil e retrô são linhas de produto, não times — vêm primeiro.
  if (/infantil/.test(titulo) || tags.includes('infantil')) {
    return { categoria: 'infantil', motivo: 'infantil' };
  }
  if (/retro/.test(titulo)) {
    return { categoria: 'retro', motivo: 'título diz retrô' };
  }

  const brasileiro = encontrarTime(titulo, CLUBES_BRASILEIROS);
  if (brasileiro) return { categoria: 'brasileirao', motivo: brasileiro };

  const estrangeiro = encontrarTime(titulo, CLUBES_ESTRANGEIROS);
  if (estrangeiro) return { categoria: 'internacional', motivo: estrangeiro };

  const selecao = encontrarTime(titulo, SELECOES);
  if (selecao) return { categoria: 'selecoes', motivo: 'seleção ' + selecao };

  if (tags.includes('retro')) return { categoria: 'retro', motivo: 'tag retro' };

  return { categoria: null, motivo: 'time não reconhecido' };
}

const ROTULOS = {
  brasileirao: ['Brasileirão', 'Os clubes do futebol brasileiro'],
  internacional: ['Internacional', 'Clubes da Europa e do mundo'],
  selecoes: ['Seleções', 'Camisas de seleções nacionais'],
  retro: ['Retrô', 'Clássicos que marcaram gerações'],
  infantil: ['Infantil', 'Quando a paixão vem de berço'],
  acessorios: ['Acessórios', 'Complete o seu manto'],
  patches: ['Patches', 'Personalize a sua camisa'],
};

/** Lê um objeto literal do arquivo gerado de coleções. */
function extrairObjeto(fonte, nome, tipo) {
  const marca = `${nome}: Record<string, ${tipo}> = `;
  const i = fonte.indexOf(marca);
  if (i < 0) throw new Error(`não encontrei "${nome}" em collections.ts`);
  const inicio = i + marca.length;
  return JSON.parse(fonte.slice(inicio, fonte.indexOf(';\n', inicio)));
}

function main() {
  const fonteProdutos = readFileSync(ARQ_PRODUTOS, 'utf8');
  const produtos = JSON.parse(
    fonteProdutos.slice(fonteProdutos.indexOf('= [') + 2, fonteProdutos.lastIndexOf('];') + 1)
  );

  const grupos = {};
  const semCategoria = [];

  let excluidos = 0;

  for (const produto of produtos) {
    const { categoria, motivo, excluido } = categoriaDe(produto);
    if (excluido) {
      excluidos++;
      continue;
    }
    if (!categoria) {
      semCategoria.push(produto.title);
      continue;
    }
    (grupos[categoria] ??= []).push({ handle: produto.handle, title: produto.title, motivo });
  }

  console.log(`${produtos.length} produtos analisados\n`);
  for (const [chave, itens] of Object.entries(grupos).sort((a, b) => b[1].length - a[1].length)) {
    console.log('  ' + chave.padEnd(16) + String(itens.length).padStart(4));
  }

  if (excluidos > 0) {
    console.log(`\n${excluidos} produtos fora do catálogo (tipo não vendido).`);
  }

  if (semCategoria.length) {
    console.log(`\n${semCategoria.length} SEM CATEGORIA — adicione o time nas listas do script:`);
    semCategoria.forEach((t) => console.log('  ' + t));
  } else {
    console.log('\nTodos os produtos foram classificados.');
  }

  if (!aplicar) {
    console.log('\nNada foi gravado. Use --aplicar para atualizar as categorias.');
    return;
  }

  const fonteColecoes = readFileSync(ARQ_COLECOES, 'utf8');
  const handles = extrairObjeto(fonteColecoes, 'handles', 'string[]');
  const titles = extrairObjeto(fonteColecoes, 'titles', 'string');
  const subtitles = extrairObjeto(fonteColecoes, 'subtitles', 'string');

  // Categorias que deixaram de existir somem do arquivo.
  for (const chave of ['patches']) {
    if (!grupos[chave]) {
      delete handles[chave];
      delete titles[chave];
      delete subtitles[chave];
    }
  }

  for (const [chave, itens] of Object.entries(grupos)) {
    handles[chave] = itens.map((i) => i.handle);
    const [titulo, sub] = ROTULOS[chave] ?? [chave, ''];
    titles[chave] = titulo;
    subtitles[chave] = sub;
  }

  const saida =
    `// GERADO AUTOMATICAMENTE a partir do catálogo real da GP ESPORTES.\n` +
    `// Categorias organizadas por scripts/organizar-categorias.mjs\n` +
    `/* eslint-disable */\n` +
    `import type { Collection } from '../types';\n\n` +
    `const handles: Record<string, string[]> = ${JSON.stringify(handles)};\n\n` +
    `const titles: Record<string, string> = ${JSON.stringify(titles)};\n\n` +
    `const subtitles: Record<string, string> = ${JSON.stringify(subtitles)};\n\n` +
    `export const collections: Collection[] = Object.keys(handles).map((h) => ({\n` +
    `  handle: h,\n  title: titles[h] ?? h,\n  subtitle: subtitles[h] ?? '',\n` +
    `  productHandles: handles[h],\n}));\n\n` +
    `export const collectionByHandle = new Map(collections.map((c) => [c.handle, c]));\n`;

  writeFileSync(ARQ_COLECOES, saida);
  console.log('\ncollections.ts atualizado.');
}

main();
