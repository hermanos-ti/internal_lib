import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styles from '../Tabela.module.css';
import { TableCell } from './TableCell';
import { EditableCell } from './EditableCell';
import { Pagination } from '../../Pagination/Pagination';
import { parseCSVFile, runValidation, sortImportData } from '../importUtils';

const FORMAT_LABELS = {
  text: 'Texto',
  money: 'Moeda',
  number: 'Número',
  integer: 'Inteiro',
  date: 'Data',
  datetime: 'Data e hora',
  percentage: 'Porcentagem',
};

const EXAMPLE_BY_TYPE = {
  text: ['Exemplo 1', 'Exemplo 2', 'Exemplo 3'],
  money: ['1500.00', '2999.99', '0.50'],
  number: ['42.5', '100.0', '3.14'],
  integer: ['42', '100', '18'],
  date: ['2024-01-15', '2024-06-20', '2023-12-31'],
  datetime: ['2024-01-15 10:30', '2024-06-20 14:00', '2023-12-31 23:59'],
  percentage: ['15.5', '100', '0.25'],
};

const IMPORT_CONFIG_EXAMPLE = `options={{
  importConfig: {
    columns: [
      { key: 'nome', label: 'Nome', format: 'text', obrigatorio: true,
        validator: (v) => v?.trim() ? true : 'Obrigatório' },
      { key: 'idade', label: 'Idade', format: 'integer', obrigatorio: false,
        validator: (v) => (v === '' || v == null) ? true : 
          (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 150) },
    ]
  },
  onImportComplete: (data) => setData(data)
}}`;

