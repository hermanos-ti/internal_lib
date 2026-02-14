import { memo, useMemo, useState, useEffect } from 'react';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS } from '../constants';
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

export const CalculationPanel = memo(({
  headerColumns,
  calculationByColumn = {},
  onApplyCalculation,
  dataForCalculation = [],
}) => {
  const [selectedColumnKey, setSelectedColumnKey] = useState(null);

  const columnConfig = selectedColumnKey != null ? calculationByColumn[selectedColumnKey] : null;
  const selectedCalculationId = columnConfig?.calculationId ?? 'none';
  const selectedGroupValue = columnConfig?.groupValue;

  const selectedColumn = useMemo(() => {
    return headerColumns?.find((c) => c.key === selectedColumnKey) ?? null;
  }, [headerColumns, selectedColumnKey]);

  useEffect(() => {
    if (selectedColumnKey != null && !headerColumns?.some((c) => c.key === selectedColumnKey)) {
      setSelectedColumnKey(null);
    }
  }, [headerColumns, selectedColumnKey]);

  const columnType = selectedColumn?.type ?? 'text';
  const optionIds = useMemo(() => getOptionsForColumnType(columnType), [columnType]);

  const uniqueValuesForSelect = useMemo(() => {
    if (columnType !== 'select' || !selectedColumnKey || !dataForCalculation.length) return [];
    return getUniqueColumnValues(dataForCalculation, selectedColumnKey);
  }, [columnType, selectedColumnKey, dataForCalculation]);

  const handleColumnChange = (columnKey) => {
    setSelectedColumnKey(columnKey || null);
  };

  const handleCalculationChange = (calculationId, groupValue) => {
    if (selectedColumnKey == null) return;
    if (calculationId === 'none') {
      onApplyCalculation(selectedColumnKey, null);
      return;
    }
    onApplyCalculation(selectedColumnKey, {
      calculationId,
      groupValue: calculationId === 'pctByGroup' ? groupValue : undefined,
    });
  };

  const hasCalculation = (columnKey) => {
    const config = calculationByColumn[columnKey];
    return config?.calculationId && config.calculationId !== 'none' && (config.calculationId !== 'pctByGroup' || config.groupValue !== undefined);
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

  return (
    <div className={styles.visibleColumnsModal__body}>
      <div className={styles.visibleColumnsModal__section}>
        <div className={styles.visibleColumnsModal__sectionHeader}>
          <span className={styles.visibleColumnsModal__sectionLabel}>Coluna</span>
        </div>
        <div className={styles.visibleColumnsModal__list}>
          <label className={styles.visibleColumnsModal__item} title="Selecionar uma coluna para configurar o cálculo.">
            <input
              type="radio"
              name="calcColumn"
              checked={selectedColumnKey == null}
              onChange={() => handleColumnChange(null)}
            />
            <span className={styles.visibleColumnsModal__checkboxWrap}>
              <i className={`far fa-check ${styles.visibleColumnsModal__checkboxWrap__check}`} />
            </span>
            <i className={`far fa-calculator ${styles.visibleColumnsModal__itemIcon}`} />
            <span className={styles.visibleColumnsModal__itemLabel}>Nenhuma</span>
          </label>
          {(headerColumns || []).map((column) => {
            const icon = COLUMN_ICONS[column?.type ?? 'text'];
            const isChecked = selectedColumnKey === column.key;
            const withCalc = hasCalculation(column.key);
            return (
              <label
                key={column.key}
                className={styles.visibleColumnsModal__item}
                title={withCalc ? `Coluna "${column.label ?? column.key}" tem cálculo. Clique para alterar.` : `Calcular usando a coluna "${column.label ?? column.key}".`}
              >
                <input
                  type="radio"
                  name="calcColumn"
                  checked={isChecked}
                  onChange={() => handleColumnChange(column.key)}
                />
                <span className={styles.visibleColumnsModal__checkboxWrap}>
                  <i className={`far fa-check ${styles.visibleColumnsModal__checkboxWrap__check}`} />
                </span>
                <i className={`${icon} ${styles.visibleColumnsModal__itemIcon}`} />
                <span className={styles.visibleColumnsModal__itemLabel}>
                  {column.label ?? column.key}
                  {withCalc && <i className={`far fa-check ${styles.visibleColumnsModal__itemLabelBadge}`} aria-hidden />}
                </span>
              </label>
            );
          })}
        </div>
        {headerColumns?.length === 0 && (
          <div className={styles.visibleColumnsModal__empty}>Nenhuma coluna disponível.</div>
        )}
      </div>

      {selectedColumnKey && (
        <div className={styles.visibleColumnsModal__section}>
          <div className={styles.visibleColumnsModal__sectionHeader}>
            <span className={styles.visibleColumnsModal__sectionLabel}>Cálculo</span>
          </div>
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
                      name="calcType"
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
                        name="calcGroupValue"
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
      )}
    </div>
  );
});

CalculationPanel.displayName = 'CalculationPanel';
