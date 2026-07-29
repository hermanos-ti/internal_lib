/**
 * Date helpers for Calendar and Timeline views.
 */

const LOCALE_BR = 'pt-BR';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Parse value to Date at local midnight (date-only) or full datetime.
 * Accepts Date, number (ms), ISO, and dd/MM/yyyy (pt-BR).
 * @param {*} value
 * @param {{ dateOnly?: boolean }} [options]
 * @returns {Date|null}
 */
export function parseViewDate(value, options = {}) {
  const { dateOnly = true } = options;
  if (value == null || value === '') return null;

  let date = null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    date = new Date(value.getTime());
  } else if (typeof value === 'number' && !Number.isNaN(value)) {
    date = new Date(value);
  } else {
    const str = String(value).trim();
    const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (brMatch) {
      const [, d, m, y, hh, mm, ss] = brMatch;
      date = new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        hh != null ? Number(hh) : 0,
        mm != null ? Number(mm) : 0,
        ss != null ? Number(ss) : 0
      );
    } else {
      const parsed = new Date(str);
      if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
  }

  if (!date || Number.isNaN(date.getTime())) return null;

  if (dateOnly) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  return date;
}

export function startOfDay(date) {
  const d = parseViewDate(date, { dateOnly: true });
  return d;
}

export function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date, months) {
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return d;
}

export function addYears(date, years) {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function isSameMonth(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Local YYYY-MM-DD key (avoids UTC shift from toISOString). */
export function toDateKey(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function compareDays(a, b) {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function formatMonthLabel(date) {
  if (!date) return '';
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDayNumber(date) {
  return date ? String(date.getDate()) : '';
}

/**
 * Monday-first calendar matrix for a month.
 * @param {Date} monthDate - any date in the target month
 * @returns {Date[][]} weeks of 7 days
 */
export function buildMonthWeeks(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  // JS: 0=Sun..6=Sat → Monday-first offset
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -mondayOffset);

  const weeks = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    // Stop if next week is entirely next month and we already have the month covered
    if (w >= 3 && cursor.getMonth() !== month) break;
  }
  return weeks;
}

export const WEEKDAY_LABELS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Resolve item start/end from calendar/timeline config.
 * @param {object} item
 * @param {{ dateKey?: string, startDateKey?: string, endDateKey?: string }} config
 * @returns {{ start: Date|null, end: Date|null, isRange: boolean }}
 */
export function getItemDateRange(item, config = {}) {
  const { dateKey, startDateKey, endDateKey } = config;

  if (startDateKey || endDateKey) {
    const start = parseViewDate(item[startDateKey]);
    const end = parseViewDate(item[endDateKey]) || start;
    if (!start && !end) return { start: null, end: null, isRange: true };
    const s = start || end;
    const e = end || start;
    return { start: s, end: e, isRange: true };
  }

  if (dateKey) {
    const start = parseViewDate(item[dateKey]);
    return { start, end: start, isRange: false };
  }

  return { start: null, end: null, isRange: false };
}

/**
 * Split a date range into per-week segments for calendar rendering.
 * @param {Date} start
 * @param {Date} end
 * @param {Date[][]} weeks
 * @returns {{ weekIndex: number, startCol: number, endCol: number, continuesLeft: boolean, continuesRight: boolean }[]}
 */
export function splitRangeIntoWeekSegments(start, end, weeks) {
  if (!start || !end || !weeks?.length) return [];
  const s = startOfDay(start);
  const e = startOfDay(end);
  if (e < s) return [];

  const segments = [];

  weeks.forEach((week, weekIndex) => {
    const weekStart = week[0];
    const weekEnd = week[6];
    if (e < weekStart || s > weekEnd) return;

    let startCol = 0;
    let endCol = 6;
    let continuesLeft = false;
    let continuesRight = false;

    for (let i = 0; i < 7; i++) {
      if (isSameDay(week[i], s) || (week[i] > s && i === 0 && s < weekStart)) {
        // handled below
      }
    }

    if (s < weekStart) {
      startCol = 0;
      continuesLeft = true;
    } else {
      startCol = week.findIndex((d) => isSameDay(d, s));
      if (startCol < 0) startCol = 0;
    }

    if (e > weekEnd) {
      endCol = 6;
      continuesRight = true;
    } else {
      endCol = week.findIndex((d) => isSameDay(d, e));
      if (endCol < 0) endCol = 6;
    }

    if (startCol <= endCol) {
      segments.push({ weekIndex, startCol, endCol, continuesLeft, continuesRight });
    }
  });

  return segments;
}

/**
 * Greedy lane packing for calendar range segments within one week.
 * Prefers a stable lane per itemKey when provided.
 *
 * @param {{ startCol: number, endCol: number, itemKey?: string|number }[]} segments
 * @returns {{ lane: number, startCol: number, endCol: number, itemKey?: string|number }[]}
 */
export function assignLanes(segments = []) {
  if (!segments.length) return [];

  const sorted = [...segments].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return (b.endCol - b.startCol) - (a.endCol - a.startCol);
  });

  /** @type {number[]} laneEndCols — last endCol occupied per lane */
  const laneEnds = [];
  const preferredLaneByKey = new Map();

  return sorted.map((seg) => {
    let lane = -1;
    const key = seg.itemKey;
    if (key != null && preferredLaneByKey.has(key)) {
      const preferred = preferredLaneByKey.get(key);
      if (laneEnds[preferred] == null || seg.startCol > laneEnds[preferred]) {
        lane = preferred;
      }
    }

    if (lane < 0) {
      for (let i = 0; i < laneEnds.length; i++) {
        if (seg.startCol > laneEnds[i]) {
          lane = i;
          break;
        }
      }
    }

    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(seg.endCol);
    } else {
      laneEnds[lane] = seg.endCol;
    }

    if (key != null) preferredLaneByKey.set(key, lane);

    return { ...seg, lane };
  });
}

