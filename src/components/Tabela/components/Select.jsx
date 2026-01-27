import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import styles from '../Tabela.module.css';

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
  style = {}
}, ref) => {
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');

  // Encontrar índice da opção selecionada
  const selectedIndex = options.findIndex(opt => opt.value === value);
  const selectedOption = options[selectedIndex] || null;

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
  }, [isOpen, highlightedIndex, filteredOptions, disabled]);

  // Selecionar opção
  const handleSelect = useCallback((selectedValue, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    onChange?.(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  }, [onChange]);

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
      
      const container = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Estimar altura do dropdown (máximo 200px)
      const estimatedDropdownHeight = Math.min(filteredOptions.length * 36 + 8, 200);
      const estimatedDropdownWidth = Math.max(container.width, 200);

      // Verificar se cabe abaixo
      const spaceBelow = viewportHeight - container.bottom;
      const spaceAbove = container.top;

      let top = container.bottom + scrollY;
      let left = container.left + scrollX;

      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        top = container.top + scrollY - estimatedDropdownHeight;
      }

      if (container.left + estimatedDropdownWidth > viewportWidth) {
        left = viewportWidth - estimatedDropdownWidth + scrollX;
        if (left < scrollX) left = scrollX;
      }

      if (left < scrollX) {
        left = scrollX;
      }

      setDropdownPosition({ 
        top, 
        left, 
        position: 'absolute',
        width: `${Math.max(container.width, 120)}px`,
        minWidth: `${container.width}px`
      });
    };

    updatePosition();
    const timeoutId = setTimeout(updatePosition, 0);
    
    return () => clearTimeout(timeoutId);
  }, [isOpen, filteredOptions.length]);

  return (
    <div 
      ref={containerRef}
      className={`${styles.select} ${className} ${disabled ? styles.disabled : ''}`}
      style={style}
    >
      {/* Trigger - Botão que abre o dropdown */}
      <button
        type="button"
        className={`${styles.select__trigger} ${isOpen ? styles.open : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.select__trigger__text}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i className={`fas fa-chevron-down ${styles.select__trigger__icon} ${isOpen ? styles.rotated : ''}`} />
      </button>

      {/* Dropdown via Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className={styles.select__dropdown}
          style={{
            position: dropdownPosition.position,
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: dropdownPosition.width,
            minWidth: dropdownPosition.minWidth,
            zIndex: 10000
          }}
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className={styles.select__option} style={{ color: '#9ca3af', cursor: 'default' }}>
              Nenhuma opção encontrada
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
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
        </div>,
        document.body
      )}
    </div>
  );
}));

Select.displayName = 'Select';
