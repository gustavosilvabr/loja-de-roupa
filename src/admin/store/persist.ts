/** Camada de persistência do painel. Hoje é localStorage; trocar por API
 *  significa reimplementar só estas quatro funções. */

const PREFIX = 'xingsun:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clear(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignora */
  }
}

/** Merge profundo usado ao hidratar configurações salvas sobre os defaults,
 *  para que campos novos adicionados no código não fiquem `undefined`. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === null || patch === undefined) return base;
  if (Array.isArray(base) || Array.isArray(patch)) return (patch as T) ?? base;
  if (typeof base !== 'object' || typeof patch !== 'object') return (patch as T) ?? base;

  const out = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    out[k] = k in out ? deepMerge(out[k], v) : v;
  }
  return out as T;
}

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
