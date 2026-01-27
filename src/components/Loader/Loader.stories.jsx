import { Loader } from './Loader';

export default {
  title: 'Components/Loader',
  component: Loader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Loader local para exibir indicador de carregamento dentro de componentes.',
      },
    },
  },
  argTypes: {
    loading: {
      control: 'boolean',
      description: 'Controla se o loader está visível',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Tamanho do loader',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      description: 'Cor do loader',
    },
    text: {
      control: 'text',
      description: 'Texto opcional abaixo do spinner',
    },
  },
};

export const Default = {
  args: {
    loading: true,
    size: 'medium',
    color: 'primary',
  },
};

export const Small = {
  args: {
    loading: true,
    size: 'small',
    color: 'primary',
  },
};

export const Large = {
  args: {
    loading: true,
    size: 'large',
    color: 'primary',
  },
};

export const WithText = {
  args: {
    loading: true,
    size: 'medium',
    color: 'primary',
    text: 'Carregando dados...',
  },
};

export const Colors = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <Loader loading={true} size="medium" color="primary" text="Primary" />
      <Loader loading={true} size="medium" color="secondary" text="Secondary" />
      <Loader loading={true} size="medium" color="success" text="Success" />
      <Loader loading={true} size="medium" color="danger" text="Danger" />
      <Loader loading={true} size="medium" color="warning" text="Warning" />
      <Loader loading={true} size="medium" color="info" text="Info" />
    </div>
  ),
};

export const Hidden = {
  args: {
    loading: false,
    size: 'medium',
    color: 'primary',
    text: 'Este loader não será exibido',
  },
};

