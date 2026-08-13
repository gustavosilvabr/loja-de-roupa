import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = import.meta.env as Record<string, string | undefined>;

// Aceita os apelidos mais comuns para não depender do nome exato usado na Vercel.
const url = env.VITE_SUPABASE_URL || env.VITE_SUPABASE_PROJECT_URL;
const chave =
  env.VITE_SUPABASE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLIC_KEY;

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
