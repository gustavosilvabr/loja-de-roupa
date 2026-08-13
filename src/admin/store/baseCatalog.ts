import { products as produtosAssados } from '../../data/products';
import { collections as colecoesAssadas } from '../../data/collections';
import type { Collection, Product } from '../../types';

/* ============================================================
   De onde sai o catálogo "cru" (antes dos ajustes do painel).

   A loja nasce com o catálogo assado dentro do bundle: mesmo
   sem internet o site abre completo, na primeira pintura, sem
   esperar requisição nenhuma. Quando a nuvem responde, ela
   passa a mandar — é lá que o olheiro grava os produtos novos,
   e é de lá que todo cliente, em qualquer aparelho, lê.

   Se a nuvem estiver vazia ou fora do ar, fica valendo o que
   está assado. Nunca dá tela em branco.
   ============================================================ */

interface Base {
  products: Product[];
  collections: Collection[];
  /** true quando os dados vieram da nuvem, não do bundle. */
  daNuvem: boolean;
}

let atual: Base = {
  products: produtosAssados,
  collections: colecoesAssadas,
  daNuvem: false,
};

const ouvintes = new Set<() => void>();

export function catalogoBase(): Base {
  return atual;
}

/**
 * Troca o catálogo cru pelo que veio da nuvem.
 * Uma lista vazia é ignorada de propósito: se a tabela ainda não foi
 * semeada, é melhor mostrar o catálogo assado do que uma loja sem produtos.
 */
export function definirBase(products: Product[] | null, collections: Collection[] | null) {
  if (!products?.length) return;

  atual = {
    products,
    // Categorias são opcionais: sem elas, as do bundle continuam valendo.
    collections: collections?.length ? collections : colecoesAssadas,
    daNuvem: true,
  };

  for (const fn of ouvintes) fn();
}

/** Volta ao catálogo do bundle. Usado nos testes. */
export function restaurarBase() {
  atual = { products: produtosAssados, collections: colecoesAssadas, daNuvem: false };
  for (const fn of ouvintes) fn();
}

export function assinarBase(fn: () => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}