/**
 * Format a date or date range for tooltips (pt-BR).
 * @param {Date|null} start
 * @param {Date|null} end
 * @returns {string}
 */
export function formatDateRangeLabel(start, end) {
  if (!start) return '';
  const fmt = (d) => d.toLocaleDateString(LOCALE_BR);
  if (!end || isSameDay(start, end)) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Timeline period column widths (px) */
export const TIMELINE_PERIOD_CONFIG = {
  hours: { columnMs: 60 * 60 * 1000, columnWidth: 48, label: (d) => `${String(d.getHours()).padStart(2, '0')}h` },
  days: { columnMs: 24 * 60 * 60 * 1000, columnWidth: 44, label: (d) => String(d.getDate()) },
  weeks: { columnMs: 7 * 24 * 60 * 60 * 1000, columnWidth: 72, label: (d) => `S${getWeekNumber(d)}` },
  months: { columnMs: 30 * 24 * 60 * 60 * 1000, columnWidth: 96, label: (d) => d.toLocaleDateString(LOCALE_BR, { month: 'short' }) },
  years: { columnMs: 365 * 24 * 60 * 60 * 1000, columnWidth: 120, label: (d) => String(d.getFullYear()) },
};

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Build sticky period groups for timeline header (e.g. months while viewing days).
 * @param {Date} rangeStart
 * @param {number} columnCount
 * @param {string} period
 * @returns {{ label: string, startIndex: number, span: number }[]}
 */
export function buildTimelineStickyGroups(rangeStart, columnCount, period) {
  const cfg = TIMELINE_PERIOD_CONFIG[period] || TIMELINE_PERIOD_CONFIG.days;
  const groups = [];
  let currentLabel = null;
  let startIndex = 0;
  let span = 0;

  for (let i = 0; i < columnCount; i++) {
    const d = new Date(rangeStart.getTime() + i * cfg.columnMs);
    let label;
    if (period === 'hours') {
      label = formatMonthLabel(d) + ` · ${String(d.getDate()).padStart(2, '0')}`;
    } else if (period === 'days' || period === 'weeks') {
      label = formatMonthLabel(d);
    } else if (period === 'months') {
      label = String(d.getFullYear());
    } else {
      label = String(Math.floor(d.getFullYear() / 10) * 10) + 's';
    }

    if (label !== currentLabel) {
      if (currentLabel != null) {
        groups.push({ label: currentLabel, startIndex, span });
      }
      currentLabel = label;
      startIndex = i;
      span = 1;
    } else {
      span += 1;
    }
  }
  if (currentLabel != null) {
    groups.push({ label: currentLabel, startIndex, span });
  }
  return groups;
}

/**
 * Position a bar on the timeline in px.
 * @param {Date} start
 * @param {Date} end
 * @param {Date} rangeStart
 * @param {string} period
 * @returns {{ left: number, width: number }|null}
 */
export function getTimelineBarPosition(start, end, rangeStart, period) {
  if (!start || !rangeStart) return null;
  const cfg = TIMELINE_PERIOD_CONFIG[period] || TIMELINE_PERIOD_CONFIG.days;
  const s = start.getTime();
  const e = (end || start).getTime();
  const origin = rangeStart.getTime();
  const left = ((s - origin) / cfg.columnMs) * cfg.columnWidth;
  const width = Math.max(cfg.columnWidth * 0.85, ((e - s) / cfg.columnMs) * cfg.columnWidth + cfg.columnWidth * 0.15);
  return { left, width };
}

/**
 * Default visible window size (columns) per period.
 */
export function getDefaultTimelineColumnCount(period) {
  switch (period) {
    case 'hours': return 48;
    case 'days': return 42;
    case 'weeks': return 26;
    case 'months': return 24;
    case 'years': return 12;
    default: return 42;
  }
}

/**
 * Align range start for period (start of day/week/month/year/hour).
 */
export function alignTimelineStart(date, period) {
  const d = parseViewDate(date, { dateOnly: period !== 'hours' }) || new Date();
  if (period === 'hours') {
    const full = parseViewDate(date, { dateOnly: false }) || new Date();
    return new Date(full.getFullYear(), full.getMonth(), full.getDate(), full.getHours(), 0, 0, 0);
  }
  if (period === 'weeks') {
    const offset = (d.getDay() + 6) % 7;
    return addDays(d, -offset);
  }
  if (period === 'months') {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  if (period === 'years') {
    return new Date(d.getFullYear(), 0, 1);
  }
  return d;
}

/**
 * Shift timeline window by one "page".
 */
export function shiftTimelineStart(rangeStart, period, direction) {
  const cfg = TIMELINE_PERIOD_CONFIG[period] || TIMELINE_PERIOD_CONFIG.days;
  const count = getDefaultTimelineColumnCount(period);
  return new Date(rangeStart.getTime() + direction * count * cfg.columnMs * 0.5);
}
