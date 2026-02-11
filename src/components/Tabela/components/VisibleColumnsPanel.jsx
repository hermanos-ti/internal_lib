import { memo, useState, useEffect } from 'react';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS } from '../constants';

export const VisibleColumnsPanel = memo(({
  headerColumns,
  footerItems,
  columnVisibility,
  footerVisibility,
  onApply
}) => {
  const [localColumnVisibility, setLocalColumnVisibility] = useState({});
  const [localFooterVisibility, setLocalFooterVisibility] = useState({});

  useEffect(() => {
    setLocalColumnVisibility({ ...columnVisibility });
    setLocalFooterVisibility({ ...footerVisibility });
  }, [columnVisibility, footerVisibility]);

  const handleColumnToggle = (key) => {
    const next = {
      ...localColumnVisibility,
      [key]: localColumnVisibility[key] === false
    };
    setLocalColumnVisibility(next);
    onApply(next, localFooterVisibility);
  };

  const handleFooterToggle = (key) => {
    const next = {
      ...localFooterVisibility,
      [key]: localFooterVisibility[key] === false
    };
    setLocalFooterVisibility(next);
    onApply(localColumnVisibility, next);
  };

  const allHeaderVisible = headerColumns.length > 0 && headerColumns.every(col => localColumnVisibility[col.key] !== false);
  const allFooterVisible = footerItems.length > 0 && footerItems.every(item => localFooterVisibility[item.key] !== false);

  const handleHeaderToggleAll = () => {
    const next = { ...localColumnVisibility };
    const value = !allHeaderVisible;
    headerColumns.forEach(col => { next[col.key] = value; });
    setLocalColumnVisibility(next);
    onApply(next, localFooterVisibility);
  };

  const handleFooterToggleAll = () => {
    const next = { ...localFooterVisibility };
    const value = !allFooterVisible;
    footerItems.forEach(item => { next[item.key] = value; });
    setLocalFooterVisibility(next);
    onApply(localColumnVisibility, next);
  };

  const getColumnIcon = (column) => COLUMN_ICONS[column?.type ?? 'text'];

  return (
    <div className={styles.visibleColumnsModal__body}>
      {headerColumns.length > 0 && (
        <div className={styles.visibleColumnsModal__section}>
          <div className={styles.visibleColumnsModal__sectionHeader}>
            <span className={styles.visibleColumnsModal__sectionLabel}>Cabeçalho</span>
            <button
              type="button"
              className={styles.visibleColumnsModal__sectionToggle}
              onClick={handleHeaderToggleAll}
            >
              {allHeaderVisible ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
          </div>
          <div className={styles.visibleColumnsModal__list}>
            {headerColumns.map((column) => (
              <label key={column.key} className={styles.visibleColumnsModal__item}>
                <input
                  type="checkbox"
                  checked={localColumnVisibility[column.key] !== false}
                  onChange={() => handleColumnToggle(column.key)}
                />
                <span className={styles.visibleColumnsModal__checkboxWrap}>
                  <i className={`far fa-check ${styles.visibleColumnsModal__checkboxWrap__check}`} />
                </span>
                <i className={`${getColumnIcon(column)} ${styles.visibleColumnsModal__itemIcon}`} />
                <span className={styles.visibleColumnsModal__itemLabel}>{column.label ?? column.key}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {footerItems.length > 0 && (
        <div className={styles.visibleColumnsModal__section}>
          <div className={styles.visibleColumnsModal__sectionHeader}>
            <span className={styles.visibleColumnsModal__sectionLabel}>Rodapé</span>
            <button
              type="button"
              className={styles.visibleColumnsModal__sectionToggle}
              onClick={handleFooterToggleAll}
            >
              {allFooterVisible ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
          </div>
          <div className={styles.visibleColumnsModal__list}>
            {footerItems.map((item) => (
              <label key={item.key} className={styles.visibleColumnsModal__item}>
                <input
                  type="checkbox"
                  checked={localFooterVisibility[item.key] !== false}
                  onChange={() => handleFooterToggle(item.key)}
                />
                <span className={styles.visibleColumnsModal__checkboxWrap}>
                  <i className={`far fa-check ${styles.visibleColumnsModal__checkboxWrap__check}`} />
                </span>
                <i className={`far fa-hashtag ${styles.visibleColumnsModal__itemIcon}`} />
                <span className={styles.visibleColumnsModal__itemLabel}>{item.label ?? item.key}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {headerColumns.length === 0 && footerItems.length === 0 && (
        <div className={styles.visibleColumnsModal__empty}>
          Nenhuma coluna ou item de rodapé disponível.
        </div>
      )}
    </div>
  );
});

VisibleColumnsPanel.displayName = 'VisibleColumnsPanel';
