import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './SelectInput.module.css';
import { useSelectDropdown } from './useSelectDropdown';
import { useSelectOptions } from './useSelectOptions';
import { SelectInputVirtualList } from './SelectInputVirtualList';

const MAX_VISIBLE_CHIPS = 3;

export const SelectInput = forwardRef(
  (
    {
      value = '',
      onChange,
      onAdd,
      onRemove,
      id,
      disabled,
      className,
      options = [],
      placeholder = 'Selecione...',
      multiple = false,
      ...rest
    },
    ref
  ) => {
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const valueBeforeOpenRef = useRef(null);

    const {
      filteredOptions,
      selectedValues,
      allSelected,
      normalizedOptions,
    } = useSelectOptions(options, searchTerm, multiple, value);

    const selectedCount = multiple ? (Array.isArray(value) ? value : []).length : 0;

    const { position, positionReady } = useSelectDropdown({
      triggerRef: containerRef,
      isOpen,
      onClose: () => setIsOpen(false),
      optionsCount: filteredOptions.length,
      multiple,
      hasSearch: false,
      hasSelectAll: multiple,
      selectedChipsCount: selectedCount,
      portalContainer: document.body,
    });

    const normalizedValue = useCallback(() => {
      if (multiple) {
        return Array.isArray(value) ? value : value != null && value !== '' ? [value] : [];
      }
      return value ?? '';
    }, [multiple, value]);

    useImperativeHandle(ref, () => ({
      focus: () => containerRef.current?.focus?.(),
      blur: () => containerRef.current?.blur?.(),
      getValue: () => value,
      setValue: (v) => onChange?.(v),
    }), [value, onChange]);

    useEffect(() => {
      if (!isOpen) return;
      valueBeforeOpenRef.current = normalizedValue();
      setSearchTerm('');
      setHighlightedIndex(
        filteredOptions.length > 0
          ? Math.max(
              0,
              filteredOptions.findIndex((o) =>
                multiple
                  ? selectedValues.has(o.value)
                  : selectedValues.has(o.value)
              )
            )
          : -1
      );
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const focusSearch = () => {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      };
      focusSearch();
    }, [isOpen, positionReady]);

    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e) => {
        const inContainer = containerRef.current?.contains(e.target);
        const inDropdown = dropdownRef.current?.contains(e.target);
        if (!inContainer && !inDropdown) {
          handleClose();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleClose = useCallback(() => {
      const currentValue = normalizedValue();
      const beforeOpen = valueBeforeOpenRef.current;
      const searchClearedSelection =
        searchTerm.trim() &&
        (multiple
          ? currentValue.length === 0
          : !currentValue || currentValue === '');
      if (searchClearedSelection && beforeOpen != null) {
        onChange?.(multiple ? [...(Array.isArray(beforeOpen) ? beforeOpen : [beforeOpen])] : beforeOpen);
      }
      setSearchTerm('');
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, [searchTerm, multiple, normalizedValue, onChange]);

    const handleSelect = useCallback(
      (opt, e) => {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        const optValue = typeof opt === 'object' && opt !== null ? opt.value : opt;
        const optData = typeof opt === 'object' && opt !== null ? opt : { value: opt, label: opt };
        if (multiple) {
          const arr = Array.isArray(value) ? [...value] : value != null && value !== '' ? [value] : [];
          const idx = arr.indexOf(optValue);
          if (idx >= 0) {
            arr.splice(idx, 1);
            onChange?.(arr);
            onRemove?.(optData);
          } else {
            arr.push(optValue);
            onChange?.(arr);
            onAdd?.(optData);
          }
        } else {
          onChange?.(optValue);
          handleClose();
        }
      },
      [multiple, value, onChange, onAdd, onRemove, handleClose]
    );

    const handleSelectAll = useCallback(() => {
      if (allSelected) {
        normalizedOptions.forEach((o) => onRemove?.({ value: o.value, label: o.label }));
        onChange?.([]);
      } else {
        normalizedOptions.forEach((o) => onAdd?.({ value: o.value, label: o.label }));
        onChange?.(normalizedOptions.map((o) => o.value));
      }
    }, [allSelected, normalizedOptions, onChange, onAdd, onRemove]);

    const handleRemoveChip = useCallback(
      (opt) => {
        const arr = Array.isArray(value) ? [...value] : [];
        const idx = arr.indexOf(opt.value);
        if (idx >= 0) {
          const newArr = arr.filter((_, i) => i !== idx);
          onChange?.(newArr);
          onRemove?.(opt);
        }
      },
      [value, onChange, onRemove]
    );

    const handleKeyDown = useCallback(
      (e) => {
        if (disabled) return;
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
            } else {
              setHighlightedIndex((prev) =>
                prev < filteredOptions.length - 1 ? prev + 1 : 0
              );
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            if (isOpen) {
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredOptions.length - 1
              );
            }
            break;
          case 'Enter':
            e.preventDefault();
            if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
              handleSelect(filteredOptions[highlightedIndex], e);
            } else if (!isOpen) {
              setIsOpen(true);
            }
            break;
          case ' ':
            e.preventDefault();
            if (!isOpen) setIsOpen(true);
            break;
          default:
            break;
        }
      },
      [disabled, isOpen, highlightedIndex, filteredOptions, handleSelect]
    );

    const getDisplayLabel = () => {
      if (multiple) {
        const arr = Array.isArray(value) ? value : [];
        if (arr.length === 0) return null;
        return arr
          .map((v) => {
            const opt = normalizedOptions.find((o) => o.value === v);
            return opt ? opt.label : v;
          })
          .join(', ');
      }
      const opt = normalizedOptions.find((o) => o.value === value);
      return opt ? opt.label : null;
    };

    const getTriggerDisplay = () => {
      if (isOpen && multiple) {
        return (
          <input
            ref={searchInputRef}
            type="text"
            className={styles.selectInput__inputInline}
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              const arr = Array.isArray(value) ? value : [];
              if (e.key === 'Backspace' && !searchTerm && arr.length > 0) {
                e.preventDefault();
                const lastValue = arr[arr.length - 1];
                const lastOpt = normalizedOptions.find((o) => o.value === lastValue);
                const newArr = arr.slice(0, -1);
                onChange?.(newArr);
                onRemove?.(lastOpt ? { value: lastOpt.value, label: lastOpt.label } : { value: lastValue, label: lastValue });
              } else {
                handleKeyDown(e);
              }
            }}
          />
        );
      }
      if (isOpen && !multiple) {
        return (
          <input
            ref={searchInputRef}
            type="text"
            className={styles.selectInput__inputInline}
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        );
      }
      if (multiple) {
        const arr = Array.isArray(value) ? value : [];
        const labels = arr.map((v) => {
          const opt = normalizedOptions.find((o) => o.value === v);
          return opt ? opt.label : v;
        });
        if (labels.length === 0) {
          return <span style={{ color: 'var(--input-muted)' }}>{placeholder}</span>;
        }
        const visible = labels.slice(0, MAX_VISIBLE_CHIPS);
        const restCount = labels.length - MAX_VISIBLE_CHIPS;
        return (
          <div className={styles.selectInput__chips}>
            {visible.map((label, i) => (
              <span key={i} className={styles.selectInput__chip}>
                {label}
              </span>
            ))}
            {restCount > 0 && (
              <span className={styles.selectInput__chipMore}>+{restCount}</span>
            )}
          </div>
        );
      }
      const label = getDisplayLabel();
      return label != null ? label : <span style={{ color: 'var(--input-muted)' }}>{placeholder}</span>;
    };

    const renderOption = useCallback(
      (opt, { isSelected, isHighlighted }) => (
        <div
          className={`${styles.selectInput__option} ${isSelected ? styles.selected : ''} ${isHighlighted ? styles.highlighted : ''}`}
          onClick={(e) => handleSelect(opt, e)}
          onMouseEnter={() =>
            setHighlightedIndex(filteredOptions.findIndex((o) => o.value === opt.value))
          }
        >
          {multiple && (
            <span>
              <i className={`far ${isSelected ? 'fa-square-check' : 'fa-square'}`} />
            </span>
          )}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {opt.label}
          </span>
          {!multiple && isSelected && (
            <i className={`far fa-check ${styles.selectInput__optionCheck}`} />
          )}
        </div>
      ),
      [multiple, handleSelect, filteredOptions]
    );

    const dropdownContent =
      isOpen &&
      positionReady && (
        <div
          ref={dropdownRef}
          className={styles.selectInput__dropdown}
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: position.width,
            minWidth: position.minWidth,
            maxHeight: position.maxHeight != null ? `${position.maxHeight}px` : undefined,
          }}
          role="listbox"
        >
          {multiple && (() => {
            const arr = Array.isArray(value) ? value : [];
            const opts = arr.map((v) => {
              const opt = normalizedOptions.find((o) => o.value === v);
              return opt ? { value: opt.value, label: opt.label } : { value: v, label: v };
            });
            return opts.length > 0 ? (
              <div className={styles.selectInput__selectedChips}>
                {opts.map((opt) => (
                  <span
                    key={opt.value}
                    className={`${styles.selectInput__chip} ${styles.selectInput__chipRemovable}`}
                    onDoubleClick={() => handleRemoveChip(opt)}
                    title="Duplo clique para remover"
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            ) : null;
          })()}
          {multiple && (
            <button
              type="button"
              className={`${styles.selectInput__selectAll} ${allSelected ? styles.allSelected : ''}`}
              onClick={handleSelectAll}
            >
              <i className={`far ${allSelected ? 'fa-square-check' : 'fa-square'} ${styles.selectInput__selectAll__icon}`} />
              <span>{allSelected ? 'Desmarcar todos' : 'Marcar todos'}</span>
            </button>
          )}
          <div className={styles.selectInput__list}>
            {filteredOptions.length === 0 ? (
              <div className={styles.selectInput__empty}>Nenhuma opção encontrada</div>
            ) : (
              <SelectInputVirtualList
                options={filteredOptions}
                selectedValues={selectedValues}
                highlightedIndex={highlightedIndex}
                renderOption={renderOption}
                className={styles.selectInput__list}
              />
            )}
          </div>
        </div>
      );

    const portalTheme =
      containerRef.current?.closest?.('[data-theme]')?.getAttribute?.('data-theme') ?? 'light';

    return (
      <>
        <div
          ref={containerRef}
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className={className}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            backgroundImage: 'none',
          }}
          {...rest}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {getTriggerDisplay()}
          </div>
          <i
            className={`far fa-chevron-${isOpen ? 'up' : 'down'}`}
            style={{
              fontSize: 12,
              color: 'var(--input-muted)',
              marginLeft: 8,
              flexShrink: 0,
            }}
          />
        </div>
        {dropdownContent &&
          createPortal(
            <div data-theme={portalTheme} style={{ display: 'contents' }}>
              {dropdownContent}
            </div>,
            document.body
          )}
      </>
    );
  }
);

SelectInput.displayName = 'SelectInput';
