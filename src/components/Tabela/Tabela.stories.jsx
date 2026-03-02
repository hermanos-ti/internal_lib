import { useState, useRef, createContext, useContext } from 'react';
import { Tabela } from './Tabela';
import '../../assets/icons/css/all.css'

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', background: '#ffffff' },
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
  { key: 'age', label: 'Idade', sortable: true },
  { key: 'salary', label: 'Salário', sortable: true, type: 'number' },
  { key: 'status', label: 'Status', sortable: true, groupable: true },
  { key: 'date', label: 'Data', sortable: true, type: 'date' },
];

const data = [
  { name: 'John Doe', age: 30, salary: 1000, status: 'Ativo', date: '2024-01-01' },
  { name: 'Jane Smith', age: 25, salary: 2000, status: 'Inativo', date: '2024-01-01' },
  { name: 'Jim Beam', age: 35, salary: 3000, status: 'Ativo', date: '2024-01-01' },
  { name: 'Jill Johnson', age: 40, salary: 4000, status: 'Inativo', date: '2024-01-01' },
  { name: 'Jack Daniels', age: 45, salary: 5000, status: 'Ativo', date: '2024-01-01' },
  { name: 'Jill Johnson', age: 40, salary: 4000, status: 'Inativo', date: '2024-01-01' },
];

const footer = [
  { key: 'total', label: 'Total', render: (tableData) => {
    return `Total: ${tableData.reduce((acc, row) => acc + row.salary, 0)}`;
  } },
  { key: 'average', label: 'Média', render: (tableData) => {
    return `Média: ${tableData.reduce((acc, row) => acc + row.salary, 0) / tableData.length}`;
  } },
  { key: 'min', label: 'Mínimo', render: (tableData) => {
    return `Mínimo: ${Math.min(...tableData.map(row => row.salary))}`;
  } },
  { key: 'max', label: 'Máximo', render: (tableData) => {
    return `Máximo: ${Math.max(...tableData.map(row => row.salary))}`;
  } },
  { key: 'sum', label: 'Soma', render: (tableData) => {
    return `Soma: ${tableData.reduce((acc, row) => acc + row.salary, 0)}`;
  } },
  { key: 'range', label: 'Faixa', render: (tableData) => {
    return `Faixa: ${Math.max(...tableData.map(row => row.salary)) - Math.min(...tableData.map(row => row.salary))}`;
  } },
  { key: 'dateEarliest', label: 'Mais antiga', render: (tableData) => {
    return `Mais antiga: ${Math.min(...tableData.map(row => row.date))}`;
  } },
  { key: 'dateLatest', label: 'Mais recente', render: (tableData) => {
    return `Mais recente: ${Math.max(...tableData.map(row => row.date))}`;
  } },
  { key: 'dateRange', label: 'Faixa', render: (tableData) => {
    return `Faixa: ${Math.max(...tableData.map(row => row.date)) - Math.min(...tableData.map(row => row.date))}`;
  } },
];

