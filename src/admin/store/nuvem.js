 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { supabase, URL_PUBLICA_IMAGENS } from '../../lib/supabase';


/* ============================================================
   Ponte com o Supabase.

   Regra de ouro: nada aqui pode derrubar a loja. Se a nuvem
   estiver fora do ar, cada função devolve null/false e o site
   segue rodando com o que está salvo no navegador.
   ============================================================ */

const semNuvem = () => !supabase;

/* ---------- sessão do lojista ---------- */

export async function entrar(email, senha) {
  if (!supabase) return 'A nuvem não está configurada neste site.';

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (!error) return null;

  if (error.message.includes('Invalid login')) return 'E-mail ou senha incorretos.';
  if (error.message.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Veja a caixa de entrada.';
  }
  return error.message;
}

export async function criarConta(email, senha) {
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
  if (data.user && _optionalChain([data, 'access', _ => _.user, 'access', _2 => _2.identities, 'optionalAccess', _3 => _3.length]) === 0) {
    return 'Esse e-mail já tem conta. Use "Entrar" ou "Esqueci minha senha".';
  }

  return null;
}

/** Envia o e-mail de redefinição. O link volta para /admin. */
export async function recuperarSenha(email) {
  if (!supabase) return 'A nuvem não está configurada neste site.';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin`,
  });

  return error ? error.message : null;
}

/** Grava a nova senha. Só funciona com a sessão aberta pelo link do e-mail. */
export async function definirNovaSenha(senha) {
  if (!supabase) return 'A nuvem não está configurada neste site.';
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';

  const { error } = await supabase.auth.updateUser({ password: senha });
  return error ? error.message : null;
}

/** true quando o usuário chegou pelo link de recuperação de senha. */
export function aoPedirNovaSenha(fn) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'PASSWORD_RECOVERY') fn();
  });
  return () => data.subscription.unsubscribe();
}

export async function sair() {
  await _optionalChain([supabase, 'optionalAccess', _4 => _4.auth, 'access', _5 => _5.signOut, 'call', _6 => _6()]);
}

export async function emailLogado() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return _nullishCoalesce(_optionalChain([data, 'access', _7 => _7.user, 'optionalAccess', _8 => _8.email]), () => ( null));
}

export function aoMudarSessao(fn) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
    fn(_nullishCoalesce(_optionalChain([sessao, 'optionalAccess', _9 => _9.user, 'optionalAccess', _10 => _10.email]), () => ( null)));
  });
  return () => data.subscription.unsubscribe();
}

/* ---------- configuração e catálogo ---------- */

async function lerDocumento(tabela) {
  if (!supabase) return null;

  const { data, error } = await supabase.from(tabela).select('dados').eq('id', 1).maybeSingle();
  if (error || !data) return null;

  const dados = data.dados ;
  // Documento vazio é o estado recém-criado: não sobrescreve o local.
  if (!dados || Object.keys(dados ).length === 0) return null;
  return dados;
}

async function gravarDocumento(
  tabela,
  dados
) {
  if (!supabase) return false;

  const { error } = await supabase
    .from(tabela)
    .update({ dados, atualizado_em: new Date().toISOString() })
    .eq('id', 1);

  return !error;
}

export const carregarConfig = () => lerDocumento('loja_config');
export const salvarConfig = (dados) => gravarDocumento('loja_config', dados);

export const carregarCatalogo = () => lerDocumento('loja_catalogo');
export const salvarCatalogo = (dados) => gravarDocumento('loja_catalogo', dados);

/* ---------- pedidos ---------- */

export async function salvarPedido(pedido) {
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

export async function atualizarStatusPedido(id, status) {
  if (!supabase) return false;
  const { error } = await supabase.from('pedidos').update({ status }).eq('id', id);
  return !error;
}
















export async function listarPedidos() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(500);

  if (error || !data) return null;

  return (data ).map((p) => ({
    id: p.id,
    createdAt: new Date(p.criado_em).getTime(),
    status: p.status,
    customer: p.cliente,
    lines: p.itens,
    subtotal: Number(p.subtotal),
    discount: Number(p.desconto),
    shipping: Number(p.frete),
    shippingMethod: _nullishCoalesce(p.metodo_frete, () => ( '')),
    total: Number(p.total),
    payment: _nullishCoalesce(p.pagamento, () => ( '')),
    sessionId: _nullishCoalesce(p.sessao_id, () => ( '')),
  }));
}

/* ---------- visitas ---------- */

export async function registrarVisita(s) {
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














export async function listarVisitas() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('visitas')
    .select('*')
    .order('iniciada_em', { ascending: false })
    .limit(1000);

  if (error || !data) return null;

  return (data ).map((v) => ({
    id: v.id,
    startedAt: new Date(v.iniciada_em).getTime(),
    lastSeenAt: new Date(v.vista_em).getTime(),
    referrer: _nullishCoalesce(v.origem, () => ( 'direto')),
    device: v.dispositivo,
    pageViews: v.paginas,
    addedToCart: v.adicionou_carrinho,
    reachedCheckout: v.chegou_checkout,
    purchased: v.comprou,
    exitPath: _nullishCoalesce(v.pagina_saida, () => ( '')),
  }));
}

/* ---------- carrinhos abandonados ---------- */

export async function salvarCarrinhoAbandonado(c) {
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

export async function removerCarrinhoAbandonado(sessaoId) {
  if (!supabase) return;
  await supabase.from('carrinhos_abandonados').delete().eq('sessao_id', sessaoId);
}










export async function listarCarrinhos() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('carrinhos_abandonados')
    .select('*')
    .order('atualizado_em', { ascending: false })
    .limit(300);

  if (error || !data) return null;

  return (data ).map((c) => ({
    id: c.sessao_id,
    sessionId: c.sessao_id,
    updatedAt: new Date(c.atualizado_em).getTime(),
    email: _nullishCoalesce(c.email, () => ( '')),
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
export async function enviarImagem(arquivo, nome) {
  if (!supabase) return null;

  const extensao = (_nullishCoalesce(nome.split('.').pop(), () => ( 'webp'))).toLowerCase();
  const caminho = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}.${extensao}`;

  const { error } = await supabase.storage.from('imagens').upload(caminho, arquivo, {
    contentType: arquivo.type || 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) return null;
  return `${URL_PUBLICA_IMAGENS}${caminho}`;
}

export async function apagarImagemNuvem(url) {
  if (!supabase || !url.startsWith(URL_PUBLICA_IMAGENS)) return false;
  const caminho = url.slice(URL_PUBLICA_IMAGENS.length).split('?')[0];
  const { error } = await supabase.storage.from('imagens').remove([caminho]);
  return !error;
}

export const ehImagemDaNuvem = (url) =>
  Boolean(URL_PUBLICA_IMAGENS) && url.startsWith(URL_PUBLICA_IMAGENS);

export { semNuvem };
