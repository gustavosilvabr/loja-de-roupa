import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chave = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

/**
 * Cliente do banco na nuvem. Se as variáveis não estiverem configuradas,
 * fica `null` e a loja continua funcionando só com o navegador — assim
 * ninguém fica com a tela branca por causa de um .env faltando.
 */
export const supabase: SupabaseClient | null =
  url && chave
    ? createClient(url, chave, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export const nuvemAtiva = Boolean(supabase);

export const URL_PUBLICA_IMAGENS = url ? `${url}/storage/v1/object/public/imagens/` : '';
