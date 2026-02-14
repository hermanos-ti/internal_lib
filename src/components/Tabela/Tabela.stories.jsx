import { useState, useRef, createContext, useContext } from 'react';
import { Tabela } from './Tabela';
import '../../assets/icons/css/all.css'

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', background: '#f8fafc' },
  { value: 'dark', label: 'Escuro', background: '#0f172a' },
  { value: 'tokyoNight', label: 'Tokyo Night', background: '#1a1b26' },
];

const StoryPortalContext = createContext(() => document.body);

function StoryWithThemeSelect({ children }) {
  const [theme, setTheme] = useState('light');
  const portalRef = useRef(null);
  const current = THEME_OPTIONS.find((t) => t.value === theme) || THEME_OPTIONS[0];
  const getPortalContainer = () => portalRef.current ?? document.body;

  return (
    <StoryPortalContext.Provider value={getPortalContainer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label htmlFor="story-theme-select" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Fundo / Tema:
          </label>
          <select
            id="story-theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem',
              cursor: 'pointer',
              minWidth: '140px',
            }}
          >
            {THEME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div
          data-theme={theme}
          style={{
            padding: '1rem',
            background: current.background,
            borderRadius: '8px',
            flex: 1,
          }}
        >
          <div ref={portalRef} style={{ position: 'relative', minHeight: 0 }}>
            {children}
          </div>
        </div>
      </div>
    </StoryPortalContext.Provider>
  );
}

function TabelaWithPortal(props) {
  const getPortalContainer = useContext(StoryPortalContext);
  return (
    <Tabela
      {...props}
      options={{ ...props.options, getPortalContainer }}
    />
  );
}

export default {
  title: 'Components/Tabela',
  component: Tabela,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tabela para exibir dados em formato tabular.',
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryWithThemeSelect>
        <Story />
      </StoryWithThemeSelect>
    ),
  ],
};

const columns = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Telefone', sortable: true },
  { key: 'address', label: 'Endereço', sortable: true },
  { key: 'city', label: 'Cidade', sortable: true, subColumns: {
    city: { key: 'city', label: 'Cidade', sortable: true },
    state: { key: 'state', label: 'Estado', sortable: true },
    zip: { key: 'zip', label: 'CEP', sortable: true },
    country: { key: 'country', label: 'País', sortable: true },
  } },
];

const data = [
  { name: 'John Doe', email: 'john.doe@example.com', phone: '1234567890', address: '123 Main St, Anytown, USA', city: 'Anytown', state: 'CA', zip: '12345', country: 'USA' },
  { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '0987654321', address: '456 Elm St, Othertown, USA', city: 'Othertown', state: 'NY', zip: '67890', country: 'USA' },
];

const footer = [
  { key: 'total', label: 'Total' },
];

export const Default = {
  render: () => <TabelaWithPortal id="tabela-1" columns={columns} data={data} footer={footer} />,
};

// Exemplo 1: Valor puro (sem render)
const columnsValorPuro = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'idade', label: 'Idade', sortable: true },
  { key: 'cidade', label: 'Cidade', sortable: true },
];

const dataValorPuro = [
  { nome: 'João', idade: 25, cidade: 'São Paulo' },
  { nome: 'Maria', idade: 30, cidade: 'Rio de Janeiro' },
];

export const ValorPuro = {
  render: () => <TabelaWithPortal id="tabela-2" columns={columnsValorPuro} data={dataValorPuro} />,
};

// Exemplo 2: Render definido na coluna
const columnsComRender = [
  { 
    key: 'nome', 
    label: 'Nome',
    render: (value, row, column, rowIndex, colIndex) => {
      return <strong style={{ color: 'blue' }}>{value}</strong>;
    }
  },
  { 
    key: 'preco', 
    label: 'Preço',
    render: (value, row, column, rowIndex, colIndex) => {
      return `R$ ${parseFloat(value).toFixed(2)}`;
    }
  },
  { 
    key: 'status', 
    label: 'Status',
    render: (value, row, column, rowIndex, colIndex) => {
      const color = value === 'ativo' ? 'green' : 'red';
      return <span style={{ color, fontWeight: 'bold' }}>{value.toUpperCase()}</span>;
    }
  },
];

