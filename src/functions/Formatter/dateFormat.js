/**
 * Utilitários de formatação e parsing de datas.
 * Suporta múltiplos formatos e aceita Date ou string.
 */

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const MONTH_NAMES_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

/**
 * Nome do mês em pt-BR
 * @param {number} month - 0-11
 * @param {boolean} [short] - abreviado
 * @returns {string}
 */
export function getMonthName(month, short = false) {
  const arr = short ? MONTH_NAMES_SHORT : MONTH_NAMES;
  return arr[Math.max(0, Math.min(11, month))] ?? '';
}

/**
 * Pad com zero
 * @param {number} n
 * @param {number} len
 * @returns {string}
 */
function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

/**
 * Converte valor para Date.
 * Aceita: string no formato especificado, Date, ou null/undefined.
 * @param {string|Date|null|undefined} value
 * @param {string} format - subtype (data, data-curto, hora, etc.)
 * @returns {Date|null}
 */
export function parse(value, format = 'data') {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const str = String(value).trim();
  if (!str) return null;

  const hasTime = ['data-hora', 'data-hora-extenso', 'data-hora-extenso-curto', 'hora'].includes(format);
  const hasDate = !['hora'].includes(format);

  if (format === 'hora') {
    const m = str.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    const d = new Date();
    d.setHours(h, min, 0, 0);
    return d;
  }

  if (hasDate && hasTime) {
    const parts = str.split(/\s+/);
    if (parts.length < 2) return null;
    const dateFormat = format
      .replace('data-hora-extenso-curto', 'data-extenso-curto')
      .replace('data-hora-extenso', 'data-extenso')
      .replace('data-hora', 'data');
    const datePart = parse(parts[0], dateFormat);
    const timePart = parts[1];
    if (!datePart || !timePart) return null;
    const tm = timePart.match(/^(\d{1,2}):(\d{2})$/);
    if (!tm) return null;
    const h = parseInt(tm[1], 10);
    const min = parseInt(tm[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    datePart.setHours(h, min, 0, 0);
    return datePart;
  }

  // Formatos só de data
  const yearLen = ['data-curto', 'data-extenso-curto', 'mes-ano-extenso-curto'].includes(format) ? 2 : 4;

  // dd/mm/yyyy ou dd/mm/yy
  if (['data', 'data-curto'].includes(format)) {
    const m = str.match(new RegExp(`^(\\d{2})/(\\d{2})/(\\d{${yearLen}})$`));
    if (!m) return null;
    let y = parseInt(m[3], 10);
    if (yearLen === 2) y += y < 50 ? 2000 : 1900;
    const d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    if (d.getFullYear() !== y || d.getMonth() !== parseInt(m[2], 10) - 1 || d.getDate() !== parseInt(m[1], 10)) return null;
    return d;
  }

  // dd/mes/yyyy ou dd/mes/yy (data-extenso-curto usa mes abreviado: jan, fev)
  if (['data-extenso', 'data-extenso-curto'].includes(format)) {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const arr = format === 'data-extenso-curto' ? MONTH_NAMES_SHORT : MONTH_NAMES;
    const monthIdx = arr.findIndex((m) => m.toLowerCase() === parts[1].toLowerCase());
    if (monthIdx < 0) return null;
    let y = parseInt(parts[2], 10);
    if (parts[2].length === 2) y += y < 50 ? 2000 : 1900;
    const d = new Date(y, monthIdx, parseInt(parts[0], 10));
    if (d.getDate() !== parseInt(parts[0], 10) || d.getMonth() !== monthIdx) return null;
    return d;
  }

  // dd/mm
  if (format === 'dia-mes') {
    const m = str.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return null;
    const d = new Date(new Date().getFullYear(), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    if (d.getMonth() !== parseInt(m[2], 10) - 1 || d.getDate() !== parseInt(m[1], 10)) return null;
    return d;
  }

  // dd/mes ou dd/mesShort
  if (['dia-mes-extenso', 'dia-mes-extenso-curto'].includes(format)) {
    const parts = str.split('/');
    if (parts.length !== 2) return null;
    const arr = format === 'dia-mes-extenso-curto' ? MONTH_NAMES_SHORT : MONTH_NAMES;
    const monthIdx = arr.findIndex((m) => m.toLowerCase() === parts[1].toLowerCase());
    if (monthIdx < 0) return null;
    const d = new Date(new Date().getFullYear(), monthIdx, parseInt(parts[0], 10));
    if (d.getDate() !== parseInt(parts[0], 10)) return null;
    return d;
  }

  // mm/yyyy
  if (format === 'mes-ano') {
    const m = str.match(/^(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(parseInt(m[2], 10), parseInt(m[1], 10) - 1, 1);
    if (d.getFullYear() !== parseInt(m[2], 10) || d.getMonth() !== parseInt(m[1], 10) - 1) return null;
    return d;
  }

  // mes/yyyy ou mes/yy (mes-ano-extenso-curto usa mes abreviado: jan, fev)
  if (['mes-ano-extenso', 'mes-ano-extenso-curto'].includes(format)) {
    const parts = str.split('/');
    if (parts.length !== 2) return null;
    const arr = format === 'mes-ano-extenso-curto' ? MONTH_NAMES_SHORT : MONTH_NAMES;
    const monthIdx = arr.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase());
    if (monthIdx < 0) return null;
    let y = parseInt(parts[1], 10);
    if (parts[1].length === 2) y += y < 50 ? 2000 : 1900;
    const d = new Date(y, monthIdx, 1);
    if (d.getMonth() !== monthIdx) return null;
    return d;
  }

  return null;
}

/**
 * Formata Date para string no formato especificado.
 * @param {Date} date
 * @param {string} format - subtype
 * @returns {string}
 */
export function format(date, formatType = 'data') {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const yy = String(yyyy).slice(-2);
  const mes = getMonthName(date.getMonth(), false);
  const mesShort = getMonthName(date.getMonth(), true);
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());

  const timeStr = `${hh}:${min}`;
  const dateStr = `${dd}/${mm}/${yyyy}`;
  const dateStrCurto = `${dd}/${mm}/${yy}`;
  const dateExtenso = `${dd}/${mes}/${yyyy}`;
  const dateExtensoCurto = `${dd}/${mesShort}/${yy}`;
  const diaMes = `${dd}/${mm}`;
  const diaMesExtenso = `${dd}/${mes}`;
  const diaMesExtensoCurto = `${dd}/${mesShort}`;
  const mesAno = `${mm}/${yyyy}`;
  const mesAnoExtenso = `${mes}/${yyyy}`;
  const mesAnoExtensoCurto = `${mesShort}/${yy}`;

  const map = {
    data: dateStr,
    'data-curto': dateStrCurto,
    'data-extenso': dateExtenso,
    'data-extenso-curto': dateExtensoCurto,
    'dia-mes': diaMes,
    'dia-mes-extenso': diaMesExtenso,
    'dia-mes-extenso-curto': diaMesExtensoCurto,
    'mes-ano': mesAno,
    'mes-ano-extenso': mesAnoExtenso,
    'mes-ano-extenso-curto': mesAnoExtensoCurto,
    'data-hora': `${dateStr} ${timeStr}`,
    'data-hora-extenso': `${dateExtenso} ${timeStr}`,
    'data-hora-extenso-curto': `${dateExtensoCurto} ${timeStr}`,
    hora: timeStr,
  };

  return map[formatType] ?? dateStr;
}

/**
 * Valida se a data está dentro dos limites.
 * @param {Date} date
 * @param {Date|string|null} min
 * @param {Date|string|null} max
 * @param {string} format
 * @returns {boolean}
 */
export function isValidDate(date, min = null, max = null, format = 'data') {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const t = date.getTime();
  const minDate = min ? parse(min, format) : null;
  const maxDate = max ? parse(max, format) : null;
  if (minDate && t < minDate.getTime()) return false;
  if (maxDate && t > maxDate.getTime()) return false;
  return true;
}

/**
 * Lista de formatos que exibem calendário (não apenas hora).
 */
export const DATE_FORMATS_WITH_CALENDAR = [
  'data', 'data-curto', 'data-extenso', 'data-extenso-curto',
  'dia-mes', 'dia-mes-extenso', 'dia-mes-extenso-curto',
  'mes-ano', 'mes-ano-extenso', 'mes-ano-extenso-curto',
  'data-hora', 'data-hora-extenso', 'data-hora-extenso-curto',
];
