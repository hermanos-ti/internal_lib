import { useState } from 'react';
import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Botão com hierarquia visual (primário, secundário, terciário, danger), estados claros e suporte a ícones + tooltip.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export const Primary = {
  args: {
    variant: 'primary',
    children: 'Confirmar',
  },
};

export const Secondary = {
  args: {
    variant: 'secondary',
    children: 'Cancelar',
  },
};

export const Tertiary = {
  args: {
    variant: 'tertiary',
    children: 'Voltar',
  },
};

export const Danger = {
  args: {
    variant: 'danger',
    children: 'Excluir',
  },
};

export const WithIcons = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button variant="primary" iconLeft={<i className="far fa-check" />}>
        Salvar
      </Button>
      <Button variant="secondary" iconLeft={<i className="far fa-file-csv" />}>
        Importar
      </Button>
      <Button variant="tertiary" iconOnly tooltip="Fechar">
        <i className="far fa-xmark" />
      </Button>
    </div>
  ),
};

export const States = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary" disabled>
        Desabilitado
      </Button>
      <Button variant="primary" loading>
        Carregando
      </Button>
      <Button variant="primary" tooltip="Ação principal da tela">
        Com tooltip
      </Button>
    </div>
  ),
};

export const Interactive = {
  render: () => {
    const [loading, setLoading] = useState(false);
    return (
      <Button
        variant="primary"
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1500);
        }}
      >
        Simular ação
      </Button>
    );
  },
};
