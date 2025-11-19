import { Breadcrumb } from './Breadcrumb';

export default {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Componente de navegação breadcrumb para mostrar a localização atual na hierarquia.',
      },
    },
  },
};

export const Default = {
  render: () => <Breadcrumb />,
};

