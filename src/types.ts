export interface Variant {
  id: string;
  title: string;
  /** primeira opção — normalmente o Tamanho */
  o1: string | null;
  /** segunda opção — normalmente "Personalizar Camisa" (Não/Sim) */
  o2: string | null;
  /** Preço de venda ao cliente (já com markup aplicado). */
  price: number;
  /** Quanto a peça custa no fornecedor. Preenchido ao resolver o catálogo. */
  custo?: number;
  compareAt: number | null;
  available: boolean;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  type: string;
  vendor: string;
  tags: string[];
  options: ProductOption[];
  variants: Variant[];
  images: string[];
  image: string;
  /** menor preço de VENDA entre as variantes (já com markup) */
  price: number;
  /** menor custo de fornecedor entre as variantes */
  custo?: number;
  /** Avaliação real informada no painel — ausente quando ninguém avaliou. */
  nota?: number;
  avaliacoes?: number;
  /** Selo exibido no cartão ("LANÇAMENTO", "MAIS VENDIDO"…). */
  selo?: string;
  /** Comentários exibidos na página do produto. */
  comentarios?: import('./admin/types').Avaliacao[];
  compareAt: number | null;
  available: boolean;
  descriptionHtml: string;
}

export interface Collection {
  handle: string;
  title: string;
  subtitle: string;
  productHandles: string[];
}

export interface CartLine {
  key: string;
  productHandle: string;
  variantId: string;
  title: string;
  variantTitle: string;
  image: string;
  price: number;
  quantity: number;
  properties?: Record<string, string>;
}
