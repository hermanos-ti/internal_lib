import { useMemo, useState, useCallback } from 'react';
import styles from '../../Tabela.module.css';
import { ItemCard } from '../ItemCard';
import { Loader } from '../../../Loader/Loader';

const EMPTY_COLUMN = 'Sem valor';

export function BoardView({
  sortedData = [],
  headerStructure,
  columnVisibility = {},
  boardConfig,
  listConfig,
  isLoading,
  isSorting,
  getRowKey,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  onBoardMove,
  editable = false,
  editedData,
}) {
  const columnKey = boardConfig?.columnKey;
  const cardMode = boardConfig?.cardMode || 'simple';
  const cardRender = boardConfig?.cardRender;
  const fixedColumns = Array.isArray(boardConfig?.columns) ? boardConfig.columns : [];
  const draggableFlag = boardConfig?.draggable !== false;
  const canDrag = draggableFlag && (editable || typeof onBoardMove === 'function' || typeof boardConfig?.onBoardMove === 'function');

  const leafColumns = headerStructure?.leafColumns || [];
  const columnsByKey = useMemo(() => {
    const map = {};
    leafColumns.forEach((c) => { map[c.key] = c; });
    return map;
  }, [leafColumns]);

  const fields = useMemo(() => {
    const raw = (boardConfig?.fields?.length ? boardConfig.fields : listConfig?.fields) || [];
    return raw.filter((f) => f?.key && columnVisibility[f.key] !== false);
  }, [boardConfig, listConfig, columnVisibility]);

  const resolveItem = useCallback((item) => {
    if (!editedData || !getRowKey) return item;
    const key = getRowKey(item);
    const edits = editedData.get?.(key);
    if (!edits) return item;
    return { ...item, ...edits };
  }, [editedData, getRowKey]);

  const boardColumns = useMemo(() => {
    if (!columnKey) return [];
    const map = new Map();

    const ensureBucket = (label) => {
      if (!map.has(label)) map.set(label, []);
    };

    const fixedLabels = fixedColumns
      .map((c) => (c == null || c === '' ? EMPTY_COLUMN : String(c)))
      .filter((label, index, arr) => arr.indexOf(label) === index);

    if (fixedLabels.length > 0) {
      fixedLabels.forEach((label) => ensureBucket(label));
    }

    sortedData.forEach((raw) => {
      const item = resolveItem(raw);
      const rawVal = item[columnKey];
      const label = rawVal == null || rawVal === '' ? EMPTY_COLUMN : String(rawVal);

      if (fixedLabels.length > 0 && !fixedLabels.includes(label)) return;

      ensureBucket(label);
      map.get(label).push(raw);
    });

    if (fixedLabels.length > 0) {
      return fixedLabels.map((label) => ({
        label,
        value: label === EMPTY_COLUMN ? '' : label,
        items: map.get(label) || [],
      }));
    }

    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      value: label === EMPTY_COLUMN ? '' : label,
      items,
    }));
  }, [sortedData, columnKey, resolveItem, fixedColumns]);

  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggingKey, setDraggingKey] = useState(null);

  const handleDragStart = (e, item) => {
    if (!canDrag) return;
    const key = getRowKey(item);
    setDraggingKey(key);
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingKey(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, colLabel) => {
    if (!canDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(colLabel);
  };

  const handleDrop = (e, targetCol) => {
    if (!canDrag) return;
    e.preventDefault();
    const key = e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setDraggingKey(null);
    if (!key || !columnKey) return;

    const raw = sortedData.find((row) => String(getRowKey(row)) === String(key));
    if (!raw) return;

    const item = resolveItem(raw);
    const fromRaw = item[columnKey];
    const from = fromRaw == null || fromRaw === '' ? '' : String(fromRaw);
    const to = targetCol.value;

    if (from === to) return;

    onBoardMove?.(raw, { from, to, columnKey });
  };

  if (!columnKey) {
    return (
      <div className={styles.tabela__view__placeholder}>
        <div className={styles.tabela__view__placeholder__inner}>
          <i className={`fas fa-th-large ${styles.tabela__view__placeholder__icon}`} />
          <span className={styles.tabela__view__placeholder__title}>Configure boardConfig.columnKey</span>
          <span className={styles.tabela__view__placeholder__subtitle}>
            Defina a coluna base do quadro
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.boardView}>
      {(isLoading || isSorting) && (
        <div className={styles.boardView__loader}>
          <Loader />
        </div>
      )}
      <div className={styles.boardView__columns}>
        {boardColumns.map((col) => (
          <div
            key={col.label}
            className={[
              styles.boardView__column,
              dragOverColumn === col.label ? styles.boardView__column__dragOver : '',
            ].filter(Boolean).join(' ')}
            onDragOver={(e) => handleDragOver(e, col.label)}
            onDragLeave={() => setDragOverColumn((prev) => (prev === col.label ? null : prev))}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className={styles.boardView__columnHeader}>
              <span className={styles.boardView__columnTitle}>{col.label}</span>
              <span className={styles.boardView__columnCount}>{col.items.length}</span>
            </div>
            <div className={styles.boardView__columnBody}>
              {col.items.map((raw, index) => {
                const item = resolveItem(raw);
                const key = getRowKey(raw);
                const isDragging = draggingKey != null && String(draggingKey) === String(key);

                if (cardMode === 'custom' && typeof cardRender === 'function') {
                  return (
                    <div
                      key={key}
                      className={[
                        styles.boardView__cardWrap,
                        isDragging ? styles.boardView__cardWrap__dragging : '',
                      ].filter(Boolean).join(' ')}
                      draggable={canDrag}
                      onDragStart={(e) => handleDragStart(e, raw)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => onItemClick?.(e, item, index)}
                      onDoubleClick={(e) => onItemDoubleClick?.(e, item, index)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onItemContextMenu?.(e, item, index);
                      }}
                    >
                      {cardRender(item, { columnKey, column: col, columnsByKey })}
                    </div>
                  );
                }

                return (
                  <ItemCard
                    key={key}
                    item={item}
                    fields={fields}
                    columnsByKey={columnsByKey}
                    className={[
                      styles.boardView__card,
                      isDragging ? styles.boardView__cardWrap__dragging : '',
                    ].filter(Boolean).join(' ')}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, raw)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => onItemClick?.(e, item, index)}
                    onDoubleClick={(e) => onItemDoubleClick?.(e, item, index)}
                    onContextMenu={(e) => onItemContextMenu?.(e, item, index)}
                  />
                );
              })}
              {col.items.length === 0 && (
                <div className={styles.boardView__emptyCol}>Solte itens aqui</div>
              )}
            </div>
          </div>
        ))}
        {boardColumns.length === 0 && (
          <div className={styles.listView__empty}>Nenhum item para exibir.</div>
        )}
      </div>
    </div>
  );
}
