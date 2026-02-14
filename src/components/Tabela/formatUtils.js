/**
 * Display formatting utilities for table cell and footer values.
 * Used by column.format to apply masks in cells and calculation footer.
 *
 * @module formatUtils
 */

const EMPTY_DISPLAY = '—';
const LOCALE_BR = 'pt-BR';

/**
 * Format a single primitive value for display according to format type.
 * @param {*} value - Raw value (number, string, Date, etc.)
 * @param {string} format - One of: 'text' | 'money' | 'percentage' | 'number' | 'integer' | 'date' | 'datetime'
 * @returns {string} Formatted string for display
 */
function formatSingleValue(value, format) {
  if (value == null || value === '') {
    return EMPTY_DISPLAY;
  }

  switch (format) {
    case 'money': {
      const n = typeof value === 'number' && !Number.isNaN(value) ? value : parseFloat(value);
      if (typeof n !== 'number' || Number.isNaN(n)) return EMPTY_DISPLAY;
      return new Intl.NumberFormat(LOCALE_BR, { style: 'currency', currency: 'BRL' }).format(n);
    }
    case 'percentage': {
      const n = typeof value === 'number' && !Number.isNaN(value) ? value : parseFloat(value);
      if (typeof n !== 'number' || Number.isNaN(n)) return EMPTY_DISPLAY;
      return `${new Intl.NumberFormat(LOCALE_BR, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)}%`;
    }
    case 'number': {
      const n = typeof value === 'number' && !Number.isNaN(value) ? value : parseFloat(value);
      if (typeof n !== 'number' || Number.isNaN(n)) return EMPTY_DISPLAY;
      return new Intl.NumberFormat(LOCALE_BR, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
    }
    case 'integer': {
      const n = typeof value === 'number' && !Number.isNaN(value) ? value : parseFloat(value);
      if (typeof n !== 'number' || Number.isNaN(n)) return EMPTY_DISPLAY;
      return new Intl.NumberFormat(LOCALE_BR, { maximumFractionDigits: 0 }).format(Math.round(n));
    }
    case 'date': {
      const ms = toTimestamp(value);
      if (ms == null) return EMPTY_DISPLAY;
      return new Date(ms).toLocaleDateString(LOCALE_BR);
    }
    case 'datetime': {
      const ms = toTimestamp(value);
      if (ms == null) return EMPTY_DISPLAY;
      return new Date(ms).toLocaleString(LOCALE_BR, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    case 'text':
    default:
      return String(value);
  }
}

/**
 * @param {*} v - string (ISO), Date, or number (ms)
 * @returns {number|null}
 */
function toTimestamp(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.getTime();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Format a value for display using the column's format.
 * Used in table cells (when no custom render) and in calculation footer.
 *
 * @param {*} value - Raw value: number, string, Date, null, undefined, or array of values
 * @param {string} [format='text'] - Display format. Supported: 'text' | 'money' | 'percentage' | 'number' | 'integer' | 'date' | 'datetime'. Can be extended later.
 * @param {{ emptyDisplay?: string }} [options] - Optional. emptyDisplay overrides the string used for null/empty (default '—').
 * @returns {string} Formatted string for display. Returns '—' (or options.emptyDisplay) for null/undefined/empty.
 */
export function formatDisplayValue(value, format = 'text', options = {}) {
  const emptyStr = options.emptyDisplay ?? EMPTY_DISPLAY;

  if (value == null || value === '') {
    return emptyStr;
  }

  if (Array.isArray(value)) {
    const filtered = value.filter((v) => v != null && v !== '');
    if (filtered.length === 0) return emptyStr;
    return filtered.map((v) => formatSingleValue(v, format)).join(', ');
  }

  return formatSingleValue(value, format);
}
