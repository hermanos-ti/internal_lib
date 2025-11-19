import { Frame } from './Frame';

export default {
  title: 'Components/Frame',
  component: Frame,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Frame ou quadro para envolver e estruturar conteúdo.',
      },
    },
  },
};

export const Default = {
  render: () => <Frame />,
};

