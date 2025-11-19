import { Container } from './Container';

export default {
  title: 'Components/Container',
  component: Container,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Container para agrupar e organizar conteúdo com espaçamento e layout consistentes.',
      },
    },
  },
};

export const Default = {
  render: () => <Container />,
};

