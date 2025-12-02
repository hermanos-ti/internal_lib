import React, { useRef, useState } from 'react';
import { Tooltip } from './Tooltip';

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Componente Tooltip para exibir informações contextuais adicionais quando o usuário interage com um elemento. Suporta múltiplos posicionamentos, triggers, delays configuráveis e controle programático.',
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
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Tooltip content="Este é um tooltip básico que aparece ao passar o mouse">
        <button style={{ padding: '10px 20px', fontSize: '16px' }}>
          Passe o mouse aqui
        </button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'O uso mais simples do Tooltip. Por padrão, aparece ao passar o mouse sobre o elemento (hover) e ao focar (focus). O tooltip é posicionado acima do elemento (top) por padrão.',
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
        padding: '150px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '80px',
        alignItems: 'center',
        justifyItems: 'center'
      }}>
        {placements.map((placement) => (
          <Tooltip 
            key={placement} 
            content={`Placement: ${placement}`}
            placement={placement}
          >
            <button style={{ 
              padding: '10px 15px', 
              minWidth: '100px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
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
        story: 'O Tooltip suporta 12 posicionamentos diferentes. O componente ajusta automaticamente a posição se o tooltip sair da viewport. Use `-start` para alinhar ao início, `-end` para alinhar ao final, ou sem sufixo para centralizar.',
      },
    },
  },
};

// Demonstração individual de cada placement
export const PlacementTop = {
  name: 'Placement: Top',
  render: () => (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Tooltip content="Tooltip posicionado acima" placement="top">
        <button>Top</button>
      </Tooltip>
    </div>
  ),
};

export const PlacementBottom = {
  name: 'Placement: Bottom',
  render: () => (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Tooltip content="Tooltip posicionado abaixo" placement="bottom">
        <button>Bottom</button>
      </Tooltip>
    </div>
  ),
};

export const PlacementLeft = {
  name: 'Placement: Left',
  render: () => (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Tooltip content="Tooltip posicionado à esquerda" placement="left">
        <button>Left</button>
      </Tooltip>
    </div>
  ),
};

export const PlacementRight = {
  name: 'Placement: Right',
  render: () => (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Tooltip content="Tooltip posicionado à direita" placement="right">
        <button>Right</button>
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
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Tooltip 
        content="Aparece ao passar o mouse"
        trigger="hover"
      >
        <button>Passe o mouse</button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Trigger `hover`: O tooltip aparece quando o usuário passa o mouse sobre o elemento. É o comportamento padrão e ideal para informações contextuais.',
      },
    },
  },
};

export const TriggerFocus = {
  name: 'Trigger: Focus',
  render: () => (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Tooltip 
        content="Aparece ao focar no elemento (acessibilidade)"
        trigger="focus"
      >
        <input 
          type="text" 
          placeholder="Clique ou use Tab para focar"
          style={{ padding: '10px', fontSize: '16px' }}
        />
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Trigger `focus`: Ideal para acessibilidade. O tooltip aparece quando o elemento recebe foco via teclado ou mouse. Use em campos de formulário e elementos interativos.',
      },
    },
  },
};

export const TriggerClick = {
  name: 'Trigger: Click',
  render: () => (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Tooltip 
        content="Clique novamente para fechar"
        trigger="click"
      >
        <button>Clique aqui</button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Trigger `click`: O tooltip aparece/desaparece ao clicar no elemento. Útil para informações que o usuário precisa ver explicitamente ou para mobile onde hover não funciona.',
      },
    },
  },
};

export const TriggerManual = {
  name: 'Trigger: Manual',
  render: () => {
    const tooltipRef = useRef(null);
    
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <Tooltip 
          ref={tooltipRef}
          content="Controlado programaticamente"
          trigger="manual"
        >
          <button>Elemento alvo</button>
        </Tooltip>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => tooltipRef.current?.show()}>
            Mostrar Tooltip
          </button>
          <button onClick={() => tooltipRef.current?.hide()}>
            Esconder Tooltip
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Trigger `manual`: O tooltip só aparece através de controle programático usando os métodos `show()` e `hide()` ou a prop `open`. Use quando precisar de controle total sobre quando o tooltip aparece.',
      },
    },
  },
};

