import React, { useRef, useState } from 'react';
import { Tooltip } from './Tooltip';

// Styles for demo components to look clean and modern
const buttonStyle = {
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: '500',
  color: '#334155', // Slate-700
  backgroundColor: '#f1f5f9', // Slate-100
  border: '1px solid #cbd5e1', // Slate-300
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const primaryButtonStyle = {
  ...buttonStyle,
  color: '#ffffff',
  backgroundColor: '#3b82f6', // Blue-500
  border: '1px solid #2563eb', // Blue-600
};

const dangerButtonStyle = {
  ...buttonStyle,
  color: '#ffffff',
  backgroundColor: '#ef4444', // Red-500
  border: '1px solid #dc2626', // Red-600
};

const inputStyle = {
  padding: '10px 12px',
  fontSize: '14px',
  color: '#1e293b', // Slate-800
  border: '1px solid #cbd5e1', // Slate-300
  borderRadius: '6px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  transition: 'border-color 0.2s ease',
};

const containerStyle = {
  padding: '60px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Componente Tooltip para exibir informações contextuais adicionais quando o usuário interage com um elemento. Design limpo e moderno.',
      },
    },
  },
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'top', 'top-start', 'top-end',
        'right', 'right-start', 'right-end',
        'bottom', 'bottom-start', 'bottom-end',
        'left', 'left-start', 'left-end',
      ],
      description: 'Posicionamento preferido do tooltip',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o tooltip',
    },
    distance: {
      control: 'number',
      description: 'Distância em pixels do elemento alvo',
    },
    open: {
      control: 'boolean',
      description: 'Controla se o tooltip está aberto (modo controlado)',
    },
    skidding: {
      control: 'number',
      description: 'Deslocamento ao longo do elemento alvo',
    },
    showDelay: {
      control: 'number',
      description: 'Tempo de espera antes de mostrar (ms)',
    },
    hideDelay: {
      control: 'number',
      description: 'Tempo de espera antes de esconder (ms)',
    },
    trigger: {
      control: 'text',
      description: 'Triggers: hover, focus, click, manual (separados por espaço)',
    },
    withoutArrow: {
      control: 'boolean',
      description: 'Remove a seta do tooltip',
    },
    content: {
      control: 'text',
      description: 'Conteúdo do tooltip',
    },
  },
};

// ============================================
// CASO 1: USO BÁSICO
// ============================================
export const UsoBasico = {
  name: 'Uso Básico',
  render: () => (
    <div style={containerStyle}>
      <Tooltip content="Tooltip simples e informativo">
        <button style={buttonStyle}>
          Passe o mouse aqui
        </button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'O uso mais simples do Tooltip. Por padrão, aparece ao passar o mouse sobre o elemento (hover) e ao focar (focus).',
      },
    },
  },
};