const dataComRender = [
  { nome: 'Produto A', preco: 99.99, status: 'ativo' },
  { nome: 'Produto B', preco: 149.50, status: 'inativo' },
  { nome: 'Produto C', preco: 79.90, status: 'ativo' },
];

export const RenderNaColuna = {
  render: () => <TabelaWithPortal id="tabela-3" columns={columnsComRender} data={dataComRender} />,
};

// Exemplo 3: Footer com renderização baseada nos dados (soma de colunas)
const columnsComFooter = [
  { 
    key: 'produto', 
    label: 'Produto',
  },
  { 
    key: 'quantidade', 
    label: 'Quantidade',
  },
  { 
    key: 'preco', 
    label: 'Preço Unitário',
    render: (value) => `R$ ${parseFloat(value).toFixed(2)}`,
  },
  { 
    key: 'total', 
    label: 'Total',
    render: (value, row) => `R$ ${(parseFloat(row.quantidade) * parseFloat(row.preco)).toFixed(2)}`,
  },
];

const dataComFooter = [
  { produto: 'Produto A', quantidade: 10, preco: 99.99, total: 999.90 },
  { produto: 'Produto B', quantidade: 5, preco: 149.50, total: 747.50 },
  { produto: 'Produto C', quantidade: 8, preco: 79.90, total: 639.20 },
  { produto: 'Produto D', quantidade: 15, preco: 199.99, total: 2999.85 },
];

const footerComRender = [
  { 
    key: 'footer-label', 
    label: 'Totais:',
    align: 'left',
  },
  { 
    key: 'footer-quantidade', 
    render: (tableData) => {
      const soma = tableData.reduce((acc, row) => acc + (parseFloat(row.quantidade) || 0), 0);
      return `Qtd: ${soma}`;
    },
    align: 'right',
  },
  { 
    key: 'footer-preco', 
    label: 'Média:',
    render: (tableData) => {
      const soma = tableData.reduce((acc, row) => acc + (parseFloat(row.preco) || 0), 0);
      const media = soma / tableData.length;
      return `R$ ${media.toFixed(2)}`;
    },
    align: 'right',
  },
  { 
    key: 'footer-total', 
    label: 'Total Geral:',
    render: (tableData) => {
      const soma = tableData.reduce((acc, row) => {
        const quantidade = parseFloat(row.quantidade) || 0;
        const preco = parseFloat(row.preco) || 0;
        return acc + (quantidade * preco);
      }, 0);
      return `R$ ${soma.toFixed(2)}`;
    },
    align: 'right',
  },
];

export const ComFooterRender = {
  render: () => (
    <TabelaWithPortal 
      id="tabela-3b" 
      columns={columnsComFooter} 
      data={dataComFooter} 
      footer={footerComRender}
    />
  ),
};

// Exemplo 4: Teste de performance com muitos dados
const columnsPerformance = [
  { key: 'id', label: 'ID', sortable: true, width: 10 },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'idade', label: 'Idade', sortable: true },
  { key: 'salario', label: 'Salário', sortable: true },
  { key: 'cidade', label: 'Cidade', sortable: true },
  { key: 'ativo', label: 'Ativo', sortable: true, groupable: true },
];

// Gerar 1000 registros para teste de performance
const generateLargeDataset = (count = 1000) => {
  const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
  const nomes = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia', 'Fernando', 'Patricia'];
  const data = [];
  
  for (let i = 0; i < count; i++) {
    data.push({
      key: `row-${i}`,
      id: i + 1,
      nome: `${nomes[i % nomes.length]} ${i}`,
      idade: Math.floor(Math.random() * 50) + 18,
      salario: Math.floor(Math.random() * 10000) + 1000,
      cidade: cidades[i % cidades.length],
      ativo: i % 3 === 0 ? 'Ativo' : 'Inativo',
      // Teste com valores null/undefined
      ...(i % 10 === 0 && { salario: null }),
      ...(i % 15 === 0 && { cidade: undefined }),
    });
  }
  
  return data;
};

const dataPerformance = generateLargeDataset(1000);

export const PerformanceTest = {
  render: () => 
    // <div style={{ width: '100%', height: '200dvh', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
      <TabelaWithPortal id="tabela-4" columns={columnsPerformance} data={dataPerformance} options={{ columnMinWidth: 100 }} />
    // </div>
    ,
};

