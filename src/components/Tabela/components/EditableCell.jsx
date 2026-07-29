import { useState, useRef, useEffect, useCallback, memo, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styles from '../Tabela.module.css';
import { PortalTargetContext } from '../PortalTargetContext';
import { isNumericFormat, parseLocaleNumber } from '../formatUtils';

function normalizeEditConfig(editable) {
  if (editable === true) return { type: 'text' };
  if (editable && typeof editable === 'object') return editable;
  return null;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
}

function normalizeCommittedValue(value, columnFormat) {
  if (!isNumericFormat(columnFormat)) return value;
  const parsed = parseLocaleNumber(value);
  if (parsed == null) return value;
  if (columnFormat === 'integer') return Math.round(parsed);
  return parsed;
}

function TextEditor({ value, columnFormat, onCommit, onCancel, onNavigate }) {
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef(null);
  const committedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus?.();
    inputRef.current?.select?.();
  }, []);

  const commitOnce = useCallback((val, navigate) => {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(normalizeCommittedValue(val, columnFormat));
    if (navigate) onNavigate(navigate);
  }, [onCommit, onNavigate, columnFormat]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      committedRef.current = true;
      onCancel();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      commitOnce(draft, e.shiftKey ? 'up' : 'down');
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      commitOnce(draft, e.shiftKey ? 'left' : 'right');
      return;
    }
  };

  const handleBlur = useCallback(() => {
    commitOnce(draft, null);
  }, [draft, commitOnce]);

  return (
    <input
      ref={inputRef}
      className={styles.tabela__editInput}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}

