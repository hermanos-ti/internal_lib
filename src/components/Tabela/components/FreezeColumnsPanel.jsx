import { memo, useMemo } from 'react';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS } from '../constants';
import { columnHasExplicitWidth, getFreezeBlockReason } from '../freezeUtils';

export const FreezeColumnsPanel = memo(({
  leafColumns = [],
  frozenColumnKeys = [],
  onApply,
  isMobile = false,
  widthByKey = {},
  containerWidth = 0,
  selectionWidth = 0,
  columnMinWidth,
  embedded = false,
}) => {
  const frozenSet = useMemo(() => new Set(frozenColumnKeys), [frozenColumnKeys]);

  const handleToggle = (column) => {
    if (isMobile) return;
    const reason = getFreezeBlockReason(column, {
      isMobile,
      leafColumns,
      frozenKeys: frozenColumnKeys,
      widthByKey,
      containerWidth,
      selectionWidth,
      columnMinWidth,
    });
    // Allow unfreeze even when other reasons would block freeze
    const isFrozen = frozenSet.has(column.key);
    if (!isFrozen && reason) return;
    onApply?.(column.key);
  };

  const handleClearAll = () => {
    if (frozenColumnKeys.length === 0) return;
    onApply?.(null, []);
  };

  const content = (
    <>
      {isMobile && (
        <div className={styles.visibleColumnsModal__empty}>
          Congelar colunas não está disponível em telas pequenas.
        </div>
      )}

      {!isMobile && leafColumns.length > 0 && (
        <div className={styles.visibleColumnsModal__section}>
          <div className={styles.visibleColumnsModal__sectionHeader}>
            <span className={styles.visibleColumnsModal__sectionLabel}>Colunas</span>
            <button
              type="button"
              className={styles.visibleColumnsModal__sectionToggle}
              onClick={handleClearAll}
              disabled={frozenColumnKeys.length === 0}
              title="Descongelar todas as colunas"
            >
              Descongelar todas
            </button>
          </div>
          <div className={styles.visibleColumnsModal__list}>
            {leafColumns.map((column) => {
              const isFrozen = frozenSet.has(column.key);
              const blockReason = getFreezeBlockReason(column, {
                isMobile,
                leafColumns,
                frozenKeys: frozenColumnKeys,
                widthByKey,
                containerWidth,
                selectionWidth,
                columnMinWidth,
              });
              const disabled = !isFrozen && !!blockReason;
              const icon = COLUMN_ICONS[column?.type ?? 'text'];
              const title = disabled
                ? blockReason
                : !columnHasExplicitWidth(column)
                  ? 'Requer width ou minWidth definido'
                  : isFrozen
                    ? 'Descongelar coluna'
                    : 'Congelar coluna (pin à esquerda)';

              return (
                <label
                  key={column.key}
                  className={`${styles.visibleColumnsModal__item} ${disabled ? styles.visibleColumnsModal__itemDisabled : ''}`}
                  title={title}
                >
                  <input
                    type="checkbox"
                    checked={isFrozen}
                    disabled={disabled}
                    onChange={() => handleToggle(column)}
                  />
                  <span className={styles.visibleColumnsModal__checkboxWrap}>
                    <i className={`far ${isFrozen ? 'fa-square-check' : 'fa-square'}`} />
                  </span>
                  <i className={`${icon} ${styles.visibleColumnsModal__itemIcon}`} />
                  <span className={styles.visibleColumnsModal__itemLabel}>
                    {column.label ?? column.key}
                  </span>
                  {isFrozen && (
                    <i className={`fas fa-thumbtack ${styles.freezeColumnsPanel__pinIcon}`} aria-hidden />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {!isMobile && leafColumns.length === 0 && (
        <div className={styles.visibleColumnsModal__empty}>
          Nenhuma coluna disponível para congelar.
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className={styles.visibleColumnsModal__body}>
      {content}
    </div>
  );
});

FreezeColumnsPanel.displayName = 'FreezeColumnsPanel';
