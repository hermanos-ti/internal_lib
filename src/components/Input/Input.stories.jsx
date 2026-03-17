import { useState, useCallback } from 'react';
import { Input, useInput, maskUtils } from './index';
import { validate } from '../../functions/Formatter';
import '../../assets/icons/css/all.css';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', background: '#ffffff' },
  { value: 'dark', label: 'Escuro', background: '#0f172a' },
  { value: 'tokyoNight', label: 'Tokyo Night', background: '#1a1b26' },
];

function StoryWithThemeSelect({ children }) {
  const [theme, setTheme] = useState('light');
  const current = THEME_OPTIONS.find((t) => t.value === theme) || THEME_OPTIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <label htmlFor="story-theme-select" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          Fundo / Tema:
        </label>
        <select
          id="story-theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            cursor: 'pointer',
            minWidth: '140px',
          }}
        >
          {THEME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div
        data-theme={theme}
        style={{
          padding: '1rem',
          background: current.background,
          borderRadius: '8px',
          flex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function DataBlock({ data, title = 'Valores atuais' }) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--surface-toolbar, #f8fafc)',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
        color: 'var(--text-muted, #475569)',
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
      }}
    >
      <strong>{title}:</strong>
      <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Campo de entrada para formulários. Suporta múltiplos tipos: text, number, date, password, select, textarea, switch, checkbox, radio, file, slider, color. Use o hook useInput para gerenciar estado e máscaras. Suporta ícones dentro do input, botões laterais e tipo password com toggle de visibilidade.',
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryWithThemeSelect>
        <Story />
      </StoryWithThemeSelect>
    ),
  ],
};

function DefaultStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input {...props} label="Nome" id="nome" placeholder="Digite seu nome" />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Default = {
  render: () => <DefaultStory />,
};

function WithIconStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Email"
        id="email"
        type="text"
        placeholder="email@exemplo.com"
        icon={<i className="fas fa-envelope" />}
        iconPosition="left"
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const WithIcon = {
  render: () => <WithIconStory />,
};

function PasswordStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Senha"
        id="password"
        type="password"
        placeholder="Digite sua senha"
        icon={<i className="fas fa-lock" />}
        iconPosition="left"
      />
      <DataBlock data={{ value: props.value ? '••••••••' : '' }} />
    </div>
  );
}

export const Password = {
  render: () => <PasswordStory />,
};

