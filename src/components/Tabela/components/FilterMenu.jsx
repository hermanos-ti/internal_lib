import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS, FILTER_CONDITIONS, EMPTY_CONDITIONS, RANGE_CONDITIONS } from '../constants';
import { Select } from './Select';

export const FilterMenu = memo(forwardRef(({ 
  menuState,
  filterItem,
  onClose, 
  onUpdateFilter,
  onRemoveFilter,
  onOpenAdvancedFilter,
  refList,
  getExtraRefs
}, ref) => {
  const menuRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Local state for filter editing
  const [localCondition, setLocalCondition] = useState('');
  const [localValue, setLocalValue] = useState('');
  const [localValueTo, setLocalValueTo] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // Refs para rastrear valores anteriores e evitar debounce desnecessário
  const prevValuesRef = useRef({ condition: '', value: '', valueTo: '' });
  const onUpdateFilterRef = useRef(onUpdateFilter);
  
  // Session management refs (CRÍTICO para evitar race conditions)
  const currentSessionRef = useRef(null);
  const menuStateSessionRef = useRef(null);
  const prevSessionRef = useRef(null);
  const closeTimerRef = useRef(null);
  const isClosingRef = useRef(false);
  const actionMenuRef = useRef(null);
  
  useEffect(() => {
    onUpdateFilterRef.current = onUpdateFilter;
  }, [onUpdateFilter]);

  useEffect(() => {
    menuStateSessionRef.current = menuState.sessionId;
    
    if (menuState.isOpen && menuState.type === 'filter-menu') {
      const isNewSession = prevSessionRef.current !== menuState.sessionId;
      
      currentSessionRef.current = menuState.sessionId;
      setIsVisible(true);
      
      if (isNewSession && !closeTimerRef.current) {
        isClosingRef.current = false;
        setIsClosing(false);
      }
      
      if (closeTimerRef.current && isNewSession && !isClosingRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      
      if (isNewSession && filterItem) {
        prevSessionRef.current = menuState.sessionId;
        const newCondition = filterItem.condition || getDefaultCondition(filterItem.type);
        const newValue = filterItem.value || '';
        const newValueTo = filterItem.valueTo || '';
        
        setLocalCondition(newCondition);
        setLocalValue(newValue);
        setLocalValueTo(newValueTo);
        
        prevValuesRef.current = {
          condition: newCondition,
          value: newValue,
          valueTo: newValueTo,
        };
      }
    }
  }, [menuState.isOpen, menuState.sessionId, menuState.type, filterItem]);

  const getDefaultCondition = useCallback((type) => {
    const conditions = FILTER_CONDITIONS[type] || FILTER_CONDITIONS.text;
    return conditions[0]?.value || 'is';
  }, []);

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) {
      return;
    }
    
    const closingSessionId = currentSessionRef.current;
    
    isClosingRef.current = true;
    setIsClosing(true);
    
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      
      if (currentSessionRef.current !== closingSessionId) {
        isClosingRef.current = false;
        setIsClosing(false);
        return;
      }
      
      setIsVisible(false);
      isClosingRef.current = false;
      setIsClosing(false);
      onClose(closingSessionId);
    }, 180);
  }, [onClose]);

  // Expor métodos via ref
  useImperativeHandle(ref, () => ({
    close: handleClose,
    getElement: () => menuRef.current
  }), [handleClose]);

  // Click outside handler
  useEffect(() => {
    if (!isVisible || isClosing) return;

    const handleClickOutside = (event) => {
      const clickedOnSelectDropdown = event.target?.closest?.(`.${styles.select__dropdown}`);
      if (clickedOnSelectDropdown) {
        return;
      }
      
      const extraRefs = getExtraRefs?.() || [];
      const allRefs = [...(refList || []), ...extraRefs];
      const isClickOnRef = allRefs.some(r => r?.contains?.(event.target));
      
      if (menuRef.current && !menuRef.current.contains(event.target) && !isClickOnRef) {
        handleClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, isClosing, handleClose, refList, getExtraRefs]);

  // Escape key handler
  useEffect(() => {
    if (!isVisible || isClosing) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, isClosing, handleClose]);

  useEffect(() => {
    if (!filterItem) return;
    
    const valuesChanged = 
      prevValuesRef.current.condition !== localCondition ||
      prevValuesRef.current.value !== localValue ||
      prevValuesRef.current.valueTo !== localValueTo;
    
    if (!valuesChanged) {
      return;
    }
    
    prevValuesRef.current = {
      condition: localCondition,
      value: localValue,
      valueTo: localValueTo,
    };
    
    const timeoutId = setTimeout(() => {
      const updatedFilter = {
        ...filterItem,
        condition: localCondition,
        value: localValue,
        valueTo: localValueTo,
      };
      onUpdateFilterRef.current(updatedFilter);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [localCondition, localValue, localValueTo, filterItem]);

  const handleRemoveFilter = useCallback(() => {
    if (!filterItem) return;
    setShowActionMenu(false);
    onRemoveFilter(filterItem.id);
    handleClose();
  }, [filterItem, onRemoveFilter, handleClose]);

  const handleAddToAdvanced = useCallback(() => {
    if (!filterItem) return;
    
    const updatedFilter = {
      ...filterItem,
      condition: localCondition,
      value: localValue,
      valueTo: localValueTo,
    };
    
    setShowActionMenu(false);
    onOpenAdvancedFilter(updatedFilter);
  }, [filterItem, localCondition, localValue, localValueTo, onOpenAdvancedFilter]);

  useEffect(() => {
    if (!showActionMenu) return;

    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

  const isEmptyCondition = EMPTY_CONDITIONS.includes(localCondition);
  const isRangeCondition = RANGE_CONDITIONS.includes(localCondition);
  const availableConditions = filterItem 
    ? (FILTER_CONDITIONS[filterItem.type] || FILTER_CONDITIONS.text)
    : FILTER_CONDITIONS.text;

  const getColumnIcon = useCallback((type) => {
    return COLUMN_ICONS[type ?? 'text'];
  }, []);

  if (!isVisible || menuState.type !== 'filter-menu' || !filterItem) {
    return null;
  }

  const menuStyle = {
    position: 'absolute',
    top: `${menuState.position.top}px`,
    left: `${menuState.position.left}px`,
    zIndex: 1000
  };

  return (
    <div 
      ref={menuRef} 
      className={`${styles.filterMenu} ${isClosing ? styles.closing : ''}`} 
      style={menuStyle}
    >
      {/* Header com coluna selecionada e menu de ações */}
      <div className={styles.filterMenu__header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <div className={styles.filterMenu__header__icon}>
            <i className={getColumnIcon(filterItem.type)} />
          </div>
          <span className={styles.filterMenu__header__title}>
            {filterItem.label}
          </span>
        </div>
        <div className={styles.filterMenu__header__actions} ref={actionMenuRef}>
          <button
            className={styles.filterMenu__header__actionBtn}
            onClick={() => setShowActionMenu(!showActionMenu)}
            title="Ações"
          >
            <i className="fas fa-ellipsis-vertical" />
          </button>
          {showActionMenu && (
            <div className={styles.filterMenu__header__actionDropdown}>
              <button
                className={styles.filterMenu__header__actionDropdown__item}
                onClick={handleAddToAdvanced}
              >
                <i className={`far fa-layer-group ${styles.filterMenu__header__actionDropdown__icon}`} />
                Adicionar ao Filtro Avançado
              </button>
              <button
                className={`${styles.filterMenu__header__actionDropdown__item} ${styles.danger}`}
                onClick={handleRemoveFilter}
              >
                <i className={`far fa-trash ${styles.filterMenu__header__actionDropdown__icon}`} />
                Remover Filtro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body com campos do filtro */}
      <div className={styles.filterMenu__body}>
        {/* Campo de Condição */}
        <div className={styles.filterMenu__field}>
          <label className={styles.filterMenu__field__label}>Condição</label>
          <Select
            value={localCondition}
            onChange={setLocalCondition}
            options={availableConditions}
            placeholder="Selecione uma condição..."
          />
        </div>

        {/* Campo de Valor (esconde para condições vazias) */}
        {!isEmptyCondition && (
          <div className={styles.filterMenu__field}>
            <label className={styles.filterMenu__field__label}>
              {isRangeCondition ? 'De' : 'Valor'}
            </label>
            {filterItem.type === 'date' ? (
              <input
                type="date"
                className={styles.filterMenu__field__input}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
              />
            ) : filterItem.type === 'number' ? (
              <input
                type="number"
                className={styles.filterMenu__field__input}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder="Digite um valor..."
              />
            ) : (
              <input
                type="text"
                className={styles.filterMenu__field__input}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder="Digite um valor..."
              />
            )}
          </div>
        )}

        {/* Segundo campo de valor para condições range */}
        {!isEmptyCondition && isRangeCondition && (
          <div className={styles.filterMenu__field}>
            <label className={styles.filterMenu__field__label}>Até</label>
            {filterItem.type === 'date' ? (
              <input
                type="date"
                className={styles.filterMenu__field__input}
                value={localValueTo}
                onChange={(e) => setLocalValueTo(e.target.value)}
              />
            ) : filterItem.type === 'number' ? (
              <input
                type="number"
                className={styles.filterMenu__field__input}
                value={localValueTo}
                onChange={(e) => setLocalValueTo(e.target.value)}
                placeholder="Digite um valor..."
              />
            ) : (
              <input
                type="text"
                className={styles.filterMenu__field__input}
                value={localValueTo}
                onChange={(e) => setLocalValueTo(e.target.value)}
                placeholder="Digite um valor..."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}));

FilterMenu.displayName = 'FilterMenu';