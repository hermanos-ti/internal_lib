import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';
import { parse, format } from '../../../functions/Formatter/dateFormat';
import { DatePickerCalendar } from './DatePickerCalendar';
import { useDateDropdown } from './useDateDropdown';
import styles from './DateInput.module.css';

function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

export const DateInput = forwardRef(
  (
    {
      value = '',
      onChange,
      id,
      disabled,
      className,
      min,
      max,
      format: formatType = 'data',
      range = false,
      placeholder = 'Selecione a data',
      ...rest
    },
    ref
  ) => {
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
      const d = parseValue(value, formatType, range);
      const base = d ? (Array.isArray(d) ? d[0] : d) : new Date();
      const safeBase = base && typeof base.getFullYear === 'function' ? base : new Date();
      return { mode: 'days', year: safeBase.getFullYear(), month: safeBase.getMonth() };
    });

    const { position, positionReady } = useDateDropdown({
      triggerRef: containerRef,
      dropdownRef,
      isOpen,
      onClose: () => setIsOpen(false),
      portalContainer: document.body,
    });

    const parsedValue = useCallback(() => {
      return parseValue(value, formatType, range);
    }, [value, formatType, range]);

    const displayStr = useMemo(() => {
      if (range) {
        const [start, end] = parseValue(value, formatType, range) ?? [null, null];
        if (!start && !end) return '';
        const s = start ? format(start, formatType) : '';
        const e = end ? format(end, formatType) : '';
        return s && e ? `${s} - ${e}` : s || e;
      }
      const d = parseValue(value, formatType, range);
      return d ? format(d, formatType) : '';
    }, [value, formatType, range]);

    useImperativeHandle(ref, () => ({
      focus: () => containerRef.current?.focus?.(),
      blur: () => containerRef.current?.blur?.(),
      getValue: () => value,
      setValue: (v) => onChange?.(v),
    }), [value, onChange]);

    useEffect(() => {
      if (!isOpen) return;
      const d = parsedValue();
      const base = d ? (Array.isArray(d) ? d[0] : d) : new Date();
      const safeBase = base && typeof base.getFullYear === 'function' ? base : new Date();
      setViewDate((prev) => ({
        ...prev,
        year: safeBase.getFullYear(),
        month: safeBase.getMonth(),
      }));
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e) => {
        const inContainer = containerRef.current?.contains(e.target);
        const inDropdown = dropdownRef.current?.contains(e.target);
        if (!inContainer && !inDropdown) setIsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsOpen(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const isHoraOnly = formatType === 'hora';
    const hasTime = ['data-hora', 'data-hora-extenso', 'data-hora-extenso-curto'].includes(formatType);

    const handleCalendarChange = useCallback(
      (newValue) => {
        const mergeTime = (d) => {
          if (!hasTime || !d) return d;
          const current = parsedValue();
          const base = current instanceof Date ? current : new Date();
          d.setHours(base.getHours(), base.getMinutes(), 0, 0);
          return d;
        };
        if (range) {
          const arr = Array.isArray(newValue) ? newValue : [newValue, null];
          const formatted = arr.map((d) => (d ? format(mergeTime(new Date(d.getTime())), formatType) : ''));
          onChange?.(formatted);
        } else {
          const d = newValue ? mergeTime(new Date(newValue.getTime())) : null;
          onChange?.(d ? format(d, formatType) : '');
        }
      },
      [formatType, range, onChange, hasTime, parsedValue]
    );

    const handleSelectComplete = useCallback(
      (complete) => {
        if (!range || complete) setIsOpen(false);
      },
      [range]
    );

    const handleTimeChange = useCallback(
      (hours, minutes) => {
        const base = parsedValue();
        const d = base ? new Date(base) : new Date();
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        onChange?.(format(d, formatType));
        setIsOpen(false);
      },
      [formatType, onChange, parsedValue]
    );

    const theme = containerRef.current?.closest?.('[data-theme]')?.getAttribute?.('data-theme') ?? 'light';

    const dropdownContent =
      isOpen &&
      positionReady && (
        <div
          ref={dropdownRef}
          className={styles.dateInput__dropdown}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {isHoraOnly ? (
            <TimePicker
              value={parsedValue()}
              onChange={handleTimeChange}
              onClose={() => setIsOpen(false)}
            />
          ) : (
            <>
              <DatePickerCalendar
                value={range ? (Array.isArray(value) ? value : [value, null]) : value}
                onChange={handleCalendarChange}
                min={min}
                max={max}
                range={range}
                viewDate={viewDate}
                onViewDateChange={setViewDate}
                format={formatType}
                onSelectComplete={handleSelectComplete}
              />
              {hasTime && !range && (
                <TimeSection
                  value={parsedValue()}
                  format={formatType}
                  onChange={(h, m) => {
                    const base = parsedValue() || new Date();
                    const d = base instanceof Date ? new Date(base) : new Date();
                    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                    onChange?.(format(d, formatType));
                    setIsOpen(false);
                  }}
                />
              )}
            </>
          )}
        </div>
      );

    return (
      <>
        <div
          ref={containerRef}
          id={id}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className={`${styles.dateInput__trigger} ${className || ''}`}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
          {...rest}
        >
          <span
            className={`${styles.dateInput__triggerValue} ${!displayStr ? styles.placeholder : ''}`}
          >
            {displayStr || placeholder}
          </span>
          <i
            className={`far fa-${isHoraOnly ? 'clock' : 'calendar'} ${styles.dateInput__triggerIcon}`}
          />
        </div>
        {dropdownContent &&
          createPortal(
            <div data-theme={theme} style={{ display: 'contents' }}>
              {dropdownContent}
            </div>,
            document.body
          )}
      </>
    );
  }
);

DateInput.displayName = 'DateInput';

function parseValue(val, formatType, range) {
  if (val == null || val === '') return range ? [null, null] : null;
  if (range && Array.isArray(val)) {
    return [parse(val[0], formatType), parse(val[1], formatType)];
  }
  return parse(val, formatType);
}

function TimePicker({ value, onChange }) {
  const d = value instanceof Date ? value : new Date();
  const [hours, setHours] = useState(pad(d.getHours()));
  const [minutes, setMinutes] = useState(pad(d.getMinutes()));

  useEffect(() => {
    const date = value instanceof Date ? value : new Date();
    setHours(pad(date.getHours()));
    setMinutes(pad(date.getMinutes()));
  }, [value]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      onChange(hours, minutes);
    }
  };

  return (
    <div className={styles.dateInput__calendar}>
      <div className={`${styles.dateInput__timeSection} ${styles.dateInput__timeSectionStandalone}`}>
        <span className={styles.dateInput__timeLabel}>Hora</span>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => setHours(pad(Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0))))}
            className={styles.dateInput__timeInput}
          />
          <span>:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(pad(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0))))}
            className={styles.dateInput__timeInput}
          />
          <button type="submit" className={styles.dateInput__navBtn}>
            OK
          </button>
        </form>
      </div>
    </div>
  );
}

function TimeSection({ value, format, onChange }) {
  const d = value instanceof Date ? value : new Date();
  const [hours, setHours] = useState(pad(d.getHours()));
  const [minutes, setMinutes] = useState(pad(d.getMinutes()));

  useEffect(() => {
    const date = value instanceof Date ? value : new Date();
    setHours(pad(date.getHours()));
    setMinutes(pad(date.getMinutes()));
  }, [value]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      onChange(hours, minutes);
    }
  };

  return (
    <div className={styles.dateInput__timeSection}>
      <span className={styles.dateInput__timeLabel}>Hora</span>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={(e) => setHours(pad(Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0))))}
          className={styles.dateInput__timeInput}
        />
        <span>:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => setMinutes(pad(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0))))}
          className={styles.dateInput__timeInput}
        />
        <button type="submit" className={styles.dateInput__navBtn}>
          OK
        </button>
      </form>
    </div>
  );
}
