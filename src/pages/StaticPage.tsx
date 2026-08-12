import { Link, useParams } from 'react-router-dom';
import { useSettings } from '../admin/store/AdminProvider';

/** As políticas são editadas no painel em Configurações → Políticas. */
export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useSettings().policies.find((p) => p.slug === slug);

  if (!page) {
    return (
      <div className="page py-24 text-center">
        <h1 className="text-[24px] font-bold">Página não encontrada</h1>
        <Link to="/" className="btn-brand mt-6">
          Voltar para a home
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-[760px] px-5 py-12 sm:py-16">
      <h1 className="text-[26px] font-bold sm:text-[32px]">{page.title}</h1>
      <div className="mt-6 space-y-4">
        {page.body
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-neutral-600">
              {p}
            </p>
          ))}
      </div>
    </article>
  );
}
