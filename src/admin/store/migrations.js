import { DEFAULT_SETTINGS } from '../defaults';
import { load, save } from './persist';


/**
 * Versão do formato das configurações. Ao corrigir um dado que já pode ter
 * sido gravado no navegador do lojista, incremente aqui e adicione o passo
 * correspondente em MIGRACOES — assim a correção chega sem apagar o resto.
 */
export const SCHEMA_VERSION = 2;

const KEY = 'schemaVersion';



const MIGRACOES = {
  // v2 — os escudos dos times estavam pareados com o clube errado, então
  // clicar num escudo levava para a coleção de outro time.
  2: (s) => ({
    ...s,
    teams: s.teams.map((time) => {
      const correto = DEFAULT_SETTINGS.teams.find((t) => t.handle === time.handle);
      return correto ? { ...time, crest: correto.crest, name: correto.name } : time;
    }),
  }),
};

export function migrar(settings) {
  const atual = load(KEY, 0);
  if (atual >= SCHEMA_VERSION) return settings;

  let out = settings;
  for (let v = atual + 1; v <= SCHEMA_VERSION; v++) {
    const passo = MIGRACOES[v];
    if (passo) out = passo(out);
  }

  save(KEY, SCHEMA_VERSION);
  return out;
}
