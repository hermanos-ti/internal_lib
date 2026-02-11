import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import styles from '../Tabela.module.css';
import { VisibleColumnsPanel } from './VisibleColumnsPanel';

export const SettingsMenu = memo(forwardRef(({
  menuState,
  onClose,
  refList,
  onAction,
  headerColumns,
  footerItems,
  columnVisibility,
  footerVisibility,
  onApplyColumns
}, ref) => {
  const menuRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentView, setCurrentView] = useState('list');

  const currentSessionRef = useRef(null);
  const menuStateSessionRef = useRef(null);

  useEffect(() => {
    menuStateSessionRef.current = menuState.sessionId;

    if (menuState.isOpen) {
      currentSessionRef.current = menuState.sessionId;
      setIsVisible(true);
      setIsClosing(false);
      setCurrentView('list');
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
      setCurrentView('list');
      onClose(closingSessionId);
    }, 180);

    return () => clearTimeout(timer);
  }, [onClose]);

  useImperativeHandle(ref, () => ({
    close: handleClose,
    getElement: () => menuRef.current
  }), [handleClose]);

  useEffect(() => {
    if (!isVisible || isClosing) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      const isClickOnRefList = refList?.some(r => r && typeof r.contains === 'function' && r.contains(target));
      if (menuRef.current && !menuRef.current.contains(target) && !isClickOnRefList) {
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
        if (currentView !== 'list') {
          setCurrentView('list');
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, isClosing, handleClose, currentView]);

  const handleAction = (optionKey) => {
    if (optionKey === 'colunasVisiveis') {
      setCurrentView('colunasVisiveis');
    } else if (onAction) {
      onAction(optionKey);
    }
  };

  const handleBack = () => {
    setCurrentView('list');
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
    <div
      ref={menuRef}
      className={`${styles.columnSelectionMenu} ${isClosing ? styles.closing : ''}`}
      style={menuStyle}
    >
      {currentView === 'list' ? (
        <>
          <div className={styles.columnSelectionMenu__header}>
            <span className={styles.columnSelectionMenu__header__title}>Configurações</span>
          </div>

          <div className={styles.columnSelectionMenu__body}>
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                className={styles.columnSelectionMenu__item}
                onClick={() => handleAction(option.key)}
              >
                <i className={`${option.icon} ${styles.columnSelectionMenu__item__icon}`} />
                <span className={styles.columnSelectionMenu__item__label}>{option.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={`${styles.columnSelectionMenu__header} ${styles.settingsMenu__headerRow}`}>
            <button
              type="button"
              className={styles.settingsMenu__backBtn}
              onClick={handleBack}
              aria-label="Voltar"
            >
              <i className="far fa-arrow-left" />
              <span>Voltar</span>
            </button>
            <span className={styles.columnSelectionMenu__header__title}>
              {currentView === 'colunasVisiveis' ? 'Colunas visíveis' : 'Configurações'}
            </span>
          </div>

          <div className={styles.columnSelectionMenu__body}>
            {currentView === 'colunasVisiveis' && headerColumns && footerItems && onApplyColumns && (
              <VisibleColumnsPanel
                headerColumns={headerColumns}
                footerItems={footerItems}
                columnVisibility={columnVisibility}
                footerVisibility={footerVisibility}
                onApply={onApplyColumns}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}));

SettingsMenu.displayName = 'SettingsMenu';
