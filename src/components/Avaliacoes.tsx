import { Estrelas } from './Estrelas';
import type { Avaliacao } from '../admin/types';

const data = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export function Avaliacoes({
  nota,
  total,
  comentarios,
}: {
  nota?: number;
  total?: number;
  comentarios?: Avaliacao[];
}) {
  if (!nota || !total || !comentarios?.length) return null;

  // Quantas pessoas deram cada nota, para a barra de distribuição.
  const porNota = [5, 4, 3, 2, 1].map((n) => ({
    nota: n,
    quantidade: comentarios.filter((c) => Math.round(c.nota) === n).length,
  }));

  return (
    <section className="border-t border-line pt-8" aria-labelledby="titulo-avaliacoes">
      <h2 id="titulo-avaliacoes" className="text-[18px] font-bold text-ink sm:text-[20px]">
        Avaliações de quem comprou
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-6 rounded-media border border-line p-4">
        <div className="text-center">
          <p className="text-[34px] font-bold leading-none text-ink">
            {nota.toFixed(1).replace('.', ',')}
          </p>
          <div className="mt-1.5 flex justify-center">
            <Estrelas nota={nota} avaliacoes={total} tamanho={15} mostrarTotal={false} />
          </div>
          <p className="mt-1 text-[12px] text-neutral-500">
            {total} {total === 1 ? 'avaliação' : 'avaliações'}
          </p>
        </div>

        <ul className="min-w-[180px] flex-1 space-y-1">
          {porNota.map(({ nota: n, quantidade }) => (
            <li key={n} className="flex items-center gap-2">
              <span className="w-3 text-[11.5px] text-neutral-500">{n}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${total ? (quantidade / total) * 100 : 0}%` }}
                />
              </span>
              <span className="w-5 text-right text-[11.5px] tabular-nums text-neutral-500">
                {quantidade}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-5 space-y-4">
        {comentarios.map((c) => (
          <li key={c.id} className="border-b border-line pb-4 last:border-0">
            <div className="flex flex-wrap items-center gap-2">
              <Estrelas nota={c.nota} avaliacoes={1} tamanho={12} mostrarTotal={false} />
              <span className="text-[13px] font-semibold text-ink">{c.nome}</span>
              <span className="text-[12px] text-neutral-400">
                {c.cidade}/{c.uf} · {data(c.data)}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-600">{c.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
