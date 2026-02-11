import { memo, useRef, useState, useEffect, useCallback } from 'react';
import styles from '../Tabela.module.css';
import { VisibleColumnsPanel } from './VisibleColumnsPanel';

export const VisibleColumnsModal = memo(({
  menuState,
  onClose,
  headerColumns,
  footerItems,
  columnVisibility,
  footerVisibility,
  onApply,
  refList
}) => {
  const menuRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const currentSessionRef = useRef(null);

  useEffect(() => {
    if (menuState.isOpen) {
      currentSessionRef.current = menuState.sessionId;
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [menuState.isOpen, menuState.sessionId]);

  const handleClose = useCallback((closingSessionId = null) => {
    const sessionId = closingSessionId ?? currentSessionRef.current;
    setIsClosing(true);
    const timer = setTimeout(() => {
      if (currentSessionRef.current !== sessionId) {
        setIsClosing(false);
        return;
      }
      setIsVisible(false);
      setIsClosing(false);
      onClose(sessionId);
    }, 180);
    return () => clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    if (!isVisible || isClosing) return;
    const handleClickOutside = (event) => {
      const target = event.target;
      const isInsideModal = target?.closest?.('[data-visible-columns-modal]') || (menuRef.current && menuRef.current.contains(target));
      const isClickOnRefList = refList?.some(r => r && typeof r.contains === 'function' && r.contains(target));
      if (!isInsideModal && !isClickOnRefList) {
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

  if (!isVisible) return null;

  const menuStyle = {
    position: 'absolute',
    top: `${menuState.position.top}px`,
    left: `${menuState.position.left}px`,
    zIndex: 1001
  };

  return (
    <div
      ref={menuRef}
      data-visible-columns-modal
      className={`${styles.visibleColumnsModal} ${isClosing ? styles.closing : ''}`}
      style={menuStyle}
    >
      <div className={styles.visibleColumnsModal__header}>
        <span className={styles.visibleColumnsModal__header__title}>Colunas visíveis</span>
        <button
          type="button"
          className={styles.visibleColumnsModal__closeBtn}
          onClick={() => handleClose()}
          aria-label="Fechar"
        >
          <i className="far fa-xmark" />
        </button>
      </div>

      <VisibleColumnsPanel
        headerColumns={headerColumns}
        footerItems={footerItems}
        columnVisibility={columnVisibility}
        footerVisibility={footerVisibility}
        onApply={onApply}
      />

      <div className={styles.visibleColumnsModal__footer}>
        <button type="button" className={styles.visibleColumnsModal__footerBtn} onClick={() => handleClose()}>
          <i className="far fa-xmark" />
          Fechar
        </button>
      </div>
    </div>
  );
});

VisibleColumnsModal.displayName = 'VisibleColumnsModal';
