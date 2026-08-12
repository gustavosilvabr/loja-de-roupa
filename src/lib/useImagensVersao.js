import { useSyncExternalStore } from 'react';
import { ouvir } from './imagensLocais';

let versao = 0;
const assinantes = new Set();

// Toda mudança no mapa de imagens locais vira uma nova "versão".
ouvir(() => {
  versao += 1;
  for (const notificar of assinantes) notificar();
});

function inscrever(notificar) {
  assinantes.add(notificar);
  return () => assinantes.delete(notificar);
}

/**
 * Faz o componente re-renderizar quando as imagens locais são carregadas
 * ou alteradas. Usado uma única vez na raiz: `img()` é função pura e não
 * consegue avisar sozinha que a URL de objeto ficou pronta.
 */
export function useImagensVersao() {
  return useSyncExternalStore(
    inscrever,
    () => versao,
    () => 0
  );
}