// ============================================
// CASO 2: PLACEMENTS (POSICIONAMENTOS)
// ============================================
export const Placements = {
  name: 'Placements - Posicionamentos',
  render: () => {
    const placements = [
      'top', 'top-start', 'top-end',
      'right', 'right-start', 'right-end',
      'bottom', 'bottom-start', 'bottom-end',
      'left', 'left-start', 'left-end',
    ];

    return (
      <div style={{ 
        ...containerStyle,
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '40px',
        padding: '100px',
      }}>
        {placements.map((placement) => (
          <Tooltip 
            key={placement} 
            content={`Placement: ${placement}`}
            placement={placement}
          >
            <button style={{ 
              ...buttonStyle, 
              width: '100%', 
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {placement}
            </button>
          </Tooltip>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'O Tooltip suporta 12 posicionamentos diferentes.',
      },
    },
  },
};

// Demonstração individual de cada placement
export const PlacementTop = {
  name: 'Placement: Top',
  render: () => (
    <div style={containerStyle}>
      <Tooltip content="Tooltip posicionado acima" placement="top">
        <button style={buttonStyle}>Top</button>
      </Tooltip>
    </div>
  ),
};

export const PlacementBottom = {
  name: 'Placement: Bottom',
  render: () => (
    <div style={containerStyle}>
      <Tooltip content="Tooltip posicionado abaixo" placement="bottom">
        <button style={buttonStyle}>Bottom</button>
      </Tooltip>
    </div>
  ),
};

export const PlacementLeft = {
  name: 'Placement: Left',
  render: () => (
    <div style={containerStyle}>
      <Tooltip content="Tooltip posicionado à esquerda" placement="left">
        <button style={buttonStyle}>Left</button>
      </Tooltip>
    </div>
  ),
};

export const PlacementRight = {
  name: 'Placement: Right',
  render: () => (
    <div style={containerStyle}>
      <Tooltip content="Tooltip posicionado à direita" placement="right">
        <button style={buttonStyle}>Right</button>
      </Tooltip>
    </div>
  ),
};

// ============================================
// CASO 3: TRIGGERS (GATILHOS)
// ============================================
export const TriggerHover = {
  name: 'Trigger: Hover',
  render: () => (
    <div style={containerStyle}>
      <Tooltip 
        content="Aparece ao passar o mouse"
        trigger="hover"
      >
        <button style={buttonStyle}>Passe o mouse</button>
      </Tooltip>
    </div>
  ),
};

export const TriggerFocus = {
  name: 'Trigger: Focus',
  render: () => (
    <div style={containerStyle}>
      <div style={{ width: '300px' }}>
        <Tooltip 
          content="Aparece ao focar no elemento (acessibilidade)"
          trigger="focus"
        >
          <input 
            type="text" 
            placeholder="Clique ou use Tab para focar"
            style={inputStyle}
          />
        </Tooltip>
      </div>
    </div>
  ),
};

export const TriggerClick = {
  name: 'Trigger: Click',
  render: () => (
    <div style={containerStyle}>
      <Tooltip 
        content="Clique novamente para fechar"
        trigger="click"
      >
        <button style={buttonStyle}>Clique aqui</button>
      </Tooltip>
    </div>
  ),
};

export const TriggerManual = {
  name: 'Trigger: Manual',
  render: () => {
    const tooltipRef = useRef(null);
    
    return (
      <div style={{ ...containerStyle, flexDirection: 'column', gap: '20px' }}>
        <Tooltip 
          ref={tooltipRef}
          content="Controlado programaticamente"
          trigger="manual"
        >
          <button style={{ ...buttonStyle, cursor: 'default' }}>Elemento Alvo</button>
        </Tooltip>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={primaryButtonStyle} onClick={() => tooltipRef.current?.show()}>
            Mostrar
          </button>
          <button style={buttonStyle} onClick={() => tooltipRef.current?.hide()}>
            Esconder
          </button>
        </div>
      </div>
    );
  },
};

export const TriggerCombinacoes = {
  name: 'Triggers: Combinações',
  render: () => (
    <div style={{ ...containerStyle, flexDirection: 'column', gap: '30px' }}>
      <Tooltip 
        content="Hover ou Focus"
        trigger="hover focus"
      >
        <button style={buttonStyle}>Hover ou Focus</button>
      </Tooltip>
      
      <Tooltip 
        content="Hover ou Click"
        trigger="hover click"
      >
        <button style={buttonStyle}>Hover ou Click</button>
      </Tooltip>
    </div>
  ),
};

// ============================================
// CASO 4: DELAYS CONFIGURÁVEIS
// ============================================
export const Delays = {
  name: 'Delays Configuráveis',
  render: () => (
    <div style={{ ...containerStyle, flexDirection: 'column', gap: '30px' }}>
      <Tooltip 
        content="Delay de 500ms para aparecer"
        showDelay={500}
      >
        <button style={buttonStyle}>Delay Show: 500ms</button>
      </Tooltip>
      
      <Tooltip 
        content="Delay de 300ms para desaparecer"
        hideDelay={300}
      >
        <button style={buttonStyle}>Delay Hide: 300ms</button>
      </Tooltip>
      
      <Tooltip 
        content="Delays customizados"
        showDelay={800}
        hideDelay={500}
      >
        <button style={buttonStyle}>Show: 800ms / Hide: 500ms</button>
      </Tooltip>
    </div>
  ),
};

// ============================================
// CASO 5: CONTROLE PROGRAMÁTICO
// ============================================
export const ControleProgramatico = {
  name: 'Controle Programático',
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div style={{ ...containerStyle, flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '16px', color: '#475569' }}>Modo Controlado (prop open)</h3>
        
        <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Tooltip 
            content="Controlado pela prop open"
            open={isOpen}
            trigger="manual"
          >
            <div style={{ 
              padding: '20px', 
              border: '1px dashed #cbd5e1', 
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              color: '#64748b'
            }}>
              Elemento Alvo
            </div>
          </Tooltip>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={isOpen ? buttonStyle : primaryButtonStyle} onClick={() => setIsOpen(true)}>Abrir</button>
            <button style={!isOpen ? buttonStyle : primaryButtonStyle} onClick={() => setIsOpen(false)}>Fechar</button>
            <button style={buttonStyle} onClick={() => setIsOpen(!isOpen)}>Toggle</button>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// CASO 6: CUSTOMIZAÇÃO VISUAL
// ============================================
export const CustomizacaoVisual = {
  name: 'Customização Visual',
  render: () => (
    <div style={{ ...containerStyle, flexDirection: 'column', gap: '40px' }}>
      <Tooltip 
        content="Tooltip sem seta"
        withoutArrow={true}
      >
        <button style={buttonStyle}>Sem Arrow</button>
      </Tooltip>
      
      <Tooltip 
        content="Distância maior (24px)"
        distance={24}
      >
        <button style={buttonStyle}>Distance: 24px</button>
      </Tooltip>
      
      <Tooltip 
        content="Com skidding (deslocamento)"
        skidding={30}
        placement="top"
      >
        <button style={buttonStyle}>Skidding: 30px</button>
      </Tooltip>
    </div>
  ),
};

// ============================================
// CASO 7: ESTADOS E DESABILITAÇÃO
// ============================================
export const EstadosDesabilitacao = {
  name: 'Estados e Desabilitação',
  render: () => {
    const [disabled, setDisabled] = useState(false);
    
    return (
      <div style={{ ...containerStyle, flexDirection: 'column', gap: '30px' }}>
        <Tooltip 
          content="Este tooltip pode ser desabilitado"
          disabled={disabled}
        >
          <button style={buttonStyle}>Passe o mouse (Teste)</button>
        </Tooltip>
        
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          fontSize: '14px', 
          color: '#475569',
          cursor: 'pointer'
        }}>
          <input 
            type="checkbox" 
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          Desabilitar tooltip
        </label>
      </div>
    );
  },
};

// ============================================
// CASO 8: EVENTOS E CALLBACKS
// ============================================
export const EventosCallbacks = {
  name: 'Eventos e Callbacks',
  render: () => {
    const [logs, setLogs] = useState([]);
    
    const addLog = (event) => {
      setLogs(prev => [`${new Date().toLocaleTimeString().split(' ')[0]}: ${event}`, ...prev].slice(0, 5));
    };
    
    return (
      <div style={{ ...containerStyle, flexDirection: 'column', gap: '30px' }}>
        <Tooltip 
          content="Gera eventos no log abaixo"
          onShow={() => addLog('onShow')}
          onAfterShow={() => addLog('onAfterShow')}
          onHide={() => addLog('onHide')}
          onAfterHide={() => addLog('onAfterHide')}
        >
          <button style={buttonStyle}>Interaja comigo</button>
        </Tooltip>
        
        <div style={{ 
          width: '100%', 
          maxWidth: '400px',
          backgroundColor: '#1e293b', 
          borderRadius: '6px',
          padding: '15px',
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <div style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px', fontWeight: 'bold' }}>Event Log</div>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b' }}>Aguardando interação...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
            ))
          )}
        </div>
      </div>
    );
  },
};

