import type { StoreSettings } from './types';

const CDN = 'https://xingestoque.com/cdn/shop';

/** Estado inicial do painel — espelha a loja como ela está hoje. */
export const DEFAULT_SETTINGS: StoreSettings = {
  brand: {
    name: 'XING SUN',
    tagline: 'Atacado de Camisas de Futebol | Pronta Entrega',
    logoUrl: `${CDN}/files/logo-8295108138068651999-1782329577-53f8d12a9955e1e2511ee458b17b61bb1782329577-480-0.webp`,
    logoMode: 'texto',
    logoAltura: 36,
    // No computador sobra largura e a logo à esquerda dá lugar ao menu.
    // No celular o menu vira o botão de sanduíche e a logo fica no centro.
    logoAlinhamento: 'esquerda',
    logoAlinhamentoMobile: 'centro',
    logoEspacamento: 8,
    faviconEmoji: '⚽',
    phone: '11 98960-9774',
    email: 'xingsunoficial@gmail.com',
    whatsapp: {
      enabled: true,
      number: '5511989609774',
      message: 'Olá! Vim pelo site e quero saber mais sobre as camisas.',
      position: 'right',
      greeting: 'Fale com a gente',
    },
    instagram: 'https://www.instagram.com/serg_nspu',
    facebook: '',
    tiktok: '',
    hours: ['Seg. à Sex. 09:00h às 18:30h', 'Sáb. 09:00h às 13:00h'],
    cnpj: '',
    address: '',
  },

  // 125% faz uma peça de custo R$ 80 sair por R$ 180.
  // "O dobro" seria 100% (R$ 160) — ajuste em Gestão → Preços e lucro.
  pricing: {
    markupPadrao: 125,
    arredondarPara: 0,
    freteMedio: 25,
    freteGratisAcima: 0,
    taxaGateway: 4.99,
    taxaFixa: 0,
    imposto: 0,
    outrosCustos: 2,
    margemBoa: 40,
    margemModerada: 20,
  },

  sync: {
    ativo: true,
    origem: 'https://xingestoque.com',
    intervaloMinutos: 30,
    aplicarAutomatico: false,
    importarNovos: false,
  },

  theme: {
    primary: '#8b2fe0',
    primaryDark: '#7c22ce',
    ink: '#121212',
    muted: '#999999',
    headerBg: '#000000',
    headerText: '#ffffff',
    footerBg: '#000000',
    fontHeading: 'Inter Tight',
    fontBody: 'Inter Tight',
    radiusButton: 8,
    radiusMedia: 12,
    cardTitleSize: 16,
    cardPriceSize: 19,
    containerWidth: 1600,
    buttonUppercase: true,
  },

  seo: {
    title: 'XING SUN - Atacado de Camisas de Futebol | Pronta Entrega',
    description:
      'Camisas de futebol no atacado, com modelos nacionais, internacionais, retrô, femininos e infantis. Confira o catálogo da XING SUN.',
    keywords: 'camisa de futebol, atacado, retrô, camisa time, pronta entrega',
    ogImage: `${CDN}/files/BANNER-1-DESK_11.png`,
    robots: 'index,follow',
    gscVerification: '',
  },

  integrations: {
    facebookPixel: '',
    ga4: '',
    gtm: '',
    tiktokPixel: '',
    hotjar: '',
    requireConsent: true,
  },

  gateway: {
    provider: 'nenhum',
    publicKey: '',
    sandbox: true,
    pixEnabled: true,
    pixDiscount: 5,
    cardEnabled: true,
    maxInstallments: 12,
    boletoEnabled: true,
    webhookUrl: '',
  },

  domain: {
    primary: 'xingestoque.com',
    redirectWww: true,
    forceHttps: true,
    customDomains: [],
  },

  policies: [
    {
      slug: 'quem-somos',
      title: 'Quem Somos',
      body: 'A XING SUN nasceu para levar o manto do seu time até você sem intermediário e sem espera. Trabalhamos com atacado de camisas de futebol nacionais, internacionais, retrô, femininas e infantis.\n\nTodo o nosso estoque já está no Brasil. Isso significa expedição em até 24 horas úteis e entrega em poucos dias.',
    },
    {
      slug: 'contato',
      title: 'Contato',
      body: 'Telefone e WhatsApp: 11 98960-9774\nE-mail: xingsunoficial@gmail.com\n\nHorário de atendimento: segunda a sexta das 09:00h às 18:30h, e sábado das 09:00h às 13:00h.',
    },
    {
      slug: 'aviso-legal',
      title: 'Aviso Legal',
      body: 'Os produtos comercializados são réplicas de alta qualidade e não são fabricados pelas marcas ou clubes originais.\n\nTodas as marcas, escudos e nomes de clubes citados pertencem aos seus respectivos titulares e são utilizados apenas para fins descritivos.',
    },
    {
      slug: 'politica-de-cookies',
      title: 'Política de Cookies',
      body: 'Usamos cookies para manter seu carrinho salvo, lembrar preferências e entender como a loja é usada.\n\nCookies essenciais não podem ser desativados. Cookies de análise e marketing só são carregados após o seu consentimento.',
    },
    {
      slug: 'politica-de-privacidade',
      title: 'Política de Privacidade',
      body: 'Coletamos apenas os dados necessários para processar o seu pedido: nome, e-mail, telefone, endereço de entrega e informações de pagamento.\n\nNos termos da LGPD (Lei 13.709/2018), você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados a qualquer momento.',
    },
    {
      slug: 'trocas-e-devolucoes',
      title: 'Política de Trocas e Devoluções',
      body: 'Você tem até 7 dias corridos após o recebimento para desistir da compra, conforme o artigo 49 do Código de Defesa do Consumidor.\n\nPara trocas por tamanho, o prazo é de 30 dias. A peça precisa estar sem uso e com etiqueta original.\n\nPeças personalizadas só são trocadas em caso de defeito.',
    },
    {
      slug: 'termos-e-condicoes',
      title: 'Termos e Condições de Serviço',
      body: 'Ao finalizar uma compra você declara ter lido e concordado com estes termos, com a Política de Privacidade e com a Política de Trocas e Devoluções.\n\nOs preços exibidos podem ser alterados sem aviso prévio. O valor válido é o confirmado na finalização do pedido.',
    },
  ],

  shipping: [
    { id: 's1', name: 'Loggi Express', carrier: 'Melhor Envio', days: '5 a 7 dias úteis', price: 17.49, enabled: true },
    { id: 's2', name: 'Correios PAC', carrier: 'Melhor Envio', days: '6 a 8 dias úteis', price: 25.41, enabled: true },
    { id: 's3', name: 'JeT Standard', carrier: 'Melhor Envio', days: '6 a 8 dias úteis', price: 32.97, enabled: true },
    { id: 's4', name: 'Correios SEDEX', carrier: 'Melhor Envio', days: '3 a 4 dias úteis', price: 35.34, enabled: true },
    { id: 's5', name: 'Jadlog .Package', carrier: 'Melhor Envio', days: '8 a 10 dias úteis', price: 40.66, enabled: true },
  ],

  // O menu usa as categorias organizadas por scripts/organizar-categorias.mjs,
  // não os agrupamentos do fornecedor ("titular", "reserva"), que vêm
  // misturados e não dizem nada para o cliente.
  nav: [
    { id: 'n1', label: 'Início', to: '/' },
    { id: 'n2', label: 'Brasileirão', to: '/colecoes/brasileirao' },
    { id: 'n3', label: 'Internacionais', to: '/colecoes/internacional' },
    { id: 'n4', label: 'Seleções', to: '/colecoes/selecoes' },
    { id: 'n5', label: 'Retrô', to: '/colecoes/retro' },
    { id: 'n6', label: 'Feminina', to: '/colecoes/feminina' },
    { id: 'n7', label: 'Infantil', to: '/colecoes/infantil' },
    { id: 'n8', label: 'Rastreie seu Pedido', to: '/rastreio' },
  ],

  announcements: [
    '🍀 5% OFF no Pix!',
    '🚚 Estoque nacional — expedição em 24 horas',
    '📦 Desconto progressivo no atacado',
  ],

  home: [
    { id: 'h1', type: 'hero', enabled: true, title: '', subtitle: '', collection: '', viewAllTo: '' },
    { id: 'h2', type: 'countdown', enabled: true, title: 'Super descontos', subtitle: 'Aproveite! Essas ofertas antes que acabem.', collection: '', viewAllTo: '' },
    { id: 'h3', type: 'carousel', enabled: true, title: 'Mais Vendidas', subtitle: 'Os mais vendidos no mercado', collection: 'produtos-mais-vendidos', viewAllTo: '/colecoes/produtos-mais-vendidos' },
    { id: 'h4', type: 'promoBanner', enabled: true, title: '', subtitle: '', collection: '', viewAllTo: '' },
    { id: 'h5', type: 'carousel', enabled: true, title: 'De volta ao Passado', subtitle: 'O manto daqueles que fizeram história', collection: 'de-volta-ao-passado', viewAllTo: '/colecoes/de-volta-ao-passado' },
    { id: 'h6', type: 'bannerGrid', enabled: true, title: '', subtitle: '', collection: '', viewAllTo: '' },
    { id: 'h7', type: 'teams', enabled: true, title: 'Escolha por time', subtitle: '', collection: '', viewAllTo: '' },
    { id: 'h8', type: 'carousel', enabled: true, title: 'Lançamentos 2026/27', subtitle: 'Tudo em primeira mão pra você', collection: 'titular', viewAllTo: '/colecoes/titular' },
    { id: 'h9', type: 'carousel', enabled: true, title: 'Modelo Player', subtitle: 'A melhor qualidade do mercado', collection: 'modelo-player', viewAllTo: '/colecoes/modelo-player' },
    { id: 'h10', type: 'collectionBanners', enabled: true, title: 'Coleções', subtitle: '', collection: '', viewAllTo: '' },
    { id: 'h11', type: 'carousel', enabled: true, title: 'Kit Infantil', subtitle: 'Quando a paixão vem de berço', collection: 'infantil', viewAllTo: '/colecoes/infantil' },
    { id: 'h12', type: 'faq', enabled: true, title: 'Dúvidas Frequentes', subtitle: '', collection: '', viewAllTo: '' },
  ],

  heroSlides: [
    { id: 'sl1', title: 'Quanto mais você compra, menos você paga', desktop: `${CDN}/files/BANNER-1-DESK_11.png`, mobile: `${CDN}/files/BANNER-1-MOB_11.png`, to: '/colecoes/titular', alt: 'Desconto progressivo no atacado', enabled: true },
    { id: 'sl2', title: 'Lançamentos 2026/27', desktop: `${CDN}/files/BANNER-3-DESK_4.png`, mobile: `${CDN}/files/BANNER-3-MOB_8.png`, to: '/colecoes/titular', alt: 'Lançamentos 2026/27', enabled: true },
    { id: 'sl3', title: 'Promoção nacional', desktop: `${CDN}/files/BANNER-4-DESK_3.png`, mobile: `${CDN}/files/BANNER-4-MOB_5.png`, to: '/colecoes/promocao-nacional', alt: 'Promoção nacional', enabled: true },
  ],

  // Faixa larga "Estoque 100% Nacional". Antes ela reaproveitava um slide do
  // slideshow, então mostrava a arte errada e sumia se aquele slide fosse
  // apagado. Agora tem imagem própria.
  promoBanner: {
    desktop: `${CDN}/files/BANNER-2-DESK2_1.png`,
    mobile: `${CDN}/files/BANNER-2-MOB2_1.png`,
    to: '/colecoes/produtos-mais-vendidos',
    alt: 'Estoque 100% nacional — receba em poucos dias, expedição em 24 horas',
    enabled: true,
  },

  // Par imagem/link conferido dentro de cada <a> do DOM original. O banner
  // grande é o 1527x1030 (1,48:1); os três menores são 1983x793 (2,5:1).
  // Trocar a ordem desalinha as alturas das duas colunas.
  featureBanners: [
    { id: 'fb1', title: 'Lançamentos 2025', image: `${CDN}/files/download_-_2026-07-09T090215.035.png`, to: '/colecoes/produtos-mais-vendidos', enabled: true },
    { id: 'fb2', title: 'Brasileirão', image: `${CDN}/files/download_-_2026-07-09T085851.206.png`, to: '/colecoes/brasileirao', enabled: true },
    { id: 'fb3', title: 'Internacionais', image: `${CDN}/files/download_-_2026-07-09T085642.436.png`, to: '/colecoes/internacional', enabled: true },
    { id: 'fb4', title: 'Para crianças', image: `${CDN}/files/download_-_2026-07-09T090208.727.png`, to: '/colecoes/infantil', enabled: true },
  ],

  collectionBanners: [
    { id: 'cb1', title: 'Seleções', image: `${CDN}/files/download_-_2026-07-09T064255.479.png`, to: '/colecoes/selecoes', enabled: true },
    { id: 'cb2', title: 'Feminina', image: `${CDN}/files/download_-_2026-07-09T081605.681.png`, to: '/colecoes/feminina', enabled: true },
    { id: 'cb3', title: 'Chaveiros', image: `${CDN}/files/download_-_2026-07-09T064251.542.png`, to: '/colecoes/acessorios', enabled: true },
  ],

  // Escudo e handle conferidos par a par contra o DOM da loja original —
  // extrair as duas listas separadas embaralha o pareamento.
  teams: [
    { id: 't1', name: 'Barcelona', handle: 'barcelona', crest: `${CDN}/collections/wq9sir1639406443.png`, enabled: true },
    { id: 't2', name: 'Flamengo', handle: 'flamengo', crest: `${CDN}/collections/syptwx1473538074.png`, enabled: true },
    { id: 't3', name: 'Palmeiras', handle: 'palmeiras', crest: `${CDN}/collections/vsqwqp1473538105.png`, enabled: true },
    { id: 't4', name: 'Manchester City', handle: 'manchester-city', crest: `${CDN}/collections/vwpvry1467462651.png`, enabled: true },
    { id: 't5', name: 'Real Madrid', handle: 'real-madrid', crest: `${CDN}/collections/vwvwrw1473502969.png`, enabled: true },
    { id: 't6', name: 'São Paulo', handle: 'sao-paulo', crest: `${CDN}/collections/sxpupx1473538135.png`, enabled: true },
    { id: 't7', name: 'Vasco', handle: 'vasco', crest: `${CDN}/collections/ynqlxo1630521109.png`, enabled: true },
  ],

  faq: [
    { id: 'f1', q: 'Qual é o prazo de entrega?', a: 'Todo o nosso estoque já está no Brasil. A expedição acontece em até 24 horas úteis após a confirmação do pagamento e o prazo de entrega varia de 3 a 10 dias úteis conforme a transportadora escolhida.' },
    { id: 'f2', q: 'Qual o pedido mínimo?', a: 'Não trabalhamos com pedido mínimo. Você pode comprar uma única peça, mas quanto maior a quantidade, maior o desconto progressivo.' },
    { id: 'f3', q: 'Formas de pagamento?', a: 'Aceitamos PIX (com 5% de desconto), cartão de crédito em até 12x, boleto bancário e as principais bandeiras.' },
    { id: 'f4', q: 'Como funcionam as grades?', a: 'Cada modelo é vendido nos tamanhos P, M, G, GG, 2GG e 3XL, conforme a disponibilidade. Você monta a grade que quiser no mesmo pedido.' },
    { id: 'f5', q: 'Posso personalizar?', a: 'Sim. Na página do produto, selecione "Personalizar Camisa: Sim" e informe nome e número. A personalização é feita no mesmo dia da expedição.' },
  ],
};
