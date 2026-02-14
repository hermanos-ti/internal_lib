import { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS } from '../constants';
import { CALCULATION_OPTIONS, getUniqueColumnValues } from '../calculationUtils';

const CATEGORY_IDS = ['common', 'count', 'percentage', 'number', 'date'];
const CATEGORY_LABELS = {
  common: 'Nenhum',
  count: 'Contar',
  percentage: 'Porcentagem',
  number: 'Números',
  date: 'Datas',
};
const OPTIONS_BY_CATEGORY = {
  common: ['none'],
  count: ['countAll', 'countValues', 'countUnique', 'countEmpty', 'countNonEmpty'],
  percentage: ['pctEmpty', 'pctNonEmpty'],
  number: ['sum', 'average', 'median', 'min', 'max', 'range'],
  date: ['dateEarliest', 'dateLatest', 'dateRange'],
};

function getCategoriesForColumnType(columnType) {
  const list = ['common', 'count', 'percentage'];
  if (columnType === 'number') list.push('number');
  if (columnType === 'date') list.push('date');
  if (columnType === 'select') {
    // pctByGroup is shown as an option under percentage
  }
  return list;
}

function getOptionIdsForCategory(categoryId, columnType) {
  const base = OPTIONS_BY_CATEGORY[categoryId] ?? [];
  if (categoryId === 'percentage' && columnType === 'select') {
    return [...base, 'pctByGroup'];
  }
  return base;
}

const MENU_WIDTH = 280;

