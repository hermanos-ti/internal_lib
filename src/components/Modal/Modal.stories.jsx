import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../Button/Button';

export default {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Modal acessível com backdrop blur, header/body/footer composicionais, focus trap e retorno de foco.',
      },
    },
  },
};

export const Default = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Abrir modal
        </Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} size="md">
          <Modal.Header title="Título do modal" subtitle="Subtítulo opcional para contexto" onClose={() => setOpen(false)} />
          <Modal.Body>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Corpo do modal com padding confortável. Use tooltips nos campos para explicar o contexto ao usuário.
            </p>
          </Modal.Body>
          <Modal.Footer
            secondary={{ label: 'Cancelar', onClick: () => setOpen(false) }}
            primary={{ label: 'Confirmar', onClick: () => setOpen(false) }}
          />
        </Modal>
      </>
    );
  },
};

export const Sizes = {
  render: () => {
    const [size, setSize] = useState(null);
    return (
      <>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['sm', 'md', 'lg', 'xl'].map((s) => (
            <Button key={s} variant="secondary" size="sm" onClick={() => setSize(s)}>
              {s.toUpperCase()}
            </Button>
          ))}
        </div>
        <Modal isOpen={!!size} onClose={() => setSize(null)} size={size || 'md'}>
          <Modal.Header title={`Modal ${size?.toUpperCase()}`} onClose={() => setSize(null)} />
          <Modal.Body>
            <p style={{ margin: 0 }}>Tamanho atual: {size}</p>
          </Modal.Body>
          <Modal.Footer primary={{ label: 'Fechar', onClick: () => setSize(null) }} />
        </Modal>
      </>
    );
  },
};

export const PrimaryDisabledWithTooltip = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Abrir
        </Button>
        <Modal isOpen={open} onClose={() => setOpen(false)}>
          <Modal.Header title="Validação pendente" onClose={() => setOpen(false)} />
          <Modal.Body>
            <p style={{ margin: 0 }}>O botão primário está desabilitado até corrigir os erros.</p>
          </Modal.Body>
          <Modal.Footer
            secondary={{ label: 'Cancelar', onClick: () => setOpen(false) }}
            primary={{
              label: 'Finalizar',
              disabled: true,
              tooltip: 'Corrija os erros antes de finalizar.',
              onClick: () => setOpen(false),
            }}
          />
        </Modal>
      </>
    );
  },
};