// Exemplo 4b: Teste de performance com external filter mode
const columnsPerformanceExternal = [
  { key: 'id', label: 'ID', sortable: true, type: 'number', width: 10 },
  { key: 'nome', label: 'Nome', sortable: true, type: 'text' },
  { key: 'idade', label: 'Idade', sortable: true, type: 'number' },
  { key: 'salario', label: 'Salário', sortable: true, type: 'number' },
  { key: 'cidade', label: 'Cidade', sortable: true, type: 'text' },
  { key: 'dataAdmissao', label: 'Data Admissão', sortable: true, type: 'date' },
  { key: 'status', label: 'Status', sortable: true, type: 'select' },
  { key: 'a', label: 'A', sortable: true, type: 'boolean' },
  { key: 'b', label: 'B', sortable: true, type: 'boolean' },
  { key: 'c', label: 'C', sortable: true, type: 'boolean' },
  { key: 'd', label: 'D', sortable: true, type: 'boolean' },
  { key: 'e', label: 'E', sortable: true, type: 'boolean' },
  { key: 'f', label: 'F', sortable: true, type: 'boolean' },
  { key: 'g', label: 'G', sortable: true, type: 'boolean' },
  { key: 'h', label: 'H', sortable: true, type: 'boolean' },
  { key: 'i', label: 'I', sortable: true, type: 'boolean' },
  { key: 'j', label: 'J', sortable: true, type: 'boolean' },
  { key: 'k', label: 'K', sortable: true, type: 'boolean' },
  { key: 'l', label: 'L', sortable: true, type: 'boolean' },
];

// Gerar dataset com mais campos para teste de filtros externos
const generateLargeDatasetExternal = (count = 1000) => {
  const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
  const nomes = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia', 'Fernando', 'Patricia'];
  const statusOptions = ['Ativo', 'Inativo', 'Pendente', 'Suspenso'];
  const data = [];
  
  const getRandomDate = () => {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
  };
  
  for (let i = 0; i < count; i++) {
    data.push({
      key: `row-${i}`,
      id: i + 1,
      nome: `${nomes[i % nomes.length]} ${i}`,
      idade: Math.floor(Math.random() * 50) + 18,
      salario: Math.floor(Math.random() * 10000) + 1000,
      cidade: cidades[i % cidades.length],
      dataAdmissao: getRandomDate(),
      status: statusOptions[i % statusOptions.length],
      // Teste com valores null/undefined
      ...(i % 10 === 0 && { salario: null }),
      ...(i % 15 === 0 && { cidade: undefined }),
      ...(i % 20 === 0 && { dataAdmissao: null }),
    });
  }
  
  return data;
};

const dataPerformanceExternal = generateLargeDatasetExternal(1000);

