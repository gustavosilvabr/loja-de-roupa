import { supabase, URL_PUBLICA_IMAGENS } from '../../lib/supabase';
import type { AbandonedCart, CatalogOverrides, Order, StoreSettings, VisitorSession } from '../types';
import type { Collection, Product } from '../../types';

/* ============================================================
   Ponte com o Supabase.

   Regra de ouro: nada aqui pode derrubar a loja. Se a nuvem
   estiver fora do ar, cada função devolve null/false e o site
   segue rodando com o que está salvo no navegador.
   ============================================================ */

const semNuvem = () => !supabase;

/* ---------- sessão do lojista ---------- */

export async function entrar(email: string, senha: string): Promise<string | null> {
  if (!supabase) return 'A nuvem não está configurada neste site.';

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (!error) return null;

  if (error.message.includes('Invalid login')) return 'E-mail ou senha incorretos.';
  if (error.message.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Veja a caixa de entrada.';
  }
  return error.message;
}

export async function criarConta(email: string, senha: string): Promise<string | null> {
  if (!supabase) return 'A nuvem não está configurada neste site.';
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';

  const { data, error } = await supabase.auth.signUp({ email, password: senha });

  if (error) {
    if (error.message.includes('already registered')) {
      return 'Esse e-mail já tem conta. Use "Entrar" ou "Esqueci minha senha".';
    }
    if (error.message.includes('permissão')) {
      return 'Este e-mail não tem permissão para acessar o painel.';
    }
    return error.message;
  }

  // O Supabase responde 200 mesmo quando o e-mail já existe, para não
  // revelar quais endereços têm conta. O sinal real é `identities` vazio.
  if (data.user && data.user.identities?.length === 0) {
    return 'Esse e-mail já tem conta. Use "Entrar" ou "Esqueci minha senha".';
  }

  return null;
}