export const TriggerCombinacoes = {
  name: 'Triggers: Combinações',
  render: () => (
    <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
      <div>
        <Tooltip 
          content="Hover ou Focus"
          trigger="hover focus"
        >
          <button>Hover ou Focus</button>
        </Tooltip>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Aparece ao passar mouse OU focar
        </p>
      </div>
      
      <div>
        <Tooltip 
          content="Hover ou Click"
          trigger="hover click"
        >
          <button>Hover ou Click</button>
        </Tooltip>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Aparece ao passar mouse OU clicar
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Você pode combinar múltiplos triggers separando-os por espaço. O tooltip aparecerá quando qualquer um dos triggers for ativado.',
      },
    },
  },
};

// ============================================
// CASO 4: DELAYS CONFIGURÁVEIS
// ============================================
export const Delays = {
  name: 'Delays Configuráveis',
  render: () => (
    <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
      <div>
        <Tooltip 
          content="Delay de 500ms para aparecer"
          showDelay={500}
        >
          <button>Delay de 500ms</button>
        </Tooltip>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Aguarda 500ms antes de mostrar
        </p>
      </div>
      
      <div>
        <Tooltip 
          content="Delay de 300ms para desaparecer"
          hideDelay={300}
        >
          <button>Delay de 300ms para esconder</button>
        </Tooltip>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Aguarda 300ms antes de esconder
        </p>
      </div>
      
      <div>
        <Tooltip 
          content="Delays customizados"
          showDelay={800}
          hideDelay={500}
        >
          <button>Delays customizados</button>
        </Tooltip>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Show: 800ms, Hide: 500ms
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `showDelay` para evitar que tooltips apareçam acidentalmente quando o usuário apenas passa o mouse rapidamente. Use `hideDelay` para manter o tooltip visível brevemente após o mouse sair, útil para links clicáveis dentro do tooltip.',
      },
    },
  },
};

// ============================================
// CASO 5: CONTROLE PROGRAMÁTICO
// ============================================
export const ControleProgramatico = {
  name: 'Controle Programático',
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const tooltipRef = useRef(null);
    
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '30px' }}>Modo Controlado (prop open)</h3>
        <Tooltip 
          content="Controlado pela prop open"
          open={isOpen}
          trigger="manual"
        >
          <button>Elemento alvo</button>
        </Tooltip>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => setIsOpen(true)}>Abrir</button>
          <button onClick={() => setIsOpen(false)}>Fechar</button>
          <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
        </div>
        
        <h3 style={{ marginTop: '50px', marginBottom: '30px' }}>Métodos Imperativos (ref)</h3>
        <Tooltip 
          ref={tooltipRef}
          content="Controlado por métodos show() e hide()"
          trigger="manual"
        >
          <button>Elemento alvo</button>
        </Tooltip>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => tooltipRef.current?.show()}>show()</button>
          <button onClick={() => tooltipRef.current?.hide()}>hide()</button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'O Tooltip pode ser controlado de duas formas: usando a prop `open` (modo controlado) ou usando métodos imperativos através de ref (`show()` e `hide()`). Use quando precisar sincronizar o estado do tooltip com lógica de negócio.',
      },
    },
  },
};

// ============================================
// CASO 6: CUSTOMIZAÇÃO VISUAL
// ============================================
export const CustomizacaoVisual = {
  name: 'Customização Visual',
  render: () => (
    <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
      <div>
        <Tooltip 
          content="Tooltip sem seta"
          withoutArrow={true}
        >
          <button>Sem Arrow</button>
        </Tooltip>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          withoutArrow={true}
        </p>
      </div>
      
      <div>
        <Tooltip 
          content="Distância maior (20px)"
          distance={20}
        >
          <button>Distance: 20px</button>
        </Tooltip>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          distance={20}
        </p>
      </div>
      
      <div>
        <Tooltip 
          content="Com skidding (deslocamento lateral)"
          skidding={30}
          placement="top"
        >
          <button>Skidding: 30px</button>
        </Tooltip>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          skidding={30}
        </p>
      </div>
      
      <div>
        <Tooltip 
          content="Combinação: sem arrow, distância 15px, skidding 20px"
          withoutArrow={true}
          distance={15}
          skidding={20}
        >
          <button>Combinação</button>
        </Tooltip>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Customize a aparência do tooltip: remova a seta com `withoutArrow`, ajuste a distância com `distance`, e use `skidding` para deslocamento fino ao longo do elemento alvo.',
      },
    },
  },
};

