/**
 * Estrelas de avaliação.
 *
 * Só é renderizado quando existe avaliação de verdade: nota inventada é
 * review fabricada, engana o cliente e é passível de sanção pelo Código de
 * Defesa do Consumidor. Quem preenche a nota é o lojista, no painel.
 */
export function Estrelas({
  nota,
  avaliacoes,
  tamanho = 13,
  mostrarTotal = true,
}: {
  nota?: number;
  avaliacoes?: number;
  tamanho?: number;
  mostrarTotal?: boolean;
}) {
  if (!nota || !avaliacoes) return null;

  const valor = Math.max(0, Math.min(5, nota));
  const rotulo = `${valor.toFixed(1).replace('.', ',')} de 5, ${avaliacoes} ${
    avaliacoes === 1 ? 'avaliação' : 'avaliações'
  }`;

  return (
    <span className="inline-flex items-center gap-1.5" title={rotulo}>
      <span
        className="relative inline-block leading-none"
        role="img"
        aria-label={rotulo}
        style={{ width: tamanho * 5 + 4, height: tamanho }}
      >
        {/* Camada de baixo: as cinco estrelas apagadas */}
        <Fileira tamanho={tamanho} className="text-neutral-300" />
        {/* Camada de cima: recortada na largura da nota, dando meia estrela */}
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${(valor / 5) * 100}%` }}
        >
          <Fileira tamanho={tamanho} className="text-brand" />
        </span>
      </span>

      {mostrarTotal && (
        <span className="text-[11.5px] text-neutral-500">({avaliacoes})</span>
      )}
    </span>
  );
}

function Fileira({ tamanho, className }: { tamanho: number; className: string }) {
  return (
    <span className={`absolute inset-0 flex gap-[1px] ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.3 6.1 20.4l1.2-6.6L2.5 9.2l6.6-.9L12 2.2z" />
        </svg>
      ))}
    </span>
  );
}
