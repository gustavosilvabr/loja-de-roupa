import { useEffect, useState } from 'react';
import {
  aoPedirNovaSenha,
  criarConta,
  definirNovaSenha,
  entrar,
  recuperarSenha,
} from './store/nuvem';
import { Button, Card, Field, Input } from './ui';
import { nuvemAtiva } from '../lib/supabase';

type Modo = 'entrar' | 'criar' | 'recuperar' | 'nova-senha';

/**
 * Porta de entrada do painel. Sem login, o Supabase recusa qualquer escrita —
 * é o que impede um estranho de editar a loja com a chave que vai no navegador.
 */
export function Login({ primeiroAcesso }: { primeiroAcesso: boolean }) {
  const [modo, setModo] = useState<Modo>(primeiroAcesso ? 'criar' : 'entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Quem chega pelo link do e-mail de recuperação cai direto na troca de senha.
  useEffect(() => aoPedirNovaSenha(() => setModo('nova-senha')), []);

  const trocarModo = (novo: Modo) => {
    setModo(novo);
    setErro(null);
    setAviso(null);
    setSenha('');
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);

    let falha: string | null = null;

    if (modo === 'entrar') falha = await entrar(email.trim(), senha);
    else if (modo === 'criar') falha = await criarConta(email.trim(), senha);
    else if (modo === 'recuperar') falha = await recuperarSenha(email.trim());
    else falha = await definirNovaSenha(senha);

    setEnviando(false);

    if (falha) {
      setErro(falha);
      return;
    }

    if (modo === 'criar') {
      // trocarModo limpa os avisos, então a mensagem vem depois dele.
      trocarModo('entrar');
      setAviso('Conta criada. Abra o e-mail que enviamos e clique no link para confirmar.');
    } else if (modo === 'recuperar') {
      setAviso(
        `Se ${email.trim()} tiver conta, o link de redefinição chega em instantes. Confira também o spam.`
      );
    } else if (modo === 'nova-senha') {
      setAviso('Senha alterada. Já pode usar o painel.');
    }
  };

  const titulos: Record<Modo, { titulo: string; sub: string; botao: string }> = {
    entrar: {
      titulo: 'Painel da loja',
      sub: 'Entre para editar produtos, preços e aparência.',
      botao: 'Entrar',
    },
    criar: {
      titulo: 'Painel da loja',
      sub: 'Crie a conta de dono da loja.',
      botao: 'Criar conta',
    },
    recuperar: {
      titulo: 'Esqueceu a senha?',
      sub: 'Informe seu e-mail e enviamos um link para criar uma nova.',
      botao: 'Enviar link',
    },
    'nova-senha': {
      titulo: 'Criar nova senha',
      sub: 'Escolha a senha que você vai usar daqui em diante.',
      botao: 'Salvar senha',
    },
  };

  const t = titulos[modo];
  const pedeEmail = modo !== 'nova-senha';
  const pedeSenha = modo !== 'recuperar';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-[15px] font-bold text-white">
            GP
          </span>
          <h1 className="mt-3 text-[22px] font-bold text-slate-900">{t.titulo}</h1>
          <p className="mt-1 text-[13.5px] text-slate-500">{t.sub}</p>
        </div>

        {!nuvemAtiva && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-800"
          >
            A nuvem não está configurada neste site. Configure as variáveis{' '}
            <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_KEY</strong> (chave
            pública/anon, nunca a secreta) na hospedagem e publique de novo para liberar o login.
          </p>
        )}

        <Card>
          <form onSubmit={enviar} className="space-y-4">
            {pedeEmail && (
              <Field label="E-mail">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                />
              </Field>
            )}

            {pedeSenha && (
              <Field
                label={modo === 'nova-senha' ? 'Nova senha' : 'Senha'}
                hint={modo === 'entrar' ? undefined : 'Mínimo de 8 caracteres.'}
              >
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                  required
                  minLength={modo === 'entrar' ? undefined : 8}
                  autoFocus={modo === 'nova-senha'}
                />
              </Field>
            )}

            {erro && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {erro}
                {modo === 'entrar' && /incorret/i.test(erro) && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => trocarModo('recuperar')}
                      className="font-semibold underline"
                    >
                      Criar uma nova senha
                    </button>
                  </>
                )}
              </p>
            )}

            {aviso && (
              <p
                role="status"
                className="rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800"
              >
                {aviso}
              </p>
            )}

            <Button type="submit" disabled={enviando} className="w-full !py-2.5">
              {enviando ? 'Aguarde…' : t.botao}
            </Button>
          </form>

          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-center text-[13px] text-slate-500">
            {modo === 'entrar' && (
              <>
                <p>
                  <button
                    type="button"
                    onClick={() => trocarModo('recuperar')}
                    className="font-semibold text-sky-600 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </p>
                <p>
                  Primeira vez?{' '}
                  <button
                    type="button"
                    onClick={() => trocarModo('criar')}
                    className="font-semibold text-sky-600 hover:underline"
                  >
                    Criar a conta de dono
                  </button>
                </p>
              </>
            )}

            {(modo === 'criar' || modo === 'recuperar') && (
              <p>
                <button
                  type="button"
                  onClick={() => trocarModo('entrar')}
                  className="font-semibold text-sky-600 hover:underline"
                >
                  Voltar para o login
                </button>
              </p>
            )}
          </div>
        </Card>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-slate-400">
          A loja continua aberta para os clientes normalmente. O login serve só para impedir que
          outra pessoa altere seus produtos e preços.
        </p>
      </div>
    </div>
  );
}
