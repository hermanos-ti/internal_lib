import { LoaderGlobal, LoaderManagerInstance } from './Loader';
import { useState } from 'react';

export default {
  title: 'Functions/Loader',
  component: LoaderGlobal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Loader global gerenciado por função para exibir indicadores de carregamento em toda a aplicação.',
      },
    },
  },
};

export const Default = {
  render: () => {
    const [visible, setVisible] = useState(false);

    return (
      <>
        <LoaderGlobal />
        <div style={{ padding: '2rem' }}>
          <h2>Loader Global</h2>
          <p>Clique no botão para mostrar/ocultar o loader global.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => {
              LoaderManagerInstance.show();
              setVisible(true);
            }}>
              Mostrar Loader
            </button>
            <button onClick={() => {
              LoaderManagerInstance.hide();
              setVisible(false);
            }}>
              Ocultar Loader
            </button>
          </div>
        </div>
      </>
    );
  },
};

export const WithText = {
  render: () => {
    return (
      <>
        <LoaderGlobal />
        <div style={{ padding: '2rem' }}>
          <h2>Loader com Texto</h2>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button onClick={() => {
              LoaderManagerInstance.show({ text: 'Carregando dados...' });
            }}>
              Mostrar com Texto
            </button>
            <button onClick={() => {
              LoaderManagerInstance.hide();
            }}>
              Ocultar
            </button>
          </div>
        </div>
      </>
    );
  },
};

export const DifferentSizes = {
  render: () => {
    return (
      <>
        <LoaderGlobal />
        <div style={{ padding: '2rem' }}>
          <h2>Diferentes Tamanhos</h2>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button onClick={() => {
              LoaderManagerInstance.show({ size: 'small', text: 'Pequeno' });
            }}>
              Pequeno
            </button>
            <button onClick={() => {
              LoaderManagerInstance.show({ size: 'medium', text: 'Médio' });
            }}>
              Médio
            </button>
            <button onClick={() => {
              LoaderManagerInstance.show({ size: 'large', text: 'Grande' });
            }}>
              Grande
            </button>
            <button onClick={() => {
              LoaderManagerInstance.hide();
            }}>
              Ocultar
            </button>
          </div>
        </div>
      </>
    );
  },
};

export const DifferentColors = {
  render: () => {
    return (
      <>
        <LoaderGlobal />
        <div style={{ padding: '2rem' }}>
          <h2>Diferentes Cores</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => {
              LoaderManagerInstance.show({ color: 'primary', text: 'Primary' });
            }}>
              Primary
            </button>
            <button onClick={() => {
              LoaderManagerInstance.show({ color: 'success', text: 'Success' });
            }}>
              Success
            </button>
            <button onClick={() => {
              LoaderManagerInstance.show({ color: 'danger', text: 'Danger' });
            }}>
              Danger
            </button>
            <button onClick={() => {
              LoaderManagerInstance.show({ color: 'warning', text: 'Warning' });
            }}>
              Warning
            </button>
            <button onClick={() => {
              LoaderManagerInstance.hide();
            }}>
              Ocultar
            </button>
          </div>
        </div>
      </>
    );
  },
};

export const NonBlocking = {
  render: () => {
    return (
      <>
        <LoaderGlobal />
        <div style={{ padding: '2rem' }}>
          <h2>Loader Não Bloqueante</h2>
          <p>Este loader não bloqueia interações com a página.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => {
              LoaderManagerInstance.show({ overlay: false, text: 'Não bloqueante' });
            }}>
              Mostrar (Não Bloqueante)
            </button>
            <button onClick={() => {
              LoaderManagerInstance.show({ overlay: true, text: 'Bloqueante' });
            }}>
              Mostrar (Bloqueante)
            </button>
            <button onClick={() => {
              LoaderManagerInstance.hide();
            }}>
              Ocultar
            </button>
          </div>
        </div>
      </>
    );
  },
};

export const SimulatedLoading = {
  render: () => {
    const simulateLoading = async () => {
      LoaderManagerInstance.show({ text: 'Processando dados...' });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      LoaderManagerInstance.hide();
    };

    return (
      <>
        <LoaderGlobal />
        <div style={{ padding: '2rem' }}>
          <h2>Simulação de Carregamento</h2>
          <p>Clique no botão para simular um carregamento de 2 segundos.</p>
          <div style={{ marginTop: '1rem' }}>
            <button onClick={simulateLoading}>
              Iniciar Carregamento
            </button>
          </div>
        </div>
      </>
    );
  },
};