export const Default = {
  render: () => <TabelaWithPortal id="tabela-1" columns={columns} data={data} footer={footer} options={{
    tableName: 'Tabela de Exemplo',
    tableSubtitle: 'Esta é uma tabela de exemplo para demonstrar o componente Tabela.',
    tableIcon: 'fa-solid fa-table',
  }} />,
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
  { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date', sortable: true },
  { key: 'idade', label: 'Idade', type: 'number', sortable: true },
  { key: 'salario', label: 'Salário', type: 'number', sortable: true, format: 'money' },
  { key: 'cidade', label: 'Cidade', sortable: true },
  { key: 'ativo', label: 'Ativo', sortable: true, groupable: true, type: 'select' },
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
      ...(function () {
        const idade = Math.floor(Math.random() * (60 - 18 + 1)) + 18;
        const birthYear = new Date().getFullYear() - idade;
        const birthMonth = Math.floor(Math.random() * 12);
        const daysInMonth = new Date(birthYear, birthMonth + 1, 0).getDate();
        const birthDay = 1 + Math.floor(Math.random() * daysInMonth);
        const dataNascimento = new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];
        return { dataNascimento, idade };
      })(),
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

const dataPerformance = generateLargeDataset(100);

export const PerformanceTest = {
  render: () => 
    // <div style={{ width: '100%', height: '200dvh', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
      <TabelaWithPortal id="tabela-4" columns={columnsPerformance} data={dataPerformance} options={{
        columnMinWidth: 100,
      }} />
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

// Exemplo: Colunas com format (money, percentage, date) – células e footer de cálculo formatados
const columnsFormat = [
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'preco', label: 'Preço', type: 'number', format: 'money', sortable: true },
  { key: 'participacao', label: 'Participação', type: 'number', format: 'percentage', sortable: true },
  { key: 'data', label: 'Data', type: 'date', format: 'date', sortable: true },
];

const dataFormat = [
  { key: '1', produto: 'Item A', preco: 1234.56, participacao: 25.5, data: '2024-01-15' },
  { key: '2', produto: 'Item B', preco: 890.12, participacao: 40.0, data: '2024-02-20' },
  { key: '3', produto: 'Item C', preco: 2450, participacao: 34.5, data: '2024-03-10' },
];

const initialCalculationByColumn = {
  preco: { calculationId: 'sum' },
  participacao: { calculationId: 'average' },
  data: { calculationId: 'dateLatest' },
};

export const FormatosColuna = {
  render: () => (
    <div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Colunas com <code>format</code>: money (R$), percentage (%), date. Células e footer de cálculo usam a mesma formatação.
      </p>
      <TabelaWithPortal
        id="tabela-format"
        columns={columnsFormat}
        data={dataFormat}
        options={{ initialCalculationByColumn }}
      />
    </div>
  ),
};

// ── Selection stories ──

const selectableData = Array.from({ length: 25 }, (_, i) => ({
  key: `row-${i + 1}`,
  name: `Pessoa ${i + 1}`,
  age: 20 + (i % 30),
  salary: 1000 + i * 500,
  status: i % 3 === 0 ? 'Ativo' : i % 3 === 1 ? 'Inativo' : 'Pendente',
  date: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
}));

function SelectableStory() {
  const [selected, setSelected] = useState([]);
  return (
    <div>
      <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
        <strong>Selecionados:</strong> {selected.length === 0 ? 'Nenhum' : `${selected.length} linha(s)`}
        {selected.length > 0 && (
          <span> — [{selected.map(r => r.name).join(', ')}]</span>
        )}
      </div>
      <TabelaWithPortal
        id="tabela-selectable"
        columns={columns}
        data={selectableData}
        options={{
          selectable: true,
          onSelectionChange: setSelected,
          itensPerPage: 5,
        }}
      />
    </div>
  );
}

export const Selectable = {
  render: () => <SelectableStory />,
};

function SelectableExternalStory() {
  const selectionRef = useRef(null);
  const [selected, setSelected] = useState([]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => selectionRef.current?.select('all')} style={btnStyle}>
          Selecionar Todos
        </button>
        <button onClick={() => selectionRef.current?.deselect('all')} style={btnStyle}>
          Limpar Seleção
        </button>
        <button onClick={() => selectionRef.current?.select(['row-1', 'row-5', 'row-10'])} style={btnStyle}>
          Selecionar 1, 5, 10
        </button>
        <button onClick={() => selectionRef.current?.deselect(['row-1', 'row-5'])} style={btnStyle}>
          Remover 1, 5
        </button>
        <button
          onClick={() => {
            const sel = selectionRef.current?.getSelected();
            alert(`Selecionados: ${sel?.length ?? 0}\n${sel?.map(r => r.name).join(', ') ?? ''}`);
          }}
          style={btnStyle}
        >
          getSelected()
        </button>
      </div>
      <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
        <strong>Selecionados:</strong> {selected.length === 0 ? 'Nenhum' : `${selected.length} linha(s)`}
      </div>
      <TabelaWithPortal
        id="tabela-selectable-ext"
        columns={columns}
        data={selectableData}
        options={{
          selectable: true,
          onSelectionChange: setSelected,
          selectionRef,
          itensPerPage: 5,
        }}
      />
    </div>
  );
}

