import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '../Tabela.module.css';
import { formatDisplayValue } from '../formatUtils';

/**
 * Detail panel opened via right-click on list/board/calendar/timeline items.
 */
export function ItemDetailPanel({
  open,
  item,
  columns = [],
  title,
  onClose,
  portalContainer,
  theme,
}) {
  const panelRef = useRef(null);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    const onMouseDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [open, handleClose]);

  if (!open || !item) return null;

  const leafColumns = columns.filter((c) => !c.hasSubColumns && c.visible !== false);

  const titleCandidates = ['nome', 'name', 'titulo', 'title', 'codigo', 'id'];
  const titleKey = titleCandidates.find((k) => item[k] != null && item[k] !== '');
  const panelTitle = title || (titleKey ? String(item[titleKey]) : 'Detalhes');

  const content = (
    <div className={styles.itemDetailOverlay} data-theme={theme || undefined}>
      <div
        ref={panelRef}
        className={styles.itemDetailPanel}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do item"
      >
        <div className={styles.itemDetailPanel__header}>
          <span className={styles.itemDetailPanel__title}>{panelTitle}</span>
          <button
            type="button"
            className={styles.itemDetailPanel__close}
            onClick={handleClose}
            title="Fechar"
            aria-label="Fechar"
          >
            <i className="far fa-xmark" />
          </button>
        </div>
        <div className={styles.itemDetailPanel__body}>
          {leafColumns.length === 0 && (
            <div className={styles.itemDetailPanel__empty}>Nenhuma coluna disponível.</div>
          )}
          {leafColumns.map((column) => {
            const raw = item[column.key];
            let display;
            if (typeof column.render === 'function') {
              display = column.render(raw, item, column, 0, 0);
            } else {
              display = formatDisplayValue(raw, column.format || 'text');
            }
            return (
              <div key={column.key} className={styles.itemDetailPanel__row}>
                <span className={styles.itemDetailPanel__label}>{column.label ?? column.key}</span>
                <span className={styles.itemDetailPanel__value}>{display}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const target = portalContainer || document.body;
  return createPortal(content, target);
}
