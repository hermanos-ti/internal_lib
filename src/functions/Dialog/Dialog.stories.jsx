import { Dialog, DialogGlobal } from './Dialog';
import '../../assets/icons/css/all.css'

export default {
  title: 'Functions/Dialog',
  component: DialogGlobal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Função imperativa para exibir diálogos modais. Monte `<DialogGlobal />` no root da aplicação (junto com `<LoaderGlobal />`).',
      },
    },
  },
  decorators: [
    (Story) => (
      <>
        <DialogGlobal />
        <Story />
      </>
    ),
  ],
};

const DemoPanel = ({ title, children }) => (
  <div style={{ padding: '2rem' }}>
    <h2 style={{ margin: '0 0 0.5rem' }}>{title}</h2>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>{children}</div>
  </div>
);

const btn = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
};

export const Default = {
  render: () => (
    <DemoPanel title="Dialog — visão geral">
      <button
        style={btn}
        onClick={() =>
          Dialog.alert({
            title: 'Operação concluída',
            message: 'Os dados foram salvos com sucesso. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
            type: 'success',
            buttonsText: { close: 'Entendi' },
          })
        }
      >
        Informativo
      </button>
      <button
        style={btn}
        onClick={() =>
          Dialog.confirm({
            title: 'Confirmar ação',
            message: 'Deseja continuar com esta operação?',
            type: 'warning',
            buttonsText: { confirm: 'Sim', cancel: 'Não' },
          })
        }
      >
        Confirmação
      </button>
    </DemoPanel>
  ),
};

export const InformativoPorTipo = {
  render: () => (
    <DemoPanel title="Informativo (OK) por tipo">
      {['default', 'info', 'primary', 'success', 'warning', 'error'].map((type) => (
        <button
          key={type}
          style={btn}
          onClick={() =>
            Dialog.alert({
              title: `Dialog ${type}`,
              message: 'Mensagem informativa com espaçamento confortável para leitura.',
              type,
              buttonsText: { close: 'OK' },
            })
          }
        >
          {type}
        </button>
      ))}
    </DemoPanel>
  ),
};

export const Confirmacao = {
  render: () => (
    <DemoPanel title="Confirmação">
      <button
        style={btn}
        onClick={async () => {
          const ok = await Dialog.confirm({
            title: 'Vincular consultor',
            message: 'Deseja realmente vincular este consultor a este contrato?',
            type: 'warning',
            buttonsText: { confirm: 'Sim', cancel: 'Não' },
          });
          Dialog.alert({
            title: ok ? 'Confirmado' : 'Cancelado',
            message: ok ? 'Ação aprovada pelo usuário.' : 'Ação negada pelo usuário.',
            type: ok ? 'success' : 'info',
          });
        }}
      >
        Abrir confirmação
      </button>
    </DemoPanel>
  ),
};

export const DangerComDigitacao = {
  render: () => (
    <DemoPanel title="Danger — confirmação por digitação">
      <button
        style={btn}
        onClick={async () => {
          const deleted = await Dialog.confirm({
            title: 'Excluir workspace',
            type: 'danger',
            confirmText: 'meu-workspace',
            html: '<p>Esta ação é <strong>irreversível</strong>. Todos os dados serão perdidos.</p>',
            buttonsText: { confirm: 'Excluir permanentemente', cancel: 'Manter' },
          });
          Dialog.alert({
            title: deleted ? 'Excluído' : 'Cancelado',
            message: deleted ? 'Workspace removido.' : 'Exclusão cancelada.',
            type: deleted ? 'success' : 'info',
          });
        }}
      >
        Excluir workspace
      </button>
    </DemoPanel>
  ),
};

export const CorpoHtml = {
  render: () => (
    <DemoPanel title="Corpo HTML customizado">
      <button
        style={btn}
        onClick={() =>
          Dialog.alert({
            title: 'Detalhes da operação',
            type: 'info',
            html: `
              <p>Resumo dos itens afetados:</p>
              <ul>
                <li>12 registros de contrato</li>
                <li>3 anexos vinculados</li>
                <li>1 representante ativo</li>
              </ul>
            `,
          })
        }
      >
        Ver detalhes
      </button>
    </DemoPanel>
  ),
};

export const CriticalCountdown = {
  render: () => (
    <DemoPanel title="Critical — countdown de 5s">
      <button
        style={btn}
        onClick={() =>
          Dialog.confirm({
            title: 'Ação irreversível',
            message: 'Esta operação afetará todos os registros vinculados.',
            type: 'warning',
            critical: true,
            criticalDelay: 5,
            buttonsText: { confirm: 'Prosseguir', cancel: 'Cancelar' },
          })
        }
      >
        Confirmação crítica
      </button>
      <button
        style={btn}
        onClick={() =>
          Dialog.confirm({
            title: 'Excluir conta',
            type: 'danger',
            confirmText: 'minha-conta',
            critical: true,
            html: '<p>Digite o nome da conta e aguarde o countdown para confirmar.</p>',
            buttonsText: { confirm: 'Excluir', cancel: 'Cancelar' },
          })
        }
      >
        Danger + critical
      </button>
    </DemoPanel>
  ),
};

export const IconeCustomizado = {
  render: () => (
    <DemoPanel title="Ícone customizado">
      <button
        style={btn}
        onClick={() =>
          Dialog.alert({
            title: 'Sessão expirada',
            message: 'Faça login novamente para continuar.',
            type: 'warning',
            icon: 'far fa-clock',
            buttonsText: { close: 'Entendi' },
          })
        }
      >
        Ícone customizado
      </button>
    </DemoPanel>
  ),
};

export const FilaDeDialogs = {
  render: () => (
    <DemoPanel title="Fila — dialogs em sequência">
      <button
        style={btn}
        onClick={() => {
          Dialog.alert({ title: 'Primeiro', message: 'Dialog 1 de 3', type: 'info' });
          Dialog.alert({ title: 'Segundo', message: 'Dialog 2 de 3', type: 'warning' });
          Dialog.alert({ title: 'Terceiro', message: 'Dialog 3 de 3', type: 'success' });
        }}
      >
        Abrir 3 dialogs em fila
      </button>
    </DemoPanel>
  ),
};

export const CompatibilidadeShow = {
  render: () => (
    <DemoPanel title="Dialog.show() — compatibilidade ERP">
      <button
        style={btn}
        onClick={() =>
          Dialog.show(
            'Deseja continuar?',
            'warning',
            { buttonsText: { confirm: 'Sim', cancel: 'Não' } },
            (result) => {
              Dialog.alert({
                title: 'Resultado',
                message: `Callback recebeu: ${String(result)}`,
                type: 'info',
              });
            }
          )
        }
      >
        show() com callback
      </button>
      <button
        style={btn}
        onClick={() =>
          Dialog.show('Operação concluída!', 'success', {
            confirmButton: false,
            buttonsText: { close: 'OK' },
          })
        }
      >
        show() informativo
      </button>
      <button
        style={btn}
        onClick={() =>
          Dialog.show('Ação crítica!', 'critical', {
            buttonsText: { confirm: 'Confirmar', cancel: 'Cancelar' },
          })
        }
      >
        type critical (ERP)
      </button>
    </DemoPanel>
  ),
};
