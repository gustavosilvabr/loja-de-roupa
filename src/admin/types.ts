// ============================================================
// CONTRATO COMPARTILHADO DO PAINEL — não altere sem avisar.
// Todas as telas do admin leem e escrevem através destes tipos.
// ============================================================

/* ---------- Configurações da loja ---------- */

export interface WhatsAppConfig {
  enabled: boolean;
  number: string;
  message: string;
  position: 'right' | 'left';
  greeting: string;
}

export type AlinhamentoLogo = 'esquerda' | 'centro' | 'direita';

export interface BrandSettings {
  name: string;
  tagline: string;
  logoUrl: string;
  logoMode: 'texto' | 'imagem';
  /** Altura da logo no cabeçalho, em pixels. */
  logoAltura: number;
  /** Onde a logo fica no cabeçalho no computador. */
  logoAlinhamento: AlinhamentoLogo;
  /** Onde a logo fica no celular — independente do computador. */
  logoAlinhamentoMobile: AlinhamentoLogo;
  /** Respiro em volta da logo, em pixels, para ela não encostar nas bordas. */
  logoEspacamento: number;
  faviconEmoji: string;
  phone: string;
  email: string;
  whatsapp: WhatsAppConfig;
  instagram: string;
  facebook: string;
  tiktok: string;
  hours: string[];
  cnpj: string;
  address: string;
}

export interface ThemeSettings {
  primary: string;
  primaryDark: string;
  ink: string;
  muted: string;
  headerBg: string;
  headerText: string;
  footerBg: string;
  fontHeading: string;
  fontBody: string;
  radiusButton: number;
  radiusMedia: number;
  cardTitleSize: number;
  cardPriceSize: number;
  containerWidth: number;
  buttonUppercase: boolean;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  robots: 'index,follow' | 'noindex,nofollow';
  gscVerification: string;
}

export interface IntegrationSettings {
  facebookPixel: string;
  ga4: string;
  gtm: string;
  tiktokPixel: string;
  hotjar: string;
  requireConsent: boolean;
}

export type GatewayProvider = 'nenhum' | 'mercadopago' | 'pagarme' | 'stripe' | 'pagseguro';

export interface GatewaySettings {
  provider: GatewayProvider;
  publicKey: string;
  sandbox: boolean;
  pixEnabled: boolean;
  pixDiscount: number;
  cardEnabled: boolean;
  maxInstallments: number;
  boletoEnabled: boolean;
  webhookUrl: string;
}

export interface DomainSettings {
  primary: string;
  redirectWww: boolean;
  forceHttps: boolean;
  customDomains: string[];
}

export interface PolicyDoc {
  slug: string;
  title: string;
  body: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  carrier: string;
  days: string;
  price: number;
  enabled: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  to: string;
}

/** Uma seção da home. `type` define o componente; `collection` alimenta os dados. */
export type HomeSectionType =
  | 'hero'
  | 'countdown'
  | 'carousel'
  | 'promoBanner'
  | 'bannerGrid'
  | 'teams'
  | 'collectionBanners'
  | 'faq';

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  enabled: boolean;
  title: string;
  subtitle: string;
  collection: string;
  viewAllTo: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  desktop: string;
  mobile: string;
  to: string;
  alt: string;
  enabled: boolean;
}

export interface BannerItem {
  id: string;
  title: string;
  image: string;
  to: string;
  enabled: boolean;
}

