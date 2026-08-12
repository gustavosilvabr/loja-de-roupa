import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page py-24 text-center sm:py-32">
      <p className="text-[64px] font-extrabold leading-none text-brand">404</p>
      <h1 className="mt-3 text-[22px] font-bold sm:text-[26px]">Página não encontrada</h1>
      <p className="mt-2 text-[15px] text-neutral-600">
        O link que você acessou não existe ou foi movido.
      </p>
      <Link to="/" className="btn-brand mt-7">
        Voltar para a home
      </Link>
    </div>
  );
}
