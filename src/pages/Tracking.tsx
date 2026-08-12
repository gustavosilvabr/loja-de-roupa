import { useState } from 'react';
import { TruckIcon } from '../components/Icons';

export default function Tracking() {
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-[560px] px-5 py-16 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand">
        <TruckIcon className="h-7 w-7" />
      </div>
      <h1 className="text-[24px] font-bold">Rastreie seu pedido</h1>
      <p className="mt-2 text-[14px] text-neutral-600">
        Informe o número do pedido ou o código de rastreio enviado por e-mail.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="mt-6 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ex: XS12345678"
          aria-label="Número do pedido ou código de rastreio"
          className="field flex-1"
        />
        <button type="submit" className="btn-brand shrink-0">
          Rastrear
        </button>
      </form>

      {submitted && (
        <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-left text-[13px] text-amber-800">
          O rastreio precisa de integração com a transportadora (Melhor Envio, Correios ou Jadlog).
          Consulte o <code>README.md</code> para conectar a API e substituir esta tela.
        </p>
      )}
    </div>
  );
}