export const ImportModal = memo(({
  isOpen,
  onClose,
  importConfig,
  onImportComplete,
  portalContainer = document.body,
}) => {
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState('instructions');
  const [csvData, setCsvData] = useState([]);
  const [rowStatuses, setRowStatuses] = useState(() => new Map());
  const [editingCell, setEditingCell] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [editedRowIndices, setEditedRowIndices] = useState(() => new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [previewViewFilter, setPreviewViewFilter] = useState('all');
  const [previewFilterOpen, setPreviewFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const columns = importConfig?.columns ?? [];

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setStep('instructions');
      setCsvData([]);
      setRowStatuses(new Map());
      setEditingCell(null);
      setParseError(null);
      setEditedRowIndices(new Set());
      setSearchTerm('');
      setPreviewViewFilter('all');
      setSortBy(null);
      setCurrentPage(1);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setStep('instructions');
      setCsvData([]);
      onClose?.();
    }, 180);
    return () => clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    if (!isVisible || isClosing) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (editingCell) {
          setEditingCell(null);
        } else if (previewFilterOpen) {
          setPreviewFilterOpen(false);
        } else if (step === 'preview') {
          setStep('instructions');
          setCsvData([]);
          setRowStatuses(new Map());
        } else {
          handleClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, isClosing, handleClose, step, editingCell, previewFilterOpen]);

  useEffect(() => {
    if (!isVisible || isClosing) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        if (!editingCell) {
          setPreviewFilterOpen(false);
          handleClose();
        }
      } else if (previewFilterOpen && filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setPreviewFilterOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, isClosing, handleClose, editingCell, previewFilterOpen]);

  const runAllValidations = useCallback((data) => {
    const next = new Map();
    data.forEach((row, idx) => {
      const key = `__row_${idx}`;
      const result = runValidation(row, columns);
      next.set(key, { status: result.status, columns: result.columns });
    });
    return next;
  }, [columns]);

  useEffect(() => {
    if (csvData.length > 0 && columns.length > 0) {
      setRowStatuses(runAllValidations(csvData));
    }
  }, [csvData, columns, runAllValidations]);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target?.files?.[0];
    if (!file || !importConfig?.columns?.length) return;
    setParseError(null);
    const { data, error } = await parseCSVFile(file, importConfig.columns);
    if (error) {
      setParseError(error);
      return;
    }
    setCsvData(data);
    setStep('preview');
    setCurrentPage(1);
    e.target.value = '';
  }, [importConfig?.columns]);

  const handleCellClick = useCallback((rowIndex, colKey) => {
    setEditingCell({ rowIndex, colKey });
  }, []);

  const handleCellCommit = useCallback((row, colKey, newValue) => {
    setEditingCell(null);
    const idx = csvData.findIndex((r) => r === row);
    if (idx >= 0) {
      setEditedRowIndices((prev) => new Set(prev).add(idx));
    }
    setCsvData((prev) => {
      const next = [...prev];
      const i = prev.findIndex((r) => r === row);
      if (i < 0) return prev;
      next[i] = { ...row, [colKey]: newValue };
      return next;
    });
  }, [csvData]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleFinalize = useCallback(() => {
    const allSuccess = csvData.every((_, idx) => {
      const status = rowStatuses.get(`__row_${idx}`);
      return status?.status === 'success';
    });
    if (allSuccess && onImportComplete) {
      onImportComplete(csvData);
      handleClose();
    }
  }, [csvData, rowStatuses, onImportComplete, handleClose]);

  const allValid = csvData.length > 0 && csvData.every((_, idx) => {
    const status = rowStatuses.get(`__row_${idx}`);
    return status?.status === 'success';
  });

  const tableColumns = useMemo(() => columns.map((col) => ({
    ...col,
    editable: true,
    format: col.format ?? 'text',
  })), [columns]);

  const exampleCsvLines = useMemo(() => {
    const delimiter = '|';
    const headers = columns.map((c) => c.key).join(delimiter);
    const getSample = (col, rowIndex) => {
      const type = col.format ?? 'text';
      const examples = EXAMPLE_BY_TYPE[type] ?? EXAMPLE_BY_TYPE.text;
      return examples[rowIndex % examples.length];
    };
    const rows = [0, 1, 2].map((rowIndex) =>
      columns.map((c) => getSample(c, rowIndex)).join(delimiter)
    );
    return [headers, ...rows].join('\n');
  }, [columns]);

  const filteredAndSortedData = useMemo(() => {
    let result = csvData.map((row, idx) => ({ row, idx }));

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(({ row }) =>
        columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(term))
      );
    }

    if (previewViewFilter !== 'all') {
      if (previewViewFilter === 'edited') {
        result = result.filter(({ idx }) => editedRowIndices.has(idx));
      } else {
        result = result.filter(({ idx }) => {
          const status = rowStatuses.get(`__row_${idx}`);
          return status?.status === previewViewFilter;
        });
      }
    }

    const rows = result.map(({ row }) => row);
    const sorted = sortBy ? sortImportData(rows, sortBy, columns) : rows;
    return sorted.map((row) => ({ row, idx: csvData.findIndex((x) => x === row) }));
  }, [csvData, searchTerm, previewViewFilter, editedRowIndices, rowStatuses, sortBy, columns]);

  const totalFiltered = filteredAndSortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const handleSort = useCallback((colKey) => {
    setSortBy((prev) => {
      if (prev?.key === colKey) {
        return prev.direction === 'asc' ? { key: colKey, direction: 'desc' } : null;
      }
      return { key: colKey, direction: 'asc' };
    });
    setCurrentPage(1);
  }, []);

  const previewFilterLabel = {
    all: 'Todas',
    edited: 'Editadas',
    success: 'Sucesso',
    warning: 'Alerta',
    error: 'Erro',
  }[previewViewFilter];

  const hasStatus = {
    success: [...rowStatuses.values()].some((s) => s.status === 'success'),
    warning: [...rowStatuses.values()].some((s) => s.status === 'warning'),
    error: [...rowStatuses.values()].some((s) => s.status === 'error'),
  };

  if (!isVisible) return null;

  const modalContent = (
    <div
      ref={modalRef}
      data-import-modal
      className={`${styles.importModal} ${isClosing ? styles.importModal_closing : ''}`}
    >
      <div className={styles.importModal__header}>
        <span className={styles.importModal__title}>
          {step === 'instructions' ? 'Importar dados' : 'Pré-visualização da importação'}
        </span>
        <button
          type="button"
          className={styles.importModal__closeBtn}
          onClick={handleClose}
          aria-label="Fechar"
        >
          <i className="far fa-xmark" />
        </button>
      </div>

      <div className={styles.importModal__body}>
        {step === 'instructions' && (
          <>
            <p className={styles.importModal__description}>
              O arquivo CSV deve conter as colunas na primeira linha, separadas por pipe (|).
              Use aspas duplas para valores que contenham pipe.
            </p>

            <div className={styles.importModal__layoutSection}>
              <div className={styles.importModal__layoutSection__title}>Layout esperado</div>
              <div className={styles.importModal__layoutList}>
                <div className={styles.importModal__layoutListHeader}>
                  <span>Label</span>
                  <span>key</span>
                  <span>type</span>
                  <span>obrigatorio</span>
                </div>
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={styles.importModal__layoutListRow}
                  >
                    <span>{col.label ?? col.key}</span>
                    <span><code>{col.key}</code></span>
                    <span>{FORMAT_LABELS[col.format] ?? col.format ?? 'text'}</span>
                    <span>
                      {col.obrigatorio ? (
                        <span className={styles.importModal__layoutListRow__badge}>sim</span>
                      ) : (
                        'não'
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.importModal__exampleSection}>
              <div className={styles.importModal__exampleSection__title}>Exemplo de CSV</div>
              <pre className={styles.importModal__exampleCode}>
                <code>{exampleCsvLines}</code>
              </pre>
            </div>

            {parseError && (
              <div className={styles.importModal__error}>{parseError}</div>
            )}

            <label className={styles.importModal__fileLabel}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className={styles.importModal__fileInput}
              />
              <i className="far fa-file-csv" />
              <span>Selecionar arquivo CSV</span>
            </label>
          </>
        )}

        {step === 'preview' && (
          <>
            <p className={styles.importModal__description}>
              Revise os dados. Corrija erros (vermelho) e avisos (amarelo) antes de finalizar.
              Clique em uma célula para editar.
            </p>

            <div className={styles.importModal__previewToolbar}>
              <div className={styles.importModal__previewToolbar__search}>
                <i className="far fa-magnifying-glass" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.importModal__previewToolbar__searchInput}
                />
              </div>
              <div ref={filterDropdownRef} className={styles.importModal__previewToolbar__filter}>
                <button
                  type="button"
                  className={styles.importModal__previewToolbar__filterBtn}
                  onClick={() => setPreviewFilterOpen((o) => !o)}
                >
                  <i className="far fa-eye" />
                  <span>{previewFilterLabel}</span>
                  <i className={`far fa-chevron-${previewFilterOpen ? 'up' : 'down'}`} />
                </button>
                {previewFilterOpen && (
                  <div className={styles.importModal__previewToolbar__dropdown}>
                    <button
                      className={previewViewFilter === 'all' ? styles.importModal__previewToolbar__dropdownActive : ''}
                      onClick={() => { setPreviewViewFilter('all'); setPreviewFilterOpen(false); setCurrentPage(1); }}
                    >
                      Todas
                    </button>
                    <button
                      className={previewViewFilter === 'edited' ? styles.importModal__previewToolbar__dropdownActive : ''}
                      onClick={() => { setPreviewViewFilter('edited'); setPreviewFilterOpen(false); setCurrentPage(1); }}
                    >
                      Editadas
                    </button>
                    {hasStatus.success && (
                      <button
                        className={previewViewFilter === 'success' ? styles.importModal__previewToolbar__dropdownActive : ''}
                        onClick={() => { setPreviewViewFilter('success'); setPreviewFilterOpen(false); setCurrentPage(1); }}
                      >
                        <span className={styles.importModal__statusDot__success} />
                        Sucesso
                      </button>
                    )}
                    {hasStatus.warning && (
                      <button
                        className={previewViewFilter === 'warning' ? styles.importModal__previewToolbar__dropdownActive : ''}
                        onClick={() => { setPreviewViewFilter('warning'); setPreviewFilterOpen(false); setCurrentPage(1); }}
                      >
                        <span className={styles.importModal__statusDot__warning} />
                        Alerta
                      </button>
                    )}
                    {hasStatus.error && (
                      <button
                        className={previewViewFilter === 'error' ? styles.importModal__previewToolbar__dropdownActive : ''}
                        onClick={() => { setPreviewViewFilter('error'); setPreviewFilterOpen(false); setCurrentPage(1); }}
                      >
                        <span className={styles.importModal__statusDot__error} />
                        Erro
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.importModal__previewWrapper}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    {tableColumns.map((col) => (
                      <th
                        key={col.key}
                        className={`${styles.tabela__header__cell} ${styles.importModal__sortableHeader}`}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label ?? col.key}
                        {sortBy?.key === col.key && (
                          <i className={`far fa-arrow-${sortBy.direction === 'asc' ? 'up' : 'down'}`} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(({ row, idx }) => {
                    const rowKey = `__row_${idx}`;
                    const status = rowStatuses.get(rowKey);
                    return (
                      <tr key={rowKey} className={styles.tabela__body__row}>
                        {tableColumns.map((col, colIndex) => {
                          const cellValue = row[col.key];
                          const cellStatus = status?.columns?.[col.key] ?? null;
                          const isEditing =
                            editingCell?.rowIndex === idx &&
                            editingCell?.colKey === col.key;
                          const colWithEditable = { ...col, editable: true };

                          if (isEditing) {
                            return (
                              <EditableCell
                                key={col.key}
                                cellValue={cellValue}
                                row={row}
                                column={colWithEditable}
                                rowIndex={idx}
                                colIndex={colIndex}
                                onCommit={handleCellCommit}
                                onCancel={handleCellCancel}
                                onNavigate={() => {}}
                              />
                            );
                          }

                          return (
                            <TableCell
                              key={col.key}
                              cellValue={cellValue}
                              row={row}
                              column={colWithEditable}
                              rowIndex={idx}
                              colIndex={colIndex}
                              hasColumnRender={false}
                              isEditable={true}
                              cellStatus={cellStatus}
                              onCellClickWithDbl={(e) => {
                                e.stopPropagation?.();
                                handleCellClick(idx, col.key);
                              }}
                            />
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalFiltered > 0 && (
              <div className={styles.importModal__pagination}>
                <Pagination
                  totalPages={totalPages}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(v) => {
                    setItemsPerPage(v);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[10, 25, 50, 100]}
                />
              </div>
            )}

            <div className={styles.importModal__footer}>
              <button
                type="button"
                className={styles.importModal__backBtn}
                onClick={() => {
                  setStep('instructions');
                  setCsvData([]);
                  setRowStatuses(new Map());
                  setEditedRowIndices(new Set());
                }}
              >
                <i className="far fa-arrow-left" />
                Voltar
              </button>
              <button
                type="button"
                className={styles.importModal__finalizeBtn}
                disabled={!allValid}
                onClick={handleFinalize}
              >
                <i className="far fa-check" />
                Finalizar importação
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const overlay = (
    <div
      className={`${styles.importModal__overlay} ${isClosing ? styles.importModal__overlay_closing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !editingCell) {
          setPreviewFilterOpen(false);
          handleClose();
        }
      }}
      onKeyDown={() => {}}
      role="presentation"
    >
      {modalContent}
    </div>
  );

  return createPortal(overlay, portalContainer);
});

ImportModal.displayName = 'ImportModal';
