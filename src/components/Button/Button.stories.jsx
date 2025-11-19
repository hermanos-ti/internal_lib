import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Botão para ações e interações do usuário.',
      },
    },
  },
};

export const Default = {
  render: () => <Button />,
};

