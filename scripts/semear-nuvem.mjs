/**
 * Gera os comandos SQL que levam o catálogo assado (src/data) para o Supabase.
 *
 * Não fala com a rede: só escreve arquivos .sql em um diretório de saída,
 * para serem aplicados de uma vez. Assim dá para revisar antes de gravar.
 *
 *   node scripts/semear-nuvem.mjs [diretorio-de-saida]
 */
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const saida = process.argv[2] ?? 'scripts/sql';
mkdirSync(saida, { recursive: true });

/**
 * collections.ts não é um literal: monta o array a partir de mapas. Recortar
 * texto não resolveria, então o jeito honesto é compilar e importar de fato.
 */
const temporario = join(saida, '_dados.mjs');
await build({
  entryPoints: ['src/data/index-seed.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: temporario,
  logLevel: 'silent',
});

const { products: produtos, collections: colecoes } = await import(
  pathToFileURL(temporario).href
);
rmSync(temporario, { force: true });

/** O preço gravado em data/ é o CUSTO do fornecedor, nunca o preço de venda. */
const custoDe = (p) => {
  const precos = p.variants.map((v) => v.price).filter((n) => Number.isFinite(n) && n > 0);
  return precos.length ? Math.min(...precos) : Number(p.price) || 0;
};

const aspas = (s) => `'${String(s ?? '').replace(/'/g, "''")}'`;
const json = (v) => `${aspas(JSON.stringify(v))}::jsonb`;
const arr = (v) => `${aspas(JSON.stringify(v ?? []))}::jsonb`;

const linhaProduto = (p) =>
  `(${aspas(p.handle)},${aspas(p.title)},${aspas(p.type)},${aspas(p.vendor)},` +
  `array(select jsonb_array_elements_text(${arr(p.tags)})),` +
  `${json(p.options)},${json(p.variants)},` +
  `array(select jsonb_array_elements_text(${arr(p.images)})),` +
  `${aspas(p.descriptionHtml)},${custoDe(p)},${p.available ? 'true' : 'false'},'fornecedor')`;

const COLUNAS =
  '(handle,titulo,tipo,fornecedor,tags,opcoes,variantes,imagens,descricao_html,custo,disponivel,origem)';

// O upsert preserva `custo` quando o lojista já ajustou algo na nuvem? Não:
// o custo é do fornecedor e sempre vence. O que é do lojista mora em
// loja_catalogo (overrides), então reescrever aqui é seguro.
const CONFLITO =
  'on conflict (handle) do update set titulo=excluded.titulo,tipo=excluded.tipo,' +
  'fornecedor=excluded.fornecedor,tags=excluded.tags,opcoes=excluded.opcoes,' +
  'variantes=excluded.variantes,imagens=excluded.imagens,' +
  'descricao_html=excluded.descricao_html,custo=excluded.custo,disponivel=excluded.disponivel';

const POR_LOTE = 25;
let n = 0;

for (let i = 0; i < produtos.length; i += POR_LOTE) {
  const lote = produtos.slice(i, i + POR_LOTE);
  const sql = `insert into public.produtos ${COLUNAS} values\n${lote
    .map(linhaProduto)
    .join(',\n')}\n${CONFLITO};\n`;

  const nome = join(saida, `produtos-${String(++n).padStart(2, '0')}.sql`);
  writeFileSync(nome, sql);
  console.log(`${nome} — ${lote.length} produtos, ${(sql.length / 1024).toFixed(0)} KB`);
}

const sqlCategorias =
  `insert into public.categorias (handle,titulo,subtitulo,produtos,ordem) values\n` +
  colecoes
    .map(
      (c, i) =>
        `(${aspas(c.handle)},${aspas(c.title)},${aspas(c.subtitle)},` +
        `array(select jsonb_array_elements_text(${arr(c.productHandles)})),${i})`
    )
    .join(',\n') +
  `\non conflict (handle) do update set titulo=excluded.titulo,subtitulo=excluded.subtitulo,` +
  `produtos=excluded.produtos,ordem=excluded.ordem;\n`;

writeFileSync(join(saida, 'categorias.sql'), sqlCategorias);
console.log(`${join(saida, 'categorias.sql')} — ${colecoes.length} categorias`);
console.log(`\nTotal: ${produtos.length} produtos em ${n} lotes.`);
