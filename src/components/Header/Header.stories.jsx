import { Header } from './Header';

export default {
  title: 'Components/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Cabeçalho da aplicação ou seção.',
      },
    },
  },
};

export const Default = {
  render: () => <Header />,
};