// ============================================
// CASO 9: CASOS DE USO REAIS
// ============================================
export const CasoUsoBotoes = {
  name: 'Caso de Uso: Botões de Ação',
  render: () => (
    <div style={{ ...containerStyle, gap: '15px', flexWrap: 'wrap' }}>
      <Tooltip content="Salvar alterações" placement="top">
        <button style={primaryButtonStyle}>
          Salvar
        </button>
      </Tooltip>
      
      <Tooltip content="Excluir item permanentemente" placement="top">
        <button style={dangerButtonStyle}>
          Excluir
        </button>
      </Tooltip>
      
      <Tooltip content="Exportar dados para CSV" placement="top">
        <button style={buttonStyle}>
          Exportar
        </button>
      </Tooltip>
    </div>
  ),
};

export const CasoUsoFormularios = {
  name: 'Caso de Uso: Campos de Formulário',
  render: () => (
    <div style={{ ...containerStyle, alignItems: 'flex-start' }}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
            Senha
          </label>
          <Tooltip 
            content="Mínimo 8 caracteres, maiúsculas e números."
            trigger="focus"
            placement="right"
          >
            <input 
              type="password" 
              placeholder="Digite sua senha"
              style={inputStyle}
            />
          </Tooltip>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
            Email
          </label>
          <Tooltip 
            content="Usaremos para notificações."
            trigger="focus"
            placement="right"
          >
            <input 
              type="email" 
              placeholder="seu@email.com"
              style={inputStyle}
            />
          </Tooltip>
        </div>
      </form>
    </div>
  ),
};

