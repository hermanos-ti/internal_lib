import { useMemo, useRef, useState, useEffect } from 'react';
import styles from '../Tabela.module.css';
import { formatDisplayValue } from '../formatUtils';
import { groupFieldsByRole } from '../viewSettingsUtils';

const DENSE_COLLAPSE_WIDTH = 120;

/**
 * Shared item layout for List / Board (simple) / Timeline bars.
 */
export function ItemCard({
  item,
  fields = [],
  columnsByKey = {},
  compact = false,
  denseCollapse = false,
  className = '',
  onClick,
  onDoubleClick,
  onContextMenu,
  draggable = false,
  onDragStart,
  onDragEnd,
  ...rest
}) {
  const rootRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  const roles = useMemo(() => groupFieldsByRole(fields), [fields]);

  const getColumn = (key) => columnsByKey[key] || { key, format: 'text' };

  const getPlainText = (field) => {
    if (!field?.key) return '';
    const column = getColumn(field.key);
    const raw = item[field.key];
    if (raw == null || raw === '') return '';
    if (typeof column.render === 'function') {
      // Prefer raw string for tooltip when custom render is present
      return String(raw);
    }
    return formatDisplayValue(raw, column.format || 'text', { emptyDisplay: '' });
  };

  const tooltipTitle = useMemo(() => {
    const parts = [];
    if (roles.id) {
      const t = getPlainText(roles.id);
      if (t) parts.push(t);
    }
    if (roles.principal) {
      const t = getPlainText(roles.principal);
      if (t) parts.push(t);
    }
    roles.adicionais.forEach((f) => {
      const t = getPlainText(f);
      if (t) parts.push(t);
    });
    return parts.join(' · ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, roles, columnsByKey]);

  useEffect(() => {
    if (!denseCollapse) {
      setCollapsed(false);
      return undefined;
    }
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? el.clientWidth;
      setCollapsed(width < DENSE_COLLAPSE_WIDTH);
    });
    ro.observe(el);
    setCollapsed(el.clientWidth < DENSE_COLLAPSE_WIDTH);
    return () => ro.disconnect();
  }, [denseCollapse]);

  const renderFieldValue = (field, opts = {}) => {
    if (!field?.key) return null;
    const column = getColumn(field.key);
    const raw = item[field.key];

    if (opts.asIcon) {
      if (!raw) return null;
      const iconClass = String(raw).includes('fa-') ? String(raw) : `fas fa-${raw}`;
      return <i className={`${iconClass} ${styles.itemCard__icon}`} aria-hidden />;
    }

    if (typeof column.render === 'function') {
      return column.render(raw, item, column, opts.rowIndex ?? 0, 0);
    }

    return formatDisplayValue(raw, column.format || 'text', { emptyDisplay: '' });
  };

  const handleClick = (e) => {
    onClick?.(e, item);
  };

  const handleDoubleClick = (e) => {
    onDoubleClick?.(e, item);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    onContextMenu?.(e, item);
  };

  const showExtras = !collapsed && roles.adicionais.length > 0;
  const adicionais = showExtras
    ? roles.adicionais
      .map((field) => {
        const content = renderFieldValue(field);
        if (content == null || content === '') return null;
        return (
          <span key={field.key} className={styles.itemCard__tag}>
            {content}
          </span>
        );
      })
      .filter(Boolean)
    : [];

  return (
    <div
      ref={rootRef}
      className={[
        styles.itemCard,
        compact ? styles.itemCard__compact : '',
        collapsed ? styles.itemCard__collapsed : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      role="button"
      tabIndex={0}
      title={tooltipTitle || undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
      {...rest}
    >
      <div className={styles.itemCard__main}>
        {roles.icone && renderFieldValue(roles.icone, { asIcon: true })}
        {roles.id && (
          <span className={styles.itemCard__id}>
            {renderFieldValue(roles.id)}
          </span>
        )}
        {!collapsed && roles.principal && (
          <span className={styles.itemCard__principal}>
            {renderFieldValue(roles.principal)}
          </span>
        )}
        {!collapsed && !roles.principal && !roles.id && !roles.icone && (
          <span className={styles.itemCard__principal}>—</span>
        )}
      </div>
      {adicionais.length > 0 && (
        <div className={styles.itemCard__extras}>
          {adicionais}
        </div>
      )}
    </div>
  );
}
