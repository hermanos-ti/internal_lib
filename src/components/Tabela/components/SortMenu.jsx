import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS } from '../constants';

export const SortMenu = memo(forwardRef(({ 
  menuState,
  sortItems,
  columns,
  onClose, 
  onUpdateSorts,
  onOpenColumnSelection,
  onClearSorts,
  refList,
  getExtraRefs
}, ref) => {
  const menuRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [localSortItems, setLocalSortItems] = useState([]);
  
  const currentSessionRef = useRef(null);
  const menuStateSessionRef = useRef(null);
  const prevSessionRef = useRef(null);

  useEffect(() => {
    menuStateSessionRef.current = menuState.sessionId;
    
    if (menuState.isOpen && menuState.type === 'sort-menu') {
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
      
      if (isNewSession) {
        prevSessionRef.current = menuState.sessionId;
        setLocalSortItems([...sortItems]);
      }
    }
  }, [menuState.isOpen, menuState.sessionId, menuState.type, sortItems]);

  const closeTimerRef = useRef(null);
  const isClosingRef = useRef(false);

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
      setDraggedIndex(null);
      setDragOverIndex(null);
      onClose(closingSessionId);
    }, 180);
  }, [onClose]);

  useImperativeHandle(ref, () => ({
    close: handleClose,
    updateItems: (items) => setLocalSortItems([...items]),
    getElement: () => menuRef.current
  }), [handleClose]);

  useEffect(() => {
    if (!isVisible || isClosing) return;

    const handleClickOutside = (event) => {
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

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...localSortItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    
    setLocalSortItems(newItems);
    onUpdateSorts(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, localSortItems, onUpdateSorts]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleToggleDirection = useCallback((index) => {
    const newItems = [...localSortItems];
    newItems[index] = {
      ...newItems[index],
      direction: newItems[index].direction === 'asc' ? 'desc' : 'asc'
    };
    setLocalSortItems(newItems);
    onUpdateSorts(newItems);
  }, [localSortItems, onUpdateSorts]);

  const handleRemoveItem = useCallback((index) => {
    const newItems = localSortItems.filter((_, i) => i !== index);
    setLocalSortItems(newItems);
    onUpdateSorts(newItems);
  }, [localSortItems, onUpdateSorts]);

  const handleClearAll = useCallback(() => {
    setLocalSortItems([]);
    onClearSorts();
  }, [onClearSorts]);

  const getColumnIcon = useCallback((column) => {
    return COLUMN_ICONS[column?.type ?? 'text'];
  }, []);

  const getColumnByKey = useCallback((key) => {
    return columns.find(col => col.key === key);
  }, [columns]);

  if (!isVisible || menuState.type !== 'sort-menu') return null;

  const menuStyle = {
    position: 'absolute',
    top: `${menuState.position.top}px`,
    left: `${menuState.position.left}px`,
    zIndex: 1000
  };

  return (
    <div 
      ref={menuRef} 
      className={`${styles.sortMenu} ${isClosing ? styles.closing : ''}`} 
      style={menuStyle}
    >
      <div className={styles.sortMenu__body}>
        {localSortItems.length === 0 ? (
          <div className={styles.sortMenu__empty}>
            <i className={`far fa-arrow-down-arrow-up ${styles.sortMenu__empty__icon}`} />
            <span className={styles.sortMenu__empty__text}>
              Nenhuma ordenação definida
            </span>
          </div>
        ) : (
          localSortItems.map((item, index) => {
            const column = getColumnByKey(item.key);
            return (
              <div 
                key={item.key} 
                className={`${styles.sortMenu__item} ${draggedIndex === index ? styles.dragging : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className={styles.sortMenu__item__dragHandle}>
                  <i className={`fas fa-grip-dots-vertical ${styles.sortMenu__item__dragHandle__icon}`} />
                </div>
                
                <button 
                  className={styles.sortMenu__item__columnSelect}
                  onClick={(e) => onOpenColumnSelection(item, index, e.currentTarget)}
                >
                  <i className={`${getColumnIcon(column)} ${styles.sortMenu__item__columnSelect__icon}`} />
                  <span className={styles.sortMenu__item__columnSelect__label}>{item.label}</span>
                  <i className={`far fa-chevron-down ${styles.sortMenu__item__columnSelect__chevron}`} />
                </button>
                
                <button 
                  className={`${styles.sortMenu__item__directionToggle} ${item.direction === 'asc' ? styles.asc : styles.desc}`}
                  onClick={() => handleToggleDirection(index)}
                  title={item.direction === 'asc' ? 'Crescente' : 'Decrescente'}
                >
                  <i className={`far ${item.direction === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'} ${styles.sortMenu__item__directionToggle__icon}`} />
                </button>
                
                <button 
                  className={styles.sortMenu__item__removeBtn}
                  onClick={() => handleRemoveItem(index)}
                  title="Remover"
                >
                  <i className={`far fa-xmark ${styles.sortMenu__item__removeBtn__icon}`} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.sortMenu__footer}>
        <button 
          className={`${styles.sortMenu__footer__button} ${styles.primary}`}
          onClick={(e) => onOpenColumnSelection(null, -1, e.currentTarget)}
        >
          <i className={`far fa-plus ${styles.sortMenu__footer__button__icon}`} />
          <span className={styles.sortMenu__footer__button__label}>Adicionar Coluna</span>
        </button>
        
        {localSortItems.length > 0 && (
          <button 
            className={`${styles.sortMenu__footer__button} ${styles.danger}`}
            onClick={handleClearAll}
          >
            <i className={`far fa-trash ${styles.sortMenu__footer__button__icon}`} />
            <span className={styles.sortMenu__footer__button__label}>Remover Ordenação</span>
          </button>
        )}
      </div>
    </div>
  );
}));

SortMenu.displayName = 'SortMenu';
