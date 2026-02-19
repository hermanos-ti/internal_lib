import styles from '../../Tabela.module.css';

export function KanbanView({ sortedData, headerStructure }) {
  return (
    <div className={styles.tabela__view__placeholder}>
      <div className={styles.tabela__view__placeholder__inner}>
        <i className={`fas fa-th-large ${styles.tabela__view__placeholder__icon}`} />
        <span className={styles.tabela__view__placeholder__title}>Visualização Kanban</span>
        <span className={styles.tabela__view__placeholder__subtitle}>Em breve</span>
      </div>
    </div>
  );
}
