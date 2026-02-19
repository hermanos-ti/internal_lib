import { memo } from 'react';
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
  onCellClick,
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

  const handleClick = () => {
    if (isEditable && onCellClick) {
      onCellClick(row, column, rowIndex, colIndex);
    }
  };

  return (
    <td
      className={className}
      style={column?.cellStyle}
      onClick={handleClick}
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
    prevProps.onCellClick === nextProps.onCellClick
  );
});

TableCell.displayName = 'TableCell';
