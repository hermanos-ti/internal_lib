export const DEFAULT_OPTIONS = {
  showHeader: true,
  showFooter: true,
  showToolbar: true,
  showPagination: true,
  itensPerPage: 10,
  itensPerPageOptions: [10, 25, 50, 100],
  showTableTitle: true,
  tableIcon: 'fas fa-table',
  tableName: 'Tabela',
  tableSubtitle: null, // string
  columnMinWidth: 'auto',
  showSearch: true,
  showSorts: true,
  showFilters: true,
  showSettings: true,
  showSettingsOptions: ['colunasVisiveis', 'agrupar', 'calcular', 'importar', 'exportar'],
  additionalSettingsOptions: [], //{ key: '', label: '', icon: 'far fa-<icon-name>', tooltip: 'Tooltip text', onClick: () => {}},
  currentTableView: 'grid',
  showTableViews: true,
  tableViews: ['grid', 'list', 'kanban', 'calendar'],
  additionalTableViews: [], // { key: '', label: '', icon: 'far fa-<icon-name>', render: (columns, data, footer) => {}},
  onTableViewChange: null, // (tableView) => {}
  filterMode: 'internal',
  onFilterChange: null, // (filters, sqlWhere) => {}
  selectable: false,
  selectionMode: 'multiple', // 'multiple' | 'single' — single = radio-like, only one item at a time
  onSelectionChange: null, // (selectedRows: object[]) => void
  selectionRef: null, // React ref — receives { select, deselect, getSelected }
  onClick: null, // (event: { row, column, cell, rowIndex, colIndex }) => void
  onDoubleClick: null, // (event: { row, column, cell, rowIndex, colIndex }) => void
  editable: false,
  editRef: null, // React ref — receives { getData, getEditedRows, resetEdits, setRowStatus, clearRowStatus }
  onEditChange: null, // (allData: object[], changedRow: object, changedColumn: string) => void
  onSave: null, // (allData: object[], editedRows: object[]) => void
  importConfig: null, // { columns: [{ key, label, format, obrigatorio?, validator }] }
  onImportComplete: null, // (importedData: object[]) => void
}

/**
 * Supported column display formats. Used in cells (when no custom render) and in calculation footer.
 * @see formatUtils.formatDisplayValue
 */
export const COLUMN_FORMATS = {
  text: 'text',
  money: 'money',
  percentage: 'percentage',
  number: 'number',
  integer: 'integer',
  date: 'date',
  datetime: 'datetime',
};

export const DEFAULT_COLUMN_CONFIG = {
  type: 'text', // text, number, date, select
  visible: true,
  width: 'auto',
  align: 'left',
  format: 'text', // COLUMN_FORMATS: text | money | percentage | number | integer | date | datetime
  searchable: true,
  sortable: true,
  filterable: true,
  groupable: false,
  calculable: true, // false = column does not appear in calculation modal or footer calculation row
  render: null, // render(value, row, column, rowIndex, colIndex)
  subColumns: null, // Array de subcolunas ou null
  className: '',
  style: {},
  cellClassName: '',
  cellStyle: {},
  editable: false, // false | true | { type: 'text' } | { type: 'select', options: [], multiple: false }
}

export const DEFAULT_FOOTER_CONFIG = {
  visible: true,
  align: 'center',
  render: null, // render(value, row, column, rowIndex, colIndex)
  value: null,
  className: '',
  style: {},
}

export const COLUMN_ICONS = {
  text: 'fas fa-font-case',
  number: 'fas fa-hashtag',
  date: 'fas fa-calendar-alt',
  select: 'fas fa-circle-caret-down',
}

