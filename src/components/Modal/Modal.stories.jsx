import { Modal } from './Modal';

export default {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal ou diálogo modal para exibir conteúdo em uma sobreposição.',
      },
    },
  },
};

export const Default = {
  render: () => <Modal />,
};

