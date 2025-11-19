import { Card } from './Card';

export default {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Card ou container para agrupar conteúdo relacionado.',
      },
    },
  },
};

export const Default = {
  render: () => <Card />,
};

