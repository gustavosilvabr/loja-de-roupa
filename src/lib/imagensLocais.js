/**
 * Ponte entre a referência "local:<id>" e a URL de objeto que o <img> entende.
 *
 * É um módulo global de propósito: `img()` é uma função pura chamada em dezenas
 * de lugares e não pode virar hook. O provider preenche este mapa uma vez ao
 * carregar e avisa os interessados.
 */

const urls = new Map();
const ouvintes = new Set();

export function registrarUrl(ref, url) {
  const anterior = urls.get(ref);
  if (anterior && anterior !== url) URL.revokeObjectURL(anterior);
  urls.set(ref, url);
}

export function esquecerUrl(ref) {
  const url = urls.get(ref);
  if (url) URL.revokeObjectURL(url);
  urls.delete(ref);
}

export function limparUrls() {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
}

export function urlDe(ref) {
  return urls.get(ref);
}

export function avisarMudanca() {
  for (const ouvinte of ouvintes) ouvinte();
}

export function ouvir(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
