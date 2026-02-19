import { useState, useRef, useEffect, useCallback, memo } from 'react';
import styles from '../Tabela.module.css';

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

function TextEditor({ value, onCommit, onCancel, onNavigate }) {
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef(null);
  const committedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commitOnce = useCallback((val, navigate) => {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(val);
    if (navigate) onNavigate(navigate);
  }, [onCommit, onNavigate]);

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
      type="text"
      className={styles.tabela__editInput}
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
  const containerRef = useRef(null);
  const committedRef = useRef(false);

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
      if (containerRef.current && !containerRef.current.contains(e.target)) {
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
      {isOpen && (
        <div className={styles.tabela__editSelect__dropdown}>
          {options.map((opt) => {
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
              </button>
            );
          })}
          {options.length === 0 && (
            <div className={styles.tabela__editSelect__empty}>Sem opções</div>
          )}
          {multiple && (
            <button
              type="button"
              className={styles.tabela__editSelect__confirm}
              onClick={() => commitOnce(draft, null)}
            >
              Confirmar
            </button>
          )}
        </div>
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
  onCommit,
  onCancel,
  onNavigate,
}) => {
  const editConfig = normalizeEditConfig(column.editable);
  if (!editConfig) return null;

  const handleCommit = useCallback((newValue) => {
    onCommit(row, column.key, newValue);
  }, [onCommit, row, column.key]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleNavigate = useCallback((direction) => {
    onNavigate(direction, rowIndex, colIndex);
  }, [onNavigate, rowIndex, colIndex]);

  return (
    <td
      className={`${styles.tabela__body__cell} ${styles.tabela__body__cell__editing} ${column?.cellClassName || ''}`}
      style={column?.cellStyle}
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
          onCommit={handleCommit}
          onCancel={handleCancel}
          onNavigate={handleNavigate}
        />
      )}
    </td>
  );
});

EditableCell.displayName = 'EditableCell';
