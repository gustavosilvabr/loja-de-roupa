/**
 * Ponte entre a referência "local:<id>" e a URL de objeto que o <img> entende.
 *
 * É um módulo global de propósito: `img()` é uma função pura chamada em dezenas
 * de lugares e não pode virar hook. O provider preenche este mapa uma vez ao
 * carregar e avisa os interessados.
 */

const urls = new Map<string, string>();
const ouvintes = new Set<() => void>();

export function registrarUrl(ref: string, url: string) {
  const anterior = urls.get(ref);
  if (anterior && anterior !== url) URL.revokeObjectURL(anterior);
  urls.set(ref, url);
}

export function esquecerUrl(ref: string) {
  const url = urls.get(ref);
  if (url) URL.revokeObjectURL(url);
  urls.delete(ref);
}

export function limparUrls() {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
}

export function urlDe(ref: string): string | undefined {
  return urls.get(ref);
}

export function avisarMudanca() {
  for (const ouvinte of ouvintes) ouvinte();
}

export function ouvir(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
