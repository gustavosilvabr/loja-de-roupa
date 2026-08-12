/* ============================================================
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

export interface ImagemLocal {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  largura: number;
  altura: number;
  criadaEm: number;
  blob: Blob;
}

export type MetaImagem = Omit<ImagemLocal, 'blob'>;

export const ehLocal = (src: string) => src.startsWith(PREFIXO);
export const idDe = (ref: string) => ref.slice(PREFIXO.length);
export const refDe = (id: string) => `${PREFIXO}${id}`;

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Não consegui abrir o banco de imagens'));
  });
}

function transacao<T>(
  modo: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return abrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, modo);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('Falha ao acessar as imagens'));
        tx.oncomplete = () => db.close();
      })
  );
}

/** Limites de compressão — o suficiente para foto de produto em tela cheia. */
export const LARGURA_MAXIMA = 1600;
export const QUALIDADE = 0.82;
export const TAMANHO_MAXIMO_ENTRADA = 25 * 1024 * 1024;

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export function validarArquivo(file: File): string | null {
  if (!file.type.startsWith('image/')) return `"${file.name}" não é uma imagem.`;
  if (!TIPOS_ACEITOS.includes(file.type)) {
    return `Formato ${file.type} não suportado. Use JPG, PNG ou WebP.`;
  }
  if (file.size > TAMANHO_MAXIMO_ENTRADA) {
    return `"${file.name}" tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é 25 MB.`;
  }
  return null;
}

interface Comprimida {
  blob: Blob;
  largura: number;
  altura: number;
}

/**
 * Reduz a imagem para no máximo LARGURA_MAXIMA e reencoda em WebP.
 * Uma foto de 4 MB costuma cair para menos de 300 KB sem perda visível.
 * GIF passa direto — reencodar mataria a animação.
 */
export async function comprimir(file: File): Promise<Comprimida> {
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

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALIDADE)
  );

  // Se a compressão não ajudou, fica com o original.
  if (!blob || blob.size >= file.size) {
    return { blob: file, largura, altura };
  }
  return { blob, largura, altura };
}

let contador = 0;

export async function salvarImagem(file: File): Promise<MetaImagem> {
  const { blob, largura, altura } = await comprimir(file);

  const id = `img_${Date.now().toString(36)}_${(contador++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  const registro: ImagemLocal = {
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

export async function lerTodas(): Promise<ImagemLocal[]> {
  const todas = await transacao<ImagemLocal[]>('readonly', (store) => store.getAll());
  return todas ?? [];
}

export async function apagarImagem(id: string): Promise<void> {
  await transacao('readwrite', (store) => store.delete(id));
}

export async function apagarTodas(): Promise<void> {
  await transacao('readwrite', (store) => store.clear());
}

/** Quanto as imagens ocupam e quanto o navegador ainda permite. */
export async function uso(): Promise<{ usado: number; disponivel: number | null }> {
  const todas = await lerTodas();
  const usado = todas.reduce((s, i) => s + i.tamanho, 0);

  if (!navigator.storage?.estimate) return { usado, disponivel: null };

  try {
    const est = await navigator.storage.estimate();
    return { usado, disponivel: est.quota ?? null };
  } catch {
    return { usado, disponivel: null };
  }
}

export const formatarBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/* ---------- backup ---------- */

export interface ImagemExportada {
  id: string;
  nome: string;
  tipo: string;
  largura: number;
  altura: number;
  criadaEm: number;
  /** Conteúdo em base64 (data URL). */
  dados: string;
}

const blobParaDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error ?? new Error('Falha ao ler a imagem'));
    leitor.readAsDataURL(blob);
  });

/** Empacota as imagens para caberem no arquivo JSON de backup. */
export async function exportarImagens(): Promise<ImagemExportada[]> {
  const todas = await lerTodas();
  return Promise.all(
    todas.map(async ({ blob, tamanho: _t, ...meta }) => ({
      ...meta,
      dados: await blobParaDataUrl(blob),
    }))
  );
}

/** Restaura as imagens de um backup, mantendo os mesmos ids. */
export async function importarImagens(lista: ImagemExportada[]): Promise<number> {
  let restauradas = 0;

  for (const item of lista) {
    try {
      const blob = await (await fetch(item.dados)).blob();
      const registro: ImagemLocal = {
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
    } catch {
      // Uma imagem corrompida no arquivo não pode derrubar a restauração toda.
    }
  }

  return restauradas;
}
