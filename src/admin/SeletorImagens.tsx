import { useId, useRef, useState } from 'react';
import { useImagens } from './store/ImagensProvider';
import { formatarBytes } from './store/imagens';
import { img, PREFIXO_LOCAL } from '../lib/format';
import { Button, Input } from './ui';

interface Props {
  /** Lista atual de imagens (URLs externas ou referências "local:<id>"). */
  valor: string[];
  onChange: (imagens: string[]) => void;
  /** Uma só imagem — usado por logo e banner. */
  unica?: boolean;
  rotulo?: string;
  ajuda?: string;
}

/** Miniatura que não quebra o layout quando o endereço está errado. */
function Miniatura({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [erro, setErro] = useState(false);
  const resolvido = img(src, 300);

  if (!resolvido || erro) {
    return (
      <div
        className={`flex items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-center text-[10px] text-slate-400 ${className}`}
      >
        {src.startsWith(PREFIXO_LOCAL) ? 'carregando…' : 'endereço inválido'}
      </div>
    );
  }

  return (
    <img
      src={resolvido}
      alt={alt}
      onError={() => setErro(true)}
      className={`bg-slate-50 object-cover ${className}`}
    />
  );
}

export function SeletorImagens({
  valor,
  onChange,
  unica = false,
  rotulo = 'Imagens',
  ajuda,
}: Props) {
  const { enviar, enviando, erros, limparErros, usado, disponivel } = useImagens();
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [urlNova, setUrlNova] = useState('');
  const [arrastando, setArrastando] = useState(false);
  const idCampo = useId();

  const adicionar = (novas: string[]) => {
    if (novas.length === 0) return;
    onChange(unica ? [novas[0]] : [...valor, ...novas]);
  };

  const receberArquivos = async (arquivos: FileList | File[] | null) => {
    if (!arquivos) return;
    limparErros();
    const refs = await enviar(arquivos);
    adicionar(refs);
  };

  const adicionarUrl = () => {
    const url = urlNova.trim();
    if (!url) return;
    adicionar([url]);
    setUrlNova('');
  };

  const remover = (indice: number) => onChange(valor.filter((_, i) => i !== indice));

  const mover = (indice: number, delta: number) => {
    const alvo = indice + delta;
    if (alvo < 0 || alvo >= valor.length) return;
    const copia = [...valor];
    [copia[indice], copia[alvo]] = [copia[alvo], copia[indice]];
    onChange(copia);
  };

  const definirCapa = (indice: number) => {
    if (indice === 0) return;
    const copia = [...valor];
    const [escolhida] = copia.splice(indice, 1);
    onChange([escolhida, ...copia]);
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-slate-700">{rotulo}</span>
        <span className="text-[11.5px] text-slate-400">
          {formatarBytes(usado)} usados
          {disponivel ? ` de ${formatarBytes(disponivel)} disponíveis` : ''}
        </span>
      </div>

      {/* Área de soltar */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          void receberArquivos(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
          arrastando ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50/60'
        }`}
      >
        <p className="text-[13.5px] text-slate-600">
          Arraste {unica ? 'a imagem' : 'as imagens'} aqui
        </p>
        <p className="mt-0.5 text-[12px] text-slate-400">ou</p>

        <input
          ref={inputArquivo}
          id={idCampo}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple={!unica}
          onChange={(e) => {
            void receberArquivos(e.target.files);
            e.target.value = '';
          }}
          className="sr-only"
        />

        <Button
          onClick={() => inputArquivo.current?.click()}
          disabled={enviando}
          className="mt-2"
        >
          {enviando ? 'Enviando…' : 'Escolher do computador'}
        </Button>

        <p className="mt-2 text-[11.5px] text-slate-400">
          JPG, PNG ou WebP até 25 MB. As fotos são reduzidas para 1600px e
          convertidas para WebP automaticamente.
        </p>
      </div>

      {erros.length > 0 && (
        <ul role="alert" className="mt-2 space-y-1">
          {erros.map((e) => (
            <li key={e} className="rounded bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
              {e}
            </li>
          ))}
        </ul>
      )}

      {/* Colar endereço */}
      <div className="mt-3 flex gap-2">
        <Input
          value={urlNova}
          onChange={(e) => setUrlNova(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              adicionarUrl();
            }
          }}
          placeholder="…ou cole o endereço de uma imagem da internet"
          aria-label="Endereço de imagem da internet"
          spellCheck={false}
        />
        <Button variant="secondary" onClick={adicionarUrl} disabled={!urlNova.trim()}>
          Adicionar
        </Button>
      </div>

      {ajuda && <p className="mt-2 text-[12px] text-slate-400">{ajuda}</p>}

      {/* Lista atual */}
      {valor.length > 0 && (
        <ul className="mt-4 space-y-2">
          {valor.map((src, i) => (
            <li
              key={`${src}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-2"
            >
              <Miniatura src={src} alt={`Imagem ${i + 1}`} className="h-16 w-16 shrink-0 rounded" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] text-slate-600" title={src}>
                  {src.startsWith(PREFIXO_LOCAL) ? 'Enviada do computador' : src}
                </p>
                {i === 0 && !unica && (
                  <span className="mt-0.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                    capa
                  </span>
                )}
              </div>

              {!unica && (
                <>
                  {i !== 0 && (
                    <Button variant="ghost" onClick={() => definirCapa(i)} className="!px-2">
                      Usar como capa
                    </Button>
                  )}
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      aria-label={`Mover imagem ${i + 1} para cima`}
                      className="rounded border border-slate-300 px-2 text-[12px] text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(i, 1)}
                      disabled={i === valor.length - 1}
                      aria-label={`Mover imagem ${i + 1} para baixo`}
                      className="rounded border border-slate-300 px-2 text-[12px] text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => remover(i)}
                aria-label={`Remover imagem ${i + 1}`}
                className="shrink-0 rounded px-2 py-1 text-[16px] text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
