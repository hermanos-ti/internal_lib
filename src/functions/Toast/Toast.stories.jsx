import { Toast } from './Toast';

export default {
  title: 'Functions/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Função utilitária para exibir notificações toast (mensagens temporárias) na interface.',
      },
    },
  },
};

export const Default = {
  render: () => <Toast />,
};