/** Envia o e-mail de redefinição. O link volta para /admin. */
export async function recuperarSenha(email: string): Promise<string | null> {
  if (!supabase) return 'A nuvem não está configurada neste site.';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin`,
  });

  return error ? error.message : null;
}

/** Grava a nova senha. Só funciona com a sessão aberta pelo link do e-mail. */
export async function definirNovaSenha(senha: string): Promise<string | null> {
  if (!supabase) return 'A nuvem não está configurada neste site.';
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';

  const { error } = await supabase.auth.updateUser({ password: senha });
  return error ? error.message : null;
}

/** true quando o usuário chegou pelo link de recuperação de senha. */
export function aoPedirNovaSenha(fn: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'PASSWORD_RECOVERY') fn();
  });
  return () => data.subscription.unsubscribe();
}

export async function sair(): Promise<void> {
  await supabase?.auth.signOut();
}

export async function emailLogado(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export function aoMudarSessao(fn: (email: string | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
    fn(sessao?.user?.email ?? null);
  });
  return () => data.subscription.unsubscribe();
}

/* ---------- configuração e catálogo ---------- */

async function lerDocumento<T>(tabela: 'loja_config' | 'loja_catalogo'): Promise<T | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.from(tabela).select('dados').eq('id', 1).maybeSingle();
  if (error || !data) return null;

  const dados = data.dados as T;
  // Documento vazio é o estado recém-criado: não sobrescreve o local.
  if (!dados || Object.keys(dados as object).length === 0) return null;
  return dados;
}

async function gravarDocumento(
  tabela: 'loja_config' | 'loja_catalogo',
  dados: unknown
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from(tabela)
    .update({ dados, atualizado_em: new Date().toISOString() })
    .eq('id', 1);

  return !error;
}

export const carregarConfig = () => lerDocumento<StoreSettings>('loja_config');
export const salvarConfig = (dados: StoreSettings) => gravarDocumento('loja_config', dados);

export const carregarCatalogo = () => lerDocumento<CatalogOverrides>('loja_catalogo');
export const salvarCatalogo = (dados: CatalogOverrides) => gravarDocumento('loja_catalogo', dados);

/* ---------- pedidos ---------- */

export async function salvarPedido(pedido: Order): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('pedidos').insert({
    id: pedido.id,
    criado_em: new Date(pedido.createdAt).toISOString(),
    status: pedido.status,
    cliente: pedido.customer,
    itens: pedido.lines,
    subtotal: pedido.subtotal,
    desconto: pedido.discount,
    frete: pedido.shipping,
    metodo_frete: pedido.shippingMethod,
    total: pedido.total,
    pagamento: pedido.payment,
    sessao_id: pedido.sessionId,
  });

  return !error;
}

export async function atualizarStatusPedido(id: string, status: Order['status']) {
  if (!supabase) return false;
  const { error } = await supabase.from('pedidos').update({ status }).eq('id', id);
  return !error;
}

interface LinhaPedido {
  id: string;
  criado_em: string;
  status: Order['status'];
  cliente: Order['customer'];
  itens: Order['lines'];
  subtotal: number;
  desconto: number;
  frete: number;
  metodo_frete: string | null;
  total: number;
  pagamento: string | null;
  sessao_id: string | null;
}

export async function listarPedidos(): Promise<Order[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(500);

  if (error || !data) return null;

  return (data as LinhaPedido[]).map((p) => ({
    id: p.id,
    createdAt: new Date(p.criado_em).getTime(),
    status: p.status,
    customer: p.cliente,
    lines: p.itens,
    subtotal: Number(p.subtotal),
    discount: Number(p.desconto),
    shipping: Number(p.frete),
    shippingMethod: p.metodo_frete ?? '',
    total: Number(p.total),
    payment: p.pagamento ?? '',
    sessionId: p.sessao_id ?? '',
  }));
}

/* ---------- visitas ---------- */

export async function registrarVisita(s: VisitorSession): Promise<void> {
  if (!supabase) return;

  await supabase.from('visitas').upsert(
    {
      id: s.id,
      iniciada_em: new Date(s.startedAt).toISOString(),
      vista_em: new Date(s.lastSeenAt).toISOString(),
      origem: s.referrer,
      dispositivo: s.device,
      paginas: s.pageViews,
      adicionou_carrinho: s.addedToCart,
      chegou_checkout: s.reachedCheckout,
      comprou: s.purchased,
      pagina_saida: s.exitPath,
    },
    { onConflict: 'id' }
  );
}

interface LinhaVisita {
  id: string;
  iniciada_em: string;
  vista_em: string;
  origem: string | null;
  dispositivo: VisitorSession['device'];
  paginas: number;
  adicionou_carrinho: boolean;
  chegou_checkout: boolean;
  comprou: boolean;
  pagina_saida: string | null;
}

export async function listarVisitas(): Promise<VisitorSession[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('visitas')
    .select('*')
    .order('iniciada_em', { ascending: false })
    .limit(1000);

  if (error || !data) return null;

  return (data as LinhaVisita[]).map((v) => ({
    id: v.id,
    startedAt: new Date(v.iniciada_em).getTime(),
    lastSeenAt: new Date(v.vista_em).getTime(),
    referrer: v.origem ?? 'direto',
    device: v.dispositivo,
    pageViews: v.paginas,
    addedToCart: v.adicionou_carrinho,
    reachedCheckout: v.chegou_checkout,
    purchased: v.comprou,
    exitPath: v.pagina_saida ?? '',
  }));
}

/* ---------- carrinhos abandonados ---------- */

export async function salvarCarrinhoAbandonado(c: AbandonedCart): Promise<void> {
  if (!supabase) return;

  await supabase.from('carrinhos_abandonados').upsert(
    {
      sessao_id: c.sessionId,
      atualizado_em: new Date(c.updatedAt).toISOString(),
      email: c.email || null,
      itens: c.lines,
      total: c.total,
      chegou_checkout: c.reachedCheckout,
    },
    { onConflict: 'sessao_id' }
  );
}

export async function removerCarrinhoAbandonado(sessaoId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('carrinhos_abandonados').delete().eq('sessao_id', sessaoId);
}

interface LinhaCarrinho {
  sessao_id: string;
  atualizado_em: string;
  email: string | null;
  itens: AbandonedCart['lines'];
  total: number;
  chegou_checkout: boolean;
}

export async function listarCarrinhos(): Promise<AbandonedCart[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('carrinhos_abandonados')
    .select('*')
    .order('atualizado_em', { ascending: false })
    .limit(300);

  if (error || !data) return null;

  return (data as LinhaCarrinho[]).map((c) => ({
    id: c.sessao_id,
    sessionId: c.sessao_id,
    updatedAt: new Date(c.atualizado_em).getTime(),
    email: c.email ?? '',
    lines: c.itens,
    total: Number(c.total),
    reachedCheckout: c.chegou_checkout,
  }));
}

/* ---------- imagens ---------- */

/**
 * Sobe a imagem e devolve a URL pública definitiva — não uma referência
 * "local:". É isso que faz a foto aparecer no celular do cliente.
 */
export async function enviarImagem(arquivo: Blob, nome: string): Promise<string | null> {
  if (!supabase) return null;

  const extensao = (nome.split('.').pop() ?? 'webp').toLowerCase();
  const caminho = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}.${extensao}`;

  const { error } = await supabase.storage.from('imagens').upload(caminho, arquivo, {
    contentType: arquivo.type || 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) return null;
  return `${URL_PUBLICA_IMAGENS}${caminho}`;
}

export async function apagarImagemNuvem(url: string): Promise<boolean> {
  if (!supabase || !url.startsWith(URL_PUBLICA_IMAGENS)) return false;
  const caminho = url.slice(URL_PUBLICA_IMAGENS.length).split('?')[0];
  const { error } = await supabase.storage.from('imagens').remove([caminho]);
  return !error;
}

export const ehImagemDaNuvem = (url: string) =>
  Boolean(URL_PUBLICA_IMAGENS) && url.startsWith(URL_PUBLICA_IMAGENS);

/** Hash curto e estável da URL — mesma origem, mesmo arquivo no Storage. */
function assinatura(texto: string): string {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * Copia uma imagem hospedada fora (CDN do fornecedor) para o Storage.
 * O caminho vem do hash da URL de origem, então rodar duas vezes reaproveita
 * o mesmo arquivo em vez de encher o bucket de cópias.
 *
 * Devolve null quando não dá para copiar — aí a URL antiga continua valendo
 * e nenhuma foto some da loja.
 */
export async function espelharImagem(url: string): Promise<string | null> {
  if (!supabase || !url || url.startsWith('local:')) return null;
  if (ehImagemDaNuvem(url)) return url;

  const extensao = (url.split('?')[0].split('.').pop() ?? 'jpg').toLowerCase().slice(0, 5);
  const caminho = `catalogo/${assinatura(url)}.${extensao}`;
  const publica = `${URL_PUBLICA_IMAGENS}${caminho}`;

  // Se já foi espelhada antes, não baixa de novo.
  const { data: existente } = await supabase.storage
    .from('imagens')
    .list('catalogo', { search: `${assinatura(url)}.` });
  if (existente?.length) return publica;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const blob = await res.blob();
    // Sem upsert de propósito: o Storage só tem política de INSERT, não de
    // UPDATE. Se o arquivo já existir, o conflito é a resposta certa — o
    // conteúdo é o mesmo, já que o caminho vem do hash da própria URL.
    const { error } = await supabase.storage.from('imagens').upload(caminho, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });

    if (!error) return publica;
    return /exists|duplicate|409/i.test(error.message) ? publica : null;
  } catch {
    // CORS, rede fora, arquivo removido da origem — nada disso pode parar a loja.
    return null;
  }
}