/** A faixa larga que atravessa a home, com arte própria por tamanho de tela. */
export interface PromoBannerSettings {
  desktop: string;
  mobile: string;
  to: string;
  alt: string;
  enabled: boolean;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

/** Regras de preço e os custos que entram no cálculo do lucro. */
export interface PricingSettings {
  /** Markup padrão sobre o custo do fornecedor, em %. 125 faz 80 virar 180. */
  markupPadrao: number;
  /** Arredonda o preço final para terminar em ,90 / ,00 etc. 0 desliga. */
  arredondarPara: number;
  /** Custo médio de frete que a loja absorve por pedido. */
  freteMedio: number;
  /** A loja paga o frete acima deste valor de pedido. 0 = cliente sempre paga. */
  freteGratisAcima: number;
  /** Percentual do gateway (Mercado Pago ~4,99). */
  taxaGateway: number;
  /** Valor fixo por transação do gateway. */
  taxaFixa: number;
  /** Imposto sobre a venda, em %. */
  imposto: number;
  /** Embalagem, etiqueta e afins, por peça. */
  outrosCustos: number;
  /** Margem a partir da qual o lucro é considerado bom (verde). */
  margemBoa: number;
  /** Margem a partir da qual é moderado (amarelo). Abaixo disso, baixo. */
  margemModerada: number;
}

/** Diferenças encontradas pelo olheiro entre a loja de origem e o catálogo local. */
export interface MudancaSync {
  handle: string;
  titulo: string;
  imagem: string;
  tipo: 'novo' | 'preco' | 'estoque' | 'sumiu';
  custoAntigo?: number;
  custoNovo?: number;
  disponivelAntes?: boolean;
  disponivelAgora?: boolean;
}

export interface SyncSettings {
  /** Liga o olheiro automático. */
  ativo: boolean;
  /** Endereço da loja de origem (Shopify). */
  origem: string;
  /** De quantos em quantos minutos verificar. */
  intervaloMinutos: number;
  /** Aplica novos custos automaticamente em vez de só avisar. */
  aplicarAutomatico: boolean;
  /** Importa produtos novos automaticamente. */
  importarNovos: boolean;
}

export interface SyncState {
  ultimaVerificacao: number | null;
  ultimoErro: string | null;
  verificando: boolean;
  mudancas: MudancaSync[];
  /** Custos vistos na última sincronização, por handle. */
  custosConhecidos: Record<string, number>;
}

export interface StoreSettings {
  brand: BrandSettings;
  pricing: PricingSettings;
  sync: SyncSettings;
  theme: ThemeSettings;
  seo: SeoSettings;
  integrations: IntegrationSettings;
  gateway: GatewaySettings;
  domain: DomainSettings;
  policies: PolicyDoc[];
  shipping: ShippingRate[];
  nav: NavItem[];
  announcements: string[];
  home: HomeSection[];
  heroSlides: HeroSlide[];
  promoBanner: PromoBannerSettings;
  featureBanners: BannerItem[];
  collectionBanners: BannerItem[];
  teams: { id: string; name: string; handle: string; crest: string; enabled: boolean }[];
  faq: FaqItem[];
}

/* ---------- Catálogo editável ---------- */

export interface Avaliacao {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
  nota: number;
  texto: string;
  /** Data em ISO. */
  data: string;
  /** true quando veio do gerador de demonstração, não de um cliente real. */
  demo?: boolean;
}

export interface ProductPatch {
  title?: string;
  descriptionHtml?: string;
  images?: string[];
  /** Preço de venda fixo. Quando presente, ignora o markup. */
  price?: number;
  /** Markup próprio deste produto, em %. Sobrepõe o markup padrão da loja. */
  markup?: number;
  /** Custo do fornecedor atualizado pelo olheiro. */
  custo?: number;
  compareAt?: number | null;
  available?: boolean;
  type?: string;
  tags?: string[];
  hidden?: boolean;
  /** Nota de 0 a 5. Só preencha com avaliação real de cliente. */
  nota?: number;
  /** Quantas pessoas avaliaram. Sem isso a nota não aparece. */
  avaliacoes?: number;
  /** Selo do cartão: "LANÇAMENTO", "MAIS VENDIDO", etc. */
  selo?: string;
  /** Comentários exibidos na página do produto. */
  comentarios?: Avaliacao[];
  variantOverrides?: Record<string, { price?: number; available?: boolean }>;
}

export interface CategoryPatch {
  title?: string;
  subtitle?: string;
  productHandles?: string[];
  hidden?: boolean;
}

export interface CatalogOverrides {
  /** handle -> alterações; produtos criados no painel também vivem aqui */
  products: Record<string, ProductPatch>;
  /** produtos criados do zero no painel */
  created: string[];
  /** handles removidos */
  deleted: string[];
  categories: Record<string, CategoryPatch>;
  categoriesCreated: string[];
  categoriesDeleted: string[];
}

/* ---------- Analytics ---------- */

export type EventType =
  | 'session_start'
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search';

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  ts: number;
  sessionId: string;
  path: string;
  data?: Record<string, unknown>;
}

export interface VisitorSession {
  id: string;
  startedAt: number;
  lastSeenAt: number;
  referrer: string;
  device: 'desktop' | 'mobile' | 'tablet';
  pageViews: number;
  addedToCart: boolean;
  reachedCheckout: boolean;
  purchased: boolean;
  exitPath: string;
}

export interface OrderLine {
  productHandle: string;
  title: string;
  variantTitle: string;
  quantity: number;
  price: number;
  image: string;
  properties?: Record<string, string>;
}

export interface Order {
  id: string;
  createdAt: number;
  status: 'pendente' | 'pago' | 'enviado' | 'entregue' | 'cancelado';
  customer: {
    name: string;
    email: string;
    phone: string;
    cep: string;
    address: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
  };
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  shippingMethod: string;
  total: number;
  payment: string;
  sessionId: string;
}

export interface AbandonedCart {
  id: string;
  sessionId: string;
  updatedAt: number;
  email: string;
  lines: OrderLine[];
  total: number;
  reachedCheckout: boolean;
}

export interface AnalyticsState {
  events: AnalyticsEvent[];
  sessions: VisitorSession[];
  orders: Order[];
  abandoned: AbandonedCart[];
}
