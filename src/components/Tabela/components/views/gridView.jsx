import { useCallback } from 'react';
import styles from '../../Tabela.module.css';
import { TableCell } from '../TableCell';
import { EditableCell } from '../EditableCell';
import { Pagination } from '../../../Pagination/Pagination';
import { Loader } from '../../../Loader/Loader';
import { computeCalculation, CALCULATION_OPTIONS } from '../../calculationUtils';

export function GridView({
  groupedBodyItems,
  sortedData,
  headerStructure,
  renderFlags,
  calculationByColumn,
  fullDataForGrouping,
  hasCalculationRow,
  hasScroll,
  visibleFooter,
  isSorting,
  isLoading,
  renderTableHead,
  tableWrapperRef,
  tableBodyRef,
  groupCurrentPage,
  collapsedGroupKeys,
  setCollapsedGroupKeys,
  groupItemsPerPage,
  setGroupCurrentPage,
  groupItemsPerPageOptions,
  defaultItemsPerGroup,
  handleGroupItemsPerPageChange,
  openCalculationSubmenu,
  selectable,
  selectionMode,
  selectedKeys,
  getRowKey,
  toggleRowSelection,
  editable,
  editingCell,
  editedData,
  rowStatuses,
  onCellClickWithDbl,
  onCellClick,
  onCellCommit,
  onCellCancel,
  onEditNavigate,
}) {
  const visibleLeafColumns = headerStructure.leafColumns.filter(col => col.visible !== false);

  const editableColumns = editable
    ? new Set(visibleLeafColumns.filter(col => col.editable).map(col => col.key))
    : new Set();

  const getRowStatusClass = useCallback((item) => {
    if (!rowStatuses) return '';
    const key = getRowKey(item);
    const status = rowStatuses.get?.(key);
    if (!status) return '';
    return styles[`tabela__body__row__${status.status}`] || '';
  }, [rowStatuses, getRowKey]);

  const getCellStatusClass = useCallback((item, colKey) => {
    if (!rowStatuses) return null;
    const key = getRowKey(item);
    const status = rowStatuses.get?.(key);
    if (!status) return null;
    if (!status.columns || status.columns.length === 0) return null;
    if (status.columns.includes(colKey)) return status.status;
    return null;
  }, [rowStatuses, getRowKey]);

  const isEditingCell = useCallback((rowKey, colKey) => {
    if (!editingCell) return false;
    return editingCell.rowKey === rowKey && editingCell.colKey === colKey;
  }, [editingCell]);

  const getCellValue = useCallback((item, colKey) => {
    if (editedData) {
      const rowKey = getRowKey(item);
      const edited = editedData.get?.(rowKey);
      if (edited && colKey in edited) return edited[colKey];
    }
    return item[colKey];
  }, [editedData, getRowKey]);

  const handleTableKeyDown = useCallback((e) => {
    if (!editable || !editingCell) {
      if (editable && e.key === 'Enter' && !e.target.closest('input, select, textarea, button')) {
        e.preventDefault();
        const firstEditableCol = visibleLeafColumns.find(col => editableColumns.has(col.key));
        if (firstEditableCol && sortedData.length > 0) {
          const rowKey = getRowKey(sortedData[0]);
          onCellClick?.(sortedData[0], firstEditableCol, 0, visibleLeafColumns.indexOf(firstEditableCol));
        }
      }
      return;
    }
  }, [editable, editingCell, visibleLeafColumns, editableColumns, sortedData, getRowKey, onCellClick]);

  const renderSelectionCell = (item) => {
    if (!selectable) return null;
    const key = getRowKey(item);
    const checked = selectedKeys.has(key);
    return (
      <td className={styles.tabela__selection__cell} onClick={(e) => e.stopPropagation()}>
        <label className={styles.tabela__selection__label}>
          <input
            type="checkbox"
            className={styles.tabela__selection__checkbox}
            checked={checked}
            onChange={() => toggleRowSelection(item)}
          />
          <span className={styles.tabela__selection__checkmark}>
            <i className={`far ${checked ? 'fa-square-check' : 'fa-square'}`} />
          </span>
        </label>
      </td>
    );
  };

  const renderCalcSelectionCell = () => {
    if (!selectable) return null;
    return <td className={styles.tabela__calculationCell} />;
  };

  const renderDataCell = (item, column, rowIndex, colIndex) => {
    const rowKey = getRowKey(item);
    const cellValue = getCellValue(item, column.key);
    const hasColumnRender = renderFlags.columnRenders.get(column.key) || false;
    const colIsEditable = editable && editableColumns.has(column.key);

    if (colIsEditable && isEditingCell(rowKey, column.key)) {
      return (
        <EditableCell
          key={column.key}
          cellValue={cellValue}
          row={item}
          column={column}
          rowIndex={rowIndex}
          colIndex={colIndex}
          onCommit={onCellCommit}
          onCancel={onCellCancel}
          onNavigate={onEditNavigate}
        />
      );
    }

    return (
      <TableCell
        key={column.key}
        cellValue={cellValue}
        row={item}
        column={column}
        rowIndex={rowIndex}
        colIndex={colIndex}
        hasColumnRender={hasColumnRender}
        isEditable={colIsEditable}
        cellStatus={getCellStatusClass(item, column.key)}
        onCellClickWithDbl={onCellClickWithDbl}
      />
    );
  };

  const renderRow = (item, rowIndex) => {
    const rowKey = getRowKey(item);
    const selectedClass = selectable && selectedKeys.has(rowKey) ? styles.tabela__body__row__selected : '';
    const statusClass = getRowStatusClass(item);

    return (
      <tr
        className={`${styles.tabela__body__row} ${selectedClass} ${statusClass}`}
        key={item.key ?? `row-${rowIndex}`}
      >
        {renderSelectionCell(item)}
        {visibleLeafColumns.map((column, colIndex) => renderDataCell(item, column, rowIndex, colIndex))}
      </tr>
    );
  };

  const renderCalculationRow = (dataSource) => {
    if (!hasCalculationRow) return null;
    return (
      <tfoot>
        <tr className={styles.tabela__calculationRow}>
          {renderCalcSelectionCell()}
          {visibleLeafColumns.map((column) => {
            if (column.calculable === false) {
              return <td key={column.key} className={styles.tabela__calculationCell} />;
            }
            const config = calculationByColumn[column.key];
            const hasValidCalc =
              config?.calculationId &&
              config.calculationId !== 'none' &&
              (config.calculationId !== 'pctByGroup' || config.groupValue !== undefined);
            const result = hasValidCalc
              ? computeCalculation(dataSource, column, config.calculationId, { groupValue: config.groupValue })
              : null;
            const calculationLabel = hasValidCalc && config?.calculationId
              ? config.calculationId === 'pctByGroup'
                ? `${config.groupValue !== undefined && config.groupValue !== null ? ` (${config.groupValue === '' ? '(vazio)' : String(config.groupValue)})` : ''}`
                : (CALCULATION_OPTIONS[config.calculationId]?.labelShort ?? config.calculationId)
              : '';
            return (
              <td key={column.key} className={styles.tabela__calculationCell}>
                {hasValidCalc ? (
                  <>
                    <span className={styles.tabela__calculationCell__label}>{calculationLabel}</span>
                    <span className={styles.tabela__calculationCell__value}>{result.formatted}</span>
                    <button
                      type="button"
                      className={styles.tabela__calculationCell__editBtn}
                      onClick={(e) => openCalculationSubmenu(column.key, { current: e.currentTarget })}
                      aria-label="Alterar cálculo"
                    >
                      <i className="far fa-calculator" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.tabela__calculationCell__addBtn}
                    onClick={(e) => openCalculationSubmenu(column.key, { current: e.currentTarget })}
                    aria-label="Calcular"
                  >
                    <i className="far fa-calculator" /> Calcular
                  </button>
                )}
              </td>
            );
          })}
        </tr>
      </tfoot>
    );
  };

  if (groupedBodyItems != null && groupedBodyItems.length > 0) {
    return (
      <div
        ref={tableWrapperRef}
        className={`${styles.tabela__wrapper} ${hasScroll ? styles.hasScroll : ''} ${hasCalculationRow ? styles.hasCalculationFooter : ''}`}
      >
        {groupedBodyItems.map((group, groupIndex) => {
          const itensPerGroup = groupItemsPerPage[group.groupKey] ?? defaultItemsPerGroup;
          const groupPage = groupCurrentPage[group.groupKey] ?? 1;
          const visibleRows = group.rows.slice((groupPage - 1) * itensPerGroup, groupPage * itensPerGroup);
          const totalPagesGroup = Math.ceil(group.rows.length / itensPerGroup) || 1;
          const isCollapsed = collapsedGroupKeys[group.groupKey] === true;

          const toggleCollapsed = () => {
            setCollapsedGroupKeys((prev) => ({ ...prev, [group.groupKey]: !prev[group.groupKey] }));
          };

          return (
            <div key={group.groupKey} className={styles.tabela__group}>
              <div className={`${styles.tabela__group__header} ${isCollapsed ? styles.tabela__group__headerCollapsed : ''}`}>
                <span className={styles.tabela__group__label}>{group.groupLabel}</span>
                <button
                  type="button"
                  className={styles.tabela__group__toggleBtn}
                  onClick={toggleCollapsed}
                  aria-label={isCollapsed ? 'Expandir grupo' : 'Recolher grupo'}
                  aria-expanded={!isCollapsed}
                >
                  <i className={`far ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`} />
                  <span>{isCollapsed ? 'Expandir' : 'Recolher'}</span>
                </button>
              </div>
              {!isCollapsed && (
                <>
                  <table
                    className={`${styles.tabela} ${visibleFooter.length > 0 ? styles.hasFooter : ''} ${hasCalculationRow ? styles.hasCalculationRow : ''}`}
                    onKeyDown={handleTableKeyDown}
                  >
                    {renderTableHead()}
                    <tbody className={styles.tabela__body} ref={groupIndex === 0 ? tableBodyRef : undefined}>
                      {visibleRows.map((item, rowIndex) => renderRow(item, rowIndex))}
                    </tbody>
                    {hasCalculationRow && (
                      <tfoot>
                        <tr className={styles.tabela__calculationRow}>
                          {renderCalcSelectionCell()}
                          {visibleLeafColumns.map((column) => {
                            if (column.calculable === false) {
                              return <td key={column.key} className={styles.tabela__calculationCell} />;
                            }
                            const config = calculationByColumn[column.key];
                            const hasValidCalc =
                              config?.calculationId &&
                              config.calculationId !== 'none' &&
                              (config.calculationId !== 'pctByGroup' || config.groupValue !== undefined);
                            const result = hasValidCalc
                              ? computeCalculation(group.rows, column, config.calculationId, { groupValue: config.groupValue })
                              : null;
                            const calculationLabel = hasValidCalc && config?.calculationId
                              ? config.calculationId === 'pctByGroup'
                                ? `Porcentagem por grupo${config.groupValue !== undefined && config.groupValue !== null ? ` (${config.groupValue === '' ? '(vazio)' : String(config.groupValue)})` : ''}`
                                : (CALCULATION_OPTIONS[config.calculationId]?.label ?? config.calculationId)
                              : '';
                            return (
                              <td key={column.key} className={styles.tabela__calculationCell}>
                                {hasValidCalc ? (
                                  <>
                                    <span className={styles.tabela__calculationCell__label}>{calculationLabel}</span>
                                    <span className={styles.tabela__calculationCell__value}>{result.formatted}</span>
                                    <button
                                      type="button"
                                      className={styles.tabela__calculationCell__editBtn}
                                      onClick={(e) => openCalculationSubmenu(column.key, { current: e.currentTarget })}
                                      aria-label="Alterar cálculo"
                                    >
                                      <i className="far fa-calculator" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className={styles.tabela__calculationCell__addBtn}
                                    onClick={(e) => openCalculationSubmenu(column.key, { current: e.currentTarget })}
                                    aria-label="Calcular"
                                  >
                                    <i className="far fa-calculator" /> Calcular
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  <div className={styles.tabela__group__pagination}>
                    <Pagination
                      totalPages={totalPagesGroup}
                      currentPage={groupPage}
                      onPageChange={(page) => setGroupCurrentPage((prev) => ({ ...prev, [group.groupKey]: page }))}
                      itemsPerPageOptions={groupItemsPerPageOptions}
                      itemsPerPage={itensPerGroup}
                      onItemsPerPageChange={(newSize) => handleGroupItemsPerPageChange(group.groupKey, newSize)}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const colCount = visibleLeafColumns.length + (selectable ? 1 : 0);

  return (
    <div
      ref={tableWrapperRef}
      className={`${styles.tabela__wrapper} ${hasScroll ? styles.hasScroll : ''} ${hasCalculationRow ? styles.hasCalculationFooter : ''}`}
    >
      <table
        className={`${styles.tabela} ${visibleFooter.length > 0 ? styles.hasFooter : ''} ${hasCalculationRow ? styles.hasCalculationRow : ''}`}
        onKeyDown={handleTableKeyDown}
      >
        {renderTableHead()}
        <tbody className={styles.tabela__body} ref={tableBodyRef}>
          {headerStructure.leafColumns.length === 0 ? (
            <tr className={styles.tabela__body__row}>
              <td colSpan={colCount || 1} className={styles.tabela__body__cell} style={{ width: '100%' }}>
                <span className={styles.tabela__body__label}>Nenhuma informação encontrada</span>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr className={styles.tabela__body__row}>
              <td colSpan={colCount} className={styles.tabela__body__cell}>
                <span className={styles.tabela__body__label}>Nenhuma informação encontrada</span>
              </td>
            </tr>
          ) : null}
          {(isSorting || isLoading) && (
            <div className={styles.tabela__loader}>
              <Loader
                loading={true}
                size="medium"
                text={isSorting ? "Ordenando..." : "Carregando..."}
              />
            </div>
          )}
          {headerStructure.leafColumns.length > 0 && sortedData.map((item, rowIndex) => renderRow(item, rowIndex))}
        </tbody>
        {renderCalculationRow(fullDataForGrouping)}
      </table>
    </div>
  );
}
