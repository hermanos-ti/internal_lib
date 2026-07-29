import { useMemo, useCallback } from 'react';
import styles from '../../Tabela.module.css';
import { ItemCard } from '../ItemCard';
import { Loader } from '../../../Loader/Loader';

export function ListView({
  sortedData = [],
  headerStructure,
  columnVisibility = {},
  listConfig,
  groupByColumnKey,
  collapsedGroupKeys,
  setCollapsedGroupKeys,
  isLoading,
  isSorting,
  getRowKey,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  editedData,
}) {
  const leafColumns = headerStructure?.leafColumns || [];
  const columnsByKey = useMemo(() => {
    const map = {};
    leafColumns.forEach((c) => { map[c.key] = c; });
    return map;
  }, [leafColumns]);

  const fields = useMemo(() => {
    const raw = listConfig?.fields || [];
    return raw.filter((f) => f?.key && columnVisibility[f.key] !== false);
  }, [listConfig, columnVisibility]);

  const resolveItem = useCallback((item) => {
    if (!editedData || !getRowKey) return item;
    const key = getRowKey(item);
    const edits = editedData.get?.(key);
    if (!edits) return item;
    return { ...item, ...edits };
  }, [editedData, getRowKey]);

  const groups = useMemo(() => {
    if (!groupByColumnKey) return null;
    const map = new Map();
    sortedData.forEach((raw) => {
      const item = resolveItem(raw);
      const value = item[groupByColumnKey];
      const label = value == null || value === '' ? 'Sem valor' : String(value);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(raw);
    });
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [sortedData, groupByColumnKey, resolveItem]);

  const toggleGroup = (label) => {
    setCollapsedGroupKeys?.((prev) => {
      const next = new Set(prev || []);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const renderItem = (raw, index) => {
    const item = resolveItem(raw);
    const key = getRowKey ? getRowKey(raw) : index;
    return (
      <ItemCard
        key={key}
        item={item}
        fields={fields}
        columnsByKey={columnsByKey}
        onClick={(e) => onItemClick?.(e, item, index)}
        onDoubleClick={(e) => onItemDoubleClick?.(e, item, index)}
        onContextMenu={(e) => onItemContextMenu?.(e, item, index)}
      />
    );
  };

  if (fields.length === 0) {
    return (
      <div className={styles.tabela__view__placeholder}>
        <div className={styles.tabela__view__placeholder__inner}>
          <i className={`fas fa-list ${styles.tabela__view__placeholder__icon}`} />
          <span className={styles.tabela__view__placeholder__title}>Configure listConfig.fields</span>
          <span className={styles.tabela__view__placeholder__subtitle}>
            Defina os campos com roles: icone, id, principal, adicionais
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listView}>
      {(isLoading || isSorting) && (
        <div className={styles.listView__loader}>
          <Loader />
        </div>
      )}
      {groups ? (
        groups.map(({ label, items }) => {
          const collapsed = collapsedGroupKeys?.has?.(label);
          return (
            <div key={label} className={styles.listView__group}>
              <button
                type="button"
                className={styles.listView__groupHeader}
                onClick={() => toggleGroup(label)}
              >
                <i className={`far ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`} />
                <span>{label}</span>
                <span className={styles.listView__groupCount}>{items.length}</span>
              </button>
              {!collapsed && (
                <div className={styles.listView__groupBody}>
                  {items.map((item, i) => renderItem(item, i))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className={styles.listView__body}>
          {sortedData.map((item, i) => renderItem(item, i))}
          {sortedData.length === 0 && (
            <div className={styles.listView__empty}>Nenhum item para exibir.</div>
          )}
        </div>
      )}
    </div>
  );
}
