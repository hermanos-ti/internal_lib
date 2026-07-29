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

  const getDefaultCondition = useCallback((type) => {
    const conditions = FILTER_CONDITIONS[type] || FILTER_CONDITIONS.text;
    return conditions[0]?.value || 'is';
  }, []);

  const normalizeFromItem = useCallback((item) => {
    if (!item) return { condition: '', value: '', valueTo: '' };
    return {
      condition: item.condition || getDefaultCondition(item.type),
      value: item.value ?? '',
      valueTo: item.valueTo ?? '',
    };
  }, [getDefaultCondition]);

  const initialValues = normalizeFromItem(filterItem);
  
  // Local state for filter editing — hydrate from filterItem to avoid empty→default false updates
  const [localCondition, setLocalCondition] = useState(initialValues.condition);
  const [localValue, setLocalValue] = useState(initialValues.value);
  const [localValueTo, setLocalValueTo] = useState(initialValues.valueTo);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  const prevValuesRef = useRef(initialValues);
  const onUpdateFilterRef = useRef(onUpdateFilter);
  const pendingUpdateRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const filterItemRef = useRef(filterItem);
  const skipDebounceRef = useRef(true); // skip first debounce after hydrate/open
  
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
    filterItemRef.current = filterItem;
  }, [filterItem]);

  const isMeaningfulChange = useCallback((update, baselineItem) => {
    if (!update) return false;
    const baseline = normalizeFromItem(baselineItem);
    return (
      update.condition !== baseline.condition ||
      String(update.value ?? '') !== String(baseline.value ?? '') ||
      String(update.valueTo ?? '') !== String(baseline.valueTo ?? '')
    );
  }, [normalizeFromItem]);

  const flushPendingUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const update = pendingUpdateRef.current;
    if (!update) return false;

    // Never push no-op updates (open/close without edits)
    if (!isMeaningfulChange(update, filterItemRef.current)) {
      pendingUpdateRef.current = null;
      prevValuesRef.current = {
        condition: update.condition,
        value: update.value,
        valueTo: update.valueTo,
      };
      return false;
    }

    pendingUpdateRef.current = null;
    prevValuesRef.current = {
      condition: update.condition,
      value: update.value,
      valueTo: update.valueTo,
    };
    onUpdateFilterRef.current(update);
    return true;
  }, [isMeaningfulChange]);

  // Flush meaningful pending edits on unmount only
  useEffect(() => () => { flushPendingUpdate(); }, [flushPendingUpdate]);

  useEffect(() => {
    menuStateSessionRef.current = menuState.sessionId;
    
    if (menuState.isOpen && menuState.type === 'filter-menu') {
      const isNewSession = prevSessionRef.current !== menuState.sessionId;
      
      currentSessionRef.current = menuState.sessionId;
      setIsVisible(true);
      
      if (isNewSession) {
        flushPendingUpdate();

        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        isClosingRef.current = false;
        setIsClosing(false);
      }
      
      if (isNewSession && filterItem) {
        prevSessionRef.current = menuState.sessionId;
        const hydrated = normalizeFromItem(filterItem);
        
        skipDebounceRef.current = true;
        setLocalCondition(hydrated.condition);
        setLocalValue(hydrated.value);
        setLocalValueTo(hydrated.valueTo);
        
        prevValuesRef.current = hydrated;
        pendingUpdateRef.current = null;
      }
    }
  }, [menuState.isOpen, menuState.sessionId, menuState.type, filterItem, flushPendingUpdate, normalizeFromItem]);

  const handleClose = useCallback(() => {
    flushPendingUpdate();

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
  }, [onClose, filterItem?.key, flushPendingUpdate]);

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

      // Filter chips use data attribute — refs can be empty during chip remount
      const clickedOnFilterChip = event.target?.closest?.('[data-tabela-filter-chip]');
      if (clickedOnFilterChip) {
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

    // After hydrate/open, sync refs and skip one cycle — prevents empty→default false updates
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      prevValuesRef.current = {
        condition: localCondition,
        value: localValue,
        valueTo: localValueTo,
      };
      pendingUpdateRef.current = null;
      return;
    }
    
    const valuesChanged = 
      prevValuesRef.current.condition !== localCondition ||
      prevValuesRef.current.value !== localValue ||
      prevValuesRef.current.valueTo !== localValueTo;
    
    if (!valuesChanged) {
      return;
    }

    const updatedFilter = {
      ...filterItem,
      condition: localCondition,
      value: localValue,
      valueTo: localValueTo,
    };

    // Don't queue if nothing actually changed vs committed filter
    if (!isMeaningfulChange(updatedFilter, filterItem)) {
      prevValuesRef.current = {
        condition: localCondition,
        value: localValue,
        valueTo: localValueTo,
      };
      pendingUpdateRef.current = null;
      return;
    }

    pendingUpdateRef.current = updatedFilter;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      flushPendingUpdate();
    }, 250);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [localCondition, localValue, localValueTo, filterItem, flushPendingUpdate, isMeaningfulChange]);

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
    left: `${menuState.position.left}px`,
    ...(menuState.position.verticalAnchor === 'bottom' && menuState.position.bottom != null
      ? { bottom: `${menuState.position.bottom}px` }
      : { top: `${menuState.position.top}px` }
    ),
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
            type="button"
            className={styles.filterMenu__header__actionBtn}
            onClick={() => setShowActionMenu(!showActionMenu)}
            title="Ações do filtro"
            aria-label="Ações do filtro"
          >
            <i className="fas fa-ellipsis-vertical" />
          </button>
          {showActionMenu && (
            <div className={styles.filterMenu__header__actionDropdown}>
              <button
                type="button"
                className={styles.filterMenu__header__actionDropdown__item}
                onClick={handleAddToAdvanced}
                title="Move este filtro para o editor avançado"
              >
                <i className={`far fa-layer-group ${styles.filterMenu__header__actionDropdown__icon}`} />
                Adicionar ao Filtro Avançado
              </button>
              <button
                type="button"
                className={`${styles.filterMenu__header__actionDropdown__item} ${styles.danger}`}
                onClick={handleRemoveFilter}
                title="Remove este filtro da tabela"
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
            <label className={styles.filterMenu__field__label} htmlFor={`filter-value-${filterItem.key}`}>
              {isRangeCondition ? 'De' : 'Valor'}
            </label>
            <input
              id={`filter-value-${filterItem.key}`}
              className={styles.filterMenu__field__input}
              type={filterItem.type === 'date' ? 'date' : filterItem.type === 'number' ? 'number' : 'text'}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={filterItem.type === 'date' ? undefined : 'Digite um valor...'}
              title="Valor usado para comparar com os dados da coluna"
            />
          </div>
        )}

        {!isEmptyCondition && isRangeCondition && (
          <div className={styles.filterMenu__field}>
            <label className={styles.filterMenu__field__label} htmlFor={`filter-value-to-${filterItem.key}`}>
              Até
            </label>
            <input
              id={`filter-value-to-${filterItem.key}`}
              className={styles.filterMenu__field__input}
              type={filterItem.type === 'date' ? 'date' : filterItem.type === 'number' ? 'number' : 'text'}
              value={localValueTo}
              onChange={(e) => setLocalValueTo(e.target.value)}
              placeholder={filterItem.type === 'date' ? undefined : 'Digite um valor...'}
              title="Limite superior do intervalo de filtro"
            />
          </div>
        )}
      </div>
    </div>
  );
}));

FilterMenu.displayName = 'FilterMenu';