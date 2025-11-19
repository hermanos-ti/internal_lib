import { Tabela } from './Tabela';

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
};

export const Default = {
  render: () => <Tabela />,
};

