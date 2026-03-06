import { useRef, useState } from 'react';
import { IconPicker } from './index';
import '../../assets/icons/css/all.css';

function DataBlock({ data, title = 'Valor selecionado' }) {
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
        {data ? JSON.stringify(data, null, 2) : '(nenhum)'}
      </pre>
    </div>
  );
}

export default {
  title: 'Components/IconPicker',
  component: IconPicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Modal de seleção de ícones (grid paginado). Controlado por open/onClose; posiciona-se pela ref do elemento âncora. Exibe ícones Font Awesome (fa-light), com filtro e paginação. Retorna o ícone via onChange.',
      },
    },
  },
};

function DefaultStory() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-primary, #0f172a)',
          background: 'var(--surface-toolbar, #fff)',
          border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        {value ? <i className={value} style={{ fontSize: 18 }} aria-hidden /> : null}
        <span>{value ? 'Alterar ícone' : 'Selecionar ícone'}</span>
      </button>
      <IconPicker
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        value={value}
        onChange={(c) => { setValue(c); setOpen(false); }}
      />
      <DataBlock data={value} />
    </div>
  );
}

export const Default = {
  render: () => <DefaultStory />,
};

function WithValueStory() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('fa-light fa-star');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-primary, #0f172a)',
          background: 'var(--surface-toolbar, #fff)',
          border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        <i className={value} style={{ fontSize: 18 }} aria-hidden />
        <span>Alterar ícone</span>
      </button>
      <IconPicker
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        value={value}
        onChange={(c) => { setValue(c); setOpen(false); }}
      />
      <DataBlock data={value} />
    </div>
  );
}

export const WithValue = {
  render: () => <WithValueStory />,
};

function MultiplePickersStory() {
  const anchorRef1 = useRef(null);
  const anchorRef2 = useRef(null);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [icon1, setIcon1] = useState('fa-light fa-user');
  const [icon2, setIcon2] = useState('fa-light fa-cog');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Ícone do perfil</label>
        <button
          ref={anchorRef1}
          type="button"
          onClick={() => setOpen1(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary, #0f172a)',
            background: 'var(--surface-toolbar, #fff)',
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <i className={icon1} style={{ fontSize: 18 }} aria-hidden />
          <span>Escolher ícone perfil</span>
        </button>
        <IconPicker
          open={open1}
          onClose={() => setOpen1(false)}
          anchorRef={anchorRef1}
          value={icon1}
          onChange={(c) => { setIcon1(c); setOpen1(false); }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Ícone de configurações</label>
        <button
          ref={anchorRef2}
          type="button"
          onClick={() => setOpen2(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary, #0f172a)',
            background: 'var(--surface-toolbar, #fff)',
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <i className={icon2} style={{ fontSize: 18 }} aria-hidden />
          <span>Escolher ícone configurações</span>
        </button>
        <IconPicker
          open={open2}
          onClose={() => setOpen2(false)}
          anchorRef={anchorRef2}
          value={icon2}
          onChange={(c) => { setIcon2(c); setOpen2(false); }}
        />
      </div>
      <DataBlock data={{ perfil: icon1, configuracoes: icon2 }} title="Valores" />
    </div>
  );
}

export const MultiplePickers = {
  render: () => <MultiplePickersStory />,
  parameters: {
    docs: {
      description: {
        story: 'Dois botões que abrem o IconPicker independentemente.',
      },
    },
  },
};
