 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }/** Camada de persistência do painel. Hoje é localStorage; trocar por API
 *  significa reimplementar só estas quatro funções. */

const PREFIX = 'xingsun:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) ;
  } catch (e) {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e2) {
    return false;
  }
}

export function clear(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (e3) {
    /* ignora */
  }
}

/** Merge profundo usado ao hidratar configurações salvas sobre os defaults,
 *  para que campos novos adicionados no código não fiquem `undefined`. */
export function deepMerge(base, patch) {
  if (patch === null || patch === undefined) return base;
  if (Array.isArray(base) || Array.isArray(patch)) return _nullishCoalesce((patch ), () => ( base));
  if (typeof base !== 'object' || typeof patch !== 'object') return _nullishCoalesce((patch ), () => ( base));

  const out = { ...(base ) };
  for (const [k, v] of Object.entries(patch )) {
    out[k] = k in out ? deepMerge(out[k], v) : v;
  }
  return out ;
}

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
