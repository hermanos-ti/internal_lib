import React, { useMemo, useState, useCallback } from 'react';
import styles from './Container.module.css';
import { Tabela } from '../Tabela/Tabela';

export const Container = ({
  // Props principais da Tabela
  tabelaId,
  columns,
  data,
  footer,
  options,

  // Controle de ID base da linha
  primaryKey = 'id',

  // Navegação e callbacks
  navigate,
  detailPath,
  onOpenDetail,

  // Segunda view (cadastro/detalhe)
  children,
}) => {
  const [view, setView] = useState('list');
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleBackToList = useCallback(() => {
    setView('list');
  }, []);

  const handleTableClick = useCallback(
    (event) => {
      const { row } = event || {};
      if (!row) return;

      const idKey = primaryKey || 'id';
      const id = row[idKey];

      setSelectedRow(row);
      setSelectedId(id);
      setView('detail');

      if (navigate && detailPath) {
        navigate(detailPath, { state: { id, row } });
      }

      if (typeof onOpenDetail === 'function') {
        onOpenDetail({ id, row, event });
      }
    },
    [detailPath, navigate, onOpenDetail, primaryKey],
  );

  const mergedOptions = useMemo(() => {
    const originalOnClick = options?.onClick;

    const wrappedOnClick = (event) => {
      if (typeof originalOnClick === 'function') {
        originalOnClick(event);
      }
      handleTableClick(event);
    };

    return {
      ...options,
      onClick: wrappedOnClick,
    };
  }, [handleTableClick, options]);

  const renderDetailView = () => {
    if (typeof children !== 'function') {
      return null;
    }

    return children({
      id: selectedId,
      row: selectedRow,
      backToList: handleBackToList,
    });
  };

  if (view === 'detail') {
    return (
      <div className={styles.container}>
        {renderDetailView()}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Tabela
        id={tabelaId}
        columns={columns}
        data={data}
        footer={footer}
        options={mergedOptions}
      />
    </div>
  );
};
