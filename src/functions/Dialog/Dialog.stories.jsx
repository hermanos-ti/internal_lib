import { Dialog } from './Dialog';

export default {
  title: 'Functions/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Função utilitária para exibir diálogos modais de forma programática.',
      },
    },
  },
};

export const Default = {
  render: () => <Dialog />,
};