const btnStyle = {
  padding: '0.4rem 0.75rem',
  fontSize: '0.8rem',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  cursor: 'pointer',
};

export const SelectableWithExternalControl = {
  render: () => <SelectableExternalStory />,
};

// ── Editable stories ──

const editableColumns = [
  { key: 'id', label: 'ID', sortable: true, width: 8 },
  { key: 'nome', label: 'Nome', sortable: true, editable: true },
  { key: 'email', label: 'Email', sortable: true, editable: true },
  {
    key: 'cargo',
    label: 'Cargo',
    sortable: true,
    editable: {
      type: 'select',
      options: ['Desenvolvedor', 'Designer', 'Gerente', 'Analista', 'Suporte'],
    },
  },
  {
    key: 'habilidades',
    label: 'Habilidades',
    sortable: true,
    editable: {
      type: 'select',
      options: [
        { value: 'react', label: 'React' },
        { value: 'node', label: 'Node.js' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'sql', label: 'SQL' },
        { value: 'figma', label: 'Figma' },
      ],
      multiple: true,
    },
    render: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return '—';
      return value.join(', ');
    },
  },
  { key: 'salario', label: 'Salário', sortable: true, type: 'number', format: 'money', editable: true },
];

const editableData = Array.from({ length: 15 }, (_, i) => ({
  key: `row-${i + 1}`,
  id: i + 1,
  nome: ['Ana Silva', 'Bruno Costa', 'Carla Dias', 'Daniel Souza', 'Elena Ferreira', 'Felipe Lima', 'Gabriela Santos', 'Hugo Oliveira', 'Isabela Rocha', 'João Moreira', 'Karen Alves', 'Lucas Pereira', 'Mariana Ribeiro', 'Nelson Barbosa', 'Olívia Mendes'][i],
  email: `pessoa${i + 1}@empresa.com`,
  cargo: ['Desenvolvedor', 'Designer', 'Gerente', 'Analista', 'Suporte'][i % 5],
  habilidades: [['react', 'node'], ['figma'], ['sql', 'python'], ['java', 'sql'], ['react']][i % 5],
  salario: 3000 + i * 500,
}));

