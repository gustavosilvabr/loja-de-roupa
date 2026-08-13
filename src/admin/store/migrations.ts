import { DEFAULT_SETTINGS } from '../defaults';
import { load, save } from './persist';
import type { StoreSettings } from '../types';

/**
 * Versão do formato das configurações. Ao corrigir um dado que já pode ter
 * sido gravado no navegador do lojista, incremente aqui e adicione o passo
 * correspondente em MIGRACOES — assim a correção chega sem apagar o resto.
 */
export const SCHEMA_VERSION = 4;

const KEY = 'schemaVersion';

type Migracao = (s: StoreSettings) => StoreSettings;

const MIGRACOES: Record<number, Migracao> = {
  // v2 — os escudos dos times estavam pareados com o clube errado, então
  // clicar num escudo levava para a coleção de outro time.
  2: (s) => ({
    ...s,
    teams: s.teams.map((time) => {
      const correto = DEFAULT_SETTINGS.teams.find((t) => t.handle === time.handle);
      return correto ? { ...time, crest: correto.crest, name: correto.name } : time;
    }),
  }),
  // v3 — a loja foi renomeada de Xing Sun para GP ESPORTES. Quem já tinha
  // configurações salvas continuava vendo o nome antigo no título e no rodapé.
  3: (s) => trocarNome(s) as StoreSettings,
  // v4 — os banners e o menu apontavam para agrupamentos do fornecedor
  // ("produtos mais vendidos"), onde time europeu, brasileiro e seleção vinham
  // misturados. Agora existem coleções próprias; quem já tinha configuração
  // salva continuava caindo na lista bagunçada.
  4: corrigirLinks,
};

/** Destinos antigos que nunca deveriam ter sido usados nestes lugares. */
const LINKS_ERRADOS = new Set([
  '/colecoes/produtos-mais-vendidos',
  '/colecoes/real-madrid',
  '/colecoes/barcelona',
  '/colecoes/manchester-city',
  '/colecoes/nacional-premium',
]);

function corrigirLinks(s: StoreSettings): StoreSettings {
  /**
   * Só mexe no que está comprovadamente errado: mesma posição (id) e destino
   * na lista acima. Um link que o lojista trocou de propósito fica como está.
   */
  const realinhar = <T extends { id: string; to: string }>(itens: T[], padrao: T[]): T[] =>
    itens.map((item) => {
      if (!LINKS_ERRADOS.has(item.to)) return item;
      const certo = padrao.find((p) => p.id === item.id);
      return certo && certo.to !== item.to ? { ...item, to: certo.to } : item;
    });

  return {
    ...s,
    nav: realinhar(s.nav, DEFAULT_SETTINGS.nav),
    featureBanners: realinhar(s.featureBanners, DEFAULT_SETTINGS.featureBanners),
    collectionBanners: realinhar(s.collectionBanners, DEFAULT_SETTINGS.collectionBanners),
  };
}

/** Troca o nome antigo por GP ESPORTES em qualquer texto das configurações. */
function trocarNome(valor: unknown): unknown {
  if (typeof valor === 'string') {
    return valor
      .replace(/XING\s*SUN/g, 'GP ESPORTES')
      .replace(/Xing\s*Sun/g, 'GP ESPORTES')
      .replace(/xing\s*sun(?!:)/g, 'GP ESPORTES');
  }
  if (Array.isArray(valor)) return valor.map(trocarNome);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([k, v]) => [k, trocarNome(v)])
    );
  }
  return valor;
}

export function migrar(settings: StoreSettings): StoreSettings {
  const atual = load<number>(KEY, 0);
  if (atual >= SCHEMA_VERSION) return settings;

  let out = settings;
  for (let v = atual + 1; v <= SCHEMA_VERSION; v++) {
    const passo = MIGRACOES[v];
    if (passo) out = passo(out);
  }

  save(KEY, SCHEMA_VERSION);
  return out;
}
