import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../admin/store/AdminProvider';
import { img } from '../lib/format';

/**
 * Logotipo da loja.
 *
 * Com um arquivo enviado, ele substitui o nome em texto por completo.
 * Se o arquivo não carregar, o nome volta — melhor mostrar o texto do que
 * deixar um buraco no cabeçalho.
 */
export function Logo({ className = '' }: { className?: string }) {
  const { brand } = useSettings();
  const [falhou, setFalhou] = useState(false);

  // Trocar a logo tem que limpar a falha anterior, senão a nova imagem
  // nunca aparece por causa de um erro do arquivo antigo.
  useEffect(() => setFalhou(false), [brand.logoUrl]);

  // Passa por img() porque a logo pode ser uma referência "local:<id>"
  // de um arquivo enviado do computador, e não uma URL comum.
  const endereco = brand.logoUrl ? img(brand.logoUrl, 600) : '';
  const usarImagem = brand.logoMode === 'imagem' && Boolean(endereco) && !falhou;
  const altura = brand.logoAltura || 36;

  if (usarImagem) {
    return (
      <Link to="/" aria-label={`${brand.name} — página inicial`} className={className}>
        <img
          src={endereco}
          alt={brand.name}
          onError={() => setFalhou(true)}
          style={{ height: `${altura}px` }}
          className="w-auto max-w-[240px] object-contain"
        />
      </Link>
    );
  }

  const name = brand.name.trim() || 'LOJA';
  const words = name.split(/\s+/);
  const first = words[0] ?? name;
  const rest = words.slice(1).join(' ');

  // Destaca a última letra da primeira palavra
  const head = first.slice(0, -1);
  const accent = first.slice(-1);

  return (
    <Link
      to="/"
      aria-label={`${brand.name} — página inicial`}
      // O texto acompanha a altura escolhida: sem isso, trocar entre imagem
      // e texto mudaria a altura do cabeçalho.
      style={{ fontSize: `${Math.round(altura * 0.62)}px` }}
      className={`inline-flex select-none items-center font-extrabold uppercase leading-none tracking-tight text-headertext ${className}`}
    >
      <span>{head}</span>
      <span className="mx-[2px] inline-flex h-[1.05em] items-center rounded-[4px] bg-brand px-[5px] text-white">
        {accent}
      </span>
      {rest && <span>{rest}</span>}
    </Link>
  );
}
