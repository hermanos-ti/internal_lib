import { memo, useCallback } from 'react';
import styles from '../Tabela.module.css';
import { formatDisplayValue } from '../formatUtils';

export const TableCell = memo(({ 
  cellValue, 
  row, 
  column, 
  rowIndex, 
  colIndex,
  hasColumnRender,
  isEditable,
  cellStatus,
  onCellClickWithDbl,
}) => {
  const content = hasColumnRender 
    ? column.render(cellValue, row, column, rowIndex, colIndex)
    : formatDisplayValue(cellValue, column?.format ?? 'text');

  const statusClass = cellStatus ? styles[`tabela__body__cell__status_${cellStatus}`] || '' : '';

  const className = [
    styles.tabela__body__cell,
    column?.cellClassName,
    isEditable ? styles.tabela__body__cell__editable : '',
    statusClass,
  ].filter(Boolean).join(' ');

  const handleClick = useCallback((e) => {
    if (e.target.closest?.('input[type="checkbox"], input[type="radio"]')) return;
    if (!onCellClickWithDbl) return;

    const event = { row, column, cell: cellValue, rowIndex, colIndex };
    onCellClickWithDbl(event);
  }, [row, column, cellValue, rowIndex, colIndex, onCellClickWithDbl]);

  const hasClickHandler = !!onCellClickWithDbl;

  return (
    <td
      className={className}
      style={column?.cellStyle}
      onClick={hasClickHandler ? handleClick : undefined}
    >
      {content}
    </td>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.cellValue === nextProps.cellValue &&
    prevProps.row === nextProps.row &&
    prevProps.column === nextProps.column &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.colIndex === nextProps.colIndex &&
    prevProps.hasColumnRender === nextProps.hasColumnRender &&
    prevProps.isEditable === nextProps.isEditable &&
    prevProps.cellStatus === nextProps.cellStatus &&
    prevProps.onCellClickWithDbl === nextProps.onCellClickWithDbl
  );
});

TableCell.displayName = 'TableCell';
