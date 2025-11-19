import { Skeleton } from './Skeleton';

export default {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Skeleton loader para exibir placeholders durante o carregamento de conteúdo.',
      },
    },
  },
};

export const Default = {
  render: () => <Skeleton />,
};

