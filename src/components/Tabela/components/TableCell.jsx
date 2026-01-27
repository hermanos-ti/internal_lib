import { memo } from 'react';
import styles from '../Tabela.module.css';

export const TableCell = memo(({ 
  cellValue, 
  row, 
  column, 
  rowIndex, 
  colIndex,
  hasColumnRender
}) => {
  const content = hasColumnRender 
    ? column.render(cellValue, row, column, rowIndex, colIndex)
    : cellValue;
  
  return (
    <td className={`${styles.tabela__body__cell} ${column?.cellClassName}`} style={column?.cellStyle}>
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
    prevProps.hasColumnRender === nextProps.hasColumnRender
  );
});

TableCell.displayName = 'TableCell';
