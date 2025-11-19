import { Details } from './Details';

export default {
  title: 'Components/Details',
  component: Details,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Componente para exibir detalhes expandíveis, similar ao elemento HTML details.',
      },
    },
  },
};

export const Default = {
  render: () => <Details />,
};

