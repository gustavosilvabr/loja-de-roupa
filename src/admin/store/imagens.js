 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }/* ============================================================
   Armazenamento de imagens enviadas do computador.

   Por que IndexedDB e não localStorage: o localStorage tem ~5 MB
   no total e já guarda catálogo, pedidos e configurações. Uma foto
   de celular vira ~5,3 MB em base64 sozinha. O IndexedDB guarda
   Blob binário e tem cota muito maior.

   Uma imagem local é referenciada por "local:<id>". Quem exibe
   converte a referência em URL de objeto (ver imagensLocais.ts).
   ============================================================ */

const DB = 'xingsun-imagens';
const STORE = 'arquivos';
const VERSAO = 1;

export const PREFIXO = 'local:';














export const ehLocal = (src) => src.startsWith(PREFIXO);
export const idDe = (ref) => ref.slice(PREFIXO.length);
export const refDe = (id) => `${PREFIXO}${id}`;

function abrir() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(_nullishCoalesce(req.error, () => ( new Error('Não consegui abrir o banco de imagens'))));
  });
}

function transacao(
  modo,
  fn
) {
  return abrir().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, modo);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(_nullishCoalesce(req.error, () => ( new Error('Falha ao acessar as imagens'))));
        tx.oncomplete = () => db.close();
      })
  );
}

/** Limites de compressão — o suficiente para foto de produto em tela cheia. */
export const LARGURA_MAXIMA = 1600;
export const QUALIDADE = 0.82;
export const TAMANHO_MAXIMO_ENTRADA = 25 * 1024 * 1024;

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export function validarArquivo(file) {
  if (!file.type.startsWith('image/')) return `"${file.name}" não é uma imagem.`;
  if (!TIPOS_ACEITOS.includes(file.type)) {
    return `Formato ${file.type} não suportado. Use JPG, PNG ou WebP.`;
  }
  if (file.size > TAMANHO_MAXIMO_ENTRADA) {
    return `"${file.name}" tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é 25 MB.`;
  }
  return null;
}







/**
 * Reduz a imagem para no máximo LARGURA_MAXIMA e reencoda em WebP.
 * Uma foto de 4 MB costuma cair para menos de 300 KB sem perda visível.
 * GIF passa direto — reencodar mataria a animação.
 */
export async function comprimir(file) {
  if (file.type === 'image/gif') {
    return { blob: file, largura: 0, altura: 0 };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { blob: file, largura: 0, altura: 0 };

  const escala = Math.min(1, LARGURA_MAXIMA / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return { blob: file, largura: bitmap.width, altura: bitmap.height };
  }

  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALIDADE)
  );

  // Se a compressão não ajudou, fica com o original.
  if (!blob || blob.size >= file.size) {
    return { blob: file, largura, altura };
  }
  return { blob, largura, altura };
}

let contador = 0;

export async function salvarImagem(file) {
  const { blob, largura, altura } = await comprimir(file);

  const id = `img_${Date.now().toString(36)}_${(contador++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  const registro = {
    id,
    nome: file.name,
    tipo: blob.type || file.type,
    tamanho: blob.size,
    largura,
    altura,
    criadaEm: Date.now(),
    blob,
  };

  await transacao('readwrite', (store) => store.put(registro));

  const { blob: _descartado, ...meta } = registro;
  return meta;
}

export async function lerTodas() {
  const todas = await transacao('readonly', (store) => store.getAll());
  return _nullishCoalesce(todas, () => ( []));
}

export async function apagarImagem(id) {
  await transacao('readwrite', (store) => store.delete(id));
}

export async function apagarTodas() {
  await transacao('readwrite', (store) => store.clear());
}

/** Quanto as imagens ocupam e quanto o navegador ainda permite. */
export async function uso() {
  const todas = await lerTodas();
  const usado = todas.reduce((s, i) => s + i.tamanho, 0);

  if (!_optionalChain([navigator, 'access', _ => _.storage, 'optionalAccess', _2 => _2.estimate])) return { usado, disponivel: null };

  try {
    const est = await navigator.storage.estimate();
    return { usado, disponivel: _nullishCoalesce(est.quota, () => ( null)) };
  } catch (e) {
    return { usado, disponivel: null };
  }
}

export const formatarBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/* ---------- backup ---------- */












const blobParaDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(_nullishCoalesce(leitor.error, () => ( new Error('Falha ao ler a imagem'))));
    leitor.readAsDataURL(blob);
  });

/** Empacota as imagens para caberem no arquivo JSON de backup. */
export async function exportarImagens() {
  const todas = await lerTodas();
  return Promise.all(
    todas.map(async ({ blob, tamanho: _t, ...meta }) => ({
      ...meta,
      dados: await blobParaDataUrl(blob),
    }))
  );
}

/** Restaura as imagens de um backup, mantendo os mesmos ids. */
export async function importarImagens(lista) {
  let restauradas = 0;

  for (const item of lista) {
    try {
      const blob = await (await fetch(item.dados)).blob();
      const registro = {
        id: item.id,
        nome: item.nome,
        tipo: item.tipo || blob.type,
        tamanho: blob.size,
        largura: item.largura,
        altura: item.altura,
        criadaEm: item.criadaEm,
        blob,
      };
      await transacao('readwrite', (store) => store.put(registro));
      restauradas++;
    } catch (e2) {
      // Uma imagem corrompida no arquivo não pode derrubar a restauração toda.
    }
  }

  return restauradas;
}
