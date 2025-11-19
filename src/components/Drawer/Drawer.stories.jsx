import { Drawer } from './Drawer';

export default {
  title: 'Components/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Gaveta lateral (drawer) para exibir conteúdo adicional ou navegação.',
      },
    },
  },
};

export const Default = {
  render: () => <Drawer />,
};

