import { useState } from 'react';
import { Container } from './Container';
import '../../assets/icons/css/all.css';

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'email', label: 'E-mail', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const data = [
  { key: '1', id: 1, nome: 'Ana Silva', email: 'ana@exemplo.com', status: 'Ativo' },
  { key: '2', id: 2, nome: 'Bruno Costa', email: 'bruno@exemplo.com', status: 'Inativo' },
  { key: '3', id: 3, nome: 'Carla Dias', email: 'carla@exemplo.com', status: 'Ativo' },
  { key: '4', id: 4, nome: 'Daniel Souza', email: 'daniel@exemplo.com', status: 'Pendente' },
  { key: '5', id: 5, nome: 'Elena Ferreira', email: 'elena@exemplo.com', status: 'Ativo' },
];

const footer = [
  {
    key: 'total',
    label: 'Total',
    render: (tableData) => `Total: ${tableData.length} registro(s)`,
  },
];

export default {
  title: 'Components/Container',
  component: Container,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Container base para telas com duas visualizações: tela de abertura (Tabela) e tela de cadastro/detalhe (children). Clique em uma célula da tabela para abrir a view de detalhe; use "Voltar" para retornar à lista.',
      },
    },
  },
};

/** Apenas a tela de abertura com a Tabela, sem children nem navegação. */
export const ApenasLista = {
  render: () => (
    <Container
      tabelaId="container-apenas-lista"
      columns={columns}
      data={data}
      footer={footer}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Uso mínimo: apenas lista com Tabela. Sem children nem navigate/detailPath.',
      },
    },
  },
};

/** Fluxo completo: clique na tabela abre a view de cadastro; navigate e onOpenDetail são chamados; children recebe id, row e backToList. */
function ComDuasViewsStory() {
  const [navigateLog, setNavigateLog] = useState(null);
  const [openDetailLog, setOpenDetailLog] = useState(null);

  const mockNavigate = (path, opts = {}) => {
    setNavigateLog({ path, state: opts.state ?? null });
  };

  return (
    <div>
      {(navigateLog || openDetailLog) && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.875rem',
          }}
        >
          {navigateLog && (
            <div style={{ marginBottom: openDetailLog ? '0.75rem' : 0 }}>
              <strong>navigate chamado:</strong>{' '}
              <code>{navigateLog.path}</code>
              {navigateLog.state && (
                <pre style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem' }}>
                  {JSON.stringify(navigateLog.state, null, 2)}
                </pre>
              )}
            </div>
          )}
          {openDetailLog && (
            <div>
              <strong>onOpenDetail chamado:</strong> id={openDetailLog.id},{' '}
              row.nome={openDetailLog.row?.nome}
            </div>
          )}
        </div>
      )}
      <Container
        tabelaId="container-duas-views"
        columns={columns}
        data={data}
        footer={footer}
        primaryKey="id"
        navigate={mockNavigate}
        detailPath="/usuarios/cadastro"
        onOpenDetail={({ id, row }) => setOpenDetailLog({ id, row })}
        options={{ itensPerPage: 5 }}
      >
        {({ id, row, backToList }) => (
          <div
            style={{
              padding: '1.5rem',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Tela de cadastro (view personalizada)</h3>
            <p>
              <strong>ID:</strong> {String(id)} — <strong>Nome:</strong> {row?.nome ?? '—'}
            </p>
            <p>
              <strong>E-mail:</strong> {row?.email ?? '—'} — <strong>Status:</strong> {row?.status ?? '—'}
            </p>
            <button
              type="button"
              onClick={backToList}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #22c55e',
                background: '#22c55e',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Voltar à lista
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}

export const ComDuasViews = {
  render: () => <ComDuasViewsStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Clique em qualquer célula de uma linha para abrir a view de cadastro. O Container chama navigate(detailPath, { state: { id, row } }) e onOpenDetail; a segunda view recebe id, row e backToList. Use "Voltar à lista" para retornar.',
      },
    },
  },
};

/** primaryKey customizado: dados usam idUsuario em vez de id. */
const dataComIdUsuario = [
  { key: 'u1', idUsuario: 'u1', nome: 'João', email: 'joao@empresa.com', status: 'Ativo' },
  { key: 'u2', idUsuario: 'u2', nome: 'Maria', email: 'maria@empresa.com', status: 'Inativo' },
  { key: 'u3', idUsuario: 'u3', nome: 'Pedro', email: 'pedro@empresa.com', status: 'Ativo' },
];

const columnsIdUsuario = [
  { key: 'idUsuario', label: 'ID Usuário', sortable: true },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'email', label: 'E-mail', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

function ComPrimaryKeyCustomizadoStory() {
  const [lastId, setLastId] = useState(null);

  return (
    <div>
      {lastId && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            background: '#eff6ff',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            fontSize: '0.875rem',
          }}
        >
          <strong>Linha clicada — id (primaryKey=idUsuario):</strong> {lastId}
        </div>
      )}
      <Container
        tabelaId="container-primary-key"
        columns={columnsIdUsuario}
        data={dataComIdUsuario}
        primaryKey="idUsuario"
        navigate={(path, opts) => setLastId(opts?.state?.id ?? null)}
        detailPath="/usuarios/editar"
      >
        {({ id, row, backToList }) => (
          <div
            style={{
              padding: '1.5rem',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Editar usuário</h3>
            <p>ID (idUsuario): {String(id)}</p>
            <p>Nome: {row?.nome}</p>
            <button
              type="button"
              onClick={backToList}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #d97706',
                background: '#d97706',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Voltar
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}

export const ComPrimaryKeyCustomizado = {
  render: () => <ComPrimaryKeyCustomizadoStory />,
  parameters: {
    docs: {
      description: {
        story: 'Exemplo com primaryKey="idUsuario": o ID passado para a segunda view vem de row.idUsuario.',
      },
    },
  },
};

