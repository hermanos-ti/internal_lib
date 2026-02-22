import React, { useMemo, useCallback, useState } from 'react';
import { getMonthName, parse } from '../../../functions/Formatter/dateFormat';
import styles from './DateInput.module.css';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

export function DatePickerCalendar({
  value,
  onChange,
  min = null,
  max = null,
  range = false,
  viewDate,
  onViewDateChange,
  format = 'data',
  onSelectComplete,
}) {
  const mode = viewDate?.mode ?? 'days';
  const year = viewDate?.year ?? new Date().getFullYear();
  const month = viewDate?.month ?? new Date().getMonth();

  const minDate = useMemo(() => {
    if (!min) return null;
    if (min instanceof Date) return min;
    return parseMinMax(min, format);
  }, [min, format]);

  const maxDate = useMemo(() => {
    if (!max) return null;
    if (max instanceof Date) return max;
    return parseMinMax(max, format);
  }, [max, format]);

  const [start, end] = useMemo(() => {
    if (range) {
      const arr = Array.isArray(value) ? value : [value, null];
      return [arr[0] ?? null, arr[1] ?? null];
    }
    return [value ?? null, null];
  }, [value, range]);

  const startDate = start instanceof Date ? start : (start ? parseValue(start, format) : null);
  const endDate = end instanceof Date ? end : (end ? parseValue(end, format) : null);

  const [hoverDate, setHoverDate] = useState(null);

  const setMode = useCallback((m) => {
    onViewDateChange?.((prev) => ({ ...prev, mode: m }));
  }, [onViewDateChange]);

  const goBack = useCallback(() => {
    if (mode === 'days') {
      onViewDateChange?.((prev) => {
        const m = prev.month - 1;
        if (m < 0) return { ...prev, month: 11, year: prev.year - 1 };
        return { ...prev, month: m };
      });
    } else if (mode === 'month') {
      onViewDateChange?.((prev) => ({ ...prev, year: prev.year - 1 }));
    } else if (mode === 'year') {
      onViewDateChange?.((prev) => ({ ...prev, year: prev.year - 12 }));
    }
  }, [mode, onViewDateChange]);

  const goForward = useCallback(() => {
    if (mode === 'days') {
      onViewDateChange?.((prev) => {
        const m = prev.month + 1;
        if (m > 11) return { ...prev, month: 0, year: prev.year + 1 };
        return { ...prev, month: m };
      });
    } else if (mode === 'month') {
      onViewDateChange?.((prev) => ({ ...prev, year: prev.year + 1 }));
    } else if (mode === 'year') {
      onViewDateChange?.((prev) => ({ ...prev, year: prev.year + 12 }));
    }
  }, [mode, onViewDateChange]);

  const cycleMode = useCallback(() => {
    if (mode === 'days') setMode('month');
    else if (mode === 'month') setMode('year');
    else setMode('days');
  }, [mode, setMode]);

  const handleSelect = useCallback(
    (date) => {
      if (!date) return;
      setHoverDate(null);
      if (range) {
        if (!startDate || (startDate && endDate)) {
          onChange?.([date, null]);
          onSelectComplete?.(false);
        } else {
          const [a, b] = startDate.getTime() <= date.getTime() ? [startDate, date] : [date, startDate];
          onChange?.([a, b]);
          onSelectComplete?.(true);
        }
      } else {
        onChange?.(date);
        onSelectComplete?.(true);
      }
    },
    [range, startDate, endDate, onChange, onSelectComplete]
  );

  const isDisabled = useCallback(
    (d) => {
      if (!d) return true;
      const t = d.getTime();
      if (minDate && t < minDate.getTime()) return true;
      if (maxDate && t > maxDate.getTime()) return true;
      return false;
    },
    [minDate, maxDate]
  );

  const isInRange = useCallback(
    (d) => {
      if (!range || !startDate || !endDate) return false;
      const t = d.getTime();
      const s = startDate.getTime();
      const e = endDate.getTime();
      return t >= Math.min(s, e) && t <= Math.max(s, e);
    },
    [range, startDate, endDate]
  );

  const isInHoverRange = useCallback(
    (d) => {
      if (!range || !startDate || endDate || !hoverDate) return false;
      const t = d.getTime();
      const s = startDate.getTime();
      const h = hoverDate.getTime();
      return t >= Math.min(s, h) && t <= Math.max(s, h);
    },
    [range, startDate, endDate, hoverDate]
  );

  const isSelected = useCallback(
    (d) => {
      if (!d) return false;
      const t = d.getTime();
      if (startDate && t === startDate.getTime()) return true;
      if (endDate && t === endDate.getTime()) return true;
      return false;
    },
    [startDate, endDate]
  );

  const headerLabel = useMemo(() => {
    if (mode === 'days') return `${getMonthName(month, false)} ${year}`;
    if (mode === 'month') return String(year);
    const startYear = Math.floor(year / 10) * 10;
    return `${startYear} - ${startYear + 11}`;
  }, [mode, month, year]);

  const daysGrid = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDow = first.getDay();
    const daysInMonth = last.getDate();
    const prevMonth = new Date(year, month, 0);
    const prevDays = prevMonth.getDate();

    const cells = [];
    for (let i = 0; i < 42; i++) {
      let d, isOtherMonth;
      if (i < startDow) {
        const day = prevDays - startDow + i + 1;
        d = new Date(year, month - 1, day);
        isOtherMonth = true;
      } else if (i >= startDow + daysInMonth) {
        const day = i - startDow - daysInMonth + 1;
        d = new Date(year, month + 1, day);
        isOtherMonth = true;
      } else {
        d = new Date(year, month, i - startDow + 1);
        isOtherMonth = false;
      }
      cells.push({ date: d, isOtherMonth });
    }
    return cells;
  }, [year, month]);

  const monthsGrid = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  }, [year]);

  const yearsGrid = useMemo(() => {
    const startYear = Math.floor(year / 10) * 10;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  }, [year]);

  return (
    <div className={styles.dateInput__calendar} role="dialog" aria-label="Seletor de data">
      <div className={styles.dateInput__header}>
        <button
          type="button"
          className={styles.dateInput__navBtn}
          onClick={goBack}
          aria-label="Voltar"
        >
          <i className="far fa-chevron-left" />
        </button>
        <button
          type="button"
          className={styles.dateInput__headerLabel}
          onClick={cycleMode}
        >
          {headerLabel}
        </button>
        <button
          type="button"
          className={styles.dateInput__navBtn}
          onClick={goForward}
          aria-label="Avançar"
        >
          <i className="far fa-chevron-right" />
        </button>
      </div>

      <div className={styles.dateInput__body}>
        {mode === 'days' && (
          <>
            <div className={styles.dateInput__weekdays}>
              {WEEKDAYS.map((w) => (
                <span key={w} className={styles.dateInput__weekday}>
                  {w}
                </span>
              ))}
            </div>
            <div
              className={styles.dateInput__days}
              onMouseLeave={() => setHoverDate(null)}
            >
              {daysGrid.map(({ date, isOtherMonth }, i) => {
                const disabled = isDisabled(date);
                const selected = isSelected(date);
                const inRange = isInRange(date);
                const inHoverRange = isInHoverRange(date);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.dateInput__day} ${isOtherMonth ? styles.dateInput__dayOther : ''} ${selected ? styles.dateInput__daySelected : ''} ${inRange ? styles.dateInput__dayInRange : ''} ${inHoverRange ? styles.dateInput__dayInHoverRange : ''} ${disabled ? styles.dateInput__dayDisabled : ''}`}
                    onClick={() => !disabled && handleSelect(date)}
                    onMouseEnter={() => !disabled && range && startDate && !endDate && setHoverDate(date)}
                    disabled={disabled}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === 'month' && (
          <div className={styles.dateInput__months}>
            {monthsGrid.map((d, i) => {
              const disabled = isDisabled(d);
              const selected = (startDate && d.getMonth() === startDate.getMonth() && d.getFullYear() === startDate.getFullYear()) ||
                (endDate && d.getMonth() === endDate.getMonth() && d.getFullYear() === endDate.getFullYear());
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dateInput__month} ${selected ? styles.dateInput__daySelected : ''} ${disabled ? styles.dateInput__dayDisabled : ''}`}
                  onClick={() => !disabled && handleSelect(d)}
                  disabled={disabled}
                >
                  {MONTHS_SHORT[i]}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'year' && (
          <div className={styles.dateInput__years}>
            {yearsGrid.map((y) => {
              const d = new Date(y, 0, 1);
              const disabled = isDisabled(d);
              const selected = (startDate && d.getFullYear() === startDate.getFullYear()) ||
                (endDate && d.getFullYear() === endDate.getFullYear());
              return (
                <button
                  key={y}
                  type="button"
                  className={`${styles.dateInput__year} ${selected ? styles.dateInput__daySelected : ''} ${disabled ? styles.dateInput__dayDisabled : ''}`}
                  onClick={() => !disabled && handleSelect(d)}
                  disabled={disabled}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function parseValue(val, format) {
  if (val instanceof Date) return val;
  return parse(val, format);
}

function parseMinMax(val, format) {
  if (val instanceof Date) return val;
  let d = parse(val, format);
  if (!d && typeof val === 'string') {
    d = parse(val, 'data') || parse(val, 'mes-ano');
  }
  return d;
}
