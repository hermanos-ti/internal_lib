/**
 * Utilities for exporting table data to CSV and XLSX.
 * @module exportUtils
 */

import { formatDisplayValue } from './formatUtils';

/**
 * Prepare data for export: merge edited values and format cell values.
 * @param {object[]} data - Raw rows
 * @param {object[]} columns - Visible leaf columns with key, label, format
 * @param {Map} editedData - Map of rowKey -> { colKey: value }
 * @param {(row: object) => string} getRowKey - Function to get row key
 * @returns {object[]} Array of objects with column keys and formatted values
 */
export function prepareExportData(data, columns, editedData, getRowKey) {
  if (!data?.length || !columns?.length) return [];

  return data.map((row) => {
    const rowKey = getRowKey?.(row);
    const edits = editedData?.get?.(rowKey);
    const mergedRow = edits ? { ...row, ...edits } : { ...row };

    const exportRow = {};
    for (const col of columns) {
      const value = mergedRow[col.key];
      let displayValue;

      if (typeof col.getExportValue === 'function') {
        displayValue = col.getExportValue(value, mergedRow, col);
      } else {
        displayValue = formatDisplayValue(value, col.format ?? 'text', { emptyDisplay: '' });
      }

      exportRow[col.key] = displayValue;
    }
    return exportRow;
  });
}

/**
 * Escape a CSV field (wrap in quotes if contains comma, newline, or quote).
 * @param {string} value
 * @returns {string}
 */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

function escapeCSVField(value) {
  const str = String(value ?? '');

  if (FORMULA_PREFIXES.some((ch) => str.startsWith(ch))) {
    return `"'${str.replace(/"/g, '""')}"`;
  }

  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert prepared data to CSV string with BOM for UTF-8.
 * @param {object[]} data - Prepared export data (objects with column keys)
 * @param {object[]} columns - Columns with key and label
 * @returns {string} CSV content
 */
export function toCSV(data, columns) {
  const headers = columns.map((c) => c.label ?? c.key);
  const headerLine = headers.map(escapeCSVField).join(',');
  const rows = data.map((row) =>
    columns.map((c) => escapeCSVField(row[c.key])).join(',')
  );
  const csv = [headerLine, ...rows].join('\r\n');
  return '\uFEFF' + csv;
}


/**
 * Trigger file download from string or Blob.
 * @param {string|Blob} blobOrString - Content to download
 * @param {string} filename - Suggested filename
 * @param {string} [mimeType='text/csv;charset=utf-8'] - MIME type
 */
export function downloadFile(blobOrString, filename, mimeType = 'text/csv;charset=utf-8') {
  const blob =
    typeof blobOrString === 'string'
      ? new Blob([blobOrString], { type: mimeType })
      : blobOrString;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate export filename with timestamp.
 * @param {string} baseName - e.g. "Tabela"
 * @param {string} extension - e.g. "csv" or "xlsx"
 * @returns {string}
 */
export function getExportFilename(baseName, extension) {
  const safeName = (baseName ?? 'Tabela').replace(/\.{2,}/g, '_').replace(/[/\\:*?"<>|\x00-\x1f]/g, '_');
  const safeExt = (extension ?? 'csv').replace(/[/\\:*?"<>|\x00-\x1f]/g, '_');
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${safeName}-${ts}.${safeExt}`;
}
