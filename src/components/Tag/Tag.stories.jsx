import { Tag } from './Tag';

export default {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tag ou etiqueta para categorizar ou rotular conteúdo. Suporta múltiplas variantes, aparências e tamanhos, além de permitir customização completa de cores.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'danger'],
      description: 'Variante de cor da tag',
    },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'accent', 'filled-outlined'],
      description: 'Estilo visual da tag',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Tamanho da tag',
    },
    pill: {
      control: 'boolean',
      description: 'Formato arredondado (pill)',
    },
    removable: {
      control: 'boolean',
      description: 'Exibe botão de remoção',
    },
    backgroundColor: {
      control: 'color',
      description: 'Cor de fundo customizada',
    },
    textColor: {
      control: 'color',
      description: 'Cor do texto customizada',
    },
    borderColor: {
      control: 'color',
      description: 'Cor da borda customizada',
    },
    children: {
      control: 'text',
      description: 'Conteúdo da tag',
    },
  },
};

// Story padrão com controles
export const Default = {
  args: {
    children: 'Etiqueta',
    variant: 'neutral',
    appearance: 'filled',
    size: 'medium',
  },
};

// Todas as Variantes
export const Variants = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag variant="neutral">Neutral</Tag>
      <Tag variant="brand">Brand</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="danger">Danger</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'As cinco variantes de cor disponíveis para o componente Tag.',
      },
    },
  },
};

// Todas as Aparências
export const Appearances = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Filled</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Tag variant="neutral" appearance="filled">Neutral</Tag>
          <Tag variant="brand" appearance="filled">Brand</Tag>
          <Tag variant="success" appearance="filled">Success</Tag>
          <Tag variant="warning" appearance="filled">Warning</Tag>
          <Tag variant="danger" appearance="filled">Danger</Tag>
        </div>
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Outlined</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Tag variant="neutral" appearance="outlined">Neutral</Tag>
          <Tag variant="brand" appearance="outlined">Brand</Tag>
          <Tag variant="success" appearance="outlined">Success</Tag>
          <Tag variant="warning" appearance="outlined">Warning</Tag>
          <Tag variant="danger" appearance="outlined">Danger</Tag>
        </div>
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Accent</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Tag variant="neutral" appearance="accent">Neutral</Tag>
          <Tag variant="brand" appearance="accent">Brand</Tag>
          <Tag variant="success" appearance="accent">Success</Tag>
          <Tag variant="warning" appearance="accent">Warning</Tag>
          <Tag variant="danger" appearance="accent">Danger</Tag>
        </div>
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Filled-Outlined</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Tag variant="neutral" appearance="filled-outlined">Neutral</Tag>
          <Tag variant="brand" appearance="filled-outlined">Brand</Tag>
          <Tag variant="success" appearance="filled-outlined">Success</Tag>
          <Tag variant="warning" appearance="filled-outlined">Warning</Tag>
          <Tag variant="danger" appearance="filled-outlined">Danger</Tag>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Os quatro estilos de aparência: filled (preenchido), outlined (contorno), accent (suave) e filled-outlined (preenchido com borda).',
      },
    },
  },
};

// Tamanhos
export const Sizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Tag size="small">Small</Tag>
      <Tag size="medium">Medium</Tag>
      <Tag size="large">Large</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Três tamanhos disponíveis: small (22px), medium (26px) e large (32px).',
      },
    },
  },
};

// Formato Pill
export const Pill = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag pill>Pill Tag</Tag>
      <Tag pill variant="brand">Brand Pill</Tag>
      <Tag pill variant="success" appearance="outlined">Success Outlined</Tag>
      <Tag pill variant="warning" appearance="accent">Warning Accent</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tags com formato pill (bordas totalmente arredondadas).',
      },
    },
  },
};

// Removíveis
export const Removable = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag removable onRemove={() => console.log('Removed!')}>Removable</Tag>
      <Tag removable variant="brand">Brand</Tag>
      <Tag removable variant="success" appearance="outlined">Success</Tag>
      <Tag removable variant="danger" appearance="accent">Danger</Tag>
      <Tag removable pill variant="warning">Warning Pill</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tags com botão de remoção. O callback onRemove é chamado ao clicar no X.',
      },
    },
  },
};

// Clicáveis
export const Clickable = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag onClick={() => console.log('Clicked!')}>Clicável</Tag>
      <Tag onClick={() => {}} variant="brand" appearance="outlined">Brand</Tag>
      <Tag onClick={() => {}} variant="success" pill>Success Pill</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tags clicáveis têm cursor pointer e efeito hover com elevação.',
      },
    },
  },
};

// Cores Customizadas
export const CustomColors = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag 
        backgroundColor="#7c3aed" 
        textColor="#ffffff"
      >
        Violet
      </Tag>
      <Tag 
        backgroundColor="#0ea5e9" 
        textColor="#ffffff"
      >
        Sky Blue
      </Tag>
      <Tag 
        backgroundColor="#f97316" 
        textColor="#ffffff"
      >
        Orange
      </Tag>
      <Tag 
        backgroundColor="transparent" 
        textColor="#db2777"
        borderColor="#db2777"
      >
        Pink Outlined
      </Tag>
      <Tag 
        backgroundColor="#fdf4ff" 
        textColor="#a21caf"
        borderColor="#f0abfc"
      >
        Fuchsia Accent
      </Tag>
      <Tag 
        backgroundColor="#1e293b" 
        textColor="#f8fafc"
        pill
        removable
      >
        Slate Dark
      </Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use as props backgroundColor, textColor e borderColor para criar tags com cores totalmente customizadas.',
      },
    },
  },
};

// Exemplo de uso real
export const RealWorldExamples = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Status de pedido */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Status de Pedido</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tag variant="warning" appearance="accent">Pendente</Tag>
          <Tag variant="brand" appearance="accent">Em Processamento</Tag>
          <Tag variant="success" appearance="accent">Concluído</Tag>
          <Tag variant="danger" appearance="accent">Cancelado</Tag>
        </div>
      </div>
      
      {/* Categorias */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Categorias</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tag pill appearance="outlined">React</Tag>
          <Tag pill appearance="outlined">TypeScript</Tag>
          <Tag pill appearance="outlined">CSS</Tag>
          <Tag pill appearance="outlined">Node.js</Tag>
        </div>
      </div>
      
      {/* Tags selecionáveis */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Filtros Selecionados</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tag removable variant="brand" pill>Frontend</Tag>
          <Tag removable variant="brand" pill>Remoto</Tag>
          <Tag removable variant="brand" pill>Sênior</Tag>
        </div>
      </div>
      
      {/* Prioridades */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Prioridades</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tag variant="neutral" size="small">Baixa</Tag>
          <Tag variant="warning" size="small">Média</Tag>
          <Tag variant="danger" size="small">Alta</Tag>
          <Tag variant="danger" size="small" appearance="filled-outlined">Urgente</Tag>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Exemplos de uso em cenários reais: status, categorias, filtros e prioridades.',
      },
    },
  },
};