function WithButtonsStory() {
  const [props, setValue] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Buscar"
        id="search"
        placeholder="Digite para buscar..."
        icon={<i className="fas fa-search" />}
        iconPosition="left"
        buttonsLeft={[
          {
            label: 'Limpar',
            icon: <i className="fas fa-times" />,
            action: () => setValue(''),
          },
        ]}
        buttonsRight={[
          {
            label: 'Buscar',
            icon: <i className="fas fa-arrow-right" />,
            action: () => alert(`Buscando: ${props.value}`),
          },
        ]}
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const WithButtons = {
  render: () => <WithButtonsStory />,
};

function WithMaskStory() {
  const [props] = useInput('', maskUtils.maskCPF);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="CPF"
        id="cpf"
        type="text"
        placeholder="000.000.000-00"
        icon={<i className="fas fa-id-card" />}
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const WithMask = {
  render: () => <WithMaskStory />,
};

function NumberStory() {
  const [props] = useInput(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Quantidade"
        id="qty"
        type="number"
        min={0}
        max={100}
        step={1}
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Number = {
  render: () => <NumberStory />,
};

function DateStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input {...props} label="Data" id="date" type="date" placeholder="Selecione a data" />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const DateDefault = {
  render: () => <DateStory />,
};

function DateWithFormatStory() {
  const [props1] = useInput('');
  const [props2] = useInput('');
  const [props3] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <Input {...props1} label="Data (dd/mm/yyyy)" type="data" />
      <Input {...props2} label="Data extenso (dd/mes/yyyy)" type="data-extenso" />
      <Input {...props3} label="Mês/Ano (mm/yyyy)" type="mes-ano" />
      <DataBlock data={{ data: props1.value, extenso: props2.value, mesAno: props3.value }} />
    </div>
  );
}

export const DateWithFormat = {
  render: () => <DateWithFormatStory />,
};

function DateRangeStory() {
  const [props] = useInput([]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input {...props} label="Período" id="date-range" type="date" range placeholder="Selecione o período" />
      <DataBlock data={{ value: props.value }} title="Range [início, fim]" />
    </div>
  );
}

export const DateRange = {
  render: () => <DateRangeStory />,
};

function DateWithMinMaxStory() {
  const [props] = useInput('');
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Data (limite início/fim)"
        id="date-limits"
        type="date"
        min={minDate}
        max={maxDate}
        placeholder="Apenas este mês e próximo"
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const DateWithMinMax = {
  render: () => <DateWithMinMaxStory />,
};

function DateAllFormatsStory() {
  const formats = [
    { type: 'data', label: 'data (dd/mm/yyyy)' },
    { type: 'data-extenso-curto', label: 'data-extenso-curto (dd/mm/yy)' },
    { type: 'data-extenso', label: 'data-extenso (dd/mes/yyyy)' },
    { type: 'dia-mes', label: 'dia-mes (dd/mm)' },
    { type: 'mes-ano', label: 'mes-ano (mm/yyyy)' },
    { type: 'data-hora', label: 'data-hora (dd/mm/yyyy hh:mm)' },
    { type: 'hora', label: 'hora (hh:mm)' },
  ];
  const [dataProps] = useInput('');
  const [dataCurtoProps] = useInput('');
  const [dataExtensoProps] = useInput('');
  const [diaMesProps] = useInput('');
  const [mesAnoProps] = useInput('');
  const [dataHoraProps] = useInput('');
  const [horaProps] = useInput('09:00');
  const states = {
    data: dataProps,
    'data-extenso-curto': dataCurtoProps,
    'data-extenso': dataExtensoProps,
    'dia-mes': diaMesProps,
    'mes-ano': mesAnoProps,
    'data-hora': dataHoraProps,
    hora: horaProps,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <strong style={{ fontSize: 14, color: 'var(--text-muted)' }}>Formatos de data</strong>
      {formats.map(({ type, label }) => (
        <Input
          key={type}
          {...states[type]}
          label={label}
          type={type}
          placeholder={`Formato: ${type}`}
        />
      ))}
      <DataBlock data={Object.fromEntries(formats.map(({ type }) => [type, states[type].value]))} />
    </div>
  );
}

export const DateAllFormats = {
  render: () => <DateAllFormatsStory />,
};

function SelectStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="País"
        id="country"
        type="select"
        options={[
          { value: 'br', label: 'Brasil' },
          { value: 'us', label: 'Estados Unidos' },
          { value: 'pt', label: 'Portugal' },
        ]}
        placeholder="Selecione..."
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Select = {
  render: () => <SelectStory />,
};

function SelectMultipleStory() {
  const [props] = useInput([]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Países"
        id="countries"
        type="select"
        multiple
        options={[
          { value: 'br', label: 'Brasil' },
          { value: 'us', label: 'Estados Unidos' },
          { value: 'pt', label: 'Portugal' },
          { value: 'ar', label: 'Argentina' },
          { value: 'mx', label: 'México' },
          { value: 'ch', label: 'Chile' },
          { value: 'co', label: 'Colômbia' },
          { value: 'pe', label: 'Peru' },
          { value: 'es', label: 'Espanha' },
          { value: 'fr', label: 'França' },
          { value: 'it', label: 'Itália' },
          { value: 'de', label: 'Alemanha' },
          { value: 'jp', label: 'Japão' },
          { value: 'cn', label: 'China' },
          { value: 'in', label: 'Índia' },
          { value: 'au', label: 'Austrália' },
          { value: 'ca', label: 'Canadá' },
          { value: 'gb', label: 'Reino Unido' },
          { value: 'ru', label: 'Rússia' },
          { value: 'kr', label: 'Coreia do Sul' },
          { value: 'nz', label: 'Nova Zelândia' },
          { value: 'sg', label: 'Singapura' },
          { value: 'hk', label: 'Hong Kong' },
          { value: 'tw', label: 'Taiwan' },
          { value: 'my', label: 'Malásia' },
          { value: 'id', label: 'Indonésia' },
          { value: 'ph', label: 'Filipinas' },
          { value: 'th', label: 'Tailândia' },
          { value: 'vi', label: 'Vietname' },
        ]}
        placeholder="Selecione os países..."
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const SelectMultiple = {
  render: () => <SelectMultipleStory />,
};

function SelectManyOptionsStory() {
  const countries = [
    'Brasil', 'Estados Unidos', 'Portugal', 'Argentina', 'México', 'Chile',
    'Colômbia', 'Peru', 'Espanha', 'França', 'Itália', 'Alemanha', 'Japão',
    'China', 'Índia', 'Austrália', 'Canadá', 'Reino Unido', 'Rússia', 'Coreia do Sul',
  ];
  const options = countries.map((c, i) => ({ value: `c${i}`, label: c }));
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="País (muitas opções)"
        id="country-many"
        type="select"
        options={options}
        placeholder="Digite para filtrar..."
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const SelectManyOptions = {
  render: () => <SelectManyOptionsStory />,
};

function TextareaStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Descrição"
        id="desc"
        type="textarea"
        placeholder="Digite a descrição..."
        rows={4}
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Textarea = {
  render: () => <TextareaStory />,
};

function TextareaNoResizeStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Sem redimensionar (resize=false)"
        id="desc-noresize"
        type="textarea"
        placeholder="Digite..."
        rows={3}
        resize={false}
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const TextareaNoResize = {
  render: () => <TextareaNoResizeStory />,
};

function TextareaAutoExpandStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Auto-expand (autoExpand=true)"
        id="desc-auto"
        type="textarea"
        placeholder="Digite e veja expandir..."
        rows={2}
        autoExpand
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const TextareaAutoExpand = {
  render: () => <TextareaAutoExpandStory />,
};

function SwitchStory() {
  const [props] = useInput(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input {...props} label="Ativar notificações" id="switch" type="switch" />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Switch = {
  render: () => <SwitchStory />,
};

function CheckboxStory() {
  const [props] = useInput(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input {...props} label="Aceito os termos" id="terms" type="checkbox" />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Checkbox = {
  render: () => <CheckboxStory />,
};

function RadioGroupStory() {
  const [props] = useInput('a');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Opção"
        id="radio"
        type="radio"
        options={[
          { value: 'a', label: 'Opção A' },
          { value: 'b', label: 'Opção B' },
          { value: 'c', label: 'Opção C' },
        ]}
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const RadioGroup = {
  render: () => <RadioGroupStory />,
};

function RadioGroupVerticalStory() {
  const [props] = useInput('a');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Opção (vertical)"
        id="radio-vert"
        type="radio"
        radioDirection="vertical"
        options={[
          { value: 'a', label: 'Opção A' },
          { value: 'b', label: 'Opção B' },
          { value: 'c', label: 'Opção C' },
        ]}
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const RadioGroupVertical = {
  render: () => <RadioGroupVerticalStory />,
};

function FileStory() {
  const [props] = useInput(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Arquivo"
        id="file"
        type="file"
        accept=".pdf,.doc"
      />
      <DataBlock data={{ value: props.value?.name ?? null }} />
    </div>
  );
}

export const File = {
  render: () => <FileStory />,
};

function SliderStory() {
  const [props] = useInput(50);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Volume"
        id="volume"
        type="slider"
        min={0}
        max={100}
        step={1}
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Slider = {
  render: () => <SliderStory />,
};

function ColorStory() {
  const [props] = useInput('#6366f1');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input {...props} label="Cor" id="color" type="color" />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Color = {
  render: () => <ColorStory />,
};

function WithHintStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Username"
        id="user"
        placeholder="usuario"
        hint="Use apenas letras minúsculas e números."
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const WithHint = {
  render: () => <WithHintStory />,
};

function WithErrorStory() {
  const [props] = useInput('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Email"
        id="emailErr"
        placeholder="email@exemplo.com"
        error="Email inválido. Verifique o formato."
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const WithError = {
  render: () => <WithErrorStory />,
};

function DisabledStory() {
  const [props] = useInput('Valor desabilitado');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <Input
        {...props}
        label="Campo desabilitado"
        id="disabled"
        disabled
      />
      <DataBlock data={{ value: props.value }} />
    </div>
  );
}

export const Disabled = {
  render: () => <DisabledStory />,
};

function StatusStory() {
  const [props1] = useInput('Valor válido');
  const [props2] = useInput('Atenção necessária');
  const [props3] = useInput('Erro no campo');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <Input {...props1} label="Success" id="status-success" status="success" />
      <Input {...props2} label="Warning" id="status-warning" status="warning" />
      <Input {...props3} label="Error" id="status-error" status="error" />
      <DataBlock
        data={{
          success: props1.value,
          warning: props2.value,
          error: props3.value,
        }}
      />
    </div>
  );
}

export const Status = {
  render: () => <StatusStory />,
};

/**
 * Story focada em manipulação de dados: inserir valores, validar, usar setValue programaticamente.
 * Demonstra a facilidade de controle dos inputs com useInput e integração com o validador.
 */
function DataManipulationStory() {
  const [nomeProps, setNome] = useInput('');
  const [emailProps, setEmail] = useInput('');
  const [cpfProps, setCpf] = useInput('', maskUtils.maskCPF);
  const [errors, setErrors] = useState({});
  const [lastAction, setLastAction] = useState('');

  const runValidation = useCallback(() => {
    const [nomeErrs, emailErrs, cpfErrs] = validate([
      [nomeProps.value, { required: true, minLength: 3 }],
      [emailProps.value, { required: true, type: 'email' }],
      [cpfProps.value.replace(/\D/g, ''), { type: 'cpf' }],
    ]);

    const newErrors = {};
    if (nomeErrs.length) newErrors.nome = nomeErrs.map((e) => e.message).join('. ');
    if (emailErrs.length) newErrors.email = emailErrs.map((e) => e.message).join('. ');
    if (cpfErrs.length) newErrors.cpf = cpfErrs.map((e) => e.message).join('. ');

    setErrors(newErrors);
    setLastAction(`Validação executada. Erros: ${Object.keys(newErrors).length}`);
  }, [nomeProps.value, emailProps.value, cpfProps.value]);

  const handleInsertSample = () => {
    setNome('Maria Silva');
    setEmail('maria@exemplo.com');
    setCpf('12345678909');
    setErrors({});
    setLastAction('Valores de exemplo inseridos programaticamente');
  };

  const handleClear = () => {
    setNome('');
    setEmail('');
    setCpf('');
    setErrors({});
    setLastAction('Todos os campos limpos');
  };

  const handleValidate = () => {
    runValidation();
  };

  return (
    <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
        Use os botões para manipular os valores e validar. O setValue permite controle total.
      </p>

      <Input
        {...nomeProps}
        label="Nome"
        id="nome-dm"
        placeholder="Digite o nome"
        error={errors.nome}
        hint="Mínimo 3 caracteres"
      />

      <Input
        {...emailProps}
        label="Email"
        id="email-dm"
        type="text"
        placeholder="email@exemplo.com"
        error={errors.email}
      />

      <Input
        {...cpfProps}
        label="CPF"
        id="cpf-dm"
        placeholder="000.000.000-00"
        icon={<i className="fas fa-id-card" />}
        error={errors.cpf}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleInsertSample}
          style={{
            padding: '8px 12px',
            fontSize: 13,
            background: '#e0e7ff',
            color: '#4f46e5',
            border: '1px solid #c7d2fe',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Inserir exemplo
        </button>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '8px 12px',
            fontSize: 13,
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Limpar tudo
        </button>
        <button
          type="button"
          onClick={handleValidate}
          style={{
            padding: '8px 12px',
            fontSize: 13,
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Validar
        </button>
      </div>

      <div
        style={{
          padding: 12,
          background: '#f8fafc',
          borderRadius: 6,
          fontSize: 12,
          fontFamily: 'monospace',
          color: '#475569',
        }}
      >
        <strong>Valores atuais:</strong>
        <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(
            {
              nome: nomeProps.value,
              email: emailProps.value,
              cpf: cpfProps.value,
            },
            null,
            2
          )}
        </pre>
        {lastAction && (
          <p style={{ margin: '8px 0 0', color: '#64748b' }}>{lastAction}</p>
        )}
      </div>
    </div>
  );
}

export const DataManipulation = {
  render: () => <DataManipulationStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstra inserção, validação e manipulação programática de valores. Use setValue para inserir/limpar valores e validate() para validação.',
      },
    },
  },
};
