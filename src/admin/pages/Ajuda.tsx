import { Link } from 'react-router-dom';
import { Card, PageHeader } from '../ui';

interface Tarefa {
  pergunta: string;
  onde: string;
  to: string;
  como: string;
}

const TAREFAS: Tarefa[] = [
  {
    pergunta: 'Quero mudar o preço de um produto',
    onde: 'Gestão → Produtos',
    to: '/admin/produtos',
    como: 'Clique em Editar na linha do produto. Dá para mudar o preço de vários de uma vez marcando as caixinhas e usando o ajuste em lote.',
  },
  {
    pergunta: 'Quero trocar a foto de um produto',
    onde: 'Gestão → Produtos → Editar',
    to: '/admin/produtos',
    como: 'No bloco Imagens, cole o endereço da foto e clique em adicionar. A primeira da lista é a capa; use as setas para reordenar.',
  },
  {
    pergunta: 'Quero mudar as cores ou a fonte da loja',
    onde: 'Loja online → Aparência',
    to: '/admin/aparencia',
    como: 'A prévia ao lado mostra o resultado enquanto você mexe. Se errar, use Restaurar padrões.',
  },
  {
    pergunta: 'Quero trocar os banners da página inicial',
    onde: 'Loja online → Banners e carrosséis',
    to: '/admin/banners',
    como: 'Cada aba cuida de um bloco. Cole o endereço da imagem e escolha para onde o clique leva.',
  },
  {
    pergunta: 'Quero mudar a ordem das seções da home',
    onde: 'Loja online → Seções da home',
    to: '/admin/home',
    como: 'Use as setas ↑ ↓ para reordenar e o botão de liga/desliga para esconder uma seção sem apagá-la.',
  },
  {
    pergunta: 'Quero mudar o nome, telefone ou WhatsApp',
    onde: 'Configurações → Marca e contato',
    to: '/admin/config/marca',
    como: 'O botão flutuante de WhatsApp liga e desliga ali, junto com a mensagem que já vem escrita para o cliente.',
  },
  {
    pergunta: 'Quero ver quem comprou e quem abandonou o carrinho',
    onde: 'Estatísticas',
    to: '/admin/carrinhos',
    como: 'Vendas lista os pedidos; Carrinhos abandonados mostra quem chegou perto e não fechou, com botão para chamar no WhatsApp.',
  },
  {
    pergunta: 'Quero colocar o Pixel do Facebook',
    onde: 'Configurações → Pixels e integrações',
    to: '/admin/config/pixels',
    como: 'Cole o ID. Com o consentimento ligado, o pixel só dispara depois que o visitante aceitar os cookies — é o que a LGPD pede.',
  },
  {
    pergunta: 'Errei alguma coisa e quero voltar atrás',
    onde: 'Configurações → Dados e backup',
    to: '/admin/config/dados',
    como: 'Baixe um backup antes de mexer em algo grande. Dá para importar de volta ou resetar só uma parte.',
  },
];

export default function Ajuda() {
  return (
    <>
      <PageHeader
        title="Como usar o painel"
        description="As tarefas mais comuns e onde cada uma fica."
      />

      <Card className="mb-6">
        <p className="text-[14px] leading-relaxed text-slate-700">
          <strong>Não existe botão “Salvar”.</strong> Tudo o que você altera é gravado na hora — o
          aviso “Alterações salvas” pisca no topo da tela a cada mudança. Abra a loja em outra aba
          pelo botão <em>Ver loja ↗</em> e vá recarregando para acompanhar o resultado.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {TAREFAS.map((t) => (
          <Card key={t.pergunta}>
            <h2 className="text-[15px] font-semibold text-slate-900">{t.pergunta}</h2>
            <Link
              to={t.to}
              className="mt-1 inline-block text-[13px] font-medium text-sky-600 hover:underline"
            >
              {t.onde} →
            </Link>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{t.como}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6" title="O que ainda depende de um servidor">
        <ul className="space-y-2 text-[13px] leading-relaxed text-slate-600">
          <li>
            <strong className="text-slate-800">Cobrar de verdade.</strong> O checkout monta e
            registra o pedido, mas nenhum gateway cobra sem uma função no servidor guardando a
            chave secreta. Veja as taxas em{' '}
            <Link to="/admin/config/gateway" className="text-sky-600 hover:underline">
              Pagamento
            </Link>
            .
          </li>
          <li>
            <strong className="text-slate-800">Valer em outros computadores.</strong> Hoje as
            alterações ficam salvas neste navegador. Para valerem para todo mundo, é preciso um
            banco de dados.
          </li>
          <li>
            <strong className="text-slate-800">As imagens.</strong> Elas ainda apontam para o CDN
            da Shopify. Antes de cancelar o plano, rode{' '}
            <code className="rounded bg-slate-100 px-1">node scripts/baixar-imagens.mjs</code>.
          </li>
        </ul>
      </Card>
    </>
  );
}