export const CalculationModal = memo(({
  headerColumns = [],
  calculationByColumn = {},
  onApplyCalculation,
  dataForCalculation = [],
  initialColumnKey = null,
  onClose,
  embedded = true,
  menuState = null,
}) => {
  const menuRef = useRef(null);
  const [view, setView] = useState(initialColumnKey ? 'categories' : 'columns');
  const [selectedColumnKey, setSelectedColumnKey] = useState(initialColumnKey ?? null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const selectedColumn = useMemo(() => {
    return headerColumns.find((c) => c.key === selectedColumnKey) ?? null;
  }, [headerColumns, selectedColumnKey]);

  const columnType = selectedColumn?.type ?? 'text';
  const columnConfig = selectedColumnKey != null ? calculationByColumn[selectedColumnKey] : null;
  const selectedCalculationId = columnConfig?.calculationId ?? 'none';
  const selectedGroupValue = columnConfig?.groupValue;

  useEffect(() => {
    if (selectedColumnKey != null && !headerColumns.some((c) => c.key === selectedColumnKey)) {
      setSelectedColumnKey(null);
      setView('columns');
    }
  }, [headerColumns, selectedColumnKey]);

  // Click-outside handler (only for non-embedded / footer popover)
  useEffect(() => {
    if (embedded || !onClose) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [embedded, onClose]);

  // Escape key handler
  useEffect(() => {
    if (embedded) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (view === 'options' || view === 'groupValues') {
          handleBack();
        } else if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [embedded, onClose, view]);

  const categories = useMemo(() => getCategoriesForColumnType(columnType), [columnType]);

  const optionIdsForCategory = useMemo(
    () => (selectedCategory ? getOptionIdsForCategory(selectedCategory, columnType) : []),
    [selectedCategory, columnType]
  );

  const uniqueValuesForSelect = useMemo(() => {
    if (columnType !== 'select' || !selectedColumnKey || !dataForCalculation.length) return [];
    return getUniqueColumnValues(dataForCalculation, selectedColumnKey);
  }, [columnType, selectedColumnKey, dataForCalculation]);

  const hasCalculation = (columnKey) => {
    const config = calculationByColumn[columnKey];
    return config?.calculationId && config.calculationId !== 'none' && (config.calculationId !== 'pctByGroup' || config.groupValue !== undefined);
  };

  const handleColumnClick = (columnKey) => {
    setSelectedColumnKey(columnKey);
    setView('categories');
  };

  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'common') {
      if (selectedColumnKey != null) {
        onApplyCalculation(selectedColumnKey, null);
      }
      if (onClose) onClose();
      else setView('columns');
      return;
    }
    setSelectedCategory(categoryId);
    setView('options');
  };

  const handleOptionClick = (calculationId) => {
    if (calculationId === 'pctByGroup') {
      setView('groupValues');
      return;
    }
    if (selectedColumnKey == null) return;
    if (calculationId === 'none') {
      onApplyCalculation(selectedColumnKey, null);
    } else {
      onApplyCalculation(selectedColumnKey, { calculationId, groupValue: undefined });
    }
    if (onClose) onClose();
    else setView('categories');
  };

  const handleGroupValueClick = (groupValue) => {
    if (selectedColumnKey == null) return;
    onApplyCalculation(selectedColumnKey, { calculationId: 'pctByGroup', groupValue });
    if (onClose) onClose();
    else setView('options');
  };

  const handleBack = useCallback(() => {
    if (view === 'categories') {
      if (!embedded) {
        if (onClose) onClose();
        return;
      }
      setView('columns');
      setSelectedColumnKey(null);
    } else if (view === 'options') {
      setView('categories');
      setSelectedCategory(null);
    } else if (view === 'groupValues') {
      setView('options');
    }
  }, [view, embedded, onClose]);

  const getHeaderTitle = () => {
    if (view === 'categories') return 'Selecionar cálculo';
    if (view === 'options') return CATEGORY_LABELS[selectedCategory] ?? selectedCategory;
    if (view === 'groupValues') return 'Porcentagem por grupo';
    return null;
  };

  // Show back only on deeper views; the initial view (columns or categories when from footer) uses click-outside to close
  const showBackInHeader = (() => {
    if (view === 'options' || view === 'groupValues') return true;
    if (view === 'categories' && embedded) return true; // embedded: back from categories to columns
    return false;
  })();

  const menuStyle = useMemo(() => {
    if (embedded || !menuState?.position) return undefined;
    const p = menuState.position;

    // Clamp left so the menu doesn't overflow the portal container
    let left = p.left ?? 0;
    if (menuRef.current) {
      const container = menuRef.current.offsetParent;
      if (container) {
        const containerWidth = container.clientWidth || container.offsetWidth;
        if (left + MENU_WIDTH > containerWidth) {
          left = Math.max(0, containerWidth - MENU_WIDTH);
        }
      }
    }

    const style = {
      position: 'absolute',
      left: `${left}px`,
      ...(p.verticalAnchor === 'bottom' && p.bottom != null
        ? { bottom: `${p.bottom}px`, top: undefined }
        : { top: `${p.top ?? 0}px` }
      ),
      zIndex: 1000,
    };
    return style;
  }, [embedded, menuState?.position]);

  // After mount, re-check and clamp left position if needed
  useEffect(() => {
    if (embedded || !menuRef.current) return;
    const el = menuRef.current;
    const container = el.offsetParent;
    if (!container) return;
    const containerWidth = container.clientWidth || container.offsetWidth;
    const currentLeft = parseFloat(el.style.left) || 0;
    if (currentLeft + MENU_WIDTH > containerWidth) {
      el.style.left = `${Math.max(0, containerWidth - MENU_WIDTH)}px`;
    }
  }, [embedded, menuState?.position]);

  const renderContent = () => (
    <>
      {showBackInHeader && (
        <div className={styles.columnSelectionMenu__header}>
          <div className={styles.settingsMenu__headerRow}>
              <button
                type="button"
                className={styles.settingsMenu__backBtn}
                onClick={handleBack}
                aria-label="Voltar"
              >
                <i className="far fa-arrow-left" />
                <span>Voltar</span>
              </button>
              <span className={styles.columnSelectionMenu__header__title}>{getHeaderTitle()}</span>
          </div>
        </div>
      )}
      <div className={styles.columnSelectionMenu__body}>
        {view === 'columns' && (
          <div className={styles.visibleColumnsModal__list}>
            {(headerColumns || []).map((column) => {
              const icon = COLUMN_ICONS[column?.type ?? 'text'];
              const withCalc = hasCalculation(column.key);
              const isSelected = calculationByColumn[column.key]?.calculationId && calculationByColumn[column.key].calculationId !== 'none';
              return (
                <button
                  key={column.key}
                  type="button"
                  className={styles.calculationModal__item}
                  title={withCalc ? `Coluna "${column.label ?? column.key}" tem cálculo.` : `Calcular usando a coluna "${column.label ?? column.key}".`}
                  onClick={() => handleColumnClick(column.key)}
                >
                  <i className={`${icon} ${styles.visibleColumnsModal__itemIcon}`} />
                  <span className={styles.visibleColumnsModal__itemLabel}>
                    {column.label ?? column.key}
                  </span>
                  {isSelected && <i className={`far fa-check ${styles.calculationModal__itemCheck}`} aria-hidden />}
                </button>
              );
            })}
            {(!headerColumns || headerColumns.length === 0) && (
              <div className={styles.visibleColumnsModal__empty}>Nenhuma coluna disponível.</div>
            )}
          </div>
        )}

        {view === 'categories' && (
          <div className={styles.visibleColumnsModal__list}>
            {categories.map((catId) => {
              const label = CATEGORY_LABELS[catId];
              const isNone = catId === 'common';
              const optCategory = CALCULATION_OPTIONS[selectedCalculationId]?.category;
              const isSelected = isNone
                ? selectedCalculationId === 'none'
                : (optCategory === catId || (catId === 'percentage' && optCategory === 'selectGroup'));
              return (
                <button
                  key={catId}
                  type="button"
                  className={`${styles.calculationModal__item} ${isSelected ? styles.calculationModal__itemSelected : ''}`}
                  title={isNone ? 'Não exibir cálculo para esta coluna.' : `Categoria: ${label}`}
                  onClick={() => handleCategoryClick(catId)}
                >
                  <span className={styles.visibleColumnsModal__itemLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {view === 'options' && (
          <div className={styles.visibleColumnsModal__list}>
            {optionIdsForCategory.map((optId) => {
              const opt = CALCULATION_OPTIONS[optId];
              if (!opt) return null;
              const isSelected = optId === 'pctByGroup' ? selectedCalculationId === 'pctByGroup' : selectedCalculationId === optId;
              return (
                <button
                  key={optId}
                  type="button"
                  className={styles.calculationModal__item}
                  title={opt.tooltip}
                  onClick={() => handleOptionClick(optId)}
                >
                  <i className={`far fa-calculator ${styles.visibleColumnsModal__itemIcon}`} />
                  <span className={styles.visibleColumnsModal__itemLabel}>{opt.label}</span>
                  {isSelected && <i className={`far fa-check ${styles.calculationModal__itemCheck}`} aria-hidden />}
                </button>
              );
            })}
          </div>
        )}

        {view === 'groupValues' && (
          <div className={styles.visibleColumnsModal__list}>
            {uniqueValuesForSelect.map((val) => {
              const displayVal = val == null || val === '' ? '(vazio)' : String(val);
              const isChecked = selectedGroupValue !== undefined && String(selectedGroupValue) === String(val);
              return (
                <button
                  key={displayVal}
                  type="button"
                  className={styles.calculationModal__item}
                  title={`Ver porcentagem de "${displayVal}" em relação ao total.`}
                  onClick={() => handleGroupValueClick(val)}
                >
                  <i className={`far fa-percent ${styles.visibleColumnsModal__itemIcon}`} />
                  <span className={styles.visibleColumnsModal__itemLabel}>{displayVal}</span>
                  {isChecked && <i className={`far fa-check ${styles.calculationModal__itemCheck}`} aria-hidden />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  if (embedded) {
    return <div className={styles.visibleColumnsModal__body}>{renderContent()}</div>;
  }

  return (
    <div ref={menuRef} className={styles.columnSelectionMenu} style={menuStyle}>
      {renderContent()}
    </div>
  );
});

CalculationModal.displayName = 'CalculationModal';
