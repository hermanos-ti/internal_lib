import { memo, useMemo } from 'react';
import styles from '../Tabela.module.css';
import { CALCULATION_OPTIONS, getUniqueColumnValues } from '../calculationUtils';

const COMMON_IDS = ['none', 'countAll', 'countValues', 'countUnique', 'countEmpty', 'countNonEmpty', 'pctEmpty', 'pctNonEmpty'];
const NUMBER_IDS = ['sum', 'average', 'median', 'min', 'max', 'range'];
const DATE_IDS = ['dateEarliest', 'dateLatest', 'dateRange'];
const SELECT_GROUP_ID = 'pctByGroup';

function getOptionsForColumnType(columnType) {
  const list = [...COMMON_IDS];
  if (columnType === 'number') list.push(...NUMBER_IDS);
  if (columnType === 'date') list.push(...DATE_IDS);
  if (columnType === 'select') list.push(SELECT_GROUP_ID);
  return list;
}

function getSectionLabel(opt) {
  if (opt.category === 'count') return 'Contar';
  if (opt.category === 'percentage') return 'Porcentagem';
  if (opt.category === 'number') return 'Números';
  if (opt.category === 'date') return 'Data';
  if (opt.category === 'selectGroup') return 'Porcentagem';
  return null;
}

export const CalculationSubmenu = memo(({
  column,
  calculationConfig,
  onApply,
  onClose,
  dataForCalculation = [],
  menuState,
}) => {
  const selectedCalculationId = calculationConfig?.calculationId ?? 'none';
  const selectedGroupValue = calculationConfig?.groupValue;
  const columnType = column?.type ?? 'text';

  const optionIds = useMemo(() => getOptionsForColumnType(columnType), [columnType]);

  const uniqueValuesForSelect = useMemo(() => {
    if (columnType !== 'select' || !column?.key || !dataForCalculation.length) return [];
    return getUniqueColumnValues(dataForCalculation, column.key);
  }, [columnType, column?.key, dataForCalculation]);

  const handleCalculationChange = (calculationId, groupValue) => {
    if (calculationId === 'none') {
      onApply(null);
      return;
    }
    onApply({
      calculationId,
      groupValue: calculationId === 'pctByGroup' ? groupValue : undefined,
    });
  };

  const optionsBySection = useMemo(() => {
    const sections = new Map();
    optionIds.forEach((id) => {
      const opt = CALCULATION_OPTIONS[id];
      if (!opt) return;
      const section = getSectionLabel(opt) || 'Geral';
      if (!sections.has(section)) sections.set(section, []);
      sections.get(section).push(opt);
    });
    const order = ['Geral', 'Contar', 'Porcentagem', 'Números', 'Data'];
    return order.filter((s) => sections.has(s)).map((s) => ({ name: s, options: sections.get(s) }));
  }, [optionIds]);

  if (!column) return null;

  const menuStyle = {
    position: 'absolute',
    left: `${menuState.position?.left ?? 0}px`,
    top: `${menuState.position?.top ?? 0}px`,
    zIndex: 1000,
  };

  return (
    <div
      className={styles.columnSelectionMenu}
      style={menuStyle}
    >
      <div className={styles.columnSelectionMenu__header}>
        <span className={styles.columnSelectionMenu__header__title}>
          Calcular: {column.label ?? column.key}
        </span>
      </div>
      <div className={styles.columnSelectionMenu__body}>
        <div className={styles.visibleColumnsModal__list}>
          {optionsBySection.map(({ name, options }) => (
            <div key={name}>
              {options.length > 0 && name !== 'Geral' && (
                <div className={styles.visibleColumnsModal__sectionTitle}>{name}</div>
              )}
              {options.map((opt) => (
                <label
                  key={opt.id}
                  className={styles.visibleColumnsModal__item}
                  title={opt.tooltip}
                >
                  <input
                    type="radio"
                    name="calcTypeSub"
                    checked={
                      opt.id === 'pctByGroup'
                        ? selectedCalculationId === 'pctByGroup'
                        : selectedCalculationId === opt.id
                    }
                    onChange={() => handleCalculationChange(opt.id)}
                  />
                  <span className={styles.visibleColumnsModal__checkboxWrap}>
                    <i className={`far fa-check ${styles.visibleColumnsModal__checkboxWrap__check}`} />
                  </span>
                  <i className={`far fa-calculator ${styles.visibleColumnsModal__itemIcon}`} />
                  <span className={styles.visibleColumnsModal__itemLabel}>{opt.label}</span>
                </label>
              ))}
            </div>
          ))}
          {selectedCalculationId === 'pctByGroup' && uniqueValuesForSelect.length > 0 && (
            <>
              <div className={styles.visibleColumnsModal__sectionTitle}>Valor do grupo</div>
              {uniqueValuesForSelect.map((val) => {
                const displayVal = val == null || val === '' ? '(vazio)' : String(val);
                const isChecked = selectedGroupValue !== undefined && String(selectedGroupValue) === String(val);
                return (
                  <label
                    key={displayVal}
                    className={styles.visibleColumnsModal__item}
                    title={`Ver porcentagem de "${displayVal}" em relação ao total de linhas.`}
                  >
                    <input
                      type="radio"
                      name="calcGroupValueSub"
                      checked={isChecked}
                      onChange={() => handleCalculationChange('pctByGroup', val)}
                    />
                    <span className={styles.visibleColumnsModal__checkboxWrap}>
                      <i className={`far fa-check ${styles.visibleColumnsModal__checkboxWrap__check}`} />
                    </span>
                    <i className={`far fa-percent ${styles.visibleColumnsModal__itemIcon}`} />
                    <span className={styles.visibleColumnsModal__itemLabel}>{displayVal}</span>
                  </label>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

CalculationSubmenu.displayName = 'CalculationSubmenu';