export const FILTER_CONDITIONS = {
  text: [
    { value: 'is', label: 'é' },
    { value: 'isNot', label: 'não é' },
    { value: 'contains', label: 'contém' },
    { value: 'notContains', label: 'não contém' },
    { value: 'startsWith', label: 'começa com' },
    { value: 'endsWith', label: 'termina com' },
    { value: 'isEmpty', label: 'é vazio' },
    { value: 'isNotEmpty', label: 'não é vazio' },
  ],
  number: [
    { value: 'equals', label: 'igual' },
    { value: 'notEquals', label: 'diferente' },
    { value: 'greaterThan', label: 'maior' },
    { value: 'lessThan', label: 'menor' },
    { value: 'greaterOrEqual', label: 'maior ou igual' },
    { value: 'lessOrEqual', label: 'menor ou igual' },
    { value: 'isEmpty', label: 'é vazio' },
    { value: 'isNotEmpty', label: 'não é vazio' },
  ],
  date: [
    { value: 'is', label: 'é' },
    { value: 'isBefore', label: 'é antes' },
    { value: 'isAfter', label: 'é depois' },
    { value: 'isOnOrBefore', label: 'até' },
    { value: 'isOnOrAfter', label: 'a partir de' },
    { value: 'isBetween', label: 'é entre' },
    { value: 'isEmpty', label: 'é vazio' },
    { value: 'isNotEmpty', label: 'não é vazio' },
  ],
  select: [
    { value: 'is', label: 'é' },
    { value: 'isNot', label: 'não é' },
    { value: 'isEmpty', label: 'é vazio' },
    { value: 'isNotEmpty', label: 'não é vazio' },
  ],
}

export const EMPTY_CONDITIONS = ['isEmpty', 'isNotEmpty']

export const RANGE_CONDITIONS = ['isBetween']

export const DEFAULT_FILTER = {
  id: null,
  key: null,
  label: null,
  type: 'text',
  condition: 'is',
  value: '',
  valueTo: '',
  isAdvanced: false,
}

export const DEFAULT_FILTER_GROUP = {
  id: null,
  isAdvanced: true,
  label: 'Filtro Avançado',
  logic: 'AND',
  rules: [],
}

export const TABLE_VIEWS = {
  grid: { key: 'grid', label: 'Grade', icon: 'fas fa-th' },
  list: { key: 'list', label: 'Lista', icon: 'fas fa-list' },
  kanban: { key: 'kanban', label: 'Kanban', icon: 'fas fa-th-large' },
  calendar: { key: 'calendar', label: 'Calendário', icon: 'fas fa-calendar-days' },
}

// ============================================
// Mapeamento de Condições para SQL
// ============================================

export const CONDITION_TO_SQL = {
  // Text conditions (LIKE wildcards escaped)
  is: (column, value) => `${column} = '${escapeSqlString(value)}'`,
  isNot: (column, value) => `${column} <> '${escapeSqlString(value)}'`,
  contains: (column, value) => `${column} LIKE ('%${escapeLikeWildcards(value)}%')`,
  notContains: (column, value) => `${column} NOT LIKE ('%${escapeLikeWildcards(value)}%')`,
  startsWith: (column, value) => `${column} LIKE ('${escapeLikeWildcards(value)}%')`,
  endsWith: (column, value) => `${column} LIKE ('%${escapeLikeWildcards(value)}')`,
  
  // Number conditions (sanitized to prevent injection)
  equals: (column, value) => `${column} = ${sanitizeNumericValue(value)}`,
  notEquals: (column, value) => `${column} <> ${sanitizeNumericValue(value)}`,
  greaterThan: (column, value) => `${column} > ${sanitizeNumericValue(value)}`,
  lessThan: (column, value) => `${column} < ${sanitizeNumericValue(value)}`,
  greaterOrEqual: (column, value) => `${column} >= ${sanitizeNumericValue(value)}`,
  lessOrEqual: (column, value) => `${column} <= ${sanitizeNumericValue(value)}`,
  
  // Date conditions (escaped via escapeSqlString)
  isBefore: (column, value) => `${column} < '${escapeSqlString(value)}'`,
  isAfter: (column, value) => `${column} > '${escapeSqlString(value)}'`,
  isOnOrBefore: (column, value) => `${column} <= '${escapeSqlString(value)}'`,
  isOnOrAfter: (column, value) => `${column} >= '${escapeSqlString(value)}'`,
  isBetween: (column, value, valueTo) => `${column} BETWEEN '${escapeSqlString(value)}' AND '${escapeSqlString(valueTo)}'`,
  
  // Empty conditions
  isEmpty: (column) => `(${column} IS NULL OR ${column} = '')`,
  isNotEmpty: (column) => `(${column} IS NOT NULL AND ${column} <> '')`,
}

