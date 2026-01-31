import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import styles from '../Tabela.module.css';

export const SettingsMenu = memo(forwardRef(({ 
  menuState,
  onClose,
  refList
}, ref) => {
  const menuRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const currentSessionRef = useRef(null);
  const menuStateSessionRef = useRef(null);

  const [selectedOptions, setSelectedOptions] = useState({
    colunasVisiveis: false,
    agrupar: false,
    calcular: false,
    importar: false,
    exportar: false
  });

  useEffect(() => {
    menuStateSessionRef.current = menuState.sessionId;
    
    if (menuState.isOpen) {
      currentSessionRef.current = menuState.sessionId;
      setIsVisible(true);
      setIsClosing(false);
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
      onClose(closingSessionId);
    }, 180);

    return () => clearTimeout(timer);
  }, [onClose, isVisible, isClosing]);

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
  }, [isVisible, isClosing, handleClose, refList]);

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

  const handleOptionToggle = (optionKey) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionKey]: !prev[optionKey]
    }));
  };

  if (!isVisible) return null;

  const menuStyle = {
    position: 'absolute',
    top: `${menuState.position.top}px`,
    left: `${menuState.position.left}px`,
    zIndex: 1000
  };

  const options = [
    { key: 'colunasVisiveis', label: 'Colunas Visíveis', icon: 'far fa-eye' },
    { key: 'agrupar', label: 'Agrupar', icon: 'far fa-layer-group' },
    { key: 'calcular', label: 'Calcular', icon: 'far fa-calculator' },
    { key: 'importar', label: 'Importar', icon: 'far fa-file-import' },
    { key: 'exportar', label: 'Exportar', icon: 'far fa-file-export' }
  ];

  return (
    <>
      <div 
        ref={menuRef} 
        className={`${styles.columnSelectionMenu} ${isClosing ? styles.closing : ''}`} 
        style={menuStyle}
      >
        <div className={styles.columnSelectionMenu__header}>
          <span className={styles.columnSelectionMenu__header__title}>Configurações</span>
        </div>

        <div className={styles.columnSelectionMenu__body}>
          {options.map((option) => {
            return (
              <div 
                key={option.key} 
                className={`${styles.columnSelectionMenu__item} ${selectedOptions[option.key] ? styles.selected : ''}`}
                onClick={() => handleOptionToggle(option.key)}
              >
                <i className={`${option.icon} ${styles.columnSelectionMenu__item__icon}`} />
                <span className={styles.columnSelectionMenu__item__label}>{option.label}</span>
                {selectedOptions[option.key] && (
                  <i className={`far fa-check ${styles.columnSelectionMenu__item__check}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}));

SettingsMenu.displayName = 'SettingsMenu';
