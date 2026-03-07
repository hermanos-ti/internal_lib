/**
 * Utilities for CSV import: parsing, format validation, and row validation.
 * @module importUtils
 */

import { formatDisplayValue } from './formatUtils';

const EMPTY_DISPLAY = '—';

/**
 * Parse a CSV file and return array of objects keyed by column keys.
 * @param {File} file - CSV file
 * @param {Array<{key: string}>} columns - Expected columns (keys used for mapping)
 * @returns {Promise<{data: object[], error?: string}>}
 */
export function parseCSVFile(file, columns) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result ?? '';
        const data = parseCSVText(text, columns);
        resolve({ data });
      } catch (err) {
        console.error('[Tabela importCSV]', err);
        resolve({ data: [], error: 'Erro ao ler o arquivo CSV' });
      }
    };
    reader.onerror = () => {
      resolve({ data: [], error: 'Erro ao ler o arquivo' });
    };
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Parse CSV text into array of objects.
 * Handles quoted values with commas inside.
 * @param {string} text - Raw CSV text
 * @param {Array<{key: string}>} columns - Column config with keys
 * @returns {object[]}
 */
function parseCSVText(text, columns) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const expectedKeys = columns.map((c) => c.key);

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      const key = expectedKeys.includes(h) ? h : headers[idx];
      row[key] = values[idx] ?? '';
    });
    expectedKeys.forEach((k) => {
      if (!(k in row)) row[k] = '';
    });
    data.push(row);
  }
  return data;
}

/**
 * Parse a single CSV line, handling quoted fields.
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Validate that a value matches the expected format.
 * @param {*} value - Raw value
 * @param {string} format - One of: text, money, number, integer, date, datetime, percentage
 * @returns {boolean} - true if format is valid (or value is empty)
 */
export function validateFormat(value, format) {
  if (value == null || value === '') return true;
  if (format === 'text') return true;
  const formatted = formatDisplayValue(value, format);
  return formatted !== EMPTY_DISPLAY;
}

/**
 * Run validation for a single row.
 * Returns status per column: 'error' | 'warning' | 'success'
 * @param {object} row - Data row
 * @param {Array<{key: string, format?: string, obrigatorio?: boolean, validator?: function}>} columns
 * @returns {{ status: 'error'|'warning'|'success', columns: Record<string, 'error'|'warning'|'success'> }}
 */
export function runValidation(row, columns) {
  const columnStatuses = {};
  let rowStatus = 'success';

  for (const col of columns) {
    const key = col.key;
    const value = row[key];
    const isEmpty = value == null || String(value).trim() === '';

    if (col.obrigatorio && isEmpty) {
      columnStatuses[key] = 'error';
      rowStatus = 'error';
      continue;
    }

    if (col.validator) {
      const result = col.validator(value, row, key);
      if (result !== true) {
        columnStatuses[key] = 'error';
        rowStatus = 'error';
        continue;
      }
    }

    if (!validateFormat(value, col.format ?? 'text')) {
      columnStatuses[key] = 'warning';
      if (rowStatus !== 'error') rowStatus = 'warning';
      continue;
    }

    columnStatuses[key] = 'success';
  }

  return { status: rowStatus, columns: columnStatuses };
}

/**
 * Sort import data by column.
 * @param {object[]} data - Rows to sort
 * @param {{ key: string, direction: 'asc'|'desc' }} sortBy
 * @param {Array<{key: string, format?: string}>} columns - Column config for type-aware comparison
 * @returns {object[]}
 */
export function sortImportData(data, sortBy, columns) {
  if (!sortBy?.key || !data.length) return [...data];
  const col = columns.find((c) => c.key === sortBy.key);
  const format = col?.format ?? 'text';
  const dir = sortBy.direction === 'desc' ? -1 : 1;

  const compare = (a, b) => {
    const va = a[sortBy.key];
    const vb = b[sortBy.key];
    if (va == null && vb == null) return 0;
    if (va == null || va === '') return 1 * dir;
    if (vb == null || vb === '') return -1 * dir;
    if (format === 'number' || format === 'integer' || format === 'money' || format === 'percentage') {
      const na = parseFloat(va);
      const nb = parseFloat(vb);
      if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
      if (Number.isNaN(na)) return 1 * dir;
      if (Number.isNaN(nb)) return -1 * dir;
      return (na - nb) * dir;
    }
    if (format === 'date' || format === 'datetime') {
      const da = new Date(va).getTime();
      const db = new Date(vb).getTime();
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1 * dir;
      if (Number.isNaN(db)) return -1 * dir;
      return (da - db) * dir;
    }
    return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
  };

  return [...data].sort(compare);
}