// Mapeamento de condições para símbolos/operadores visuais
const CONDITION_TO_SYMBOL = {
  // Text
  is: 'é',
  isNot: '≠',
  contains: 'contém',
  notContains: 'não contém',
  startsWith: 'começa com',
  endsWith: 'termina com',
  isEmpty: 'é vazio',
  isNotEmpty: 'não é vazio',
  
  // Number
  equals: '=',
  notEquals: '≠',
  greaterThan: '>',
  lessThan: '<',
  greaterOrEqual: '≥',
  lessOrEqual: '≤',
  
  // Date
  isBefore: '<',
  isAfter: '>',
  isOnOrBefore: '≤',
  isOnOrAfter: '≥',
  isBetween: 'entre',
}

/**
 * Gera texto de exibição para um filtro
 * @param {Object} filter - Objeto de filtro
 * @param {Array} columns - Array de colunas disponíveis
 * @returns {string} Texto formatado para exibição
 */
export const getFilterDisplayText = (filter, columns) => {
  // Se for filtro avançado, retornar label genérico
  if (filter.isAdvanced) {
    return filter.label || 'Filtro Avançado';
  }

  // Buscar coluna correspondente
  const column = columns?.find(col => col.key === filter.key);
  const columnLabel = column?.title || filter.label || filter.key || 'Coluna';
  
  // Se não houver condição, retornar apenas o label da coluna
  if (!filter.condition) {
    return columnLabel;
  }

  // Buscar label da condição
  const columnType = column?.type || filter.type || 'text';
  const conditions = FILTER_CONDITIONS[columnType] || FILTER_CONDITIONS.text;
  const conditionObj = conditions.find(c => c.value === filter.condition);
  const conditionLabel = conditionObj?.label || CONDITION_TO_SYMBOL[filter.condition] || filter.condition;

  // Condições que não precisam de valor
  if (EMPTY_CONDITIONS.includes(filter.condition)) {
    return `${columnLabel} ${conditionLabel}`;
  }

  // Condição "entre" precisa de dois valores
  if (RANGE_CONDITIONS.includes(filter.condition)) {
    const value = filter.value || '';
    const valueTo = filter.valueTo || '';
    if (value && valueTo) {
      return `${columnLabel} ${conditionLabel} ${value} e ${valueTo}`;
    } else if (value) {
      return `${columnLabel} ${conditionLabel} ${value}`;
    } else {
      return columnLabel;
    }
  }

  // Condições normais com valor
  const value = filter.value || '';
  if (value) {
    // Para condições numéricas, usar símbolo ao invés de texto
    if (['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterOrEqual', 'lessOrEqual'].includes(filter.condition)) {
      const symbol = CONDITION_TO_SYMBOL[filter.condition] || conditionLabel;
      return `${columnLabel} ${symbol} ${value}`;
    }
    return `${columnLabel} ${conditionLabel} ${value}`;
  }

  // Sem valor ainda
  return columnLabel;
}

/**
 * Escapa caracteres especiais para SQL
 */
function escapeSqlString(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/'/g, "''");
}

/**
 * Escapa wildcards LIKE (% e _) para uso seguro em expressões SQL LIKE.
 */
function escapeLikeWildcards(str) {
  return escapeSqlString(str).replace(/%/g, '[%]').replace(/_/g, '[_]');
}

/**
 * Valida e sanitiza um valor numérico para interpolação segura em SQL.
 * Retorna '0' se o valor não for um número finito válido.
 */
function sanitizeNumericValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '0';
}

/**
 * Escapa um identificador SQL (nome de coluna) usando bracket notation.
 */
function escapeColumnIdentifier(column) {
  if (column === null || column === undefined) return '[]';
  return `[${String(column).replace(/\]/g, ']]')}]`;
}

/**
 * Converte uma regra individual para SQL
 */
