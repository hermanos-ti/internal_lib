import { formatDisplayValue } from './formatUtils';

/**
 * Normalizes raw cell value to an array of values for counting.
 * Handles multi-value cells (e.g. arrays like tags, linked users).
 * @param {*} rawValue - dataRow[columnKey]
 * @returns {Array<*>} Array of values (empty, single, or multiple)
 */
export function getCellValues(rawValue) {
  if (rawValue == null || rawValue === '') {
    return [];
  }
  if (Array.isArray(rawValue)) {
    return rawValue.filter((v) => v != null && v !== '');
  }
  return [rawValue];
}

/**
 * Check if a cell is empty (no values).
 * @param {*} rawValue - dataRow[columnKey]
 * @returns {boolean}
 */
export function isEmpty(rawValue) {
  const values = getCellValues(rawValue);
  return values.length === 0;
}

/**
 * Parse numeric value; returns NaN if not a valid number.
 * @param {*} v
 * @returns {number}
 */
function toNumber(v) {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = parseFloat(v);
  return typeof n === 'number' && !Number.isNaN(n) ? n : NaN;
}

/**
 * Parse date value to timestamp.
 * @param {*} v - string (ISO), Date, or number
 * @returns {number|null} ms or null if invalid
 */
function toDateMs(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.getTime();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Compute median of numeric array (sorted).
 * @param {number[]} arr
 * @returns {number}
 */
function median(arr) {
  if (arr.length === 0) return NaN;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Format date range in days/months/years.
 * @param {number} msDiff
 * @returns {string}
 */
function formatDateRange(msDiff) {
  if (msDiff <= 0 || !Number.isFinite(msDiff)) return '—';
  const days = Math.round(msDiff / (24 * 60 * 60 * 1000));
  if (days < 30) return `${days} dia${days !== 1 ? 's' : ''}`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mes${months !== 1 ? 'es' : ''}`;
  const years = Math.round(months / 12);
  return `${years} ano${years !== 1 ? 's' : ''}`;
}

/**
 * Compute calculation result for a column over the dataset.
 * @param {Array<Object>} data - full filtered/sorted rows
 * @param {Object} column - { key, type, label }
 * @param {string} calculationId - none | countAll | countValues | countUnique | countEmpty | countNonEmpty | pctEmpty | pctNonEmpty | sum | average | median | min | max | range | dateEarliest | dateLatest | dateRange | pctByGroup
 * @param {{ groupValue?: * }} [options] - for pctByGroup
 * @returns {{ value: *, label?: string, formatted: string }}
 */
export function computeCalculation(data, column, calculationId, options = {}) {
  const key = column?.key;
  const colType = column?.type || 'text';
  const columnFormat = column?.format ?? 'text';
  const totalRows = data.length;

  if (!key || !data || totalRows === 0) {
    return { value: null, formatted: '—' };
  }

  if (calculationId === 'none' || !calculationId) {
    return { value: null, formatted: '—' };
  }

  // Formatadores específicos por categoria de cálculo:
  // - Contar: número inteiro puro
  const fmtCount = (value) => (value == null ? '—' : String(Math.round(value)));
  // - Porcentagem: formato percentual com 1 casa decimal
  const fmtPct = (value) => {
    if (value == null) return '—';
    return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
  };
  // - Números: usa o format da coluna quando existir e for numérico, senão formato numérico padrão
  const fmtNumber = (value) => {
    if (value == null) return '—';
    const numericFormats = ['money', 'percentage', 'number', 'integer'];
    const effectiveFormat = numericFormats.includes(columnFormat) ? columnFormat : 'number';
    return formatDisplayValue(value, effectiveFormat);
  };
  // - Data: sempre dd/mm/yyyy brasileiro
  const fmtDate = (value) => {
    if (value == null) return '—';
    return formatDisplayValue(value, 'date');
  };

  // --- Common: count helpers ---
  const countEmpty = () => {
    return data.filter((row) => isEmpty(row[key])).length;
  };
  const countNonEmpty = () => {
    return data.filter((row) => !isEmpty(row[key])).length;
  };
  const allValues = () => {
    return data.flatMap((row) => getCellValues(row[key]));
  };
  const uniqueValues = () => {
    return [...new Set(allValues().map(String))];
  };

  switch (calculationId) {
    case 'countAll':
      return { value: totalRows, formatted: fmtCount(totalRows) };

    case 'countValues': {
      const n = allValues().length;
      return { value: n, formatted: fmtCount(n) };
    }

    case 'countUnique': {
      const n = uniqueValues().length;
      return { value: n, formatted: fmtCount(n) };
    }

    case 'countEmpty': {
      const n = countEmpty();
      return { value: n, formatted: fmtCount(n) };
    }

    case 'countNonEmpty': {
      const n = countNonEmpty();
      return { value: n, formatted: fmtCount(n) };
    }

    case 'pctEmpty': {
      const n = countEmpty();
      const pct = totalRows === 0 ? 0 : (n / totalRows) * 100;
      return { value: pct, formatted: fmtPct(pct) };
    }

    case 'pctNonEmpty': {
      const n = countNonEmpty();
      const pct = totalRows === 0 ? 0 : (n / totalRows) * 100;
      return { value: pct, formatted: fmtPct(pct) };
    }

    case 'pctByGroup': {
      const groupValue = options.groupValue;
      if (groupValue == null && groupValue !== '') {
        return { value: null, formatted: '—' };
      }
      const count = data.filter((row) => {
        const vals = getCellValues(row[key]);
        return vals.some((v) => String(v) === String(groupValue));
      }).length;
      const pct = totalRows === 0 ? 0 : (count / totalRows) * 100;
      return { value: pct, label: `${count} de ${totalRows}`, formatted: fmtPct(pct) };
    }
  }

  // --- Number-only ---
  if (colType === 'number') {
    const nums = data.flatMap((row) => {
      const vals = getCellValues(row[key]);
      return vals.map(toNumber).filter((n) => !Number.isNaN(n));
    });

    switch (calculationId) {
      case 'sum': {
        const s = nums.reduce((a, b) => a + b, 0);
        return { value: s, formatted: fmtNumber(s) };
      }
      case 'average': {
        if (nums.length === 0) return { value: null, formatted: '—' };
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        return { value: avg, formatted: fmtNumber(avg) };
      }
      case 'median': {
        if (nums.length === 0) return { value: null, formatted: '—' };
        const m = median(nums);
        return { value: m, formatted: fmtNumber(m) };
      }
      case 'min': {
        if (nums.length === 0) return { value: null, formatted: '—' };
        const min = Math.min(...nums);
        return { value: min, formatted: fmtNumber(min) };
      }
      case 'max': {
        if (nums.length === 0) return { value: null, formatted: '—' };
        const max = Math.max(...nums);
        return { value: max, formatted: fmtNumber(max) };
      }
      case 'range': {
        if (nums.length === 0) return { value: null, formatted: '—' };
        const r = Math.max(...nums) - Math.min(...nums);
        return { value: r, formatted: fmtNumber(r) };
      }
    }
  }

  // --- Date-only ---
  if (colType === 'date') {
    const timestamps = data.flatMap((row) => {
      const vals = getCellValues(row[key]);
      return vals.map(toDateMs).filter((t) => t != null);
    });

    switch (calculationId) {
      case 'dateEarliest': {
        if (timestamps.length === 0) return { value: null, formatted: '—' };
        const t = Math.min(...timestamps);
        return { value: t, formatted: fmtDate(t) };
      }
      case 'dateLatest': {
        if (timestamps.length === 0) return { value: null, formatted: '—' };
        const t = Math.max(...timestamps);
        return { value: t, formatted: fmtDate(t) };
      }
      case 'dateRange': {
        if (timestamps.length === 0) return { value: null, formatted: '—' };
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        const rangeStr = formatDateRange(max - min);
        return { value: max - min, formatted: rangeStr };
      }
    }
  }

  return { value: null, formatted: '—' };
}

/**
 * Get unique values for a column (for select "por grupo").
 * @param {Array<Object>} data
 * @param {string} columnKey
 * @returns {Array<*>}
 */
export function getUniqueColumnValues(data, columnKey) {
  if (!data || !columnKey) return [];
  const set = new Set();
  data.forEach((row) => {
    const vals = getCellValues(row[columnKey]);
    vals.forEach((v) => set.add(v));
  });
  return [...set];
}

/** Option definitions for UI: id, label, tooltip, category (count | percentage | number | date | selectGroup) */
export const CALCULATION_OPTIONS = {
  none: {
    id: 'none',
    label: 'Nenhum',
    labelShort: 'Nenhum',
    tooltip: 'Não exibir cálculo para esta coluna.',
    category: 'common',
  },
  countAll: {
    id: 'countAll',
    label: 'Contar Todos',
    labelShort: 'Todos',
    tooltip: 'Número total de linhas da tabela (incluindo vazias).',
    category: 'count',
  },
  countValues: {
    id: 'countValues',
    label: 'Contar Valores',
    labelShort: 'Valores',
    tooltip: 'Quantidade de valores preenchidos. Em colunas com vários itens (ex.: etiquetas), cada item é contado.',
    category: 'count',
  },
  countUnique: {
    id: 'countUnique',
    label: 'Contar Valores únicos',
    labelShort: 'Únicos',
    tooltip: 'Quantidade de valores diferentes. Valores repetidos em várias linhas contam uma vez.',
    category: 'count',
  },
  countEmpty: {
    id: 'countEmpty',
    label: 'Contar vazios',
    labelShort: 'Vazios',
    tooltip: 'Quantidade de linhas com célula vazia.',
    category: 'count',
  },
  countNonEmpty: {
    id: 'countNonEmpty',
    label: 'Contar não vazios',
    labelShort: 'Não vazios',
    tooltip: 'Quantidade de linhas com pelo menos um valor preenchido.',
    category: 'count',
  },
  pctEmpty: {
    id: 'pctEmpty',
    label: 'Porcentagem de vazios',
    labelShort: 'Vazios',
    tooltip: 'Percentual de linhas vazias em relação ao total.',
    category: 'percentage',
  },
  pctNonEmpty: {
    id: 'pctNonEmpty',
    label: 'Porcentagem de não vazios',
    labelShort: 'Não vazios',
    tooltip: 'Percentual de linhas não vazias em relação ao total.',
    category: 'percentage',
  },
  pctByGroup: {
    id: 'pctByGroup',
    label: 'Porcentagem por grupo',
    labelShort: 'Por grupo',
    tooltip: 'Mostra a porcentagem de cada valor em relação ao total de linhas. Escolha um valor para ver o percentual.',
    category: 'selectGroup',
  },
  sum: {
    id: 'sum',
    label: 'Somar',
    labelShort: 'Somar',
    tooltip: 'Soma dos valores numéricos da coluna.',
    category: 'number',
  },
  average: {
    id: 'average',
    label: 'Média',
    labelShort: 'Média',
    tooltip: 'Soma todos os valores e divide pela quantidade de valores.',
    category: 'number',
  },
  median: {
    id: 'median',
    label: 'Mediana',
    labelShort: 'Mediana',
    tooltip: 'Valor central da lista ordenada. Se a quantidade for par, é a média dos dois valores centrais.',
    category: 'number',
  },
  min: {
    id: 'min',
    label: 'Mínimo',
    labelShort: 'Mínimo',
    tooltip: 'Menor valor numérico da coluna.',
    category: 'number',
  },
  max: {
    id: 'max',
    label: 'Máximo',
    labelShort: 'Máximo',
    tooltip: 'Maior valor numérico da coluna.',
    category: 'number',
  },
  range: {
    id: 'range',
    label: 'Faixa',
    labelShort: 'Faixa',
    tooltip: 'Diferença entre o maior e o menor valor.',
    category: 'number',
  },
  dateEarliest: {
    id: 'dateEarliest',
    label: 'Mais antiga',
    labelShort: 'Mais antiga',
    tooltip: 'Data mais antiga na coluna.',
    category: 'date',
  },
  dateLatest: {
    id: 'dateLatest',
    label: 'Mais recente',
    labelShort: 'Mais recente',
    tooltip: 'Data mais recente na coluna.',
    category: 'date',
  },
  dateRange: {
    id: 'dateRange',
    label: 'Faixa',
    labelShort: 'Faixa',
    tooltip: 'Intervalo de tempo entre a data mais antiga e a mais recente.',
    category: 'date',
  },
};
