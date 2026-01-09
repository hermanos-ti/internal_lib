import styles from './Tag.module.css';
import React from 'react';

export const Tag = (props) => {
  const {
    variant = 'neutral', // 'brand' | 'neutral' | 'success' | 'warning' | 'danger'
    appearance = 'filled', // 'accent' | 'filled' | 'outlined' | 'filled-outlined'
    size = 'medium', // 'small' | 'medium' | 'large'
    pill = false, // true | false
    removable = false, // true | false
    onClick,
    onRemove,
    children,
    // Props de customização de cores
    backgroundColor,
    textColor,
    borderColor,
    className = '',
  } = props;

  // Estilos inline para customização
  const customStyles = {};
  if (backgroundColor) customStyles['--tag-bg'] = backgroundColor;
  if (textColor) customStyles['--tag-color'] = textColor;
  if (borderColor) customStyles['--tag-border'] = borderColor;

  const hasCustomColors = backgroundColor || textColor || borderColor;

  const tagClasses = [
    styles.tag,
    styles[variant],
    styles[appearance],
    styles[size],
    pill ? styles.pill : '',
    hasCustomColors ? styles.custom : '',
    onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.(e);
  };

  return (
    <span 
      className={tagClasses} 
      style={hasCustomColors ? customStyles : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
    >
      <span className={styles.content}>{children}</span>
      {removable && (
        <button 
          type="button"
          className={styles.remove} 
          onClick={handleRemove}
          aria-label="Remover tag"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            className={styles.removeIcon}
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </span>
  );
};
