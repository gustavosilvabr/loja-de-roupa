# GP ESPORTES — loja em React

Réplica da loja `xingestoque.com` em React + TypeScript + Vite + Tailwind + GSAP,
feita para rodar sem Shopify.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run preview    # serve o dist/
```

---

## O que já funciona

| Página | Rota | Situação |
|---|---|---|
| Home | `/` | Slideshow, countdown, 5 carrosséis, banners, escudos, FAQ |
| Coleção | `/colecoes/:handle` | 21 coleções, filtro de disponibilidade e preço, ordenação |
| Produto | `/produtos/:handle` | Galeria, variantes, personalização, patches, frete, quantidade |
| Busca | `/busca?q=` | Busca por título, sem acento |
| Checkout | `/checkout` | Formulário completo, CEP automático, frete, resumo |
| Institucional | `/paginas/:slug` | 7 páginas de política |
| Rastreio | `/rastreio` | Tela pronta, sem integração |

Carrinho persiste em `localStorage` e sobrevive ao reload.

---

## Dados

O catálogo real (**205 produtos, 21 coleções**) foi extraído da loja e vive em:

- `src/data/products.ts` — produtos, variantes, preços, imagens
- `src/data/collections.ts` — quais produtos pertencem a cada coleção
- `src/data/site.ts` — menu, banners, FAQ, rodapé, fretes

### ⚠️ As imagens apontam para o CDN do Shopify

Como você pediu, nada foi baixado — as URLs apontam para
`cdn.shopify.com` e `xingestoque.com/cdn`.

**Se você cancelar o Shopify, essas imagens somem e a loja fica sem foto nenhuma.**

Antes de cancelar, baixe tudo e troque as URLs:

```bash
# baixa todas as imagens para public/produtos/
node scripts/baixar-imagens.mjs
```

O script já está pronto na pasta `scripts/`. Ele salva os arquivos e reescreve
`src/data/products.ts` para apontar para os arquivos locais.

---

## O que falta para vender de verdade

O checkout **monta e valida o pedido, mas não cobra**. Faltam três peças:

### 1. Gateway de pagamento

Nenhum gateway roda 100% no navegador — todos exigem um servidor que guarde a
chave secreta. Opções no Brasil:

| Gateway | Taxa aproximada | Observação |
|---|---|---|
| Mercado Pago | ~4,99% crédito / 0,99% PIX | Checkout Pro é o mais rápido de plugar |
| Pagar.me | ~3,99% + R$ 0,40 | Boa API, split de pagamento |
| Stripe | 3,99% + R$ 0,39 | PIX disponível, ótima documentação |

O caminho mais curto é uma serverless function (Vercel/Netlify) que cria a
preferência de pagamento e devolve a URL de redirecionamento. Em
`src/pages/Checkout.tsx`, a função `submit()` é o ponto de troca.

### 2. Estoque

Hoje o estoque é o snapshot do dia da extração. Sem sincronizar, você vende o
que já acabou. Alternativas: Supabase, Firebase ou uma planilha via API.

### 3. Pedidos

Não há onde os pedidos caem. Mínimo viável: gravar em Supabase e disparar um
e-mail (Resend/SendGrid) para você e para o cliente.

---

## Correções já aplicadas em relação à loja atual

Três problemas que existem hoje no `xingestoque.com` foram corrigidos aqui:

**1. Oversell da personalização.** Na loja atual, M, G, 2XL e 3XL do Flamengo
aparecem esgotados, mas voltam a ficar compráveis por R$ 120 se você marcar
"Personalizar: Sim" — porque o estoque só foi lançado nas variantes "Não".
Aqui, `isAvailable()` em `src/lib/catalog.ts` sempre lê o estoque da
variante-base, então um tamanho esgotado continua esgotado.

**2. Campo de quantidade.** A PDP atual não tem seletor de quantidade — numa
loja de atacado. Aqui tem, na página do produto e no carrinho.

**3. Preço "de/por".** Os R$ 229,90 de `compare_at_price` estão cadastrados no
Shopify mas nunca aparecem na tela. Aqui o valor riscado é exibido junto com o
percentual de desconto.

Também incluí um **banner de consentimento LGPD** (`src/components/CookieBanner.tsx`),
que a loja atual não tem. Só carregue Hotjar, Meta Pixel ou GA **depois** que o
evento `consent` disparar com `granted`.

---

## Estrutura

```
src/
  components/    Header, Footer, CartDrawer, ProductCard, carrosséis, banners
  pages/         Home, Collection, Product, Checkout, Search, StaticPage
  data/          products.ts, collections.ts, site.ts
  lib/           catalog.ts (regras de variante), format.ts (moeda, imagens)
  store/         cart.tsx (contexto do carrinho)
  hooks/         useGsap.ts (animações com respeito a reduced-motion)
```

## Design

Extraído do tema atual: roxo `#8b2fe0`, texto `#121212`, fonte **Inter Tight**,
raio de botão 8px, raio de mídia 12px. Tudo em `tailwind.config.js`.

## Publicar

Site estático — sobe em qualquer lugar, de graça:

```bash
npm run build
# Vercel:  npx vercel --prod
# Netlify: npx netlify deploy --prod --dir=dist
```

Configure o *fallback* para `index.html` (SPA), senão as rotas dão 404 ao
recarregar a página.

## Aviso

As camisas são réplicas e os escudos/marcas pertencem aos clubes e fabricantes.
Mantenha o **Aviso Legal** (`/paginas/aviso-legal`) publicado e revise as
políticas com seu jurídico antes de ir ao ar.
