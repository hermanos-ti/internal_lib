import React, { useState } from 'react';
import styles from '../Organograma.module.css';
import { Button } from '../../Button/Button';
import { Input } from '../../Input';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

export function Toolbar({
  config = {},
  displayScale = 1,
  groupsEnabled = false,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFit,
  onCenter,
  onExpandAll,
  onCollapseAll,
  onToggleGroups,
  onSearch,
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  if (config.visible === false) return null;

  const items = config.items ?? [];
  const additionalItems = config.additionalItems ?? [];

  const renderItem = (key) => {
    switch (key) {
      case 'zoomOut':
        return (
          <Button
            key={key}
            variant="tertiary"
            size="sm"
            iconOnly
            tooltip="Diminuir zoom"
            onClick={onZoomOut}
            aria-label="Diminuir zoom"
          >
            <i className="fas fa-magnifying-glass-minus" />
          </Button>
        );
      case 'zoomLevel':
        return (
          <button
            key={key}
            type="button"
            className={styles.toolbar__zoomLevel}
            onClick={onResetZoom}
            title="Restaurar zoom para 100%"
          >
            {Math.round(displayScale * 100)}%
          </button>
        );
      case 'zoomIn':
        return (
          <Button
            key={key}
            variant="tertiary"
            size="sm"
            iconOnly
            tooltip="Aumentar zoom"
            onClick={onZoomIn}
            aria-label="Aumentar zoom"
          >
            <i className="fas fa-magnifying-glass-plus" />
          </Button>
        );
      case 'fit':
        return (
          <Button key={key} variant="tertiary" size="sm" iconOnly tooltip="Ajustar à tela" onClick={onFit}>
            <i className="fas fa-expand" />
          </Button>
        );
      case 'center':
        return (
          <Button
            key={key}
            variant="tertiary"
            size="sm"
            iconOnly
            tooltip="Centralizar"
            onClick={onCenter}
          >
            <i className="fas fa-crosshairs" />
          </Button>
        );
      case 'expandAll':
        return (
          <Button
            key={key}
            variant="tertiary"
            size="sm"
            iconOnly
            tooltip="Expandir tudo"
            onClick={onExpandAll}
          >
            <i className="fas fa-diagram-project" />
          </Button>
        );
      case 'collapseAll':
        return (
          <Button
            key={key}
            variant="tertiary"
            size="sm"
            iconOnly
            tooltip="Recolher tudo"
            onClick={onCollapseAll}
          >
            <i className="fas fa-compress" />
          </Button>
        );
      case 'groups':
        return (
          <Button
            key={key}
            variant={groupsEnabled ? 'secondary' : 'tertiary'}
            size="sm"
            iconOnly
            tooltip={groupsEnabled ? 'Ocultar grupos' : 'Agrupar por setor'}
            onClick={onToggleGroups}
            aria-pressed={groupsEnabled}
          >
            <i className="fas fa-object-group" />
          </Button>
        );
      case 'search':
        return (
          <div key={key} className={styles.toolbar__searchWrap}>
            {searchOpen ? (
              <SearchInput
                onSearch={(query) => {
                  onSearch?.(query);
                }}
                onClose={() => setSearchOpen(false)}
              />
            ) : (
              <Button
                variant="tertiary"
                size="sm"
                iconOnly
                tooltip="Buscar colaborador"
                onClick={() => setSearchOpen(true)}
              >
                <i className="fas fa-magnifying-glass" />
              </Button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        styles.toolbar,
        styles[`toolbar_${config.position ?? 'bottom'}`],
        styles[`toolbar_align_${config.align ?? 'center'}`]
      )}
      role="toolbar"
      aria-label="Controles do organograma"
    >
      <div className={styles.toolbar__inner}>
        {items.map(renderItem)}
        {additionalItems.map((item) => (
          <Button
            key={item.key}
            variant="tertiary"
            size="sm"
            iconOnly={!item.label}
            tooltip={item.tooltip}
            onClick={item.onClick}
          >
            {item.icon ? <i className={item.icon} /> : item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SearchInput({ onSearch, onClose }) {
  const [value, setValue] = useState('');

  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);
    onSearch(next);
  };

  return (
    <div className={styles.toolbar__search}>
      <Input
        type="text"
        size="sm"
        placeholder="Buscar..."
        value={value}
        onChange={handleChange}
        autoFocus
      />
      <Button variant="tertiary" size="sm" iconOnly onClick={onClose} tooltip="Fechar busca">
        <i className="far fa-xmark" />
      </Button>
    </div>
  );
}
