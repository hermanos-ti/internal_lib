import { Tooltip } from './Tooltip';

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tooltip para exibir informações adicionais ao passar o mouse sobre um elemento.',
      },
    },
  },
};

export const Default = {
  render: () => <Tooltip />,
};

