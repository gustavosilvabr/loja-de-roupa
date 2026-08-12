// Conteúdo editorial do site: menu, banners, FAQ, rodapé.
// Tudo aqui é texto/imagem — altere à vontade sem mexer no código dos componentes.

export const SITE = {
  name: 'XING SUN',
  phone: '11 98960-9774',
  email: 'xingsunoficial@gmail.com',
  instagram: 'https://www.instagram.com/serg_nspu',
  hours: ['Seg. à Sex. 09:00h às 18:30h', 'Sáb. 09:00h às 13:00h'],
  logo: 'https://cdn.shopify.com/s/files/1/0692/7810/5648/files/logo-8295108138068651999-1782329577-53f8d12a9955e1e2511ee458b17b61bb1782329577-480-0.webp',
  pixDiscount: 0.05,
};

export const ANNOUNCEMENTS = [
  '🍀 5% OFF no Pix!',
  '🚚 Estoque nacional — expedição em 24 horas',
  '📦 Desconto progressivo no atacado',
];

export const NAV = [
  { label: 'Início', to: '/' },
  { label: 'Titular', to: '/colecoes/titular' },
  { label: 'Reserva', to: '/colecoes/reserva' },
  { label: 'Feminina', to: '/colecoes/feminina' },
  { label: 'Infantil', to: '/colecoes/infantil' },
  { label: 'Retrô', to: '/colecoes/retro' },
  { label: 'Promoções', to: '/colecoes/promocao-nacional' },
  { label: 'Rastreie seu Pedido', to: '/rastreio' },
];

const CDN = 'https://xingestoque.com/cdn/shop';









/** Banners reais da loja, servidos direto do CDN. */
export const HERO_SLIDES = [
  {
    title: 'Quanto mais você compra, menos você paga',
    desktop: `${CDN}/files/BANNER-1-DESK_11.png`,
    mobile: `${CDN}/files/BANNER-1-MOB_11.png`,
    to: '/colecoes/titular',
    alt: 'Quanto mais você compra, menos você paga — desconto progressivo no atacado',
  },
  {
    title: 'Lançamentos 2026/27',
    desktop: `${CDN}/files/BANNER-3-DESK_4.png`,
    mobile: `${CDN}/files/BANNER-3-MOB_8.png`,
    to: '/colecoes/titular',
    alt: 'Lançamentos 2026/27 — tudo em primeira mão',
  },
  {
    title: 'Promoção nacional',
    desktop: `${CDN}/files/BANNER-4-DESK_3.png`,
    mobile: `${CDN}/files/BANNER-4-MOB_5.png`,
    to: '/colecoes/promocao-nacional',
    alt: 'Promoção nacional XING SUN',
  },
];

export const PROMO_BANNER = {
  desktop: `${CDN}/files/BANNER-2-DESK2_1.png`,
  mobile: `${CDN}/files/BANNER-2-MOB2_1.png`,
  to: '/colecoes/produtos-mais-vendidos',
  alt: 'Estoque 100% nacional — receba em poucos dias, expedição em 24 horas',
};








export const FEATURE_BANNERS = [
  {
    title: 'Lançamentos 2025',
    to: '/colecoes/produtos-mais-vendidos',
    size: 'large',
    image: `${CDN}/files/download_-_2026-07-09T085642.436.png`,
  },
  {
    title: 'Brasileirão',
    to: '/colecoes/promocao-nacional',
    size: 'small',
    image: `${CDN}/files/download_-_2026-07-09T085851.206.png`,
  },
  {
    title: 'Internacionais',
    to: '/colecoes/real-madrid',
    size: 'small',
    image: `${CDN}/files/download_-_2026-07-09T090208.727.png`,
  },
  {
    title: 'Para crianças',
    to: '/colecoes/infantil',
    size: 'small',
    image: `${CDN}/files/download_-_2026-07-09T090215.035.png`,
  },
];







export const TEAMS = [
  { name: 'Barcelona', handle: 'barcelona', crest: `${CDN}/collections/vwpvry1467462651.png` },
  { name: 'Flamengo', handle: 'flamengo', crest: `${CDN}/collections/vwvwrw1473502969.png` },
  { name: 'Palmeiras', handle: 'palmeiras', crest: `${CDN}/collections/sxpupx1473538135.png` },
  { name: 'Manchester City', handle: 'manchester-city', crest: `${CDN}/collections/wq9sir1639406443.png` },
  { name: 'Real Madrid', handle: 'real-madrid', crest: `${CDN}/collections/syptwx1473538074.png` },
  { name: 'São Paulo', handle: 'sao-paulo', crest: `${CDN}/collections/vsqwqp1473538105.png` },
  { name: 'Vasco', handle: 'vasco', crest: `${CDN}/collections/ynqlxo1630521109.png` },
];







export const COLLECTION_BANNERS = [
  {
    title: 'Seleções',
    to: '/colecoes/copa-do-mundo-2026',
    image: `${CDN}/files/download_-_2026-07-09T064255.479.png`,
  },
  {
    title: 'Feminina',
    to: '/colecoes/feminina',
    image: `${CDN}/files/download_-_2026-07-09T081605.681.png`,
  },
  {
    title: 'Chaveiros',
    to: '/colecoes/acessorios',
    image: `${CDN}/files/download_-_2026-07-09T064251.542.png`,
  },
];

