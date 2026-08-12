/**
 * Baixa todas as imagens do catálogo para public/produtos/ e reescreve
 * src/data/products.ts apontando para os arquivos locais.
 *
 * Rode ANTES de cancelar o Shopify — depois disso as URLs do CDN morrem.
 *
 *   node scripts/baixar-imagens.mjs
 *
 * É seguro rodar de novo: imagens já baixadas são puladas.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access, readdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'produtos');
const DATA_FILE = join(ROOT, 'src', 'data', 'products.ts');
const SITE_FILE = join(ROOT, 'src', 'data', 'site.ts');
const CONCURRENCY = 6;

const exists = (p) =>
  access(p).then(
    () => true,
    () => false
  );

/** Nome de arquivo curto e estável a partir da URL. */
function localName(url) {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 12);
  let ext = extname(new URL(url).pathname).toLowerCase();
  if (!/^\.(png|jpe?g|webp|avif|gif|svg)$/.test(ext)) ext = '.jpg';
  return `${hash}${ext}`;
}

async function download(url, dest) {
  if (await exists(dest)) return 'cache';

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; xingsun-migracao)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('arquivo vazio');

  await writeFile(dest, buf);
  return 'ok';
}

/** Executa tarefas com um limite de paralelismo. */
async function pool(items, limit, worker) {
  const results = [];
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  });

  await Promise.all(runners);
  return results;
}

async function main() {
  const dataSrc = await readFile(DATA_FILE, 'utf8');
  const siteSrc = await readFile(SITE_FILE, 'utf8');

  const urlPattern = /https:\/\/(?:cdn\.shopify\.com|xingestoque\.com)\/[^"'\s)]+/g;
  const urls = [
    ...new Set([...(dataSrc.match(urlPattern) ?? []), ...(siteSrc.match(urlPattern) ?? [])]),
  ];

  if (urls.length === 0) {
    console.log('Nenhuma URL do Shopify encontrada — parece que já foi migrado.');
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Encontradas ${urls.length} imagens. Baixando (${CONCURRENCY} por vez)...\n`);

  let done = 0;
  let cached = 0;
  const failed = [];

  const map = new Map();

  await pool(urls, CONCURRENCY, async (url) => {
    const name = localName(url);
    try {
      const status = await download(url, join(OUT_DIR, name));
      map.set(url, `/produtos/${name}`);
      if (status === 'cache') cached++;
      else done++;
    } catch (err) {
      failed.push({ url, reason: err.message });
    }

    const total = done + cached + failed.length;
    if (total % 20 === 0 || total === urls.length) {
      process.stdout.write(`  ${total}/${urls.length}\r`);
    }
  });

  console.log(`\n\nBaixadas: ${done} | já existiam: ${cached} | falharam: ${failed.length}`);

  if (failed.length) {
    console.log('\nFalhas (as URLs originais foram mantidas nesses casos):');
    failed.slice(0, 10).forEach((f) => console.log(`  ${f.reason}  ${f.url.slice(0, 90)}`));
    if (failed.length > 10) console.log(`  ...e mais ${failed.length - 10}`);
  }

  if (map.size === 0) {
    console.log('\nNada para reescrever.');
    return;
  }

  // Backup antes de reescrever
  await writeFile(`${DATA_FILE}.bak`, dataSrc);
  await writeFile(`${SITE_FILE}.bak`, siteSrc);

  const swap = (src) => {
    let out = src;
    for (const [url, local] of map) out = out.split(url).join(local);
    return out;
  };

  await writeFile(DATA_FILE, swap(dataSrc));
  await writeFile(SITE_FILE, swap(siteSrc));

  const files = await readdir(OUT_DIR);
  console.log(`\nArquivos em public/produtos/: ${files.length}`);
  console.log('products.ts e site.ts reescritos (backups em .bak).');
  console.log('\nConfira com "npm run dev" antes de apagar os .bak.');
}

main().catch((err) => {
  console.error('\nErro:', err.message);
  process.exit(1);
});
