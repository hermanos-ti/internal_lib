import { Popup } from './Popup';

export default {
  title: 'Components/Popup',
  component: Popup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Popup para exibir conteúdo em uma janela flutuante.',
      },
    },
  },
};

export const Default = {
  render: () => <Popup />,
};

