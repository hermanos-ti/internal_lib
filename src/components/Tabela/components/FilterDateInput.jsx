import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { parse } from '../../../functions/Formatter/dateFormat';
import { DatePickerCalendar } from '../../Input/types/DatePickerCalendar';
import { PortalTargetContext } from '../PortalTargetContext';
import { isoToDisplay, maskDateInput, toIsoDate } from '../filterValueUtils';
import styles from '../Tabela.module.css';

export function FilterDateInput({
  value = '',
  onChange,
  id,
  className = '',
  placeholder = 'dd/mm/aaaa',
  title,
}) {
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [text, setText] = useState(() => isoToDisplay(value));
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [viewDate, setViewDate] = useState(() => {
    const base = parseIsoOrToday(value);
    return { mode: 'days', year: base.getFullYear(), month: base.getMonth() };
  });

  const getPortalContainer = useContext(PortalTargetContext);
  const portalContainer = (typeof getPortalContainer === 'function' ? getPortalContainer() : getPortalContainer) ?? document.body;

  const convertToPortalRelativePosition = useCallback((viewportPosition) => {
    if (portalContainer === document.body) return viewportPosition;
    const rect = portalContainer?.getBoundingClientRect?.();
    if (!rect) return viewportPosition;
    return {
      top: viewportPosition.top - rect.top,
      left: viewportPosition.left - rect.left,
    };
  }, [portalContainer]);

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const calendarValue = useMemo(() => {
    const iso = toIsoDate(value);
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [value]);

  const commitText = useCallback((nextText) => {
    if (!nextText) {
      if (value) onChange?.('');
      setText('');
      return;
    }
    const parsed = parse(nextText, 'data');
    if (!parsed) {
      setText(isoToDisplay(value));
      return;
    }
    const iso = toIsoDate(parsed);
    onChange?.(iso);
    setText(isoToDisplay(iso));
  }, [onChange, value]);

  const handleTextChange = (event) => {
    const raw = event.target.value;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw.trim())) {
      const iso = toIsoDate(raw.trim());
      if (iso) {
        onChange?.(iso);
        setText(isoToDisplay(iso));
        return;
      }
    }
    const masked = maskDateInput(raw);
    setText(masked);
    if (!masked) {
      if (value) onChange?.('');
      return;
    }
    if (masked.length === 10) {
      const parsed = parse(masked, 'data');
      if (parsed) onChange?.(toIsoDate(parsed));
    }
  };

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      const trigger = containerRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const height = dropdownRef.current?.offsetHeight || 320;
      const width = 280;
      let top = trigger.bottom + 4;
      let left = trigger.left;
      if (top + height > window.innerHeight - 8) {
        top = Math.max(8, trigger.top - height - 4);
      }
      if (left + width > window.innerWidth - 8) {
        left = window.innerWidth - width - 8;
      }
      if (left < 8) left = 8;
      const relative = convertToPortalRelativePosition({ top, left });
      setDropdownPosition({ top: relative.top, left: relative.left });
    };

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [isOpen, viewDate, convertToPortalRelativePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const inField = containerRef.current?.contains(event.target);
      const inPicker = event.target?.closest?.('[data-tabela-date-picker]');
      if (!inField && !inPicker) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      event.preventDefault();
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen]);

  const openCalendar = () => {
    const base = calendarValue || new Date();
    setViewDate({ mode: 'days', year: base.getFullYear(), month: base.getMonth() });
    setIsOpen((prev) => !prev);
  };

  const theme = containerRef.current?.closest?.('[data-theme]')?.getAttribute?.('data-theme') ?? 'light';

  const dropdown = isOpen ? createPortal(
    <div data-theme={portalContainer === document.body ? theme : undefined} style={portalContainer === document.body ? { display: 'contents' } : undefined}>
      <div
        ref={dropdownRef}
        data-tabela-date-picker=""
        className={styles.filterDateInput__popover}
        style={{
          position: portalContainer === document.body ? 'fixed' : 'absolute',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }}
      >
        <DatePickerCalendar
          value={calendarValue}
          format="data"
          viewDate={viewDate}
          onViewDateChange={setViewDate}
          onChange={(date) => {
            const iso = toIsoDate(date);
            if (!iso) return;
            onChange?.(iso);
            setText(isoToDisplay(iso));
            setIsOpen(false);
          }}
          onSelectComplete={() => setIsOpen(false)}
        />
      </div>
    </div>,
    portalContainer
  ) : null;

  return (
    <div ref={containerRef} className={`${styles.filterDateInput} ${className}`.trim()}>
      <input
        id={id}
        className={styles.filterDateInput__field}
        value={text}
        onChange={handleTextChange}
        onBlur={() => commitText(text)}
        placeholder={placeholder}
        title={title}
        inputMode="numeric"
        autoComplete="off"
        aria-label={title || 'Data'}
      />
      <button
        type="button"
        className={styles.filterDateInput__button}
        onMouseDown={(event) => event.preventDefault()}
        onClick={openCalendar}
        aria-label="Abrir calendário"
        aria-expanded={isOpen}
      >
        <i className="far fa-calendar" />
      </button>
      {dropdown}
    </div>
  );
}

function parseIsoOrToday(value) {
  const iso = toIsoDate(value);
  if (!iso) return new Date();
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}
