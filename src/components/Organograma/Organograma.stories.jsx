import React from 'react';
import { Organograma, useOrganograma } from './index.js';

const DEPARTMENTS = ['Tech', 'Finance', 'HR', 'Sales', 'Marketing', 'Ops'];
const ROLES = ['Analista', 'Coordenador', 'Gerente', 'Diretor', 'VP'];

function buildHierarchy(size) {
  const data = [];
  for (let i = 1; i <= size; i += 1) {
    const parentId = i === 1 ? null : String(Math.floor(i / 2));
    data.push({
      id: String(i),
      name: `Colaborador ${i}`,
      role: ROLES[i % ROLES.length],
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      parentId,
      email: `colab${i}@empresa.com`,
      phone: `(11) 9${String(i).padStart(4, '0')}-0000`,
    });
  }
  return data;
}

const smallData = [
  {
    id: '1',
    name: 'Maria Silva',
    role: 'CEO',
    department: 'Diretoria',
    photo: 'https://i.pravatar.cc/80?u=1',
    email: 'maria@empresa.com',
    children: [
      {
        id: '2',
        name: 'João Santos',
        role: 'CTO',
        department: 'Tecnologia',
        photo: 'https://i.pravatar.cc/80?u=2',
        email: 'joao@empresa.com',
        children: [
          {
            id: '4',
            name: 'Ana Costa',
            role: 'Tech Lead',
            department: 'Tecnologia',
            photo: 'https://i.pravatar.cc/80?u=4',
          },
          {
            id: '5',
            name: 'Pedro Lima',
            role: 'Desenvolvedor',
            department: 'Tecnologia',
            photo: 'https://i.pravatar.cc/80?u=5',
          },
        ],
      },
      {
        id: '3',
        name: 'Carla Souza',
        role: 'CFO',
        department: 'Financeiro',
        photo: 'https://i.pravatar.cc/80?u=3',
        email: 'carla@empresa.com',
        children: [
          {
            id: '6',
            name: 'Lucas Ferreira',
            role: 'Controller',
            department: 'Financeiro',
            photo: 'https://i.pravatar.cc/80?u=6',
          },
        ],
      },
    ],
  },
];

function StoryWrapper({ children }) {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100dvh',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}

export default {
  title: 'Components/Organograma',
  component: Organograma,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Visualização de organograma hierárquico com board pan/zoom, colapso de galhos, toolbar, agrupamento por setor e painel de detalhes do colaborador.',
      },
    },
    layout: 'fullscreen',
  },
};

export const HierarquiaBasica = {
  render: () => (
    <StoryWrapper>
      <Organograma id="org-basico" data={smallData} />
    </StoryWrapper>
  ),
};

export const ComGruposAtivos = {
  render: () => (
    <StoryWrapper>
      <Organograma
        id="org-grupos"
        data={smallData}
        options={{
          groups: { enabled: true, cluster: true },
        }}
      />
    </StoryWrapper>
  ),
};

export const ModoDrawer = {
  render: () => (
    <StoryWrapper>
      <Organograma
        id="org-drawer"
        data={smallData}
        options={{
          detailMode: 'drawer',
        }}
      />
    </StoryWrapper>
  ),
};

export const ArvoreHorizontal = {
  render: () => (
    <StoryWrapper>
      <Organograma
        id="org-horizontal"
        data={smallData}
        options={{
          view: 'treeHorizontal',
        }}
      />
    </StoryWrapper>
  ),
};

export const CardCustomizado = {
  render: () => (
    <StoryWrapper>
      <Organograma
        id="org-custom-card"
        data={smallData}
        options={{
          nodeRender: (node) => (
            <div
              style={{
                padding: 12,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff',
                borderRadius: 8,
                minWidth: 200,
              }}
            >
              <strong>{node.name}</strong>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{node.role}</div>
            </div>
          ),
        }}
      />
    </StoryWrapper>
  ),
};

export const DatasetMedio = {
  render: () => (
    <StoryWrapper>
      <Organograma
        id="org-500"
        data={buildHierarchy(500)}
        options={{
          defaultExpandedDepth: 1,
          performance: { culling: true, cullingMargin: 500 },
        }}
      />
    </StoryWrapper>
  ),
};

export const DatasetGrande = {
  render: () => (
    <StoryWrapper>
      <Organograma
        id="org-5000"
        data={buildHierarchy(5000)}
        options={{
          defaultExpandedDepth: 1,
          performance: {
            culling: true,
            cullingMargin: 600,
            maxAnimatedNodes: 0,
          },
        }}
      />
    </StoryWrapper>
  ),
};

function ImperativeDemo() {
  const orgRef = useOrganograma();

  return (
    <StoryWrapper>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => orgRef.current?.fit()}>
            Fit
          </button>
          <button type="button" onClick={() => orgRef.current?.find('Ana')}>
            Buscar Ana
          </button>
          <button type="button" onClick={() => orgRef.current?.expandAll()}>
            Expandir tudo
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <Organograma id="org-ref" data={smallData} options={{ orgRef }} />
        </div>
      </div>
    </StoryWrapper>
  );
}

export const RefImperativa = {
  render: () => <ImperativeDemo />,
};
