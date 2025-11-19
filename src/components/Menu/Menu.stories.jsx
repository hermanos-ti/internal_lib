import { Menu } from './Menu';

export default {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Menu de navegação ou lista de opções.',
      },
    },
  },
};

export const Default = {
  render: () => <Menu />,
};

