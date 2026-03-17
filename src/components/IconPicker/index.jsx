import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import icons from './icons.json';
import { useIconPickerDropdown } from './useIconPickerDropdown';
import styles from './styles.module.css';

const COLUMNS = 6;
const ICONS_PER_PAGE = 36;

/** Diagonal wave order for 6x6 grid: cell index -> wave index (0-35) for animation delay */
const DIAGONAL_WAVE_ORDER = (() => {
  const order = [];
  for (let d = 0; d <= 10; d++) {
    for (let row = 0; row <= Math.min(d, 5); row++) {
      const col = d - row;
      if (col <= 5) order.push(row * COLUMNS + col);
    }
  }
  const waveOrder = new Array(36);
  order.forEach((gridIndex, waveIndex) => {
    waveOrder[gridIndex] = waveIndex;
  });
  return waveOrder;
})();

export function IconPicker({
  open = false,
  onClose,
  anchorRef,
  value = '',
  onChange,
}) {
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { position, positionReady } = useIconPickerDropdown({
    triggerRef: anchorRef,
    isOpen: open,
    portalContainer: document.body,
  });

  const filteredIcons = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return icons;
    return icons.filter((icon) => icon.toLowerCase().includes(term));
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filteredIcons.length / ICONS_PER_PAGE));
  const pageStart = (currentPage - 1) * ICONS_PER_PAGE;
  const pageIcons = useMemo(
    () => filteredIcons.slice(pageStart, pageStart + ICONS_PER_PAGE),
    [filteredIcons, pageStart]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleClose = useCallback(() => {
    setFilter('');
    setCurrentPage(1);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      const inPopover = popoverRef.current?.contains(e.target);
      if (!inPopover) handleClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleClose]);

  useEffect(() => {
    if (open && positionReady) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, positionReady]);

  const handleSelect = useCallback(
    (iconClass, e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      onChange?.(iconClass);
      handleClose();
    },
    [onChange, handleClose]
  );

  const handlePrevPage = () => {
    setCurrentPage((p) => (p <= 1 ? totalPages : p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => (p >= totalPages ? 1 : p + 1));
  };

  if (!open) return null;

  const portalTheme =
    anchorRef?.current?.closest?.('[data-theme]')?.getAttribute?.('data-theme') ?? 'light';

  const popoverContent =
    positionReady && (
      <div
        ref={popoverRef}
        className={styles.popover}
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: 320,
          maxHeight: 400,
        }}
        role="dialog"
        aria-label="Selecionar ícone"
      >
        <div className={styles.filter}>
          <input
            ref={searchInputRef}
            type="text"
            className={styles.filterInput}
            placeholder="Pesquisar ícone..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Pesquisar ícone"
          />
        </div>
        <div
          className={styles.grid}
          role="listbox"
        >
          {pageIcons.length === 0 ? (
            <div className={styles.empty}>Nenhum ícone encontrado</div>
          ) : (
            pageIcons.map((iconClass, gridIndex) => {
              const waveIndex = DIAGONAL_WAVE_ORDER[gridIndex] ?? gridIndex;
              return (
                <button
                  key={iconClass}
                  type="button"
                  className={`${styles.gridItem} ${value === iconClass ? styles.gridItemSelected : ''}`}
                  style={{ '--wave-index': waveIndex }}
                  onClick={(e) => handleSelect(iconClass, e)}
                  role="option"
                  aria-selected={value === iconClass}
                  title={iconClass}
                >
                  <i className={iconClass} aria-hidden />
                </button>
              );
            })
          )}
        </div>
        <div className={styles.footer}>
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={handlePrevPage}
              aria-label="Página anterior"
            >
              <i className="fa-light fa-angle-left" aria-hidden />
            </button>
            <span className={styles.pageInfo}>
              {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={handleNextPage}
              aria-label="Próxima página"
            >
              <i className="fa-light fa-angle-right" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    );

  return popoverContent
    ? createPortal(
        <div data-theme={portalTheme} style={{ display: 'contents' }}>
          {popoverContent}
        </div>,
        document.body
      )
    : null;
}

IconPicker.displayName = 'IconPicker';
