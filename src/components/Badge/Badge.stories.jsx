import { Badge } from './Badge';

export default {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Badge ou etiqueta para exibir informações destacadas, como contadores ou status.',
      },
    },
  },
};

export const Default = {
  render: () => <Badge />,
};