export const PAYMENT_ICONS = [
  { name: 'Mastercard', src: `${CDN}/files/mastercard_2x_4641a6f2-cdd0-46f8-8da3-b88053f8ce2f.png` },
  { name: 'Visa', src: `${CDN}/files/visa_2x_a352c18d-0ad1-4f2a-a3d2-49c9df187a16.png` },
  { name: 'Elo', src: `${CDN}/files/elo_2x_3023e018-4799-4478-a7e4-9263f0428ae5.png` },
  { name: 'Discover', src: `${CDN}/files/discover_2x_160ca16f-07a4-49a4-9b0c-a9d92b574286.png` },
  { name: 'American Express', src: `${CDN}/files/amex_2x_72a33397-a799-4b0a-9674-ad8d4c662087.png` },
  { name: 'PIX', src: `${CDN}/files/pix_2x_d7d656b4-19eb-4c33-8e35-7a45298a06b2.png` },
  { name: 'Diners', src: `${CDN}/files/diners_2x_e474d083-19de-4700-a55b-194afe40d96f.png` },
  { name: 'Hipercard', src: `${CDN}/files/hipercard_2x_5e9589bc-8c7f-44a1-b64f-4a0874c1f1ab.png` },
  { name: 'Bradesco', src: `${CDN}/files/bradesco_2x_1c883d0b-efec-4fa6-ab48-22eade2ddf44.png` },
];

export const TRUST_BADGES = [
  { name: 'Reclame Aqui', src: `${CDN}/files/xs-reclame-aqui.png` },
];

export const FAQ = [
  {
    q: 'Qual é o prazo de entrega?',
    a: 'Todo o nosso estoque já está no Brasil. A expedição acontece em até 24 horas úteis após a confirmação do pagamento e o prazo de entrega varia de 3 a 10 dias úteis conforme a transportadora escolhida no checkout.',
  },
  {
    q: 'Qual o pedido mínimo?',
    a: 'Não trabalhamos com pedido mínimo. Você pode comprar uma única peça, mas quanto maior a quantidade, maior o desconto progressivo aplicado no carrinho.',
  },
  {
    q: 'Formas de pagamento?',
    a: 'Aceitamos PIX (com 5% de desconto), cartão de crédito em até 12x, boleto bancário e as principais bandeiras: Visa, Mastercard, Elo, American Express, Hipercard e Diners.',
  },
  {
    q: 'Como funcionam as grades?',
    a: 'Cada modelo é vendido nos tamanhos P, M, G, GG, 2GG e 3XL, conforme a disponibilidade em estoque. Você monta a grade que quiser, misturando tamanhos e modelos no mesmo pedido.',
  },
  {
    q: 'Posso personalizar?',
    a: 'Sim. Na página do produto, selecione "Personalizar Camisa: Sim" e informe o nome e o número que devem ser aplicados. A personalização é feita no mesmo dia da expedição e tem custo adicional já exibido no preço.',
  },
];

export const FOOTER_LINKS = {
  institucional: [
    { label: 'Aviso Legal', to: '/paginas/aviso-legal' },
    { label: 'Contato', to: '/paginas/contato' },
    { label: 'Quem Somos', to: '/paginas/quem-somos' },
    { label: 'Política de Cookies', to: '/paginas/politica-de-cookies' },
    { label: 'Política de Privacidade', to: '/paginas/politica-de-privacidade' },
    { label: 'Política de Trocas e Devoluções', to: '/paginas/trocas-e-devolucoes' },
    { label: 'Termos e Condições de Serviço', to: '/paginas/termos-e-condicoes' },
  ],
  rapido: [
    { label: 'Início', to: '/' },
    { label: 'Titular', to: '/colecoes/titular' },
    { label: 'Reserva', to: '/colecoes/reserva' },
    { label: 'Feminina', to: '/colecoes/feminina' },
    { label: 'Infantil', to: '/colecoes/infantil' },
    { label: 'Retrô', to: '/colecoes/retro' },
    { label: 'Promoções', to: '/colecoes/promocao-nacional' },
    { label: 'Rastreie seu Pedido', to: '/rastreio' },
  ],
};

export const SHIPPING_RATES = [
  { name: 'Loggi Express', carrier: 'Melhor Envio', days: '5 a 7 dias úteis', price: 17.49 },
  { name: 'Correios PAC', carrier: 'Melhor Envio', days: '6 a 8 dias úteis', price: 25.41 },
  { name: 'JeT Standard', carrier: 'Melhor Envio', days: '6 a 8 dias úteis', price: 32.97 },
  { name: 'Correios SEDEX', carrier: 'Melhor Envio', days: '3 a 4 dias úteis', price: 35.34 },
  { name: 'Jadlog .Package Centralizado', carrier: 'Melhor Envio', days: '8 a 10 dias úteis', price: 40.66 },
];
