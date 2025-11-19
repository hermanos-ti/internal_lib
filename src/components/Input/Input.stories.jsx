import { Input } from './Input';

export default {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Campo de entrada de texto para formulários.',
      },
    },
  },
};

export const Default = {
  render: () => <Input />,
};

