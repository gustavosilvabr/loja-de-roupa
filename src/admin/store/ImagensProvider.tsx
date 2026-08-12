import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apagarImagem,
  apagarTodas,
  comprimir,
  lerTodas,
  refDe,
  salvarImagem,
  uso,
  validarArquivo,
  type MetaImagem,
} from './imagens';
import { enviarImagem } from './nuvem';
import { nuvemAtiva } from '../../lib/supabase';
import {
  avisarMudanca,
  esquecerUrl,
  limparUrls,
  registrarUrl,
} from '../../lib/imagensLocais';

interface ImagensContextValue {
  /** Metadados de tudo que foi enviado do computador. */
  imagens: MetaImagem[];
  carregando: boolean;
  usado: number;
  disponivel: number | null;
  /** Envia arquivos e devolve as referências "local:<id>" criadas. */
  enviar: (arquivos: File[] | FileList) => Promise<string[]>;
  /** Apaga do banco. Não remove a referência dos produtos que a usam. */
  remover: (ref: string) => Promise<void>;
  removerTodas: () => Promise<void>;
  /** Erros da última tentativa de envio, um por arquivo recusado. */
  erros: string[];
  limparErros: () => void;
  enviando: boolean;
}

const ImagensContext = createContext<ImagensContextValue | null>(null);

export function ImagensProvider({ children }: { children: ReactNode }) {
  const [imagens, setImagens] = useState<MetaImagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [usado, setUsado] = useState(0);
  const [disponivel, setDisponivel] = useState<number | null>(null);

  const atualizarUso = useCallback(() => {
    uso()
      .then(({ usado: u, disponivel: d }) => {
        setUsado(u);
        setDisponivel(d);
      })
      .catch(() => {
        /* estimativa é opcional */
      });
  }, []);

  // Carrega tudo uma vez e cria as URLs que os <img> vão usar.
  useEffect(() => {
    let vivo = true;

    lerTodas()
      .then((todas) => {
        if (!vivo) return;
        for (const item of todas) {
          registrarUrl(refDe(item.id), URL.createObjectURL(item.blob));
        }
        setImagens(todas.map(({ blob: _b, ...meta }) => meta));
        avisarMudanca();
      })
      .catch(() => {
        // Navegador sem IndexedDB (ou modo privado restrito): a loja segue
        // funcionando, só não dá para enviar imagem do computador.
      })
      .finally(() => {
        if (vivo) {
          setCarregando(false);
          atualizarUso();
        }
      });

    return () => {
      vivo = false;
      limparUrls();
    };
  }, [atualizarUso]);

  const enviar = useCallback(
    async (arquivos: File[] | FileList): Promise<string[]> => {
      const lista = Array.from(arquivos);
      if (lista.length === 0) return [];

      setEnviando(true);
      setErros([]);

      const refs: string[] = [];
      const problemas: string[] = [];

      for (const file of lista) {
        const erro = validarArquivo(file);
        if (erro) {
          problemas.push(erro);
          continue;
        }

        try {
          // Com a nuvem ligada e o lojista logado, a foto vira uma URL
          // pública de verdade — é o que faz ela aparecer no celular do
          // cliente. Sem isso, sobra só no navegador de quem enviou.
          if (nuvemAtiva) {
            const { blob } = await comprimir(file);
            const url = await enviarImagem(blob, file.name);
            if (url) {
              refs.push(url);
              continue;
            }
            problemas.push(
              `"${file.name}" não subiu para a nuvem. Salvei só neste navegador — os clientes não vão vê-la.`
            );
          }

          const meta = await salvarImagem(file);
          const ref = refDe(meta.id);
          const blobs = await lerTodas();
          const salvo = blobs.find((b) => b.id === meta.id);
          if (salvo) registrarUrl(ref, URL.createObjectURL(salvo.blob));

          setImagens((atual) => [meta, ...atual]);
          refs.push(ref);
        } catch (err) {
          problemas.push(
            err instanceof DOMException && err.name === 'QuotaExceededError'
              ? `Sem espaço no navegador para "${file.name}". Apague imagens antigas.`
              : `Não consegui salvar "${file.name}".`
          );
        }
      }

      avisarMudanca();
      setErros(problemas);
      setEnviando(false);
      atualizarUso();
      return refs;
    },
    [atualizarUso]
  );

  const remover = useCallback(
    async (ref: string) => {
      const id = ref.replace('local:', '');
      await apagarImagem(id);
      esquecerUrl(ref);
      setImagens((atual) => atual.filter((i) => i.id !== id));
      avisarMudanca();
      atualizarUso();
    },
    [atualizarUso]
  );

  const removerTodas = useCallback(async () => {
    await apagarTodas();
    limparUrls();
    setImagens([]);
    avisarMudanca();
    atualizarUso();
  }, [atualizarUso]);

  const valor = useMemo<ImagensContextValue>(
    () => ({
      imagens,
      carregando,
      usado,
      disponivel,
      enviar,
      remover,
      removerTodas,
      erros,
      limparErros: () => setErros([]),
      enviando,
    }),
    [imagens, carregando, usado, disponivel, enviar, remover, removerTodas, erros, enviando]
  );

  return <ImagensContext.Provider value={valor}>{children}</ImagensContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useImagens() {
  const ctx = useContext(ImagensContext);
  if (!ctx) throw new Error('useImagens precisa estar dentro de <ImagensProvider>');
  return ctx;
}
