import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS } from '../constants';
import { VisibleColumnsPanel } from './VisibleColumnsPanel';
import { FreezeColumnsPanel } from './FreezeColumnsPanel';
import { CalculationModal } from './CalculationModal';

const SUBVIEW_TITLES = {
  colunasVisiveis: 'Colunas visíveis',
  agrupar: 'Agrupar',
  congelar: 'Congelar',
  exportar: 'Exportar',
};

export const SettingsMenu = memo(forwardRef(({
  menuState,
  onClose,
  refList,
  onAction,
  headerColumns,
  footerItems,
  columnVisibility,
  footerVisibility,
  onApplyColumns,
  groupByColumnKey,
  onApplyGroupBy,
  calculationByColumn,
  onApplyCalculation,
  dataForCalculation,
  showSettingsOptions,
  additionalSettingsOptions = [],
  importConfig,
  onImportClick,
  onExport,
  freezeLeafColumns,
  frozenColumnKeys,
  onApplyFrozenColumns,
  freezeIsMobile = false,
  freezeWidthByKey = {},
  freezeContainerWidth = 0,
  freezeSelectionWidth = 0,
  freezeColumnMinWidth,
}, ref) => {
  const menuRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentView, setCurrentView] = useState('list');
  const [calcNav, setCalcNav] = useState({ title: 'Calcular', onBack: null, canGoBack: false });

  const currentSessionRef = useRef(null);
  const menuStateSessionRef = useRef(null);

  useEffect(() => {
    menuStateSessionRef.current = menuState.sessionId;

    if (menuState.isOpen) {
      currentSessionRef.current = menuState.sessionId;
      setIsVisible(true);
      setIsClosing(false);
      setCurrentView('list');
      setCalcNav({ title: 'Calcular', onBack: null, canGoBack: false });
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
      setCalcNav({ title: 'Calcular', onBack: null, canGoBack: false });
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

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setCalcNav({ title: 'Calcular', onBack: null, canGoBack: false });
  }, []);

  const handleBack = useCallback(() => {
    if (currentView === 'calcular' && calcNav.onBack) {
      calcNav.onBack();
      return;
    }
    handleBackToList();
  }, [currentView, calcNav, handleBackToList]);

  useEffect(() => {
    if (!isVisible || isClosing) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (currentView === 'calcular' && calcNav.onBack && calcNav.canGoBack) {
          calcNav.onBack();
        } else if (currentView !== 'list') {
          handleBackToList();
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, isClosing, handleClose, currentView, calcNav, handleBackToList]);

  const handleAction = (optionKey) => {
    if (optionKey === 'colunasVisiveis') {
      setCurrentView('colunasVisiveis');
    } else if (optionKey === 'agrupar') {
      setCurrentView('agrupar');
    } else if (optionKey === 'calcular') {
      setCurrentView('calcular');
    } else if (optionKey === 'congelar') {
      setCurrentView('congelar');
    } else if (optionKey === 'importar' && importConfig?.columns?.length && onImportClick) {
      onImportClick(currentSessionRef.current);
    } else if (optionKey === 'exportar' && onExport) {
      setCurrentView('exportar');
    } else {
      const additionalOption = additionalSettingsOptions.find(opt => opt.key === optionKey);
      if (additionalOption?.onClick) {
        additionalOption.onClick();
        handleClose();
      } else if (onAction) {
        onAction(optionKey);
      }
    }
  };

  const handleCalcNavigationChange = useCallback((nav) => {
    setCalcNav({
      title: nav.title,
      onBack: nav.onBack,
      canGoBack: nav.canGoBack,
    });
  }, []);

  if (!isVisible) return null;

  const menuStyle = {
    position: 'absolute',
    left: `${menuState.position.left}px`,
    ...(menuState.position.verticalAnchor === 'bottom' && menuState.position.bottom != null
      ? { bottom: `${menuState.position.bottom}px` }
      : { top: `${menuState.position.top}px` }
    ),
    zIndex: 1000
  };

  const options = [
    { key: 'colunasVisiveis', label: 'Colunas Visíveis', icon: 'far fa-eye' },
    { key: 'agrupar', label: 'Agrupar', icon: 'far fa-layer-group' },
    { key: 'calcular', label: 'Calcular', icon: 'far fa-calculator' },
    { key: 'congelar', label: 'Congelar', icon: 'far fa-thumbtack' },
    { key: 'importar', label: 'Importar', icon: 'far fa-file-import' },
    { key: 'exportar', label: 'Exportar', icon: 'far fa-file-export' }
  ];

  const filteredOptions = [
    ...options.filter((option) => showSettingsOptions.includes(option.key)),
    ...additionalSettingsOptions,
  ];

  const subViewTitle = currentView === 'calcular'
    ? calcNav.title
    : SUBVIEW_TITLES[currentView] ?? 'Configurações';

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
            {filteredOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={styles.columnSelectionMenu__item}
                title={option.tooltip || option.label}
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
              title="Voltar"
            >
              <i className="far fa-arrow-left" />
              Voltar
            </button>
            <span className={styles.columnSelectionMenu__header__title}>{subViewTitle}</span>
          </div>

          <div className={styles.columnSelectionMenu__body}>
            {currentView === 'colunasVisiveis' && headerColumns && footerItems && onApplyColumns && (
              <VisibleColumnsPanel
                headerColumns={headerColumns}
                footerItems={footerItems}
                columnVisibility={columnVisibility}
                footerVisibility={footerVisibility}
                onApply={onApplyColumns}
                embedded
              />
            )}
            {currentView === 'agrupar' && headerColumns && onApplyGroupBy && (
              <div className={styles.visibleColumnsModal__list}>
                <label className={styles.visibleColumnsModal__item}>
                  <input
                    type="radio"
                    name="groupBy"
                    checked={groupByColumnKey == null}
                    onChange={() => onApplyGroupBy(null)}
                  />
                  <span className={styles.visibleColumnsModal__checkboxWrap}>
                    <i className={`far ${groupByColumnKey == null ? 'fa-circle-dot' : 'fa-circle'}`} />
                  </span>
                  <i className={`far fa-layer-group ${styles.visibleColumnsModal__itemIcon}`} />
                  <span className={styles.visibleColumnsModal__itemLabel}>Não agrupar</span>
                </label>
                {headerColumns
                  .filter(col => col.groupable === true)
                  .map((column) => {
                    const icon = COLUMN_ICONS[column?.type ?? 'text'];
                    const isSelected = groupByColumnKey === column.key;
                    return (
                      <label key={column.key} className={styles.visibleColumnsModal__item}>
                        <input
                          type="radio"
                          name="groupBy"
                          checked={isSelected}
                          onChange={() => onApplyGroupBy(column.key)}
                        />
                        <span className={styles.visibleColumnsModal__checkboxWrap}>
                          <i className={`far ${isSelected ? 'fa-circle-dot' : 'fa-circle'}`} />
                        </span>
                        <i className={`${icon} ${styles.visibleColumnsModal__itemIcon}`} />
                        <span className={styles.visibleColumnsModal__itemLabel}>{column.label ?? column.key}</span>
                      </label>
                    );
                  })}
                {headerColumns.filter(col => col.groupable === true).length === 0 && (
                  <div className={styles.visibleColumnsModal__empty}>
                    Nenhuma coluna agrupável disponível.
                  </div>
                )}
              </div>
            )}
            {currentView === 'calcular' && headerColumns && onApplyCalculation && (
              <CalculationModal
                headerColumns={headerColumns}
                calculationByColumn={calculationByColumn ?? {}}
                onApplyCalculation={onApplyCalculation}
                dataForCalculation={dataForCalculation}
                embedded={true}
                onNavigationChange={handleCalcNavigationChange}
                onRequestExit={handleBackToList}
              />
            )}
            {currentView === 'congelar' && onApplyFrozenColumns && (
              <FreezeColumnsPanel
                leafColumns={freezeLeafColumns ?? []}
                frozenColumnKeys={frozenColumnKeys ?? []}
                onApply={onApplyFrozenColumns}
                isMobile={freezeIsMobile}
                widthByKey={freezeWidthByKey}
                containerWidth={freezeContainerWidth}
                selectionWidth={freezeSelectionWidth}
                columnMinWidth={freezeColumnMinWidth}
                embedded
              />
            )}
            {currentView === 'exportar' && onExport && (
              <div className={styles.visibleColumnsModal__list}>
                <button
                  type="button"
                  className={styles.columnSelectionMenu__item}
                  onClick={() => onExport('csv')}
                  title="Exportar dados visíveis para arquivo CSV"
                >
                  <i className={`far fa-file-csv ${styles.columnSelectionMenu__item__icon}`} />
                  <span className={styles.columnSelectionMenu__item__label}>CSV</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}));

SettingsMenu.displayName = 'SettingsMenu';
