import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styles from '../Tabela.module.css';
import { PortalTargetContext } from '../PortalTargetContext';

/**
 * Select - Componente de seleção customizado
 * 
 * Substitui o select nativo do navegador por um dropdown customizado
 * com animações suaves, navegação por teclado e visual moderno.
 */
export const Select = memo(forwardRef(({ 
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  disabled = false,
  className = '',
  style = {},
  multiple = false,
}, ref) => {
  const getPortalContainer = useContext(PortalTargetContext);
  
  // Viewport → relativo ao container do portal
  const convertToPortalRelativePosition = useCallback((viewportPosition) => {
    const container = (typeof getPortalContainer === 'function' ? getPortalContainer() : getPortalContainer) ?? document.body;

    if (container === document.body) {
      return viewportPosition;
    }

    const rect = container?.getBoundingClientRect?.();
    if (!rect) {
      return viewportPosition;
    }

    return {
      top: viewportPosition.top - rect.top,
      left: viewportPosition.left - rect.left,
    };
  }, [getPortalContainer]);

  const portalContainer = (typeof getPortalContainer === 'function' ? getPortalContainer() : getPortalContainer) ?? document.body;

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedValues = useMemo(() => {
    if (!multiple) return [];
    if (Array.isArray(value)) return value.map((item) => String(item));
    if (value == null || value === '') return [];
    return [String(value)];
  }, [multiple, value]);
  const selectedIndex = multiple
    ? options.findIndex((opt) => selectedValues.includes(String(opt.value)))
    : options.findIndex(opt => opt.value === value);
  const selectedOption = multiple ? null : (options[selectedIndex] || null);
  const selectedChips = multiple
    ? selectedValues.map((item) => {
      const match = options.find((opt) => String(opt.value) === item);
      return { value: item, label: match?.label ?? item };
    })
    : [];

  // Filtrar opções baseado no termo de busca (se houver)
  const filteredOptions = searchTerm
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Expor métodos via ref
  useImperativeHandle(ref, () => ({
    focus: () => containerRef.current?.querySelector(`.${styles.select__trigger}`)?.focus(),
    blur: () => containerRef.current?.querySelector(`.${styles.select__trigger}`)?.blur(),
    getValue: () => value,
    setValue: (newValue) => onChange?.(newValue)
  }), [value, onChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const clickedOutsideContainer = containerRef.current && !containerRef.current.contains(event.target);
      const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      
      if (clickedOutsideContainer && clickedOutsideDropdown) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = useCallback((selectedValue, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (multiple) {
      const key = String(selectedValue);
      const next = selectedValues.includes(key)
        ? selectedValues.filter((item) => item !== key)
        : [...selectedValues, key];
      onChange?.(next);
      return;
    }
    onChange?.(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  }, [multiple, onChange, selectedValues]);

  const handleRemoveChip = useCallback((chipValue, event) => {
    event.stopPropagation();
    event.preventDefault();
    onChange?.(selectedValues.filter((item) => item !== chipValue));
  }, [onChange, selectedValues]);

  // Navegação por teclado
  const handleKeyDown = useCallback((event) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => {
            const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
            // Scroll para a opção destacada
            const optionElement = dropdownRef.current?.children[next];
            if (optionElement) {
              optionElement.scrollIntoView({ block: 'nearest' });
            }
            return next;
          });
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => {
            const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
            // Scroll para a opção destacada
            const optionElement = dropdownRef.current?.children[next];
            if (optionElement) {
              optionElement.scrollIntoView({ block: 'nearest' });
            }
            return next;
          });
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value, event);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;

      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;

      default:
        // Busca por teclado (primeira letra)
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          const matchingIndex = filteredOptions.findIndex(opt =>
            opt.label.toLowerCase().startsWith(event.key.toLowerCase())
          );
          if (matchingIndex >= 0) {
            setHighlightedIndex(matchingIndex);
            const optionElement = dropdownRef.current?.children[matchingIndex];
            if (optionElement) {
              optionElement.scrollIntoView({ block: 'nearest' });
            }
          }
        }
        break;
    }
  }, [isOpen, highlightedIndex, filteredOptions, disabled, handleSelect]);

  // Toggle dropdown
  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [disabled, isOpen, selectedIndex]);

  // Calcular posição do dropdown (evitar sair da tela) - para portal
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, position: 'absolute', width: 'auto', minWidth: 'auto' });
  
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Usar setTimeout para garantir que o dropdown foi renderizado no portal
    const updatePosition = () => {
      if (!containerRef.current) return;
      
      const triggerRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const estimatedDropdownHeight = Math.min(filteredOptions.length * 36 + 8, 200);
      const estimatedDropdownWidth = Math.max(triggerRect.width, 200);

      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let viewportTop = triggerRect.bottom;
      let viewportLeft = triggerRect.left;
      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        viewportTop = triggerRect.top - estimatedDropdownHeight;
      }
      if (viewportLeft + estimatedDropdownWidth > viewportWidth) {
        viewportLeft = viewportWidth - estimatedDropdownWidth;
      }
      if (viewportLeft < 0) viewportLeft = 0;

      const relativePosition = convertToPortalRelativePosition({ top: viewportTop, left: viewportLeft });

      setDropdownPosition({ 
        top: relativePosition.top, 
        left: relativePosition.left, 
        position: 'absolute',
        width: 'max-content',
        minWidth: `${Math.max(triggerRect.width, 120)}px`,
        maxWidth: '320px'
      });
    };

    updatePosition();
    const timeoutId = setTimeout(updatePosition, 0);
    
    return () => clearTimeout(timeoutId);
  }, [isOpen, filteredOptions.length, convertToPortalRelativePosition]);

  return (
    <div 
      ref={containerRef}
      className={`${styles.select} ${className} ${disabled ? styles.disabled : ''}`}
      style={style}
    >
      <div
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        className={`${styles.select__trigger} ${multiple ? styles.multiple : ''} ${isOpen ? styles.open : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        {multiple ? (
          selectedChips.length > 0 ? (
            <span className={styles.select__chips}>
              {selectedChips.map((chip) => (
                <span key={chip.value} className={styles.select__chip}>
                  <span className={styles.select__chip__label}>{chip.label}</span>
                  <button
                    type="button"
                    className={styles.select__chip__remove}
                    aria-label={`Remover ${chip.label}`}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => handleRemoveChip(chip.value, event)}
                  >
                    <i className="far fa-xmark" />
                  </button>
                </span>
              ))}
            </span>
          ) : (
            <span className={styles.select__trigger__placeholder}>{placeholder}</span>
          )
        ) : (
          <span className={styles.select__trigger__text}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}
        <i className={`fas fa-chevron-down ${styles.select__trigger__icon} ${isOpen ? styles.rotated : ''}`} />
      </div>

      {/* Dropdown via Portal */}
      {isOpen && (() => {
        const dropdownContent = (
          <div 
            ref={dropdownRef}
            className={styles.select__dropdown}
            style={{
              position: dropdownPosition.position,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: dropdownPosition.width,
              minWidth: dropdownPosition.minWidth,
              maxWidth: dropdownPosition.maxWidth,
              zIndex: 10000
            }}
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className={styles.select__option} style={{ color: 'var(--text-muted)', cursor: 'default' }}>
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = multiple
                  ? selectedValues.includes(String(option.value))
                  : option.value === value;
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <div
                    key={option.value}
                    className={`${styles.select__option} ${isSelected ? styles.selected : ''} ${isHighlighted ? styles.highlighted : ''}`}
                    onClick={(e) => handleSelect(option.value, e)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {option.label}
                    {isSelected && (
                      <i className={`far fa-check ${styles.select__option__check}`} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        );
        const portalTheme = containerRef.current?.closest?.('[data-theme]')?.getAttribute?.('data-theme') ?? 'light';
        return createPortal(
          portalContainer === document.body ? <div data-theme={portalTheme} style={{ display: 'contents' }}>{dropdownContent}</div> : dropdownContent,
          portalContainer
        );
      })()}
    </div>
  );
}));

Select.displayName = 'Select';
