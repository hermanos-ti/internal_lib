import { parse } from '../../functions/Formatter/dateFormat';

function formatIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoLocal(value) {
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function toIsoDate(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : formatIso(value);
  }
  const str = String(value).trim();
  const fromIso = parseIsoLocal(str);
  if (fromIso) return formatIso(fromIso);
  const fromDisplay = parse(str, 'data');
  if (fromDisplay) return formatIso(fromDisplay);
  return '';
}

export function isoToDisplay(value) {
  const date = value instanceof Date ? value : parseIsoLocal(value);
  if (!date) {
    const parsed = parse(String(value ?? ''), 'data');
    if (!parsed) return '';
    return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`;
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function maskDateInput(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  let text = day;
  if (digits.length > 2) text += `/${month}`;
  if (digits.length > 4) text += `/${year}`;
  return text;
}

export function normalizeOption(raw) {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    const value = raw.value ?? raw.label ?? '';
    const label = raw.label ?? String(raw.value ?? '');
    return { value: String(value), label: String(label) };
  }
  const text = raw == null ? '' : String(raw);
  return { value: text, label: text };
}

export function resolveSelectOptions(column, rows) {
  if (Array.isArray(column?.options) && column.options.length > 0) {
    const seen = new Set();
    const options = [];
    column.options.forEach((raw) => {
      const option = normalizeOption(raw);
      if (!option.value || seen.has(option.value)) return;
      seen.add(option.value);
      options.push(option);
    });
    return options;
  }

  const key = column?.key;
  if (!key || !Array.isArray(rows)) return [];

  const seen = new Set();
  const options = [];
  rows.forEach((row) => {
    const raw = row?.[key]?.sortableValue ?? row?.[key];
    const values = Array.isArray(raw) ? raw : [raw];
    values.forEach((item) => {
      if (item == null || item === '') return;
      const option = normalizeOption(item);
      if (!option.value || seen.has(option.value)) return;
      seen.add(option.value);
      options.push(option);
    });
  });

  options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  return options;
}

export function toSelectFilterValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter((item) => item !== '');
  }
  if (value == null || value === '') return [];
  return [String(value)];
}

export function filterValuesEqual(a, b) {
  const normalize = (value) => {
    if (Array.isArray(value)) return JSON.stringify(value.map((item) => String(item)));
    return JSON.stringify(value ?? '');
  };
  return normalize(a) === normalize(b);
}

export function formatFilterValueForDisplay(value, columnType) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean).join(', ');
  }
  if (value == null || value === '') return '';
  if (columnType === 'date') {
    return isoToDisplay(value) || String(value);
  }
  return String(value);
}

export function unwrapCellValue(value) {
  if (
    value != null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.prototype.hasOwnProperty.call(value, 'sortableValue')
  ) {
    return value.sortableValue;
  }
  return value;
}

export function isEmptyCellValue(value) {
  if (value == null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function valueFromCell(type, rawValue) {
  const raw = unwrapCellValue(rawValue);
  if (isEmptyCellValue(raw)) {
    return { empty: true, value: type === 'select' ? [] : '' };
  }
  if (type === 'select') {
    return { empty: false, value: toSelectFilterValue(raw) };
  }
  if (type === 'date') {
    const iso = toIsoDate(raw);
    return { empty: false, value: iso || String(raw) };
  }
  if (type === 'number') {
    return { empty: false, value: String(raw) };
  }
  return { empty: false, value: String(raw) };
}
