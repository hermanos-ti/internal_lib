import React, { useState } from 'react';
import { TabGroup } from './TabGroup';
import '../../assets/icons/css/all.css';

export default {
  title: 'Components/TabGroup',
  component: TabGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Grupo de abas (tabs) para organizar conteúdo em seções. Suporta navegação por teclado, scroll automático, ícones, tabs removíveis e diferentes posicionamentos.',
      },
    },
  },
};

// Componente auxiliar para mostrar logs de callbacks
const TabGroupWithLogs = ({ tabs, ...props }) => {
  const [logs, setLogs] = useState([]);

  const addLog = (type, tab) => {
    setLogs((prev) => [
      ...prev.slice(-4),
      { type, tab: tab.label, id: tab.id, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <TabGroup
        {...props}
        tabs={tabs}
        tabShow={(tab) => {
          addLog('show', tab);
          props.tabShow?.(tab);
        }}
        tabHide={(tab) => {
          addLog('hide', tab);
          props.tabHide?.(tab);
        }}
      />
      {logs.length > 0 && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          <strong>Logs de eventos:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {logs.map((log, idx) => (
              <li key={idx}>
                [{log.timestamp}] {log.type}: {log.tab} (id: {log.id})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const Default = {
  render: () => (
    <TabGroup
      tabs={[
        {
          id: 'geral',
          label: 'Geral',
          icone: <i className="fa-solid fa-gear"></i>,
          content: <div style={{ padding: '20px' }}>Conteúdo da aba Geral</div>,
        },
        {
          id: 'usuarios',
          label: 'Usuários',
          icone: <i className="fa-solid fa-users"></i>,
          content: <div style={{ padding: '20px' }}>Conteúdo da aba Usuários</div>,
        },
        {
          id: 'logs',
          label: 'Logs',
          icone: <i className="fa-solid fa-file-lines"></i>,
          disabled: true,
          content: <div style={{ padding: '20px' }}>Esta aba está desabilitada</div>,
        },
        {
          id: 'alerts',
          label: 'Alertas',
          icone: <i className="fa-solid fa-bell"></i>,
          removable: true,
          content: <div style={{ padding: '20px' }}>Conteúdo da aba Alertas (removível)</div>,
        },
      ]}
    />
  ),
};

export const ComCallbacks = {
  render: () => (
    <TabGroupWithLogs
      tabs={[
        {
          id: 'dashboard',
          label: 'Dashboard',
          icone: <i className="fa-solid fa-chart-line"></i>,
          content: <div style={{ padding: '20px' }}>Painel principal</div>,
        },
        {
          id: 'vendas',
          label: 'Vendas',
          icone: <i className="fa-solid fa-dollar-sign"></i>,
          content: <div style={{ padding: '20px' }}>Relatório de vendas</div>,
        },
        {
          id: 'produtos',
          label: 'Produtos',
          icone: <i className="fa-solid fa-box"></i>,
          content: <div style={{ padding: '20px' }}>Catálogo de produtos</div>,
        },
      ]}
    />
  ),
};

export const PlacementTop = {
  render: () => (
    <TabGroup
      placement="top"
      tabs={[
        {
          id: 'home',
          label: 'Home',
          icone: <i className="fa-solid fa-house"></i>,
          content: <div style={{ padding: '20px' }}>Conteúdo no topo</div>,
        },
        {
          id: 'about',
          label: 'Sobre',
          icone: <i className="fa-solid fa-info-circle"></i>,
          content: <div style={{ padding: '20px' }}>Informações sobre</div>,
        },
        {
          id: 'contact',
          label: 'Contato',
          icone: <i className="fa-solid fa-envelope"></i>,
          content: <div style={{ padding: '20px' }}>Formulário de contato</div>,
        },
      ]}
    />
  ),
};

export const PlacementBottom = {
  render: () => (
    <TabGroup
      placement="bottom"
      tabs={[
        {
          id: 'config',
          label: 'Configurações',
          icone: <i className="fa-solid fa-cog"></i>,
          content: <div style={{ padding: '20px' }}>Conteúdo com tabs na parte inferior</div>,
        },
        {
          id: 'perfil',
          label: 'Perfil',
          icone: <i className="fa-solid fa-user"></i>,
          content: <div style={{ padding: '20px' }}>Dados do perfil</div>,
        },
        {
          id: 'seguranca',
          label: 'Segurança',
          icone: <i className="fa-solid fa-shield"></i>,
          content: <div style={{ padding: '20px' }}>Configurações de segurança</div>,
        },
      ]}
    />
  ),
};

export const PlacementStart = {
  render: () => (
    <div style={{ height: '300px' }}>
      <TabGroup
        placement="start"
        tabs={[
          {
            id: 'item1',
            label: 'Item 1',
            icone: <i className="fa-solid fa-list"></i>,
            content: <div style={{ padding: '20px' }}>Conteúdo com tabs à esquerda</div>,
          },
          {
            id: 'item2',
            label: 'Item 2',
            icone: <i className="fa-solid fa-list"></i>,
            content: <div style={{ padding: '20px' }}>Segundo item</div>,
          },
          {
            id: 'item3',
            label: 'Item 3',
            icone: <i className="fa-solid fa-list"></i>,
            content: <div style={{ padding: '20px' }}>Terceiro item</div>,
          },
        ]}
      />
    </div>
  ),
};

export const PlacementEnd = {
  render: () => (
    <div style={{ height: '300px' }}>
      <TabGroup
        placement="end"
        tabs={[
          {
            id: 'pagina1',
            label: 'Página 1',
            icone: <i className="fa-solid fa-file"></i>,
            content: <div style={{ padding: '20px' }}>Conteúdo com tabs à direita</div>,
          },
          {
            id: 'pagina2',
            label: 'Página 2',
            icone: <i className="fa-solid fa-file"></i>,
            content: <div style={{ padding: '20px' }}>Segunda página</div>,
          },
          {
            id: 'pagina3',
            label: 'Página 3',
            icone: <i className="fa-solid fa-file"></i>,
            content: <div style={{ padding: '20px' }}>Terceira página</div>,
          },
        ]}
      />
    </div>
  ),
};

export const ActivationManual = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
        Modo manual: Use as setas para navegar e pressione Enter ou Espaço para ativar a aba.
      </p>
      <TabGroup
        activation="manual"
        tabs={[
          {
            id: 'tab1',
            label: 'Aba 1',
            icone: <i className="fa-solid fa-1"></i>,
            content: <div style={{ padding: '20px' }}>Primeira aba (modo manual)</div>,
          },
          {
            id: 'tab2',
            label: 'Aba 2',
            icone: <i className="fa-solid fa-2"></i>,
            content: <div style={{ padding: '20px' }}>Segunda aba (modo manual)</div>,
          },
          {
            id: 'tab3',
            label: 'Aba 3',
            icone: <i className="fa-solid fa-3"></i>,
            content: <div style={{ padding: '20px' }}>Terceira aba (modo manual)</div>,
          },
        ]}
      />
    </div>
  ),
};

export const ActivationAuto = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
        Modo automático: Use as setas para navegar e a aba será ativada automaticamente.
      </p>
      <TabGroup
        activation="auto"
        tabs={[
          {
            id: 'auto1',
            label: 'Auto 1',
            icone: <i className="fa-solid fa-bolt"></i>,
            content: <div style={{ padding: '20px' }}>Primeira aba (modo automático)</div>,
          },
          {
            id: 'auto2',
            label: 'Auto 2',
            icone: <i className="fa-solid fa-bolt"></i>,
            content: <div style={{ padding: '20px' }}>Segunda aba (modo automático)</div>,
          },
          {
            id: 'auto3',
            label: 'Auto 3',
            icone: <i className="fa-solid fa-bolt"></i>,
            content: <div style={{ padding: '20px' }}>Terceira aba (modo automático)</div>,
          },
        ]}
      />
    </div>
  ),
};

export const SemScrollControls = {
  render: () => (
    <TabGroup
      withoutScrollControls={true}
      tabs={[
        {
          id: 'sem1',
          label: 'Sem Scroll 1',
          icone: <i className="fa-solid fa-arrow-left"></i>,
          content: <div style={{ padding: '20px' }}>Scroll controls desabilitados</div>,
        },
        {
          id: 'sem2',
          label: 'Sem Scroll 2',
          icone: <i className="fa-solid fa-arrow-left"></i>,
          content: <div style={{ padding: '20px' }}>Use scroll do mouse ou touch</div>,
        },
        {
          id: 'sem3',
          label: 'Sem Scroll 3',
          icone: <i className="fa-solid fa-arrow-left"></i>,
          content: <div style={{ padding: '20px' }}>Botões de scroll não aparecem</div>,
        },
      ]}
    />
  ),
};

export const ComMuitasTabs = {
  render: () => (
    <TabGroup
      tabs={[
        { id: 'tab1', label: 'Tab 1', icone: <i className="fa-solid fa-1"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 1</div> },
        { id: 'tab2', label: 'Tab 2', icone: <i className="fa-solid fa-2"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 2</div> },
        { id: 'tab3', label: 'Tab 3', icone: <i className="fa-solid fa-3"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 3</div> },
        { id: 'tab4', label: 'Tab 4', icone: <i className="fa-solid fa-4"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 4</div> },
        { id: 'tab5', label: 'Tab 5', icone: <i className="fa-solid fa-5"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 5</div> },
        { id: 'tab6', label: 'Tab 6', icone: <i className="fa-solid fa-6"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 6</div> },
        { id: 'tab7', label: 'Tab 7', icone: <i className="fa-solid fa-7"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 7</div> },
        { id: 'tab8', label: 'Tab 8', icone: <i className="fa-solid fa-8"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 8</div> },
        { id: 'tab9', label: 'Tab 9', icone: <i className="fa-solid fa-9"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 9</div> },
        { id: 'tab10', label: 'Tab 10', icone: <i className="fa-solid fa-0"></i>, content: <div style={{ padding: '20px' }}>Conteúdo 10</div> },
      ]}
    />
  ),
};

export const TabsRemoviveis = {
  render: () => {
    const [tabs, setTabs] = useState([
      {
        id: 'rem1',
        label: 'Removível 1',
        icone: <i className="fa-solid fa-xmark"></i>,
        removable: true,
        content: <div style={{ padding: '20px' }}>Esta aba pode ser removida</div>,
      },
      {
        id: 'rem2',
        label: 'Removível 2',
        icone: <i className="fa-solid fa-xmark"></i>,
        removable: true,
        content: <div style={{ padding: '20px' }}>Clique no X para remover</div>,
      },
      {
        id: 'rem3',
        label: 'Removível 3',
        icone: <i className="fa-solid fa-xmark"></i>,
        removable: true,
        content: <div style={{ padding: '20px' }}>Terceira aba removível</div>,
      },
      {
        id: 'fixo',
        label: 'Fixo',
        icone: <i className="fa-solid fa-lock"></i>,
        removable: false,
        content: <div style={{ padding: '20px' }}>Esta aba não pode ser removida</div>,
      },
    ]);

    return <TabGroup tabs={tabs} />;
  },
};

export const TabsDesabilitadas = {
  render: () => (
    <TabGroup
      tabs={[
        {
          id: 'habilitada1',
          label: 'Habilitada 1',
          icone: <i className="fa-solid fa-check"></i>,
          content: <div style={{ padding: '20px' }}>Esta aba está habilitada</div>,
        },
        {
          id: 'desabilitada',
          label: 'Desabilitada',
          icone: <i className="fa-solid fa-ban"></i>,
          disabled: true,
          content: <div style={{ padding: '20px' }}>Esta aba está desabilitada</div>,
        },
        {
          id: 'habilitada2',
          label: 'Habilitada 2',
          icone: <i className="fa-solid fa-check"></i>,
          content: <div style={{ padding: '20px' }}>Esta aba também está habilitada</div>,
        },
        {
          id: 'desabilitada2',
          label: 'Desabilitada 2',
          icone: <i className="fa-solid fa-ban"></i>,
          disabled: true,
          content: <div style={{ padding: '20px' }}>Outra aba desabilitada</div>,
        },
      ]}
    />
  ),
};

export const SemIcones = {
  render: () => (
    <TabGroup
      tabs={[
        { id: 'sem1', label: 'Sem Ícone 1', content: <div style={{ padding: '20px' }}>Aba sem ícone</div> },
        { id: 'sem2', label: 'Sem Ícone 2', content: <div style={{ padding: '20px' }}>Outra aba sem ícone</div> },
        { id: 'sem3', label: 'Sem Ícone 3', content: <div style={{ padding: '20px' }}>Mais uma sem ícone</div> },
      ]}
    />
  ),
};

export const TabAtivoInicial = {
  render: () => (
    <TabGroup
      active="segunda"
      tabs={[
        {
          id: 'primeira',
          label: 'Primeira',
          icone: <i className="fa-solid fa-1"></i>,
          content: <div style={{ padding: '20px' }}>Primeira aba</div>,
        },
        {
          id: 'segunda',
          label: 'Segunda',
          icone: <i className="fa-solid fa-2"></i>,
          content: <div style={{ padding: '20px' }}>Segunda aba (ativa por padrão)</div>,
        },
        {
          id: 'terceira',
          label: 'Terceira',
          icone: <i className="fa-solid fa-3"></i>,
          content: <div style={{ padding: '20px' }}>Terceira aba</div>,
        },
      ]}
    />
  ),
};

export const ExemploCompleto = {
  render: () => (
    <TabGroupWithLogs
      placement="top"
      activation="auto"
      active="dashboard"
      tabs={[
        {
          id: 'dashboard',
          label: 'Dashboard',
          icone: <i className="fa-solid fa-chart-pie"></i>,
          content: (
            <div style={{ padding: '20px' }}>
              <h3>Dashboard</h3>
              <p>Visão geral do sistema com gráficos e métricas importantes.</p>
            </div>
          ),
        },
        {
          id: 'vendas',
          label: 'Vendas',
          icone: <i className="fa-solid fa-shopping-cart"></i>,
          removable: true,
          content: (
            <div style={{ padding: '20px' }}>
              <h3>Vendas</h3>
              <p>Relatórios e análises de vendas do período.</p>
            </div>
          ),
        },
        {
          id: 'clientes',
          label: 'Clientes',
          icone: <i className="fa-solid fa-users"></i>,
          content: (
            <div style={{ padding: '20px' }}>
              <h3>Clientes</h3>
              <p>Gerenciamento de clientes e relacionamento.</p>
            </div>
          ),
        },
        {
          id: 'produtos',
          label: 'Produtos',
          icone: <i className="fa-solid fa-box"></i>,
          removable: true,
          content: (
            <div style={{ padding: '20px' }}>
              <h3>Produtos</h3>
              <p>Catálogo e estoque de produtos.</p>
            </div>
          ),
        },
        {
          id: 'relatorios',
          label: 'Relatórios',
          icone: <i className="fa-solid fa-file-chart-line"></i>,
          disabled: true,
          content: (
            <div style={{ padding: '20px' }}>
              <h3>Relatórios</h3>
              <p>Esta funcionalidade está temporariamente desabilitada.</p>
            </div>
          ),
        },
        {
          id: 'configuracoes',
          label: 'Configurações',
          icone: <i className="fa-solid fa-gear"></i>,
          content: (
            <div style={{ padding: '20px' }}>
              <h3>Configurações</h3>
              <p>Ajustes e preferências do sistema.</p>
            </div>
          ),
        },
      ]}
    />
  ),
};

