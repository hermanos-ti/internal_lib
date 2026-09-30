import { useEffect, useRef } from 'react';
import styles from '../Tabela.module.css';

const VARIANTS = new Set(['primary', 'secondary', 'tertiary', 'danger']);

export function ActionsMenu({ position, actions = [], onClose, ignoreRef }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handlePointer = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      if (ignoreRef?.current?.contains(event.target)) return;
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
  }, [onClose, ignoreRef]);

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
      className={styles.actionsMenu}
      style={menuStyle}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      {actions.map((action) => {
        const variant = VARIANTS.has(action.variant) ? action.variant : 'secondary';
        return (
          <button
            key={action.key ?? action.label}
            type="button"
            className={`${styles.actionsMenu__item} ${styles[`actionsMenu__item_${variant}`]}`}
            role="menuitem"
            disabled={Boolean(action.disabled)}
            onClick={() => action.onSelect?.()}
          >
            {action.icon && <i className={`${action.icon} ${styles.actionsMenu__item__icon}`} />}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
