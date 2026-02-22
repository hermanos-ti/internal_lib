import React, { forwardRef } from 'react';
import styles from '../Input.module.css';

export const ColorInput = forwardRef(({ value = '#000000', onChange, id, disabled, className, ...rest }, ref) => {
  const hex = value || '#000000';
  return (
    <label
      htmlFor={id}
      className={`${styles.input__colorWrapper} ${disabled ? styles.input__colorDisabled : ''} ${className || ''}`}
    >
      <input
        ref={ref}
        type="color"
        id={id}
        value={hex}
        onChange={onChange}
        disabled={disabled}
        className={styles.input__colorInput}
        aria-label="Selecionar cor"
        {...rest}
      />
      <span className={styles.input__colorPreview} style={{ backgroundColor: hex }} />
      <span className={styles.input__colorValue}>{hex}</span>
    </label>
  );
});

ColorInput.displayName = 'ColorInput';
