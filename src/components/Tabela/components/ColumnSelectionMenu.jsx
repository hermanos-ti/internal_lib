import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS } from '../constants';

export const ColumnSelectionMenu = memo(forwardRef(({ 
  menuState,
  columns, 
  selectedItems, 
  onClose, 
  onSelect,
  onAddAdvancedFilter,
  refList
}, ref) => {
  const menuRef = useRef(null);
  const [searchValue, setSearchValue] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const currentSessionRef = useRef(null);
  const menuStateSessionRef = useRef(null);

  useEffect(() => {
    menuStateSessionRef.current = menuState.sessionId;
    
    if (menuState.isOpen) {
      currentSessionRef.current = menuState.sessionId;
      setIsVisible(true);
      setIsClosing(false);
      setSearchValue('');
    }
  }, [menuState.isOpen, menuState.sessionId]);

  const handleClose = useCallback(() => {
    const closingSessionId = currentSessionRef.current;
    
    setIsClosing(true);
    
    const timer = setTimeout(() => {
      
      if (currentSessionRef.current !== closingSessionId) {
        setIsClosing(false);
        return;
      }
      
      setIsVisible(false);
      setIsClosing(false);
      setSearchValue('');
      onClose(closingSessionId);
    }, 180);

    return () => clearTimeout(timer);
  }, [onClose, menuState.type, isVisible, isClosing]);

  useImperativeHandle(ref, () => ({
    close: handleClose,
    getElement: () => menuRef.current
  }), [handleClose]);

  useEffect(() => {
    if (!isVisible || isClosing) return;

    const handleClickOutside = (event) => {
      const isClickOnRefList = refList?.some(r => r && typeof r.contains === 'function' && r.contains(event.target));
      if (menuRef.current && !menuRef.current.contains(event.target) && !isClickOnRefList) {
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
  }, [isVisible, isClosing, handleClose, menuState.type, refList]);

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

  if (!isVisible) return null;

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const filteredColumns = columns.filter((column) => {
    if(selectedItems.some(item => item.key === column.key)) return false;
    return column.label.toLowerCase().includes(searchValue.toLowerCase());
  });

  const getColumnIcon = (column) => {
    return COLUMN_ICONS[column?.type ?? 'text'];
  };

  const getSearchPlaceholder = () => {
    return menuState.type === 'sort' ? 'Ordenar por...' : 'Filtrar por...';
  };

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
    <>
      <div 
        ref={menuRef} 
        className={`${styles.columnSelectionMenu} ${isClosing ? styles.closing : ''}`} 
        style={menuStyle}
      >
        <div className={styles.columnSelectionMenu__header}>
          <div className={styles.columnSelectionMenu__searchWrapper}>
            <input
              type="text"
              className={styles.columnSelectionMenu__search}
              placeholder={getSearchPlaceholder()}
              value={searchValue}
              onChange={handleSearchChange}
              autoFocus
              title="Busque colunas pelo nome"
            />
            <i className={`far fa-magnifying-glass ${styles.columnSelectionMenu__searchIcon}`} />
          </div>
        </div>

        <div className={styles.columnSelectionMenu__body}>
          {filteredColumns.length === 0 ? (
            <div className={styles.columnSelectionMenu__empty}>
              <i className={`far fa-inbox ${styles.columnSelectionMenu__empty__icon}`} />
              <span className={styles.columnSelectionMenu__empty__text}>
                Nenhuma coluna disponível
              </span>
            </div>
          ) : (
            filteredColumns.map((column) => {
              return (
                <div key={column.key} className={styles.columnSelectionMenu__item} onClick={() => onSelect(column)}>
                  <i className={`${getColumnIcon(column)} ${styles.columnSelectionMenu__item__icon}`} />
                  <span className={styles.columnSelectionMenu__item__label}>{column.label}</span>
                </div>
              );
            })
          )}
        </div>
        {menuState.type === 'filter-selection' && (
          <div className={styles.columnSelectionMenu__footer}>
            <button
              type="button"
              className={styles.columnSelectionMenu__footer__button}
              onClick={onAddAdvancedFilter}
              title="Abre o editor de filtros avançados com múltiplas regras"
            >
              <i className={`far fa-plus ${styles.columnSelectionMenu__footer__button__icon}`} />
              <span className={styles.columnSelectionMenu__footer__button__label}>Adicionar Filtro Avançado</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}));

ColumnSelectionMenu.displayName = 'ColumnSelectionMenu';