// ============================================
// CASO 7: ESTADOS E DESABILITAÇÃO
// ============================================
export const EstadosDesabilitacao = {
  name: 'Estados e Desabilitação',
  render: () => {
    const [disabled, setDisabled] = useState(false);
    
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <Tooltip 
          content="Este tooltip pode ser desabilitado"
          disabled={disabled}
        >
          <button>Elemento com tooltip</button>
        </Tooltip>
        
        <div style={{ marginTop: '30px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <input 
              type="checkbox" 
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
            />
            Desabilitar tooltip
          </label>
        </div>
        
        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Tooltip condicional:</p>
          <Tooltip 
            content={disabled ? "Tooltip está desabilitado" : "Tooltip está habilitado"}
            disabled={disabled}
          >
            <button>Estado: {disabled ? 'Desabilitado' : 'Habilitado'}</button>
          </Tooltip>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use a prop `disabled` para desabilitar o tooltip dinamicamente. Útil quando o tooltip só deve aparecer em certas condições ou estados da aplicação.',
      },
    },
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
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${event}`]);
    };
    
    const clearLogs = () => setLogs([]);
    
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <Tooltip 
          content="Observe os eventos no console abaixo"
          onShow={() => addLog('onShow - Tooltip começou a aparecer')}
          onAfterShow={() => addLog('onAfterShow - Tooltip completamente visível')}
          onHide={() => addLog('onHide - Tooltip começou a esconder')}
          onAfterHide={() => addLog('onAfterHide - Tooltip completamente escondido')}
        >
          <button>Passe o mouse aqui</button>
        </Tooltip>
        
        <div style={{ marginTop: '40px', textAlign: 'left', maxWidth: '500px', margin: '40px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0 }}>Log de Eventos:</h4>
            <button onClick={clearLogs} style={{ padding: '5px 10px', fontSize: '12px' }}>
              Limpar
            </button>
          </div>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            {logs.length === 0 ? (
              <p style={{ color: '#999', margin: 0 }}>Nenhum evento ainda. Interaja com o tooltip acima.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '5px' }}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'O Tooltip emite 4 eventos: `onShow` (início da animação de entrada), `onAfterShow` (após animação completar), `onHide` (início da animação de saída), e `onAfterHide` (após animação completar). Use para analytics, logging ou feedback visual.',
      },
    },
  },
};

// ============================================
// CASO 9: CASOS DE USO REAIS
// ============================================
export const CasoUsoBotoes = {
  name: 'Caso de Uso: Botões de Ação',
  render: () => (
    <div style={{ padding: '100px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Tooltip content="Salvar alterações" placement="top">
        <button style={{ padding: '10px 20px', fontSize: '16px' }}>💾 Salvar</button>
      </Tooltip>
      
      <Tooltip content="Excluir item permanentemente" placement="top">
        <button style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
          🗑️ Excluir
        </button>
      </Tooltip>
      
      <Tooltip content="Exportar dados para CSV" placement="top">
        <button style={{ padding: '10px 20px', fontSize: '16px' }}>📥 Exportar</button>
      </Tooltip>
      
      <Tooltip content="Compartilhar com outros usuários" placement="top">
        <button style={{ padding: '10px 20px', fontSize: '16px' }}>🔗 Compartilhar</button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use tooltips em botões de ação para fornecer contexto adicional sobre o que a ação faz, especialmente útil para ícones sem texto ou ações destrutivas.',
      },
    },
  },
};

export const CasoUsoIconesAjuda = {
  name: 'Caso de Uso: Ícones de Ajuda',
  render: () => (
    <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label>Nome completo:</label>
        <input type="text" placeholder="Digite seu nome" style={{ padding: '8px' }} />
        <Tooltip 
          content="Digite seu nome completo como aparece no documento de identidade"
          trigger="focus"
          placement="right"
        >
          <span style={{ cursor: 'help', fontSize: '18px' }}>❓</span>
        </Tooltip>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label>CPF:</label>
        <input type="text" placeholder="000.000.000-00" style={{ padding: '8px' }} />
        <Tooltip 
          content="Formato: XXX.XXX.XXX-XX (apenas números)"
          trigger="focus"
          placement="right"
        >
          <span style={{ cursor: 'help', fontSize: '18px' }}>ℹ️</span>
        </Tooltip>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ícones de ajuda são perfeitos para tooltips. Use `trigger="focus"` para que apareçam quando o usuário focar no campo relacionado, melhorando a acessibilidade.',
      },
    },
  },
};

export const CasoUsoFormularios = {
  name: 'Caso de Uso: Campos de Formulário',
  render: () => (
    <div style={{ padding: '100px', maxWidth: '400px', margin: '0 auto' }}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Senha:
          </label>
          <Tooltip 
            content="A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos"
            trigger="focus"
            placement="right"
          >
            <input 
              type="password" 
              placeholder="Digite sua senha"
              style={{ width: '100%', padding: '10px', fontSize: '16px' }}
            />
          </Tooltip>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email:
          </label>
          <Tooltip 
            content="Usaremos este email para enviar notificações importantes"
            trigger="focus"
            placement="right"
          >
            <input 
              type="email" 
              placeholder="seu@email.com"
              style={{ width: '100%', padding: '10px', fontSize: '16px' }}
            />
          </Tooltip>
        </div>
      </form>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Em formulários, use tooltips para fornecer instruções, exemplos ou requisitos de validação. O trigger `focus` é ideal para aparecer quando o usuário interage com o campo.',
      },
    },
  },
};

export const CasoUsoTabelas = {
  name: 'Caso de Uso: Tabelas',
  render: () => (
    <div style={{ padding: '100px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Produto</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
              Preço
              <Tooltip content="Preço unitário em reais (R$)" placement="top">
                <span style={{ marginLeft: '5px', cursor: 'help' }}>ℹ️</span>
              </Tooltip>
            </th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
              Estoque
              <Tooltip content="Quantidade disponível em estoque" placement="top">
                <span style={{ marginLeft: '5px', cursor: 'help' }}>ℹ️</span>
              </Tooltip>
            </th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Notebook</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
              R$ 2.499,00
              <Tooltip content="Preço com desconto de 15%" placement="top">
                <span style={{ marginLeft: '5px', cursor: 'help', color: 'green' }}>💰</span>
              </Tooltip>
            </td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>12 unidades</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
              <Tooltip content="Editar produto" placement="top">
                <button style={{ marginRight: '5px' }}>✏️</button>
              </Tooltip>
              <Tooltip content="Excluir produto" placement="top">
                <button>🗑️</button>
              </Tooltip>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Mouse</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>R$ 89,90</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
              0 unidades
              <Tooltip content="Produto esgotado" placement="top">
                <span style={{ marginLeft: '5px', cursor: 'help', color: 'red' }}>⚠️</span>
              </Tooltip>
            </td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
              <Tooltip content="Editar produto" placement="top">
                <button style={{ marginRight: '5px' }}>✏️</button>
              </Tooltip>
              <Tooltip content="Excluir produto" placement="top">
                <button>🗑️</button>
              </Tooltip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Em tabelas, use tooltips para fornecer informações adicionais sobre colunas, valores ou ações. Útil para explicar ícones, status ou dados complexos sem poluir a interface.',
      },
    },
  },
};

export const CasoUsoElementosDesabilitados = {
  name: 'Caso de Uso: Elementos Desabilitados',
  render: () => (
    <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      <Tooltip 
        content="Você precisa fazer login para salvar"
        placement="top"
      >
        <button disabled style={{ padding: '10px 20px', fontSize: '16px', opacity: 0.5, cursor: 'not-allowed' }}>
          Salvar (desabilitado)
        </button>
      </Tooltip>
      
      <Tooltip 
        content="Limite de upload atingido (5MB)"
        placement="top"
      >
        <button disabled style={{ padding: '10px 20px', fontSize: '16px', opacity: 0.5, cursor: 'not-allowed' }}>
          Upload (desabilitado)
        </button>
      </Tooltip>
      
      <p style={{ fontSize: '14px', color: '#666', maxWidth: '400px', textAlign: 'center' }}>
        Tooltips em elementos desabilitados explicam por que a ação não está disponível, melhorando a experiência do usuário.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use tooltips em elementos desabilitados para explicar por que estão desabilitados e o que o usuário precisa fazer para habilitá-los. Isso melhora significativamente a UX.',
      },
    },
  },
};

// ============================================
// CASO 10: ACESSIBILIDADE
// ============================================
export const Acessibilidade = {
  name: 'Acessibilidade',
  render: () => (
    <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '600px', margin: '0 auto' }}>
      <div>
        <h3 style={{ marginBottom: '15px' }}>Navegação por Teclado</h3>
        <Tooltip 
          content="Pressione ESC para fechar este tooltip"
          trigger="focus"
        >
          <button style={{ padding: '10px 20px', fontSize: '16px' }}>
            Foque aqui (Tab) e pressione ESC
          </button>
        </Tooltip>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          O tooltip suporta navegação por teclado. Use Tab para focar e ESC para fechar quando o trigger for 'focus'.
        </p>
      </div>
      
      <div>
        <h3 style={{ marginBottom: '15px' }}>Screen Readers</h3>
        <Tooltip 
          content="Este tooltip é anunciado por screen readers através do atributo aria-describedby"
          trigger="focus"
        >
          <input 
            type="text" 
            placeholder="Foque aqui para ouvir o tooltip"
            style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          />
        </Tooltip>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          O componente automaticamente adiciona `aria-describedby` ao elemento alvo, permitindo que screen readers anunciem o conteúdo do tooltip.
        </p>
      </div>
      
      <div>
        <h3 style={{ marginBottom: '15px' }}>Boas Práticas</h3>
        <ul style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.8' }}>
          <li>Use <code>trigger="focus"</code> para elementos interativos importantes</li>
          <li>Mantenha o conteúdo do tooltip conciso e útil</li>
          <li>Evite tooltips apenas decorativos - forneça informação real</li>
          <li>Teste com navegação por teclado (Tab, Enter, ESC)</li>
          <li>Use delays apropriados para evitar tooltips acidentais</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'O Tooltip foi construído com acessibilidade em mente: suporta navegação por teclado, é anunciado por screen readers através de aria-describedby, e permite controle total via teclado. Sempre use trigger="focus" para elementos interativos importantes.',
      },
    },
  },
};

// ============================================
// EXEMPLO COMPLETO
// ============================================
export const ExemploCompleto = {
  name: 'Exemplo Completo',
  render: () => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const tooltipRef = useRef(null);
    
    return (
      <div style={{ padding: '100px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '30px' }}>Formulário com Tooltips</h2>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Nome de usuário:
            </label>
            <Tooltip 
              content="Use apenas letras, números e underscore. Mínimo 3 caracteres."
              trigger="focus"
              placement="right"
              showDelay={200}
            >
              <input 
                type="text" 
                placeholder="usuario123"
                style={{ width: '100%', padding: '10px', fontSize: '16px' }}
              />
            </Tooltip>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Email:
            </label>
            <Tooltip 
              content="Seu email será usado para recuperação de senha e notificações"
              trigger="focus"
              placement="right"
              showDelay={200}
            >
              <input 
                type="email" 
                placeholder="usuario@exemplo.com"
                style={{ width: '100%', padding: '10px', fontSize: '16px' }}
              />
            </Tooltip>
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input 
                type="checkbox" 
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
              <span>Mostrar opções avançadas</span>
              <Tooltip 
                content="Ative para ver configurações adicionais de privacidade e segurança"
                trigger="hover focus"
                placement="right"
              >
                <span style={{ cursor: 'help', fontSize: '16px' }}>❓</span>
              </Tooltip>
            </label>
          </div>
          
          {showAdvanced && (
            <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Token de API:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Tooltip 
                  ref={tooltipRef}
                  content="Token gerado automaticamente. Clique no botão para gerar um novo."
                  trigger="manual"
                  placement="top"
                >
                  <input 
                    type="text" 
                    value="sk_live_..."
                    readOnly
                    style={{ flex: 1, padding: '10px', fontSize: '16px' }}
                  />
                </Tooltip>
                <button 
                  type="button"
                  onClick={() => {
                    tooltipRef.current?.show();
                    setTimeout(() => tooltipRef.current?.hide(), 3000);
                  }}
                  style={{ padding: '10px 20px' }}
                >
                  Gerar
                </button>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Tooltip 
              content="Salvar e continuar editando"
              placement="top"
            >
              <button type="submit" style={{ padding: '12px 24px', fontSize: '16px' }}>
                Salvar
              </button>
            </Tooltip>
            
            <Tooltip 
              content="Descartar todas as alterações"
              placement="top"
            >
              <button type="button" style={{ padding: '12px 24px', fontSize: '16px' }}>
                Cancelar
              </button>
            </Tooltip>
          </div>
        </form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemplo completo mostrando o uso do Tooltip em um formulário real, combinando diferentes triggers, placements e casos de uso.',
      },
    },
  },
};