function ruleToSQL(rule, columns) {
  if (!rule || rule.type === 'group') return null;
  
  const column = columns?.find(c => c.key === rule.key);
  const columnName = escapeColumnIdentifier(column?.sqlColumn || rule.key);
  const condition = rule.condition;
  const value = rule.value;
  const valueTo = rule.valueTo;
  
  const sqlGenerator = CONDITION_TO_SQL[condition];
  if (!sqlGenerator) return null;
  
  // Empty conditions don't need value
  if (EMPTY_CONDITIONS.includes(condition)) {
    return sqlGenerator(columnName);
  }
  
  // Range conditions need both values
  if (RANGE_CONDITIONS.includes(condition)) {
    return sqlGenerator(columnName, value, valueTo);
  }
  
  // Regular conditions
  return sqlGenerator(columnName, value);
}

/**
 * Converte um grupo de regras para SQL (recursivo)
 */
function groupToSQL(group, columns) {
  if (!group || !group.rules || group.rules.length === 0) return '';
  
  const parts = [];
  
  for (let i = 0; i < group.rules.length; i++) {
    const item = group.rules[i];
    let sqlPart = '';
    
    if (item.type === 'group') {
      sqlPart = groupToSQL(item, columns);
      if (sqlPart) {
        sqlPart = `(${sqlPart})`;
      }
    } else {
      sqlPart = ruleToSQL(item, columns);
    }
    
    if (sqlPart) {
      // Add logic operator (AND/OR) before the part, except for the first one
      if (parts.length > 0) {
        const logic = item.logic || group.logic || 'AND';
        parts.push(` ${logic} `);
      }
      parts.push(sqlPart);
    }
  }
  
  return parts.join('');
}

/**
 * Converte a estrutura de filtro avançado para uma cláusula WHERE em PL/SQL
 * 
 * @param {Object} filterGroup - Grupo de filtro avançado
 * @param {Array} columns - Array de colunas da tabela (opcional, para mapear nomes SQL)
 * @param {boolean} includeWhere - Se deve incluir "WHERE" no início (padrão: true)
 * @returns {string} Cláusula SQL WHERE
 * 
 * @example
 * const filter = {
 *   logic: 'AND',
 *   rules: [
 *     { type: 'rule', key: 'nome', condition: 'contains', value: 'João' },
 *     { type: 'rule', key: 'idade', condition: 'greaterThan', value: 18, logic: 'AND' }
 *   ]
 * };
 * 
 * filterToSQL(filter);
 * // => "WHERE nome LIKE '%João%' AND idade > 18"
 */
export function filterToSQL(filterGroup, columns = [], includeWhere = true) {
  if (!filterGroup || !filterGroup.rules || filterGroup.rules.length === 0) {
    return '';
  }
  
  const sql = groupToSQL(filterGroup, columns);
  
  if (!sql) return '';
  
  return includeWhere ? `WHERE ${sql}` : sql;
}

/**
 * Converte múltiplos filtros simples para SQL
 * 
 * @param {Array} filters - Array de filtros simples
 * @param {Array} columns - Array de colunas da tabela
 * @param {string} logic - Lógica entre filtros ('AND' ou 'OR')
 * @param {boolean} includeWhere - Se deve incluir "WHERE" no início
 * @returns {string} Cláusula SQL WHERE
 */
export function filtersToSQL(filters, columns = [], logic = 'AND', includeWhere = true) {
  if (!filters || filters.length === 0) return '';
  
  const parts = [];
  
  for (const filter of filters) {
    if (filter.isAdvanced && filter.rules) {
      // Advanced filter (group)
      const groupSql = groupToSQL(filter, columns);
      if (groupSql) {
        parts.push(`(${groupSql})`);
      }
    } else {
      // Simple filter
      const ruleSql = ruleToSQL(filter, columns);
      if (ruleSql) {
        parts.push(ruleSql);
      }
    }
  }
  
  if (parts.length === 0) return '';
  
  const sql = parts.join(` ${logic} `);
  return includeWhere ? `WHERE ${sql}` : sql;
}