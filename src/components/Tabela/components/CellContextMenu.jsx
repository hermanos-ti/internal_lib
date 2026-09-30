import { useEffect, useRef } from 'react';
import styles from '../Tabela.module.css';

export function CellContextMenu({ position, actions = [], onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handlePointer = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      onClose?.();
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const handleScroll = () => onClose?.();

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handlePointer);
    }, 0);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  if (!actions.length) return null;

  const menuStyle = {
    position: 'absolute',
    left: `${position?.left ?? 0}px`,
    ...(position?.verticalAnchor === 'bottom' && position?.bottom != null
      ? { bottom: `${position.bottom}px` }
      : { top: `${position?.top ?? 0}px` }
    ),
    zIndex: 1100,
  };

  return (
    <div
      ref={menuRef}
      className={styles.cellContextMenu}
      style={menuStyle}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={styles.cellContextMenu__item}
          role="menuitem"
          onClick={() => action.onSelect?.()}
        >
          {action.icon && <i className={`${action.icon} ${styles.cellContextMenu__item__icon}`} />}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