// Componente wrapper para o teste de external filter
const PerformanceTestExternalFilterWrapper = () => {
  const [filterInfo, setFilterInfo] = useState(null);
  
  return (
    <div>
      <div style={{ 
        marginBottom: '1rem', 
        padding: '1rem', 
        background: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Modo External Filter</h3>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
          Os filtros não são aplicados na tabela, apenas emitidos via callback.
          Crie filtros simples ou avançados e veja o SQL WHERE gerado abaixo.
        </p>
        {filterInfo && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff', borderRadius: '4px', border: '1px solid #ccc' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Filtros Aplicados:</strong>
            <pre style={{ 
              margin: 0, 
              fontSize: '0.85rem', 
              background: '#f8f8f8', 
              padding: '0.5rem', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {JSON.stringify(filterInfo.filters, null, 2)}
            </pre>
            <strong style={{ display: 'block', marginTop: '0.75rem', marginBottom: '0.5rem' }}>SQL WHERE Gerado:</strong>
            <code style={{ 
              display: 'block',
              padding: '0.5rem', 
              background: '#e8f4f8', 
              borderRadius: '4px',
              fontSize: '0.85rem',
              color: '#0066cc',
              wordBreak: 'break-all'
            }}>
              {filterInfo.sqlWhere || '(Nenhum filtro aplicado)'}
            </code>
          </div>
        )}
      </div>
      <TabelaWithPortal 
        id="tabela-4-external" 
        columns={columnsPerformanceExternal} 
        data={dataPerformanceExternal} 
        options={{ 
          columnMinWidth: 100,
          filterMode: 'external',
          onFilterChange: (filters, sqlWhere) => {
            setFilterInfo({ filters, sqlWhere });
          }
        }} 
      />
    </div>
  );
};

export const PerformanceTestExternalFilter = {
  render: () => <PerformanceTestExternalFilterWrapper />,
};

// Exemplo 5: Teste com muitos dados para demonstrar loader durante sorting
const dataPerformanceLarge = generateLargeDataset(100000);

export const PerformanceTestLarge = {
  render: () => (
    <div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Clique em qualquer coluna sortable para ver o loader durante a ordenação de 10.000 registros.
        O loader aparecerá enquanto os dados estão sendo ordenados.
      </p>
      <TabelaWithPortal id="tabela-5" columns={columnsPerformance} data={dataPerformanceLarge} />
    </div>
  ),
};

// Exemplo 6: Tabela com subcolunas
const columnsComSubcolunas = [
  {
    key: 'nome',
    label: 'Nome',
    sortable: true,
  },
  {
    key: 'contato',
    label: 'Contato',
    subColumns: [
      { key: 'email', label: 'Email', sortable: true },
      { key: 'telefone', label: 'Telefone', sortable: true },
    ],
  },
  {
    key: 'endereco',
    label: 'Endereço',
    subColumns: [
      { key: 'rua', label: 'Rua', sortable: true },
      { key: 'cidade', label: 'Cidade', sortable: true },
      { key: 'cep', label: 'CEP', sortable: true },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
  },
];

const dataComSubcolunas = [
  {
    key: 'row-1',
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '(11) 99999-9999',
    rua: 'Rua A, 123',
    cidade: 'São Paulo',
    cep: '01234-567',
    status: 'Ativo',
  },
  {
    key: 'row-2',
    nome: 'Maria Santos',
    email: 'maria@example.com',
    telefone: '(21) 88888-8888',
    rua: 'Rua B, 456',
    cidade: 'Rio de Janeiro',
    cep: '20000-000',
    status: 'Inativo',
  },
  {
    key: 'row-3',
    nome: 'Pedro Costa',
    email: 'pedro@example.com',
    telefone: '(31) 77777-7777',
    rua: 'Rua C, 789',
    cidade: 'Belo Horizonte',
    cep: '30000-000',
    status: 'Ativo',
  },
];

export const ComSubcolunas = {
  render: () => <TabelaWithPortal id="tabela-6" columns={columnsComSubcolunas} data={dataComSubcolunas} />,
};

// Exemplo 7: Tabela com subcolunas aninhadas (múltiplos níveis)
const columnsComSubcolunasAninhadas = [
  {
    key: 'nome',
    label: 'Nome',
    sortable: true,
  },
  {
    key: 'informacoes',
    label: 'Informações',
    subColumns: [
      {
        key: 'contato',
        label: 'Contato',
        subColumns: [
          { key: 'email', label: 'Email', sortable: true },
          { key: 'telefone', label: 'Telefone', sortable: true },
        ],
      },
      {
        key: 'localizacao',
        label: 'Localização',
        subColumns: [
          { key: 'cidade', label: 'Cidade', sortable: true },
          { key: 'estado', label: 'Estado', sortable: true },
        ],
      },
    ],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    subColumns: [
      { key: 'salario', label: 'Salário', sortable: true },
      { key: 'bonus', label: 'Bônus', sortable: true },
    ],
  },
];

const dataComSubcolunasAninhadas = [
  {
    key: 'row-1',
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '(11) 99999-9999',
    cidade: 'São Paulo',
    estado: 'SP',
    salario: 5000,
    bonus: 1000,
  },
  {
    key: 'row-2',
    nome: 'Maria Santos',
    email: 'maria@example.com',
    telefone: '(21) 88888-8888',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    salario: 6000,
    bonus: 1500,
  },
  {
    key: 'row-3',
    nome: 'Pedro Costa',
    email: 'pedro@example.com',
    telefone: '(31) 77777-7777',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    salario: 5500,
    bonus: 1200,
  },
];

export const ComSubcolunasAninhadas = {
  render: () => <TabelaWithPortal id="tabela-7" columns={columnsComSubcolunasAninhadas} data={dataComSubcolunasAninhadas} />,
};

