import { Link } from 'react-router-dom';
import { useSettings } from '../admin/store/AdminProvider';
import { PAYMENT_ICONS, TRUST_BADGES } from '../data/site';
import { Logo } from './Logo';
import { InstagramIcon, ShieldIcon } from './Icons';

export function Footer() {
  const { brand, policies, nav } = useSettings();

  return (
    <footer className="bg-footerbg text-white">
      <div className="page grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          {brand.tagline && (
            <p className="mt-3 max-w-[220px] text-[13px] text-white/60">{brand.tagline}</p>
          )}
        </div>

        <nav aria-label="Institucional">
          <h3 className="mb-4 text-[14px] font-bold uppercase tracking-wide text-brand">
            Institucional
          </h3>
          <ul className="space-y-2.5">
            {policies.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/paginas/${p.slug}`}
                  className="text-[14px] text-white/80 transition-colors hover:text-white"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Acesso rápido">
          <h3 className="mb-4 text-[14px] font-bold uppercase tracking-wide text-brand">
            Acesso rápido
          </h3>
          <ul className="space-y-2.5">
            {nav.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.to}
                  className="text-[14px] text-white/80 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-4 text-[14px] font-bold uppercase tracking-wide text-brand">
            Fale conosco
          </h3>

          {brand.hours.length > 0 && (
            <>
              <p className="text-[14px] font-bold">Horário de Atendimento:</p>
              {brand.hours.map((h) => (
                <p key={h} className="text-[14px] text-white/80">
                  {h}
                </p>
              ))}
            </>
          )}

          <p className="mt-4 text-[14px] font-bold">Formas de Atendimento:</p>
          {brand.phone && (
            <p className="text-[14px] text-white/80">
              Contato:{' '}
              <a
                href={`tel:+55${brand.phone.replace(/\D/g, '')}`}
                className="transition-colors hover:text-white"
              >
                {brand.phone}
              </a>
            </p>
          )}
          {brand.email && (
            <p className="text-[14px] text-white/80">
              E-mail:{' '}
              <a href={`mailto:${brand.email}`} className="transition-colors hover:text-white">
                {brand.email}
              </a>
            </p>
          )}
          {brand.cnpj && <p className="mt-3 text-[12px] text-white/50">CNPJ {brand.cnpj}</p>}
        </div>
      </div>

      {brand.instagram && (
        <div className="page flex justify-center pb-8">
          <a
            href={brand.instagram}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Instagram de ${brand.name}`}
            className="rounded p-2 text-white/70 transition-colors hover:text-white"
          >
            <InstagramIcon className="h-6 w-6" />
          </a>
        </div>
      )}

      <div className="border-t border-white/10">
        <div className="page grid grid-cols-1 gap-8 py-8 text-center sm:grid-cols-3">
          <div>
            <h4 className="mb-3 text-[12px] font-bold uppercase tracking-widest text-white/70">
              Formas de pagamento
            </h4>
            <ul className="flex flex-wrap items-center justify-center gap-1.5">
              {PAYMENT_ICONS.map((p) => (
                <li key={p.name}>
                  <img
                    src={p.src}
                    alt={p.name}
                    loading="lazy"
                    width={38}
                    height={24}
                    className="h-6 w-auto rounded-[3px]"
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[12px] font-bold uppercase tracking-widest text-white/70">
              Site seguro
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {TRUST_BADGES.map((b) => (
                <img key={b.name} src={b.src} alt={b.name} loading="lazy" className="h-8 w-auto" />
              ))}
              <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/90">
                <ShieldIcon className="h-4 w-4" />
                Certificado SSL
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-[12px] font-bold uppercase tracking-widest text-white/70">
              Entrega
            </h4>
            <p className="text-[13px] text-white/70">
              Estoque nacional
              <br />
              Expedição em 24 horas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-brand py-3 text-center">
        <p className="text-[12px] font-semibold text-white">
          Copyright © {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.
          {/* Atalho só em desenvolvimento — o cliente final nunca vê. */}
          {import.meta.env.DEV && (
            <>
              {' · '}
              <Link to="/admin" className="underline opacity-80 hover:opacity-100">
                Painel
              </Link>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
