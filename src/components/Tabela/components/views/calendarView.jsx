import styles from '../../Tabela.module.css';

export function CalendarView({ sortedData, headerStructure }) {
  return (
    <div className={styles.tabela__view__placeholder}>
      <div className={styles.tabela__view__placeholder__inner}>
        <i className={`fas fa-calendar-days ${styles.tabela__view__placeholder__icon}`} />
        <span className={styles.tabela__view__placeholder__title}>Visualização Calendário</span>
        <span className={styles.tabela__view__placeholder__subtitle}>Em breve</span>
      </div>
    </div>
  );
}