function EditableStory() {
  const editRef = useRef(null);
  const [log, setLog] = useState([]);

  const addLog = (msg) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            const data = editRef.current?.getData();
            addLog(`getData(): ${data?.length} linhas`);
            console.log('getData():', data);
          }}
          style={btnStyle}
        >
          getData()
        </button>
        <button
          onClick={() => {
            const rows = editRef.current?.getEditedRows();
            addLog(`getEditedRows(): ${rows?.length} linhas editadas`);
            console.log('getEditedRows():', rows);
          }}
          style={btnStyle}
        >
          getEditedRows()
        </button>
        <button
          onClick={() => {
            editRef.current?.resetEdits();
            addLog('resetEdits(): Edições resetadas');
          }}
          style={btnStyle}
        >
          Resetar Edições
        </button>
        <button
          onClick={() => {
            editRef.current?.setRowStatus(['row-1', 'row-2'], 'success');
            addLog('setRowStatus([row-1, row-2], success)');
          }}
          style={{ ...btnStyle, borderColor: '#22c55e', color: '#16a34a' }}
        >
          Status Success (1,2)
        </button>
        <button
          onClick={() => {
            editRef.current?.setRowStatus('row-3', 'warning', 'salario');
            addLog('setRowStatus(row-3, warning, salario)');
          }}
          style={{ ...btnStyle, borderColor: '#eab308', color: '#ca8a04' }}
        >
          Status Warning (3, col: salário)
        </button>
        <button
          onClick={() => {
            editRef.current?.setRowStatus(['row-4', 'row-5'], 'error', ['nome', 'email']);
            addLog('setRowStatus([row-4, row-5], error, [nome, email])');
          }}
          style={{ ...btnStyle, borderColor: '#ef4444', color: '#dc2626' }}
        >
          Status Error (4,5 cols: nome, email)
        </button>
        <button
          onClick={() => {
            editRef.current?.clearRowStatus();
            addLog('clearRowStatus(): Todos os status limpos');
          }}
          style={btnStyle}
        >
          Limpar Status
        </button>
      </div>

      <TabelaWithPortal
        id="tabela-editable"
        columns={editableColumns}
        data={editableData}
        options={{
          editable: true,
          editRef,
          onEditChange: (allData, changedRow, changedCol) => {
            addLog(`Editado: ${changedRow.nome || changedRow.key} → coluna "${changedCol}"`);
          },
          onSave: (allData, editedRows) => {
            addLog(`Salvar: ${editedRows.length} linha(s) editada(s)`);
            console.log('onSave allData:', allData);
            console.log('onSave editedRows:', editedRows);
          },
          itensPerPage: 10,
        }}
      />

      {log.length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          maxHeight: '200px',
          overflow: 'auto',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
        }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Log:</strong>
          {log.map((entry, i) => (
            <div key={i} style={{ padding: '0.15rem 0', borderBottom: '1px solid #f1f5f9' }}>
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Editable = {
  render: () => <EditableStory />,
};

function EditableWithSelectionStory() {
  const editRef = useRef(null);
  const selectionRef = useRef(null);
  const [selected, setSelected] = useState([]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            const rows = editRef.current?.getEditedRows();
            alert(`Linhas editadas: ${rows?.length ?? 0}\n${rows?.map(r => `${r.edited.nome}: ${JSON.stringify(r.changes)}`).join('\n') ?? ''}`);
          }}
          style={btnStyle}
        >
          Ver Edições
        </button>
        <button
          onClick={() => selectionRef.current?.select('all')}
          style={btnStyle}
        >
          Selecionar Todos
        </button>
        <button
          onClick={() => {
            const sel = selectionRef.current?.getSelected();
            sel?.forEach(row => {
              editRef.current?.setRowStatus(row.key, 'success');
            });
          }}
          style={{ ...btnStyle, borderColor: '#22c55e', color: '#16a34a' }}
        >
          Marcar Selecionados como Sucesso
        </button>
        <button onClick={() => editRef.current?.clearRowStatus()} style={btnStyle}>
          Limpar Status
        </button>
      </div>
      <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
        <strong>Selecionados:</strong> {selected.length === 0 ? 'Nenhum' : `${selected.length} linha(s)`}
      </div>
      <TabelaWithPortal
        id="tabela-editable-sel"
        columns={editableColumns}
        data={editableData}
        options={{
          editable: true,
          editRef,
          selectable: true,
          selectionRef,
          onSelectionChange: setSelected,
          onSave: (allData, editedRows) => {
            alert(`Salvando ${editedRows.length} linha(s) editada(s)`);
            console.log('onSave:', allData, editedRows);
          },
          itensPerPage: 10,
        }}
      />
    </div>
  );
}

export const EditableWithSelection = {
  render: () => <EditableWithSelectionStory />,
};
  
// ── onClick / onDoubleClick stories ──

const onClickDblClickColumns = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'age', label: 'Idade', sortable: true },
  { key: 'salary', label: 'Salário', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const onClickDblClickData = [
  { key: 'row-1', name: 'João Silva', age: 30, salary: 5000, status: 'Ativo' },
  { key: 'row-2', name: 'Maria Santos', age: 25, salary: 4500, status: 'Inativo' },
  { key: 'row-3', name: 'Pedro Costa', age: 35, salary: 6000, status: 'Ativo' },
  { key: 'row-4', name: 'Ana Oliveira', age: 28, salary: 4200, status: 'Pendente' },
  { key: 'row-5', name: 'Carlos Souza', age: 42, salary: 7500, status: 'Ativo' },
];

function OnClickOnDoubleClickStory() {
  const [log, setLog] = useState([]);

  const addLog = (type, event) => {
    const msg = `${type}: linha ${event.rowIndex}, col ${event.colIndex} | cell="${event.cell}" | col.key="${event.column?.key}"`;
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  return (
    <div>
      <div style={{
        marginBottom: '1rem',
        padding: '1rem',
        background: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>onClick e onDoubleClick</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1' }}>
          Clique simples: dispara onClick após ~300ms. Clique duplo: dispara onDoubleClick.
          O evento retorna: row, column, cell, rowIndex, colIndex.
        </p>
      </div>
      <div style={{
        marginBottom: '1rem',
        padding: '0.75rem',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        maxHeight: '180px',
        overflow: 'auto',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
      }}>
        <strong>Log de eventos:</strong>
        {log.length === 0 ? (
          <div style={{ color: '#94a3b8', marginTop: '0.25rem' }}>Clique ou dê duplo clique em uma célula...</div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{ padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9' }}>{entry}</div>
          ))
        )}
      </div>
      <TabelaWithPortal
        id="tabela-onclick"
        columns={onClickDblClickColumns}
        data={onClickDblClickData}
        options={{
          onClick: (e) => addLog('onClick', e),
          onDoubleClick: (e) => addLog('onDoubleClick', e),
        }}
      />
    </div>
  );
}

export const OnClickOnDoubleClick = {
  render: () => <OnClickOnDoubleClickStory />,
  parameters: {
    docs: {
      description: {
        story: 'Testa onClick e onDoubleClick com resolução de conflito (delay ~300ms). Clique simples dispara onClick; duplo clique dispara onDoubleClick. O evento retorna { row, column, cell, rowIndex, colIndex }.',
      },
    },
  },
};

// ── selectionMode: single (radio-like) ──

function SelectionModeSingleStory() {
  const [selected, setSelected] = useState([]);

  return (
    <div>
      <div style={{
        marginBottom: '1rem',
        padding: '1rem',
        background: '#f0fdf4',
        border: '1px solid #22c55e',
        borderRadius: '8px',
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>selectionMode: single</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803d' }}>
          Apenas um item pode ser selecionado por vez (comportamento tipo radio).
          O header não exibe checkbox "selecionar todos".
        </p>
      </div>
      <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
        <strong>Selecionado:</strong> {selected.length === 0 ? 'Nenhum' : selected[0]?.name}
      </div>
      <TabelaWithPortal
        id="tabela-selection-single"
        columns={onClickDblClickColumns}
        data={onClickDblClickData}
        options={{
          selectable: true,
          selectionMode: 'single',
          onSelectionChange: setSelected,
        }}
      />
    </div>
  );
}

export const SelectionModeSingle = {
  render: () => <SelectionModeSingleStory />,
  parameters: {
    docs: {
      description: {
        story: 'Modo de seleção única: apenas um elemento pode ser selecionado por vez, como um radio button.',
      },
    },
  },
};

// ── onClick/onDoubleClick + selection (sem conflito) ──

function OnClickWithSelectionStory() {
  const [log, setLog] = useState([]);
  const [selected, setSelected] = useState([]);

  const addLog = (type, event) => {
    const msg = `${type}: ${event.column?.key}="${event.cell}" (linha ${event.rowIndex})`;
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 12));
  };

  return (
    <div>
      <div style={{
        marginBottom: '1rem',
        padding: '1rem',
        background: '#fefce8',
        border: '1px solid #eab308',
        borderRadius: '8px',
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>onClick/onDoubleClick + Selection</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#a16207' }}>
          Clique no checkbox: apenas altera seleção (não dispara onClick/onDoubleClick).
          Clique nas células de dados: dispara os eventos normalmente.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{
          flex: '1 1 200px',
          padding: '0.75rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          maxHeight: '140px',
          overflow: 'auto',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
        }}>
          <strong>Log onClick/onDoubleClick:</strong>
          {log.length === 0 ? (
            <div style={{ color: '#94a3b8', marginTop: '0.25rem' }}>Clique em uma célula de dados...</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} style={{ padding: '0.2rem 0', borderBottom: '1px solid #f1f5f9' }}>{entry}</div>
            ))
          )}
        </div>
        <div style={{
          flex: '0 0 auto',
          padding: '0.75rem',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          fontSize: '0.85rem',
        }}>
          <strong>Selecionados:</strong> {selected.length === 0 ? 'Nenhum' : selected.map(r => r.name).join(', ')}
        </div>
      </div>
      <TabelaWithPortal
        id="tabela-onclick-selection"
        columns={onClickDblClickColumns}
        data={onClickDblClickData}
        options={{
          selectable: true,
          onSelectionChange: setSelected,
          onClick: (e) => addLog('onClick', e),
          onDoubleClick: (e) => addLog('onDoubleClick', e),
        }}
      />
    </div>
  );
}

export const OnClickWithSelection = {
  render: () => <OnClickWithSelectionStory />,
  parameters: {
    docs: {
      description: {
        story: 'Verifica que o checkbox de seleção não conflita com onClick/onDoubleClick. Cliques no checkbox apenas alteram a seleção; cliques nas células disparam os eventos.',
      },
    },
  },
};

// ── Import CSV story ──

const importColumns = [
  { key: 'nome', label: 'Nome', format: 'text', obrigatorio: true, validator: (v) => (v?.trim() ? true : 'Campo obrigatório') },
  { key: 'idade', label: 'Idade', format: 'integer', obrigatorio: false, validator: (v) => (v === '' || v == null) ? true : (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 150) },
  { key: 'salario', label: 'Salário', format: 'money', obrigatorio: false, validator: (v) => (v === '' || v == null || !Number.isNaN(parseFloat(v))) },
];

const importData = [
  { nome: 'João Silva', idade: 30, salario: 5000 },
  { nome: 'Maria Santos', idade: 25, salario: 4500 },
  { nome: 'Pedro Costa', idade: 35, salario: 6000 },
];

function ImportStory() {
  const [tableData, setTableData] = useState(importData);

  return (
    <div>
      <div style={{
        marginBottom: '1rem',
        padding: '1rem',
        background: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Importar CSV</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1' }}>
          Clique em Configurações (ícone de engrenagem) e depois em &quot;Importar&quot;.
          Selecione um arquivo CSV com as colunas: <code>nome</code>, <code>idade</code>, <code>salario</code>.
          Exemplo de conteúdo:
        </p>
        <pre style={{
          margin: '0.5rem 0 0 0',
          padding: '0.75rem',
          background: '#e0f2fe',
          borderRadius: '6px',
          fontSize: '0.8rem',
          overflow: 'auto',
        }}>
{`nome,idade,salario
João Silva,30,5000
Maria Santos,25,4500
Pedro Costa,35,6000`}
        </pre>
      </div>
      <TabelaWithPortal
        id="tabela-import"
        columns={[
          { key: 'nome', label: 'Nome', sortable: true },
          { key: 'idade', label: 'Idade', sortable: true },
          { key: 'salario', label: 'Salário', sortable: true, format: 'money' },
        ]}
        data={tableData}
        options={{
          importConfig: { columns: importColumns },
          onImportComplete: (importedData) => {
            setTableData(importedData);
            console.log('Importação concluída:', importedData);
          },
        }}
      />
    </div>
  );
}

export const Import = {
  render: () => <ImportStory />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstra a funcionalidade de importação CSV. Clique em Configurações > Importar, selecione um arquivo CSV com o layout esperado, revise os dados na pré-visualização e finalize a importação.',
      },
    },
  },
};