function SelectEditor({ value, options: rawOptions, multiple, onCommit, onCancel, onNavigate }) {
  const options = normalizeOptions(rawOptions);
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const committedRef = useRef(false);

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

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 'auto', minWidth: 120 });
  const [positionReady, setPositionReady] = useState(false);

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter(opt =>
      String(opt.label ?? '').toLowerCase().includes(term) ||
      String(opt.value ?? '').toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const initValue = useCallback(() => {
    if (multiple) {
      if (Array.isArray(value)) return [...value];
      if (value == null || value === '') return [];
      return [value];
    }
    return value ?? '';
  }, [value, multiple]);

  const [draft, setDraft] = useState(initValue);

  useEffect(() => {
    if (!isOpen) {
      setPositionReady(false);
      return;
    }
    if (!containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const triggerRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const headerHeight = multiple ? 88 : 44;
      const estimatedDropdownHeight = Math.min(filteredOptions.length * 36 + headerHeight + 8, 280);
      const dropdownWidth = Math.max(triggerRect.width, 180);

      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let viewportTop = triggerRect.bottom;
      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        viewportTop = triggerRect.top - estimatedDropdownHeight;
      }

      let viewportLeft = triggerRect.left;
      if (viewportLeft + dropdownWidth > viewportWidth) viewportLeft = viewportWidth - dropdownWidth;
      if (viewportLeft < 0) viewportLeft = 0;

      const relative = convertToPortalRelativePosition({ top: viewportTop, left: viewportLeft });
      setDropdownPosition({
        top: relative.top,
        left: relative.left,
        width: `${Math.max(triggerRect.width, 180)}px`,
        minWidth: `${triggerRect.width}px`,
      });
      setPositionReady(true);
    };

    updatePosition();
    const t = setTimeout(updatePosition, 0);
    return () => clearTimeout(t);
  }, [isOpen, filteredOptions.length, multiple, convertToPortalRelativePosition]);

  useEffect(() => {
    if (isOpen && positionReady) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen, positionReady]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const commitOnce = useCallback((val, navigate) => {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(val);
    if (navigate) onNavigate(navigate);
  }, [onCommit, onNavigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inContainer = containerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inContainer && !inDropdown) {
        commitOnce(draft, null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [draft, commitOnce]);

  const handleSingleSelect = (optValue) => {
    commitOnce(optValue, null);
  };

  const handleMultiToggle = (optValue) => {
    setDraft(prev => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      const idx = arr.indexOf(optValue);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(optValue);
      return arr;
    });
  };

  const handleSelectAll = () => {
    setDraft(filteredOptions.map(o => o.value));
  };

  const handleRemoveAll = () => {
    setDraft([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      committedRef.current = true;
      onCancel();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      commitOnce(draft, e.shiftKey ? 'up' : 'down');
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      commitOnce(draft, e.shiftKey ? 'left' : 'right');
      return;
    }
  };

  const getDisplayLabel = () => {
    if (multiple) {
      const arr = Array.isArray(draft) ? draft : [];
      if (arr.length === 0) return 'Selecionar...';
      return arr.map(v => {
        const opt = options.find(o => o.value === v);
        return opt ? opt.label : v;
      }).join(', ');
    }
    const opt = options.find(o => o.value === draft);
    return opt ? opt.label : (draft || 'Selecionar...');
  };

  const dropdownContent = isOpen && positionReady ? (
    <div
      ref={dropdownRef}
      className={styles.tabela__editSelect__dropdown}
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        right: 'auto',
        width: dropdownPosition.width,
        minWidth: dropdownPosition.minWidth,
        zIndex: 10000,
      }}
    >
      <div className={styles.tabela__editSelect__searchRow}>
        <input
          ref={searchInputRef}
          type="text"
          className={styles.tabela__editSelect__searchInput}
          placeholder="Pesquisa"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
      {multiple && (
        <div className={styles.tabela__editSelect__actions}>
          <button
            type="button"
            className={styles.tabela__editSelect__actionBtn}
            onClick={(e) => { e.stopPropagation(); handleSelectAll(); }}
          >
            Selecionar todos
          </button>
          <button
            type="button"
            className={styles.tabela__editSelect__actionBtn}
            onClick={(e) => { e.stopPropagation(); handleRemoveAll(); }}
          >
            Remover todos
          </button>
        </div>
      )}
      <div className={styles.tabela__editSelect__list}>
        {filteredOptions.map((opt) => {
          const isSelected = multiple
            ? (Array.isArray(draft) && draft.includes(opt.value))
            : draft === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`${styles.tabela__editSelect__option} ${isSelected ? styles.tabela__editSelect__optionSelected : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (multiple) handleMultiToggle(opt.value);
                else handleSingleSelect(opt.value);
              }}
            >
              {multiple && (
                <span className={styles.tabela__editSelect__checkbox}>
                  <i className={`far ${isSelected ? 'fa-square-check' : 'fa-square'}`} />
                </span>
              )}
              <span>{opt.label}</span>
              {!multiple && isSelected && (
                <i className={`far fa-check ${styles.tabela__editSelect__optionCheck}`} />
              )}
            </button>
          );
        })}
        {filteredOptions.length === 0 && (
          <div className={styles.tabela__editSelect__empty}>Nenhuma opção encontrada</div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={styles.tabela__editSelect}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={styles.tabela__editSelect__trigger}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span className={styles.tabela__editSelect__label}>{getDisplayLabel()}</span>
        <i className={`far fa-chevron-${isOpen ? 'up' : 'down'} ${styles.tabela__editSelect__icon}`} />
      </button>
      {dropdownContent &&
        createPortal(
          portalContainer === document.body ? (
            <div
              data-theme={containerRef.current?.closest?.('[data-theme]')?.getAttribute?.('data-theme') ?? 'light'}
              style={{ display: 'contents' }}
            >
              {dropdownContent}
            </div>
          ) : (
            dropdownContent
          ),
          portalContainer
        )}
    </div>
  );
}

export const EditableCell = memo(({
  cellValue,
  row,
  column,
  rowIndex,
  colIndex,
  lockedWidth,
  onCommit,
  onCancel,
  onNavigate,
  isFrozen = false,
  isFrozenLast = false,
  frozenLeft = 0,
  frozenWidth = null,
}) => {
  const editConfig = normalizeEditConfig(column.editable);

  const handleCommit = useCallback((newValue) => {
    onCommit(row, column.key, newValue);
  }, [onCommit, row, column.key]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleNavigate = useCallback((direction) => {
    onNavigate(direction, rowIndex, colIndex);
  }, [onNavigate, rowIndex, colIndex]);

  if (!editConfig) return null;

  const cellStyle = {
    ...(column?.cellStyle || {}),
    ...(typeof lockedWidth === 'number' && lockedWidth > 0
      ? {
          width: `${lockedWidth}px`,
          minWidth: `${lockedWidth}px`,
          maxWidth: `${lockedWidth}px`,
        }
      : isFrozen && typeof frozenWidth === 'number'
        ? {
            width: `${frozenWidth}px`,
            minWidth: `${frozenWidth}px`,
            maxWidth: `${frozenWidth}px`,
          }
        : {}),
    ...(isFrozen ? { '--frozen-left': `${frozenLeft}px` } : {}),
  };

  return (
    <td
      className={[
        styles.tabela__body__cell,
        styles.tabela__body__cell__editing,
        column?.cellClassName || '',
        isFrozen ? styles.isFrozen : '',
        isFrozenLast ? styles.isFrozenLast : '',
      ].filter(Boolean).join(' ')}
      style={cellStyle}
      data-tabela-cell-col={column?.key}
    >
      {editConfig.type === 'select' ? (
        <SelectEditor
          value={cellValue}
          options={editConfig.options || []}
          multiple={editConfig.multiple || false}
          onCommit={handleCommit}
          onCancel={handleCancel}
          onNavigate={handleNavigate}
        />
      ) : (
        <TextEditor
          value={cellValue}
          columnFormat={column.format ?? 'text'}
          onCommit={handleCommit}
          onCancel={handleCancel}
          onNavigate={handleNavigate}
        />
      )}
    </td>
  );
});

EditableCell.displayName = 'EditableCell';