/* ---------- catálogo ---------- */

interface LinhaProduto {
  handle: string;
  titulo: string;
  tipo: string;
  fornecedor: string | null;
  tags: string[];
  opcoes: Product['options'];
  variantes: Product['variants'];
  imagens: string[];
  descricao_html: string;
  custo: number;
  disponivel: boolean;
}

const paraProduto = (l: LinhaProduto): Product => ({
  id: l.handle,
  handle: l.handle,
  title: l.titulo,
  type: l.tipo,
  vendor: l.fornecedor ?? '',
  tags: l.tags ?? [],
  options: l.opcoes ?? [],
  variants: l.variantes ?? [],
  images: l.imagens ?? [],
  image: l.imagens?.[0] ?? '',
  // O preço de venda é recalculado com o markup ao resolver o catálogo.
  price: Number(l.custo),
  custo: Number(l.custo),
  compareAt: null,
  available: l.disponivel,
  descriptionHtml: l.descricao_html ?? '',
});

const paraLinha = (p: Product) => ({
  handle: p.handle,
  titulo: p.title,
  tipo: p.type,
  fornecedor: p.vendor,
  tags: p.tags,
  opcoes: p.options,
  variantes: p.variants,
  imagens: p.images,
  descricao_html: p.descriptionHtml,
  custo: p.custo ?? p.price,
  disponivel: p.available,
});

