import styles from './Pagination.module.css';
import { useMemo, useState } from 'react';

export const Pagination = ({
  totalPages,
  currentPage,
  onPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  itemsPerPage,
  onItemsPerPageChange
}) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages || totalPages === 0;

  const handleFirstPage = () => {
    if (!isFirstPage && onPageChange) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (!isFirstPage && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (!isLastPage && onPageChange) {
      onPageChange(totalPages);
    }
  };

  const handleItemsPerPageChange = (e) => {
    if (onItemsPerPageChange) {
      const newValue = parseInt(e.target.value, 10);
      onItemsPerPageChange(newValue);
    }
  };

  const [goToPageValue, setGoToPageValue] = useState('');

  const handleGoToPageBlur = (e) => {
    const inputValue = e.target.value.trim();
    
    if (!inputValue) {
      setGoToPageValue('');
      return;
    }

    const pageNumber = parseInt(inputValue, 10);
    
    // Validação: deve ser um número válido entre 1 e totalPages
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      // Resetar para página atual se inválido
      setGoToPageValue('');
      return;
    }

    // Navegar para a página se for diferente da atual
    if (pageNumber !== currentPage && onPageChange) {
      onPageChange(pageNumber);
    }
    
    // Limpar o input após navegação
    setGoToPageValue('');
  };

  const handleGoToPageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleGoToPageChange = (e) => {
    const value = e.target.value;
    // Permitir apenas números
    if (value === '' || /^\d+$/.test(value)) {
      setGoToPageValue(value);
    }
  };

  const pageInfo = useMemo(() => {
    if (totalPages === 0) {
      return '0 de 0';
    }
    return `${currentPage} de ${totalPages}`;
  }, [currentPage, totalPages]);

  return (
    <div className={`${styles.pagination}`}>
      <div className={styles.pagination__controls}>
        <button
          className={`${styles.pagination__button} ${styles.pagination__button__first}`}
          onClick={handleFirstPage}
          disabled={isFirstPage}
          aria-label="Primeira página"
        >
          <i className="fas fa-angle-double-left"></i>
        </button>
        
        <button
          className={`${styles.pagination__button} ${styles.pagination__button__prev}`}
          onClick={handlePreviousPage}
          disabled={isFirstPage}
          aria-label="Página anterior"
        >
          <i className="fas fa-angle-left"></i>
        </button>

        <span className={styles.pagination__info}>{pageInfo}</span>

        <button
          className={`${styles.pagination__button} ${styles.pagination__button__next}`}
          onClick={handleNextPage}
          disabled={isLastPage}
          aria-label="Próxima página"
        >
          <i className="fas fa-angle-right"></i>
        </button>

        <button
          className={`${styles.pagination__button} ${styles.pagination__button__last}`}
          onClick={handleLastPage}
          disabled={isLastPage}
          aria-label="Última página"
        >
          <i className="fas fa-angle-double-right"></i>
        </button>
      </div>

      
      <div className={styles.pagination__goToPage}>
        <label className={styles.pagination__goToPage__label} htmlFor="goToPageInput">
          Ir para:
        </label>
        <input
          id="goToPageInput"
          type="text"
          className={styles.pagination__goToPage__input}
          value={goToPageValue}
          onChange={handleGoToPageChange}
          onBlur={handleGoToPageBlur}
          onKeyDown={handleGoToPageKeyDown}
          placeholder={currentPage.toString()}
          aria-label="Ir para página"
          maxLength={totalPages > 0 ? totalPages.toString().length : 10}
          disabled={totalPages === 0}
        />
      </div>

      {itemsPerPage !== undefined && onItemsPerPageChange && (
        <div className={styles.pagination__itemsPerPage}>
          <label className={styles.pagination__itemsPerPage__label}>
            Itens por página:
          </label>
          <select
            className={styles.pagination__itemsPerPage__select}
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            aria-label="Itens por página"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

