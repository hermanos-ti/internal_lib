import { ActionBar } from './ActionBar';

export default {
  title: 'Components/ActionBar',
  component: ActionBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Barra de ações para agrupar botões e controles relacionados.',
      },
    },
  },
};

export const Default = {
  render: () => <ActionBar />,
};

