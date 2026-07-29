import { VIEW_SETTINGS, VIEW_KEY_ALIASES, LIST_FIELD_ROLES } from './constants';

/**
 * Normaliza chave de view (ex.: kanban → board).
 * @param {string} viewKey
 * @returns {string}
 */
export function normalizeViewKey(viewKey) {
  if (!viewKey) return 'grid';
  return VIEW_KEY_ALIASES[viewKey] || viewKey;
}

/**
 * Intersecta showSettingsOptions com as opções permitidas para a view atual.
 * @param {string[]} showSettingsOptions
 * @param {string} currentView
 * @returns {string[]}
 */
export function resolveSettingsOptionsForView(showSettingsOptions = [], currentView = 'grid') {
  const view = normalizeViewKey(currentView);
  const allowed = VIEW_SETTINGS[view] || VIEW_SETTINGS.grid;
  const requested = Array.isArray(showSettingsOptions) ? showSettingsOptions : [];
  return requested.filter((key) => allowed.includes(key));
}

/**
 * Resolve fields config da view (list/board/calendar/timeline).
 * @param {string} currentView
 * @param {object} options - merged options
 * @returns {{ key: string, role: string }[]}
 */
export function getViewFieldsConfig(currentView, options = {}) {
  const view = normalizeViewKey(currentView);
  const listFields = options.listConfig?.fields ?? [];

  switch (view) {
    case 'list':
      return Array.isArray(options.listConfig?.fields) ? options.listConfig.fields : [];
    case 'board': {
      const boardFields = options.boardConfig?.fields;
      if (Array.isArray(boardFields) && boardFields.length > 0) return boardFields;
      return listFields;
    }
    case 'calendar':
      return Array.isArray(options.calendarConfig?.fields) ? options.calendarConfig.fields : [];
    case 'timeline': {
      const timelineFields = options.timelineConfig?.fields;
      if (Array.isArray(timelineFields) && timelineFields.length > 0) return timelineFields;
      return listFields;
    }
    default:
      return [];
  }
}

/**
 * Keys de colunas ativas na view atual (para calcular / filtrar UI).
 * Em grid, retorna null (= todas as leaf calculáveis/visíveis).
 * @param {string} currentView
 * @param {object} options
 * @param {object} [columnVisibility]
 * @returns {string[]|null}
 */
export function getViewActiveColumnKeys(currentView, options = {}, columnVisibility = {}) {
  const view = normalizeViewKey(currentView);
  if (view === 'grid') return null;

  const fields = getViewFieldsConfig(view, options);
  const keys = fields
    .map((f) => f?.key)
    .filter(Boolean)
    .filter((key) => columnVisibility[key] !== false);

  if (view === 'board' && options.boardConfig?.columnKey) {
    const base = options.boardConfig.columnKey;
    if (!keys.includes(base)) keys.push(base);
  }

  if (view === 'calendar') {
    const cfg = options.calendarConfig || {};
    [cfg.dateKey, cfg.startDateKey, cfg.endDateKey].filter(Boolean).forEach((k) => {
      if (!keys.includes(k)) keys.push(k);
    });
  }

  if (view === 'timeline') {
    const cfg = options.timelineConfig || {};
    [cfg.dateKey, cfg.startDateKey, cfg.endDateKey].filter(Boolean).forEach((k) => {
      if (!keys.includes(k)) keys.push(k);
    });
  }

  return keys;
}

/**
 * Agrupa fields por role.
 * @param {{ key: string, role: string }[]} fields
 * @returns {{ icone: object|null, id: object|null, principal: object|null, adicionais: object[] }}
 */
export function groupFieldsByRole(fields = []) {
  const result = {
    icone: null,
    id: null,
    principal: null,
    adicionais: [],
  };

  for (const field of fields) {
    if (!field?.key || !field?.role) continue;
    if (field.role === LIST_FIELD_ROLES.icone && !result.icone) {
      result.icone = field;
    } else if (field.role === LIST_FIELD_ROLES.id && !result.id) {
      result.id = field;
    } else if (field.role === LIST_FIELD_ROLES.principal && !result.principal) {
      result.principal = field;
    } else if (field.role === LIST_FIELD_ROLES.adicionais) {
      result.adicionais.push(field);
    }
  }

  return result;
}

/**
 * Normaliza lista de tableViews (aplica alias kanban→board, dedupe).
 * @param {string[]} tableViews
 * @returns {string[]}
 */
export function normalizeTableViews(tableViews = []) {
  const seen = new Set();
  const result = [];
  for (const raw of tableViews) {
    const key = normalizeViewKey(raw);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}