export const CasoUsoTabelas = {
  name: 'Caso de Uso: Tabelas',
  render: () => (
    <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', width: '100%', maxWidth: '600px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'sans-serif', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Produto</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Preço</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', color: '#1e293b' }}>MacBook Pro</td>
              <td style={{ padding: '12px 16px', color: '#1e293b' }}>R$ 14.000</td>
              <td style={{ padding: '12px 16px' }}>
                <Tooltip content="Em estoque (12 unidades)" placement="top">
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    backgroundColor: '#dcfce7', 
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'help'
                  }}>
                    Disponível
                  </span>
                </Tooltip>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <Tooltip content="Editar" placement="top">
                  <button style={{ ...buttonStyle, padding: '6px 10px', marginRight: '8px' }}>✏️</button>
                </Tooltip>
                <Tooltip content="Excluir" placement="top">
                  <button style={{ ...buttonStyle, padding: '6px 10px', color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}>🗑️</button>
                </Tooltip>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px 16px', color: '#1e293b' }}>Magic Mouse</td>
              <td style={{ padding: '12px 16px', color: '#1e293b' }}>R$ 600</td>
              <td style={{ padding: '12px 16px' }}>
                <Tooltip content="Aguardando reposição" placement="top">
                   <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    backgroundColor: '#fee2e2', 
                    color: '#991b1b',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'help'
                  }}>
                    Esgotado
                  </span>
                </Tooltip>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <Tooltip content="Editar" placement="top">
                  <button style={{ ...buttonStyle, padding: '6px 10px', marginRight: '8px' }}>✏️</button>
                </Tooltip>
                <Tooltip content="Excluir" placement="top">
                  <button style={{ ...buttonStyle, padding: '6px 10px', color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}>🗑️</button>
                </Tooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ),
};

export const ExemploCompleto = {
  name: 'Exemplo Completo',
  render: () => {
    return (
      <div style={{ ...containerStyle, alignItems: 'flex-start' }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '400px', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>Configurações de Conta</h3>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                Nome de Usuário
                <Tooltip content="Visível para outros usuários" placement="right">
                  <span style={{ cursor: 'help', color: '#94a3b8', fontSize: '12px' }}>ⓘ</span>
                </Tooltip>
              </label>
              <input type="text" placeholder="jdoe" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                Chave de API
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value="sk_test_51Mz..." readOnly style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b' }} />
                <Tooltip content="Copiar para área de transferência" placement="top">
                  <button type="button" style={{ ...buttonStyle, padding: '0 12px' }}>📋</button>
                </Tooltip>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Tooltip content="Descartar alterações" placement="bottom">
                <button type="button" style={buttonStyle}>Cancelar</button>
              </Tooltip>
              <Tooltip content="Salvar preferências" placement="bottom">
                <button type="button" style={primaryButtonStyle}>Salvar</button>
              </Tooltip>
            </div>
          </form>
        </div>
      </div>
    );
  },
};
