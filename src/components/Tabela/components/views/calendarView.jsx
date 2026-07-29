import { useMemo, useState, useCallback } from 'react';
import styles from '../../Tabela.module.css';
import { formatDisplayValue } from '../../formatUtils';
import { groupFieldsByRole } from '../../viewSettingsUtils';
import {
  buildMonthWeeks,
  formatMonthLabel,
  getItemDateRange,
  isSameDay,
  isSameMonth,
  addMonths,
  startOfDay,
  splitRangeIntoWeekSegments,
  assignLanes,
  WEEKDAY_LABELS_SHORT,
  toDateKey,
} from '../../dateViewUtils';
import { getItemAccentColor } from '../../viewColorUtils';

const RANGE_BAR_HEIGHT = 24; // px
const RANGE_BAR_GAP = 3;
const RANGE_TOP_OFFSET = 26; // below day number
const RANGE_BAR_INSET = 6; // px gap from day cell edge
const WEEK_BASE_MIN = 96;

function CalendarBullet({ item, itemKey, roles, columnsByKey, onClick, onDoubleClick, onContextMenu }) {
  const getCol = (key) => columnsByKey[key] || { key, format: 'text' };
  const accent = getItemAccentColor(itemKey ?? item?.codigo ?? item?.id);

  const iconField = roles.icone;
  const principalField = roles.principal;
  const auxField = roles.adicionais[0];

  let icon = null;
  if (iconField) {
    const raw = item[iconField.key];
    if (raw) {
      const iconClass = String(raw).includes('fa-') ? String(raw) : `fas fa-${raw}`;
      icon = <i className={`${iconClass} ${styles.calendarView__bulletIcon}`} aria-hidden style={{ color: accent.border }} />;
    }
  }

  const principalCol = principalField ? getCol(principalField.key) : null;
  const principalRaw = principalField ? item[principalField.key] : null;
  const principal = principalCol
    ? (typeof principalCol.render === 'function'
      ? principalCol.render(principalRaw, item, principalCol, 0, 0)
      : formatDisplayValue(principalRaw, principalCol.format || 'text', { emptyDisplay: '' }))
    : null;

  const auxCol = auxField ? getCol(auxField.key) : null;
  const auxRaw = auxField ? item[auxField.key] : null;
  const aux = auxCol
    ? (typeof auxCol.render === 'function'
      ? auxCol.render(auxRaw, item, auxCol, 0, 0)
      : formatDisplayValue(auxRaw, auxCol.format || 'text', { emptyDisplay: '' }))
    : null;

  return (
    <button
      type="button"
      className={styles.calendarView__bullet}
      style={{
        background: accent.softBg,
        borderLeft: `3px solid ${accent.border}`,
      }}
      onClick={(e) => { e.stopPropagation(); onClick?.(e, item); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(e, item); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, item);
      }}
      title={typeof principal === 'string' ? principal : undefined}
    >
      {icon}
      <span className={styles.calendarView__bulletText}>{principal || '—'}</span>
      {aux != null && aux !== '' && (
        <span className={styles.calendarView__bulletAux}>{aux}</span>
      )}
    </button>
  );
}

