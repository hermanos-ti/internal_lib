import { TabGroup } from './TabGroup';

export default {
  title: 'Components/TabGroup',
  component: TabGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Grupo de abas (tabs) para organizar conteúdo em seções.',
      },
    },
  },
};

export const Default = {
  render: () => <TabGroup />,
};