/** O PostgREST tem teto por requisição; 205 produtos não cabem de uma vez. */
const LOTE = 100;

export async function carregarProdutos(): Promise<Product[] | null> {
  if (!supabase) return null;

  const todos: Product[] = [];
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('titulo')
      .range(inicio, inicio + 999);

    if (error) return todos.length ? todos : null;
    if (!data?.length) break;

    todos.push(...(data as LinhaProduto[]).map(paraProduto));
    if (data.length < 1000) break;
  }

  return todos.length ? todos : null;
}

export async function salvarProdutos(produtos: Product[]): Promise<number> {
  if (!supabase || produtos.length === 0) return 0;

  let gravados = 0;
  for (let i = 0; i < produtos.length; i += LOTE) {
    const lote = produtos.slice(i, i + LOTE).map(paraLinha);
    const { error } = await supabase.from('produtos').upsert(lote, { onConflict: 'handle' });
    if (!error) gravados += lote.length;
  }
  return gravados;
}

export async function salvarProduto(produto: Product): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('produtos')
    .upsert(paraLinha(produto), { onConflict: 'handle' });
  return !error;
}

/** Usado pelo olheiro: atualiza custo e disponibilidade sem tocar no resto. */
export async function atualizarCustoNaNuvem(
  handle: string,
  campos: { custo?: number; disponivel?: boolean }
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('produtos').update(campos).eq('handle', handle);
  return !error;
}

export async function removerProdutoNaNuvem(handle: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('produtos').delete().eq('handle', handle);
  return !error;
}

interface LinhaCategoria {
  handle: string;
  titulo: string;
  subtitulo: string;
  produtos: string[];
  ordem: number;
}

export async function carregarCategorias(): Promise<Collection[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('oculta', false)
    .order('ordem');

  if (error || !data?.length) return null;

  return (data as LinhaCategoria[]).map((c) => ({
    handle: c.handle,
    title: c.titulo,
    subtitle: c.subtitulo ?? '',
    productHandles: c.produtos ?? [],
  }));
}

export async function salvarCategorias(categorias: Collection[]): Promise<number> {
  if (!supabase || categorias.length === 0) return 0;

  const linhas = categorias.map((c, i) => ({
    handle: c.handle,
    titulo: c.title,
    subtitulo: c.subtitle,
    produtos: c.productHandles,
    ordem: i,
  }));

  const { error } = await supabase.from('categorias').upsert(linhas, { onConflict: 'handle' });
  return error ? 0 : linhas.length;
}

export { semNuvem };