export function CalendarView({
  sortedData = [],
  headerStructure,
  columnVisibility = {},
  calendarConfig,
  getRowKey,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  editedData,
}) {
  const [cursorMonth, setCursorMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const leafColumns = headerStructure?.leafColumns || [];
  const columnsByKey = useMemo(() => {
    const map = {};
    leafColumns.forEach((c) => { map[c.key] = c; });
    return map;
  }, [leafColumns]);

  const fields = useMemo(() => {
    const raw = calendarConfig?.fields || [];
    return raw.filter((f) => f?.key && columnVisibility[f.key] !== false);
  }, [calendarConfig, columnVisibility]);

  const roles = useMemo(() => groupFieldsByRole(fields), [fields]);

  const resolveItem = useCallback((item) => {
    if (!editedData || !getRowKey) return item;
    const key = getRowKey(item);
    const edits = editedData.get?.(key);
    if (!edits) return item;
    return { ...item, ...edits };
  }, [editedData, getRowKey]);

  const dateConfig = useMemo(() => ({
    dateKey: calendarConfig?.dateKey,
    startDateKey: calendarConfig?.startDateKey,
    endDateKey: calendarConfig?.endDateKey,
  }), [calendarConfig]);

  const isRangeMode = Boolean(dateConfig.startDateKey || dateConfig.endDateKey);

  const weeks = useMemo(() => buildMonthWeeks(cursorMonth), [cursorMonth]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const itemsWithRange = useMemo(() => {
    return sortedData.map((raw) => {
      const item = resolveItem(raw);
      const range = getItemDateRange(item, dateConfig);
      return { raw, item, ...range, key: getRowKey ? getRowKey(raw) : null };
    }).filter((x) => x.start);
  }, [sortedData, resolveItem, dateConfig, getRowKey]);

  const singleByDay = useMemo(() => {
    if (isRangeMode) return null;
    const map = new Map();
    itemsWithRange.forEach((entry) => {
      const key = toDateKey(entry.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    });
    return map;
  }, [itemsWithRange, isRangeMode]);

  const rangeSegmentsByWeek = useMemo(() => {
    if (!isRangeMode) return [];
    return itemsWithRange.map((entry) => ({
      ...entry,
      segments: splitRangeIntoWeekSegments(entry.start, entry.end, weeks),
    }));
  }, [itemsWithRange, isRangeMode, weeks]);

  /** Per week: packed segments with lanes + lane count */
  const packedByWeek = useMemo(() => {
    if (!isRangeMode) return [];
    return weeks.map((_, wi) => {
      const flat = [];
      rangeSegmentsByWeek.forEach((entry) => {
        entry.segments
          .filter((seg) => seg.weekIndex === wi)
          .forEach((seg) => {
            flat.push({
              ...seg,
              itemKey: entry.key,
              entry,
            });
          });
      });
      const packed = assignLanes(flat);
      const laneCount = packed.reduce((max, s) => Math.max(max, (s.lane ?? 0) + 1), 0);
      return { packed, laneCount };
    });
  }, [isRangeMode, weeks, rangeSegmentsByWeek]);

  const goToday = () => {
    const now = new Date();
    setCursorMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  if (!dateConfig.dateKey && !dateConfig.startDateKey && !dateConfig.endDateKey) {
    return (
      <div className={styles.tabela__view__placeholder}>
        <div className={styles.tabela__view__placeholder__inner}>
          <i className={`fas fa-calendar-days ${styles.tabela__view__placeholder__icon}`} />
          <span className={styles.tabela__view__placeholder__title}>Configure calendarConfig</span>
          <span className={styles.tabela__view__placeholder__subtitle}>
            Defina dateKey ou startDateKey/endDateKey
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.calendarView}>
      <div className={styles.calendarView__toolbar}>
        <span className={styles.calendarView__monthLabel}>{formatMonthLabel(cursorMonth)}</span>
        <div className={styles.calendarView__nav}>
          <button
            type="button"
            className={styles.calendarView__navBtn}
            onClick={() => setCursorMonth((m) => addMonths(m, -1))}
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <i className="far fa-chevron-left" />
          </button>
          <button
            type="button"
            className={styles.calendarView__todayBtn}
            onClick={goToday}
          >
            Hoje
          </button>
          <button
            type="button"
            className={styles.calendarView__navBtn}
            onClick={() => setCursorMonth((m) => addMonths(m, 1))}
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <i className="far fa-chevron-right" />
          </button>
        </div>
      </div>

      <div className={styles.calendarView__weekdays}>
        {WEEKDAY_LABELS_SHORT.map((label) => (
          <div key={label} className={styles.calendarView__weekday}>{label}</div>
        ))}
      </div>

      <div className={styles.calendarView__grid}>
        {weeks.map((week, wi) => {
          const weekPack = packedByWeek[wi] || { packed: [], laneCount: 0 };
          const weekMinHeight = isRangeMode
            ? Math.max(
              WEEK_BASE_MIN,
              RANGE_TOP_OFFSET + weekPack.laneCount * (RANGE_BAR_HEIGHT + RANGE_BAR_GAP) + 8
            )
            : undefined;

          return (
          <div
            key={wi}
            className={styles.calendarView__week}
            style={weekMinHeight ? { minHeight: weekMinHeight } : undefined}
          >
            {week.map((day) => {
              const inMonth = isSameMonth(day, cursorMonth);
              const isToday = isSameDay(day, today);
              const dayKey = toDateKey(day);
              const dayItems = !isRangeMode ? (singleByDay?.get(dayKey) || []) : [];

              return (
                <div
                  key={dayKey}
                  className={[
                    styles.calendarView__cell,
                    !inMonth ? styles.calendarView__cell__muted : '',
                    isToday ? styles.calendarView__cell__today : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className={styles.calendarView__dayNum}>
                    {isToday && <span className={styles.calendarView__todayDot} />}
                    {day.getDate()}
                  </div>
                  {!isRangeMode && (
                    <div className={styles.calendarView__cellEvents}>
                      {dayItems.map((entry) => (
                        <CalendarBullet
                          key={entry.key}
                          item={entry.item}
                          itemKey={entry.key}
                          roles={roles}
                          columnsByKey={columnsByKey}
                          onClick={onItemClick}
                          onDoubleClick={onItemDoubleClick}
                          onContextMenu={onItemContextMenu}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isRangeMode && (
              <div className={styles.calendarView__rangeLayer}>
                {weekPack.packed.map((seg) => {
                  const entry = seg.entry;
                  const insetLeft = seg.continuesLeft ? 0 : RANGE_BAR_INSET;
                  const insetRight = seg.continuesRight ? 0 : RANGE_BAR_INSET;
                  const left = `calc(${(seg.startCol / 7) * 100}% + ${insetLeft}px)`;
                  const width = `calc(${((seg.endCol - seg.startCol + 1) / 7) * 100}% - ${insetLeft + insetRight}px)`;
                  const top = seg.lane * (RANGE_BAR_HEIGHT + RANGE_BAR_GAP);
                  const principalKey = roles.principal?.key;
                  const label = principalKey
                    ? formatDisplayValue(entry.item[principalKey], columnsByKey[principalKey]?.format || 'text', { emptyDisplay: '' })
                    : '';
                  const accent = getItemAccentColor(entry.key);
                  return (
                    <button
                      key={`${entry.key}-${seg.startCol}-${seg.endCol}-${seg.lane}`}
                      type="button"
                      className={[
                        styles.calendarView__rangeBar,
                        seg.continuesLeft ? styles.calendarView__rangeBar__contLeft : '',
                        seg.continuesRight ? styles.calendarView__rangeBar__contRight : '',
                      ].filter(Boolean).join(' ')}
                      style={{
                        left,
                        width,
                        top,
                        background: accent.bg,
                        color: accent.text,
                      }}
                      onClick={(e) => onItemClick?.(e, entry.item)}
                      onDoubleClick={(e) => onItemDoubleClick?.(e, entry.item)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onItemContextMenu?.(e, entry.item);
                      }}
                      title={label}
                    >
                      {!seg.continuesLeft && (
                        <span className={styles.calendarView__rangeBarLabel}>{label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
