import { Tag } from './Tag';

export default {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tag ou etiqueta para categorizar ou rotular conteúdo.',
      },
    },
  },
};

export const Default = {
  render: () => <Tag />,
};

