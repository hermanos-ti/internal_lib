import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import styles from '../../Tabela.module.css';
import { ItemCard } from '../ItemCard';
import { TIMELINE_PERIODS } from '../../constants';
import {
  alignTimelineStart,
  buildTimelineStickyGroups,
  getDefaultTimelineColumnCount,
  getItemDateRange,
  getTimelineBarPosition,
  shiftTimelineStart,
  TIMELINE_PERIOD_CONFIG,
  formatMonthLabel,
  formatDateRangeLabel,
} from '../../dateViewUtils';

const ROW_HEIGHT = 36;
const MAX_COLUMNS = 400;
const EDGE_THRESHOLD_COLS = 3;

function getBaseColumnCount(period) {
  return getDefaultTimelineColumnCount(period) * 3;
}

function getChunkSize(period) {
  return Math.max(4, Math.floor(getDefaultTimelineColumnCount(period) / 2));
}

export function TimelineView({
  sortedData = [],
  headerStructure,
  columnVisibility = {},
  timelineConfig,
  listConfig,
  getRowKey,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  editedData,
}) {
  const periodDefault = timelineConfig?.defaultPeriod || 'days';
  const [period, setPeriod] = useState(periodDefault);
  const [windowStart, setWindowStart] = useState(() => {
    const page = getDefaultTimelineColumnCount(periodDefault);
    const aligned = alignTimelineStart(new Date(), periodDefault);
    const cfg = TIMELINE_PERIOD_CONFIG[periodDefault] || TIMELINE_PERIOD_CONFIG.days;
    // Start one page before "today" so current period sits mid-buffer
    return new Date(aligned.getTime() - page * cfg.columnMs);
  });
  const [columnCount, setColumnCount] = useState(() => getBaseColumnCount(periodDefault));
  const scrollRef = useRef(null);
  const expandingRef = useRef(false);
  const pendingScrollAdjustRef = useRef(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const resetWindowAround = useCallback((anchorDate, nextPeriod) => {
    const p = nextPeriod || period;
    const cfg = TIMELINE_PERIOD_CONFIG[p] || TIMELINE_PERIOD_CONFIG.days;
    const page = getDefaultTimelineColumnCount(p);
    const aligned = alignTimelineStart(anchorDate, p);
    const start = new Date(aligned.getTime() - page * cfg.columnMs);
    setWindowStart(start);
    setColumnCount(getBaseColumnCount(p));
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) {
        el.scrollLeft = page * cfg.columnWidth;
        setScrollLeft(el.scrollLeft);
      }
    });
  }, [period]);

  useEffect(() => {
    setPeriod(periodDefault);
    resetWindowAround(new Date(), periodDefault);
  }, [periodDefault]); // eslint-disable-line react-hooks/exhaustive-deps

  const leafColumns = headerStructure?.leafColumns || [];
  const columnsByKey = useMemo(() => {
    const map = {};
    leafColumns.forEach((c) => { map[c.key] = c; });
    return map;
  }, [leafColumns]);

  const fields = useMemo(() => {
    const raw = (timelineConfig?.fields?.length ? timelineConfig.fields : listConfig?.fields) || [];
    return raw.filter((f) => f?.key && columnVisibility[f.key] !== false);
  }, [timelineConfig, listConfig, columnVisibility]);

  const resolveItem = useCallback((item) => {
    if (!editedData || !getRowKey) return item;
    const key = getRowKey(item);
    const edits = editedData.get?.(key);
    if (!edits) return item;
    return { ...item, ...edits };
  }, [editedData, getRowKey]);

  const dateConfig = useMemo(() => ({
    dateKey: timelineConfig?.dateKey,
    startDateKey: timelineConfig?.startDateKey,
    endDateKey: timelineConfig?.endDateKey,
  }), [timelineConfig]);

  const periodCfg = TIMELINE_PERIOD_CONFIG[period] || TIMELINE_PERIOD_CONFIG.days;
  const trackWidth = columnCount * periodCfg.columnWidth;
  const chunk = getChunkSize(period);
  const thresholdPx = EDGE_THRESHOLD_COLS * periodCfg.columnWidth;

  const columns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < columnCount; i++) {
      const d = new Date(windowStart.getTime() + i * periodCfg.columnMs);
      cols.push({ index: i, date: d, label: periodCfg.label(d) });
    }
    return cols;
  }, [windowStart, columnCount, periodCfg]);

  const stickyGroups = useMemo(
    () => buildTimelineStickyGroups(windowStart, columnCount, period),
    [windowStart, columnCount, period]
  );

  const rows = useMemo(() => {
    return sortedData.map((raw, index) => {
      const item = resolveItem(raw);
      const range = getItemDateRange(item, dateConfig);
      const pos = range.start
        ? getTimelineBarPosition(range.start, range.end, windowStart, period)
        : null;
      return {
        raw,
        item,
        key: getRowKey ? getRowKey(raw) : index,
        pos,
        start: range.start,
        end: range.end,
      };
    });
  }, [sortedData, resolveItem, dateConfig, windowStart, period, getRowKey]);

  // Apply scroll correction after prepend expands the track
  useEffect(() => {
    const adjust = pendingScrollAdjustRef.current;
    if (!adjust) return;
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft += adjust;
      setScrollLeft(el.scrollLeft);
    }
    pendingScrollAdjustRef.current = 0;
    expandingRef.current = false;
  }, [windowStart, columnCount]);

  const expandWindow = useCallback((direction) => {
    if (expandingRef.current) return;
    expandingRef.current = true;
    const cfg = TIMELINE_PERIOD_CONFIG[period] || TIMELINE_PERIOD_CONFIG.days;
    const n = chunk;

    if (direction < 0) {
      // prepend
      setWindowStart((s) => new Date(s.getTime() - n * cfg.columnMs));
      setColumnCount((c) => Math.min(MAX_COLUMNS, c + n));
      pendingScrollAdjustRef.current = n * cfg.columnWidth;
    } else {
      setColumnCount((c) => {
        const next = c + n;
        if (next > MAX_COLUMNS) {
          // trim from the left while keeping viewport roughly stable
          const trim = next - MAX_COLUMNS;
          pendingScrollAdjustRef.current = -(trim * cfg.columnWidth);
          setWindowStart((s) => new Date(s.getTime() + trim * cfg.columnMs));
          return MAX_COLUMNS;
        }
        return next;
      });
      // allow next expand after paint
      requestAnimationFrame(() => {
        expandingRef.current = false;
      });
    }
  }, [period, chunk]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const left = el.scrollLeft;
        const width = el.clientWidth;
        const full = el.scrollWidth;
        setScrollLeft(left);
        setViewportWidth(width);

        if (left < thresholdPx) {
          expandWindow(-1);
        } else if (left + width > full - thresholdPx) {
          expandWindow(1);
        }
      });
    };

    const ro = new ResizeObserver(() => {
      setViewportWidth(el.clientWidth);
      setScrollLeft(el.scrollLeft);
    });

    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);
    setViewportWidth(el.clientWidth);
    setScrollLeft(el.scrollLeft);

    // Initial mid-window scroll if at 0
    if (el.scrollLeft === 0) {
      const page = getDefaultTimelineColumnCount(period);
      el.scrollLeft = page * periodCfg.columnWidth;
      setScrollLeft(el.scrollLeft);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [period, periodCfg.columnWidth, thresholdPx, expandWindow]);

  const goToday = () => {
    resetWindowAround(new Date(), period);
  };

  const handlePeriodChange = (next) => {
    setPeriod(next);
    resetWindowAround(new Date(), next);
  };

  const navigatePage = (direction) => {
    setWindowStart((s) => shiftTimelineStart(s, period, direction));
  };

  const scrollToItem = useCallback((start, end) => {
    if (!start) return;
    const cfg = TIMELINE_PERIOD_CONFIG[period] || TIMELINE_PERIOD_CONFIG.days;
    const page = getDefaultTimelineColumnCount(period);
    const aligned = alignTimelineStart(start, period);
    const newStart = new Date(aligned.getTime() - 3 * cfg.columnMs);
    const neededCols = Math.max(
      getBaseColumnCount(period),
      Math.ceil(((end || start).getTime() - newStart.getTime()) / cfg.columnMs) + page
    );

    setWindowStart(newStart);
    setColumnCount(Math.min(MAX_COLUMNS, neededCols));

    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const pos = getTimelineBarPosition(start, end, newStart, period);
      if (!pos) return;
      const target = Math.max(0, pos.left - cfg.columnWidth * 2);
      el.scrollLeft = target;
      setScrollLeft(target);
    });
  }, [period]);

  const viewLeft = scrollLeft;
  const viewRight = scrollLeft + viewportWidth;

  if (!dateConfig.dateKey && !dateConfig.startDateKey && !dateConfig.endDateKey) {
    return (
      <div className={styles.tabela__view__placeholder}>
        <div className={styles.tabela__view__placeholder__inner}>
          <i className={`fas fa-stream ${styles.tabela__view__placeholder__icon}`} />
          <span className={styles.tabela__view__placeholder__title}>Configure timelineConfig</span>
          <span className={styles.tabela__view__placeholder__subtitle}>
            Defina dateKey ou startDateKey/endDateKey
          </span>
        </div>
      </div>
    );
  }

  const currentSticky = stickyGroups.find((g) => {
    const left = g.startIndex * periodCfg.columnWidth;
    const right = left + g.span * periodCfg.columnWidth;
    return right > viewLeft && left < viewRight;
  }) || stickyGroups[0];

  return (
    <div className={styles.timelineView}>
      <div className={styles.timelineView__toolbar}>
        <div className={styles.timelineView__periodSticky}>
          <span className={styles.timelineView__periodLabel}>
            {currentSticky?.label || formatMonthLabel(windowStart)}
          </span>
        </div>
        <div className={styles.timelineView__toolbarRight}>
          <label className={styles.timelineView__periodSelectWrap}>
            <span className={styles.timelineView__periodSelectLabel}>Período</span>
            <select
              className={styles.timelineView__periodSelect}
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
            >
              {TIMELINE_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <div className={styles.timelineView__nav}>
            <button
              type="button"
              className={styles.calendarView__navBtn}
              onClick={() => navigatePage(-1)}
              aria-label="Anterior"
              title="Anterior"
            >
              <i className="far fa-chevron-left" />
            </button>
            <button type="button" className={styles.calendarView__todayBtn} onClick={goToday}>
              Hoje
            </button>
            <button
              type="button"
              className={styles.calendarView__navBtn}
              onClick={() => navigatePage(1)}
              aria-label="Próximo"
              title="Próximo"
            >
              <i className="far fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.timelineView__scroll} ref={scrollRef}>
        <div className={styles.timelineView__track} style={{ width: trackWidth }}>
          <div className={styles.timelineView__stickyRow} style={{ width: trackWidth }}>
            {stickyGroups.map((g) => (
              <div
                key={`${g.label}-${g.startIndex}`}
                className={styles.timelineView__stickyGroup}
                style={{
                  left: g.startIndex * periodCfg.columnWidth,
                  width: g.span * periodCfg.columnWidth,
                }}
              >
                <span className={styles.timelineView__stickyGroupLabel}>{g.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.timelineView__colsHeader} style={{ width: trackWidth }}>
            {columns.map((col) => (
              <div
                key={col.index}
                className={styles.timelineView__colHeader}
                style={{ width: periodCfg.columnWidth }}
              >
                {col.label}
              </div>
            ))}
          </div>

          <div
            className={styles.timelineView__body}
            style={{ width: trackWidth, height: Math.max(rows.length, 1) * ROW_HEIGHT }}
          >
            <div className={styles.timelineView__gridBg} style={{ width: trackWidth }}>
              {columns.map((col, i) => (
                <div
                  key={col.index}
                  className={[
                    styles.timelineView__gridCol,
                    i % 2 === 0 ? styles.timelineView__gridCol__alt : '',
                  ].filter(Boolean).join(' ')}
                  style={{ width: periodCfg.columnWidth }}
                />
              ))}
            </div>

            {rows.map((row, rowIndex) => {
              const pos = row.pos;
              const barLeft = pos?.left ?? 0;
              const barWidth = pos?.width ?? 0;
              const barRight = barLeft + barWidth;
              const periodLabel = formatDateRangeLabel(row.start, row.end);

              const entirelyLeft = Boolean(pos && barRight <= viewLeft);
              const entirelyRight = Boolean(pos && barLeft >= viewRight);
              const continuesLeft = Boolean(pos && !entirelyLeft && barLeft < viewLeft && barRight > viewLeft);
              const continuesRight = Boolean(pos && !entirelyRight && barRight > viewRight && barLeft < viewRight);
              const showLeftArrow = entirelyLeft || continuesLeft;
              const showRightArrow = entirelyRight || continuesRight;
              const barVisible = Boolean(pos && barRight > viewLeft && barLeft < viewRight);

              return (
                <div
                  key={row.key}
                  className={styles.timelineView__row}
                  style={{ top: rowIndex * ROW_HEIGHT, height: ROW_HEIGHT, width: trackWidth }}
                >
                  {showLeftArrow && (
                    <button
                      type="button"
                      className={`${styles.timelineView__rowEdge} ${styles.timelineView__rowEdgeLeft} ${styles.timelineView__jumpBtn}`}
                      style={{ left: viewLeft }}
                      title={periodLabel || 'Ir para o período'}
                      aria-label={periodLabel ? `Ir para ${periodLabel}` : 'Ir para o período'}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToItem(row.start, row.end);
                      }}
                    >
                      <i className="far fa-chevron-left" />
                    </button>
                  )}
                  {showRightArrow && (
                    <button
                      type="button"
                      className={`${styles.timelineView__rowEdge} ${styles.timelineView__rowEdgeRight} ${styles.timelineView__jumpBtn}`}
                      style={{ left: Math.max(0, viewRight - 18) }}
                      title={periodLabel || 'Ir para o período'}
                      aria-label={periodLabel ? `Ir para ${periodLabel}` : 'Ir para o período'}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToItem(row.start, row.end);
                      }}
                    >
                      <i className="far fa-chevron-right" />
                    </button>
                  )}
                  {barVisible && pos && (
                    <div
                      className={styles.timelineView__bar}
                      style={{ left: Math.max(0, barLeft), width: Math.max(24, barWidth) }}
                    >
                      <ItemCard
                        item={row.item}
                        fields={fields}
                        columnsByKey={columnsByKey}
                        compact
                        denseCollapse
                        className={styles.timelineView__barCard}
                        onClick={(e) => onItemClick?.(e, row.item, rowIndex)}
                        onDoubleClick={(e) => onItemDoubleClick?.(e, row.item, rowIndex)}
                        onContextMenu={(e) => onItemContextMenu?.(e, row.item, rowIndex)}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className={styles.timelineView__empty}>Nenhum item para exibir.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
