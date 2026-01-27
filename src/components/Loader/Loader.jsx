import styles from './Loader.module.css';

const SIZE_VARIANTS = {
  small: styles.loader__small,
  medium: styles.loader__medium,
  large: styles.loader__large,
};

export const Loader = ({ 
  loading = true, 
  size = 'medium', 
  color = 'primary',
  text = null,
  className = '' 
}) => {
  if (!loading) return null;

  const sizeClass = SIZE_VARIANTS[size] || SIZE_VARIANTS.medium;
  const colorClass = styles[`loader__${color}`] || styles.loader__primary;

  return (
    <div className={`${styles.loader} ${className}`}>
      <div className={`${styles.loader__spinner} ${sizeClass} ${colorClass}`}>
        <div className={styles.loader__spinner__ring}></div>
        <div className={styles.loader__spinner__ring}></div>
        <div className={styles.loader__spinner__ring}></div>
      </div>
      {text && (
        <div className={styles.loader__text}>{text}</div>
      )}
    </div>
  );
};

